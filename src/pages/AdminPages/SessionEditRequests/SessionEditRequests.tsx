import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FiCheck, FiEdit2, FiX, FiEye } from "react-icons/fi";
import { Link } from "react-router";

// The color palette and card/table layouts are inspired by @PatientsPage

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

const SESSION_TIME_OPTIONS = [
  { id: '1000-1045', label: '10:00 to 10:45', limited: false },
  { id: '1045-1130', label: '10:45 to 11:30', limited: false },
  { id: '1130-1215', label: '11:30 to 12:15', limited: false },
  { id: '1215-1300', label: '12:15 to 13:00', limited: false },
  { id: '1300-1345', label: '13:00 to 13:45', limited: false },
  { id: '1415-1500', label: '14:15 to 15:00', limited: false },
  { id: '1500-1545', label: '15:00 to 15:45', limited: false },
  { id: '1545-1630', label: '15:45 to 16:30', limited: false },
  { id: '1630-1715', label: '16:30 to 17:15', limited: false },
  { id: '1715-1800', label: '17:15 to 18:00', limited: false },
  { id: '0830-0915', label: '08:30 to 09:15', limited: true },
  { id: '0915-1000', label: '09:15 to 10:00', limited: true },
  { id: '1800-1845', label: '18:00 to 18:45', limited: true },
  { id: '1845-1930', label: '18:45 to 19:30', limited: true },
  { id: '1930-2015', label: '19:30 to 20:15', limited: true },
];

type TherapistType = {
  _id: string;
  userId:
    | {
        _id: string;
        name: string;
      }
    | string;
  therapistId?: string;
};

type SessionType = {
  _id: string;
  date: string;
  time?: string;
  status?: string;
  notes?: string;
  slotId?: string;
  therapist?: TherapistType;
  [key: string]: any;
};

type PatientType = {
  _id: string;
  userId: string;
  patientId: string;
  gender?: string;
  childDOB?: string;
  name: string;
  mobile1?: string;
  mobile2?: string;
  [key: string]: any;
};

type AppointmentType = {
  _id: string;
  appointmentId?: string;
  patient?: PatientType;
  sessions: SessionType[];
  createdAt: string;
  updatedAt: string;
  therapy?:
    | {
        name?: string;
      }
    | string;
  [key: string]: any;
};

type EditRequestSessionEntry = {
  sessionId: string;
  newDate: string;
  newSlotId: string;
  status?: string;
};

type SessionEditRequest = {
  _id: string;
  appointmentId:
    | string
    | AppointmentType;
  sessions: EditRequestSessionEntry[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

// function formatDate(d?: string, f: string = "DD MMM YYYY") {
//   if (!d) return "-";
//   return dayjs(d).format(f);
// }

// function getSlotLabel(slotId: string) {
//   const found = SESSION_TIME_OPTIONS.find((opt) => opt.id === slotId);
//   return found ? found.label : slotId;
// }

export default function SessionEditRequestsAdmin() {
  const [editRequests, setEditRequests] = useState<SessionEditRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Expanded state: track currently viewed request's _id (or null)
  const [viewRequestId, setViewRequestId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/api/admin/bookings/session-edit-requests`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setEditRequests(data.editRequests || []);
        } else {
          setError("Failed to fetch session edit requests.");
        }
      })
      .catch(() => setError("Failed to fetch session edit requests."))
      .finally(() => setLoading(false));
  }, []);

//   function getAppointment(request: SessionEditRequest) {
//     if (
//       typeof request.appointmentId === "object" &&
//       request.appointmentId.sessions &&
//       Array.isArray(request.appointmentId.sessions)
//     ) {
//       return request.appointmentId as AppointmentType;
//     }
//     return undefined;
//   }

  function getPatient(appointment: AppointmentType | undefined) {
    if (!appointment) return {};
    if (appointment.patient) return appointment.patient;
    if ((appointment as any).child) return (appointment as any).child;
    return {};
  }

  function getTherapyName(appointment: AppointmentType | undefined) {
    if (!appointment) return "";
    if (typeof appointment.therapy === "object" && appointment.therapy?.name) {
      return appointment.therapy.name;
    }
    if (typeof appointment.therapy === "string") {
      return appointment.therapy;
    }
    return "";
  }

  function getAppointmentId(request: SessionEditRequest) {
    if (!request.appointmentId) return undefined;
    if (typeof request.appointmentId === "string") return request.appointmentId;
    if (
      typeof request.appointmentId === "object" &&
      request.appointmentId.appointmentId
    ) {
      return request.appointmentId.appointmentId;
    }
    return undefined;
  }

//   function buildSessionMap(appointment: AppointmentType) {
//     const map: Record<string, SessionType> = {};
//     for (const s of appointment.sessions || []) {
//       if (s._id) map[s._id] = s;
//     }
//     return map;
//   }

  // Reusable badge colored label
  function StatusBadge({ status }: { status: string }) {
    if (status === "approved")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 border border-green-100">
          <FiCheck className="inline" /> Approved
        </span>
      );
    if (status === "pending")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700 border border-yellow-100">
          <FiEdit2 className="inline" /> Pending
        </span>
      );
    if (status === "rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-100">
          <FiX className="inline" /> Rejected
        </span>
      );
    return (
      <span className="inline-block bg-slate-100 px-2 py-0.5 text-xs rounded font-semibold text-slate-600 border border-slate-200">
        {status || "Pending"}
      </span>
    );
  }

  return (
    <div className="min-h-screen md:px-10 px-2 py-8 ">
      <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-blue-900">Session Edit Requests</h1>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="w-full bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-400 p-12">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 p-8">{error}</div>
          ) : editRequests.length === 0 ? (
            <div className="text-center text-slate-400 py-10">
              No session edit requests found.
            </div>
          ) : (
            <table className="w-full min-w-[960px] table-auto">
              <thead>
                <tr className="bg-slate-50 border-b">
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Appt. ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Patient</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Patient ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Therapy</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Mobile</th>

                 
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Status</th>
                  {/* <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Requested</th>
                  <th className="px-4 py-3 text-xs font-semibold text-left text-slate-500">Updated</th> */}
                  <th className="px-4 py-3 text-xs font-semibold text-center text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {editRequests.map((req, idx) => {
                  const appointment =
                    typeof req.appointmentId === "object"
                      ? (req.appointmentId as AppointmentType)
                      : undefined;
                  const patient = getPatient(appointment);
                  const therapyName = getTherapyName(appointment);
                //   const lastUpdate = req.updatedAt || (appointment && appointment.updatedAt);

                  const expanded = viewRequestId === req._id;

                  return (
                    <React.Fragment key={req._id+idx}>
                      <tr
                        className={
                          "border-b last:border-none transition" +
                          (expanded ? " bg-blue-50/30" : " bg-white")
                        }
                      >
                        <td className="px-4 py-3 font-mono text-sm text-blue-900">{getAppointmentId(req) || "-"}</td>
                        <td className="px-4 py-3">{patient.name || <span className="text-slate-400 italic">Anonymous</span>}</td>
                        <td className="px-4 py-3 font-mono">{patient.patientId || <span className="text-slate-400 italic">-</span>}</td>
                        <td className="px-4 py-3">{therapyName || <span className="text-slate-400 italic">-</span>}</td>
                        <td className="px-4 py-3">
                          {patient.mobile1 || patient.mobile2 ? (
                            <>
                              {patient.mobile1 && <span>{patient.mobile1}</span>}
                              {patient.mobile1 && patient.mobile2 && <span className="mx-2 text-slate-400"><br/></span>}
                              {patient.mobile2 && <span>{patient.mobile2}</span>}
                            </>
                          ) : (
                            <span className="text-slate-400 italic">-</span>
                          )}
                        </td>
 
                        <td className="px-4 py-3">
                          <StatusBadge status={req.status || "pending"} />
                        </td>
                        {/* <td className="px-4 py-3">{req.createdAt ? formatDate(req.createdAt) : "-"}</td>
                        <td className="px-4 py-3">{lastUpdate ? formatDate(lastUpdate) : "-"}</td> */}
                        <td className="px-4 py-3 text-center">
                          <button
                            className={
                              "inline-flex items-center gap-2 px-2.5 py-1.5 rounded transition-all border " +
                              (expanded
                                ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold shadow"
                                : "bg-slate-100 border-slate-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300")
                            }
                            onClick={() =>
                              setViewRequestId(expanded ? null : req._id)
                            }
                            title={expanded ? "Hide Details" : "View Details"}
                          >
                            <FiEye />
                            <span className="hidden md:inline">{expanded ? "Hide" : "View"}</span>
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr>
                          <td colSpan={12} className="px-0 py-0 bg-blue-50/50">
                            <div className="rounded-b-xl border border-t-0 border-blue-100 bg-blue-50/40 mx-4 mb-4 mt-0 shadow-inner">
                              <div className="px-8 py-6">
                                <h3 className="font-semibold mb-3 text-blue-900 text-sm">Sessions affected by requested changes</h3>
                                <div className="overflow-x-auto">
                                  <SessionEditsTable request={req} appointment={appointment} />
                                </div>
                                <div className="pt-5">
                                  <Link
                                    to="/admin/bookings"
                                    state={{ sessionEditRequest: req }}
                                    className="inline-flex items-center gap-1 rounded-md border border-green-600 bg-green-50 px-4 py-2 text-sm text-green-700 hover:bg-green-100 transition"
                                  >
                                    <FiCheck /> Proceed with changes
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function SessionEditsTable({
  request,
  appointment,
}: {
  request: SessionEditRequest;
  appointment?: AppointmentType;
}) {
  const sessionMap = appointment ? buildSessionMap(appointment) : {};

  function getSlotLabel(slotId: string) {
    const found = SESSION_TIME_OPTIONS.find((opt) => opt.id === slotId);
    return found ? found.label : slotId;
  }
  function StatusBadgeLocal({ status }: { status: string }) {
    if (status === "approved")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700 border border-green-100">
          <FiCheck className="inline" /> Approved
        </span>
      );
    if (status === "pending")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-yellow-50 px-2 py-0.5 text-xs font-semibold text-yellow-700 border border-yellow-100">
          <FiEdit2 className="inline" /> Pending
        </span>
      );
    if (status === "rejected")
      return (
        <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-100">
          <FiX className="inline" /> Rejected
        </span>
      );
    return (
      <span className="inline-block bg-slate-100 px-2 py-0.5 text-xs rounded font-semibold text-slate-600 border border-slate-200">
        {status || "Pending"}
      </span>
    );
  }
  return (
    <table className="w-full min-w-[800px] table-auto mb-2">
      <thead>
        <tr className="bg-slate-100 border-b">
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Session ID</th>
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Orig. Date</th>
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Orig. Slot</th>
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Therapist</th>
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Req. Date</th>
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Req. Slot</th>
          <th className="px-3 py-2 text-xs font-semibold text-slate-500 text-left">Status</th>
        </tr>
      </thead>
      <tbody>
        {request.sessions && request.sessions.length > 0 ? (
          request.sessions.map((edit, idx) => {
            const session =
              sessionMap[edit.sessionId] ||
              (appointment?.sessions.find((s) => s._id === edit.sessionId));
            const therapistName =
              session && session.therapist && typeof session.therapist === "object"
                ? typeof session.therapist.userId === "object"
                  ? session.therapist.userId.name
                  : ""
                : "";
            // Detect date/slot change
            const dateChanged =
              session?.date &&
              edit.newDate &&
              !dayjs(edit.newDate).isSame(dayjs(session.date), "day");
            const slotChanged =
              session?.slotId && edit.newSlotId && edit.newSlotId !== session.slotId;
            return (
              <tr
                key={edit.sessionId + idx}
                className={
                  "border-b transition" +
                  ((dateChanged || slotChanged) ? " bg-green-50/30" : " bg-white")
                }
              >
                <td className="px-3 py-2 font-mono text-xs">{edit.sessionId}</td>
                <td className="px-3 py-2">
                  {session?.date ? dayjs(session.date).format("YYYY-MM-DD") : <span className="italic text-slate-400">N/A</span>}
                </td>
                <td className="px-3 py-2">
                  {session?.slotId
                    ? getSlotLabel(session.slotId)
                    : session?.slotId || <span className="italic text-slate-400">N/A</span>}
                </td>
                <td className="px-3 py-2">
                  {therapistName ? therapistName : <span className="italic text-slate-400">–</span>}
                </td>
                <td className={"px-3 py-2"}>
                  <span
                    className={
                      dateChanged
                        ? "font-semibold text-blue-700"
                        : ""
                    }
                  >
                    {edit.newDate
                      ? dayjs(edit.newDate).format("YYYY-MM-DD")
                      : <span className="italic text-slate-400">N/A</span>}
                  </span>
                  {dateChanged && (
                    <span className="ml-1 inline-flex items-center gap-1 text-green-700 text-[12px]">
                      <FiEdit2 />Changed
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={
                      slotChanged
                        ? "font-semibold text-blue-700"
                        : ""
                    }
                  >
                    {edit.newSlotId
                      ? getSlotLabel(edit.newSlotId)
                      : <span className="italic text-slate-400">N/A</span>}
                  </span>
                  {slotChanged && (
                    <span className="ml-1 inline-flex items-center gap-1 text-green-700 text-[12px]">
                      <FiEdit2 />Changed
                    </span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <StatusBadgeLocal status={edit.status || request.status || "pending"} />
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={7} className="px-3 py-5 text-center text-slate-400">
              No session edits in this request
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function buildSessionMap(appointment: AppointmentType) {
  const map: Record<string, SessionType> = {};
  for (const s of appointment.sessions || []) {
    if (s._id) map[s._id] = s;
  }
  return map;
}
