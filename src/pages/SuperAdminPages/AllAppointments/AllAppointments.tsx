import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiHash, FiUser, FiTag, FiPackage, FiChevronDown } from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

interface User {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
}

interface PatientProfile {
  _id: string;
  userId: User;
  age?: number;
  gender?: string;
}

interface TherapistProfile {
  _id: string;
  userId: User;
  experience?: number;
  qualification?: string;
  therapistId?: string;
}

interface TherapyType {
  _id: string;
  name: string;
  description?: string;
}

interface Package {
  _id: string;
  name: string;
  sessions: number;
  price: number;
}

interface DiscountCoupon {
  _id: string;
  discount?: number;
  discountEnabled?: boolean;
  couponCode?: string;
  validityDays?: number;
}

interface BookingSession {
  _id?: string;
  date: string;
  slotId: string;
}

interface Booking {
  _id: string;
  appointmentId?: string;
  package: Package;
  patient: PatientProfile;
  therapy: TherapyType;
  therapist: TherapistProfile | string | null;
  sessions?: BookingSession[];
  appointmentDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  discountInfo?: {
    coupon: DiscountCoupon;
    discountAmount?: number;
  };
}

const SESSION_TIME_OPTIONS = [
  { id: "morning", label: "Morning (9:00–11:00)", limited: false },
  { id: "noon", label: "Noon (11:00–13:00)", limited: false },
  { id: "afternoon", label: "Afternoon (14:00–16:00)", limited: true },
  { id: "evening", label: "Evening (16:00–18:00)", limited: false },
];

function getPatientDisplayName(patient: PatientProfile | undefined | null): string {
  if (!patient) return "-";
  if (patient.userId?.name) return patient.userId.name;
  return patient._id;
}
function getTherapistDisplayName(therapist: TherapistProfile | string | null): string {
  if (!therapist) return "-";
  if (typeof therapist === "string") return therapist;
  let fn = therapist.userId?.name || "";
  if (therapist.therapistId) fn += ` (${therapist.therapistId})`;
  return fn || therapist._id;
}
function getPackageDisplay(pkg: Package | undefined | null): string {
  if (!pkg) return "-";
  return `${pkg.name} (${pkg.sessions} sessions, ₹${pkg.price})`;
}

const AllAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_BASE}/api/super-admin/all-appointments`);
        if (response.data && response.data.success) {
          setAppointments(response.data.bookings);
        } else {
          setError("Failed to fetch appointments");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching appointments");
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  if (loading) {
    return <div className="py-6">Loading appointments...</div>;
  }
  if (error) {
    return <div className="py-6 text-red-600">{error}</div>;
  }

  // Render as full width with a regular grid and card details in two columns
  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-6">
      <h2 className="text-2xl font-semibold mb-6 text-blue-800 flex items-center gap-2">
        <FiHash className="text-blue-400" /> All Appointments ({appointments.length})
      </h2>
      {appointments.length === 0 ? (
        <div className="text-slate-600">No appointments found.</div>
      ) : (
        <div className="space-y-6">
          {appointments.map((booking) => (
            <div
              className="border p-4 rounded bg-sky-50 relative w-full"
              key={booking._id}
            >
              {/* Appointment ID row - Full width on top */}
              {booking.appointmentId && (
                <div className="mb-2 flex items-center gap-2 text-xs font-mono text-gray-700">
                  <FiHash className="text-blue-500" />
                  <span>Appointment ID: {booking.appointmentId}</span>
                </div>
              )}
              {/* 2-column grid for details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
                {/* LEFT column */}
                <div>
                  {/* Therapist Info */}
                  <div className="flex items-center gap-2 mb-1">
                    <FiUser className="text-slate-500" />
                    <span className="text-slate-700">
                      <span className="font-semibold text-gray-700">Therapist: </span>
                      {getTherapistDisplayName(booking.therapist)}
                    </span>
                  </div>
                  {/* Patient Info */}
                  <div className="font-semibold text-blue-900 flex items-center gap-2 mb-1">
                    <FiUser className="text-blue-600" />
                    {getPatientDisplayName(booking.patient)}
                    {booking.patient?.userId?.email && (
                      <span className="ml-2 text-xs text-gray-500">{booking.patient?.userId.email}</span>
                    )}
                  </div>
                  {/* Therapy Type */}
                  <div className="flex items-center gap-2 mb-1">
                    <FiTag className="text-slate-500" />
                    <span className="text-slate-700">{booking.therapy?.name || "-"}</span>
                  </div>
                  {/* Package */}
                  <div className="flex items-center gap-2 mb-1">
                    <FiPackage className="text-purple-500" />
                    <span className="text-purple-700">{getPackageDisplay(booking.package)}</span>
                  </div>
                  {/* Discount if present */}
                  {booking.discountInfo && booking.discountInfo.coupon && booking.discountInfo.coupon.discountEnabled && (
                    <div className="mb-1 text-xs text-blue-700">
                      Discount:{" "}
                      <span className="font-semibold">
                        {booking.discountInfo.coupon.discount || "-"}%
                      </span>{" "}
                      (Coupon:{" "}
                      <span className="font-mono">
                        {booking.discountInfo.coupon.couponCode}
                      </span>
                      {booking.discountInfo.coupon.validityDays && (
                        <> {` - valid ${booking.discountInfo.coupon.validityDays}d`}</>
                      )}
                      )
                    </div>
                  )}
                </div>

                {/* RIGHT column */}
                <div>
                  {/* Appointment Date, Status, Created */}
                  <div className="flex flex-col gap-1 text-xs">
                    <div>
                      <span className="font-semibold text-gray-700">Appointment Date: </span>
                      <span>
                        {booking.appointmentDate
                          ? new Date(booking.createdAt).toLocaleString()
                          : "-"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Status: </span>
                      <span>{booking.status}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Created: </span>
                      <span>{new Date(booking.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  {/* Session Details if present */}
                  {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
                    <details className="mb-2 mt-3 text-xs text-slate-700">
                      <summary className="font-medium cursor-pointer select-none flex items-center">
                        <span>Sessions ({booking.sessions.length})</span>
                        <span className="ml-1">
                          <FiChevronDown className="inline ml-1 text-slate-500" />
                        </span>
                      </summary>
                      <div className="overflow-x-auto mt-2">
                        <table className="min-w-[340px] w-fit border-collapse text-xs">
                          <thead>
                            <tr>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">#</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
                              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Time Slot</th>
                            </tr>
                          </thead>
                          <tbody>
                            {booking.sessions.map((s, idx) => {
                              const slot = SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId);
                              return (
                                <tr key={s._id || s.date}>
                                  <td className="px-2 py-1 border border-slate-200 text-slate-400">{idx + 1}</td>
                                  <td className="px-2 py-1 border border-slate-200">
                                    {s.date}
                                  </td>
                                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap">
                                    {slot
                                      ? (
                                        <>
                                          {slot.label}
                                          {slot.limited && <span className="text-amber-700 ml-1">(Limited case)</span>}
                                        </>
                                      )
                                      : s.slotId}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllAppointments;