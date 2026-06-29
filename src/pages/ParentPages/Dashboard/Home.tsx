// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   FiUsers,
//   FiCalendar,
//   FiAlertCircle,
// } from "react-icons/fi";

// const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// const SESSION_TIME_OPTIONS = [
//   { id: "1000-1045", label: "10:00 to 10:45", limited: false },
//   { id: "1045-1130", label: "10:45 to 11:30", limited: false },
//   { id: "1130-1215", label: "11:30 to 12:15", limited: false },
//   { id: "1215-1300", label: "12:15 to 13:00", limited: false },
//   { id: "1300-1345", label: "13:00 to 13:45", limited: false },
//   { id: "1415-1500", label: "14:15 to 15:00", limited: false },
//   { id: "1500-1545", label: "15:00 to 15:45", limited: false },
//   { id: "1545-1630", label: "15:45 to 16:30", limited: false },
//   { id: "1630-1715", label: "16:30 to 17:15", limited: false },
//   { id: "1715-1800", label: "17:15 to 18:00", limited: false },
//   { id: "0830-0915", label: "08:30 to 09:15", limited: true },
//   { id: "0915-1000", label: "09:15 to 10:00", limited: true },
//   { id: "1800-1845", label: "18:00 to 18:45", limited: true },
//   { id: "1845-1930", label: "18:45 to 19:30", limited: true },
//   { id: "1930-2015", label: "19:30 to 20:15", limited: true },
// ];

// // Interface for each payment detail coming from backend
// interface PaymentDetail {
//   InvoiceId: string;
//   date: string;
//   childrenName: string;
//   childrenId: string;
//   amount: number;
//   status: string;
// }

// interface UncheckedSessionTherapist {
//   therapistId: string;
//   userId: {
//     name: string;
//   };
//   [key: string]: any;
// }

// interface UncheckedSession {

//   childrenId:string;
//   name: string;
//   notCheckedInSession: {
//     date: string;
//     slotId: string;
//     therapist: UncheckedSessionTherapist | string | null;
//     _id: string; // this is currently used as the sessionId
//     sessionId: string;
//     isCheckedIn?: boolean;
//     [key: string]: any;
//   };
// }

// // New: ConsultationBooking interfaces
// interface ConsultationBookingClient {
//   _id: string;
//   userId: {
//     _id: string;
//     name: string;
//   };
//   name: string;
//   patientId: string;
// }

// interface ConsultationBookingTherapy {
//   _id: string;
//   name: string;
// }

// interface ConsultationBooking {
//   _id: string;
//   consultationAppointmentId: string;
//   client: ConsultationBookingClient;
//   therapy: ConsultationBookingTherapy;
//   scheduledAt: string;
//   time: string;
//   durationMinutes: number;
//   sessionType: string;
//   status: string;
//   remark?: string;
//   createdAt: string;
//   updatedAt: string;
//   __v: number;
// }

// interface DashboardApiData {
//   childrenCount: number;
//   totalAppointments: number;
//   pendingPayments: PaymentDetail[];
//   uncheckedSessions: UncheckedSession[];
//   consultationBookings?: ConsultationBooking[]; // Add this as optional for backward compatibility
// }

// function getSlotLabel(slotId: string): string {
//   const found = SESSION_TIME_OPTIONS.find((s) => s.id === slotId);
//   return found ? found.label : slotId;
// }

// const getTherapistName = (
//   therapist: UncheckedSessionTherapist | string | null
// ): string => {
//   if (!therapist) return "-";
//   if (typeof therapist === "string") return therapist;
//   if (
//     typeof therapist.userId === "object" &&
//     typeof therapist.userId.name === "string"
//   ) {
//     return therapist.userId.name;
//   }
//   return therapist.therapistId || "-";
// };

// const getTherapistId = (
//   therapist: UncheckedSessionTherapist | string | null
// ): string => {
//   if (!therapist) return "-";
//   if (typeof therapist === "string") return therapist;
//   return therapist.therapistId || "-";
// };

// const ParentDashboard: React.FC = () => {
//   const [dashboard, setDashboard] = useState<DashboardApiData | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // For compatibility with structure, alias pendingPayments
//   const pendingPayments: PaymentDetail[] = dashboard?.pendingPayments ?? [];
//   const uncheckedSessionsRaw: UncheckedSession[] =
//     dashboard?.uncheckedSessions ?? [];

//   // Show consultation bookings if present
//   const consultationBookings: ConsultationBooking[] =
//     dashboard?.consultationBookings ?? [];

//   // Sort unchecked sessions by date (oldest first)
//   const uncheckedSessions: UncheckedSession[] = [...uncheckedSessionsRaw].sort(
//     (a, b) => {
//       const dateA = a.notCheckedInSession.date
//         ? new Date(a.notCheckedInSession.date).getTime()
//         : 0;
//       const dateB = b.notCheckedInSession.date
//         ? new Date(b.notCheckedInSession.date).getTime()
//         : 0;
//       return dateA - dateB;
//     }
//   );

//   // Sort consultation bookings as well (if any, by scheduledAt desc)
//   const sortedConsultationBookings: ConsultationBooking[] = [...consultationBookings].sort(
//     (a, b) => {
//       const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
//       const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
//       return dateB - dateA; // Latest first
//     }
//   );

//   useEffect(() => {
//     const fetchDashboard = async () => {
//       try {
//         const token = localStorage.getItem("patient-token");
//         const res = await axios.get(`${API_BASE_URL}/api/parent/dashboard`, {
//           headers: {
//             Authorization: token ? `${token}` : "",
//           },
//         });
//         setDashboard(res.data.data);
//         console.log(res.data.data);
//       } catch (err: any) {
//         setError(
//           err?.response?.data?.message ||
//             err?.message ||
//             "Failed to load dashboard"
//         );
//       }
//       setLoading(false);
//     };
//     fetchDashboard();
//   }, []);

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[300px]">
//         <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
//       </div>
//     );
//   }

//   if (error || !dashboard) {
//     return (
//       <div className="text-center text-red-500 py-10">
//         {error || "No dashboard data"}
//       </div>
//     );
//   }

//   // Calculate due payment amount based on pending payments
//   const pendingAmount = pendingPayments.reduce(
//     (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
//     0
//   );

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-6">
//       {/* Top Stats */}
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
//         {/* TOTAL */}
//         <StatCard
//           title="TOTAL"
//           value={dashboard.childrenCount}
//           subtitle="Registered Children"
//           icon={<FiUsers />}
//           color="blue"
//         />

//         {/* Total Appointments */}
//         <StatCard
//           title="Total Appointments"
//           value={dashboard.totalAppointments}
//           subtitle="Scheduled Appointments"
//           icon={<FiCalendar />}
//           color="purple"
//         />

//         {/* DUE PAYMENT */}
//         <StatCard
//           title="DUE PAYMENT"
//           value={`₹${pendingAmount}`}
//           subtitle={`${pendingPayments.length} Pending Invoices`}
//           icon={<FiAlertCircle />}
//           color="red"
//         />
//       </div>
//       {/* Pending Payments */}
//       <div className="bg-white rounded-xl border p-6 mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-800">
//             Pending Payments
//           </h2>
//           <button className="text-blue-600 text-sm font-medium hover:underline">
//             View All
//           </button>
//         </div>
//         {/* Pending payments table or fallback text */}
//         {pendingPayments.length === 0 ? (
//           <div className="h-40 flex items-center justify-center text-gray-400">
//             No pending payments.
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr>
//                   <th className="px-3 py-2 text-left">Invoice ID</th>
//                   <th className="px-3 py-2 text-left">Date</th>
//                   <th className="px-3 py-2 text-left">Children Name</th>
//                   <th className="px-3 py-2 text-left">Children ID</th>
//                   <th className="px-3 py-2 text-right">Amount</th>
//                   <th className="px-3 py-2 text-left">Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {pendingPayments.map((payment, idx) => (
//                   <tr key={idx} className="border-t">
//                     <td className="px-3 py-2 font-mono">{payment.InvoiceId}</td>
//                     <td className="px-3 py-2">
//                       {payment.date
//                         ? new Date(payment.date).toLocaleDateString("en-GB")
//                         : "-"}
//                     </td>
//                     <td className="px-3 py-2">
//                       {payment.childrenName}
//                     </td>
//                     <td className="px-3 py-2">
//                       {payment.childrenId}
//                     </td>
//                     <td className="px-3 py-2 text-right">
//                       ₹{Number(payment.amount).toLocaleString("en-IN")}
//                     </td>
//                     <td className="px-3 py-2">
//                       {payment.status ? payment.status.charAt(0).toUpperCase() + payment.status.slice(1) : "-"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Consultation Bookings Section */}
//       <div className="bg-white rounded-xl border p-6 mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-800">
//             Consultation Bookings
//           </h2>
//           {/* Optionally link to full consultations list */}
//         </div>
//         {sortedConsultationBookings.length === 0 ? (
//           <div className="h-40 flex items-center justify-center text-gray-400">
//             No consultation bookings found.
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr>
//                   <th className="px-3 py-2 text-left">Booking ID</th>
//                   <th className="px-3 py-2 text-left">Date/Time</th>
//                   <th className="px-3 py-2 text-left">Children</th>
//                   <th className="px-3 py-2 text-left">Therapy</th>
//                   <th className="px-3 py-2 text-left">Session Type</th>
//                   <th className="px-3 py-2 text-left">Status</th>
//                   <th className="px-3 py-2 text-left">Remark</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {sortedConsultationBookings.map((consultation) => (
//                   <tr key={consultation._id} className="border-t">
//                     <td className="px-3 py-2 font-mono">
//                       {consultation.consultationAppointmentId}
//                     </td>
//                     <td className="px-3 py-2">
//                       {consultation.scheduledAt
//                         ? new Date(consultation.scheduledAt).toLocaleString("en-GB", {
//                             day: "2-digit",
//                             month: "2-digit",
//                             year: "numeric",
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })
//                         : "-"}
//                     </td>
//                     <td className="px-3 py-2">
//                       {consultation.client?.name} ({consultation.client?.patientId})<br />
//                       <span className="text-xs text-gray-400">{consultation.client?.userId?.name}</span>
//                     </td>
//                     <td className="px-3 py-2">
//                       {consultation.therapy?.name || "-"}
//                     </td>
//                     <td className="px-3 py-2">
//                       {consultation.sessionType}
//                     </td>
//                     <td className="px-3 py-2">
//                       {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
//                     </td>
//                     <td className="px-3 py-2">
//                       {consultation.remark || "-"}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Upcoming/Unchecked Sessions */}
//       <div className="bg-white rounded-xl border p-6 mb-8">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-lg font-semibold text-gray-800">
//             Upcomming Sessions
//           </h2>
//           {/* <button className="text-blue-600 text-sm font-medium hover:underline">
//             View All
//           </button> */}
//         </div>
//         {uncheckedSessions.length === 0 ? (
//           <div className="h-40 flex items-center justify-center text-gray-400">
//             No unchecked sessions.
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full text-sm">
//               <thead>
//                 <tr>
//                   <th className="px-3 py-2 text-left">Session ID</th>
//                   <th className="px-3 py-2 text-left">Date</th>
//                   <th className="px-3 py-2 text-left">Time Slot</th>
//                   <th className="px-3 py-2 text-left">Children</th>
//                   <th className="px-3 py-2 text-left">Therapist</th>
//                   {/* <th className="px-3 py-2 text-center">Checked In</th> */}
//                 </tr>
//               </thead>
//               <tbody>
//                 {uncheckedSessions.map((session, idx) => (
//                   <tr key={session.notCheckedInSession._id || idx} className="border-t">
//                     {/* Show sessionId (from notCheckedInSession._id) */}
//                     <td className="px-3 py-2 font-mono">
//                       {session.notCheckedInSession.sessionId || "-"}
//                     </td>
//                     <td className="px-3 py-2">
//                       {session.notCheckedInSession.date
//                         ? new Date(
//                             session.notCheckedInSession.date
//                           ).toLocaleDateString("en-GB")
//                         : "-"}
//                     </td>
//                     <td className="px-3 py-2">
//                       {getSlotLabel(session.notCheckedInSession.slotId)}
//                     </td>
//                     <td className="px-3 py-2">
//                       {session.name ? session.name : "-"} ({session.childrenId})
//                     </td>
//                     <td className="px-3 py-2">
//                       {getTherapistName(session.notCheckedInSession.therapist)} ({getTherapistId(session.notCheckedInSession.therapist)})
//                     </td>
//                     {/* <td className="px-3 py-2 text-center">
//                       {session.notCheckedInSession.isCheckedIn ? (
//                         <span className="text-green-600 flex items-center gap-1">
//                           <FiCheckCircle className="inline" /> Yes
//                         </span>
//                       ) : (
//                         <span className="text-gray-400">No</span>
//                       )}
//                     </td> */}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* Bottom Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         {/* [ Optionally place additional dashboard widgets here ] */}
//       </div>
//     </div>
//   );
// };

// export default ParentDashboard;

// /* ---------- Small Reusable Card ---------- */

// const StatCard = ({
//   title,
//   value,
//   subtitle,
//   icon,
//   color,
// }: {
//   title: string;
//   value: any;
//   subtitle: string;
//   icon: React.ReactNode;
//   color: "blue" | "purple" | "green" | "red";
// }) => {
//   const colorMap: any = {
//     blue: "bg-blue-100 text-blue-600",
//     purple: "bg-purple-100 text-purple-600",
//     green: "bg-green-100 text-green-600",
//     red: "bg-red-100 text-red-600",
//   };

//   return (
//     <div className="bg-white rounded-xl border p-6">
//       <div className="flex justify-between items-start">
//         <div>
//           <p className="text-xs font-semibold text-gray-400 mb-2">
//             {title}
//           </p>
//           <h3 className="text-3xl font-bold text-gray-800">
//             {value}
//           </h3>
//           <p className="text-sm text-gray-500 mt-1">
//             {subtitle}
//           </p>
//         </div>

//         <div
//           className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[color]}`}
//         >
//           {icon}
//         </div>
//       </div>
//     </div>
//   );
// };

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiCalendar,
  FiAlertCircle,
  FiX,
  FiArrowRight,
  FiCreditCard,
  FiAlertTriangle,
  FiExternalLink,
} from "react-icons/fi";
import { load } from "@cashfreepayments/cashfree-js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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
  { id: "0830-0915", label: "08:30 to 09:15", limited: true },
  { id: "0915-1000", label: "09:15 to 10:00", limited: true },
  { id: "1800-1845", label: "18:00 to 18:45", limited: true },
  { id: "1845-1930", label: "18:45 to 19:30", limited: true },
  { id: "1930-2015", label: "19:30 to 20:15", limited: true },
];

interface PaymentDetail {
  InvoiceId: string;
  date: string;
  childrenName: string;
  childrenId: string;
  amount: number;
  status: string;
  invoiceAmount?: number;
  originalInvoiceAmount?: number;
  dueAmount?: number;
  discount?: { discountEnabled: boolean; discount: number };
  paymentDetail?: {
    amountPaid?: number;
    discountInfo?: { percent: number; amount: number };
    paymentMethod?: string;
    cashfree?: { order_id?: string; cf_order_id?: string; payment_session_id?: string };
  };
  sequence?: number;
}

interface UncheckedSessionTherapist {
  therapistId: string;
  userId: { name: string };
  [key: string]: any;
}

interface UncheckedSession {
  childrenId: string;
  name: string;
  notCheckedInSession: {
    date: string;
    slotId: string;
    therapist: UncheckedSessionTherapist | string | null;
    _id: string;
    sessionId: string;
    isCheckedIn?: boolean;
    [key: string]: any;
  };
}

interface ConsultationBookingClient {
  _id: string;
  userId: { _id: string; name: string };
  name: string;
  patientId: string;
}

interface ConsultationBooking {
  _id: string;
  consultationAppointmentId: string;
  client: ConsultationBookingClient;
  therapy: { _id: string; name: string };
  scheduledAt: string;
  time: string;
  durationMinutes: number;
  sessionType: string;
  status: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DashboardApiData {
  childrenCount: number;
  totalAppointments: number;
  pendingPayments: PaymentDetail[];
  uncheckedSessions: UncheckedSession[];
  consultationBookings?: ConsultationBooking[];
}

// ─── helpers ───────────────────────────────────────────────────────────────

function getSlotLabel(slotId: string): string {
  return SESSION_TIME_OPTIONS.find((s) => s.id === slotId)?.label ?? slotId;
}

function getTherapistName(t: UncheckedSessionTherapist | string | null): string {
  if (!t) return "-";
  if (typeof t === "string") return t;
  return typeof t.userId?.name === "string" ? t.userId.name : t.therapistId || "-";
}

function getTherapistId(t: UncheckedSessionTherapist | string | null): string {
  if (!t) return "-";
  if (typeof t === "string") return t;
  return t.therapistId || "-";
}

function getDiscountPercent(p: PaymentDetail): number {
  if (p.discount?.discountEnabled) return p.discount.discount;
  if (p.paymentDetail?.discountInfo?.percent) return p.paymentDetail.discountInfo.percent;
  return 0;
}

function getAmountPaid(p: PaymentDetail): number {
  return typeof p.paymentDetail?.amountPaid === "number" ? p.paymentDetail.amountPaid : 0;
}

function calculateDueAmount(p: PaymentDetail): number {
  const amount =
    typeof p.invoiceAmount === "number"
      ? p.invoiceAmount
      : typeof p.originalInvoiceAmount === "number"
      ? p.originalInvoiceAmount
      : typeof p.amount === "number"
      ? p.amount
      : 0;
  const paid = getAmountPaid(p);
  const pct = getDiscountPercent(p);
  const disc = Math.min((amount * pct) / 100, amount);
  return Math.max(amount - disc - paid, 0);
}

function inrFormat(n: number) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function fmtDate(str?: string) {
  if (!str) return "-";
  const d = new Date(str);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-GB");
}

// ─── Main component ─────────────────────────────────────────────────────────

const ParentDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Popup state
  const [showPopup, setShowPopup] = useState(false);
  const popupShownRef = useRef(false);

  // Cashfree + payment in-progress
  const [cashfree, setCashfree] = useState<any>(null);
  const [payingId, setPayingId] = useState<string | null>(null);

  const pendingPayments: PaymentDetail[] = dashboard?.pendingPayments ?? [];
  const uncheckedSessions: UncheckedSession[] = [...(dashboard?.uncheckedSessions ?? [])].sort(
    (a, b) =>
      new Date(a.notCheckedInSession.date || 0).getTime() -
      new Date(b.notCheckedInSession.date || 0).getTime()
  );
  const sortedConsultationBookings: ConsultationBooking[] = [
    ...(dashboard?.consultationBookings ?? []),
  ].sort(
    (a, b) =>
      new Date(b.scheduledAt || 0).getTime() - new Date(a.scheduledAt || 0).getTime()
  );

  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
    0
  );

  // Init Cashfree
  useEffect(() => {
    load({ mode: "production" }).then(setCashfree);
  }, []);

  // Fetch dashboard
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("patient-token");
        const res = await axios.get(`${API_BASE_URL}/api/parent/dashboard`, {
          headers: { Authorization: token ?? "" },
        });
        setDashboard(res.data.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || "Failed to load dashboard");
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  // Show popup once per visit when pending payments exist
  useEffect(() => {
    if (!popupShownRef.current && !loading && pendingPayments.length > 0) {
      setShowPopup(true);
      popupShownRef.current = true;
    }
  }, [loading, pendingPayments.length]);

  // ── Payment helpers ──────────────────────────────────────────────────────

  const getSessionId = async (
    paymentId: string,
    name: string,
    amount: number
  ) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/cashfree/generate-session-id`,
        { paymentId, name, email: "parent@email.com", phone: "9999999999", amount },
        { headers: { "Content-Type": "application/json" } }
      );
      if (res.status === 200) {
        const d = res.data;
        return {
          sessionId: d.payment_session_id,
          orderId: d.order_id,
        };
      }
      return null;
    } catch {
      return null;
    }
  };

  const handlePayment = async (payment: PaymentDetail) => {
    setPayingId(payment.InvoiceId);
    try {
      const due = calculateDueAmount(payment);
      if (due < 1) { alert("Nothing due for this invoice."); setPayingId(null); return; }
      const sessionData = await getSessionId(payment.InvoiceId, payment.childrenName, due);
      if (!cashfree || !sessionData?.sessionId) { setPayingId(null); return; }
      await cashfree.checkout({
        paymentSessionId: sessionData.sessionId,
        returnUrl: `${window.location.origin}/parent/payment-confirmation?orderId=${sessionData.orderId}`,
        notifyUrl: `${API_BASE_URL}/cashfreeWebhook`,
      });
    } catch (e) { console.error(e); }
    setPayingId(null);
  };

  const goToInvoicePage = () => {
    window.location.href = "/parent/invoices-payments";
  };

  // ── Render guards ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return <div className="text-center text-red-500 py-10">{error || "No dashboard data"}</div>;
  }

  // ── JSX ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Pending Payment Popup ── */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(2px)" }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              {/* Popup header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-amber-50">
                <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <FiAlertTriangle className="text-amber-600" size={18} />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-gray-800 text-base">Pending Payments</h2>
                  <p className="text-xs text-amber-700">
                    You have {pendingPayments.length} invoice{pendingPayments.length !== 1 ? "s" : ""} requiring attention
                  </p>
                </div>
                <button
                  onClick={() => setShowPopup(false)}
                  className="w-8 h-8 rounded-full hover:bg-amber-100 flex items-center justify-center text-gray-500 transition"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Popup body */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto divide-y divide-gray-100">
                {pendingPayments.map((payment, idx) => {
                  const due = calculateDueAmount(payment);
                  const isPaying = payingId === payment.InvoiceId;
                  return (
                    <div key={idx} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-gray-500">{payment.InvoiceId}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              payment.status === "partiallypaid"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payment.status === "partiallypaid" ? "Partially Paid" : "Pending"}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">
                          {payment.childrenName}
                          {payment.childrenId && (
                            <span className="text-gray-400 text-xs ml-1">({payment.childrenId})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-400">{fmtDate(payment.date)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-gray-900">{inrFormat(due)}</p>
                        <p className="text-xs text-gray-400">Due</p>
                        {due > 0 && (
                          <button
                            disabled={isPaying}
                            onClick={() => handlePayment(payment)}
                            className="mt-1.5 flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition disabled:opacity-60 font-medium"
                          >
                            <FiCreditCard size={11} />
                            {isPaying ? "Processing…" : "Pay Now"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Popup footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between gap-3">
                <button
                  onClick={() => setShowPopup(false)}
                  className="text-sm text-gray-500 hover:text-gray-700 transition"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => { setShowPopup(false); goToInvoicePage(); }}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  View All Invoices <FiArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dashboard Body ── */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="TOTAL"
            value={dashboard.childrenCount}
            subtitle="Registered Children"
            icon={<FiUsers />}
            color="blue"
          />
          <StatCard
            title="Total Appointments"
            value={dashboard.totalAppointments}
            subtitle="Scheduled Appointments"
            icon={<FiCalendar />}
            color="purple"
          />
          <StatCard
            title="DUE PAYMENT"
            value={inrFormat(pendingAmount)}
            subtitle={`${pendingPayments.length} Pending Invoice${pendingPayments.length !== 1 ? "s" : ""}`}
            icon={<FiAlertCircle />}
            color="red"
          />
        </div>

        {/* ── Pending Payments / Invoice Section ── */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Pending Payments</h2>
              {pendingPayments.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Total due:{" "}
                  <span className="font-semibold text-red-500">{inrFormat(pendingAmount)}</span>
                </p>
              )}
            </div>
            <button
              onClick={goToInvoicePage}
              className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:underline"
            >
              View All Invoices <FiExternalLink size={14} />
            </button>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="h-36 flex flex-col items-center justify-center text-gray-400 gap-2">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                <FiCreditCard className="text-green-400" size={20} />
              </div>
              <p className="text-sm">No pending payments — all clear!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice ID</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Children</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Invoice Amt</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Due</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingPayments.map((payment, idx) => {
                    const due = calculateDueAmount(payment);
                    const paid = getAmountPaid(payment);
                    const isPaying = payingId === payment.InvoiceId;
                    const invoiceAmt =
                      typeof payment.invoiceAmount === "number"
                        ? payment.invoiceAmount
                        : typeof payment.originalInvoiceAmount === "number"
                        ? payment.originalInvoiceAmount
                        : payment.amount;

                    return (
                      <tr key={idx} className="border-t hover:bg-gray-50 transition">
                        <td className="px-3 py-3 font-mono text-xs text-gray-600">{payment.InvoiceId}</td>
                        <td className="px-3 py-3 text-gray-600">{fmtDate(payment.date)}</td>
                        <td className="px-3 py-3">
                          <span className="font-medium text-gray-800">{payment.childrenName}</span>
                          {payment.childrenId && (
                            <span className="text-gray-400 text-xs ml-1">({payment.childrenId})</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right text-gray-700">
                          {inrFormat(invoiceAmt)}
                        </td>
                        <td className="px-3 py-3 text-right text-green-600 font-medium">
                          {paid > 0 ? inrFormat(paid) : <span className="text-gray-400">₹0</span>}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-red-600">
                          {due > 0 ? inrFormat(due) : <span className="text-gray-400">₹0</span>}
                        </td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${
                              payment.status === "partiallypaid"
                                ? "bg-orange-100 text-orange-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {payment.status === "partiallypaid"
                              ? "Partially Paid"
                              : payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          {due > 0 ? (
                            <button
                              disabled={isPaying}
                              onClick={() => handlePayment(payment)}
                              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition disabled:opacity-60"
                            >
                              <FiCreditCard size={11} />
                              {isPaying ? "Processing…" : "Pay Now"}
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer CTA */}
          {pendingPayments.length > 0 && (
            <div className="mt-4 pt-3 border-t flex justify-end">
              <button
                onClick={goToInvoicePage}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Full Invoice History <FiArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Consultation Bookings */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Consultation Bookings</h2>
          </div>
          {sortedConsultationBookings.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-gray-400 text-sm">
              No consultation bookings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {["Booking ID", "Date/Time", "Children", "Therapy", "Session Type", "Status", "Remark"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedConsultationBookings.map((c) => (
                    <tr key={c._id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-mono text-xs">{c.consultationAppointmentId}</td>
                      <td className="px-3 py-2">
                        {c.scheduledAt
                          ? new Date(c.scheduledAt).toLocaleString("en-GB", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium">{c.client?.name}</span>{" "}
                        <span className="text-gray-400 text-xs">({c.client?.patientId})</span>
                        <br />
                        <span className="text-xs text-gray-400">{c.client?.userId?.name}</span>
                      </td>
                      <td className="px-3 py-2">{c.therapy?.name || "-"}</td>
                      <td className="px-3 py-2">{c.sessionType}</td>
                      <td className="px-3 py-2">
                        {c.status.charAt(0).toUpperCase() + c.status.slice(1)}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{c.remark || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming Sessions */}
        <div className="bg-white rounded-xl border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Upcoming Sessions</h2>
          </div>
          {uncheckedSessions.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-gray-400 text-sm">
              No unchecked sessions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    {["Session ID", "Date", "Time Slot", "Children", "Therapist"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uncheckedSessions.map((session, idx) => (
                    <tr key={session.notCheckedInSession._id || idx} className="border-t hover:bg-gray-50 transition">
                      <td className="px-3 py-2 font-mono text-xs">
                        {session.notCheckedInSession.sessionId || "-"}
                      </td>
                      <td className="px-3 py-2">{fmtDate(session.notCheckedInSession.date)}</td>
                      <td className="px-3 py-2">{getSlotLabel(session.notCheckedInSession.slotId)}</td>
                      <td className="px-3 py-2">
                        {session.name || "-"}{" "}
                        <span className="text-gray-400 text-xs">({session.childrenId})</span>
                      </td>
                      <td className="px-3 py-2">
                        {getTherapistName(session.notCheckedInSession.therapist)}{" "}
                        <span className="text-gray-400 text-xs">
                          ({getTherapistId(session.notCheckedInSession.therapist)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ParentDashboard;

// ─── StatCard ────────────────────────────────────────────────────────────────

const StatCard = ({
  title, value, subtitle, icon, color,
}: {
  title: string;
  value: any;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "green" | "red";
}) => {
  const colorMap = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };
  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-800">{value}</h3>
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};