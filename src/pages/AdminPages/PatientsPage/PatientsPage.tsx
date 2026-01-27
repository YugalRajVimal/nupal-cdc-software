import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { FiUser, FiPhone, FiEye, FiEdit, FiSearch } from "react-icons/fi"; // Removed FiTrash2

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type UserIdType = {
  isDisabled?: boolean;
  _id?: string;
  role?: string;
  name?: string;
  email?: string;
  phone?: string;
  authProvider?: string;
  otpAttempts?: number;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  otpExpiresAt?: string;
};

type Patient = {
  _id: string;
  patientId?: string;
  name?: string;
  childFullName?: string;
  gender?: string;
  childDOB?: string;
  userId?: UserIdType;
  mobile1?: string;
  mobile2?: string;
  diagnosisInfo?: string;
  areaName?: string;
  address?: string;
  pincode?: string;
  fatherFullName?: string;
  motherFullName?: string;
  parentEmail?: string;
  plannedSessionsPerMonth?: string;
  package?: string;
  childReference?: string;
  parentOccupation?: string;
  remarks?: string;
  otherDocument?: string;
  __v?: number;
  [key: string]: any;
};

// Pagination & search defaults
const DEFAULT_LIMIT = 10;

function getQueryParam(param: string): string | null {
  if (typeof window === "undefined") return null;
  const search = window.location.search || "";
  const params = new URLSearchParams(search);
  return params.get(param);
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{ [key: string]: any }>({});
  const [editLoading, setEditLoading] = useState(false);
  // New for search and pagination
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [total, setTotal] = useState(0);

  // Debounce search input
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    // eslint-disable-next-line
  }, [searchInput]);

  // Fetch patients with search and pagination
  useEffect(() => {
    setLoading(true);
    const url = new URL(`${API_BASE_URL}/api/admin/patients`);
    // mimic patient.controller.js paginated endpoint style; expects ?search= &page= &limit=
    if (search) url.searchParams.set("search", search);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));
    fetch(url.toString())
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        // `patients` (array), `total` (count of all that match), `page`, `limit` in response
        setPatients(data.patients || []);
        setTotal(data.total || 0);
      })
      .catch((err) => {
        alert("Failed to fetch patients: " + err.message);
        setPatients([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [search, page, limit]);

  // Helper to get display name (either .name or .childFullName, both are same)
  const getDisplayName = (patient: Patient) =>
    patient.name || patient.childFullName || "";

  // Start editing patient (inside view modal)
  const handleEditStart = (patient: Patient) => {
    setEditMode(true);
    // Since both fields are same, preserve consistency: use patient's name, fallback to childFullName,
    // and always set both fields to same value in form.
    const baseName = patient.name || patient.childFullName || "";
    setEditForm({
      name: baseName,
      childFullName: baseName,
      gender: patient.gender || "",
      childDOB: patient.childDOB?.slice?.(0, 10) || "",
      mobile1: patient.mobile1 || "",
      mobile2: patient.mobile2 || "",
      areaName: patient.areaName || "",
      address: patient.address || "",
      pincode: patient.pincode || "",
      diagnosisInfo: patient.diagnosisInfo || "",
      remarks: patient.remarks || "",
      fatherFullName: patient.fatherFullName || "",
      motherFullName: patient.motherFullName || "",
      parentEmail: patient.parentEmail || "",
      plannedSessionsPerMonth: patient.plannedSessionsPerMonth || "",
      package: patient.package || "",
      childReference: patient.childReference || "",
      parentOccupation: patient.parentOccupation || "",
      otherDocument: patient.otherDocument || "",
    });
  };

  // Save Edited Patient (PUT)
  const handleEditSave = async () => {
    if (!viewPatient) return;
    setEditLoading(true);
    try {
      // Always set both name and childFullName to same value if either is present
      const saveForm = {
        ...editForm,
        name: editForm.name ?? editForm.childFullName ?? "",
        childFullName: editForm.name ?? editForm.childFullName ?? "",
      };
      const res = await fetch(
        `${API_BASE_URL}/api/admin/patients/${viewPatient._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(saveForm),
        }
      );
      if (!res.ok) {
        const msg = await res.text();
        alert("Failed to update: " + msg);
        setEditLoading(false);
        return;
      }
      const updated = await res.json();
      setPatients((pats) =>
        pats.map((p) =>
          p._id === updated.patient._id ? updated.patient : p
        )
      );
      setViewPatient(updated.patient);
      setEditMode(false);
    } catch (err: any) {
      alert("Update failed: " + (err?.message || err));
    }
    setEditLoading(false);
  };

  // Auto-open modal if patientId in query and available in patients list (or fetch individually if not in list)
  useEffect(() => {
    const queryPatientId = getQueryParam("patientId");
    if (!queryPatientId) return;

    // Check if the patient is already in the list
    if (patients && patients.length > 0) {
      const match = patients.find((p) => p.patientId === queryPatientId || p._id === queryPatientId);
      if (match) {
        setViewPatient(match);
        setEditMode(false);
        return;
      }
    }
    // If not in the current list, try to fetch the specific patient by patientId
    // PatientId is typically NOT _id, so fetch by patientId; but if not found, fallback to _id.
    let controller = new AbortController();

    // Only run this if patients have loaded (at least initial has finished), otherwise wait
    if (!loading && patients.length === 0) {
      // Try fetching by patientId (custom endpoint, fallback to fetching all and searching _id)
      (async () => {
        try {
          const url = new URL(`${API_BASE_URL}/api/admin/patients/findByPatientId`);
          url.searchParams.set("patientId", queryPatientId);
          const res = await fetch(url.toString(), { signal: controller.signal });
          if (res.ok) {
            const data = await res.json();
            if (data.patient) {
              setViewPatient(data.patient);
              setEditMode(false);
              return;
            }
          }
          // If not found by patientId, try _id (rare, but some ID linkers might use it)
          const fallbackRes = await fetch(`${API_BASE_URL}/api/admin/patients/${queryPatientId}`, { signal: controller.signal });
          if (fallbackRes.ok) {
            const data = await fallbackRes.json();
            if (data.patient) {
              setViewPatient(data.patient);
              setEditMode(false);
              return;
            }
          }
        } catch (e) {
          // Ignore errors, especially AbortError
        }
      })();
    }
    return () => controller.abort();
  }, [patients, loading]);

  // Define "Name" field only once (merge name and childFullName into one field)
  const patientFields: Array<{
    label: string;
    key: keyof Patient | string;
    section?: string;
    editable?: boolean;
  }> = [
    { label: "Patient ID", key: "patientId" },
    { label: "Name", key: "name", editable: true }, // Only one field for name
    { label: "Gender", key: "gender", editable: true },
    { label: "DOB", key: "childDOB", editable: true },
    { label: "Father's Name", key: "fatherFullName", editable: true },
    { label: "Mother's Name", key: "motherFullName", editable: true },
    { label: "Parent Email", key: "parentEmail", editable: true },
    { label: "Mobile 1", key: "mobile1", editable: true },
    { label: "Mobile 2", key: "mobile2", editable: true },
    { label: "Address", key: "address", editable: true },
    { label: "Pincode", key: "pincode", editable: true },
    { label: "Area", key: "areaName", editable: true },
    { label: "Diagnosis/Concern", key: "diagnosisInfo", editable: true },
    { label: "Child Reference", key: "childReference", editable: true },
    { label: "Parent Occupation", key: "parentOccupation", editable: true },
    { label: "Planned Sessions/Month", key: "plannedSessionsPerMonth", editable: true },
    { label: "Package", key: "package", editable: true },
    { label: "Remarks", key: "remarks", editable: true },
    { label: "Other Document", key: "otherDocument", editable: true },
  ];

  // List of userId fields (if present)
  const userIdFields: Array<{
    label: string;
    key: keyof UserIdType;
  }> = [
    { label: "User Email", key: "email" },
    { label: "User Name", key: "name" },
    { label: "User Phone", key: "phone" },
    { label: "Role", key: "role" },
    { label: "Status", key: "status" },
    { label: "Auth Provider", key: "authProvider" },
    { label: "Phone Verified", key: "phoneVerified" },
    { label: "Email Verified", key: "emailVerified" },
    { label: "Created At", key: "createdAt" },
    { label: "Updated At", key: "updatedAt" },
  ];

  // Pagination helper calcs
  const pageCount = Math.ceil(total / limit) || 1;

  // MAIN RENDER
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Childrens</h1>
      {/* --- Search & limit controls --- */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPage(1);
          }}
          className="flex gap-2 items-center"
          role="search"
        >
          <span className="relative">
            <input
              type="text"
              placeholder="Search name, phone, id, etc"
              className="border rounded pl-9 pr-4 py-2 w-64 text-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label="Search Patients"
            />
            <FiSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
          </span>
        </form>
        <label className="flex items-center text-sm gap-2">
          Show
          <select
            className="border rounded px-2 py-1"
            value={limit}
            onChange={e => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Number of rows per page"
          >
            {[5, 10, 15, 20, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          per page
        </label>
        <span className="text-xs text-slate-400 ml-4">
          Showing {patients.length > 0 ? (limit * (page - 1)) + 1 : 0}
          -
          {patients.length > 0 ? (limit * (page - 1)) + patients.length : 0}
          {" "}of {total}
        </span>
      </div>
      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">ChildrenID</th>
                <th className="px-4 py-3 text-left">Children</th>
                <th className="px-4 py-3 text-left">Diagnosis/Concern</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-t">
                  {/* Patient ID column */}
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {p.patientId || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                        <FiUser className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">
                          {getDisplayName(p)}
                        </p>
                        {p.childDOB && (
                          <p className="text-xs text-slate-500">
                            DOB: {new Date(p.childDOB).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {p.diagnosisInfo || (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-slate-600 flex items-center gap-2">
                    <FiPhone />{" "}
                    {p.mobile1 || (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-blue-300 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          setViewPatient(p);
                          setEditMode(false);
                        }}
                      >
                        <FiEye /> View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center p-6 text-slate-400">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      <div className="mt-4 flex gap-3 items-center justify-center select-none">
        <button
          className={`px-3 py-1 rounded border ${page <= 1 ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-white hover:bg-slate-50"}`}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page <= 1}
          aria-label="Previous Page"
        >
          {"<"}
        </button>
        {[...Array(pageCount).keys()]
          .map(k => k + 1)
          .filter(i =>
            // Show first, last, and nearby pages
            i === 1 || i === pageCount || Math.abs(i - page) <= 2
          )
          .reduce<number[]>((arr, i, idx, src) => {
            // Add ellipsis if there is a gap
            console.log(src);
            if (idx > 0 && i - arr[arr.length - 1] > 1) arr.push(-1);
            arr.push(i);
            return arr;
          }, [])
          .map((i, idx) =>
            i === -1 ? (
              <span key={`ellipsis-${idx}`} className="px-2 text-slate-300">
                ...
              </span>
            ) : (
              <button
                key={`page-${i}`}
                className={`px-3 py-1 rounded border ${
                  i === page
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-slate-50"
                }`}
                onClick={() => setPage(i)}
                aria-current={i === page ? "page" : undefined}
              >
                {i}
              </button>
            )
          )}
        <button
          className={`px-3 py-1 rounded border ${page >= pageCount ? "bg-slate-100 cursor-not-allowed text-slate-400" : "bg-white hover:bg-slate-50"}`}
          onClick={() => setPage(p => Math.min(pageCount, p + 1))}
          disabled={page >= pageCount}
          aria-label="Next Page"
        >
          {">"}
        </button>
      </div>

      {/* View Modal (includes edit) */}
      {viewPatient && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full relative overflow-y-auto max-h-[95vh]">
            <button
              className="absolute top-3 right-3 text-3xl text-slate-400 hover:text-red-500"
              onClick={() => {
                setViewPatient(null);
                setEditMode(false);
              }}
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Children Details</h2>

            {/* Patient fields table */}
            {!editMode ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientFields.map((field) => (
                    <div key={field.key}>
                      <span className="block text-xs text-slate-400 font-medium">
                        {field.label}
                      </span>
                      <span className="block text-slate-800 font-semibold min-h-[24px]">
                        {/* For name "alias", always show the merged value */}
                        {field.key === "name"
                          ? getDisplayName(viewPatient)
                          : field.key === "gender"
                          ? (viewPatient[field.key] || "")
                              .charAt(0)
                              .toUpperCase() +
                            (viewPatient[field.key] || "").slice(1)
                          : field.key === "childDOB" && viewPatient.childDOB
                          ? new Date(viewPatient.childDOB).toLocaleDateString()
                          : viewPatient[field.key] || (
                              <span className="italic text-slate-400">N/A</span>
                            )}
                      </span>
                    </div>
                  ))}
                  {/* userId embedded fields */}
                  {viewPatient.userId && (
                    <>
                      <div className="col-span-full text-slate-700 font-bold border-b pb-1 mt-3 mb-1">
                        Linked User Info
                      </div>
                      {userIdFields.map((uf) => (
                        <div key={uf.key}>
                          <span className="block text-xs text-slate-400 font-medium">
                            {uf.label}
                          </span>
                          <span className="block text-slate-800 min-h-[24px]">
                            {typeof viewPatient.userId?.[uf.key] === "boolean"
                              ? viewPatient.userId?.[uf.key]
                                ? "Yes"
                                : "No"
                              : uf.key === "createdAt" || uf.key === "updatedAt"
                              ? viewPatient.userId?.[uf.key] ? (
                                  new Date(
                                    viewPatient.userId?.[uf.key] + ""
                                  ).toLocaleString()
                                ) : (
                                  <span className="italic text-slate-400">
                                    N/A
                                  </span>
                                )
                              : viewPatient.userId?.[uf.key]?.toString() || (
                                  <span className="italic text-slate-400">
                                    N/A
                                  </span>
                                )}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Button for Edit only */}
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    onClick={() => handleEditStart(viewPatient)}
                  >
                    <FiEdit /> Edit
                  </button>
                </div>
              </>
            ) : (
              // Edit mode view in the same modal
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEditSave();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientFields.map((field) => {
                    // Only show as readonly field if not editable
                    if (!field.editable) {
                      return (
                        <div key={field.key}>
                          <label className="block mb-1 text-sm font-medium">
                            {field.label}
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                            value={viewPatient[field.key] || ""}
                            readOnly
                            disabled
                            style={{ opacity: 1 }}
                          />
                        </div>
                      );
                    }

                    // Render field input based on key
                    if (field.key === "name") {
                      return (
                        <div key={field.key}>
                          <label className="block mb-1 text-sm font-medium">
                            Name
                          </label>
                          <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            value={editForm.name || ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setEditForm((f) => ({
                                ...f,
                                name: value,
                                childFullName: value, // Keep them in sync
                              }));
                            }}
                          />
                        </div>
                      );
                    }
                    if (field.key === "gender") {
                      return (
                        <div key={field.key}>
                          <label className="block mb-1 text-sm font-medium">
                            Gender
                          </label>
                          <select
                            className="w-full border rounded px-3 py-2"
                            value={editForm.gender}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                gender: e.target.value,
                              }))
                            }
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      );
                    }
                    if (field.key === "childDOB") {
                      return (
                        <div key={field.key}>
                          <label className="block mb-1 text-sm font-medium">
                            DOB
                          </label>
                          <input
                            type="date"
                            className="w-full border rounded px-3 py-2"
                            value={editForm.childDOB?.slice?.(0, 10) || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                childDOB: e.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    }
                    if (field.key === "remarks") {
                      return (
                        <div key={field.key}>
                          <label className="block mb-1 text-sm font-medium">
                            Remarks
                          </label>
                          <textarea
                            className="w-full border rounded px-3 py-2"
                            rows={2}
                            value={editForm.remarks}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                remarks: e.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    }
                    if (field.key === "pincode") {
                      return (
                        <div key={field.key}>
                          <label className="block mb-1 text-sm font-medium">
                            Pincode
                          </label>
                          <input
                            type="text"
                            pattern="[0-9]*"
                            className="w-full border rounded px-3 py-2"
                            value={editForm.pincode || ""}
                            onChange={(e) =>
                              setEditForm((f) => ({
                                ...f,
                                pincode: e.target.value,
                              }))
                            }
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={field.key}>
                        <label className="block mb-1 text-sm font-medium">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          className="w-full border rounded px-3 py-2"
                          value={editForm[field.key] || ""}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              [field.key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    className="px-4 py-2 rounded border"
                    onClick={() => setEditMode(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-5 py-2 rounded text-white ${
                      editLoading
                        ? "bg-blue-300"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                    disabled={editLoading}
                  >
                    {editLoading ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
