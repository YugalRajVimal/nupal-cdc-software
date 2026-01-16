import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiHash,
  FiUser,
  FiPackage,
  FiChevronDown,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiCalendar,
  FiDollarSign,
  FiGift,
  FiUserCheck,
  FiChevronRight,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_URL;

// Helpful utility functions for formatting
function formatDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}
function formatShortDate(dateStr?: string) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}
function maskPhone(phone?: string) {
  if (!phone) return "-";
  return phone.length >= 10 ? phone.replace(/.(?=.{4})/g, "•") : phone;
}
function humanGender(val?: string) {
  if (!val) return "-";
  if (val === "M" || val === "Male") return "Male";
  if (val === "F" || val === "Female") return "Female";
  return val;
}
function yearsFromDOB(dob?: string) {
  if (!dob) return "-";
  const birth = new Date(dob);
  if (isNaN(birth.getTime())) return "-";
  const diff = Date.now() - birth.getTime();
  const dateDiff = new Date(diff);
  return Math.abs(dateDiff.getUTCFullYear() - 1970) + " yrs";
}

// Collapsable Single Appointment Card Component
const AppointmentCard = ({
  booking,
  isOpen,
  toggleOpen,
}: {
  booking: any;
  isOpen: boolean;
  toggleOpen: () => void;
}) => {
  // Patient name & id
  const patientName = booking.patient?.name || "-";
  const patientId = booking.patient?.patientId || "-";
  // Therapist name & id
  const therapistName = booking.therapist?.userId?.name || "-";
  const therapistId = booking.therapist?.therapistId || "-";

  return (
    <div
      className={`rounded-lg border bg-gradient-to-br from-blue-50 to-slate-50 shadow hover:shadow-lg transition-all duration-150 overflow-hidden`}
      key={booking._id}
    >
      {/* Top bar: Appointment Meta - clickable to expand/collapse */}
      <button
        className={`w-full bg-blue-100 px-6 py-4 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-1 outline-none focus:outline-blue-300 cursor-pointer`}
        onClick={toggleOpen}
        aria-expanded={isOpen}
        aria-controls={`appointment-details-${booking._id}`}
        type="button"
        style={{ textAlign: "left" }}
      >
        <div className="flex flex-col md:flex-row justify-between  md:items-center gap-1 md:gap-6 text-base font-mono w-full">
        
          <div className="flex items-center gap-3">
            {isOpen ? (
              <FiChevronDown className="text-slate-400" />
            ) : (
              <FiChevronRight className="text-slate-400" />
            )}
            <FiHash className="text-blue-400" />
            <span className="font-bold text-blue-900 text-lg">
              {booking.appointmentId || booking._id}
            </span>
            <span className="px-2 text-base text-slate-500 font-sans font-medium">
              ({formatShortDate(booking.createdAt)})
            </span>
            {/* Patient quick info */}
            <span className="flex items-center gap-1 bg-yellow-50 rounded px-2 py-1 text-slate-800 text-base">
              <FiUserCheck className="text-orange-500" />
              <span className="font-semibold">{patientName}</span>
              <span className="text-sm font-mono text-blue-700">[{patientId}]</span>
            </span>
            {/* Therapist quick info */}
            <span className="flex items-center gap-1 bg-purple-50 rounded px-2 py-1 text-purple-900 text-base">
              <FiUser className="text-sky-600" />
              <span className="font-semibold">{therapistName}</span>
              <span className="text-sm font-mono text-blue-700">[{therapistId}]</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 md:gap-6 mt-1 md:mt-0">
            {/* Status, payment, coupon unchanged */}
            {/* <span
              className={`inline-flex items-center px-2 rounded text-xs ${
                booking.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : booking.status === "pending"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-200 text-gray-700"
              }`}
            >
              <FiInfo className="mr-1" />{" "}
              {booking.status?.charAt(0).toUpperCase() +
                booking.status?.slice(1)}
            </span> */}
          </div>
          <div>
            {booking.payment?.status && (
              <span
                className={`inline-flex items-center px-2 rounded text-base ${
                  booking.payment.status === "completed"
                    ? "bg-green-50 text-green-800"
                    : booking.payment.status === "pending"
                    ? "bg-yellow-50 text-yellow-900"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                <FiDollarSign className="mr-1" /> Payment:{" "}
                {booking.payment.status}
              </span>
            )}
            {booking.discountInfo?.coupon &&
              booking.discountInfo?.coupon?.discountEnabled && (
                <span className="inline-flex items-center px-2 rounded text-base bg-blue-50 text-blue-800 border border-blue-300">
                  <FiGift className="mr-1 text-blue-400" />
                  {booking.discountInfo.coupon.discount}% off (
                  {booking.discountInfo.coupon.couponCode})
                </span>
              )}
            </div>
        </div>
      </button>
      {/* Collapsable details */}
      <div
        className={`transition-all duration-200 ${
          isOpen ? "max-h-[3600px] opacity-100 py-0" : "max-h-0 opacity-0 py-0"
        } overflow-hidden`}
        id={`appointment-details-${booking._id}`}
        aria-hidden={!isOpen}
      >
        {/* Grid layout details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 px-6 py-6">
          {/* Patient Details (collapsable inner section) */}
          <details open className="mb-4 group">
            <summary className="flex items-center gap-3 mb-2 cursor-pointer select-none">
              <FiUserCheck className="text-orange-500" />
              <span className="font-semibold text-lg text-blue-900 tracking-tight">
                Patient Details
              </span>
              <FiChevronDown className="ml-1 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="text-[15px]">
              {/* Patient name & id PROMINENT */}
              <div className="flex gap-2 mb-1 flex-wrap items-center">
                <span className="font-medium text-slate-700 text-base">
                  Name: <span className="font-semibold">{patientName}</span>
                </span>
                <span className="text-xs px-2 py-1 rounded bg-slate-100 font-mono text-blue-700">
                  ID: {patientId}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-yellow-50 text-yellow-700">
                  {yearsFromDOB(booking.patient?.childDOB)} old
                </span>
                <span className="text-xs px-2 py-1 rounded bg-pink-50 text-pink-700">
                  {humanGender(booking.patient?.gender)}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 items-center text-slate-600 mb-2">
                <span className="flex items-center gap-1">
                  <FiMail className="inline" />{" "}
                  {booking.patient?.parentEmail || booking.patient?.userId?.email}
                </span>
                <span className="flex items-center gap-1">
                  <FiPhone className="inline" />{" "}
                  {maskPhone(
                    booking.patient?.mobile1 || booking.patient?.userId?.phone
                  )}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="font-medium text-slate-700">
                    Father's Name
                  </div>
                  <div>{booking.patient?.fatherFullName || "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">
                    Mother's Name
                  </div>
                  <div>{booking.patient?.motherFullName || "-"}</div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">Address</div>
                  <div>
                    {booking.patient?.address || "-"},{" "}
                    {booking.patient?.areaName || ""}
                  </div>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="font-medium text-slate-700">
                    Diagnosis Info
                  </div>
                  <div className="text-slate-700 text-sm">
                    {booking.patient?.diagnosisInfo || "-"}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-700">
                    Child's DOB
                  </div>
                  <div>{formatShortDate(booking.patient?.childDOB)}</div>
                </div>
              </div>
            </div>
          </details>
          {/* Package, Therapy, Therapist Section (collapsable inner section) */}
          <details open className="group">
            <summary className="flex items-center gap-3 mb-1 cursor-pointer select-none">
              <FiPackage className="text-purple-500" />
              <span className="font-semibold text-lg text-purple-800 tracking-tight">
                Package & Therapy
              </span>
              <FiChevronDown className="ml-1 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div>
              <div className="flex flex-col gap-1 text-slate-700 pl-6">
                <span>
                  <span className="font-semibold">Package: </span>
                  {booking.package?.name || "-"}{" "}
                  {booking.package?.sessionCount && (
                    <span className="text-xs text-orange-500">
                      ({booking.package.sessionCount} sessions)
                    </span>
                  )}{" "}
                  {booking.package?.totalCost && (
                    <span className="font-semibold text-green-700 text-xs">
                      ₹{booking.package.totalCost}
                    </span>
                  )}
                </span>
                <span>
                  <span className="font-semibold">Therapy: </span>
                  {booking.therapy?.name || "-"}
                </span>
              </div>
              {booking.discountInfo?.coupon?.discountEnabled && (
                <div className="mt-2 flex items-center gap-2 text-blue-700 text-xs bg-blue-50 rounded px-2 py-1 w-fit">
                  <FiGift className="mr-1" />
                  <span>{booking.discountInfo?.coupon.couponCode}:</span>
                  <span className="font-bold">
                    {booking.discountInfo?.coupon.discount}% OFF
                  </span>
                  {booking.discountInfo?.coupon?.validityDays && (
                    <span>
                      (valid for {booking.discountInfo.coupon.validityDays} days)
                    </span>
                  )}
                  {booking.discountInfo?.time && (
                    <span className="text-slate-500 ml-2">
                      Availed: {formatShortDate(booking.discountInfo.time)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mb-2 mt-4">
              <details open className="group">
                <summary className="flex items-center gap-3 mb-1 cursor-pointer select-none">
                  <FiUser className="text-sky-600" />
                  <span className="font-semibold text-lg text-blue-700 tracking-tight">
                    Therapist
                  </span>
                  <FiChevronDown className="ml-1 text-slate-400 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="flex flex-col pl-6 gap-1 text-slate-700">
                  {/* Therapist name & id PROMINENT */}
                  <span className="font-semibold">
                    Name: <span>{therapistName}</span>
                    <span className="ml-2 text-xs font-mono text-blue-700">
                      ID: {therapistId}
                    </span>
                  </span>
                  <span className="text-xs flex items-center gap-2">
                    {booking.therapist?.userId?.email && (
                      <span className="flex items-center gap-1">
                        <FiMail />
                        {booking.therapist.userId.email}
                      </span>
                    )}
                    {booking.therapist?.mobile1 && (
                      <span className="flex items-center gap-1">
                        <FiPhone />
                        {maskPhone(booking.therapist.mobile1)}
                      </span>
                    )}
                    {(booking.therapist?.experienceYears ||
                      booking.therapist?.experience) && (
                      <span>
                        {booking.therapist.experienceYears ||
                          booking.therapist.experience}{" "}
                        yrs exp
                      </span>
                    )}
                  </span>
                  <span className="text-xs italic text-slate-500">
                    {booking.therapist?.specializations}
                  </span>
                  <span className="text-xs">
                    {booking.therapist?.address}
                  </span>
                </div>
              </details>
            </div>
            {/* Payment block */}
            {booking.payment && (
              <div className="bg-green-50 border-green-200 rounded p-2 mt-2 text-xs w-fit">
                <span className="font-semibold flex items-center text-green-800 gap-2">
                  <FiDollarSign className="inline" />
                  Payment:&nbsp;{" "}
                  <span className="text-green-700">
                    ₹{booking.payment.amount}
                  </span>
                  <span className="ml-2 text-xs text-gray-600">
                    ({booking.payment.paymentMethod})
                  </span>
                </span>
                <div className="text-xs text-slate-500 font-mono">
                  ID: {booking.payment.paymentId}
                </div>
              </div>
            )}
          </details>
        </div>
        {/* Sessions Table (collapsable inner section) */}
        {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
          <details className="px-6 pb-5 group" open>
            <summary className="mb-2 mt-2 text-xs text-slate-700 open:bg-slate-50 rounded border border-slate-200 font-semibold cursor-pointer select-none flex items-center py-2">
              <FiCalendar className="mr-2 text-blue-400" />
              <span>
                Session Details ({booking.sessions.length})
              </span>
              <span className="ml-2">
                <FiChevronDown className="inline text-slate-400 group-open:rotate-180 transition-transform" />
              </span>
            </summary>
            <div className="overflow-x-auto mt-2">
              <table className="min-w-[560px] w-fit border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      #
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Date
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Time Slot
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Therapist
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Therapy Type
                    </th>
                    <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                      Checked In
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {booking.sessions.map((s: any, idx: number) => (
                    <tr key={s._id || s.date + s.slotId}>
                      <td className="px-2 py-1 border border-slate-200 text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-blue-900">
                        {formatShortDate(s.date)}
                      </td>
                      <td className="px-2 py-1 border border-slate-200">
                        <span className="bg-slate-100 rounded px-2 font-mono">
                          {s.slotId || "-"}
                        </span>
                      </td>
                      <td className="px-2 py-1 border border-slate-200">
                        {/* Therapist name & id in session table */}
                        {s.therapist?.userId?.name || "-"}
                        {s.therapist?.therapistId && (
                          <span className="ml-2 text-xs font-mono text-blue-800">
                            [{s.therapist.therapistId}]
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-1 border border-slate-200">
                        {s.therapyTypeId?.name || "-"}
                      </td>
                      <td className="px-2 py-1 border border-slate-200 text-center">
                        {s.isCheckedIn ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <FiCheckCircle className="inline" /> Yes
                          </span>
                        ) : (
                          <span className="text-slate-400">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        )}
        {/* Audit & timestamps */}
        <div className="bg-slate-50 text-xs text-slate-500 px-6 py-1 flex flex-wrap gap-x-6 gap-y-1 border-t border-slate-200">
          <span>Created: {formatDate(booking.createdAt)}</span>
          <span>Updated: {formatDate(booking.updatedAt)}</span>
          {booking.appointmentDate && (
            <span>
              Appointment Date: {formatDate(booking.appointmentDate)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const AllAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [openIndexes, setOpenIndexes] = useState<{ [key: string]: boolean }>(
    {}
  );

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `${API_BASE}/api/super-admin/all-appointments`
        );
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

  const handleToggle = (key: string) => {
    setOpenIndexes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  if (loading) {
    return <div className="py-6">Loading appointments...</div>;
  }
  if (error) {
    return <div className="py-6 text-red-600">{error}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-2 sm:px-4 py-6">
      <h2 className="text-2xl font-semibold mb-6 text-blue-800 flex items-center gap-2">
        <FiHash className="text-blue-400" /> All Appointments (
        {appointments.length})
      </h2>
      {appointments.length === 0 ? (
        <div className="text-slate-600">No appointments found.</div>
      ) : (
        <div className="space-y-8">
          {appointments.map((booking) => (
            <AppointmentCard
              booking={booking}
              isOpen={!!openIndexes[booking._id]}
              toggleOpen={() => handleToggle(booking._id)}
              key={booking._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllAppointments;