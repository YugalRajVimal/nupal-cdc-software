import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiArrowUpCircle, FiDownload, FiSearch, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

interface FinanceLog {
  Date: string;
  Description: string;
  Type: string;
  Amount: number;
  CreditDebitStatus?: string;
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

function downloadExcel(filename: string, rows: FinanceLog[]) {
  const worksheetRows = rows.map((row) => ({
    Date: row.Date
      ? new Date(row.Date).toLocaleDateString("en-GB")
      : "",
    Description: row.Description,
    Type: row.Type,
    Amount: row.Amount,
    CreditDebitStatus: row.CreditDebitStatus ?? "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: ["Date", "Description", "Type", "Amount", "CreditDebitStatus"],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
  XLSX.writeFile(workbook, filename);
}

export default function FinancesPage() {
  const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchData = () => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const params: Record<string, any> = {
      page,
      pageSize,
    };
    if (search.trim()) params.search = search.trim();

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

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, search]);

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

  const onPageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
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
              placeholder="Search by description, amount, type, date..."
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

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Credit/Debit</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {financeData.logs && financeData.logs.length > 0 ? (
                  financeData.logs.map((log, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-4 py-3">
                        {log.Date
                          ? new Date(log.Date).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{log.Description}</td>
                      <td className="px-4 py-3">{log.Type}</td>
                      <td className="px-4 py-3">{log.CreditDebitStatus ?? "-"}</td>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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
