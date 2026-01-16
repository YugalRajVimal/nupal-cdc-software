import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";

// Add the CircularProgress helper/stat component as per @file_context_0
function CircularProgress({
  value,
  total,
  color,
  label,
}: {
  value: number;
  total: number;
  color?: string;
  label?: string;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;
  const colorClass =
    color === "violet"
      ? "stroke-violet-500 text-violet-600"
      : color === "red"
      ? "stroke-red-500 text-red-600"
      : color === "gray"
      ? "stroke-gray-400 text-gray-600"
      : "stroke-blue-500 text-blue-600";
  return (
    <div className="relative flex flex-col items-center h-24 w-24">
      <svg className="h-24 w-24" viewBox="0 0 36 36">
        <circle
          className="text-gray-200"
          strokeWidth="3"
          stroke="currentColor"
          fill="transparent"
          r="16"
          cx="18"
          cy="18"
        />
        <circle
          className={colorClass + " transition-all duration-500"}
          strokeWidth="3"
          strokeDasharray="100, 100"
          strokeDashoffset={100 - percent}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r="16"
          cx="18"
          cy="18"
        />
      </svg>
      <span className="absolute inset-0 flex justify-center items-center text-base font-bold text-slate-700 select-none">
        {percent}%
      </span>
      {label && (
        <span className={`mt-1 text-xs font-medium ${colorClass.split(" ")[1]}`}>
          {label}
        </span>
      )}
    </div>
  );
}

interface DashboardData {
  activeChildren: number;
  activeTherapists: number;
  totalPendingAppointments: number;
  todaysTotalAppointments: number;
  todaysPendingAppointments: number;
  todaysDoneAppointments: number;
  pendingPayments: number;
  pendingTasks: number;
  pendingBookingRequests: number;
  pendingSessionEditRequests: number;
}

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Always ensure a single trailing slash between API_URL and path
    const url =
      (API_URL ? API_URL.replace(/\/+$/, "") : "") +
      "/api/admin/bookings/overview";

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to fetch overview data");
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setDashboardData(json.data);
        } else {
          throw new Error(json.message || "Invalid dashboard response");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageMeta
        title="Nupal CDC"
        description="Admin and Sub-Admin Panel for Nupal CDC"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-brand-700 tracking-tight mb-1">
            Welcome, Admin!
          </h1>
          <p className="text-slate-500 text-sm">
            Get a quick overview and manage daily operations at Nupal CDC.
          </p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
            {error}
          </div>
        ) : (
          dashboardData && (
            <>
              {/* Overview Cards using CircularProgress */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              <div className="flex flex-col items-center rounded-xl border border-blue-50 bg-blue-50 shadow-lg p-6">
              <span className="text-3xl font-bold text-cyan-700 drop-shadow">
                    {dashboardData.activeChildren}</span>
                  <span className="text-sm text-gray-500">Active Children</span>
                </div>

                
                <div className="flex flex-col items-center rounded-xl border border-cyan-200 bg-pink-50 shadow-lg p-6">
                <span className="text-3xl font-bold text-cyan-700 drop-shadow">{dashboardData.activeTherapists}</span>
                  <span className="text-sm text-gray-500">Active Therapists</span>
                </div>
                {/* <div className="flex flex-col items-center bg-yellow-50 rounded-xl shadow border p-6">
                  <CircularProgress value={dashboardData.totalPendingAppointments} total={dashboardData.todaysTotalAppointments} color="gray" label="Pending Appts" />
                  <span className="mt-3 text-yellow-700 text-xl font-semibold">{dashboardData.totalPendingAppointments}</span>
                  <span className="text-sm text-gray-500">Pending Appts</span>
                </div> */}
               <div className="flex flex-col items-center rounded-xl border border-cyan-200 bg-red-50 shadow-lg p-6">
               <span className="text-3xl font-bold text-cyan-700 drop-shadow">{dashboardData.pendingPayments}</span>
                  <span className="text-sm text-gray-500">Pending Payments</span>
                </div>
              </div>
            
              {/* Other pending items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-gray-100/90 shadow-lg p-6">
                  <span className="text-3xl font-bold text-gray-700 drop-shadow">
                    {dashboardData.pendingTasks}
                  </span>
                  <span className="text-gray-700 font-medium">Pending Tasks</span>

                </div>
                <div className="flex flex-col items-center rounded-xl border border-fuchsia-200 bg-fuchsia-100/90 shadow-lg p-6">
                  <span className="text-3xl font-bold text-fuchsia-700 drop-shadow">
                    {dashboardData.pendingBookingRequests}
                  </span>
                  <span className="text-gray-700 font-medium">Pending Booking Requests</span>

                </div>
                <div className="flex flex-col items-center rounded-xl border border-cyan-200 bg-cyan-100/90 shadow-lg p-6">
                  <span className="text-3xl font-bold text-cyan-700 drop-shadow">
                    {dashboardData.pendingSessionEditRequests}
                  </span>
                  <span className="text-gray-700 font-medium">Pending Session Edit Requests</span>

                </div>
              </div>
                {/* Today's Appointments breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
                {/* Today's Total Appointments */}
                <div className="flex flex-col items-center rounded-xl border border-violet-200 bg-violet-100/90 shadow-lg p-6">
                  <CircularProgress
                    value={dashboardData.todaysTotalAppointments}
                    total={dashboardData.todaysTotalAppointments}
                    color="violet"
                  />
                  <span className="mt-3 text-violet-700 font-bold text-2xl">
                    {dashboardData.todaysTotalAppointments}
                  </span>
                  <span className="text-gray-700 text-sm font-medium mt-1">Today's Total Appointments</span>
                </div>
                {/* Today's Pending Appointments */}
                <div className="flex flex-col items-center rounded-xl border border-orange-200 bg-red-100/90 shadow-lg p-6">
                  <CircularProgress
                    value={dashboardData.todaysPendingAppointments}
                    total={dashboardData.todaysTotalAppointments}
                    color="gray"
                  />
                  <span className="mt-3 text-orange-700 font-bold text-2xl">
                    {dashboardData.todaysPendingAppointments}
                  </span>
                  <span className="text-gray-700 text-sm font-medium mt-1">Today's Pending</span>
                </div>
                {/* Today's Done Appointments */}
                <div className="flex flex-col items-center rounded-xl border border-green-200 bg-pink-100/90 shadow-lg p-6">
                  <CircularProgress
                    value={dashboardData.todaysDoneAppointments}
                    total={dashboardData.todaysTotalAppointments}
                    color="green"
                  />
                  <span className="mt-3 text-green-700 font-bold text-2xl">
                    {dashboardData.todaysDoneAppointments}
                  </span>
                  <span className="text-gray-700 text-sm font-medium mt-1">Today's Done</span>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}

// interface StatCardProps {
//   label: string;
//   value: number;
//   color: string;
//   icon?: React.ReactNode;
// }

// function StatCard({ label, value, color, icon }: StatCardProps) {
//   return (
//     <div
//       className="
//         bg-white rounded-xl border shadow-sm p-5
//         hover:shadow-md hover:-translate-y-0.5
//         transition-all cursor-pointer
//       "
//     >
//       <div className="flex items-center justify-between mb-3">
//         <span className="text-sm text-gray-500 font-medium">{label}</span>
//         {icon}
//       </div>

//       <div className={`text-3xl font-bold ${color}`}>
//         {value}
//       </div>
//     </div>
//   );
// }
