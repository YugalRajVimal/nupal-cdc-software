import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiUsers,
  FiCalendar,
  FiAlertCircle,
} from "react-icons/fi";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const SESSION_TIME_OPTIONS = [
  { id: "1000-1045", label: "10:00 to 10:45", limited: false },
  { id: "1045-1130", label: "10:45 to 11:30", limited: false },
  { id: "1130-1215", label: "11:30 to 12:15", limited: false },
  { id: "1215-1300", label: "12:15 to 13:00", limited: false },
  { id: "1300-1345", label: "13:00 to 13:45", limited: false },
  { id: "1415-1500", label: "14:15 to 15:00", limited: false },
  { id: "1500-1545", label: "15:00 to 15:45", limited: false },
  { id: "1545-1630", label: "15:45 to 16:30", limited: false },
  { id: "1630-1715", label: "16:30 to 17:15", limited: false },
  { id: "1715-1800", label: "17:15 to 18:00", limited: false },
  { id: "0830-0915", label: "08:30 to 09:15", limited: true },
  { id: "0915-1000", label: "09:15 to 10:00", limited: true },
  { id: "1800-1845", label: "18:00 to 18:45", limited: true },
  { id: "1845-1930", label: "18:45 to 19:30", limited: true },
  { id: "1930-2015", label: "19:30 to 20:15", limited: true },
];

// Interface for each payment detail coming from backend
interface PaymentDetail {
  InvoiceId: string;
  date: string;
  patientName: string;
  patientId: string;
  amount: number;
  status: string;
}

interface UncheckedSessionTherapist {
  therapistId: string;
  userId: {
    name: string;
  };
  [key: string]: any;
}

interface UncheckedSession {
  patientId: string;
  name: string;
  notCheckedInSession: {
    date: string;
    slotId: string;
    therapist: UncheckedSessionTherapist | string | null;
    _id: string; // this is currently used as the sessionId
    sessionId: string;
    isCheckedIn?: boolean;
    [key: string]: any;
  };
}

// New: ConsultationBooking interfaces
interface ConsultationBookingClient {
  _id: string;
  userId: {
    _id: string;
    name: string;
  };
  name: string;
  patientId: string;
}

interface ConsultationBookingTherapy {
  _id: string;
  name: string;
}

interface ConsultationBooking {
  _id: string;
  consultationAppointmentId: string;
  client: ConsultationBookingClient;
  therapy: ConsultationBookingTherapy;
  scheduledAt: string;
  time: string;
  durationMinutes: number;
  sessionType: string;
  status: string;
  remark?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface DashboardApiData {
  childrenCount: number;
  totalAppointments: number;
  pendingPayments: PaymentDetail[];
  uncheckedSessions: UncheckedSession[];
  consultationBookings?: ConsultationBooking[]; // Add this as optional for backward compatibility
}

function getSlotLabel(slotId: string): string {
  const found = SESSION_TIME_OPTIONS.find((s) => s.id === slotId);
  return found ? found.label : slotId;
}

const getTherapistName = (
  therapist: UncheckedSessionTherapist | string | null
): string => {
  if (!therapist) return "-";
  if (typeof therapist === "string") return therapist;
  if (
    typeof therapist.userId === "object" &&
    typeof therapist.userId.name === "string"
  ) {
    return therapist.userId.name;
  }
  return therapist.therapistId || "-";
};

const getTherapistId = (
  therapist: UncheckedSessionTherapist | string | null
): string => {
  if (!therapist) return "-";
  if (typeof therapist === "string") return therapist;
  return therapist.therapistId || "-";
};

const ParentDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<DashboardApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // For compatibility with structure, alias pendingPayments
  const pendingPayments: PaymentDetail[] = dashboard?.pendingPayments ?? [];
  const uncheckedSessionsRaw: UncheckedSession[] =
    dashboard?.uncheckedSessions ?? [];

  // Show consultation bookings if present
  const consultationBookings: ConsultationBooking[] =
    dashboard?.consultationBookings ?? [];

  // Sort unchecked sessions by date (oldest first)
  const uncheckedSessions: UncheckedSession[] = [...uncheckedSessionsRaw].sort(
    (a, b) => {
      const dateA = a.notCheckedInSession.date
        ? new Date(a.notCheckedInSession.date).getTime()
        : 0;
      const dateB = b.notCheckedInSession.date
        ? new Date(b.notCheckedInSession.date).getTime()
        : 0;
      return dateA - dateB;
    }
  );

  // Sort consultation bookings as well (if any, by scheduledAt desc)
  const sortedConsultationBookings: ConsultationBooking[] = [...consultationBookings].sort(
    (a, b) => {
      const dateA = a.scheduledAt ? new Date(a.scheduledAt).getTime() : 0;
      const dateB = b.scheduledAt ? new Date(b.scheduledAt).getTime() : 0;
      return dateB - dateA; // Latest first
    }
  );

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("patient-token");
        const res = await axios.get(`${API_BASE_URL}/api/parent/dashboard`, {
          headers: {
            Authorization: token ? `${token}` : "",
          },
        });
        setDashboard(res.data.data);
        console.log(res.data.data);
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

  // Calculate due payment amount based on pending payments
  const pendingAmount = pendingPayments.reduce(
    (sum, p) => sum + (typeof p.amount === "number" ? p.amount : 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {/* TOTAL */}
        <StatCard
          title="TOTAL"
          value={dashboard.childrenCount}
          subtitle="Registered Children"
          icon={<FiUsers />}
          color="blue"
        />

        {/* Total Appointments */}
        <StatCard
          title="Total Appointments"
          value={dashboard.totalAppointments}
          subtitle="Scheduled Appointments"
          icon={<FiCalendar />}
          color="purple"
        />

        {/* DUE PAYMENT */}
        <StatCard
          title="DUE PAYMENT"
          value={`₹${pendingAmount}`}
          subtitle={`${pendingPayments.length} Pending Invoices`}
          icon={<FiAlertCircle />}
          color="red"
        />
      </div>
      {/* Pending Payments */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Pending Payments
          </h2>
          <button className="text-blue-600 text-sm font-medium hover:underline">
            View All
          </button>
        </div>
        {/* Pending payments table or fallback text */}
        {pendingPayments.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400">
            No pending payments.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Invoice ID</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Patient Name</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map((payment, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="px-3 py-2 font-mono">{payment.InvoiceId}</td>
                    <td className="px-3 py-2">
                      {payment.date
                        ? new Date(payment.date).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {payment.patientName}
                      <span className="px-1"></span>
                      ({payment.patientId})
                    </td>
                    <td className="px-3 py-2 text-right">
                      ₹{Number(payment.amount).toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consultation Bookings Section */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Consultation Bookings
          </h2>
          {/* Optionally link to full consultations list */}
        </div>
        {sortedConsultationBookings.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400">
            No consultation bookings found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Booking ID</th>
                  <th className="px-3 py-2 text-left">Date/Time</th>
                  <th className="px-3 py-2 text-left">Patient</th>
                  <th className="px-3 py-2 text-left">Therapy</th>
                  <th className="px-3 py-2 text-left">Session Type</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Remark</th>
                </tr>
              </thead>
              <tbody>
                {sortedConsultationBookings.map((consultation) => (
                  <tr key={consultation._id} className="border-t">
                    <td className="px-3 py-2 font-mono">
                      {consultation.consultationAppointmentId}
                    </td>
                    <td className="px-3 py-2">
                      {consultation.scheduledAt
                        ? new Date(consultation.scheduledAt).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {consultation.client?.name} ({consultation.client?.patientId})<br />
                      <span className="text-xs text-gray-400">{consultation.client?.userId?.name}</span>
                    </td>
                    <td className="px-3 py-2">
                      {consultation.therapy?.name || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {consultation.sessionType}
                    </td>
                    <td className="px-3 py-2">
                      {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
                    </td>
                    <td className="px-3 py-2">
                      {consultation.remark || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upcoming/Unchecked Sessions */}
      <div className="bg-white rounded-xl border p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Upcomming Sessions
          </h2>
          {/* <button className="text-blue-600 text-sm font-medium hover:underline">
            View All
          </button> */}
        </div>
        {uncheckedSessions.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400">
            No unchecked sessions.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left">Session ID</th>
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-left">Time Slot</th>
                  <th className="px-3 py-2 text-left">Patient</th>
                  <th className="px-3 py-2 text-left">Therapist</th>
                  {/* <th className="px-3 py-2 text-center">Checked In</th> */}
                </tr>
              </thead>
              <tbody>
                {uncheckedSessions.map((session, idx) => (
                  <tr key={session.notCheckedInSession._id || idx} className="border-t">
                    {/* Show sessionId (from notCheckedInSession._id) */}
                    <td className="px-3 py-2 font-mono">
                      {session.notCheckedInSession.sessionId || "-"}
                    </td>
                    <td className="px-3 py-2">
                      {session.notCheckedInSession.date
                        ? new Date(
                            session.notCheckedInSession.date
                          ).toLocaleDateString("en-GB")
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      {getSlotLabel(session.notCheckedInSession.slotId)}
                    </td>
                    <td className="px-3 py-2">
                      {session.name ? session.name : "-"} ({session.patientId})
                    </td>
                    <td className="px-3 py-2">
                      {getTherapistName(session.notCheckedInSession.therapist)} ({getTherapistId(session.notCheckedInSession.therapist)})
                    </td>
                    {/* <td className="px-3 py-2 text-center">
                      {session.notCheckedInSession.isCheckedIn ? (
                        <span className="text-green-600 flex items-center gap-1">
                          <FiCheckCircle className="inline" /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* [ Optionally place additional dashboard widgets here ] */}
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
