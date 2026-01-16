import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiInfo,
  FiCreditCard,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

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

// Types for reception bookings and payments
type Appointment = {
  _id: string;
  appointmentId: string;
  patient: { name: string; _id: string; patientId?: string; gender?: string; mobile?: string } | null;
  therapistName: string;
  therapistId: string;
  sessionId:string,
  time?: string;
  status?: "scheduled" | "checked-in";
  isCheckedIn?: boolean;
  [key: string]: any;
};

type PaymentInfo = {
  _id: string;
  appointmentId: string;
  patientName: string;
  patientId: string;
  paymentId?: string;
  paymentStatus?: string;
  paymentAmount?: number | string;
  paymentMethod?: string;
  paymentRecordId?: string;
  [key: string]: any;
};

const API_URL = import.meta.env.VITE_API_URL;

// Utility: Get today's session for a booking and extract therapist/user name and slot time
function getTodaySession(sessions?: any[], today?: string) {
  if (!sessions || !today) return undefined;
  return sessions.find((sess) => sess.date === today);
}

export default function ReceptionDesk() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [today, setToday] = useState<string>("");

  // Fetch reception desk data
  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      setLoading(true);
      try {
        const token = localStorage.getItem("admin-token");
        const res = await fetch(`${API_URL}/api/admin/bookings/reception-desk`, {
          headers: {
            Authorization: token || "",
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) throw new Error("Failed to load reception desk");
        const data = await res.json();

        if (!data.success) throw new Error(data.message || "API error");
        if (ignore) return;

        setToday(data.today);

        // --- Today's Appointments ---
        const todays: Appointment[] = (data.todaysBookings || []).map((booking: any) => {
          // Get today's session
          const session = getTodaySession(booking.sessions, data.today);

          // Therapist info: Try to get therapistName from session's therapist.userId.name, fall back to main therapist
          let therapistName = "";
          let therapistId = "";
          if (session && session.therapist && session.therapist.userId && session.therapist.userId.name) {
            therapistName = session.therapist.userId.name;
            therapistId = session.therapist.therapistId;
          } else if (
            booking.therapist &&
            (typeof booking.therapist === "object") &&
            booking.therapist._id
          ) {
            therapistName =
              (booking.therapist.userId && booking.therapist.userId.name)
                ? booking.therapist.userId.name
                : (booking.therapist.name || "");
            therapistId = booking.therapist._id;
          }

          // Patient info
          // const patientName =
          //   booking.patient && booking.patient.name ? booking.patient.name : "";

          let status: "scheduled" | "checked-in" = "scheduled";
          if (booking.isCheckedIn) status = "checked-in";
          else if (session && session.isCheckedIn) status = "checked-in";

          return {
            _id: booking._id,
            appointmentId: booking.appointmentId,
            patient: booking.patient || null,
            therapistName: therapistName,
            therapistId: therapistId,
            sessionId:session?._id,
            time: session?.slotId ?? session?.time ?? "",
            status,
            isCheckedIn: booking.sessions.isCheckedIn,
          };
        });

        // --- Pending Payments ---
        // Use all pendingPaymentBookings directly
        const pendings: PaymentInfo[] = (data.pendingPaymentBookings || []).map((booking: any) => {
          // Get payment details
          let paymentRecord = booking.payment || {};
          // Patient fields
          let patientName = booking.patient?.name || "";
          let patientId = booking.patient?.patientId || "";
          let paymentId = paymentRecord.paymentId || undefined;
          let paymentStatus = paymentRecord.status || undefined;
          let paymentAmount = (typeof paymentRecord.amount !== "undefined" ? paymentRecord.amount : undefined);
          let paymentMethod = paymentRecord.paymentMethod || "";
          let paymentRecordId = paymentRecord._id || undefined;

          return {
            _id: booking._id,
            appointmentId: booking.appointmentId,
            patientName,
            patientId,
            paymentId,
            paymentStatus,
            paymentAmount,
            paymentMethod,
            paymentRecordId,
          };
        });

        setAppointments(todays);
        setPayments(pendings);
      } catch (err) {
        setAppointments([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => {
      ignore = true;
    };
  }, []);

  // Handler to "check in" an appointment (actual POST to API)
  const handleCheckIn = async (_id: string, sessionId:string) => {
    const token = localStorage.getItem("admin-token");
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/check-in`, {
        method: "POST",
        headers: {
          Authorization: token || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: _id, sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed check-in");

      // Optimistic update
      setAppointments((apps) =>
        apps.map((a) =>
          a._id === _id
            ? { ...a, status: "checked-in", isCheckedIn: true }
            : a
        )
      );
    } catch (err) {
      alert(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Error checking in"
      );
    }
  };

  // Handler to "collect" a payment (actual POST to API)
  const handleCollect = async (_id: string, paymentRecordId?: string) => {
    const token = localStorage.getItem("admin-token");
    console.log(paymentRecordId);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/bookings/${_id}/collect-payment`,
        {
          method: "POST",
          headers: {
            Authorization: token || "",
            "Content-Type": "application/json",
          },
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to record payment");
      // Remove from pending payments
      setPayments((pays) => pays.filter((p) => p._id !== _id));
    } catch (err) {
      alert(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Error collecting payment"
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold tracking-wide"
        >
          Loading Reception Desk…
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="min-h-screen  p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Reception Desk{" "}
          <span className="text-slate-400">
            – {today || new Date().toISOString().slice(0, 10)}
          </span>
        </h1>
        {/* <div className="relative w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Quick Patient Search…"
            className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div> */}
      </div>

      {/* Guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-blue-50 border border-blue-200 rounded-lg p-0 mb-6 cursor-pointer select-none transition-[box-shadow]`}
        onClick={() => setGuideOpen((open) => !open)}
        tabIndex={0}
        role="button"
        aria-expanded={guideOpen}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="flex items-center justify-between p-6 pt-5 pb-5">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <FiInfo /> Daily Operations Guide
          </div>
          <div className="flex items-center ml-4">
            {guideOpen ? (
              <FiChevronUp className="text-blue-400" />
            ) : (
              <FiChevronDown className="text-blue-400" />
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {guideOpen && (
            <motion.div
              key="guide-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent click on content area from toggling collapse
            >
              <div className="px-6 pb-6">
                <p className="text-sm text-blue-700 mb-4">
                  Manage patient flow and collections for the day.
                </p>

                <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                  <p className="font-medium text-slate-700 mb-2">Steps to Follow</p>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                    <li>
                      When a patient arrives, find their appointment in
                      "Today’s Appointments".
                    </li>
                    <li>
                      Click "Check In" to mark them as present. This notifies the
                      therapist.
                    </li>
                    <li>
                      Check the "Pending Payments" list. Collect fees before or
                      after the session.
                    </li>
                    <li>
                      Click "Collect" to mark an invoice as paid.
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <FiCheckCircle /> Pro Tips
                  </div>
                  <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                    <li>Verify patient contact info during check-in.</li>
                    <li>
                      Unpaid invoices from previous days remain until cleared.
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
            <FiCalendar className="text-blue-600" /> Today’s Appointments
          </div>
          {appointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments today.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((a) => (
                <div
                  key={a._id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:pb-0 last:border-0"
                >
                  <div>
                    <div className="font-medium text-slate-800 flex flex-col items-start gap-1 flex-wrap">
                      <span>
                        {a.patient?.name ?? "Anonymous"}
                        <span className="text-xs text-blue-400 font-semibold ml-1">
                          ({a.patient?.patientId || "--"})
                        </span>
                      </span>

                      <span className=" text-sm font-semibold text-slate-600">
                        | Appt#:{" "}
                        <span className="text-blue-700">{a.appointmentId}</span>
                        <span className="ml-3 text-xs text-slate-400 font-normal">
                        {
                          SESSION_TIME_OPTIONS.find(opt => opt.id === a.time)?.label 
                          ?? a.time 
                          ?? ""
                        }
                      </span>
                      </span>
                     
                      {(a.status === "checked-in" || a.isCheckedIn) && (
                        <span className="ml-2 text-green-600 text-xs bg-green-50 rounded px-2 py-0.5 font-semibold">
                          Checked In
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Therapist:{" "}
                      <span className="font-semibold">
                        {a.therapistName || "—"}
                      </span>{" "}
                      <span className="text-blue-400 font-mono">
                        {a.therapistId ? `(${a.therapistId})` : ""}
                      </span>
                    </div>
                  </div>
                  <div>
                    {a.status === "scheduled" && !a.isCheckedIn ? (
                      <button
                        onClick={() => handleCheckIn(a._id,a.sessionId)}
                        className="rounded-md border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                      >
                        Check In
                      </button>
                    ) : (
                      <span className="rounded-md border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50">
                        Present
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Payments */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
            <FiCreditCard className="text-green-600" /> Pending Payments
          </div>

          {payments.length === 0 ? (
            <p className="text-sm text-slate-500">No pending payments.</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:pb-0 last:border-0"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-blue-700">
                        Appt#: {payment.appointmentId}
                      </span>
                      <span className="font-medium text-slate-800">
                        {payment.patientName}
                        <span className="ml-1 text-xs text-blue-400 font-mono">
                          ({payment.patientId})
                        </span>
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap gap-1 mt-0.5">
                      <span>
                        Payment ID:{" "}
                        <span className="font-mono text-blue-600">
                          {payment.paymentId || payment.paymentRecordId || "—"}
                        </span>
                      </span>
                      <span>
                        Status:{" "}
                        <span
                          className={
                            payment.paymentStatus === "paid"
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {payment.paymentStatus || "pending"}
                        </span>
                      </span>
                      <span>Amount : 
                        ₹
                        {typeof payment.paymentAmount === "number" ||
                        /^\d+$/.test(String(payment.paymentAmount))
                          ? payment.paymentAmount
                          : "—"}
                      </span>
                      {/* {payment.paymentMethod && (
                        <span>
                          Method:{" "}
                          <span className="text-slate-700">
                            {payment.paymentMethod}
                          </span>
                        </span>
                      )} */}
                    </div>
                  </div>
                  <button
                    className="rounded-md border border-green-500 px-4 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 transition"
                    onClick={() => handleCollect(payment._id, payment.paymentRecordId)}
                  >
                    Collect
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
