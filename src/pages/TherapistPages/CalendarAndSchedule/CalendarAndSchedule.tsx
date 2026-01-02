import { useEffect, useState, useCallback } from "react";
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
  { id: '0830-0915', label: '08:30 to 09:15', limited: true },
  { id: '0915-1000', label: '09:15 to 10:00', limited: true },
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
  { id: '1800-1845', label: '18:00 to 18:45', limited: true },
  { id: '1845-1930', label: '18:45 to 19:30', limited: true },
  { id: '1930-2015', label: '19:30 to 20:15', limited: true }
];

type Patient = {
  id: string;
  name: string;
  phoneNo?: string;
  userId?: {
    name?: string;
  };
  mobile1?: string;
  email?: string;
  [key: string]: any;
};

type Therapy = {
  _id: string;
  name: string;
};

type Package = {
  _id: string;
  name: string;
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
};

type Booking = {
  _id: string;
  appointmentId?: string;
  patient: Patient;
  therapy: Therapy;
  package: Package | null;
  sessions: BookingSession[];
  discountInfo?: DiscountInfo;
  discount?: number;
  couponCode?: string;
  couponValidityDays?: number;
};

// --- AVAILABILITY types adapted for new format ---
// For a day, slotId => { total: number, booked: number }
export type SlotAvailability = {
  [slotId: string]: {
    total: number;
    booked: number;
  };
};
export type CalendarDayAvailability = {
  [date: string]: SlotAvailability;
};



function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

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

  function normalizeBookings(bookings: any[]): Booking[] {
    return bookings.map((b) => {
      let patient = b.patient;
      if (
        patient &&
        patient.userId &&
        typeof patient.userId === "object" &&
        typeof patient.userId.name !== "string"
      ) {
        patient = {
          ...patient,
          userId: {
            ...patient.userId,
            name: patient.name,
          }
        };
      } else if (
        patient &&
        (!patient.userId || typeof patient.userId !== "object") &&
        typeof patient.name === "string"
      ) {
        patient = {
          ...patient,
          userId: {
            name: patient.name,
          }
        };
      }
      // Patch sessions: normalize any 'time' field to 'slotId' for display
      let normalizedSessions = Array.isArray(b.sessions)
        ? b.sessions.map((s: any) => ({
          ...s,
          slotId: s.slotId ?? s.time ?? "",
        }))
        : [];

      if (b.discountInfo && typeof b.discountInfo === "object") {
        return {
          ...b,
          patient,
          sessions: normalizedSessions,
          discount: b.discountInfo.discount ?? b.discount,
          couponCode: b.discountInfo.couponCode ?? b.couponCode,
          couponValidityDays: b.discountInfo.validityDays ?? b.couponValidityDays,
          discountEnabled: b.discountInfo.discountEnabled,
          appointmentId: b.appointmentId,
        };
      }
      return { ...b, patient, sessions: normalizedSessions, appointmentId: b.appointmentId };
    });
  }

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings`);
      const json = await res.json();
      let bookingsList: Booking[] =
        Array.isArray(json.bookings) ? normalizeBookings(json.bookings) : [];
      setBookings(bookingsList);
    } catch {
      setBookings([]);
      toast.error("Failed to fetch bookings list.");
    }
  }, []);

  useEffect(() => {
    // Simulating dataLoading to false for demonstration purposes
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchBookings();
    }
    // Only fire when loading/dataLoading/fetchBookings changes
  }, [dataLoading, loading, fetchBookings]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);



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

  function getPatientDisplayName(patient: Patient | undefined | null) {
    if (!patient) return "";
    const name =
      (patient.userId && typeof patient.userId === "object" && patient.userId.name) ||
      patient.name;
    const phone = patient.phoneNo || patient.mobile1 || "";
    return phone ? `${name}${phone ? ` (${phone})` : ""}` : name;
  }
  function getPackageDisplay(pkg: Package | null) {
    if (!pkg) return "—";
    const sessions =
      pkg.totalSessions ||
      pkg.sessionCount ||
      (() => {
        const m = pkg.name.match(/^\s*(\d+)[^\d]/);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  p-8"
    >
      {/* Optionally place ToastContainer at root or ensure it's rendered in App root */}

      <div className="flex md:flex-row flex-col-reverse  gap-6">
        {/* Calendar */}
        <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <FiCalendar />
              {new Date(year, month).toLocaleString("default", {
                month: "long",
              })} {year}
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeMonth("prev")} className="p-2 border rounded">
                <FiChevronLeft />
              </button>
              <button onClick={() => changeMonth("next")} className="p-2 border rounded">
                <FiChevronRight />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-xs text-slate-500 border-b">
            {DAYS.map((d) => (
              <div key={d} className="p-2 text-center font-medium">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border" />
            ))}
            {/* Actual date cells would go here */}
            {Array.from({ length: daysInMonth }).map((_, dayIdx) => (
              <div key={`day-${dayIdx+1}`} className="h-24 border p-2 align-top text-sm text-center">
                {dayIdx + 1}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Summary */}
      <div className="mt-6">
        <div className="bg-white border rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Booking Summary</p>
          {bookings && bookings.length === 0 ? (
            <div>
              <p className="text-slate-500 mb-3">No bookings found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div
                  className={`border p-3 rounded bg-sky-50 relative `}
                  key={booking._id}
                >
                  {/* Appointment ID display row, non-editable, always available */}
                  {booking.appointmentId && (
                    <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gray-700">
                      <FiHash className="text-blue-500" /> <span>Appointment ID: {booking.appointmentId}</span>
                    </div>
                  )}
                  <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    {getPatientDisplayName(booking.patient)}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FiTag className="text-slate-500" />
                    <span className="text-slate-700">{booking.therapy?.name}</span>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FiPackage className="text-purple-500" />
                    <span className="text-purple-700">
                      {getPackageDisplay(booking.package)}
                    </span>
                  </div>
                  {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
                    <div className="mb-1 text-xs text-slate-700">
                      <span className="font-medium">Sessions:</span>{" "}
                      {booking.sessions.map((s, idx) => {
                        const slot = SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId);
                        return (
                          <span key={s._id || `${s.date}-${s.slotId}`}>
                            {s.date}{" "}
                            {slot
                              ? (
                                <>
                                  {slot.label}
                                  {slot.limited ? " (Limited case)" : ""}
                                </>
                              )
                              : s.slotId}
                            {idx < booking.sessions.length - 1 ? ", " : ""}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  {(typeof booking.discount === "number" && booking.discount > 0 ||
                    (booking.discountInfo && booking.discountInfo.discountEnabled && booking.discountInfo.discount)
                  ) && (
                    <div className="mb-1 text-xs text-blue-700">
                      Discount: <span className="font-semibold">
                        {typeof booking.discount === "number"
                          ? booking.discount
                          : booking.discountInfo?.discount}%</span>
                      {
                        (booking.couponCode || booking.discountInfo?.couponCode) && (
                          <>
                            {" "}
                            (Coupon: <span className="font-mono">
                              {booking.couponCode || booking.discountInfo?.couponCode}
                            </span>
                            {(booking.couponValidityDays || booking.discountInfo?.validityDays) && (
                              <> {` - valid ${booking.couponValidityDays || booking.discountInfo?.validityDays}d`}</>
                            )}
                            )
                          </>
                        )
                      }
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
