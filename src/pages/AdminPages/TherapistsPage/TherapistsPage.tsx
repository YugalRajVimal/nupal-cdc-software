import { useEffect, useState, useCallback, useRef } from "react";
import {
  FiUser,
  FiEye,
  FiSearch,
  FiDownload,
} from "react-icons/fi";
import { motion } from "framer-motion";
import axios from "axios";

// Import JSZip for zipping files
import JSZip from "jszip";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Utility to get the right auth header (admin-token / super-admin-token)
function getAuthHeader() {
  const adminToken = localStorage.getItem("admin-token");
  if (adminToken) {
    return { Authorization: `${adminToken}` };
  }
  return {};
}

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
    isDisabled?: boolean;
    manualSignUp?: boolean;
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
  earnings?: Array<{
    amount: number;
    type: "salary" | "contract";
    fromDate: string;
    toDate: string;
    remark?: string;
    paidOn?: string;
  }>;
  isDisabled?: boolean;
  panelAccess?: boolean;
};

const DATE_FIELDS = [
  "createdAt",
  "updatedAt",
  "fromDate",
  "toDate",
  "paidOn",
];

const FIELD_LIST: {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "file" | "date";
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

function CalendarInput({
  value,
  onChange,
  min,
  max,
  required,
  className,
  id,
  name,
}: {
  value: string;
  onChange: (val: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  className?: string;
  id?: string;
  name?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <span className="relative flex items-center">
      <input
        className={className}
        type="text"
        value={value}
        readOnly
        id={id}
        name={name}
        style={{ backgroundColor: "#fcfcff" }}
        onClick={() => {
          ref.current?.showPicker?.();
          ref.current?.focus();
        }}
        placeholder="YYYY-MM-DD"
      />
      <button
        tabIndex={-1}
        type="button"
        onClick={e => {
          e.preventDefault();
          ref.current?.showPicker?.();
          ref.current?.focus();
        }}
        className="absolute right-2 top-0 bottom-0 flex items-center justify-center h-full text-slate-500 hover:text-blue-600 transition"
        style={{ background: "none", border: "none", cursor: "pointer" }}
        aria-label="pick date"
      >
        <svg height="16" width="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3" y="6" width="18" height="14" rx="2" strokeWidth="2" stroke="currentColor" />
          <path d="M16 2v4M8 2v4" strokeWidth="2" stroke="currentColor" />
        </svg>
      </button>
      <input
        ref={ref}
        type="date"
        style={{
          opacity: 0,
          width: "32px",
          minWidth: "32px",
          height: "32px",
          position: "absolute",
          right: "0.2rem",
          top: "0",
          zIndex: 2,
          cursor: "pointer",
        }}
        value={value}
        min={min}
        max={max}
        onChange={e => {
          onChange(e.target.value);
        }}
        required={required}
        tabIndex={-1}
        id={id ? `${id}-calendar` : undefined}
        name={name ? `${name}-calendar` : undefined}
        autoComplete="off"
      />
    </span>
  );
}

// Helper: fetch a blob by URL
async function fetchFileBlob(url: string): Promise<Blob> {
  // If already a blob URL (data URI), convert to blob
  if (url.startsWith("data:")) {
    const res = await fetch(url);
    return await res.blob();
  }
  // For http(s) URLs
  const resp = await fetch(url);
  if (!resp.ok)
    throw new Error(`Failed to fetch file: ${resp.statusText}`);
  return await resp.blob();
}

// Helper: get download URLs for the files from the therapist profile (resolves full URLs)
function getTherapistFileInfos(therapist: TherapistProfile): {
  label: string;
  url: string | null;
  filename: string;
}[] {
  const uploadsUrl = import.meta.env.VITE_UPLOADS_URL || "";
  const keysAndNames = [
    ["aadhaarFront", "aadhaar-front"],
    ["aadhaarBack", "aadhaar-back"],
    ["photo", "photo"],
    ["resume", "resume"],
    ["certificate", "certificate"],
  ] as const;
  return keysAndNames.map(([key, base]) => {
    let val = therapist[key as keyof TherapistProfile];
    if (!val || typeof val !== "string") return { label: key, url: null, filename: "" };
    const isFullUrl = /^(http|https):\/\//i.test(val);
    const url = isFullUrl
      ? val
      : uploadsUrl
      ? (uploadsUrl.replace(/\/+$/, "") + "/" + val.replace(/^\/+/, ""))
      : val;
    // Attempt to preserve extension
    let ext = url.split("?")[0].split("#")[0].split(".").pop();
    if (ext && ext.length <= 5) ext = "." + ext;
    else ext = "";
    const filename = `${base}${ext}`;
    return { label: key, url, filename };
  });
}

export default function TherapistsPage() {
  // Table state & filters
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log(error);
  }, []);

  // Modal & Edit logic
  const [editTherapist, setEditTherapist] = useState<TherapistProfile | null>(null);
  const [editField, setEditField] = useState<{ [k: string]: any }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<TherapistProfile | null>(null);

  // Download state for single therapist file zipping
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Search and pagination state
  const [searchText, setSearchText] = useState("");
  const [searchCommitted, setSearchCommitted] = useState(""); // Actual text applied to data fetch
  const [page, setPage] = useState(1);

  const [sortField, setSortField] = useState<null | string>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [totalPages, setTotalPages] = useState(1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const firstViewRef = useRef(false);

  const fetchTherapists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
      };
      if (searchCommitted) params.search = searchCommitted;
      if (sortField) params.sortField = sortField;
      if (sortOrder) params.sortOrder = sortOrder;

      const resp = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist`,
        { params, headers: getAuthHeader() }
      );
      let therapistsArr: TherapistProfile[] = [];
      if (
        resp &&
        resp.data &&
        Array.isArray(resp.data.therapists)
      ) {
        therapistsArr = resp.data.therapists;
      }
      setTherapists(therapistsArr);
      setTotalPages(resp.data.totalPages || 1);
    } catch (err: any) {
      setTherapists([]);
      setTotalPages(1);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Error loading therapists."
      );
    } finally {
      setLoading(false);
    }
  }, [page, searchCommitted, sortField, sortOrder]);

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);
  }
  function handleSearchSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setPage(1);
    setSearchCommitted(searchText);
  }
  function resetFilters() {
    setSearchText("");
    setSearchCommitted("");
    setPage(1);
  }
  function handleTableSort(col: string) {
    if (sortField === col) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(col);
      setSortOrder("asc");
    }
  }
  function gotoPage(p: number) {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  }

  useEffect(() => {
    fetchTherapists();
    // eslint-disable-next-line
  }, [fetchTherapists]);

  useEffect(() => {
    if (firstViewRef.current) return;
    const searchParams = new URLSearchParams(window.location.search);
    const therapistId = searchParams.get("therapistId");
    if (therapistId) {
      firstViewRef.current = true;
      fetchTherapistById(therapistId);
    }
    // eslint-disable-next-line
  }, []);

  const fetchTherapistById = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    setSelectedId(id);
    setSelectedProfile(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}`,
        { headers: getAuthHeader() }
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

  const onTableViewClick = (id: string) => {
    fetchTherapistById(id);
  };

  async function handleToggleDisable(id: string, shouldDisable: boolean) {
    setLoading(true);
    setError(null);
    try {
      const endpoint = shouldDisable
        ? `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/disable`
        : `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/enable`;
      await axios.patch(endpoint, {}, { headers: getAuthHeader() });
      await fetchTherapists();
      if (selectedId === id) {
        await fetchTherapistById(id);
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to change disable status."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePanelAccess(id: string, enable: boolean) {
    setLoading(true);
    setError(null);
    try {
      await axios.patch(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${id}/panel-access`,
        { isPanelAccessible: enable },
        { headers: getAuthHeader() }
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
      for (const dfield of DATE_FIELDS) {
        if (
          payload[dfield] &&
          typeof payload[dfield] === "object" &&
          payload[dfield] instanceof Date
        ) {
          payload[dfield] = payload[dfield].toISOString().slice(0, 10);
        }
      }
      delete payload._id;
      delete payload.userId;
      for (const field of FIELD_LIST) {
        if (
          payload[field.key] === undefined ||
          payload[field.key] === null
        ) {
          payload[field.key] = "";
        }
        if (
          field.key === "experienceYears" &&
          payload.experienceYears !== ""
        ) {
          payload.experienceYears = Number(payload.experienceYears) || 0;
        }
        if (
          field.key === "specializations" &&
          Array.isArray(payload.specializations)
        ) {
          payload.specializations = payload.specializations.join(", ");
        }
        if (
          field.key === "specializations" &&
          typeof payload.specializations !== "string"
        ) {
          payload.specializations = "";
        }
      }
      await axios.put(
        `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${editTherapist._id}`,
        payload,
        { headers: { ...getAuthHeader(), "Content-Type": "application/json" } }
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

  // Download ZIP handler for the 5 main files for therapist
  async function handleDownloadAllFilesZip() {
    if (!selectedProfile) return;
    setDownloadingZip(true);
    try {
      const files = getTherapistFileInfos(selectedProfile);
      const zip = new JSZip();
      let hasFiles = false;
      for (const file of files) {
        if (!file.url) continue;
        try {
          const blob = await fetchFileBlob(file.url);
          hasFiles = true;
          zip.file(file.filename, blob);
        } catch (err) {
          // Could log error or continue
        }
      }
      if (!hasFiles) throw new Error("No files to download.");
      const content = await zip.generateAsync({ type: "blob" });
      // Download zip
      const a = document.createElement("a");
      const url = URL.createObjectURL(content);
      a.href = url;
      a.download =
        (selectedProfile?.userId?.name || selectedProfile?.therapistId || "therapist") +
        "_files.zip";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 200);
    } catch (err) {
      alert(
        "Failed to download files. Some files may not be accessible or no files present."
      );
    }
    setDownloadingZip(false);
  }

  function renderTherapistModal() {
    if (!selectedId || !selectedProfile) return null;
    const selected = selectedProfile;
    // Prepare download file info for the five main files
    const THERAPIST_MAIN_FILES = [
      {
        key: "aadhaarFront",
        label: "Aadhaar Front",
      },
      {
        key: "aadhaarBack",
        label: "Aadhaar Back",
      },
      {
        key: "photo",
        label: "Photo",
      },
      {
        key: "resume",
        label: "Resume",
      },
      {
        key: "certificate",
        label: "Certificate",
      },
    ];

    // Show download all button only if at least one of the five files is present
    const filesPresent = THERAPIST_MAIN_FILES.some(({ key }) => {
      const val = selected[key as keyof TherapistProfile];
      return typeof val === "string" && !!val;
    });

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
          <h2 className="text-xl font-bold mb-2">
            Therapist Details
          </h2>
          {/* Download All 5 Files as ZIP Button */}
          <div className="mb-4 flex flex-wrap gap-2 justify-end">
            {filesPresent && (
              <button
                className="px-4 py-1 flex items-center gap-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 transition text-sm"
                disabled={downloadingZip}
                onClick={handleDownloadAllFilesZip}
                title="Download all files as ZIP"
              >
                <FiDownload />
                {downloadingZip ? "Preparing ZIP..." : "Download All Files (ZIP)"}
              </button>
            )}
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            <div className="mb-2">
              <span className="text-xs text-slate-500 font-semibold">
                Therapist ID:{" "}
              </span>
              <span className="text-sm text-slate-700">
                {selected.therapistId}
              </span>
            </div>
            {selected.userId && (
              <div className="mb-4 border-b pb-2 text-md">
                <div className="font-semibold mb-1 text-slate-800">
                  User Account
                </div>
                {Object.entries(selected.userId)
                  .filter(
                    ([key]) =>
                      !["_id", "authProvider", "otpAttempts", "__v"].includes(
                        key
                      )
                  )
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className="flex gap-2 text-sm text-slate-600 py-0.5"
                    >
                      <span className="font-medium">{key}:</span>
                      <span>
                        {typeof val === "boolean"
                          ? val
                            ? "Yes"
                            : "No"
                          : val ?? "-"}
                      </span>
                    </div>
                  ))}
                <div className="flex gap-4 mt-3">
                  <div>
                    <span className="font-medium text-xs text-slate-500">
                      Status:{" "}
                    </span>
                    <span
                      className="px-2 py-0.5 inline-block rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: selected.userId.isDisabled
                          ? "#fecaca"
                          : "#bbf7d0",
                        color: selected.userId.isDisabled
                          ? "#b91c1c"
                          : "#15803d",
                      }}
                    >
                      {selected.userId.isDisabled ? "Disabled" : "Enabled"}
                    </span>
                    <button
                      className={`ml-2 text-xs rounded px-2 py-1 ${
                        selected.userId.isDisabled
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      } border`}
                      onClick={() =>
                        handleToggleDisable(
                          selected._id,
                          !selected?.userId?.isDisabled
                        )
                      }
                      disabled={loading}
                    >
                      {selected.userId.isDisabled ? "Enable" : "Disable"}
                    </button>
                  </div>
                  <div>
                    <span className="font-medium text-xs text-slate-500">
                      Panel Access:{" "}
                    </span>
                    <span
                      className="px-2 py-0.5 inline-block rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: selected.isPanelAccessible
                          ? "#bbf7d0"
                          : "#fecaca",
                        color: selected.isPanelAccessible
                          ? "#15803d"
                          : "#b91c1c",
                      }}
                    >
                      {selected.isPanelAccessible ? "Granted" : "Revoked"}
                    </span>
                    <button
                      className={`ml-2 text-xs rounded px-2 py-1 ${
                        selected.isPanelAccessible
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      } border`}
                      onClick={() =>
                        handleTogglePanelAccess(
                          selected._id,
                          !selected.isPanelAccessible
                        )
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
              {FIELD_LIST.map((f) => {
                if (f.key === "therapistId") return null;
                let rawValue = selected[f.key as keyof typeof selected];
                let value;

                if (f.type === "file") {
                  const uploadsUrl = import.meta.env.VITE_UPLOADS_URL || "";
                  // Only handle if there's a value
                  if (typeof rawValue === "string" && rawValue) {
                    // Prepend uploads URL if not already a full URL
                    const isFullUrl = /^(http|https):\/\//i.test(rawValue);
                    const url = isFullUrl
                      ? rawValue
                      : (uploadsUrl ? uploadsUrl.replace(/\/+$/, "") + "/" + rawValue.replace(/^\/+/, "") : rawValue);

                    // If it's an image, render an <img>, otherwise just a link to view
                    const isImage = /\.(jpe?g|png|gif|bmp|webp)$/i.test(url);
                    value = isImage ? (
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={f.label} className="h-10 w-10 object-cover rounded shadow border" />
                      </a>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
                        View File
                      </a>
                    );
                  } else {
                    value = "-";
                  }
                } else if (f.render) {
                  value = f.render(rawValue, selected);
                } else {
                  value = rawValue;
                }

                return (
                  <div key={f.key} className="flex flex-col">
                    <span className="text-xs text-slate-500">{f.label}</span>
                    <span className="text-base font-medium text-slate-800">
                      {value !== undefined && value !== null && value !== ""
                        ? value
                        : "-"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 text-right flex justify-end gap-2">
            <button
              className={`ml-2 text-xs px-2 py-1 rounded border ${
                selected.userId?.isDisabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
              onClick={() =>
                handleToggleDisable(
                  selected._id,
                  !selected.userId?.isDisabled
                )
              }
              disabled={loading}
              title={selected.userId?.isDisabled ? "Enable" : "Disable"}
              style={{ marginLeft: 6 }}
            >
              {selected.userId?.isDisabled
                ? "Enable Therapist"
                : "Disable Therapist"}
            </button>
            <button
              className={`ml-2 text-xs px-2 py-1 rounded border ${
                selected.isPanelAccessible
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
              onClick={() =>
                handleTogglePanelAccess(
                  selected._id,
                  !selected.isPanelAccessible
                )
              }
              disabled={loading}
              title={selected.isPanelAccessible ? "Revoke" : "Grant"}
              style={{ marginLeft: 6 }}
            >
              {selected.isPanelAccessible
                ? "Revoke Panel Access"
                : "Grant Panel Access"}
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
      editTherapist.userId && typeof editTherapist.userId.isDisabled === "boolean"
        ? editTherapist.userId.isDisabled
        : typeof editTherapist.isDisabled === "boolean"
        ? editTherapist.isDisabled
        : false;
    const panelAccess =
      editTherapist.userId && typeof editTherapist.isPanelAccessible === "boolean"
        ? editTherapist.isPanelAccessible
        : typeof editTherapist.panelAccess === "boolean"
        ? editTherapist.panelAccess
        : false;
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
            <h2 className="text-lg font-bold mb-3 text-center">
              Edit Therapist
            </h2>
            <div className="mb-3">
              <label className="block text-sm mb-1 font-semibold text-slate-600">
                Therapist ID
              </label>
              <input
                className="w-full border px-2 py-1 rounded bg-slate-100 text-slate-600"
                value={editTherapist.therapistId}
                readOnly
              />
            </div>
            <div className="mb-3 flex gap-6">
              <div className="flex items-center gap-2">
                <span className="font-medium text-xs text-slate-500">
                  Status:{" "}
                </span>
                <span
                  className={`px-2 py-0.5 inline-block rounded-full text-xs font-bold ${
                    isDisabled
                      ? "bg-red-200 text-red-800"
                      : "bg-green-200 text-green-800"
                  }`}
                >
                  {isDisabled ? "Disabled" : "Enabled"}
                </span>
                <button
                  className={`ml-2 text-xs rounded px-2 py-1 border ${
                    isDisabled
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
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
                <span className="font-medium text-xs text-slate-500">
                  Panel Access:{" "}
                </span>
                <span
                  className={`px-2 py-0.5 inline-block rounded-full text-xs font-bold ${
                    panelAccess
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}
                >
                  {panelAccess ? "Granted" : "Revoked"}
                </span>
                <button
                  className={`ml-2 text-xs rounded px-2 py-1 border ${
                    panelAccess
                      ? "bg-red-100 text-red-700"
                      : "bg-green-100 text-green-700"
                  }`}
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
              {FIELD_LIST.map((f) => {
                if (f.key === "therapistId") return null;

                const isDateField =
                  DATE_FIELDS.includes(f.key) || f.type === "date";
                const initialValue =
                  editField[f.key] !== undefined
                    ? editField[f.key]
                    : editTherapist[f.key as keyof typeof editTherapist] ??
                      "";

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
                        {editTherapist[
                          f.key as keyof typeof editTherapist
                        ] &&
                          typeof editTherapist[
                            f.key as keyof typeof editTherapist
                          ] === "string" && (
                            <div className="mt-1 text-xs text-blue-700">
                              <a
                                href={
                                  editTherapist[
                                    f.key as keyof typeof editTherapist
                                  ] as any
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Current: View
                              </a>
                            </div>
                          )}
                      </>
                    ) : isDateField ? (
                      <CalendarInput
                        value={
                          typeof initialValue === "string"
                            ? initialValue
                            : initialValue && initialValue instanceof Date
                            ? initialValue.toISOString().slice(0, 10)
                            : ""
                        }
                        onChange={val =>
                          setEditField(prev => ({
                            ...prev,
                            [f.key]: val,
                          }))
                        }
                        className="w-full border px-2 py-1 rounded"
                        id={`edit-${f.key}`}
                        name={`edit-${f.key}`}
                      />
                    ) : (
                      <input
                        className="w-full border px-2 py-1 rounded"
                        type={f.type || "text"}
                        value={initialValue}
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

  // Add "Manual" column to the table headers
  const tableHeaders: { label: string; key: keyof TherapistProfile | "manualSignUp" | "actions" }[] = [
    { label: "Therapist ID", key: "_id" },
    { label: "Name", key: "name" },
    { label: "Email | Mobile1", key: "email" },
    { label: "Manual", key: "manualSignUp" },
    { label: "Specializations", key: "specializations" },
    { label: "Experience", key: "experienceYears" },
    { label: "Enabled", key: "isDisabled" },
    { label: "Panel Access", key: "panelAccess" },
    { label: "Actions", key: "actions" },
  ];

  // ----------- MAIN RENDER ---------------------
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full "
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Therapists</h1>

      {/* -- Search Control ONLY -- */}
      <form
        onSubmit={handleSearchSubmit}
        autoComplete="off"
        className="flex flex-wrap gap-3 mb-5 items-center"
      >
        <div className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={searchText}
            onChange={handleSearchInputChange}
            placeholder="Search therapists, mobiles, email..."
            className="border rounded-md px-3 py-2 pl-9 text-sm focus:outline-none focus:border-blue-400 w-72"
            name="search"
            autoComplete="off"
          />
          <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-blue-500 text-white text-sm hover:bg-blue-600 transition"
        >
          Search
        </button>
        {searchCommitted && (
          <button
            type="button"
            className="ml-2 px-3 py-2 rounded-md bg-gray-200 text-sm text-gray-700 hover:bg-gray-300 transition"
            onClick={resetFilters}
          >
            Clear Search
          </button>
        )}
      </form>

      {/* -- Table -- */}
      <div className="bg-white border rounded-lg shadow overflow-x-scroll">
        <table className="w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              {tableHeaders.map(th => (
                <th
                  key={th.key}
                  className={`px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider ${
                    [
                      "_id",
                      "name",
                      "email | mobile1",
                      "manualSignUp",
                      "specializations",
                      "experienceYears",
                      "isDisabled",
                      "panelAccess",
                    ].includes(th.key as string)
                      ? "cursor-pointer select-none"
                      : ""
                  }`}
                  onClick={
                    typeof th.key === "string" &&
                    [
                      "_id",
                      "name",
                      "email | mobile1",
                      "manualSignUp",
                      "specializations",
                      "experienceYears",
                      "isDisabled",
                      "panelAccess",
                    ].includes(th.key)
                      ? () => handleTableSort(th.key)
                      : undefined
                  }
                >
                  {th.label}
                  {sortField === th.key ? (
                    <span
                      className={
                        sortOrder === "asc"
                          ? "text-blue-600"
                          : "text-blue-900"
                      }
                    >
                      {sortOrder === "asc" ? " ▲" : " ▼"}
                    </span>
                  ) : null}
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
                  <div className="text-center py-8">
                    No therapists found.
                  </div>
                </td>
              </tr>
            ) : (
              therapists.map((t) => {
                const isDisabled =
                  t.userId &&
                  typeof t.userId.isDisabled === "boolean" &&
                  t.userId.isDisabled;
                const panelAccess =
                  t.userId && typeof t.isPanelAccessible === "boolean"
                    ? t.isPanelAccessible
                    : typeof t.panelAccess === "boolean"
                    ? t.panelAccess
                    : false;
                const manualSignUp =
                  t.userId && typeof t.userId.manualSignUp === "boolean"
                    ? t.userId.manualSignUp
                    : undefined;
                return (
                  <tr key={t._id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono">
                      {t.therapistId}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800 flex items-center gap-2">
                      <FiUser className="text-slate-400" />
                      {t?.userId?.name || t.name || t.email || "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {(t?.userId?.email || t.email) || "-"}
                      <br/>
                      {t.mobile1 || "-"}
                    </td>
                    {/* Manual Sign Up column */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      {manualSignUp === undefined
                        ? "-"
                        : manualSignUp
                        ? "Yes"
                        : "No"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {t.specializations?.trim()
                        ? t.specializations
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {typeof t.experienceYears === "number" &&
                      !isNaN(t.experienceYears)
                        ? `${t.experienceYears} yrs`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isDisabled
                            ? "bg-red-200 text-red-800"
                            : "bg-green-200 text-green-800"
                        }`}
                      >
                        {isDisabled ? "Disabled" : "Enabled"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          panelAccess
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {panelAccess ? "Granted" : "Revoked"}
                      </span>
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

      {/* --- Pagination --- */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2 items-center">
          <button
            className="px-2 py-1 border rounded text-sm text-slate-600"
            onClick={() => gotoPage(1)}
            disabled={page === 1}
          >
            {"<<"}
          </button>
          <button
            className="px-2 py-1 border rounded text-sm text-slate-600"
            onClick={() => gotoPage(page - 1)}
            disabled={page === 1}
          >
            {"<"}
          </button>
          <span className="text-sm text-slate-700">
            Page {page} of {totalPages}
          </span>
          <button
            className="px-2 py-1 border rounded text-sm text-slate-600"
            onClick={() => gotoPage(page + 1)}
            disabled={page === totalPages}
          >
            {">"}
          </button>
          <button
            className="px-2 py-1 border rounded text-sm text-slate-600"
            onClick={() => gotoPage(totalPages)}
            disabled={page === totalPages}
          >
            {">>"}
          </button>
        </div>
      </div>

      {selectedId && selectedProfile && renderTherapistModal()}
      {editTherapist && renderEditModal()}
    </motion.div>
  );
}
