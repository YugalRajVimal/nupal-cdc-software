import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiEdit, FiTrash, FiX, FiCheck } from "react-icons/fi";

// Set your API base url here for packages
const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/super-admin/packages`
  : "/api/super-admin/packages";

type PackageType = {
  _id: string;
  name: string;
  sessionCount: number;
  costPerSession: number;
  totalCost: number;
  createdAt?: string;
  updatedAt?: string;
};

export default function PackagesPage() {
  const [packages, setPackages] = useState<PackageType[]>([]);
  const [loading, setLoading] = useState(true);

  // For adding new package
  const [newPkg, setNewPkg] = useState<{ name: string; sessionCount: string; costPerSession: string }>({
    name: "",
    sessionCount: "",
    costPerSession: "",
  });

  // For editing package
  const [editId, setEditId] = useState<string | null>(null);
  const [editPkg, setEditPkg] = useState<{ name: string; sessionCount: string; costPerSession: string }>({
    name: "",
    sessionCount: "",
    costPerSession: "",
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all packages on mount
  useEffect(() => {
    setLoading(true);
    fetch(API_BASE + "/", {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      }
    })      
      .then(async (res) => {
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || "Failed to fetch packages");
        }
        return res.json();
      })
      .then((data) => {
        // Expecting response to look like: { packages: [...] }
        if (Array.isArray(data.packages)) {
          setPackages(data.packages);
        } else if (Array.isArray(data)) {
          setPackages(data);
        } else {
          setPackages([]);
        }
      })
      .catch((err) => setError(err.message || "Could not fetch packages"))
      .finally(() => setLoading(false));
  }, []);

  // Add a new package
  const addPackage = async () => {
    if (
      !newPkg.name.trim() ||
      !newPkg.sessionCount.trim() ||
      !newPkg.costPerSession.trim()
    )
      return;
    setSubmitting(true);
    setError(null);
    try {
      const sessionCount = Number(newPkg.sessionCount);
      const costPerSession = Number(newPkg.costPerSession);
      if (isNaN(sessionCount) || isNaN(costPerSession)) {
        setError("Session count and cost per session must be numbers");
        setSubmitting(false);
        return;
      }
      const totalCost = sessionCount * costPerSession;
      const res = await fetch(API_BASE + "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: newPkg.name.trim(),
          sessionCount,
          costPerSession,
          totalCost,
        }),
      });
      if (!res.ok) {
        throw new Error("Failed to add package");
      }
      const added = await res.json();
      // Either return the single created package or { package }
      const addedPkg = added.package || added;
      setPackages((prev) => [...prev, addedPkg]);
      setNewPkg({ name: "", sessionCount: "", costPerSession: "" });
    } catch (err: any) {
      setError(err.message || "Could not add package");
    }
    setSubmitting(false);
  };

  // Delete a package by id
  const deletePackage = async (id: string) => {
    if (!window.confirm("Delete this package?")) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete package");
      setPackages((prev) => prev.filter((t) => t._id !== id));
    } catch (err: any) {
      setError(err.message || "Could not delete package");
    }
    setSubmitting(false);
  };

  // Enable edit mode for a package
  const beginEdit = (pkg: PackageType) => {
    setEditId(pkg._id);
    setEditPkg({
      name: pkg.name,
      sessionCount: String(pkg.sessionCount),
      costPerSession: String(pkg.costPerSession),
    });
    setError(null);
  };

  // Cancel inline edit
  const cancelEdit = () => {
    setEditId(null);
    setEditPkg({ name: "", sessionCount: "", costPerSession: "" });
    setError(null);
  };

  // Save edited package
  const saveEdit = async () => {
    if (
      !editId ||
      !editPkg.name.trim() ||
      !editPkg.sessionCount.trim() ||
      !editPkg.costPerSession.trim()
    ) {
      setError("All fields are required");
      return;
    }
    setSubmitting(true);
    try {
      const sessionCount = Number(editPkg.sessionCount);
      const costPerSession = Number(editPkg.costPerSession);
      if (isNaN(sessionCount) || isNaN(costPerSession)) {
        setError("Session count and cost per session must be numbers");
        setSubmitting(false);
        return;
      }
      const totalCost = sessionCount * costPerSession;
      const res = await fetch(`${API_BASE}/${editId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editPkg.name,
          sessionCount,
          costPerSession,
          totalCost,
        }),
      });
      if (!res.ok) throw new Error("Failed to edit package");
      const updated = await res.json();
      const updatedPkg = updated.package || updated;
      setPackages((prev) =>
        prev.map((p) => (p._id === editId ? updatedPkg : p))
      );
      cancelEdit();
    } catch (err: any) {
      setError(err.message || "Could not edit package");
    }
    setSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen  p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6">
        Therapy Packages
      </h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          <input
            value={newPkg.name}
            onChange={(e) => setNewPkg((p) => ({ ...p, name: e.target.value }))}
            placeholder="Package name"
            className="flex-1 min-w-[180px] border rounded px-3 py-2"
            onKeyDown={e => {
              if (e.key === "Enter") addPackage();
            }}
            disabled={submitting}
          />
          <input
            value={newPkg.sessionCount}
            onChange={(e) => setNewPkg((p) => ({ ...p, sessionCount: e.target.value }))}
            placeholder="Session count"
            className="w-32 border rounded px-3 py-2"
            type="number"
            min={1}
            onKeyDown={e => {
              if (e.key === "Enter") addPackage();
            }}
            disabled={submitting}
          />
          <input
            value={newPkg.costPerSession}
            onChange={(e) => setNewPkg((p) => ({ ...p, costPerSession: e.target.value }))}
            placeholder="Cost/session"
            className="w-32 border rounded px-3 py-2"
            type="number"
            min={0}
            onKeyDown={e => {
              if (e.key === "Enter") addPackage();
            }}
            disabled={submitting}
          />
          <button
            onClick={addPackage}
            className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded"
            disabled={submitting}
          >
            <FiPlus /> Add
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-4 py-3 text-left">Package Name</th>
                <th className="px-4 py-3 text-right">Session Count</th>
                <th className="px-4 py-3 text-right">Cost / Session</th>
                <th className="px-4 py-3 text-right">Total Cost</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {packages.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-5 text-center text-slate-500"
                  >
                    No packages found.
                  </td>
                </tr>
              ) : (
                packages.map((pkg) =>
                  editId === pkg._id ? (
                    <tr key={pkg._id} className="border-t bg-yellow-50">
                      <td className="px-4 py-3">
                        <input
                          value={editPkg.name}
                          className="w-full border rounded px-2 py-1"
                          onChange={e =>
                            setEditPkg((p) => ({ ...p, name: e.target.value }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Package name"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          value={editPkg.sessionCount}
                          className="w-20 border rounded px-2 py-1 text-right"
                          type="number"
                          min={1}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              sessionCount: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Sessions"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input
                          value={editPkg.costPerSession}
                          className="w-20 border rounded px-2 py-1 text-right"
                          type="number"
                          min={0}
                          onChange={e =>
                            setEditPkg((p) => ({
                              ...p,
                              costPerSession: e.target.value,
                            }))
                          }
                          onKeyDown={e => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEdit();
                          }}
                          disabled={submitting}
                          placeholder="Cost per session"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {(Number(editPkg.sessionCount) * Number(editPkg.costPerSession)).toLocaleString("en-IN", { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={saveEdit}
                          className="inline-flex items-center gap-1 border border-green-300 text-green-700 px-3 py-1 rounded text-xs"
                          disabled={submitting}
                          title="Save"
                        >
                          <FiCheck /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="inline-flex items-center gap-1 border border-gray-200 text-gray-600 px-3 py-1 rounded text-xs"
                          disabled={submitting}
                          title="Cancel"
                        >
                          <FiX /> Cancel
                        </button>
                      </td>
                    </tr>
                  ) : (
                    <tr key={pkg._id} className="border-t">
                      <td className="px-4 py-3">{pkg.name}</td>
                      <td className="px-4 py-3 text-right">{pkg.sessionCount}</td>
                      <td className="px-4 py-3 text-right">
                        {pkg.costPerSession.toLocaleString("en-IN", { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {pkg.totalCost.toLocaleString("en-IN", { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          className="inline-flex items-center gap-1 border px-3 py-1 rounded text-xs"
                          onClick={() => beginEdit(pkg)}
                          disabled={submitting}
                        >
                          <FiEdit /> Edit
                        </button>
                        <button
                          onClick={() => deletePackage(pkg._id)}
                          className="inline-flex items-center gap-1 border border-red-300 text-red-600 px-3 py-1 rounded text-xs"
                          disabled={submitting}
                        >
                          <FiTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  );
}
