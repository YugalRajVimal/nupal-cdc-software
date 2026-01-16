import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiDollarSign, FiArrowDownCircle, FiArrowUpCircle, FiDownload } from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

// Finance log matches backend controller export structure
interface FinanceLog {
  Date: string;
  Description: string;
  Type: string;
  Amount: number;
}

// The server returns an object matching finance.controller.js
interface FinanceDetailsResponse {
  success: boolean;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  logs: FinanceLog[];
  message?: string;
  error?: string;
}

function downloadExcel(filename: string, rows: FinanceLog[]) {
  // Prepare data for Excel, ensure header order
  const worksheetRows = rows.map((row) => ({
    Date: row.Date
      ? new Date(row.Date).toLocaleDateString("en-GB")
      : "",
    Description: row.Description,
    Type: row.Type,
    Amount: row.Amount,
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: ["Date", "Description", "Type", "Amount"],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Finances");
  XLSX.writeFile(workbook, filename);
}

export default function FinancesSuperAdminPage() {
  const [financeData, setFinanceData] = useState<FinanceDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    axios
      .get(`${baseUrl}/api/super-admin/finance/details`)
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
  }, []);

  const handleExportExcel = () => {
    if (financeData?.logs && financeData.logs.length > 0) {
      downloadExcel("finances.xlsx", financeData.logs);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
        <button
          className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
          onClick={handleExportExcel}
          disabled={!financeData?.logs?.length}
        >
          <FiDownload /> Export Excel
        </button>
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

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Type</th>
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
                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                      No finance logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
}
