import { useEffect, useState } from "react";
import {
  FiUser,

  FiEdit2,
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
    // Removed authProvider, otpAttempts, __v
    phoneVerified?: boolean;
    emailVerified?: boolean;
    status?: string;
    role?: string;
    createdAt?: string;
    updatedAt?: string;
  };
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
};

// All editable and display fields (schema keys)
const FIELD_LIST: {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "file";
  readOnly?: boolean;
  render?: (value: any, row?: TherapistProfile) => React.ReactNode;
}[] = [
  // Show name, email, and role correctly, prioritizing userId property if present, then fallback to root.
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
  const [selected, setSelected] = useState<TherapistProfile | null>(null);
  const [editTherapist, setEditTherapist] = useState<TherapistProfile | null>(null);
  const [editField, setEditField] = useState<{ [k: string]: any }>({});

  const [error, setError] = useState<string | null>(null);

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

  async function fetchTherapistById(id: string) {
    setLoading(true);
    setError(null);
    setSelected(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}`
      );
      setSelected(res.data.therapist ?? null);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Error"
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

      // Coerce "experienceYears" number, and make empty fields "", not "undefined"
      for (const field of FIELD_LIST) {
        if (payload[field.key] === undefined || payload[field.key] === null) {
          payload[field.key] = "";
        }
        if (field.key === "experienceYears" && payload.experienceYears !== "") {
          payload.experienceYears = Number(payload.experienceYears) || 0;
        }
        // Normalize specializations as comma-string for backend
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

  function renderTherapistModal() {
    if (!selected) return null;
    // Show all fields from schema, including userId fields grouped.
    return (
      <div className="fixed inset-0 z-30 bg-white/70 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6 relative">
          <button
            className="absolute right-4 top-3 text-xl"
            onClick={() => setSelected(null)}
          >
            ×
          </button>
          <h2 className="text-xl font-bold mb-2">Therapist Details</h2>
          <div className="overflow-y-auto max-h-[70vh]">
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
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {FIELD_LIST.map(f => {
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
          <div className="mt-4 text-right">
            <button
              className="px-4 py-1 bg-blue-100 text-blue-700 rounded mr-2"
              onClick={() => {
                setEditTherapist(selected);
                setEditField({});
                setSelected(null);
              }}
            >
              Edit
            </button>
            <button
              className="px-4 py-1 bg-gray-100 text-gray-700 rounded"
              onClick={() => setSelected(null)}
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
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSubmit();
              }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {FIELD_LIST.map(f => (
                <div key={f.key}>
                  <label className="block text-sm mb-1">{f.label}</label>
                  {f.type === "file" ? (
                    <>
                      {/* File upload (no preview of old file, only overwrite) */}
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
              ))}
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
    { label: "Name", key: "name" },
    { label: "Email", key: "email" },
    { label: "Mobile1", key: "mobile1" },
    { label: "Specializations", key: "specializations" },
    { label: "Experience", key: "experienceYears" },
    { label: "Actions", key: "actions" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-8"
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
              therapists.map((t) => (
                <tr key={t._id} className="hover:bg-slate-50 transition">
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
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        className="rounded border border-blue-500 p-1 text-blue-600 hover:bg-blue-100 transition"
                        onClick={() => fetchTherapistById(t._id)}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                      <button
                        className="rounded border border-green-500 p-1 text-green-600 hover:bg-green-100 transition"
                        onClick={() => {
                          setEditTherapist(t);
                          setEditField({});
                        }}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="rounded border border-red-500 p-1 text-red-600 hover:bg-red-100 transition"
                        onClick={() => handleDeleteTherapist(t._id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {selected && renderTherapistModal()}
      {editTherapist && renderEditModal()}
    </motion.div>
  );
}
