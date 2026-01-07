import React, { useEffect, useState } from "react";
import { FiUser, FiArrowRightCircle, FiChevronDown, FiChevronRight } from "react-icons/fi";
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

export default function BookingRequests() {
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for expanding sessions row
  const [expandedSessions, setExpandedSessions] = useState<{ [id: string]: boolean }>({});

  // State for tracking individual action loading/error
  const [actionLoading, setActionLoading] = useState<{ [id: string]: boolean }>({});
  const [actionError, setActionError] = useState<{ [id: string]: string | null }>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/admin/bookings/booking-requests`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setBookingRequests(data.bookingRequests || []);
        } else {
          setError("Failed to fetch booking requests");
        }
      })
      .catch(() => setError("Failed to fetch booking requests."))
      .finally(() => setLoading(false));
  }, []);

  const toggleExpandSessions = (reqId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [reqId]: !prev[reqId],
    }));
  };



  // Handler for reject action (calls POST /api/admin/bookings/booking-requests/:id/reject)
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
      // Instead of removing, set status to "rejected" in frontend state
      setBookingRequests((prev) =>
        prev.map((br) =>
          br._id === requestId ? { ...br, status: "rejected" } : br
        )
      );
    } catch {
      setActionError((prev) => ({ ...prev, [requestId]: "Failed to reject." }));
    }
    setActionLoading((prev) => ({ ...prev, [requestId]: false }));
  };

  // Placeholder for starting a booking
  // const handleStartBooking = (requestId: string) => {
  //   alert(`Start Booking for request id: ${requestId}`);
  // };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold text-blue-800 mb-6">Booking Requests</h1>

      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-center text-red-600">{error}</div>
      ) : bookingRequests.length === 0 ? (
        <div className="text-center text-slate-400">No booking requests found.</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Request ID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Therapy</th>
                <th className="px-4 py-3 text-left">Package</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Requested Sessions</th>
                <th className="px-4 py-3 text-left">Booked Appointment Id</th>
                <th className="px-4 py-3 text-left">Created At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookingRequests.map((req) => {
                const hasSessions = Array.isArray(req.sessions) && req.sessions.length > 0;
                const isExpanded = expandedSessions[req._id] ?? false;

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
                              {req.patient?.name || req.patient?.childFullName || (
                                <span className="italic text-slate-400">N/A</span>
                              )}
                            </p>
                            <div className="text-xs text-slate-500">
                              {req.patient?.patientId
                                ? <span>ID: {req.patient.patientId}</span>
                                : req.patient?.userId
                                  ? <span>ID: {typeof req.patient.userId === "string" ? req.patient.userId : req.patient.userId?._id}</span>
                                  : null}
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
      )}
    </div>
  );
}
