import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiHash,
  FiCheckCircle,
  FiCalendar,
} from "react-icons/fi";

// API endpoint
const API_BASE = import.meta.env.VITE_API_URL;

function formatShortDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

// Group appointments by appointmentId
function groupByAppointmentId(appointments: any[]): Record<string, any[]> {
  const grouped: Record<string, any[]> = {};
  appointments.forEach((app) => {
    if (!grouped[app.appointmentId]) {
      grouped[app.appointmentId] = [];
    }
    grouped[app.appointmentId].push(app);
  });
  return grouped;
}

const TherapistMyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const therapistToken = localStorage.getItem("therapist-token");
        const response = await axios.get(
          `${API_BASE}/api/therapist/sessions`,
          {
            headers: {
              Authorization: therapistToken ? `${therapistToken}` : "",
            },
          }
        );
        if (response.data && response.data.success) {
          setAppointments(response.data.data);
        } else {
          setError("Failed to fetch appointments");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) {
    return <div className="py-6">Loading sessions...</div>;
  }
  if (error) {
    return <div className="py-6 text-red-600">{error}</div>;
  }

  // Group by appointmentId for display
  const grouped = groupByAppointmentId(appointments);

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 py-8">
      <h2 className="text-2xl font-semibold mb-6 text-blue-800 flex items-center gap-2">
        <FiCalendar className="text-blue-400" /> My Sessions ({appointments.length})
      </h2>
      {Object.keys(grouped).length === 0 ? (
        <div className="text-slate-600">No sessions found.</div>
      ) : (
        <div className="space-y-10">
          {Object.entries(grouped).map(([appointmentId, records]) => {
            const first = records[0];
            const patient = first?.patient || {};
            return (
              <div key={appointmentId} className="border rounded-lg shadow bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FiHash className="text-blue-400" />
                  <span className="font-mono text-lg font-semibold text-blue-900">
                    {appointmentId}
                  </span>
                  <span className="ml-4 px-2 py-1 rounded bg-blue-50 text-blue-800 font-medium text-sm">
                    {patient.name || "-"}
                  </span>
                  <span className="px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs ml-2">
                    ID: {patient.patientId || "-"}
                  </span>
                </div>
                {/* Session Table - makes this the focus and bigger */}
                <div className="overflow-x-auto">
                  <table className="min-w-[640px] w-full border-collapse text-base">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          #
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          Date
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          Time Slot
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-left">
                          Therapy Type
                        </th>
                        <th className="px-4 py-3 border border-slate-200 bg-slate-100 font-semibold text-center">
                          Checked In
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((rec, idx) => (
                        <tr
                          key={
                            rec.session?._id ||
                            rec.session?.date + rec.session?.slotId ||
                            idx
                          }
                          className="hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 border border-slate-200 text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-blue-900 font-medium">
                            {formatShortDate(rec.session?.date)}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 font-mono">
                            <span className="bg-slate-100 rounded px-2">
                              {rec.session?.slotId || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-3 border border-slate-200">
                            {rec.therapyType?.name || "-"}
                          </td>
                          <td className="px-4 py-3 border border-slate-200 text-center">
                            {rec.session?.isCheckedIn ? (
                              <span className="flex items-center gap-1 text-green-600 justify-center font-medium">
                                <FiCheckCircle className="inline" /> Yes
                              </span>
                            ) : (
                              <span className="text-slate-400">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TherapistMyAppointments;