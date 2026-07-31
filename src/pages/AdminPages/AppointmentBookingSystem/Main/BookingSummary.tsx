

// import { useState, useEffect, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiUser, FiTag, FiPackage, FiChevronDown, FiHash,
//   FiEdit2, FiX, FiCreditCard, FiCheckCircle, FiSearch,
// } from "react-icons/fi";
// import { FiDollarSign, FiSmartphone, FiPocket } from "react-icons/fi";
// import {
//   Booking, Therapist, PAGE_SIZE_OPTIONS, SESSION_TIME_OPTIONS,
//   formatDateDDMMYYYY, getPatientDisplayName, getPackageDisplay,
// } from "./types";

// // ─── CollectPaymentModal ──────────────────────────────────────────────────────

// type CollectPaymentModalProps = {
//   open: boolean;
//   onClose: () => void;
//   payment: {
//     _id: string;
//     appointmentId: string;
//     patientName: string;
//     patientId: string;
//     invoiceAmount?: number;
//     amountPaid?: number;
//     paymentRecordId?: string;
//     discountPercent?: number;
//     checkedInCount?: number;
//     totalSessions?: number;
//     walletBalance?: number;
//   } | null;
//   onCollected: () => void;
// };

// function toNumber(v: any): number | undefined {
//   if (typeof v === "number") return v;
//   if (typeof v === "string" && v.trim() !== "") {
//     const n = parseFloat(v);
//     return isNaN(n) ? undefined : n;
//   }
//   return undefined;
// }

// // NOTE: Under the running-invoice model, `invoiceAmount` from the backend
// // already reflects (costPerSession * (1 - discount%)) * checkedInSessions.
// // We do NOT re-apply a discount % on top of it here — that would double count
// // the discount. Discount % is shown purely as an informational label.

// type PaymentMethod = "cash" | "online" | "";

// function CollectPaymentModal({ open, onClose, payment, onCollected }: CollectPaymentModalProps) {
//   const [collectType, setCollectType] = useState<"full" | "partial">("full");
//   const [partialValue, setPartialValue] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
//   const [utr, setUtr] = useState("");

//   const [paymentTime, setPaymentTime] = useState(() => {
//     const now = new Date();
//     return now.toISOString().slice(0, 16);
//   });

//   const invoiceAmount = payment ? toNumber(payment.invoiceAmount) ?? 0 : 0;
//   const amountAlreadyPaid = (payment && toNumber(payment.amountPaid)) ?? 0;
//   const dueNow = Math.max(0, invoiceAmount - amountAlreadyPaid);
//   const walletBalance = (payment && toNumber(payment.walletBalance)) ?? 0;
//   const discountPercent = (payment && typeof payment.discountPercent === "number") ? payment.discountPercent : 0;
//   const checkedInCount = payment?.checkedInCount ?? 0;
//   const totalSessions = payment?.totalSessions ?? 0;

//   const partialNumeric = parseFloat(partialValue);
//   const overflowToWallet =
//     collectType === "partial" && !isNaN(partialNumeric) && partialNumeric > dueNow
//       ? partialNumeric - dueNow
//       : 0;

//   const needsUtr = paymentMethod === "online";
//   const utrMissing = needsUtr && utr.trim() === "";
//   const paymentTimeMissing = !paymentTime || paymentTime.trim() === "";

//   const canSubmit = !loading && paymentMethod !== "" && !utrMissing && !paymentTimeMissing &&
//     (collectType === "full" || (!isNaN(partialNumeric) && partialNumeric > 0));

//   useEffect(() => {
//     if (open) {
//       setCollectType("full");
//       setPartialValue("");
//       setLoading(false);
//       setPaymentMethod("");
//       setUtr("");
//       const now = new Date();
//       setPaymentTime(now.toISOString().slice(0, 16));
//     }
//   }, [open, payment]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!payment || !canSubmit) return;

//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     setLoading(true);
//     try {
//       const body: Record<string, any> = {
//         paymentType: collectType,
//         discountApplied: discountPercent > 0,
//         paymentMethod,
//         paymentTime: paymentTime ? new Date(paymentTime).toISOString() : undefined,
//         ...(needsUtr && utr.trim() ? { utr: utr.trim() } : {}),
//         ...(collectType === "partial" ? { partialAmount: partialNumeric } : {}),
//       };
//       const res = await fetch(`${endpoint}/api/admin/bookings/${payment._id}/collect-payment`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `${localStorage.getItem("admin-token") || ""}`,
//         },
//         body: JSON.stringify(body),
//       });
//       const data = await res.json();
//       console.log(data);
//       if (!res.ok) throw new Error(data?.error || data?.message || "Failed to collect payment.");
//       onCollected();
//       onClose();
//     } catch (err: any) {
//       alert(err.message || "Failed to collect payment.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!open || !payment) return null;
//   return (
//     <AnimatePresence>
//       <motion.div
//         key="collect-modal"
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         style={{ backdropFilter: "blur(2px)" }}
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 280, damping: 30 }}
//           className="bg-white rounded-lg shadow-lg max-w-sm w-full border border-slate-200 relative"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700" onClick={onClose} tabIndex={-1} type="button">
//             <FiX size={20} />
//           </button>
//           <div className="p-6 pb-4">
//             <div className="font-semibold text-lg text-slate-800 mb-2">Collect Payment</div>

//             <div className="text-sm mb-3">
//               <span className="font-medium text-blue-700">Appt#: {payment.appointmentId}</span><br />
//               <span className="text-slate-800">{payment.patientName}</span>{" "}
//               <span className="text-xs text-blue-300 font-mono">({payment.patientId})</span>
//             </div>

//             <div className="mb-3 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs space-y-1">
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Sessions checked in</span>
//                 <span className="font-semibold text-slate-800">{checkedInCount} / {totalSessions || "—"}</span>
//               </div>
//               {discountPercent > 0 && (
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Discount</span>
//                   <span className="font-semibold text-green-700">{discountPercent}% (already included below)</span>
//                 </div>
//               )}
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Current invoice amount</span>
//                 <span className="font-semibold text-slate-800">₹{invoiceAmount}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-slate-600">Already paid</span>
//                 <span className="font-semibold text-slate-800">₹{amountAlreadyPaid}</span>
//               </div>
//               <div className="flex justify-between border-t border-sky-200 pt-1 mt-1">
//                 <span className="text-rose-700 font-medium">Due now</span>
//                 <span className="font-bold text-rose-700">₹{dueNow}</span>
//               </div>
//               <div className="flex justify-between border-t border-sky-200 pt-1 mt-1">
//                 <span className="text-emerald-700 font-medium flex items-center gap-1">
//                   <FiPocket size={12} /> Wallet balance
//                 </span>
//                 <span className="font-bold text-emerald-700">₹{walletBalance}</span>
//               </div>
//             </div>

//             <form onSubmit={handleSubmit}>
//               <div className="mb-3">
//                 <label className="block font-medium text-slate-700 mb-1 text-sm">Collection type</label>
//                 <div className="flex gap-4 items-center">
//                   <label className="flex items-center gap-1 cursor-pointer text-sm">
//                     <input type="radio" name="collectType" value="full"
//                       checked={collectType === "full"} onChange={() => setCollectType("full")} disabled={loading} />
//                     Full amount (pays off due now)
//                   </label>
//                   <label className="flex items-center gap-1 cursor-pointer text-sm">
//                     <input type="radio" name="collectType" value="partial"
//                       checked={collectType === "partial"} onChange={() => setCollectType("partial")} disabled={loading} />
//                     Partial / custom amount
//                   </label>
//                 </div>
//               </div>

//               {collectType === "partial" && (
//                 <div className="mb-3">
//                   <label className="block mb-1 text-slate-700 text-xs font-medium">
//                     Amount to collect <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="number" min={1} step={1} value={partialValue}
//                     onChange={(e) => setPartialValue(e.target.value)}
//                     className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-green-200 text-sm"
//                     placeholder="e.g. 800" required disabled={loading}
//                   />
//                   <div className="text-xs text-slate-400 mt-1">
//                     Due now is ₹{dueNow}. Anything you enter beyond that is automatically
//                     saved as a wallet advance for this patient.
//                   </div>
//                   {overflowToWallet > 0 && (
//                     <div className="text-xs text-emerald-700 mt-1 font-medium">
//                       ₹{overflowToWallet} of this will be credited to wallet as advance.
//                     </div>
//                   )}
//                 </div>
//               )}

//               {collectType === "full" && (
//                 <div className="mb-3 text-xs text-slate-500">
//                   This collects exactly the ₹{dueNow} currently due. It does not touch
//                   the rest of the package — future sessions will be billed as they're
//                   checked in.
//                 </div>
//               )}

//               <div className="mb-3">
//                 <label className="block font-medium text-slate-700 mb-1 text-sm">
//                   Payment date & time <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type="datetime-local"
//                   value={paymentTime}
//                   onChange={e => setPaymentTime(e.target.value)}
//                   required
//                   disabled={loading}
//                   className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-blue-100 text-sm"
//                   max={new Date().toISOString().slice(0, 16)}
//                 />
//                 {paymentTimeMissing && (
//                   <div className="text-xs text-red-500 mt-1">
//                     Please select the date and time of payment.
//                   </div>
//                 )}
//               </div>

//               <div className="mb-3">
//                 <label className="block font-medium text-slate-700 mb-1 text-sm">
//                   Payment method <span className="text-red-500">*</span>
//                 </label>
//                 <div className="flex gap-2">
//                   {(["cash", "online"] as const).map((m) => (
//                     <button
//                       key={m}
//                       type="button"
//                       disabled={loading}
//                       onClick={() => { setPaymentMethod(m); if (m === "cash") setUtr(""); }}
//                       className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
//                         paymentMethod === m
//                           ? "border-blue-500 bg-blue-50 text-blue-800"
//                           : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
//                       }`}
//                     >
//                       {m === "cash" && <FiDollarSign className="inline mr-1" />}
//                       {m === "online" && <FiSmartphone className="inline mr-1" />}
//                       {m === "cash" ? "Cash" : "Online / UPI"}
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               {needsUtr && (
//                 <div className="mb-3 bg-slate-50 border border-slate-200 rounded px-3 py-2">
//                   <label className="block text-xs font-medium text-slate-700 mb-1">
//                     UTR / transaction reference <span className="text-red-500">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     value={utr}
//                     onChange={(e) => setUtr(e.target.value)}
//                     className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-blue-200 text-sm font-mono"
//                     placeholder="e.g. SBIN00024981234"
//                     maxLength={50}
//                     required
//                     disabled={loading}
//                   />
//                   <p className="text-xs text-slate-400 mt-1">
//                     Visible on the bank / UPI app transaction receipt.
//                   </p>
//                 </div>
//               )}

//               <button
//                 type="submit"
//                 className={`mt-1 w-full rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 transition-colors ${
//                   !canSubmit ? "bg-green-50 opacity-60 cursor-not-allowed" : "hover:bg-green-50"
//                 }`}
//                 disabled={!canSubmit}
//               >
//                 {loading
//                   ? "Processing…"
//                   : collectType === "full"
//                     ? `Collect ₹${dueNow} (due now)`
//                     : "Collect amount"}
//               </button>
//               <div className="mt-1 text-xs text-slate-400 text-center">
//                 {!paymentMethod
//                   ? "Select a payment method to continue."
//                   : collectType === "partial"
//                     ? "Amount beyond what's due goes to wallet."
//                     : "Marks the current invoice as fully paid."}
//               </div>
//             </form>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// function CheckInConfirmationModal({ open, onClose, onConfirm, session, booking }: any) {
//   if (!open) return null;
//   return (
//     <div className="fixed z-40 inset-0 flex items-center justify-center bg-black/20">
//       <div className="bg-white rounded shadow-lg p-6 w-[95vw] max-w-xs relative">
//         <div className="flex items-center gap-2 mb-3">
//           <FiCheckCircle className="text-blue-500" size={24} />
//           <div className="font-semibold text-blue-700 text-base">Check In Session?</div>
//         </div>
//         <div className="mb-4 text-sm">
//           Are you sure you want to check in this session?
//           <div className="mt-2 text-xs p-2 rounded bg-blue-50 border border-blue-100">
//             <div><b>Date:</b> {session?.date ? formatDateDDMMYYYY(session.date) : ''}</div>
//             <div><b>Booking ID:</b> {booking?.appointmentId}</div>
//           </div>
//         </div>
//         <div className="flex justify-end gap-2">
//           <button onClick={onClose} className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
//           <button onClick={onConfirm} className="text-xs px-3 py-1 rounded border border-green-500 text-green-700 font-semibold bg-green-100 hover:bg-green-200">Yes, Check In</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// function MarkMissedConfirmationModal({ open, onClose, onConfirm, session, booking }: any) {
//   if (!open) return null;
//   return (
//     <div className="fixed z-40 inset-0 flex items-center justify-center bg-black/20">
//       <div className="bg-white rounded shadow-lg p-6 w-[95vw] max-w-xs relative">
//         <div className="flex items-center gap-2 mb-3">
//           <FiCheckCircle className="text-rose-500" size={24} />
//           <div className="font-semibold text-rose-700 text-base">Mark Session as Missed?</div>
//         </div>
//         <div className="mb-4 text-sm">
//           Are you sure you want to mark this session as <strong>Missed</strong>?
//           <div className="mt-2 text-xs p-2 rounded bg-red-50 border border-red-100">
//             <div><b>Date:</b> {session?.date ? formatDateDDMMYYYY(session.date) : ''}</div>
//             <div><b>Booking ID:</b> {booking?.appointmentId}</div>
//           </div>
//         </div>
//         <div className="flex justify-end gap-2">
//           <button onClick={onClose} className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
//           <button onClick={onConfirm} className="text-xs px-3 py-1 rounded border border-rose-500 text-rose-700 font-semibold bg-rose-100 hover:bg-rose-200">Yes, Mark Missed</button>
//         </div>
//       </div>
//     </div>
//   );
// }

// type BookingSummaryProps = {
//   bookings: Booking[];
//   setBookings: (b: Booking[]) => void;
//   setBookingsLoading: (v: boolean) => void;
//   setBookingsError: (v: string | null) => void;
//   getTherapistObject: (booking: Booking) => Therapist | undefined;
//   editBookingId: string | null;
//   handleEditBooking: (id: string) => void;
//   handleCollectPayment: (booking: Booking) => void;
//   paymentLoadingBookingId: string | null;
// };

// function sessionStatusLabel(session: any) {
//   if (session.status === "CheckedIn") {
//     return { label: "Checked In", color: "green-700" };
//   }
//   if (session.status === "Missed") {
//     return { label: "Missed", color: "gray-500" };
//   }
//   return { label: "Not Checked In", color: "red-600" };
// }

// export function BookingSummary({
//   bookings, setBookings, setBookingsLoading, setBookingsError,
//   getTherapistObject, editBookingId,
//   handleEditBooking,
// }: BookingSummaryProps) {
//   const [bookingsLoading, setLocalBookingsLoading] = useState(false);
//   const [bookingsError, setLocalBookingsError] = useState<string | null>(null);
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

//   const [searchTerm, setSearchTerm] = useState("");
//   const [filterTherapist, setFilterTherapist] = useState("");
//   const [filterStatus, setFilterStatus] = useState("");
//   const [therapistList, setTherapistList] = useState<Therapist[]>([]);

//   const sessionTherapistOptions = useMemo(() => {
//     const therapistMap: Map<string, Therapist> = new Map();
//     bookings.forEach((booking: any) => {
//       if (!Array.isArray(booking.sessions)) return;
//       booking.sessions.forEach((session: any) => {
//         const t = session.therapist;
//         if (t && typeof t === "object" && t._id) {
//           if (!therapistMap.has(t._id)) {
//             therapistMap.set(t._id, t);
//           }
//         }
//       });
//     });
//     return Array.from(therapistMap.values()).sort((a, b) => {
//       const aName = (a.userId?.name || a.name || "").toLowerCase();
//       const bName = (b.userId?.name || b.name || "").toLowerCase();
//       if (aName < bName) return -1;
//       if (aName > bName) return 1;
//       return 0;
//     });
//   }, [bookings]);

//   const [collectModalOpen, setCollectModalOpen] = useState(false);
//   const [collectModalPayment, setCollectModalPayment] = useState<any>(null);

//   const [checkInModalOpen, setCheckInModalOpen] = useState(false);
//   const [checkInSession, setCheckInSession] = useState<any>(null);
//   const [checkInBooking, setCheckInBooking] = useState<any>(null);
//   const [checkInLoading, setCheckInLoading] = useState(false);
//   const [checkInError, setCheckInError] = useState<string | null>(null);

//   const [missedModalOpen, setMissedModalOpen] = useState(false);
//   const [missedSession, setMissedSession] = useState<any>(null);
//   const [missedBooking, setMissedBooking] = useState<any>(null);
//   const [missedLoading, setMissedLoading] = useState(false);
//   const [missedError, setMissedError] = useState<string | null>(null);

//   useEffect(() => {
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     fetch(`${endpoint}/api/admin/therapists?limit=100`)
//       .then(async (res) => {
//         if (!res.ok) return;
//         const data = await res.json();
//         setTherapistList(Array.isArray(data?.therapists) ? data.therapists : []);
//       })
//       .catch(() => setTherapistList([]));
//   }, []);

//   const normalize = (v: any) =>
//     (typeof v === "string" ? v : v?.toString() ?? "")
//       .toLowerCase()
//       .trim();

//   const filteredBookings = bookings
//     .filter((booking: any) => {
//       if (filterTherapist) {
//         const therapistMatch =
//           booking.therapist?._id === filterTherapist ||
//           booking.therapistId === filterTherapist ||
//           (Array.isArray(booking.sessions) &&
//             booking.sessions.some(
//               (session: any) =>
//                 session.therapist &&
//                 typeof session.therapist === "object" &&
//                 session.therapist._id === filterTherapist
//             )
//           );
//         if (!therapistMatch) return false;
//       }
//       if (
//         filterStatus &&
//         normalize(booking.payment?.status) !== normalize(filterStatus)
//       ) {
//         return false;
//       }
//       if (searchTerm.trim()) {
//         const query = normalize(searchTerm);
//         const patient = booking?.patient;
//         const therapist = booking?.therapist || getTherapistObject(booking);
//         const valuesToSearch = [
//           booking.appointmentId,
//           patient?.name,
//           patient?._id,
//           patient?.patientId,
//           therapist?.name,
//           therapist?._id,
//           therapist?.therapistId,
//           booking?.therapy?.name,
//           booking?.package?.name || getPackageDisplay(booking.package),
//           booking?.remark,
//         ].filter(Boolean).map(normalize);
//         if (!valuesToSearch.some((field) => field.includes(query))) {
//           return false;
//         }
//       }
//       return true;
//     });

//   const pagedBookings = filteredBookings.slice(
//     (page - 1) * pageSize,
//     (page - 1) * pageSize + pageSize
//   );
//   const filteredTotal = filteredBookings.length;
//   const filteredPages = Math.ceil(filteredTotal / pageSize);

//   const totalSessionCount = pagedBookings && Array.isArray(pagedBookings)
//     ? pagedBookings.reduce((acc, b) => acc + (Array.isArray(b.sessions) ? b.sessions.length : 0), 0)
//     : 0;

//   useEffect(() => {
//     if (page > filteredPages && filteredPages > 0) {
//       setPage(1);
//     }
//   }, [searchTerm, filterTherapist, filterStatus, filteredPages]);

//   function fetchBookings() {
//     setLocalBookingsLoading(true);
//     setBookingsLoading(true);
//     setLocalBookingsError(null);
//     setBookingsError(null);
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     const params = new URLSearchParams();
//     params.append("page", "1");
//     params.append("pageSize", "10000");
//     fetch(`${endpoint}/api/admin/bookings?${params.toString()}`)
//       .then(async (res) => {
//         if (!res.ok) throw new Error("Could not fetch bookings.");
//         const data = await res.json();
//         setBookings(data?.bookings || []);
//         setLocalBookingsLoading(false);
//         setBookingsLoading(false);
//       })
//       .catch(() => {
//         setLocalBookingsError("Error loading bookings.");
//         setBookingsError("Error loading bookings.");
//         setLocalBookingsLoading(false);
//         setBookingsLoading(false);
//       });
//   }
//   useEffect(() => { fetchBookings(); }, []);

//   const handleModalCollectPayment = (booking: any) => {
//     let discountPercent = 0;
//     if (booking.discountInfo && booking.discountInfo.coupon && booking.discountInfo.coupon.discountEnabled) {
//       discountPercent = Number(booking.discountInfo.coupon.discount) || 0;
//     }
//     const checkedInCount = Array.isArray(booking.sessions)
//       ? booking.sessions.filter((s: any) => s.status === "CheckedIn").length
//       : 0;
//     const totalSessions = Array.isArray(booking.sessions) ? booking.sessions.length : 0;

//     setCollectModalOpen(true);
//     setCollectModalPayment({
//       _id: booking._id,
//       appointmentId: booking.appointmentId,
//       patientName: booking.patient?.name || "",
//       patientId: booking.patient?._id || "",
//       invoiceAmount: booking.invoiceAmount ?? 0,
//       amountPaid: booking.payment?.amountPaid ?? 0,
//       paymentRecordId: booking.payment?._id,
//       discountPercent,
//       checkedInCount,
//       totalSessions,
//       walletBalance: booking.wallet?.balance ?? 0,
//     });
//   };

//   const handleModalCollected = () => {
//     setCollectModalOpen(false);
//     setCollectModalPayment(null);
//     fetchBookings();
//   };

//   const openCheckInModal = (booking: any, session: any) => {
//     setCheckInBooking(booking); setCheckInSession(session);
//     setCheckInError(null); setCheckInModalOpen(true);
//   };
//   const closeCheckInModal = () => {
//     setCheckInBooking(null); setCheckInSession(null);
//     setCheckInError(null); setCheckInModalOpen(false);
//   };

//   const handleConfirmCheckIn = async () => {
//     if (!checkInBooking || !checkInSession) return;
//     setCheckInLoading(true); setCheckInError(null);
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     try {
//       const res = await fetch(`${endpoint}/api/admin/bookings/check-in`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `${localStorage.getItem("admin-token") || ""}`,
//         },
//         body: JSON.stringify({ bookingId: checkInBooking._id, sessionId: checkInSession._id }),
//       });
//       if (!res.ok) { const t = await res.text(); throw new Error(t || "Failed to check in session."); }
//       closeCheckInModal(); setCheckInLoading(false); fetchBookings();
//     } catch (err: any) {
//       setCheckInError(err.message || "Unable to check in.");
//       setCheckInLoading(false);
//     }
//   };

//   const openMissedModal = (booking: any, session: any) => {
//     setMissedBooking(booking);
//     setMissedSession(session);
//     setMissedError(null);
//     setMissedModalOpen(true);
//   };
//   const closeMissedModal = () => {
//     setMissedBooking(null); setMissedSession(null);
//     setMissedError(null); setMissedModalOpen(false);
//   };

//   const handleConfirmMissed = async () => {
//     if (!missedBooking || !missedSession) return;
//     setMissedLoading(true); setMissedError(null);
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     try {
//       const res = await fetch(`${endpoint}/api/admin/bookings/mark-session-missed`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `${localStorage.getItem("admin-token") || ""}`,
//         },
//         body: JSON.stringify({ bookingId: missedBooking._id, sessionId: missedSession._id }),
//       });
//       if (!res.ok) { const t = await res.text(); throw new Error(t || "Failed to mark session as missed."); }
//       closeMissedModal(); setMissedLoading(false); fetchBookings();
//     } catch (err: any) {
//       setMissedError(err.message || "Unable to mark as missed.");
//       setMissedLoading(false);
//     }
//   };

//   const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     setSearchTerm(e.target.value);
//     setPage(1);
//   };
//   const onSearchFormSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     setPage(1);
//   };

//   const resetFilters = () => {
//     setSearchTerm("");
//     setFilterTherapist("");
//     setFilterStatus("");
//     setPage(1);
//   };

//   function getSessionStatusUI(session: any) {
//     const status = sessionStatusLabel(session);
//     return <span className={`text-${status.color} font-semibold`}>{status.label}</span>;
//   }

//   return (
//     <div className="mt-6">
//       <CollectPaymentModal
//         open={collectModalOpen}
//         onClose={() => { setCollectModalOpen(false); setCollectModalPayment(null); }}
//         payment={collectModalPayment}
//         onCollected={handleModalCollected}
//       />
//       <CheckInConfirmationModal
//         open={checkInModalOpen}
//         onClose={closeCheckInModal}
//         onConfirm={handleConfirmCheckIn}
//         session={checkInSession}
//         booking={checkInBooking}
//       />
//       <MarkMissedConfirmationModal
//         open={missedModalOpen}
//         onClose={closeMissedModal}
//         onConfirm={handleConfirmMissed}
//         session={missedSession}
//         booking={missedBooking}
//       />

//       <div className="bg-white border rounded-lg p-4 text-sm">
//         <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
//           <p className="font-medium">Booking Summary</p>
//           <div className="bg-blue-50 border border-blue-100 rounded px-3 py-1 text-xs text-blue-800 font-semibold shadow-sm">
//             Total Selected Sessions: <span className="ml-1 text-blue-900 font-extrabold">{totalSessionCount}</span>
//           </div>
//         </div>

//         <form onSubmit={onSearchFormSubmit} className="flex flex-wrap items-center gap-3 mb-4">
//           <div className="relative w-1/2">
//             <input
//               value={searchTerm}
//               onChange={onSearchInputChange}
//               className="border px-2 pl-8 py-1 rounded w-full text-xs focus:ring-blue-200 focus:ring"
//               placeholder="Search by Booking ID, Patient, Therapist, etc."
//               type="search"
//               autoComplete="off"
//             />
//             <FiSearch className="absolute left-2 top-2 text-slate-400" size={16} />
//           </div>
//           <div>
//             <select
//               className="border px-2 py-1 rounded text-xs min-w-[160px]"
//               value={filterTherapist}
//               onChange={e => { setFilterTherapist(e.target.value); setPage(1); }}
//             >
//               <option value="">All Therapists</option>
//               {sessionTherapistOptions.map((t) =>
//                 <option key={t._id} value={t._id}>
//                   {(t.userId?.name || t.name) ?? ""}
//                   {t.therapistId ? ` (${t.therapistId})` : ""}
//                 </option>
//               )}
//               {therapistList
//                 .filter(
//                   masterT =>
//                     !sessionTherapistOptions.find(sessionT => sessionT._id === masterT._id)
//                 )
//                 .map((t) =>
//                   <option key={t._id} value={t._id}>
//                     {(t.name || t.userId?.name) ?? ""}
//                     {t.therapistId ? ` (${t.therapistId})` : ""}
//                   </option>
//                 )
//               }
//             </select>
//           </div>
//           <div>
//             <select
//               className="border px-2 py-1 rounded text-xs"
//               value={filterStatus}
//               onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
//             >
//               <option value="">All Statuses</option>
//               <option value="paid">Paid</option>
//               <option value="partiallypaid">Partially Paid</option>
//               <option value="pending">Pending</option>
//             </select>
//           </div>
//           <button
//             type="button"
//             className="text-xs rounded px-2 py-1 border border-slate-300 text-slate-500 bg-slate-50 hover:bg-slate-100"
//             onClick={resetFilters}
//             disabled={
//               !searchTerm && !filterTherapist && !filterStatus
//             }>
//             Reset
//           </button>
//         </form>

//         <div className="flex flex-wrap items-center justify-between py-2">
//           <span className="text-xs text-slate-500">Total: <b>{filteredTotal}</b></span>
//           <div className="flex items-center gap-2">
//             <span className="text-xs text-slate-400">Rows:</span>
//             <select
//               value={pageSize}
//               onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
//               className="border text-xs px-1 py-0.5 rounded"
//             >
//               {PAGE_SIZE_OPTIONS.map((opt) => <option value={opt} key={opt}>{opt}</option>)}
//             </select>
//             <button className="px-2 py-1 text-xs border rounded border-slate-300" disabled={page === 1 || bookingsLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
//             <span className="text-xs">{page} / {Math.max(filteredPages, 1)}</span>
//             <button className="px-2 py-1 text-xs border rounded border-slate-300" disabled={page >= filteredPages || bookingsLoading} onClick={() => setPage((p) => Math.min(filteredPages, p + 1))}>Next</button>
//           </div>
//         </div>

//         {bookingsLoading ? (
//           <div className="text-center py-12 text-slate-400 text-base">Loading bookings…</div>
//         ) : bookingsError ? (
//           <div className="text-red-600 p-3">{bookingsError}</div>
//         ) : !pagedBookings || pagedBookings.length === 0 ? (
//           <p className="text-slate-500 mb-3">No bookings found.</p>
//         ) : (
//           <div className="flex flex-col gap-4">
//             {pagedBookings.map((booking: any) => {
//               const therapistObj = getTherapistObject(booking);
//               const paymentStatus = booking.payment?.status;
//               const isPaid = paymentStatus === "paid";
//               const isPartiallyPaid = paymentStatus === "partiallypaid";

//               const invoiceAmount = booking.invoiceAmount ?? 0;
//               const paidAmount = booking.payment?.amountPaid ?? 0;
//               const dueNow = Math.max(0, invoiceAmount - paidAmount);
//               const walletBalance = booking.wallet?.balance ?? 0;

//               const checkedInCount = Array.isArray(booking.sessions)
//                 ? booking.sessions.filter((s: any) => s.status === "CheckedIn").length
//                 : 0;
//               const totalSessions = Array.isArray(booking.sessions) ? booking.sessions.length : 0;

//               let discountPercent = 0;
//               if (booking.discountInfo && booking.discountInfo.coupon && booking.discountInfo.coupon.discountEnabled) {
//                 discountPercent = Number(booking.discountInfo.coupon.discount) || 0;
//               }

//               return (
//                 <div
//                   key={booking._id}
//                   className={`border p-3 rounded bg-sky-50 relative ${editBookingId === booking._id ? "ring ring-blue-400 ring-offset-2" : ""}`}
//                 >
//                   {booking.appointmentId && (
//                     <div className="mb-1 flex items-center justify-between gap-2">
//                       <div className="flex items-center gap-2 text-xs font-mono text-gray-700">
//                         <FiHash className="text-blue-500" /> Booking ID: {booking.appointmentId}
//                       </div>
//                       <div className="flex items-center gap-1 text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
//                         <FiPocket size={12} /> Wallet: ₹{walletBalance}
//                       </div>
//                     </div>
//                   )}
//                   {therapistObj && (
//                     <div className="mb-2 flex items-center gap-2">
//                       <FiUser className="text-slate-500" />
//                       <span className="text-slate-700">
//                         Therapist: {therapistObj.name}
//                         {therapistObj.therapistId ? (
//                           <>{" ("}<a href={`/admin/therapists?therapistId=${encodeURIComponent(therapistObj._id)}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{therapistObj.therapistId}</a>{")"}</>
//                         ) : ""}
//                       </span>
//                     </div>
//                   )}
//                   <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
//                     <FiUser className="text-blue-600" />
//                     {booking.patient?._id ? (
//                       <a href={`/admin/children?patientId=${encodeURIComponent(booking.patient._id)}`} className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
//                         {getPatientDisplayName(booking.patient)}
//                       </a>
//                     ) : getPatientDisplayName(booking.patient)}
//                   </div>
//                   <div className="mb-2 flex items-center gap-2">
//                     <FiTag className="text-slate-500" />
//                     <span className="text-slate-700">{booking.therapy?.name}</span>
//                   </div>
//                   <div className="mb-2 flex items-center gap-2">
//                     <FiPackage className="text-purple-500" />
//                     <span className="text-purple-700">{getPackageDisplay(booking.package)}</span>
//                   </div>
//                   {booking.remark && (
//                     <div className="mb-2 text-xs text-slate-700 flex items-center gap-2">
//                       <span className="font-semibold text-slate-500">Remark:</span>
//                       <span className="italic text-slate-800">{booking.remark}</span>
//                     </div>
//                   )}

//                   <div className="mb-2 px-2 py-2 rounded bg-sky-100 border border-sky-200 text-xs space-y-1">
//                     <div className="flex items-center justify-between font-semibold text-blue-900">
//                       <span>Sessions checked in</span>
//                       <span className="font-mono">{checkedInCount} / {totalSessions}</span>
//                     </div>
//                     {discountPercent > 0 && (
//                       <div className="flex items-center justify-between text-green-700 font-semibold">
//                         <span>
//                           Discount ({discountPercent}%)
//                           {booking.discountInfo?.coupon?.couponCode && (
//                             <span className="ml-2 bg-green-100 px-2 py-0.5 rounded text-green-800 font-mono">
//                               Code: {booking.discountInfo.coupon.couponCode}
//                             </span>
//                           )}
//                         </span>
//                         <span className="text-green-800">already included below</span>
//                       </div>
//                     )}
//                     <div className="flex items-center justify-between text-blue-900 font-semibold">
//                       <span>Current invoice amount</span>
//                       <span className="font-mono">₹{invoiceAmount}</span>
//                     </div>
//                     <div className="flex items-center justify-between text-slate-700">
//                       <span>Paid so far</span>
//                       <span className="font-mono">₹{paidAmount}</span>
//                     </div>
//                     <div className="flex items-center justify-between text-rose-700 font-semibold border-t border-sky-200 pt-1 mt-1">
//                       <span>Due now</span>
//                       <span className="font-mono">₹{dueNow}</span>
//                     </div>
//                   </div>

//                   <div className="mb-2 flex items-center gap-2">
//                     <FiCreditCard className="text-green-600" />
//                     {isPaid ? (
//                       <span className="text-green-700 font-semibold">Paid up to current invoice</span>
//                     ) : isPartiallyPaid ? (
//                       <span className="text-amber-700 font-semibold">Partially Paid</span>
//                     ) : (
//                       <span className="text-orange-600 font-semibold">Payment Pending</span>
//                     )}
//                     {dueNow > 0 && (
//                       <button
//                         className="ml-3 flex items-center gap-1 text-xs border px-2 py-1 rounded border-green-400 text-green-800 bg-green-100 hover:bg-green-200 font-medium transition"
//                         onClick={() => handleModalCollectPayment(booking)}
//                         title="Collect payment"
//                       >
//                         <FiCreditCard /> Collect Payment
//                       </button>
//                     )}
//                     {dueNow <= 0 && (
//                       <button
//                         className="ml-3 flex items-center gap-1 text-xs border px-2 py-1 rounded border-emerald-400 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-medium transition"
//                         onClick={() => handleModalCollectPayment(booking)}
//                         title="Collect an advance payment for future sessions"
//                       >
//                         <FiPocket /> Collect Advance
//                       </button>
//                     )}
//                   </div>

//                   {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
//                     <details className="mb-2 text-xs text-slate-700">
//                       <summary className="font-medium cursor-pointer select-none flex items-center">
//                         <span>Sessions ({booking.sessions.length})</span>
//                         <FiChevronDown className="inline ml-1 text-slate-500" />
//                       </summary>
//                       <div className="overflow-x-auto mt-2">
//                         {checkInError && checkInBooking?._id === booking._id && (
//                           <div className="text-xs text-red-600 mb-2">{checkInError}</div>
//                         )}
//                         {missedError && missedBooking?._id === booking._id && (
//                           <div className="text-xs text-red-600 mb-2">{missedError}</div>
//                         )}
//                         <table className="min-w-[900px] w-full border-collapse text-xs">
//                           <thead>
//                             <tr>
//                               {["#", "Session ID", "Date", "Time Slot", "Therapist", "Therapy Type", "Status", "Actions"].map((h) => (
//                                 <th key={h} className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">{h}</th>
//                               ))}
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {booking.sessions.map((s: any, idx: number) => {
//                               const slot = SESSION_TIME_OPTIONS.find((opt) => opt.id === s.slotId);
//                               const tObj = s.therapist;
//                               const therapy =
//                                 s.therapyTypeId && typeof s.therapyTypeId === "object"
//                                   ? s.therapyTypeId
//                                   : typeof s.therapyType === "string" ? s.therapyType : undefined;

//                               const status = sessionStatusLabel(s);
//                               const isCheckedIn = status.label === "Checked In";
//                               const isMissed = status.label === "Missed";

//                               return (
//                                 <tr key={s._id || s.date + "-" + idx}>
//                                   <td className="px-2 py-1 border border-slate-200 text-slate-400">{idx + 1}</td>
//                                   <td className="px-2 py-1 border border-slate-200 font-mono text-xs text-slate-600">{s.sessionId || s._id || <span className="text-gray-400">—</span>}</td>
//                                   <td className="px-2 py-1 border border-slate-200">{s.date ? formatDateDDMMYYYY(s.date) : ''}</td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                                     {slot ? <>{slot.label}{slot.limited && <span className="text-amber-700 ml-1">(Limited case)</span>}</> : s.slotId}
//                                   </td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                                     {tObj ? <>{tObj.userId?.name || tObj.name}{tObj.therapistId ? ` (${tObj.therapistId})` : ""}</> : <span className="text-gray-400">—</span>}
//                                   </td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                                     {typeof therapy === "object" && therapy && "name" in therapy
//                                       ? therapy.name : typeof therapy === "string" ? therapy
//                                       : <span className="text-gray-400">—</span>}
//                                   </td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
//                                     {getSessionStatusUI(s)}
//                                   </td>
//                                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-right flex gap-2">
//                                     {!isCheckedIn && !isMissed && (
//                                       <>
//                                         <button
//                                           className={`text-xs rounded px-2 py-1 border  border-green-500 text-green-700 hover:bg-green-50 flex items-center gap-1 ${checkInLoading ? "opacity-60 cursor-not-allowed" : ""}`}
//                                           disabled={checkInLoading}
//                                           onClick={() => openCheckInModal(booking, s)}
//                                         >
//                                           <FiCheckCircle /> Mark Session Completed
//                                         </button>
//                                         <button
//                                           className={`ml-2 text-xs rounded px-2 py-1 border border-rose-400 text-rose-700 hover:bg-rose-50 flex items-center gap-1 ${missedLoading ? "opacity-60 cursor-not-allowed" : ""}`}
//                                           disabled={missedLoading}
//                                           onClick={() => openMissedModal(booking, s)}
//                                         >
//                                           <FiX /> Mark Missed
//                                         </button>
//                                       </>
//                                     )}
//                                   </td>
//                                 </tr>
//                               );
//                             })}
//                           </tbody>
//                         </table>
//                       </div>
//                     </details>
//                   )}

//                   <div className="flex gap-2 mt-2">
//                     <button
//                       className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
//                       onClick={() => handleEditBooking(booking._id)}
//                       disabled={!!editBookingId && editBookingId !== booking._id}
//                     >
//                       <FiEdit2 /> Edit
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

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiTag, FiPackage, FiChevronDown, FiHash,
  FiEdit2, FiX, FiCreditCard, FiCheckCircle, FiSearch, FiCopy,
} from "react-icons/fi";
import { FiDollarSign, FiSmartphone, FiPocket } from "react-icons/fi";
import {
  Booking, Therapist, PAGE_SIZE_OPTIONS, SESSION_TIME_OPTIONS,
  formatDateDDMMYYYY, getPatientDisplayName, getPackageDisplay,
} from "./types";

// ─── CollectPaymentModal ──────────────────────────────────────────────────────

type CollectPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  payment: {
    _id: string;
    appointmentId: string;
    patientName: string;
    patientId: string;
    invoiceAmount?: number;
    amountPaid?: number;
    paymentRecordId?: string;
    discountPercent?: number;
    checkedInCount?: number;
    totalSessions?: number;
    walletBalance?: number;
  } | null;
  onCollected: () => void;
};

function toNumber(v: any): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}

// NOTE: Under the running-invoice model, `invoiceAmount` from the backend
// already reflects (costPerSession * (1 - discount%)) * checkedInSessions.
// We do NOT re-apply a discount % on top of it here — that would double count
// the discount. Discount % is shown purely as an informational label.

type PaymentMethod = "cash" | "online" | "";

function CollectPaymentModal({ open, onClose, payment, onCollected }: CollectPaymentModalProps) {
  const [collectType, setCollectType] = useState<"full" | "partial">("full");
  const [partialValue, setPartialValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [utr, setUtr] = useState("");

  const [paymentTime, setPaymentTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });

  const invoiceAmount = payment ? toNumber(payment.invoiceAmount) ?? 0 : 0;
  const amountAlreadyPaid = (payment && toNumber(payment.amountPaid)) ?? 0;
  const dueNow = Math.max(0, invoiceAmount - amountAlreadyPaid);
  const walletBalance = (payment && toNumber(payment.walletBalance)) ?? 0;
  const discountPercent = (payment && typeof payment.discountPercent === "number") ? payment.discountPercent : 0;
  const checkedInCount = payment?.checkedInCount ?? 0;
  const totalSessions = payment?.totalSessions ?? 0;

  const partialNumeric = parseFloat(partialValue);
  const overflowToWallet =
    collectType === "partial" && !isNaN(partialNumeric) && partialNumeric > dueNow
      ? partialNumeric - dueNow
      : 0;

  const needsUtr = paymentMethod === "online";
  const utrMissing = needsUtr && utr.trim() === "";
  const paymentTimeMissing = !paymentTime || paymentTime.trim() === "";

  const canSubmit = !loading && paymentMethod !== "" && !utrMissing && !paymentTimeMissing &&
    (collectType === "full" || (!isNaN(partialNumeric) && partialNumeric > 0));

  useEffect(() => {
    if (open) {
      setCollectType("full");
      setPartialValue("");
      setLoading(false);
      setPaymentMethod("");
      setUtr("");
      const now = new Date();
      setPaymentTime(now.toISOString().slice(0, 16));
    }
  }, [open, payment]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payment || !canSubmit) return;

    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    setLoading(true);
    try {
      const body: Record<string, any> = {
        paymentType: collectType,
        discountApplied: discountPercent > 0,
        paymentMethod,
        paymentTime: paymentTime ? new Date(paymentTime).toISOString() : undefined,
        ...(needsUtr && utr.trim() ? { utr: utr.trim() } : {}),
        ...(collectType === "partial" ? { partialAmount: partialNumeric } : {}),
      };
      const res = await fetch(`${endpoint}/api/admin/bookings/${payment._id}/collect-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("admin-token") || ""}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      console.log(data);
      if (!res.ok) throw new Error(data?.error || data?.message || "Failed to collect payment.");
      onCollected();
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to collect payment.");
    } finally {
      setLoading(false);
    }
  };

  if (!open || !payment) return null;
  return (
    <AnimatePresence>
      <motion.div
        key="collect-modal"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ backdropFilter: "blur(2px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 30 }}
          className="bg-white rounded-lg shadow-lg max-w-sm w-full border border-slate-200 relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button className="absolute top-3 right-3 text-slate-400 hover:text-slate-700" onClick={onClose} tabIndex={-1} type="button">
            <FiX size={20} />
          </button>
          <div className="p-6 pb-4">
            <div className="font-semibold text-lg text-slate-800 mb-2">Collect Payment</div>

            <div className="text-sm mb-3">
              <span className="font-medium text-blue-700">Appt#: {payment.appointmentId}</span><br />
              <span className="text-slate-800">{payment.patientName}</span>{" "}
              <span className="text-xs text-blue-300 font-mono">({payment.patientId})</span>
            </div>

            <div className="mb-3 rounded border border-sky-200 bg-sky-50 px-3 py-2 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-600">Sessions checked in</span>
                <span className="font-semibold text-slate-800">{checkedInCount} / {totalSessions || "—"}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Discount</span>
                  <span className="font-semibold text-green-700">{discountPercent}% (already included below)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Current invoice amount</span>
                <span className="font-semibold text-slate-800">₹{invoiceAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Already paid</span>
                <span className="font-semibold text-slate-800">₹{amountAlreadyPaid}</span>
              </div>
              <div className="flex justify-between border-t border-sky-200 pt-1 mt-1">
                <span className="text-rose-700 font-medium">Due now</span>
                <span className="font-bold text-rose-700">₹{dueNow}</span>
              </div>
              <div className="flex justify-between border-t border-sky-200 pt-1 mt-1">
                <span className="text-emerald-700 font-medium flex items-center gap-1">
                  <FiPocket size={12} /> Wallet balance
                </span>
                <span className="font-bold text-emerald-700">₹{walletBalance}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="block font-medium text-slate-700 mb-1 text-sm">Collection type</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="radio" name="collectType" value="full"
                      checked={collectType === "full"} onChange={() => setCollectType("full")} disabled={loading} />
                    Full amount (pays off due now)
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="radio" name="collectType" value="partial"
                      checked={collectType === "partial"} onChange={() => setCollectType("partial")} disabled={loading} />
                    Partial / custom amount
                  </label>
                </div>
              </div>

              {collectType === "partial" && (
                <div className="mb-3">
                  <label className="block mb-1 text-slate-700 text-xs font-medium">
                    Amount to collect <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min={1} step={1} value={partialValue}
                    onChange={(e) => setPartialValue(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-green-200 text-sm"
                    placeholder="e.g. 800" required disabled={loading}
                  />
                  <div className="text-xs text-slate-400 mt-1">
                    Due now is ₹{dueNow}. Anything you enter beyond that is automatically
                    saved as a wallet advance for this patient.
                  </div>
                  {overflowToWallet > 0 && (
                    <div className="text-xs text-emerald-700 mt-1 font-medium">
                      ₹{overflowToWallet} of this will be credited to wallet as advance.
                    </div>
                  )}
                </div>
              )}

              {collectType === "full" && (
                <div className="mb-3 text-xs text-slate-500">
                  This collects exactly the ₹{dueNow} currently due. It does not touch
                  the rest of the package — future sessions will be billed as they're
                  checked in.
                </div>
              )}

              <div className="mb-3">
                <label className="block font-medium text-slate-700 mb-1 text-sm">
                  Payment date & time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={paymentTime}
                  onChange={e => setPaymentTime(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-blue-100 text-sm"
                  max={new Date().toISOString().slice(0, 16)}
                />
                {paymentTimeMissing && (
                  <div className="text-xs text-red-500 mt-1">
                    Please select the date and time of payment.
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="block font-medium text-slate-700 mb-1 text-sm">
                  Payment method <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(["cash", "online"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      disabled={loading}
                      onClick={() => { setPaymentMethod(m); if (m === "cash") setUtr(""); }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                        paymentMethod === m
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {m === "cash" && <FiDollarSign className="inline mr-1" />}
                      {m === "online" && <FiSmartphone className="inline mr-1" />}
                      {m === "cash" ? "Cash" : "Online / UPI"}
                    </button>
                  ))}
                </div>
              </div>

              {needsUtr && (
                <div className="mb-3 bg-slate-50 border border-slate-200 rounded px-3 py-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UTR / transaction reference <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-blue-200 text-sm font-mono"
                    placeholder="e.g. SBIN00024981234"
                    maxLength={50}
                    required
                    disabled={loading}
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Visible on the bank / UPI app transaction receipt.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className={`mt-1 w-full rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 transition-colors ${
                  !canSubmit ? "bg-green-50 opacity-60 cursor-not-allowed" : "hover:bg-green-50"
                }`}
                disabled={!canSubmit}
              >
                {loading
                  ? "Processing…"
                  : collectType === "full"
                    ? `Collect ₹${dueNow} (due now)`
                    : "Collect amount"}
              </button>
              <div className="mt-1 text-xs text-slate-400 text-center">
                {!paymentMethod
                  ? "Select a payment method to continue."
                  : collectType === "partial"
                    ? "Amount beyond what's due goes to wallet."
                    : "Marks the current invoice as fully paid."}
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

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
            <div><b>Date:</b> {session?.date ? formatDateDDMMYYYY(session.date) : ''}</div>
            <div><b>Booking ID:</b> {booking?.appointmentId}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="text-xs px-3 py-1 rounded border border-green-500 text-green-700 font-semibold bg-green-100 hover:bg-green-200">Yes, Check In</button>
        </div>
      </div>
    </div>
  );
}

function MarkMissedConfirmationModal({ open, onClose, onConfirm, session, booking }: any) {
  if (!open) return null;
  return (
    <div className="fixed z-40 inset-0 flex items-center justify-center bg-black/20">
      <div className="bg-white rounded shadow-lg p-6 w-[95vw] max-w-xs relative">
        <div className="flex items-center gap-2 mb-3">
          <FiCheckCircle className="text-rose-500" size={24} />
          <div className="font-semibold text-rose-700 text-base">Mark Session as Missed?</div>
        </div>
        <div className="mb-4 text-sm">
          Are you sure you want to mark this session as <strong>Missed</strong>?
          <div className="mt-2 text-xs p-2 rounded bg-red-50 border border-red-100">
            <div><b>Date:</b> {session?.date ? formatDateDDMMYYYY(session.date) : ''}</div>
            <div><b>Booking ID:</b> {booking?.appointmentId}</div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="text-xs px-3 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="text-xs px-3 py-1 rounded border border-rose-500 text-rose-700 font-semibold bg-rose-100 hover:bg-rose-200">Yes, Mark Missed</button>
        </div>
      </div>
    </div>
  );
}

type BookingSummaryProps = {
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  setBookingsLoading: (v: boolean) => void;
  setBookingsError: (v: string | null) => void;
  getTherapistObject: (booking: Booking) => Therapist | undefined;
  editBookingId: string | null;
  handleEditBooking: (id: string) => void;
  /** Stores this booking in memory so the "Paste" button in the Booking Form
   *  can create a new booking for another month with the same details. */
  handleCopyBooking: (booking: Booking) => void;
  handleCollectPayment: (booking: Booking) => void;
  paymentLoadingBookingId: string | null;
};

function sessionStatusLabel(session: any) {
  if (session.status === "CheckedIn") {
    return { label: "Checked In", color: "green-700" };
  }
  if (session.status === "Missed") {
    return { label: "Missed", color: "gray-500" };
  }
  return { label: "Not Checked In", color: "red-600" };
}

export function BookingSummary({
  bookings, setBookings, setBookingsLoading, setBookingsError,
  getTherapistObject, editBookingId,
  handleEditBooking, handleCopyBooking,
}: BookingSummaryProps) {
  const [bookingsLoading, setLocalBookingsLoading] = useState(false);
  const [bookingsError, setLocalBookingsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTherapist, setFilterTherapist] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [therapistList, setTherapistList] = useState<Therapist[]>([]);

  const sessionTherapistOptions = useMemo(() => {
    const therapistMap: Map<string, Therapist> = new Map();
    bookings.forEach((booking: any) => {
      if (!Array.isArray(booking.sessions)) return;
      booking.sessions.forEach((session: any) => {
        const t = session.therapist;
        if (t && typeof t === "object" && t._id) {
          if (!therapistMap.has(t._id)) {
            therapistMap.set(t._id, t);
          }
        }
      });
    });
    return Array.from(therapistMap.values()).sort((a, b) => {
      const aName = (a.userId?.name || a.name || "").toLowerCase();
      const bName = (b.userId?.name || b.name || "").toLowerCase();
      if (aName < bName) return -1;
      if (aName > bName) return 1;
      return 0;
    });
  }, [bookings]);

  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectModalPayment, setCollectModalPayment] = useState<any>(null);

  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInSession, setCheckInSession] = useState<any>(null);
  const [checkInBooking, setCheckInBooking] = useState<any>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  const [missedModalOpen, setMissedModalOpen] = useState(false);
  const [missedSession, setMissedSession] = useState<any>(null);
  const [missedBooking, setMissedBooking] = useState<any>(null);
  const [missedLoading, setMissedLoading] = useState(false);
  const [missedError, setMissedError] = useState<string | null>(null);

  useEffect(() => {
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    fetch(`${endpoint}/api/admin/therapists?limit=100`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        setTherapistList(Array.isArray(data?.therapists) ? data.therapists : []);
      })
      .catch(() => setTherapistList([]));
  }, []);

  const normalize = (v: any) =>
    (typeof v === "string" ? v : v?.toString() ?? "")
      .toLowerCase()
      .trim();

  const filteredBookings = bookings
    .filter((booking: any) => {
      if (filterTherapist) {
        const therapistMatch =
          booking.therapist?._id === filterTherapist ||
          booking.therapistId === filterTherapist ||
          (Array.isArray(booking.sessions) &&
            booking.sessions.some(
              (session: any) =>
                session.therapist &&
                typeof session.therapist === "object" &&
                session.therapist._id === filterTherapist
            )
          );
        if (!therapistMatch) return false;
      }
      if (
        filterStatus &&
        normalize(booking.payment?.status) !== normalize(filterStatus)
      ) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = normalize(searchTerm);
        const patient = booking?.patient;
        const therapist = booking?.therapist || getTherapistObject(booking);
        const valuesToSearch = [
          booking.appointmentId,
          patient?.name,
          patient?._id,
          patient?.patientId,
          therapist?.name,
          therapist?._id,
          therapist?.therapistId,
          booking?.therapy?.name,
          booking?.package?.name || getPackageDisplay(booking.package),
          booking?.remark,
        ].filter(Boolean).map(normalize);
        if (!valuesToSearch.some((field) => field.includes(query))) {
          return false;
        }
      }
      return true;
    });

  const pagedBookings = filteredBookings.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize
  );
  const filteredTotal = filteredBookings.length;
  const filteredPages = Math.ceil(filteredTotal / pageSize);

  const totalSessionCount = pagedBookings && Array.isArray(pagedBookings)
    ? pagedBookings.reduce((acc, b) => acc + (Array.isArray(b.sessions) ? b.sessions.length : 0), 0)
    : 0;

  useEffect(() => {
    if (page > filteredPages && filteredPages > 0) {
      setPage(1);
    }
  }, [searchTerm, filterTherapist, filterStatus, filteredPages]);

  function fetchBookings() {
    setLocalBookingsLoading(true);
    setBookingsLoading(true);
    setLocalBookingsError(null);
    setBookingsError(null);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    const params = new URLSearchParams();
    params.append("page", "1");
    params.append("pageSize", "10000");
    fetch(`${endpoint}/api/admin/bookings?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Could not fetch bookings.");
        const data = await res.json();
        setBookings(data?.bookings || []);
        setLocalBookingsLoading(false);
        setBookingsLoading(false);
      })
      .catch(() => {
        setLocalBookingsError("Error loading bookings.");
        setBookingsError("Error loading bookings.");
        setLocalBookingsLoading(false);
        setBookingsLoading(false);
      });
  }
  useEffect(() => { fetchBookings(); }, []);

  const handleModalCollectPayment = (booking: any) => {
    let discountPercent = 0;
    if (booking.discountInfo && booking.discountInfo.coupon && booking.discountInfo.coupon.discountEnabled) {
      discountPercent = Number(booking.discountInfo.coupon.discount) || 0;
    }
    const checkedInCount = Array.isArray(booking.sessions)
      ? booking.sessions.filter((s: any) => s.status === "CheckedIn").length
      : 0;
    const totalSessions = Array.isArray(booking.sessions) ? booking.sessions.length : 0;

    setCollectModalOpen(true);
    setCollectModalPayment({
      _id: booking._id,
      appointmentId: booking.appointmentId,
      patientName: booking.patient?.name || "",
      patientId: booking.patient?._id || "",
      invoiceAmount: booking.invoiceAmount ?? 0,
      amountPaid: booking.payment?.amountPaid ?? 0,
      paymentRecordId: booking.payment?._id,
      discountPercent,
      checkedInCount,
      totalSessions,
      walletBalance: booking.wallet?.balance ?? 0,
    });
  };

  const handleModalCollected = () => {
    setCollectModalOpen(false);
    setCollectModalPayment(null);
    fetchBookings();
  };

  const openCheckInModal = (booking: any, session: any) => {
    setCheckInBooking(booking); setCheckInSession(session);
    setCheckInError(null); setCheckInModalOpen(true);
  };
  const closeCheckInModal = () => {
    setCheckInBooking(null); setCheckInSession(null);
    setCheckInError(null); setCheckInModalOpen(false);
  };

  const handleConfirmCheckIn = async () => {
    if (!checkInBooking || !checkInSession) return;
    setCheckInLoading(true); setCheckInError(null);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    try {
      const res = await fetch(`${endpoint}/api/admin/bookings/check-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("admin-token") || ""}`,
        },
        body: JSON.stringify({ bookingId: checkInBooking._id, sessionId: checkInSession._id }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || "Failed to check in session."); }
      closeCheckInModal(); setCheckInLoading(false); fetchBookings();
    } catch (err: any) {
      setCheckInError(err.message || "Unable to check in.");
      setCheckInLoading(false);
    }
  };

  const openMissedModal = (booking: any, session: any) => {
    setMissedBooking(booking);
    setMissedSession(session);
    setMissedError(null);
    setMissedModalOpen(true);
  };
  const closeMissedModal = () => {
    setMissedBooking(null); setMissedSession(null);
    setMissedError(null); setMissedModalOpen(false);
  };

  const handleConfirmMissed = async () => {
    if (!missedBooking || !missedSession) return;
    setMissedLoading(true); setMissedError(null);
    let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
    if (endpoint) endpoint = endpoint.replace(/\/$/, "");
    try {
      const res = await fetch(`${endpoint}/api/admin/bookings/mark-session-missed`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${localStorage.getItem("admin-token") || ""}`,
        },
        body: JSON.stringify({ bookingId: missedBooking._id, sessionId: missedSession._id }),
      });
      if (!res.ok) { const t = await res.text(); throw new Error(t || "Failed to mark session as missed."); }
      closeMissedModal(); setMissedLoading(false); fetchBookings();
    } catch (err: any) {
      setMissedError(err.message || "Unable to mark as missed.");
      setMissedLoading(false);
    }
  };

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };
  const onSearchFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const resetFilters = () => {
    setSearchTerm("");
    setFilterTherapist("");
    setFilterStatus("");
    setPage(1);
  };

  function getSessionStatusUI(session: any) {
    const status = sessionStatusLabel(session);
    return <span className={`text-${status.color} font-semibold`}>{status.label}</span>;
  }

  return (
    <div className="mt-6">
      <CollectPaymentModal
        open={collectModalOpen}
        onClose={() => { setCollectModalOpen(false); setCollectModalPayment(null); }}
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
      <MarkMissedConfirmationModal
        open={missedModalOpen}
        onClose={closeMissedModal}
        onConfirm={handleConfirmMissed}
        session={missedSession}
        booking={missedBooking}
      />

      <div className="bg-white border rounded-lg p-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="font-medium">Booking Summary</p>
          <div className="bg-blue-50 border border-blue-100 rounded px-3 py-1 text-xs text-blue-800 font-semibold shadow-sm">
            Total Selected Sessions: <span className="ml-1 text-blue-900 font-extrabold">{totalSessionCount}</span>
          </div>
        </div>

        <form onSubmit={onSearchFormSubmit} className="flex flex-wrap items-center gap-3 mb-4">
          <div className="relative w-1/2">
            <input
              value={searchTerm}
              onChange={onSearchInputChange}
              className="border px-2 pl-8 py-1 rounded w-full text-xs focus:ring-blue-200 focus:ring"
              placeholder="Search by Booking ID, Patient, Therapist, etc."
              type="search"
              autoComplete="off"
            />
            <FiSearch className="absolute left-2 top-2 text-slate-400" size={16} />
          </div>
          <div>
            <select
              className="border px-2 py-1 rounded text-xs min-w-[160px]"
              value={filterTherapist}
              onChange={e => { setFilterTherapist(e.target.value); setPage(1); }}
            >
              <option value="">All Therapists</option>
              {sessionTherapistOptions.map((t) =>
                <option key={t._id} value={t._id}>
                  {(t.userId?.name || t.name) ?? ""}
                  {t.therapistId ? ` (${t.therapistId})` : ""}
                </option>
              )}
              {therapistList
                .filter(
                  masterT =>
                    !sessionTherapistOptions.find(sessionT => sessionT._id === masterT._id)
                )
                .map((t) =>
                  <option key={t._id} value={t._id}>
                    {(t.name || t.userId?.name) ?? ""}
                    {t.therapistId ? ` (${t.therapistId})` : ""}
                  </option>
                )
              }
            </select>
          </div>
          <div>
            <select
              className="border px-2 py-1 rounded text-xs"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="partiallypaid">Partially Paid</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <button
            type="button"
            className="text-xs rounded px-2 py-1 border border-slate-300 text-slate-500 bg-slate-50 hover:bg-slate-100"
            onClick={resetFilters}
            disabled={
              !searchTerm && !filterTherapist && !filterStatus
            }>
            Reset
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between py-2">
          <span className="text-xs text-slate-500">Total: <b>{filteredTotal}</b></span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border text-xs px-1 py-0.5 rounded"
            >
              {PAGE_SIZE_OPTIONS.map((opt) => <option value={opt} key={opt}>{opt}</option>)}
            </select>
            <button className="px-2 py-1 text-xs border rounded border-slate-300" disabled={page === 1 || bookingsLoading} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
            <span className="text-xs">{page} / {Math.max(filteredPages, 1)}</span>
            <button className="px-2 py-1 text-xs border rounded border-slate-300" disabled={page >= filteredPages || bookingsLoading} onClick={() => setPage((p) => Math.min(filteredPages, p + 1))}>Next</button>
          </div>
        </div>

        {bookingsLoading ? (
          <div className="text-center py-12 text-slate-400 text-base">Loading bookings…</div>
        ) : bookingsError ? (
          <div className="text-red-600 p-3">{bookingsError}</div>
        ) : !pagedBookings || pagedBookings.length === 0 ? (
          <p className="text-slate-500 mb-3">No bookings found.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {pagedBookings.map((booking: any) => {
              const therapistObj = getTherapistObject(booking);
              const paymentStatus = booking.payment?.status;
              const isPaid = paymentStatus === "paid";
              const isPartiallyPaid = paymentStatus === "partiallypaid";

              const invoiceAmount = booking.invoiceAmount ?? 0;
              const paidAmount = booking.payment?.amountPaid ?? 0;
              const dueNow = Math.max(0, invoiceAmount - paidAmount);
              const walletBalance = booking.wallet?.balance ?? 0;

              const checkedInCount = Array.isArray(booking.sessions)
                ? booking.sessions.filter((s: any) => s.status === "CheckedIn").length
                : 0;
              const totalSessions = Array.isArray(booking.sessions) ? booking.sessions.length : 0;

              let discountPercent = 0;
              if (booking.discountInfo && booking.discountInfo.coupon && booking.discountInfo.coupon.discountEnabled) {
                discountPercent = Number(booking.discountInfo.coupon.discount) || 0;
              }

              return (
                <div
                  key={booking._id}
                  className={`border p-3 rounded bg-sky-50 relative ${editBookingId === booking._id ? "ring ring-blue-400 ring-offset-2" : ""}`}
                >
                  {booking.appointmentId && (
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-700">
                        <FiHash className="text-blue-500" /> Booking ID: {booking.appointmentId}
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                        <FiPocket size={12} /> Wallet: ₹{walletBalance}
                      </div>
                    </div>
                  )}
                  {therapistObj && (
                    <div className="mb-2 flex items-center gap-2">
                      <FiUser className="text-slate-500" />
                      <span className="text-slate-700">
                        Therapist: {therapistObj.name}
                        {therapistObj.therapistId ? (
                          <>{" ("}<a href={`/admin/therapists?therapistId=${encodeURIComponent(therapistObj._id)}`} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>{therapistObj.therapistId}</a>{")"}</>
                        ) : ""}
                      </span>
                    </div>
                  )}
                  <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    {booking.patient?._id ? (
                      <a href={`/admin/children?patientId=${encodeURIComponent(booking.patient._id)}`} className="text-blue-700 hover:underline" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        {getPatientDisplayName(booking.patient)}
                      </a>
                    ) : getPatientDisplayName(booking.patient)}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FiTag className="text-slate-500" />
                    <span className="text-slate-700">{booking.therapy?.name}</span>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FiPackage className="text-purple-500" />
                    <span className="text-purple-700">{getPackageDisplay(booking.package)}</span>
                  </div>
                  {booking.remark && (
                    <div className="mb-2 text-xs text-slate-700 flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Remark:</span>
                      <span className="italic text-slate-800">{booking.remark}</span>
                    </div>
                  )}

                  <div className="mb-2 px-2 py-2 rounded bg-sky-100 border border-sky-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold text-blue-900">
                      <span>Sessions checked in</span>
                      <span className="font-mono">{checkedInCount} / {totalSessions}</span>
                    </div>
                    {discountPercent > 0 && (
                      <div className="flex items-center justify-between text-green-700 font-semibold">
                        <span>
                          Discount ({discountPercent}%)
                          {booking.discountInfo?.coupon?.couponCode && (
                            <span className="ml-2 bg-green-100 px-2 py-0.5 rounded text-green-800 font-mono">
                              Code: {booking.discountInfo.coupon.couponCode}
                            </span>
                          )}
                        </span>
                        <span className="text-green-800">already included below</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-blue-900 font-semibold">
                      <span>Current invoice amount</span>
                      <span className="font-mono">₹{invoiceAmount}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700">
                      <span>Paid so far</span>
                      <span className="font-mono">₹{paidAmount}</span>
                    </div>
                    <div className="flex items-center justify-between text-rose-700 font-semibold border-t border-sky-200 pt-1 mt-1">
                      <span>Due now</span>
                      <span className="font-mono">₹{dueNow}</span>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <FiCreditCard className="text-green-600" />
                    {isPaid ? (
                      <span className="text-green-700 font-semibold">Paid up to current invoice</span>
                    ) : isPartiallyPaid ? (
                      <span className="text-amber-700 font-semibold">Partially Paid</span>
                    ) : (
                      <span className="text-orange-600 font-semibold">Payment Pending</span>
                    )}
                    {dueNow > 0 && (
                      <button
                        className="ml-3 flex items-center gap-1 text-xs border px-2 py-1 rounded border-green-400 text-green-800 bg-green-100 hover:bg-green-200 font-medium transition"
                        onClick={() => handleModalCollectPayment(booking)}
                        title="Collect payment"
                      >
                        <FiCreditCard /> Collect Payment
                      </button>
                    )}
                    {dueNow <= 0 && (
                      <button
                        className="ml-3 flex items-center gap-1 text-xs border px-2 py-1 rounded border-emerald-400 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 font-medium transition"
                        onClick={() => handleModalCollectPayment(booking)}
                        title="Collect an advance payment for future sessions"
                      >
                        <FiPocket /> Collect Advance
                      </button>
                    )}
                  </div>

                  {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
                    <details className="mb-2 text-xs text-slate-700">
                      <summary className="font-medium cursor-pointer select-none flex items-center">
                        <span>Sessions ({booking.sessions.length})</span>
                        <FiChevronDown className="inline ml-1 text-slate-500" />
                      </summary>
                      <div className="overflow-x-auto mt-2">
                        {checkInError && checkInBooking?._id === booking._id && (
                          <div className="text-xs text-red-600 mb-2">{checkInError}</div>
                        )}
                        {missedError && missedBooking?._id === booking._id && (
                          <div className="text-xs text-red-600 mb-2">{missedError}</div>
                        )}
                        <table className="min-w-[900px] w-full border-collapse text-xs">
                          <thead>
                            <tr>
                              {["#", "Session ID", "Date", "Time Slot", "Therapist", "Therapy Type", "Status", "Actions"].map((h) => (
                                <th key={h} className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {booking.sessions.map((s: any, idx: number) => {
                              const slot = SESSION_TIME_OPTIONS.find((opt) => opt.id === s.slotId);
                              const tObj = s.therapist;
                              const therapy =
                                s.therapyTypeId && typeof s.therapyTypeId === "object"
                                  ? s.therapyTypeId
                                  : typeof s.therapyType === "string" ? s.therapyType : undefined;

                              const status = sessionStatusLabel(s);
                              const isCheckedIn = status.label === "Checked In";
                              const isMissed = status.label === "Missed";

                              return (
                                <tr key={s._id || s.date + "-" + idx}>
                                  <td className="px-2 py-1 border border-slate-200 text-slate-400">{idx + 1}</td>
                                  <td className="px-2 py-1 border border-slate-200 font-mono text-xs text-slate-600">{s.sessionId || s._id || <span className="text-gray-400">—</span>}</td>
                                  <td className="px-2 py-1 border border-slate-200">{s.date ? formatDateDDMMYYYY(s.date) : ''}</td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {slot ? <>{slot.label}{slot.limited && <span className="text-amber-700 ml-1">(Limited case)</span>}</> : s.slotId}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {tObj ? <>{tObj.userId?.name || tObj.name}{tObj.therapistId ? ` (${tObj.therapistId})` : ""}</> : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {typeof therapy === "object" && therapy && "name" in therapy
                                      ? therapy.name : typeof therapy === "string" ? therapy
                                      : <span className="text-gray-400">—</span>}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {getSessionStatusUI(s)}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-right flex gap-2">
                                    {!isCheckedIn && !isMissed && (
                                      <>
                                        <button
                                          className={`text-xs rounded px-2 py-1 border  border-green-500 text-green-700 hover:bg-green-50 flex items-center gap-1 ${checkInLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                                          disabled={checkInLoading}
                                          onClick={() => openCheckInModal(booking, s)}
                                        >
                                          <FiCheckCircle /> Mark Session Completed
                                        </button>
                                        <button
                                          className={`ml-2 text-xs rounded px-2 py-1 border border-rose-400 text-rose-700 hover:bg-rose-50 flex items-center gap-1 ${missedLoading ? "opacity-60 cursor-not-allowed" : ""}`}
                                          disabled={missedLoading}
                                          onClick={() => openMissedModal(booking, s)}
                                        >
                                          <FiX /> Mark Missed
                                        </button>
                                      </>
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

                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      onClick={() => handleEditBooking(booking._id)}
                      disabled={!!editBookingId && editBookingId !== booking._id}
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button
                      className="text-xs rounded px-2 py-1 border border-purple-400 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                      onClick={() => handleCopyBooking(booking)}
                      title="Copy this booking's details so you can paste them into a new booking for another month"
                    >
                      <FiCopy /> Copy
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