import React, { useEffect, useState, useRef } from "react";
import { FiUser, FiArrowRightCircle, FiChevronDown, FiChevronRight, FiSearch } from "react-icons/fi";
import { Link } from "react-router";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

// Types for booking request data
type BookingRequest = {
  _id: string;
  requestId?: string;
  patient?: {
    name?: string;
    patientId?: string;
    userId?: any;
    mobile1?: string;
    phoneNo?: string;
    email?: string;
    childFullName?: string;
    gender?: string;
    childDOB?: string;
  };
  therapy?: {
    name?: string;
  };
  package?: {
    name?: string;
    totalSessions?: number;
    totalCost?: number;
  };
  status?: string;
  sessions?: Array<{
    date?: string;
    time?: string;
    slotId?: string;
  }>;
  appointmentId?: string | { appointmentId?: string };
  createdAt?: string;
};

function useBookingRequests(
  queryParams: {
    search: string;
    status: string;
    page: number;
    pageSize: number;
    sortField: string;
    sortOrder: string;
  }
) {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Build querystring from params
    const params = new URLSearchParams();
    if (queryParams.search) params.set("search", queryParams.search);
    if (queryParams.status) params.set("status", queryParams.status);
    params.set("page", String(queryParams.page));
    params.set("pageSize", String(queryParams.pageSize));
    if (queryParams.sortField) params.set("sortField", queryParams.sortField);
    if (queryParams.sortOrder) params.set("sortOrder", queryParams.sortOrder);

    fetch(`${API_BASE_URL}/api/admin/bookings/booking-requests?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setBookingRequests(data.bookingRequests || []);
          setTotal(data.total || 0);
        } else {
          setError("Failed to fetch booking requests");
          setBookingRequests([]);
        }
      })
      .catch(() => {
        setError("Failed to fetch booking requests.");
        setBookingRequests([]);
      })
      .finally(() => setLoading(false));
  }, [
    queryParams.search,
    queryParams.status,
    queryParams.page,
    queryParams.pageSize,
    queryParams.sortField,
    queryParams.sortOrder,
  ]);

  return {
    bookingRequests,
    loading,
    error,
    total,
  };
}

export default function BookingRequests() {
  // UI State for search & filter
  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState(""); // "", "pending", "approved", "rejected"
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Data/Sort State
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // "Active" search & filter values for API requests
  const [activeSearch, setActiveSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  // Pagination
  const { bookingRequests, loading, error, total } = useBookingRequests({
    search: activeSearch,
    status: activeStatus,
    page,
    pageSize,
    sortField,
    sortOrder,
  });

  // Session expansion state
  const [expandedSessions, setExpandedSessions] = useState<{ [id: string]: boolean }>({});

  // Request action state
  const [actionLoading, setActionLoading] = useState<{ [id: string]: boolean }>({});
  const [actionError, setActionError] = useState<{ [id: string]: string | null }>({});

  // Reset expanded session rows if page changes
  useEffect(() => {
    setExpandedSessions({});
  }, [bookingRequests]);

  const toggleExpandSessions = (reqId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
  };

  // Handler for search submit: does NOT update the input, only sets active search param for the table
  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPage(1);
    setActiveSearch(searchInput.trim());
  };

  // Handler for filter: status
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
    setActiveStatus(e.target.value);
  };

  // Handler for page navigation
  const totalPages = Math.ceil(total / pageSize);

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(parseInt(e.target.value, 10));
    setPage(1);
  };

  // Sort
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  // Reject action (calls POST /api/admin/bookings/booking-requests/:id/reject)
  const handleReject = async (requestId: string) => {
    setActionLoading((prev) => ({ ...prev, [requestId]: true }));
    setActionError((prev) => ({ ...prev, [requestId]: null }));

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/booking-requests/${requestId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!res.ok) throw new Error(await res.text());
      setActiveSearch((search) => search); // trigger refetch
    } catch {
      setActionError((prev) => ({ ...prev, [requestId]: "Failed to reject." }));
    }
    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  // Helper to build patient link href
  // const getPatientHref = (patient: BookingRequest["patient"]) => {
  //   if (patient?.patientId) {
  //     return `/admin/children?patientId=${encodeURIComponent(patient.patientId)}`;
  //   }
  //   return undefined;
  // };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Booking Requests</h1>
      {/* -- Search & Filter */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex flex-wrap gap-3 mb-5 items-center"
        autoComplete="off"
      >
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search requests, patients, appointment id..."
            className="border rounded-md px-3 py-2 pl-9 text-sm focus:outline-none focus:border-blue-400 w-72"
            name="search"
            autoComplete="off"
          />
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600 transition"
        >
          Search
        </button>
        <select
          className="border rounded-md px-3 py-2 text-sm focus:outline-none"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          name="status"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </form>

      {/* -- Table */}
      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : bookingRequests.length === 0 ? (
        <div className="text-center text-slate-400">No booking requests found.</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("requestId")}
                  >
                    Request ID
                    {sortField === "requestId" ? (
                      <span className={sortOrder === "asc" ? "text-blue-600" : "text-blue-900"}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    ) : null}
                  </th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Therapy</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    {sortField === "status" ? (
                      <span className={sortOrder === "asc" ? "text-blue-600" : "text-blue-900"}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    ) : null}
                  </th>
                  <th className="px-4 py-3 text-left">Requested Sessions</th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("appointmentId")}
                  >
                    Booking Id
                    {sortField === "appointmentId" ? (
                      <span className={sortOrder === "asc" ? "text-blue-600" : "text-blue-900"}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    ) : null}
                  </th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created At
                    {sortField === "createdAt" ? (
                      <span className={sortOrder === "asc" ? "text-blue-600" : "text-blue-900"}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    ) : null}
                  </th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookingRequests.map((req) => {
                  const hasSessions = Array.isArray(req.sessions) && req.sessions.length > 0;
                  const isExpanded = expandedSessions[req._id] ?? false;

                  // Patient link logic
                  // const patientHref = getPatientHref(req.patient);
                  const patientName = req.patient?.name || req.patient?.childFullName;
                  // const patientId = req.patient?.patientId;
                  const showPatientId = req.patient?.patientId
                    ? req.patient.patientId
                    : req.patient?.userId
                      ? typeof req.patient.userId === "string"
                        ? req.patient.userId
                        : req.patient.userId?._id
                      : null;

                  return (
                    <React.Fragment key={req._id}>
                      <tr className="border-t hover:bg-blue-50">
                        {/* Request ID */}
                        <td className="px-4 py-4 font-mono text-blue-800 font-semibold">
                          {req.requestId || <span className="italic text-slate-400">N/A</span>}
                        </td>
                        {/* Patient */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                              <FiUser className="text-blue-700" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">
                                {patientName ? (
                                  req.patient?.patientId ? (
                                    <a
                                      href={`/admin/children?patientId=${encodeURIComponent(req.patient.patientId)}`}
                                      className="hover:underline text-blue-700"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {patientName}
                                    </a>
                                  ) : (
                                    patientName
                                  )
                                ) : (
                                  <span className="italic text-slate-400">N/A</span>
                                )}
                              </p>
                              <div className="text-xs text-slate-500">
                                {showPatientId &&
                                  (req.patient?.patientId ? (
                                    <a
                                      href={`/admin/children?patientId=${encodeURIComponent(req.patient.patientId)}`}
                                      className="hover:underline text-blue-600"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      ID: {showPatientId}
                                    </a>
                                  ) : (
                                    <span>ID: {showPatientId}</span>
                                  ))
                                }
                                {req.patient?.childDOB && (
                                  <span className="ml-2">
                                    DOB: {new Date(req.patient.childDOB).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">
                                {(req.patient?.mobile1 || req.patient?.phoneNo) && (
                                  <>
                                    <span>{req.patient.mobile1 || req.patient.phoneNo}</span>
                                  </>
                                )}
                                {req.patient?.email && (
                                  <>
                                    <span className="ml-2">{req.patient.email}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        {/* Therapy */}
                        <td className="px-4 py-4 text-slate-700">
                          {req.therapy?.name || <span className="italic text-slate-400">N/A</span>}
                        </td>
                        {/* Package */}
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-800">{req.package?.name || <span className="italic text-slate-400">N/A</span>}</div>
                          {req.package && (
                            <div className="text-xs text-slate-400">
                              {req.package.totalSessions && `${req.package.totalSessions} sessions`}
                              {req.package.totalCost != null && (
                                <span>
                                  {req.package.totalSessions ? ", " : ""}
                                  ₹{req.package.totalCost}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        {/* Status */}
                        <td className="px-4 py-4">
                          <span
                            className={
                              req.status === "pending"
                                ? "text-orange-500 font-semibold"
                                : req.status === "approved"
                                ? "text-green-600 font-semibold"
                                : "text-red-500 font-semibold"
                            }
                          >
                            {req.status?.toUpperCase() || "N/A"}
                          </span>
                        </td>
                        {/* Requested Sessions - collapsible */}
                        <td className="px-4 py-4">
                          {hasSessions ? (
                            <button
                              className="flex items-center gap-2 cursor-pointer text-blue-700 hover:underline focus:outline-none"
                              onClick={() => toggleExpandSessions(req._id)}
                              type="button"
                              aria-expanded={isExpanded}
                              aria-controls={`sessions-list-${req._id}`}
                              tabIndex={0}
                            >
                              {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                              <span>
                                {req.sessions!.length} session{req.sessions!.length > 1 ? "s" : ""}
                              </span>
                            </button>
                          ) : (
                            <span className="italic text-slate-400">N/A</span>
                          )}
                        </td>
                        {/* Linked Appointment */}
                        <td className="px-4 py-4">
                          {req.appointmentId
                            ? (
                              <span className="text-green-700 font-mono flex items-center gap-2">
                                <FiArrowRightCircle />
                                {typeof req.appointmentId === "object" && req.appointmentId.appointmentId
                                  ? req.appointmentId.appointmentId
                                  : typeof req.appointmentId === "string"
                                    ? req.appointmentId
                                    : "Yes"}
                              </span>
                            )
                            : <span className="text-slate-400">No</span>
                          }
                        </td>
                        {/* Created At */}
                        <td className="px-4 py-4 text-slate-700">
                          {req.createdAt
                            ? new Date(req.createdAt).toLocaleString()
                            : <span className="italic text-slate-400">N/A</span>}
                        </td>
                        {/* Actions */}
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {req.status === "pending" && (
                              <>
                                <button
                                  className="inline-flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60"
                                  onClick={() => handleReject(req._id)}
                                  disabled={!!actionLoading[req._id]}
                                >
                                  {actionLoading[req._id] ? (
                                    <span className="animate-spin mr-1" style={{ display: "inline-block" }}>⏳</span>
                                  ) : null}
                                  Reject
                                </button>
                                <Link
                                  to="/admin/bookings"
                                  state={{ bookingRequest: req }}
                                  className="inline-flex items-center gap-1 rounded-md border border-blue-400 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                                >
                                  Start Booking
                                </Link>
                              </>
                            )}
                            {actionError[req._id] && (
                              <span className="ml-2 text-xs text-red-500">{actionError[req._id]}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                      {/* Expanded row for requested sessions */}
                      {hasSessions && isExpanded && (
                        <tr className="bg-slate-50">
                          <td colSpan={9} className="px-8 py-4">
                            <ul className="list-disc pl-6 space-y-1">
                              {req.sessions!.map((s, idx) => (
                                <li key={idx}>
                                  <span className="font-mono">{s.date}</span>
                                  {s.time && <span className="ml-1 text-slate-500">@ {s.time}</span>}
                                  {s.slotId && <span className="ml-1 text-slate-400">[{s.slotId}]</span>}
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {bookingRequests.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center p-6 text-slate-400">
                      No booking requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* -- Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between mt-4">
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-slate-500">Rows per page:</label>
              <select
                id="pageSize"
                className="border rounded-md px-2 py-1 text-sm"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                {[10, 15, 20, 30, 50].map((sz) => (
                  <option key={sz} value={sz}>{sz}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-xs rounded hover:bg-blue-100 disabled:opacity-40"
                onClick={() => goToPage(1)}
                disabled={page === 1}
                tabIndex={0}
                aria-label="First page"
              >{"<<"}</button>
              <button
                className="px-2 py-1 text-xs rounded hover:bg-blue-100 disabled:opacity-40"
                onClick={() => goToPage(page - 1)}
                disabled={page === 1}
                tabIndex={0}
                aria-label="Previous page"
              >{"<"}</button>
              <span className="mx-2 text-xs">
                Page <b>{page}</b> of {totalPages === 0 ? 1 : totalPages}
              </span>
              <button
                className="px-2 py-1 text-xs rounded hover:bg-blue-100 disabled:opacity-40"
                onClick={() => goToPage(page + 1)}
                disabled={page >= totalPages}
                tabIndex={0}
                aria-label="Next page"
              >{">"}</button>
              <button
                className="px-2 py-1 text-xs rounded hover:bg-blue-100 disabled:opacity-40"
                onClick={() => goToPage(totalPages)}
                disabled={page >= totalPages}
                tabIndex={0}
                aria-label="Last page"
              >{">>"}</button>
            </div>
            <div className="text-xs text-slate-600 mt-2 sm:mt-0">
              Showing {(total === 0) ? 0 : (page - 1) * pageSize + 1}
              {" - "}
              {Math.min(total, page * pageSize)}
              {" of "}
              {total}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
