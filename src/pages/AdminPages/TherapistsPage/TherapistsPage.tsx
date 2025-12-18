import { motion } from "framer-motion";
import { FiUser, FiPhone, FiMail, FiCalendar } from "react-icons/fi";

const therapists = [
  {
    id: 1,
    name: "Dr. Ananya Verma",
    specialization: "Speech Therapy",
    phone: "9876543210",
    email: "ananya@clinic.com",
    sessionsToday: 3,
  },
  {
    id: 2,
    name: "Dr. Rahul Mehta",
    specialization: "Occupational Therapy",
    phone: "9123456780",
    email: "rahul@clinic.com",
    sessionsToday: 1,
  },
];

export default function TherapistsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Therapists</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {therapists.map((t) => (
          <motion.div
            key={t.id}
            whileHover={{ y: -4 }}
            className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <FiUser className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t.name}</p>
                <p className="text-sm text-slate-500">{t.specialization}</p>
              </div>
            </div>

            <div className="text-sm text-slate-600 space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <FiPhone /> {t.phone}
              </div>
              <div className="flex items-center gap-2">
                <FiMail /> {t.email}
              </div>
              <div className="flex items-center gap-2">
                <FiCalendar /> {t.sessionsToday} sessions today
              </div>
            </div>

            <button className="w-full rounded-md border border-blue-500 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition">
              View Schedule
            </button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
