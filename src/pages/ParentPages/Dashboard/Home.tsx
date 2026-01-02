import React, { useEffect, useState } from "react";
import axios from "axios";
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

interface Child {
  _id: string;
  fullName?: string;
  name?: string;
  [key: string]: any;
}

interface DashboardData {
  childrenCount: number;
  children: Child[];
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
        // Axios wraps errors
        const msg =
          err?.response?.data?.error ||
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load dashboard.";
        setError(msg);
      }
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (error)
    return (
      <div style={{ color: "red" }}>
        Error: {error}
      </div>
    );

  if (!dashboard) return <div>No dashboard data found.</div>;

  return (
    <div>
      <h2>Parent Dashboard</h2>
      <div>
        <strong>Children Count:</strong> {dashboard.childrenCount}
      </div>
      <div>
        <strong>Children:</strong>
        <ul>
          {dashboard.children.map((child) => (
            <li key={child._id}>
              {child.fullName || child.name || "Unknown Name"}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Total Appointments:</strong> {dashboard.totalAppointments}
      </div>
      <div>
        <strong>Upcoming Appointments:</strong> {dashboard.upcomingAppointments}
      </div>
      <div>
        <strong>Total Paid:</strong> {dashboard.totalPaid}
      </div>
      <div>
        <strong>Total Unpaid:</strong> {dashboard.totalUnpaid}
      </div>
      <div>
        <strong>Total Payments:</strong> {dashboard.totalPayments}
      </div>
      <div>
        <strong>Last Payment:</strong>{" "}
        {dashboard.lastPayment
          ? JSON.stringify(dashboard.lastPayment)
          : "No payments found"}
      </div>
    </div>
  );
};

export default ParentDashboard;