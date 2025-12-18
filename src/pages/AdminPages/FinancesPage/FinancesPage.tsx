import { motion } from "framer-motion";
import { FiDollarSign, FiArrowDownCircle, FiArrowUpCircle, FiDownload } from "react-icons/fi";

const transactions = [
  { id: 1, date: "2025-12-18", type: "Income", description: "Therapy Session - Artharv", amount: 700 },
  { id: 2, date: "2025-12-17", type: "Expense", description: "Therapist Payout", amount: -300 },
];

export default function FinancesPage() {
  const totalIncome = transactions.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
  const totalExpense = Math.abs(transactions.filter(t => t.amount < 0).reduce((a, b) => a + b.amount, 0));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-slate-50 p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Finances</h1>
        <button className="flex items-center gap-2 border px-4 py-2 rounded hover:bg-slate-100">
          <FiDownload /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Total Income</span>
            <FiArrowUpCircle className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">₹{totalIncome}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Total Expenses</span>
            <FiArrowDownCircle className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-500">₹{totalExpense}</p>
        </div>
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>Net Balance</span>
            <FiDollarSign className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-800">₹{totalIncome - totalExpense}</p>
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
            {transactions.map(t => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">{t.date}</td>
                <td className="px-4 py-3">{t.description}</td>
                <td className="px-4 py-3">{t.type}</td>
                <td className={`px-4 py-3 text-right ${t.amount > 0 ? "text-green-600" : "text-red-500"}`}>₹{Math.abs(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
