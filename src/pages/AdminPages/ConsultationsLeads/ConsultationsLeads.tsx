import { useEffect, useState, useRef } from "react";
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
  FiX,
  FiHash,
} from "react-icons/fi";

// Set API base URL from environment variable or blank as fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Example staff list for the dropdown (could fetch from API in future)
const staffMembers = [
  "Dr. Anjali Sharma",
  "Rahul Singh",
  "Priya Malhotra",
  "Vishal Gupta",
  "Other",
];

const appointmentTimes = [
  "09:00 AM",
  "09:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "01:00 PM",
  "01:30 PM",
  "02:00 PM",
  "02:30 PM",
  "03:00 PM",
  "03:30 PM",
  "04:00 PM",
  "04:30 PM",
  "05:00 PM",
];

type Lead = {
  id: string;
  parent: string;
  child: string;
  phone: string;
  email: string;
  status: string;
  actions: string[];
  // Extended properties for typed local use
  leadId?: string; // <-- add this
  callDate?: string;
  staff?: string;
  staffOther?: string;
  referralSource?: string;
  parentRelationship?: string;
  parentArea?: string;
  childDOB?: string;
  childGender?: string;
  therapistAlready?: string;
  diagnosis?: string;
  visitFinalized?: string;
  appointmentDate?: string;
  appointmentTime?: string;
  remarks?: string;
};

export default function ConsultationsLeads() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  // Leads
  const [leads, setLeads] = useState<Lead[] | null>(null);

  // For enquiry modal
  const [enqModalOpen, setEnqModalOpen] = useState(false);
  const [enqForm, setEnqForm] = useState({
    callDate: "",
    staff: "",
    staffOther: "",
    referralSource: "",
    parentName: "",
    parentRelationship: "",
    parentMobile: "",
    parentEmail: "",
    parentArea: "",
    childName: "",
    childDOB: "",
    childGender: "",
    therapistAlready: "",
    diagnosis: "",
    visitFinalized: "",
    appointmentDate: "",
    appointmentTime: "",
    remarks: "",
    status: "pending", // Default status set as pending for the edit API
    // Don't include leadId in enqForm; it's not editable
  });

  // Track which lead is being edited (for PUT)
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);

  // Focus on first field when modal opens
  const parentNameRef = useRef<HTMLInputElement | null>(null);

  // Fetch leads from backend
  useEffect(() => {
    let ignore = false;
    async function fetchLeads() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/leads`, {
          credentials: "same-origin",
        });
        const data = await res.json();
        if (!res.ok) throw new Error("Failed to fetch leads");

        // data is expected: { success: true, leads: [...] }
        if (Array.isArray(data.leads)) {
          const uiLeads: Lead[] = data.leads.map((lead: any) => ({
            id: lead._id,
            leadId: lead.leadId || "", // <-- get leadId from backend
            parent: lead.parentName,
            child: lead.childName,
            phone: lead.parentMobile,
            email: lead.parentEmail,
            status: lead.status,
            actions: [],
            callDate: lead.callDate ? new Date(lead.callDate).toISOString().slice(0, 16) : "",
            staff: lead.staff || "",
            staffOther: lead.staffOther || "",
            referralSource: lead.referralSource || "",
            parentRelationship: lead.parentRelationship || "",
            parentArea: lead.parentArea || "",
            childDOB: lead.childDOB ? new Date(lead.childDOB).toISOString().slice(0, 10) : "",
            childGender: lead.childGender || "",
            therapistAlready: lead.therapistAlready || "",
            diagnosis: lead.diagnosis || "",
            visitFinalized: lead.visitFinalized || "",
            appointmentDate: lead.appointmentDate ? new Date(lead.appointmentDate).toISOString().slice(0, 10) : "",
            appointmentTime: lead.appointmentTime || "",
            remarks: lead.remarks || "",
          }));
          if (!ignore) setLeads(uiLeads);
        } else {
          if (!ignore) setLeads([]);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to fetch leads", err);
        if (!ignore) setLeads([]);
      }
      setLoading(false);
    }
    fetchLeads();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (enqModalOpen && parentNameRef.current) {
      parentNameRef.current.focus();
    }
  }, [enqModalOpen]);

  // Set callDate automatically - on open of modal (only for 'add')
  useEffect(() => {
    if (enqModalOpen && !editingLeadId) {
      setEnqForm((prev) => ({
        ...prev,
        callDate: new Date().toISOString().slice(0, 16),
        status: "pending", // Ensure default status for new adds
      }));
    }
  }, [enqModalOpen, editingLeadId]);

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

  function renderActions(row: Lead) {
    const actionButton =
      "inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition";
    const iconProps = { size: 16, "aria-hidden": true };
    return (
      <div className="flex gap-2 justify-end">
        {/* Edit inquiry */}
        <button
          className={`${actionButton} text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100`}
          title="Edit"
          type="button"
          onClick={() => handleEditLead(row)}
        >
          <FiEdit2 {...iconProps} />
        </button>
        {/* Convert to Registration */}
        {row.status !== "converted" && (
          <button
            className={`${actionButton} text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100`}
            title="Convert to Registration"
            type="button"
            onClick={() => handleConvertLead(row)}
          >
            <FiArrowRight {...iconProps} />
            <span className="hidden md:inline">Convert</span>
          </button>
        )}
        {/* Delete */}
        <button
          className={`${actionButton} text-red-600 bg-red-50 hover:bg-red-100 border border-red-100`}
          title="Delete"
          type="button"
          onClick={() => handleDeleteLead(row)}
        >
          <FiTrash2 {...iconProps} />
        </button>
      </div>
    );
  }

  // Modal handlers
  function handleModalInput(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setEnqForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleModalClose() {
    setEnqModalOpen(false);
    setEnqForm({
      callDate: "",
      staff: "",
      staffOther: "",
      referralSource: "",
      parentName: "",
      parentRelationship: "",
      parentMobile: "",
      parentEmail: "",
      parentArea: "",
      childName: "",
      childDOB: "",
      childGender: "",
      therapistAlready: "",
      diagnosis: "",
      visitFinalized: "",
      appointmentDate: "",
      appointmentTime: "",
      remarks: "",
      status: "pending", // Reset as per default on close
      // not leadId
    });
    setEditingLeadId(null);
  }

  // Unified modal submit ADD/EDIT handler
  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...enqForm,
        staff:
          enqForm.staff === "Other" && enqForm.staffOther
            ? enqForm.staffOther
            : enqForm.staff,
        status: enqForm.status || "pending", // ensure status is always present for edit/add
        // leadId is NOT sent from UI; only for view, non-editable
      };

      let res;
      if (editingLeadId) {
        // EDIT mode, use PUT
        res = await fetch(
          `${API_BASE_URL}/api/admin/leads/${editingLeadId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw new Error("Failed to update lead");
        // The backend returns { success: true, message: ..., lead: {...fields...} }
        const result = await res.json();
        console.log(result);

        if (!result.success || !result.lead) {
          throw new Error(result.message || "No lead returned from server");
        }

        const updatedLeadData = result.lead;

        setLeads((prev) =>
          prev
            ? prev.map((l) =>
                l.id === editingLeadId
                  ? {
                      ...l,
                      id: updatedLeadData._id || updatedLeadData.id || editingLeadId,
                      leadId: updatedLeadData.leadId || "",
                      parent: updatedLeadData.parentName,
                      child: updatedLeadData.childName,
                      phone: updatedLeadData.parentMobile,
                      email: updatedLeadData.parentEmail,
                      status: updatedLeadData.status,
                      callDate: updatedLeadData.callDate
                        ? new Date(updatedLeadData.callDate).toISOString().slice(0, 16)
                        : "",
                      staff: updatedLeadData.staff || "",
                      staffOther: updatedLeadData.staffOther || "",
                      referralSource: updatedLeadData.referralSource || "",
                      parentRelationship: updatedLeadData.parentRelationship || "",
                      parentArea: updatedLeadData.parentArea || "",
                      childDOB: updatedLeadData.childDOB
                        ? new Date(updatedLeadData.childDOB).toISOString().slice(0, 10)
                        : "",
                      childGender: updatedLeadData.childGender || "",
                      therapistAlready: updatedLeadData.therapistAlready || "",
                      diagnosis: updatedLeadData.diagnosis || "",
                      visitFinalized: updatedLeadData.visitFinalized || "",
                      appointmentDate: updatedLeadData.appointmentDate
                        ? new Date(updatedLeadData.appointmentDate).toISOString().slice(0, 10)
                        : "",
                      appointmentTime: updatedLeadData.appointmentTime || "",
                      remarks: updatedLeadData.remarks || "",
                      actions: [],
                    }
                  : l
              )
            : null
        );
      } else {
        // ADD mode, use POST
        res = await fetch(`${API_BASE_URL}/api/admin/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to submit lead");
        const createdResult = await res.json();

        // The backend returns { success, message, lead }
        if (!createdResult.success || !createdResult.lead) {
          throw new Error(createdResult.message || "No lead returned from server");
        }

        const createdLeadData = createdResult.lead;

        // Map backend response to the Lead type (with extras for edit):
        const newLead: Lead = {
          id: createdLeadData._id || createdLeadData.id,
          leadId: createdLeadData.leadId || "",
          parent: createdLeadData.parentName,
          child: createdLeadData.childName,
          phone: createdLeadData.parentMobile,
          email: createdLeadData.parentEmail,
          status: createdLeadData.status,
          actions: [],
          callDate: createdLeadData.callDate ? new Date(createdLeadData.callDate).toISOString().slice(0, 16) : "",
          staff: createdLeadData.staff || "",
          staffOther: createdLeadData.staffOther || "",
          referralSource: createdLeadData.referralSource || "",
          parentRelationship: createdLeadData.parentRelationship || "",
          parentArea: createdLeadData.parentArea || "",
          childDOB: createdLeadData.childDOB ? new Date(createdLeadData.childDOB).toISOString().slice(0, 10) : "",
          childGender: createdLeadData.childGender || "",
          therapistAlready: createdLeadData.therapistAlready || "",
          diagnosis: createdLeadData.diagnosis || "",
          visitFinalized: createdLeadData.visitFinalized || "",
          appointmentDate: createdLeadData.appointmentDate ? new Date(createdLeadData.appointmentDate).toISOString().slice(0, 10) : "",
          appointmentTime: createdLeadData.appointmentTime || "",
          remarks: createdLeadData.remarks || "",
        };
        setLeads((prev) => prev ? [newLead, ...prev] : [newLead]);
      }
      handleModalClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(editingLeadId ? "Failed to update lead" : "Failed to create lead", error);
      alert(
        editingLeadId
          ? "Failed to update lead. Please try again."
          : "Failed to create lead. Please try again."
      );
    }
  }

  // Edit, delete, convert logic
  function handleEditLead(lead: Lead) {
    setEnqModalOpen(true);
    setEditingLeadId(lead.id);
    setEnqForm({
      callDate: lead.callDate || "",
      staff: staffMembers.includes(lead.staff ?? "") ? (lead.staff ?? "") : "Other",
      staffOther: staffMembers.includes(lead.staff ?? "") ? "" : (lead.staff ?? ""),
      referralSource: lead.referralSource || "",
      parentName: lead.parent,
      parentRelationship: lead.parentRelationship || "",
      parentMobile: lead.phone,
      parentEmail: lead.email,
      parentArea: lead.parentArea || "",
      childName: lead.child,
      childDOB: lead.childDOB || "",
      childGender: lead.childGender || "",
      therapistAlready: lead.therapistAlready || "",
      diagnosis: lead.diagnosis || "",
      visitFinalized: lead.visitFinalized || "",
      appointmentDate: lead.appointmentDate || "",
      appointmentTime: lead.appointmentTime || "",
      remarks: lead.remarks || "",
      status: lead.status || "pending", // Propagate current status into form for edit API
      // not leadId!
    });
  }

  async function handleDeleteLead(lead: Lead) {
    if (
      !window.confirm(
        `Delete lead for parent '${lead.parent}' and child '${lead.child}'?`,
      )
    )
      return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${lead.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      setLeads((prev) => (prev ? prev.filter((l) => l.id !== lead.id) : []));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Delete failed", error);
      alert("Failed to delete lead.");
    }
  }

  async function handleConvertLead(lead: Lead) {
    if (
      !window.confirm(
        `Convert lead for parent '${lead.parent}' and child '${lead.child}' to registration?`,
      )
    )
      return;
    try {
      // Use the same edit (PUT) API to set status to 'converted'
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${lead.id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...lead,
          status: "converted",
        }),
      });
      if (!res.ok) throw new Error("Failed to convert lead");
      setLeads((prev) =>
        prev
          ? prev.map((l) =>
              l.id === lead.id
                ? {
                    ...l,
                    status: "converted",
                  }
                : l,
            )
          : [],
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Convert failed", error);
      alert("Failed to convert lead.");
    }
  }

  // Move all 'converted' status to the bottom
  const sortedLeads =
    leads && leads.length
      ? [...leads].sort((a, b) => {
          if (a.status === "converted" && b.status !== "converted") return 1;
          if (a.status !== "converted" && b.status === "converted") return -1;
          return 0;
        })
      : [];

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen  p-8"
    >
      {/* Modal for New Enquiry or Edit Enquiry */}
      <AnimatePresence>
        {enqModalOpen && (
          <motion.div
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-0 overflow-hidden"
              onClick={e => e.stopPropagation()}
              role="dialog"
              aria-modal
              aria-label={editingLeadId ? "Edit enquiry" : "Add new enquiry"}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="flex items-center gap-2 text-lg font-semibold text-blue-800">
                  <FiUserPlus /> {editingLeadId ? "Edit Inquiry / Consultation" : "New Inquiry / Consultation"}
                </div>
                <button
                  className="text-slate-400 hover:text-red-500 transition"
                  onClick={handleModalClose}
                  aria-label="Close"
                  type="button"
                  tabIndex={0}
                >
                  <FiX size={22} />
                </button>
              </div>
              <form
                className="px-6 py-4 space-y-4"
                autoComplete="off"
                onSubmit={handleModalSubmit}
              >
                {/* Lead ID (readonly, non-editable, shows only on edit) */}
                {editingLeadId && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Lead ID
                    </label>
                    <input
                      type="text"
                      className="w-full border px-3 py-2 rounded bg-slate-100 text-slate-600"
                      name="leadId"
                      value={
                        (leads?.find((l) => l.id === editingLeadId)?.leadId &&
                          leads.find((l) => l.id === editingLeadId)?.leadId !== ""
                        )
                          ? leads?.find((l) => l.id === editingLeadId)?.leadId
                          : (leads?.find((l) => l.id === editingLeadId)?.id || editingLeadId)
                      }
                      readOnly
                      disabled
                    />
                  </div>
                )}

                {/* Date/Time of Call */}
                <div className="flex flex-col md:flex-row md:gap-4">
                  <div className="flex-1 mb-2 md:mb-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Date/Time of Call
                    </label>
                    <input
                      type="datetime-local"
                      className="w-full border px-3 py-2 rounded"
                      name="callDate"
                      value={enqForm.callDate}
                      readOnly
                      disabled
                    />
                  </div>
                  {/* Staff member */}
                  <div className="flex-1 mb-2 md:mb-0">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Staff Member Taking Call
                    </label>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      name="staff"
                      value={enqForm.staff}
                      onChange={handleModalInput}
                      required
                    >
                      <option value="">Select...</option>
                      {staffMembers.map((staff) => (
                        <option key={staff} value={staff}>
                          {staff}
                        </option>
                      ))}
                    </select>
                    {enqForm.staff === "Other" && (
                      <input
                        className="mt-2 w-full border px-3 py-2 rounded"
                        type="text"
                        name="staffOther"
                        value={enqForm.staffOther}
                        onChange={handleModalInput}
                        placeholder="Enter staff name"
                        required
                      />
                    )}
                  </div>
                </div>
                {/* Referral Source */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Where did you find us? (Referral source)
                  </label>
                  <input
                    className="w-full border px-3 py-2 rounded"
                    type="text"
                    name="referralSource"
                    value={enqForm.referralSource}
                    onChange={handleModalInput}
                    placeholder="e.g. Google, Doctor, Friend"
                  />
                </div>
                {/* Parent/Guardian Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Parent/Guardian Name
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="parentName"
                      ref={parentNameRef}
                      value={enqForm.parentName}
                      onChange={handleModalInput}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Relationship with Child
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="parentRelationship"
                      value={enqForm.parentRelationship}
                      onChange={handleModalInput}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Mobile Number
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="tel"
                      name="parentMobile"
                      value={enqForm.parentMobile}
                      onChange={handleModalInput}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Email Address
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="email"
                      name="parentEmail"
                      value={enqForm.parentEmail}
                      onChange={handleModalInput}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Area
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="parentArea"
                      value={enqForm.parentArea}
                      onChange={handleModalInput}
                    />
                  </div>
                </div>
                {/* Child Info */}
                <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Child’s Name
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="childName"
                      value={enqForm.childName}
                      onChange={handleModalInput}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Date of Birth
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="date"
                      name="childDOB"
                      value={enqForm.childDOB}
                      onChange={handleModalInput}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Boy/Girl
                    </label>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      name="childGender"
                      value={enqForm.childGender}
                      onChange={handleModalInput}
                    >
                      <option value="">Select...</option>
                      <option value="Boy">Boy</option>
                      <option value="Girl">Girl</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Seeing Therapist already?
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="therapistAlready"
                      value={enqForm.therapistAlready}
                      onChange={handleModalInput}
                      placeholder="e.g. Yes, speech therapy at XYZ"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Any known diagnosis?
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="diagnosis"
                      value={enqForm.diagnosis}
                      onChange={handleModalInput}
                      placeholder="e.g. Autism, Down's syndrome"
                    />
                  </div>
                </div>
                {/* Visit finalized */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Visit Finalized?
                    </label>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      name="visitFinalized"
                      value={enqForm.visitFinalized}
                      onChange={handleModalInput}
                    >
                      <option value="">Select...</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Appointment Date
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="date"
                      name="appointmentDate"
                      value={enqForm.appointmentDate}
                      onChange={handleModalInput}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Appointment Time
                    </label>
                    <select
                      className="w-full border px-3 py-2 rounded"
                      name="appointmentTime"
                      value={enqForm.appointmentTime}
                      onChange={handleModalInput}
                    >
                      <option value="">Select...</option>
                      {appointmentTimes.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Remarks
                  </label>
                  <textarea
                    className="w-full border px-3 py-2 rounded"
                    name="remarks"
                    value={enqForm.remarks}
                    onChange={handleModalInput}
                    placeholder="Additional notes, comments, next steps, etc."
                    rows={2}
                  />
                </div>
                {/* Status field: hidden input to propagate value to API (for edit) */}
                <input type="hidden" name="status" value={enqForm.status || "pending"} />
                <div className="flex gap-2 justify-end pt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
                    onClick={handleModalClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 font-medium transition"
                  >
                    {editingLeadId ? "Update" : "Submit"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <FiUserPlus /> Consultations & Leads
        </h1>
        <button
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          onClick={() => {
            setEnqModalOpen(true);
            setEditingLeadId(null);
            setEnqForm({
              callDate: new Date().toISOString().slice(0, 16),
              staff: "",
              staffOther: "",
              referralSource: "",
              parentName: "",
              parentRelationship: "",
              parentMobile: "",
              parentEmail: "",
              parentArea: "",
              childName: "",
              childDOB: "",
              childGender: "",
              therapistAlready: "",
              diagnosis: "",
              visitFinalized: "",
              appointmentDate: "",
              appointmentTime: "",
              remarks: "",
              status: "pending", // Default status set as pending for new inquiry
            });
          }}
        >
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
              onClick={(e) => e.stopPropagation()}
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
        className="bg-white border border-slate-200 rounded-lg overflow-y-auto"
      >
        <table className="w-full  text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Lead&nbsp;ID</th>
              <th className="px-4 py-3 text-left font-medium">Parent</th>
              <th className="px-4 py-3 text-left font-medium">Child</th>
              <th className="px-4 py-3 text-left font-medium">Contact</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Remarks</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedLeads?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                  No leads found.
                </td>
              </tr>
            )}
            {sortedLeads?.map((lead) => (
              <tr className="border-t" key={lead.id}>
                <td className="px-4 py-4 text-slate-600 font-mono flex items-center gap-2">
                  <FiHash className="text-blue-500" />
                  {/* show leadId if present, else fallback to display id */}
                  {lead.leadId && lead.leadId !== "" ? lead.leadId : lead.id}
                </td>
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
                <td className="px-4 py-4">
                  {lead.remarks && lead.remarks.trim() !== "" ? (
                    <span className="block text-slate-700 break-words whitespace-pre-line">{lead.remarks}</span>
                  ) : (
                    <span className="block text-slate-400 italic">—</span>
                  )}
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
