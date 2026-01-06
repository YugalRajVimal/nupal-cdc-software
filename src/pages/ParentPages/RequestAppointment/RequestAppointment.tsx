import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiClock,
  FiUser,
  FiTag,
  FiPackage,
  FiX,
  FiHash,
  FiCheckCircle,
  FiRepeat,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Constants and helpers retained (same as before)
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
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
  { id: '1930-2015', label: '19:30 to 20:15', limited: true }
];

type Patient = {
  id: string;
  patientId: string,
  name: string;
  phoneNo?: string;
  userId?: { name?: string; };
  mobile1?: string;
  email?: string;
  [key: string]: any;
};
type Therapy = { _id: string; name: string; };
type Package = {
  _id: string;
  name: string;
  totalSessions?: number;
  costPerSession?: number;
  totalCost?: number;
  sessionCount?: number;
};
type Therapist = {
  _id: string;
  therapistId: string;
  name: string;
  holidays?: Array<{ date: string; reason?: string; }>;
  userId?: { name?: string; },
  mobile1?: string;
  [key: string]: any;
};
type BookingSession = { date: string; slotId: string; _id?: string };
type Booking = {
  _id: string;
  requestId?:string,
  appointmentId?: string;
  patient: Patient;
  therapy: Therapy;
  package: Package | null;
  therapist: Therapist | string;
  sessions: BookingSession[];
  discountInfo?: {
    coupon: {
      couponCode: string;
      createdAt: string;
      discount: number;
      discountEnabled: boolean;
      validityDays: number;
      __v?: number;
      _id: string;
    };
    time?: string;
  };
  // Additional: requestStatus for fetching booking requests, optional
  requestStatus?: string;
};
type Coupon = {
  _id: string;
  code: string;
  discount: number;
  validityDays: number;
  enabled?: boolean;
};

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function getDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getStartDay(year: number, month: number) { return new Date(year, month, 1).getDay(); }
const API_BASE_URL = import.meta.env.VITE_API_URL as string;
function getDayIndex(dayShort: string): number {
  const idx = DAYS.findIndex(d => d === dayShort.toUpperCase());
  return idx >= 0 ? idx : 0;
}

export default function RequestAppointment() {
  // State, as before...
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [patientId, setPatientId] = useState<string>("");
  const [therapyId, setTherapyId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [sessions, setSessions] = useState<{ date: string; slotId: string }[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>("");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [repeatDay, setRepeatDay] = useState<string>("");
  const [repeatStartDate, setRepeatStartDate] = useState<string>("");
  const [repeatSlotId, setRepeatSlotId] = useState<string>("");
  const [repeatError, setRepeatError] = useState<string | null>(null);
  const [repeatConflictInfo, setRepeatConflictInfo] = useState<{ [date: string]: string }>({});

  // New: Requested bookings (pending requests)
  const [requestedBookings, setRequestedBookings] = useState<Booking[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Fetch master data (same as before)
  useEffect(() => {
    async function fetchMasterDataAndCoupons() {
      setDataLoading(true);
      setBookingError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/parent/request-appointment-homepage`);
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
            return { ...raw, id, name: patientName, userId };
          });
        }
        setPatients(processedPatients);
        setTherapies(json.therapyTypes || []);
        setPackages(json.packages || []);
        setTherapists(Array.isArray(json.therapists) ? json.therapists : []);
        setCoupons(Array.isArray(json.coupons) ? json.coupons : []);
      } catch {
        setPatients([]); setTherapies([]); setPackages([]); setTherapists([]); setCoupons([]);
        toast.error("Failed to load master data");
      }
      setDataLoading(false);
    }
    fetchMasterDataAndCoupons();
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
          requestStatus: b.requestStatus,
        };
      }
      return { ...b, patient, sessions: normalizedSessions, appointmentId: b.appointmentId, requestStatus: b.requestStatus };
    });
  }

  // Normal bookings list (NOT requests)
  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/all-bookings`);
      const json = await res.json();
      let bookingsList: Booking[] =
        Array.isArray(json.bookings) ? normalizeBookings(json.bookings) : [];
      setBookings(bookingsList);
    } catch {
      setBookings([]);
      toast.error("Failed to fetch bookings list.");
    }
  }, []);

  // Fetch ONLY booking requests (pending requests)
  const fetchRequestedBookings = useCallback(async () => {
    setRequestsLoading(true);
    try {
      // API call based on @parent.routes.js (32-34) endpoint
      const res = await fetch(`${API_BASE_URL}/api/parent/booking-requests`);
      const json = await res.json();
      let reqs: Booking[] =
        Array.isArray(json.bookingRequests) ? normalizeBookings(json.bookingRequests) : [];
      setRequestedBookings(reqs);
    } catch {
      setRequestedBookings([]);
      toast.error("Failed to fetch requested bookings.");
    }
    setRequestsLoading(false);
  }, []);

  // Prefetch normal bookings and appointment requests
  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchBookings();
      fetchRequestedBookings();
    }
  }, [dataLoading, loading, fetchBookings, fetchRequestedBookings]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Derived values and hooks unchanged (as above)
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
      // Try finding in booking requests, fallback to confirmed bookings
      const booking =
        requestedBookings.find((b) => b._id === editBookingId) ||
        bookings.find((b) => b._id === editBookingId);
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
        let couponObj: Coupon | undefined = undefined;
        if (
          booking.discountInfo &&
          booking.discountInfo.coupon
        ) {
          const couponCandidate = booking.discountInfo.coupon;
          couponObj =
            coupons.find(c => c._id === couponCandidate._id) ||
            coupons.find(c => c.code === couponCandidate.couponCode) ||
            coupons.find(c => c.code === (couponCandidate as any).code) ||
            coupons.find(c => (c as any).couponCode === couponCandidate.couponCode) ||
            coupons.find(c => (c as any).couponCode === (couponCandidate as any).code) ||
            (booking.discountInfo as any).couponCode && coupons.find(c => c.code === (booking.discountInfo as any).couponCode);

        } else if (
          booking.discountInfo &&
          (booking.discountInfo as any).couponCode
        ) {
          couponObj =
            coupons.find(c => c.code === (booking.discountInfo as any).couponCode) ||
            coupons.find(c => c._id === (booking.discountInfo as any).couponCode);
        }
        setSelectedCouponId(couponObj ? couponObj._id : "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editBookingId, requestedBookings, bookings, coupons.length]);

  function resetForm() {
    setPatientId("");
    setTherapyId("");
    setPackageId("");
    setSessions([]);
    setSelectedCouponId("");
    setEditBookingId(null);
    setBookingError(null);
    setBookingSuccess(null);
    setRepeatDay("");
    setRepeatStartDate("");
    setRepeatSlotId("");
    setRepeatError(null);
    setRepeatConflictInfo({});
  }

  // Delete booking request
  const handleDeleteRequest = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this booking request?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/parent/booking-request/${id}`, {
        method: "DELETE",
      });
      const text = await res.text();
      let result: any;
      try {
        result = JSON.parse(text);
      } catch {
        result = null;
      }
      if (!res.ok) {
        let message = "Failed to delete.";
        if (result && (result.message || result.error)) message = result.message || result.error;
        toast.error(message);
        return;
      }
      toast.success("Booking request deleted.");
      if (editBookingId === id) resetForm();
      fetchRequestedBookings();
      fetchBookings();
    } catch (e: any) {
      toast.error(
        (typeof e === "object" && e && "message" in e ? e.message : "Failed to delete booking request")
      );
    }
  };

  // Remaining helpers and logic unchanged (same as previous code)
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
  const selectedCoupon = coupons.find(c => c._id === selectedCouponId) || null;

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
    const name = patient.name;
    const pid = patient.patientId ? patient.patientId : "";
    return pid ? `${name} (${pid})` : name;
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
    if (pkg.name) parts.push(pkg.name);
    if (sessions || totalCost) {
      const subparts = [];
      if (totalCost) subparts.push("Total Cost " + totalCost);
      if (costPerSession) subparts.push(`[${costPerSession}]`);
      if (subparts.length > 0) parts.push(subparts.join(" "));
    }
    return parts.join("; ");
  }

  // Booking API (unchanged)
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
    };
    if (selectedCoupon) {
      payload.coupon = { id: selectedCoupon._id };
      payload.couponCode = selectedCoupon.code;
      payload.discount = selectedCoupon.discount;
      payload.validityDays = selectedCoupon.validityDays;
    }

    try {
      let res, result;
      if (!editBookingId) {
        // Use new create-booking-request API for requests
        res = await fetch(`${API_BASE_URL}/api/parent/create-booking-request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Use new update booking request route for edit
        res = await fetch(`${API_BASE_URL}/api/parent/booking-request/${editBookingId}`, {
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

      // NOTE: Updated for booking request API: check for bookingRequest not booking
      if (result && !result.bookingRequest) {
        const message = result.message || "No booking request returned from server.";
        setBookingError(message);
        toast.error(message);
        setBookingLoading(false);
        return;
      }

      const successMsg = !editBookingId
        ? "Booking request successfully created."
        : "Booking request successfully updated.";
      setBookingSuccess(successMsg);
      toast.success(successMsg);

      await fetchBookings();
      await fetchRequestedBookings();
      resetForm();
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

  function handleCancelEdit() { resetForm(); }

//   function getTotalAvailableTherapists(dateStr: string): number {
//     let count = 0;
//     for (const t of therapists) {
//       const holidays = Array.isArray(t.holidays) ? t.holidays : [];
//       const isOnHoliday = holidays.some(h => h && h.date === dateStr);
//       if (!isOnHoliday) count += 1;
//     }
//     return count;
//   }
//   function getDaySlotSummary(dateStr: string): { total: number; booked: number, limitedTotal?: number, limitedBooked?: number } {
//     const availableTherapists = getTotalAvailableTherapists(dateStr);
//     const slotsPerTherapist = 10;
//     const limitedSlotsPerTherapist = 5;
//     let totalNormal = 0;
//     let totalLimited = 0;
//     for (const t of therapists) {
//       if (Array.isArray(t.holidays) && t.holidays.some(h => h && h.date === dateStr)) continue;
//       let tid = t._id;
//       let { normal, limited } = (() => {
//         let n = 0, l = 0;
//         for (const booking of bookings) {
//           let bTid = "";
//           if (booking.therapist && typeof booking.therapist === "string") bTid = booking.therapist;
//           else if (booking.therapist && typeof booking.therapist === "object") bTid = booking.therapist._id || "";
//           if (bTid === tid && Array.isArray(booking.sessions)) {
//             for (const s of booking.sessions) {
//               if (s.date === dateStr) {
//                 const opt = SESSION_TIME_OPTIONS.find(x => x.id === s.slotId);
//                 if (opt) {
//                   if (opt.limited) l += 1;
//                   else n += 1;
//                 }
//               }
//             }
//           }
//         }
//         return { normal: n, limited: l };
//       })();
//       totalNormal += normal;
//       totalLimited += limited;
//     }
//     return {
//       total: availableTherapists * slotsPerTherapist,
//       booked: totalNormal,
//       limitedTotal: availableTherapists * limitedSlotsPerTherapist,
//       limitedBooked: totalLimited,
//     };
//   }
  // Main slot disabling
  function getAvailableSlotsForDate(
    date: string,

    currSelectedSlotId: string
  ) {
    const slotInfo: { [slotId: string]: { disabled: boolean; reason: string } } = {};
    const therapistsAvailable = therapists.filter(t => {
      const holidays = Array.isArray(t.holidays) ? t.holidays : [];
      return !holidays.some(h => h.date === date);
    });
    const perSlotTherapistBooked: { [slotId: string]: Set<string> } = {};
    SESSION_TIME_OPTIONS.forEach(opt => { perSlotTherapistBooked[opt.id] = new Set<string>(); });
    for (const t of therapistsAvailable) {
      let tid = t._id;
      for (const booking of bookings) {
        let bTid = "";
        if (booking.therapist && typeof booking.therapist === "string") bTid = booking.therapist;
        else if (booking.therapist && typeof booking.therapist === "object") bTid = booking.therapist._id || "";
        if (
          bTid === tid &&
          Array.isArray(booking.sessions)
        ) {
          for (const s of booking.sessions) {
            if (s.date === date && s.slotId) {
              perSlotTherapistBooked[s.slotId].add(tid);
            }
          }
        }
      }
    }
    SESSION_TIME_OPTIONS.forEach(opt => {
      let disabled = false;
      let reason = "";
      const bookedCountForSlot = perSlotTherapistBooked[opt.id].size;
      if (
        therapistsAvailable.length > 0 &&
        bookedCountForSlot >= therapistsAvailable.length &&
        (!currSelectedSlotId || currSelectedSlotId !== opt.id)
      ) {
        disabled = true;
        reason = "All slots are filled for this time";
      }
      slotInfo[opt.id] = { disabled, reason };
    });
    return slotInfo;
  }
  // Repeat weekly
  function getNextNDatesWeekly(
    startDate: Date,
    sessionCount: number,
    dayOfWeek: number,
    // therapist: Therapist | undefined // unused, ignore
  ): string[] {
    let dates: string[] = [];
    let date = new Date(startDate);
    while (date.getDay() !== dayOfWeek) {
      date.setDate(date.getDate() + 1);
    }
    while (dates.length < sessionCount) {
      const dateKey = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
      dates.push(dateKey);
      date.setDate(date.getDate() + 7);
    }
    return dates;
  }
  function handleRepeatApply() {
    setRepeatError(null);
    setRepeatConflictInfo({});
    if (!repeatDay || !repeatStartDate || !repeatSlotId) {
      setRepeatError("Please select start date, weekday, and time slot."); return;
    }
    if (!maxSelectableDates || !selectedPackage) {
      setRepeatError("Please select a package."); return;
    }
    const start = new Date(repeatStartDate);
    const wantedDayNum = getDayIndex(repeatDay);
    while (start.getDay() !== wantedDayNum) { start.setDate(start.getDate() + 1); }
    const sessionsOnTargetDay = getNextNDatesWeekly(
      start,
      maxSelectableDates,
      wantedDayNum,
    //   undefined
    );
    const slotConflicts: string[] = [];
    const conflictReasons: { [date: string]: string } = {};
    let plannedBookingNormalPerDay: { [date: string]: number } = {};
    let plannedBookingLimitedPerDay: { [date: string]: number } = {};
    const newSessions = sessionsOnTargetDay.map((dateStr) => {
      const repeatOpt = SESSION_TIME_OPTIONS.find(opt => opt.id === repeatSlotId);
      let isLimited = repeatOpt?.limited === true;
      const slotInfo = getAvailableSlotsForDate(dateStr,  repeatSlotId);
      if (slotInfo[repeatSlotId]?.disabled) {
        slotConflicts.push(dateStr);
        if (slotInfo[repeatSlotId]?.reason) {
          conflictReasons[dateStr] = `Select different time for ${dateStr}${repeatOpt ? ` (${repeatOpt.label})` : ""} — ${slotInfo[repeatSlotId].reason}`;
        } else if (!conflictReasons[dateStr]) {
          conflictReasons[dateStr] = `Slot not available on ${dateStr}.`;
        }
      }
      if (isLimited) plannedBookingLimitedPerDay[dateStr] = (plannedBookingLimitedPerDay[dateStr] ?? 0) + 1;
      else plannedBookingNormalPerDay[dateStr] = (plannedBookingNormalPerDay[dateStr] ?? 0) + 1;
      return { date: dateStr, slotId: repeatSlotId };
    });
    if (slotConflicts.length > 0) {
      setRepeatError(`Some dates have conflicts. See below for details.`);
      setRepeatConflictInfo(conflictReasons);
      setSessions(newSessions.filter((s) => !slotConflicts.includes(s.date)));
    } else {
      setRepeatError(null);
      setRepeatConflictInfo({});
      setSessions(newSessions);
    }
  }
  function handleRepeatClear() {
    setRepeatDay("");
    setRepeatStartDate("");
    setRepeatSlotId("");
    setRepeatError(null);
    setRepeatConflictInfo({});
    setSessions([]);
  }
  // Remaining helper logic/slot-handling is unchanged from the previous code...

  // ... omitted duplicate helpers for brevity; keep as in original

  // ----------- RENDER --------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <div className="flex md:flex-row flex-col-reverse gap-6">

        {/* Calendar and form as before ... */}

      
        {/* END: Booking requests table */}

        {/* Calendar and booking form unchanged from previous code: Paste from previous, or keep as is */}
        {/* ... */}
        {/* Calendar */}
        <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
          {/* ... Calendar code unchanged ... */}
          {/* Paste calendar code from the previous implementation here for brevity ... */}
          {/* ... */}
          {/* Keep calendar code as is */}
          {/* ... */}
          {/* Start calendar form: (begin paste from previous implementation here) */}
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
            {Array.from({ length: getStartDay(year, month) }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border" />
            ))}
            {Array.from({ length: getDaysInMonth(year, month) }).map((_, i) => {
              const day = i + 1;
              const dateKey = getDateKey(year, month + 1, day);
              const selected = sessions.find((s) => s.date === dateKey);
              const isAtMax =
                typeof maxSelectableDates === "number" &&
                sessions.length >= maxSelectableDates &&
                !selected;

              const { total, booked, limitedTotal, limitedBooked } = (() => {
                // Use local copy of getDaySlotSummary helper;
                // For brevity, assume the helper returns correctly
                const availableTherapists =
                  therapists.filter(t => !(t.holidays || []).some(h => h.date === dateKey)).length;
                let totalNormal = 0, totalLimited = 0;
                for (const t of therapists) {
                  if (Array.isArray(t.holidays) && t.holidays.some(h => h && h.date === dateKey)) continue;
                  let tid = t._id;
                  let n = 0, l = 0;
                  for (const booking of bookings) {
                    let bTid = "";
                    if (booking.therapist && typeof booking.therapist === "string") bTid = booking.therapist;
                    else if (booking.therapist && typeof booking.therapist === "object") bTid = booking.therapist._id || "";
                    if (bTid === tid && Array.isArray(booking.sessions)) {
                      for (const s of booking.sessions) {
                        if (s.date === dateKey) {
                          const opt = SESSION_TIME_OPTIONS.find(x => x.id === s.slotId);
                          if (opt) { if (opt.limited) l += 1; else n += 1; }
                        }
                      }
                    }
                  }
                  totalNormal += n;
                  totalLimited += l;
                }
                return {
                  total: availableTherapists * 10,
                  booked: totalNormal,
                  limitedTotal: availableTherapists * 5,
                  limitedBooked: totalLimited,
                };
              })();

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
                  {typeof total !== "number" ? (
                    <span className="text-gray-300">Loading…</span>
                  ) : total > 0 || (limitedTotal && limitedTotal > 0) ? (
                    <>
                      <span className="flex items-center w-fit gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-700 border border-green-300 shadow">
                        <FiCheckCircle className="inline mr-0.5 text-green-500" size={13} />
                        <span data-testid='booked-total' className="tabular-nums font-semibold">
                          {booked}/{total}
                          {typeof limitedTotal === "number" && typeof limitedBooked === "number" && limitedBooked > 0 && (
                            <>
                              <br />
                              <span className="tabular-nums font-semibold text-blue-800">
                                {limitedBooked}/{limitedTotal} ltd.
                              </span>
                            </>
                          )}
                        </span>
                      </span>
                    </>
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
              <br />
              <span className="text-blue-700">Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.</span>
            </div>
          )}
        </div>

        {/* Booking form (mostly unchanged) */}
        <div className="flex-1 bg-white border rounded-lg p-6">

          {/* ... form details as before ... */}
          {/* Paste the form part from previous, or keep as is for brevity ... */}
          {/* ... (not repeating here for brevity) ... */}

          {/* Everything from previous code for the booking form, paste unchanged here */}
          {/* In particular, make sure the edit mode continues to work using the updated editBookingId logic */}
          {/* ... */}
          {/* Booking form code unchanged - copy/paste previous content below here */}
          {/* ... */}
          {/* use all form from previous code, unchanged */}
          {/* ... */}
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
            const currentBooking =
              requestedBookings.find(b => b._id === editBookingId) ||
              bookings.find(b => b._id === editBookingId);
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


          {/* ... rest of form as before: paste unchanged ... */}
          {/* ... for brevity in this rewrite answer ... */}
          {/* ... All session time, repeat, package, and coupon logic unchanged ... */}
          {/* ... All form field rendering from previous code should remain, with logic unchanged ... */}
          {/* ... The canBook, onClick, error/success rendering and so on continue as designed ... */}
          {/* ... */}
       
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

          {/* Repeat Weekly Controls */}
          {!editBookingId && (
            <div className="mb-6 space-y-2 bg-blue-50 border border-blue-100 rounded p-3">
              <div className="flex items-center gap-2 font-medium text-blue-700">
                <FiRepeat className="text-blue-500" /> Repeat weekly (set all sessions to same day/time)
              </div>
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={repeatStartDate}
                    onChange={e => setRepeatStartDate(e.target.value)}
                    className="border rounded px-2 py-1 text-sm cursor-pointer"
                    min={today.toISOString().slice(0, 10)}
                    onFocus={e => e.target.showPicker && e.target.showPicker()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Day</label>
                  <select
                    value={repeatDay}
                    onChange={e => setRepeatDay(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select Day</option>
                    {DAYS.map((d) => (
                      <option value={d} key={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
                  <select
                    value={repeatSlotId}
                    onChange={e => setRepeatSlotId(e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="">Select Time Slot</option>
                    {SESSION_TIME_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label} {opt.limited ? " (Limited case)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    className="text-xs bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70 mt-1"
                    type="button"
                    style={{ minWidth: "110px" }}
                    onClick={handleRepeatApply}
                    disabled={
                      !repeatDay || !repeatStartDate || !repeatSlotId || !packageId
                    }
                  >
                    Apply
                  </button>
                  <button
                    className="ml-3 text-xs px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
                    type="button"
                    onClick={handleRepeatClear}
                  >
                    Clear
                  </button>
                </div>
              </div>
              {maxSelectableDates && packageId && (
                <div className="text-xs text-slate-500 mt-1">
                  Will set up to {maxSelectableDates} sessions {repeatDay && `on ${repeatDay}`} at selected time, skipping days where all therapists are on holiday or that slot is fully booked.
                  <br />
                  <span className="text-blue-700">Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.</span>
                </div>
              )}
              {repeatError && (
                <div className="text-xs text-red-600 mt-1">{repeatError}</div>
              )}
              {Object.keys(repeatConflictInfo).length > 0 && (
                <ul className="text-xs text-red-600 mt-1 space-y-0.5">
                  {Object.entries(repeatConflictInfo).map(([date, msg]) => (
                    <li key={date}>• {msg}</li>
                  ))}
                </ul>
              )}
              {!packageId && (
                <div className="text-xs text-blue-600 mt-1">
                  Please select package first.
                </div>
              )}
            </div>
          )}

          {/* Session Dates & Times */}
          {sessions.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
                <FiClock />
                Session Dates &#38; Times
              </div>
              {sessions
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((s, idx) => {
                  const slotInfo = getAvailableSlotsForDate(s.date, s.slotId);
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
                      {repeatConflictInfo[s.date] && (
                        <span className="inline-block ml-2 text-xs text-red-600">
                          {repeatConflictInfo[s.date]}
                        </span>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {selectedPackage && (
            <div className="w-full flex flex-col items-stretch mt-3 mb-3">
              <div className="flex flex-col gap-0.5 w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-sm text-slate-700 font-medium">Package Price</span>
                  <span className="font-mono text-base text-slate-900">
                    ₹
                    {selectedPackage.totalCost ??
                      (selectedPackage.costPerSession && getTotalSessionsForPackage(selectedPackage)
                        ? Number(selectedPackage.costPerSession) * Number(getTotalSessionsForPackage(selectedPackage))
                        : selectedPackage.costPerSession ??
                          "—"
                      )}
                  </span>
                </div>
                {(() => {
                  let discountValue = 0;
                  let coupon = null;
                  if (selectedCouponId) {
                    coupon = coupons.find(c => c._id === selectedCouponId);
                    if (coupon && coupon.discount) {
                      discountValue = Number(coupon.discount);
                    }
                  }
                  let pkgTotal = selectedPackage.totalCost ??
                    (selectedPackage.costPerSession && getTotalSessionsForPackage(selectedPackage)
                      ? Number(selectedPackage.costPerSession) * Number(getTotalSessionsForPackage(selectedPackage))
                      : 0);
                  if (discountValue > 0 && pkgTotal > 0) {
                    const discountedAmount = Math.round((pkgTotal * discountValue) / 100);
                    const afterDiscount = Math.max(pkgTotal - discountedAmount, 0);
                    return (
                      <>
                        <div className="flex justify-between items-center py-0.5">
                          <span className="text-sm text-emerald-700 font-medium">
                            Discount
                            {coupon ? ` (${coupon.code})` : ""}
                          </span>
                          <span className="text-base text-emerald-900 font-mono">
                            -{discountValue}% <span className="opacity-60 text-xs ml-1">(-₹{discountedAmount})</span>
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
                          <span className="text-base font-semibold text-blue-900">
                            <FiTag className="inline mr-1 text-blue-400" />Total After Discount
                          </span>
                          <span className="font-mono text-lg font-bold text-blue-900">
                            ₹{afterDiscount}
                          </span>
                        </div>
                      </>
                    );
                  }
                  if (discountValue === 0 && selectedCouponId && coupon) {
                    return (
                      <div className="flex justify-between items-center py-0.5">
                        <span className="text-sm text-orange-700 font-medium">Discount</span>
                        <span className="text-xs text-orange-700">Coupon "{coupon.code}" has no discount</span>
                      </div>
                    );
                  }
                  return (
                    <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
                      <span className="text-base font-semibold text-blue-900">
                        <FiTag className="inline mr-1 text-blue-400" />Total
                      </span>
                      <span className="font-mono text-lg font-bold text-blue-900">
                        ₹{pkgTotal}
                      </span>
                    </div>
                  );
                })()}
              </div>
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
                  : "Booking Request..."
                : editBookingId
                  ? "Update Booking"
                  : "Request Booking Now"}
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
              <br />
              Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.
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
        {/* NEW: Booking Request List */}
        <div className="mt-8">
          <div className="bg-white border rounded-lg p-4 text-sm">
            <p className="font-medium mb-2 flex items-center gap-2">
              <span>Requested Booking List</span>
              {requestsLoading && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">Loading…</span>
              )}
            </p>
            {requestedBookings && requestedBookings.length === 0 ? (
              <div>
                <p className="text-slate-500 mb-3">No requested bookings found.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {requestedBookings.map((br) => (
                  <div
                    className={`border p-3 rounded bg-sky-50 relative`}
                    key={br._id}
                  >
                    {/* Request ID (non-editable, always available) */}
                    {br.requestId && (
                      <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gray-700">
                        <FiHash className="text-blue-500" /> <span>Request ID: {br.requestId}</span>
                      </div>
                    )}
                    {/* Show therapist if available (optional in request stage) */}
                    {(() => {
                      let tObj: any = undefined;
                      if (typeof br.therapist === "object" && br.therapist !== null) {
                        tObj = br.therapist;
                      } else if (typeof br.therapist === "string" && br.therapist) {
                        // Find therapist if you have the therapists[] loaded
                      }
                      if (tObj && tObj.userId) {
                        return (
                          <div className="mb-2 flex items-center gap-2">
                            <FiUser className="text-slate-500" />
                            <span className="text-slate-700">Therapist: {tObj.userId?.name}{tObj.therapistId ? ` (${tObj.therapistId})` : ""}</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                    <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      {getPatientDisplayName(br.patient)}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiTag className="text-slate-500" />
                      <span className="text-slate-700">{br.therapy?.name}</span>
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiPackage className="text-purple-500" />
                      <span className="text-purple-700">
                        {getPackageDisplay(br.package)}
                      </span>
                    </div>
                    {Array.isArray(br.sessions) && br.sessions.length > 0 && (
                      <details className="mb-2 text-xs text-slate-700">
                        <summary className="font-medium cursor-pointer select-none flex items-center">
                          <span>Sessions ({br.sessions.length})</span>
                          <span className="ml-1"><FiChevronDown className="inline ml-1 text-slate-500" /></span>
                        </summary>
                        <div className="overflow-x-auto mt-2">
                          <table className="min-w-[340px] w-fit border-collapse text-xs">
                            <thead>
                              <tr>
                                <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">#</th>
                                <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
                                <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Time Slot</th>
                              </tr>
                            </thead>
                            <tbody>
                              {br.sessions.map((s, idx) => {
                                const slot = SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId);
                                return (
                                  <tr key={s._id || (s.date + s.slotId)}>
                                    <td className="px-2 py-1 border border-slate-200 text-slate-400">{idx + 1}</td>
                                    <td className="px-2 py-1 border border-slate-200">
                                      {s.date}
                                    </td>
                                    <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                      {slot
                                        ? (
                                            <>
                                              {slot.label}
                                              {slot.limited && <span className="text-amber-700 ml-1">(Limited case)</span>}
                                            </>
                                          )
                                        : s.slotId}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}
                    {/* Discount info, if available */}
                    {br.discountInfo && br.discountInfo.coupon && br.discountInfo.coupon.discountEnabled && (
                      <div className="mb-1 text-xs text-blue-700">
                        Discount: <span className="font-semibold">
                          {br.discountInfo.coupon.discount}%
                        </span>
                        {" "}
                        (Coupon: <span className="font-mono">
                          {br.discountInfo.coupon.couponCode}
                        </span>
                          {br.discountInfo.coupon.validityDays && (
                            <> {` - valid ${br.discountInfo.coupon.validityDays}d`}</>
                          )}
                        )
                      </div>
                    )}
                    {/* Status & Actions row */}
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase
                        ${
                          br.requestStatus === "pending"
                            ? "bg-yellow-200 text-yellow-900"
                            : br.requestStatus === "approved"
                              ? "bg-green-200 text-green-900"
                              : br.requestStatus === "rejected"
                                ? "bg-red-200 text-red-800"
                                : "bg-gray-100 text-gray-700"
                        }
                      `}>
                        {br.requestStatus || "Pending"}
                      </span>
                      <div className="flex gap-2">
                        <button
                          className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                          title="Edit booking request"
                          onClick={() => {
                            setEditBookingId(br._id);
                            setBookingError(null);
                            setBookingSuccess(null);
                          }}
                        >
                          <FiEdit2 />
                          Edit
                        </button>
                        <button
                          className="text-xs rounded px-2 py-1 border border-red-400 text-red-600 hover:bg-red-50 flex items-center gap-1"
                          title="Delete booking request"
                          onClick={() => handleDeleteRequest(br._id)}
                        >
                          <FiTrash2 />
                          Delete
                        </button>
                      </div>
                    </div>
                    {/* Optional "Editing" banner if in edit mode */}
                    {editBookingId === br._id && (
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
