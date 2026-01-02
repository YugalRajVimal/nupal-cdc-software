import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiInfo,
  FiList,
  FiDownload,
  FiDollarSign,
  FiActivity,
  FiUsers,
  FiAlertCircle,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

export default function AnalyticsReports() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold"
        >
          Loading Analytics & Reports…
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics & Reports</h1>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
            <FiDownload /> Revenue
          </button>
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition">
            <FiDownload /> Operations
          </button>
        </div>
      </div>

      {/* Guide (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-blue-50 border border-blue-200 rounded-lg p-0 mb-8 overflow-hidden cursor-pointer`}
        onClick={() => setGuideOpen((v) => !v)}
        tabIndex={0}
        role="button"
        aria-expanded={guideOpen}
        style={{ outline: "none" }}
      >
        <div className="px-6 py-6">
          <div className="flex items-center justify-between select-none">
            <div className="flex items-center gap-2 text-blue-700 font-semibold">
              <FiInfo /> Understanding Reports
            </div>
            {guideOpen ? (
              <FiChevronUp className="text-blue-600" />
            ) : (
              <FiChevronDown className="text-blue-600" />
            )}
          </div>
        </div>
        <AnimatePresence initial={false}>
          {guideOpen && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden px-6 pb-6 pt-0"
              onClick={e => e.stopPropagation()} // So inner elements don't re-trigger collapse
            >
              <p className="text-sm text-blue-700 mb-4">
                Key performance indicators for your clinic.
              </p>

              <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                  <FiList /> Steps to Follow
                </div>
                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                  <li>Use the Revenue card to track collected vs pending payments.</li>
                  <li>Track Lead Conversion to evaluate consultation effectiveness.</li>
                  <li>Use Download buttons to export CSV files.</li>
                </ol>
              </div>

              {/* <button
                className="inline-flex items-center gap-2 rounded-md border border-blue-300 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition"
                tabIndex={0}
                onClick={e => {e.stopPropagation();}}
              >
                <FiInfo /> View Sample Data
              </button> */}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Total Revenue</span>
            <FiDollarSign className="text-green-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">₹700</div>
          <p className="text-sm text-slate-500">₹0 collected</p>
        </motion.div>

        {/* Sessions */}
        <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Sessions Delivered</span>
            <FiActivity className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">0</div>
          <p className="text-sm text-slate-500">Across all therapists</p>
        </motion.div>

        {/* Conversion */}
        <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Lead Conversion</span>
            <FiUsers className="text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800">100%</div>
          <p className="text-sm text-slate-500">1 converted lead</p>
        </motion.div>

        {/* Pending */}
        <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
            <span>Pending Tasks</span>
            <FiAlertCircle className="text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-slate-800">0</div>
          <p className="text-sm text-slate-500">Inquiries awaiting action</p>
        </motion.div>
      </div>
    </motion.div>
  );
}
