import { useEffect, useState } from "react";
import {
  FiCheckCircle,
  FiInfo,
  FiCreditCard,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiX,
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

type Appointment = {
  _id: string;
  appointmentId: string;
  patient: { name: string; _id: string; patientId?: string; gender?: string; mobile?: string } | null;
  therapistName: string;
  therapistId: string;
  therapistUserId: string;
  sessionId: string;
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
  amountPaid?: number | string;
  [key: string]: any;
};

const API_URL = import.meta.env.VITE_API_URL;

type CollectModalState = {
  visible: boolean,
  payment: PaymentInfo | null
};

export default function ReceptionDesk() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [today, setToday] = useState<string>("");

  // Modal State
  const [collectModal, setCollectModal] = useState<CollectModalState>({ visible: false, payment: null });
  const [collectType, setCollectType] = useState<'full' | 'partial'>('full');
  const [partialValue, setPartialValue] = useState<string>("");
  const [collectLoading, setCollectLoading] = useState(false);

  // Multi-select state for appointments
  const [selectedAppointments, setSelectedAppointments] = useState<{ [_id_session: string]: boolean }>({});
  const [multiCheckingIn, setMultiCheckingIn] = useState(false);

  function toNumber(v: any): number | undefined {
    if (typeof v === "number") return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = parseFloat(v);
      return isNaN(n) ? undefined : n;
    }
    return undefined;
  }

  const getPaymentAmount = () => {
    if (!collectModal.payment?.paymentAmount && collectModal.payment?.paymentAmount !== 0) return undefined;
    let amount = collectModal.payment.paymentAmount;
    return toNumber(amount);
  };

  const getAmountPaid = () => {
    if (!collectModal.payment?.amountPaid && collectModal.payment?.amountPaid !== 0) return 0;
    let paid = collectModal.payment.amountPaid;
    const paidNum = toNumber(paid);
    return paidNum ?? 0;
  };

  const paymentAmount = getPaymentAmount();
  const amountAlreadyPaid = getAmountPaid();
  const partialNumeric = parseFloat(partialValue);
  const isPartialOverDue =
    collectType === "partial" &&
    partialValue &&
    paymentAmount !== undefined &&
    !isNaN(partialNumeric) &&
    (partialNumeric + amountAlreadyPaid) > paymentAmount;
  const getPaymentDue = () => {
    if (paymentAmount === undefined) return undefined;
    return paymentAmount - amountAlreadyPaid;
  };
  const paymentDue = getPaymentDue();

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

        // ---- Today's Appointments ----
        const todays: Appointment[] = (data.todaysBookings || []).map((booking: any) => {
          const session = booking.session;
          let therapistName = "";
          let therapistId = "";
          let therapistUserId = "";

          if (session?.therapist && session.therapist.userId && session.therapist.userId.name) {
            therapistName = session.therapist.userId.name;
            therapistId = session.therapist.therapistId ?? session.therapist._id ?? "";
            therapistUserId = session.therapist._id ?? "";
          }

          if (!therapistName && booking.therapist && typeof booking.therapist === "object" && booking.therapist._id) {
            therapistId = booking.therapist._id;
            therapistName = booking.therapist.name ?? "";
            therapistUserId = booking.therapist._id;
          } else if (!therapistName && typeof booking.therapist === "string") {
            therapistId = booking.therapist;
            therapistUserId = booking.therapist;
          }

          let status: "scheduled" | "checked-in" = "scheduled";
          if (session && session.isCheckedIn) status = "checked-in";

          return {
            _id: booking._id,
            appointmentId: booking.appointmentId,
            patient: booking.patient || null,
            therapistName,
            therapistId: therapistId ?? "",
            therapistUserId: therapistUserId ?? "",
            sessionId: session?._id,
            time: session?.slotId ?? session?.time ?? "",
            status,
            isCheckedIn: session?.isCheckedIn,
          } as Appointment;
        });

        // ---- Pending Payments ----
        const pendings: PaymentInfo[] = (data.pendingPaymentBookings || []).map((booking: any) => {
          let paymentRecord = booking.payment || {};
          let patientName = booking.patient?.name || "";
          let patientId = booking.patient?.patientId || "";
          let paymentId = paymentRecord.paymentId || undefined;
          let paymentStatus = paymentRecord.status || undefined;
          let paymentAmount = (typeof paymentRecord.amount !== "undefined" ? paymentRecord.amount : undefined);
          let paymentMethod = paymentRecord.paymentMethod || "";
          let paymentRecordId = paymentRecord._id || undefined;
          let amountPaid = (typeof paymentRecord.amountPaid !== "undefined" ? paymentRecord.amountPaid : 0);

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
            amountPaid,
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

  const handleCheckIn = async (_id: string, sessionId: string) => {
    const token = localStorage.getItem("admin-token");
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/check-in`, {
        method: "POST",
        headers: {
          Authorization: `${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: _id, sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed check-in");

      setAppointments((apps) =>
        apps.map((a) =>
          a._id === _id && a.sessionId === sessionId
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

  const handleMultiCheckIn = async () => {
    const keys: string[] = Object.entries(selectedAppointments)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);

    if (keys.length === 0) {
      alert("Please select at least one appointment to mark session complete.");
      return;
    }
    setMultiCheckingIn(true);
    const token = localStorage.getItem("admin-token");

    for (const key of keys) {
      const [bookingId, sessionId] = key.split("||");
      if (!bookingId || !sessionId) continue;
      try {
        const res = await fetch(`${API_URL}/api/admin/bookings/check-in`, {
          method: "POST",
          headers: {
            Authorization: `${token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId, sessionId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.message || "Failed to mark session complete");
        setAppointments((apps) =>
          apps.map((a) =>
            a._id === bookingId && a.sessionId === sessionId
              ? { ...a, status: "checked-in", isCheckedIn: true }
              : a
          )
        );
      } catch (err) {
        alert(
          "Failed to mark session complete for Appt#: " + bookingId + ". " +
            (typeof err === "string"
              ? err
              : err instanceof Error
              ? err.message
              : "Error marking session complete")
        );
      }
    }
    setMultiCheckingIn(false);
    setSelectedAppointments({});
  };

  const toggleAppointmentSelection = (_id: string, sessionId: string) => {
    const key = `${_id}||${sessionId}`;
    setSelectedAppointments((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAllAppointments = () => {
    const newSelection: typeof selectedAppointments = {};
    appointments.forEach((a) => {
      if (a.status === "scheduled" && !a.isCheckedIn) {
        newSelection[`${a._id}||${a.sessionId}`] = true;
      }
    });
    setSelectedAppointments(newSelection);
  };
  const deselectAllAppointments = () => setSelectedAppointments({});

  const openCollectModal = (payment: PaymentInfo) => {
    setCollectModal({ visible: true, payment });
    setCollectType('full');
    setPartialValue("");
  };

  const closeCollectModal = () => {
    setCollectModal({ visible: false, payment: null });
    setPartialValue("");
    setCollectType('full');
    setCollectLoading(false);
  };

  const handleCollect = async () => {
    const payment = collectModal.payment;
    if (!payment) return;
    const _id = payment._id;
    const paymentRecordId = payment.paymentRecordId;

    const token = localStorage.getItem("admin-token");
    setCollectLoading(true);

    try {
      let url = `${API_URL}/api/admin/bookings/${_id}/collect-payment`;
      let payload: any = {};

      let newAmountPaid = getAmountPaid();
      let partialPaidAmount: number | undefined = undefined;

      if (collectType === "partial") {
        let val = parseFloat(partialValue);
        if (isNaN(val) || val <= 0) {
          setCollectLoading(false);
          alert("Please enter a valid partial amount.");
          return;
        }
        if (
          paymentAmount !== undefined &&
          !isNaN(val) &&
          (val + amountAlreadyPaid) > paymentAmount
        ) {
          setCollectLoading(false);
          alert(
            `Partial amount plus already paid (${val} + ${amountAlreadyPaid
            }) cannot exceed the pending amount (${paymentAmount})`
          );
          return;
        }
        payload = { partialAmount: val, paymentId: paymentRecordId, paymentType: collectType };
        partialPaidAmount = val;
        newAmountPaid += val;
      } else {
        payload = paymentRecordId ? { paymentId: paymentRecordId } : {};
        newAmountPaid = paymentAmount !== undefined ? paymentAmount : newAmountPaid;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `${token ?? ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to record payment");

      let finalAmountPaid: number;
      if (typeof data.amountPaid !== 'undefined' && data.amountPaid !== null) {
        finalAmountPaid = toNumber(data.amountPaid) ?? newAmountPaid;
      } else if (collectType === "partial" && typeof partialPaidAmount === "number") {
        finalAmountPaid = amountAlreadyPaid + partialPaidAmount;
      } else {
        finalAmountPaid = newAmountPaid;
      }

      let totalAmount: number;
      if (typeof data.amount !== 'undefined' && data.amount !== null) {
        totalAmount = toNumber(data.amount) ?? paymentAmount ?? 0;
      } else {
        totalAmount = paymentAmount ?? 0;
      }

      if (
        data.status === "paid" ||
        data.paymentStatus === "paid" ||
        (typeof totalAmount === "number" && typeof finalAmountPaid === "number" && totalAmount > 0 && finalAmountPaid >= totalAmount)
      ) {
        setPayments((pays) => pays.filter((p) => p._id !== _id));
      } else {
        setPayments((pays) =>
          pays.map((p) => {
            if (p._id === _id) {
              const updatedFields: Partial<PaymentInfo> = {};
              if (
                collectType === "partial" &&
                typeof data.amountPaid === "undefined" &&
                typeof partialPaidAmount === "number"
              ) {
                updatedFields.amountPaid = (toNumber(p.amountPaid) ?? 0) + partialPaidAmount;
              } else if (typeof data.amountPaid !== "undefined") {
                updatedFields.amountPaid = data.amountPaid;
              }
              if (typeof data.amount !== "undefined") updatedFields.paymentAmount = data.amount;

              if (
                collectType === "partial" &&
                (
                  typeof data.paymentStatus === "undefined" &&
                  typeof data.status === "undefined"
                )
              ) {
                updatedFields.paymentStatus = "partiallypaid";
              } else {
                if (typeof data.paymentStatus !== "undefined") updatedFields.paymentStatus = data.paymentStatus;
                if (typeof data.status !== "undefined") updatedFields.paymentStatus = data.status;
              }
              return { ...p, ...updatedFields };
            }
            return p;
          })
        );
      }
      closeCollectModal();
    } catch (err) {
      setCollectLoading(false);
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
              onClick={(e) => e.stopPropagation()}
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
                      Click "Session Completed" to mark them as present. This notifies the
                      therapist.
                    </li>
                    <li>
                      You can select and mark multiple sessions as completed at once using the new multi-select feature.
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
                    <li>Verify patient contact info during session completion.</li>
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

      {/* Payment Collection Modal */}
      <AnimatePresence>
        {collectModal.visible && collectModal.payment && (
          <motion.div
            key="collect-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ backdropFilter: "blur(2px)" }}
            onClick={closeCollectModal}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 30 }}
              className="bg-white rounded-lg shadow-lg max-w-sm w-full border border-slate-200 relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-700"
                onClick={closeCollectModal}
                tabIndex={-1}
                aria-label="Close"
              >
                <FiX size={20} />
              </button>
              <div className="p-6 pb-2">
                <div className="font-semibold text-lg text-slate-800 flex items-center gap-2 mb-2">
                  Collect Payment
                </div>
                <div className="text-sm mb-3">
                  <span className="font-medium text-blue-700">Appt#: {collectModal.payment.appointmentId}</span>
                  <br />
                  {/* PatientName with a link for modal */}
                  {collectModal.payment.patientId && (
                    <a
                      href={`/admin/children?patientId=${encodeURIComponent(collectModal.payment.patientId)}`}
                      className="text-blue-700 hover:underline"
                      title="View patient details"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="text-slate-800">{collectModal.payment.patientName}</span>
                    </a>
                  )}
                  {!collectModal.payment.patientId && (
                    <span className="text-slate-800">{collectModal.payment.patientName}</span>
                  )}
                  {" "}
                  <span className="text-xs text-blue-300 font-mono">({collectModal.payment.patientId})</span>
                  <br />
                  <span className="text-xs text-slate-500">
                    Amount Due: <span className="font-semibold text-slate-700">
                      ₹{String(collectModal.payment.paymentAmount ?? "—")}
                    </span>
                  </span>
                  {(collectModal.payment.amountPaid || collectModal.payment.amountPaid === 0) && (
                    <span className="text-xs text-slate-400 ml-2">
                      (Already paid: ₹{String(collectModal.payment.amountPaid)})
                    </span>
                  )}
                </div>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (collectLoading || isPartialOverDue) return;
                    handleCollect();
                  }}
                >
                  <div className="mb-4 mt-1">
                    <label className="block font-medium text-slate-700 mb-1">Collection Type</label>
                    <div className="flex gap-4 items-center">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="collectType"
                          value="full"
                          checked={collectType === "full"}
                          onChange={() => setCollectType("full")}
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
                        onChange={e => setPartialValue(e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-green-200 text-sm"
                        placeholder="E.g. 800"
                        required
                        disabled={collectLoading}
                        max={paymentDue ?? undefined}
                      />
                      {isPartialOverDue && (
                        <div className="text-xs text-red-500 mt-1">
                          Partial amount plus already paid cannot exceed the invoice total ({paymentAmount}).
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="submit"
                    className={`mt-3 w-full rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 relative ${
                      collectLoading || isPartialOverDue ? "bg-green-50 opacity-80 cursor-not-allowed" : "hover:bg-green-50"
                    }`}
                    disabled={Boolean(collectLoading || isPartialOverDue)}
                  >
                    {collectLoading
                      ? "Processing…"
                      : collectType === "full"
                      ? "Collect Full Amount"
                      : "Collect Partial Amount"}
                  </button>
                  <div className="mt-1 text-xs text-slate-400 text-center">
                    {collectType === "partial" ? "Collects a partial payment; the remaining will appear as pending." : "Marks the invoice as fully paid."}
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Multi-Check-in Controls */}
          <div className="mb-3 flex flex-wrap gap-2 items-center">
            <button
              className="rounded border border-blue-400 px-3 py-1 text-xs font-medium text-blue-800 hover:bg-blue-50 bg-blue-50 transition"
              onClick={selectAllAppointments}
              type="button"
              tabIndex={-1}
            >
              Select All
            </button>
            <button
              className="rounded border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 bg-white transition"
              onClick={deselectAllAppointments}
              type="button"
              tabIndex={-1}
            >
              Deselect All
            </button>
            <button
              className={`rounded border border-green-600 px-3 py-1 text-xs font-semibold text-green-700 bg-green-50 transition ${
                multiCheckingIn || Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-green-100"
              }`}
              onClick={handleMultiCheckIn}
              type="button"
              disabled={multiCheckingIn || Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0}
              tabIndex={-1}
              style={{ minWidth: 88 }}
            >
              {multiCheckingIn ? "Marking as Completed…" : "Mark Session Completed"}
            </button>
            <span className="text-xs text-slate-400 ml-2">
              {Object.entries(selectedAppointments).filter(([_, v]) => v).length > 0
                ? `(${Object.entries(selectedAppointments).filter(([_, checked]) => checked).length} selected)`
                : ""}
            </span>
          </div>

          {appointments.length === 0 ? (
            <p className="text-sm text-slate-500">No appointments today.</p>
          ) : (
            <div className="space-y-4">
              {appointments.map((a) => {
                const key = `${a._id}||${a.sessionId}`;
                const checked = !!selectedAppointments[key];
                const selectable = a.status === "scheduled" && !a.isCheckedIn;
                return (
                  <div
                    key={a._id + "|" + a.sessionId}
                    className="flex items-center justify-between border-b border-slate-100 pb-3 last:pb-0 last:border-0"
                  >
                    <div className="flex items-center">
                      {/* Checkbox for multi-select */}
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectable}
                        onChange={() => selectable && toggleAppointmentSelection(a._id, a.sessionId)}
                        className="mr-2 accent-blue-600"
                        tabIndex={selectable ? 0 : -1}
                        aria-label={
                          selectable
                            ? `Select appointment ${a.appointmentId} for session completion`
                            : "Session completed or not selectable"
                        }
                        style={{ width: 16, height: 16 }}
                      />
                      {/* Existing appointment info */}
                      <div>
                        <div className="font-medium text-slate-800 flex flex-col items-start gap-1 flex-wrap">
                          <span>
                            {/* Add a link for patient name if id present */}
                            {a.patient && a.patient._id ? (
                              <a
                                href={`/admin/children?patientId=${encodeURIComponent(a.patient._id)}`}
                                className="text-blue-700 hover:underline"
                                title="View patient details"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                              >
                                {a.patient.name ?? "Anonymous"}
                              </a>
                            ) : (
                              a.patient?.name ?? "Anonymous"
                            )}
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
                            {/* Show sessionId to the right */}
                            <span className="ml-3 text-xs text-slate-500 font-mono">
                              Session ID: {a.sessionId ?? "—"}
                            </span>
                          </span>
                          {(a.status === "checked-in" || a.isCheckedIn) && (
                            <span className="ml-2 text-green-600 text-xs bg-green-50 rounded px-2 py-0.5 font-semibold">
                              Session Completed
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Therapist:{" "}
                          <span className="font-semibold">
                            {(a.therapistName && a.therapistId) ? (
                              <a
                                href={`/admin/therapists?therapistId=${encodeURIComponent(a.therapistUserId)}`}
                                className="text-blue-600 hover:underline"
                                title="View therapist details"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                              >
                                {a.therapistName}
                              </a>
                            ) : (
                              a.therapistName || "—"
                            )}
                          </span>{" "}
                          <span className="text-blue-400 font-mono">
                            {a.therapistId ? `(${a.therapistId})` : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {a.status === "scheduled" && !a.isCheckedIn ? (
                        <button
                          onClick={() => handleCheckIn(a._id, a.sessionId)}
                          className="rounded-md border border-blue-500 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition"
                        >
                          Mark Session Completed
                        </button>
                      ) : (
                        <span className="rounded-md border border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50">
                          Session Completed
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
                        {/* Add a link for patientName if patientId present */}
                        {payment.patientId ? (
                          <a
                            href={`/admin/children?patientId=${encodeURIComponent(payment.patientId)}`}
                            className="text-blue-700 hover:underline"
                            title="View patient details"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                          >
                            {payment.patientName}
                          </a>
                        ) : (
                          payment.patientName
                        )}
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
                      <span>
                        Amount : ₹
                        {typeof payment.paymentAmount === "number" ||
                        (typeof payment.paymentAmount === "string" && /^\d+$/.test(payment.paymentAmount))
                          ? payment.paymentAmount
                          : "—"}
                      </span>
                      {(payment.amountPaid || payment.amountPaid === 0) && (
                        <span>
                          , Paid: ₹
                          {(typeof payment.amountPaid === "number" ||
                            (typeof payment.amountPaid === "string" && /^\d+$/.test(payment.amountPaid)))
                            ? payment.amountPaid
                            : "—"}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="rounded-md border border-green-500 px-4 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 transition"
                    onClick={() => openCollectModal(payment)}
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
