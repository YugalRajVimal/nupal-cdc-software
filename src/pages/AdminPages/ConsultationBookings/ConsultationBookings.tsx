import React, { useEffect, useState, useRef } from "react";
import { FiSearch, FiUser } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

// Helper to format date as DD/MM/YYYY
function formatDate_DDMMYYYY(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  let d: Date;
  if (typeof dateInput === "string") {
    d = new Date(dateInput);
    if (isNaN(d.getTime())) return "";
  } else if (dateInput instanceof Date) {
    d = dateInput;
  } else {
    return "";
  }
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear().toString();
  return `${day}/${month}/${year}`;
}

// Types for consultation booking data
type Booking = {
  _id: string;
  consultationAppointmentId: string;
  client?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  consultant?: {
    _id: string;
    name: string;
    email: string;
    phoneNumber: string;
  };
  therapy?: {
    _id: string;
    name: string;
  };
  scheduledAt: string;
  time?: string;
  durationMinutes?: number;
  adminUpdatedScheduledAt?: string;
  adminUpdatedTime?: string;
  adminUpdatedDurationMinutes?: number;
  adminUpdateReason?: string;
  sessionType: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  remark?: string;
};

type SortOrder = "asc" | "desc";

function useConsultationBookings(
  queryParams: {
    search: string;
    status: string;
    page: number;
    pageSize: number;
    sortField: string;
    sortOrder: SortOrder;
  }
) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (queryParams.search) params.set("search", queryParams.search);
    if (queryParams.status) params.set("status", queryParams.status);
    params.set("page", String(queryParams.page));
    params.set("pageSize", String(queryParams.pageSize));
    if (queryParams.sortField) params.set("sortField", queryParams.sortField);
    if (queryParams.sortOrder) params.set("sortOrder", queryParams.sortOrder);

    fetch(`${API_BASE_URL}/api/admin/consultation-bookings?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setBookings(data.bookings || []);
        setTotal(data.total || (Array.isArray(data.bookings) ? data.bookings.length : 0));
      })
      .catch(() => {
        setError("Failed to fetch consultation bookings.");
        setBookings([]);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [
    queryParams.search,
    queryParams.status,
    queryParams.page,
    queryParams.pageSize,
    queryParams.sortField,
    queryParams.sortOrder,
  ]);

  return { bookings, loading, error, total, setBookings }; // Add setBookings for local mutation after approve
}

const statusColors: Record<Booking["status"], string> = {
  pending: "text-orange-500 font-semibold",
  confirmed: "text-green-600 font-semibold",
  completed: "text-blue-600 font-semibold",
  cancelled: "text-red-500 font-semibold",
};

export default function ConsultationBookingsAdmin() {
  // UI State
  const [searchInput, setSearchInput] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Data/Sort
  const [sortField, setSortField] = useState("scheduledAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // "Active" search & filter values for API requests
  const [activeSearch, setActiveSearch] = useState("");
  const [activeStatus, setActiveStatus] = useState("");

  // Approve modal and error state
  const [approveLoadingId, setApproveLoadingId] = useState<string | null>(null);
  const [approveError, setApproveError] = useState<string | null>(null); // for overall error message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pagination/data fetch
  const {
    bookings,
    loading,
    error,
    total,
    setBookings
  } = useConsultationBookings({
    search: activeSearch,
    status: activeStatus,
    page,
    pageSize,
    sortField,
    sortOrder,
  });

  // Handler for search submit
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
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
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

  // Approve booking
  const handleApprove = async (bookingId: string) => {
    setApproveLoadingId(bookingId);
    setApproveError(null);
    setSuccessMessage(null);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/consultation-bookings/${bookingId}/approve`,
        { method: "PUT", headers: { "Content-Type": "application/json" } }
      );
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText); // in case backend sends JSON, as expected
      } catch {
        // if not JSON, treat as text
        data = { message: responseText };
      }
      if (!res.ok) {
        setApproveError(data?.error || data?.message || "Failed to approve booking.");
        return;
      }
      // Success
      setSuccessMessage("Booking approved successfully.");
      // Update locally
      setBookings((prev) =>
        prev.map((b) =>
          b._id === bookingId ? { ...b, status: "confirmed" } : b
        )
      );
      // Auto clear success after short time
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (e: any) {
      setApproveError("Error: " + (e?.message || e?.toString() || "Unknown error."));
    } finally {
      setApproveLoadingId(null);
    }
  };

  // Dismiss error messages
  const clearApproveError = () => setApproveError(null);
  const clearSuccessMessage = () => setSuccessMessage(null);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Consultation Bookings</h1>
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
            placeholder="Search bookings, client, consultant, ID..."
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
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </form>

      {/* Error/success notification for approve */}
      {approveError && (
        <div
          className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 mb-4 rounded relative"
          role="alert"
        >
          <span className="block sm:inline font-semibold">Error: </span> 
          {approveError}
          <button
            onClick={clearApproveError}
            className="ml-2 text-xs text-red-500 underline"
            tabIndex={0}
          >
            Dismiss
          </button>
        </div>
      )}
      {successMessage && (
        <div
          className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 mb-4 rounded relative"
          role="status"
        >
          <span>{successMessage}</span>
          <button
            onClick={clearSuccessMessage}
            className="ml-2 text-xs text-green-600 underline"
            tabIndex={0}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* -- Table */}
      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="text-center text-slate-400">No consultation bookings found.</div>
      ) : (
        <>
          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("consultationAppointmentId")}
                  >
                    Booking ID
                    {sortField === "consultationAppointmentId" ? (
                      <span className={sortOrder === "asc" ? "text-blue-600" : "text-blue-900"}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    ) : null}
                  </th>
                  <th className="px-4 py-3 text-left">Client</th>
                  {/* Consultant column removed */}
                  <th className="px-4 py-3 text-left">Therapy</th>
                  <th
                    className="px-4 py-3 text-left cursor-pointer select-none"
                    onClick={() => handleSort("scheduledAt")}
                  >
                    Date
                    {sortField === "scheduledAt" ? (
                      <span className={sortOrder === "asc" ? "text-blue-600" : "text-blue-900"}>
                        {sortOrder === "asc" ? " ▲" : " ▼"}
                      </span>
                    ) : null}
                  </th>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Duration</th>
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
                  <th className="px-4 py-3 text-left">Session Type</th>
                  <th className="px-4 py-3 text-left">Remark</th>
                  {/* New approve column */}
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking._id} className="border-t hover:bg-blue-50">
                    {/* Booking ID */}
                    <td className="px-4 py-4 font-mono text-blue-800 font-semibold">
                      {booking.consultationAppointmentId || <span className="italic text-slate-400">N/A</span>}
                    </td>
                    {/* Client */}
                    <td className="px-4 py-4">
                      {booking.client ? (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="text-blue-700" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">
                              {booking.client.name}
                            </p>
                            <div className="text-xs text-slate-500">
                              <span>{booking.client.email}</span>
                              <span className="ml-2">{booking.client.phoneNumber}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="italic text-slate-400">N/A</span>
                      )}
                    </td>
                    {/* Consultant column removed */}
                    {/* Therapy */}
                    <td className="px-4 py-4 text-slate-700">
                      {booking.therapy?.name || <span className="italic text-slate-400">N/A</span>}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-4">
                      {booking.scheduledAt
                        ? formatDate_DDMMYYYY(booking.scheduledAt)
                        : <span className="italic text-slate-400">N/A</span>}
                    </td>
                    {/* Time */}
                    <td className="px-4 py-4">
                      {booking.time || <span className="italic text-slate-400">N/A</span>}
                    </td>
                    {/* Duration */}
                    <td className="px-4 py-4">
                      {booking.durationMinutes ?? 60} min
                    </td>
                    {/* Status */}
                    <td className={"px-4 py-4 " + (statusColors[booking.status] || "")}>
                      {booking.status?.toUpperCase() || "N/A"}
                    </td>
                    {/* Session Type */}
                    <td className="px-4 py-4">
                      {booking.sessionType || <span className="italic text-slate-400">N/A</span>}
                    </td>
                    {/* Remark */}
                    <td className="px-4 py-4">
                      {booking.remark || <span className="italic text-slate-400">—</span>}
                    </td>
                    {/* Approve action */}
                    <td className="px-4 py-4 text-center">
                      {booking.status === "pending" ? (
                        <button
                          className={
                            "px-3 py-1 rounded bg-green-500 hover:bg-green-600 text-white text-xs font-semibold transition disabled:opacity-40"
                          }
                          style={{ minWidth: 80 }}
                          onClick={() => handleApprove(booking._id)}
                          disabled={approveLoadingId === booking._id}
                        >
                          {approveLoadingId === booking._id ? (
                            <span>
                              <svg
                                className="inline mr-1 animate-spin"
                                width={14}
                                height={14}
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="white"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <circle cx={12} cy={12} r={10} opacity="0.2" />
                                <path d="M12 2a10 10 0 0 1 10 10" />
                              </svg>
                              Approving...
                            </span>
                          ) : (
                            "Approve"
                          )}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center p-6 text-slate-400">
                      No consultation bookings found.
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
                Page <b>{page}</b> of {totalPages}
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