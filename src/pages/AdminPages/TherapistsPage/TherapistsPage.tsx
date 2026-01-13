import { useEffect, useState, useCallback } from "react";
import {
  FiUser,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import { motion } from "framer-motion";
import axios from "axios";

// The schema fields from @user.schema.js, expanded exhaustively as per fields in the original file.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Full data shape reflecting @user.schema.js (1-134) as inferred from given context and typical sources.
type TherapistProfile = {
  _id: string;
  userId?: {
    _id: string;
    name?: string;
    email?: string;
    phoneVerified?: boolean;
    emailVerified?: boolean;
    status?: string;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
    // panelAccess and isDisabled can be in userId/user schema
    isDisabled?: boolean;
  };
  isPanelAccessible?: boolean;
  therapistId?: string;
  name?: string;
  email?: string;
  role?: string;
  fathersName?: string;
  mobile1?: string;
  mobile2?: string;
  address?: string;
  reference?: string;
  specializations?: string;
  experienceYears?: number;
  aadhaarFront?: any;
  aadhaarBack?: any;
  photo?: any;
  resume?: any;
  certificate?: any;
  accountHolder?: string;
  bankName?: string;
  ifsc?: string;
  accountNumber?: string;
  upi?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  instagram?: string;
  youtube?: string;
  website?: string;
  portfolio?: string;
  blog?: string;
  remarks?: string;
  // Optionally, surface these props top level for easy access
  isDisabled?: boolean;
  panelAccess?: boolean;
};

// All editable and display fields (schema keys)
const FIELD_LIST: {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "file";
  readOnly?: boolean;
  render?: (value: any, row?: TherapistProfile) => React.ReactNode;
}[] = [
  { key: "therapistId", label: "Therapist ID", render: (_, row) => row?.therapistId || "-" },
  { key: "name", label: "Name", render: (_, row) => row?.userId?.name || row?.name || "-" },
  { key: "email", label: "Email", type: "email", render: (_, row) => row?.userId?.email || row?.email || "-" },
  { key: "role", label: "Role", render: (_, row) => row?.userId?.role || row?.role || "-" },
  { key: "fathersName", label: "Father's Name" },
  { key: "mobile1", label: "Mobile 1" },
  { key: "mobile2", label: "Mobile 2" },
  { key: "address", label: "Address" },
  { key: "reference", label: "Reference" },
  { key: "specializations", label: "Specializations" },
  { key: "experienceYears", label: "Experience (years)", type: "number" },
  { key: "aadhaarFront", label: "Aadhaar Front", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "aadhaarBack", label: "Aadhaar Back", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "photo", label: "Photo", type: "file", render: v => v && typeof v === "string" ? <img src={v} alt="Photo" className="h-8 w-8 object-cover rounded" /> : "-" },
  { key: "resume", label: "Resume", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "certificate", label: "Certificate", type: "file", render: v => v && typeof v === "string" ? <a href={v} target="_blank" rel="noopener noreferrer">View</a> : "-" },
  { key: "accountHolder", label: "Bank Account Holder Name" },
  { key: "bankName", label: "Bank Name" },
  { key: "ifsc", label: "Bank IFSC" },
  { key: "accountNumber", label: "Bank Account Number" },
  { key: "upi", label: "UPI" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "twitter", label: "Twitter" },
  { key: "facebook", label: "Facebook" },
  { key: "instagram", label: "Instagram" },
  { key: "youtube", label: "YouTube" },
  { key: "website", label: "Website" },
  { key: "portfolio", label: "Portfolio" },
  { key: "blog", label: "Blog" },
  { key: "remarks", label: "Remarks" },
];

export default function TherapistsPage() {
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(false);
  // const [selected, setSelected] = useState<TherapistProfile | null>(null);
  const [editTherapist, setEditTherapist] = useState<TherapistProfile | null>(null);
  const [editField, setEditField] = useState<{ [k: string]: any }>({});
  const [error, setError] = useState<string | null>(null);

  // Keep the selected ID and data in sync when mutating
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TherapistProfile | null>(null);

  // On selecting, fetch full profile each time to have latest
  const fetchTherapistById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSelectedId(id); // so we know which modal is open, even if data is yet to load/freshly loading
    setSelectedProfile(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}`
      );
      setSelectedProfile(res.data.therapist ?? null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Keeps the below function signature unchanged for the main table "View Details" button
  const onTableViewClick = (id: string) => {
    fetchTherapistById(id);
  };

  // This is now unused in rendering, but will keep for external usage
  async function fetchTherapists() {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist`
      );
      let therapistsArr: TherapistProfile[] = [];
      if (
        res &&
        res.data &&
        (Array.isArray(res.data) || Array.isArray(res.data.therapists))
      ) {
        therapistsArr = Array.isArray(res.data) ? res.data : res.data.therapists;
        // console.log(therapistsArr);
      } else if (res && res.data && res.data.therapists && typeof res.data.therapists === "object") {
        therapistsArr = Object.values(res.data.therapists).filter(
          v => typeof v === "object" && v !== null && "_id" in v
        ) as TherapistProfile[];
      }
      setTherapists(therapistsArr);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Error loading therapists."
      );
    } finally {
      setLoading(false);
    }
  }

  // Toggle disable/enable endpoint based on shouldDisable
  // After API, fetch the latest data for the modal too
  async function handleToggleDisable(id: string, shouldDisable: boolean) {
    // console.log('[handleToggleDisable] Called with:', { id, shouldDisable });
    setLoading(true);
    setError(null);
    try {
      const endpoint = shouldDisable
        ? `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/disable`
        : `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/enable`;
      await axios.patch(endpoint);
      await fetchTherapists();
      // Also fetch updated therapist for modal view if it's open for this id
      if (selectedId === id) {
        await fetchTherapistById(id);
      }
    } catch (err: any) {
      // console.log('[handleToggleDisable] ERROR:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change disable status."
      );
    } finally {
      setLoading(false);
    }
  }

  // Toggle panelAccess, also refresh modal data for current id if needed
  async function handleTogglePanelAccess(id: string, enable: boolean) {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/panel-access`,
        { isPanelAccessible: enable }
      );
      await fetchTherapists();
      if (selectedId === id) {
        await fetchTherapistById(id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to change panel access."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSubmit() {
    if (!editTherapist) return;
    setLoading(true);
    setError(null);
    try {
      let payload: any = {
        ...editTherapist,
        ...editField,
      };
      delete payload._id;
      delete payload.userId;

      for (const field of FIELD_LIST) {
        if (payload[field.key] === undefined || payload[field.key] === null) {
          payload[field.key] = "";
        }
        if (field.key === "experienceYears" && payload.experienceYears !== "") {
          payload.experienceYears = Number(payload.experienceYears) || 0;
        }
        if (field.key === "specializations" && Array.isArray(payload.specializations)) {
          payload.specializations = payload.specializations.join(", ");
        }
        if (field.key === "specializations" && typeof payload.specializations !== "string") {
          payload.specializations = "";
        }
      }

      await axios.put(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${editTherapist._id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      await fetchTherapists();
      setEditTherapist(null);
      setEditField({});
    } catch (err: any) {
      let msg = "Error";
      if (err?.response?.data?.error) {
        msg = err.response.data.error;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTherapist(id: string) {
    if (!window.confirm("Are you sure you want to delete this therapist?")) return;
    setLoading(true);
    setError(null);
    try {
      await axios.delete(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}`
      );
      await fetchTherapists();
      // If deleting the selected therapist in modal, close modal
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedProfile(null);
      }
    } catch (err: any) {
      let msg = "Error removing therapist.";
      if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTherapists();
    // eslint-disable-next-line
  }, []);

  // --- renderTherapistModal: Always uses fully fetched modal data ---
  function renderTherapistModal() {
    if (!selectedId || !selectedProfile) return null;
    const selected = selectedProfile;
    return (
      <div className="fixed inset-0 z-30 bg-white/70 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
          <button
            className="absolute right-4 top-3 text-xl"
            onClick={() => {
              setSelectedId(null);
              setSelectedProfile(null);
            }}
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-2">Therapist Details</h2>
          <div className="overflow-y-auto max-h-[70vh]">
            {/* Show therapistId at the top */}
            <div className="mb-2">
              <span className="text-xs text-slate-500 font-semibold">Therapist ID: </span>
              <span className="text-sm text-slate-700">{selected.therapistId}</span>
            </div>
            {selected.userId && (
              <div className="mb-4 border-b pb-2 text-md">
                <div className="font-semibold mb-1 text-slate-800">User Account</div>
                {Object.entries(selected.userId)
                  .filter(([key]) =>
                    !["_id", "authProvider", "otpAttempts", "__v"].includes(key)
                  )
                  .map(([key, val]) => (
                    <div key={key} className="flex gap-2 text-sm text-slate-600 py-0.5">
                      <span className="font-medium">{key}:</span>
                      <span>
                        {typeof val === "boolean" ? (val ? "Yes" : "No") : (val ?? "-")}
                      </span>
                    </div>
                  ))}
                {/* New: Display isDisabled and panelAccess states, with toggle buttons */}
                <div className="flex gap-4 mt-3">
                  <div>
                    <span className="font-medium text-xs text-slate-500">Status: </span>
                    <span className="px-2 py-0.5 inline-block rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: selected.userId.isDisabled ? "#fecaca" : "#bbf7d0",
                        color: selected.userId.isDisabled ? "#b91c1c" : "#15803d"
                      }}>
                      {selected.userId.isDisabled ? "Disabled" : "Enabled"}
                    </span>
                    <button
                      className={`ml-2 text-xs rounded px-2 py-1 ${selected.userId.isDisabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} border`}
                      onClick={() =>
                        handleToggleDisable(selected._id, !selected?.userId?.isDisabled)
                      }
                      disabled={loading}
                    >
                      {selected.userId.isDisabled ? "Enable" : "Disable"}
                    </button>
                  </div>
                  <div>
                    <span className="font-medium text-xs text-slate-500">Panel Access: </span>
                    <span className="px-2 py-0.5 inline-block rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: selected.isPanelAccessible ? "#bbf7d0" : "#fecaca",
                        color: selected.isPanelAccessible ? "#15803d" : "#b91c1c"
                      }}>
                      {selected.isPanelAccessible ? "Granted" : "Revoked"}
                    </span>
                    <button
                      className={`ml-2 text-xs rounded px-2 py-1 ${selected.isPanelAccessible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'} border`}
                      onClick={() =>
                        handleTogglePanelAccess(selected._id, !selected.isPanelAccessible)
                      }
                      disabled={loading}
                    >
                      {selected.isPanelAccessible ? "Revoke" : "Grant"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {FIELD_LIST.map(f => {
                if (f.key === "therapistId") return null;
                const value = f.render
                  ? f.render(selected[f.key as keyof typeof selected], selected)
                  : selected[f.key as keyof typeof selected];
                return (
                  <div key={f.key} className="flex flex-col">
                    <span className="text-xs text-slate-500">{f.label}</span>
                    <span className="text-base font-medium text-slate-800">
                      {value !== undefined && value !== null && value !== ""
                        ? value
                        : (f.type === "file" ? "-" : "-")
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-right flex justify-end gap-2">
            <button
              className={`ml-2 text-xs px-2 py-1 rounded border ${selected.userId?.isDisabled  ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              onClick={() => handleToggleDisable(selected._id, !selected.userId?.isDisabled )}
              disabled={loading}
              title={selected.userId?.isDisabled  ? "Enable" : "Disable"}
              style={{marginLeft: 6}}
            >
              {selected.userId?.isDisabled  ? "Enable Therapist" : "Disable Therapist"}
            </button>
            <button
              className={`ml-2 text-xs px-2 py-1 rounded border ${selected.isPanelAccessible ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
              onClick={() => handleTogglePanelAccess(selected._id, !selected.isPanelAccessible)}
              disabled={loading}
              title={selected.isPanelAccessible ? "Revoke" : "Grant"}
              style={{marginLeft: 6}}
            >
              {selected.isPanelAccessible ? "Revoke Panel Access" : "Grant Panel Access"}
            </button>
            <button
              className="px-4 py-1 bg-red-100 text-red-700 rounded flex items-center gap-1"
              onClick={() => handleDeleteTherapist(selected._id)}
            >
              <FiTrash2 /> Delete
            </button>

            
            <button
              className="px-4 py-1 bg-blue-100 text-blue-700 rounded "
              onClick={() => {
                setEditTherapist(selected);
                setEditField({});
                setSelectedId(null);
                setSelectedProfile(null);
              }}
            >
              Edit
            </button>
            <button
              className="px-4 py-1 bg-gray-100 text-gray-700 rounded"
              onClick={() => {
                setSelectedId(null);
                setSelectedProfile(null);
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    key: string
  ) {
    const file = e.target.files?.[0] || null;
    setEditField((prev) => ({
      ...prev,
      [key]: file,
    }));
  }

  function renderEditModal() {
    if (!editTherapist) return null;
    const isDisabled =
      (editTherapist.userId && typeof editTherapist.userId.isDisabled === "boolean")
        ? editTherapist.userId.isDisabled
        : (typeof editTherapist.isDisabled === "boolean" ? editTherapist.isDisabled : false);
    const panelAccess =
      (editTherapist.userId && typeof editTherapist.isPanelAccessible === "boolean")
        ? editTherapist.isPanelAccessible
        : (typeof editTherapist.panelAccess === "boolean" ? editTherapist.panelAccess : false);
    return (
      <div className="fixed inset-0 z-40 bg-white/70 flex items-center justify-center">
        <div className="relative w-full max-w-2xl mx-auto h-full flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              className="absolute right-4 top-3 text-xl"
              onClick={() => setEditTherapist(null)}
            >
              ×
            </button>
            <h2 className="text-lg font-bold mb-3 text-center">Edit Therapist</h2>
            <div className="mb-3">
              <label className="block text-sm mb-1 font-semibold text-slate-600">Therapist ID</label>
              <input
                className="w-full border px-2 py-1 rounded bg-slate-100 text-slate-600"
                value={editTherapist.therapistId}
                readOnly
              />
            </div>
            {/* New: Disable/Enable and Panel Access toggles */}
            <div className="mb-3 flex gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-slate-500">Status: </span>
                <span
                  className={`px-2 py-0.5 inline-block rounded-full text-xs font-bold ${isDisabled ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}
                >
                  {isDisabled ? "Disabled" : "Enabled"}
                </span>
                <button
                  className={`ml-2 text-xs rounded px-2 py-1 border ${isDisabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  type="button"
                  onClick={() =>
                    handleToggleDisable(editTherapist._id, !isDisabled)
                  }
                  disabled={loading}
                >
                  {isDisabled ? "Enable" : "Disable"}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-slate-500">Panel Access: </span>
                <span
                  className={`px-2 py-0.5 inline-block rounded-full text-xs font-bold ${panelAccess ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                >
                  {panelAccess ? "Granted" : "Revoked"}
                </span>
                <button
                  className={`ml-2 text-xs rounded px-2 py-1 border ${panelAccess ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                  type="button"
                  onClick={() =>
                    handleTogglePanelAccess(editTherapist._id, !panelAccess)
                  }
                  disabled={loading}
                >
                  {panelAccess ? "Revoke" : "Grant"}
                </button>
              </div>
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSubmit();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {FIELD_LIST.map(f => {
                if (f.key === "therapistId") return null;
                return (
                  <div key={f.key}>
                    <label className="block text-sm mb-1">{f.label}</label>
                    {f.type === "file" ? (
                      <>
                        <input
                          className="w-full border px-2 py-1 rounded"
                          type="file"
                          onChange={e => handleFileChange(e, f.key)}
                          accept="image/*,.pdf"
                        />
                        {editTherapist[f.key as keyof typeof editTherapist] && typeof editTherapist[f.key as keyof typeof editTherapist] === "string" && (
                          <div className="mt-1 text-xs text-blue-700">
                            <a href={editTherapist[f.key as keyof typeof editTherapist] as any} target="_blank" rel="noopener noreferrer">Current: View</a>
                          </div>
                        )}
                      </>
                    ) : (
                      <input
                        className="w-full border px-2 py-1 rounded"
                        type={f.type || "text"}
                        value={
                          editField[f.key] !== undefined
                            ? editField[f.key]
                            : editTherapist[f.key as keyof typeof editTherapist] ?? ""
                        }
                        onChange={e =>
                          setEditField(prev => ({
                            ...prev,
                            [f.key]:
                              f.type === "number"
                                ? e.target.value.replace(/[^0-9]/g, "")
                                : e.target.value,
                          }))
                        }
                      />
                    )}
                  </div>
                );
              })}
              <div className="md:col-span-2 text-right pt-4">
                <button
                  type="submit"
                  className="px-4 py-1 bg-green-600 text-white rounded"
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-1 bg-gray-100 text-gray-700 rounded ml-2"
                  onClick={() => setEditTherapist(null)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // For table, show top-level, most-identifying fields
  const tableHeaders: { label: string; key: keyof TherapistProfile | "actions" }[] = [
    { label: "Therapist ID", key: "_id" },
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Mobile1", key: "mobile1" },
    { label: "Specializations", key: "specializations" },
    { label: "Experience", key: "experienceYears" },
    { label: "Enabled", key: "isDisabled" },
    { label: "Panel Access", key: "panelAccess" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Therapists</h1>
      {error ? <div className="text-red-500 mb-4">{error}</div> : null}
      <div className="bg-white border rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              {tableHeaders.map(th => (
                <th
                  key={th.key}
                  className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider"
                >
                  {th.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {loading ? (
              <tr>
                <td colSpan={tableHeaders.length}>
                  <div className="text-center py-8">Loading...</div>
                </td>
              </tr>
            ) : therapists.length === 0 ? (
              <tr>
                <td colSpan={tableHeaders.length}>
                  <div className="text-center py-8">No therapists found.</div>
                </td>
              </tr>
            ) : (
              therapists.map((t) => {
                // get status and panelAccess boolean, fallback to userId field if available
                const isDisabled =
                  (t.userId && typeof t.userId.isDisabled === "boolean") && t.userId.isDisabled ;
                const panelAccess =
                  (t.userId && typeof t.isPanelAccessible === "boolean") ? t.isPanelAccessible :
                  (typeof t.panelAccess === "boolean" ? t.panelAccess : false);
                return (
                  <tr key={t._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono">{t.therapistId}</td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 flex items-center gap-2">
                      <FiUser className="text-slate-400" />
                      {t?.userId?.name || t.name || t.email || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{(t?.userId?.email || t.email) || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.mobile1 || "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{t.specializations?.trim() ? t.specializations : "-"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {typeof t.experienceYears === "number" && !isNaN(t.experienceYears)
                        ? `${t.experienceYears} yrs`
                        : "-"}
                    </td>
                    {/* Enabled/Disabled column */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${isDisabled ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}`}
                      >
                        {isDisabled ? "Disabled" : "Enabled"}
                      </span>
                      <button
                        className={`ml-2 text-xs px-2 py-1 rounded border ${isDisabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        onClick={() => handleToggleDisable(t._id, !isDisabled)}
                        disabled={loading}
                        title={isDisabled ? "Enable" : "Disable"}
                        style={{marginLeft: 6}}
                      >
                        {isDisabled ? "Enable" : "Disable"}
                      </button>
                    </td>
                    {/* Panel Access column */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${panelAccess ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                      >
                        {panelAccess ? "Granted" : "Revoked"}
                      </span>
                      
                      <button
                        className={`ml-2 text-xs px-2 py-1 rounded border ${panelAccess ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                        onClick={() => handleTogglePanelAccess(t._id, !panelAccess)}
                        disabled={loading}
                        title={panelAccess ? "Revoke" : "Grant"}
                        style={{marginLeft: 6}}
                      >
                        {panelAccess ? "Revoke" : "Grant"}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <button
                          className="rounded border border-blue-500 p-1 text-blue-600 hover:bg-blue-100 transition"
                          onClick={() => onTableViewClick(t._id)}
                          title="View Details"
                        >
                          <FiEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {selectedId && selectedProfile && renderTherapistModal()}
      {editTherapist && renderEditModal()}
    </motion.div>
  );
}
