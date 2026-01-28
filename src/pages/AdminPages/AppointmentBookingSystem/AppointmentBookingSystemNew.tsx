import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo, FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiUser, FiTag,
  FiChevronUp, FiChevronDown, FiList, FiPackage, FiEdit2, FiX, FiHash,
  FiCheckCircle, FiCreditCard
} from "react-icons/fi";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router";

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

type Patient = { id: string; patientId: string; name: string; phoneNo?: string };
type Therapy = { _id: string; name: string };
type Package = { _id: string; name: string; totalSessions?: number; costPerSession?: number; totalCost?: number; sessionCount?: number };
type TherapistHoliday = { date: string; reason?: string; isFullDay?: boolean; slots?: Array<{ slotId: string; label: string }> };
type Therapist = {
  _id: string;
  therapistId: string;
  name: string;
  holidays?: TherapistHoliday[];
  mobile1?: string;
  bookedSlots?: { [date: string]: string[] };
  bookedSlotCount?: { [date: string]: number };
};
type BookingSession = {
  date: string;
  slotId: string;
  therapistId?: string;
  therapyType?: string; // from earlier API
  therapyTypeId?: {
    _id: string;
    name: string;
    [key: string]: any;
  } | string;
  _id?: string;
  therapist?: {
    _id: string;
    therapistId: string;
    name: string;
    [key: string]: any;
  };
  [key: string]: any;
};

type Booking = {
  _id: string;
  appointmentId?: string;
  patient: Patient;
  therapy: Therapy;
  package: Package | null;
  therapist: Therapist | string;
  sessions: BookingSession[];
  discountInfo?: { coupon: any; time?: string };
  isPaid?: boolean;
  payment?: {
    status?: string;
  };
  remark?: string;
};

function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function getDateKey(year: number, month: number, day: number): string { return `${year}-${pad2(month)}-${pad2(day)}`; }
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getStartDay(year: number, month: number) { return new Date(year, month, 1).getDay(); }
// function getDayIndex(dayShort: string): number { const idx = DAYS.findIndex(d => d === dayShort.toUpperCase()); return idx >= 0 ? idx : 0; }

export default function AppointmentBookingSystemNew() {
  const location = useLocation();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState<string>("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponStatus, setCouponStatus] = useState<null | "valid" | "invalid">(null);

  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [patientId, setPatientId] = useState<string>("");
  const [therapyId, setTherapyId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [therapistId, setTherapistId] = useState<string>("");
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [remark, setRemark] = useState<string>("");

  const [paymentLoadingBookingId, setPaymentLoadingBookingId] = useState<string | null>(null);

  // const [repeatDay, setRepeatDay] = useState<string>("");
  // const [repeatStartDate, setRepeatStartDate] = useState<string>("");
  // const [repeatSlotId, setRepeatSlotId] = useState<string>("");
  // const [repeatError, setRepeatError] = useState<string | null>(null);
  // const [repeatConflictInfo, setRepeatConflictInfo] = useState<{ [date: string]: string }>({});
  const [bookedSlotsPerRow, setBookedSlotsPerRow] = useState<{ [rowKey: string]: string[] }>({});

  const [isBookingRequest, setIsBookingRequest] = useState<boolean>(false);
  const [bookingRequestId, setBookingRequestId] = useState<string>("");
  const [isSessionEditRequest, setIsSessionEditRequest] = useState<boolean>(false);
  const [sessionEditRequestId, setSessionEditRequestId] = useState<string>("");

  useEffect(() => {
    if (location.state && (location.state as any).bookingRequest) {
      const req = (location.state as any).bookingRequest;
      setPatientId(req.patient?._id || "");
      setTherapyId(req.therapy?._id || "");
      setPackageId(req.package?._id || "");
      setIsBookingRequest(true);
      setBookingRequestId(req._id || "");
      if (Array.isArray(req.sessions)) {
        setSessions(req.sessions.map((s: any) => ({
          date: s.date || "",
          slotId: s.slotId || s.time || "",
          therapistId: req.therapist?._id || req.therapist || "",
          therapyTypeId:
            typeof s.therapyTypeId === "object"
              ? s.therapyTypeId
              : typeof s.therapyTypeId === "string"
                ? (
                    therapies.find((t: Therapy) => t._id === s.therapyTypeId)
                      ? {
                          _id: s.therapyTypeId,
                          name: therapies.find((t: Therapy) => t._id === s.therapyTypeId)?.name || ""
                        } : { _id: s.therapyTypeId, name: "" }
                  )
                : req.therapy?._id
                  ? {
                      _id: req.therapy._id,
                      name: req.therapy.name || ""
                    }
                  : ""
        })));
        setTherapistId(req.therapist?._id || req.therapist || "");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, therapies]);

  useEffect(() => {
    if (location.state && (location.state as any).sessionEditRequest) {
      const req = (location.state as any).sessionEditRequest;
      setIsSessionEditRequest(true);
      setSessionEditRequestId(req._id || "");
      handleEditBooking(req.appointmentId._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  type DaySlotSummary = {
    bookedSlots: number;
    totalAvailableSlots: number;
    limitedBookedSlots: number;
    totalLimitedAvailableSlots: number;
    BookedSlots: { [therapistId: string]: string[] };
  };
  type MonthlySlotsSummary = { [date: string]: DaySlotSummary };
  const [monthlySlotSummary, setMonthlySlotSummary] = useState<MonthlySlotsSummary>({});

  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    setApiLoading(true);
    setApiError(null);
    setPatients([]); setTherapists([]); setTherapies([]); setPackages([]);
    setCoupons([]);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    fetch(`${endpoint}/api/admin/bookings/home-details`)
      .then(async resp => {
        if (!resp.ok) throw new Error("Failed API call");
        const parsed = await resp.json();
        let couponArr = (parsed.coupons || []).map((c: any) => ({
          _id: c._id,
          couponCode: c.couponCode,
          discount: c.discount,
          validityDays: c.validityDays,
          discountEnabled: c.discountEnabled,
        }));
        setPatients(parsed.patients || []);
        setTherapists(parsed.therapists || []);
        setTherapies(parsed.therapyTypes || []);
        setPackages(parsed.packages || []);
        setCoupons(couponArr);
        setApiLoading(false);
      })
      .catch(() => {
        setApiError("Could not load booking data."); setApiLoading(false);
      });
  }, []);


  const [bookings, setBookings] = useState<Booking[]>([]);
  // const [setFetchBooking, fetchBooking] = useState<boolean>(false);
  const [bookingsLoading, setBookingsLoading] = useState<boolean>(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  

  // Build monthly slot summary
  useEffect(() => {
    if (therapists.length === 0) return;
    let summary: MonthlySlotsSummary = {};
    for (let day = 1; day <= daysInMonth; ++day) {
      const jsDate = new Date(year, month, day);
      const dateKeyApi = `${jsDate.getFullYear()}-${pad2(jsDate.getMonth() + 1)}-${pad2(jsDate.getDate())}`;
      let totalNormalSlots = 0;
      let totalLimitedSlots = 0;
      let totalNormalBooked = 0;
      let totalLimitedBooked = 0;
      const therapistsBookedSlots: { [therapistId: string]: string[] } = {};

      for (const t of therapists) {
        // Sunday is NOT holiday, allow normal slot counts.
        // Remove all jsDate.getDay() === 0 holiday logic.
        let fullDayHoliday = (t.holidays || []).find(h => h.date === dateKeyApi && (h.isFullDay === true || h.isFullDay === undefined));
        if (fullDayHoliday) {
          therapistsBookedSlots[t._id] = [];
          continue;
        }
        let slotsOut: string[] = [];
        for (const h of (t.holidays || [])) {
          if (h.date === dateKeyApi && h.isFullDay === false && h.slots && h.slots.length > 0) {
            slotsOut.push(...h.slots.map((s: any) => s.slotId));
          }
        }
        let normalSlots = 10;
        let limitedSlots = 5;
        // Remove Sunday slot zeroing; allow full slots even on Sunday.
        for (const so of slotsOut) {
          const slotData = SESSION_TIME_OPTIONS.find(opt => opt.id === so);
          if (!slotData) continue;
          if (slotData.limited) limitedSlots = Math.max(0, limitedSlots - 1);
          else normalSlots = Math.max(0, normalSlots - 1);
        }
        totalNormalSlots += normalSlots;
        totalLimitedSlots += limitedSlots;

        const bookedArr = (t.bookedSlots && t.bookedSlots[dateKeyApi]) ? t.bookedSlots[dateKeyApi] : [];
        therapistsBookedSlots[t._id] = bookedArr;
        for (const slotId of bookedArr) {
          const slotData = SESSION_TIME_OPTIONS.find(opt => opt.id === slotId);
          if (slotData) {
            if (slotData.limited) totalLimitedBooked++;
            else totalNormalBooked++;
          }
        }
      }

      summary[`${pad2(day)}-${pad2(month + 1)}-${year}`] = {
        bookedSlots: totalNormalBooked,
        totalAvailableSlots: totalNormalSlots,
        limitedBookedSlots: totalLimitedBooked,
        totalLimitedAvailableSlots: totalLimitedSlots,
        BookedSlots: therapistsBookedSlots
      };
    }
    setMonthlySlotSummary(summary);
  }, [therapists, year, month, daysInMonth]);

  useEffect(() => {
    const mapping: { [key: string]: string[] } = {};
    for (const s of sessions) {
      const tId = s.therapistId || therapistId || (therapists[0]?._id || "");
      if (!tId || !s.date) continue;
      const dt = s.date;
      const parts = dt.split("-");
      if (parts.length !== 3) continue;
      const apiKey = `${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`;
      const daySummary = monthlySlotSummary[apiKey];
      if (daySummary && daySummary.BookedSlots && daySummary.BookedSlots[tId])
        mapping[`${s.date}:${tId}`] = daySummary.BookedSlots[tId];
      else mapping[`${s.date}:${tId}`] = [];
    }
    setBookedSlotsPerRow(mapping);
  }, [sessions, therapistId, therapists, monthlySlotSummary]);

  const selectedPackage = packages.find((p) => p._id === packageId) || null;
  const selectedPatient = patients.find((p) => p.id === patientId) || null;
  const selectedTherapy = therapies.find((t) => t._id === therapyId) || null;
  const selectedTherapist = therapists.find((t) => t._id === therapistId) || null;

  function getTotalSessionsForPackage(pkg: Package | null) {
    if (!pkg) return undefined;
    return (
      pkg.totalSessions || pkg.sessionCount ||
      (() => {
        const m = pkg.name?.match(/^\s*(\d+)[^\d]/);
        return m ? Number(m[1]) : undefined;
      })()
    );
  }
  const maxSelectableDates = getTotalSessionsForPackage(selectedPackage);

  useEffect(() => {
    if (maxSelectableDates === undefined) return;
    if (sessions.length > maxSelectableDates) {
      setSessions((prev) => prev.slice(0, maxSelectableDates));
    }
  }, [packageId, maxSelectableDates, sessions.length]);

  const changeMonth = (dir: "prev" | "next") => {
    if (dir === "prev") {
      if (month === 0) {
        setMonth(11); setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else {
      if (month === 11) {
        setMonth(0); setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
  };

  function getServerDaySlotSummary(dateKey: string) {
    const parts = dateKey.split("-");
    if (parts.length !== 3) return undefined;
    const apiKey = `${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`;
    return monthlySlotSummary[apiKey];
  }
  function getDaySlotSummary(dateStr: string) {
    const daySummary = getServerDaySlotSummary(dateStr);
    if (!daySummary) return { total: undefined, booked: undefined, limitedTotal: undefined, limitedBooked: undefined };
    return {
      total: daySummary.totalAvailableSlots,
      booked: daySummary.bookedSlots,
      limitedTotal: daySummary.totalLimitedAvailableSlots,
      limitedBooked: daySummary.limitedBookedSlots
    };
  }

  // Correctly create per-session therapyTypeId as a therapy object
  const toggleDate = (day: number) => {
    const dateKey = getDateKey(year, month + 1, day);

    if (
      typeof maxSelectableDates === "number" &&
      sessions.length >= maxSelectableDates
    ) return;

    let therapyTypeObj: { _id: string; name: string } | undefined = undefined;
    if (therapyId) {
      const therapyObj = therapies.find((t) => t._id === therapyId);
      therapyTypeObj = {
        _id: therapyId,
        name: (therapyObj && therapyObj.name) || "",
      };
    }

    setSessions((prev) => [
      ...prev,
      {
        date: dateKey,
        slotId: "",
        therapistId: therapistId || (therapists[0]?._id || ""),
        ...(therapyTypeObj ? { therapyTypeId: therapyTypeObj } : {}),
      } as BookingSession
    ]);
  };

  // Prevent duplicate time slot for a date
  const updateSlotId = (date: string, slotId: string, idx: number) => {
    setSessions((prev) =>
      prev.map((s, i) => {
        if (i === idx) {
          const isDuplicate = prev.some(
            (other, oi) => oi !== idx && other.date === date && other.slotId === slotId
          );
          if (isDuplicate) {
            toast.error("You can't select the same time slot for the same date.");
            return s;
          }
          return { ...s, slotId };
        }
        return s;
      })
    );
  };

  // Per-row therapist selection
  const updateSessionTherapist = (idx: number, newTherapistId: string) => {
    setSessions((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, therapistId: newTherapistId } : s))
    );
  };

  // Per-row therapyType (session) selection: set full therapy object as .therapyTypeId
  const updateSessionTherapyType = (idx: number, newTherapyTypeId: string) => {
    setSessions((prev) =>
      prev.map((s, i) => {
        if (i === idx) {
          let therapyObj = therapies.find((t) => t._id === newTherapyTypeId);
          return {
            ...s,
            therapyTypeId: therapyObj
              ? { _id: therapyObj._id, name: therapyObj.name }
              : { _id: newTherapyTypeId, name: "" }
          };
        }
        return s;
      })
    );
  };

  const removeSession = (removeIdx: number) => {
    setSessions((prev) => prev.filter((_, idx) => idx !== removeIdx));
  };

  function getFirstSessionEarliest(sessions: { date: string; slotId: string }[]) {
    if (!sessions || sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0];
  }
  const earliestSession = getFirstSessionEarliest(sessions);

  const canBook = Boolean(selectedPatient) && Boolean(selectedPackage) &&
    sessions.length > 0 && Boolean(earliestSession && earliestSession.slotId) &&
    sessions.every((s, idx, arr) =>
      !arr.some((os, oidx) => oidx !== idx && s.date === os.date && s.slotId === os.slotId)
    ) &&
    sessions.every((s) =>
      !!(
        (typeof s.therapyTypeId === "object" && s.therapyTypeId && (s.therapyTypeId as any)._id && (s.therapyTypeId as any).name) ||
        (typeof s.therapyTypeId === "string" && s.therapyTypeId)
      )
    );

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
        const m = pkg.name?.match(/^\s*(\d+)[^\d]/);
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

  const handleBookOrUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBookingSuccess(null);
    setBookingError(null);
    if (!canBook) {
      const message = "Please fill all required fields and select a session date, time, therapist, and therapy type.";
      setBookingError(message); toast.error(message); return;
    }
    setBookingLoading(true);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");

    try {
      const body: any = {
        patient: selectedPatient?.id,
        therapy: selectedTherapy?._id,
        package: selectedPackage?._id,
        therapist: selectedTherapist?._id,
        sessions: sessions.map(sess => {
          let therapyTypeIdValue;
          if (typeof sess.therapyTypeId === "object" && sess.therapyTypeId && (sess.therapyTypeId as any)._id) {
            therapyTypeIdValue = sess.therapyTypeId;
          } else if (typeof sess.therapyTypeId === "string") {
            const therapyObj = therapies.find((t) => t._id === sess.therapyTypeId);
            therapyTypeIdValue = therapyObj
              ? { _id: therapyObj._id, name: therapyObj.name }
              : { _id: sess.therapyTypeId, name: "" };
          } else {
            therapyTypeIdValue = therapyId
              ? (() => {
                const therapyObj = therapies.find((t) => t._id === therapyId);
                return therapyObj
                  ? { _id: therapyObj._id, name: therapyObj.name }
                  : { _id: therapyId, name: "" };
              })()
              : "";
          }
          return {
            date: sess.date,
            slotId: sess.slotId,
            therapistId: sess.therapistId || selectedTherapist?._id,
            therapyTypeId: therapyTypeIdValue,
          };
        }),
        coupon: appliedCoupon?._id ?? null,
        bookingRequestId,
        isBookingRequest,
        isSessionEditRequest,
        sessionEditRequestId,
        remark: remark,
      };

      if (!editBookingId) {
        const resp = await fetch(`${endpoint}/api/admin/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err?.message || "Failed to create booking.");
        }
        setBookingSuccess("Booking successfully created.");
      } else {
        const resp = await fetch(`${endpoint}/api/admin/bookings/${editBookingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!resp.ok) {
          const err = await resp.json();
          throw new Error(err?.message || "Failed to update booking.");
        }
        setBookingSuccess("Booking successfully updated.");
      }
      resetForm();
      setBookingLoading(!bookingLoading);
    } catch (error: any) {
      setBookingError(error?.message || "Failed to submit booking.");
    } finally {
      setBookingLoading(false);
      setTimeout(() => setBookingSuccess(null), 2000);
    }
  };

  function handleEditBooking(bookingId: string) {
    // Scroll to top when editing a booking
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setEditBookingId(bookingId);
    setBookingError(null);
    setBookingSuccess(null);
    const booking = bookings.find(b => b._id === bookingId);
    if (booking) {
      const mainTherapistId =
        (typeof booking.therapist === "string" && booking.therapist) ||
        ((booking.therapist as any)?._id) || "";
      setTherapistId(mainTherapistId);
      const foundPatient = patients.find(p => {
        return (
          (p.patientId && (booking.patient as any)?.patientId && p.patientId === (booking.patient as any)?.patientId) ||
          (p.id && (booking.patient as any)?.id && p.id === (booking.patient as any)?.id)
        );
      });
      setPatientId(foundPatient ? foundPatient.id : ((booking.patient as any)?.id || ""));
      setTherapyId((booking.therapy as any)?._id || "");
      setPackageId((booking.package as any)?._id || "");
      setSessions(
        Array.isArray(booking.sessions)
          ? booking.sessions.map((s) => {
              // Set therapyTypeId as a proper object
              let therapyTypeObj;
              if (typeof s.therapyTypeId === "object") {
                therapyTypeObj = s.therapyTypeId && s.therapyTypeId._id
                  ? { _id: s.therapyTypeId._id, name: s.therapyTypeId.name || "" }
                  : { _id: "", name: "" };
              } else if (typeof s.therapyTypeId === "string") {
                const foundTherapy = therapies.find((tt) => tt._id === s.therapyTypeId);
                therapyTypeObj = foundTherapy
                  ? { _id: foundTherapy._id, name: foundTherapy.name }
                  : { _id: s.therapyTypeId, name: "" };
              } else {
                const bTherapy = typeof booking.therapy === "object" && booking.therapy._id ? booking.therapy : undefined;
                therapyTypeObj = bTherapy ? { _id: bTherapy._id, name: bTherapy.name || "" } : { _id: "", name: "" };
              }
              return {
                date: s.date,
                slotId: s.slotId ?? "",
                therapistId:
                  s.therapistId ||
                  (s.therapist && typeof s.therapist === "object" && s.therapist._id) ||
                  (s.therapist && typeof s.therapist === "string" ? s.therapist : "") ||
                  mainTherapistId,
                therapyTypeId: therapyTypeObj,
              };
            })
          : []
      );
      let couponObj: any = null;
      if (booking && booking.discountInfo && booking.discountInfo.coupon) {
        const c = booking.discountInfo.coupon;
        couponObj = coupons.find(x =>
          (x.couponCode === c.couponCode) ||
          (x._id === c._id)
        );
      }
      setAppliedCoupon(couponObj || null);
      setCouponInput(couponObj?.couponCode || "");
      setCouponStatus(couponObj ? "valid" : null);

      setRemark(booking.remark || "");
    }
    // setRepeatDay(""); setRepeatStartDate(""); setRepeatSlotId("");
    // setRepeatError(null); setRepeatConflictInfo({});
  }

  function handleCancelEdit() {
    resetForm();
  }

  function resetForm() {
    setPatientId(""); setTherapyId(""); setPackageId(""); setTherapistId("");
    setSessions([]); setEditBookingId(null);
    setBookingError(null); setBookingSuccess(null);
    // setRepeatDay(""); setRepeatStartDate(""); setRepeatSlotId("");
    // setRepeatError(null); setRepeatConflictInfo({});
    setBookedSlotsPerRow({});
    setCouponInput(""); setAppliedCoupon(null); setCouponStatus(null);
    setRemark("");
  }

  function handleCouponApply() {
    if (!couponInput.trim()) {
      setCouponStatus(null);
      setAppliedCoupon(null);
      return;
    }
    const match = coupons.find(
      c =>
        c.couponCode?.toLowerCase() === couponInput.trim().toLowerCase() &&
        c.discountEnabled
    );
    if (match) {
      setAppliedCoupon(match);
      setCouponStatus("valid");
    } else {
      setAppliedCoupon(null);
      setCouponStatus("invalid");
    }
  }
  function handleCouponClear() {
    setCouponInput(""); setAppliedCoupon(null); setCouponStatus(null);
  }

  function getAvailableSlotsForDate(
    date: string,
    selectedSessions: { date: string; slotId: string; therapistId?: string }[],
    currSelectedSlotId: string,
    currRowTherapistId?: string,
    currRowIsEdit?: boolean
  ) {
    console.log(selectedSessions,currSelectedSlotId,currRowIsEdit);
    if (!therapists || therapists.length === 0) {
      const disabledAll: { [slotId: string]: { disabled: boolean; reason: string } } = {};
      SESSION_TIME_OPTIONS.forEach(opt => {
        disabledAll[opt.id] = { disabled: true, reason: "No therapist data" };
      });
      return disabledAll;
    }
    let therapist: Therapist | undefined = undefined;
    if (currRowTherapistId) {
      therapist = therapists.find(t => t._id === currRowTherapistId);
    }
    if (!therapist) therapist = therapists[0];
    if (!therapist) {
      const disabledAll: { [slotId: string]: { disabled: boolean; reason: string } } = {};
      SESSION_TIME_OPTIONS.forEach(opt => {
        disabledAll[opt.id] = { disabled: true, reason: "No therapist selected" };
      });
      return disabledAll;
    }
    const holidays: TherapistHoliday[] = Array.isArray(therapist.holidays) ? therapist.holidays! : [];
    const bookedSlotsObj: Record<string, string[]> = therapist.bookedSlots || {};

    const slotInfo: { [slotId: string]: { disabled: boolean; reason: string } } = {};
    const jsDate = new Date(date);
    const apiDate = `${jsDate.getFullYear()}-${pad2(jsDate.getMonth() + 1)}-${pad2(jsDate.getDate())}`;

    // Remove Sunday is-holiday logic: do not disable slots for Sunday.
    // Instead: treat like any other day unless holiday defined in therapist.holidays.
    let isFullDayHoliday = holidays.find(
      h => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined)
    );
    if (isFullDayHoliday) {
      SESSION_TIME_OPTIONS.forEach(opt => {
        slotInfo[opt.id] = { disabled: true, reason: "Unavailable Slot" };
      });
      return slotInfo;
    }
    let slotsOut: string[] = [];
    for (const h of holidays) {
      if (
        h.date === apiDate &&
        h.isFullDay === false &&
        Array.isArray(h.slots) &&
        h.slots.length > 0
      ) {
        slotsOut.push(...h.slots.map((s: any) => s.slotId));
      }
    }
    const booked = Array.isArray(bookedSlotsObj[apiDate]) ? bookedSlotsObj[apiDate] : [];
    let normalSlotsLeft = 10 - booked.filter(id => {
      const s = SESSION_TIME_OPTIONS.find(opt => opt.id === id);
      return s ? !s.limited : false;
    }).length;
    let limitedSlotsLeft = 5 - booked.filter(id => {
      const s = SESSION_TIME_OPTIONS.find(opt => opt.id === id);
      return s ? !!s.limited : false;
    }).length;
    for (const so of slotsOut) {
      const slotData = SESSION_TIME_OPTIONS.find(opt => opt.id === so);
      if (!slotData) continue;
      if (slotData.limited) limitedSlotsLeft = Math.max(0, limitedSlotsLeft - 1);
      else normalSlotsLeft = Math.max(0, normalSlotsLeft - 1);
    }
    for (const slot of SESSION_TIME_OPTIONS) {
      if (slotsOut.includes(slot.id)) {
        slotInfo[slot.id] = { disabled: true, reason: "Unavailable slot" };
      } else if (booked.includes(slot.id)) {
        slotInfo[slot.id] = { disabled: true, reason: "Already booked" };
      } else if (slot.limited && limitedSlotsLeft <= 0) {
        slotInfo[slot.id] = { disabled: true, reason: "No limited slots" };
      } else if (!slot.limited && normalSlotsLeft <= 0) {
        slotInfo[slot.id] = { disabled: true, reason: "No normal slots" };
      } else {
        slotInfo[slot.id] = { disabled: false, reason: "" };
      }
    }
    return slotInfo;
  }

  // function getNextNDatesWeekly(
  //   startDate: Date,
  //   sessionCount: number,
  //   dayOfWeek: number,
  //   therapist: Therapist | undefined
  // ): string[] {
  //   let dates: string[] = [];
  //   let date = new Date(startDate);
  //   while (date.getDay() !== dayOfWeek) {
  //     date.setDate(date.getDate() + 1);
  //   }
  //   while (dates.length < sessionCount) {
  //     // Remove Sunday skip: do not exclude Sunday from valid dates.
  //     const dApi = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  //     let isHoliday = false;
  //     if (
  //       therapist &&
  //       Array.isArray(therapist.holidays) &&
  //       therapist.holidays.find(h => h.date === dApi && (h.isFullDay === true || h.isFullDay === undefined))
  //     ) {
  //       isHoliday = true;
  //     }
  //     if (!isHoliday) dates.push(`${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`);
  //     date.setDate(date.getDate() + 7);
  //   }
  //   return dates;
  // }

  // function handleRepeatApply() {
  //   setRepeatError(null); setRepeatConflictInfo({});
  //   if (!repeatDay || !repeatStartDate || !repeatSlotId) {
  //     setRepeatError("Please select start date, weekday, and time slot.");
  //     return;
  //   }
  //   if (!selectedTherapist) {
  //     setRepeatError("Please select a therapist.");
  //     return;
  //   }
  //   if (!maxSelectableDates || !selectedPackage) {
  //     setRepeatError("Please select a package.");
  //     return;
  //   }
  //   const start = new Date(repeatStartDate);
  //   const wantedDayNum = getDayIndex(repeatDay);
  //   while (start.getDay() !== wantedDayNum) start.setDate(start.getDate() + 1);
  //   const sessionsOnTargetDay = getNextNDatesWeekly(
  //     start, maxSelectableDates, wantedDayNum, selectedTherapist
  //   );
  //   let conflicts: { [date: string]: string } = {};
  //   let validSessions: BookingSession[] = [];
  //   for (const date of sessionsOnTargetDay) {
  //     const slotInfo = getAvailableSlotsForDate(date, [], repeatSlotId, selectedTherapist._id, false);
  //     if (slotInfo[repeatSlotId].disabled) {
  //       conflicts[date] = slotInfo[repeatSlotId].reason || "Slot unavailable";
  //     } else {
  //       let therapyTypeObj: { _id: string; name: string } | undefined = undefined;
  //       if (therapyId) {
  //         const th = therapies.find((t) => t._id === therapyId);
  //         therapyTypeObj = th
  //           ? { _id: th._id, name: th.name }
  //           : { _id: therapyId, name: "" };
  //       }
  //       validSessions.push({
  //         date,
  //         slotId: repeatSlotId,
  //         therapistId: selectedTherapist._id,
  //         ...(therapyTypeObj ? { therapyTypeId: therapyTypeObj } : {}),
  //       });
  //     }
  //   }
  //   setRepeatConflictInfo(conflicts);
  //   setSessions(validSessions);
  //   if (Object.keys(conflicts).length > 0) {
  //     setRepeatError("Some slots/days were not available and skipped.");
  //   } else {
  //     setRepeatError(null);
  //   }
  // }

  // function handleRepeatClear() {
  //   setRepeatDay(""); setRepeatStartDate(""); setRepeatSlotId(""); setRepeatError(null); setRepeatConflictInfo({}); setSessions([]);
  // }

  function getTherapistObject(booking: Booking): Therapist | undefined {
    if (booking.therapist && typeof booking.therapist === "object" && "_id" in booking.therapist) {
      return booking.therapist as Therapist;
    }
    if (typeof booking.therapist === "string") {
      return therapists.find(t => t._id === booking.therapist);
    }
    return undefined;
  }

  function handleReset() {
    resetForm();
  }

  async function handleCollectPayment(booking: Booking) {
    if (!booking || !booking._id) return;
    if (!window.confirm("Confirm collect payment for this booking?")) return;
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    setPaymentLoadingBookingId(booking._id);
    try {
      const resp = await fetch(`${endpoint}/api/admin/bookings/${booking._id}/collect-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err?.message || "Payment collection failed.");
      }
      toast.success("Payment marked as collected.");
      setBookingLoading(!bookingLoading);


    } catch (err: any) {
      toast.error(err?.message || "Payment collection failed.");
    } finally {
      setPaymentLoadingBookingId(null);
    }
  }

  // --- UI ---
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <HeaderGuide
        guideOpen={guideOpen}
        setGuideOpen={setGuideOpen}
        editBookingId={editBookingId}
      />
      <div className={`flex flex-col gap-6`}>
        <CalendarPanel
          year={year}
          month={month}
          changeMonth={changeMonth}
          startDay={startDay}
          daysInMonth={daysInMonth}
          sessions={sessions}
          toggleDate={toggleDate}
          getDaySlotSummary={getDaySlotSummary}
          maxSelectableDates={maxSelectableDates}
        />
        <div className="flex-1 bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {editBookingId ? "Edit Booking" : "Quick Book"}
              {editBookingId && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">Editing</span>
              )}
            </h3>
            <button
              type="button"
              className="ml-4 px-3 py-1 rounded text-xs bg-red-100 text-red-700 font-medium hover:bg-red-200 transition"
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
          {/* Therapist (Initial reference only) */}
          <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Therapist</label>
          <select
            value={therapistId}
            onChange={e => setTherapistId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            disabled={!!editBookingId}
          >
            <option value="">Select Therapist</option>
            {therapists.map((t: Therapist) => (
              <option key={t._id} value={t._id}>
                {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
              </option>
            ))}
          </select>
          {/* Appointment ID (edit only) */}
          {editBookingId && (() => {
            const currentBooking = bookings?.find((b: Booking) => b._id === editBookingId);
            if (currentBooking && currentBooking.appointmentId) {
              return (
                <div className="mb-3">
                  <label className="block text-sm mb-1 flex items-center gap-1 text-gray-700 font-semibold"><FiHash />Booking ID</label>
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
          {/* Patient */}
          <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Patient Name</label>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            disabled={!!editBookingId}
          >
            <option value="">Select Patient</option>
            {patients.map((patient: Patient) => (
              <option key={patient.id} value={patient.id}>{getPatientDisplayName(patient)}</option>
            ))}
          </select>
          {/* Therapy (reference) */}
          <label className="block text-sm mb-1 flex items-center gap-1"><FiTag /> Therapy Type</label>
          <select
            value={therapyId}
            onChange={e => setTherapyId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Therapy</option>
            {therapies.map((therapy: Therapy) => (
              <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
            ))}
          </select>
          {/* Package */}
          <label className="block text-sm mb-1 flex items-center gap-1"><FiPackage /> Package</label>
          <select
            value={packageId}
            onChange={e => setPackageId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-5"
          >
            <option value="">Select Package</option>
            {packages.map((pkg: Package) => (
              <option key={pkg._id} value={pkg._id}>{getPackageDisplay(pkg)}</option>
            ))}
          </select>
          {/* Coupon input */}
          <label className="block text-sm mb-1 font-semibold text-blue-700">Discount Coupon</label>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter Coupon Code"
              value={couponInput}
              onChange={e => { setCouponInput(e.target.value); setCouponStatus(null); }}
              disabled={!!editBookingId}
            />
            <button
              type="button"
              className="px-3 py-2 rounded bg-blue-500 text-white text-xs"
              style={{ minWidth: 90 }}
              onClick={handleCouponApply}
              disabled={!couponInput.trim()}
            >Apply</button>
            <button
              type="button"
              className="px-3 py-2 rounded bg-gray-200 text-gray-900 text-xs"
              style={{ minWidth: 70 }}
              disabled={!couponInput.trim()}
              onClick={handleCouponClear}
            >Clear</button>
          </div>
          {couponStatus === "valid" && appliedCoupon && (
            <div className="text-xs text-blue-700 mb-4">
              🔖 Coupon <span className="font-mono">{appliedCoupon.couponCode}</span> applied! {appliedCoupon.discount}% off, valid {appliedCoupon.validityDays} days.
            </div>
          )}
          {couponStatus === "invalid" && (
            <div className="text-xs text-red-600 mb-4">
              🚫 Invalid or expired coupon code.
            </div>
          )}

          {/* REMARK FIELD UI */}
          <label className="block text-sm mb-1 font-semibold text-slate-700">Remark</label>
          <textarea
            className="w-full border rounded px-3 py-2 mb-4"
            rows={2}
            placeholder="Add a remark or note for this booking (optional)"
            value={remark}
            onChange={e => setRemark(e.target.value)}
          />

          {/* {!editBookingId && (
            <RepeatWeeklyPanel
              repeatDay={repeatDay}
              setRepeatDay={setRepeatDay}
              repeatStartDate={repeatStartDate}
              setRepeatStartDate={setRepeatStartDate}
              repeatSlotId={repeatSlotId}
              setRepeatSlotId={setRepeatSlotId}
              today={today}
              handleRepeatApply={handleRepeatApply}
              handleRepeatClear={handleRepeatClear}
              maxSelectableDates={maxSelectableDates}
              packageId={packageId}
              repeatError={repeatError}
              repeatConflictInfo={repeatConflictInfo}
              therapistId={therapistId}
            />
          )} */}
          {sessions.length > 0 && (
            <SessionDatesTimesTable
              sessions={sessions}
              updateSlotId={updateSlotId}
              updateSessionTherapist={updateSessionTherapist}
              updateSessionTherapyType={updateSessionTherapyType}
              editBookingId={editBookingId}
              therapists={therapists}
              therapistId={therapistId}
              therapies={therapies}
              therapyId={therapyId}
              SESSION_TIME_OPTIONS={SESSION_TIME_OPTIONS}
              getAvailableSlotsForDate={getAvailableSlotsForDate}
              bookedSlotsPerRow={bookedSlotsPerRow}
              selectedTherapist={selectedTherapist}
              // repeatConflictInfo={repeatConflictInfo}
              removeSession={removeSession}
            />
          )}
          {selectedPackage && (
            <PricingSummary
              selectedPackage={selectedPackage}
              getTotalSessionsForPackage={getTotalSessionsForPackage}
              appliedCoupon={appliedCoupon}
            />
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
                <FiX className="inline mr-1" />Cancel Edit
              </button>
            )}
          </div>
          {(() => {
            const totalSessions = getTotalSessionsForPackage(selectedPackage);
            if (typeof totalSessions === "number") {
              return (
                <div className="text-xs text-blue-700 mt-3">
                  {`You can select up to ${totalSessions} session${totalSessions > 1 ? "s" : ""} for this package (multiple sessions per day are allowed, but must differ by time).`}
                  <br />
                  Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.
                </div>
              );
            }
            return null;
          })()}
          {sessions.length === 0 && (
            <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
          )}
          {sessions.length > 0 && (!earliestSession || !earliestSession.slotId) && (
            <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
          )}
        </div>
      </div>
      <BookingSummary
        bookings={bookings}
        setBookings={setBookings}
        setBookingsLoading={setBookingsLoading}
        setBookingsError={setBookingsError}
        getTherapistObject={getTherapistObject}
        editBookingId={editBookingId}
        getPatientDisplayName={getPatientDisplayName}
        getPackageDisplay={getPackageDisplay}
        SESSION_TIME_OPTIONS={SESSION_TIME_OPTIONS}
        handleEditBooking={handleEditBooking}
        // handleDeleteBooking={handleDeleteBooking}
        handleCollectPayment={handleCollectPayment}
        paymentLoadingBookingId={paymentLoadingBookingId}
      />
      {(apiLoading || bookingsLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-15 z-50 flex items-center justify-center pointer-events-none select-none">
          <div className="bg-white rounded shadow p-6 text-lg text-blue-600 font-bold">Loading data…</div>
        </div>
      )}
      {(apiError || bookingsError) && (
        <div className="fixed bottom-2 right-2 bg-red-100 text-red-700 px-4 py-2 rounded">{apiError || bookingsError}</div>
      )}
    </motion.div>
  );
}

// --- SUBCOMPONENTS ---

function HeaderGuide({ guideOpen, setGuideOpen, editBookingId }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`bg-blue-50 border border-blue-200 rounded-lg p-0 mb-8 overflow-hidden cursor-pointer`}
      onClick={() => setGuideOpen((v: boolean) => !v)}
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
                <li>Select patient, therapy, package. Each session can have its own therapist, therapy type, and time.</li>
                <li>
                  You can set all sessions to same weekday and time using "Repeat Weekly" or pick sessions one-by-one (multiple slots on one day are allowed).
                </li>
                <li>
                  For a given date, each session must have a different time and can set a different therapist and therapy type.
                </li>
                <li>
                  Click '{editBookingId ? "Update Booking" : "Book Now"}' to {editBookingId ? "update" : "confirm"} a booking.
                </li>
                <li>
                  <span className="font-medium">
                    Each therapist has max <span className="text-blue-900">10 normal slots</span> and <span className="text-blue-900">5 limited case slots</span> per day, except holidays when none are available. Booked slots are disabled.
                  </span>
                </li>
                <li>
                  You can apply a coupon code. If valid, discount will show in pricing.
                </li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function CalendarPanel({
  year, month, changeMonth, startDay, daysInMonth,
  sessions, toggleDate, getDaySlotSummary, maxSelectableDates
}: any) {
  const getSessionCountForDate = (dateKey: string) =>
    sessions.filter((s: any) => s.date === dateKey).length;

  return (
    <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2 font-semibold">
          <FiCalendar />
          {new Date(year, month).toLocaleString("default", {
            month: "long",
          })} {year}
        </div>
        <div className="flex gap-2">
          <button onClick={() => changeMonth("prev")} className="p-2 border rounded"><FiChevronLeft /></button>
          <button onClick={() => changeMonth("next")} className="p-2 border rounded"><FiChevronRight /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-xs text-slate-500 border-b">
        {DAYS.map((d: string) => (
          <div key={d} className="p-2 text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startDay }).map((_: any, i: number) => (
          <div key={`empty-${i}`} className="h-24 border" />
        ))}
        {Array.from({ length: daysInMonth }).map((_: any, i: number) => {
          const day = i + 1;
          const dateKey = getDateKey(year, month + 1, day);
          const selectedCount = getSessionCountForDate(dateKey);
          const isAtMax =
            typeof maxSelectableDates === "number" &&
            sessions.length >= maxSelectableDates;
          const { total, booked, limitedTotal, limitedBooked } = getDaySlotSummary(dateKey);
          return (
            <div
              key={day}
              onClick={() => { if (!isAtMax) toggleDate(day); }}
              className={`h-24 border cursor-pointer flex flex-col justify-between p-2 transition ${
                selectedCount > 0 ? "bg-blue-50 border-blue-400"
                : isAtMax ? "bg-gray-100 cursor-not-allowed opacity-60" : "hover:bg-slate-50"
              }`}
              style={isAtMax ? { pointerEvents: "none" } : {}}
            >
              <div className="flex flex-col justify-start">
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                  selectedCount > 0 ? "bg-blue-600 text-white" : ""}`}>
                  {day}
                </div>
                {selectedCount > 0 && (
                  <div className="mt-1 text-xs text-blue-700 font-medium">
                    Selected ({selectedCount})
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
          {`You can select up to ${maxSelectableDates} sessions for this package. `}
          <span className="text-blue-700">Multiple for the same date is allowed as long as time slots are different.</span>
          <br />
          {sessions.length >= maxSelectableDates && (
            <span className="text-blue-700">Limit reached.</span>
          )}
          <br />
          <span className="text-blue-700">Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.</span>
        </div>
      )}
    </div>
  );
}

// function RepeatWeeklyPanel({ repeatDay, setRepeatDay, repeatStartDate, setRepeatStartDate, repeatSlotId, setRepeatSlotId, today, handleRepeatApply, handleRepeatClear, maxSelectableDates, packageId, repeatError, repeatConflictInfo, therapistId }: any) {
//   return (
//     <div className="mb-6 space-y-2 bg-blue-50 border border-blue-100 rounded p-3">
//       <div className="flex items-center gap-2 font-medium text-blue-700">
//         <FiRepeat className="text-blue-500" /> Repeat weekly (set all sessions to same day/time)
//       </div>
//       <div className="flex flex-wrap gap-3 items-end">
//         <div>
//           <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
//           <input
//             type="date"
//             value={repeatStartDate}
//             onChange={e => setRepeatStartDate(e.target.value)}
//             className="border rounded px-2 py-1 text-sm cursor-pointer"
//             min={today.toISOString().slice(0, 10)}
//             onFocus={e => e.target.showPicker && e.target.showPicker()}
//           />
//         </div>
//         <div>
//           <label className="block text-xs font-semibold text-slate-700 mb-1">Day</label>
//           <select
//             value={repeatDay}
//             onChange={e => setRepeatDay(e.target.value)}
//             className="border rounded px-2 py-1 text-sm"
//           >
//             <option value="">Select Day</option>
//             {DAYS.map((d: string) => (
//               <option value={d} key={d}>{d}</option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot</label>
//           <select
//             value={repeatSlotId}
//             onChange={e => setRepeatSlotId(e.target.value)}
//             className="border rounded px-2 py-1 text-sm"
//           >
//             <option value="">Select Time Slot</option>
//             {SESSION_TIME_OPTIONS.map((opt: any) => (
//               <option key={opt.id} value={opt.id}>
//                 {opt.label} {opt.limited ? " (Limited case)" : ""}
//               </option>
//             ))}
//           </select>
//         </div>
//         <div>
//           <button
//             className="text-xs bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70 mt-1"
//             type="button"
//             style={{ minWidth: "110px" }}
//             onClick={handleRepeatApply}
//             disabled={
//               !repeatDay || !repeatStartDate || !repeatSlotId || !packageId || !therapistId
//             }
//           >
//             Apply
//           </button>
//           <button
//             className="ml-3 text-xs px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
//             type="button"
//             onClick={handleRepeatClear}
//           >
//             Clear
//           </button>
//         </div>
//       </div>
//       {maxSelectableDates && packageId && (
//         <div className="text-xs text-slate-500 mt-1">
//           Will set up to {maxSelectableDates} sessions {repeatDay && `on ${repeatDay}`} at selected time, skipping therapist holidays and slot conflicts.
//           <br />
//           <span className="text-blue-700">Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.</span>
//         </div>
//       )}
//       {repeatError && (<div className="text-xs text-red-600 mt-1">{repeatError}</div>)}
//       {Object.keys(repeatConflictInfo).length > 0 && (
//         <ul className="text-xs text-red-600 mt-1 space-y-0.5">
//           {Object.entries(repeatConflictInfo).map(([date, msg]) => (
//             <li key={date}>• {String(msg)}</li>
//           ))}
//         </ul>
//       )}
//       {(!therapistId || !packageId) && (
//         <div className="text-xs text-blue-600 mt-1">
//           Please select therapist and package first.
//         </div>
//       )}
//     </div>
//   );
// }

function SessionDatesTimesTable({
  sessions, updateSlotId, updateSessionTherapist, updateSessionTherapyType, editBookingId,
  therapists, therapistId, therapies, therapyId, SESSION_TIME_OPTIONS,
  getAvailableSlotsForDate, bookedSlotsPerRow,
  // repeatConflictInfo,
  removeSession
}: any) {
  return (
    <div className="space-y-3 mb-4">
      <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0"><FiClock />Session Dates &#38; Times</div>
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-fit border-collapse text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left"><FiClock className="inline mr-1" />Time Slot</th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left"><FiUser className="inline mr-1" />Therapist</th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left"><FiTag className="inline mr-1" />Therapy Type</th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100"></th>
            </tr>
          </thead>
          <tbody>
            {sessions
              .map((s: any, idx: number, arr: any[]) => {
                const rowTherapistId = (s as any).therapistId || therapistId;
                let slotInfo: { [slotId: string]: { disabled: boolean; reason: string } };
                try {
                  slotInfo = getAvailableSlotsForDate(
                    s.date,
                    arr,
                    s.slotId,
                    rowTherapistId,
                    !!editBookingId
                  );
                } catch (e) {
                  slotInfo = {};
                  for (const slot of SESSION_TIME_OPTIONS) {
                    slotInfo[slot.id] = { disabled: true, reason: "Error available slots" };
                  }
                }
                const bookedSlotsForRow = (bookedSlotsPerRow && bookedSlotsPerRow[`${s.date}:${rowTherapistId}`]) ? bookedSlotsPerRow[`${s.date}:${rowTherapistId}`] : [];
                const duplicateSlot = arr.some((other, otherIdx) => otherIdx !== idx && s.date === other.date && s.slotId && s.slotId === other.slotId);

                // For therapyTypeId, support both object or string for backward compatibility
                let therapyTypeIdVal: string = "";
                // let therapyNameVal: string = "";
                if (s.therapyTypeId && typeof s.therapyTypeId === "object" && (s.therapyTypeId as any)._id) {
                  therapyTypeIdVal = (s.therapyTypeId as any)._id;
                  // therapyNameVal = (s.therapyTypeId as any).name;
                } else if (typeof s.therapyTypeId === "string") {
                  therapyTypeIdVal = s.therapyTypeId;
                  // therapyNameVal = therapies.find((t: Therapy) => t._id === therapyTypeIdVal)?.name || "";
                } else {
                  therapyTypeIdVal = therapyId;
                  // therapyNameVal = therapies.find((t: Therapy) => t._id === therapyId)?.name || "";
                }

                return (
                  <tr key={s.date + ':' + idx} className="text-sm">
                    <td className="px-2 py-1 border border-slate-200 font-mono">{s.date}</td>
                    <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                      <select
                        value={s.slotId}
                        onChange={e => updateSlotId(s.date, e.target.value, idx)}
                        className={`border rounded px-2 py-1 ${duplicateSlot ? "border-red-400" : idx === 0 && !s.slotId ? "border-red-400" : ""}`}
                        required={idx === 0}
                        aria-required={idx === 0}
                        style={{ minWidth: 180 }}
                      >
                        <option value="">Select Time Slot</option>
                        {SESSION_TIME_OPTIONS.map((slot: any) => {
                          const i = slotInfo[slot.id] || { disabled: true, reason: "N/A" };
                          let labelContent = slot.label;
                          if (slot.limited) labelContent += " (Limited case)";
                          if (i.disabled && i.reason === "Already booked")
                            labelContent += " - Already Booked";
                          else if (i.disabled && i.reason)
                            labelContent += `  - ${i.reason}`;
                          const slotTakenBySelf = arr.some((other, otherIdx) => otherIdx !== idx && other.date === s.date && other.slotId === slot.id);
                          return (
                            <option
                              key={slot.id}
                              value={slot.id}
                              disabled={i.disabled || slotTakenBySelf}
                            >
                              {labelContent}
                            </option>
                          );
                        })}
                      </select>
                      {duplicateSlot && (
                        <span className="text-xs text-red-500 ml-2">Cannot choose same time for the same date.</span>
                      )}
                      {bookedSlotsForRow && bookedSlotsForRow.length > 0 && (
                        <span className="block mt-1 text-xs text-amber-700">
                          Already booked: {bookedSlotsForRow
                            .map(
                              (id: string) =>
                                SESSION_TIME_OPTIONS.find((opt: any) => opt.id === id)?.label || id
                            ).join(", ")}
                        </span>
                      )}
                      {idx === 0 && !s.slotId && (
                        <span className="text-xs text-red-500 ml-2">Time required</span>
                      )}
                    </td>
                    <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                      <select
                        value={s.therapistId || therapistId}
                        onChange={e => updateSessionTherapist(idx, e.target.value)}
                        className="border rounded px-2 py-1 min-w-[120px]"
                      >
                        <option value="">Select Therapist</option>
                        {therapists.map((t: Therapist) => (
                          <option value={t._id} key={t._id}>
                            {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                      <select
                        value={therapyTypeIdVal}
                        onChange={e => updateSessionTherapyType(idx, e.target.value)}
                        className="border rounded px-2 py-1 min-w-[150px]"
                        required
                      >
                        <option value="">Select Therapy Type</option>
                        {therapies.map((therapy: Therapy) => (
                          <option key={therapy._id} value={therapy._id}>
                            {therapy.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-center">
                      <button
                        type="button"
                        title="Remove this session"
                        className="text-red-500 hover:text-red-700 focus:outline-none focus:ring"
                        style={{
                          verticalAlign: "middle",
                          padding: 2,
                          borderRadius: 999,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 24,
                          minHeight: 24
                        }}
                        onClick={() => removeSession(idx)}
                        aria-label="Remove session"
                        tabIndex={0}
                      >
                        <FiX />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-600 mt-1">
        <b>Tip:</b> You can add multiple sessions for the same date with different times, therapists, and therapy types.
      </div>
    </div>
  );
}

function PricingSummary({ selectedPackage, getTotalSessionsForPackage, appliedCoupon }: any) {
  let discountValue = 0;
  let coupon = appliedCoupon || null;
  if (coupon && coupon.discount) discountValue = Number(coupon.discount);
  let pkgTotal = selectedPackage.totalCost ??
    (selectedPackage.costPerSession && getTotalSessionsForPackage(selectedPackage)
      ? Number(selectedPackage.costPerSession) * Number(getTotalSessionsForPackage(selectedPackage))
      : 0);
  return (
    <div className="w-full flex flex-col items-stretch mt-3 mb-3">
      <div className="flex flex-col gap-0.5 w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center py-0.5">
          <span className="text-sm text-slate-700 font-medium">Package Price</span>
          <span className="font-mono text-base text-slate-900">₹{selectedPackage.totalCost ??
            (selectedPackage.costPerSession && getTotalSessionsForPackage(selectedPackage)
              ? Number(selectedPackage.costPerSession) * Number(getTotalSessionsForPackage(selectedPackage))
              : selectedPackage.costPerSession ?? "—")}</span>
        </div>
        {discountValue > 0 && pkgTotal > 0 ? (
          <>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm text-emerald-700 font-medium">Discount{coupon ? ` (${coupon.couponCode})` : ""}</span>
              <span className="text-base text-emerald-900 font-mono">-{discountValue}% <span className="opacity-60 text-xs ml-1">(-₹{Math.round((pkgTotal * discountValue) / 100)})</span></span>
            </div>
            <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
              <span className="text-base font-semibold text-blue-900"><FiTag className="inline mr-1 text-blue-400" />Total After Discount</span>
              <span className="font-mono text-lg font-bold text-blue-900">₹{Math.max(pkgTotal - Math.round((pkgTotal * discountValue) / 100), 0)}</span>
            </div>
          </>
        ) : discountValue === 0 && coupon ? (
          <div className="flex justify-between items-center py-0.5">
            <span className="text-sm text-orange-700 font-medium">Discount</span>
            <span className="text-xs text-orange-700">Coupon "{coupon.couponCode}" has no discount</span>
          </div>
        ) : (
          <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
            <span className="text-base font-semibold text-blue-900"><FiTag className="inline mr-1 text-blue-400" />Total</span>
            <span className="font-mono text-lg font-bold text-blue-900">₹{pkgTotal}</span>
          </div>
        )}
      </div>
    </div>
  );
}


// --- Enhanced BookingSummary Component with Search, Filter, Pagination ---
// (Does NOT update parent booking state. Internal UI/query state only.)



// -- Utility (can pull from constants elsewhere if needed) --
const PAGE_SIZE_OPTIONS = [5, 15, 25, 50];

/**
 * BookingSummary with ALL available booking query filters
 * Filters implemented according to booking.controller.js (536-849)
 *
 * Supported filters:
 * - search (multi-field fuzzy, backend handles this)
 * - status (pending/paid/cancelled/completed)
 * - therapist (id, Therapist ID/Name)
 * - patient (id, Patient ID/Name/Phone)
 * - package (id, Package ID/Name)
 * - therapy (id, Therapy ID/Name)
 * - sessionDate (session scheduled on this yyyy-mm-dd)
 * - paymentStatus (paid/unpaid)
 * - hasDiscount (yes/no)
 * - discountCode (coupon code, exact)
 * - minTotal / maxTotal (price range)
 * - createdFrom / createdTo (Date ISO, for creation date)
 */

// --- Collect Payment Modal (ported from ReceptionDesk) ---



// Types used for payment
// type CollectPaymentModalProps = {
//   open: boolean;
//   onClose: () => void;
//   payment: {
//     _id: string;
//     appointmentId: string;
//     patientName: string;
//     patientId: string;
//     paymentAmount?: number | string;
//     amountPaid?: number | string;
//     paymentRecordId?: string;
//   } | null;
//   onCollect: (
//     paymentId: string,
//     collectType: "full" | "partial",
//     partialAmount?: number
//   ) => Promise<void>;
//   loading?: boolean;
// };



/**
 * CollectPaymentModal is a modal UI for administrators to collect either full or partial payment.
 * Core logic ported from ReceptionDesk.tsx (534-656).
 */


// --- Collect Payment Modal (ported from ReceptionDesk) ---
type CollectPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  payment: {
    _id: string;
    appointmentId: string;
    patientName: string;
    patientId: string;
    paymentAmount?: number | string;
    amountPaid?: number | string;
    paymentRecordId?: string;
  } | null;
  onCollected: () => void;
};

const toNumber = (v: any): number | undefined => {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
};

function CollectPaymentModal({
  open,
  onClose,
  payment,
  onCollected,
}: CollectPaymentModalProps) {
  const [collectType, setCollectType] = useState<"full" | "partial">("full");
  const [partialValue, setPartialValue] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const paymentAmount = payment && toNumber(payment.paymentAmount);
  const amountAlreadyPaid =
    payment && toNumber(payment.amountPaid) ? toNumber(payment.amountPaid) : 0;
  const partialNumeric = parseFloat(partialValue);

  const isPartialOverDue: boolean =
    collectType === "partial" &&
    typeof paymentAmount === "number" &&
    !isNaN(partialNumeric) &&
    (partialNumeric + (typeof amountAlreadyPaid === "number" ? amountAlreadyPaid : 0)) > paymentAmount;

  // For 'max' on input, show the due left (so cannot input more than the remaining due)
  const paymentDue: number | undefined =
    typeof paymentAmount === "number" && typeof amountAlreadyPaid === "number"
      ? paymentAmount - amountAlreadyPaid
      : typeof paymentAmount === "number"
        ? paymentAmount
        : undefined;

  // Reset fields when modal opens/closes or when payment changes
  useEffect(() => {
    if (open) {
      setCollectType("full");
      setPartialValue("");
      setLoading(false);
    }
  }, [open, payment]);

  // ReceptionDesk logic for collect-payment API (see ReceptionDesk.tsx)
  // Uses /api/admin/bookings/:id/collect-payment POST as per routes and controller
  const handleCollectPaymentAPI = async () => {
    if (!payment) return;
    let endpoint =
      import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    if (!endpoint) {
      alert("API endpoint is not configured.");
      return;
    }

    // Prepare body for backend controller (expects paymentType and partialAmount optionally)
    let body: Record<string, any> = {
      paymentType: collectType,
    };

    if (collectType === "partial") {
      body.partialAmount = partialNumeric;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${endpoint}/api/admin/bookings/${payment._id}/collect-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Failed to collect payment. Please try again."
        );
      }
      onCollected();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to collect payment.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment) return;
    if (loading || isPartialOverDue) return;
    if (
      collectType === "partial" &&
      (isNaN(partialNumeric) || partialNumeric <= 0)
    ) {
      alert("Please enter a valid partial amount.");
      return;
    }
    await handleCollectPaymentAPI();
  };

  if (!open || !payment) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="collect-modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ backdropFilter: "blur(2px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="bg-white rounded-lg shadow-lg max-w-sm w-full border border-slate-200 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
            onClick={onClose}
            tabIndex={-1}
            aria-label="Close"
            type="button"
          >
            <FiX size={20} />
          </button>
          <div className="p-6 pb-2">
            <div className="font-semibold text-lg text-slate-800 flex items-center gap-2 mb-2">
              Collect Payment
            </div>
            <div className="text-sm mb-3">
              <span className="font-medium text-blue-700">
                Appt#: {payment.appointmentId}
              </span>
              <br />
              <span className="text-slate-800">{payment.patientName}</span>{" "}
              <span className="text-xs text-blue-300 font-mono">
                ({payment.patientId})
              </span>
              <br />
              <span className="text-xs text-slate-500">
                Amount Due:{" "}
                <span className="font-semibold text-slate-700">
                  ₹{String(payment.paymentAmount ?? "—")}
                </span>
              </span>
              {payment.amountPaid && (
                <span className="text-xs text-slate-400 ml-2">
                  (Already paid: ₹{String(payment.amountPaid)})
                </span>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4 mt-1">
                <label className="block font-medium text-slate-700 mb-1">
                  Collection Type
                </label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="collectType"
                      value="full"
                      checked={collectType === "full"}
                      onChange={() => setCollectType("full")}
                      disabled={loading}
                    />
                    <span className="text-sm">Full Amount</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="collectType"
                      value="partial"
                      checked={collectType === "partial"}
                      onChange={() => setCollectType("partial")}
                      disabled={loading}
                    />
                    <span className="text-sm">Partial Amount</span>
                  </label>
                </div>
              </div>
              {collectType === "partial" && (
                <div className="mb-2">
                  <label className="block mb-1 text-slate-700 text-xs">
                    Enter Partial Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={partialValue}
                    onChange={(e) => setPartialValue(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-green-200 text-sm"
                    placeholder="E.g. 800"
                    required
                    disabled={loading}
                    max={paymentDue ?? undefined}
                  />
                  {isPartialOverDue && (
                    <div className="text-xs text-red-500 mt-1">
                      Partial amount plus already paid cannot exceed the invoice
                      total ({paymentAmount}).
                    </div>
                  )}
                </div>
              )}
              <button
                type="submit"
                className={`mt-3 w-full rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 relative ${
                  loading || isPartialOverDue
                    ? "bg-green-50 opacity-80 cursor-not-allowed"
                    : "hover:bg-green-50"
                }`}
                disabled={loading || isPartialOverDue}
              >
                {loading
                  ? "Processing…"
                  : collectType === "full"
                  ? "Collect Full Amount"
                  : "Collect Partial Amount"}
              </button>
              <div className="mt-1 text-xs text-slate-400 text-center">
                {collectType === "partial"
                  ? "Collects a partial payment; the remaining will appear as pending."
                  : "Marks the invoice as fully paid."}
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// -- BookingSummary: manage modal state and API trigger --



// ...other imports...

// CheckIn Modal component
function CheckInConfirmationModal({ open, onClose, onConfirm, session, booking }: any) {
  if (!open) return null;
  return (
    <div className="fixed z-40 inset-0 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded shadow-lg p-6 w-[95vw] max-w-xs relative">
        <div className="flex items-center gap-2 mb-3">
          <FiCheckCircle className="text-blue-500" size={24} />
          <div className="font-semibold text-blue-700 text-base">Check In Session?</div>
        </div>
        <div className="mb-4 text-sm">
          Are you sure you want to check in this session?
          <div className="mt-2 text-xs p-2 rounded bg-blue-50 border border-blue-100">
            <div>
              <b>Date:</b> {session.date}
            </div>
            <div>
              <b>Booking ID:</b> {booking.appointmentId}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm()}
            className="text-xs px-3 py-1 rounded border border-green-500 text-green-700 font-semibold bg-green-100 hover:bg-green-200"
          >
            Yes, Check In
          </button>
        </div>
      </div>
    </div>
  );
}

function BookingSummary({
  getTherapistObject,
  editBookingId,
  getPatientDisplayName,
  getPackageDisplay,
  SESSION_TIME_OPTIONS,
  handleEditBooking,
  // handleDeleteBooking,
}: any) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [total, setTotal] = useState(0);

  // Collect Payment Modal state
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectModalPayment, setCollectModalPayment] = useState<any>(null);
  // const [paymentLoadingBookingId, setPaymentLoadingBookingId] = useState<string | null>(null);

  // Check-In Modal state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInSession, setCheckInSession] = useState<any>(null);
  const [checkInBooking, setCheckInBooking] = useState<any>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Table pagination logic
  const totalPages = Math.ceil(total / pageSize);

  function fetchBookings() {
    setBookingsLoading(true);
    setBookingsError(null);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    // No search or filters in this version; fetch all with paging only
    const params = new URLSearchParams();
    params.append("page", String(page));
    params.append("pageSize", String(pageSize));

    fetch(`${endpoint}/api/admin/bookings?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not fetch bookings.");
        const data = await res.json();
        setBookings(data?.bookings || []);
        setTotal(data?.total || 0);
        setBookingsLoading(false);
      })
      .catch(() => {
        setBookingsError("Error loading bookings.");
        setBookingsLoading(false);
      });
  }

  // Auto-fetch on page/pageSize change & also after collecting payment
  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handleModalCollectPayment = (booking: any) => {
    setCollectModalOpen(true);
    // Pass only relevant payment info.
    setCollectModalPayment({
      _id: booking._id,
      appointmentId: booking.appointmentId,
      patientName: booking.patient?.name || "",
      patientId: booking.patient?._id || "",
      paymentAmount: booking.payment?.amount || booking.paymentAmount,
      amountPaid: booking.payment?.amountPaid || booking.amountPaid,
      paymentRecordId: booking.payment?._id,
    });
  };

  const handleModalCollected = () => {
    setCollectModalOpen(false);
    setCollectModalPayment(null);
    fetchBookings();
  };

  // Check-in modal
  const openCheckInModal = (booking: any, session: any) => {
    setCheckInBooking(booking);
    setCheckInSession(session);
    setCheckInError(null);
    setCheckInModalOpen(true);
  };

  const closeCheckInModal = () => {
    setCheckInBooking(null);
    setCheckInSession(null);
    setCheckInError(null);
    setCheckInModalOpen(false);
  };

  const handleConfirmCheckIn = async () => {
    if (!checkInBooking || !checkInSession) return;
    setCheckInLoading(true);
    setCheckInError(null);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");

    try {
      const res = await fetch(
        `${endpoint}/api/admin/bookings/check-in`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bookingId: checkInBooking._id,
            sessionId: checkInSession._id,
          }),
        }
      );
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to check in session.");
      }
      // Success
      closeCheckInModal();
      setCheckInLoading(false);
      fetchBookings();
    } catch (err: any) {
      setCheckInError(err.message || "Unable to check in.");
      setCheckInLoading(false);
    }
  };

  // Render: No search/filter UI, just pagination and booking list
  return (
    <div className="mt-6">
      <CollectPaymentModal
        open={collectModalOpen}
        onClose={() => {
          setCollectModalOpen(false);
          setCollectModalPayment(null);
        }}
        payment={collectModalPayment}
        onCollected={handleModalCollected}
      />

      <CheckInConfirmationModal
        open={checkInModalOpen}
        onClose={closeCheckInModal}
        onConfirm={handleConfirmCheckIn}
        session={checkInSession}
        booking={checkInBooking}
      />

      <div className="bg-white border rounded-lg p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="font-medium">Booking Summary</p>
        </div>

        {/* Pagination Controls */}
        <div className="flex flex-wrap items-center justify-between py-2">
          <span className="text-xs text-slate-500">
            Total: <b>{total}</b>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="border text-xs px-1 py-0.5 rounded"
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option value={opt} key={opt}>{opt}</option>
              ))}
            </select>
            <button
              className="px-2 py-1 text-xs border rounded border-slate-300"
              disabled={page === 1 || bookingsLoading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >Prev</button>
            <span className="text-xs">{page} / {Math.max(totalPages, 1)}</span>
            <button
              className="px-2 py-1 text-xs border rounded border-slate-300"
              disabled={page >= totalPages || bookingsLoading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >Next</button>
          </div>
        </div>
        {/* Booking Results */}
        {bookingsLoading ? (
          <div className="text-center py-12 text-slate-400 text-base">Loading bookings…</div>
        ) : bookingsError ? (
          <div className="text-red-600 p-3">{bookingsError}</div>
        ) : bookings && bookings.length === 0 ? (
          <div>
            <p className="text-slate-500 mb-3">No bookings found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map((booking: any) => {
              const therapistObj = getTherapistObject(booking);
              const paymentStatus = booking.payment?.status;
              const isPaid = paymentStatus === "paid";
              const isPartiallyPaid = paymentStatus === "partiallypaid";
              const paymentAmount = booking.payment?.amount;
              const paidAmount = booking.payment?.amountPaid;

              return (
                <div
                  className={`border p-3 rounded bg-sky-50 relative ${
                    editBookingId === booking._id
                      ? "ring ring-blue-400 ring-offset-2"
                      : ""
                  }`}
                  key={booking._id}
                >
                  {booking.appointmentId && (
                    <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gray-700">
                      <FiHash className="text-blue-500" /> <span>Booking ID: {booking.appointmentId}</span>
                    </div>
                  )}
                  {therapistObj && (
                    <div className="mb-2 flex items-center gap-2">
                      <FiUser className="text-slate-500" />
                      <span className="text-slate-700">
                        Therapist: {therapistObj.name}
                        {therapistObj.therapistId ? (
                          <>
                            {" ("}
                            <a
                              href={`/admin/therapists?therapistId=${encodeURIComponent(therapistObj._id)}`}
                              className="text-blue-600 hover:underline"
                              title="View therapist details"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                            >
                              {therapistObj.therapistId}
                            </a>
                            {")"}
                          </>
                        ) : ""}
                      </span>
                    </div>
                  )}
                  <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    {booking.patient && booking.patient._id ? (
                      <a
                        href={`/admin/children?patientId=${encodeURIComponent(booking.patient._id)}`}
                        className="text-blue-700 hover:underline"
                        title="View patient details"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        {getPatientDisplayName(booking.patient)}
                      </a>
                    ) : (
                      getPatientDisplayName(booking.patient)
                    )}
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
                  {/* REMARK DISPLAY IF EXISTS */}
                  {booking.remark && (
                    <div className="mb-2 text-xs text-slate-700 flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Remark:</span>
                      <span className="italic text-slate-800">{booking.remark}</span>
                    </div>
                  )}
                  {/* ---- PAYMENT STATUS/Collect Button ---- */}
                  <div className="mb-2 flex items-center gap-2">
                    <FiCreditCard className="text-green-600" />
                    {isPaid ? (
                      <span className="text-green-700 font-semibold">Payment Collected</span>
                    ) : isPartiallyPaid ? (
                      <span className="text-amber-700 font-semibold">
                        Partially Paid{typeof paymentAmount !== 'undefined' && typeof paidAmount !== 'undefined'
                          ? ` (Amount: ₹${paymentAmount} | Paid: ₹${paidAmount})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-orange-600 font-semibold">Payment Pending</span>
                    )}
                    {!isPaid && (
                      <button
                        className={`ml-3 flex items-center gap-1 text-xs border px-2 py-1 rounded 
                        border-green-400 text-green-800 bg-green-100 hover:bg-green-200 font-medium 
                        transition disabled:opacity-60`}
                        // disabled={!!paymentLoadingBookingId}
                        onClick={() => handleModalCollectPayment(booking)}
                        title="Mark payment as collected"
                      >
                        <FiCreditCard />{" "}
                        {/* {paymentLoadingBookingId === booking._id
                          ? "Collecting..."
                          : "Collect Payment"} */}
                          Collect Payment
                      </button>
                    )}
                  </div>
                  {/* --------------- */}
                  {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
                    <details className="mb-2 text-xs text-slate-700">
                      <summary className="font-medium cursor-pointer select-none flex items-center">
                        <span>Sessions ({booking.sessions.length})</span>
                        <span className="ml-1">
                          <FiChevronDown className="inline ml-1 text-slate-500" />
                        </span>
                      </summary>
                      <div className="overflow-x-auto mt-2">
                        {/* Show Check-In error, if any (for this booking's sessions) */}
                        {checkInError && checkInBooking && checkInBooking._id === booking._id && (
                          <div className="text-xs text-red-600 mb-2">{checkInError}</div>
                        )}
                        <table className="min-w-[800px] w-fit border-collapse text-xs">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">#</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Time Slot</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Therapist</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Therapy Type</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Checked In</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {booking.sessions.map((s: any, idx: number) => {
                              const slot = SESSION_TIME_OPTIONS.find((opt: any) => opt.id === s.slotId);
                              const tObj = s.therapist;
                              const therapy =
                                (s && typeof s.therapyTypeId === "object" && s.therapyTypeId)
                                  ? s.therapyTypeId
                                  : (typeof s.therapyType === "string" ? s.therapyType : undefined);
                              const checkedIn = s.isCheckedIn === true;

                              return (
                                <tr key={s._id || s.date + "-" + idx}>
                                  <td className="px-2 py-1 border border-slate-200 text-slate-400">{idx + 1}</td>
                                  <td className="px-2 py-1 border border-slate-200">{s.date}</td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {slot
                                      ? (<>
                                          {slot.label}
                                          {slot.limited && <span className="text-amber-700 ml-1">(Limited case)</span>}
                                        </>)
                                      : s.slotId}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {tObj
                                      ? <>
                                          {/* Try tObj.userId.name if present, otherwise name */}
                                          {tObj.userId?.name || tObj.name}
                                          {tObj.therapistId ? ` (${tObj.therapistId})` : ""}
                                        </>
                                      : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {typeof therapy === "object" && therapy && "name" in therapy
                                      ? therapy.name
                                      : typeof therapy === "string"
                                        ? therapy
                                        : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {checkedIn ? (
                                      <span className="text-green-700 font-semibold">Checked In</span>
                                    ) : (
                                      <span className="text-red-600 font-semibold">Not Checked In</span>
                                    )}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-right">
                                    {!checkedIn && (
                                      <button
                                        className={`text-xs rounded px-2 py-1 border border-green-500 text-green-700 hover:bg-green-50 flex items-center gap-1 ${checkInLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                        disabled={checkInLoading}
                                        onClick={() => openCheckInModal(booking, s)}
                                        title="Check in this session"
                                      >
                                        <FiCheckCircle /> Check In
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                  {/* Removed discountInfo.coupon.discountEnabled UI */}
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      onClick={() => handleEditBooking(booking._id)}
                      title="Edit booking"
                      disabled={!!editBookingId && editBookingId !== booking._id}
                    >
                      <FiEdit2 />Edit
                    </button>
                  </div>
                  {editBookingId === booking._id && (
                    <div className="absolute -top-2 right-2">
                      <span className="text-blue-800 text-xs bg-blue-200 px-2 py-0.5 rounded font-bold shadow">Editing</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}