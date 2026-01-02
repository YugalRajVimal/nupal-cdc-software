import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiUser,
  FiTag,
  FiChevronUp,
  FiChevronDown,
  FiList,
  FiPackage,
  FiEdit2,
  FiX,
  FiHash,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

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

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}
function getDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; ++i) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export default function AppointmentBookingSystem() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [patientId, setPatientId] = useState<string>("");
  const [therapyId, setTherapyId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [sessions, setSessions] = useState<{ date: string; slotId: string }[]>([]);

  const [discountEnabled, setDiscountEnabled] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>(() => generateCouponCode());
  const [validityDays, setValidityDays] = useState<number>(1);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Calendar availability per @ManageAvailabilityPage
  const [dayAvailability, setDayAvailability] = useState<CalendarDayAvailability>({});
  const [availabilityLoading, setAvailabilityLoading] = useState<boolean>(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // EDIT STATE
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  // Calendar
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // --- FETCH & NORMALIZE NEW AVAILABILITY STRUCTURE ---
  /**  NEW FORMAT:
   * { success: true, data: Array<{date: string, sessions: Array<{id, label, limited, count, booked, ...}>}> }
   * Convert to { [dateStr]: { [slotId]: { total: number, booked: number } } }
   */
  const fetchMonthAvailability = useCallback(async (year: number, month: number) => {
    setAvailabilityLoading(true);
    setAvailabilityError(null);

    try {
      const start = getDateKey(year, month + 1, 1);
      const end = getDateKey(year, month + 1, getDaysInMonth(year, month));
      const res = await axios.get(`${API_BASE_URL}/api/admin/availability-slots/range/${start}/${end}`);
      const api = res.data;

      // Accept both: { success, data } and old object
      if (
        api &&
        typeof api === "object" &&
        api.success === true &&
        Array.isArray(api.data)
      ) {
        // New format!
        const cal: CalendarDayAvailability = {};
        for (const day of api.data) {
          if (typeof day.date === "string" && Array.isArray(day.sessions)) {
            const slotMap: SlotAvailability = {};
            for (const slot of day.sessions) {
              // count is total slots for the slotId, booked is count of booked
              slotMap[slot.id] = {
                total: typeof slot.count === "number" ? slot.count : 0,
                booked: typeof slot.booked === "number" ? slot.booked : 0,
              };
            }
            cal[day.date] = slotMap;
          }
        }
        setDayAvailability(cal);
      }
      // Fallback for old shape (legacy)
      else if (api && typeof api === 'object' && !Array.isArray(api)) {
        setDayAvailability(api as any);
      } else {
        setDayAvailability({});
        setAvailabilityError("Unexpected result from server when fetching calendar availability.");
      }
    } catch (e: any) {
      setDayAvailability({});
      setAvailabilityError("Failed to fetch slot availability for calendar.");
    }
    setAvailabilityLoading(false);
  }, []);

  useEffect(() => {
    fetchMonthAvailability(year, month);
    // eslint-disable-next-line
  }, [year, month, API_BASE_URL]);
  // --

  // --- Booking Fetch Logic ---
  useEffect(() => {
    async function fetchMasterData() {
      setDataLoading(true);
      setBookingError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/bookings/home-details`);
        const json = await res.json();

        let processedPatients: Patient[] = [];
        if (Array.isArray(json.patients)) {
          processedPatients = json.patients.map((raw: any) => {
            const id =
              typeof raw.id === "string" && raw.id
                ? raw.id
                : typeof raw._id === "string"
                ? raw._id
                : "";

            let patientName = raw.name;
            if (
              (!patientName || patientName.trim() === "") &&
              raw.userId &&
              typeof raw.userId === "object" &&
              typeof raw.userId.name === "string" &&
              raw.userId.name.trim() !== ""
            ) {
              patientName = raw.userId.name;
            }

            let userId = raw.userId;
            if (raw.userId && typeof raw.userId === "object") {
              userId = {
                ...raw.userId,
                name: (raw.userId.name != null ? raw.userId.name : patientName),
              };
            }

            return {
              ...raw,
              id,
              name: patientName,
              userId,
            };
          });
        }
        setPatients(processedPatients);

        setTherapies(json.therapyTypes || []);
        setPackages(json.packages || []);
      } catch {
        setPatients([]);
        setTherapies([]);
        setPackages([]);
        toast.error("Failed to load master data");
      }
      setDataLoading(false);
    }
    fetchMasterData();
  }, []);

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
    if (!dataLoading && !loading) {
      fetchBookings();
    }
  }, [dataLoading, loading, fetchBookings]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  const selectedPackage = packages.find((p) => p._id === packageId) || null;
  const getTotalSessionsForPackage = (pkg: Package | null) => {
    if (!pkg) return undefined;
    return (
      pkg.totalSessions ||
      pkg.sessionCount ||
      (() => {
        const m = pkg.name.match(/^\s*(\d+)[^\d]/);
        return m ? Number(m[1]) : undefined;
      })()
    );
  };
  const maxSelectableDates = getTotalSessionsForPackage(selectedPackage);

  useEffect(() => {
    if (maxSelectableDates === undefined) return;
    if (sessions.length > maxSelectableDates) {
      setSessions((prev) => prev.slice(0, maxSelectableDates));
    }
  }, [packageId, maxSelectableDates]);

  useEffect(() => {
    if (editBookingId) {
      const booking = bookings.find((b) => b._id === editBookingId);
      if (booking) {
        setPatientId(
          booking.patient?.id || booking.patient?._id || booking.patient?.id || ""
        );
        setTherapyId(booking.therapy?._id || "");
        setPackageId(booking.package?._id || "");
        setSessions(
          Array.isArray(booking.sessions)
            ? booking.sessions.map((s) => ({
                date: s.date,
                slotId: s.slotId ?? "",
              }))
            : []
        );

        let di = booking.discountInfo || {};
        setDiscountEnabled(!!di.discountEnabled);
        setDiscount(
          typeof di.discount === "number"
            ? di.discount
            : booking.discount || 0
        );
        setCouponCode(di.couponCode || booking.couponCode || generateCouponCode());
        setValidityDays(
          typeof di.validityDays === "number"
            ? di.validityDays
            : booking.couponValidityDays || 1
        );
      }
    }
  }, [editBookingId, bookings]);

  function resetForm() {
    setPatientId("");
    setTherapyId("");
    setPackageId("");
    setSessions([]);
    setDiscountEnabled(false);
    setDiscount(0);
    setCouponCode(generateCouponCode());
    setValidityDays(1);
    setEditBookingId(null);
    setBookingError(null);
    setBookingSuccess(null);
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

  const toggleDate = (day: number) => {
    const dateKey = getDateKey(year, month + 1, day);
    const exists = sessions.find((s) => s.date === dateKey);
    if (exists) {
      setSessions((prev) => prev.filter((s) => s.date !== dateKey));
      return;
    }
    if (
      typeof maxSelectableDates === "number" &&
      sessions.length >= maxSelectableDates
    ) {
      return;
    }
    setSessions((prev) => [...prev, { date: dateKey, slotId: "" }]);
  };

  const updateSlotId = (date: string, slotId: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.date === date ? { ...s, slotId } : s))
    );
  };

  const selectedPatient = patients.find((p) => p.id === patientId) || null;
  const selectedTherapy = therapies.find((t) => t._id === therapyId) || null;

  function getFirstSessionEarliest(sessions: { date: string; slotId: string }[]) {
    if (!sessions || sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0];
  }

  const earliestSession = getFirstSessionEarliest(sessions);

  const canBook =
    !!selectedPatient &&
    !!selectedTherapy &&
    !!selectedPackage &&
    sessions.length > 0 &&
    !!(earliestSession && earliestSession.slotId);

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

  const handleRegenerateCouponCode = () => {
    setCouponCode(generateCouponCode());
  };

  const handleBookOrUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBookingSuccess(null);
    setBookingError(null);

    if (!canBook) {
      const message = "Please fill all required fields and select a session date and time.";
      setBookingError(message);
      toast.error(message);
      return;
    }

    setBookingLoading(true);

    const payload: any = {
      patient: patientId,
      therapy: therapyId,
      package: packageId,
      sessions: sessions
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(({ date, slotId }) => ({ date, slotId })),
      discountEnabled,
    };
    if (discountEnabled) {
      payload.discount = discount;
      payload.couponCode = couponCode;
      payload.validityDays = validityDays;
    }

    try {
      let res, result;
      if (!editBookingId) {
        res = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/bookings/${editBookingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      let rawText = await res.text();
      try {
        result = JSON.parse(rawText);
      } catch {
        result = null;
      }

      if (!res.ok) {
        let message = "Booking failed.";
        if (result && (result.message || result.error)) {
          message = result.message || result.error;
        } else if (typeof rawText === "string" && rawText.trim() && !rawText.startsWith("<")) {
          message = rawText;
        }
        setBookingError(message);
        toast.error(message);
        setBookingLoading(false);
        return;
      }

      if (result && result.success === false) {
        const message = result.message || result.error || "Booking failed.";
        setBookingError(message);
        toast.error(message);
        setBookingLoading(false);
        return;
      }

      if (result && !result.booking) {
        const message = result.message || "No booking returned from server.";
        setBookingError(message);
        toast.error(message);
        setBookingLoading(false);
        return;
      }

      const successMsg = !editBookingId
        ? "Booking successfully created."
        : "Booking successfully updated.";
      setBookingSuccess(successMsg);
      toast.success(successMsg);

      await fetchBookings();
      resetForm();
      fetchMonthAvailability(year, month); // refresh slot display too
    } catch (e: any) {
      const msg =
        (typeof e === "object" && e !== null && ("message" in e) && e.message)
          ? e.message
          : editBookingId
            ? "Failed to update."
            : "Booking failed.";
      setBookingError(msg);
      toast.error(msg);
    }
    setBookingLoading(false);
  };

  function handleEditBooking(bookingId: string) {
    setEditBookingId(bookingId);
    setBookingError(null);
    setBookingSuccess(null);
  }

  function handleCancelEdit() {
    resetForm();
  }

  async function handleDeleteBooking(id: string) {
    if (!window.confirm("Delete this booking?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Booking deleted successfully.");
      } else {
        const result = await res.json();
        toast.error(result?.message || "Booking could not be deleted.");
      }
      await fetchBookings();
      fetchMonthAvailability(year, month);
    } catch {
      toast.error("An error occurred. Booking could not be deleted.");
    }
    if (editBookingId === id) {
      resetForm();
    }
  }

  // Render short summary: booked slots/total slots for the day (sum of all time slots)
  function getDaySlotSummary(dateStr: string): { total: number; booked: number } {
    const slotsObj = dayAvailability && dayAvailability[dateStr] ? dayAvailability[dateStr] : {};
    let total = 0, booked = 0;
    for (const slotId of Object.keys(slotsObj)) {
      total += typeof slotsObj[slotId]?.total === "number" ? slotsObj[slotId]?.total : 0;
      booked += typeof slotsObj[slotId]?.booked === "number" ? slotsObj[slotId]?.booked : 0;
    }
    return { total, booked };
  }

  // Helper: for a session date, get option status for every slot
  function getAvailableSlotsForDate(date: string, selectedSessions: {date: string, slotId: string}[], currSelectedSlotId: string) {
    // Returns a map { [slotId]: { disabled: boolean, reason?: string, (label override) } }
    const slotInfo: {[slotId: string]: { disabled: boolean, reason: string }} = {};
    const slots = dayAvailability && dayAvailability[date] ? dayAvailability[date] : {};
    const slotCountMap: {[slotId: string]: { total: number, booked: number }} = slots;

    // Gather slots already booked by other sessions in the form except this session (for multi-day multi-slot).
    const sessionsExcludingCurrent = selectedSessions.filter(s => s.date !== date);
    const pickedSlotIds = sessionsExcludingCurrent.map(s => s.slotId);

    // Finally, for each SESSION_TIME_OPTION slot:
    for (const opt of SESSION_TIME_OPTIONS) {
      const av = slotCountMap[opt.id];
      // Exclude slots already picked for other days in this booking (prevent duplicate time for the same patient per logic)
      let isPickedInOtherSession = pickedSlotIds.includes(opt.id);
      let disabled = false;
      let reason = "";

      // If slot has no data, treat as unavailable
      if (!av || typeof av.total !== "number" || av.total === 0) {
        disabled = true;
        reason = "Not available";
      } else if (av.booked >= av.total) {
        // slot exists, but fully booked
        // But: allow picking if user had already selected this slotId for this date (editing)
        if (currSelectedSlotId !== opt.id) {
          disabled = true; reason = "Already full";
        }
      }
      // Block picking the same time slot on multiple days for the same booking (optional, can be removed)
      if (!disabled && isPickedInOtherSession) {
        if (currSelectedSlotId !== opt.id) {
          disabled = true; reason = "Already picked for another day";
        }
      }
      slotInfo[opt.id] = { disabled, reason };
    }
    return slotInfo;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  p-8"
    >
      {/* Optionally place ToastContainer at root or ensure it's rendered in App root */}

      {/* Guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-blue-50 border border-blue-200 rounded-lg p-0 mb-8 overflow-hidden cursor-pointer`}
        onClick={() => setGuideOpen((v) => !v)}
        tabIndex={0}
        role="button"
        aria-expanded={guideOpen}
        style={{ outline: "none" }}
      >
        <div className="px-6 py-6">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <FiInfo /> Appointment Booking System
            </div>
            {guideOpen ? (
              <FiChevronUp className="text-blue-600" />
            ) : (
              <FiChevronDown className="text-blue-600" />
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {guideOpen && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden px-6 pb-6 pt-0"
              onClick={e => e.stopPropagation()}
            >
              <p className="text-sm text-blue-700 mb-4">
                Manage therapy schedules, book new sessions, and view existing bookings.
              </p>
              <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                  <FiList /> Steps to Follow
                </div>
                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                  <li>Use the calendar to view and check bookings. Booked/Total slots for each day are shown.</li>
                  <li>Select a patient, therapy, and package in 'Quick Book'.</li>
                  <li>
                    Select <span className="font-medium text-blue-800">at least one</span> session date; enter a time for the first session. Selecting all dates is <span className="font-medium text-blue-800">not mandatory</span>.
                  </li>
                  <li>Click '{editBookingId ? "Update Booking" : "Book Now"}' to {editBookingId ? "update" : "confirm"} a booking.</li>
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

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
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = getDateKey(year, month + 1, day);
              const selected = sessions.find((s) => s.date === dateKey);
              const isAtMax =
                typeof maxSelectableDates === "number" &&
                sessions.length >= maxSelectableDates &&
                !selected;

              // Render availability: booked/total for that day
              const { total, booked } = getDaySlotSummary(dateKey);

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (!isAtMax) toggleDate(day);
                  }}
                  className={`h-24 border cursor-pointer flex flex-col justify-between p-2 transition ${
                    selected
                      ? "bg-blue-50 border-blue-400"
                      : isAtMax
                        ? "bg-gray-100 cursor-not-allowed opacity-60"
                        : "hover:bg-slate-50"
                  }`}
                  style={isAtMax ? { pointerEvents: "none" } : {}}
                >
                  <div className="flex flex-col justify-start">
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${selected ? "bg-blue-600 text-white" : ""}`}>
                    {day}
                  </div>
                  
                  {selected && (
                    <div className="mt-1 text-xs text-blue-700 font-medium">
                      Selected
                    </div>
                  )}
                  </div>
                
                  
                  {availabilityLoading ? (
                    <span className="text-gray-300">Loading slots…</span>
                  ) : total > 0 ? (
                    <span className="flex items-center w-fit gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-700 border border-green-300 shadow">
                      <FiCheckCircle className="inline mr-0.5 text-green-500" size={13}/>
                      <span data-testid='booked-total' className="tabular-nums font-semibold">
                        {booked}/{total}
                      </span>
                    </span>
                  ) : (
                    <span className="text-gray-400">No slots</span>
                  )}
                </div>
              );
            })}
          </div>
          {typeof maxSelectableDates === "number" && (
            <div className="px-4 pt-2 pb-1 text-xs text-slate-600">
              {`You can select up to ${maxSelectableDates} date${maxSelectableDates > 1 ? "s" : ""} for this package. `}
              <span className="text-blue-700">Selecting all is not mandatory; at least one is required.</span>
              <br />
              {sessions.length >= maxSelectableDates && (
                <span className="text-blue-700">Limit reached.</span>
              )}
            </div>
          )}
          {availabilityError && (
            <div className="px-4 text-xs text-red-500 mt-1">{availabilityError}</div>
          )}
        </div>

        {/* Quick Book / Edit Booking */}
        <div className="flex-1 bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">
            {editBookingId ? "Edit Booking" : "Quick Book"}
            {editBookingId && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
                Editing
              </span>
            )}
          </h3>

          {/* Appointment ID (non-editable, only visible when editing a booking) */}
          {editBookingId && (() => {
            const currentBooking = bookings.find(b => b._id === editBookingId);
            if (currentBooking && currentBooking.appointmentId) {
              return (
                <div className="mb-3">
                  <label className="block text-sm mb-1 flex items-center gap-1 text-gray-700 font-semibold">
                    <FiHash /> Appointment ID
                  </label>
                  <input
                    type="text"
                    value={currentBooking.appointmentId}
                    className="w-full border rounded px-3 py-2 bg-slate-100 font-mono text-gray-500"
                    readOnly
                    disabled
                  />
                </div>
              );
            }
            return null;
          })()}

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiUser /> Patient Name
          </label>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            disabled={!!editBookingId}
          >
            <option value="">Select Patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {getPatientDisplayName(patient)}
              </option>
            ))}
          </select>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiTag /> Therapy Type
          </label>
          <select
            value={therapyId}
            onChange={e => setTherapyId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Therapy</option>
            {therapies.map((therapy) => (
              <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
            ))}
          </select>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiPackage /> Package
          </label>
          <select
            value={packageId}
            onChange={e => setPackageId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-5"
          >
            <option value="">Select Package</option>
            {packages.map((pkg) => (
              <option key={pkg._id} value={pkg._id}>
                {getPackageDisplay(pkg)}
              </option>
            ))}
          </select>

          {/* Discount Toggle */}
          <div className="mb-4 flex items-center gap-3">
            <label className="block text-sm font-semibold text-blue-700" htmlFor="toggle-discount">
              Enable Discount/Coupon
            </label>
            <button
              id="toggle-discount"
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${discountEnabled ? "bg-blue-600" : "bg-gray-300"}`}
              onClick={() => {
                setDiscountEnabled((v) => !v);
              }}
              aria-pressed={discountEnabled}
              role="switch"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow ${discountEnabled ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* Coupon Fields */}
          <AnimatePresence>
            {discountEnabled && (
              <motion.div
                key="discountSection"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mb-4">
                  <label className="block text-sm mb-1 font-semibold text-blue-700">Discount (%)</label>
                  <input
                    type="number"
                    value={discount}
                    min={0}
                    max={100}
                    onChange={e => {
                      setDiscount(Number(e.target.value));
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter discount percentage"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1 font-semibold text-blue-700">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 bg-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-3 py-2 rounded font-semibold text-xs hover:bg-blue-600"
                      onClick={handleRegenerateCouponCode}
                      title="Regenerate Code"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">A unique 8 digit alphanumeric code will be generated.</p>
                </div>
                <div className="mb-5">
                  <label className="block text-sm mb-1 font-semibold text-blue-700">Coupon Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={validityDays}
                    onChange={e => {
                      setValidityDays(Number(e.target.value));
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Number of days coupon is valid"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* End Coupon Fields */}

          {sessions.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
                <FiClock />
                Session Dates &#38; Times
              </div>
              {sessions
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((s, idx, arr) => {
                  // For this date, fetch available slot info for options
                  const slotInfo = getAvailableSlotsForDate(s.date, arr, s.slotId);
                  return (
                  <div key={s.date} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-mono">{s.date}</span>
                    <FiClock className="text-slate-400" />
                    <select
                      value={s.slotId}
                      onChange={e => updateSlotId(s.date, e.target.value)}
                      className={`border rounded px-2 py-1 ${
                        idx === 0 && !s.slotId ? "border-red-400" : ""
                      }`}
                      required={idx === 0}
                      aria-required={idx === 0}
                      style={{ minWidth: 180 }}
                    >
                      <option value="">Select Time Slot</option>
                      {SESSION_TIME_OPTIONS.map((slot) => {
                        const i = slotInfo[slot.id];
                        return (
                          <option
                            key={slot.id}
                            value={slot.id}
                            disabled={i.disabled}
                          >
                            {slot.label}
                            {slot.limited ? " (Limited case)" : ""}
                            {i.disabled ? `  - ${i.reason}` : ""}
                          </option>
                        );
                      })}
                    </select>
                    {idx === 0 && !s.slotId && (
                      <span className="text-xs text-red-500 ml-2">Time required</span>
                    )}
                  </div>
                )})}
            </div>
          )}

          {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
          {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}

          <div className="flex gap-2">
            <button
              disabled={!canBook || bookingLoading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              onClick={handleBookOrUpdate}
            >
              {bookingLoading
                ? editBookingId
                  ? "Updating..."
                  : "Booking..."
                : editBookingId
                  ? "Update Booking"
                  : "Book Now"}
            </button>
            {editBookingId && (
              <button
                className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
                type="button"
                onClick={handleCancelEdit}
              >
                <FiX className="inline mr-1" />
                Cancel Edit
              </button>
            )}
          </div>
          {typeof maxSelectableDates === "number" && (
            <div className="text-xs text-blue-700 mt-3">
              {`You can select up to ${maxSelectableDates} date${maxSelectableDates > 1 ? "s" : ""} for this package. Selecting all is not mandatory.`}
            </div>
          )}
          {sessions.length === 0 && (
            <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
          )}
          {sessions.length > 0 && (!earliestSession || !earliestSession.slotId) && (
            <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
          )}
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
                  className={`border p-3 rounded bg-sky-50 relative ${
                    editBookingId === booking._id
                      ? "ring ring-blue-400 ring-offset-2"
                      : ""
                  }`}
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
                          <span key={s._id || s.date}>
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
                        {typeof booking.discount === "number" ? booking.discount : booking.discountInfo?.discount}%</span>
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
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      onClick={() => handleEditBooking(booking._id)}
                      title="Edit booking"
                      disabled={!!editBookingId && editBookingId !== booking._id}
                    >
                      <FiEdit2 />
                      Edit
                    </button>
                    <button
                      className="text-xs rounded px-2 py-1 border border-red-400 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteBooking(booking._id)}
                      title="Delete booking"
                      disabled={!!editBookingId && editBookingId === booking._id}
                    >
                      Delete
                    </button>
                  </div>
                  {editBookingId === booking._id && (
                    <div className="absolute -top-2 right-2">
                      <span className="text-blue-800 text-xs bg-blue-200 px-2 py-0.5 rounded font-bold shadow">
                        Editing
                      </span>
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
