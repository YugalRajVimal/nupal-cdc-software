import { useState } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiEdit, FiTrash } from "react-icons/fi";

export default function TherapyTypesPage() {
  const [types, setTypes] = useState<string[]>([
    "Speech Therapy",
    "Occupational Therapy",
    "Behavior Therapy",
  ]);
  const [newType, setNewType] = useState("");

  const addType = () => {
    if (!newType.trim()) return;
    setTypes([...types, newType]);
    setNewType("");
  };

  const deleteType = (type: string) => {
    setTypes(types.filter(t => t !== type));
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Therapy Types</h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex gap-2">
          <input
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            placeholder="Add new therapy type"
            className="flex-1 border rounded px-3 py-2"
          />
          <button onClick={addType} className="flex items-center gap-1 bg-blue-600 text-white px-4 py-2 rounded">
            <FiPlus /> Add
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-3 text-left">Therapy Type</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t} className="border-t">
                <td className="px-4 py-3">{t}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="inline-flex items-center gap-1 border px-3 py-1 rounded text-xs">
                    <FiEdit /> Edit
                  </button>
                  <button onClick={() => deleteType(t)} className="inline-flex items-center gap-1 border border-red-300 text-red-600 px-3 py-1 rounded text-xs">
                    <FiTrash /> Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
