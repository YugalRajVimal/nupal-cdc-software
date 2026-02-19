import React, { useEffect, useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiUser,
  FiTag,
  FiX,
  FiEdit2,
  FiSearch
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants and helpers
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Patient = {
  _id: string;
  patientId?: string;
  name: string;
  [key: string]: any;
};
type Therapy = { _id: string; name: string };

type ConsultationSession = { date: string; time: string; _id?: string };
type ConsultationBooking = {
  _id: string;
  patient?: Patient | null; // in new backend this might be missing or null
  client?: Patient | null; // the backend field name is client
  patientId?: string; // for display, derived
  therapyType?: Therapy;
  therapy?: Therapy;
  sessions?: ConsultationSession[];
  scheduledAt?: string; // ISO string
  time?: string;
  durationMinutes?: number;
  remark?: string;
  description?: string;
  status: "pending" | "approved" | "cancelled" | "rejected";
  sessionType: "online" | "in-person";
  createdAt?: string;
  updatedAt?: string;
  consultationAppointmentId?: string;
};

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function getDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const DEFAULT_PAGE_SIZE = 5;

/** For time math */
function addMinutesToTimeStr(time: string, minutes: number): string {
  const [hh, mm] = time.split(":").map(Number);
  const date = new Date(2000, 0, 1, hh, mm); // dummy date
  date.setMinutes(date.getMinutes() + minutes);
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

// Format an ISO date string as YYYY-MM-DD
function formatDateISO(dateString?: string) {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

// Format a time string HH:mm or date string
function formatTime(timeString?: string) {
  // timeString like: "00:12" or "2026-02-12T00:12:00.000Z"
  if (!timeString) return "";
  if (timeString.length === 5 && timeString[2] === ":") return timeString;
  // try to extract time from ISO string
  const d = new Date(timeString);
  if (isNaN(d.getTime())) return timeString;
  return pad2(d.getHours()) + ":" + pad2(d.getMinutes());
}

// Single session extraction for "flat" records (i.e. no .sessions array)
function getSingleSession(bk: ConsultationBooking): ConsultationSession | null {
  if (bk.scheduledAt && bk.time) {
    return {
      date: formatDateISO(bk.scheduledAt),
      time: bk.time,
    };
  }
  if (bk.scheduledAt) {
    // fallback if only ISO datetime provided
    const date = formatDateISO(bk.scheduledAt);
    const time = formatTime(bk.scheduledAt);
    return { date, time };
  }
  return null;
}

// Try to resolve patient display from patient, client, or fallback
function getPatientDisplayName(patient: Patient | undefined | null, fallbackPatientId?: string): string {
  if (!patient) {
    if (fallbackPatientId) return fallbackPatientId;
    return "";
  }
  const name = patient.name;
  const pid = patient.patientId ? patient.patientId : "";
  return pid ? `${name} (${pid})` : name ?? "";
}

export default function ConsultationBooking() {
  const [loading, setLoading] = useState<boolean>(true);
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());

  // Form state
  const [patientId, setPatientId] = useState<string>("");
  const [therapyTypeId, setTherapyTypeId] = useState<string>("");
  // Only 1 session: keep as single date and time field
  const [sessionDate, setSessionDate] = useState<string>("");
  const [sessionTime, setSessionTime] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  // NEW: sessionType state
  const [sessionType, setSessionType] = useState<"online" | "in-person">("online");

  // Data lists
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapyTypes, setTherapyTypes] = useState<Therapy[]>([]);

  // Bookings
  const [consultationBookings, setConsultationBookings] = useState<ConsultationBooking[]>([]);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  // Status flags/messages
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Pagination & Search
  const [search, setSearch] = useState<string>("");
  const [searchImmediate, setSearchImmediate] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Fetch master data */
  useEffect(() => {
    async function fetchMasterData() {
      setDataLoading(true);
      try {
        const token = localStorage.getItem("patient-token");
        const res = await fetch(`${API_BASE_URL}/api/parent/request-appointment-homepage`, {
          headers: { ...(token ? { Authorization: token } : {}) }
        });
        const json = await res.json();
        let processedPatients: Patient[] = [];
        if (Array.isArray(json.patients)) {
          processedPatients = json.patients.map((raw: any) => ({
            _id: raw.id || raw._id,
            name: raw.name || raw?.userId?.name || "",
            patientId: raw.patientId || ""
          }));
        }
        setPatients(processedPatients);
        setTherapyTypes(Array.isArray(json.therapyTypes) ? json.therapyTypes : []);
      } catch {
        setPatients([]);
        setTherapyTypes([]);
        toast.error("Failed to load master data");
      }
      setDataLoading(false);
    }
    fetchMasterData();
  }, []);

  // List/load all bookings
  const fetchConsultationBookings = useCallback(async () => {
    setLoading(true);
    try {
      const patientToken = localStorage.getItem("patient-token");
      const res = await fetch(`${API_BASE_URL}/api/parent/consultation-bookings`, {
        headers: { ...(patientToken ? { Authorization: `${patientToken}` } : {}) }
      });
      const data = await res.json();

      // Defensive parse for mixed API response shape
      let bookingsRaw: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data.bookings)
        ? data.bookings
        : [];

      // Map/normalize into ConsultationBooking[]
      const bookings: ConsultationBooking[] = bookingsRaw.map((bk: any) => {
        const hasSessions = Array.isArray(bk.sessions) && bk.sessions.length > 0;
        // Accept patient/patientId/client shape
        let patientObj: Patient | null = bk.patient || bk.client || null;
        // Accept therapyType/therapy
        let therapyObj: Therapy | null = bk.therapyType || bk.therapy || null;
        return {
          ...bk,
          // fallback fields for display/search/logic
          patient: patientObj,
          therapyType: therapyObj,
          sessions: hasSessions
            ? bk.sessions.map((s: any) => ({ ...s }))
            : undefined,
          patientId:
            patientObj?.patientId ||
            bk.patientId ||
            (typeof patientObj?._id === "string" ? patientObj._id : ""),
          reason: bk.reason ?? bk.description ?? "",
        };
      });

      setConsultationBookings(bookings);
      console.log(bookings);
    } catch {
      setConsultationBookings([]);
      toast.error("Failed to fetch consultation bookings");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!dataLoading) fetchConsultationBookings();
  }, [dataLoading, fetchConsultationBookings]);

  // On edit: populate fields
  useEffect(() => {
    if (!editBookingId) return;
    const booking = consultationBookings.find((b) => b._id === editBookingId);
    if (booking) {
      // Try to use normalized shape and fallback where needed
      let editPatientId =
        booking.patient?._id || booking.client?._id || booking.patientId || "";
      let editTherapyId = booking.therapyType?._id || booking.therapy?._id || "";
      setPatientId(editPatientId);
      setTherapyTypeId(editTherapyId);
      setReason(booking.remark || booking.description || "");
      setSessionType((booking.sessionType as "online" | "in-person") || "online");

      // Extract session info from sessions array or from flat fields
      if (Array.isArray(booking.sessions) && booking.sessions.length > 0) {
        setSessionDate(booking.sessions[0].date || "");
        setSessionTime(booking.sessions[0].time || "");
      } else if (booking.scheduledAt && booking.time) {
        setSessionDate(formatDateISO(booking.scheduledAt));
        setSessionTime(booking.time);
      } else {
        setSessionDate("");
        setSessionTime("");
      }
    }
  }, [editBookingId, consultationBookings]);

  function resetForm() {
    setPatientId("");
    setTherapyTypeId("");
    setSessionDate("");
    setSessionTime("");
    setReason("");
    setSessionType("online");
    setEditBookingId(null);
    setBookingError(null);
    setBookingSuccess(null);
  }

  // --- Limit: only 1 session allowed ---
  // Session selecting via calendar: only 1 date/session possible
  const addSessionForDate = (day: number) => {
    const dateKey = getDateKey(year, month + 1, day);
    setSessionDate(dateKey);
  };

  // Remove selected session
  const removeSession = () => {
    setSessionDate("");
    setSessionTime("");
  };

  const selectedPatient = patients.find((p) => p._id === patientId) || null;
  const selectedTherapyType = therapyTypes.find((t) => t._id === therapyTypeId) || null;

  // Can submit
  const canSubmit =
    !!selectedPatient && !!selectedTherapyType && !!sessionDate && !!sessionTime && reason.length >= 5;

  // Add/Edit Booking
  const handleBookOrUpdate = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    setBookingSuccess(null);
    setBookingError(null);

    if (!canSubmit) {
      setBookingError("All fields required. Reason must be at least 5 chars. Set date & time.");
      toast.error("Please fill all required fields and specify date & time, and provide a valid reason.");
      return;
    }
    setBookingLoading(true);

    // For backend, produce "scheduledAt" (date+time in ISO) and "time" (HH:mm string); always 15min duration
    const scheduledAtISO = `${sessionDate}T${sessionTime}:00.000Z`; // assumes UTC
    const payload: any = {
      patient: patientId,
      therapyType: therapyTypeId,
      scheduledAt: scheduledAtISO,
      time: sessionTime,
      durationMinutes: 15,
      reason: reason.trim(),
      sessionType,
    };
    try {
      let res: Response, result: any;
      if (!editBookingId) {
        res = await fetch(`${API_BASE_URL}/api/parent/consultation-booking`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${localStorage.getItem("patient-token") || ""}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/parent/consultation-bookings/${editBookingId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${localStorage.getItem("patient-token") || ""}`,
          },
          body: JSON.stringify(payload),
        });
      }
      let rawText = await res.text();
      try {
        result = JSON.parse(rawText);
      } catch {
        result = null;
      }
      if (!res.ok || (result && result.error)) {
        let message = (result && (result.message || result.error)) || "Booking operation failed.";
        setBookingError(message);
        toast.error(message);
        setBookingLoading(false);
        return;
      }
      const successMsg = !editBookingId ? "Booking request submitted." : "Booking updated.";
      setBookingSuccess(successMsg);
      toast.success(successMsg);
      await fetchConsultationBookings();
      resetForm();
    } catch (e: any) {
      const msg =
        typeof e === "object" && e !== null && "message" in e && e.message
          ? e.message
          : editBookingId
          ? "Failed to update."
          : "Booking failed.";
      setBookingError(msg);
      toast.error(msg);
    }
    setBookingLoading(false);
  };

  // Pagination & search (frontend)
  const filteredBookings = (() => {
    if (!search) return consultationBookings;
    const term = search.toLowerCase();
    return consultationBookings.filter((b) => {
      // Consider all fields that could hold search terms; fallback for new backend shapes
      const patient = b.patient || b.client;
      const therapyType = b.therapyType || b.therapy;
      return (
        getPatientDisplayName(patient, b.patientId)?.toLowerCase().includes(term) ||
        b.patientId?.toLowerCase().includes(term) ||
        therapyType?.name?.toLowerCase().includes(term) ||
        b.status?.toLowerCase().includes(term) ||
        (Array.isArray(b.sessions) &&
          b.sessions.some(
            (sess) =>
              (sess.date && String(sess.date).toLowerCase().includes(term)) ||
              (sess.time && sess.time.toLowerCase().includes(term))
          )) ||
        // for flat scheduledAt/time records, check both
        (!!b.scheduledAt && formatDateISO(b.scheduledAt).includes(term)) ||
        (!!b.time && b.time.includes(term))
      );
    });
  })();
  const paginatedBookings = (() => {
    const start = (page - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  })();
  const totalFiltered = filteredBookings.length;
  const lastPage = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Reset page to 1 if search/filters change and out-of-bound
  useEffect(() => {
    if ((page - 1) * pageSize >= totalFiltered) {
      setPage(1);
    }
  }, [search, pageSize, totalFiltered]);

  // Debounced search input
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current as any);
    searchTimer.current = setTimeout(() => {
      setSearch(searchImmediate.trim());
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current as any);
    };
  }, [searchImmediate]);

  // Calendar month nav
  const changeMonth = (direction: "prev" | "next") => {
    if (direction === "prev") {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
  };

  // ------- RENDER --------

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8">
      <div className="flex md:flex-row flex-col-reverse gap-6">
        {/* Calendar for Session Selection */}
        <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <FiCalendar />
              {new Date(year, month).toLocaleString("default", { month: "long" })} {year}
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeMonth("prev")} className="p-2 border rounded" type="button">
                <FiChevronLeft />
              </button>
              <button onClick={() => changeMonth("next")} className="p-2 border rounded" type="button">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-xs text-slate-500 border-b">
            {DAYS.map((d) => (
              <div key={d} className="p-2 text-center font-medium">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: getStartDay(year, month) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border" />
            ))}
            {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
              const day = i + 1;
              const dateKey = getDateKey(year, month + 1, day);
              const isSelected = sessionDate === dateKey;
              return (
                <div
                  key={day}
                  onClick={() => addSessionForDate(day)}
                  className={`h-24 border cursor-pointer flex flex-col justify-between p-2 transition
                    ${isSelected ? "bg-blue-50 border-blue-400" : "hover:bg-slate-50"}
                  `}
                >
                  <div className="flex flex-col justify-start">
                    <div
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                        isSelected ? "bg-blue-600 text-white" : ""
                      }`}
                    >
                      {day}
                    </div>
                    {isSelected && (
                      <div className="mt-1 text-xs text-blue-700 font-medium">
                        1 Session
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 pt-2 pb-1 text-xs text-slate-600">
            Click a date to select session date (only one allowed).
            {sessionDate && (
              <button
                onClick={removeSession}
                type="button"
                className="inline-flex items-center ml-2 text-red-500 border px-2 py-0.5 rounded text-xs"
                style={{ marginLeft: "8px" }}
              >
                <FiX className="inline" /> Deselect
              </button>
            )}
          </div>
        </div>

        {/* Consultation Booking Form */}
        <div className="flex-1 bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">
            {editBookingId ? "Edit Consultation Booking" : "New Consultation Booking"}
            {editBookingId && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
                Editing
              </span>
            )}
          </h3>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiUser /> Patient Name
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            disabled={!!editBookingId}
          >
            <option value="">Select Patient</option>
            {patients.map((patient) => (
              <option key={patient._id} value={patient._id}>
                {getPatientDisplayName(patient)}
              </option>
            ))}
          </select>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiTag /> Therapy Type
          </label>
          <select
            value={therapyTypeId}
            onChange={(e) => setTherapyTypeId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Therapy Type</option>
            {therapyTypes.map((tt) => (
              <option key={tt._id} value={tt._id}>
                {tt.name}
              </option>
            ))}
          </select>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiClock /> Reason for Consultation
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3 min-h-[60px]"
            placeholder="Please briefly describe your concern (min 5 characters)."
            minLength={5}
            maxLength={250}
          />

          {/* Session Type */}
          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiTag /> Session Type
          </label>
          <div className="w-full flex gap-4 mb-3">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="online"
                checked={sessionType === "online"}
                onChange={() => setSessionType("online")}
                className="accent-blue-600"
              />
              Online
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="in-person"
                checked={sessionType === "in-person"}
                onChange={() => setSessionType("in-person")}
                className="accent-blue-600"
              />
              In-person
            </label>
          </div>

          {/* Session Date & Time Input */}
          <div className="mb-4 space-y-3">
            <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
              <FiClock /> Session Date &amp; Start Time
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="border rounded px-2 py-1"
                min={today.toISOString().slice(0, 10)}
                required
              />
              <input
                type="time"
                value={sessionTime}
                onChange={(e) => setSessionTime(e.target.value)}
                className="border rounded px-2 py-1"
                required
                step={60} // allow 1 min steps
              />
              {sessionDate && sessionTime && (
                <span className="text-xs text-blue-600 ml-2">
                  {sessionTime} - {addMinutesToTimeStr(sessionTime, 15)}
                </span>
              )}
              {(sessionDate || sessionTime) && (
                <button
                  type="button"
                  title="Clear selection"
                  className="ml-2 px-2 py-1 rounded border border-red-300 text-red-600 bg-white hover:bg-red-50 transition"
                  onClick={removeSession}
                  style={{ display: "inline-flex", alignItems: "center" }}
                >
                  <FiX /> {!sessionDate && sessionTime ? "Clear Time" : "Remove"}
                </button>
              )}
            </div>
            {(!sessionDate || !sessionTime) && (
              <div className="text-xs text-red-500 ml-2">
                Please select both date and time.
              </div>
            )}
          </div>

          {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
          {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}

          <div className="flex gap-2">
            <button
              disabled={!canSubmit || bookingLoading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              onClick={handleBookOrUpdate}
              type="button"
            >
              {bookingLoading
                ? editBookingId
                  ? "Updating..."
                  : "Submitting..."
                : editBookingId
                ? "Update"
                : "Submit"}
            </button>
            {editBookingId && (
              <button
                className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
                type="button"
                onClick={resetForm}
              >
                <FiX className="inline mr-1" />
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List of submitted consultation bookings */}
      <div className="mt-8">
        <div className="bg-white border rounded-lg p-4 text-sm">
          <p className="font-medium mb-2 flex items-center gap-2">
            <span>Consultation Booking List</span>
            {loading && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
                Loading…
              </span>
            )}
          </p>
          {/* Search and pagination controls (outside list/table) */}
          <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-6 mb-4">
            <div className="flex flex-row items-center gap-2">
              <FiSearch />
              <input
                type="text"
                value={searchImmediate}
                placeholder="Search by patient / therapy / status / date"
                className="px-2 py-1 border rounded text-sm w-64"
                onChange={(e) => setSearchImmediate(e.target.value)}
                spellCheck={false}
              />
              {!!searchImmediate && (
                <button
                  className="text-xs px-2 py-1 text-gray-600 hover:text-red-600"
                  onClick={() => {
                    setSearchImmediate("");
                    setSearch("");
                  }}
                  title="Clear Search"
                  type="button"
                >
                  <FiX />
                </button>
              )}
            </div>
            <div className="flex flex-row items-center gap-2">
              <label htmlFor="page-size" className="text-xs text-slate-600">
                Show
              </label>
              <select
                id="page-size"
                value={pageSize}
                className="border px-2 py-1 rounded text-xs"
                onChange={(e) => setPageSize(Number(e.target.value))}
              >
                {[5, 10, 25].map((sz) => (
                  <option value={sz} key={sz}>
                    {sz}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-600">per page</span>
            </div>
            <div className="flex-1 flex flex-row justify-end items-center gap-2">
              <span className="text-xs text-slate-500">
                {totalFiltered === 0
                  ? "No "
                  : `Showing ${
                      paginatedBookings.length > 0 ? (page - 1) * pageSize + 1 : 0
                    }-${(page - 1) * pageSize + paginatedBookings.length} of ${totalFiltered} `}
                results
              </span>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded bg-gray-50 hover:bg-blue-100 disabled:opacity-60"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <FiChevronLeft />
              </button>
              <span className="text-xs font-mono">
                {page} / {lastPage}
              </span>
              <button
                type="button"
                className="text-xs px-2 py-1 border rounded bg-gray-50 hover:bg-blue-100 disabled:opacity-60"
                disabled={page >= lastPage}
                onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
          {paginatedBookings.length === 0 ? (
            <div>
              <p className="text-slate-500 mb-3">
                No consultation bookings found
                {search ? " for your search." : "."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {paginatedBookings.map((bk) => {
                // Normalize patient & therapy fields for display (support backend shape)
                const patient = bk.patient || bk.client;
                const therapyType = bk.therapyType || bk.therapy;
                // Normalize reason/description
                const reasonDisplay = bk.remark ?? bk.description ?? "";
                // Sessions
                let session: ConsultationSession | null = null;
                if (Array.isArray(bk.sessions) && bk.sessions.length > 0) {
                  // Should only be 1 session per requirements
                  const firstSession = bk.sessions[0];
                  session = {
                    ...firstSession,
                    date: firstSession?.date ?? "",
                    time: firstSession?.time ?? "",
                  };
                } else {
                  const flatSession = getSingleSession(bk);
                  if (flatSession) session = flatSession;
                }
                return (
                  <div className={`border p-3 rounded bg-sky-50 relative`} key={bk._id}>
                    <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      {getPatientDisplayName(patient, bk.patientId)}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiTag className="text-slate-500" />
                      <span className="text-slate-700">{therapyType?.name}</span>
                    </div>
                    <div className="mb-1 text-xs text-slate-800">
                      Reason: <span className="italic">{reasonDisplay}</span>
                    </div>
                    <div className="mb-1 text-xs text-slate-700">
                      <span className="font-medium">Session Type:</span>{" "}
                      <span>
                        {bk.sessionType === "online"
                          ? "Online"
                          : bk.sessionType === "in-person"
                          ? "In-person"
                          : ""}
                      </span>
                    </div>
                    {/* Single session details */}
                    {session && (
                      <div className="mb-2 text-xs text-slate-700 flex items-center gap-4">
                        <span>
                          <span className="font-medium">Date:</span>{" "}
                          {session.date || ""}
                        </span>
                        <span>
                          <span className="font-medium">Time:</span>{" "}
                          {session.time || ""}
                        </span>
                        <span>
                          <span className="font-medium">Ends At:</span>{" "}
                          {session.time ? addMinutesToTimeStr(session.time, bk.durationMinutes ?? 15) : ""}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase
                        ${
                          bk.status === "pending"
                            ? "bg-yellow-200 text-yellow-900"
                            : bk.status === "approved"
                            ? "bg-green-200 text-green-900"
                            : bk.status === "rejected"
                            ? "bg-red-200 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }
                      `}
                      >
                        {bk.status}
                      </span>
                      {bk.status === "pending" && (
                        <div className="flex gap-2">
                          <button
                            className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                            title="Edit consultation booking"
                            type="button"
                            onClick={() => {
                              setEditBookingId(bk._id);
                              setBookingError(null);
                              setBookingSuccess(null);
                            }}
                          >
                            <FiEdit2 /> Edit
                          </button>
                          {/* Delete button removed */}
                        </div>
                      )}
                    </div>
                    {editBookingId === bk._id && (
                      <div className="absolute -top-2 right-2">
                        <span className="text-blue-800 text-xs bg-blue-200 px-2 py-0.5 rounded font-bold shadow">
                          Editing
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}