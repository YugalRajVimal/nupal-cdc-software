import React, { useState, useEffect } from "react";
import axios from "axios";

// Ticket priorities as per backend schema enum
const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const initialFormState = {
  subject: "",
  description: "",
  priority: "medium",
  tags: "",
};

const apiUrl = import.meta.env.VITE_API_URL;

// Modal UI helper component (unchanged)
const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ open, onClose, title, children, style }) => {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        zIndex: 1000,
        top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          minWidth: 360,
          maxWidth: 560,
          width: "95%",
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 4px 28px #0002",
          padding: "30px 30px 22px 30px",
          position: "relative",
          ...style,
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute",
          top: 14, right: 16,
          fontSize: 23,
          color: "#999",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }} aria-label="Close">&times;</button>
        {title && <h2 style={{margin: 0, marginBottom: 8, fontWeight: 700, fontSize: 21}}>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

// --- Helper: MongoDB date/oid extraction ---
function getId(val: any) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.$oid) return val.$oid;
  return "";
}
function getDate(val: any) {
  if (!val) return "";
  if (typeof val === "string") return val;
  if (typeof val === "object" && val.$date) return val.$date;
  return "";
}

// Normalizer: Transforms backend ticket/response schema shape to flat usable app model
function normalizeTicket(raw: any) {
  // main ticket
  const ticket: any = {
    _id: getId(raw._id),
    subject: raw.subject || "",
    description: raw.description || "",
    status: raw.status || "",
    priority: raw.priority || "",
    closedAt: getDate(raw.closedAt),
    tags: Array.isArray(raw.tags) ? raw.tags.slice() : [],
    createdAt: getDate(raw.createdAt),
    updatedAt: getDate(raw.updatedAt),
    responses: [],
    raisedByRole: raw.raisedByRole,
    raisedById: getId(raw.raisedById),
  };

  // Map backend responses (nested)
  if (Array.isArray(raw.responses)) {
    ticket.responses = raw.responses.map((r: any) => ({
      _id: getId(r._id),
      respondedBy: getId(r.respondedBy),
      respondedAt: getDate(r.respondedAt),
      responseText: r.responseText,
    }));
  }
  return ticket;
}

const RaiseTicketsTherapist: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  // Ticket list and related states
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);

  // Ticket form state (no reply state)
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  function getTherapistAuthToken() {
    return localStorage.getItem("therapist-token");
  }

  // Fetch tickets including their responses/conversation
  async function fetchTickets(pg = 1, limit = 20) {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const token = getTherapistAuthToken();
      const res = await axios.get(
        `${apiUrl}/api/therapist/tickets?page=${pg}&limit=${limit}`,
        {
          headers: token ? { Authorization: `${token}` } : {},
        }
      );
      if (res.data && res.data.success) {
        // ---- flatten/normalize all returned tickets ----
        const rawTickets = Array.isArray(res.data.tickets) ? res.data.tickets : [];
        const appTickets = rawTickets.map(normalizeTicket);
        setTickets(appTickets);
        setPage(res.data.page || 1);
        setTotalTickets(res.data.total || 0);
        setPageSize(res.data.limit || 20);
      } else {
        setTickets([]);
        setTicketsError(res.data?.message || "Failed to fetch tickets.");
      }
    } catch (err: any) {
      setTickets([]);
      setTicketsError(
        err?.response?.data?.message || err.message || "Failed to fetch tickets."
      );
    } finally {
      setTicketsLoading(false);
    }
  }

  useEffect(() => {
    fetchTickets(1, pageSize);
    // eslint-disable-next-line
  }, []);

  function validate() {
    const currentErrors: { [key: string]: string } = {};
    if (!form.subject.trim()) currentErrors.subject = "Subject is required.";
    if (!form.description.trim())
      currentErrors.description = "Description is required.";
    return currentErrors;
  }

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    const foundErrors = validate();
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const tagsArray =
        form.tags.length > 0
          ? form.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [];

      const ticketPayload = {
        subject: form.subject.trim(),
        description: form.description.trim(),
        priority: PRIORITIES.some((p) => p.value === form.priority)
          ? form.priority
          : "medium",
        tags: tagsArray,
      };

      const token = getTherapistAuthToken();

      const res = await axios.post(
        `${apiUrl}/api/therapist/ticket/raise`,
        ticketPayload,
        {
          headers: token
            ? { Authorization: `${token}` }
            : {},
        }
      );

      if (res.data && res.data.success) {
        setSuccessMessage("Your ticket has been raised successfully.");
        setForm(initialFormState);
        fetchTickets(1, pageSize);
        setModalOpen(false);
      } else {
        setErrorMessage(res.data?.message || "Failed to raise ticket.");
      }
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message || err.message || "Failed to raise ticket."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const statusColor = (status: string) => {
    switch(status) {
      case "closed":
      case "resolved":
        return "#22c55e";
      case "pending":
        return "#eab308";
      case "in-progress":
        return "#0ea5e9";
      default:
        return "#0891b2";
    }
  };

  const priorityColor = (priority: string) => {
    switch(priority) {
      case "high": return "#dc2626";
      case "medium": return "#f59e42";
      case "low": return "#2563eb";
      default: return "#475569";
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalTickets / pageSize));
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  function handlePageChange(pg: number) {
    fetchTickets(pg, pageSize);
  }

  // --- Helper: Render ticket's responses/messages ---
  function renderResponses(ticket: any) {
    // Display ticket's description (initial message)
    return (
      <div style={{ marginTop: 10 }}>
        {/* Initial message/description */}
        <div style={{
          background: '#f7fafe',
          borderRadius: 6,
          padding: "10px 14px",
          marginBottom: 5,
          color: "#0a3",
          fontWeight: 500,
          fontSize: 14
        }}>
          <span>
            <span style={{color: "#194", fontWeight: 700}}>You</span> {" "}
            <span style={{color: "#aaa", fontSize: 12, fontWeight: 400}}>
              {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ""}
            </span>
          </span>
          <div style={{ margin: "3px 0 1px 0", color: "#197", fontWeight: 400 }}>
            {ticket.description}
          </div>
        </div>
        {/* Conversation messages */}
        {Array.isArray(ticket.responses) && ticket.responses.length > 0 && (
          <div style={{marginBottom: 2}}>
            {ticket.responses.map((resp: any) => (
              <div
                key={resp._id}
                style={{
                  margin: "7px 0",
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "flex-start"
                }}
              >
                <div
                  style={{
                    background: "#f3f4fb",
                    color: "#2563eb",
                    borderRadius: 6,
                    padding: "9px 14px",
                    minWidth: 120,
                    flex: 1,
                  }}
                >
                  <span style={{fontWeight: 700, fontSize: 13}}>
                    {resp.respondedBy ? (
                      <span>Support</span>
                    ) : (
                      <span>?</span>
                    )}
                  </span>
                  <span style={{color: "#888", fontWeight: 400, fontSize: 12, marginLeft: 7}}>
                    {resp.respondedAt ? new Date(resp.respondedAt).toLocaleString() : ""}
                  </span>
                  <div style={{
                    marginTop: 2,
                    fontWeight: 400,
                    color: "#333",
                    wordBreak: "break-word"
                  }}>{resp.responseText}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // No reply box: feature removed

  return (
    <div style={{  margin: "40px auto", padding: "20px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 20
      }}>
        <h2 style={{margin: 0, fontWeight: 600, fontSize: 23}}>
          My Support Tickets
        </h2>
        <button
          onClick={() => {
            setModalOpen(true);
            setForm(initialFormState);
            setSuccessMessage(null);
            setErrorMessage(null);
            setErrors({});
          }}
          style={{
            background: "#0ea5e9",
            color: "#fff",
            fontWeight: 600,
            fontSize: 16,
            border: "none",
            padding: "9px 22px",
            borderRadius: 5,
            boxShadow: "0 2px 8px #00b4c633",
            cursor: "pointer",
            transition: "background 0.13s"
          }}
        >
          + Raise Ticket
        </button>
      </div>

      {/* Ticket List with responses */}
      <div style={{
        background: "#fff",
        borderRadius: 7,
        boxShadow: "0 1.5px 8px #0001",
        padding: "22px 10px 10px 10px",
        marginBottom: 36
      }}>
        {ticketsLoading ? (
          <div style={{textAlign: "center", padding: 22}}>Loading tickets...</div>
        ) : ticketsError ? (
          <div style={{color: "#e11d48", textAlign: "center", padding: 12}}>
            {ticketsError}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{color: "#666", textAlign: "center", padding: 14}}>
            You have not raised any tickets yet.
          </div>
        ) : (
          <div>
            <table style={{width: "100%", borderCollapse: "collapse", fontSize: 15}}>
              <thead>
                <tr style={{background: "#f9fafb", color: "#333", fontWeight: 600}}>
                  <th style={{padding: "9px 6px"}}>Subject</th>
                  <th style={{padding: "9px 6px"}}>Status</th>
                  <th style={{padding: "9px 6px"}}>Priority</th>
                  <th style={{padding: "9px 6px"}}>Created</th>
                  <th style={{padding: "9px 6px"}}>Tags</th>
                  <th style={{padding: "9px 6px"}}>Conversation</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket._id} style={{borderTop: "1px solid #eee", verticalAlign: "top"}}>
                    <td style={{padding: "7px 6px", fontWeight: 500, maxWidth: 170, wordBreak: "break-word"}}>
                      {ticket.subject}
                      <div style={{fontSize: 12, color: "#888", marginTop: 1}}>
                        {ticket.description.slice(0, 32)}
                        {ticket.description.length > 32 ? '...' : ''}
                      </div>
                    </td>
                    <td style={{padding: "7px 6px"}}>
                      <span style={{
                        color: "#fff",
                        background: statusColor(ticket.status),
                        display: "inline-block",
                        fontWeight: 500,
                        fontSize: 13,
                        borderRadius: 4,
                        padding: "3px 10px"
                      }}>
                        {ticket.status}
                      </span>
                    </td>
                    <td style={{padding: "7px 6px"}}>
                      <span style={{
                        color: "#fff",
                        background: priorityColor(ticket.priority),
                        display: "inline-block",
                        fontWeight: 500,
                        fontSize: 13,
                        borderRadius: 4,
                        padding: "3px 9px"
                      }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td style={{padding: "7px 6px"}} title={ticket.createdAt}>
                      {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td style={{padding: "7px 6px"}}>
                      {(ticket.tags && ticket.tags.length > 0)
                        ? ticket.tags.map((tag: string, i: number) =>
                            <span
                              key={i}
                              style={{
                                background: "#e5e7eb",
                                color: "#0278c7",
                                borderRadius: 3,
                                fontSize: 13,
                                fontWeight: 500,
                                marginRight: 4,
                                padding: "2px 7px"
                              }}
                            >{tag}</span>
                          )
                        : <span style={{color: "#bbb", fontSize: 13}}>–</span>}
                    </td>
                    {/* --- Conversation/Responses --- */}
                    <td style={{padding: "7px 6px", minWidth: 230}}>
                      {renderResponses(ticket)}
                      {/* Reply box removed */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination Controls */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: 16,
              gap: 14
            }}>
              <button
                disabled={!canGoPrev}
                style={{
                  padding: "6px 16px",
                  background: canGoPrev ? "#f3f4f6" : "#f3f4f6",
                  color: "#088",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontWeight: 500,
                  cursor: canGoPrev ? "pointer" : "not-allowed"
                }}
                onClick={() => handlePageChange(page - 1)}
              >Prev</button>
              <span style={{fontSize: 14, color: "#444"}}>Page {page} of {totalPages}</span>
              <button
                disabled={!canGoNext}
                style={{
                  padding: "6px 16px",
                  background: canGoNext ? "#f3f4f6" : "#f3f4f6",
                  color: "#088",
                  border: "1px solid #ddd",
                  borderRadius: 4,
                  fontWeight: 500,
                  cursor: canGoNext ? "pointer" : "not-allowed"
                }}
                onClick={() => handlePageChange(page + 1)}
              >Next</button>
            </div>
          </div>
        )}
      </div>

      {/* RAISE TICKET MODAL */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Raise a Support Ticket">
        <p style={{ color: "#444", marginBottom: 23, fontSize: 15 }}>
          Have a problem or question? Fill in the form below and our team will respond soon.
        </p>
        <form onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500 }}>
              Subject <span style={{ color: "#da3030" }}>*</span>
            </label>
            <input
              name="subject"
              value={form.subject}
              onChange={handleChange}
              disabled={isSubmitting}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "7px 10px",
                fontSize: "15px",
                border: errors.subject
                  ? "1.5px solid #da3030"
                  : "1px solid #ccc",
                borderRadius: 5,
                background: isSubmitting ? "#f6f6f6" : undefined,
              }}
              placeholder="Eg: Issue with schedule"
              maxLength={120}
              autoComplete="off"
              required
            />
            {errors.subject && (
              <div
                style={{
                  color: "#da3030",
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {errors.subject}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontWeight: 500 }}>
              Description <span style={{ color: "#da3030" }}>*</span>
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              disabled={isSubmitting}
              style={{
                width: "100%",
                marginTop: 6,
                padding: "7px 10px",
                fontSize: "15px",
                border: errors.description
                  ? "1.5px solid #da3030"
                  : "1px solid #ccc",
                borderRadius: 5,
                minHeight: 90,
                background: isSubmitting ? "#f6f6f6" : undefined,
                resize: "vertical",
              }}
              placeholder="Please describe your issue or request in detail."
              maxLength={1500}
              autoComplete="off"
              required
            />
            {errors.description && (
              <div
                style={{
                  color: "#da3030",
                  fontSize: 13,
                  marginTop: 4,
                }}
              >
                {errors.description}
              </div>
            )}
          </div>
          <div style={{ marginBottom: 18, display: "flex", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 500 }}>Priority</label>
              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "7px 10px",
                  fontSize: "15px",
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  background: isSubmitting ? "#f6f6f6" : undefined,
                }}
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: 2 }}>
              <label style={{ fontWeight: 500 }}>
                Tags{" "}
                <span style={{ color: "#bbb", fontWeight: 400 }}>
                  (comma separated)
                </span>
              </label>
              <input
                name="tags"
                value={form.tags}
                onChange={handleChange}
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "7px 10px",
                  fontSize: "15px",
                  border: "1px solid #ccc",
                  borderRadius: 5,
                  background: isSubmitting ? "#f6f6f6" : undefined,
                }}
                placeholder="e.g. schedule, platform"
                maxLength={120}
                autoComplete="off"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "11px 0",
              background: isSubmitting ? "#b7e3ed" : "#0891b2",
              color: "#fff",
              fontWeight: 600,
              fontSize: 17,
              border: "none",
              borderRadius: 5,
              letterSpacing: "0.02em",
              boxShadow: isSubmitting ? "none" : "0 2px 8px #00b4c677",
              cursor: isSubmitting ? "progress" : "pointer",
              transition: "0.14s",
            }}
          >
            {isSubmitting ? "Submitting..." : "Raise Ticket"}
          </button>
          {successMessage && (
            <div
              style={{
                marginTop: 16,
                color: "#22c55e",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {successMessage}
            </div>
          )}
          {errorMessage && (
            <div
              style={{
                marginTop: 16,
                color: "#e11d48",
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              {errorMessage}
            </div>
          )}
        </form>
        <div
          style={{
            marginTop: 22,
            fontSize: 13,
            color: "#666",
            textAlign: "center",
            opacity: 0.74,
          }}
        >
          <span>
            Our support team will review your ticket and contact you via your
            registered email or phone.
          </span>
        </div>
      </Modal>
    </div>
  );
};

export default RaiseTicketsTherapist;