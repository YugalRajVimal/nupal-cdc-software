import { useEffect, useState, useCallback } from "react";
import {
  FiCheckCircle,
  FiInfo,
  FiCreditCard,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiX,
} from "react-icons/fi";
import { FiDollarSign, FiSmartphone } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// --- BEGIN: Discount related :: align to BookingSummary logic ---
type DiscountInfo = {
  code: string | null;
  percent: number;
  amount: number;
};
type Coupon = {
  _id?: string;
  discountEnabled?: boolean;
  discount?: number;
  couponCode?: string;
  validityDays?: number;
  createdAt?: string;
};
// --- END: Discount ---

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
  sessionDbId?: string;   // ADD THIS
  time?: string;
  status?: "CheckedIn" | "NotCheckedIn" | "Missed";
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
  totalAmount?: number | string;
  paymentMethod?: string;
  paymentRecordId?: string;
  amountPaid?: number | string;
  discountInfo?: DiscountInfo;
  coupon?: Coupon;
  discountPercent?: number;
  [key: string]: any;
};

const API_URL = import.meta.env.VITE_API_URL;

function formatDateDDMMYYYY(dateString: string | undefined): string {
  if (!dateString) return "";
  let d = dateString;
  if (d.length > 10) d = d.slice(0, 10);
  const [yyyy, mm, dd] = d.split("-");
  if (!yyyy || !mm || !dd) return dateString;
  return `${dd}/${mm}/${yyyy}`;
}

function toNumber(v: any): number | undefined {
  if (typeof v === "number") return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = parseFloat(v);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
}
function calcDiscountedAmount(amount: number, percent: number) {
  if (!percent || isNaN(percent)) return amount;
  return Math.round(amount - (amount * percent) / 100);
}
function getDiscountPercent(payment: PaymentInfo) {
  if (payment.discountPercent !== undefined) return payment.discountPercent;
  if (payment.coupon && payment.coupon.discountEnabled && payment.coupon.discount) {
    return payment.coupon.discount;
  }
  if (payment.discountInfo && payment.discountInfo.percent) {
    return payment.discountInfo.percent;
  }
  return 0;
}

// Payment Collection Modal per prompt
type CollectPaymentModalProps = {
  open: boolean;
  onClose: () => void;
  payment?: PaymentInfo | null;
  onCollected: () => void;
};

// Add paymentMethod (cash/online) and UTR number, with UI and submission (using BookingSummary.tsx as reference)

type PaymentMethod = "cash" | "online" | "";

function CollectPaymentModal({ open, onClose, payment, onCollected }: CollectPaymentModalProps) {
  const [collectType, setCollectType] = useState<"full" | "partial">("full");
  const [partialValue, setPartialValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [utr, setUtr] = useState("");

  const discountPercent =
    payment && typeof getDiscountPercent(payment) === "number"
      ? getDiscountPercent(payment)
      : 0;

  const paymentAmountOriginal = payment ? toNumber(payment.paymentAmount ?? payment.totalAmount) : undefined;

  const discountedAmount =
    paymentAmountOriginal !== undefined
      ? calcDiscountedAmount(paymentAmountOriginal, applyDiscount ? discountPercent : 0)
      : undefined;
  const paymentAmount = discountedAmount;
  const amountAlreadyPaid = (payment && toNumber(payment.amountPaid)) ?? 0;

  const partialNumeric = parseFloat(partialValue);
  const isPartialOverDue =
    collectType === "partial" &&
    typeof paymentAmount === "number" &&
    !isNaN(partialNumeric) &&
    partialNumeric + (typeof amountAlreadyPaid === "number" ? amountAlreadyPaid : 0) > paymentAmount;
  const paymentDue =
    typeof paymentAmount === "number" && typeof amountAlreadyPaid === "number"
      ? paymentAmount - amountAlreadyPaid
      : paymentAmount;

  // Payment method details (new)
  const needsUtr = paymentMethod === "online";
  const utrMissing = needsUtr && utr.trim() === "";
  const canSubmit = !loading && !isPartialOverDue && paymentMethod !== "" && !utrMissing &&
    (collectType === "full" || (!isNaN(partialNumeric) && partialNumeric > 0));

  useEffect(() => {
    if (open) {
      setCollectType("full");
      setPartialValue("");
      setLoading(false);
      setApplyDiscount(true);
      setPaymentMethod("");
      setUtr("");
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
        applyDiscount,
        paymentMethod,
        ...(needsUtr && utr.trim() ? { utr: utr.trim() } : {}),
        ...(collectType === "partial" ? { partialAmount: partialNumeric } : {}),
      };
      if (typeof discountPercent === "number" && discountPercent > 0 && applyDiscount) {
        body.discountApplied = true;
      } else {
        body.discountApplied = false;
      }

      const res = await fetch(
        `${endpoint}/api/admin/bookings/${payment._id}/collect-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `${localStorage.getItem("admin-token") || ""}`,
          },
          body: JSON.stringify(body),
        }
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(data?.error || data?.message || "Failed to collect payment.");
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
            type="button"
          >
            <FiX size={20} />
          </button>
          <div className="p-6 pb-2">
            <div className="font-semibold text-lg text-slate-800 mb-2">Collect Payment</div>
            <div className="text-sm mb-3">
              <span className="font-medium text-blue-700">
                Appt#: {payment.appointmentId}
              </span>{" "}
              <br />
              <span className="text-slate-800">{payment.patientName}</span>{" "}
              <span className="text-xs text-blue-300 font-mono">
                ({payment.patientId})
              </span>
              <br />
              {typeof discountPercent === "number" && discountPercent > 0 && (
                <span className="text-xs text-slate-400 block">
                  Original Invoice Amount:{" "}
                  <span className="font-semibold text-slate-600">
                    ₹{typeof paymentAmountOriginal === "number" ? paymentAmountOriginal : String(payment.paymentAmount ?? "—")}
                  </span>
                </span>
              )}
              {typeof discountPercent === "number" && discountPercent > 0 && (
                <div>
                  <div className="mb-1 text-xs">
                    <label className="font-semibold text-green-700 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="mr-1 accent-green-600"
                        checked={applyDiscount}
                        onChange={e => setApplyDiscount(!!e.target.checked)}
                        disabled={loading}
                      />
                      Apply Discount ({discountPercent}%)
                    </label>
                  </div>
                </div>
              )}
              <span className="text-xs text-slate-500 block">
                Invoice Amount:{" "}
                <span className="font-semibold text-slate-700">
                  ₹{paymentAmount !== undefined ? paymentAmount : String(payment.paymentAmount ?? "—")}
                </span>
                {typeof discountPercent === "number" &&
                  discountPercent > 0 &&
                  applyDiscount && (
                    <span className="ml-1 text-green-800 font-semibold bg-green-100 px-1 rounded">
                      (after discount)
                    </span>
                  )}
              </span>
              {payment.amountPaid && (
                <span className="text-xs text-slate-400 block">
                  Already paid: ₹{String(payment.amountPaid)}
                </span>
              )}
              <span className="text-xs text-rose-600 block">
                Due Amount:{" "}
                <span className="font-semibold">
                  ₹{typeof paymentDue === "number" ? paymentDue : "—"}
                </span>
              </span>
              {typeof discountPercent === "number" &&
                discountPercent > 0 &&
                applyDiscount && (
                  <div className="text-xs mt-1 text-green-700 font-medium">
                    Discount Applied: {discountPercent}%
                  </div>
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
                      Partial amount plus already paid cannot exceed the invoice total ({paymentAmount}).
                    </div>
                  )}
                </div>
              )}
              {/* ── Payment Method Select (Cash, Online) ── */}
              <div className="mb-3">
                <label className="block font-medium text-slate-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(["cash", "online"] as PaymentMethod[]).map((m) => (
                    <button
                      type="button"
                      key={m}
                      onClick={() => { setPaymentMethod(m); if (m === "cash") setUtr(""); }}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border transition-colors ${
                        paymentMethod === m
                          ? "border-blue-500 bg-blue-50 text-blue-800"
                          : "border-slate-300 bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }`}
                      disabled={loading}
                    >
                      {m === "cash" && <FiDollarSign className="inline mr-1" />}
                      {m === "online" && <FiSmartphone className="inline mr-1" />}
                      {m === "cash" ? "Cash" : "Online / UPI"}
                    </button>
                  ))}
                </div>
              </div>
              {/* ── UTR input, only if Online selected ── */}
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
                className={`mt-3 w-full rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 ${
                  !canSubmit ? "bg-green-50 opacity-80 cursor-not-allowed" : "hover:bg-green-50"
                }`}
                disabled={!canSubmit}
              >
                {loading
                  ? "Processing…"
                  : collectType === "full"
                  ? "Collect Full Amount"
                  : "Collect Partial Amount"}
              </button>
              <div className="mt-1 text-xs text-slate-400 text-center">
                {!paymentMethod
                  ? "Select a payment method to continue."
                  : collectType === "partial"
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

// ----------- NEW Handler for Mark As Not Checked In (single & multi) ------------
export default function ReceptionDesk() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<PaymentInfo[]>([]);
  const [today, setToday] = useState<string>("");

  const [selectedAppointments, setSelectedAppointments] = useState<{ [_id_session: string]: boolean }>({});
  const [multiCheckingIn, setMultiCheckingIn] = useState(false);
  const [multiMarkingMissed, setMultiMarkingMissed] = useState(false);
  const [multiMarkingNotCheckedIn, setMultiMarkingNotCheckedIn] = useState(false); // NEW: For multi-mark-not-checkedin

  // Fetch data logic same as before ...
  const fetchReceptionDeskData = useCallback(async () => {
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

      setToday(data.today);

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

        // Map session.status (enum: ['CheckedIn', 'NotCheckedIn', 'Missed']) to Appointment.status
        let status: "CheckedIn" | "NotCheckedIn" | "Missed" = "NotCheckedIn";
        if (session?.status === "CheckedIn") {
          status = "CheckedIn";
        } else if (session?.status === "Missed") {
          status = "Missed";
        } else if (session?.status === "NotCheckedIn") {
          status = "NotCheckedIn";
        }

        return {
          _id: booking._id,
          appointmentId: booking.appointmentId,
          patient: booking.patient || null,
          therapistName,
          therapistId: therapistId ?? "",
          therapistUserId: therapistUserId ?? "",
          sessionId: session?.sessionId,
          sessionDbId: session?._id,
          time: session?.slotId ?? session?.time ?? "",
          status,
        } as Appointment;
      });

      let pendings: PaymentInfo[] = (data.pendingPaymentBookings || []).map((booking: any) => {
        let paymentRecord = booking.payment || {};
        let patientName = booking.patient?.name || "";
        let patientId = booking.patient?.patientId || "";
        let paymentId = paymentRecord.paymentId || undefined;
        let paymentStatus = paymentRecord.status || undefined;
        let paymentAmount = (typeof paymentRecord.amount !== "undefined" ? paymentRecord.amount : undefined);
        let totalAmount = typeof paymentRecord.totalAmount !== "undefined" ? paymentRecord.totalAmount : undefined;
        let paymentMethod = paymentRecord.paymentMethod || "";
        let paymentRecordId = paymentRecord._id || undefined;
        let amountPaid = (typeof paymentRecord.amountPaid !== "undefined" ? paymentRecord.amountPaid : 0);
        let discountInfo: DiscountInfo | undefined = undefined;
        let coupon: Coupon | undefined = undefined;
        if (paymentRecord.discountInfo) discountInfo = paymentRecord.discountInfo;
        if (booking.discountInfo && booking.discountInfo.coupon) {
          coupon = booking.discountInfo.coupon;
        } else if (paymentRecord.coupon) {
          coupon = paymentRecord.coupon;
        }
        let createdAt = paymentRecord.createdAt || booking.createdAt || undefined;

        let discountPercent: number | undefined = undefined;
        if (coupon && coupon.discountEnabled && typeof coupon.discount === "number") {
          discountPercent = coupon.discount;
        } else if (discountInfo && typeof discountInfo.percent === "number") {
          discountPercent = discountInfo.percent;
        }

        return {
          _id: booking._id,
          appointmentId: booking.appointmentId,
          patientName,
          patientId,
          paymentId,
          paymentStatus,
          paymentAmount,
          totalAmount,
          paymentMethod,
          paymentRecordId,
          amountPaid,
          discountInfo,
          coupon,
          createdAt,
          discountPercent,
        };
      });

      pendings.sort((a, b) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });

      setAppointments(todays);
      setPayments(pendings);
    } catch (err) {
      setAppointments([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReceptionDeskData();
  }, [fetchReceptionDeskData]);

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
      await fetchReceptionDeskData();
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

  const handleMissed = async (_id: string, sessionId: string) => {
    const token = localStorage.getItem("admin-token");
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/mark-session-missed`, {
        method: "POST",
        headers: {
          Authorization: `${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: _id, sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed set as missed");
      await fetchReceptionDeskData();
    } catch (err) {
      alert(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Error marking as missed"
      );
    }
  };

  // NEW: Mark as Not Checked In (single)
  const handleMarkNotCheckedIn = async (_id: string, sessionId: string) => {
    const token = localStorage.getItem("admin-token");
    try {
      const res = await fetch(`${API_URL}/api/admin/bookings/mark-session-not-checked-in`, {
        method: "POST",
        headers: {
          Authorization: `${token || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bookingId: _id, sessionId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed mark as Not Checked In");
      await fetchReceptionDeskData();
    } catch (err) {
      alert(
        typeof err === "string"
          ? err
          : err instanceof Error
          ? err.message
          : "Error marking as Not Checked In"
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
      const [bookingId, sessionDbId] = key.split("||");
      if (!bookingId || !sessionDbId) continue;
      try {
        const res = await fetch(`${API_URL}/api/admin/bookings/check-in`, {
          method: "POST",
          headers: {
            Authorization: `${token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId, sessionId: sessionDbId }),
        });
        const data = await res.json();
        if (!res.ok || !data.success)
          throw new Error(data.message || "Failed to mark session complete");
      } catch (err) {
        alert(
          "Failed to mark session complete for Appt#: " +
            bookingId +
            ". " +
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
    await fetchReceptionDeskData();
  };

  const handleMultiMarkAsMissed = async () => {
    const keys: string[] = Object.entries(selectedAppointments)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);

    if (keys.length === 0) {
      alert("Please select at least one appointment to mark as missed.");
      return;
    }
    setMultiMarkingMissed(true);
    const token = localStorage.getItem("admin-token");

    for (const key of keys) {
      const [bookingId, sessionDbId] = key.split("||");
      if (!bookingId || !sessionDbId) continue;
      try {
        const res = await fetch(`${API_URL}/api/admin/bookings/mark-session-missed`, {
          method: "POST",
          headers: {
            Authorization: `${token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId, sessionId: sessionDbId }),
        });
        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          throw new Error("Server returned invalid response (possibly not JSON).");
        }
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to mark as missed");
        }
      } catch (err) {
        alert(
          "Failed to mark missed for Appt#: " +
            bookingId +
            ". " +
            (typeof err === "string"
              ? err
              : err instanceof Error
              ? err.message
              : "Error marking as missed")
        );
      }
    }
    setMultiMarkingMissed(false);
    setSelectedAppointments({});
    await fetchReceptionDeskData();
  };

  // NEW: Multi-mark-not-checked-in handler
  const handleMultiMarkAsNotCheckedIn = async () => {
    const keys: string[] = Object.entries(selectedAppointments)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);

    if (keys.length === 0) {
      alert("Please select at least one appointment to mark as Not Checked In.");
      return;
    }
    setMultiMarkingNotCheckedIn(true);
    const token = localStorage.getItem("admin-token");

    for (const key of keys) {
      const [bookingId, sessionDbId] = key.split("||");
      if (!bookingId || !sessionDbId) continue;
      try {
        const res = await fetch(`${API_URL}/api/admin/bookings/mark-session-not-checked-in`, {
          method: "POST",
          headers: {
            Authorization: `${token || ""}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ bookingId, sessionId: sessionDbId }),
        });
        let data;
        try {
          data = await res.json();
        } catch (jsonErr) {
          throw new Error("Server returned invalid response (possibly not JSON).");
        }
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to mark as Not Checked In");
        }
      } catch (err) {
        alert(
          "Failed to mark Not Checked In for Appt#: " +
            bookingId +
            ". " +
            (typeof err === "string"
              ? err
              : err instanceof Error
              ? err.message
              : "Error marking as Not Checked In")
        );
      }
    }
    setMultiMarkingNotCheckedIn(false);
    setSelectedAppointments({});
    await fetchReceptionDeskData();
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
      // selectable: all types, we allow selection to "reset" any session that isn't NotCheckedIn
      if (a.status === "CheckedIn" || a.status === "Missed" || a.status === "NotCheckedIn") {
        newSelection[`${a._id}||${a.sessionDbId}`] = true;
      }
    });
    setSelectedAppointments(newSelection);
  };

  const deselectAllAppointments = () => setSelectedAppointments({});

  const [collectModalVisible, setCollectModalVisible] = useState(false);
  const [collectPaymentCurrent, setCollectPaymentCurrent] = useState<PaymentInfo | null>(null);

  const openCollectModal = (payment: PaymentInfo) => {
    setCollectPaymentCurrent(payment);
    setCollectModalVisible(true);
  };

  const closeCollectModal = () => {
    setCollectModalVisible(false);
    setTimeout(() => {
      setCollectPaymentCurrent(null);
    }, 200);
  };

  const handleCollected = () => {
    if (!collectPaymentCurrent) return;
    setPayments((pays) => pays.filter((p) => p._id !== collectPaymentCurrent._id));
  };

  function getAppointmentStatusStr(a: Appointment): { label: string; colorClass: string; bgClass?: string } {
    if (a.status === "CheckedIn") {
      return {
        label: "Checked In",
        colorClass: "text-green-700",
        bgClass: "bg-green-50"
      };
    }
    if (a.status === "Missed") {
      return {
        label: "Missed",
        colorClass: "text-red-700",
        bgClass: "bg-red-50"
      };
    }
    // Default: NotCheckedIn
    return {
      label: "Not Checked In",
      colorClass: "text-yellow-800",
      bgClass: "bg-yellow-50"
    };
  }

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
            – {today ? formatDateDDMMYYYY(today) : formatDateDDMMYYYY(new Date().toISOString().slice(0, 10))}
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
                  Manage children flow and collections for the day.
                </p>

                <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                  <p className="font-medium text-slate-700 mb-2">Steps to Follow</p>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                    <li>
                      When a children arrives, find their appointment in
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
                    <li>
                      Use "Mark as Not Checked In" to revert a checked-in or missed session's status back to Not Checked In (reset). Available in the multi-select menu too.
                    </li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <FiCheckCircle /> Pro Tips
                  </div>
                  <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                    <li>Verify children contact info during session completion.</li>
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

      <CollectPaymentModal
        open={collectModalVisible}
        onClose={closeCollectModal}
        payment={collectPaymentCurrent}
        onCollected={handleCollected}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appointments */}
        <motion.div
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
        >
          <div className="flex items-center gap-2 font-semibold text-slate-700 mb-4">
            <FiCalendar className="text-blue-600" /> Today’s Appointments
          </div>

          {/* Multi-Check-in, multi-missed, and multi-not-checked-in Controls */}
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
              disabled={
                multiCheckingIn ||
                Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0
              }
              tabIndex={-1}
              style={{ minWidth: 88 }}
            >
              {multiCheckingIn ? "Marking as Completed…" : "Mark Session Completed"}
            </button>
            <button
              className={`rounded border border-rose-600 px-3 py-1 text-xs font-semibold text-rose-700 bg-rose-50 transition ${
                multiMarkingMissed || Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-rose-100"
              }`}
              onClick={handleMultiMarkAsMissed}
              type="button"
              disabled={
                multiMarkingMissed ||
                Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0
              }
              tabIndex={-1}
              style={{ minWidth: 85 }}
              title="Mark selected as Missed"
            >
              {multiMarkingMissed ? "Marking as Missed…" : "Mark as Missed"}
            </button>
            <button
              className={`rounded border border-yellow-500 px-3 py-1 text-xs font-semibold text-yellow-700 bg-yellow-50 transition ${
                multiMarkingNotCheckedIn || Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-yellow-100"
              }`}
              onClick={handleMultiMarkAsNotCheckedIn}
              type="button"
              disabled={
                multiMarkingNotCheckedIn ||
                Object.entries(selectedAppointments).filter(([_, checked]) => checked).length === 0
              }
              tabIndex={-1}
              style={{ minWidth: 120 }}
              title="Mark selected as Not Checked In (reset)"
            >
              {multiMarkingNotCheckedIn ? "Marking as Not Checked In…" : "Mark as Not Checked In"}
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
                const key = `${a._id}||${a.sessionDbId}`;
                const checked = !!selectedAppointments[key];
                // Now allow mark as not checked-in for both not-checked-in/missed/checkedin
                const selectable = typeof a.sessionDbId === 'string' && !!a.sessionDbId;
                const statusObj = getAppointmentStatusStr(a);

                return (
                  <div
                    key={a._id + "|" + a.sessionId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 last:pb-0 last:border-0 gap-3"
                  >
                    <div className="flex items-start gap-3 w-full">
                      {/* Checkbox for multi-select */}
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!selectable}
                          onChange={() => selectable && a._id && a.sessionDbId && toggleAppointmentSelection(a._id, a.sessionDbId)}
                          className="accent-blue-600"
                          tabIndex={selectable ? 0 : -1}
                          aria-label={
                            selectable
                              ? `Select appointment ${a.appointmentId} for multi actions`
                              : "Session not selectable"
                          }
                          style={{ width: 16, height: 16 }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                          <div className="font-semibold text-blue-700 text-sm flex items-center gap-2">
                            {a.patient && a.patient._id ? (
                              <a
                                href={`/admin/children?patientId=${encodeURIComponent(a.patient._id)}`}
                                className="hover:underline"
                                title="View children details"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                              >
                                {a.patient.name ?? "Anonymous"}
                              </a>
                            ) : (
                              a.patient?.name ?? "Anonymous"
                            )}
                            <span className="text-xs text-blue-400 font-semibold">
                              ({a.patient?.patientId || "--"})
                            </span>
                          </div>

                          <span className="text-xs text-slate-500 font-mono whitespace-nowrap mt-0.5">
                            Session ID: {a.sessionId ?? "—"}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <div className="text-[13px] font-semibold text-slate-700 flex items-center gap-1">
                            <span className="font-bold text-slate-700">Appt#:</span>
                            <span className="text-blue-700">{a.appointmentId}</span>
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {SESSION_TIME_OPTIONS.find(opt => opt.id === a.time)?.label ?? a.time ?? ""}
                          </span>
                          <span
                            className={`ml-2 ${statusObj.colorClass} text-xs font-semibold px-2 py-0.5 rounded whitespace-nowrap ${statusObj.bgClass ?? ""}`}
                          >
                            {statusObj.label}
                          </span>
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1">
                          <span className="font-semibold text-slate-600">Therapist:</span>
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
                          </span>
                          <span className="text-blue-400 font-mono">{a.therapistId ? `(${a.therapistId})` : ""}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-center justify-end mt-2 sm:mt-0 min-w-max">
                      {a.status === "NotCheckedIn" ? (
                        <>
                          <button
                            onClick={() => a.sessionDbId ? handleCheckIn(a._id, a.sessionDbId) : undefined}
                            className="rounded-full border w-full border-blue-500 px-4 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-50 shadow-sm transition"
                            disabled={!a.sessionDbId}
                            title={!a.sessionDbId ? "Invalid session ID" : undefined}
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => a.sessionDbId ? handleMissed(a._id, a.sessionDbId) : undefined}
                            className="rounded-full border w-full border-rose-500 px-3 py-1.5 text-xs font-medium text-rose-600 bg-white hover:bg-rose-50 shadow-sm transition"
                            title={!a.sessionDbId ? "Invalid session ID" : "Mark as Missed"}
                            disabled={!a.sessionDbId}
                          >
                            Mark as Missed
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Show Mark as Not Checked In for both Missed and CheckedIn */}
                          <button
                            onClick={() => a.sessionDbId ? handleMarkNotCheckedIn(a._id, a.sessionDbId) : undefined}
                            className="rounded-full border w-full border-yellow-500 px-3 py-1.5 text-xs font-medium text-yellow-700 bg-white hover:bg-yellow-50 shadow-sm transition"
                            title={!a.sessionDbId ? "Invalid session ID" : "Reset to Not Checked In"}
                            disabled={!a.sessionDbId}
                          >
                            Mark as Not Checked In
                          </button>
                          {a.status === "Missed" ? (
                            <span className="rounded-full  border w-full border-rose-500 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 whitespace-nowrap">
                              Marked as Missed
                            </span>
                          ) : (
                            <span className="rounded-full  border w-full border-green-500 px-3 py-1.5 text-xs font-semibold text-green-600 bg-green-50 whitespace-nowrap">
                              Session Completed
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
        {/* Payments - Discount and coupon-aware */}
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
              {payments.map((payment) => {
                const disc =
                  typeof getDiscountPercent(payment) === "number"
                    ? Math.round(
                        ((toNumber(payment.paymentAmount ?? payment.totalAmount) || 0) *
                          (getDiscountPercent(payment) || 0)) /
                          100
                      )
                    : 0;
                const percent = getDiscountPercent(payment);
                const net =
                  toNumber(payment.paymentAmount ?? payment.totalAmount) !== undefined && percent
                    ? calcDiscountedAmount(toNumber(payment.paymentAmount ?? payment.totalAmount)!, percent)
                    : toNumber(payment.paymentAmount ?? payment.totalAmount);
                const paid = (toNumber(payment.amountPaid) ?? 0);
                const outstanding = typeof net === "number" ? (net - paid) : undefined;
                return (
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
                          {payment.patientId ? (
                            <a
                              href={`/admin/children?patientId=${encodeURIComponent(payment.patientId)}`}
                              className="text-blue-700 hover:underline"
                              title="View children details"
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
                      <div className="text-xs text-slate-500 flex flex-wrap gap-1 mt-0.5 items-end">
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
                        {typeof payment.paymentAmount !== "undefined" && (
                          <span>
                            Invoice: ₹
                            {String(payment.paymentAmount)}
                          </span>
                        )}
                        {disc > 0 && (
                          <span className="text-rose-500">
                            − ₹{disc}
                          </span>
                        )}
                        {percent > 0 && (
                          <span className="text-rose-800">
                            ({percent}% discount)
                          </span>
                        )}
                        <span>
                          Payable: ₹{typeof net !== "undefined" ? net : (payment.paymentAmount ?? "—")}
                        </span>
                        {(typeof paid !== "undefined" && (paid || paid === 0)) && (
                          <span>
                            , Paid: ₹
                            {paid}
                          </span>
                        )}
                        {typeof outstanding !== "undefined" && outstanding > 0 && (
                          <span>
                            , Due: ₹{outstanding}
                          </span>
                        )}
                        {payment.createdAt && (
                          <span className="text-slate-400 ml-2">
                            {formatDateDDMMYYYY(payment.createdAt.slice(0, 10))}
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
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}