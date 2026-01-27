import  { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
  // Add additional dashboard API fields if needed
}

const API_URL = import.meta.env.VITE_API_URL;

const statCardConfig = [
  {
    getTitle: (_d: DashboardData | null): string => "TO-DO NOTIFICATIONS OF TASKS",
    getValue: (d: DashboardData | null) => (d ? d.pendingTasks : "--"),
    color: "border-green-400",
  },
  {
    getTitle: (_d: DashboardData | null): string => "PENDING PAYMENTS OF ALL-TIME",
    getValue: (d: DashboardData | null) => (d ? d.pendingPayments : "--"),
    sub: (d: DashboardData | null) =>
      d ? `${d.pendingPayments} pending` : "",
    color: "border-blue-400",
  },
  {
    getTitle: () => "PENDING BOOKING REQUESTS",
    getValue: (d: DashboardData | null) => (d ? d.pendingBookingRequests : "--"),
    sub: (d: DashboardData | null) =>
      d ? `Session edit: ${d.pendingSessionEditRequests}` : "",
    color: "border-purple-400",
  },
  {
    getTitle: () => "TODAY'S APPOINTMENTS",
    getValue: (d: DashboardData | null) => (d ? d.todaysTotalAppointments : "--"),
    sub: (d: DashboardData | null) =>
      d
        ? `${d.todaysPendingAppointments} pending, ${d.todaysDoneAppointments} done`
        : "",
    color: "border-yellow-400",
  },
];

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Example/demo chart data (replace with real data if available)
  const barData = [
    { day: "Mon", value: dashboardData?.todaysTotalAppointments ?? 0 },
    { day: "Tue", value: 5 },
    { day: "Wed", value: 6 },
    { day: "Thu", value: 7 },
    { day: "Fri", value: 4 },
    { day: "Sat", value: 8 },
    { day: "Sun", value: 2 },
  ];
  const lineData = [
    { week: "Week 1", value: dashboardData?.todaysDoneAppointments ?? 0 },
    { week: "Week 2", value: 10 },
    { week: "Week 3", value: 15 },
    { week: "Week 4", value: 18 },
  ];

  useEffect(() => {
    setLoading(true);
    setError(null);
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
      <div className="p-6 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              {statCardConfig.map((card, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl border-l-4 ${card.color} p-5 shadow-sm`}
                >
                  <h3 className="text-xs font-bold text-red-600 mb-2">
                    {card.getTitle(dashboardData)}
                  </h3>

                  <div className="text-2xl font-bold text-gray-800">
                    {card.getValue(dashboardData)}
                  </div>

                  {"sub" in card && !!card.sub && card.sub(dashboardData) && (
                    <p className="text-sm text-gray-500 mt-1">{card.sub(dashboardData)}</p>
                  )}

                  <div className="mt-3 text-green-600 text-xs font-semibold">
                    ✔ No Pending Tasks
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Trends */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-1">Revenue Trends</h2>
                <p className="text-xs text-red-600 mb-3">FOR SUPER-ADMIN</p>

                <p className="text-sm text-red-600 mb-2">
                  ADMIN GRAPH: CANCELLED SESSIONS VS COMPLETED SESSIONS
                </p>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Appointment Activity */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-4">Appointment Activity</h2>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Line dataKey="value" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>Active Therapists</span>
                    <span className="font-bold text-blue-600">
                      {dashboardData?.activeTherapists ?? "--"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span>Active Parents</span>
                    <span className="font-bold text-purple-600">
                      {dashboardData?.activeChildren ?? "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-4">System Alerts</h2>

                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    ⚠ {dashboardData?.pendingPayments ?? "3"} Invoices are overdue by more than 7 days.
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                    ⏱ Therapist Sarah Smith has pending availability updates.
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
