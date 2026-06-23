

// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { useLocation } from "react-router";

// import {
//   Patient, Therapy, Package, Therapist, BookingSession, Booking,
//   MonthlySlotsSummary, DaySlotSummary, QuickFillSettings,
//   SESSION_TIME_OPTIONS, pad2, getDateKey, getDaysInMonth, getStartDay,
//   getTotalSessionsForPackage,
// } from "./types";
// import { HeaderGuide, CalendarPanel } from "./CalendarAndHeader";
// import { BookingFormPanel } from "./BookingFormPanel";
// import { BookingSummary } from "./BookingSummary";

// export default function AppointmentBookingSystemMain() {
//   const location = useLocation();

//   const today = new Date();
//   const [year, setYear] = useState(today.getFullYear());
//   const [month, setMonth] = useState(today.getMonth());
//   const daysInMonth = getDaysInMonth(year, month);
//   const startDay = getStartDay(year, month);

//   // ── Remote data ────────────────────────────────────────────────────────────
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [therapists, setTherapists] = useState<Therapist[]>([]);
//   const [therapies, setTherapies] = useState<Therapy[]>([]);
//   const [packages, setPackages] = useState<Package[]>([]);
//   const [coupons, setCoupons] = useState<any[]>([]);
//   const [apiLoading, setApiLoading] = useState(false);
//   const [apiError, setApiError] = useState<string | null>(null);
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [bookingsLoading, setBookingsLoading] = useState(false);
//   const [bookingsError, setBookingsError] = useState<string | null>(null);

//   // ── Form state ─────────────────────────────────────────────────────────────
//   const [patientId, setPatientId] = useState("");
//   const [therapyId, setTherapyId] = useState("");
//   const [packageId, setPackageId] = useState("");
//   const [therapistId, setTherapistId] = useState("");
//   const [sessions, setSessions] = useState<BookingSession[]>([]);
//   const [remark, setRemark] = useState("");
//   const [editBookingId, setEditBookingId] = useState<string | null>(null);
//   const [bookingLoading, setBookingLoading] = useState(false);
//   const [bookingError, setBookingError] = useState<string | null>(null);
//   const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
//   const [paymentLoadingBookingId, setPaymentLoadingBookingId] = useState<string | null>(null);

//   // ── Coupon ─────────────────────────────────────────────────────────────────
//   const [couponInput, setCouponInput] = useState("");
//   const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
//   const [couponStatus, setCouponStatus] = useState<null | "valid" | "invalid">(null);

//   // ── Booking-request flags ──────────────────────────────────────────────────
//   const [isBookingRequest, setIsBookingRequest] = useState(false);
//   const [bookingRequestId, setBookingRequestId] = useState("");
//   const [isSessionEditRequest, setIsSessionEditRequest] = useState(false);
//   const [sessionEditRequestId, setSessionEditRequestId] = useState("");

//   // ── Calendar / slots ───────────────────────────────────────────────────────
//   const [monthlySlotSummary, setMonthlySlotSummary] = useState<MonthlySlotsSummary>({});
//   const [bookedSlotsPerRow, setBookedSlotsPerRow] = useState<{ [rowKey: string]: string[] }>({});
//   const [guideOpen, setGuideOpen] = useState(false);

//   // ── Quick Fill ─────────────────────────────────────────────────────────────
//   // When set, clicking a calendar date auto-fills the new session with these
//   // preset values instead of leaving them blank.
//   const [quickFillSettings, setQuickFillSettings] = useState<QuickFillSettings | null>(null);

//   // ── Derived selections ─────────────────────────────────────────────────────
//   const selectedPackage = packages.find((p) => p._id === packageId) || null;
//   const selectedPatient = patients.find((p) => p.id === patientId) || null;
//   const selectedTherapy = therapies.find((t) => t._id === therapyId) || null;
//   const selectedTherapist = therapists.find((t) => t._id === therapistId) || null;
//   const maxSelectableDates = getTotalSessionsForPackage(selectedPackage);

//   // ── Fetch home-details on mount ────────────────────────────────────────────
//   useEffect(() => {
//     setApiLoading(true);
//     setApiError(null);
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     fetch(`${endpoint}/api/admin/bookings/home-details`)
//       .then(async (resp) => {
//         if (!resp.ok) throw new Error("Failed API call");
//         const parsed = await resp.json();
//         setPatients(parsed.patients || []);
//         setTherapists(parsed.therapists || []);
//         setTherapies(parsed.therapyTypes || []);
//         setPackages(parsed.packages || []);
//         setCoupons(
//           (parsed.coupons || []).map((c: any) => ({
//             _id: c._id, couponCode: c.couponCode, discount: c.discount,
//             validityDays: c.validityDays, discountEnabled: c.discountEnabled,
//           }))
//         );
//         setApiLoading(false);
//       })
//       .catch(() => { setApiError("Could not load booking data."); setApiLoading(false); });
//   }, []);

//   // ── Populate form from location.state (booking request) ───────────────────
//   useEffect(() => {
//     if (location.state && (location.state as any).bookingRequest) {
//       const req = (location.state as any).bookingRequest;
//       setPatientId(req.patient?._id || "");
//       setTherapyId(req.therapy?._id || "");
//       setPackageId(req.package?._id || "");
//       setIsBookingRequest(true);
//       setBookingRequestId(req._id || "");
//       if (Array.isArray(req.sessions)) {
//         setSessions(req.sessions.map((s: any) => ({
//           date: s.date || "", slotId: s.slotId || s.time || "",
//           therapistId: req.therapist?._id || req.therapist || "",
//           therapyTypeId:
//             typeof s.therapyTypeId === "object" ? s.therapyTypeId
//             : typeof s.therapyTypeId === "string"
//               ? (therapies.find((t) => t._id === s.therapyTypeId)
//                   ? { _id: s.therapyTypeId, name: therapies.find((t) => t._id === s.therapyTypeId)?.name || "" }
//                   : { _id: s.therapyTypeId, name: "" })
//               : req.therapy?._id ? { _id: req.therapy._id, name: req.therapy.name || "" } : "",
//         })).sort((a: any, b: any) => (a.date || "").localeCompare(b.date || "")));
//         setTherapistId(req.therapist?._id || req.therapist || "");
//       }
//     }
//   }, [location.state, therapies]); // eslint-disable-line

//   useEffect(() => {
//     if (location.state && (location.state as any).sessionEditRequest) {
//       const req = (location.state as any).sessionEditRequest;
//       setIsSessionEditRequest(true);
//       setSessionEditRequestId(req._id || "");
//       handleEditBooking(req.appointmentId._id);
//     }
//   }, [location.state]); // eslint-disable-line

//   // ── Monthly slot summary ───────────────────────────────────────────────────
//   useEffect(() => {
//     if (therapists.length === 0) return;
//     const summary: MonthlySlotsSummary = {};
//     for (let day = 1; day <= daysInMonth; ++day) {
//       const jsDate = new Date(year, month, day);
//       const dateKeyApi = `${jsDate.getFullYear()}-${pad2(jsDate.getMonth() + 1)}-${pad2(jsDate.getDate())}`;
//       let totalNormalSlots = 0, totalLimitedSlots = 0, totalNormalBooked = 0, totalLimitedBooked = 0;
//       const therapistsBookedSlots: { [id: string]: string[] } = {};

//       for (const t of therapists) {
//         const fullDayHoliday = (t.holidays || []).find(
//           (h) => h.date === dateKeyApi && (h.isFullDay === true || h.isFullDay === undefined)
//         );
//         if (fullDayHoliday) { therapistsBookedSlots[t._id] = []; continue; }

//         const slotsOut: string[] = [];
//         for (const h of t.holidays || []) {
//           if (h.date === dateKeyApi && h.isFullDay === false && h.slots?.length) {
//             slotsOut.push(...h.slots.map((s) => s.slotId));
//           }
//         }
//         let normalSlots = 10, limitedSlots = 5;
//         for (const so of slotsOut) {
//           const sd = SESSION_TIME_OPTIONS.find((opt) => opt.id === so);
//           if (!sd) continue;
//           if (sd.limited) limitedSlots = Math.max(0, limitedSlots - 1);
//           else normalSlots = Math.max(0, normalSlots - 1);
//         }
//         totalNormalSlots += normalSlots;
//         totalLimitedSlots += limitedSlots;

//         const bookedArr = t.bookedSlots?.[dateKeyApi] || [];
//         therapistsBookedSlots[t._id] = bookedArr;
//         for (const slotId of bookedArr) {
//           const sd = SESSION_TIME_OPTIONS.find((opt) => opt.id === slotId);
//           if (sd) { if (sd.limited) totalLimitedBooked++; else totalNormalBooked++; }
//         }
//       }
//       summary[`${pad2(day)}-${pad2(month + 1)}-${year}`] = {
//         bookedSlots: totalNormalBooked, totalAvailableSlots: totalNormalSlots,
//         limitedBookedSlots: totalLimitedBooked, totalLimitedAvailableSlots: totalLimitedSlots,
//         BookedSlots: therapistsBookedSlots,
//       } as DaySlotSummary;
//     }
//     setMonthlySlotSummary(summary);
//   }, [therapists, year, month, daysInMonth]);

//   // ── Booked slots per row ───────────────────────────────────────────────────
//   useEffect(() => {
//     const mapping: { [key: string]: string[] } = {};
//     for (const s of sessions) {
//       const tId = s.therapistId || therapistId || therapists[0]?._id || "";
//       if (!tId || !s.date) continue;
//       const parts = s.date.split("-");
//       if (parts.length !== 3) continue;
//       const apiKey = `${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`;
//       const daySummary = monthlySlotSummary[apiKey];
//       mapping[`${s.date}:${tId}`] = daySummary?.BookedSlots?.[tId] || [];
//     }
//     setBookedSlotsPerRow(mapping);
//   }, [sessions, therapistId, therapists, monthlySlotSummary]);

//   // ── Cap sessions to package max ────────────────────────────────────────────
//   useEffect(() => {
//     if (maxSelectableDates === undefined) return;
//     if (sessions.length > maxSelectableDates) setSessions((prev) => prev.slice(0, maxSelectableDates));
//   }, [packageId, maxSelectableDates, sessions.length]);

//   // ── Calendar helpers ───────────────────────────────────────────────────────
//   const changeMonth = (dir: "prev" | "next") => {
//     if (dir === "prev") { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
//     else { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }
//   };

//   function getServerDaySlotSummary(dateKey: string) {
//     const parts = dateKey.split("-");
//     if (parts.length !== 3) return undefined;
//     return monthlySlotSummary[`${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`];
//   }
//   function getDaySlotSummary(dateStr: string) {
//     const d = getServerDaySlotSummary(dateStr);
//     if (!d) return { total: undefined, booked: undefined, limitedTotal: undefined, limitedBooked: undefined };
//     return { total: d.totalAvailableSlots, booked: d.bookedSlots, limitedTotal: d.totalLimitedAvailableSlots, limitedBooked: d.limitedBookedSlots };
//   }

//   /**
//    * Returns the available (not booked, not on holiday) slot labels for a given
//    * therapist on a given date, or null when no therapist is selected.
//    */
//   function getTherapistAvailableSlotsForDay(dateStr: string): {
//     availableSlots: { id: string; label: string; limited: boolean }[];
//     isHoliday: boolean;
//   } | null {
//     // Use the selected therapist from the form; fall back to quickFill preset
//     const tId = therapistId || quickFillSettings?.therapistId || "";
//     if (!tId) return null;
//     const therapist = therapists.find((t) => t._id === tId);
//     if (!therapist) return null;

//     const parts = dateStr.split("-");
//     if (parts.length !== 3) return null;
//     const apiDate = `${parts[0]}-${pad2(Number(parts[1]))}-${pad2(Number(parts[2]))}`;

//     // Full-day holiday?
//     const fullDayHoliday = (therapist.holidays || []).find(
//       (h) => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined)
//     );
//     if (fullDayHoliday) return { availableSlots: [], isHoliday: true };

//     // Partial-holiday slots to exclude
//     const slotsOut: string[] = [];
//     for (const h of therapist.holidays || []) {
//       if (h.date === apiDate && h.isFullDay === false && h.slots?.length) {
//         slotsOut.push(...h.slots.map((s) => s.slotId));
//       }
//     }

//     const rawBooked: string[] = therapist.bookedSlots?.[apiDate] || [];

//     // ── Same edit-exclusion logic as getAvailableSlotsForDate:
//     // When editing a booking, its own slots must not appear as unavailable
//     // in the calendar day tooltip either.
//     const ownSlotsCalendar = new Set<string>();
//     if (editBookingId) {
//       const editingBooking = bookings.find((b) => b._id === editBookingId);
//       if (editingBooking) {
//         for (const s of editingBooking.sessions || []) {
//           const sessionTherapistId =
//             s.therapistId ||
//             (s.therapist && typeof s.therapist === "object" ? (s.therapist as any)._id : "") ||
//             (typeof s.therapist === "string" ? s.therapist : "");
//           if (
//             s.date === apiDate &&
//             s.slotId &&
//             (!sessionTherapistId || sessionTherapistId === tId)
//           ) {
//             ownSlotsCalendar.add(s.slotId);
//           }
//         }
//       }
//     }

//     const booked = rawBooked.filter((id) => !ownSlotsCalendar.has(id));
//     const bookedSet = new Set(booked);
//     const slotsOutSet = new Set(slotsOut);

//     let normalLeft = 10 - booked.filter((id) => !SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
//     let limitedLeft = 5 - booked.filter((id) => !!SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
//     for (const so of slotsOut) {
//       const sd = SESSION_TIME_OPTIONS.find((o) => o.id === so);
//       if (!sd) continue;
//       if (sd.limited) limitedLeft = Math.max(0, limitedLeft - 1);
//       else normalLeft = Math.max(0, normalLeft - 1);
//     }

//     const available = SESSION_TIME_OPTIONS.filter((slot) => {
//       if (slotsOutSet.has(slot.id)) return false;
//       if (bookedSet.has(slot.id)) return false;
//       if (slot.limited && limitedLeft <= 0) return false;
//       if (!slot.limited && normalLeft <= 0) return false;
//       return true;
//     });

//     return { availableSlots: available, isHoliday: false };
//   }

//   // ── Toggle date on calendar ────────────────────────────────────────────────
//   // When quickFillSettings is active the new session is pre-filled with the
//   // preset therapist, therapy type and time slot.  The slot conflict check
//   // (disabled / unavailable) is handled visually in SessionDatesTimesTable —
//   // we still add the session so the receptionist can see and fix it.
//   const toggleDate = (day: number) => {
//     const dateKey = getDateKey(year, month + 1, day);
//     if (typeof maxSelectableDates === "number" && sessions.length >= maxSelectableDates) return;

//     if (quickFillSettings) {
//       // ── Quick-Fill path ──────────────────────────────────────────────────
//       const { therapistId: qTherapistId, therapyTypeId: qTherapyTypeId, slotId: qSlotId } = quickFillSettings;
//       const therapyObj = therapies.find((t) => t._id === qTherapyTypeId);

//       setSessions((prev) =>
//         [...prev, {
//           date: dateKey,
//           slotId: qSlotId,
//           therapistId: qTherapistId,
//           therapyTypeId: { _id: qTherapyTypeId, name: therapyObj?.name || "" },
//         } as BookingSession].sort((a, b) => a.date.localeCompare(b.date))
//       );
//     } else {
//       // ── Manual path (original behaviour) ────────────────────────────────
//       let therapyTypeObj: { _id: string; name: string } | undefined;
//       if (therapyId) {
//         const t = therapies.find((t) => t._id === therapyId);
//         therapyTypeObj = { _id: therapyId, name: t?.name || "" };
//       }
//       setSessions((prev) =>
//         [...prev, {
//           date: dateKey,
//           slotId: "",
//           therapistId: therapistId || therapists[0]?._id || "",
//           ...(therapyTypeObj ? { therapyTypeId: therapyTypeObj } : {}),
//         } as BookingSession].sort((a, b) => a.date.localeCompare(b.date))
//       );
//     }
//   };

//   /**
//    * Removes the most-recently-added session for a given dateKey.
//    * Called by the "−" button on a calendar day cell.
//    */
//   const removeSessionForDate = (dateKey: string) => {
//     setSessions((prev) => {
//       // Find index of the last session with this date
//       let lastIdx = -1;
//       for (let i = prev.length - 1; i >= 0; i--) {
//         if (prev[i].date === dateKey) { lastIdx = i; break; }
//       }
//       if (lastIdx === -1) return prev;
//       return prev.filter((_, i) => i !== lastIdx);
//     });
//   };

//   // ── Session mutations ──────────────────────────────────────────────────────
//   const updateSlotId = (date: string, slotId: string, idx: number) => {
//     setSessions((prev) => prev.map((s, i) => {
//       if (i !== idx) return s;
//       if (prev.some((o, oi) => oi !== idx && o.date === date && o.slotId === slotId)) {
//         toast.error("You can't select the same time slot for the same date."); return s;
//       }
//       return { ...s, slotId };
//     }));
//   };
//   const updateSessionTherapist = (idx: number, newId: string) =>
//     setSessions((prev) => prev.map((s, i) => (i === idx ? { ...s, therapistId: newId } : s)));
//   const updateSessionTherapyType = (idx: number, newId: string) =>
//     setSessions((prev) => prev.map((s, i) => {
//       if (i !== idx) return s;
//       const t = therapies.find((t) => t._id === newId);
//       return { ...s, therapyTypeId: t ? { _id: t._id, name: t.name } : { _id: newId, name: "" } };
//     }));
//   const removeSession = (removeIdx: number) => setSessions((prev) => prev.filter((_, i) => i !== removeIdx));

//   // ── Derived form validity ──────────────────────────────────────────────────
//   function getFirstSessionEarliest(ss: { date: string; slotId: string }[]) {
//     if (!ss.length) return null;
//     return [...ss].sort((a, b) => a.date.localeCompare(b.date))[0];
//   }
//   const earliestSession = getFirstSessionEarliest(sessions);
//   const canBook =
//     Boolean(selectedPatient) && Boolean(selectedPackage) &&
//     sessions.length > 0 && Boolean(earliestSession?.slotId) &&
//     sessions.every((s, idx, arr) => !arr.some((os, oi) => oi !== idx && s.date === os.date && s.slotId === os.slotId)) &&
//     sessions.every((s) => !!(
//       (typeof s.therapyTypeId === "object" && s.therapyTypeId && (s.therapyTypeId as any)._id && (s.therapyTypeId as any).name) ||
//       (typeof s.therapyTypeId === "string" && s.therapyTypeId)
//     ));

//   // ── Coupon ─────────────────────────────────────────────────────────────────
//   function handleCouponApply() {
//     if (!couponInput.trim()) { setCouponStatus(null); setAppliedCoupon(null); return; }
//     const match = coupons.find((c) => c.couponCode?.toLowerCase() === couponInput.trim().toLowerCase() && c.discountEnabled);
//     if (match) { setAppliedCoupon(match); setCouponStatus("valid"); }
//     else { setAppliedCoupon(null); setCouponStatus("invalid"); }
//   }
//   function handleCouponClear() { setCouponInput(""); setAppliedCoupon(null); setCouponStatus(null); }

//   // ── Available slots for a date/therapist ──────────────────────────────────
//   function getAvailableSlotsForDate(
//     date: string, _selectedSessions: any[], _currSlot: string,
//     currRowTherapistId?: string, _isEdit?: boolean
//   ): { [slotId: string]: { disabled: boolean; reason: string } } {
//     const disabledAll = (reason: string) => Object.fromEntries(SESSION_TIME_OPTIONS.map((o) => [o.id, { disabled: true, reason }]));
//     if (!therapists.length) return disabledAll("No therapist data");
//     const therapist = (currRowTherapistId ? therapists.find((t) => t._id === currRowTherapistId) : undefined) || therapists[0];
//     if (!therapist) return disabledAll("No therapist selected");

//     const jsDate = new Date(date);
//     const apiDate = `${jsDate.getFullYear()}-${pad2(jsDate.getMonth() + 1)}-${pad2(jsDate.getDate())}`;
//     const holidays = therapist.holidays || [];
//     const bookedSlotsObj = therapist.bookedSlots || {};

//     if (holidays.find((h) => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined))) {
//       return disabledAll("Unavailable Slot");
//     }
//     const slotsOut: string[] = [];
//     for (const h of holidays) {
//       if (h.date === apiDate && h.isFullDay === false && h.slots?.length) {
//         slotsOut.push(...h.slots.map((s) => s.slotId));
//       }
//     }
//     const rawBooked: string[] = bookedSlotsObj[apiDate] || [];

//     // ── When editing, collect the slots that belong to the booking being
//     // edited so they are NOT treated as "Already booked" for this therapist
//     // on this date.  The receptionist should be free to keep, change, or
//     // reassign those slots without a false conflict warning.
//     const ownSlots = new Set<string>();
//     if (editBookingId) {
//       const editingBooking = bookings.find((b) => b._id === editBookingId);
//       if (editingBooking) {
//         for (const s of editingBooking.sessions || []) {
//           const sessionTherapistId =
//             s.therapistId ||
//             (s.therapist && typeof s.therapist === "object" ? (s.therapist as any)._id : "") ||
//             (typeof s.therapist === "string" ? s.therapist : "");
//           const rowTherapistId = currRowTherapistId || therapist._id;
//           if (
//             s.date === apiDate &&
//             s.slotId &&
//             (!sessionTherapistId || sessionTherapistId === rowTherapistId)
//           ) {
//             ownSlots.add(s.slotId);
//           }
//         }
//       }
//     }

//     // Remove this booking's own slots so they show as selectable, not blocked
//     const booked = rawBooked.filter((id) => !ownSlots.has(id));

//     let normalLeft = 10 - booked.filter((id) => !SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
//     let limitedLeft = 5 - booked.filter((id) => !!SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
//     for (const so of slotsOut) {
//       const sd = SESSION_TIME_OPTIONS.find((o) => o.id === so);
//       if (!sd) continue;
//       if (sd.limited) limitedLeft = Math.max(0, limitedLeft - 1);
//       else normalLeft = Math.max(0, normalLeft - 1);
//     }
//     const slotInfo: { [id: string]: { disabled: boolean; reason: string } } = {};
//     for (const slot of SESSION_TIME_OPTIONS) {
//       if (slotsOut.includes(slot.id)) slotInfo[slot.id] = { disabled: true, reason: "Unavailable slot" };
//       else if (booked.includes(slot.id)) slotInfo[slot.id] = { disabled: true, reason: "Already booked" };
//       else if (slot.limited && limitedLeft <= 0) slotInfo[slot.id] = { disabled: true, reason: "No limited slots" };
//       else if (!slot.limited && normalLeft <= 0) slotInfo[slot.id] = { disabled: true, reason: "No normal slots" };
//       else slotInfo[slot.id] = { disabled: false, reason: "" };
//     }
//     return slotInfo;
//   }

//   // ── Book / update ──────────────────────────────────────────────────────────
//   const handleBookOrUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
//     e.preventDefault();
//     setBookingSuccess(null); setBookingError(null);
//     if (!canBook) {
//       const msg = "Please fill all required fields and select a session date, time, therapist, and therapy type.";
//       setBookingError(msg); toast.error(msg); return;
//     }
//     setBookingLoading(true);
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     try {
//       const body: any = {
//         patient: selectedPatient?.id, therapy: selectedTherapy?._id,
//         package: selectedPackage?._id, therapist: selectedTherapist?._id,
//         sessions: sessions.map((sess) => {
//           let therapyTypeIdValue: any;
//           if (typeof sess.therapyTypeId === "object" && sess.therapyTypeId && (sess.therapyTypeId as any)._id) {
//             therapyTypeIdValue = sess.therapyTypeId;
//           } else if (typeof sess.therapyTypeId === "string") {
//             const t = therapies.find((t) => t._id === sess.therapyTypeId);
//             therapyTypeIdValue = t ? { _id: t._id, name: t.name } : { _id: sess.therapyTypeId, name: "" };
//           } else {
//             const t = therapies.find((t) => t._id === therapyId);
//             therapyTypeIdValue = t ? { _id: t._id, name: t.name } : { _id: therapyId, name: "" };
//           }
//           return { date: sess.date, slotId: sess.slotId, therapistId: sess.therapistId || selectedTherapist?._id, therapyTypeId: therapyTypeIdValue };
//         }),
//         coupon: appliedCoupon?._id ?? null,
//         bookingRequestId, isBookingRequest, isSessionEditRequest, sessionEditRequestId, remark,
//       };
//       const token = localStorage.getItem("admin-token");
//       const headers = { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) };
//       const url = editBookingId ? `${endpoint}/api/admin/bookings/${editBookingId}` : `${endpoint}/api/admin/bookings`;
//       const method = editBookingId ? "PUT" : "POST";
//       const resp = await fetch(url, { method, headers, body: JSON.stringify(body) });
//       if (!resp.ok) { const err = await resp.json(); throw new Error(err?.message || "Failed."); }
//       const successMsg = editBookingId ? "Booking successfully updated." : "Booking successfully created.";
//       setBookingSuccess(successMsg);
//       toast.success(successMsg, { autoClose: 2000 });
//       resetForm();
//       setTimeout(() => { window.location.reload(); }, 2000);
//     } catch (error: any) {
//       setBookingError(error?.message || "Failed to submit booking.");
//       toast.error(error?.message || "Failed to submit booking.");
//     } finally {
//       setBookingLoading(false);
//     }
//   };

//   // ── Edit ───────────────────────────────────────────────────────────────────
//   function handleEditBooking(bookingId: string) {
//     if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
//     setEditBookingId(bookingId);
//     setBookingError(null); setBookingSuccess(null);
//     const booking = bookings.find((b) => b._id === bookingId);
//     if (!booking) return;
//     const mainTherapistId =
//       (typeof booking.therapist === "string" && booking.therapist) || ((booking.therapist as any)?._id) || "";
//     setTherapistId(mainTherapistId);
//     const foundPatient = patients.find((p) =>
//       (p.patientId && (booking.patient as any)?.patientId && p.patientId === (booking.patient as any).patientId) ||
//       (p.id && (booking.patient as any)?.id && p.id === (booking.patient as any).id)
//     );
//     setPatientId(foundPatient ? foundPatient.id : ((booking.patient as any)?.id || ""));
//     setTherapyId((booking.therapy as any)?._id || "");
//     setPackageId((booking.package as any)?._id || "");
//     const mappedSessions = (booking.sessions || []).map((s, idx) => {
//       let therapyTypeObj: { _id: string; name: string };
//       if (typeof s.therapyTypeId === "object") {
//         therapyTypeObj = s.therapyTypeId && (s.therapyTypeId as any)._id
//           ? { _id: (s.therapyTypeId as any)._id, name: (s.therapyTypeId as any).name || "" }
//           : { _id: "", name: "" };
//       } else if (typeof s.therapyTypeId === "string") {
//         const t = therapies.find((t) => t._id === s.therapyTypeId);
//         therapyTypeObj = t ? { _id: t._id, name: t.name } : { _id: s.therapyTypeId, name: "" };
//       } else {
//         const bT = typeof booking.therapy === "object" && booking.therapy._id ? booking.therapy : undefined;
//         therapyTypeObj = bT ? { _id: bT._id, name: bT.name || "" } : { _id: "", name: "" };
//       }
//       return {
//         sessionId: (typeof booking.sessions?.[idx]?.sessionId === "string" && booking.sessions[idx].sessionId)
//           ? booking.sessions[idx].sessionId : (booking.sessions?.[idx]?._id || `${idx + 1}`),
//         date: s.date, slotId: s.slotId ?? "",
//         therapistId: s.therapistId || (s.therapist && typeof s.therapist === "object" ? s.therapist._id : "") || (typeof s.therapist === "string" ? s.therapist : "") || mainTherapistId,
//         therapyTypeId: therapyTypeObj,
//       };
//     });
//     setSessions(mappedSessions.sort((a, b) => a.date.localeCompare(b.date)));
//     const couponObj = booking.discountInfo?.coupon
//       ? coupons.find((x) => x.couponCode === booking.discountInfo!.coupon.couponCode || x._id === booking.discountInfo!.coupon._id) ?? null
//       : null;
//     setAppliedCoupon(couponObj);
//     setCouponInput(couponObj?.couponCode || "");
//     setCouponStatus(couponObj ? "valid" : null);
//     setRemark(booking.remark || "");
//   }

//   function resetForm() {
//     setPatientId(""); setTherapyId(""); setPackageId(""); setTherapistId("");
//     setSessions([]); setEditBookingId(null);
//     setBookingError(null); setBookingSuccess(null);
//     setBookedSlotsPerRow({});
//     setCouponInput(""); setAppliedCoupon(null); setCouponStatus(null);
//     setRemark("");
//     // Note: quickFillSettings is intentionally NOT cleared on reset —
//     // the receptionist may want to continue filling with the same preset.
//   }

//   async function handleCollectPayment(booking: Booking) {
//     if (!booking?._id) return;
//     if (!window.confirm("Confirm collect payment for this booking?")) return;
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     setPaymentLoadingBookingId(booking._id);
//     try {
//       const resp = await fetch(`${endpoint}/api/admin/bookings/${booking._id}/collect-payment`, {
//         method: "POST", headers: { "Content-Type": "application/json" },
//       });
//       if (!resp.ok) { const err = await resp.json(); throw new Error(err?.message || "Payment collection failed."); }
//       toast.success("Payment marked as collected.");
//     } catch (err: any) {
//       toast.error(err?.message || "Payment collection failed.");
//     } finally {
//       setPaymentLoadingBookingId(null);
//     }
//   }

//   function getTherapistObject(booking: Booking): Therapist | undefined {
//     if (booking.therapist && typeof booking.therapist === "object" && "_id" in booking.therapist)
//       return booking.therapist as Therapist;
//     if (typeof booking.therapist === "string") return therapists.find((t) => t._id === booking.therapist);
//     return undefined;
//   }

//   // ── Render ─────────────────────────────────────────────────────────────────
//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
//       <HeaderGuide guideOpen={guideOpen} setGuideOpen={setGuideOpen} editBookingId={editBookingId} />

//       <div className="flex flex-col gap-6">
//         <CalendarPanel
//           year={year} month={month} changeMonth={changeMonth}
//           startDay={startDay} daysInMonth={daysInMonth}
//           sessions={sessions} toggleDate={toggleDate}
//           removeSessionForDate={removeSessionForDate}
//           getDaySlotSummary={getDaySlotSummary}
//           maxSelectableDates={maxSelectableDates}
//           quickFillActive={!!quickFillSettings}
//           getTherapistAvailableSlotsForDay={getTherapistAvailableSlotsForDay}
//           selectedTherapistName={selectedTherapist?.name}
//         />

//         <BookingFormPanel
//           editBookingId={editBookingId}
//           handleReset={resetForm}
//           handleCancelEdit={resetForm}
//           handleBookOrUpdate={handleBookOrUpdate}
//           canBook={canBook}
//           bookingLoading={bookingLoading}
//           bookingError={bookingError}
//           bookingSuccess={bookingSuccess}
//           therapistId={therapistId} setTherapistId={setTherapistId} therapists={therapists}
//           patientId={patientId} setPatientId={setPatientId} patients={patients}
//           therapyId={therapyId} setTherapyId={setTherapyId} therapies={therapies}
//           packageId={packageId} setPackageId={setPackageId} packages={packages}
//           couponInput={couponInput} setCouponInput={setCouponInput}
//           appliedCoupon={appliedCoupon} couponStatus={couponStatus} setCouponStatus={setCouponStatus}
//           handleCouponApply={handleCouponApply} handleCouponClear={handleCouponClear}
//           remark={remark} setRemark={setRemark}
//           sessions={sessions} selectedPackage={selectedPackage} earliestSession={earliestSession}
//           updateSlotId={updateSlotId} updateSessionTherapist={updateSessionTherapist}
//           updateSessionTherapyType={updateSessionTherapyType} removeSession={removeSession}
//           bookedSlotsPerRow={bookedSlotsPerRow} getAvailableSlotsForDate={getAvailableSlotsForDate}
//           bookings={bookings}
//           quickFillSettings={quickFillSettings}
//           setQuickFillSettings={setQuickFillSettings}
//         />
//       </div>

//       <BookingSummary
//         bookings={bookings} setBookings={setBookings}
//         setBookingsLoading={setBookingsLoading} setBookingsError={setBookingsError}
//         getTherapistObject={getTherapistObject}
//         editBookingId={editBookingId}
//         handleEditBooking={handleEditBooking}
//         handleCollectPayment={handleCollectPayment}
//         paymentLoadingBookingId={paymentLoadingBookingId}
//       />

//       {(apiLoading || bookingsLoading) && (
//         <div className="fixed inset-0 bg-black bg-opacity-15 z-50 flex items-center justify-center pointer-events-none select-none">
//           <div className="bg-white rounded shadow p-6 text-lg text-blue-600 font-bold">Loading data…</div>
//         </div>
//       )}
//       {(apiError || bookingsError) && (
//         <div className="fixed bottom-2 right-2 bg-red-100 text-red-700 px-4 py-2 rounded">
//           {apiError || bookingsError}
//         </div>
//       )}
//     </motion.div>
//   );
// }

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocation } from "react-router";

import {
  Patient, Therapy, Package, Therapist, BookingSession, Booking,
  MonthlySlotsSummary, DaySlotSummary, QuickFillSettings,
  SESSION_TIME_OPTIONS, pad2, getDateKey, getDaysInMonth, getStartDay, getMissedSessionsCount, getEffectiveMaxSessions,
} from "./types";
import { HeaderGuide, CalendarPanel } from "./CalendarAndHeader";
import { BookingFormPanel } from "./BookingFormPanel";
import { BookingSummary } from "./BookingSummary";

export default function AppointmentBookingSystemMain() {
  const location = useLocation();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // ── Remote data ────────────────────────────────────────────────────────────
  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState<string | null>(null);

  // ── Form state ─────────────────────────────────────────────────────────────
  const [patientId, setPatientId] = useState("");
  const [therapyId, setTherapyId] = useState("");
  const [packageId, setPackageId] = useState("");
  const [therapistId, setTherapistId] = useState("");
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [remark, setRemark] = useState("");
  const [editBookingId, setEditBookingId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [paymentLoadingBookingId, setPaymentLoadingBookingId] = useState<string | null>(null);

  // ── Coupon ─────────────────────────────────────────────────────────────────
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponStatus, setCouponStatus] = useState<null | "valid" | "invalid">(null);

  // ── Booking-request flags ──────────────────────────────────────────────────
  const [isBookingRequest, setIsBookingRequest] = useState(false);
  const [bookingRequestId, setBookingRequestId] = useState("");
  const [isSessionEditRequest, setIsSessionEditRequest] = useState(false);
  const [sessionEditRequestId, setSessionEditRequestId] = useState("");

  // ── Calendar / slots ───────────────────────────────────────────────────────
  const [monthlySlotSummary, setMonthlySlotSummary] = useState<MonthlySlotsSummary>({});
  const [bookedSlotsPerRow, setBookedSlotsPerRow] = useState<{ [rowKey: string]: string[] }>({});
  const [guideOpen, setGuideOpen] = useState(false);

  // ── Quick Fill ─────────────────────────────────────────────────────────────
  // When set, clicking a calendar date auto-fills the new session with these
  // preset values instead of leaving them blank.
  const [quickFillSettings, setQuickFillSettings] = useState<QuickFillSettings | null>(null);

  // ── Derived selections ─────────────────────────────────────────────────────
  const selectedPackage = packages.find((p) => p._id === packageId) || null;
  const selectedPatient = patients.find((p) => p.id === patientId) || null;
  const selectedTherapy = therapies.find((t) => t._id === therapyId) || null;
  const selectedTherapist = therapists.find((t) => t._id === therapistId) || null;
  const maxSelectableDates = getEffectiveMaxSessions(selectedPackage, sessions);
  // How many of the currently-loaded sessions are 'Missed' — these consumed a
  // package slot but Admin is allowed to add a same number of replacement
  // sessions on top of the package's normal total (surfaced in the UI hint).
  const missedSessionsCount = getMissedSessionsCount(sessions);

  // ── Fetch home-details on mount ────────────────────────────────────────────
  useEffect(() => {
    setApiLoading(true);
    setApiError(null);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    fetch(`${endpoint}/api/admin/bookings/home-details`)
      .then(async (resp) => {
        if (!resp.ok) throw new Error("Failed API call");
        const parsed = await resp.json();
        setPatients(parsed.patients || []);
        setTherapists(parsed.therapists || []);
        setTherapies(parsed.therapyTypes || []);
        setPackages(parsed.packages || []);
        setCoupons(
          (parsed.coupons || []).map((c: any) => ({
            _id: c._id, couponCode: c.couponCode, discount: c.discount,
            validityDays: c.validityDays, discountEnabled: c.discountEnabled,
          }))
        );
        setApiLoading(false);
      })
      .catch(() => { setApiError("Could not load booking data."); setApiLoading(false); });
  }, []);

  // ── Populate form from location.state (booking request) ───────────────────
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
          date: s.date || "", slotId: s.slotId || s.time || "",
          therapistId: req.therapist?._id || req.therapist || "",
          therapyTypeId:
            typeof s.therapyTypeId === "object" ? s.therapyTypeId
            : typeof s.therapyTypeId === "string"
              ? (therapies.find((t) => t._id === s.therapyTypeId)
                  ? { _id: s.therapyTypeId, name: therapies.find((t) => t._id === s.therapyTypeId)?.name || "" }
                  : { _id: s.therapyTypeId, name: "" })
              : req.therapy?._id ? { _id: req.therapy._id, name: req.therapy.name || "" } : "",
        })).sort((a: any, b: any) => (a.date || "").localeCompare(b.date || "")));
        setTherapistId(req.therapist?._id || req.therapist || "");
      }
    }
  }, [location.state, therapies]); // eslint-disable-line

  useEffect(() => {
    if (location.state && (location.state as any).sessionEditRequest) {
      const req = (location.state as any).sessionEditRequest;
      setIsSessionEditRequest(true);
      setSessionEditRequestId(req._id || "");
      handleEditBooking(req.appointmentId._id);
    }
  }, [location.state]); // eslint-disable-line

  // ── Monthly slot summary ───────────────────────────────────────────────────
  useEffect(() => {
    if (therapists.length === 0) return;
    const summary: MonthlySlotsSummary = {};
    for (let day = 1; day <= daysInMonth; ++day) {
      const jsDate = new Date(year, month, day);
      const dateKeyApi = `${jsDate.getFullYear()}-${pad2(jsDate.getMonth() + 1)}-${pad2(jsDate.getDate())}`;
      let totalNormalSlots = 0, totalLimitedSlots = 0, totalNormalBooked = 0, totalLimitedBooked = 0;
      const therapistsBookedSlots: { [id: string]: string[] } = {};

      for (const t of therapists) {
        const fullDayHoliday = (t.holidays || []).find(
          (h) => h.date === dateKeyApi && (h.isFullDay === true || h.isFullDay === undefined)
        );
        if (fullDayHoliday) { therapistsBookedSlots[t._id] = []; continue; }

        const slotsOut: string[] = [];
        for (const h of t.holidays || []) {
          if (h.date === dateKeyApi && h.isFullDay === false && h.slots?.length) {
            slotsOut.push(...h.slots.map((s) => s.slotId));
          }
        }
        let normalSlots = 10, limitedSlots = 5;
        for (const so of slotsOut) {
          const sd = SESSION_TIME_OPTIONS.find((opt) => opt.id === so);
          if (!sd) continue;
          if (sd.limited) limitedSlots = Math.max(0, limitedSlots - 1);
          else normalSlots = Math.max(0, normalSlots - 1);
        }
        totalNormalSlots += normalSlots;
        totalLimitedSlots += limitedSlots;

        const bookedArr = t.bookedSlots?.[dateKeyApi] || [];
        therapistsBookedSlots[t._id] = bookedArr;
        for (const slotId of bookedArr) {
          const sd = SESSION_TIME_OPTIONS.find((opt) => opt.id === slotId);
          if (sd) { if (sd.limited) totalLimitedBooked++; else totalNormalBooked++; }
        }
      }
      summary[`${pad2(day)}-${pad2(month + 1)}-${year}`] = {
        bookedSlots: totalNormalBooked, totalAvailableSlots: totalNormalSlots,
        limitedBookedSlots: totalLimitedBooked, totalLimitedAvailableSlots: totalLimitedSlots,
        BookedSlots: therapistsBookedSlots,
      } as DaySlotSummary;
    }
    setMonthlySlotSummary(summary);
  }, [therapists, year, month, daysInMonth]);

  // ── Booked slots per row ───────────────────────────────────────────────────
  useEffect(() => {
    const mapping: { [key: string]: string[] } = {};
    for (const s of sessions) {
      const tId = s.therapistId || therapistId || therapists[0]?._id || "";
      if (!tId || !s.date) continue;
      const parts = s.date.split("-");
      if (parts.length !== 3) continue;
      const apiKey = `${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`;
      const daySummary = monthlySlotSummary[apiKey];
      mapping[`${s.date}:${tId}`] = daySummary?.BookedSlots?.[tId] || [];
    }
    setBookedSlotsPerRow(mapping);
  }, [sessions, therapistId, therapists, monthlySlotSummary]);

  // ── Cap sessions to package max ────────────────────────────────────────────
  useEffect(() => {
    if (maxSelectableDates === undefined) return;
    if (sessions.length > maxSelectableDates) setSessions((prev) => prev.slice(0, maxSelectableDates));
  }, [packageId, maxSelectableDates, sessions.length]);

  // ── Calendar helpers ───────────────────────────────────────────────────────
  const changeMonth = (dir: "prev" | "next") => {
    if (dir === "prev") { if (month === 0) { setMonth(11); setYear((y) => y - 1); } else setMonth((m) => m - 1); }
    else { if (month === 11) { setMonth(0); setYear((y) => y + 1); } else setMonth((m) => m + 1); }
  };

  function getServerDaySlotSummary(dateKey: string) {
    const parts = dateKey.split("-");
    if (parts.length !== 3) return undefined;
    return monthlySlotSummary[`${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`];
  }
  function getDaySlotSummary(dateStr: string) {
    const d = getServerDaySlotSummary(dateStr);
    if (!d) return { total: undefined, booked: undefined, limitedTotal: undefined, limitedBooked: undefined };
    return { total: d.totalAvailableSlots, booked: d.bookedSlots, limitedTotal: d.totalLimitedAvailableSlots, limitedBooked: d.limitedBookedSlots };
  }

  /**
   * Returns the available (not booked, not on holiday) slot labels for a given
   * therapist on a given date, or null when no therapist is selected.
   */
  function getTherapistAvailableSlotsForDay(dateStr: string): {
    availableSlots: { id: string; label: string; limited: boolean }[];
    isHoliday: boolean;
  } | null {
    // Use the selected therapist from the form; fall back to quickFill preset
    const tId = therapistId || quickFillSettings?.therapistId || "";
    if (!tId) return null;
    const therapist = therapists.find((t) => t._id === tId);
    if (!therapist) return null;

    const parts = dateStr.split("-");
    if (parts.length !== 3) return null;
    const apiDate = `${parts[0]}-${pad2(Number(parts[1]))}-${pad2(Number(parts[2]))}`;

    // Full-day holiday?
    const fullDayHoliday = (therapist.holidays || []).find(
      (h) => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined)
    );
    if (fullDayHoliday) return { availableSlots: [], isHoliday: true };

    // Partial-holiday slots to exclude
    const slotsOut: string[] = [];
    for (const h of therapist.holidays || []) {
      if (h.date === apiDate && h.isFullDay === false && h.slots?.length) {
        slotsOut.push(...h.slots.map((s) => s.slotId));
      }
    }

    const rawBooked: string[] = therapist.bookedSlots?.[apiDate] || [];

    // ── Same edit-exclusion logic as getAvailableSlotsForDate:
    // When editing a booking, its own slots must not appear as unavailable
    // in the calendar day tooltip either.
    const ownSlotsCalendar = new Set<string>();
    if (editBookingId) {
      const editingBooking = bookings.find((b) => b._id === editBookingId);
      if (editingBooking) {
        for (const s of editingBooking.sessions || []) {
          const sessionTherapistId =
            s.therapistId ||
            (s.therapist && typeof s.therapist === "object" ? (s.therapist as any)._id : "") ||
            (typeof s.therapist === "string" ? s.therapist : "");
          if (
            s.date === apiDate &&
            s.slotId &&
            (!sessionTherapistId || sessionTherapistId === tId)
          ) {
            ownSlotsCalendar.add(s.slotId);
          }
        }
      }
    }

    const booked = rawBooked.filter((id) => !ownSlotsCalendar.has(id));
    const bookedSet = new Set(booked);
    const slotsOutSet = new Set(slotsOut);

    let normalLeft = 10 - booked.filter((id) => !SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
    let limitedLeft = 5 - booked.filter((id) => !!SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
    for (const so of slotsOut) {
      const sd = SESSION_TIME_OPTIONS.find((o) => o.id === so);
      if (!sd) continue;
      if (sd.limited) limitedLeft = Math.max(0, limitedLeft - 1);
      else normalLeft = Math.max(0, normalLeft - 1);
    }

    const available = SESSION_TIME_OPTIONS.filter((slot) => {
      if (slotsOutSet.has(slot.id)) return false;
      if (bookedSet.has(slot.id)) return false;
      if (slot.limited && limitedLeft <= 0) return false;
      if (!slot.limited && normalLeft <= 0) return false;
      return true;
    });

    return { availableSlots: available, isHoliday: false };
  }

  // ── Toggle date on calendar ────────────────────────────────────────────────
  // When quickFillSettings is active the new session is pre-filled with the
  // preset therapist, therapy type and time slot.  The slot conflict check
  // (disabled / unavailable) is handled visually in SessionDatesTimesTable —
  // we still add the session so the receptionist can see and fix it.
  const toggleDate = (day: number) => {
    const dateKey = getDateKey(year, month + 1, day);
    if (typeof maxSelectableDates === "number" && sessions.length >= maxSelectableDates) return;

    if (quickFillSettings) {
      // ── Quick-Fill path ──────────────────────────────────────────────────
      const { therapistId: qTherapistId, therapyTypeId: qTherapyTypeId, slotId: qSlotId } = quickFillSettings;
      const therapyObj = therapies.find((t) => t._id === qTherapyTypeId);

      setSessions((prev) =>
        [...prev, {
          date: dateKey,
          slotId: qSlotId,
          therapistId: qTherapistId,
          therapyTypeId: { _id: qTherapyTypeId, name: therapyObj?.name || "" },
        } as BookingSession].sort((a, b) => a.date.localeCompare(b.date))
      );
    } else {
      // ── Manual path (original behaviour) ────────────────────────────────
      let therapyTypeObj: { _id: string; name: string } | undefined;
      if (therapyId) {
        const t = therapies.find((t) => t._id === therapyId);
        therapyTypeObj = { _id: therapyId, name: t?.name || "" };
      }
      setSessions((prev) =>
        [...prev, {
          date: dateKey,
          slotId: "",
          therapistId: therapistId || therapists[0]?._id || "",
          ...(therapyTypeObj ? { therapyTypeId: therapyTypeObj } : {}),
        } as BookingSession].sort((a, b) => a.date.localeCompare(b.date))
      );
    }
  };

  /**
   * Removes the most-recently-added session for a given dateKey.
   * Called by the "−" button on a calendar day cell.
   */
  const removeSessionForDate = (dateKey: string) => {
    setSessions((prev) => {
      // Find index of the last session with this date
      let lastIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].date === dateKey) { lastIdx = i; break; }
      }
      if (lastIdx === -1) return prev;
      return prev.filter((_, i) => i !== lastIdx);
    });
  };

  // ── Session mutations ──────────────────────────────────────────────────────
  const updateSlotId = (date: string, slotId: string, idx: number) => {
    setSessions((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      if (prev.some((o, oi) => oi !== idx && o.date === date && o.slotId === slotId)) {
        toast.error("You can't select the same time slot for the same date."); return s;
      }
      return { ...s, slotId };
    }));
  };
  const updateSessionTherapist = (idx: number, newId: string) =>
    setSessions((prev) => prev.map((s, i) => (i === idx ? { ...s, therapistId: newId } : s)));
  const updateSessionTherapyType = (idx: number, newId: string) =>
    setSessions((prev) => prev.map((s, i) => {
      if (i !== idx) return s;
      const t = therapies.find((t) => t._id === newId);
      return { ...s, therapyTypeId: t ? { _id: t._id, name: t.name } : { _id: newId, name: "" } };
    }));
  const removeSession = (removeIdx: number) => setSessions((prev) => prev.filter((_, i) => i !== removeIdx));

  // ── Derived form validity ──────────────────────────────────────────────────
  function getFirstSessionEarliest(ss: { date: string; slotId: string }[]) {
    if (!ss.length) return null;
    return [...ss].sort((a, b) => a.date.localeCompare(b.date))[0];
  }
  const earliestSession = getFirstSessionEarliest(sessions);
  const canBook =
    Boolean(selectedPatient) && Boolean(selectedPackage) &&
    sessions.length > 0 && Boolean(earliestSession?.slotId) &&
    sessions.every((s, idx, arr) => !arr.some((os, oi) => oi !== idx && s.date === os.date && s.slotId === os.slotId)) &&
    sessions.every((s) => !!(
      (typeof s.therapyTypeId === "object" && s.therapyTypeId && (s.therapyTypeId as any)._id && (s.therapyTypeId as any).name) ||
      (typeof s.therapyTypeId === "string" && s.therapyTypeId)
    ));

  // ── Coupon ─────────────────────────────────────────────────────────────────
  function handleCouponApply() {
    if (!couponInput.trim()) { setCouponStatus(null); setAppliedCoupon(null); return; }
    const match = coupons.find((c) => c.couponCode?.toLowerCase() === couponInput.trim().toLowerCase() && c.discountEnabled);
    if (match) { setAppliedCoupon(match); setCouponStatus("valid"); }
    else { setAppliedCoupon(null); setCouponStatus("invalid"); }
  }
  function handleCouponClear() { setCouponInput(""); setAppliedCoupon(null); setCouponStatus(null); }

  // ── Available slots for a date/therapist ──────────────────────────────────
  function getAvailableSlotsForDate(
    date: string, _selectedSessions: any[], _currSlot: string,
    currRowTherapistId?: string, _isEdit?: boolean
  ): { [slotId: string]: { disabled: boolean; reason: string } } {
    const disabledAll = (reason: string) => Object.fromEntries(SESSION_TIME_OPTIONS.map((o) => [o.id, { disabled: true, reason }]));
    if (!therapists.length) return disabledAll("No therapist data");
    const therapist = (currRowTherapistId ? therapists.find((t) => t._id === currRowTherapistId) : undefined) || therapists[0];
    if (!therapist) return disabledAll("No therapist selected");

    const jsDate = new Date(date);
    const apiDate = `${jsDate.getFullYear()}-${pad2(jsDate.getMonth() + 1)}-${pad2(jsDate.getDate())}`;
    const holidays = therapist.holidays || [];
    const bookedSlotsObj = therapist.bookedSlots || {};

    if (holidays.find((h) => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined))) {
      return disabledAll("Unavailable Slot");
    }
    const slotsOut: string[] = [];
    for (const h of holidays) {
      if (h.date === apiDate && h.isFullDay === false && h.slots?.length) {
        slotsOut.push(...h.slots.map((s) => s.slotId));
      }
    }
    const rawBooked: string[] = bookedSlotsObj[apiDate] || [];

    // ── When editing, collect the slots that belong to the booking being
    // edited so they are NOT treated as "Already booked" for this therapist
    // on this date.  The receptionist should be free to keep, change, or
    // reassign those slots without a false conflict warning.
    const ownSlots = new Set<string>();
    if (editBookingId) {
      const editingBooking = bookings.find((b) => b._id === editBookingId);
      if (editingBooking) {
        for (const s of editingBooking.sessions || []) {
          const sessionTherapistId =
            s.therapistId ||
            (s.therapist && typeof s.therapist === "object" ? (s.therapist as any)._id : "") ||
            (typeof s.therapist === "string" ? s.therapist : "");
          const rowTherapistId = currRowTherapistId || therapist._id;
          if (
            s.date === apiDate &&
            s.slotId &&
            (!sessionTherapistId || sessionTherapistId === rowTherapistId)
          ) {
            ownSlots.add(s.slotId);
          }
        }
      }
    }

    // Remove this booking's own slots so they show as selectable, not blocked
    const booked = rawBooked.filter((id) => !ownSlots.has(id));

    let normalLeft = 10 - booked.filter((id) => !SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
    let limitedLeft = 5 - booked.filter((id) => !!SESSION_TIME_OPTIONS.find((o) => o.id === id)?.limited).length;
    for (const so of slotsOut) {
      const sd = SESSION_TIME_OPTIONS.find((o) => o.id === so);
      if (!sd) continue;
      if (sd.limited) limitedLeft = Math.max(0, limitedLeft - 1);
      else normalLeft = Math.max(0, normalLeft - 1);
    }
    const slotInfo: { [id: string]: { disabled: boolean; reason: string } } = {};
    for (const slot of SESSION_TIME_OPTIONS) {
      if (slotsOut.includes(slot.id)) slotInfo[slot.id] = { disabled: true, reason: "Unavailable slot" };
      else if (booked.includes(slot.id)) slotInfo[slot.id] = { disabled: true, reason: "Already booked" };
      else if (slot.limited && limitedLeft <= 0) slotInfo[slot.id] = { disabled: true, reason: "No limited slots" };
      else if (!slot.limited && normalLeft <= 0) slotInfo[slot.id] = { disabled: true, reason: "No normal slots" };
      else slotInfo[slot.id] = { disabled: false, reason: "" };
    }
    return slotInfo;
  }

  // ── Book / update ──────────────────────────────────────────────────────────
  const handleBookOrUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBookingSuccess(null); setBookingError(null);
    if (!canBook) {
      const msg = "Please fill all required fields and select a session date, time, therapist, and therapy type.";
      setBookingError(msg); toast.error(msg); return;
    }
    setBookingLoading(true);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    try {
      const body: any = {
        patient: selectedPatient?.id, therapy: selectedTherapy?._id,
        package: selectedPackage?._id, therapist: selectedTherapist?._id,
        sessions: sessions.map((sess) => {
          let therapyTypeIdValue: any;
          if (typeof sess.therapyTypeId === "object" && sess.therapyTypeId && (sess.therapyTypeId as any)._id) {
            therapyTypeIdValue = sess.therapyTypeId;
          } else if (typeof sess.therapyTypeId === "string") {
            const t = therapies.find((t) => t._id === sess.therapyTypeId);
            therapyTypeIdValue = t ? { _id: t._id, name: t.name } : { _id: sess.therapyTypeId, name: "" };
          } else {
            const t = therapies.find((t) => t._id === therapyId);
            therapyTypeIdValue = t ? { _id: t._id, name: t.name } : { _id: therapyId, name: "" };
          }
          return { date: sess.date, slotId: sess.slotId, therapistId: sess.therapistId || selectedTherapist?._id, therapyTypeId: therapyTypeIdValue };
        }),
        coupon: appliedCoupon?._id ?? null,
        bookingRequestId, isBookingRequest, isSessionEditRequest, sessionEditRequestId, remark,
      };
      const token = localStorage.getItem("admin-token");
      const headers = { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) };
      const url = editBookingId ? `${endpoint}/api/admin/bookings/${editBookingId}` : `${endpoint}/api/admin/bookings`;
      const method = editBookingId ? "PUT" : "POST";
      const resp = await fetch(url, { method, headers, body: JSON.stringify(body) });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err?.message || "Failed."); }
      const successMsg = editBookingId ? "Booking successfully updated." : "Booking successfully created.";
      setBookingSuccess(successMsg);
      toast.success(successMsg, { autoClose: 2000 });
      resetForm();
      setTimeout(() => { window.location.reload(); }, 2000);
    } catch (error: any) {
      setBookingError(error?.message || "Failed to submit booking.");
      toast.error(error?.message || "Failed to submit booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  function handleEditBooking(bookingId: string) {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
    setEditBookingId(bookingId);
    setBookingError(null); setBookingSuccess(null);
    const booking = bookings.find((b) => b._id === bookingId);
    if (!booking) return;
    const mainTherapistId =
      (typeof booking.therapist === "string" && booking.therapist) || ((booking.therapist as any)?._id) || "";
    setTherapistId(mainTherapistId);
    const foundPatient = patients.find((p) =>
      (p.patientId && (booking.patient as any)?.patientId && p.patientId === (booking.patient as any).patientId) ||
      (p.id && (booking.patient as any)?.id && p.id === (booking.patient as any).id)
    );
    setPatientId(foundPatient ? foundPatient.id : ((booking.patient as any)?.id || ""));
    setTherapyId((booking.therapy as any)?._id || "");
    setPackageId((booking.package as any)?._id || "");
    const mappedSessions = (booking.sessions || []).map((s, idx) => {
      let therapyTypeObj: { _id: string; name: string };
      if (typeof s.therapyTypeId === "object") {
        therapyTypeObj = s.therapyTypeId && (s.therapyTypeId as any)._id
          ? { _id: (s.therapyTypeId as any)._id, name: (s.therapyTypeId as any).name || "" }
          : { _id: "", name: "" };
      } else if (typeof s.therapyTypeId === "string") {
        const t = therapies.find((t) => t._id === s.therapyTypeId);
        therapyTypeObj = t ? { _id: t._id, name: t.name } : { _id: s.therapyTypeId, name: "" };
      } else {
        const bT = typeof booking.therapy === "object" && booking.therapy._id ? booking.therapy : undefined;
        therapyTypeObj = bT ? { _id: bT._id, name: bT.name || "" } : { _id: "", name: "" };
      }
      return {
        sessionId: (typeof booking.sessions?.[idx]?.sessionId === "string" && booking.sessions[idx].sessionId)
          ? booking.sessions[idx].sessionId : (booking.sessions?.[idx]?._id || `${idx + 1}`),
        date: s.date, slotId: s.slotId ?? "",
        therapistId: s.therapistId || (s.therapist && typeof s.therapist === "object" ? s.therapist._id : "") || (typeof s.therapist === "string" ? s.therapist : "") || mainTherapistId,
        therapyTypeId: therapyTypeObj,
        // Preserve attendance state so the session cap can correctly account
        // for missed sessions (see getEffectiveMaxSessions in types.ts).
        isCheckedIn: typeof s.isCheckedIn === "boolean" ? s.isCheckedIn : false,
        status: s.status || "NotCheckedIn",
      };
    });
    setSessions(mappedSessions.sort((a, b) => a.date.localeCompare(b.date)));
    const couponObj = booking.discountInfo?.coupon
      ? coupons.find((x) => x.couponCode === booking.discountInfo!.coupon.couponCode || x._id === booking.discountInfo!.coupon._id) ?? null
      : null;
    setAppliedCoupon(couponObj);
    setCouponInput(couponObj?.couponCode || "");
    setCouponStatus(couponObj ? "valid" : null);
    setRemark(booking.remark || "");
  }

  function resetForm() {
    setPatientId(""); setTherapyId(""); setPackageId(""); setTherapistId("");
    setSessions([]); setEditBookingId(null);
    setBookingError(null); setBookingSuccess(null);
    setBookedSlotsPerRow({});
    setCouponInput(""); setAppliedCoupon(null); setCouponStatus(null);
    setRemark("");
    // Note: quickFillSettings is intentionally NOT cleared on reset —
    // the receptionist may want to continue filling with the same preset.
  }

  async function handleCollectPayment(booking: Booking) {
    if (!booking?._id) return;
    if (!window.confirm("Confirm collect payment for this booking?")) return;
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    setPaymentLoadingBookingId(booking._id);
    try {
      const resp = await fetch(`${endpoint}/api/admin/bookings/${booking._id}/collect-payment`, {
        method: "POST", headers: { "Content-Type": "application/json" },
      });
      if (!resp.ok) { const err = await resp.json(); throw new Error(err?.message || "Payment collection failed."); }
      toast.success("Payment marked as collected.");
    } catch (err: any) {
      toast.error(err?.message || "Payment collection failed.");
    } finally {
      setPaymentLoadingBookingId(null);
    }
  }

  function getTherapistObject(booking: Booking): Therapist | undefined {
    if (booking.therapist && typeof booking.therapist === "object" && "_id" in booking.therapist)
      return booking.therapist as Therapist;
    if (typeof booking.therapist === "string") return therapists.find((t) => t._id === booking.therapist);
    return undefined;
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <HeaderGuide guideOpen={guideOpen} setGuideOpen={setGuideOpen} editBookingId={editBookingId} />

      <div className="flex flex-col gap-6">
        <CalendarPanel
          year={year} month={month} changeMonth={changeMonth}
          startDay={startDay} daysInMonth={daysInMonth}
          sessions={sessions} toggleDate={toggleDate}
          removeSessionForDate={removeSessionForDate}
          getDaySlotSummary={getDaySlotSummary}
          maxSelectableDates={maxSelectableDates}
          quickFillActive={!!quickFillSettings}
          getTherapistAvailableSlotsForDay={getTherapistAvailableSlotsForDay}
          selectedTherapistName={selectedTherapist?.name}
        />

        <BookingFormPanel
          editBookingId={editBookingId}
          handleReset={resetForm}
          handleCancelEdit={resetForm}
          handleBookOrUpdate={handleBookOrUpdate}
          canBook={canBook}
          bookingLoading={bookingLoading}
          bookingError={bookingError}
          bookingSuccess={bookingSuccess}
          therapistId={therapistId} setTherapistId={setTherapistId} therapists={therapists}
          patientId={patientId} setPatientId={setPatientId} patients={patients}
          therapyId={therapyId} setTherapyId={setTherapyId} therapies={therapies}
          packageId={packageId} setPackageId={setPackageId} packages={packages}
          couponInput={couponInput} setCouponInput={setCouponInput}
          appliedCoupon={appliedCoupon} couponStatus={couponStatus} setCouponStatus={setCouponStatus}
          handleCouponApply={handleCouponApply} handleCouponClear={handleCouponClear}
          remark={remark} setRemark={setRemark}
          sessions={sessions} selectedPackage={selectedPackage} earliestSession={earliestSession}
          missedSessionsCount={missedSessionsCount}
          updateSlotId={updateSlotId} updateSessionTherapist={updateSessionTherapist}
          updateSessionTherapyType={updateSessionTherapyType} removeSession={removeSession}
          bookedSlotsPerRow={bookedSlotsPerRow} getAvailableSlotsForDate={getAvailableSlotsForDate}
          bookings={bookings}
          quickFillSettings={quickFillSettings}
          setQuickFillSettings={setQuickFillSettings}
        />
      </div>

      <BookingSummary
        bookings={bookings} setBookings={setBookings}
        setBookingsLoading={setBookingsLoading} setBookingsError={setBookingsError}
        getTherapistObject={getTherapistObject}
        editBookingId={editBookingId}
        handleEditBooking={handleEditBooking}
        handleCollectPayment={handleCollectPayment}
        paymentLoadingBookingId={paymentLoadingBookingId}
      />

      {(apiLoading || bookingsLoading) && (
        <div className="fixed inset-0 bg-black bg-opacity-15 z-50 flex items-center justify-center pointer-events-none select-none">
          <div className="bg-white rounded shadow p-6 text-lg text-blue-600 font-bold">Loading data…</div>
        </div>
      )}
      {(apiError || bookingsError) && (
        <div className="fixed bottom-2 right-2 bg-red-100 text-red-700 px-4 py-2 rounded">
          {apiError || bookingsError}
        </div>
      )}
    </motion.div>
  );
}