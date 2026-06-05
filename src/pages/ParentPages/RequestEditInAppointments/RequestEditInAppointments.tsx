

import { useEffect, useState, useRef, useCallback } from "react";
import {
  FiCalendar,
  FiUser,
  FiEdit2,
  FiCheck,
  FiX,
  FiSave,
  FiChevronDown,
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from "react-icons/fi";
import { motion } from "framer-motion";
import dayjs from "dayjs";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// --- TYPE DEFINITIONS ---
type TherapistType = {
  _id: string;
  userId: { _id: string; name: string } | string;
  therapistId: string;
};
type SessionType = {
  _id?: string;
  date: string;
  time?: string;
  status?: string;
  notes?: string;
  slotId?: string;
  therapist?: TherapistType;
  [key: string]: any;
};
type PatientType = {
  _id: string;
  userId: string;
  patientId: string;
  gender: string;
  childDOB: string;
  name: string;
  [key: string]: any;
};
type EditRequestSessionEntry = {
  sessionId: string;
  newDate: string;
  newSlotId: string;
};
type EditRequestType = {
  _id: string;
  appointmentId: string;
  patientId: string;
  sessions: EditRequestSessionEntry[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};
type AppointmentType = {
  _id: string;
  appointmentId?: string;
  patient?: PatientType;
  sessions: SessionType[];
  createdAt: string;
  updatedAt: string;
  editRequests?: EditRequestType[];
  [key: string]: any;
};

// --- AVAILABILITY TYPES ---
type SlotAvailabilityData = {
  [date: string]: {
    slots: {
      [slotId: string]: {
        label: string;
        limited: boolean;
        totalCapacity: number;
        booked: number;
        available: number;
      };
    };
    summary: {
      totalNormalCapacity: number;
      normalBooked: number;
      normalAvailable: number;
      totalLimitedCapacity: number;
      limitedBooked: number;
      limitedAvailable: number;
    };
  };
};

// Only non-limited options
const SESSION_TIME_OPTIONS = [
  { id: "1000-1045", label: "10:00 to 10:45", limited: false },
  { id: "1045-1130", label: "10:45 to 11:30", limited: false },
  { id: "1130-1215", label: "11:30 to 12:15", limited: false },
  { id: "1215-1300", label: "12:15 to 13:00", limited: false },
  { id: "1300-1345", label: "13:00 to 13:45", limited: false },
  { id: "1415-1500", label: "14:15 to 15:00", limited: false },
  { id: "1500-1545", label: "15:00 to 15:45", limited: false },
  { id: "1545-1630", label: "15:45 to 16:30", limited: false },
  { id: "1630-1715", label: "16:30 to 17:15", limited: false },
  { id: "1715-1800", label: "17:15 to 18:00", limited: false },
];
// Keep the full lookup so you can show labels for slots, even if limited slots are in data
const SLOT_TIME_LOOKUP: Record<string, { start: string; end: string }> = {
  "1000-1045": { start: "10:00", end: "10:45" },
  "1045-1130": { start: "10:45", end: "11:30" },
  "1130-1215": { start: "11:30", end: "12:15" },
  "1215-1300": { start: "12:15", end: "13:00" },
  "1300-1345": { start: "13:00", end: "13:45" },
  "1415-1500": { start: "14:15", end: "15:00" },
  "1500-1545": { start: "15:00", end: "15:45" },
  "1545-1630": { start: "15:45", end: "16:30" },
  "1630-1715": { start: "16:30", end: "17:15" },
  "1715-1800": { start: "17:15", end: "18:00" },
  "0830-0915": { start: "08:30", end: "09:15" },
  "0915-1000": { start: "09:15", end: "10:00" },
  "1800-1845": { start: "18:00", end: "18:45" },
  "1845-1930": { start: "18:45", end: "19:30" },
  "1930-2015": { start: "19:30", end: "20:15" },
};

type SessionEditState = {
  [sessionKey: string]: {
    date: string;
    slotId: string;
    error?: string | null;
    requested?: boolean;
    status?: string;
    therapistName?: string;
    originalDate?: string;
    originalSlotId?: string;
    isEditedSlot?: boolean;
    pendingRequestNewDate?: string | null;
    pendingRequestNewSlotId?: string | null;
  };
};

// --- HOOKS ---
function useDebounce<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- UTILS ---
function getSlotDateTime(dateStr: string, slotId?: string) {
  if (!dateStr || !slotId) return null;
  const slot = SLOT_TIME_LOOKUP[slotId];
  if (!slot) return null;
  const dt = dayjs(`${dateStr}T${slot.start}`);
  return dt.isValid() ? dt : null;
}
function isLessThan2Hours(dt: dayjs.Dayjs | null) {
  if (!dt) return false;
  return dt.diff(dayjs(), "minute") <= 120;
}
function isSessionLocked2Hr(dateStr: string, slotId?: string) {
  return isLessThan2Hours(getSlotDateTime(dateStr, slotId));
}
function willSelectionBeLocked2Hr(dateStr: string, slotId: string) {
  if (!dateStr || !slotId) return false;
  return isSessionLocked2Hr(dateStr, slotId);
}

// Availability bar helper
function availPct(avail: number, capacity: number) {
  return capacity > 0 ? Math.round(Math.max(0, Math.min(100, (avail / capacity) * 100))) : 0;
}

// --- AVAILABILITY FETCHER HOOK ---
// Fetches availability for a set of year-month combos and merges into one map
function useSessionAvailability(dates: string[], enabled: boolean) {
  const [availabilityData, setAvailabilityData] = useState<SlotAvailabilityData>({});
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const fetchAvailability = useCallback(async (datesToFetch: string[]) => {
    if (!datesToFetch.length || !enabled) return;

    // Collect unique year-month combos from dates
    const monthSet = new Set<string>();
    datesToFetch.forEach((d) => {
      const parsed = dayjs(d);
      if (parsed.isValid()) monthSet.add(`${parsed.year()}-${parsed.month() + 1}`);
    });

    setAvailabilityLoading(true);
    try {
      const token = localStorage.getItem("patient-token");
      const results = await Promise.all(
        Array.from(monthSet).map(async (ym) => {
          const [y, m] = ym.split("-");
          const url = `${API_BASE_URL}/api/parent/slot-availability?year=${y}&month=${m}`;
          const res = await fetch(url, {
            headers: token ? { Authorization: token } : {},
          });
          if (!res.ok) return {};
          const json = await res.json();
          return json.days || {};
        })
      );
      // Merge all months into one map
      const merged: SlotAvailabilityData = {};
      results.forEach((monthData) => Object.assign(merged, monthData));
      setAvailabilityData(merged);
    } catch {
      setAvailabilityData({});
    }
    setAvailabilityLoading(false);
  }, [enabled]);

  useEffect(() => {
    fetchAvailability(dates);
  }, [dates.join(","), fetchAvailability]);

  return { availabilityData, availabilityLoading, refetch: () => fetchAvailability(dates) };
}

// --- AVAILABILITY BADGE ---
function SlotAvailabilityBadge({
  available,
  total,
  className = "",
}: {
  available: number;
  total: number;
  className?: string;
}) {
  const pct = availPct(available, total);
  const color =
    available === 0 ? "bg-red-400" : pct < 30 ? "bg-amber-400" : "bg-emerald-400";
  const textColor =
    available === 0 ? "text-red-600" : pct < 30 ? "text-amber-600" : "text-emerald-600";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden min-w-[48px]">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-semibold whitespace-nowrap ${textColor}`}>
        {available === 0 ? "Full" : `${available}/${total} open`}
      </span>
    </div>
  );
}

// --- MAIN COMPONENT ---
export default function RequestEditInAppointment() {
  const [searchText, setSearchText] = useState("");
  const debouncedSearchText = useDebounce(searchText, 350);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const reloadKey = useRef(0);

  const [viewAppointment, setViewAppointment] = useState<AppointmentType | null>(null);
  const [sessionEditState, setSessionEditState] = useState<SessionEditState>({});
  const [requestEditMessage, setRequestEditMessage] = useState<string | null>(null);
  const [editAllMode, setEditAllMode] = useState(false);
  const [submittingAll, setSubmittingAll] = useState(false);
  const [submitAllError, setSubmitAllError] = useState<string | null>(null);
  const [expandedEditRequests, setExpandedEditRequests] = useState<{
    [editRequestId: string]: boolean;
  }>({});

  // --- AVAILABILITY: collect all dates from the viewed appointment ---
  const sessionDates = viewAppointment
    ? (viewAppointment.sessions || []).map((s) => s.date).filter(Boolean)
    : [];
  // Also include any edited dates from sessionEditState
  const editedDates = Object.values(sessionEditState)
    .map((v) => v.date)
    .filter(Boolean);
  const allDatesToWatch = Array.from(new Set([...sessionDates, ...editedDates]));

  const { availabilityData, availabilityLoading, refetch: refetchAvailability } =
    useSessionAvailability(allDatesToWatch, !!viewAppointment);

  // Re-fetch availability when a date field changes in edit mode
  const handleSessionFieldChange = (key: string, field: "date" | "slotId", value: string) => {
    setSessionEditState((prev) => {
      const prevState = prev[key] || {};
      const originalDate = prevState.originalDate ?? prevState.date;
      const originalSlotId = prevState.originalSlotId ?? prevState.slotId;
      const newDate = field === "date" ? value : prevState.date;
      const newSlotId = field === "slotId" ? value : prevState.slotId;
      const isEditedSlot =
        (originalDate !== undefined && newDate !== originalDate) ||
        (originalSlotId !== undefined && newSlotId !== originalSlotId);
      return {
        ...prev,
        [key]: { ...prevState, [field]: value, isEditedSlot, error: null },
      };
    });
    // If date changed, trigger availability refetch after state update
    if (field === "date" && value) {
      setTimeout(() => refetchAvailability(), 50);
    }
  };

  // --- UTILITY ---
  function getSessionPendingRequestMap(appointment: AppointmentType) {
    const sessionReqMap: Record<string, { status: string; newDate?: string; newSlotId?: string }> = {};
    const validEditRequests = Array.isArray(appointment.editRequests)
      ? appointment.editRequests.filter((er) => er.status === "pending" || er.status === "approved")
      : [];
    validEditRequests.forEach((editReq) => {
      (editReq.sessions || []).forEach((sessionObj) => {
        const sessionIdStr = sessionObj.sessionId?.toString?.() || `${sessionObj.sessionId}`;
        sessionReqMap[sessionIdStr] = {
          status: editReq.status,
          newDate: sessionObj.newDate,
          newSlotId: sessionObj.newSlotId,
        };
      });
    });
    return sessionReqMap;
  }

  function appointmentHasPendingRequest(appointment: AppointmentType) {
    if (!appointment || !Array.isArray(appointment.editRequests)) return false;
    return appointment.editRequests.some((er) => er.status === "pending" || er.status === "approved");
  }

  // --- FETCH TABLE ---
  useEffect(() => {
    setLoading(true);
    const patientToken = localStorage.getItem("patient-token");
    const params = new URLSearchParams();
    params.append("page", String(currentPage));
    params.append("limit", String(pageSize));
    if (debouncedSearchText.length > 0) params.append("search", debouncedSearchText);

    fetch(`${API_BASE_URL}/api/parent/appointments?${params.toString()}`, {
      headers: patientToken ? { Authorization: `${patientToken}` } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        if (raw && raw.success && Array.isArray(raw.data)) {
          setAppointments(raw.data);
          setTotalCount(raw.total || raw.count || raw.data.length);
        } else {
          setAppointments([]);
          setTotalCount(0);
          window.alert("Failed to fetch appointments.");
        }
      })
      .catch(() => {
        setAppointments([]);
        setTotalCount(0);
        window.alert("Error fetching appointments.");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [debouncedSearchText, currentPage, pageSize, reloadKey.current]);

  // --- SESSION EDIT STATE on modal open ---
  useEffect(() => {
    setEditAllMode(false);
    setSubmittingAll(false);
    setSubmitAllError(null);
    if (!viewAppointment) {
      setSessionEditState({});
      setRequestEditMessage(null);
      setExpandedEditRequests({});
      return;
    }
    setExpandedEditRequests({});
    const pendingMap = getSessionPendingRequestMap(viewAppointment);
    const newState: SessionEditState = {};
    (viewAppointment.sessions || []).forEach((s, idx) => {
      const key = s._id || `idx${idx}`;
      const pendingReqVal = pendingMap[s._id ? s._id.toString?.() || `${s._id}` : key];
      newState[key] = {
        date: s.date,
        slotId: s.slotId || "",
        originalDate: s.date,
        originalSlotId: s.slotId || "",
        error: null,
        requested: !!pendingReqVal,
        status: pendingReqVal ? pendingReqVal.status : s.status,
        isEditedSlot: false,
        pendingRequestNewDate: pendingReqVal?.newDate || null,
        pendingRequestNewSlotId: pendingReqVal?.newSlotId || null,
      };
    });
    setSessionEditState(newState);
    setRequestEditMessage(null);
  }, [viewAppointment]);

  function reloadTableDataAfterEdit() {
    reloadKey.current += 1;
    setViewAppointment(null);
  }

  // --- HANDLERS ---
  function handleSearchInput(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);
    setCurrentPage(1);
  }
  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  }
  function handlePage(page: number) {
    const maxPage = Math.ceil(totalCount / pageSize) || 1;
    if (page < 1 || page > maxPage) return;
    setCurrentPage(page);
  }

  const handleEditAllClick = () => {
    setEditAllMode(true);
    setSubmitAllError(null);
    setRequestEditMessage(null);
    setSessionEditState((prev) => {
      const next: SessionEditState = {};
      for (const k in prev) next[k] = { ...prev[k], isEditedSlot: false };
      return next;
    });
  };

  const handleCancelEditAll = () => {
    setEditAllMode(false);
    setSubmitAllError(null);
    setRequestEditMessage(null);
    setSessionEditState((prev) => {
      const reset: SessionEditState = {};
      for (const key in prev) {
        reset[key] = {
          ...prev[key],
          date: prev[key].originalDate || prev[key].date,
          slotId: prev[key].originalSlotId || prev[key].slotId,
          isEditedSlot: false,
          error: null,
        };
      }
      return reset;
    });
  };

  const handleSubmitAllEdit = async () => {
    setSubmittingAll(true);
    setSubmitAllError(null);
    setRequestEditMessage(null);

    const sessionsToRequest = Object.entries(sessionEditState).filter(
      ([, v]) => !v.requested && v.isEditedSlot
    );

    for (const [k, v] of sessionsToRequest) {
      if (!v.date || !v.slotId) {
        setSessionEditState((prev) => ({
          ...prev,
          [k]: { ...prev[k], error: "Date and slot are required." },
        }));
        setSubmittingAll(false);
        setSubmitAllError("Please fill date & slot for all edited sessions.");
        return;
      }
      if (willSelectionBeLocked2Hr(v.date, v.slotId)) {
        setSessionEditState((prev) => ({
          ...prev,
          [k]: { ...prev[k], error: "Cannot request edit within 2 hours of the session." },
        }));
        setSubmittingAll(false);
        setSubmitAllError("One or more sessions cannot be edited less than 2 hours before scheduled time.");
        return;
      }
      // Block if slot is full
      const slotAvail = availabilityData[v.date]?.slots?.[v.slotId];
      if (slotAvail && slotAvail.available <= 0) {
        setSessionEditState((prev) => ({
          ...prev,
          [k]: { ...prev[k], error: "This slot is full. Please choose another." },
        }));
        setSubmittingAll(false);
        setSubmitAllError("One or more selected slots are full. Please choose different slots.");
        return;
      }
    }

    let sessionObjMap: Record<string, string | undefined> = {};
    if (viewAppointment && Array.isArray(viewAppointment.sessions)) {
      viewAppointment.sessions.forEach((s, idx) => {
        const key = s._id || `idx${idx}`;
        sessionObjMap[key] = s._id;
      });
    }

    const filteredRequests = sessionsToRequest
      .map(([k, v]) => ({
        sessionId: sessionObjMap[k],
        newDate: v.date,
        newSlotId: v.slotId,
      }))
      .filter((item) => !!item.sessionId);

    if (!filteredRequests.length) {
      setSubmittingAll(false);
      setSubmitAllError("Please modify at least one session's date or slot before submitting.");
      return;
    }

    const payload = {
      appointmentId: viewAppointment?._id,
      patientId: viewAppointment?.patient?.patientId,
      sessions: filteredRequests,
    };

    try {
      const patientToken = localStorage.getItem("patient-token");
      const resp = await fetch(`${API_BASE_URL}/api/parent/session-edit-request-bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(patientToken ? { Authorization: `${patientToken}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        let errText;
        try {
          const err = await resp.json();
          errText = err?.message || "Failed to request edit.";
        } catch {
          errText = "Failed to request edit.";
        }
        throw new Error(errText);
      }
      setSessionEditState((prev) => {
        const next = { ...prev };
        for (const [k] of sessionsToRequest) {
          next[k] = { ...next[k], requested: true, error: null, isEditedSlot: false };
        }
        return next;
      });
      setEditAllMode(false);
      setSubmittingAll(false);
      setRequestEditMessage("Edit request(s) sent to admin/center. Please wait for confirmation.");
      reloadTableDataAfterEdit();
    } catch (e: any) {
      setSubmittingAll(false);
      setSubmitAllError(e?.message || "Failed to request edit.");
    }
  };

  const toggleEditRequestExpand = (editRequestId: string) => {
    setExpandedEditRequests((prev) => ({ ...prev, [editRequestId]: !prev[editRequestId] }));
  };

  function findSessionOldDetails(sessionId: string, appointment: AppointmentType | null) {
    if (!appointment || !Array.isArray(appointment.sessions)) return {};
    for (const s of appointment.sessions) {
      if (s._id == sessionId) return { oldDate: s.date, oldSlotId: s.slotId };
    }
    for (const s of appointment.sessions) {
      if ("sessionId" in s && s.sessionId && s.sessionId.toString() === sessionId.toString())
        return { oldDate: s.date, oldSlotId: s.slotId };
    }
    return {};
  }

  function getMappedSessionIdForEditRequest(erSessionId: string, sessions: SessionType[]) {
    if (!erSessionId || !Array.isArray(sessions)) return null;
    for (const s of sessions) {
      if (s._id && s._id.toString() === erSessionId.toString()) return s.sessionId || "";
    }
    return erSessionId;
  }

  // --- RENDER ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Children's Appointments</h1>

      {/* Search & Pagination */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FiSearch className="text-blue-700 text-xl mr-1" />
          <input
            type="text"
            placeholder="Search by Children Name, ID, or Appointment ID"
            value={searchText}
            onChange={handleSearchInput}
            className="w-64 md:w-80 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <div className="flex items-center gap-2">
            <label className="font-medium mr-1 text-xs text-slate-600">Rows:</label>
            <select className="border rounded px-2 py-1 text-xs" value={pageSize} onChange={handlePageSizeChange}>
              {[5, 10, 20, 50].map((num) => (
                <option value={num} key={num}>{num}</option>
              ))}
            </select>
          </div>
          <PaginationNav currentPage={currentPage} pageSize={pageSize} totalCount={totalCount} onPage={handlePage} />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">Appointment ID</th>
                <th className="px-4 py-3 text-left">Children Name</th>
                <th className="px-4 py-3 text-left">Children ID</th>
                <th className="px-4 py-3 text-center"># Sessions</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-slate-400 text-center">No appointments found.</td>
                </tr>
              )}
              {appointments.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="px-4 py-4 font-semibold text-slate-700">{a.appointmentId || a._id}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                        <FiUser className="text-sky-600" />
                      </div>
                      <p className="font-medium text-slate-800">
                        {a.patient?.name || <span className="italic text-slate-400">N/A</span>}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {a.patient?.patientId ? (
                      <span className="inline-block rounded bg-blue-50 text-blue-700 px-2 py-1 text-xs font-semibold">
                        {a.patient.patientId}
                      </span>
                    ) : (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center font-semibold">
                    {Array.isArray(a.sessions) ? a.sessions.length : 0}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 text-blue-700 shadow-sm text-xs"
                      onClick={() => setViewAppointment(a)}
                    >
                      <FiCalendar className="text-blue-500" /> View / Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-end mt-2">
        {!loading && (
          <PaginationNav currentPage={currentPage} pageSize={pageSize} totalCount={totalCount} onPage={handlePage} />
        )}
      </div>

      {/* MODAL */}
      {viewAppointment && (
        <div className="fixed z-50 inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-3 right-4 text-xl text-slate-500 hover:text-red-500"
              onClick={() => setViewAppointment(null)}
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <FiCalendar className="inline text-blue-500" /> Appointment Details
            </h2>

            <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Booking ID</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={viewAppointment.appointmentId || viewAppointment._id}
                  readOnly disabled tabIndex={-1}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Children Name</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={viewAppointment.patient?.name || ""} readOnly disabled />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium text-slate-700">Children ID</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100"
                  value={viewAppointment.patient?.patientId || ""} readOnly disabled />
              </div>
            </div>

            {/* Edit Requests */}
            {Array.isArray(viewAppointment.editRequests) && viewAppointment.editRequests.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-blue-700 text-base flex items-center gap-2 mb-1">
                  Edit Requests ({viewAppointment.editRequests.length})
                </h3>
                <div className="bg-blue-50 border border-blue-100 rounded overflow-hidden text-xs">
                  {viewAppointment.editRequests
                    .slice()
                    .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
                    .map((editReq, idx) => {
                      const isExpanded = expandedEditRequests[editReq._id] ?? (idx === 0 || editReq.status === "pending");
                      return (
                        <div key={editReq._id} className="border-b last:border-0">
                          <button
                            className={`w-full text-left flex items-center gap-2 py-2 px-3 font-semibold ${
                              editReq.status === "pending" ? "text-blue-900"
                              : editReq.status === "approved" ? "text-green-800"
                              : "text-gray-600"
                            }`}
                            onClick={() => toggleEditRequestExpand(editReq._id)}
                          >
                            <FiChevronDown className={`inline transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            <span>Request #{idx + 1}</span>
                            <span className="ml-2 px-2 py-1 rounded text-xs capitalize font-bold border"
                              style={{
                                borderColor: editReq.status === "pending" ? "#60a5fa" : editReq.status === "approved" ? "#10b981" : "#aaa",
                                color: editReq.status === "pending" ? "#2563eb" : editReq.status === "approved" ? "#047857" : "#666",
                              }}
                            >
                              {editReq.status}
                            </span>
                            <span className="ml-auto text-xs text-slate-500 font-normal">
                              {editReq.createdAt ? dayjs(editReq.createdAt).format("DD MMM YYYY, h:mm A") : null}
                            </span>
                          </button>
                          {isExpanded && Array.isArray(editReq.sessions) && (
                            <div className="pb-2 px-6">
                              <table className="w-full text-xs border mb-1 mt-2">
                                <thead>
                                  <tr>
                                    <th className="py-1 px-2 text-left">S. No.</th>
                                    <th className="py-1 px-2 text-left">Session ID</th>
                                    <th className="py-1 px-2 text-left">New Date</th>
                                    <th className="py-1 px-2 text-left">New Slot</th>
                                    <th className="py-1 px-2 text-left">Old Date</th>
                                    <th className="py-1 px-2 text-left">Old Slot</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {editReq.sessions.map((sess, sidx) => {
                                    // Use all slots for display so can show old/new slot for edits of all types
                                    const slotLabel =
                                      SLOT_TIME_LOOKUP[sess.newSlotId]
                                        ? Object.entries(SLOT_TIME_LOOKUP).find(([id]) => id === sess.newSlotId)
                                            ? (SESSION_TIME_OPTIONS.find(opt => opt.id === sess.newSlotId)?.label ||
                                              (() => {
                                                // fallback: manual for limited slot display
                                                // slot label for limited (not in SESSION_TIME_OPTIONS, so print 24hr time)
                                                const slot = SLOT_TIME_LOOKUP[sess.newSlotId];
                                                return slot ? slot.start + " to " + slot.end : sess.newSlotId;
                                              })())
                                            : sess.newSlotId
                                        : sess.newSlotId;
                                    const { oldDate, oldSlotId } = findSessionOldDetails(sess.sessionId, viewAppointment);
                                    const oldSlotLabel = oldSlotId
                                      ? (SESSION_TIME_OPTIONS.find((opt) => opt.id === oldSlotId)?.label ||
                                          (() => {
                                            // fallback limited slot
                                            const slot = SLOT_TIME_LOOKUP[oldSlotId];
                                            return slot ? slot.start + " to " + slot.end : oldSlotId;
                                          })())
                                      : "";
                                    let displaySessionId: React.ReactNode = sess.sessionId || <span className="italic text-slate-400">N/A</span>;
                                    if (viewAppointment?.sessions && sess.sessionId) {
                                      const mappedSessionId = getMappedSessionIdForEditRequest(sess.sessionId, viewAppointment.sessions);
                                      if (mappedSessionId && mappedSessionId !== sess.sessionId) {
                                        displaySessionId = (
                                          <span>
                                            <span className="font-mono">{mappedSessionId}</span>
                                            <span className="text-[10px] text-slate-500 ml-1">(request id: <span className="font-mono">{sess.sessionId}</span>)</span>
                                          </span>
                                        );
                                      }
                                    }
                                    return (
                                      <tr key={sess.sessionId || sidx}>
                                        <td className="py-1 px-2">{sidx + 1}</td>
                                        <td className="py-1 px-2 font-mono text-slate-900">{displaySessionId}</td>
                                        <td className="py-1 px-2">{sess.newDate}</td>
                                        <td className="py-1 px-2">{slotLabel}</td>
                                        <td className="py-1 px-2">{oldDate ? dayjs(oldDate).format("YYYY-MM-DD") : "--"}</td>
                                        <td className="py-1 px-2">{oldSlotLabel || "--"}</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            <h3 className="font-semibold mb-2 mt-6 text-blue-900 flex items-center gap-2">
              Sessions
              {availabilityLoading && editAllMode && (
                <span className="text-[11px] text-sky-500 animate-pulse font-normal">Loading availability…</span>
              )}
            </h3>

            {requestEditMessage && (
              <div className="mb-3 px-3 py-2 bg-blue-50 text-blue-900 rounded text-xs">{requestEditMessage}</div>
            )}
            {submitAllError && (
              <div className="mb-3 px-3 py-2 bg-red-100 text-red-800 rounded text-xs">{submitAllError}</div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs border mb-2">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Session ID</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Slot</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(viewAppointment.sessions) && viewAppointment.sessions.length > 0 ? (
                    viewAppointment.sessions.map((s, idx) => {
                      const key = s._id || `idx${idx}`;
                      const localState = sessionEditState[key] || { date: s.date, slotId: s.slotId || "", status: s.status };
                      const alreadyRequested = localState.requested;
                      const alreadyApproved = localState.status === "approved";
                      const requestedNewDate = localState.pendingRequestNewDate ?? null;
                      const requestedNewSlotId = localState.pendingRequestNewSlotId ?? null;
                      const requestedNewSlotLabel = requestedNewSlotId
                        ? (
                          // get label for normal slots, or fallback to plain slotid for limited
                          SESSION_TIME_OPTIONS.find((opt) => opt.id === requestedNewSlotId)?.label ||
                          (() => {
                            const slot = SLOT_TIME_LOOKUP[requestedNewSlotId];
                            return slot ? slot.start + " to " + slot.end : requestedNewSlotId;
                          })()
                        )
                        : null;
                      const showEditedWarn = editAllMode && !alreadyRequested && localState.isEditedSlot;
                      const locked2hr = isSessionLocked2Hr(
                        localState.originalDate ?? localState.date,
                        localState.originalSlotId ?? localState.slotId
                      );

                      // Availability for this session's date (in edit mode use the edited date)
                      const activeDateForAvail = editAllMode ? localState.date : s.date;
                      const dayAvail = availabilityData[activeDateForAvail];
                      const slotsAvail = dayAvail?.slots || {};
                      const hasAvailData = Object.keys(slotsAvail).length > 0;

                      // Chosen slot availability bar (shown when a slot is selected in edit mode)
                      const chosenSlotAvail = localState.slotId ? slotsAvail[localState.slotId] : null;

                      return (
                        <tr key={key} className="border-t align-top">
                          <td className="px-3 py-2">{idx + 1}</td>
                          <td className="px-3 py-2 font-mono text-slate-900">
                            {s.sessionId || <span className="italic text-slate-400">N/A</span>}
                          </td>

                          {/* Date cell */}
                          <td className="px-3 py-2">
                            {editAllMode && !alreadyRequested ? (
                              <input
                                type="date"
                                className={`border rounded px-1 py-1 text-xs ${showEditedWarn ? "border-blue-500" : ""}`}
                                value={localState.date ? dayjs(localState.date).format("YYYY-MM-DD") : ""}
                                min={dayjs().format("YYYY-MM-DD")}
                                onChange={(e) => handleSessionFieldChange(key, "date", e.target.value)}
                                disabled={submittingAll || locked2hr}
                              />
                            ) : s.date ? (
                              dayjs(s.date).format("YYYY-MM-DD")
                            ) : "-"}

                            {alreadyRequested && requestedNewDate && requestedNewDate !== dayjs(s.date).format("YYYY-MM-DD") && (
                              <div className="text-blue-700 text-[11px] mt-1">
                                <span className="italic">Requested:</span> {requestedNewDate}
                              </div>
                            )}
                            {showEditedWarn && (
                              <div className="text-green-800 text-[10px] mt-1 flex items-center gap-1">
                                <FiEdit2 /> Changed
                              </div>
                            )}
                            {locked2hr && (
                              <div className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                                <FiX /> Can't edit within 2 hours
                              </div>
                            )}
                          </td>

                          {/* Slot cell */}
                          <td className="px-3 py-2 min-w-[220px]">
                            {editAllMode && !alreadyRequested ? (
                              <div>
                                <select
                                  className={`border rounded px-1 py-1 text-xs w-full ${showEditedWarn ? "border-blue-500" : ""}`}
                                  value={localState.slotId}
                                  onChange={(e) => handleSessionFieldChange(key, "slotId", e.target.value)}
                                  disabled={submittingAll || locked2hr}
                                >
                                  <option value="" disabled>Select Slot</option>
                                  {/* Changed: Removed 'Normal Slots' label, replaced with 'Slots' label */}
                                  <optgroup label="── Slots ──">
                                    {SESSION_TIME_OPTIONS.filter((o) => !o.limited).map((opt) => {
                                      const optionLocked = willSelectionBeLocked2Hr(localState.date, opt.id);
                                      const slotData = slotsAvail[opt.id];
                                      const isFull = slotData ? slotData.available <= 0 : false;
                                      const availText = !hasAvailData
                                        ? ""
                                        : isFull
                                        ? " — Full"
                                        : ` — ${slotData.available} left`;
                                      return (
                                        <option
                                          key={opt.id}
                                          value={opt.id}
                                          disabled={optionLocked || isFull}
                                          style={optionLocked || isFull ? { color: "#bbbbbb", background: "#f1f1f1" } : {}}
                                        >
                                          {opt.label}{availText}
                                          {optionLocked ? " - Not Available (<2hr)" : ""}
                                        </option>
                                      );
                                    })}
                                  </optgroup>
                                </select>

                                {/* Mini availability bar for chosen slot */}
                                {chosenSlotAvail && localState.slotId && (
                                  <div className="mt-1.5">
                                    <SlotAvailabilityBadge
                                      available={chosenSlotAvail.available}
                                      total={chosenSlotAvail.totalCapacity}
                                    />
                                  </div>
                                )}

                                {/* Day summary pills */}
                                {hasAvailData && activeDateForAvail && (
                                  <div className="flex gap-1 mt-1.5 flex-wrap">
                                    <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                                      {dayAvail?.summary?.normalAvailable ?? "?"}/{dayAvail?.summary?.totalNormalCapacity ?? "?"} normal
                                    </span>
                                    {/* 
                                      Limited slots summary removed from visible UI.
                                      If you want to show the summary, uncomment below.

                                      <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                                        {dayAvail?.summary?.limitedAvailable ?? "?"}/{dayAvail?.summary?.totalLimitedCapacity ?? "?"} limited
                                      </span>
                                    */}
                                  </div>
                                )}

                                {showEditedWarn && (
                                  <div className="text-green-800 text-[10px] mt-1 flex items-center gap-1">
                                    <FiEdit2 /> Changed
                                  </div>
                                )}
                                {editAllMode && locked2hr && (
                                  <div className="text-gray-500 text-[11px] mt-1 flex items-center gap-1">
                                    <FiX /> Can't edit within 2 hours
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span>
                                {
                                  SESSION_TIME_OPTIONS.find((opt) => opt.id === s.slotId)
                                    ? SESSION_TIME_OPTIONS.find((opt) => opt.id === s.slotId)?.label
                                    : (() => {
                                        // If this is a limited (hidden) slot, fall back to HH:mm time display
                                        const slot = SLOT_TIME_LOOKUP[s.slotId as string];
                                        return slot ? slot.start + " to " + slot.end : s.slotId || "--";
                                      })()
                                }
                              </span>
                            )}

                            {alreadyRequested && requestedNewSlotLabel && requestedNewSlotId !== s.slotId && (
                              <div className="text-blue-700 text-[11px] mt-1">
                                <span className="italic">Requested:</span> {requestedNewSlotLabel}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2 capitalize">
                            {localState.status && typeof localState.status === "string" ? (
                              localState.status
                            ) : (
                              <span className="italic text-slate-400">N/A</span>
                            )}
                            {alreadyRequested && (
                              <span className="ml-2 text-green-600 flex gap-1 items-center text-xs">
                                <FiCheck />
                                {alreadyApproved ? "Edit Approved" : "Requested"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-3 py-5 text-center text-slate-400">No session data</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {editAllMode && (
              <div className="mb-2 grid gap-1">
                {Object.entries(sessionEditState).map(([k, v]) =>
                  v.error ? (
                    <div key={k} className="text-red-600 text-xs">Session {k}: {v.error}</div>
                  ) : null
                )}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end mt-2">
              {editAllMode ? (
                <>
                  <button
                    className="flex items-center px-4 py-2 rounded bg-green-500 hover:bg-green-600 text-white font-medium text-xs gap-1"
                    disabled={submittingAll}
                    onClick={handleSubmitAllEdit}
                  >
                    {submittingAll ? <span className="animate-spin"><FiSave /></span> : <><FiSave /> Submit All Requests</>}
                  </button>
                  <button
                    className="px-4 py-2 rounded border font-semibold text-xs"
                    disabled={submittingAll}
                    onClick={handleCancelEditAll}
                  >
                    <FiX /> Cancel
                  </button>
                </>
              ) : (
                !appointmentHasPendingRequest(viewAppointment) &&
                Object.values(sessionEditState).some((v) => !v.requested) && (
                  <button
                    className="flex items-center px-4 py-2 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 text-blue-700 font-semibold text-xs gap-1"
                    onClick={handleEditAllClick}
                  >
                    <FiEdit2 /> Request Edit For Multiple Sessions
                  </button>
                )
              )}
              <button
                className="px-5 py-2 rounded border font-semibold"
                onClick={() => setViewAppointment(null)}
                disabled={submittingAll}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// --- PaginationNav ---
function PaginationNav({
  currentPage,
  pageSize,
  totalCount,
  onPage,
}: {
  currentPage: number;
  pageSize: number;
  totalCount: number;
  onPage: (page: number) => void;
}) {
  const maxPage = Math.max(1, Math.ceil((totalCount || 0) / pageSize));
  if (maxPage <= 1) return null;
  return (
    <div className="flex items-center gap-1 select-none">
      <button onClick={() => onPage(1)} disabled={currentPage === 1} className="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" aria-label="First">
        <FiChevronsLeft />
      </button>
      <button onClick={() => onPage(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" aria-label="Previous">
        <FiChevronLeft />
      </button>
      <span className="mx-2 text-xs font-semibold">Page {currentPage} of {maxPage}</span>
      <button onClick={() => onPage(currentPage + 1)} disabled={currentPage === maxPage} className="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" aria-label="Next">
        <FiChevronRight />
      </button>
      <button onClick={() => onPage(maxPage)} disabled={currentPage === maxPage} className="px-2 py-1 rounded border text-xs disabled:opacity-40" type="button" aria-label="Last">
        <FiChevronsRight />
      </button>
      <span className="ml-2 text-slate-500 text-xs">({totalCount} total)</span>
    </div>
  );
}