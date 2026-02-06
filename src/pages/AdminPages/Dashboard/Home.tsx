import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface PerDayStat {
  date: string;
  sessionsCompleted?: number;
  bookingsCreated?: number;
}

interface DashboardData {
  activeChildren: number;
  activeTherapists: number;
  totalSessions: number;
  todaysTotalSessions: number;
  todaysPendingSessions: number;
  todaysCompletedSessions: number;
  allTimePendingPayments: number;
  thisMonthsPendingPayments: number;
  pendingTasks: number;
  pendingBookingRequests: number;
  pendingSessionEditRequests: number;
  pendingTherapistManualSignUp: number;
  sessionsCompletedPerDay: PerDayStat[];
  bookingsCreatedPerDay: PerDayStat[];
}

const API_URL = import.meta.env.VITE_API_URL;

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Helper: get value as numeric (or undefined/NaN), fallback for non-numeric "--"
  function getValueAsNumber(val: any) {
    if (val === "--" || val === undefined || val === null) return undefined;
    const num = typeof val === "string" ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : num;
  }

  // Stat card configs
  const statCardConfig = [
    {
      title: "PENDING PAYMENTS (ALL TIME)",
      key: "allTimePendingPayments",
      value: dashboardData?.allTimePendingPayments ?? "--",
      sub: dashboardData
        ? `${dashboardData.allTimePendingPayments} pending`
        : "",
      color: "border-blue-400",
    },
    {
      title: "PENDING PAYMENTS (THIS MONTH)",
      key: "thisMonthsPendingPayments",
      value: dashboardData?.thisMonthsPendingPayments ?? "--",
      sub: dashboardData
        ? `${dashboardData.thisMonthsPendingPayments} pending this month`
        : "",
      color: "border-blue-600",
    },
    {
      title: "PENDING LEADS / TASKS",
      key: "pendingTasks",
      value: dashboardData?.pendingTasks ?? "--",
      sub: null,
      color: "border-green-400",
    },
    {
      title: "SESSIONS STATS",
      key: "todaysPendingSessions",
      value:
        dashboardData?.todaysPendingSessions !== undefined
          ? dashboardData.todaysPendingSessions
          : "--",
      sub: dashboardData
        ? `Pending Today: ${dashboardData.todaysPendingSessions}, All: ${dashboardData.totalSessions}, Total Today: ${dashboardData.todaysTotalSessions}, Done: ${dashboardData.todaysCompletedSessions}`
        : "",
      color: "border-yellow-400",
    },
  ];

  const sessionsPerDay =
    dashboardData?.sessionsCompletedPerDay?.map(({ date, sessionsCompleted }) => ({
      date,
      value: sessionsCompleted,
    })) ?? [];

  const bookingsPerDay =
    dashboardData?.bookingsCreatedPerDay?.map(({ date, bookingsCreated }) => ({
      date,
      value: bookingsCreated,
    })) ?? [];

  // Utility: Show green circle if card value is 0, else red, at right and center vertically
  function StatusCircle({ value }: { value: any }) {
    const numValue = getValueAsNumber(value);
    const isGreen = numValue === 0;
    return (
      <span
        className={`inline-block ml-2 w-5 h-5 opacity-50 rounded-full ${
          isGreen ? "bg-green-500" : "bg-red-500"
        }`}
        style={{
          verticalAlign: "middle",
        }}
        aria-label={isGreen ? "No pending" : "Has pending"}
      ></span>
    );
  }

  return (
    <div className="w-full">
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
                  className={`bg-white rounded-xl border-l-4 ${card.color} p-5 shadow-sm flex items-center`}
                >
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-red-600 mb-2">
                      {card.title}
                    </h3>
                    <div className="text-2xl font-bold text-gray-800">
                      {card.value}
                    </div>
                    {card.sub && (
                      <p className="text-sm text-gray-500 mt-1">{card.sub}</p>
                    )}
                  </div>
                  <div className="flex items-center h-full justify-center ml-2">
                    <StatusCircle value={card.value} />
                  </div>
                </div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Left: Daily Check-ins (sessions completed per day) */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-2">Check-Ins Per Day</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sessionsPerDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" name="Sessions Completed" fill="#48bb78" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Right: Bookings Per Day */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-2">Bookings Created Per Day</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={bookingsPerDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Bookings Created"
                        stroke="#3182ce"
                        strokeWidth={3}
                      />
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
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-center">
                    <span className="mr-2">⚠</span>
                    <span>
                      {dashboardData?.pendingBookingRequests ?? "--"} Pending Booking Requests
                    </span>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center">
                    <span className="mr-2">📝</span>
                    <span>
                      {dashboardData?.pendingSessionEditRequests ?? "--"} Pending Session Edit Requests
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 flex items-center">
                    <span className="mr-2">🕑</span>
                    <span>
                      {dashboardData?.pendingTherapistManualSignUp ?? "--"} Pending Therapist Approvals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
