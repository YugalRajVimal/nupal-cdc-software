import { useState, useEffect } from "react";
import {
  FiCheckCircle,

  FiCalendar,
} from "react-icons/fi";
import { motion } from "framer-motion";

/**
 * All Upcomming Sessions Page
 * Shows upcoming (all future, NOT just today) sessions across bookings, as returned by
 * backend admin endpoint `/api/admin/bookings/all-sessions`
 * - See: booking.controller.js#getAllSessions (2163+)
 * - Accessible for admin/reception
 * - Filter bar for date, therapist, patient, therapyType, isCheckedIn
 */

const SESSION_TIME_OPTIONS = [
  { id: '1000-1045', label: '10:00 to 10:45', limited: false },
  { id: '1045-1130', label: '10:45 to 11:30', limited: false },
  { id: '1130-1215', label: '11:30 to 12:15', limited: false },
  { id: '1215-1300', label: '12:15 to 13:00', limited: false },
  { id: '1300-1345', label: '13:00 to 13:45', limited: false },
  { id: '1415-1500', label: '14:15 to 15:00', limited: false },
  { id: '1500-1545', label: '15:00 to 15:45', limited: false },
  { id: '1545-1630', label: '15:45 to 16:30', limited: false },
  { id: '1630-1715', label: '16:30 to 17:15', limited: false },
  { id: '1715-1800', label: '17:15 to 18:00', limited: false },
  { id: '0830-0915', label: '08:30 to 09:15', limited: true },
  { id: '0915-1000', label: '09:15 to 10:00', limited: true },
  { id: '1800-1845', label: '18:00 to 18:45', limited: true },
  { id: '1845-1930', label: '18:45 to 19:30', limited: true },
  { id: '1930-2015', label: '19:30 to 20:15', limited: true },
];

type Patient = {
  _id: string;
  patientId?: string;
  name: string;
  mobile?: string;
  gender?: string;
};

type Therapy = {
  _id: string;
  name: string;
};

type Package = {
  _id: string;
  packageName?: string;
  packageType?: string;
};

type PaymentSummary = any;

// For each session from backend
type UpcomingSession = {
  bookingId: string;
  appointmentId?: string;
  patient: Patient | null;
  package: Package | null;
  therapy: Therapy | null;
  payment: PaymentSummary | null;
  session: {
    _id: string;
    date: string;
    slotId?: string;
    time?: string;
    therapist?: any;
    isCheckedIn?: boolean;
    [k: string]: any;
  };
};

const API_URL = import.meta.env.VITE_API_URL;

// Helper to format date string as DD/MM/YYYY
function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "";
  // Accepts YYYY-MM-DD, or YYYY/MM/DD, also fallback.
  const match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const [, yyyy, mm, dd] = match;
    // Pad mm and dd to 2 digits as needed
    const pad = (n: string) => n.length === 1 ? "0" + n : n;
    return `${pad(dd)}/${pad(mm)}/${yyyy}`;
  }
  // Try to parse as Date object
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) {
    // Date valid
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    return `${day}/${month}/${d.getFullYear()}`;
  }
  // As a fallback, just return original string
  return dateStr;
}

export default function AllUpcomingSessions() {
  const [loading, setLoading] = useState(true);
  // const [guideOpen, setGuideOpen] = useState(false);
  const [sessions, setSessions] = useState<UpcomingSession[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [shownDate, setShownDate] = useState<string>("");

  // Multi-select and check-in logic
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [checkingIn, setCheckingIn] = useState<string[]>([]);
  const [multiCheckingIn, setMultiCheckingIn] = useState(false);

  // isCheckedIn filter state: 'all', 'checkedIn', 'notCheckedIn'
  const [checkedInFilter, setCheckedInFilter] = useState<'all' | 'checkedIn' | 'notCheckedIn'>('all');

  // Fetch all sessions (no filter)
  const fetchSessions = async () => {
    setFetchError(null);

    try {
      const token = localStorage.getItem("admin-token");
      const endpoint = `${API_URL}/api/admin/bookings/sessions`;

      setLoading(true);
      const res = await fetch(endpoint, {
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) throw new Error("Failed to fetch upcoming sessions");

      const data = await res.json();
      if (!data.success) throw new Error(data.message || "API error");
      setShownDate(data.date);

      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
    } catch (e: any) {
      setFetchError(e.message ?? "Could not fetch sessions");
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    // eslint-disable-next-line
  }, []);

  function getSessionTimeLabel(session: UpcomingSession["session"]) {
    if (!session) return "";
    let slot = session.slotId || session.time || "";
    let known = SESSION_TIME_OPTIONS.find((opt) => opt.id === slot);
    return known?.label || slot || "—";
  }

  // Handle selecting/unselecting session for multi select
  function handleCheckSelect(sessionId: string, checked: boolean) {
    setSelectedSessionIds((prev) =>
      checked
        ? [...prev, sessionId]
        : prev.filter((id) => id !== sessionId)
    );
  }

  // Bulk toggle all checkbox select for only non-checkedIn sessions
  function handleAllCheckSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.checked) {
      let filtered = filteredSessions.filter((s) => !s.session.isCheckedIn).map((s) => s.session._id);
      setSelectedSessionIds(filtered);
    } else {
      setSelectedSessionIds([]);
    }
  }

  // Handle single session check-in
  async function handleSessionCheckIn(sessionId: string) {
    setCheckingIn((prev) => [...prev, sessionId]);
    setFetchError(null);
    try {
      const token = localStorage.getItem("admin-token");
      // Find bookingId for this sessionId
      const sessionObj = sessions.find((s) => s.session._id === sessionId);
      const bookingId = sessionObj?.bookingId;
      const res = await fetch(`${API_URL}/api/admin/bookings/check-in`, {
        method: "POST",
        headers: {
          Authorization: `${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId, bookingId }),
      });
      if (!res.ok) throw new Error("Failed to check-in session");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Check-in error");
      // Refresh sessions list
      await fetchSessions();
      // Remove from selected if it was selected
      setSelectedSessionIds((ids) => ids.filter((id) => id !== sessionId));
    } catch (error: any) {
      setFetchError(error.message || "Could not check-in session");
    } finally {
      setCheckingIn((prev) => prev.filter((id) => id !== sessionId));
    }
  }

  // Multi check-in
  async function handleMultiCheckIn() {
    if (selectedSessionIds.length === 0) return;
    setMultiCheckingIn(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem("admin-token");
      for (let i = 0; i < selectedSessionIds.length; ++i) {
        const sessionId = selectedSessionIds[i];
        const sessionObj = sessions.find((s) => s.session._id === sessionId);
        const bookingId = sessionObj?.bookingId;
        await fetch(`${API_URL}/api/admin/bookings/check-in`, {
          method: "POST",
          headers: {
            Authorization: `${token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId, bookingId }),
        });
      }
      // After all, re-fetch list
      await fetchSessions();
      setSelectedSessionIds([]);
    } catch (error: any) {
      setFetchError(error.message || "Could not bulk check-in selected sessions");
    } finally {
      setMultiCheckingIn(false);
    }
  }

  // Filtering logic
  let filteredSessions = sessions;
  if (checkedInFilter === "checkedIn") {
    filteredSessions = sessions.filter((s) => s.session.isCheckedIn);
  } else if (checkedInFilter === "notCheckedIn") {
    filteredSessions = sessions.filter((s) => !s.session.isCheckedIn);
  }

  // For select-all: how many not checked-in in filtered?
  const notCheckedInCount = filteredSessions.filter((x) => !x.session.isCheckedIn).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen p-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          All Sessions{" "}
          <span className="text-slate-400">
            – {(shownDate && `Date: ${formatDateDDMMYYYY(shownDate)}`) || ""}
          </span>
        </h1>
      </div>

      {/* Filter Bar: Checked-in */}
      <div className="mb-4 flex gap-4 items-center">
        <label className="font-medium text-slate-700">Show:</label>
        <select
          className="rounded border border-slate-300 px-2 py-1 text-sm"
          value={checkedInFilter}
          onChange={e => setCheckedInFilter(e.target.value as 'all' | 'checkedIn' | 'notCheckedIn')}
          style={{ minWidth: 140 }}
        >
          <option value="all">All Sessions</option>
          <option value="notCheckedIn">Not Checked-In</option>
          <option value="checkedIn">Checked-In</option>
        </select>
      </div>

      {/* List of ALL Upcoming/Future Sessions */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-slate-600 font-semibold tracking-wide"
          >
            Loading all sessions…
          </motion.div>
        </div>
      ) : fetchError ? (
        <div className="text-red-600 text-sm font-semibold mb-6">
          Could not load sessions: {fetchError}
        </div>
      ) : (
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
            <FiCalendar className="text-blue-600" /> All Sessions{" "}
            <span className="ml-2 text-xs text-slate-400">
              {filteredSessions.length} result{filteredSessions.length === 1 ? "" : "s"}
            </span>
          </div>
          {notCheckedInCount > 0 && checkedInFilter !== "checkedIn" && (
            <div className="flex gap-4 items-center mb-3">
              <div className="flex items-center select-none">
                <input
                  type="checkbox"
                  checked={selectedSessionIds.length === notCheckedInCount && selectedSessionIds.length > 0}
                  onChange={handleAllCheckSelect}
                  className="w-4 h-4 accent-blue-600 border-slate-300 rounded"
                  id="all-session-select"
                />
                <label className="text-xs font-medium text-slate-600 ml-2 cursor-pointer" htmlFor="all-session-select">
                  Select All (Not Checked-In)
                </label>
              </div>
              <button
                onClick={handleMultiCheckIn}
                disabled={
                  multiCheckingIn ||
                  selectedSessionIds.length === 0 ||
                  notCheckedInCount === 0
                }
                className={`rounded bg-green-600 text-white px-4 py-1 font-semibold text-xs hover:bg-green-700 transition-all
                  ${multiCheckingIn || selectedSessionIds.length === 0 ? "opacity-60 cursor-not-allowed" : ""}
                `}
                type="button"
              >
                {multiCheckingIn ? "Processing..." : `Check-in Selected (${selectedSessionIds.length})`}
              </button>
            </div>
          )}

          {filteredSessions.length === 0 ? (
            <div className="text-slate-400 text-sm mx-2 my-8">
              No upcoming sessions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs md:text-sm border rounded">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="py-2 px-2 border-b font-semibold w-8"></th>
                    <th className="py-2 px-2 border-b font-semibold">Session ID</th>

                    <th className="py-2 px-2 border-b font-semibold">Date</th>
                    <th className="py-2 px-2 border-b font-semibold">Time Slot</th>
                    <th className="py-2 px-2 border-b font-semibold">Patient</th>
                    <th className="py-2 px-2 border-b font-semibold">Therapist</th>
                    <th className="py-2 px-2 border-b font-semibold">Therapy</th>
                    <th className="py-2 px-2 border-b font-semibold">Appt# / Booking</th>
                    {/* <th className="py-2 px-2 border-b font-semibold">Package</th> */}
                    <th className="py-2 px-2 border-b font-semibold">Checked In?</th>
                    <th className="py-2 px-2 border-b font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSessions.map((s) => {
                    const pat = s.patient;
                    const therapist =
                      s.session?.therapist?.userId?.name ??
                      s.session?.therapist?.name ??
                      "—";
                    const therapistId =
                      s.session?.therapist?.therapistId ??
                      s.session?.therapist?._id ??
                      "";
                    const isUnchecked = !s.session.isCheckedIn;

                    const isSelected = selectedSessionIds.includes(s.session._id);

                    return (
                      <tr
                        key={`${s.bookingId}|${s.session._id}`}
                        className="border-b last:border-0"
                        style={{ background: isUnchecked && isSelected ? "#e0f2fe" : undefined }}
                      >
                        <td className="py-2 px-2 text-center">
                          {!s.session.isCheckedIn && checkedInFilter !== "checkedIn" ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={e =>
                                handleCheckSelect(s.session._id, e.target.checked)
                              }
                              className="w-4 h-4 accent-blue-600 border-slate-300 rounded"
                            />
                          ) : null}
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-mono" title={s.session._id}>{s.session.sessionId}</span>
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-mono">{formatDateDDMMYYYY(s.session.date)}</span>
                        </td>
                        <td className="py-2 px-2 whitespace-nowrap">
                          <span>
                            {getSessionTimeLabel(s.session)}
                          </span>
                        </td>
                        <td className="py-2 px-2">
                          {pat && pat._id ? (
                            <a
                              className="text-blue-700 hover:underline font-semibold"
                              href={`/admin/children?patientId=${encodeURIComponent(pat._id)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {pat.name}
                            </a>
                          ) : (
                            <span>{pat?.name || "Unknown"}</span>
                          )}
                          {pat?.patientId && (
                            <span className="text-blue-400 text-xs ml-1">({pat.patientId})</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {therapist && therapistId ? (
                            <a
                              className="text-blue-600 hover:underline font-semibold"
                              href={`/admin/therapists?therapistId=${encodeURIComponent(therapistId)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {therapist}
                            </a>
                          ) : (
                            <span>{therapist || "—"}</span>
                          )}
                          {therapistId && (
                            <span className="ml-1 text-blue-300 font-mono">({therapistId})</span>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          {s.therapy?.name || "—"}
                        </td>
                        <td className="py-2 px-2">
                          <span className="font-semibold text-blue-900">
                            {s.appointmentId ? s.appointmentId : "-"}
                          </span>
                          <div className="text-xs text-slate-400 font-mono">
                            {s.bookingId}
                          </div>
                        </td>
                        {/* <td className="py-2 px-2">
                          {s.package?.packageName || s.package?.packageType || "—"}
                        </td> */}
                        <td className="py-2 px-2">
                          {s.session.isCheckedIn ? (
                            <span className="rounded bg-green-50 px-2 py-0.5 text-green-700 font-semibold text-xs inline-flex items-center gap-1">
                              Yes <FiCheckCircle size={13} />
                            </span>
                          ) : (
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-slate-500 font-semibold text-xs">
                              No
                            </span>
                          )}
                        </td>
                        
                        <td className="py-2 px-2 text-center">
                          {!s.session.isCheckedIn && checkedInFilter !== "checkedIn" && (
                            <button
                              className="rounded bg-green-600 text-white px-3 py-1 font-semibold text-xs hover:bg-green-700 transition-all"
                              onClick={() => handleSessionCheckIn(s.session._id)}
                              disabled={checkingIn.includes(s.session._id)}
                              type="button"
                              style={{ minWidth: 90 }}
                            >
                              {checkingIn.includes(s.session._id)
                                ? "Checking in..."
                                : "Check-in"}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
