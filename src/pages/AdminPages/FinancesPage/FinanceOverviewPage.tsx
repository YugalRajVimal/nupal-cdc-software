// Pages/FinanceOverviewPage.tsx
//
// Replaces "open three flat tables and cross-reference them by hand" with one
// patient-centric view: search a child, see their wallet, every booking's
// invoice/paid/due, and one merged chronological ledger of every rupee that
// moved. Editing a specific finance row still opens the existing
// FinanceGroupEditModal — this page is a read-first hub, not a new editor.

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  FiSearch, FiUser, FiPhone, FiChevronDown, FiChevronRight,
  FiArrowUpRight, FiArrowDownRight, FiCreditCard, FiEdit2,
} from "react-icons/fi";
import FinanceGroupEditModal from "./FinanceGroupEditModal";

// ---------------------------------------------------------------------------
// Types (mirror the shape returned by GET /api/admin/finance/overview/:id)
// ---------------------------------------------------------------------------

interface SearchResult {
  _id: string;
  name: string;
  patientId: string;
  mobile1?: string;
}

interface TransactionEntry {
  amount: number;
  paymentMethod: string;
  utr?: string[];
  type: string;
  paymentTime?: string;
  financeRecord?: string | null;
  appointmentId: string;
}

interface FinanceRowLite {
  _id: string;
  date: string;
  description: string;
  amount: number;
  paymentMethod: string;
  utr?: string[];
  transactionRef?: string | null;
}

interface BookingDetail {
  bookingId: string;
  appointmentId: string;
  packageName: string | null;
  createdAt: string;
  invoiceAmount: number;
  amountPaid: number;
  due: number;
  status: string;
  checkedInCount: number;
  missedCount: number;
  totalSessions: number;
  transactions: TransactionEntry[];
  financeRows: FinanceRowLite[];
}

interface WalletTxn {
  type: "credit" | "debit";
  amount: number;
  reason: string;
  balanceAfter: number;
  remark?: string;
  createdAt: string;
}

interface LedgerEntry {
  time: string;
  kind: "payment" | "wallet_credit" | "wallet_debit";
  label: string;
  amount: number;
  paymentMethod?: string;
  utr?: string[];
  balanceAfter?: number;
  remark?: string;
}

interface OverviewResponse {
  success: boolean;
  patient: { _id: string; name: string; patientId: string; mobile1?: string; parentEmail?: string };
  summary: { totalInvoiced: number; totalPaid: number; totalDue: number; walletBalance: number };
  bookings: BookingDetail[];
  wallet: { balance: number; transactions: WalletTxn[] };
  ledger: LedgerEntry[];
  message?: string;
}

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-emerald-100 text-emerald-700",
  partiallypaid: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-600",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-sky-100 text-sky-700",
};

function inr(n: number | undefined | null) {
  return `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
}

// function fmtDate(d?: string) {
//   if (!d) return "—";
//   const date = new Date(d);
//   if (isNaN(date.getTime())) return "—";
//   return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
// }

function fmtDateTime(d?: string) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return `${date.toLocaleDateString("en-GB")}, ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

// ---------------------------------------------------------------------------

export default function FinanceOverviewPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const [walletExpanded, setWalletExpanded] = useState(false);
  const [editingFinanceId, setEditingFinanceId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseUrl = import.meta.env.VITE_API_URL || "";

  // Debounced typeahead search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || selected) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      setSearching(true);
      axios
        .get(`${baseUrl}/api/admin/finance/overview/search`, { params: { q: query.trim() } })
        .then((res) => {
          console.log("Search API response:", res);
          setResults(res.data?.results ?? []);
        })
        .catch((err) => {
          console.log("Search API error response:", err);
          setResults([]);
        })
        .finally(() => setSearching(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, selected]);

  const fetchOverview = (patientId: string) => {
    setLoading(true);
    setError(null);
    axios
      .get(`${baseUrl}/api/admin/finance/overview/${patientId}`)
      .then((res) => {
        console.log("Overview API response:", res);
        setOverview(res.data);
      })
      .catch((e) => {
        console.log("Overview API error response:", e);
        setError(e.response?.data?.message || e.message || "Failed to load overview");
      })
      .finally(() => setLoading(false));
  };

  const handleSelect = (r: SearchResult) => {
    setSelected(r);
    setQuery(`${r.name} (${r.patientId})`);
    setResults([]);
    fetchOverview(r._id);
  };

  const handleClearSelection = () => {
    setSelected(null);
    setQuery("");
    setOverview(null);
    setError(null);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Finance Overview</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search a child to see everything money-related in one place — invoices, payments, wallet, and transactions.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-lg mb-8">
        <div className="flex items-center border rounded-lg bg-white px-3 shadow-sm">
          <FiSearch className="text-slate-400" />
          <input
            className="w-full py-3 px-3 outline-none bg-transparent text-sm"
            placeholder="Search by child name or ID (e.g. P0028)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) setSelected(null);
              if (overview) setOverview(null);
            }}
          />
          {selected && (
            <button className="text-xs text-slate-400 hover:text-slate-700 px-2" onClick={handleClearSelection}>
              Clear
            </button>
          )}
        </div>

        {!selected && (query.trim().length > 0) && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg overflow-hidden">
            {searching && <div className="px-4 py-3 text-sm text-slate-400">Searching…</div>}
            {!searching && results.length === 0 && (
              <div className="px-4 py-3 text-sm text-slate-400">No matching children.</div>
            )}
            {!searching &&
              results.map((r) => (
                <button
                  key={r._id}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between text-sm"
                  onClick={() => handleSelect(r)}
                >
                  <span className="font-medium text-slate-800">{r.name}</span>
                  <span className="text-slate-400">{r.patientId}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {loading && <div className="text-slate-500 text-sm">Loading…</div>}
      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 max-w-lg">{error}</div>}

      {!loading && overview && (
        <div className="max-w-5xl">
          {/* Patient header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <FiUser />
            </div>
            <div>
              <div className="text-lg font-semibold text-slate-800">{overview.patient.name}</div>
              <div className="text-xs text-slate-500 flex items-center gap-3">
                <span>{overview.patient.patientId}</span>
                {overview.patient.mobile1 && (
                  <span className="flex items-center gap-1"><FiPhone size={11} /> {overview.patient.mobile1}</span>
                )}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <SummaryCard label="Total Invoiced" value={inr(overview.summary.totalInvoiced)} tone="slate" />
            <SummaryCard label="Total Paid" value={inr(overview.summary.totalPaid)} tone="emerald" />
            <SummaryCard
              label="Total Due"
              value={inr(overview.summary.totalDue)}
              tone={overview.summary.totalDue > 0 ? "red" : "slate"}
            />
            <SummaryCard label="Wallet Balance" value={inr(overview.summary.walletBalance)} tone="sky" />
          </div>

          {/* Bookings */}
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Bookings ({overview.bookings.length})</h2>
            <div className="flex flex-col gap-3">
              {overview.bookings.map((b) => {
                const isOpen = expandedBooking === b.bookingId;
                const pct = b.totalSessions > 0 ? Math.round((b.checkedInCount / b.totalSessions) * 100) : 0;
                return (
                  <div key={b.bookingId} className="bg-white border rounded-lg overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 text-left"
                      onClick={() => setExpandedBooking(isOpen ? null : b.bookingId)}
                    >
                      <div className="flex items-center gap-3">
                        {isOpen ? <FiChevronDown className="text-slate-400" /> : <FiChevronRight className="text-slate-400" />}
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            #{b.appointmentId} {b.packageName && <span className="text-slate-400 font-normal">· {b.packageName}</span>}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {b.checkedInCount}/{b.totalSessions} sessions checked in ({pct}%)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <div className="text-sm font-medium text-slate-800">{inr(b.amountPaid)} / {inr(b.invoiceAmount)}</div>
                          {b.due > 0 && <div className="text-xs text-red-600">{inr(b.due)} due</div>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[b.status] || STATUS_STYLES.pending}`}>
                          {b.status}
                        </span>
                      </div>
                    </button>

                    {/* session progress bar */}
                    <div className="h-1 bg-slate-100">
                      <div className="h-1 bg-emerald-400" style={{ width: `${pct}%` }} />
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-1 border-t bg-slate-50/60">
                            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mt-3 mb-2">
                              Transactions
                            </div>
                            {b.transactions.length === 0 && (
                              <div className="text-xs text-slate-400 italic mb-3">No transactions recorded yet.</div>
                            )}
                            <div className="flex flex-col gap-1.5 mb-3">
                              {b.transactions.map((t, i) => (
                                <div
                                  key={i}
                                  className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs bg-white border rounded px-3 py-2"
                                >
                                  <FiCreditCard className="text-slate-400" size={12} />
                                  <span className="font-medium text-slate-800">{inr(t.amount)}</span>
                                  <span className="capitalize text-slate-500">{t.paymentMethod}</span>
                                  <span className="capitalize text-slate-400">{t.type.replace("_", " ")}</span>
                                  {t.utr && t.utr.length > 0 && <span className="text-slate-400">UTR: {t.utr[t.utr.length - 1]}</span>}
                                  <span className="text-slate-400">{fmtDateTime(t.paymentTime)}</span>
                                  {t.financeRecord && (
                                    <button
                                      className="ml-auto flex items-center gap-1 text-blue-600 hover:text-blue-800"
                                      onClick={() => setEditingFinanceId(t.financeRecord!)}
                                    >
                                      <FiEdit2 size={11} /> Edit
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              {overview.bookings.length === 0 && (
                <div className="text-sm text-slate-400 italic px-1">No bookings for this child yet.</div>
              )}
            </div>
          </div>

          {/* Wallet ledger */}
          <div className="mb-8">
            <button
              className="w-full flex items-center justify-between bg-white border rounded-lg px-4 py-3"
              onClick={() => setWalletExpanded((v) => !v)}
            >
              <div className="flex items-center gap-2">
                {walletExpanded ? <FiChevronDown className="text-slate-400" /> : <FiChevronRight className="text-slate-400" />}
                <span className="text-sm font-semibold text-slate-700">Wallet log ({overview.wallet.transactions.length} entries)</span>
              </div>
              <span className="text-sm font-semibold text-sky-700">{inr(overview.wallet.balance)}</span>
            </button>
            <AnimatePresence initial={false}>
              {walletExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="border border-t-0 rounded-b-lg bg-white divide-y">
                    {[...overview.wallet.transactions].reverse().map((t, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                        {t.type === "credit" ? (
                          <FiArrowUpRight className="text-emerald-500 shrink-0" />
                        ) : (
                          <FiArrowDownRight className="text-red-500 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-700">{t.remark || t.reason.replace(/_/g, " ")}</div>
                          <div className="text-xs text-slate-400">{fmtDateTime(t.createdAt)}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-medium ${t.type === "credit" ? "text-emerald-600" : "text-red-600"}`}>
                            {t.type === "credit" ? "+" : "−"}{inr(t.amount)}
                          </div>
                          <div className="text-xs text-slate-400">bal. {inr(t.balanceAfter)}</div>
                        </div>
                      </div>
                    ))}
                    {overview.wallet.transactions.length === 0 && (
                      <div className="px-4 py-4 text-sm text-slate-400 italic">No wallet activity.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Unified ledger */}
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Full timeline (everything, newest first)</h2>
            <div className="bg-white border rounded-lg divide-y">
              {overview.ledger.map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      e.kind === "payment" ? "bg-blue-400" : e.kind === "wallet_credit" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-700">{e.label}</div>
                    <div className="text-xs text-slate-400">
                      {fmtDateTime(e.time)}
                      {e.paymentMethod && ` · ${e.paymentMethod}`}
                      {e.utr && e.utr.length > 0 && ` · UTR ${e.utr[e.utr.length - 1]}`}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-slate-800 shrink-0">{inr(e.amount)}</div>
                </div>
              ))}
              {overview.ledger.length === 0 && (
                <div className="px-4 py-4 text-sm text-slate-400 italic">No activity recorded yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && !overview && !error && (
        <div className="text-sm text-slate-400 max-w-lg">Search for a child above to see their full finance picture.</div>
      )}

      <FinanceGroupEditModal
        open={!!editingFinanceId}
        financeId={editingFinanceId}
        onClose={() => setEditingFinanceId(null)}
        onSaved={() => {
          setEditingFinanceId(null);
          if (selected) fetchOverview(selected._id);
        }}
      />
    </motion.div>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: "slate" | "emerald" | "red" | "sky" }) {
  const toneMap: Record<string, string> = {
    slate: "text-slate-800",
    emerald: "text-emerald-600",
    red: "text-red-600",
    sky: "text-sky-600",
  };
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-xl font-bold mt-1 ${toneMap[tone]}`}>{value}</div>
    </div>
  );
}