import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiDollarSign, FiPackage, FiCalendar, FiDownload } from "react-icons/fi";
import axios from "axios";
// @ts-ignore
import * as XLSX from "xlsx";

// Data structure for TherapistProfile earnings array per user.schema.js
interface TherapistEarningEntry {
  _id: string;
  amount: number;
  type: "salary" | "contract";
  fromDate: string;
  toDate: string;
  remark?: string;
  paidOn?: string;
}

interface TherapistEarningsResponse {
  success: boolean;
  data: {
    totalEarnings: number;
    totalBookings: number;
    details: TherapistEarningEntry[];
  };
  error?: string;
  message?: string;
}

function downloadExcel(filename: string, rows: TherapistEarningEntry[]) {
  const worksheetRows = rows.map((row) => ({
    "Paid On":
      row.paidOn || row.fromDate
        ? new Date(row.paidOn || row.fromDate).toLocaleDateString("en-GB")
        : "",
    "Amount": typeof row.amount === "number" ? row.amount : "",
    "Type": row.type,
    "From Date": row.fromDate
      ? new Date(row.fromDate).toLocaleDateString("en-GB")
      : "",
    "To Date": row.toDate
      ? new Date(row.toDate).toLocaleDateString("en-GB")
      : "",
    "Remark": row.remark || "",
  }));
  const worksheet = XLSX.utils.json_to_sheet(worksheetRows, {
    header: [
      "Paid On",
      "Amount",
      "Type",
      "From Date",
      "To Date",
      "Remark",
    ],
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Earnings");
  XLSX.writeFile(workbook, filename);
}

export default function MyEarningsTherapist() {
  const [earnings, setEarnings] = useState<TherapistEarningsResponse["data"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEarnings() {
      setLoading(true);
      setError(null);
      try {
        const baseUrl = import.meta.env.VITE_API_URL || "";
        const token = localStorage.getItem("therapist-token");
        const res = await axios.get(`${baseUrl}/api/therapist/earnings`, {
          headers: {
            Authorization: token ? `${token}` : "",
          },
        });
        if (res.data && res.data.success) {
          setEarnings(res.data.data);
        } else {
          setError(res.data?.message || "Failed to fetch earnings");
        }
      } catch (e: any) {
        setError(
          e?.response?.data?.message ||
            e?.message ||
            "Failed to fetch earnings"
        );
      } finally {
        setLoading(false);
      }
    }
    fetchEarnings();
  }, []);

  const handleExportExcel = () => {
    if (earnings?.details && earnings.details.length > 0) {
      downloadExcel("my-earnings.xlsx", earnings.details);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Earnings</h1>
        <button
          className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100 disabled:opacity-50"
          onClick={handleExportExcel}
          disabled={!earnings?.details?.length}
        >
          <FiDownload /> Export Excel
        </button>
      </div>

      {loading && (
        <div className="text-slate-600">Loading earnings...</div>
      )}
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {!loading && !error && earnings && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Earnings</span>
                <FiDollarSign className="text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">
                ₹{Number(earnings.totalEarnings ?? 0).toLocaleString("en-IN")}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Total Payouts</span>
                <FiPackage className="text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-700">
                {earnings.totalBookings}
              </p>
            </div>
            <div className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Paid Month Range</span>
                <FiCalendar className="text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-800">
                {(() => {
                  // Show range of months covered in data, e.g. "Jan 2024 - Mar 2024" or "-"
                  if (!earnings.details || earnings.details.length === 0) return "-";
                  const allDates = earnings.details.flatMap(e =>
                    [e.paidOn, e.fromDate, e.toDate].filter(Boolean)
                  );
                  if (allDates.length === 0) return "-";
                  const asObj = allDates.map(d => new Date(d!));
                  const min = new Date(Math.min(...asObj.map(d => d.valueOf())));
                  const max = new Date(Math.max(...asObj.map(d => d.valueOf())));
                  return `${min.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}` +
                    (min.getMonth() === max.getMonth() && min.getFullYear() === max.getFullYear()
                      ? ""
                      : ` - ${max.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`);
                })()}
              </p>
            </div>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left">Paid On</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">From Date</th>
                  <th className="px-4 py-3 text-left">To Date</th>
                  <th className="px-4 py-3 text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {earnings.details && earnings.details.length > 0 ? (
                  earnings.details.map((entry, idx) => (
                    <tr key={entry._id || idx} className="border-t">
                      <td className="px-4 py-3">
                        {(entry.paidOn || entry.fromDate)
                          ? new Date(entry.paidOn || entry.fromDate).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {typeof entry.amount === "number"
                          ? `₹${Number(entry.amount).toLocaleString("en-IN")}`
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{entry.type}</td>
                      <td className="px-4 py-3">
                        {entry.fromDate
                          ? new Date(entry.fromDate).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        {entry.toDate
                          ? new Date(entry.toDate).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-4 py-3">{entry.remark || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No payout records found.
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
