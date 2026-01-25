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
  FiSearch,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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
  leadId?: string;
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

type LeadsApiResponse = {
  success: boolean;
  leads: any[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const statusOptions = [
  { value: "", label: "All" },
  { value: "converted", label: "Converted" },
  { value: "pending", label: "Pending" },
];

function FilterSearchBar({
  search,
  setSearch,
  filters,
  setFilters,
}: {
  search: string;
  setSearch: (search: string) => void;
  filters: { status: string };
  setFilters: (filters: { status: string }) => void;
}) {
  const [localSearchInput, setLocalSearchInput] = useState(search ?? "");

  useEffect(() => {
    setLocalSearchInput(search ?? "");
  }, [search]);

  return (
    <div className="flex flex-wrap gap-2 items-end mb-3">
      <div className="w-full sm:w-auto flex-1">
        <form
          onSubmit={e => {
            e.preventDefault();
            setSearch(localSearchInput);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <FiSearch className="absolute left-2 top-2 text-slate-400" />
            <input
              className="pl-8 pr-2 py-2 border rounded w-full text-sm"
              type="search"
              placeholder="Search parent, child, mobile or email…"
              value={localSearchInput}
              onChange={e => setLocalSearchInput(e.target.value)}
              aria-label="Search leads"
            />
          </div>
          <button
            type="submit"
            className="text-slate-700 border border-slate-200 px-3 py-2 rounded hover:bg-slate-100"
            tabIndex={-1}
            style={{ display: 'none' }}
          >Search</button>
        </form>
      </div>
    
      {filters.status && (
        <button
          className="text-xs px-2 py-1 bg-blue-50 border-blue-200 border rounded ml-2"
          type="button"
          onClick={() => setFilters({ ...filters, status: "" })}
          title="Clear status filter"
        >
          {statusOptions.find(o => o.value === filters.status)?.label || filters.status}
          <FiX className="inline ml-1" />
        </button>
      )}
        <div className="flex items-center gap-2 ml-1 mt-2">
          <label className="text-xs font-semibold">Status:</label>
          <select
            className="text-sm border px-2 py-1 rounded"
            value={filters.status}
            onChange={e => {
              setFilters({ ...filters, status: e.target.value });
            }}
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
    </div>
  );
}

// --- Pagination implementation and table ---
function LeadsTableSection({
  search,
  filters,
  fetchKey,
  tableLoading,
  setTableLoading,
  parentRefreshFlag,
  setParentRefreshFlag,
  openEditModal,
}: {
  search: string;
  filters: { status: string };
  fetchKey: string;
  tableLoading: boolean;
  setTableLoading: (b: boolean) => void;
  parentRefreshFlag: boolean;
  setParentRefreshFlag: (b: boolean) => void;
  openEditModal: (lead: Lead) => void;
}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  const [localRefreshFlag, setLocalRefreshFlag] = useState(false);

  // ------------- PAGINATION/LEAD FETCH LOGIC -------------
  // Implements: GET leads with ?page, ?pageSize, search, and filters (pagination logic)

  useEffect(() => {
    let ignore = false;
    async function fetchLeads() {
      setTableLoading(true);
      // Compose URL: supports page, pageSize, search, status
      let url = `${API_BASE_URL}/api/admin/leads?page=${page}&pageSize=${pageSize}`;
      if (search && search.trim() !== "") url += `&search=${encodeURIComponent(search.trim())}`;
      if (filters.status) url += `&status=${encodeURIComponent(filters.status)}`;
      try {
        const res = await fetch(url, { credentials: "same-origin" });
        const data: LeadsApiResponse = await res.json();
        if (!res.ok) throw new Error("Failed to fetch leads");
        // Map API -> UI fields
        if (ignore) return;
        const uiLeads: Lead[] = Array.isArray(data.leads)
          ? data.leads.map((lead: any) => ({
            id: lead._id,
            leadId: lead.leadId || "",
            parent: lead.parentName,
            child: lead.childName,
            phone: lead.parentMobile,
            email: lead.parentEmail,
            status: lead.status,
            actions: [],
            callDate: lead.callDate
              ? new Date(lead.callDate).toISOString().slice(0, 16)
              : "",
            staff: lead.staff || "",
            staffOther: lead.staffOther || "",
            referralSource: lead.referralSource || "",
            parentRelationship: lead.parentRelationship || "",
            parentArea: lead.parentArea || "",
            childDOB: lead.childDOB
              ? new Date(lead.childDOB).toISOString().slice(0, 10)
              : "",
            childGender: lead.childGender || "",
            therapistAlready: lead.therapistAlready || "",
            diagnosis: lead.diagnosis || "",
            visitFinalized: lead.visitFinalized || "",
            appointmentDate: lead.appointmentDate
              ? new Date(lead.appointmentDate).toISOString().slice(0, 10)
              : "",
            appointmentTime: lead.appointmentTime || "",
            remarks: lead.remarks || "",
          }))
          : [];
        setLeads(uiLeads);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setPageSize(data.pageSize || 15);
        setTotalPages(data.totalPages || 1);
      } catch (err) {
        setLeads([]);
        setTotal(0);
        setPage(1);
        setTotalPages(1);
      }
      setTableLoading(false);
    }
    fetchLeads();
    return () => {
      ignore = true;
    };
    // Note: dependencies cover all variables that reset or affect pagination, filtering, refresh
  }, [page, pageSize, search, filters.status, localRefreshFlag, parentRefreshFlag, fetchKey]);

  // When search or filters change, reset to page 1
  useEffect(() => {
    setPage(1);
  }, [search, filters.status]);

  // Table row actions (delete, convert)
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);
  const triggerRefresh = () => setLocalRefreshFlag(f => !f);

  async function handleDeleteLead(lead: Lead) {
    if (
      !window.confirm(
        `Delete lead for parent '${lead.parent}' and child '${lead.child}'?`,
      )
    )
      return;
    try {
      setActionInProgressId(lead.id);
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${lead.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Failed to delete lead");
      // If only one lead left on a page, move back a page
      if (leads.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        triggerRefresh();
        setParentRefreshFlag(!parentRefreshFlag);
      }
    } catch (error) {
      alert("Failed to delete lead.");
    } finally {
      setActionInProgressId(null);
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
      setActionInProgressId(lead.id);
      const res = await fetch(`${API_BASE_URL}/api/admin/leads/${lead.id}`, {
        method: "PUT",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...lead,
          status: "converted",
        }),
      });
      if (!res.ok) throw new Error("Failed to convert lead");
      triggerRefresh();
      setParentRefreshFlag(!parentRefreshFlag);
    } catch (error) {
      alert("Failed to convert lead.");
    } finally {
      setActionInProgressId(null);
    }
  }

  function Pagination() {
    if (totalPages <= 1) return null;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, page + 2);
    if (endPage - startPage < 4 && totalPages > 4) {
      if (startPage === 1) endPage = Math.min(5, totalPages);
      if (endPage === totalPages) startPage = Math.max(1, totalPages - 4);
    }
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-4">
        <div className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold">
            {total === 0
              ? 0
              : (page - 1) * pageSize + 1}
          </span>
          {"–"}
          <span className="font-semibold">
            {Math.min(page * pageSize, total)}
          </span>
          {" of "}
          <span className="font-semibold">{total}</span> leads
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="p-2 rounded disabled:opacity-30"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            aria-label="Previous page"
            type="button"
          >
            <FiChevronLeft />
          </button>
          {pageNumbers[0] > 1 && (
            <button
              className="px-2 text-xs rounded hover:bg-slate-100"
              onClick={() => setPage(1)}
              type="button"
            >
              1
            </button>
          )}
          {pageNumbers[0] > 2 && <span className="px-1 text-xs">…</span>}
          {pageNumbers.map((pg) => (
            <button
              key={pg}
              className={`px-3 py-1 text-xs rounded font-semibold ${
                pg === page
                  ? "bg-blue-600 text-white"
                  : "hover:bg-slate-100"
              }`}
              onClick={() => setPage(pg)}
              disabled={pg === page}
              type="button"
            >
              {pg}
            </button>
          ))}
          {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
            <span className="px-1 text-xs">…</span>
          )}
          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <button
              className="px-2 text-xs rounded hover:bg-slate-100"
              onClick={() => setPage(totalPages)}
              type="button"
            >
              {totalPages}
            </button>
          )}
          <button
            className="p-2 rounded disabled:opacity-30"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            aria-label="Next page"
            type="button"
          >
            <FiChevronRight />
          </button>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>Rows per page:</span>
          <select
            className="border rounded px-1 py-0.5"
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 15, 25, 50, 100].map(sz => (
              <option key={sz} value={sz}>{sz}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

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
          onClick={() => openEditModal(row)}
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
            disabled={actionInProgressId === row.id}
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
          disabled={actionInProgressId === row.id}
        >
          <FiTrash2 {...iconProps} />
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-slate-200 rounded-lg overflow-y-auto mb-2"
    >
      {tableLoading ? (
        <div className="flex items-center justify-center py-12 text-slate-600">
          Loading...
        </div>
      ) : (
        <>
          <table className="w-full text-sm">
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
              {leads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    No leads found.
                  </td>
                </tr>
              )}
              {leads.map((lead) => (
                <tr className="border-t" key={lead.id}>
                  <td className="px-4 py-4 text-slate-600 font-mono flex items-center gap-2">
                    <FiHash className="text-blue-500" />
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
                  <td className="px-4 py-4">{renderStatus(lead.status)}</td>
                  <td className="px-4 py-4">
                    {lead.remarks && lead.remarks.trim() !== "" ? (
                      <span className="block text-slate-700 break-words whitespace-pre-line">
                        {lead.remarks}
                      </span>
                    ) : (
                      <span className="block text-slate-400 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">{renderActions(lead)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination />
        </>
      )}
    </motion.div>
  );
}

export default function ConsultationsLeads() {
  // const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const [tableLoading, setTableLoading] = useState(false);
  const [parentRefreshFlag, setParentRefreshFlag] = useState(false);
  const [tableKey, setTableKey] = useState(() => Math.random().toString(36));

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ status: "" });

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
    status: "pending",
  });

  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  // const [currentLeads, setCurrentLeads] = useState<Lead[]>([]);

  const parentNameRef = useRef<HTMLInputElement | null>(null);
  const [showCallDateCalendar, setShowCallDateCalendar] = useState(false);
  const [showChildDOBCalendar, setShowChildDOBCalendar] = useState(false);
  const [showAppointmentDateCalendar, setShowAppointmentDateCalendar] = useState(false);

  useEffect(() => {
    if (enqModalOpen && !editingLeadId) {
      setEnqForm((prev) => ({
        ...prev,
        callDate: new Date().toISOString().slice(0, 16),
        status: "pending",
      }));
    }
  }, [enqModalOpen, editingLeadId]);

  useEffect(() => {
    if (enqModalOpen && parentNameRef.current) {
      parentNameRef.current.focus();
    }
  }, [enqModalOpen]);

  async function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const payload = {
        ...enqForm,
        staff: enqForm.staff === "Other" && enqForm.staffOther
          ? enqForm.staffOther
          : enqForm.staff,
        status: enqForm.status || "pending",
      };

      let res;
      if (editingLeadId) {
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
      } else {
        res = await fetch(`${API_BASE_URL}/api/admin/leads`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to submit lead");
      }
      setParentRefreshFlag((f) => !f);
      setTableKey(Math.random().toString(36));
      handleModalClose();
    } catch (error) {
      alert(
        editingLeadId
          ? "Failed to update lead. Please try again."
          : "Failed to create lead. Please try again."
      );
    }
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
      status: "pending",
    });
    setEditingLeadId(null);
    setShowCallDateCalendar(false);
    setShowChildDOBCalendar(false);
    setShowAppointmentDateCalendar(false);
  }

  function handleEditModalOpen(lead: Lead) {
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
      status: lead.status || "pending",
    });
  }

  function DateInputWithCalendar({
    label,
    name,
    value,
    onChange,
    placeholder,
    required,
    disabled,
    readOnly,
    showCalendar,
    setShowCalendar,
    min,
    max,
  }: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    showCalendar: boolean;
    setShowCalendar: (b: boolean) => void;
    min?: string;
    max?: string;
  }) {
    const inputRef = useRef<HTMLInputElement>(null);
    return (
      <div style={{ position: "relative" }}>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          {label}
        </label>
        {!showCalendar ? (
          <input
            type="text"
            className="w-full border px-3 py-2 rounded cursor-pointer bg-white"
            name={name}
            value={value}
            onFocus={() => setShowCalendar(true)}
            onClick={() => setShowCalendar(true)}
            onChange={() => {}}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            autoComplete="off"
          />
        ) : (
          <input
            ref={inputRef}
            type="date"
            className="w-full border px-3 py-2 rounded bg-white"
            name={name}
            value={value}
            autoFocus
            onChange={(e) => {
              onChange(e);
              setShowCalendar(false);
            }}
            onBlur={() => setTimeout(() => setShowCalendar(false), 150)}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
          />
        )}
      </div>
    );
  }

  function DateTimeInputWithCalendar({
    label,
    name,
    value,
    onChange,
    required,
    disabled,
    readOnly,
    showCalendar,
    setShowCalendar,
    min,
    max
  }: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
    showCalendar: boolean;
    setShowCalendar: (b: boolean) => void;
    min?: string;
    max?: string;
  }) {
    const inputRef = useRef<HTMLInputElement>(null);
    function formatToReadableDateTime(val: string) {
      if (!val) return "";
      const d = new Date(val);
      if (isNaN(d.getTime())) return val;
      const opts: Intl.DateTimeFormatOptions = {
        year: "numeric", month: "short", day: "2-digit",
        hour: "2-digit", minute: "2-digit"
      };
      return d.toLocaleString(undefined, opts);
    }
    return (
      <div style={{ position: "relative" }}>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          {label}
        </label>
        {!showCalendar ? (
          <input
            type="text"
            className="w-full border px-3 py-2 rounded cursor-pointer bg-white"
            name={name}
            value={formatToReadableDateTime(value)}
            onFocus={() => setShowCalendar(true)}
            onClick={() => setShowCalendar(true)}
            onChange={() => {}}
            placeholder="Select date & time"
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            autoComplete="off"
          />
        ) : (
          <input
            ref={inputRef}
            type="datetime-local"
            className="w-full border px-3 py-2 rounded bg-white"
            name={name}
            value={value}
            autoFocus
            onChange={(e) => {
              onChange(e);
              setShowCalendar(false);
            }}
            onBlur={() => setTimeout(() => setShowCalendar(false), 150)}
            min={min}
            max={max}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
          />
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="min-h-screen h-screen overflow-y-auto  p-8"
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
            <div
              className="flex items-center justify-center w-full h-full"
              style={{
                minHeight: 0,
                minWidth: 0,
              }}
            >
              <motion.div
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.97, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-0 overflow-y-auto max-h-[98vh] sm:max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
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
                  {editingLeadId && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Lead ID
                      </label>
                      <input
                        type="text"
                        className="w-full border px-3 py-2 rounded bg-slate-100 text-slate-600"
                        name="leadId"
                        value={editingLeadId}
                        readOnly
                        disabled
                      />
                    </div>
                  )}
                  <div className="flex flex-col md:flex-row md:gap-4">
                    <div className="flex-1 mb-2 md:mb-0">
                      <DateTimeInputWithCalendar
                        label="Date/Time of Call"
                        name="callDate"
                        value={enqForm.callDate}
                        onChange={e => setEnqForm(f => ({ ...f, [e.target.name]: e.target.value }))}
                        readOnly={!!editingLeadId}
                        disabled={!!editingLeadId}
                        showCalendar={showCallDateCalendar}
                        setShowCalendar={setShowCallDateCalendar}
                      />
                    </div>
                    <div className="flex-1 mb-2 md:mb-0">
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Staff Member Taking Call
                      </label>
                      <select
                        className="w-full border px-3 py-2 rounded"
                        name="staff"
                        value={enqForm.staff}
                        onChange={e => setEnqForm(f => ({ ...f, staff: e.target.value }))}
                        required
                      >
                        <option value="">Select...</option>
                        {staffMembers.map(staff => (
                          <option key={staff} value={staff}>{staff}</option>
                        ))}
                      </select>
                      {enqForm.staff === "Other" && (
                        <input
                          className="mt-2 w-full border px-3 py-2 rounded"
                          type="text"
                          name="staffOther"
                          value={enqForm.staffOther}
                          onChange={e => setEnqForm(f => ({ ...f, staffOther: e.target.value }))}
                          placeholder="Enter staff name"
                          required
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Where did you find us? (Referral source)
                    </label>
                    <input
                      className="w-full border px-3 py-2 rounded"
                      type="text"
                      name="referralSource"
                      value={enqForm.referralSource}
                      onChange={e => setEnqForm(f => ({ ...f, referralSource: e.target.value }))}
                      placeholder="e.g. Google, Doctor, Friend"
                    />
                  </div>
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
                        onChange={e => setEnqForm(f => ({ ...f, parentName: e.target.value }))}
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
                        onChange={e => setEnqForm(f => ({ ...f, parentRelationship: e.target.value }))}
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
                        onChange={e => setEnqForm(f => ({ ...f, parentMobile: e.target.value }))}
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
                        onChange={e => setEnqForm(f => ({ ...f, parentEmail: e.target.value }))}
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
                        onChange={e => setEnqForm(f => ({ ...f, parentArea: e.target.value }))}
                      />
                    </div>
                  </div>
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
                        onChange={e => setEnqForm(f => ({ ...f, childName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <DateInputWithCalendar
                        label="Date of Birth"
                        name="childDOB"
                        value={enqForm.childDOB}
                        onChange={e => setEnqForm(f => ({ ...f, childDOB: e.target.value }))}
                        showCalendar={showChildDOBCalendar}
                        setShowCalendar={setShowChildDOBCalendar}
                        placeholder="Select date"
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
                        onChange={e => setEnqForm(f => ({ ...f, childGender: e.target.value }))}
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
                        onChange={e => setEnqForm(f => ({ ...f, therapistAlready: e.target.value }))}
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
                        onChange={e => setEnqForm(f => ({ ...f, diagnosis: e.target.value }))}
                        placeholder="e.g. Autism, Down's syndrome"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">
                        Visit Finalized?
                      </label>
                      <select
                        className="w-full border px-3 py-2 rounded"
                        name="visitFinalized"
                        value={enqForm.visitFinalized}
                        onChange={e => setEnqForm(f => ({ ...f, visitFinalized: e.target.value }))}
                      >
                        <option value="">Select...</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>
                    <div>
                      <DateInputWithCalendar
                        label="Appointment Date"
                        name="appointmentDate"
                        value={enqForm.appointmentDate}
                        onChange={e => setEnqForm(f => ({ ...f, appointmentDate: e.target.value }))}
                        showCalendar={showAppointmentDateCalendar}
                        setShowCalendar={setShowAppointmentDateCalendar}
                        placeholder="Select date"
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
                        onChange={e => setEnqForm(f => ({ ...f, appointmentTime: e.target.value }))}
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
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Remarks
                    </label>
                    <textarea
                      className="w-full border px-3 py-2 rounded"
                      name="remarks"
                      value={enqForm.remarks}
                      onChange={e => setEnqForm(f => ({ ...f, remarks: e.target.value }))}
                      placeholder="Additional notes, comments, next steps, etc."
                      rows={2}
                    />
                  </div>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FiUserPlus /> Consultations & Leads
          </h1>
        </div>
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
              status: "pending",
            });
            setShowCallDateCalendar(false);
            setShowChildDOBCalendar(false);
            setShowAppointmentDateCalendar(false);
          }}
        >
          New Inquiry
        </button>
      </div>

      <FilterSearchBar
        search={search}
        setSearch={setSearch}
        filters={filters}
        setFilters={setFilters}
      />

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

      {/* Leads table with implemented pagination */}
      <LeadsTableSection
        search={search}
        filters={filters}
        fetchKey={tableKey}
        tableLoading={tableLoading}
        setTableLoading={setTableLoading}
        parentRefreshFlag={parentRefreshFlag}
        setParentRefreshFlag={setParentRefreshFlag}
        openEditModal={handleEditModalOpen}
      />
    </motion.div>
  );
}