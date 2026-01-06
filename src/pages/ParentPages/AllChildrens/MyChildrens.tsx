import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FiUser, FiPhone, FiUsers, FiGift, FiMail, FiMapPin, FiInfo, FiHash } from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type ChildType = {
  _id: string;
  patientId?: string;
  name: string;
  gender?: string;
  childDOB?: string;
  fatherFullName?: string;
  motherFullName?: string;
  parentEmail?: string;
  mobile1?: string;
  mobile2?: string;
  address?: string;
  areaName?: string;
  diagnosisInfo?: string;
  package?: string;
  plannedSessionsPerMonth?: string;
  remarks?: string;
  // Add more fields if any based on backend
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const MyChildrens: React.FC = () => {
  const [children, setChildren] = useState<ChildType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/api/parent/childrens`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        setChildren(Array.isArray(data?.data) ? data.data : []);
      })
      .catch(() => setChildren([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen p-8"
    >
      <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FiUsers className="text-blue-600 text-2xl" /> My Children
      </h1>
      <div className="text-slate-500 font-medium mb-7">
        View basic & contact information for your children.
      </div>

      {loading ? (
        <div className="text-center text-slate-400">Loading...</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[950px]">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
              <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiUser /> Name</div></th>

                <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiHash /> Patient ID</div></th>
                <th className="px-4 py-3 text-left">Gender</th>
                <th className="px-4 py-3 text-left">DOB</th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiUsers /> Parents</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiPhone /> Mobile</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiGift /> Package</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiMail /> Email</div></th>
                <th className="px-4 py-3 text-left"><div className="flex items-center gap-1"><FiMapPin /> Address</div></th>
                <th className="px-4 py-3 text-left">Diagnosis/Concern</th>
              </tr>
            </thead>
            <tbody>
              {children.map((child) => (
                <tr key={child._id} className="border-t hover:bg-blue-50/50 transition-all duration-100 text-slate-800">
                    {/* Name */}
                    <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                        <FiUser className="text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{child.name || <span className="italic text-slate-400">N/A</span>}</p>
                        {child.childDOB && (
                          <p className="text-xs text-slate-500">
                            DOB: {formatDate(child.childDOB)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  {/* Patient ID column */}
                  <td className="px-4 py-4 font-semibold text-slate-700">
                    {child.patientId || <span className="italic text-slate-400">N/A</span>}
                  </td>
                
                  <td className="px-4 py-4 text-slate-600">
                    {child.gender || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {formatDate(child.childDOB)}
                  </td>
                  {/* Parents: Father & Mother */}
                  <td className="px-4 py-4 text-slate-600">
                    <div>
                      {child.fatherFullName || child.motherFullName ? (
                        <>
                          {child.fatherFullName && <span className="block">Father: {child.fatherFullName}</span>}
                          {child.motherFullName && <span className="block">Mother: {child.motherFullName}</span>}
                        </>
                      ) : (
                        <span className="italic text-slate-400">N/A</span>
                      )}
                    </div>
                  </td>
                  {/* Mobile numbers */}
                  <td className="px-4 py-4 text-slate-600 flex items-center gap-2">
                    <FiPhone />
                    {child.mobile1 || child.mobile2 || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  {/* Package */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.package || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  {/* Email */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.parentEmail ? (
                      <span className="underline decoration-dashed text-blue-800">{child.parentEmail}</span>
                    ) : (
                      <span className="italic text-slate-400">N/A</span>
                    )}
                  </td>
                  {/* Address + areaName fallback */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.address || child.areaName || <span className="italic text-slate-400">N/A</span>}
                  </td>
                  {/* Diagnosis/Concern */}
                  <td className="px-4 py-4 text-slate-600">
                    {child.diagnosisInfo || <span className="italic text-slate-400">N/A</span>}
                  </td>
                </tr>
              ))}
              {children.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center p-6 text-slate-400">
                    No children found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-8 text-xs text-slate-500 flex items-center gap-2">
        <FiInfo className="inline" />
        For any issue or to update a child's details, please contact the clinic directly.
      </div>
    </motion.div>
  );
};

export default MyChildrens;
