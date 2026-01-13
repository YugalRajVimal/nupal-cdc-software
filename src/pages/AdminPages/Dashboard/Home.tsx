import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";

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
              {/* Grid dashboard blocks */}
              <div className="grid grid-cols-1  gap-6 sm:grid-cols-3 mb-10">
                {/* Active Children - Blue */}
                <div className="rounded-xl border border-blue-200 bg-blue-100/90 shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-6 -right-10 w-32 h-32 bg-blue-200 opacity-40 blur-2xl rounded-full" />
                  </div>
                  <span className="text-gray-700 mt-2 font-medium">Active Children</span>
                  <span className="text-4xl font-bold text-blue-700 drop-shadow">
                    {dashboardData.activeChildren}
                  </span>
                </div>
                {/* Active Therapists - Rose */}
                <div className="rounded-xl border border-pink-200 bg-pink-100/90 shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-6 -right-10 w-32 h-32 bg-pink-200 opacity-40 blur-2xl rounded-full" />
                  </div>
                  <span className="text-gray-700 mt-2 font-medium">Active Therapists</span>
                  <span className="text-4xl font-bold text-pink-700 drop-shadow">
                    {dashboardData.activeTherapists}
                  </span>
                </div>
                {/* Pending Appointments - Yellow */}
                {/* <div className="rounded-xl border border-yellow-200 bg-yellow-100/90 shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-6 -right-10 w-32 h-32 bg-yellow-200 opacity-40 blur-2xl rounded-full" />
                  </div>
                  <span className="text-gray-700 mt-2 font-medium">Pending Appointments</span>
                  <span className="text-4xl font-bold text-yellow-700 drop-shadow">
                    {dashboardData.totalPendingAppointments}
                  </span>
                </div> */}
                {/* Pending Payments - Red */}
                <div className="rounded-xl border border-red-200 bg-red-100/90 shadow-lg p-6 flex flex-col items-start relative overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute -top-6 -right-10 w-32 h-32 bg-red-200 opacity-40 blur-2xl rounded-full" />
                  </div>
                  <span className="text-gray-700 mt-2 font-medium">Pending Payments</span>
                  <span className="text-4xl font-bold text-red-700 drop-shadow">
                    {dashboardData.pendingPayments}
                  </span>
                </div>
              </div>
              {/* Today's Appointments breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                {/* Today's Total Appointments */}
                <div className="rounded-xl border border-violet-200 bg-violet-100/90 shadow-lg p-6 flex flex-col items-start">
                  <span className="text-gray-700 font-medium">Today's Total Appointments</span>
                  <span className="text-3xl font-bold text-violet-700 drop-shadow">
                    {dashboardData.todaysTotalAppointments}
                  </span>
                </div>
                {/* Today's Pending Appointments */}
                <div className="rounded-xl border border-orange-200 bg-orange-100/90 shadow-lg p-6 flex flex-col items-start">
                  <span className="text-gray-700 font-medium">Today's Pending</span>
                  <span className="text-3xl font-bold text-orange-700 drop-shadow">
                    {dashboardData.todaysPendingAppointments}
                  </span>
                </div>
                {/* Today's Done Appointments */}
                <div className="rounded-xl border border-green-200 bg-green-100/90 shadow-lg p-6 flex flex-col items-start">
                  <span className="text-gray-700 font-medium">Today's Done</span>
                  <span className="text-3xl font-bold text-green-700 drop-shadow">
                    {dashboardData.todaysDoneAppointments}
                  </span>
                </div>
              </div>
              {/* Other pending items */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Pending Tasks */}
                <div className="rounded-xl border border-gray-200 bg-gray-100/90 shadow-lg p-6 flex flex-col items-start">
                  <span className="text-gray-700 font-medium">Pending Tasks</span>
                  <span className="text-3xl font-bold text-gray-700 drop-shadow">
                    {dashboardData.pendingTasks}
                  </span>
                </div>
                {/* Pending Booking Requests */}
                <div className="rounded-xl border border-fuchsia-200 bg-fuchsia-100/90 shadow-lg p-6 flex flex-col items-start">
                  <span className="text-gray-700 font-medium">Pending Booking Requests</span>
                  <span className="text-3xl font-bold text-fuchsia-700 drop-shadow">
                    {dashboardData.pendingBookingRequests}
                  </span>
                </div>
                {/* Pending Session Edit Requests */}
                <div className="rounded-xl border border-cyan-200 bg-cyan-100/90 shadow-lg p-6 flex flex-col items-start">
                  <span className="text-gray-700 font-medium">Pending Session Edit Requests</span>
                  <span className="text-3xl font-bold text-cyan-700 drop-shadow">
                    {dashboardData.pendingSessionEditRequests}
                  </span>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </>
  );
}
