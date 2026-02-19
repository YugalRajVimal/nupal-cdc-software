import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Ticket and TicketResponse interfaces match the ticket.schema.js definitions.
 */
interface TicketResponse {
  respondedBy: string;          // email or name of the admin responder
  responseText: string;
  respondedAt: string;
}

interface RaisedByUser {
  id: string;
  name: string;
  email: string;
  therapistId?: string;
  therapistProfileId?: string;
  patientId?: string;
  childrenIds?: string[];
  childrenProfileIds?: string[];
}

interface Ticket {
  _id: string;
  subject: string;
  description: string;
  status: "pending" | "in-progress" | "resolved" | "closed";
  priority: "high" | "medium" | "low";
  tags?: string[];
  createdAt: string;
  raisedByRole?: string;
  raisedByName?: string;
  raisedBy?: RaisedByUser;
  responses?: TicketResponse[]; // Array of responses
}

/** API base url environment. */
const apiUrl = import.meta.env.VITE_API_URL || "";

// Utility colors for status and priority, matching possible schema values.
const STATUS_COLORS: Record<Ticket["status"], string> = {
  closed: "#22c55e",
  resolved: "#22c55e",
  pending: "#eab308",
  "in-progress": "#0ea5e9",
};

const PRIORITY_COLORS: Record<Ticket["priority"], string> = {
  high: "#dc2626",
  medium: "#f59e42",
  low: "#2563eb",
};

function getStatusColor(status: Ticket["status"]) {
  return STATUS_COLORS[status] || "#0891b2";
}
function getPriorityColor(priority: Ticket["priority"]) {
  return PRIORITY_COLORS[priority] || "#475569";
}

// Helpers to render Name & ID Links for Therapist/Parent with multiple children IDs
function RaisedByCell({ user, raisedByRole }: { user?: RaisedByUser; raisedByRole?: string }) {
  if (!user) return <>-</>;
  const showTherapistLink = !!user.therapistId;
  const showPatientLink = !!user.patientId;
  const showChildrenLinks = Array.isArray(user.childrenIds) && user.childrenIds.length > 0;
  return (
    <span>
      <b>{user.name}</b> <br />
      <span style={{ color: "#555", fontSize: 13 }}>
        {raisedByRole ? `${raisedByRole}` : null}
        {user.email ? <> <br />{user.email}</> : null}
        {showTherapistLink && (
          <>
            <br />
            TherapistId:{" "}
            <a
              href={
                user.therapistProfileId
                  ? `/admin/therapists?therapistId=${encodeURIComponent(user.therapistProfileId)}`
                  : "#"
              }
              style={{ color: "#2563eb", textDecoration: "underline", wordBreak: "break-all" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {user.therapistId}
            </a>
          </>
        )}
        {showPatientLink && (
          <>
            <br />
            PatientId:{" "}
            <a
              href={`/admin/children?patientId=${encodeURIComponent(user.id!)}`}
              style={{ color: "#2563eb", textDecoration: "underline", wordBreak: "break-all" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {user.patientId}
            </a>
          </>
        )}
        {showChildrenLinks && user.childrenProfileIds && user.childrenIds && user.childrenProfileIds.length === user.childrenIds.length && (
          <>
            <br />
            ChildrenIds:{" "}
            {user.childrenIds!.map((childId, idx) => {
              const profileId = user.childrenProfileIds?.[idx];
              return (
                <span key={childId}>
                  <a
                    href={
                      profileId !== undefined
                        ? `/admin/children?patientId=${encodeURIComponent(profileId)}`
                        : "#"
                    }
                    style={{ color: "#2563eb", textDecoration: "underline", wordBreak: "break-all" }}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {childId}
                  </a>
                  {idx !== user.childrenIds!.length - 1 ? ', ' : ''}
                </span>
              );
            })}
          </>
        )}
      </span>
    </span>
  );
}

// ----- Main Page Component -----
const RaisedTickets: React.FC = () => {
  // State for list and pagination
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Modal Single Ticket state
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [viewTicket, setViewTicket] = useState<Ticket | null>(null);

  // Status and response
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [responseLoading, setResponseLoading] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);

  // Fetch paginated tickets
  useEffect(() => {
    fetchTickets(page, pageSize);
    // eslint-disable-next-line
  }, [page, pageSize]);

  // Get tickets list (see tickets.controller.js: getTicketsAdmin)
  const fetchTickets = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${apiUrl}/api/admin/tickets?page=${page}&limit=${limit}`
      );
      setTickets(res.data.tickets || []);
      setTotalCount(res.data.totalCount || 0);
      console.log(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  // Get single ticket (see tickets.controller.js: getTicketByIdAdmin)
  const fetchTicketById = async (id: string) => {
    setTicketModalOpen(true);
    setViewTicket(null);
    setStatusUpdateError(null);
    setResponseError(null);
    setStatusUpdateLoading(false);
    setResponseLoading(false);
    try {
      const res = await axios.get(`${apiUrl}/api/admin/tickets/${id}`);
      setViewTicket(res.data);
    } catch (err: any) {
      setStatusUpdateError(err?.response?.data?.message || err?.message || "Failed to fetch ticket details");
      setViewTicket(null);
    }
  };

  // Patch status (see tickets.controller.js: updateTicketStatusAdmin)
  const handleChangeStatus = async (ticketId: string, status: string) => {
    setStatusUpdateLoading(true);
    setStatusUpdateError(null);
    try {
      await axios.patch(`${apiUrl}/api/admin/tickets/${ticketId}/status`, { status });
      await fetchTicketById(ticketId); // update modal
      fetchTickets(page, pageSize);    // update table
    } catch (err: any) {
      setStatusUpdateError(err?.response?.data?.message || err?.message || "Failed to update status");
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Respond to ticket (see tickets.controller.js: respondToTicketAdmin)
  const handleAddResponse = async () => {
    if (!responseText.trim() || !viewTicket) return;
    setResponseLoading(true);
    setResponseError(null);
    try {
      const token = localStorage.getItem("admin-token");
      await axios.post(
        `${apiUrl}/api/admin/tickets/${viewTicket._id}/respond`,
        {
          responseText: responseText.trim()
        },
        {
          headers: token ? { Authorization: `${token}` } : {},
        }
      );
      setResponseText('');
      await fetchTicketById(viewTicket._id);
      fetchTickets(page, pageSize);
    } catch (err: any) {
      setResponseError(err?.response?.data?.message || err?.message || "Failed to add response");
    } finally {
      setResponseLoading(false);
    }
  };

  // Helpers for displaying RaisedBy user details (legacy, unused)
//   function raisedByDisplay(raisedBy?: RaisedByUser, raisedByRole?: string) {
//     if (!raisedBy) return "-";
//     let details = raisedBy.name;
//     if (raisedByRole) details += ` (${raisedByRole})`;
//     if (raisedBy.email) details += `, Email: ${raisedBy.email}`;
//     if (raisedBy.therapistId)
//       details += `, TherapistId: ${raisedBy.therapistId}`;
//     if (raisedBy.patientId) details += `, PatientId: ${raisedBy.patientId}`;
//     if (raisedBy.childrenIds && raisedBy.childrenIds.length > 0)
//       details += `, ChildrenIds: ${raisedBy.childrenIds.join(", ")}`;
//     if (raisedBy.childrenProfileIds && raisedBy.childrenProfileIds.length > 0)
//       details += `, ChildrenProfileIds: ${raisedBy.childrenProfileIds.join(", ")}`;
//     return details;
//   }

  // Main rendering
  return (
    <div style={{ padding: "24px 12px", maxWidth: 1000, margin: "0 auto" }}>
      <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 20 }}>Raised Tickets</h2>
      {loading ? (
        <div>Loading tickets...</div>
      ) : error ? (
        <div style={{ color: "#e11d48", fontWeight: 500 }}>{error}</div>
      ) : (
        <div
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: "20px 10px 10px",
            boxShadow:
              "0 1.5px 8px 0 rgba(69, 105, 231, 0.04), 0 1.5px 6px 0 rgba(0,0,0,0.03)",
          }}
        >
          {tickets.length === 0 ? (
            <div style={{ margin: 32, textAlign: "center", color: "#888" }}>
              No tickets found.
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 15,
                marginBottom: 18,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f4f8fb",
                    color: "#222",
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: "10px 6px" }}>Subject</th>
                  <th style={{ padding: "10px 6px" }}>Status</th>
                  <th style={{ padding: "10px 6px" }}>Priority</th>
                  <th style={{ padding: "10px 6px" }}>Tags</th>
                  <th style={{ padding: "10px 6px" }}>Date Raised</th>
                  <th style={{ padding: "10px 6px" }}>Raised By</th>
                  <th style={{ padding: "10px 6px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    style={{
                      borderBottom: "1px solid #edf2f7",
                      transition: "background 0.1s",
                    }}
                  >
                    <td
                      style={{
                        padding: "9.5px 6px",
                        cursor: "pointer",
                        color: "#155ab6",
                        textDecoration: "underline"
                      }}
                      onClick={() => fetchTicketById(ticket._id)}
                    >
                      {ticket.subject}
                    </td>
                    <td style={{ padding: "9.5px 6px" }}>
                      <span
                        style={{
                          color: "#fff",
                          background: getStatusColor(ticket.status),
                          padding: "3.4px 10px",
                          borderRadius: 16,
                          fontSize: 14,
                          fontWeight: 500,
                          marginRight: 4,
                        }}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{ padding: "9.5px 6px" }}>
                      <span
                        style={{
                          color: "#fff",
                          background: getPriorityColor(ticket.priority),
                          padding: "3.2px 10px",
                          borderRadius: 16,
                          fontSize: 14,
                          fontWeight: 500,
                        }}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{ padding: "9.5px 6px" }}>
                      {ticket.tags && ticket.tags.length > 0
                        ? ticket.tags.join(", ")
                        : "-"}
                    </td>
                    <td style={{ padding: "9.5px 6px" }}>
                      {ticket.createdAt
                        ? new Date(ticket.createdAt).toLocaleString()
                        : ""}
                    </td>
                    <td style={{ padding: "9.5px 6px" }}>
                      <RaisedByCell user={ticket.raisedBy} raisedByRole={ticket.raisedByRole} />
                    </td>
                    <td style={{ padding: "9.5px 6px" }}>
                      <button
                        onClick={() => fetchTicketById(ticket._id)}
                        style={{
                          background: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: 5,
                          padding: "4.5px 13px",
                          fontWeight: 600,
                          fontSize: 14,
                          cursor: "pointer"
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(page) => setPage(page)}
          />
        </div>
      )}

      {/* Modal for viewing and managing a single ticket */}
      {ticketModalOpen && (
        <Modal open={ticketModalOpen} onClose={() => setTicketModalOpen(false)}>
          {viewTicket ? (
            <div style={{ padding: 8, minWidth: 380, maxWidth: 500 }}>
              <h3 style={{ fontSize: 21, fontWeight: 600, marginBottom: 2 }}>
                {viewTicket.subject}
              </h3>
              <div style={{ fontSize: 14, color: "#444", marginBottom: 8 }}>
                <span style={{
                  background: getPriorityColor(viewTicket.priority),
                  color: "#fff",
                  marginRight: 9,
                  borderRadius: 6,
                  padding: "2px 8px"
                }}>
                  {viewTicket.priority}
                </span>
                <span style={{
                  background: getStatusColor(viewTicket.status),
                  color: "#fff",
                  borderRadius: 6,
                  padding: "2px 8px"
                }}>
                  {viewTicket.status}
                </span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <span style={{ color: "#585", fontWeight: 500 }}>
                  Raised by:{" "}
                </span>
                <RaisedByCell user={viewTicket.raisedBy} raisedByRole={viewTicket.raisedByRole} />
              </div>
              <div style={{
                  background: "#f3f8fa",
                  borderRadius: 6,
                  padding: "8.5px 12px 7px",
                  marginBottom: 10,
                  fontSize: 15,
                  color: "#2c384c",
              }}>
                <span style={{ opacity: 0.7 }}><b>Description: </b></span>
                {viewTicket.description}
              </div>
              {viewTicket.tags && viewTicket.tags.length > 0 && (
                <div style={{ fontSize: 13, color: "#557", marginBottom: 7 }}>
                  <b>Tags:</b> {viewTicket.tags.join(", ")}
                </div>
              )}
              <div style={{ fontSize: 13, color: "#57607a", marginBottom: 13 }}>
                Raised at: {viewTicket.createdAt ? new Date(viewTicket.createdAt).toLocaleString() : ""}
              </div>
              {/* Change status select */}
              <div style={{ marginBottom: 14 }}>
                <b>Status: </b>
                <select
                  disabled={statusUpdateLoading}
                  value={viewTicket.status}
                  onChange={e => handleChangeStatus(viewTicket._id, e.target.value)}
                  style={{
                    fontSize: 14,
                    borderRadius: 5,
                    padding: "4px 10px",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                {statusUpdateLoading && <span style={{ marginLeft: 7, color: "#888" }}>Updating...</span>}
                {statusUpdateError && (
                  <div style={{ color: "#e11d48", fontSize: 14 }}>
                    {statusUpdateError}
                  </div>
                )}
              </div>
              {/* Ticket responses thread */}
              <div style={{ background: "#f8fafb", borderRadius: 8, padding: 7, marginBottom: 12 }}>
                <b>Responses:</b>
                <div style={{ marginTop: 5, marginLeft: 7 }}>
                  {viewTicket.responses && viewTicket.responses.length > 0 ? (
                    viewTicket.responses.map((response, idx) => (
                      <div
                        key={idx}
                        style={{
                          borderLeft: "3px solid #2563eb",
                          marginBottom: 10,
                          paddingLeft: 9,
                          fontSize: 15,
                        }}
                      >
                        <div style={{ color: "#444", marginBottom: 2 }}>
                          <b>Admin:</b>
                          <span style={{ color: "#738", fontWeight: 400, fontSize: 12, marginLeft: 6 }}>
                            {new Date(response.respondedAt).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ color: "#155ab6", fontWeight: 500 }}>
                          {response.responseText}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#888", fontSize: 14 }}>No responses yet.</div>
                  )}
                </div>
              </div>
              {/* Add new response */}
              <div style={{ marginTop: 12 }}>
                <b>Add Response:</b>
                <textarea
                  rows={3}
                  style={{
                    width: "100%",
                    borderRadius: 7,
                    border: "1.5px solid #e2e8f0",
                    padding: 7,
                    marginTop: 6,
                    resize: "vertical",
                  }}
                  value={responseText}
                  disabled={responseLoading}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Type your response to the ticket here..."
                />
                <button
                  style={{
                    marginTop: 6,
                    padding: "6px 17px",
                    borderRadius: 5,
                    background: "#2563eb",
                    color: "#fff",
                    border: 0,
                    fontWeight: 600,
                    cursor: responseLoading ? "progress" : "pointer",
                    fontSize: 15,
                  }}
                  disabled={responseLoading || !responseText.trim()}
                  onClick={handleAddResponse}
                >
                  {responseLoading ? "Sending..." : "Respond"}
                </button>
                {responseError && (
                  <div style={{ marginTop: 5, color: "#e11d48" }}>{responseError}</div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: 30, color: "#888" }}>
              {statusUpdateError ? statusUpdateError : "Loading..."}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

// -------- Pagination (common) ----------
const Pagination: React.FC<{
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (n: number) => void;
}> = ({ currentPage, pageSize, totalCount, onPageChange }) => {
  if (totalCount <= pageSize) return null;
  const totalPages = Math.ceil(totalCount / pageSize);
  const pages: number[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      pages.push(i);
    }
  }
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        marginTop: 18,
        justifyContent: "center",
        alignItems: "center",
        userSelect: "none",
      }}
    >
      <button
        disabled={currentPage === 1}
        style={{
          padding: "6px 12px",
          borderRadius: 5,
          background: currentPage === 1 ? "#f3f4f6" : "#e9eafe",
          border: 0,
          color: "#475569",
          fontWeight: 500,
          cursor: currentPage === 1 ? "not-allowed" : "pointer",
        }}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Prev
      </button>
      {pages.map((p, idx) => (
        <React.Fragment key={p}>
          {idx > 0 && p - pages[idx - 1] > 1 ? (
            <span style={{ margin: "0 4px", color: "#bbb" }}>…</span>
          ) : null}
          <button
            style={{
              padding: "6px 11.5px",
              margin: "0 1px",
              borderRadius: 5,
              border: 0,
              background: p === currentPage ? "#486bda" : "#f4f8fb",
              color: p === currentPage ? "#fff" : "#475569",
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
            }}
            onClick={() => onPageChange(p)}
            disabled={p === currentPage}
          >
            {p}
          </button>
        </React.Fragment>
      ))}
      <button
        disabled={currentPage === totalPages}
        style={{
          padding: "6px 12px",
          borderRadius: 5,
          background: currentPage === totalPages ? "#f3f4f6" : "#e9eafe",
          border: 0,
          color: "#475569",
          fontWeight: 500,
          cursor: currentPage === totalPages ? "not-allowed" : "pointer",
        }}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
};

// -------- Modal (minimal) ----------
const Modal: React.FC<{ open: boolean; onClose: () => void; children: React.ReactNode }> = ({
  open,
  onClose,
  children,
}) => {
  if (!open) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.22)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 9,
        minWidth: 320,
        maxWidth: 540,
        boxShadow: "0 2.5px 22px 0 rgba(69, 105, 231, 0.08), 0 1.5px 7px 0 rgba(0,0,0,0.07)",
        position: "relative"
      }}>
        <button
          onClick={onClose}
          style={{
            position: "absolute", right: 6, top: 6,
            background: "transparent", border: 0, fontSize: 22, color: "#496eff", cursor: "pointer",
            zIndex: 10
          }}
          aria-label="Close"
        >
          ×
        </button>
        <div style={{ padding: "16px 25px 16px 18px" }}>{children}</div>
      </div>
    </div>
  );
};

export default RaisedTickets;