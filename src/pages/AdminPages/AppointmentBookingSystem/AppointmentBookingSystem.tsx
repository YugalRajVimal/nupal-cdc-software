// import { useEffect, useState, useCallback } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiInfo, FiCalendar, FiChevronLeft, FiChevronRight, FiClock, FiUser, FiTag,
//   FiChevronUp, FiChevronDown, FiList, FiPackage, FiEdit2, FiX, FiHash,
//   FiCheckCircle, FiRepeat
// } from "react-icons/fi";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import { useLocation } from "react-router";

// // --- CONSTANTS --- (same as before)
// const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
// const SESSION_TIME_OPTIONS = [
//   { id: '1000-1045', label: '10:00 to 10:45', limited: false },
//   { id: '1045-1130', label: '10:45 to 11:30', limited: false },
//   { id: '1130-1215', label: '11:30 to 12:15', limited: false },
//   { id: '1215-1300', label: '12:15 to 13:00', limited: false },
//   { id: '1300-1345', label: '13:00 to 13:45', limited: false },
//   { id: '1415-1500', label: '14:15 to 15:00', limited: false },
//   { id: '1500-1545', label: '15:00 to 15:45', limited: false },
//   { id: '1545-1630', label: '15:45 to 16:30', limited: false },
//   { id: '1630-1715', label: '16:30 to 17:15', limited: false },
//   { id: '1715-1800', label: '17:15 to 18:00', limited: false },
//   { id: '0830-0915', label: '08:30 to 09:15', limited: true },
//   { id: '0915-1000', label: '09:15 to 10:00', limited: true },
//   { id: '1800-1845', label: '18:00 to 18:45', limited: true },
//   { id: '1845-1930', label: '18:45 to 19:30', limited: true },
//   { id: '1930-2015', label: '19:30 to 20:15', limited: true }
// ];

// // --- TYPES --- (same as before)
// type Patient = { id: string; patientId: string; name: string; phoneNo?: string; userId?: { name?: string; }; mobile1?: string; email?: string; [key: string]: any; };
// type Therapy = { _id: string; name: string; };
// type Package = { _id: string; name: string; totalSessions?: number; costPerSession?: number; totalCost?: number; sessionCount?: number; };
// type Therapist = { _id: string; therapistId: string; name: string; holidays?: Array<{ date: string; reason?: string }>; userId?: { name?: string; }; mobile1?: string; [key: string]: any; };
// type BookingSession = { date: string; slotId: string; therapistId?: string; _id?: string; therapist?: { _id: string; name: string; therapistId: string; userId: { name: string; } } };
// type Booking = { _id: string; appointmentId?: string; patient: Patient; therapy: Therapy; package: Package | null; therapist: Therapist | string; sessions: BookingSession[]; discountInfo?: { coupon: { couponCode: string; createdAt: string; discount: number; discountEnabled: boolean; validityDays: number; __v?: number; _id: string; }; time?: string; }; };
// type Coupon = { _id: string; code: string; discount: number; validityDays: number; enabled?: boolean; };

// // --- UTILS --- (same as before)
// function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
// function getDateKey(year: number, month: number, day: number): string { return `${year}-${pad2(month)}-${pad2(day)}`; }
// function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
// function getStartDay(year: number, month: number) { return new Date(year, month, 1).getDay(); }
// const API_BASE_URL = import.meta.env.VITE_API_URL as string;
// function getDayIndex(dayShort: string): number { const idx = DAYS.findIndex(d => d === dayShort.toUpperCase()); return idx >= 0 ? idx : 0; }

// // --- MAIN COMPONENT ---
// export default function AppointmentBookingSystem() {
//   // ... state hooks unchanged ...
//   const location = useLocation();
//   const today = new Date();
//   const [loading, setLoading] = useState(true);
//   const [guideOpen, setGuideOpen] = useState(false);
//   const [year, setYear] = useState(today.getFullYear());
//   const [month, setMonth] = useState(today.getMonth());
//   const daysInMonth = getDaysInMonth(year, month);
//   const startDay = getStartDay(year, month);

//   const [patientId, setPatientId] = useState<string>("");
//   const [therapyId, setTherapyId] = useState<string>("");
//   const [packageId, setPackageId] = useState<string>("");
//   const [sessions, setSessions] = useState<BookingSession[]>([]);
//   const [therapistId, setTherapistId] = useState<string>("");

//   const [selectedCouponId, setSelectedCouponId] = useState<string>("");
//   const [coupons, setCoupons] = useState<Coupon[]>([]);
//   const [patients, setPatients] = useState<Patient[]>([]);
//   const [therapies, setTherapies] = useState<Therapy[]>([]);
//   const [packages, setPackages] = useState<Package[]>([]);
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [therapists, setTherapists] = useState<Therapist[]>([]);
//   const [dataLoading, setDataLoading] = useState<boolean>(true);

//   const [bookingLoading, setBookingLoading] = useState<boolean>(false);
//   const [bookingError, setBookingError] = useState<string | null>(null);
//   const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
//   const [editBookingId, setEditBookingId] = useState<string | null>(null);

//   const [repeatDay, setRepeatDay] = useState<string>("");
//   const [repeatStartDate, setRepeatStartDate] = useState<string>("");
//   const [repeatSlotId, setRepeatSlotId] = useState<string>("");
//   const [repeatError, setRepeatError] = useState<string | null>(null);
//   const [repeatConflictInfo, setRepeatConflictInfo] = useState<{ [date: string]: string }>({});

//   const [bookedSlotsPerRow, setBookedSlotsPerRow] = useState<{ [rowKey: string]: string[] }>({});
//   const [isBookingRequest, setIsBookingRequest] = useState<boolean>(false);
//   const [bookingRequestId, setBookingRequestId] = useState<string>("");
//   const [datesChanged,setDatesChanged] = useState<boolean>(false);

//   type MonthlySlotsSummary = {
//     [date: string]: {
//       bookedSlots: number;
//       totalAvailableSlots: number;
//       limitedBookedSlots: number;
//       totalLimitedAvailableSlots: number;
//       BookedSlots: { [therapistId: string]: string[] };
//     };
//   };
//   const [monthlySlotSummary, setMonthlySlotSummary] = useState<MonthlySlotsSummary>({});

//   // --- Effects and data fetching unchanged ---
//   useEffect(() => { /* as before */ 
//     console.log(month, year, therapistId,sessions);

//     const apiMonth = month + 1;
//     let url = `${API_BASE_URL}/api/admin/availability-slots/summary/monthly?month=${apiMonth}&year=${year}`;
//     if (therapistId) url += `&therapistId=${encodeURIComponent(therapistId)}`;
//     setMonthlySlotSummary({});
//     fetch(url)
//       .then(res => res.json())
//       .then(data => {
//         if (data?.success && data.data?.data) {
//           setMonthlySlotSummary(data.data.data);
//         } else {
//           setMonthlySlotSummary({});
//         }
//       })
//       .catch(() => setMonthlySlotSummary({}));
//   }, [month, year, therapistId,sessions]);

//   useEffect(() => { /* as before */ 
//     if (location.state && (location.state as any).bookingRequest) {
//       const req = (location.state as any).bookingRequest;
//       setPatientId(req.patient?._id || "");
//       setTherapyId(req.therapy?._id || "");
//       setPackageId(req.package?._id || "");
//       setIsBookingRequest(true);
//       setBookingRequestId(req._id || "");
//       if (Array.isArray(req.sessions)) {
//         setSessions(req.sessions.map((s: any) => ({
//           date: s.date || "",
//           slotId: s.slotId || s.time || "",
//           therapistId: req.therapist?._id || req.therapist || "",
//         })));
//         setTherapistId(req.therapist?._id || req.therapist || "");
//       }
//     }
//   }, [location.state]);

//   useEffect(()=>{
// console.log("sessions");
//   },[sessions]);

//   useEffect(()=>{
//     console.log("therapist");
//       },[therapistId]);

//       // Removed incorrect redundant useEffect


//   useEffect(() => { /* as before */ 
//     async function fetchAllMasterData() {
//       setDataLoading(true);
//       setBookingError(null);
//       try {
//         const res = await fetch(`${API_BASE_URL}/api/admin/bookings/home-details`);
//         const json = await res.json();
//         let processedPatients: Patient[] = [];
//         if (Array.isArray(json.patients)) {
//           processedPatients = json.patients.map((raw: any) => {
//             const id = typeof raw.id === "string" && raw.id ? raw.id : typeof raw._id === "string" ? raw._id : "";
//             let patientName = raw.name;
//             if ((!patientName || patientName.trim() === "") && raw.userId && typeof raw.userId === "object"
//                 && typeof raw.userId.name === "string" && raw.userId.name.trim() !== "") {
//               patientName = raw.userId.name;
//             }
//             let userId = raw.userId;
//             if (raw.userId && typeof raw.userId === "object") {
//               userId = { ...raw.userId, name: (raw.userId.name != null ? raw.userId.name : patientName) };
//             }
//             return { ...raw, id, name: patientName, userId };
//           });
//         }
//         setPatients(processedPatients);
//         setTherapies(json.therapyTypes || []);
//         setPackages(json.packages || []);
//         setTherapists(Array.isArray(json.therapists) ? json.therapists : []);
//         setCoupons(Array.isArray(json.coupons) ? json.coupons : []);
//       } catch {
//         setPatients([]); setTherapies([]); setPackages([]); setTherapists([]); setCoupons([]);
//         toast.error("Failed to load master data");
//       }
//       setDataLoading(false);
//     }
//     fetchAllMasterData();
//   }, []);

//   // Booking normalization/Fetch
//   function normalizeBookings(bookings: any[]): Booking[] {
//     return bookings.map((b) => {
//       let patient = b.patient;
//       if (patient && patient.userId && typeof patient.userId === "object" && typeof patient.userId.name !== "string") {
//         patient = { ...patient, userId: { ...patient.userId, name: patient.name, } };
//       } else if (patient && (!patient.userId || typeof patient.userId !== "object") && typeof patient.name === "string") {
//         patient = { ...patient, userId: { name: patient.name, } };
//       }
//       let mainTherapistId =
//         typeof b.therapist === "object" ? b.therapist?._id
//         : typeof b.therapist === "string" ? b.therapist : "";
//       let normalizedSessions = Array.isArray(b.sessions)
//         ? b.sessions.map((s: any) => {
//           let sessionTid =
//             s.therapistId
//             || (typeof s.therapist === "string" ? s.therapist : s.therapist?._id)
//             || mainTherapistId;
//           return { ...s, slotId: s.slotId ?? s.time ?? "", therapistId: sessionTid };
//         }) : [];
//       if (b.discountInfo && typeof b.discountInfo === "object") {
//         return {
//           ...b,
//           patient, sessions: normalizedSessions,
//           discount: b.discountInfo.discount ?? b.discount,
//           couponCode: b.discountInfo.couponCode ?? b.couponCode,
//           couponValidityDays: b.discountInfo.validityDays ?? b.couponValidityDays,
//           discountEnabled: b.discountInfo.discountEnabled,
//           appointmentId: b.appointmentId,
//         };
//       }
//       return { ...b, patient, sessions: normalizedSessions, appointmentId: b.appointmentId };
//     });
//   }
//   const fetchBookings = useCallback(async () => {
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/admin/bookings`);
//       const json = await res.json();
//       let bookingsList: Booking[] = Array.isArray(json.bookings) ? normalizeBookings(json.bookings) : [];
//       setBookings(bookingsList);
//     } catch {
//       setBookings([]);
//       toast.error("Failed to fetch bookings list.");
//     }
//   }, []);

//   // Master data load triggers bookings
//   useEffect(() => {
//     if (!dataLoading && !loading) fetchBookings();
//   }, [dataLoading, loading, fetchBookings]);
//   useEffect(() => {
//     const t = setTimeout(() => setLoading(false), 700);
//     return () => clearTimeout(t);
//   }, []);

//   // --- PACKAGE/SESSION HANDLING ---
//   const selectedPackage = packages.find((p) => p._id === packageId) || null;
//   const selectedPatient = patients.find((p) => p.id === patientId) || null;
//   const selectedTherapy = therapies.find((t) => t._id === therapyId) || null;
//   const selectedTherapist = therapists.find((t) => t._id === therapistId) || null;
//   const selectedCoupon = coupons.find(c => c._id === selectedCouponId) || null;

//   const getTotalSessionsForPackage = (pkg: Package | null) => {
//     if (!pkg) return undefined;
//     return (
//       pkg.totalSessions || pkg.sessionCount ||
//       (() => {
//         const m = pkg.name.match(/^\s*(\d+)[^\d]/);
//         return m ? Number(m[1]) : undefined;
//       })()
//     );
//   };
//   const maxSelectableDates = getTotalSessionsForPackage(selectedPackage);

//   useEffect(() => {
//     if (maxSelectableDates === undefined) return;
//     if (sessions.length > maxSelectableDates) {
//       setSessions((prev) => prev.slice(0, maxSelectableDates));
//     }
//   }, [packageId, maxSelectableDates]);

//   // --- MAIN: update already booked slots for table dropdowns on any therapist/date change or slot change ---
//   useEffect(() => {
//     // For each session row, always update bookedSlotsPerRow (for ALL table dropdowns),
//     // even if not editBookingId, so "Already booked" is always correct.
//     // Key: `${date}:${therapistId}`
//     const mapping: { [key: string]: string[] } = {};
//     sessions.forEach(s => {
//       const tId = s.therapistId || therapistId || "";
//       if (!tId || !s.date) return;
//       const apiSummary = getServerDaySlotSummary(s.date);
//       if (apiSummary && apiSummary.BookedSlots && apiSummary.BookedSlots[tId]) {
//         mapping[`${s.date}:${tId}`] = apiSummary.BookedSlots[tId];
//       } else {
//         mapping[`${s.date}:${tId}`] = [];
//       }
//     });
//     setBookedSlotsPerRow(mapping);
//   // IMPORTANT: update whenever sessions/dates/therapistId change
//   }, [sessions, therapistId, monthlySlotSummary]);

//   useEffect(() => {
//     if (editBookingId) {
//       const booking = bookings.find((b) => b._id === editBookingId);
//       if (booking) {
//         setPatientId(booking.patient?.id || booking.patient?._id || "");
//         setTherapyId(booking.therapy?._id || "");
//         setPackageId(booking.package?._id || "");
//         let resolvedTherapistId =
//           (typeof booking.therapist === "string" && booking.therapist) ||
//           (typeof booking.therapist === "object" && booking.therapist?._id) || "";
//         setTherapistId(resolvedTherapistId);
//         setSessions(
//           Array.isArray(booking.sessions)
//             ? booking.sessions.map((s) => {
//               let sessionTid =
//                 (typeof s.therapistId === "string" && s.therapistId) ||
//                 (typeof s.therapist === "string" && s.therapist) ||
//                 (s.therapist && typeof s.therapist === "object" && s.therapist?._id) ||
//                 resolvedTherapistId ||
//                 "";
//               return {
//                 date: s.date,
//                 slotId: s.slotId ?? "",
//                 therapistId: sessionTid,
//               };
//             }) : []
//         );
//         let couponObj: Coupon | undefined = undefined;
//         if (booking.discountInfo && booking.discountInfo.coupon) {
//           const couponCandidate = booking.discountInfo.coupon;
//           couponObj =
//             coupons.find(c => c._id === couponCandidate._id) ||
//             coupons.find(c => c.code === couponCandidate.couponCode) ||
//             coupons.find(c => c.code === (couponCandidate as any).code) ||
//             coupons.find(c => (c as any).couponCode === couponCandidate.couponCode) ||
//             coupons.find(c => (c as any).couponCode === (couponCandidate as any).code) ||
//             (booking.discountInfo as any).couponCode && coupons.find(c => c.code === (booking.discountInfo as any).couponCode);
//         } else if (booking.discountInfo && (booking.discountInfo as any).couponCode) {
//           couponObj =
//             coupons.find(c => c.code === (booking.discountInfo as any).couponCode) ||
//             coupons.find(c => c._id === (booking.discountInfo as any).couponCode);
//         }
//         setSelectedCouponId(couponObj ? couponObj._id : "");
//       }
//     }
//   }, [editBookingId, bookings, coupons.length]);

//   // --- Calendar & session utilities, including toggleDate, updateSlotId, updateSessionTherapist
//   const changeMonth = (dir: "prev" | "next") => { /* unchanged */ 
//     if (dir === "prev") {
//       if (month === 0) {
//         setMonth(11); setYear((y) => y - 1);
//       } else setMonth((m) => m - 1);
//     } else {
//       if (month === 11) {
//         setMonth(0); setYear((y) => y + 1);
//       } else setMonth((m) => m + 1);
//     }
//   };
//   function getServerDaySlotSummary(dateKey: string) {
//     const parts = dateKey.split("-");
//     if (parts.length !== 3) return undefined;
//     const apiKey = `${pad2(Number(parts[2]))}-${pad2(Number(parts[1]))}-${parts[0]}`;
//     return monthlySlotSummary[apiKey];
//   }
//   function getDaySlotSummary(dateStr: string) { /* unchanged */ 
//     const daySummary = getServerDaySlotSummary(dateStr);
//     if (!daySummary) return { total: undefined, booked: undefined, limitedTotal: undefined, limitedBooked: undefined };
//     return {
//       total: daySummary.totalAvailableSlots,
//       booked: daySummary.bookedSlots,
//       limitedTotal: daySummary.totalLimitedAvailableSlots,
//       limitedBooked: daySummary.limitedBookedSlots
//     }
//   }

//   const toggleDate = (day: number) => {
//     setDatesChanged(!datesChanged);
//     const dateKey = getDateKey(year, month + 1, day);
//     const exists = sessions.find((s) => s.date === dateKey);
//     if (exists) {
//       setSessions((prev) => prev.filter((s) => s.date !== dateKey));
//       return;
//     }
//     if (
//       typeof maxSelectableDates === "number" &&
//       sessions.length >= maxSelectableDates
//     ) return;
//     setSessions((prev) => [...prev, { date: dateKey, slotId: "", therapistId: therapistId || "" }]);
//     // setTherapists(therapists);
//     // Booked slots mapping will be updated automatically by useEffect above
//   };

//   // Update slot id for session row
//   const updateSlotId = (date: string, slotId: string) => {
//     setSessions((prev) =>
//       prev.map((s) => (s.date === date ? { ...s, slotId } : s))
//     );
//     // setTherapists(therapists);
//     // Booked slots mapping will be updated automatically by useEffect above
//   };

//   // Update therapist id for session row (edit mode or always)
//   const updateSessionTherapist = (date: string, therapistIdVal: string) => {
//     setSessions((prev) =>
//       prev.map((s) => (s.date === date ? { ...s, therapistId: therapistIdVal } : s))
//     );
//     // Booked slots mapping updated by useEffect above
//   };

//   function getFirstSessionEarliest(sessions: { date: string; slotId: string }[]) {
//     if (!sessions || sessions.length === 0) return null;
//     const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
//     return sorted[0];
//   }
//   const earliestSession = getFirstSessionEarliest(sessions);

//   // ... rest of helpers and handlers as before (Booking POST/PUT, edit/delete logic, etc) ...
//   const canBook = Boolean(selectedPatient) && Boolean(selectedTherapy) &&
//     Boolean(selectedPackage) && Boolean(selectedTherapist) &&
//     sessions.length > 0 && Boolean(earliestSession && earliestSession.slotId);

//   // --- UI Helper functions as before ---
//   function getPatientDisplayName(patient: Patient | undefined | null) {
//     if (!patient) return "";
//     const name = patient.name;
//     const pid = patient.patientId ? patient.patientId : "";
//     return pid ? `${name} (${pid})` : name;
//   }
//   function getPackageDisplay(pkg: Package | null) {
//     if (!pkg) return "—";
//     const sessions =
//       pkg.totalSessions ||
//       pkg.sessionCount ||
//       (() => {
//         const m = pkg.name.match(/^\s*(\d+)[^\d]/);
//         return m ? Number(m[1]) : undefined;
//       })();
//     const totalCost = pkg.totalCost;
//     const costPerSession =
//       pkg.costPerSession ||
//       (totalCost && sessions ? Math.round(totalCost / sessions) : undefined);
//     let parts = [];
//     if (pkg.name) parts.push(pkg.name);
//     if (sessions || totalCost) {
//       const subparts = [];
//       if (totalCost) subparts.push("Total Cost " + totalCost);
//       if (costPerSession) subparts.push(`[${costPerSession}]`);
//       if (subparts.length > 0) parts.push(subparts.join(" "));
//     }
//     return parts.join("; ");
//   }

//   const handleBookOrUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => { /* unchanged */ 
//     e.preventDefault();
//     setBookingSuccess(null);
//     setBookingError(null);
//     if (!canBook) {
//       const message = "Please fill all required fields and select a session date and time.";
//       setBookingError(message); toast.error(message); return;
//     }
//     setBookingLoading(true);
//     const payload: any = { patient: patientId, therapy: therapyId, package: packageId, therapist: therapistId, isBookingRequest, bookingRequestId, sessions: sessions.slice().sort((a, b) => a.date.localeCompare(b.date)).map(({ date, slotId, therapistId }) => ({ date, slotId, therapist: therapistId || therapistId, })), };
//     if (selectedCoupon) { payload.coupon = { id: selectedCoupon._id }; payload.couponCode = selectedCoupon.code; payload.discount = selectedCoupon.discount; payload.validityDays = selectedCoupon.validityDays; }
//     try {
//       let res, result;
//       if (!editBookingId) {
//         res = await fetch(`${API_BASE_URL}/api/admin/bookings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), });
//       } else {
//         res = await fetch(`${API_BASE_URL}/api/admin/bookings/${editBookingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), });
//       }
//       let rawText = await res.text();
//       try { result = JSON.parse(rawText); } catch { result = null; }
//       if (!res.ok || (result && result.success === false) || (result && !result.booking)) {
//         let message = result?.message || result?.error || "Booking failed.";
//         if (!message && typeof rawText === "string" && rawText.trim() && !rawText.startsWith("<")) { message = rawText; }
//         setBookingError(message); toast.error(message); setBookingLoading(false); return;
//       }
//       const successMsg = !editBookingId ? "Booking successfully created." : "Booking successfully updated.";
//       setBookingSuccess(successMsg); toast.success(successMsg);
//       await fetchBookings(); resetForm();
//     } catch (e: any) {
//       const msg = (typeof e === "object" && e !== null && ("message" in e) && e.message) ? e.message : editBookingId ? "Failed to update." : "Booking failed.";
//       setBookingError(msg); toast.error(msg);
//     }
//     setBookingLoading(false);
//   };

//   // --- HANDLER: Edit/Cancel/Delete as before ---
//   function handleEditBooking(bookingId: string) { /* as before */ 
//     setEditBookingId(bookingId); setBookingError(null); setBookingSuccess(null);
//     const booking = bookings.find(b => b._id === bookingId);
//     if (booking) {
//       let resolvedTherapistId =
//         (typeof booking.therapist === "string" && booking.therapist) ||
//         (typeof booking.therapist === "object" && booking.therapist?._id) || "";
//       setTherapistId(resolvedTherapistId);
//       setSessions(
//         Array.isArray(booking.sessions)
//           ? booking.sessions.map((s) => {
//             let sessionTid =
//               (typeof s.therapistId === "string" && s.therapistId) ||
//               (typeof s.therapist === "string" && s.therapist) ||
//               (s.therapist && typeof s.therapist === "object" && s.therapist?._id) ||
//               resolvedTherapistId ||
//               "";
//             return { date: s.date, slotId: s.slotId ?? "", therapistId: sessionTid, };
//           }) : []
//       );
//     }
//     let couponObj: Coupon | undefined = undefined;
//     if (booking && booking.discountInfo && booking.discountInfo.coupon) {
//       const couponCandidate = booking.discountInfo.coupon;
//       couponObj =
//         coupons.find(c => c._id === couponCandidate._id) ||
//         coupons.find(c => c.code === couponCandidate.couponCode) ||
//         coupons.find(c => c.code === (couponCandidate as any).code) ||
//         coupons.find(c => (c as any).couponCode === couponCandidate.couponCode) ||
//         coupons.find(c => (c as any).couponCode === (couponCandidate as any).code) ||
//         (booking.discountInfo as any).couponCode && coupons.find(c => c.code === (booking.discountInfo as any).couponCode);
//     } else if (booking && booking.discountInfo && (booking.discountInfo as any).couponCode) {
//       couponObj =
//         coupons.find(c => c.code === (booking.discountInfo as any).couponCode) ||
//         coupons.find(c => c._id === (booking.discountInfo as any).couponCode);
//     }
//     setSelectedCouponId(couponObj ? couponObj._id : "");
//     setRepeatDay(""); setRepeatStartDate(""); setRepeatSlotId("");
//     setRepeatError(null); setRepeatConflictInfo({});
//   }
//   function handleCancelEdit() { resetForm(); }
//   async function handleDeleteBooking(id: string) { /* as before */ 
//     if (!window.confirm("Delete this booking?")) return;
//     try {
//       const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, { method: "DELETE" });
//       if (res.ok) {
//         toast.success("Booking deleted successfully.");
//       } else {
//         const result = await res.json();
//         toast.error(result?.message || "Booking could not be deleted.");
//       }
//       await fetchBookings();
//     } catch {
//       toast.error("An error occurred. Booking could not be deleted.");
//     }
//     if (editBookingId === id) resetForm();
//   }

//   // --- SLOT AND REPEAT LOGIC ---
//   function getAvailableSlotsForDate(
//     date: string,
//     selectedSessions: { date: string; slotId: string; therapistId?: string }[],
//     currSelectedSlotId: string,
//     currRowTherapistId?: string,
//     currRowIsEdit?: boolean
//   ) {
//     // Unchanged as before
//     const slotInfo: { [slotId: string]: { disabled: boolean; reason: string } } = {};
//     const rowTherapistId = currRowTherapistId || therapistId;
//     const daySummary = getServerDaySlotSummary(date);

//     if (!rowTherapistId) {
//       SESSION_TIME_OPTIONS.forEach((opt) =>
//         slotInfo[opt.id] = { disabled: true, reason: "Pick therapist first" }
//       );
//       return slotInfo;
//     }
//     let therapistSlotsBooked: string[] = [];
//     const rowTherapistIdStr = String(rowTherapistId);
//     if (
//       daySummary &&
//       daySummary.BookedSlots &&
//       typeof daySummary.BookedSlots === 'object' &&
//       rowTherapistIdStr in daySummary.BookedSlots &&
//       Array.isArray(daySummary.BookedSlots[rowTherapistIdStr])
//     ) {
//       therapistSlotsBooked = daySummary.BookedSlots[rowTherapistIdStr];
//     }
//     let countNormal = 0, countLimited = 0;
//     selectedSessions
//       .filter(ss => ss.date === date && (ss.therapistId ?? therapistId) === rowTherapistId)
//       .forEach(ss => {
//         const slotOption = SESSION_TIME_OPTIONS.find(o => o.id === ss.slotId);
//         if (ss.slotId && slotOption) {
//           if (slotOption.limited) countLimited++;
//           else countNormal++;
//         }
//       });
//     let maxNormal = daySummary?.totalAvailableSlots ?? 10;
//     let maxLimited = daySummary?.totalLimitedAvailableSlots ?? 5;
//     let bookedNormal = daySummary?.bookedSlots ?? 0;
//     let bookedLimited = daySummary?.limitedBookedSlots ?? 0;

//     SESSION_TIME_OPTIONS.forEach((opt) => {
//       let apiDisable = false;
//       let reason = "";
//       if (therapistSlotsBooked.includes(opt.id) && currSelectedSlotId !== opt.id) {
//         apiDisable = true; reason = "Already booked";
//       } else if (!opt.limited) {
//         if (
//           currSelectedSlotId !== opt.id &&
//           typeof bookedNormal === "number" &&
//           typeof maxNormal === "number" &&
//           bookedNormal + countNormal >= maxNormal
//         ) {
//           apiDisable = true;
//           reason = `Max ${maxNormal} normal slots/day`;
//         }
//       } else {
//         if (
//           currSelectedSlotId !== opt.id &&
//           typeof bookedLimited === "number" &&
//           typeof maxLimited === "number" &&
//           bookedLimited + countLimited >= maxLimited
//         ) {
//           apiDisable = true;
//           reason = `Max ${maxLimited} limited slots/day`;
//         }
//       }
//       slotInfo[opt.id] = { disabled: apiDisable, reason };
//     });
//     console.log(slotInfo);
//     return slotInfo;
//   }
  
//   function resetForm() {
//     setPatientId(""); setTherapyId(""); setPackageId(""); setTherapistId("");
//     setSessions([]); setSelectedCouponId(""); setEditBookingId(null);
//     setBookingError(null); setBookingSuccess(null);
//     setRepeatDay(""); setRepeatStartDate(""); setRepeatSlotId("");
//     setRepeatError(null); setRepeatConflictInfo({});
//     setBookedSlotsPerRow({});
//   }

//   function getAlreadyBookedSlotIds(date: string, therapistIdForSession: string) {
//     const apiSummary = getServerDaySlotSummary(date);
//     if (apiSummary && apiSummary.BookedSlots && apiSummary.BookedSlots[therapistIdForSession]) {
//       return apiSummary.BookedSlots[therapistIdForSession];
//     }
//     return [];
//   }

//   function getNextNDatesWeekly(
//     startDate: Date,
//     sessionCount: number,
//     dayOfWeek: number,
//     therapist: Therapist | undefined
//   ): string[] {
//     let dates: string[] = [];
//     let date = new Date(startDate);
//     while (date.getDay() !== dayOfWeek) {
//       date.setDate(date.getDate() + 1);
//     }
//     while (dates.length < sessionCount) {
//       const dateKey = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
//       if (!therapist || !Array.isArray(therapist.holidays) || !therapist.holidays.some(h => h && h.date === dateKey)) {
//         dates.push(dateKey);
//       }
//       date.setDate(date.getDate() + 7);
//     }
//     return dates;
//   }
//   function handleRepeatApply() { /* unchanged */ 
//     setRepeatError(null); setRepeatConflictInfo({});
//     if (!repeatDay || !repeatStartDate || !repeatSlotId) {
//       setRepeatError("Please select start date, weekday, and time slot.");
//       return;
//     }
//     if (!selectedTherapist) {
//       setRepeatError("Please select a therapist.");
//       return;
//     }
//     if (!maxSelectableDates || !selectedPackage) {
//       setRepeatError("Please select a package.");
//       return;
//     }
//     const start = new Date(repeatStartDate);
//     const wantedDayNum = getDayIndex(repeatDay);
//     while (start.getDay() !== wantedDayNum) start.setDate(start.getDate() + 1);
//     const sessionsOnTargetDay = getNextNDatesWeekly(
//       start, maxSelectableDates, wantedDayNum, selectedTherapist
//     );
//     const slotConflicts: string[] = [];
//     const conflictReasons: { [date: string]: string } = {};
//     const newSessions = sessionsOnTargetDay.map((dateStr) => {
//       const slotInfo = getAvailableSlotsForDate(dateStr, [], repeatSlotId, therapistId);
//       if (slotInfo[repeatSlotId]?.disabled) {
//         slotConflicts.push(dateStr);
//         conflictReasons[dateStr] =
//           `Select different time for ${dateStr} — ${slotInfo[repeatSlotId]?.reason || "slot not available"}`;
//       }
//       return { date: dateStr, slotId: repeatSlotId, therapistId: therapistId || "" };
//     });
//     if (slotConflicts.length > 0) {
//       setRepeatError(`Some dates have conflicts. See below for details.`);
//       setRepeatConflictInfo(conflictReasons);
//       setSessions(newSessions.filter((s) => !slotConflicts.includes(s.date)));
//     } else {
//       setRepeatError(null);
//       setRepeatConflictInfo({});
//       setSessions(newSessions);
//     }

//   }
//   function handleRepeatClear() { setRepeatDay(""); setRepeatStartDate(""); setRepeatSlotId(""); setRepeatError(null); setRepeatConflictInfo({}); setSessions([]); }
//   function getTherapistObject(booking: Booking): Therapist | undefined {
//     if (booking.therapist && typeof booking.therapist === "object" && "_id" in booking.therapist) {
//       return booking.therapist as Therapist;
//     }
//     if (typeof booking.therapist === "string") {
//       return therapists.find(t => t._id === booking.therapist);
//     }
//     return undefined;
//   }
//   function handleReset() {
//     setPatientId("");
//     setTherapyId("");
//     setPackageId("");
//     setTherapistId("");
//     setSessions([]);
//     setRepeatDay("");
//     setRepeatStartDate("");
//     setRepeatSlotId("");
//     setRepeatError(null);
//     setRepeatConflictInfo({});
//     setSelectedCouponId("");
//     setBookingError(null);
//     setBookingSuccess(null);
//     setEditBookingId(null);
//     setIsBookingRequest(false);
//     setBookedSlotsPerRow({});
//   }
//   // --- RENDER --- (same as original)
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="min-h-screen  p-8"
//     >
//       <HeaderGuide
//         guideOpen={guideOpen}
//         setGuideOpen={setGuideOpen}
//         editBookingId={editBookingId}
//         coupons={coupons}
//       />
//       <MainLayout
//         editBookingId={editBookingId}
//         year={year} month={month}
//         changeMonth={changeMonth}
//         startDay={startDay} daysInMonth={daysInMonth}
//         sessions={sessions}
//         toggleDate={toggleDate}
//         getDaySlotSummary={getDaySlotSummary}
//         maxSelectableDates={maxSelectableDates}
//         patients={patients}
//         patientId={patientId}
//         setPatientId={setPatientId}
//         therapies={therapies}
//         therapyId={therapyId}
//         setTherapyId={setTherapyId}
//         packages={packages}
//         packageId={packageId}
//         setPackageId={setPackageId}
//         getPackageDisplay={getPackageDisplay}
//         therapists={therapists}
//         therapistId={therapistId}
//         setTherapistId={setTherapistId}
//         selectedCouponId={selectedCouponId}
//         setSelectedCouponId={setSelectedCouponId}
//         coupons={coupons}
//         selectedCoupon={selectedCoupon}
//         repeatDay={repeatDay}
//         setRepeatDay={setRepeatDay}
//         repeatStartDate={repeatStartDate}
//         setRepeatStartDate={setRepeatStartDate}
//         repeatSlotId={repeatSlotId}
//         setRepeatSlotId={setRepeatSlotId}
//         today={today}
//         handleRepeatApply={handleRepeatApply}
//         handleRepeatClear={handleRepeatClear}
//         maxSelectableDatesForRepeat={maxSelectableDates}
//         packageIdForRepeat={packageId}
//         repeatError={repeatError}
//         repeatConflictInfo={repeatConflictInfo}
//         therapistIdForRepeat={therapistId}
//         selectedTherapist={selectedTherapist}
//         editBookingIdForSession={editBookingId}
//         updateSlotId={updateSlotId}
//         updateSessionTherapist={updateSessionTherapist}
//         SESSION_TIME_OPTIONS={SESSION_TIME_OPTIONS}
//         getAvailableSlotsForDate={getAvailableSlotsForDate}
//         bookedSlotsPerRow={bookedSlotsPerRow}
//         getPatientDisplayName={getPatientDisplayName}
//         canBook={canBook}
//         bookingLoading={bookingLoading}
//         handleBookOrUpdate={handleBookOrUpdate}
//         handleCancelEdit={handleCancelEdit}
//         bookingError={bookingError}
//         bookingSuccess={bookingSuccess}
//         getFirstSessionEarliest={getFirstSessionEarliest}
//         earliestSession={earliestSession}
//         selectedPackage={selectedPackage}
//         getTotalSessionsForPackage={getTotalSessionsForPackage}
//         handleReset={handleReset}
//       />
//       <BookingSummary
//         bookings={bookings}
//         getTherapistObject={getTherapistObject}
//         editBookingId={editBookingId}
//         getPatientDisplayName={getPatientDisplayName}
//         getPackageDisplay={getPackageDisplay}
//         SESSION_TIME_OPTIONS={SESSION_TIME_OPTIONS}
//         handleEditBooking={handleEditBooking}
//         handleDeleteBooking={handleDeleteBooking}
//       />
//     </motion.div>
//   );
// }

// // --- SUBCOMPONENTS ---
// function HeaderGuide({ guideOpen, setGuideOpen, editBookingId, coupons }: any) {
//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 10 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ delay: 0.1 }}
//       className={`bg-blue-50 border border-blue-200 rounded-lg p-0 mb-8 overflow-hidden cursor-pointer`}
//       onClick={() => setGuideOpen((v: boolean) => !v)}
//       tabIndex={0}
//       role="button"
//       aria-expanded={guideOpen}
//       style={{ outline: "none" }}
//     >
//       <div className="px-6 py-6">
//         <div className="flex items-center justify-between select-none">
//           <div className="flex items-center gap-2 text-blue-700 font-semibold">
//             <FiInfo /> Appointment Booking System
//           </div>
//           {guideOpen ? (
//             <FiChevronUp className="text-blue-600" />
//           ) : (
//             <FiChevronDown className="text-blue-600" />
//           )}
//         </div>
//       </div>
//       <AnimatePresence initial={false}>
//         {guideOpen && (
//           <motion.div
//             key="content"
//             initial={{ height: 0, opacity: 0 }}
//             animate={{ height: "auto", opacity: 1 }}
//             exit={{ height: 0, opacity: 0 }}
//             transition={{ duration: 0.18, ease: "easeInOut" }}
//             className="overflow-hidden px-6 pb-6 pt-0"
//             onClick={e => e.stopPropagation()}
//           >
//             <p className="text-sm text-blue-700 mb-4">
//               Manage therapy schedules, book new sessions, and view existing bookings.
//             </p>
//             <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
//               <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
//                 <FiList /> Steps to Follow
//               </div>
//               <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
//                 <li>Use the calendar to view and check bookings. Booked/Total slots for each day are shown.</li>
//                 <li>Select a therapist, patient, therapy, and package in 'Quick Book'.</li>
//                 <li>
//                   You can now set all sessions to the same weekday and time using "Repeat Weekly" below, or pick individual dates and times as before.
//                 </li>
//                 <li>
//                   Select <span className="font-medium text-blue-800">at least one</span> session date; enter a time for the first session. Selecting all dates is <span className="font-medium text-blue-800">not mandatory</span>.
//                 </li>
//                 <li>
//                   Click '{editBookingId ? "Update Booking" : "Book Now"}' to {editBookingId ? "update" : "confirm"} a booking.
//                 </li>
//                 <li>
//                   <span className="font-medium">
//                     Each therapist may have up to <span className="text-blue-900">10 normal slots</span> and <span className="text-blue-900">5 limited case slots</span> per day. All 15 slots are available in the dropdown when booking; limited case slots have a "(Limited case)" label.
//                   </span>
//                 </li>
//                 <li>
//                   {(coupons && coupons.length > 0) ?
//                     <>Optionally select a valid discount coupon from the Coupon dropdown to apply available discounts.</>
//                     : ""}
//                 </li>
//               </ol>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </motion.div>
//   );
// }

// function MainLayout(props: any) {
//   // Props destructure here for clarity, or can keep using props.whatever
//   // [for brevity, use props directly in this template]
//   return (
//     <div className={`flex gap-6 ${props.editBookingId ? 'flex-col' : 'md:flex-row flex-col-reverse'}`}>
//       <CalendarPanel
//         {...props}
//       />
//       <QuickBookPanel
//         {...props}
//       />
//     </div>
//   );
// }

// function CalendarPanel({
//   year, month, changeMonth, startDay, daysInMonth,
//   sessions, toggleDate, getDaySlotSummary, maxSelectableDates
// }: any) {
//   return (
//     <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
//       <div className="flex items-center justify-between p-4 border-b">
//         <div className="flex items-center gap-2 font-semibold">
//           <FiCalendar />
//           {new Date(year, month).toLocaleString("default", {
//             month: "long",
//           })} {year}
//         </div>
//         <div className="flex gap-2">
//           <button onClick={() => changeMonth("prev")} className="p-2 border rounded"><FiChevronLeft /></button>
//           <button onClick={() => changeMonth("next")} className="p-2 border rounded"><FiChevronRight /></button>
//         </div>
//       </div>
//       <div className="grid grid-cols-7 text-xs text-slate-500 border-b">
//         {DAYS.map((d: string) => (
//           <div key={d} className="p-2 text-center font-medium">{d}</div>
//         ))}
//       </div>
//       <div className="grid grid-cols-7">
//         {Array.from({ length: startDay }).map((_: any, i: number) => (
//           <div key={`empty-${i}`} className="h-24 border" />
//         ))}
//         {Array.from({ length: daysInMonth }).map((_: any, i: number) => {
//           const day = i + 1;
//           const dateKey = getDateKey(year, month + 1, day);
//           const selected = sessions.find((s: any) => s.date === dateKey);
//           const isAtMax =
//             typeof maxSelectableDates === "number" &&
//             sessions.length >= maxSelectableDates &&
//             !selected;
//           const { total, booked, limitedTotal, limitedBooked } = getDaySlotSummary(dateKey);
//           return (
//             <div
//               key={day}
//               onClick={() => { if (!isAtMax) toggleDate(day); }}
//               className={`h-24 border cursor-pointer flex flex-col justify-between p-2 transition ${selected ? "bg-blue-50 border-blue-400"
//                 : isAtMax ? "bg-gray-100 cursor-not-allowed opacity-60" : "hover:bg-slate-50"}`}
//               style={isAtMax ? { pointerEvents: "none" } : {}}
//             >
//               <div className="flex flex-col justify-start">
//                 <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${selected ? "bg-blue-600 text-white" : ""}`}>
//                   {day}
//                 </div>
//                 {selected && (
//                   <div className="mt-1 text-xs text-blue-700 font-medium">Selected</div>
//                 )}
//               </div>
//               {typeof total !== "number" ? (
//                 <span className="text-gray-300">Loading…</span>
//               ) : total > 0 || (limitedTotal && limitedTotal > 0) ? (
//                 <>
//                   <span className="flex items-center w-fit gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-700 border border-green-300 shadow">
//                     <FiCheckCircle className="inline mr-0.5 text-green-500" size={13} />
//                     <span data-testid='booked-total' className="tabular-nums font-semibold">
//                       {booked}/{total}
//                       {typeof limitedTotal === "number" && typeof limitedBooked === "number" && limitedBooked > 0 && (
//                         <>
//                           <br />
//                           <span className="tabular-nums font-semibold text-blue-800">
//                             {limitedBooked}/{limitedTotal} ltd.
//                           </span>
//                         </>
//                       )}
//                     </span>
//                   </span>
//                 </>
//               ) : (
//                 <span className="text-gray-400">No slots</span>
//               )}
//             </div>
//           );
//         })}
//       </div>
//       {typeof maxSelectableDates === "number" && (
//         <div className="px-4 pt-2 pb-1 text-xs text-slate-600">
//           {`You can select up to ${maxSelectableDates} date${maxSelectableDates > 1 ? "s" : ""} for this package. `}
//           <span className="text-blue-700">Selecting all is not mandatory; at least one is required.</span>
//           <br />
//           {sessions.length >= maxSelectableDates && (
//             <span className="text-blue-700">Limit reached.</span>
//           )}
//           <br />
//           <span className="text-blue-700">Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.</span>
//         </div>
//       )}
//     </div>
//   );
// }

// function QuickBookPanel(props: any) {
//   // as before
//   const {
//     editBookingId, bookings, therapists, therapistId, setTherapistId,
//     getPatientDisplayName, patients, patientId, setPatientId,
//     therapies, therapyId, setTherapyId, packages, packageId, setPackageId,
//     getPackageDisplay, coupons, selectedCouponId, setSelectedCouponId,
//     selectedCoupon, repeatDay, setRepeatDay, repeatStartDate, setRepeatStartDate,
//     repeatSlotId, setRepeatSlotId, today, handleRepeatApply, handleRepeatClear,
//     maxSelectableDatesForRepeat, packageIdForRepeat, repeatError, repeatConflictInfo,
//     therapistIdForRepeat, selectedTherapist, sessions, updateSlotId, updateSessionTherapist,
//     editBookingIdForSession, SESSION_TIME_OPTIONS, getAvailableSlotsForDate, bookedSlotsPerRow,
//     canBook, bookingLoading, handleBookOrUpdate, handleCancelEdit, bookingError,
//     bookingSuccess, selectedPackage, getTotalSessionsForPackage, earliestSession, handleReset
//   } = props;

//   return (
//     <div className="flex-1 bg-white border rounded-lg p-6">
//       {/* Title */}
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="font-semibold">
//           {editBookingId ? "Edit Booking" : "Quick Book"}
//           {editBookingId && (
//             <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">Editing</span>
//           )}
//         </h3>
//         <button
//           type="button"
//           className="ml-4 px-3 py-1 rounded text-xs bg-red-100 text-red-700 font-medium hover:bg-red-200 transition"
//           onClick={() => {
//             if (typeof props.handleReset === 'function') {
//               handleReset();
//             }
//           }}
//         >
//           Reset
//         </button>
//       </div>
//       {/* Therapist Dropdown */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Therapist</label>
//       <select
//         value={therapistId}
//         onChange={e => setTherapistId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-3"
//         disabled={!!editBookingId}
//       >
//         <option value="">Select Therapist</option>
//         {therapists.map((t: Therapist) => (
//           <option key={t._id} value={t._id}>{t.name}{t.therapistId ? ` (${t.therapistId})` : ""}{Array.isArray(t.holidays) && t.holidays.length > 0 ? " [Has holidays]" : ""}</option>
//         ))}
//       </select>
//       {/* Booking ID (when editing) */}
//       {editBookingId && (() => {
//         const currentBooking = bookings?.find((b: Booking) => b._id === editBookingId);
//         if (currentBooking && currentBooking.appointmentId) {
//           return (
//             <div className="mb-3">
//               <label className="block text-sm mb-1 flex items-center gap-1 text-gray-700 font-semibold"><FiHash /> Appointment ID</label>
//               <input
//                 type="text"
//                 value={currentBooking.appointmentId}
//                 className="w-full border rounded px-3 py-2 bg-slate-100 font-mono text-gray-500"
//                 readOnly
//                 disabled
//               />
//             </div>
//           );
//         }
//         return null;
//       })()}
//       {/* Patient Dropdown */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Patient Name</label>
//       <select
//         value={patientId}
//         onChange={e => setPatientId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-3"
//         disabled={!!editBookingId}
//       >
//         <option value="">Select Patient</option>
//         {patients.map((patient: Patient) => (
//           <option key={patient.id} value={patient.id}>{getPatientDisplayName(patient)}</option>
//         ))}
//       </select>
//       {/* Therapy Dropdown */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiTag /> Therapy Type</label>
//       <select
//         value={therapyId}
//         onChange={e => setTherapyId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-3"
//       >
//         <option value="">Select Therapy</option>
//         {therapies.map((therapy: Therapy) => (
//           <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
//         ))}
//       </select>
//       {/* Package Dropdown */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiPackage /> Package</label>
//       <select
//         value={packageId}
//         onChange={e => setPackageId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-5"
//       >
//         <option value="">Select Package</option>
//         {packages.map((pkg: Package) => (
//           <option key={pkg._id} value={pkg._id}>{getPackageDisplay(pkg)}</option>
//         ))}
//       </select>
//       {/* Coupon Dropdown */}
//       <label className="block text-sm mb-1 font-semibold text-blue-700">Discount Coupon</label>
//       <select
//         value={selectedCouponId}
//         onChange={e => setSelectedCouponId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-5"
//       >
//         <option value="">No Coupon / Standard Price</option>
//         {coupons && coupons.length > 0 && coupons.map((c: Coupon) => (
//           <option key={c._id} value={c._id} disabled={c.enabled === false}>
//             {c.code} - {c.discount}% off
//             {c.validityDays ? ` (${c.validityDays} days)` : ""}
//             {c.enabled === false ? " [Disabled]" : ""}
//           </option>
//         ))}
//       </select>
//       {selectedCoupon && (
//         <div className="text-xs text-blue-700 mb-4">
//           🔖 Using coupon <span className="font-mono">{selectedCoupon.code}</span> ({selectedCoupon.discount}% off, valid {selectedCoupon.validityDays} days)
//         </div>
//       )}
//       {/* Repeat Weekly Controls */}
//       {!editBookingId && (
//         <RepeatWeeklyPanel
//           repeatDay={repeatDay}
//           setRepeatDay={setRepeatDay}
//           repeatStartDate={repeatStartDate}
//           setRepeatStartDate={setRepeatStartDate}
//           repeatSlotId={repeatSlotId}
//           setRepeatSlotId={setRepeatSlotId}
//           today={today}
//           handleRepeatApply={handleRepeatApply}
//           handleRepeatClear={handleRepeatClear}
//           maxSelectableDates={maxSelectableDatesForRepeat}
//           packageId={packageIdForRepeat}
//           repeatError={repeatError}
//           repeatConflictInfo={repeatConflictInfo}
//           therapistId={therapistIdForRepeat}
//           selectedTherapist={selectedTherapist}
//         />
//       )}
//       {/* Session Dates & Times */}
//       {sessions.length > 0 && (
//         <SessionDatesTimesTable
//           sessions={sessions}
//           updateSlotId={updateSlotId}
//           updateSessionTherapist={updateSessionTherapist}
//           editBookingId={editBookingIdForSession}
//           therapists={therapists}
//           therapistId={therapistId}
//           SESSION_TIME_OPTIONS={SESSION_TIME_OPTIONS}
//           getAvailableSlotsForDate={getAvailableSlotsForDate}
//           bookedSlotsPerRow={bookedSlotsPerRow}
//           selectedTherapist={selectedTherapist}
//           repeatConflictInfo={repeatConflictInfo}
//         />
//       )}
//       {/* Pricing Summary */}
//       {selectedPackage && (
//         <PricingSummary
//           selectedPackage={selectedPackage}
//           coupons={coupons}
//           selectedCouponId={selectedCouponId}
//           getTotalSessionsForPackage={getTotalSessionsForPackage}
//         />
//       )}
//       {/* Status/Error/Action Buttons */}
//       {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
//       {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}
//       <div className="flex gap-2">
//         <button
//           disabled={!canBook || bookingLoading}
//           className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
//           onClick={handleBookOrUpdate}
//         >
//           {bookingLoading
//             ? editBookingId
//               ? "Updating..."
//               : "Booking..."
//             : editBookingId
//               ? "Update Booking"
//               : "Book Now"}
//         </button>
//         {editBookingId && (
//           <button
//             className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
//             type="button"
//             onClick={handleCancelEdit}
//           >
//             <FiX className="inline mr-1" />Cancel Edit
//           </button>
//         )}
//       </div>
//       {typeof getTotalSessionsForPackage(selectedPackage) === "number" && (
//         <div className="text-xs text-blue-700 mt-3">
//           {`You can select up to ${getTotalSessionsForPackage(selectedPackage)} date${getTotalSessionsForPackage(selectedPackage) > 1 ? "s" : ""} for this package. Selecting all is not mandatory.`}
//           <br />
//           Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.
//         </div>
//       )}
//       {sessions.length === 0 && (
//         <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
//       )}
//       {sessions.length > 0 && (!earliestSession || !earliestSession.slotId) && (
//         <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
//       )}
//     </div>
//   );
// }

// function RepeatWeeklyPanel({ repeatDay, setRepeatDay, repeatStartDate, setRepeatStartDate, repeatSlotId, setRepeatSlotId, today, handleRepeatApply, handleRepeatClear, maxSelectableDates, packageId, repeatError, repeatConflictInfo, therapistId, selectedTherapist }: any) {
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

// function SessionDatesTimesTable({
//   sessions, updateSlotId, updateSessionTherapist, editBookingId,
//   therapists, therapistId, SESSION_TIME_OPTIONS,
//   getAvailableSlotsForDate, bookedSlotsPerRow,
//   selectedTherapist, repeatConflictInfo
// }: any) {

//   // useEffect (not top-level!) for always updating booked slots for ALL rows in this table
//   // -- but already done at top-level for mapping, so don't repeat here

//   return (
//     <div className="space-y-3 mb-4">
//       <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0"><FiClock />Session Dates &#38; Times</div>
//       <div className="overflow-x-auto">
//         <table className="min-w-[440px] w-fit border-collapse text-xs">
//           <thead>
//             <tr>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left"><FiClock className="inline mr-1" />Time Slot</th>
//               {/* Always show Therapist dropdown: */}
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left"><FiUser className="inline mr-1" />Therapist</th>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100"></th>
//             </tr>
//           </thead>
//           <tbody>
//             {sessions
//               .slice()
//               .sort((a: any, b: any) => a.date.localeCompare(b.date))
//               .map((s: any, idx: number, arr: any[]) => {
//                 // Fetch slot info EVERY time slotId OR row therapistId (or array) changes:
//                 // This will refetch because it's done inside the map, and the key for slot info uses s.slotId and s.therapistId
//                 const rowTherapistId = (s as any).therapistId || selectedTherapist?.therapistId || therapistId;
//                 console.log(rowTherapistId);
//                 // The slotInfo below will always be recalculated for this row on any change to slot, sessions, or therapistId
//                 const slotInfo = getAvailableSlotsForDate(
//                   s.date,
//                   arr,
//                   s.slotId,
//                   rowTherapistId,
//                   !!editBookingId
//                 );
//                 const bookedSlotsForRow = bookedSlotsPerRow[`${s.date}:${rowTherapistId}`] || [];
//                 return (
//                   <tr key={s.date + ':' + rowTherapistId} className="text-sm">
//                     <td className="px-2 py-1 border border-slate-200 font-mono">{s.date}</td>
//                     <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                       <select
//                         value={s.slotId}
//                         onChange={e => updateSlotId(s.date, e.target.value)}
//                         className={`border rounded px-2 py-1 ${idx === 0 && !s.slotId ? "border-red-400" : ""}`}
//                         required={idx === 0}
//                         aria-required={idx === 0}
//                         style={{ minWidth: 180 }}
//                       >
//                         <option value="">Select Time Slot</option>
//                         {SESSION_TIME_OPTIONS.map((slot: any) => {
//                           const i = slotInfo[slot.id];
//                           let labelContent = slot.label;
//                           if (slot.limited) labelContent += " (Limited case)";
//                           if (i.disabled && i.reason === "Already booked")
//                             labelContent += " - Already Booked";
//                           else if (i.disabled && i.reason)
//                             labelContent += `  - ${i.reason}`;
//                           return (
//                             <option
//                               key={slot.id}
//                               value={slot.id}
//                               disabled={i.disabled}
//                             >
//                               {labelContent}
//                             </option>
//                           );
//                         })}
//                       </select>
//                       {bookedSlotsForRow && bookedSlotsForRow.length > 0 && (
//                         <span className="block mt-1 text-xs text-amber-700">
//                           Already booked: {bookedSlotsForRow
//                             .map(
//                               (id: string) =>
//                                 SESSION_TIME_OPTIONS.find((opt: any) => opt.id === id)?.label || id
//                             ).join(", ")}
//                         </span>
//                       )}
//                       {idx === 0 && !s.slotId && (
//                         <span className="text-xs text-red-500 ml-2">Time required</span>
//                       )}
//                     </td>
//                     {/* Always show Therapist select, not just editBookingId */}
//                     <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                       <select
//                         value={(s as any).therapistId || therapistId}
//                         onChange={e => updateSessionTherapist(s.date, e.target.value)}
//                         className="border rounded px-2 py-1 min-w-[120px]"
//                       >
//                         <option value="">Select Therapist</option>
//                         {therapists.map((t: Therapist) => (
//                           <option value={t._id} key={t._id}>
//                             {t.userId?.name ?? t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
//                           </option>
//                         ))}
//                       </select>
//                     </td>
//                     <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                       {repeatConflictInfo[s.date] && (
//                         <span className="inline-block text-xs text-red-600">
//                           {repeatConflictInfo[s.date]}
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }

// // --- rest of file unchanged from original ---
// function PricingSummary({ selectedPackage, coupons, selectedCouponId, getTotalSessionsForPackage }: any) {
//   // ... unchanged ...
//   let discountValue = 0;
//   let coupon = null;
//   if (selectedCouponId) {
//     coupon = coupons.find((c: Coupon) => c._id === selectedCouponId);
//     if (coupon && coupon.discount) discountValue = Number(coupon.discount);
//   }
//   let pkgTotal = selectedPackage.totalCost ??
//     (selectedPackage.costPerSession && getTotalSessionsForPackage(selectedPackage)
//       ? Number(selectedPackage.costPerSession) * Number(getTotalSessionsForPackage(selectedPackage))
//       : 0);
//   return (
//     <div className="w-full flex flex-col items-stretch mt-3 mb-3">
//       <div className="flex flex-col gap-0.5 w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
//         <div className="flex justify-between items-center py-0.5">
//           <span className="text-sm text-slate-700 font-medium">Package Price</span>
//           <span className="font-mono text-base text-slate-900">₹{selectedPackage.totalCost ??
//             (selectedPackage.costPerSession && getTotalSessionsForPackage(selectedPackage)
//               ? Number(selectedPackage.costPerSession) * Number(getTotalSessionsForPackage(selectedPackage))
//               : selectedPackage.costPerSession ?? "—")}</span>
//         </div>
//         {discountValue > 0 && pkgTotal > 0 ? (
//           <>
//             <div className="flex justify-between items-center py-0.5">
//               <span className="text-sm text-emerald-700 font-medium">Discount{coupon ? ` (${coupon.code})` : ""}</span>
//               <span className="text-base text-emerald-900 font-mono">-{discountValue}% <span className="opacity-60 text-xs ml-1">(-₹{Math.round((pkgTotal * discountValue) / 100)})</span></span>
//             </div>
//             <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
//               <span className="text-base font-semibold text-blue-900"><FiTag className="inline mr-1 text-blue-400" />Total After Discount</span>
//               <span className="font-mono text-lg font-bold text-blue-900">₹{Math.max(pkgTotal - Math.round((pkgTotal * discountValue) / 100), 0)}</span>
//             </div>
//           </>
//         ) : discountValue === 0 && selectedCouponId && coupon ? (
//           <div className="flex justify-between items-center py-0.5">
//             <span className="text-sm text-orange-700 font-medium">Discount</span>
//             <span className="text-xs text-orange-700">Coupon "{coupon.code}" has no discount</span>
//           </div>
//         ) : (
//           <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
//             <span className="text-base font-semibold text-blue-900"><FiTag className="inline mr-1 text-blue-400" />Total</span>
//             <span className="font-mono text-lg font-bold text-blue-900">₹{pkgTotal}</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ... rest of BookingSummary unchanged ...
// function BookingSummary({ bookings, getTherapistObject, editBookingId, getPatientDisplayName, getPackageDisplay, SESSION_TIME_OPTIONS, handleEditBooking, handleDeleteBooking }: any) {
//   return (
//     <div className="mt-6">
//       <div className="bg-white border rounded-lg p-4 text-sm">
//         <p className="font-medium mb-2">Booking Summary</p>
//         {bookings && bookings.length === 0 ? (
//           <div>
//             <p className="text-slate-500 mb-3">No bookings found.</p>
//           </div>
//         ) : (
//           <div className="flex flex-col gap-4">
//             {bookings.map((booking: Booking) => {
//               const therapistObj = getTherapistObject(booking);
//               return (
//                 <div
//                   className={`border p-3 rounded bg-sky-50 relative ${
//                     editBookingId === booking._id
//                       ? "ring ring-blue-400 ring-offset-2"
//                       : ""
//                   }`}
//                   key={booking._id}
//                 >
//                   {/* Appointment ID display row */}
//                   {booking.appointmentId && (
//                     <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gray-700">
//                       <FiHash className="text-blue-500" /> <span>Appointment ID: {booking.appointmentId}</span>
//                     </div>
//                   )}
//                   {/* Therapist info */}
//                   {therapistObj && (
//                     <div className="mb-2 flex items-center gap-2">
//                       <FiUser className="text-slate-500" />
//                       <span className="text-slate-700">
//                         Therapist: {therapistObj.userId?.name ?? therapistObj.name}
//                         {therapistObj.therapistId ? ` (${therapistObj.therapistId})` : ""}
//                       </span>
//                     </div>
//                   )}
//                   <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
//                     <FiUser className="text-blue-600" />
//                     {getPatientDisplayName(booking.patient)}
//                   </div>
//                   <div className="mb-2 flex items-center gap-2">
//                     <FiTag className="text-slate-500" />
//                     <span className="text-slate-700">{booking.therapy?.name}</span>
//                   </div>
//                   <div className="mb-2 flex items-center gap-2">
//                     <FiPackage className="text-purple-500" />
//                     <span className="text-purple-700">
//                       {getPackageDisplay(booking.package)}
//                     </span>
//                   </div>
//                   {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
//                     <details className="mb-2 text-xs text-slate-700">
//                       <summary className="font-medium cursor-pointer select-none flex items-center">
//                         <span>Sessions ({booking.sessions.length})</span>
//                         <span className="ml-1">
//                           <FiChevronDown className="inline ml-1 text-slate-500" />
//                         </span>
//                       </summary>
//                       <div className="overflow-x-auto mt-2">
//                         <table className="min-w-[440px] w-fit border-collapse text-xs">
//                           <thead>
//                             <tr>
//                               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">#</th>
//                               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
//                               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Time Slot</th>
//                               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Therapist</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {booking.sessions.map((s: BookingSession, idx: number) => {
//                               const slot = SESSION_TIME_OPTIONS.find((opt: any) => opt.id === s.slotId);
//                               const tObj = s.therapist;
//                               return (
//                                 <tr key={s._id || s.date}>
//                                   <td className="px-2 py-1 border border-slate-200 text-slate-400">{idx + 1}</td>
//                                   <td className="px-2 py-1 border border-slate-200">{s.date}</td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                                     {slot
//                                       ? (<>
//                                           {slot.label}
//                                           {slot.limited && <span className="text-amber-700 ml-1">(Limited case)</span>}
//                                         </>)
//                                       : s.slotId}
//                                   </td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                                     {tObj
//                                       ? <>
//                                           {tObj && tObj.userId.name}
//                                           {tObj.therapistId ? ` (${tObj.therapistId})` : ""}
//                                         </>
//                                       : <span className="text-gray-400">—</span>}
//                                   </td>
//                                 </tr>
//                               );
//                             })}
//                           </tbody>
//                         </table>
//                       </div>
//                     </details>
//                   )}
//                   {booking.discountInfo && booking.discountInfo.coupon && booking.discountInfo.coupon.discountEnabled && (
//                     <div className="mb-1 text-xs text-blue-700">
//                       Discount: <span className="font-semibold">
//                         {booking.discountInfo.coupon.discount}%
//                       </span>
//                       {" "}
//                       (Coupon: <span className="font-mono">
//                         {booking.discountInfo.coupon.couponCode}
//                       </span>
//                         {booking.discountInfo.coupon.validityDays && (
//                           <> {` - valid ${booking.discountInfo.coupon.validityDays}d`}</>
//                         )}
//                       )
//                     </div>
//                   )}
//                   <div className="flex gap-2 mt-2">
//                     <button
//                       className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
//                       onClick={() => handleEditBooking(booking._id)}
//                       title="Edit booking"
//                       disabled={!!editBookingId && editBookingId !== booking._id}
//                     >
//                       <FiEdit2 />Edit
//                     </button>
//                     <button
//                       className="text-xs rounded px-2 py-1 border border-red-400 text-red-600 hover:bg-red-50"
//                       onClick={() => handleDeleteBooking(booking._id)}
//                       title="Delete booking"
//                       disabled={!!editBookingId && editBookingId === booking._id}
//                     >
//                       Delete
//                     </button>
//                   </div>
//                   {editBookingId === booking._id && (
//                     <div className="absolute -top-2 right-2">
//                       <span className="text-blue-800 text-xs bg-blue-200 px-2 py-0.5 rounded font-bold shadow">Editing</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
