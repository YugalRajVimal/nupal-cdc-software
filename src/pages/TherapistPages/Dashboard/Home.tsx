import  { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUser,
} from "react-icons/fi";

// Dashboard data types based on correct API structure
type UpcomingSessionDetail = {
  date: string;
  slotTime: string;
  childrenName: string;
  childrenId: string;
  therapyTypeName: string;
  appointmentId: string;
  sessionId: string;
};

type DashboardData = {
  totalAppointments: number;
  totalSessions: number;
  upcomingSessions: number;
  checkedInSessions: number;
  totalEarnings: number;
  upcomingSessionDetails: UpcomingSessionDetail[];
};

function getAuthToken() {
  const token = localStorage.getItem("therapist-token");
  return token;
}

export default function TherapistDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Today's date in YYYY-MM-DD
  const todayDateStr = (() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  })();

  // Human readable today's date
  const todayPretty = (() => {
    const today = new Date();
    return today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  })();

  // Use VITE_API_URL environment variable for API root
  const apiBaseUrl = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getAuthToken();
        const resp = await fetch(
          `${apiBaseUrl}/api/therapist/dashboard`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `${token}` : "",
            },
            method: "GET",
          }
        );
        if (!resp.ok) {
          throw new Error(
            `Failed to fetch dashboard data: ${resp.status} ${resp.statusText}`
          );
        }
        const data = await resp.json();
        console.log("Dashboard API data:", data);

        // The dashboard data comes as { success: true, data: <dashboardData> }
        if (
          !data ||
          typeof data !== "object" ||
          data.success !== true ||
          typeof data.data !== "object" ||
          typeof data.data.totalAppointments !== "number" ||
          typeof data.data.totalSessions !== "number" ||
          typeof data.data.upcomingSessions !== "number" ||
          typeof data.data.checkedInSessions !== "number" ||
          typeof data.data.totalEarnings !== "number" ||
          !Array.isArray(data.data.upcomingSessionDetails)
        ) {
          throw new Error(
            data?.message ||
              "Dashboard API returned error or malformed response."
          );
        }
        setDashboardData(data.data);
      } catch (err: any) {
        setError(
          err?.message ||
            "An error occurred while loading the dashboard data."
        );
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    // intentionally omitting apiBaseUrl from deps so that it only runs on mount
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return (
      <>
        <PageMeta title="Nupal CDC" description="Therapist Dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col items-center">
          <span className="text-indigo-600 text-lg font-semibold mb-4">Loading dashboard...</span>
          <div className="loader-border animate-spin w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full" />
        </div>
      </>
    );
  }
  if (error) {
    return (
      <>
        <PageMeta title="Nupal CDC" description="Therapist Dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-14 flex flex-col items-center">
          <span className="text-red-500 font-semibold mb-3">Error loading dashboard:</span>
          <pre className="text-sm bg-gray-100 px-4 py-2 rounded border border-red-100 text-gray-700">{error}</pre>
        </div>
      </>
    );
  }
  if (!dashboardData) {
    return null;
  }

  // Only sessions that match today's date
  const todaysSessions = dashboardData.upcomingSessionDetails.filter(
    (s) => s.date === todayDateStr
  );

  return (
    <>
      <PageMeta title="Nupal CDC" description="Therapist Dashboard" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Dashboard Overview
            </h1>
            <p className="text-sm text-gray-500">
              Welcome back, Therapist User
            </p>
          </div>
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            ● Status: Active
          </span>
        </div>

        {/* Stats Section */}
        {/* Top Stats Row: Two cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
          {/* Total Appointments */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-500 to-primary-600 text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Total Appointments</p>
                <h2 className="text-4xl font-bold mt-2">
                  {dashboardData.totalAppointments}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-white/20 rounded-full">
                  Unique Appointments
                </span>
              </div>
              <FiUser className="text-3xl opacity-90" />
            </div>
          </div>
          {/* Total Sessions */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-400 text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Total Sessions</p>
                <h2 className="text-4xl font-bold mt-2">
                  {dashboardData.totalSessions}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-white/20 rounded-full">
                  Lifetime Total
                </span>
              </div>
              <FiCalendar className="text-3xl opacity-90" />
            </div>
          </div>
        </div>
        {/* Bottom Stats Row: Next three cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Upcoming Sessions */}
          <div className="p-6 rounded-xl border-2 border-orange-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Upcoming Sessions</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {dashboardData.upcomingSessions}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Scheduled for future
                </p>
              </div>
              <FiClock className="text-3xl text-orange-500" />
            </div>
          </div>
          {/* Checked In Sessions */}
          <div className="p-6 rounded-xl border-2 border-green-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Checked-In Sessions</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {dashboardData.checkedInSessions}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Marked as attended
                </p>
              </div>
              <FiCheckCircle className="text-3xl text-green-500" />
            </div>
          </div>
          {/* Earnings */}
          <div className="p-6 rounded-xl border-2 border-blue-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Est. Earnings</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  ₹{dashboardData.totalEarnings}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Generated Revenue
                </p>
              </div>
              <FiDollarSign className="text-3xl text-blue-500" />
            </div>
          </div>
        </div>

        {/* Main Content - Today's & Upcoming Schedule */}
        <div className="grid grid-cols-1 ">
          {/* Today's Schedule */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="font-semibold text-gray-800 mb-1">
              Today’s Schedule
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {todayPretty}
            </p>

            {todaysSessions.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg h-40 flex flex-col items-center justify-center text-gray-400">
                <FiCalendar className="text-3xl mb-2" />
                <p>No sessions scheduled for today.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full border rounded-xl bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Time</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Child</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Therapy</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Booking ID</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Session ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysSessions.map((session, idx) => (
                      <tr key={session.appointmentId + session.slotTime + idx} className="border-t">
                        <td className="py-2 px-3">{session.slotTime}</td>
                        <td className="py-2 px-3">
                          {session.childrenName}{" "}
                          <span className="text-xs text-gray-400">({session.childrenId})</span>
                        </td>
                        <td className="py-2 px-3">{session.therapyTypeName}</td>
                        <td className="py-2 px-3">{session.appointmentId}</td>
                        <td className="py-2 px-3 text-xs text-gray-500 break-all">
                          {session.sessionId
                            ? session.sessionId
                            : <span className="text-gray-300 italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Upcoming Sessions Table */}
          <div className="bg-white rounded-xl w-full shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-2">
              Upcoming Sessions
            </h3>
            {dashboardData.upcomingSessionDetails.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                <p>No upcoming sessions.</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full border rounded-xl bg-white">
                  <thead>
                    <tr>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Session ID</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Date</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Time</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Child</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Therapy</th>
                      <th className="py-2 px-3 text-left text-gray-600 font-semibold">Booking ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.upcomingSessionDetails.map((session, idx) => (
                      <tr key={session.appointmentId + session.date + session.slotTime + idx} className="border-t">
                        <td className="py-2 px-3 text-xs text-gray-500 break-all">
                          {session.sessionId
                            ? session.sessionId
                            : <span className="text-gray-300 italic">—</span>}
                        </td>
                        <td className="py-2 px-3">{session.date}</td>
                        <td className="py-2 px-3">{session.slotTime}</td>
                        <td className="py-2 px-3">
                          {session.childrenName}{" "}
                          <span className="text-xs text-gray-400">({session.childrenId})</span>
                        </td>
                        <td className="py-2 px-3">{session.therapyTypeName}</td>
                        <td className="py-2 px-3">{session.appointmentId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
