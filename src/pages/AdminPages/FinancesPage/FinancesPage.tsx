// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import {
//   FiArrowUpCircle, FiDownload, FiSearch, FiArrowLeft, FiArrowRight, FiEdit2, FiChevronDown, FiChevronRight
// } from "react-icons/fi";
// import axios from "axios";
// // @ts-ignore
// import * as XLSX from "xlsx";
// import FinanceGroupEditModal from "./FinanceGroupEditModal";

// interface TransactionEntry {
//   _id: string | null;
//   paymentId: string;
//   amount: number;
//   paymentMethod: string;
//   utr?: string[];
//   type: string;
//   remark?: string | null;
//   paymentTime?: string;
//   recordedAt?: string;
// }

// interface FinanceLog {
//   _id: string;
//   Date: string;
//   Description: string;
//   Type: string;
//   Amount: number;
//   CreditDebitStatus?: string;
//   PaymentMethod?: string;
//   Utr?: string[];
//   CreatedAt?: string;
//   UpdatedAt?: string;
//   ChildrenName?: string;
//   ChildrenId?: string;
//   TransactionRef?: string | null;
//   Transactions?: TransactionEntry[];
// }

// interface FinanceDetailsResponse {
//   success: boolean;
//   totalIncome: number;
//   totalExpenses: number;
//   netBalance: number;
//   logs: FinanceLog[];
//   page: number;
//   pageSize: number;
//   total: number;
//   totalPages: number;
//   message?: string;
//   error?: string;
// }

// // Standalone transaction row shape, used only in "Transactions"-only mode
// // (fetched from /finance/transactions, unrelated to the nested-under-finance
// // view used in combined mode).
// interface StandaloneTransactionLog {
//   _id: string;
//   PaymentId: string;
//   Amount: number;
//   PaymentMethod: string;
//   Utr?: string[];
//   Type: string;
//   Remark?: string | null;
//   PaymentTime?: string;
//   RecordedAt?: string;
//   FinanceId?: string | null;
//   FinanceDescription?: string | null;
//   ChildrenName?: string | null;
//   ChildrenId?: string | null;
//   TransactionRef?: string | null;
// }

// interface TransactionDetailsResponse {
//   success: boolean;
//   logs: StandaloneTransactionLog[];
//   page: number;
//   pageSize: number;
//   total: number;
//   totalPages: number;
//   message?: string;
//   error?: string;
// }

// type ViewMode = "finances" | "transactions" | "both";

// const DEFAULT_PAGE_SIZE = 10;
// const PAYMENT_METHOD_OPTIONS = ["Cash", "Online"];
// const CREDIT_DEBIT_OPTIONS = ["Credit", "Debit"];

// function downloadExcel(filename: string, rows: FinanceLog[]) {
//   const worksheetRows = rows.map((row) => ({
//     _id: row._id,
//     Date: row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "",
//     Description: row.Description,
//     Type: row.Type,
//     Amount: row.Amount,
//     CreditDebitStatus: row.CreditDebitStatus ?? "",
//     PaymentMethod: row.PaymentMethod ?? "",
//     Utr: row.Utr && row.Utr.length > 0 ? row.Utr.join(", ") : "",
//     ChildrenName: row.ChildrenName ?? "",
//     ChildrenId: row.ChildrenId ?? "",
//     CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toLocaleString("en-GB") : "",
//     UpdatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toLocaleString("en-GB") : "",
//   }));

//   const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
//     header: [
//       "_id", "Date", "Description", "Type", "Amount", "CreditDebitStatus",
//       "PaymentMethod", "Utr", "ChildrenName", "ChildrenId", "CreatedAt", "UpdatedAt",
//     ],
//   });
//   const workbook = XLSX.utils.book_new();
//   XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
//   XLSX.writeFile(workbook, filename);
// }

// function EditPaymentMethodModal({
//   open, onClose, log, onSave, saving, error,
// }: {
//   open: boolean;
//   onClose: () => void;
//   log: FinanceLog | null;
//   onSave: (data: { paymentMethod: string; utr: string }) => void;
//   saving: boolean;
//   error: string | null;
// }) {
//   const [paymentMethod, setPaymentMethod] = useState("");
//   const [utr, setUtr] = useState("");

//   useEffect(() => {
//     if (open && log) {
//       setPaymentMethod(log.PaymentMethod ?? "");
//       setUtr(log.Utr && log.Utr.length > 0 ? log.Utr[log.Utr.length - 1] : "");
//     }
//   }, [open, log]);

//   function handleSubmit(e: React.FormEvent) {
//     e.preventDefault();
//     if (!paymentMethod) return;
//     onSave({ paymentMethod, utr });
//   }

//   if (!open || !log) return null;
//   return (
//     <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
//       <div className="bg-white p-6 rounded-lg w-[90vw] max-w-lg shadow-xl border">
//         <h2 className="text-lg font-semibold mb-4">Edit Payment Method</h2>
//         <form onSubmit={handleSubmit} className="flex flex-col gap-4">
//           <div>
//             <label className="block text-sm font-medium mb-1">Payment Method</label>
//             <select
//               className="w-full border rounded py-2 px-3"
//               value={paymentMethod}
//               onChange={e => setPaymentMethod(e.target.value)}
//               required
//             >
//               <option value="">Select payment method</option>
//               {PAYMENT_METHOD_OPTIONS.map(meth => (
//                 <option key={meth} value={meth}>{meth}</option>
//               ))}
//             </select>
//           </div>
//           {paymentMethod === "Online" && (
//             <div>
//               <label className="block text-sm font-medium mb-1">UTR (for bank/UPI transfers)</label>
//               <input
//                 className="w-full border rounded py-2 px-3"
//                 value={utr}
//                 onChange={e => setUtr(e.target.value)}
//                 maxLength={50}
//                 placeholder="Optional: Transaction/UTR"
//                 autoComplete="off"
//               />
//             </div>
//           )}
//           {error && <div className="text-red-500 text-sm">{error}</div>}
//           <div className="flex gap-2 justify-end pt-4 border-t">
//             <button type="button" className="px-4 py-2 bg-slate-100 rounded text-slate-800" onClick={onClose} disabled={saving}>
//               Cancel
//             </button>
//             <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60" disabled={saving || !paymentMethod}>
//               {saving ? "Saving..." : "Save"}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }

// // Nested "collapsible" block shown under a finance row when the combined
// // view is active — mirrors the styling of the existing split-payment
// // summary row (amber background, small text) so the two nested-detail
// // patterns look consistent instead of introducing a third visual style.
// function TransactionsSubRow({ finance, colSpan }: { finance: FinanceLog; colSpan: number }) {
//   const [expanded, setExpanded] = useState(true);
//   const txs = finance.Transactions ?? [];

//   if (txs.length === 0) {
//     return (
//       <tr className="bg-sky-50/50">
//         <td />
//         <td colSpan={colSpan - 1} className="px-4 pb-3 pt-0">
//           <div className="text-xs text-slate-400 italic">No linked transactions found for this record.</div>
//         </td>
//       </tr>
//     );
//   }

//   const total = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

//   return (
//     <tr className="bg-sky-50/50">
//       <td />
//       <td colSpan={colSpan - 1} className="px-4 pb-3 pt-0">
//         <button
//           type="button"
//           className="flex items-center gap-1 text-xs font-semibold text-sky-800 mb-1"
//           onClick={() => setExpanded(v => !v)}
//         >
//           {expanded ? <FiChevronDown /> : <FiChevronRight />}
//           {txs.length} transaction{txs.length > 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")} total
//         </button>
//         {expanded && (
//           <div className="flex flex-col gap-1 mt-1">
//             {txs.map((t, i) => (
//               <div key={t._id ?? i} className="text-xs text-sky-900 flex flex-wrap gap-x-4 gap-y-0.5 border-l-2 border-sky-200 pl-2">
//                 <span className="font-medium">₹{Number(t.amount).toLocaleString("en-IN")}</span>
//                 <span>{t.paymentMethod}</span>
//                 <span className="capitalize">{t.type}</span>
//                 {t.utr && t.utr.length > 0 && <span>UTR: {t.utr[t.utr.length - 1]}</span>}
//                 <span className="text-sky-700">{t.paymentId}</span>
//                 {t.paymentTime && (
//                   <span className="text-slate-500">
//                     {new Date(t.paymentTime).toLocaleString("en-GB")}
//                   </span>
//                 )}
//                 {t.remark && <span className="text-slate-500 italic">{t.remark}</span>}
//               </div>
//             ))}
//           </div>
//         )}
//       </td>
//     </tr>
//   );
// }

// export default function FinancesPage() {
//   const [viewMode, setViewMode] = useState<ViewMode>("finances");

//   const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
//   const [transactionData, setTransactionData] = useState<TransactionDetailsResponse | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState("");
//   const [searchInput, setSearchInput] = useState("");

//   const [page, setPage] = useState(1);
//   const [pageSize] = useState(DEFAULT_PAGE_SIZE);
//   const [sortField, setSortField] = useState<string>("date");
//   const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
//   const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
//   const [creditDebitStatusFilter, setCreditDebitStatusFilter] = useState<string>("");
//   const [childrenNameFilter, setChildrenNameFilter] = useState<string>("");
//   const [childrenIdFilter, setChildrenIdFilter] = useState<string>("");
//   const [minAmountFilter, setMinAmountFilter] = useState<string | number>("");
//   const [maxAmountFilter, setMaxAmountFilter] = useState<string | number>("");
//   const [startDateFilter, setStartDateFilter] = useState<string>("");
//   const [endDateFilter, setEndDateFilter] = useState<string>("");

//   const [editingLog, setEditingLog] = useState<FinanceLog | null>(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const [editSaving, setEditSaving] = useState(false);
//   const [editError, setEditError] = useState<string | null>(null);

//   const showFinances = viewMode === "finances" || viewMode === "both";
//   const showTransactions = viewMode === "transactions" || viewMode === "both";
//   // Nested transactions-under-finance-row are only fetched/rendered in "both"
//   // mode. In "transactions"-only mode we hit the flat /finance/transactions
//   // endpoint instead (a plain transactions table, not nested).
//   const includeTransactions = viewMode === "both";

//   const fetchFinances = () => {
//     const baseUrl = import.meta.env.VITE_API_URL || "";
//     const params: Record<string, any> = { page, pageSize, sortField, sortOrder };
//     if (search.trim()) params.search = search.trim();
//     if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
//     if (creditDebitStatusFilter) params.creditDebitStatus = creditDebitStatusFilter;
//     if (childrenNameFilter) params.childrenName = childrenNameFilter;
//     if (childrenIdFilter) params.childrenId = childrenIdFilter;
//     if (minAmountFilter !== "") params.minAmount = minAmountFilter;
//     if (maxAmountFilter !== "") params.maxAmount = maxAmountFilter;
//     if (startDateFilter) params.startDate = startDateFilter;
//     if (endDateFilter) params.endDate = endDateFilter;
//     if (includeTransactions) params.includeTransactions = "true";

//     return axios.get(`${baseUrl}/api/admin/finance/details`, { params });
//   };

//   // Standalone transactions fetch — only used in "transactions"-only mode.
//   // Maps finance-side sort field names to the transaction endpoint's field
//   // names since the two tables don't share a schema (date -> paymentTime).
//   const fetchTransactions = () => {
//     const baseUrl = import.meta.env.VITE_API_URL || "";
//     const txSortField = sortField === "date" ? "paymentTime" : sortField === "amount" ? "amount" : "recordedAt";
//     const params: Record<string, any> = { page, pageSize, sortField: txSortField, sortOrder };
//     if (search.trim()) params.search = search.trim();
//     if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter.toLowerCase();
//     if (childrenNameFilter) params.childrenName = childrenNameFilter;
//     if (childrenIdFilter) params.childrenId = childrenIdFilter;
//     if (minAmountFilter !== "") params.minAmount = minAmountFilter;
//     if (maxAmountFilter !== "") params.maxAmount = maxAmountFilter;
//     if (startDateFilter) params.startDate = startDateFilter;
//     if (endDateFilter) params.endDate = endDateFilter;

//     return axios.get(`${baseUrl}/api/admin/finance/transactions`, { params });
//   };

//   const fetchData = () => {
//     setLoading(true);
//     setError(null);

//     const requests: Promise<any>[] = [];
//     if (showFinances) requests.push(fetchFinances()); else requests.push(Promise.resolve(null));
//     if (viewMode === "transactions") requests.push(fetchTransactions()); else requests.push(Promise.resolve(null));

//     Promise.all(requests)
//       .then(([financeRes, transactionRes]) => {
//         if (financeRes) setFinanceData(financeRes.data);
//         if (transactionRes) setTransactionData(transactionRes.data);
//         setLoading(false);
//       })
//       .catch((e) => {
//         setError(e.response?.data?.message || e.message || "Failed to fetch finance details");
//         setLoading(false);
//       });
//   };

//   const handleOpenEdit = (log: FinanceLog) => {
//     setEditingLog(log);
//     setEditError(null);
//     setShowEditModal(true);
//   };

//   const handleCloseEdit = () => {
//     setShowEditModal(false);
//     setEditingLog(null);
//     setEditError(null);
//   };

//   const handleSaveEdit = async ({ paymentMethod, utr }: { paymentMethod: string; utr: string }) => {
//     if (!editingLog?._id) return;
//     setEditSaving(true);
//     setEditError(null);
//     try {
//       const baseUrl = import.meta.env.VITE_API_URL || "";
//       await axios.patch(
//         `${baseUrl}/api/admin/finance/update-payment-method/${editingLog._id}`,
//         { paymentMethod, utr }
//       );
//       setEditSaving(false);
//       setShowEditModal(false);
//       setEditingLog(null);
//       fetchData();
//     } catch (e: any) {
//       setEditError(e?.response?.data?.message || e?.message || "Failed to update payment method");
//       setEditSaving(false);
//     }
//   };

//   // Switching view mode changes which endpoint/shape is active, so reset to
//   // page 1 to avoid landing on an out-of-range page for the new dataset.
//   useEffect(() => {
//     setPage(1);
//     // eslint-disable-next-line
//   }, [viewMode]);

//   useEffect(() => {
//     setPage(1);
//     // eslint-disable-next-line
//   }, [
//     search, sortField, sortOrder, paymentMethodFilter, creditDebitStatusFilter,
//     childrenNameFilter, childrenIdFilter, minAmountFilter, maxAmountFilter, startDateFilter, endDateFilter,
//   ]);

//   useEffect(() => {
//     fetchData();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [
//     viewMode, page, pageSize, search, sortField, sortOrder, paymentMethodFilter,
//     creditDebitStatusFilter, childrenNameFilter, childrenIdFilter, minAmountFilter, maxAmountFilter,
//     startDateFilter, endDateFilter,
//   ]);

//   const handleExportExcel = () => {
//     if (financeData?.logs && financeData.logs.length > 0) {
//       downloadExcel("finances.xlsx", financeData.logs);
//     }
//   };

//   const handleSearch = (e: React.FormEvent) => {
//     e.preventDefault();
//     setPage(1);
//     setSearch(searchInput);
//   };

//   const handleFilter = (field: string, value: string | number) => {
//     switch (field) {
//       case "paymentMethod": setPaymentMethodFilter(value as string); break;
//       case "creditDebitStatus": setCreditDebitStatusFilter(value as string); break;
//       case "childrenName": setChildrenNameFilter(value as string); break;
//       case "childrenId": setChildrenIdFilter(value as string); break;
//       case "minAmount": setMinAmountFilter(value); break;
//       case "maxAmount": setMaxAmountFilter(value); break;
//       case "startDate": setStartDateFilter(value as string); break;
//       case "endDate": setEndDateFilter(value as string); break;
//       case "sortField": setSortField(value as string); break;
//       case "sortOrder": setSortOrder(value as "asc" | "desc"); break;
//       default: break;
//     }
//   };

//   const onPageChange = (newPage: number) => setPage(newPage);

//   // Column count for the active finance table, used to size colSpans for
//   // the split-payment and transactions sub-rows correctly.
//   const financeColCount = 11;

//   const activeData = viewMode === "transactions" ? transactionData : financeData;
//   const totalPages = activeData?.totalPages ?? 1;
//   const currentPage = activeData?.page ?? page;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="min-h-screen p-8"
//     >
//       {/* <EditPaymentMethodModal
//         open={showEditModal}
//         onClose={handleCloseEdit}
//         log={editingLog}
//         onSave={handleSaveEdit}
//         saving={editSaving}
//         error={editError}
//       /> */}

//    <FinanceGroupEditModal
//      open={showEditModal}
//      financeId={editingLog?._id ?? null}
//      onClose={() => setShowEditModal(false)}
//      onSaved={() => { setShowEditModal(false); fetchFinances(); }}
//    />

//       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
//         <div className="flex items-center gap-3">
//           <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
//           <div className="flex border rounded overflow-hidden">
//             <button
//               type="button"
//               className={`px-4 py-2 text-sm font-medium transition-colors ${
//                 showFinances ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
//               }`}
//               onClick={() =>
//                 setViewMode(showTransactions ? (showFinances ? "transactions" : "both") : "finances")
//               }
//             >
//               Finances
//             </button>
//             <button
//               type="button"
//               className={`px-4 py-2 text-sm font-medium border-l transition-colors ${
//                 showTransactions ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
//               }`}
//               onClick={() =>
//                 setViewMode(showFinances ? (showTransactions ? "finances" : "both") : "transactions")
//               }
//             >
//               Transactions
//             </button>
//           </div>
//         </div>
//         <div className="flex flex-col sm:flex-row gap-4">
//           <form onSubmit={handleSearch} className="flex items-center border px-2 rounded bg-white">
//             <input
//               type="text"
//               className="py-2 px-3 outline-none bg-transparent placeholder:text-slate-400 text-sm"
//               placeholder="Search by description, amount, type, date, payment method, UTR, children name/id, etc..."
//               value={searchInput}
//               onChange={(e) => setSearchInput(e.target.value)}
//               autoCorrect="off"
//               autoComplete="off"
//             />
//             <button type="submit" className="p-2 text-slate-500 hover:text-blue-600" aria-label="Search">
//               <FiSearch />
//             </button>
//           </form>
//           {showFinances && (
//             <button
//               className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
//               onClick={handleExportExcel}
//               disabled={!financeData?.logs?.length}
//             >
//               <FiDownload /> Export Excel
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Filters UI */}
//       <div className="bg-white rounded border p-4 mb-6 flex flex-wrap items-end gap-4">
//         <div>
//           <label className="block text-xs mb-1 font-medium">Payment Method</label>
//           <select className="border px-2 py-1 rounded w-40" value={paymentMethodFilter} onChange={e => handleFilter("paymentMethod", e.target.value)}>
//             <option value="">All</option>
//             {PAYMENT_METHOD_OPTIONS.map((meth) => <option key={meth} value={meth}>{meth}</option>)}
//           </select>
//         </div>

//         {showFinances && (
//           <div>
//             <label className="block text-xs mb-1 font-medium">Credit/Debit</label>
//             <select className="border px-2 py-1 rounded w-32" value={creditDebitStatusFilter} onChange={e => handleFilter("creditDebitStatus", e.target.value)}>
//               <option value="">All</option>
//               {CREDIT_DEBIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
//             </select>
//           </div>
//         )}
//         <div>
//           <label className="block text-xs mb-1 font-medium">Children Name</label>
//           <input className="border px-2 py-1 rounded w-32" type="text" placeholder="Name" value={childrenNameFilter} onChange={e => handleFilter("childrenName", e.target.value)} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">Children ID</label>
//           <input className="border px-2 py-1 rounded w-32" type="text" placeholder="ID" value={childrenIdFilter} onChange={e => handleFilter("childrenId", e.target.value)} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">Min Amount</label>
//           <input className="border px-2 py-1 rounded w-24" type="number" placeholder="Min" value={minAmountFilter} onChange={e => handleFilter("minAmount", e.target.value)} min={0} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">Max Amount</label>
//           <input className="border px-2 py-1 rounded w-24" type="number" placeholder="Max" value={maxAmountFilter} onChange={e => handleFilter("maxAmount", e.target.value)} min={0} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">Start Date</label>
//           <input className="border px-2 py-1 rounded w-36" type="date" value={startDateFilter} onChange={e => handleFilter("startDate", e.target.value)} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">End Date</label>
//           <input className="border px-2 py-1 rounded w-36" type="date" value={endDateFilter} onChange={e => handleFilter("endDate", e.target.value)} />
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">Sort By</label>
//           <select className="border px-2 py-1 rounded w-28" value={sortField} onChange={e => handleFilter("sortField", e.target.value)}>
//             <option value="date">Date</option>
//             <option value="amount">Amount</option>
//             <option value="createdAt">Created At</option>
//             <option value="updatedAt">Updated At</option>
//           </select>
//         </div>
//         <div>
//           <label className="block text-xs mb-1 font-medium">Sort Order</label>
//           <select className="border px-2 py-1 rounded w-28" value={sortOrder} onChange={e => handleFilter("sortOrder", e.target.value as "asc" | "desc")}>
//             <option value="desc">Desc</option>
//             <option value="asc">Asc</option>
//           </select>
//         </div>
//       </div>

//       {loading && <div className="text-slate-600">Loading finances...</div>}
//       {error && <div className="text-red-500 mb-4">Error: {error}</div>}

//       {!loading && !error && (
//         <>
//           {showFinances && financeData && (
//             <>
//               <div className="grid grid-cols-1 gap-6 mb-6">
//                 <div className="bg-white border rounded-lg p-6">
//                   <div className="flex items-center justify-between text-sm text-slate-500">
//                     <span>Total Income</span>
//                     <FiArrowUpCircle className="text-green-600" />
//                   </div>
//                   <p className="text-2xl font-bold text-green-600">
//                     ₹{Number(financeData.totalIncome ?? 0).toLocaleString("en-IN")}
//                   </p>
//                 </div>
//               </div>

//               <div className="bg-white border rounded-lg overflow-x-auto mb-8">
//                 <div className="px-4 py-2 border-b bg-slate-50 text-sm font-semibold text-slate-700">
//                   Finances{includeTransactions ? " + Linked Transactions" : ""}
//                 </div>
//                 <table className="w-full text-sm">
//                   <thead className="bg-slate-100">
//                     <tr>
//                       <th className="px-4 py-3 text-left">Date</th>
//                       <th className="px-4 py-3 text-left">Description</th>
//                       <th className="px-4 py-3 text-left">Children Name</th>
//                       <th className="px-4 py-3 text-left">Children ID</th>
//                       <th className="px-4 py-3 text-left">Credit/Debit</th>
//                       <th className="px-4 py-3 text-left">Payment Method</th>
//                       <th className="px-4 py-3 text-left">UTR</th>
//                       <th className="px-4 py-3 text-left">Created At</th>
//                       <th className="px-4 py-3 text-left">Updated At</th>
//                       <th className="px-4 py-3 text-right">Amount</th>
//                       <th className="px-4 py-3 text-center">Actions</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {financeData.logs && financeData.logs.length > 0 ? (
//                       (() => {
//                         const logs = financeData.logs;
//                         const refGroups = new Map<string, FinanceLog[]>();
//                         logs.forEach((l) => {
//                           if (l.TransactionRef) {
//                             if (!refGroups.has(l.TransactionRef)) refGroups.set(l.TransactionRef, []);
//                             refGroups.get(l.TransactionRef)!.push(l);
//                           }
//                         });
//                         const seenRefs = new Set<string>();

//                         return logs.flatMap((log, idx) => {
//                           const group = log.TransactionRef ? refGroups.get(log.TransactionRef) : undefined;
//                           const isSplit = !!group && group.length > 1;
//                           const isFirstOfGroup = isSplit && log.TransactionRef && !seenRefs.has(log.TransactionRef);
//                           if (isFirstOfGroup && log.TransactionRef) seenRefs.add(log.TransactionRef);

//                           const rows = [
//                             <tr key={idx} className={`border-t ${isSplit ? "bg-amber-50/60" : ""}`}>
//                               <td className="px-4 py-3">
//                                 {log.Date
//                                   ? (() => {
//                                       const d = new Date(log.Date);
//                                       if (isNaN(d.getTime())) return "-";
//                                       const date = d.toLocaleDateString("en-GB");
//                                       const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).slice(0, 5);
//                                       return `${date}, ${time}`;
//                                     })()
//                                   : "-"}
//                               </td>
//                               <td className="px-4 py-3">
//                                 {log.Description}
//                                 {isSplit && (
//                                   <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-200 text-amber-800">
//                                     Split payment
//                                   </span>
//                                 )}
//                               </td>
//                               <td className="px-4 py-3">{log.ChildrenName ?? "-"}</td>
//                               <td className="px-4 py-3">{log.ChildrenId ?? "-"}</td>
//                               <td className="px-4 py-3">{log.CreditDebitStatus ?? "-"}</td>
//                               <td className="px-4 py-3">{log.PaymentMethod ?? "-"}</td>
//                               <td className="px-4 py-3">
//                                 {log.Utr && log.Utr.length > 0 ? (
//                                   <span className="break-all inline-block mr-2 whitespace-nowrap">{log.Utr[log.Utr.length - 1]}</span>
//                                 ) : "-"}
//                               </td>
//                               <td className="px-4 py-3">{log.CreatedAt ? new Date(log.CreatedAt).toLocaleString("en-GB") : "-"}</td>
//                               <td className="px-4 py-3">{log.UpdatedAt ? new Date(log.UpdatedAt).toLocaleString("en-GB") : "-"}</td>
//                               <td className={`px-4 py-3 text-right ${log.Type === "Income" ? "text-green-600" : log.Type === "Expense" ? "text-red-500" : "text-slate-800"}`}>
//                                 ₹{Number(log.Amount).toLocaleString("en-IN")}
//                               </td>
//                               <td className="px-4 py-3 text-center">
//                                 <button
//                                   className="inline-flex items-center gap-1 p-1 border rounded hover:bg-slate-50 text-blue-600"
//                                   onClick={() => handleOpenEdit(log)}
//                                   title="Edit Payment Method"
//                                 >
//                                   <FiEdit2 />
//                                   <span className="sr-only">Edit</span>
//                                 </button>
//                               </td>
//                             </tr>,
//                           ];

//                           if (isFirstOfGroup && group) {
//                             const total = group.reduce((sum, r) => sum + (Number(r.Amount) || 0), 0);
//                             rows.push(
//                               <tr key={`${idx}-split-summary`} className="bg-amber-50/60">
//                                 <td />
//                                 <td colSpan={financeColCount - 1} className="px-4 pb-3 pt-0">
//                                   <div className="text-xs text-amber-800 flex flex-wrap gap-x-4 gap-y-1">
//                                     <span className="font-semibold">
//                                       ₹{total.toLocaleString("en-IN")} collected in one payment, split:
//                                     </span>
//                                     {group.map((r, gi) => (
//                                       <span key={gi}>₹{Number(r.Amount).toLocaleString("en-IN")} — {r.Description}</span>
//                                     ))}
//                                   </div>
//                                 </td>
//                               </tr>
//                             );
//                           }

//                           // Nested transactions block — only rendered in "both" mode.
//                           if (includeTransactions) {
//                             rows.push(
//                               <TransactionsSubRow key={`${idx}-tx`} finance={log} colSpan={financeColCount} />
//                             );
//                           }

//                           return rows;
//                         });
//                       })()
//                     ) : (
//                       <tr>
//                         <td colSpan={financeColCount} className="px-4 py-6 text-center text-slate-400">
//                           No finance logs found.
//                         </td>
//                       </tr>
//                     )}
//                   </tbody>
//                 </table>
//               </div>
//             </>
//           )}

//           {/* Standalone Transactions table — only shown in "transactions"-only
//               mode. In "both" mode transactions are nested under finance rows
//               above instead of duplicated here. */}
//           {viewMode === "transactions" && transactionData && (
//             <div className="bg-white border rounded-lg overflow-x-auto mb-8">
//               <div className="px-4 py-2 border-b bg-slate-50 text-sm font-semibold text-slate-700">Transactions</div>
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-100">
//                   <tr>
//                     <th className="px-4 py-3 text-left">Payment Time</th>
//                     <th className="px-4 py-3 text-left">Payment ID</th>
//                     <th className="px-4 py-3 text-left">Linked Finance</th>
//                     <th className="px-4 py-3 text-left">Children</th>
//                     <th className="px-4 py-3 text-left">Method</th>
//                     <th className="px-4 py-3 text-left">Type</th>
//                     <th className="px-4 py-3 text-left">UTR</th>
//                     <th className="px-4 py-3 text-left">Remark</th>
//                     <th className="px-4 py-3 text-right">Amount</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {transactionData.logs && transactionData.logs.length > 0 ? (
//                     transactionData.logs.map((t, idx) => (
//                       <tr key={t._id ?? idx} className={`border-t ${!t.FinanceId ? "bg-red-50/40" : ""}`}>
//                         <td className="px-4 py-3">
//                           {t.PaymentTime ? new Date(t.PaymentTime).toLocaleString("en-GB") : "-"}
//                         </td>
//                         <td className="px-4 py-3">{t.PaymentId}</td>
//                         <td className="px-4 py-3">
//                           {t.FinanceDescription ?? (
//                             <span className="text-red-500 text-xs font-medium">Unlinked</span>
//                           )}
//                         </td>
//                         <td className="px-4 py-3">
//                           {t.ChildrenName ? `${t.ChildrenName}${t.ChildrenId ? ` (${t.ChildrenId})` : ""}` : "-"}
//                         </td>
//                         <td className="px-4 py-3">{t.PaymentMethod}</td>
//                         <td className="px-4 py-3 capitalize">{t.Type}</td>
//                         <td className="px-4 py-3">
//                           {t.Utr && t.Utr.length > 0 ? t.Utr[t.Utr.length - 1] : "-"}
//                         </td>
//                         <td className="px-4 py-3">{t.Remark ?? "-"}</td>
//                         <td className="px-4 py-3 text-right">₹{Number(t.Amount).toLocaleString("en-IN")}</td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
//                         No transactions found.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}

//           {totalPages > 1 && (
//             <div className="mt-6 flex justify-center items-center gap-2">
//               <button
//                 className="px-2 py-1 rounded border bg-white text-slate-700 disabled:opacity-30 flex items-center"
//                 onClick={() => onPageChange(page - 1)}
//                 disabled={page <= 1}
//               >
//                 <FiArrowLeft /> Prev
//               </button>
//               <span className="mx-2 text-sm select-none">{currentPage} / {totalPages}</span>
//               <button
//                 className="px-2 py-1 rounded border bg-white text-slate-700 disabled:opacity-30 flex items-center"
//                 onClick={() => onPageChange(page + 1)}
//                 disabled={page >= totalPages}
//               >
//                 Next <FiArrowRight />
//               </button>
//             </div>
//           )}
//         </>
//       )}
//     </motion.div>
//   );
// }

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowUpCircle, FiDownload, FiSearch, FiArrowLeft, FiArrowRight, FiEdit2, FiChevronDown, FiChevronRight,
  FiUsers, FiCalendar
} from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";
import FinanceGroupEditModal from "./FinanceGroupEditModal";

interface TransactionEntry {
  _id: string | null;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  utr?: string[];
  type: string;
  remark?: string | null;
  paymentTime?: string;
  recordedAt?: string;
}

interface FinanceLog {
  _id: string;
  Date: string;
  Description: string;
  Type: string;
  Amount: number;
  CreditDebitStatus?: string;
  PaymentMethod?: string;
  Utr?: string[];
  CreatedAt?: string;
  UpdatedAt?: string;
  ChildrenName?: string;
  ChildrenId?: string;
  TransactionRef?: string | null;
  Transactions?: TransactionEntry[];
}

// NEW: per-child booking-count breakdown returned alongside the finance
// logs. bookingCount is DISTINCT bookings for that child within the current
// filtered set, not raw Finances-row count (see backend comment).
interface ChildrenBookingBreakdownEntry {
  childrenId: string | null;
  childrenName: string | null;
  bookingCount: number;
}

interface FinanceDetailsResponse {
  success: boolean;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  logs: FinanceLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message?: string;
  error?: string;
  // NEW
  uniqueChildrenCount?: number;
  uniqueBookingsCount?: number;
  childrenBookingBreakdown?: ChildrenBookingBreakdownEntry[];
}

// Standalone transaction row shape, used only in "Transactions"-only mode
// (fetched from /finance/transactions, unrelated to the nested-under-finance
// view used in combined mode).
interface StandaloneTransactionLog {
  _id: string;
  PaymentId: string;
  Amount: number;
  PaymentMethod: string;
  Utr?: string[];
  Type: string;
  Remark?: string | null;
  PaymentTime?: string;
  RecordedAt?: string;
  FinanceId?: string | null;
  FinanceDescription?: string | null;
  ChildrenName?: string | null;
  ChildrenId?: string | null;
  TransactionRef?: string | null;
}

interface TransactionDetailsResponse {
  success: boolean;
  logs: StandaloneTransactionLog[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  message?: string;
  error?: string;
}

type ViewMode = "finances" | "transactions" | "both";

const DEFAULT_PAGE_SIZE = 10;
const PAYMENT_METHOD_OPTIONS = ["Cash", "Online"];
const CREDIT_DEBIT_OPTIONS = ["Credit", "Debit"];

function downloadExcel(filename: string, rows: FinanceLog[]) {
  const worksheetRows = rows.map((row) => ({
    _id: row._id,
    Date: row.Date ? new Date(row.Date).toLocaleDateString("en-GB") : "",
    Description: row.Description,
    Type: row.Type,
    Amount: row.Amount,
    CreditDebitStatus: row.CreditDebitStatus ?? "",
    PaymentMethod: row.PaymentMethod ?? "",
    Utr: row.Utr && row.Utr.length > 0 ? row.Utr.join(", ") : "",
    ChildrenName: row.ChildrenName ?? "",
    ChildrenId: row.ChildrenId ?? "",
    CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toLocaleString("en-GB") : "",
    UpdatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toLocaleString("en-GB") : "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: [
      "_id", "Date", "Description", "Type", "Amount", "CreditDebitStatus",
      "PaymentMethod", "Utr", "ChildrenName", "ChildrenId", "CreatedAt", "UpdatedAt",
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
  XLSX.writeFile(workbook, filename);
}

// NEW: builds the audit-export workbook from the flat, pre-sorted rows the
// backend returns (already grouped child -> invoiceId -> paymentTime).
// Inserts a blank row every time the invoiceId changes WITHIN a child's
// block, and a slightly heavier blank+label row every time the child
// itself changes, so the sheet reads as visually segmented groups instead
// of one long undifferentiated list — the whole point being an admin can
// scan block-by-block and fix what's flagged.
interface AuditRow {
  childrenName: string | null;
  childrenId: string | null;
  invoiceId: string | null;
  invoiceSource: string | null;
  paymentId: string;
  amount: number;
  paymentMethod: string;
  utr: string;
  type: string;
  remark: string;
  paymentTime: string | null;
  recordedAt: string | null;
  linkStatus: "linked" | "unlinked_matched_invoice" | "unlinked_unmatched";
  flags: string;
}

const AUDIT_HEADERS = [
  "Children Name", "Children ID", "Invoice Id", "Invoice Source", "Payment Id",
  "Amount", "Payment Method", "UTR", "Type", "Remark",
  "Payment Time", "Recorded At", "Link Status", "Flags (review these)",
];

function auditRowToAOA(r: AuditRow): (string | number)[] {
  return [
    r.childrenName ?? "",
    r.childrenId ?? "",
    r.invoiceId ?? "",
    r.invoiceSource ?? "",
    r.paymentId,
    r.amount,
    r.paymentMethod,
    r.utr,
    r.type,
    r.remark,
    r.paymentTime ? new Date(r.paymentTime).toLocaleString("en-GB") : "",
    r.recordedAt ? new Date(r.recordedAt).toLocaleString("en-GB") : "",
    r.linkStatus === "linked" ? "Linked" : r.linkStatus === "unlinked_matched_invoice" ? "Unlinked (advance, matched invoice)" : "Unlinked (advance, NO match)",
    r.flags,
  ];
}

function downloadTransactionsAuditExcel(filename: string, rows: AuditRow[]) {
  const aoa: (string | number)[][] = [AUDIT_HEADERS];

  let prevChildKey: string | null = null;
  let prevInvoiceId: string | null = null;

  rows.forEach((r) => {
    const childKey = r.childrenId || r.childrenName || "Unassigned";
    const invoiceKey = r.invoiceId || "";

    if (prevChildKey !== null && childKey !== prevChildKey) {
      // Child changed: blank row + a label row announcing the new child,
      // so long sheets don't require scrolling back up to see who's who.
      aoa.push([]);
      aoa.push([`— ${childKey} —`]);
    } else if (prevInvoiceId !== null && invoiceKey !== prevInvoiceId) {
      // Same child, new invoice: single blank separator row.
      aoa.push([]);
    }

    aoa.push(auditRowToAOA(r));
    prevChildKey = childKey;
    prevInvoiceId = invoiceKey;
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoa);
  // Reasonable default column widths so the sheet is readable without the
  // admin manually resizing every column first.
  worksheet["!cols"] = [
    { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 22 }, { wch: 20 },
    { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 10 }, { wch: 20 },
    { wch: 20 }, { wch: 20 }, { wch: 30 }, { wch: 45 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions Audit");
  XLSX.writeFile(workbook, filename);
}


// Nested "collapsible" block shown under a finance row when the combined
// view is active — mirrors the styling of the existing split-payment
// summary row (amber background, small text) so the two nested-detail
// patterns look consistent instead of introducing a third visual style.
function TransactionsSubRow({ finance, colSpan }: { finance: FinanceLog; colSpan: number }) {
  const [expanded, setExpanded] = useState(true);
  const txs = finance.Transactions ?? [];

  if (txs.length === 0) {
    return (
      <tr className="bg-sky-50/50">
        <td />
        <td colSpan={colSpan - 1} className="px-4 pb-3 pt-0">
          <div className="text-xs text-slate-400 italic">No linked transactions found for this record.</div>
        </td>
      </tr>
    );
  }

  const total = txs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <tr className="bg-sky-50/50">
      <td />
      <td colSpan={colSpan - 1} className="px-4 pb-3 pt-0">
        <button
          type="button"
          className="flex items-center gap-1 text-xs font-semibold text-sky-800 mb-1"
          onClick={() => setExpanded(v => !v)}
        >
          {expanded ? <FiChevronDown /> : <FiChevronRight />}
          {txs.length} transaction{txs.length > 1 ? "s" : ""} · ₹{total.toLocaleString("en-IN")} total
        </button>
        {expanded && (
          <div className="flex flex-col gap-1 mt-1">
            {txs.map((t, i) => (
              <div key={t._id ?? i} className="text-xs text-sky-900 flex flex-wrap gap-x-4 gap-y-0.5 border-l-2 border-sky-200 pl-2">
                <span className="font-medium">₹{Number(t.amount).toLocaleString("en-IN")}</span>
                <span>{t.paymentMethod}</span>
                <span className="capitalize">{t.type}</span>
                {t.utr && t.utr.length > 0 && <span>UTR: {t.utr[t.utr.length - 1]}</span>}
                <span className="text-sky-700">{t.paymentId}</span>
                {t.paymentTime && (
                  <span className="text-slate-500">
                    {new Date(t.paymentTime).toLocaleString("en-GB")}
                  </span>
                )}
                {t.remark && <span className="text-slate-500 italic">{t.remark}</span>}
              </div>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

// NEW: unique-children / unique-bookings summary block.
//  - Two headline stat cards (children count, booking count).
//  - A collapsible per-child breakdown table so an admin can see WHICH
//    children/bookings are behind the totals, not just the numbers.
// Only rendered in "finances" mode (the counts are derived from Finances
// rows' `booking` links, which is what the finances table already fetches —
// no extra request needed).
function ChildrenBookingSummary({
  uniqueChildrenCount,
  uniqueBookingsCount,
  breakdown,
}: {
  uniqueChildrenCount: number;
  uniqueBookingsCount: number;
  breakdown: ChildrenBookingBreakdownEntry[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border rounded-lg p-6 mb-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
        <div className="flex-1 flex items-center gap-3">
          <div className="p-2 rounded bg-indigo-50 text-indigo-600">
            <FiUsers size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Unique Children (matching current filters)</div>
            <div className="text-2xl font-bold text-slate-800">{uniqueChildrenCount}</div>
          </div>
        </div>
        <div className="flex-1 flex items-center gap-3">
          <div className="p-2 rounded bg-emerald-50 text-emerald-600">
            <FiCalendar size={20} />
          </div>
          <div>
            <div className="text-xs text-slate-500">Unique Bookings (matching current filters)</div>
            <div className="text-2xl font-bold text-slate-800">{uniqueBookingsCount}</div>
          </div>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="mt-4 pt-4 border-t">
          <button
            type="button"
            className="flex items-center gap-1 text-xs font-semibold text-slate-600"
            onClick={() => setExpanded(v => !v)}
          >
            {expanded ? <FiChevronDown /> : <FiChevronRight />}
            Per-child booking breakdown ({breakdown.length})
          </button>
          {expanded && (
            <div className="mt-2 max-h-64 overflow-y-auto border rounded">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Child Name</th>
                    <th className="text-left px-3 py-2 font-medium">Child ID</th>
                    <th className="text-right px-3 py-2 font-medium">Booking Count</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.map((c, i) => (
                    <tr key={c.childrenId ?? c.childrenName ?? i} className="border-t">
                      <td className="px-3 py-2">{c.childrenName || "—"}</td>
                      <td className="px-3 py-2">{c.childrenId || "—"}</td>
                      <td className="px-3 py-2 text-right font-medium">{c.bookingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function FinancesPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("finances");

  const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
  const [transactionData, setTransactionData] = useState<TransactionDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sortField, setSortField] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("");
  const [creditDebitStatusFilter, setCreditDebitStatusFilter] = useState<string>("");
  const [childrenNameFilter, setChildrenNameFilter] = useState<string>("");
  const [childrenIdFilter, setChildrenIdFilter] = useState<string>("");
  const [minAmountFilter, setMinAmountFilter] = useState<string | number>("");
  const [maxAmountFilter, setMaxAmountFilter] = useState<string | number>("");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");

  const [editingLog, setEditingLog] = useState<FinanceLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [auditExporting, setAuditExporting] = useState(false);
  const [auditExportError, setAuditExportError] = useState<string | null>(null);

  const showFinances = viewMode === "finances" || viewMode === "both";
  const showTransactions = viewMode === "transactions" || viewMode === "both";
  // Nested transactions-under-finance-row are only fetched/rendered in "both"
  // mode. In "transactions"-only mode we hit the flat /finance/transactions
  // endpoint instead (a plain transactions table, not nested).
  const includeTransactions = viewMode === "both";

  const fetchFinances = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const params: Record<string, any> = { page, pageSize, sortField, sortOrder };
    if (search.trim()) params.search = search.trim();
    if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
    if (creditDebitStatusFilter) params.creditDebitStatus = creditDebitStatusFilter;
    if (childrenNameFilter) params.childrenName = childrenNameFilter;
    if (childrenIdFilter) params.childrenId = childrenIdFilter;
    if (minAmountFilter !== "") params.minAmount = minAmountFilter;
    if (maxAmountFilter !== "") params.maxAmount = maxAmountFilter;
    if (startDateFilter) params.startDate = startDateFilter;
    if (endDateFilter) params.endDate = endDateFilter;
    if (includeTransactions) params.includeTransactions = "true";

    return axios.get(`${baseUrl}/api/admin/finance/details`, { params });
  };

  // Standalone transactions fetch — only used in "transactions"-only mode.
  // Maps finance-side sort field names to the transaction endpoint's field
  // names since the two tables don't share a schema (date -> paymentTime).
  const fetchTransactions = () => {
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const txSortField = sortField === "date" ? "paymentTime" : sortField === "amount" ? "amount" : "recordedAt";
    const params: Record<string, any> = { page, pageSize, sortField: txSortField, sortOrder };
    if (search.trim()) params.search = search.trim();
    if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter.toLowerCase();
    if (childrenNameFilter) params.childrenName = childrenNameFilter;
    if (childrenIdFilter) params.childrenId = childrenIdFilter;
    if (minAmountFilter !== "") params.minAmount = minAmountFilter;
    if (maxAmountFilter !== "") params.maxAmount = maxAmountFilter;
    if (startDateFilter) params.startDate = startDateFilter;
    if (endDateFilter) params.endDate = endDateFilter;

    return axios.get(`${baseUrl}/api/admin/finance/transactions`, { params });
  };

  const fetchData = () => {
    setLoading(true);
    setError(null);

    const requests: Promise<any>[] = [];
    if (showFinances) requests.push(fetchFinances()); else requests.push(Promise.resolve(null));
    if (viewMode === "transactions") requests.push(fetchTransactions()); else requests.push(Promise.resolve(null));

    Promise.all(requests)
      .then(([financeRes, transactionRes]) => {
        if (financeRes) setFinanceData(financeRes.data);
        if (transactionRes) setTransactionData(transactionRes.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.data?.message || e.message || "Failed to fetch finance details");
        setLoading(false);
      });
  };

  const handleOpenEdit = (log: FinanceLog) => {
    setEditingLog(log);
    setShowEditModal(true);
  };

  // NEW: fetches EVERY transaction (unpaginated, unfiltered — this is a
  // full audit dump, not a "current view" export) and builds the grouped
  // workbook. Deliberately ignores the table's active filters: the admin
  // is meant to hand this whole sheet to someone else to comb through, not
  // export whatever they happened to be looking at.
  const handleExportTransactionsAudit = async () => {
    setAuditExporting(true);
    setAuditExportError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const res = await axios.get(`${baseUrl}/api/admin/finance/transactions/export-audit`);
      const rows: AuditRow[] = res.data?.rows ?? [];
      if (rows.length === 0) {
        setAuditExportError("No transactions found to export.");
        return;
      }
      downloadTransactionsAuditExcel(
        `transactions-audit-${new Date().toISOString().slice(0, 10)}.xlsx`,
        rows
      );
    } catch (e: any) {
      setAuditExportError(e?.response?.data?.message || e?.message || "Failed to export transactions audit sheet");
    } finally {
      setAuditExporting(false);
    }
  };

  // Switching view mode changes which endpoint/shape is active, so reset to
  // page 1 to avoid landing on an out-of-range page for the new dataset.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line
  }, [viewMode]);

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line
  }, [
    search, sortField, sortOrder, paymentMethodFilter, creditDebitStatusFilter,
    childrenNameFilter, childrenIdFilter, minAmountFilter, maxAmountFilter, startDateFilter, endDateFilter,
  ]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    viewMode, page, pageSize, search, sortField, sortOrder, paymentMethodFilter,
    creditDebitStatusFilter, childrenNameFilter, childrenIdFilter, minAmountFilter, maxAmountFilter,
    startDateFilter, endDateFilter,
  ]);

  const handleExportExcel = () => {
    if (financeData?.logs && financeData.logs.length > 0) {
      downloadExcel("finances.xlsx", financeData.logs);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const handleFilter = (field: string, value: string | number) => {
    switch (field) {
      case "paymentMethod": setPaymentMethodFilter(value as string); break;
      case "creditDebitStatus": setCreditDebitStatusFilter(value as string); break;
      case "childrenName": setChildrenNameFilter(value as string); break;
      case "childrenId": setChildrenIdFilter(value as string); break;
      case "minAmount": setMinAmountFilter(value); break;
      case "maxAmount": setMaxAmountFilter(value); break;
      case "startDate": setStartDateFilter(value as string); break;
      case "endDate": setEndDateFilter(value as string); break;
      case "sortField": setSortField(value as string); break;
      case "sortOrder": setSortOrder(value as "asc" | "desc"); break;
      default: break;
    }
  };

  const onPageChange = (newPage: number) => setPage(newPage);

  // Column count for the active finance table, used to size colSpans for
  // the split-payment and transactions sub-rows correctly.
  const financeColCount = 11;

  const activeData = viewMode === "transactions" ? transactionData : financeData;
  const totalPages = activeData?.totalPages ?? 1;
  const currentPage = activeData?.page ?? page;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <FinanceGroupEditModal
        open={showEditModal}
        financeId={editingLog?._id ?? null}
        onClose={() => setShowEditModal(false)}
        onSaved={() => { setShowEditModal(false); fetchData(); }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
          <div className="flex border rounded overflow-hidden">
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                showFinances ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() =>
                setViewMode(showTransactions ? (showFinances ? "transactions" : "both") : "finances")
              }
            >
              Finances
            </button>
            <button
              type="button"
              className={`px-4 py-2 text-sm font-medium border-l transition-colors ${
                showTransactions ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
              onClick={() =>
                setViewMode(showFinances ? (showTransactions ? "finances" : "both") : "transactions")
              }
            >
              Transactions
            </button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex items-center border px-2 rounded bg-white">
            <input
              type="text"
              className="py-2 px-3 outline-none bg-transparent placeholder:text-slate-400 text-sm"
              placeholder="Search by description, amount, type, date, payment method, UTR, children name/id, etc..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoCorrect="off"
              autoComplete="off"
            />
            <button type="submit" className="p-2 text-slate-500 hover:text-blue-600" aria-label="Search">
              <FiSearch />
            </button>
          </form>
          {showFinances && (
            <button
              className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
              onClick={handleExportExcel}
              disabled={!financeData?.logs?.length}
            >
              <FiDownload /> Export Excel
            </button>
          )}
          <button
            className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
            onClick={handleExportTransactionsAudit}
            disabled={auditExporting}
            title="Exports ALL transactions (not just the current filtered view), grouped by child and invoice, for admin review."
          >
            <FiDownload /> {auditExporting ? "Exporting…" : "Export Transactions Audit"}
          </button>
        </div>
      </div>

      {auditExportError && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-6">
          {auditExportError}
        </div>
      )}

      {/* Filters UI */}
      <div className="bg-white rounded border p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs mb-1 font-medium">Payment Method</label>
          <select className="border px-2 py-1 rounded w-40" value={paymentMethodFilter} onChange={e => handleFilter("paymentMethod", e.target.value)}>
            <option value="">All</option>
            {PAYMENT_METHOD_OPTIONS.map((meth) => <option key={meth} value={meth}>{meth}</option>)}
          </select>
        </div>

        {showFinances && (
          <div>
            <label className="block text-xs mb-1 font-medium">Credit/Debit</label>
            <select className="border px-2 py-1 rounded w-32" value={creditDebitStatusFilter} onChange={e => handleFilter("creditDebitStatus", e.target.value)}>
              <option value="">All</option>
              {CREDIT_DEBIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs mb-1 font-medium">Children Name</label>
          <input className="border px-2 py-1 rounded w-32" type="text" placeholder="Name" value={childrenNameFilter} onChange={e => handleFilter("childrenName", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Children ID</label>
          <input className="border px-2 py-1 rounded w-32" type="text" placeholder="ID" value={childrenIdFilter} onChange={e => handleFilter("childrenId", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Min Amount</label>
          <input className="border px-2 py-1 rounded w-24" type="number" placeholder="Min" value={minAmountFilter} onChange={e => handleFilter("minAmount", e.target.value)} min={0} />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Max Amount</label>
          <input className="border px-2 py-1 rounded w-24" type="number" placeholder="Max" value={maxAmountFilter} onChange={e => handleFilter("maxAmount", e.target.value)} min={0} />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Start Date</label>
          <input className="border px-2 py-1 rounded w-36" type="date" value={startDateFilter} onChange={e => handleFilter("startDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">End Date</label>
          <input className="border px-2 py-1 rounded w-36" type="date" value={endDateFilter} onChange={e => handleFilter("endDate", e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Sort By</label>
          <select className="border px-2 py-1 rounded w-28" value={sortField} onChange={e => handleFilter("sortField", e.target.value)}>
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="createdAt">Created At</option>
            <option value="updatedAt">Updated At</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Sort Order</label>
          <select className="border px-2 py-1 rounded w-28" value={sortOrder} onChange={e => handleFilter("sortOrder", e.target.value as "asc" | "desc")}>
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {loading && <div className="text-slate-600">Loading finances...</div>}
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}

      {!loading && !error && (
        <>
          {showFinances && financeData && (
            <>
              <div className="grid grid-cols-1 gap-6 mb-6">
                <div className="bg-white border rounded-lg p-6">
                  <div className="flex items-center justify-between text-sm text-slate-500">
                    <span>Total Income</span>
                    <FiArrowUpCircle className="text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{Number(financeData.totalIncome ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* NEW: unique children / unique bookings summary */}
              <ChildrenBookingSummary
                uniqueChildrenCount={financeData.uniqueChildrenCount ?? 0}
                uniqueBookingsCount={financeData.uniqueBookingsCount ?? 0}
                breakdown={financeData.childrenBookingBreakdown ?? []}
              />

              <div className="bg-white border rounded-lg overflow-x-auto mb-8">
                <div className="px-4 py-2 border-b bg-slate-50 text-sm font-semibold text-slate-700">
                  Finances{includeTransactions ? " + Linked Transactions" : ""}
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-left">Children Name</th>
                      <th className="px-4 py-3 text-left">Children ID</th>
                      <th className="px-4 py-3 text-left">Credit/Debit</th>
                      <th className="px-4 py-3 text-left">Payment Method</th>
                      <th className="px-4 py-3 text-left">UTR</th>
                      <th className="px-4 py-3 text-left">Created At</th>
                      <th className="px-4 py-3 text-left">Updated At</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financeData.logs && financeData.logs.length > 0 ? (
                      (() => {
                        const logs = financeData.logs;
                        const refGroups = new Map<string, FinanceLog[]>();
                        logs.forEach((l) => {
                          if (l.TransactionRef) {
                            if (!refGroups.has(l.TransactionRef)) refGroups.set(l.TransactionRef, []);
                            refGroups.get(l.TransactionRef)!.push(l);
                          }
                        });
                        const seenRefs = new Set<string>();

                        return logs.flatMap((log, idx) => {
                          const group = log.TransactionRef ? refGroups.get(log.TransactionRef) : undefined;
                          const isSplit = !!group && group.length > 1;
                          const isFirstOfGroup = isSplit && log.TransactionRef && !seenRefs.has(log.TransactionRef);
                          if (isFirstOfGroup && log.TransactionRef) seenRefs.add(log.TransactionRef);

                          const rows = [
                            <tr key={idx} className={`border-t ${isSplit ? "bg-amber-50/60" : ""}`}>
                              <td className="px-4 py-3">
                                {log.Date
                                  ? (() => {
                                      const d = new Date(log.Date);
                                      if (isNaN(d.getTime())) return "-";
                                      const date = d.toLocaleDateString("en-GB");
                                      const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).slice(0, 5);
                                      return `${date}, ${time}`;
                                    })()
                                  : "-"}
                              </td>
                              <td className="px-4 py-3">
                                {log.Description}
                                {isSplit && (
                                  <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-amber-200 text-amber-800">
                                    Split payment
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3">{log.ChildrenName ?? "-"}</td>
                              <td className="px-4 py-3">{log.ChildrenId ?? "-"}</td>
                              <td className="px-4 py-3">{log.CreditDebitStatus ?? "-"}</td>
                              <td className="px-4 py-3">{log.PaymentMethod ?? "-"}</td>
                              <td className="px-4 py-3">
                                {log.Utr && log.Utr.length > 0 ? (
                                  <span className="break-all inline-block mr-2 whitespace-nowrap">{log.Utr[log.Utr.length - 1]}</span>
                                ) : "-"}
                              </td>
                              <td className="px-4 py-3">{log.CreatedAt ? new Date(log.CreatedAt).toLocaleString("en-GB") : "-"}</td>
                              <td className="px-4 py-3">{log.UpdatedAt ? new Date(log.UpdatedAt).toLocaleString("en-GB") : "-"}</td>
                              <td className={`px-4 py-3 text-right ${log.Type === "Income" ? "text-green-600" : log.Type === "Expense" ? "text-red-500" : "text-slate-800"}`}>
                                ₹{Number(log.Amount).toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  className="inline-flex items-center gap-1 p-1 border rounded hover:bg-slate-50 text-blue-600"
                                  onClick={() => handleOpenEdit(log)}
                                  title="Edit Finance Record"
                                >
                                  <FiEdit2 />
                                  <span className="sr-only">Edit</span>
                                </button>
                              </td>
                            </tr>,
                          ];

                          if (isFirstOfGroup && group) {
                            const total = group.reduce((sum, r) => sum + (Number(r.Amount) || 0), 0);
                            rows.push(
                              <tr key={`${idx}-split-summary`} className="bg-amber-50/60">
                                <td />
                                <td colSpan={financeColCount - 1} className="px-4 pb-3 pt-0">
                                  <div className="text-xs text-amber-800 flex flex-wrap gap-x-4 gap-y-1">
                                    <span className="font-semibold">
                                      ₹{total.toLocaleString("en-IN")} collected in one payment, split:
                                    </span>
                                    {group.map((r, gi) => (
                                      <span key={gi}>₹{Number(r.Amount).toLocaleString("en-IN")} — {r.Description}</span>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          // Nested transactions block — only rendered in "both" mode.
                          if (includeTransactions) {
                            rows.push(
                              <TransactionsSubRow key={`${idx}-tx`} finance={log} colSpan={financeColCount} />
                            );
                          }

                          return rows;
                        });
                      })()
                    ) : (
                      <tr>
                        <td colSpan={financeColCount} className="px-4 py-6 text-center text-slate-400">
                          No finance logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Standalone Transactions table — only shown in "transactions"-only
              mode. In "both" mode transactions are nested under finance rows
              above instead of duplicated here. */}
          {viewMode === "transactions" && transactionData && (
            <div className="bg-white border rounded-lg overflow-x-auto mb-8">
              <div className="px-4 py-2 border-b bg-slate-50 text-sm font-semibold text-slate-700">Transactions</div>
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left">Payment Time</th>
                    <th className="px-4 py-3 text-left">Payment ID</th>
                    <th className="px-4 py-3 text-left">Linked Finance</th>
                    <th className="px-4 py-3 text-left">Children</th>
                    <th className="px-4 py-3 text-left">Method</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">UTR</th>
                    <th className="px-4 py-3 text-left">Remark</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionData.logs && transactionData.logs.length > 0 ? (
                    transactionData.logs.map((t, idx) => (
                      <tr key={t._id ?? idx} className={`border-t ${!t.FinanceId ? "bg-red-50/40" : ""}`}>
                        <td className="px-4 py-3">
                          {t.PaymentTime ? new Date(t.PaymentTime).toLocaleString("en-GB") : "-"}
                        </td>
                        <td className="px-4 py-3">{t.PaymentId}</td>
                        <td className="px-4 py-3">
                          {t.FinanceDescription ?? (
                            <span className="text-red-500 text-xs font-medium">Unlinked</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {t.ChildrenName ? `${t.ChildrenName}${t.ChildrenId ? ` (${t.ChildrenId})` : ""}` : "-"}
                        </td>
                        <td className="px-4 py-3">{t.PaymentMethod}</td>
                        <td className="px-4 py-3 capitalize">{t.Type}</td>
                        <td className="px-4 py-3">
                          {t.Utr && t.Utr.length > 0 ? t.Utr[t.Utr.length - 1] : "-"}
                        </td>
                        <td className="px-4 py-3">{t.Remark ?? "-"}</td>
                        <td className="px-4 py-3 text-right">₹{Number(t.Amount).toLocaleString("en-IN")}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-4 py-6 text-center text-slate-400">
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                className="px-2 py-1 rounded border bg-white text-slate-700 disabled:opacity-30 flex items-center"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <FiArrowLeft /> Prev
              </button>
              <span className="mx-2 text-sm select-none">{currentPage} / {totalPages}</span>
              <button
                className="px-2 py-1 rounded border bg-white text-slate-700 disabled:opacity-30 flex items-center"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                Next <FiArrowRight />
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}