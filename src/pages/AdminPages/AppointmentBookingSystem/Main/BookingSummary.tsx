import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUser, FiTag, FiPackage, FiChevronDown, FiHash,
  FiEdit2, FiX, FiCreditCard, FiCheckCircle, FiSearch,
} from "react-icons/fi";
import { FiDollarSign, FiSmartphone } from "react-icons/fi";
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
    paymentAmount?: number | string;
    amountPaid?: number | string;
    paymentRecordId?: string;
    discountPercent?: number;
    allowDiscountOption?: boolean;
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

function calcDiscountedAmount(amount: number, percent?: number) {
  if (typeof percent !== "number" || percent <= 0) return amount;
  return Math.round(amount - (amount * percent) / 100);
}

// function CollectPaymentModal({ open, onClose, payment, onCollected }: CollectPaymentModalProps) {
//   const [collectType, setCollectType] = useState<"full" | "partial">("full");
//   const [partialValue, setPartialValue] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Option to apply or not apply the discount
//   const [applyDiscount, setApplyDiscount] = useState(true);

//   const paymentAmountOriginal = payment ? toNumber(payment.paymentAmount) : undefined;
//   const discountPercent = (payment && typeof payment.discountPercent === "number") ? payment.discountPercent : 0;
//   const discountedAmount = paymentAmountOriginal !== undefined ? calcDiscountedAmount(paymentAmountOriginal, applyDiscount ? discountPercent : 0) : undefined;
//   const paymentAmount = discountedAmount;

//   const amountAlreadyPaid = (payment && toNumber(payment.amountPaid)) ?? 0;
//   const partialNumeric = parseFloat(partialValue);
//   const isPartialOverDue =
//     collectType === "partial" &&
//     typeof paymentAmount === "number" &&
//     !isNaN(partialNumeric) &&
//     partialNumeric + (typeof amountAlreadyPaid === "number" ? amountAlreadyPaid : 0) > paymentAmount;
//   const paymentDue =
//     typeof paymentAmount === "number" && typeof amountAlreadyPaid === "number"
//       ? paymentAmount - amountAlreadyPaid
//       : paymentAmount;

//   useEffect(() => {
//     if (open) {
//       setCollectType("full");
//       setPartialValue("");
//       setLoading(false);
//       setApplyDiscount(true); // reset to "apply" by default on open
//     }
//   }, [open, payment]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!payment || loading || isPartialOverDue) return;
//     if (collectType === "partial" && (isNaN(partialNumeric) || partialNumeric <= 0)) {
//       alert("Please enter a valid partial amount."); return;
//     }
//     let endpoint = import.meta.env.VITE_API_URL || (window as any).VITE_API_URL;
//     if (endpoint) endpoint = endpoint.replace(/\/$/, "");
//     setLoading(true);
//     try {
//       const body: Record<string, any> = {
//         paymentType: collectType,
//         applyDiscount,
//       };
//       // ADD: discountApplied field if discount applied
//       if (typeof discountPercent === "number" && discountPercent > 0 && applyDiscount) {
//         body.discountApplied = true;
//       } else {
//         body.discountApplied = false;
//       }
//       if (collectType === "partial") body.partialAmount = partialNumeric;
//       const res = await fetch(`${endpoint}/api/admin/bookings/${payment._id}/collect-payment`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `${localStorage.getItem("admin-token") || ""}`,
//         },
//         body: JSON.stringify(body),
//       });
//       const data = await res.json();
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
//           <div className="p-6 pb-2">
//             <div className="font-semibold text-lg text-slate-800 mb-2">Collect Payment</div>
//             <div className="text-sm mb-3">
//               <span className="font-medium text-blue-700">Appt#: {payment.appointmentId}</span><br />
//               <span className="text-slate-800">{payment.patientName}</span>{" "}
//               <span className="text-xs text-blue-300 font-mono">({payment.patientId})</span><br />
//               {/* Show original payment amount if a discount is available */}
//               {typeof discountPercent === "number" && discountPercent > 0 && (
//                 <span className="text-xs text-slate-400 block">
//                   Original Invoice Amount:{" "}
//                   <span className="font-semibold text-slate-600">
//                     ₹
//                     {typeof paymentAmountOriginal === "number"
//                       ? paymentAmountOriginal
//                       : String(payment.paymentAmount ?? "—")}
//                   </span>
//                 </span>
//               )}

//               {/* Show Discount options if discount is present */}
//               {typeof discountPercent === "number" && discountPercent > 0 && (
//                 <div>
//                   <div className="mb-1 text-xs">
//                     <label className="font-semibold text-green-700 flex items-center gap-2 cursor-pointer">
//                       <input
//                         type="checkbox"
//                         className="mr-1 accent-green-600"
//                         checked={applyDiscount}
//                         onChange={e => setApplyDiscount(!!e.target.checked)}
//                         disabled={loading}
//                       />
//                       Apply Discount ({discountPercent}%)
//                     </label>
//                   </div>
//                 </div>
//               )}
//               <span className="text-xs text-slate-500 block">
//                 Invoice Amount:{" "}
//                 <span className="font-semibold text-slate-700">
//                   ₹
//                   {paymentAmount !== undefined
//                     ? paymentAmount
//                     : String(payment.paymentAmount ?? "—")}
//                 </span>
//                 {typeof discountPercent === "number" &&
//                   discountPercent > 0 &&
//                   applyDiscount && (
//                     <span className="ml-1 text-green-800 font-semibold bg-green-100 px-1 rounded">
//                       (after discount)
//                     </span>
//                   )}
//               </span>
//               {payment.amountPaid && (
//                 <span className="text-xs text-slate-400 block">
//                   Already paid: ₹{String(payment.amountPaid)}
//                 </span>
//               )}
//               <span className="text-xs text-rose-600 block">
//                 Due Amount:{" "}
//                 <span className="font-semibold">
//                   ₹{typeof paymentDue === "number" ? paymentDue : "—"}
//                 </span>
//               </span>
//               {/* Show discount percent if present and option to apply is unchecked */}
//               {typeof discountPercent === "number" && discountPercent > 0 && applyDiscount && (
//                 <div className="text-xs mt-1 text-green-700 font-medium">
//                   Discount Applied: {discountPercent}%
//                 </div>
//               )}
//             </div>
//             <form onSubmit={handleSubmit}>
//               <div className="mb-4 mt-1">
//                 <label className="block font-medium text-slate-700 mb-1">Collection Type</label>
//                 <div className="flex gap-4 items-center">
//                   <label className="flex items-center gap-1 cursor-pointer">
//                     <input type="radio" name="collectType" value="full" checked={collectType === "full"} onChange={() => setCollectType("full")} disabled={loading} />
//                     <span className="text-sm">Full Amount</span>
//                   </label>
//                   <label className="flex items-center gap-1 cursor-pointer">
//                     <input type="radio" name="collectType" value="partial" checked={collectType === "partial"} onChange={() => setCollectType("partial")} disabled={loading} />
//                     <span className="text-sm">Partial Amount</span>
//                   </label>
//                 </div>
//               </div>
//               {collectType === "partial" && (
//                 <div className="mb-2">
//                   <label className="block mb-1 text-slate-700 text-xs">Enter Partial Amount <span className="text-red-500">*</span></label>
//                   <input
//                     type="number" min={1} step={1} value={partialValue}
//                     onChange={(e) => setPartialValue(e.target.value)}
//                     className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-green-200 text-sm"
//                     placeholder="E.g. 800" required disabled={loading} max={paymentDue ?? undefined}
//                   />
//                   {isPartialOverDue && (
//                     <div className="text-xs text-red-500 mt-1">
//                       Partial amount plus already paid cannot exceed the invoice total ({paymentAmount}).
//                     </div>
//                   )}
//                 </div>
//               )}
//               <button
//                 type="submit"
//                 className={`mt-3 w-full rounded-md border border-green-500 px-4 py-2 text-sm font-semibold text-green-700 ${
//                   loading || isPartialOverDue ? "bg-green-50 opacity-80 cursor-not-allowed" : "hover:bg-green-50"
//                 }`}
//                 disabled={loading || isPartialOverDue}
//               >
//                 {loading ? "Processing…" : collectType === "full" ? "Collect Full Amount" : "Collect Partial Amount"}
//               </button>
//               <div className="mt-1 text-xs text-slate-400 text-center">
//                 {collectType === "partial"
//                   ? "Collects a partial payment; the remaining will appear as pending."
//                   : "Marks the invoice as fully paid."}
//               </div>
//             </form>
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// ─── CheckInConfirmationModal ─────────────────────────────────────────────────


// ─── CollectPaymentModal ──────────────────────────────────────────────────────

type PaymentMethod = "cash" | "online" | "";

function CollectPaymentModal({ open, onClose, payment, onCollected }: CollectPaymentModalProps) {
  const [collectType, setCollectType] = useState<"full" | "partial">("full");
  const [partialValue, setPartialValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [applyDiscount, setApplyDiscount] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("");
  const [utr, setUtr] = useState("");

  // Payment time state
  const [paymentTime, setPaymentTime] = useState(() => {
    // Default value: now, formatted as yyyy-MM-ddTHH:mm for input
    const now = new Date();
    return now.toISOString().slice(0, 16);
  });

  const paymentAmountOriginal = payment ? toNumber(payment.paymentAmount) : undefined;
  const discountPercent = (payment && typeof payment.discountPercent === "number") ? payment.discountPercent : 0;
  const discountedAmount = paymentAmountOriginal !== undefined
    ? calcDiscountedAmount(paymentAmountOriginal, applyDiscount ? discountPercent : 0)
    : undefined;
  const paymentAmount = discountedAmount;
  const amountAlreadyPaid = (payment && toNumber(payment.amountPaid)) ?? 0;
  const partialNumeric = parseFloat(partialValue);
  const paymentDue =
    typeof paymentAmount === "number" && typeof amountAlreadyPaid === "number"
      ? paymentAmount - amountAlreadyPaid
      : paymentAmount;

  const isPartialOverDue =
    collectType === "partial" &&
    typeof paymentDue === "number" &&
    !isNaN(partialNumeric) &&
    partialNumeric > paymentDue;

  const needsUtr = paymentMethod === "online";
  const utrMissing = needsUtr && utr.trim() === "";

  // Validate paymentTime is present and non-empty
  const paymentTimeMissing = !paymentTime || paymentTime.trim() === "";

  const canSubmit = !loading && !isPartialOverDue && paymentMethod !== "" && !utrMissing && !paymentTimeMissing &&
    (collectType === "full" || (!isNaN(partialNumeric) && partialNumeric > 0));

  useEffect(() => {
    if (open) {
      setCollectType("full");
      setPartialValue("");
      setLoading(false);
      setApplyDiscount(true);
      setPaymentMethod("");
      setUtr("");
      // On modal open, default paymentTime to now
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
        applyDiscount,
        discountApplied: typeof discountPercent === "number" && discountPercent > 0 && applyDiscount,
        paymentMethod,
        paymentTime: paymentTime ? new Date(paymentTime).toISOString() : undefined, // Send as ISO string
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

            {/* Booking info */}
            <div className="text-sm mb-3">
              <span className="font-medium text-blue-700">Appt#: {payment.appointmentId}</span><br />
              <span className="text-slate-800">{payment.patientName}</span>{" "}
              <span className="text-xs text-blue-300 font-mono">({payment.patientId})</span><br />

              {typeof discountPercent === "number" && discountPercent > 0 && (
                <span className="text-xs text-slate-400 block">
                  Original Amount:{" "}
                  <span className="font-semibold text-slate-600">₹{paymentAmountOriginal ?? "—"}</span>
                </span>
              )}
              {typeof discountPercent === "number" && discountPercent > 0 && (
                <div className="mb-1 text-xs">
                  <label className="font-semibold text-green-700 flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="mr-1 accent-green-600" checked={applyDiscount}
                      onChange={e => setApplyDiscount(!!e.target.checked)} disabled={loading} />
                    Apply Discount ({discountPercent}%)
                  </label>
                </div>
              )}
              <span className="text-xs text-slate-500 block">
                Invoice Amount:{" "}
                <span className="font-semibold text-slate-700">
                  ₹{paymentAmount ?? String(payment.paymentAmount ?? "—")}
                </span>
                {discountPercent > 0 && applyDiscount && (
                  <span className="ml-1 text-green-800 font-semibold bg-green-100 px-1 rounded">(after discount)</span>
                )}
              </span>
              {payment.amountPaid && (
                <span className="text-xs text-slate-400 block">Already paid: ₹{String(payment.amountPaid)}</span>
              )}
              <span className="text-xs text-rose-600 block">
                Due: <span className="font-semibold">₹{typeof paymentDue === "number" ? paymentDue : "—"}</span>
              </span>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Collection Type */}
              <div className="mb-3">
                <label className="block font-medium text-slate-700 mb-1 text-sm">Collection type</label>
                <div className="flex gap-4 items-center">
                  <label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="radio" name="collectType" value="full"
                      checked={collectType === "full"} onChange={() => setCollectType("full")} disabled={loading} />
                    Full amount
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer text-sm">
                    <input type="radio" name="collectType" value="partial"
                      checked={collectType === "partial"} onChange={() => setCollectType("partial")} disabled={loading} />
                    Partial amount
                  </label>
                </div>
              </div>

              {collectType === "partial" && (
                <div className="mb-3">
                  <label className="block mb-1 text-slate-700 text-xs font-medium">
                    Partial amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number" min={1} step={1} value={partialValue}
                    onChange={(e) => setPartialValue(e.target.value)}
                    className="w-full px-2 py-1 rounded border border-slate-300 text-slate-800 focus:ring focus:ring-green-200 text-sm"
                    placeholder="e.g. 800" required disabled={loading} max={paymentDue ?? undefined}
                  />
                  {isPartialOverDue && (
                    <div className="text-xs text-red-500 mt-1">
                      Cannot exceed the due amount (₹{paymentDue}).
                    </div>
                  )}
                </div>
              )}

              {/* Payment Time */}
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

              {/* ── Payment Method ── */}
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

              {/* ── UTR (shown only for online) ── */}
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
                    ? "Collect full amount"
                    : "Collect partial amount"}
              </button>
              <div className="mt-1 text-xs text-slate-400 text-center">
                {!paymentMethod
                  ? "Select a payment method to continue."
                  : collectType === "partial"
                    ? "Remaining balance will stay pending."
                    : "Marks the invoice as fully paid."}
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

// ─── MarkMissedConfirmationModal ─────────────────────────────────────────────────

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

// ─── BookingSummary ───────────────────────────────────────────────────────────

type BookingSummaryProps = {
  bookings: Booking[];
  setBookings: (b: Booking[]) => void;
  setBookingsLoading: (v: boolean) => void;
  setBookingsError: (v: string | null) => void;
  getTherapistObject: (booking: Booking) => Therapist | undefined;
  editBookingId: string | null;
  handleEditBooking: (id: string) => void;
  handleCollectPayment: (booking: Booking) => void;
  paymentLoadingBookingId: string | null;
};

// --- Utility for session time: "YYYY-MM-DD" + slotId to Date ---
// function getSessionDateTime(session: any) {
//   if (!session || !session.date) return null;
//   let slotObj = undefined;
//   if (session.slotId) {
//     slotObj = SESSION_TIME_OPTIONS.find(opt => opt.id === session.slotId);
//   }
//   let time = "09:00";
//   if (slotObj && slotObj.label) {
//     if (slotObj.label) {
//       const match = slotObj.label.match(/(\d{1,2}:\d{2})\s*-/);
//       if (match) {
//         time = match[1];
//       } else {
//         const h = slotObj.label.match(/(\d{1,2})\s*-/)?.[1];
//         if (h) time = `${h.padStart(2, "0")}:00`;
//       }
//     }
//   } else if (typeof session.slotId === "string" && /\d{1,2}-\d{1,2}/.test(session.slotId)) {
//     const hours = session.slotId.split("-")[0]?.padStart(2, "0");
//     time = hours ? `${hours}:00` : "09:00";
//   }
//   let dtString = `${session.date}T${time}`;
//   let dt = new Date(dtString);
//   if (isNaN(dt.getTime())) {
//     dt = new Date(session.date);
//   }
//   return dt;
// }

// SESSION STATUS MAPPING: 
// Status enum: ['CheckedIn', 'NotCheckedIn', 'Missed']
// Map "CheckedIn" => Checked In (green), "Missed" => Missed (gray), "NotCheckedIn" (or undefined) => Not Checked In (red)
function sessionStatusLabel(session: any) {
  // Check for explicit session.status
  if (session.status === "CheckedIn") {
    return { label: "Checked In", color: "green-700" };
  }
  if (session.status === "Missed") {
    return { label: "Missed", color: "gray-500" };
  }
  // Fallback/default: Not Checked In
  return { label: "Not Checked In", color: "red-600" };
}

export function BookingSummary({
  bookings, setBookings, setBookingsLoading, setBookingsError,
  getTherapistObject, editBookingId,
  handleEditBooking,
}: BookingSummaryProps) {
  const [bookingsLoading, setLocalBookingsLoading] = useState(false);
  const [bookingsError, setLocalBookingsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterTherapist, setFilterTherapist] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [therapistList, setTherapistList] = useState<Therapist[]>([]);

  // ----------- SESSION THERAPISTS FOR DROPDOWN -----------
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
  // -------------------------------------------------------

  // Collect Payment Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectModalPayment, setCollectModalPayment] = useState<any>(null);

  // Check-In Modal
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [checkInSession, setCheckInSession] = useState<any>(null);
  const [checkInBooking, setCheckInBooking] = useState<any>(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkInError, setCheckInError] = useState<string | null>(null);

  // Missed Modal
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
    setCollectModalOpen(true);
    setCollectModalPayment({
      _id: booking._id,
      appointmentId: booking.appointmentId,
      patientName: booking.patient?.name || "",
      patientId: booking.patient?._id || "",
      paymentAmount: booking.payment?.amount || booking.paymentAmount,
      amountPaid: booking.payment?.amountPaid || booking.amountPaid,
      paymentRecordId: booking.payment?._id,
      discountPercent,
      allowDiscountOption: discountPercent > 0,
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

  // Missed modal logic
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
      // API: POST /api/admin/bookings/mark-missed
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

  // Helper: Get session status label for UI
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

        {/* Search/Filter Bar */}
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

        {/* Pagination */}
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

        {/* Booking list */}
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
              const paymentAmount = booking.payment?.amount;
              const paidAmount = booking.payment?.amountPaid;

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
                    <div className="mb-1 flex items-center gap-2 text-xs font-mono text-gray-700">
                      <FiHash className="text-blue-500" /> Booking ID: {booking.appointmentId}
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

                  <div className="mb-2 px-2 py-2 rounded bg-sky-100 border border-sky-200">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-blue-900">
                      <span>Original Invoice Amount: <span className="font-mono">₹{paymentAmount ?? 0}</span></span>
                    </div>
                    {/* Discount section */}
                    {discountPercent > 0 && (
                      <div className="mb-1 flex flex-col gap-1 text-xs font-semibold text-green-700">
                        <div className="flex items-center gap-2">
                          <span>Discount Applied ({discountPercent}%)</span>
                          {booking.discountInfo?.coupon?.couponCode && (
                            <span className="ml-2 bg-green-100 px-2 py-0.5 rounded text-green-800 font-mono">
                              Code: {booking.discountInfo.coupon.couponCode}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-green-800">
                          Invoice Amount: 
                          <span className="font-mono">
                            ₹
                            {typeof paymentAmount === "number"
                              ? calcDiscountedAmount(paymentAmount, discountPercent)
                              : typeof paymentAmount === "number"
                                ? calcDiscountedAmount(paymentAmount, discountPercent)
                                : 0}
                            (after discount)
                          </span>
                        </div>
                      </div>
                    )}
                    {/* If no discount, show discounted value equals original */}
                    {discountPercent <= 0 && (
                      <div className="mb-1 flex items-center gap-2 text-xs text-slate-700">
                        <span className="text-slate-700">No Discount Applied</span>
                        <span className="font-mono">Invoice Amount: ₹{paymentAmount ?? paymentAmount ?? 0}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-blue-800 font-semibold mt-1">
                      Due Amount: 
                      <span className="font-mono">
                        ₹
                        {(() => {
                          const baseAmt = typeof paymentAmount === "number"
                            ? (discountPercent > 0
                              ? calcDiscountedAmount(paymentAmount, discountPercent)
                              : paymentAmount)
                            : typeof paymentAmount === "number"
                              ? (discountPercent > 0
                                ? calcDiscountedAmount(paymentAmount, discountPercent)
                                : paymentAmount)
                              : 0;
                          return typeof paidAmount === "number"
                            ? Math.max(0, baseAmt - paidAmount)
                            : baseAmt;
                        })()}
                      </span>
                    </div>
                  </div>

                  <div className="mb-2 flex items-center gap-2">
                    <FiCreditCard className="text-green-600" />
                    {isPaid ? (
                      <span className="text-green-700 font-semibold">Payment Collected</span>
                    ) : isPartiallyPaid ? (
                      <span className="text-amber-700 font-semibold">
                        Partially Paid
                        {typeof paymentAmount !== "undefined" && typeof paidAmount !== "undefined"
                          ? ` (Amount: ₹${paymentAmount} | Paid: ₹${paidAmount})`
                          : ""}
                      </span>
                    ) : (
                      <span className="text-orange-600 font-semibold">Payment Pending</span>
                    )}
                    {!isPaid && (
                      <button
                        className="ml-3 flex items-center gap-1 text-xs border px-2 py-1 rounded border-green-400 text-green-800 bg-green-100 hover:bg-green-200 font-medium transition"
                        onClick={() => handleModalCollectPayment(booking)}
                        title="Mark payment as collected"
                      >
                        <FiCreditCard /> Collect Payment
                      </button>
                    )}
                  </div>

                  {/* Sessions */}
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

                              // -- Statuses as per session.status --
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
                                    {/* Actions: Mark as CheckedIn or Mark as Missed (if neither) */}
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
