import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUserPlus,
  FiInfo,
  FiList,
  FiCheckCircle,
  FiPhone,
  FiMail,
  FiChevronDown,
  FiChevronUp,
  FiEdit2,
  FiTrash2,
  FiArrowRight,
} from "react-icons/fi";

export default function ConsultationsLeads() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  // Only keep pending and converted leads
  const leads = [
    {
      id: 1,
      parent: "Test parent lead",
      child: "ChildTest1",
      phone: "9910419135",
      email: "nupal.hdt@gmail.com",
      status: "converted",
      actions: ["view", "edit", "convert", "delete"],
    },
    {
      id: 2,
      parent: "Saurabh Mehta",
      child: "Diksha Mehta",
      phone: "9811122233",
      email: "saurabh.mehta@example.com",
      status: "pending",
      actions: ["view", "edit", "complete", "convert", "delete"],
    },
  ];

  // Sort leads: move all 'converted' status to the bottom
  const sortedLeads = [...leads].sort((a, b) => {
    if (a.status === "converted" && b.status !== "converted") return 1;
    if (a.status !== "converted" && b.status === "converted") return -1;
    return 0;
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
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
          Loading Consultations & Leads…
        </motion.div>
      </div>
    );
  }

  // Helper to show nice status
  function renderStatus(status: string) {
    switch (status) {
      case "converted":
        return (
          <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
            Converted
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700">
            Pending
          </span>
        );
      default:
        return (
          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {status}
          </span>
        );
    }
  }

  function renderActions(row: typeof leads[0]) {
    // Button styling helpers
    const actionButton =
      "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition";
    const iconProps = { size: 16, "aria-hidden": true };
    return (
      <div className="flex gap-2 justify-end">
        {/* View details */}
        {/* <button
          className={`${actionButton} text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100`}
          title="View"
        >
          <FiInfo {...iconProps} />
        </button> */}
        {/* Edit inquiry */}
        <button
          className={`${actionButton} text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100`}
          title="Edit"
        >
          <FiEdit2 {...iconProps} />
        </button>
        {/* Convert to Registration */}
        {row.status !== "converted" && (
          <button
            className={`${actionButton} text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100`}
            title="Convert to Registration"
          >
            <FiArrowRight {...iconProps} />
            <span className="hidden md:inline">Convert</span>
          </button>
        )}
        {/* Delete */}
        <button
          className={`${actionButton} text-red-600 bg-red-50 hover:bg-red-100 border border-red-100`}
          title="Delete"
        >
          <FiTrash2 {...iconProps} />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen bg-slate-50 p-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FiUserPlus /> Consultations & Leads
        </h1>
        <button className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
          New Inquiry
        </button>
      </div>

      {/* Guide (collapsible) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-0 mb-6 cursor-pointer select-none transition-[box-shadow]"
        onClick={() => setGuideOpen((open) => !open)}
        tabIndex={0}
        role="button"
        aria-expanded={guideOpen}
        style={{ WebkitTapHighlightColor: "transparent" }}
      >
        <div className="flex items-center justify-between p-6 pt-5 pb-5">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <FiInfo /> Managing Leads & Consultations
          </div>
          <div className="flex items-center ml-4">
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
              key="guide-content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent content click from re-toggling
            >
              <div className="px-6 pb-6">
                <p className="text-sm text-blue-700 mb-4">
                  Track prospective parents from initial inquiry to registration.
                </p>

                <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                  <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                    <FiList /> Steps to Follow
                  </div>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                    <li>Click "New Inquiry" to record a parent's interest.</li>
                    <li>Fill in the child's details and the parent's concern.</li>
                    <li>After consultation, mark it as "Completed".</li>
                    <li>If they join, click "Convert" to start registration.</li>
                  </ol>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                    <FiCheckCircle /> Pro Tips
                  </div>
                  <ul className="list-disc list-inside text-sm text-green-700 space-y-1">
                    <li>Always capture at least one phone number.</li>
                    <li>Use the concern field to prep the therapist.</li>
                  </ul>
                </div>

                {/* <button className="mt-4 inline-flex items-center gap-2 rounded-md border border-blue-300 px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 transition">
                  <FiInfo /> View Sample Data
                </button> */}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white border border-slate-200 rounded-lg overflow-hidden"
      >
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Parent</th>
              <th className="px-4 py-3 text-left font-medium">Child</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads.map((lead) => (
              <tr className="border-t" key={lead.id}>
                <td className="px-4 py-4 font-medium text-slate-800">{lead.parent}</td>
                <td className="px-4 py-4">{lead.child}</td>
                <td className="px-4 py-4 space-y-1 text-slate-600">
                  <div className="flex items-center gap-2">
                    <FiPhone /> {lead.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <FiMail /> {lead.email}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {renderStatus(lead.status)}
                </td>
                <td className="px-4 py-4 text-right">
                  {renderActions(lead)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
