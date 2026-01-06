import { useEffect, useState } from "react";
import { FiCalendar, FiUser } from "react-icons/fi";
import { motion } from "framer-motion";
import dayjs from "dayjs";
import PageMeta from "../../../components/common/PageMeta";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

type SessionType = {
  date: string;
  time?: string;
  status?: string;
  notes?: string;
};

type AppointmentType = {
  _id: string;
  appointmentId?: string;
  discountInfo?: any;
  package?: {
    _id: string;
    name: string;
    sessionCount: number;
    costPerSession: number;
    totalCost: number;
  };
  patient?: {
    _id: string;
    userId: string;
    patientId: string;
    gender: string;
    childDOB: string;
    name: string;
    [key: string]: any;
  };
  sessions: SessionType[];
  therapy?: string;
  paymentStatus?: string;
  therapistAmount?: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
};

// Helper to format date
function formatDate(date?: string) {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return dayjs(d).format("DD MMM YYYY");
}

export default function TherapistMyAppointments() {
  const [appointments, setAppointments] = useState<AppointmentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal: details
  const [viewAppointment, setViewAppointment] = useState<AppointmentType | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const token =
      localStorage.getItem("therapist-token") ||
      localStorage.getItem("token") ||
      "";
    fetch(`${API_BASE_URL}/api/therapist/appointments`, {
      headers: token ? { Authorization: token } : {},
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        const raw = await res.json();
        if (raw && raw.success && Array.isArray(raw.data)) {
          setAppointments(raw.data);
        } else {
          setAppointments([]);
          setError("Failed to fetch appointments.");
        }
      })
      .catch(() => {
        setError("Error fetching appointments.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageMeta
        title="My Appointments"
        description="View all appointments for the therapist"
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen p-8 "
      >
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          My Appointments
        </h1>
        {loading ? (
          <div className="text-center text-slate-400">Loading...</div>
        ) : error ? (
          <div className="mb-4 text-center">
            <span className="text-red-500">{error}</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">Appointment ID</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Patient ID</th>
                  <th className="px-4 py-3 text-left">Therapy</th>
                  <th className="px-4 py-3 text-left">Package</th>
                  <th className="px-4 py-3 text-left">Payment Status</th>
                  <th className="px-4 py-3 text-left">Therapist Amount</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-center"># Sessions</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-slate-400 text-center">
                      No appointments found.
                    </td>
                  </tr>
                )}
                {appointments.map((a) => (
                  <tr key={a._id} className="border-t">
                    <td className="px-4 py-4 font-semibold text-slate-700">
                      {a.appointmentId || a._id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-sky-100 flex items-center justify-center">
                          <FiUser className="text-sky-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {a.patient?.name || <span className="italic text-slate-400">N/A</span>}
                          </p>
                          <p className="text-xs text-slate-500">{a.patient?.gender ? a.patient.gender.charAt(0).toUpperCase() + a.patient.gender.slice(1) : "-"}</p>
                          {a.patient?.childDOB && (
                            <p className="text-xs text-slate-500">
                              DOB: {formatDate(a.patient.childDOB)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {a.patient?.patientId ? (
                        <span className="inline-block rounded bg-blue-50 text-blue-700 px-2 py-1 text-xs font-semibold">
                          {a.patient.patientId}
                        </span>
                      ) : (
                        <span className="italic text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {a.therapy ?? <span className="italic text-slate-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4">
                      {a.package?.name ?? <span className="italic text-slate-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4">
                      {a.paymentStatus === "Paid" ? (
                        <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-700 font-semibold">{a.paymentStatus}</span>
                      ) : a.paymentStatus ? (
                        <span className="inline-block px-2 py-1 rounded bg-orange-50 text-orange-700 font-semibold">{a.paymentStatus}</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-700 font-semibold">Unpaid</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {typeof a.therapistAmount === "number"
                        ? `₹${a.therapistAmount.toFixed(2)}`
                        : <span className="italic text-slate-400">N/A</span>}
                    </td>
                    <td className="px-4 py-4">
                      {formatDate(a.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold">
                      {a.sessions?.length ?? 0}
                    </td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 text-blue-700 shadow-sm text-xs"
                        onClick={() => setViewAppointment(a)}
                      >
                        <FiCalendar className="text-blue-500" /> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {viewAppointment && (
          <div className="fixed z-50 inset-0  bg-black/40 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative animate-[fadeIn_0.15s]">
              <button
                className="absolute top-3 right-4 text-xl text-slate-500 hover:text-red-500"
                onClick={() => setViewAppointment(null)}
              >
                &times;
              </button>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiCalendar className="inline text-blue-500" /> Appointment Details
              </h2>
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Appointment ID</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100 text-gray-600 cursor-not-allowed"
                    value={viewAppointment.appointmentId || viewAppointment._id}
                    readOnly
                    disabled
                    tabIndex={-1}
                    style={{ opacity: 1 }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Package</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={viewAppointment.package?.name ?? ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Therapy</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={viewAppointment.therapy ?? ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Created At</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={formatDate(viewAppointment.createdAt)}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Updated At</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={formatDate(viewAppointment.updatedAt)}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Payment Status</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={viewAppointment.paymentStatus ?? ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium text-slate-700">Therapist Amount</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={
                      typeof viewAppointment.therapistAmount === "number"
                        ? `₹${viewAppointment.therapistAmount.toFixed(2)}`
                        : ""
                    }
                    readOnly
                    disabled
                  />
                </div>
              </div>
              {/* Patient Info */}
              <h3 className="font-semibold mb-2 mt-6 text-blue-900">Patient Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">Name</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={viewAppointment.patient?.name || ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Patient ID</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={viewAppointment.patient?.patientId || ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">Gender</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={viewAppointment.patient?.gender || ""}
                    readOnly
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">DOB</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2 bg-gray-100"
                    value={formatDate(viewAppointment.patient?.childDOB)}
                    readOnly
                    disabled
                  />
                </div>
              </div>
              {viewAppointment.package && (
                <>
                  <h3 className="font-semibold mb-2 mt-6 text-blue-900">Package Info</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                    <div>
                      <label className="block mb-1 text-sm font-medium">Sessions</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                        value={viewAppointment.package?.sessionCount}
                        readOnly
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Cost/Session</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                        value={viewAppointment.package?.costPerSession}
                        readOnly
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-sm font-medium">Total Cost</label>
                      <input
                        type="text"
                        className="w-full border rounded px-3 py-2 bg-gray-100"
                        value={viewAppointment.package?.totalCost}
                        readOnly
                        disabled
                      />
                    </div>
                  </div>
                </>
              )}

              <h3 className="font-semibold mb-2 mt-6 text-blue-900">Sessions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border mb-2">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Time</th>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Array.isArray(viewAppointment.sessions) && viewAppointment.sessions.length > 0) ? (
                      viewAppointment.sessions.map((s, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{s.date ? dayjs(s.date).format("YYYY-MM-DD") : "-"}</td>
                          <td className="px-3 py-2">{s.time || (s.date ? dayjs(s.date).format("HH:mm") : "--")}</td>
                          <td className="px-3 py-2">
                            {s.status === "Completed" ? (
                              <span className="inline-block px-2 py-1 rounded bg-green-50 text-green-700 font-semibold">{s.status}</span>
                            ) : s.status === "Cancelled" ? (
                              <span className="inline-block px-2 py-1 rounded bg-red-50 text-red-700 font-semibold">{s.status}</span>
                            ) : (
                              <span className="inline-block px-2 py-1 rounded bg-blue-50 text-blue-700 font-semibold">{s.status || "Scheduled"}</span>
                            )}
                          </td>
                          <td className="px-3 py-2">{s.notes || "-"}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-3 py-5 text-center text-slate-400">No session data</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  className="px-5 py-2 rounded border font-semibold"
                  onClick={() => setViewAppointment(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
}
