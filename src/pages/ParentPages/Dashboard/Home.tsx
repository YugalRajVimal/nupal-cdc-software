import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiUsers,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface DashboardData {
  childrenCount: number;
  children: any[];
  totalAppointments: number;
  upcomingAppointments: number;
  totalPaid: number;
  totalUnpaid: number;
  totalPayments: number;
  lastPayment: any;
}

const ParentDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/parent/dashboard`);
        setDashboard(res.data.data);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load dashboard"
        );
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="text-center text-red-500 py-10">
        {error || "No dashboard data"}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* TOTAL */}
        <StatCard
          title="TOTAL"
          value={dashboard.childrenCount}
          subtitle="Registered Children"
          icon={<FiUsers />}
          color="blue"
        />

        {/* UPCOMING */}
        <StatCard
          title="UPCOMING"
          value={dashboard.upcomingAppointments}
          subtitle="Scheduled Sessions"
          icon={<FiCalendar />}
          color="purple"
        />

        {/* COMPLETED */}
        <StatCard
          title="COMPLETED"
          value={dashboard.totalAppointments}
          subtitle="Sessions Done"
          icon={<FiCheckCircle />}
          color="green"
        />

        {/* DUE PAYMENT */}
        <StatCard
          title="DUE PAYMENT"
          value={`₹${dashboard.totalUnpaid || 0}`}
          subtitle={`${dashboard.totalUnpaid ? 1 : 0} Pending Invoices`}
          icon={<FiAlertCircle />}
          color="red"
        />
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Sessions */}
        <div className="lg:col-span-2 bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Next Upcoming Sessions
            </h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">
              View All
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-200 rounded-lg h-48 flex flex-col items-center justify-center text-gray-400">
            <FiCalendar className="text-3xl mb-2" />
            <p className="mb-2">No upcoming sessions scheduled.</p>
            <button className="text-blue-600 font-medium hover:underline">
              Book Now
            </button>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Invoices
            </h2>
            <button className="text-blue-600 text-sm font-medium hover:underline">
              View All
            </button>
          </div>

          <div className="h-40 flex items-center justify-center text-gray-400">
            No invoices found.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;

/* ---------- Small Reusable Card ---------- */

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  color,
}: {
  title: string;
  value: any;
  subtitle: string;
  icon: React.ReactNode;
  color: "blue" | "purple" | "green" | "red";
}) => {
  const colorMap: any = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    green: "bg-green-100 text-green-600",
    red: "bg-red-100 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold text-gray-400 mb-2">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-gray-800">
            {value}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {subtitle}
          </p>
        </div>

        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center ${colorMap[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
};
