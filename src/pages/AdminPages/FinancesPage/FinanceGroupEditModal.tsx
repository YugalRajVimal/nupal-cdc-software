// Components/FinanceGroupEditModal.tsx
//
// Replaces the old EditPaymentMethodModal (single-field, single-row) with a
// full transaction-group editor:
//   - Shows the originating Payment.transactions[] entry (what actually
//     happened: amount, method, UTR, time)
//   - Lists every Finances row sharing that transactionRef, editable
//     (date/amount/paymentMethod/utr) unless locked (Cashfree)
//   - Shows each linked booking's invoice/due/checked-in-session charge
//   - Shows patient wallet balance, before and live-previewed after
//   - Red row background wherever something doesn't reconcile:
//       * group total != original transaction amount
//       * a locked (Cashfree) row somehow appears in the edit set
//       * patient-level identity (Finances == wallet + amountPaid) breaks
//   - Requires a reason before saving; blocks save while group is unbalanced
//
// Drop-in usage (in FinancesPage.tsx):
//   <FinanceGroupEditModal
//     open={showEditModal}
//     financeId={editingLog?._id ?? null}
//     onClose={() => setShowEditModal(false)}
//     onSaved={() => { setShowEditModal(false); refetchFinances(); }}
//   />

import { useEffect, useMemo, useState } from "react";
import axios from "axios";

const PAYMENT_METHOD_OPTIONS = ["online", "cash", "wallet"]; // cashfree deliberately excluded — never assignable via edit

interface GroupRow {
  _id: string;
  date: string;
  amount: number;
  paymentMethod: string;
  utr: string[];
  description: string;
  childrenName?: string;
  childrenId?: string;
  booking?: string;
  locked: boolean;
}

interface BookingDetail {
  bookingId: string;
  appointmentId: string;
  invoiceAmount: number;
  amountPaid: number;
  due: number;
  checkedInSessionCharge: number;
  checkedInCount: number;
  totalSessions: number;
  paymentStatus: string | null;
}

interface EditContext {
  transactionRef: string;
  locked: boolean;
  lockedReason: string | null;
  transactions: Array<{ paymentId: string; amount: number; paymentMethod: string; utr: string[]; type: string; paymentTime: string }>;
  originalTransactionAmount: number;
  groupRows: GroupRow[];
  groupTotal: number;
  groupMismatchesTransaction: boolean;
  bookings: BookingDetail[];
  wallet: {
    balance: number;
    patientReconciliation: { sumFinances: number; sumAmountPaid: number; expected: number; mismatch: boolean };
  } | null;
}

type RowEdit = { date?: string; amount?: number; paymentMethod?: string; utr?: string[] };

function inr(n: number | undefined | null) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

export default function FinanceGroupEditModal({
  open,
  financeId,
  onClose,
  onSaved,
}: {
  open: boolean;
  financeId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<EditContext | null>(null);
  const [edits, setEdits] = useState<Record<string, RowEdit>>({});
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !financeId) return;
    setCtx(null);
    setEdits({});
    setReason("");
    setSaveError(null);
    setLoadError(null);
    setLoading(true);

    const baseUrl = import.meta.env.VITE_API_URL || "";
    axios
      .get(`${baseUrl}/api/admin/finance/${financeId}/edit-context`)
      .then((res) => {
        const data = res.data;
        // Defensive shape check: the server can 200 with a success:false-ish
        // payload (or a shape that doesn't match what we expect) without
        // axios treating it as an error. Don't let a malformed/unexpected
        // response through as if it were a valid context — that's how you
        // get "Cannot read properties of undefined" deep in a memo instead
        // of a clear error message.
        if (!data || data.success === false || !Array.isArray(data.groupRows)) {
          setLoadError(data?.message || "Server returned an unexpected response for this record.");
          return;
        }
        setCtx({
          ...data,
          groupRows: data.groupRows ?? [],
          transactions: data.transactions ?? [],
          bookings: data.bookings ?? [],
          wallet: data.wallet ?? null,
          originalTransactionAmount: data.originalTransactionAmount ?? 0,
        });
      })
      .catch((err) => {
        const msg = err?.response?.data?.message || "Failed to load edit details";
        setLoadError(msg);
      })
      .finally(() => setLoading(false));
  }, [open, financeId]);

  const groupTotal = useMemo(() => {
    if (!ctx || !Array.isArray(ctx.groupRows)) return 0;
    return ctx.groupRows.reduce((sum, r) => {
      const e = edits[r._id];
      const amt = e?.amount !== undefined ? Number(e.amount) : r.amount;
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
  }, [ctx, edits]);

  const groupDelta = ctx ? Math.round((groupTotal - ctx.originalTransactionAmount) * 100) / 100 : 0;
  const groupBalanced = groupDelta === 0;

  // Live preview: for each row that changed, what's the amount delta, and
  // roll that up per booking to preview the new due / wallet overflow.
  const bookingPreview = useMemo(() => {
    if (!ctx || !Array.isArray(ctx.groupRows) || !Array.isArray(ctx.bookings)) return {};
    const deltaByBooking: Record<string, number> = {};
    ctx.groupRows.forEach((r) => {
      const e = edits[r._id];
      if (!e || e.amount === undefined || !r.booking) return;
      const delta = Number(e.amount) - r.amount;
      if (!delta) return;
      deltaByBooking[r.booking] = (deltaByBooking[r.booking] || 0) + delta;
    });

    const out: Record<string, { newAmountPaid: number; newDue: number; overflowToWallet: number }> = {};
    ctx.bookings.forEach((b) => {
      const delta = deltaByBooking[b.bookingId] || 0;
      let newAmountPaid = b.amountPaid + delta;
      let overflowToWallet = 0;
      if (newAmountPaid > b.invoiceAmount) {
        overflowToWallet = newAmountPaid - b.invoiceAmount;
        newAmountPaid = b.invoiceAmount;
      }
      if (newAmountPaid < 0) newAmountPaid = 0;
      out[b.bookingId] = {
        newAmountPaid,
        newDue: Math.max(0, b.invoiceAmount - newAmountPaid),
        overflowToWallet,
      };
    });
    return out;
  }, [ctx, edits]);

  const walletOverflowTotal = Object.values(bookingPreview).reduce(
    (s, b) => s + (b?.overflowToWallet || 0),
    0
  );
  const walletShortfallTotal = useMemo(() => {
    if (!ctx || !Array.isArray(ctx.groupRows) || !Array.isArray(ctx.bookings)) return 0;
    // Any booking edited below what was already applied to it that isn't
    // covered by overflow elsewhere reduces amountPaid, i.e. "goes back to due" —
    // handled per-row above (newDue). This tracker is just for the wallet-side
    // summary line when a booking's own paid amount would need to go negative
    // (which the service clamps to 0 and treats as a wallet debit).
    let shortfall = 0;
    ctx.groupRows.forEach((r) => {
      const e = edits[r._id];
      if (!e || e.amount === undefined || !r.booking) return;
      const b = ctx.bookings.find((bb) => bb.bookingId === r.booking);
      if (!b) return;
      const delta = Number(e.amount) - r.amount;
      if (b.amountPaid + delta < 0) shortfall += Math.abs(b.amountPaid + delta);
    });
    return shortfall;
  }, [ctx, edits]);

  // ctx.wallet can legitimately be null (e.g. group's rows aren't tied to any
  // booking yet, so no patient could be resolved) — never assume it's present.
  const previewWalletBalance = ctx?.wallet
    ? Math.max(0, ctx.wallet.balance + walletOverflowTotal - walletShortfallTotal)
    : 0;

  function setRowEdit(rowId: string, patch: RowEdit) {
    setEdits((prev) => ({ ...prev, [rowId]: { ...prev[rowId], ...patch } }));
  }

  function rowHasMismatch(row: GroupRow) {
    if (row.locked && edits[row._id]) return true; // shouldn't happen (inputs disabled) but guard anyway
    return false;
  }

  async function handleSave() {
    if (!ctx) return;
    if (!groupBalanced) {
      setSaveError(
        `Edited rows total ${inr(groupTotal)} but the original transaction was ${inr(ctx.originalTransactionAmount)}. Adjust amounts so the group total matches, or edit the transaction itself first / contact a Super Admin.`
      );
      return;
    }
    if (!reason.trim()) {
      setSaveError("Please enter a reason for this edit.");
      return;
    }
    const editList = Object.entries(edits)
      .filter(([, e]) => Object.keys(e).length > 0)
      .map(([financeId, e]) => ({ financeId, ...e }));
    if (editList.length === 0) {
      setSaveError("No changes made.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      await axios.post(`${baseUrl}/api/admin/finance/edit-transaction-group`, {
        transactionRef: ctx.transactionRef,
        edits: editList,
        reason: reason.trim(),
      });
      onSaved();
    } catch (err: any) {
      setSaveError(err?.response?.data?.message || "Failed to save edit");
    } finally {
      setSaving(false);
    }
  }

  if (!open || !financeId) return null;

  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl border">
        <div className="px-6 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold">Edit Finance Record</h2>
          <button className="text-slate-400 hover:text-slate-700" onClick={onClose}>✕</button>
        </div>

        <div className="px-6 py-4">
          {loading && <div className="text-sm text-slate-500 py-8 text-center">Loading transaction details…</div>}

          {loadError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{loadError}</div>
          )}

          {!loading && ctx && Array.isArray(ctx.groupRows) && (
            <>
              {ctx.locked && (
                <div className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded p-3">
                  {ctx.lockedReason}
                </div>
              )}

              {/* Originating transaction */}
              <section className="mb-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Originating Transaction</h3>
                <div className="border rounded divide-y">
                  {(ctx.transactions ?? []).length === 0 && (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">
                      No originating Payment.transactions entry could be resolved for this record.
                    </div>
                  )}
                  {(ctx.transactions ?? []).map((t, i) => (
                    <div key={i} className="px-3 py-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
                      <span className="font-medium">{inr(t.amount)}</span>
                      <span className="capitalize">{t.paymentMethod}</span>
                      <span className="capitalize text-slate-500">{t.type}</span>
                      <span className="text-sky-700">{t.paymentId}</span>
                      {t.utr?.length > 0 && <span className="text-slate-500">UTR: {t.utr[t.utr.length - 1]}</span>}
                      {t.paymentTime && (
                        <span className="text-slate-500">{new Date(t.paymentTime).toLocaleString("en-GB")}</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Original combined amount: <span className="font-medium">{inr(ctx.originalTransactionAmount)}</span>
                </div>
              </section>

              {/* Editable finance rows in this group */}
              <section className="mb-5">
                <h3 className="text-sm font-semibold text-slate-700 mb-2">
                  Finance Records in This Transaction ({ctx.groupRows.length})
                </h3>
                <div className={`text-xs mb-2 ${groupBalanced ? "text-emerald-700" : "text-red-600 font-medium"}`}>
                  Group total: {inr(groupTotal)} {groupBalanced ? "✓ matches transaction" : `— ${groupDelta > 0 ? "exceeds" : "short of"} transaction by ${inr(Math.abs(groupDelta))}`}
                </div>

                <div className="border rounded overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="text-left px-2 py-2 font-medium">Booking</th>
                        <th className="text-left px-2 py-2 font-medium">Date</th>
                        <th className="text-left px-2 py-2 font-medium">Amount</th>
                        <th className="text-left px-2 py-2 font-medium">Method</th>
                        <th className="text-left px-2 py-2 font-medium">UTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ctx.groupRows.map((row) => {
                        const e = edits[row._id] || {};
                        const mismatch = rowHasMismatch(row);
                        return (
                          <tr
                            key={row._id}
                            className={row.locked ? "bg-slate-50 text-slate-400" : mismatch ? "bg-red-50" : ""}
                          >
                            <td className="px-2 py-2 align-top">
                              <div className="font-medium">{row.childrenName || "—"}</div>
                              <div className="text-xs text-slate-400">{row.description}</div>
                            </td>
                            <td className="px-2 py-2 align-top">
                              <input
                                type="date"
                                disabled={row.locked}
                                className="border rounded px-2 py-1 text-sm w-36 disabled:bg-slate-100"
                                value={(e.date ?? row.date)?.slice(0, 10)}
                                onChange={(ev) => setRowEdit(row._id, { date: ev.target.value })}
                              />
                            </td>
                            <td className="px-2 py-2 align-top">
                              <input
                                type="number"
                                min={1}
                                disabled={row.locked}
                                className="border rounded px-2 py-1 text-sm w-28 disabled:bg-slate-100"
                                value={e.amount ?? row.amount}
                                onChange={(ev) => setRowEdit(row._id, { amount: Number(ev.target.value) })}
                              />
                            </td>
                            <td className="px-2 py-2 align-top">
                              <select
                                disabled={row.locked}
                                className="border rounded px-2 py-1 text-sm disabled:bg-slate-100"
                                value={e.paymentMethod ?? row.paymentMethod}
                                onChange={(ev) => setRowEdit(row._id, { paymentMethod: ev.target.value })}
                              >
                                {row.locked ? (
                                  <option value="cashfree">cashfree (locked)</option>
                                ) : (
                                  PAYMENT_METHOD_OPTIONS.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))
                                )}
                              </select>
                            </td>
                            <td className="px-2 py-2 align-top">
                              <input
                                type="text"
                                disabled={row.locked || (e.paymentMethod ?? row.paymentMethod) !== "online"}
                                placeholder={(e.paymentMethod ?? row.paymentMethod) === "online" ? "UTR" : "—"}
                                className="border rounded px-2 py-1 text-sm w-32 disabled:bg-slate-100"
                                value={(e.utr ?? row.utr)?.[row.utr.length - 1] ?? ""}
                                onChange={(ev) => setRowEdit(row._id, { utr: [ev.target.value] })}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Linked bookings + checked-in session detail */}
              {(ctx.bookings ?? []).length > 0 && (
                <section className="mb-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Linked Bookings</h3>
                  <div className="border rounded divide-y">
                    {ctx.bookings.map((b) => {
                      const p = bookingPreview[b.bookingId];
                      const dueChanged = p && p.newDue !== b.due;
                      return (
                        <div key={b.bookingId} className={`px-3 py-2 text-sm ${dueChanged && p.newDue > b.due ? "bg-red-50" : ""}`}>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <span className="font-medium">#{b.appointmentId}</span>
                            <span>Invoice: {inr(b.invoiceAmount)}</span>
                            <span>Paid: {inr(b.amountPaid)}</span>
                            <span>Due: {inr(b.due)}</span>
                            <span>Checked-in: {b.checkedInCount}/{b.totalSessions} sessions ({inr(b.checkedInSessionCharge)})</span>
                            <span className="capitalize text-slate-500">{b.paymentStatus}</span>
                          </div>
                          {p && (p.newAmountPaid !== b.amountPaid) && (
                            <div className="text-xs mt-1 flex flex-wrap gap-x-4">
                              <span className={p.newDue > b.due ? "text-red-600 font-medium" : "text-emerald-700"}>
                                After edit → Paid: {inr(p.newAmountPaid)}, Due: {inr(p.newDue)}
                                {p.newDue > b.due && " (shortfall goes back to due)"}
                              </span>
                              {p.overflowToWallet > 0 && (
                                <span className="text-sky-700">+{inr(p.overflowToWallet)} routed to wallet as advance</span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Wallet + reconciliation */}
              {ctx.wallet && (
                <section className="mb-5">
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Wallet & Reconciliation</h3>
                  <div
                    className={`border rounded p-3 text-sm ${
                      ctx.wallet.patientReconciliation.mismatch ? "bg-red-50 border-red-200" : "bg-slate-50"
                    }`}
                  >
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                      <span>Current wallet balance: <span className="font-medium">{inr(ctx.wallet.balance)}</span></span>
                      {previewWalletBalance !== ctx.wallet.balance && (
                        <span className="text-sky-700">
                          After this edit: <span className="font-medium">{inr(previewWalletBalance)}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs mt-2 text-slate-500">
                      Check: sum(finance income) {inr(ctx.wallet.patientReconciliation.sumFinances)} should equal
                      {" "}wallet + amountPaid across bookings ({inr(ctx.wallet.patientReconciliation.expected)})
                    </div>
                    {ctx.wallet.patientReconciliation.mismatch && (
                      <div className="text-xs mt-1 text-red-600 font-medium">
                        ⚠ This patient's records are currently out of balance — likely pre-existing, please verify before editing.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Reason + actions */}
              <section>
                <label className="block text-sm font-medium mb-1">Reason for edit (required)</label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Corrected mistyped UTR, date was recorded a day late, etc."
                />
              </section>

              {saveError && <div className="text-sm text-red-600 mt-3">{saveError}</div>}

              <div className="flex gap-2 justify-end pt-4 mt-4 border-t">
                <button className="px-4 py-2 bg-slate-100 rounded text-slate-800" onClick={onClose} disabled={saving}>
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                  onClick={handleSave}
                  disabled={saving || ctx.locked || !groupBalanced}
                  title={!groupBalanced ? "Group total must match the original transaction before saving" : ""}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </>
          )}

          {!loading && !loadError && ctx && !Array.isArray(ctx.groupRows) && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
              Received an unexpected response shape for this record's edit context. Nothing was loaded — please
              contact engineering rather than retrying blindly.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}