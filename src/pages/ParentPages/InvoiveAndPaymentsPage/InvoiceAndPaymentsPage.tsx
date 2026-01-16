import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiDownload } from "react-icons/fi";
import axios from "axios";
import * as XLSX from "xlsx";


// Interface for each payment detail coming from backend
interface PaymentDetail {
  InvoiceId: string;
  date: string;
  patientName: string;
  patientId:string;
  amount: number;
  status: string;
}

// Response interface from backend for payments
interface PaymentsResponse {
  success: boolean;
  payments: PaymentDetail[];
  message?: string;
  error?: string;
}


function downloadExcel(filename: string, rows: PaymentDetail[]) {
  const worksheetData = [
    ["InvoiceId", "Date", "Patient Id", "Patient Name", "Amount", "Status"],
    ...rows.map((row) => [
      row.InvoiceId,
      row.date ? new Date(row.date).toLocaleDateString("en-GB") : "",
      row.patientId,
      row.patientName,
      row.amount,
      row.status,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices & Payments");

  // XLSX will infer the file extension as .xlsx
  XLSX.writeFile(workbook, filename.endsWith(".xlsx") ? filename : filename + ".xlsx");
}

export default function InvoiveAndPaymentsPage() {
  const [paymentsData, setPaymentsData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const baseUrl = import.meta.env.VITE_API_URL || "";
    const token = localStorage.getItem("patient-token");
    axios
      .get(`${baseUrl}/api/parent/invoice-and-payment`, {
        headers: {
          Authorization: token ? `${token}` : undefined,
        },
      })
      .then((response) => {
        setPaymentsData(response.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch payment details"
        );
        setLoading(false);
      });
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Invoices & Payments</h1>
        {!loading && !error && paymentsData?.payments?.length ? (
          <button
            onClick={() =>
              downloadExcel(
                "invoices-payments",
                paymentsData.payments
              )
            }
            className="flex items-center gap-2 px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-100 transition"
          >
            <FiDownload /> Download Excel
          </button>
        ) : null}
      </div>

      {loading && (
        <div className="text-slate-600">Loading payment details...</div>
      )}
      {error && (
        <div className="text-red-500 mb-4">Error: {error}</div>
      )}

      {!loading && !error && paymentsData && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Invoice ID</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Patient Name & Id</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentsData.payments && paymentsData.payments.length > 0 ? (
                paymentsData.payments.map((payment, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-4 py-3 font-mono">{payment.InvoiceId}</td>
                    <td className="px-4 py-3">
                      {payment.date
                        ? new Date(payment.date).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">{payment.patientName}<span className="px-1"></span>({payment.patientId})</td>
                    <td className="px-4 py-3 text-right">₹{Number(payment.amount).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={
                          payment.status === "paid"
                            ? "text-green-600 font-semibold"
                            : payment.status === "pending"
                            ? "text-yellow-600 font-semibold"
                            : "text-slate-800"
                        }
                      >
                        {payment.status?.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                    No payment records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
