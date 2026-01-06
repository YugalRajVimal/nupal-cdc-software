import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiUser,
} from "react-icons/fi";

export default function TherapistDashboardHome() {
  const [dashboardData, setDashboardData] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    completedAppointments: 0,
    totalEarnings: 0,
  });

  useEffect(() => {
    // Your existing fetch logic stays the same
  // INSERT_YOUR_CODE
    // Example: Replace with real API call to fetch dashboard stats for therapist
    // Placeholder demo: simulate stats after 800ms
    setTimeout(() => {
      setDashboardData({
        totalAppointments: 74,
        upcomingAppointments: 9,
        completedAppointments: 61,
        totalEarnings: 54000,
      });
    }, 800);
  }, []);

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {/* Total Sessions */}
          <div className="p-6 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm opacity-90">Total Sessions</p>
                <h2 className="text-4xl font-bold mt-2">
                  {dashboardData.totalAppointments}
                </h2>
                <span className="inline-block mt-2 px-3 py-1 text-xs bg-white/20 rounded-full">
                  Lifetime Total
                </span>
              </div>
              <FiCalendar className="text-3xl opacity-90" />
            </div>
          </div>

          {/* Upcoming */}
          <div className="p-6 rounded-xl border-2 border-orange-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {dashboardData.upcomingAppointments}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Scheduled for future
                </p>
              </div>
              <FiClock className="text-3xl text-orange-500" />
            </div>
          </div>

          {/* Completed */}
          <div className="p-6 rounded-xl border-2 border-green-400 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <h2 className="text-4xl font-bold text-gray-800 mt-2">
                  {dashboardData.completedAppointments}
                </h2>
                <p className="text-xs text-gray-400 mt-2">
                  Sessions finished
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

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Schedule */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-1">
              Today’s Schedule
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Tuesday, January 6, 2026
            </p>

            <div className="border-2 border-dashed border-gray-200 rounded-lg h-40 flex flex-col items-center justify-center text-gray-400">
              <FiCalendar className="text-3xl mb-2" />
              <p>No appointments scheduled for today.</p>
            </div>
          </div>

          {/* Profile */}
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FiUser className="text-3xl text-gray-400" />
            </div>

            <h4 className="font-semibold text-gray-800">
              Therapist User
            </h4>

            <div className="mt-4 text-sm text-gray-600 space-y-1">
              <p>
                <span className="font-medium">Mobile:</span> 9910198892
              </p>
              <p>
                <span className="font-medium">Join Date:</span> 2025-12-11
              </p>
            </div>

            <button className="mt-6 w-full py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50 transition">
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
