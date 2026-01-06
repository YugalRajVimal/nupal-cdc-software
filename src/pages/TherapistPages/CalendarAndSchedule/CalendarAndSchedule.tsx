import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiTag,
  FiPackage,
  FiHash,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const SESSION_TIME_OPTIONS = [
  { id: "0830-0915", label: "08:30 to 09:15", limited: true },
  { id: "0915-1000", label: "09:15 to 10:00", limited: true },
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
  { id: "1800-1845", label: "18:00 to 18:45", limited: true },
  { id: "1845-1930", label: "18:45 to 19:30", limited: true },
  { id: "1930-2015", label: "19:30 to 20:15", limited: true },
];

type Patient = {
  id?: string;
  name?: string;
  phoneNo?: string;
  userId?: {
    name?: string;
  } | string;
  mobile1?: string;
  email?: string;
  [key: string]: any;
};

type Therapy = {
  _id?: string;
  name?: string;
};

type Package = {
  _id?: string;
  name?: string;
  totalSessions?: number;
  costPerSession?: number;
  totalCost?: number;
  sessionCount?: number;
};

type BookingSession = { date: string; slotId: string; _id?: string };

type DiscountInfo = {
  discountEnabled?: boolean;
  discount?: number;
  couponCode?: string;
  validityDays?: number;
  coupon?: any;
};

type Booking = {
  _id: string;
  appointmentId?: string;
  patient: Patient | null;
  therapy?: Therapy | string | null;
  package: Package | null | undefined;
  sessions: BookingSession[];
  discountInfo?: DiscountInfo;
  discount?: number;
  couponCode?: string;
  couponValidityDays?: number;
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

function getPatientDisplayName(patient: Patient | undefined | null) {
  if (!patient) return "";
  if (typeof patient === "string") return patient;
  const name =
    (patient.userId && typeof patient.userId === "object" && patient.userId.name) ||
    patient.name ||
    "";
  const phone = patient.phoneNo || patient.mobile1 || "";
  return phone ? `${name}${phone ? ` (${phone})` : ""}` : name;
}
function getPackageDisplay(pkg: Package | null | undefined) {
  if (!pkg) return "—";
  const sessions =
    pkg.totalSessions ||
    pkg.sessionCount ||
    (() => {
      const m = pkg.name?.match(/^\s*(\d+)[^\d]/);
      return m ? Number(m[1]) : undefined;
    })();
  const totalCost = pkg.totalCost;
  const costPerSession =
    pkg.costPerSession ||
    (totalCost && sessions ? Math.round(totalCost / sessions) : undefined);
  let parts = [];
  if (pkg.name) {
    parts.push(pkg.name);
  }
  if (sessions || totalCost) {
    const subparts = [];
    if (totalCost) subparts.push("Total Cost " + totalCost);
    if (costPerSession) subparts.push(`[${costPerSession}]`);
    if (subparts.length > 0) parts.push(subparts.join(" "));
  }
  return parts.join("; ");
}

function parseTherapy(therapy: any): Therapy | null {
  if (!therapy) return null;
  if (typeof therapy === "string") return { _id: therapy, name: therapy };
  if (typeof therapy === "object" && therapy.name) return therapy;
  return null;
}

export default function CalendarAndSchedule() {
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Calendar
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // Normalize incoming API data (match keys, ensure property shape, etc.)
  function normalizeBookings(list: any[]): Booking[] {
    return (list || []).map((b: any, idx: number) => {
      // Some fallback for _id for missing ones
      const fallbackId =
        b._id ||
        b.appointmentId ||
        (b.sessions && b.sessions.length > 0 && b.sessions[0]._id) ||
        `booking-fallback-${idx}`;

      // Patch package type
      let pkg: Package | null = null;
      if (b.package && typeof b.package === "object") {
        pkg = {
          ...b.package,
          sessionCount: b.package.sessionCount,
          costPerSession: b.package.costPerSession,
          name: b.package.name,
          totalSessions: b.package.totalSessions,
          totalCost: b.package.totalCost,
        };
      }

      // Patch therapy type if possible
      let therapyObj: Therapy | null = parseTherapy(b.therapy);

      // Patch sessions format
      let normalizedSessions =
        Array.isArray(b.sessions) &&
        b.sessions.map((s: any) => ({
          ...s,
          slotId: s.slotId || s.time || "",
        }));

      // Patch patient (sometimes string, usually object)
      let patient = b.patient;
      if (
        patient &&
        typeof patient === "object" &&
        patient.userId &&
        typeof patient.userId === "string" &&
        patient.name
      ) {
        // Attach name if missing
        patient = {
          ...patient,
          userId: {
            name: patient.name,
          },
        };
      } else if (
        patient &&
        typeof patient === "object" &&
        !patient.userId &&
        typeof patient.name === "string"
      ) {
        patient = {
          ...patient,
          userId: {
            name: patient.name,
          },
        };
      }

      return {
        ...b,
        _id: fallbackId,
        appointmentId: b.appointmentId,
        package: pkg,
        sessions: normalizedSessions,
        patient,
        therapy: therapyObj,
        discountInfo: b.discountInfo || undefined,
      };
    });
  }

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/therapist/appointments`);
      const json = await res.json();
      let datalist =
        Array.isArray(json.data) && json.success
          ? json.data
          : Array.isArray(json.bookings)
            ? json.bookings
            : [];
      setBookings(normalizeBookings(datalist));
    } catch {
      setBookings([]);
      toast.error("Failed to fetch bookings list.");
    }
  }, []);

  useEffect(() => {
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchBookings();
    }
  }, [dataLoading, loading, fetchBookings]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // --- Map all sessions to a map per date
  // Eg. { '2026-01-02': [ { booking, sessionObj, ... } ], ... }
  const sessionMap = useMemo(() => {
    const map: {
      [date: string]: {
        booking: Booking;
        session: BookingSession;
        patient: Patient | null;
        therapy: Therapy | null;
        pkg: Package | null;
      }[];
    } = {};
    bookings.forEach((booking) => {
      if (Array.isArray(booking.sessions)) {
        booking.sessions.forEach((session) => {
          if (!session.date) return;
          if (!map[session.date]) map[session.date] = [];
          map[session.date].push({
            booking,
            session,
            patient: booking.patient,
            therapy: booking.therapy ? (booking.therapy as Therapy) : null,
            pkg: booking.package || null,
          });
        });
      }
    });
    return map;
  }, [bookings]);

  // Helper: get session list for the displayed calendar month
  function getSessionsForDay(day: number) {
    // For the current calendar year and month, get all sessions for this date
    const mth = month + 1;
    // pad mth and day to 2 digits
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const dateStr = `${year}-${pad(mth)}-${pad(day)}`;
    return sessionMap[dateStr] || [];
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold"
        >
          Loading Bookings & Data…
        </motion.div>
      </div>
    );
  }

  const changeMonth = (dir: "prev" | "next") => {
    if (dir === "prev") {
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 flex h-full"
    >
      {/* Calendar with sessions displayed per day */}
      <div className="flex flex-2 md:flex-row flex-col-reverse gap-6 w-full">
        <div className="flex-2 lg:col-span-2 bg-white border rounded-lg flex flex-col h-[70vh] min-h-[440px]">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <FiCalendar />
              {new Date(year, month).toLocaleString("default", {
                month: "long",
              })}{" "}
              {year}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeMonth("prev")}
                className="p-2 border rounded"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={() => changeMonth("next")}
                className="p-2 border rounded"
              >
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
          <div className="grid grid-cols-7 flex-1 overflow-auto">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-28 border bg-slate-50" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
              const day = dayIdx + 1;
              const sessions = getSessionsForDay(day);
              return (
                <div
                  key={`day-${day}`}
                  className="h-28 border p-2 align-top flex flex-col justify-between items-start text-sm text-left relative"
                  style={{
                    background:
                      day === today.getDate() &&
                      month === today.getMonth() &&
                      year === today.getFullYear()
                        ? "#f0f9ff"
                        : undefined,
                    overflow: "auto",
                  }}
                >
                  <div
                    className="font-semibold text-center select-none mb-1"
                    style={{
                      color:
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear()
                          ? "#0ea5e9"
                          : undefined,
                    }}
                  >
                    {day}
                  </div>
                  {sessions.length > 0 && (
                    <div className="flex flex-col gap-1">
                      {sessions.map((obj, idx) => {
                        const slot = SESSION_TIME_OPTIONS.find(
                          (opt) => opt.id === obj.session.slotId
                        );
                        return (
                          <div
                            key={obj.session._id || `${obj.session.date}-${obj.session.slotId}-${idx}`}
                            className={`rounded border flex flex-col justify-end border-sky-300 px-1 py-0.5 bg-sky-50 text-xs ${
                              slot && slot.limited ? "border-orange-400 bg-orange-50" : ""
                            }`}
                          >
                            <span className="font-bold text-indigo-900">
                              {getPatientDisplayName(obj.patient)}
                            </span>
                            {/* <br />
                            <span>
                              <span className="text-sky-700">
                                {slot ? slot.label : obj.session.slotId}
                              </span>
                              {slot && slot.limited && (
                                <span className="ml-1 text-amber-600 font-semibold"> (Limited)</span>
                              )}
                            </span>

                            {obj.therapy && obj.therapy.name && (
                              <span className="block text-blue-700 font-medium mt-0.5">
                                {obj.therapy.name}
                              </span>
                            )}

                            {obj.booking.appointmentId && (
                              <span className="block text-[10px] text-gray-600 mt-0.5">
                                ID: {obj.booking.appointmentId}
                              </span>
                            )} */}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {/* Booking Summary */}
        <div className="flex-1 h-[70vh] min-h-[440px] flex flex-col">
          <div className="bg-white h-full border rounded-lg p-4 text-sm flex flex-col">
            <p className="font-medium mb-2">Booking Summary</p>
            {bookings && bookings.length === 0 ? (
              <div>
                <p className="text-slate-500 mb-3">No bookings found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 overflow-auto">
                {bookings.map((booking) => (
                  <div
                    className="border p-3 rounded bg-sky-50 relative"
                    key={booking._id}
                  >
                    {/* Appointment ID display row, non-editable, always available */}
                    {booking.appointmentId && (
                      <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gray-700">
                        <FiHash className="text-blue-500" />{" "}
                        <span>Appointment ID: {booking.appointmentId}</span>
                      </div>
                    )}
                    <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      {getPatientDisplayName(booking.patient)}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiTag className="text-slate-500" />
                      <span className="text-slate-700">
                        {(booking.therapy && typeof booking.therapy === "object"
                          ? booking.therapy?.name
                          : booking.therapy) || "—"}
                      </span>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiPackage className="text-purple-500" />
                      <span className="text-purple-700">
                        {getPackageDisplay(booking.package)}
                      </span>
                    </div>
                    {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
                      <details className="mb-1 text-xs text-slate-700 group">
                        <summary className="cursor-pointer select-none font-medium flex items-center group-open:mb-2">
                          <span>Sessions & Times:</span>
                          <span className="ml-2 text-slate-500 text-xs font-normal">
                            ({booking.sessions.length})
                          </span>
                          <svg
                            className="ml-1 inline-block transition-transform duration-200 group-open:rotate-90"
                            width="14"
                            height="14"
                            viewBox="0 0 14 14"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ transform: "rotate(0deg)" }}
                          >
                            <path d="M4 5L7 8L10 5" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </summary>
                        <div className="space-y-1 mt-1">
                          {booking.sessions
                            .slice()
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((s, idx) => {
                              const slot = SESSION_TIME_OPTIONS.find(
                                (opt) => opt.id === s.slotId
                              );
                              return (
                                <div key={s._id || `${s.date}-${s.slotId}-${idx}`} className="flex items-center gap-2">
                                  <span className="font-mono flex-1">{s.date}</span>
                                  <FiCalendar className="text-slate-400" />
                                  <span className="font-mono">
                                    {slot
                                      ? <>
                                          {slot.label}
                                          {slot.limited && <span className="ml-1 text-amber-700 font-semibold"> (Limited case)</span>}
                                        </>
                                      : s.slotId}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      </details>
                    )}
                    {(booking.discountInfo?.discount ||
                      booking.discount ||
                      booking.discountInfo?.couponCode ||
                      booking.couponCode) && (
                      <div className="mb-1 text-xs text-blue-700">
                        {booking.discountInfo?.discount || booking.discount ? (
                          <>
                            Discount:{" "}
                            <span className="font-semibold">
                              {booking.discountInfo?.discount || booking.discount}%
                            </span>
                          </>
                        ) : null}
                        {(booking.discountInfo?.couponCode || booking.couponCode) && (
                          <>
                            {" "}
                            (Coupon:{" "}
                            <span className="font-mono">
                              {booking.discountInfo?.couponCode || booking.couponCode}
                            </span>
                            {(booking.discountInfo?.validityDays ||
                              booking.couponValidityDays) && (
                              <>
                                {" "}
                                -
                                valid{" "}
                                {booking.discountInfo?.validityDays ||
                                  booking.couponValidityDays}
                                d
                              </>
                            )}
                            )
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
