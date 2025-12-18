import { motion } from "framer-motion";
import { FiUser, FiPhone, FiAlertCircle, FiEdit, FiCalendar } from "react-icons/fi";

const patients = [
  {
    id: 1,
    name: "Artharv Sharma",
    age: 6,
    concern: "Speech Delay",
    phone: "9910419135",
    pendingActions: ["Book Session"],
  },
  {
    id: 2,
    name: "Yuvi Patel",
    age: 5,
    concern: "Motor Skills",
    phone: "9898989898",
    pendingActions: ["Payment Due", "Schedule Follow-up"],
  },
];

export default function PatientsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Childrens</h1>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Children</th>
              <th className="px-4 py-3 text-left">Concern</th>
              <th className="px-4 py-3 text-left">Contact</th>
              <th className="px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {patients.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                      <FiUser className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-500">Age {p.age}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-slate-600">{p.concern}</td>
                <td className="px-4 py-4 text-slate-600 flex items-center gap-2">
                  <FiPhone /> {p.phone}
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-wrap gap-2">
                    {p.pendingActions.includes("Book Session") && (
                      <button className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
                        <FiCalendar /> Book Session
                      </button>
                    )}
                    {p.pendingActions.includes("Payment Due") && (
                      <button className="inline-flex items-center gap-1 rounded-md bg-orange-500 px-3 py-1.5 text-xs text-white hover:bg-orange-600">
                        <FiAlertCircle /> Collect Payment
                      </button>
                    )}
                    <button className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100">
                      <FiEdit /> Edit
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
