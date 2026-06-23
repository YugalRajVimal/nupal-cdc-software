import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiDollarSign, FiArrowDownCircle, FiArrowUpCircle, FiDownload, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

/**
 * Finance log interface including children's details.
 */
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

  // NEW: Match backend (@finance.controller.js, line 125-126)
  ChildrenName?: string;
  ChildrenId?: string;
}

/**
 * Server response interface, as in finance.controller.js
 */
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

// Updated Excel export to include children fields, auto-handle missing values.
function downloadExcel(filename: string, rows: FinanceLog[]) {
  const worksheetRows = rows.map((row) => ({
    _id: row._id || "",
    Date: row.Date ? new Date(row.Date).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }) : "",
    Description: row.Description,
    Type: row.Type,
    Amount: row.Amount,
    CreditDebitStatus: row.CreditDebitStatus || "",
    PaymentMethod: row.PaymentMethod || "",
    Utr: Array.isArray(row.Utr) ? row.Utr.join(", ") : (row.Utr ? String(row.Utr) : ""),
    CreatedAt: row.CreatedAt ? new Date(row.CreatedAt).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }) : "",
    UpdatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" }) : "",
    ChildrenName: row.ChildrenName || "",
    ChildrenId: row.ChildrenId || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: [
      "_id", "Date", "Description", "Type", "Amount",
      "CreditDebitStatus", "PaymentMethod", "Utr", "CreatedAt", "UpdatedAt",
      "ChildrenName", "ChildrenId"
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
  XLSX.writeFile(workbook, filename);
}

export default function FinancesSuperAdminPage() {
  const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const [excelLoading, setExcelLoading] = useState(false);

  const fetchFinanceData = (pageNum: number, searchQuery: string) => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    axios
      .get(`${baseUrl}/api/super-admin/finance/details`, {
        params: {
          page: pageNum,
          pageSize,
          search: searchQuery,
          sortField: "date",
          sortOrder: "desc",
        }
      })
      .then((response) => {
        setFinanceData(response.data);
        setLoading(false);
        setError(null);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch finance details"
        );
        setLoading(false);
        setFinanceData(null);
      });
  };

  useEffect(() => {
    fetchFinanceData(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(1);
    fetchFinanceData(1, search);
  };

  const handleChangeSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const goToPrevPage = () => {
    if (financeData && page > 1) setPage(page - 1);
  };

  const goToNextPage = () => {
    if (financeData && financeData.page < financeData.totalPages) setPage(page + 1);
  };

  // Excel export: all details
  const handleExportExcel = async () => {
    if (!financeData) return;
    setExcelLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_API_URL || "";
      const resp = await axios.get(`${baseUrl}/api/super-admin/finance/details`, {
        params: {
          page: 1,
          pageSize: 10000,
          search,
          sortField: "date",
          sortOrder: "desc",
        },
      });
      if (resp.data?.logs?.length > 0) {
        downloadExcel("finances.xlsx", resp.data.logs);
      }
    } catch (e: any) {
      setError(
        e.response?.data?.message ||
          e.message ||
          "Failed to export finance details"
      );
    } finally {
      setExcelLoading(false);
    }
  };

  // Table headers: add ChildrenName, ChildrenId
  const financeHeaders = [
    { label: "Date", key: "Date" },
    { label: "Description", key: "Description" },
    { label: "Children Name", key: "ChildrenName" },
    { label: "Children ID", key: "ChildrenId" },
    { label: "Type", key: "Type" },
    { label: "Amount", key: "Amount" },
    { label: "Credit/Debit", key: "CreditDebitStatus" },
    { label: "Payment Method", key: "PaymentMethod" },
    { label: "UTR", key: "Utr" },
   
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
        <div className="flex gap-3 items-center">
          <form onSubmit={handleSearch} className="flex items-center">
            <input
              value={search}
              onChange={handleChangeSearch}
              type="text"
              placeholder="Search (desc, type, status, amount, date, method, UTR, child)..."
              className="px-3 py-2 border rounded-l outline-none text-sm"
              autoCorrect="off"
              autoComplete="off"
            />
            <button type="submit" className="bg-slate-100 px-3 py-2 rounded-r border-l border-slate-200 text-slate-600 hover:bg-slate-200">
              <FiSearch />
            </button>
          </form>
          <button
            className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
            onClick={handleExportExcel}
            disabled={excelLoading || !financeData?.total}
          >
            {excelLoading ? (
              <span className="animate-spin w-4 h-4 border-2 border-slate-500 rounded-full border-t-transparent border-b-transparent"></span>
            ) : (
              <FiDownload />
            )} Export Excel
          </button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Income</span>
                <FiArrowUpCircle className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₹{Number(financeData.totalIncome ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Expenses</span>
                <FiArrowDownCircle className="text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-500">
                ₹{Number(financeData.totalExpenses ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Net Balance</span>
                <FiDollarSign className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-slate-800">
                ₹{Number(financeData.netBalance ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[1300px]">
              <thead className="bg-slate-100">
                <tr>
                  {financeHeaders.map((header) => (
                    <th key={header.key} className={`px-4 py-3 text-left`}>
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financeData.logs && financeData.logs.length > 0 ? (
                  financeData.logs.map((log, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">
                        {log.Date
                          ? new Date(log.Date).toLocaleString("en-GB", { timeZone: "Asia/Kolkata" })
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{log.Description || "-"}</td>
                      <td className="px-4 py-3">{log.ChildrenName || "-"}</td>
                      <td className="px-4 py-3">{log.ChildrenId || "-"}</td>
                      <td className="px-4 py-3">{log.Type || "-"}</td>
                      <td className={`px-4 py-3 text-right ${
                          log.Type === "Income"
                            ? "text-green-600"
                            : log.Type === "Expense"
                            ? "text-red-500"
                            : "text-slate-800"
                        }`}>
                        ₹{typeof log.Amount !== "undefined" ? Number(log.Amount).toLocaleString("en-IN") : "-"}
                      </td>
                      <td className="px-4 py-3">{log.CreditDebitStatus || "-"}</td>
                      <td className="px-4 py-3">{log.PaymentMethod || "-"}</td>
                      <td className="px-4 py-3 whitespace-pre-line">
                        {Array.isArray(log.Utr) && log.Utr.length > 0
                          ? log.Utr[log.Utr.length - 1]
                          : log.Utr
                          ? String(log.Utr)
                          : "-"}
                      </td>
                   
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={financeHeaders.length} className="px-4 py-6 text-center text-slate-400">
                      No finance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-center justify-between p-4 border-t bg-slate-50">
              <div className="text-xs text-slate-500">
                {financeData.logs && financeData.logs.length > 0 ? (
                  <>Showing page {financeData.page} of {financeData.totalPages} (Total: {financeData.total})</>
                ) : null}
              </div>
              <div className="flex gap-2">
                <button
                  className="p-2 rounded border bg-white disabled:opacity-50"
                  onClick={goToPrevPage}
                  disabled={financeData.page <= 1}
                >
                  <FiChevronLeft />
                </button>
                <button
                  className="p-2 rounded border bg-white disabled:opacity-50"
                  onClick={goToNextPage}
                  disabled={financeData.page >= financeData.totalPages}
                >
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
