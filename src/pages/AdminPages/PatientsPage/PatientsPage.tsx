import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiPhone, FiEdit, FiCalendar, FiTrash2 } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type Patient = {
  _id: string;
  patientId?: string;
  name?:string,
  childFullName: string;
  gender?: string;
  childDOB?: string;
  userId?: {
    email?: string;
    name?: string;
  };
  mobile1?: string;
  mobile2?: string;
  diagnosisInfo?: string;
  areaName?: string;
  address?: string;
  [key: string]: any;
};

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [editPatient, setEditPatient] = useState<Patient | null>(null);
  const [editForm, setEditForm] = useState<{ [key: string]: any }>({});
  const [editLoading, setEditLoading] = useState(false);

  // Fetch all patients
  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/admin/patients`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setPatients(data.patients || []);
      })
      .catch((err) => {
        alert("Failed to fetch patients: " + err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  // Edit Patient handler
  const handleEdit = (patient: Patient) => {
    setEditPatient(patient);
    setEditForm({
      childFullName: patient.childFullName || "",
      gender: patient.gender || "",
      childDOB: patient.childDOB || "",
      mobile1: patient.mobile1 || "",
      mobile2: patient.mobile2 || "",
      areaName: patient.areaName || "",
      address: patient.address || "",
      diagnosisInfo: patient.diagnosisInfo || "",
      remarks: patient.remarks || "",
      // Do NOT include patientId since it is non-editable
    });
  };

  // Save Edited Patient (PUT)
  const handleEditSave = async () => {
    if (!editPatient) return;
    setEditLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/patients/${editPatient._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
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
      setEditPatient(null);
    } catch (err: any) {
      alert("Update failed: " + (err?.message || err));
    }
    setEditLoading(false);
  };

  // Delete Patient (DELETE)
  const handleDelete = async (patient: Patient) => {
    if (!window.confirm(`Delete patient "${patient.childFullName}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/patients/${patient._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const msg = await res.text();
        alert("Failed to delete: " + msg);
        return;
      }
      setPatients((pats) => pats.filter((p) => p._id !== patient._id));
    } catch (err: any) {
      alert("Delete failed: " + (err?.message || err));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Patients</h1>

      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-4 py-3 text-left">PatientID</th>
                <th className="px-4 py-3 text-left">Patient</th>
                <th className="px-4 py-3 text-left">Diagnosis/Concern</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p._id} className="border-t">
                  {/* Patient ID column, non-editable */}
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {p.patientId || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                        <FiUser className="text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{p.name}</p>
                        {p.childDOB && (
                          <p className="text-xs text-slate-500">
                            DOB: {new Date(p.childDOB).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {p.diagnosisInfo || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-600 flex items-center gap-2">
                    <FiPhone /> {p.mobile1 || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      {/* Example action: Book Session */}
                      <button className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700">
                        <FiCalendar /> Book Session
                      </button>
                     
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100"
                        onClick={() => handleEdit(p)}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(p)}
                        title="Delete"
                      >
                        <FiTrash2 /> Delete
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

      {/* Edit Modal */}
      {editPatient && (
        <div className="fixed z-50 inset-0 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-lg text-slate-400 hover:text-red-500"
              onClick={() => setEditPatient(null)}
            >
              &times;
            </button>
            <h2 className="text-lg font-bold mb-4">Edit Patient</h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleEditSave();
              }}
              className="space-y-4"
            >
              {/* Show Patient ID - not editable */}
              <div>
                <label className="block mb-1 text-sm font-medium">Patient ID</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                  value={editPatient.patientId || ""}
                  readOnly
                  disabled
                  tabIndex={-1}
                  style={{ opacity: 1 }}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Name</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.childFullName}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    childFullName: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Gender</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.gender}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    gender: e.target.value
                  }))}
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">DOB</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.childDOB?.slice?.(0,10) || ""}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    childDOB: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Mobile</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.mobile1}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    mobile1: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Area</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.areaName}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    areaName: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Address</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.address}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    address: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Diagnosis/Concern</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={editForm.diagnosisInfo}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    diagnosisInfo: e.target.value
                  }))}
                />
              </div>
              <div>
                <label className="block mb-1 text-sm font-medium">Remarks</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={2}
                  value={editForm.remarks}
                  onChange={e => setEditForm(f => ({
                    ...f,
                    remarks: e.target.value
                  }))}
                />
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded border"
                  onClick={() => setEditPatient(null)}
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded text-white ${editLoading ? "bg-blue-300" : "bg-blue-600 hover:bg-blue-700"}`}
                  disabled={editLoading}
                >
                  {editLoading ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
