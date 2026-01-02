import { useEffect, useState } from "react";
import {
  FiSearch,
  FiCheckCircle,
  FiInfo,
  FiCreditCard,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// Sample data for appointments
const sampleAppointments = [
  {
    id: 1,
    time: "10:00 AM",
    patient: "Artharv Sharma",
    therapist: "Dr. Shalini G.",
    status: "scheduled",
  },
  {
    id: 2,
    time: "11:30 AM",
    patient: "Megha Kapoor",
    therapist: "Dr. Sonali M.",
    status: "checked-in",
  },
  {
    id: 3,
    time: "02:00 PM",
    patient: "Raghav S.",
    therapist: "Dr. Unnati M.",
    status: "scheduled",
  },
];

// Sample data for pending payments
const samplePayments = [
  {
    id: 1,
    patient: "Artharv Sharma",
    invoice: "INV-101519",
    amount: 700,
  },
  {
    id: 2,
    patient: "Megha Kapoor",
    invoice: "INV-101520",
    amount: 850,
  },
];

export default function ReceptionDesk() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      // Populate with sample data after loading (imitating fetch).
      setAppointments(sampleAppointments);
      setPayments(samplePayments);
      setLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Handler to "check in" an appointment (for sample effect)
  const handleCheckIn = (id: number) => {
    setAppointments((apps) =>
      apps.map((a) =>
        a.id === id ? { ...a, status: "checked-in" } : a
      )
    );
  };

  // Handler to "collect" a payment (for sample effect)
  const handleCollect = (id: number) => {
    setPayments((pays) => pays.filter((p) => p.id !== id));
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
          Reception Desk <span className="text-slate-400">– 2025-12-18</span>
        </h1>
        <div className="relative w-72">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Quick Patient Search…"
            className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
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
                  key={a.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:pb-0 last:border-0"
                >
                  <div>
                    <div className="font-medium text-slate-800">
                      {a.patient}
                      <span className="ml-2 text-xs text-slate-400 font-normal">{a.time}</span>
                      {a.status === "checked-in" && (
                        <span className="ml-2 text-green-600 text-xs bg-green-50 rounded px-2 py-0.5 font-semibold">
                          Checked In
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      Therapist: {a.therapist}
                    </div>
                  </div>
                  <div>
                    {a.status === "scheduled" ? (
                      <button
                        onClick={() => handleCheckIn(a.id)}
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
                  key={payment.id}
                  className="flex items-center justify-between border-b border-slate-100 pb-3 last:pb-0 last:border-0"
                >
                  <div>
                    <p className="font-medium text-slate-800">{payment.patient}</p>
                    <p className="text-sm text-slate-500">
                      Inv: {payment.invoice} • ₹{payment.amount}
                    </p>
                  </div>
                  <button
                    className="rounded-md border border-green-500 px-4 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 transition"
                    onClick={() => handleCollect(payment.id)}
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
