import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  FiArrowUpCircle, FiDownload, FiSearch, FiArrowLeft, FiArrowRight, FiEdit2
} from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

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
}

const DEFAULT_PAGE_SIZE = 10;
const PAYMENT_METHOD_OPTIONS = [
  "Cash",
  "Online",
];

// For filter dropdowns
const CREDIT_DEBIT_OPTIONS = [
  "Credit",
  "Debit",
];

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
      "_id",
      "Date",
      "Description",
      "Type",
      "Amount",
      "CreditDebitStatus",
      "PaymentMethod",
      "Utr",
      "ChildrenName",
      "ChildrenId",
      "CreatedAt",
      "UpdatedAt",
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
  XLSX.writeFile(workbook, filename);
}

// Edit Dialog for Payment Method
function EditPaymentMethodModal({
  open,
  onClose,
  log,
  onSave,
  saving,
  error,
}: {
  open: boolean;
  onClose: () => void;
  log: FinanceLog | null;
  onSave: (data: { paymentMethod: string; utr: string }) => void;
  saving: boolean;
  error: string | null;
}) {
  const [paymentMethod, setPaymentMethod] = useState("");
  const [utr, setUtr] = useState("");
  // const [dirty, setDirty] = useState(false);

  // Intialize on open
  useEffect(() => {
    if (open && log) {
      setPaymentMethod(log.PaymentMethod ?? "");
      setUtr(
        log.Utr && log.Utr.length > 0
          ? log.Utr[log.Utr.length - 1]
          : ""
      );
      // setDirty(false);
    }
  }, [open, log]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // setDirty(true);
    if (!paymentMethod) return;
    onSave({ paymentMethod, utr });
  }

  if (!open || !log) return null;
  return (
    <div className="fixed inset-0 bg-black/20 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-[90vw] max-w-lg shadow-xl border">
        <h2 className="text-lg font-semibold mb-4">Edit Payment Method</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Payment Method</label>
            <select
              className="w-full border rounded py-2 px-3"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              required
            >
              <option value="">Select payment method</option>
              {PAYMENT_METHOD_OPTIONS.map(meth => (
                <option key={meth} value={meth}>
                  {meth}
                </option>
              ))}
            </select>
          </div>
          {/* Only show UTR field when Payment Method is Online */}
          {paymentMethod === "Online" && (
            <div>
              <label className="block text-sm font-medium mb-1">
                UTR (for bank/UPI transfers)
              </label>
              <input
                className="w-full border rounded py-2 px-3"
                value={utr}
                onChange={e => setUtr(e.target.value)}
                maxLength={50}
                placeholder="Optional: Transaction/UTR"
                autoComplete="off"
              />
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <button
              type="button"
              className="px-4 py-2 bg-slate-100 rounded text-slate-800"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
              disabled={saving || !paymentMethod}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function FinancesPage() {
  const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Filters
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

  // For editing payment method
  const [editingLog, setEditingLog] = useState<FinanceLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const params: Record<string, any> = {
      page,
      pageSize,
      sortField,
      sortOrder,
    };
    if (search.trim()) params.search = search.trim();
    if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;
    if (creditDebitStatusFilter) params.creditDebitStatus = creditDebitStatusFilter;
    if (childrenNameFilter) params.childrenName = childrenNameFilter;
    if (childrenIdFilter) params.childrenId = childrenIdFilter;
    if (minAmountFilter !== "") params.minAmount = minAmountFilter;
    if (maxAmountFilter !== "") params.maxAmount = maxAmountFilter;
    if (startDateFilter) params.startDate = startDateFilter;
    if (endDateFilter) params.endDate = endDateFilter;

    axios
      .get(`${baseUrl}/api/admin/finance/details`, { params })
      .then((response) => {
        setFinanceData(response.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch finance details"
        );
        setLoading(false);
      });
  };

  // Handle edit modal open
  const handleOpenEdit = (log: FinanceLog) => {
    setEditingLog(log);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleCloseEdit = () => {
    setShowEditModal(false);
    setEditingLog(null);
    setEditError(null);
  };

  const handleSaveEdit = async ({
    paymentMethod,
    utr,
  }: {
    paymentMethod: string;
    utr: string;
  }) => {
    if (!editingLog?._id) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      await axios.patch(
        `${baseUrl}/api/admin/finance/update-payment-method/${editingLog._id}`,
        { paymentMethod, utr }
      );
      setEditSaving(false);
      setShowEditModal(false);
      setEditingLog(null);
      // Immediately refresh finance data after update
      fetchData();
    } catch (e: any) {
      setEditError(
        e?.response?.data?.message ||
        e?.message ||
        "Failed to update payment method"
      );
      setEditSaving(false);
    }
  };

  // When any filter changes, page should probably reset to 1 (except page itself)
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line
  }, [
    search,
    sortField,
    sortOrder,
    paymentMethodFilter,
    creditDebitStatusFilter,
    childrenNameFilter,
    childrenIdFilter,
    minAmountFilter,
    maxAmountFilter,
    startDateFilter,
    endDateFilter,
  ]);

  // Effect to fetch data
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    search,
    sortField,
    sortOrder,
    paymentMethodFilter,
    creditDebitStatusFilter,
    childrenNameFilter,
    childrenIdFilter,
    minAmountFilter,
    maxAmountFilter,
    startDateFilter,
    endDateFilter,
  ]);

  const handleExportExcel = () => {
    if (financeData?.logs && financeData.logs.length > 0) {
      downloadExcel("finances.xlsx", financeData.logs);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); // Reset to first page on new search
    setSearch(searchInput);
  };

  const handleFilter = (field: string, value: string | number) => {
    switch (field) {
      case "paymentMethod":
        setPaymentMethodFilter(value as string);
        break;
      case "creditDebitStatus":
        setCreditDebitStatusFilter(value as string);
        break;
      case "childrenName":
        setChildrenNameFilter(value as string);
        break;
      case "childrenId":
        setChildrenIdFilter(value as string);
        break;
      case "minAmount":
        setMinAmountFilter(value);
        break;
      case "maxAmount":
        setMaxAmountFilter(value);
        break;
      case "startDate":
        setStartDateFilter(value as string);
        break;
      case "endDate":
        setEndDateFilter(value as string);
        break;
      case "sortField":
        setSortField(value as string);
        break;
      case "sortOrder":
        setSortOrder(value as "asc" | "desc");
        break;
      default:
        break;
    }
  };

  const onPageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <EditPaymentMethodModal
        open={showEditModal}
        onClose={handleCloseEdit}
        log={editingLog}
        onSave={handleSaveEdit}
        saving={editSaving}
        error={editError}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <form
            onSubmit={handleSearch}
            className="flex items-center border px-2 rounded bg-white"
          >
            <input
              type="text"
              className="py-2 px-3 outline-none bg-transparent placeholder:text-slate-400 text-sm"
              placeholder="Search by description, amount, type, date, payment method, UTR, children name/id, etc..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoCorrect="off"
              autoComplete="off"
            />
            <button
              type="submit"
              className="p-2 text-slate-500 hover:text-blue-600"
              aria-label="Search"
            >
              <FiSearch />
            </button>
          </form>
          <button
            className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
            onClick={handleExportExcel}
            disabled={!financeData?.logs?.length}
          >
            <FiDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Filters UI */}
      <div className="bg-white rounded border p-4 mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs mb-1 font-medium">Payment Method</label>
          <select
            className="border px-2 py-1 rounded w-40"
            value={paymentMethodFilter}
            onChange={e => handleFilter("paymentMethod", e.target.value)}
          >
            <option value="">All</option>
            {PAYMENT_METHOD_OPTIONS.map((meth) => (
              <option key={meth} value={meth}>
                {meth}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs mb-1 font-medium">Credit/Debit</label>
          <select
            className="border px-2 py-1 rounded w-32"
            value={creditDebitStatusFilter}
            onChange={e => handleFilter("creditDebitStatus", e.target.value)}
          >
            <option value="">All</option>
            {CREDIT_DEBIT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Children Name</label>
          <input
            className="border px-2 py-1 rounded w-32"
            type="text"
            placeholder="Name"
            value={childrenNameFilter}
            onChange={e => handleFilter("childrenName", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Children ID</label>
          <input
            className="border px-2 py-1 rounded w-32"
            type="text"
            placeholder="ID"
            value={childrenIdFilter}
            onChange={e => handleFilter("childrenId", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Min Amount</label>
          <input
            className="border px-2 py-1 rounded w-24"
            type="number"
            placeholder="Min"
            value={minAmountFilter}
            onChange={e => handleFilter("minAmount", e.target.value)}
            min={0}
          />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Max Amount</label>
          <input
            className="border px-2 py-1 rounded w-24"
            type="number"
            placeholder="Max"
            value={maxAmountFilter}
            onChange={e => handleFilter("maxAmount", e.target.value)}
            min={0}
          />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Start Date</label>
          <input
            className="border px-2 py-1 rounded w-36"
            type="date"
            value={startDateFilter}
            onChange={e => handleFilter("startDate", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">End Date</label>
          <input
            className="border px-2 py-1 rounded w-36"
            type="date"
            value={endDateFilter}
            onChange={e => handleFilter("endDate", e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Sort By</label>
          <select
            className="border px-2 py-1 rounded w-28"
            value={sortField}
            onChange={e => handleFilter("sortField", e.target.value)}
          >
            <option value="date">Date</option>
            <option value="amount">Amount</option>
            <option value="createdAt">Created At</option>
            <option value="updatedAt">Updated At</option>
          </select>
        </div>
        <div>
          <label className="block text-xs mb-1 font-medium">Sort Order</label>
          <select
            className="border px-2 py-1 rounded w-28"
            value={sortOrder}
            onChange={e => handleFilter("sortOrder", e.target.value as "asc" | "desc")}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="text-slate-600">Loading finances...</div>
      )}
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {!loading && !error && financeData && (
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

          <div className="bg-white border rounded-lg overflow-x-auto">
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
                  financeData.logs.map((log, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">
                        {log.Date
                          ? (() => {
                              const d = new Date(log.Date);
                              if (isNaN(d.getTime())) return "-";
                              const date = d.toLocaleDateString("en-GB");
                              const time = d
                                .toLocaleTimeString("en-GB", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                })
                                .slice(0, 5);
                              return `${date}, ${time}`;
                            })()
                          : "-"}
                      </td>

                      <td className="px-4 py-3">{log.Description}</td>
                      <td className="px-4 py-3">{log.ChildrenName ?? "-"}</td>
                      <td className="px-4 py-3">{log.ChildrenId ?? "-"}</td>
                      <td className="px-4 py-3">{log.CreditDebitStatus ?? "-"}</td>
                      <td className="px-4 py-3">{log.PaymentMethod ?? "-"}</td>
                      <td className="px-4 py-3 ">
                        {log.Utr && log.Utr.length > 0 ? (
                          <span className="break-all inline-block mr-2 whitespace-nowrap">
                            {log.Utr[log.Utr.length - 1]}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {log.CreatedAt
                          ? new Date(log.CreatedAt).toLocaleString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {log.UpdatedAt
                          ? new Date(log.UpdatedAt).toLocaleString("en-GB")
                          : "-"}
                      </td>
                      <td
                        className={`px-4 py-3 text-right ${
                          log.Type === "Income"
                            ? "text-green-600"
                            : log.Type === "Expense"
                            ? "text-red-500"
                            : "text-slate-800"
                        }`}
                      >
                        ₹{Number(log.Amount).toLocaleString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          className="inline-flex items-center gap-1 p-1 border rounded hover:bg-slate-50 text-blue-600"
                          onClick={() => handleOpenEdit(log)}
                          title="Edit Payment Method"
                        >
                          <FiEdit2 />
                          <span className="sr-only">Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={12} className="px-4 py-6 text-center text-slate-400">
                      No finance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {financeData.totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                className="px-2 py-1 rounded border bg-white text-slate-700 disabled:opacity-30 flex items-center"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <FiArrowLeft /> Prev
              </button>
              <span className="mx-2 text-sm select-none">
                {financeData.page} / {financeData.totalPages}
              </span>
              <button
                className="px-2 py-1 rounded border bg-white text-slate-700 disabled:opacity-30 flex items-center"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= financeData.totalPages}
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
