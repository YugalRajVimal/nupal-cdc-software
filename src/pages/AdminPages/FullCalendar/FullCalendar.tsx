// import { useEffect, useState, useCallback, useMemo } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   FiCalendar,
//   FiChevronLeft,
//   FiChevronRight,
//   FiX,
//   FiSearch,
// } from "react-icons/fi";
// import "react-toastify/dist/ReactToastify.css";

// // --- Constants and Types (unchanged) ---
// const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
// const SESSION_TIME_OPTIONS = [
//   { id: "0830-0915", label: "08:30 to 09:15", limited: true },
//   { id: "0915-1000", label: "09:15 to 10:00", limited: true },
//   { id: "1000-1045", label: "10:00 to 10:45", limited: false },
//   { id: "1045-1130", label: "10:45 to 11:30", limited: false },
//   { id: "1130-1215", label: "11:30 to 12:15", limited: false },
//   { id: "1215-1300", label: "12:15 to 13:00", limited: false },
//   { id: "1300-1345", label: "13:00 to 13:45", limited: false },
//   { id: "1415-1500", label: "14:15 to 15:00", limited: false },
//   { id: "1500-1545", label: "15:00 to 15:45", limited: false },
//   { id: "1545-1630", label: "15:45 to 16:30", limited: false },
//   { id: "1630-1715", label: "16:30 to 17:15", limited: false },
//   { id: "1715-1800", label: "17:15 to 18:00", limited: false },
//   { id: "1800-1845", label: "18:00 to 18:45", limited: true },
//   { id: "1845-1930", label: "18:45 to 19:30", limited: true },
//   { id: "1930-2015", label: "19:30 to 20:15", limited: true },
// ];

// // Show all statuses from @booking.schema.js (22-26)
// const SESSION_STATUS_OPTIONS = [
//   { value: "CheckedIn", label: "Checked In" },
//   { value: "NotCheckedIn", label: "Not Checked In" },
//   { value: "Missed", label: "Missed" },
// ];

// type TherapistUser = {
//   _id: string;
//   name: string;
// };
// type Therapist = {
//   _id: string;
//   therapistId?: string;
//   name?: string;
//   userId?: TherapistUser;
// };
// type TherapyType = {
//   _id: string;
//   name: string;
// };
// type BackendCalendarRecord = {
//   appointmentId: string;
//   patient: {
//     patientId: string;
//     name: string;
//   };
//   session: {
//     date: string;
//     slotId: string;
//     sessionId?: string;
//     therapist?: Therapist;
//     therapyTypeId?: TherapyType;
//     isCheckedIn?: boolean;
//     _id?: string;
//     status?: string; // <-- Add status
//   };
//   therapist?: {
//     therapistId: string;
//     name?: string;
//   };
// };
// type Session = {
//   _id?: string;
//   date: string;
//   slotId: string;
//   sessionId?: string;
//   isCheckedIn?: boolean;
//   appointmentId?: string;
//   patient?: { patientId: string; name: string };
//   therapist?: Therapist;
//   therapyTypeId?: TherapyType;
//   status?: string; // <-- Add status here
// };
// const API_BASE_URL = import.meta.env.VITE_API_URL as string;

// // --- Helpers ---

// function getDaysInMonth(year: number, month: number) {
//   return new Date(year, month + 1, 0).getDate();
// }
// function getStartDay(year: number, month: number) {
//   return new Date(year, month, 1).getDay();
// }
// function getPatientDisplayName(patient: any) {
//   if (!patient) return "";
//   const name = patient.name || "";
//   const patientId = patient.patientId || "";
//   let resultName = name;
//   if (patientId) {
//     resultName += ` [${patientId}]`;
//   }
//   return resultName;
// }
// function processBackendSessionList(data: BackendCalendarRecord[]): Session[] {
//   // Only include: appointmentId, patient (id, name), session date, slotId, therapist, therapyTypeId, isCheckedIn, _id, sessionId, status
//   return data.map((rec) => {
//     const { appointmentId, patient, session } = rec;
//     return {
//       _id: session._id,
//       appointmentId,
//       patient: patient && {
//         patientId: patient.patientId,
//         name: patient.name,
//       },
//       date: session.date,
//       slotId: session.slotId,
//       sessionId: session.sessionId,
//       therapist: session.therapist,
//       therapyTypeId: session.therapyTypeId,
//       isCheckedIn: session.isCheckedIn,
//       status: session.status, // <- ADD status
//     };
//   });
// }

// /**
//  * Format a date string (YYYY-MM-DD) as DD/MM/YYYY.
//  * Returns empty string for invalid input.
//  */
// function formatDateForDisplay(dateStr: string | Date): string {
//   if (!dateStr) return '';
//   let d: Date;
//   if (typeof dateStr === "string") {
//     if (dateStr.length === 10 && dateStr.includes("-")) {
//       // "YYYY-MM-DD"
//       const [y, m, d0] = dateStr.split("-");
//       return `${d0.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
//     }
//     d = new Date(dateStr);
//   } else if (dateStr instanceof Date) {
//     d = dateStr;
//   } else {
//     return '';
//   }
//   if (isNaN(d.getTime())) return '';
//   return `${String(d.getDate()).padStart(2, "0")}/${String(
//     d.getMonth() + 1
//   ).padStart(2, "0")}/${d.getFullYear()}`;
// }

// // --- UI Atomic Components (using <a> for external routing, like ReceptionDesk) ---

// function PatientDetailsBox({ patient }: { patient: { name: string; patientId: string } }) {
//   if (!patient) return null;
//   return (
//     <div className="rounded border px-2 py-2 bg-white mb-1">
//       <div className="font-semibold text-indigo-800 text-base">
//         {patient.patientId ? (
//           <a
//             href={`/admin/children?patientId=${encodeURIComponent(patient.patientId)}`}
//             className="text-blue-700 hover:underline"
//             title="View children details"
//             target="_blank"
//             rel="noopener noreferrer"
//             onClick={e => e.stopPropagation()}
//           >
//             {patient.name}
//           </a>
//         ) : (
//           patient.name
//         )}
//         {patient.patientId && (
//           <span className="text-indigo-600 text-xs ml-1">
//             [{patient.patientId}]
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }
// function AppointmentIdBox({ appointmentId }: { appointmentId: string }) {
//   if (!appointmentId) return null;
//   return (
//     <div className="mb-1 px-1 rounded-full font-semibold text-[0.98em] bg-teal-100 text-teal-800 inline-block">
//       Booking ID: {appointmentId}
//     </div>
//   );
// }
// function SessionIdBox({ sessionId }: { sessionId: string }) {
//   if (!sessionId) return null;
//   return (
//     <div className="mb-1 px-1 rounded-full font-semibold text-[0.92em] bg-blue-100 text-blue-800 inline-block">
//       Session ID: {sessionId}
//     </div>
//   );
// }
// function TherapyTypeBox({ therapyType }: { therapyType: TherapyType }) {
//   if (!therapyType) return null;
//   return (
//     <div className="my-1 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1 border border-slate-200">
//       <div>
//         <b>Therapy Type:</b>{" "}
//         <span className="font-semibold text-indigo-700">{therapyType.name}</span>
//       </div>
//     </div>
//   );
// }
// function TherapistBox({ therapist }: { therapist: Therapist }) {
//   if (!therapist) return null;
//   let therapistId = therapist.therapistId ;
//   let therapistUserId = therapist._id
//   const display = therapist.userId?.name || therapist.name || "-";
//   return (
//     <div className="my-1 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1 border border-slate-200">
//       <div>
//         <b>Therapist:</b>{" "}
//         {therapistId ? (
//           <a
//             href={`/admin/therapists?therapistId=${encodeURIComponent(therapistUserId)}`}
//             className="text-blue-600 hover:underline"
//             title="View therapist details"
//             target="_blank"
//             rel="noopener noreferrer"
//             onClick={e => e.stopPropagation()}
//           >
//             {display}
//           </a>
//         ) : (
//           display
//         )}
//         {therapist.therapistId ? ` (${therapist.therapistId})` : ""}
//       </div>
//     </div>
//   );
// }

// // --- Modal Wrapper ---
// function Modal({
//   open,
//   onClose,
//   children,
//   title,
// }: {
//   open: boolean;
//   onClose: () => void;
//   children: React.ReactNode;
//   title?: string;
// }) {
//   if (!open) return null;
//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ y: 50, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           exit={{ y: 50, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 250, damping: 30 }}
//           className="bg-white rounded-lg shadow-xl p-6 relative min-w-[320px] max-w-lg w-full"
//           onClick={(e) => e.stopPropagation()}
//         >
//           <button
//             className="absolute top-2 right-2 text-gray-400 hover:text-black"
//             onClick={onClose}
//             tabIndex={-1}
//           >
//             <FiX size={20} />
//           </button>
//           {title && (
//             <h2 className="mb-4 text-lg font-bold text-gray-800 border-b pb-2">
//               {title}
//             </h2>
//           )}
//           <div className="overflow-y-auto max-h-[60vh] pr-1">{children}</div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// // --- Session Visual ---
// function CalendarSessionItem({
//   session,
//   showAllDetails = false,
// }: {
//   session: Session;
//   showAllDetails?: boolean;
// }) {
//   const slot = SESSION_TIME_OPTIONS.find((opt) => opt.id === session.slotId);
//   const patient = session.patient;
//   const appointmentId = session.appointmentId;
//   const therapist = session.therapist;
//   const therapyType = session.therapyTypeId;
//   // const isCheckedIn = !!session.isCheckedIn;
//   const sessionId = session.sessionId;
//   const status = session.status;

//   // status badge
//   function renderStatus() {
//     if (!status) return null;
//     let color, bgColor, text;
//     if (status === "CheckedIn") {
//       color = "text-green-900";
//       bgColor = "bg-green-200";
//       text = "Checked In";
//     } else if (status === "Missed") {
//       color = "text-red-900";
//       bgColor = "bg-red-200";
//       text = "Missed";
//     } else if (status === "NotCheckedIn") {
//       color = "text-slate-700";
//       bgColor = "bg-slate-200";
//       text = "Not Checked In";
//     } else {
//       color = "text-slate-700";
//       bgColor = "bg-slate-100";
//       text = status;
//     }
//     return (
//       <span className={`${bgColor} px-2 py-0.5 rounded ${color} text-xs font-semibold ml-2`}>
//         {text}
//       </span>
//     );
//   }

//   if (!showAllDetails) {
//     return (
//       <div
//         className={`rounded border flex flex-col justify-end border-sky-300 px-1 py-0.5 bg-sky-50 text-xs mb-1
//         ${slot && slot.limited ? "border-orange-400 bg-orange-50" : ""}`}
//       >
//         <span className="font-bold text-indigo-900">
//           {patient && patient.patientId ? (
//             <a
//               href={`/admin/children?patientId=${encodeURIComponent(patient.patientId)}`}
//               className="text-blue-700 hover:underline"
//               title="View patient details"
//               target="_blank"
//               rel="noopener noreferrer"
//               onClick={e => e.stopPropagation()}
//             >
//               {getPatientDisplayName(patient)}
//             </a>
//           ) : (
//             getPatientDisplayName(patient)
//           )}
//         </span>
//         <span>
//           <span className="text-sky-700">
//             {slot ? slot.label : session.slotId}
//           </span>
//           {slot && slot.limited && (
//             <span className="ml-1 text-amber-600 font-semibold">(Limited)</span>
//           )}
//         </span>
//         {sessionId && (
//           <span className="text-[0.72em] text-blue-700 mt-1">
//             Session ID: <span className="font-mono">{sessionId}</span>
//           </span>
//         )}
//         {/* {renderStatus()} */}
//       </div>
//     );
//   } else {
//     return (
//       <div className="mb-3 p-2 rounded border border-indigo-300 bg-slate-50 flex flex-col">
//         {appointmentId && <AppointmentIdBox appointmentId={appointmentId} />}
//         {sessionId && <SessionIdBox sessionId={sessionId} />}
//         <div className="mb-1 flex items-center gap-3">
//           <span className="text-xs text-slate-700">{formatDateForDisplay(session.date)}</span>
//           <span
//             className={`inline-block rounded px-2 py-0.5 mr-1 text-xs font-semibold ${
//               slot && slot.limited
//                 ? "bg-amber-100 text-amber-700 border border-amber-300"
//                 : "bg-sky-100 text-sky-800"
//             }`}
//           >
//             {slot ? slot.label : session.slotId}
//           </span>
//           {/* {isCheckedIn && (
//             <span className="bg-green-200 px-2 py-0.5 rounded text-green-900 text-xs font-semibold">
//               Checked In
//             </span>
//           )} */}
//           {/* Show status badge */}
//           {renderStatus()}
//         </div>
//         {patient && <PatientDetailsBox patient={patient} />}
//         {therapyType && <TherapyTypeBox therapyType={therapyType} />}
//         {therapist && <TherapistBox therapist={therapist} />}
//       </div>
//     );
//   }
// }

// // --- Search and Filter Component ---
// type FilterQuery = {
//   patientName: string;
//   therapistName: string;
//   therapyType: string;
//   onlyLimited: boolean;
//   checkedIn: string; // 'yes', 'no', '' (all)
//   slotId: string; // --- ADD: slotId filter
//   status?: string; // --- Add status filter, optional for backward compatibility
// };
// function CalendarSearchFilter({
//   filters,
//   setFilters,
//   therapyTypes,
// }: {
//   filters: FilterQuery;
//   setFilters: (f: FilterQuery) => void;
//   therapyTypes: TherapyType[];
// }) {
//   return (
//     <div className="p-4 flex flex-wrap gap-4 items-center border-b bg-slate-50">
//       <div className="relative">
//         <FiSearch className="absolute left-2 top-2.5 text-slate-400" />
//         <input
//           type="text"
//           className="pl-8 pr-2 py-1 border rounded focus:outline-sky-400 bg-white text-sm"
//           placeholder="Search Children or Id"
//           value={filters.patientName}
//           onChange={e => setFilters({ ...filters, patientName: e.target.value })}
//         />
//       </div>
//       <div className="relative">
//         <FiSearch className="absolute left-2 top-2.5 text-slate-400" />
//         <input
//           type="text"
//           className="pl-8 pr-2 py-1 border rounded focus:outline-sky-400 bg-white text-sm"
//           placeholder="Therapist name or Id"
//           value={filters.therapistName}
//           onChange={e => setFilters({ ...filters, therapistName: e.target.value })}
//         />
//       </div>
//       <select
//         className="py-1 px-2 border rounded bg-white text-sm"
//         value={filters.therapyType}
//         onChange={e => setFilters({ ...filters, therapyType: e.target.value })}
//       >
//         <option value="">All Therapy Types</option>
//         {therapyTypes.map(tt => (
//           <option value={tt._id} key={tt._id}>{tt.name}</option>
//         ))}
//       </select>
//       {/* --- Slot wise filter dropdown --- */}
//       <select
//         className="py-1 px-2 border rounded bg-white text-sm"
//         value={filters.slotId}
//         onChange={e => setFilters({ ...filters, slotId: e.target.value })}
//       >
//         <option value="">All Slots</option>
//         {SESSION_TIME_OPTIONS.map(opt => (
//           <option value={opt.id} key={opt.id}>{opt.label}</option>
//         ))}
//       </select>
//       <label className="flex items-center gap-1 text-sm cursor-pointer">
//         <input
//           type="checkbox"
//           checked={filters.onlyLimited}
//           onChange={e => setFilters({ ...filters, onlyLimited: e.target.checked })}
//         />
//         Limited slots
//       </label>
//       {/* <select
//         className="py-1 px-2 border rounded bg-white text-sm"
//         value={filters.checkedIn}
//         onChange={e => setFilters({ ...filters, checkedIn: e.target.value })}
//       >
//         <option value="">All Check-ins</option>
//         <option value="yes">Checked In</option>
//         <option value="no">Not Checked In</option>
//       </select> */}
//       {/* --- Status filter dropdown --- */}
//       <select
//         className="py-1 px-2 border rounded bg-white text-sm"
//         value={filters.status || ""}
//         onChange={e => setFilters({ ...filters, status: e.target.value })}
//         style={{ minWidth: 130 }}
//       >
//         <option value="">All Statuses</option>
//         {SESSION_STATUS_OPTIONS.map(opt => (
//           <option key={opt.value} value={opt.value}>{opt.label}</option>
//         ))}
//       </select>
//     </div>
//   );
// }

// // --- Main Calendar Grid Display ---
// function CalendarMonthGrid({
//   today,
//   year,
//   month,
//   daysInMonth,
//   startDay,
//   getCalendarWeeks,
//   getSessionsForDay,
//   setModalDay,
//   setModalSessions,
// }: {
//   today: Date;
//   year: number;
//   month: number;
//   daysInMonth: number;
//   startDay: number;
//   getCalendarWeeks: () => number;
//   getSessionsForDay: (day: number) => Session[];
//   setModalDay: (d: number | null) => void;
//   setModalSessions: (s: Session[] | null) => void;
// }) {
//   return (
//     <div
//       className={`grid grid-cols-7 w-full flex-1`}
//       style={{
//         height: "calc(100vh - 231px)",
//         minHeight: "0",
//         maxHeight: "100%",
//         gridTemplateRows: `repeat(${getCalendarWeeks()}, minmax(0, 1fr))`,
//         fontSize: "0.91rem",
//       }}
//     >
//       {/* Fill empty days at start */}
//       {Array.from({ length: startDay }).map((_, i) => (
//         <div
//           key={`empty-${i}`}
//           className="border h-full bg-slate-50"
//           style={{
//             minHeight: 0,
//             minWidth: 0,
//             boxSizing: "border-box",
//           }}
//         />
//       ))}
//       {/* Actual days */}
//       {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
//         const day = dayIdx + 1;
//         const sessionsForDay = getSessionsForDay(day);
//         const isToday =
//           day === today.getDate() &&
//           month === today.getMonth() &&
//           year === today.getFullYear();

//         const showCount = 2;
//         const sessionsToDisplay = sessionsForDay.slice(0, showCount);
//         const moreSessionsCount = sessionsForDay.length - showCount;
//         return (
//           <div
//             key={`day-${day}`}
//             onClick={() => {
//               setModalDay(day);
//               setModalSessions(sessionsForDay);
//             }}
//             className={`relative border flex flex-col p-1 transition min-h-0 min-w-0
//             ${isToday ? "bg-sky-50 border-sky-400" : "bg-white hover:bg-slate-50"}`}
//             style={{
//               boxSizing: "border-box",
//               overflow: "hidden",
//               minHeight: "60px",
//               height: "100%",
//             }}
//           >
//             {/* Day header */}
//             <div
//               className="font-semibold text-center select-none mb-1"
//               style={{
//                 color: isToday ? "#0ea5e9" : undefined,
//                 background: isToday ? "#e0f2fe" : undefined,
//                 borderRadius: "5px",
//                 padding: "1px 0",
//                 width: "1.3rem",
//                 fontSize: "0.93rem",
//                 lineHeight: "1.3rem",
//                 margin: "0 auto",
//               }}
//             >
//               {day}
//             </div>
//             {sessionsForDay.length > 0 && (
//               <div className="flex flex-col w-full flex-1">
//                 {sessionsToDisplay.map((session, idx) => (
//                   <CalendarSessionItem
//                     session={session}
//                     key={session._id || `${session.date}-${session.slotId}-${idx}`}
//                   />
//                 ))}
//                 {moreSessionsCount > 0 && (
//                   <button
//                     className="px-1 py-0.5 mt-1 text-sky-700 rounded hover:bg-sky-100 text-[0.70rem] font-semibold border border-sky-200 flex items-center justify-center"
//                     style={{ minHeight: "22px" }}
//                     onClick={e => {
//                       e.stopPropagation();
//                       setModalDay(day);
//                       setModalSessions(sessionsForDay);
//                     }}
//                     tabIndex={0}
//                   >
//                     +{moreSessionsCount}
//                   </button>
//                 )}
//               </div>
//             )}
//             {sessionsForDay.length === 0 && <div className="flex-1"></div>}
//           </div>
//         );
//       })}
//       {/* Fill trailing days for grid */}
//       {(() => {
//         const totalCells = startDay + daysInMonth;
//         const fullGridCells = getCalendarWeeks() * 7;
//         const trailing = fullGridCells - totalCells;
//         return Array.from({ length: trailing }).map((_, i) => (
//           <div
//             key={`trailing-${i}`}
//             className="border h-full bg-slate-50"
//             style={{
//               minHeight: 0,
//               minWidth: 0,
//               boxSizing: "border-box",
//             }}
//           />
//         ));
//       })()}
//     </div>
//   );
// }

// // --- Main FullCalendar Page ---
// export default function FullCalendar() {
//   const [loading, setLoading] = useState(true);
//   const today = new Date();
//   const [year, setYear] = useState(today.getFullYear());
//   const [month, setMonth] = useState(today.getMonth());
//   const [sessions, setSessions] = useState<Session[]>([]);
//   const [dataLoading, setDataLoading] = useState<boolean>(true);
//   const [modalDay, setModalDay] = useState<number | null>(null);
//   const [modalSessions, setModalSessions] = useState<Session[] | null>(null);

//   // Search and filter local state
//   const [filters, setFilters] = useState<FilterQuery>({
//     patientName: "",
//     therapistName: "",
//     therapyType: "",
//     onlyLimited: false,
//     checkedIn: "",
//     slotId: "",
//     status: "", // <-- ADD STATUS to local filter
//   });

//   const [therapyTypeList, setTherapyTypeList] = useState<TherapyType[]>([]);

//   // Fetch session data (unchanged)
//   const fetchSessions = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("therapist-token");
//       const res = await fetch(
//         `${API_BASE_URL}/api/admin/bookings/full-calendar`,
//         {
//           headers: {
//             Authorization: `${token}`,
//           },
//         }
//       );
//       const json = await res.json();
//       console.log(json);
//       if (json && json.success && Array.isArray(json.data)) {
//         setSessions(processBackendSessionList(json.data));
//         setTherapyTypeList(json.therapyTypes)
//       } else {
//         setSessions([]);
//       }
//     } catch (e) {
//       setSessions([]);
//     }
//   }, []);

//   // Fetch therapy types if needed (for select) (unchanged)
//   const fetchTherapyTypes = useCallback(async () => {
//     try {
//       const token = localStorage.getItem("therapist-token");
//       const res = await fetch(`${API_BASE_URL}/api/admin/therapytypes`, {
//         headers: {
//           Authorization: `${token}`,
//         },
//       });
//       const json = await res.json();
//       if (json && Array.isArray(json.data)) {
//         setTherapyTypeList(json.data);
//       }
//     } catch (e) {}
//   }, []);

//   useEffect(() => {
//     setDataLoading(false);
//   }, []);

//   useEffect(() => {
//     if (!dataLoading && !loading) {
//       fetchSessions();
//       fetchTherapyTypes();
//     }
//   }, [dataLoading, loading, fetchSessions, fetchTherapyTypes]);

//   useEffect(() => {
//     const t = setTimeout(() => setLoading(false), 700);
//     return () => clearTimeout(t);
//   }, []);

//   // Calendar related calculation
//   const daysInMonth = getDaysInMonth(year, month);
//   const startDay = getStartDay(year, month);

//   // =========================
//   // FILTERED sessions logic
//   // =========================
//   const filteredSessions = useMemo(() => {
//     let result = sessions;
//     if (filters.patientName.trim() !== "") {
//       const term = filters.patientName.trim().toLowerCase();
//       result = result.filter(
//         s =>
//           (s.patient?.name?.toLowerCase().includes(term) ?? false) ||
//           (s.patient?.patientId?.toLowerCase().includes(term) ?? false)
//       );
//     }
//     if (filters.therapistName.trim() !== "") {
//       const term = filters.therapistName.trim().toLowerCase();
//       result = result.filter(
//         s =>
//           (s.therapist?.userId?.name?.toLowerCase().includes(term) ?? false) ||
//           (s.therapist?.name?.toLowerCase().includes(term) ?? false) ||
//           (s.therapist?.therapistId?.toLowerCase().includes(term) ?? false)
//       );
//     }
//     if (filters.therapyType.trim() !== "") {
//       result = result.filter(
//         s => s.therapyTypeId?._id === filters.therapyType
//       );
//     }
//     if (filters.slotId && filters.slotId.trim() !== "") {
//       result = result.filter(
//         s => s.slotId === filters.slotId
//       );
//     }
//     if (filters.onlyLimited) {
//       result = result.filter(s =>
//         SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId)?.limited
//       );
//     }
//     if (filters.checkedIn === "yes") {
//       result = result.filter(s => s.isCheckedIn);
//     } else if (filters.checkedIn === "no") {
//       result = result.filter(s => !s.isCheckedIn);
//     }
//     if (filters.status && filters.status !== "") {
//       result = result.filter(s => s.status === filters.status);
//     }
//     return result;
//   }, [sessions, filters]);

//   // Map filtered sessions by date (unchanged)
//   const sessionMap: { [date: string]: Session[] } = useMemo(() => {
//     const m: { [date: string]: Session[] } = {};
//     filteredSessions.forEach((session) => {
//       if (!session.date) return;
//       if (!m[session.date]) m[session.date] = [];
//       m[session.date].push(session);
//     });
//     return m;
//   }, [filteredSessions]);

//   function getSessionsForDay(day: number) {
//     const mth = month + 1;
//     const pad = (n: number) => `${n}`.padStart(2, "0");
//     const dateStr = `${year}-${pad(mth)}-${pad(day)}`;
//     return sessionMap[dateStr] || [];
//   }

//   // calendar rendering helpers
//   const changeMonth = (dir: "prev" | "next") => {
//     if (dir === "prev") {
//       if (month === 0) {
//         setMonth(11);
//         setYear((y) => y - 1);
//       } else setMonth((m) => m - 1);
//     } else {
//       if (month === 11) {
//         setMonth(0);
//         setYear((y) => y + 1);
//       } else setMonth((m) => m + 1);
//     }
//     setModalDay(null);
//     setModalSessions(null);
//   };
//   function getCalendarWeeks() {
//     const calendarCells = startDay + daysInMonth;
//     return Math.ceil(calendarCells / 7);
//   }

//   if (loading || dataLoading) {
//     return (
//       <div className="min-h-screen min-w-screen h-screen w-screen flex items-center justify-center bg-slate-50">
//         <motion.div
//           initial={{ opacity: 0, scale: 0.95 }}
//           animate={{ opacity: 1, scale: 1 }}
//           className="text-slate-600 font-semibold"
//         >
//           Loading Sessions…
//         </motion.div>
//       </div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       className="flex flex-col h-full w-full max-w-full bg-slate-50"
//     >
//       {/* Search and Filter */}
//       <CalendarSearchFilter
//         filters={filters}
//         setFilters={setFilters}
//         therapyTypes={therapyTypeList}
//       />

//       <div className="flex flex-col w-full h-full flex-1">
//         <div className="bg-white border rounded-lg flex flex-col shadow h-full w-full">
//           {/* Header */}
//           <div className="flex items-center justify-between px-4 py-4 border-b bg-slate-50">
//             <div className="flex items-center gap-2 font-semibold text-lg">
//               <FiCalendar />
//               {new Date(year, month).toLocaleString("default", {
//                 month: "long",
//               })}{" "}
//               {year}
//             </div>
//             <div className="flex gap-2">
//               <button
//                 onClick={() => changeMonth("prev")}
//                 className="p-2 border rounded bg-white hover:bg-slate-100"
//               >
//                 <FiChevronLeft />
//               </button>
//               <button
//                 onClick={() => changeMonth("next")}
//                 className="p-2 border rounded bg-white hover:bg-slate-100"
//               >
//                 <FiChevronRight />
//               </button>
//             </div>
//           </div>
//           {/* Days header */}
//           <div className="grid grid-cols-7 text-xs text-slate-500 border-b bg-slate-100">
//             {DAYS.map((d) => (
//               <div key={d} className="p-2 text-center font-medium select-none">
//                 {d}
//               </div>
//             ))}
//           </div>
//           {/* Calendar body */}
//           <CalendarMonthGrid
//             today={today}
//             year={year}
//             month={month}
//             daysInMonth={daysInMonth}
//             startDay={startDay}
//             getCalendarWeeks={getCalendarWeeks}
//             getSessionsForDay={getSessionsForDay}
//             setModalDay={setModalDay}
//             setModalSessions={setModalSessions}
//           />
//         </div>
//       </div>
//       {/* Modal for all session details */}
//       <Modal
//         open={modalDay !== null}
//         onClose={() => {
//           setModalDay(null);
//           setModalSessions(null);
//         }}
//         title={
//           modalDay
//             ? `All Sessions on ${formatDateForDisplay(`${year}-${String(month + 1).padStart(2, "0")}-${String(
//                   modalDay
//                 ).padStart(2, "0")}`)}`
//             : undefined
//         }
//       >
//         {modalDay && modalSessions && modalSessions.length > 0 ? (
//           <div className="flex flex-col gap-2">
//             {modalSessions.map((session, idx) => (
//               <div key={session._id || `${session.date}-${session.slotId}-${idx}`}>
//                 <CalendarSessionItem session={session} showAllDetails={true} />
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div>No sessions</div>
//         )}
//       </Modal>
//     </motion.div>
//   );
// }

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import {
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiSearch,
  FiEdit2,
  FiArrowLeft,
} from "react-icons/fi";
import "react-toastify/dist/ReactToastify.css";

// --- Constants and Types ---
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const SESSION_TIME_OPTIONS = [
  { id: "0830-0915", label: "08:30 to 09:15", limited: true },
  { id: "0915-1000", label: "09:15 to 10:00", limited: true },
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
  { id: "1800-1845", label: "18:00 to 18:45", limited: true },
  { id: "1845-1930", label: "18:45 to 19:30", limited: true },
  { id: "1930-2015", label: "19:30 to 20:15", limited: true },
];

const SESSION_STATUS_OPTIONS = [
  { value: "CheckedIn", label: "Checked In" },
  { value: "NotCheckedIn", label: "Not Checked In" },
  { value: "Missed", label: "Missed" },
];

type TherapistUser = {
  _id: string;
  name: string;
};
type Therapist = {
  _id: string;
  therapistId?: string;
  name?: string;
  userId?: TherapistUser;
};
type TherapyType = {
  _id: string;
  name: string;
};
type BackendCalendarRecord = {
  appointmentId: string;
  bookingId?: string;
  patient: {
    patientId: string;
    name: string;
  };
  session: {
    date: string;
    slotId: string;
    sessionId?: string;
    therapist?: Therapist;
    therapyTypeId?: TherapyType;
    isCheckedIn?: boolean;
    _id?: string;
    status?: string;
  };
  therapist?: {
    therapistId: string;
    name?: string;
  };
};
type Session = {
  _id?: string;
  date: string;
  slotId: string;
  sessionId?: string;
  isCheckedIn?: boolean;
  appointmentId?: string;
  bookingId?: string;
  patient?: { patientId: string; name: string };
  therapist?: Therapist;
  therapyTypeId?: TherapyType;
  status?: string;
};
const API_BASE_URL = import.meta.env.VITE_API_URL as string;

// --- Helpers ---

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function getPatientDisplayName(patient: any) {
  if (!patient) return "";
  const name = patient.name || "";
  const patientId = patient.patientId || "";
  let resultName = name;
  if (patientId) {
    resultName += ` [${patientId}]`;
  }
  return resultName;
}
function processBackendSessionList(data: BackendCalendarRecord[]): Session[] {
  return data.map((rec) => {
    const { appointmentId, bookingId, patient, session } = rec;
    return {
      _id: session._id,
      appointmentId,
      bookingId,
      patient: patient && {
        patientId: patient.patientId,
        name: patient.name,
      },
      date: session.date,
      slotId: session.slotId,
      sessionId: session.sessionId,
      therapist: session.therapist,
      therapyTypeId: session.therapyTypeId,
      isCheckedIn: session.isCheckedIn,
      status: session.status,
    };
  });
}

/**
 * Format a date string (YYYY-MM-DD) as DD/MM/YYYY.
 */
function formatDateForDisplay(dateStr: string | Date): string {
  if (!dateStr) return '';
  let d: Date;
  if (typeof dateStr === "string") {
    if (dateStr.length === 10 && dateStr.includes("-")) {
      const [y, m, d0] = dateStr.split("-");
      return `${d0.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    d = new Date(dateStr);
  } else if (dateStr instanceof Date) {
    d = dateStr;
  } else {
    return '';
  }
  if (isNaN(d.getTime())) return '';
  return `${String(d.getDate()).padStart(2, "0")}/${String(
    d.getMonth() + 1
  ).padStart(2, "0")}/${d.getFullYear()}`;
}
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- UI Atomic Components ---

function PatientDetailsBox({ patient }: { patient: { name: string; patientId: string } }) {
  if (!patient) return null;
  return (
    <div className="rounded border px-2 py-2 bg-white mb-1">
      <div className="font-semibold text-indigo-800 text-base">
        {patient.patientId ? (
          <a
            href={`/admin/children?patientId=${encodeURIComponent(patient.patientId)}`}
            className="text-blue-700 hover:underline"
            title="View children details"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {patient.name}
          </a>
        ) : (
          patient.name
        )}
        {patient.patientId && (
          <span className="text-indigo-600 text-xs ml-1">
            [{patient.patientId}]
          </span>
        )}
      </div>
    </div>
  );
}
function AppointmentIdBox({ appointmentId }: { appointmentId: string }) {
  if (!appointmentId) return null;
  return (
    <div className="mb-1 px-1 rounded-full font-semibold text-[0.98em] bg-teal-100 text-teal-800 inline-block">
      Booking ID: {appointmentId}
    </div>
  );
}
function SessionIdBox({ sessionId }: { sessionId: string }) {
  if (!sessionId) return null;
  return (
    <div className="mb-1 px-1 rounded-full font-semibold text-[0.92em] bg-blue-100 text-blue-800 inline-block">
      Session ID: {sessionId}
    </div>
  );
}
function TherapyTypeBox({ therapyType }: { therapyType: TherapyType }) {
  if (!therapyType) return null;
  return (
    <div className="my-1 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1 border border-slate-200">
      <div>
        <b>Therapy Type:</b>{" "}
        <span className="font-semibold text-indigo-700">{therapyType.name}</span>
      </div>
    </div>
  );
}
function TherapistBox({ therapist }: { therapist: Therapist }) {
  if (!therapist) return null;
  let therapistId = therapist.therapistId;
  let therapistUserId = therapist._id
  const display = therapist.userId?.name || therapist.name || "-";
  return (
    <div className="my-1 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1 border border-slate-200">
      <div>
        <b>Therapist:</b>{" "}
        {therapistId ? (
          <a
            href={`/admin/therapists?therapistId=${encodeURIComponent(therapistUserId)}`}
            className="text-blue-600 hover:underline"
            title="View therapist details"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
          >
            {display}
          </a>
        ) : (
          display
        )}
        {therapist.therapistId ? ` (${therapist.therapistId})` : ""}
      </div>
    </div>
  );
}

// --- Modal Wrapper ---
function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/30 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 30 }}
          className="bg-white rounded-lg shadow-xl p-6 relative min-w-[320px] max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-2 right-2 text-gray-400 hover:text-black"
            onClick={onClose}
            tabIndex={-1}
          >
            <FiX size={20} />
          </button>
          {title && (
            <h2 className="mb-4 text-lg font-bold text-gray-800 border-b pb-2">
              {title}
            </h2>
          )}
          <div className="overflow-y-auto max-h-[60vh] pr-1">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Session Visual (month view cards) ---
function CalendarSessionItem({
  session,
  showAllDetails = false,
}: {
  session: Session;
  showAllDetails?: boolean;
}) {
  const slot = SESSION_TIME_OPTIONS.find((opt) => opt.id === session.slotId);
  const patient = session.patient;
  const appointmentId = session.appointmentId;
  const therapist = session.therapist;
  const therapyType = session.therapyTypeId;
  const sessionId = session.sessionId;
  const status = session.status;

  function renderStatus() {
    if (!status) return null;
    let color, bgColor, text;
    if (status === "CheckedIn") {
      color = "text-green-900";
      bgColor = "bg-green-200";
      text = "Checked In";
    } else if (status === "Missed") {
      color = "text-red-900";
      bgColor = "bg-red-200";
      text = "Missed";
    } else if (status === "NotCheckedIn") {
      color = "text-slate-700";
      bgColor = "bg-slate-200";
      text = "Not Checked In";
    } else {
      color = "text-slate-700";
      bgColor = "bg-slate-100";
      text = status;
    }
    return (
      <span className={`${bgColor} px-2 py-0.5 rounded ${color} text-xs font-semibold ml-2`}>
        {text}
      </span>
    );
  }

  if (!showAllDetails) {
    return (
      <div
        className={`rounded border flex flex-col justify-end border-sky-300 px-1 py-0.5 bg-sky-50 text-xs mb-1
        ${slot && slot.limited ? "border-orange-400 bg-orange-50" : ""}`}
      >
        <span className="font-bold text-indigo-900">
          {patient && patient.patientId ? (
            <a
              href={`/admin/children?patientId=${encodeURIComponent(patient.patientId)}`}
              className="text-blue-700 hover:underline"
              title="View patient details"
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
            >
              {getPatientDisplayName(patient)}
            </a>
          ) : (
            getPatientDisplayName(patient)
          )}
        </span>
        <span>
          <span className="text-sky-700">
            {slot ? slot.label : session.slotId}
          </span>
          {slot && slot.limited && (
            <span className="ml-1 text-amber-600 font-semibold">(Limited)</span>
          )}
        </span>
        {sessionId && (
          <span className="text-[0.72em] text-blue-700 mt-1">
            Session ID: <span className="font-mono">{sessionId}</span>
          </span>
        )}
      </div>
    );
  } else {
    return (
      <div className="mb-3 p-2 rounded border border-indigo-300 bg-slate-50 flex flex-col">
        {appointmentId && <AppointmentIdBox appointmentId={appointmentId} />}
        {sessionId && <SessionIdBox sessionId={sessionId} />}
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xs text-slate-700">{formatDateForDisplay(session.date)}</span>
          <span
            className={`inline-block rounded px-2 py-0.5 mr-1 text-xs font-semibold ${
              slot && slot.limited
                ? "bg-amber-100 text-amber-700 border border-amber-300"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            {slot ? slot.label : session.slotId}
          </span>
          {renderStatus()}
        </div>
        {patient && <PatientDetailsBox patient={patient} />}
        {therapyType && <TherapyTypeBox therapyType={therapyType} />}
        {therapist && <TherapistBox therapist={therapist} />}
      </div>
    );
  }
}

// --- Search and Filter Component ---
type FilterQuery = {
  patientName: string;
  therapistName: string;
  therapyType: string;
  onlyLimited: boolean;
  checkedIn: string;
  slotId: string;
  status?: string;
};
function CalendarSearchFilter({
  filters,
  setFilters,
  therapyTypes,
}: {
  filters: FilterQuery;
  setFilters: (f: FilterQuery) => void;
  therapyTypes: TherapyType[];
}) {
  return (
    <div className="p-4 flex flex-wrap gap-4 items-center border-b bg-slate-50">
      <div className="relative">
        <FiSearch className="absolute left-2 top-2.5 text-slate-400" />
        <input
          type="text"
          className="pl-8 pr-2 py-1 border rounded focus:outline-sky-400 bg-white text-sm"
          placeholder="Search Children or Id"
          value={filters.patientName}
          onChange={e => setFilters({ ...filters, patientName: e.target.value })}
        />
      </div>
      <div className="relative">
        <FiSearch className="absolute left-2 top-2.5 text-slate-400" />
        <input
          type="text"
          className="pl-8 pr-2 py-1 border rounded focus:outline-sky-400 bg-white text-sm"
          placeholder="Therapist name or Id"
          value={filters.therapistName}
          onChange={e => setFilters({ ...filters, therapistName: e.target.value })}
        />
      </div>
      <select
        className="py-1 px-2 border rounded bg-white text-sm"
        value={filters.therapyType}
        onChange={e => setFilters({ ...filters, therapyType: e.target.value })}
      >
        <option value="">All Therapy Types</option>
        {therapyTypes.map(tt => (
          <option value={tt._id} key={tt._id}>{tt.name}</option>
        ))}
      </select>
      <select
        className="py-1 px-2 border rounded bg-white text-sm"
        value={filters.slotId}
        onChange={e => setFilters({ ...filters, slotId: e.target.value })}
      >
        <option value="">All Slots</option>
        {SESSION_TIME_OPTIONS.map(opt => (
          <option value={opt.id} key={opt.id}>{opt.label}</option>
        ))}
      </select>
      <label className="flex items-center gap-1 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={filters.onlyLimited}
          onChange={e => setFilters({ ...filters, onlyLimited: e.target.checked })}
        />
        Limited slots
      </label>
      <select
        className="py-1 px-2 border rounded bg-white text-sm"
        value={filters.status || ""}
        onChange={e => setFilters({ ...filters, status: e.target.value })}
        style={{ minWidth: 130 }}
      >
        <option value="">All Statuses</option>
        {SESSION_STATUS_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// --- Main Calendar Grid Display (Month view) ---
function CalendarMonthGrid({
  today,
  year,
  month,
  daysInMonth,
  startDay,
  getCalendarWeeks,
  getSessionsForDay,
  onDayClick,
}: {
  today: Date;
  year: number;
  month: number;
  daysInMonth: number;
  startDay: number;
  getCalendarWeeks: () => number;
  getSessionsForDay: (day: number) => Session[];
  onDayClick: (day: number) => void;
}) {
  return (
    <div
      className={`grid grid-cols-7 w-full flex-1`}
      style={{
        height: "calc(100vh - 231px)",
        minHeight: "0",
        maxHeight: "100%",
        gridTemplateRows: `repeat(${getCalendarWeeks()}, minmax(0, 1fr))`,
        fontSize: "0.91rem",
      }}
    >
      {Array.from({ length: startDay }).map((_, i) => (
        <div
          key={`empty-${i}`}
          className="border h-full bg-slate-50"
          style={{ minHeight: 0, minWidth: 0, boxSizing: "border-box" }}
        />
      ))}
      {Array.from({ length: daysInMonth }).map((_, dayIdx) => {
        const day = dayIdx + 1;
        const sessionsForDay = getSessionsForDay(day);
        const isToday =
          day === today.getDate() &&
          month === today.getMonth() &&
          year === today.getFullYear();

        const showCount = 2;
        const sessionsToDisplay = sessionsForDay.slice(0, showCount);
        const moreSessionsCount = sessionsForDay.length - showCount;
        return (
          <div
            key={`day-${day}`}
            onClick={() => onDayClick(day)}
            className={`relative border flex flex-col p-1 transition min-h-0 min-w-0 cursor-pointer
            ${isToday ? "bg-sky-50 border-sky-400" : "bg-white hover:bg-slate-50"}`}
            style={{
              boxSizing: "border-box",
              overflow: "hidden",
              minHeight: "60px",
              height: "100%",
            }}
          >
            <div
              className="font-semibold text-center select-none mb-1"
              style={{
                color: isToday ? "#0ea5e9" : undefined,
                background: isToday ? "#e0f2fe" : undefined,
                borderRadius: "5px",
                padding: "1px 0",
                width: "1.3rem",
                fontSize: "0.93rem",
                lineHeight: "1.3rem",
                margin: "0 auto",
              }}
            >
              {day}
            </div>
            {sessionsForDay.length > 0 && (
              <div className="flex flex-col w-full flex-1">
                {sessionsToDisplay.map((session, idx) => (
                  <CalendarSessionItem
                    session={session}
                    key={session._id || `${session.date}-${session.slotId}-${idx}`}
                  />
                ))}
                {moreSessionsCount > 0 && (
                  <button
                    className="px-1 py-0.5 mt-1 text-sky-700 rounded hover:bg-sky-100 text-[0.70rem] font-semibold border border-sky-200 flex items-center justify-center"
                    style={{ minHeight: "22px" }}
                    onClick={e => {
                      e.stopPropagation();
                      onDayClick(day);
                    }}
                    tabIndex={0}
                  >
                    +{moreSessionsCount}
                  </button>
                )}
              </div>
            )}
            {sessionsForDay.length === 0 && <div className="flex-1"></div>}
          </div>
        );
      })}
      {(() => {
        const totalCells = startDay + daysInMonth;
        const fullGridCells = getCalendarWeeks() * 7;
        const trailing = fullGridCells - totalCells;
        return Array.from({ length: trailing }).map((_, i) => (
          <div
            key={`trailing-${i}`}
            className="border h-full bg-slate-50"
            style={{ minHeight: 0, minWidth: 0, boxSizing: "border-box" }}
          />
        ));
      })()}
    </div>
  );
}

// ============================================================
// DAY GRID VIEW (therapists as columns, time slots as rows)
// ============================================================

function SessionCard({
  session,
  onEdit,
}: {
  session: Session;
  onEdit: (s: Session) => void;
}) {
  const slot = SESSION_TIME_OPTIONS.find((o) => o.id === session.slotId);
  const status = session.status;
  let statusColor = "bg-slate-100 text-slate-700 border-slate-300";
  if (status === "CheckedIn") statusColor = "bg-green-100 text-green-800 border-green-300";
  else if (status === "Missed") statusColor = "bg-red-100 text-red-800 border-red-300";

  const canEdit = status !== "CheckedIn";

  return (
    <div
      className={`relative rounded border px-2 py-1 mb-1 text-xs group cursor-pointer ${statusColor} ${
        slot?.limited ? "ring-1 ring-amber-300" : ""
      }`}
      onClick={() => canEdit && onEdit(session)}
      title={canEdit ? "Click to move this session" : "Checked-in sessions can't be moved"}
    >
      <div className="font-semibold truncate">
        {session.patient?.name || "Unknown"}{" "}
        {session.patient?.patientId && (
          <span className="opacity-70">[{session.patient.patientId}]</span>
        )}
      </div>
      <div className="flex items-center justify-between mt-0.5">
        <span className="truncate opacity-80">
          {session.appointmentId} {session.sessionId ? `· ${session.sessionId}` : ""}
        </span>
        {canEdit && (
          <FiEdit2
            className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-1"
            size={11}
          />
        )}
      </div>
    </div>
  );
}

function ConfirmMoveModal({
  open,
  session,
  fromTherapistName,
  toTherapistName,
  fromSlotLabel,
  toSlotLabel,
  fromDate,
  toDate,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  session: Session | null;
  fromTherapistName: string;
  toTherapistName: string;
  fromSlotLabel: string;
  toSlotLabel: string;
  fromDate: string;
  toDate: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open || !session) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center"
        onClick={onCancel}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-bold text-gray-800 mb-1">Confirm session move</h3>
          <p className="text-sm text-slate-600 mb-4">
            Move <span className="font-semibold">{session.patient?.name}</span>'s session
            (Booking {session.appointmentId}) as follows?
          </p>
          <div className="rounded border bg-slate-50 p-3 text-sm space-y-1 mb-4">
            <div>
              <span className="text-slate-500">Date: </span>
              <span className="font-medium">{formatDateForDisplay(fromDate)}</span>
              {fromDate !== toDate && (
                <>
                  {" "}→{" "}
                  <span className="font-medium text-sky-700">{formatDateForDisplay(toDate)}</span>
                </>
              )}
            </div>
            <div>
              <span className="text-slate-500">Time: </span>
              <span className="font-medium">{fromSlotLabel}</span>
              {fromSlotLabel !== toSlotLabel && (
                <>
                  {" "}→{" "}
                  <span className="font-medium text-sky-700">{toSlotLabel}</span>
                </>
              )}
            </div>
            <div>
              <span className="text-slate-500">Therapist: </span>
              <span className="font-medium">{fromTherapistName}</span>
              {fromTherapistName !== toTherapistName && (
                <>
                  {" "}→{" "}
                  <span className="font-medium text-sky-700">{toTherapistName}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 rounded bg-sky-600 text-white text-sm hover:bg-sky-700 disabled:opacity-60"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "Moving…" : "Confirm move"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function EditSessionPanel({
  open,
  session,
  therapists,
  allSessions,
  onClose,
  onRequestConfirm,
}: {
  open: boolean;
  session: Session | null;
  therapists: Therapist[];
  allSessions: Session[];
  onClose: () => void;
  onRequestConfirm: (newDate: string, newSlotId: string, newTherapistId: string) => void;
}) {
  const [newDate, setNewDate] = useState("");
  const [newSlotId, setNewSlotId] = useState("");
  const [newTherapistId, setNewTherapistId] = useState("");

  useEffect(() => {
    if (session) {
      setNewDate(session.date);
      setNewSlotId(session.slotId);
      setNewTherapistId(session.therapist?._id || "");
    }
  }, [session]);

  // Every OTHER session (excluding the one being moved) that already
  // occupies a given date+slot+therapist combination — used to grey out
  // slots that are already taken, and to flag a therapist whose whole day
  // is full.
  const takenKeys = useMemo(() => {
    const set = new Set<string>();
    allSessions.forEach((s) => {
      if (session && s._id === session._id) return; // ignore the session we're moving
      if (!s.date || !s.slotId || !s.therapist?._id) return;
      set.add(`${s.date}|${s.slotId}|${s.therapist._id}`);
    });
    return set;
  }, [allSessions, session]);

  const isTaken = (date: string, slotId: string, therapistId: string) =>
    !!date && !!slotId && !!therapistId && takenKeys.has(`${date}|${slotId}|${therapistId}`);

  // For the currently selected therapist + date, how many slots are free —
  // shown as a quick summary so the admin isn't hunting through the dropdown.
  const availableCountForTherapist = useMemo(() => {
    if (!newTherapistId || !newDate) return null;
    const free = SESSION_TIME_OPTIONS.filter(
      (opt) => !isTaken(newDate, opt.id, newTherapistId)
    ).length;
    return { free, total: SESSION_TIME_OPTIONS.length };
  }, [newTherapistId, newDate, takenKeys]);

  // If the currently selected slot became unavailable (e.g. admin changed
  // therapist or date to something that's already booked), clear it so they
  // can't accidentally submit a conflicting move.
  useEffect(() => {
    if (newDate && newSlotId && newTherapistId && isTaken(newDate, newSlotId, newTherapistId)) {
      // Only auto-clear if it's not literally the session's original slot
      if (!(session && session.date === newDate && session.slotId === newSlotId && session.therapist?._id === newTherapistId)) {
        setNewSlotId("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newDate, newTherapistId, takenKeys]);

  if (!open || !session) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 250, damping: 28 }}
          className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-black"
            onClick={onClose}
          >
            <FiX size={18} />
          </button>
          <h3 className="text-base font-bold text-gray-800 mb-4">Move session</h3>

          <div className="mb-3 text-sm">
            <div className="font-semibold text-indigo-800">{session.patient?.name}</div>
            <div className="text-slate-500 text-xs">
              Booking {session.appointmentId} · Session {session.sessionId}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Date</label>
              <input
                type="date"
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Therapist</label>
              <select
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={newTherapistId}
                onChange={(e) => setNewTherapistId(e.target.value)}
              >
                {therapists.map((t) => {
                  const freeCount = newDate
                    ? SESSION_TIME_OPTIONS.filter((opt) => !isTaken(newDate, opt.id, t._id)).length
                    : null;
                  return (
                    <option key={t._id} value={t._id}>
                      {t.userId?.name || t.name} {t.therapistId ? `(${t.therapistId})` : ""}
                      {freeCount !== null ? ` — ${freeCount} slot${freeCount === 1 ? "" : "s"} free` : ""}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-600">Time slot</label>
                {availableCountForTherapist && (
                  <span className="text-[11px] text-slate-500">
                    {availableCountForTherapist.free}/{availableCountForTherapist.total} free
                  </span>
                )}
              </div>
              <select
                className="w-full border rounded px-2 py-1.5 text-sm"
                value={newSlotId}
                onChange={(e) => setNewSlotId(e.target.value)}
              >
                <option value="" disabled>
                  {newTherapistId ? "Select an available slot" : "Pick a therapist first"}
                </option>
                {SESSION_TIME_OPTIONS.map((opt) => {
                  const taken = newTherapistId ? isTaken(newDate, opt.id, newTherapistId) : false;
                  const isOriginalSlot =
                    session &&
                    session.date === newDate &&
                    session.slotId === opt.id &&
                    session.therapist?._id === newTherapistId;
                  return (
                    <option key={opt.id} value={opt.id} disabled={taken && !isOriginalSlot}>
                      {opt.label} {opt.limited ? "(Limited)" : ""}
                      {isOriginalSlot ? " — current" : taken ? " — Booked" : ""}
                    </option>
                  );
                })}
              </select>
              {newTherapistId && availableCountForTherapist?.free === 0 && (
                <p className="text-[11px] text-red-600 mt-1">
                  This therapist has no free slots on {formatDateForDisplay(newDate)}. Pick another
                  date or therapist.
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5">
            <button className="px-3 py-1.5 rounded border text-sm hover:bg-slate-50" onClick={onClose}>
              Cancel
            </button>
            <button
              className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-50"
              disabled={
                !newDate ||
                !newSlotId ||
                !newTherapistId ||
                (isTaken(newDate, newSlotId, newTherapistId) &&
                  !(session.date === newDate && session.slotId === newSlotId && session.therapist?._id === newTherapistId))
              }
              onClick={() => onRequestConfirm(newDate, newSlotId, newTherapistId)}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DayGridView({
  selectedDate,
  setSelectedDate,
  sessions,
  therapists,
  onBackToMonth,
  refetchSessions,
}: {
  selectedDate: string;
  setSelectedDate: (d: string) => void;
  sessions: Session[];
  therapists: Therapist[];
  onBackToMonth: () => void;
  refetchSessions: () => void;
}) {
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [pendingMove, setPendingMove] = useState<{
    newDate: string;
    newSlotId: string;
    newTherapistId: string;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Sessions for the selected day, keyed by therapist -> slot
  const dayGrid = useMemo(() => {
    const map: Record<string, Record<string, Session[]>> = {};
    sessions
      .filter((s) => s.date === selectedDate)
      .forEach((s) => {
        const tId = s.therapist?._id || "unknown";
        if (!map[tId]) map[tId] = {};
        if (!map[tId][s.slotId]) map[tId][s.slotId] = [];
        map[tId][s.slotId].push(s);
      });
    return map;
  }, [sessions, selectedDate]);

  const changeDay = (dir: "prev" | "next") => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setDate(d.getDate() + (dir === "prev" ? -1 : 1));
    setSelectedDate(toISODate(d));
  };

  const handleRequestConfirm = (newDate: string, newSlotId: string, newTherapistId: string) => {
    setPendingMove({ newDate, newSlotId, newTherapistId });
  };

  const handleConfirmMove = async () => {
    if (!editingSession || !pendingMove) return;
    setConfirmLoading(true);
    try {
      console.log(editingSession);
      console.log(pendingMove);

      const token = localStorage.getItem("admin-token");
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/move-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `${token}`,
        },
        body: JSON.stringify({
          bookingId: editingSession.bookingId,
          sessionId: editingSession._id,
          newDate: pendingMove.newDate,
          newSlotId: pendingMove.newSlotId,
          newTherapistId: pendingMove.newTherapistId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Session moved successfully");
        setEditingSession(null);
        setPendingMove(null);
        refetchSessions();
      } else {
        toast.error(json.message || "Failed to move session");
      }
    } catch (e) {
      toast.error("Failed to move session");
    } finally {
      setConfirmLoading(false);
    }
  };

  const fromTherapist = editingSession?.therapist;
  const toTherapist = therapists.find((t) => t._id === pendingMove?.newTherapistId);
  const fromSlotLabel =
    SESSION_TIME_OPTIONS.find((o) => o.id === editingSession?.slotId)?.label || "";
  const toSlotLabel =
    SESSION_TIME_OPTIONS.find((o) => o.id === pendingMove?.newSlotId)?.label || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full bg-slate-50"
    >
      {/* Header / day nav */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToMonth}
            className="p-2 border rounded hover:bg-slate-100 flex items-center gap-1 text-sm font-medium"
          >
            <FiArrowLeft /> Month view
          </button>
          <div className="flex items-center gap-2 font-semibold text-lg">
            <FiCalendar />
            {formatDateForDisplay(selectedDate)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => changeDay("prev")} className="p-2 border rounded hover:bg-slate-100">
            <FiChevronLeft />
          </button>
          <input
            type="date"
            className="border rounded px-2 py-1.5 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button onClick={() => changeDay("next")} className="p-2 border rounded hover:bg-slate-100">
            <FiChevronRight />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto">
        {therapists.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">No therapists found.</div>
        ) : (
          <table className="border-collapse w-full text-xs">
            <thead className="sticky top-0 z-10 bg-white shadow-sm">
              <tr>
                <th className="border p-2 bg-slate-100 sticky left-0 z-20 min-w-[110px] text-left">
                  Time
                </th>
                {therapists.map((t) => (
                  <th key={t._id} className="border p-2 bg-slate-100 min-w-[180px] text-left">
                    {t.userId?.name || t.name}{" "}
                    {t.therapistId ? <span className="text-slate-400">({t.therapistId})</span> : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSION_TIME_OPTIONS.map((slot) => (
                <tr key={slot.id}>
                  <td
                    className={`border p-2 sticky left-0 bg-white font-medium z-10 ${
                      slot.limited ? "text-amber-600" : "text-slate-700"
                    }`}
                  >
                    {slot.label}
                    {slot.limited && <div className="text-[10px] text-amber-500">Limited</div>}
                  </td>
                  {therapists.map((t) => {
                    const cellSessions = dayGrid[t._id]?.[slot.id] || [];
                    return (
                      <td key={t._id} className="border p-1 align-top">
                        {cellSessions.map((s) => (
                          <SessionCard key={s._id} session={s} onEdit={setEditingSession} />
                        ))}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <EditSessionPanel
        open={!!editingSession && !pendingMove}
        session={editingSession}
        therapists={therapists}
        allSessions={sessions}
        onClose={() => setEditingSession(null)}
        onRequestConfirm={handleRequestConfirm}
      />

      <ConfirmMoveModal
        open={!!editingSession && !!pendingMove}
        session={editingSession}
        fromTherapistName={fromTherapist?.userId?.name || fromTherapist?.name || "-"}
        toTherapistName={toTherapist?.userId?.name || toTherapist?.name || "-"}
        fromSlotLabel={fromSlotLabel}
        toSlotLabel={toSlotLabel}
        fromDate={editingSession?.date || ""}
        toDate={pendingMove?.newDate || ""}
        loading={confirmLoading}
        onConfirm={handleConfirmMove}
        onCancel={() => setPendingMove(null)}
      />
    </motion.div>
  );
}

// --- Main FullCalendar Page ---
export default function FullCalendar() {
  const [loading, setLoading] = useState(true);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [modalDay, setModalDay] = useState<number | null>(null);
  const [modalSessions, setModalSessions] = useState<Session[] | null>(null);

  // View mode: 'month' (grid of days) or 'day' (therapist x slot grid for one day)
  const [viewMode, setViewMode] = useState<"month" | "day">("month");
  const [selectedDayDate, setSelectedDayDate] = useState<string>(toISODate(today));

  const [therapistList, setTherapistList] = useState<Therapist[]>([]);

  const [filters, setFilters] = useState<FilterQuery>({
    patientName: "",
    therapistName: "",
    therapyType: "",
    onlyLimited: false,
    checkedIn: "",
    slotId: "",
    status: "",
  });

  const [therapyTypeList, setTherapyTypeList] = useState<TherapyType[]>([]);

  // Fetch session data
  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(
        `${API_BASE_URL}/api/admin/bookings/full-calendar`,
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
      const json = await res.json();
      console.log(json);
      if (json && json.success && Array.isArray(json.data)) {
        setSessions(processBackendSessionList(json.data));
        setTherapyTypeList(json.therapyTypes)
      } else {
        setSessions([]);
      }
    } catch (e) {
      setSessions([]);
    }
  }, []);

  // Fetch therapy types (for the filter select)
  const fetchTherapyTypes = useCallback(async () => {
    try {
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(`${API_BASE_URL}/api/admin/therapytypes`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      const json = await res.json();
      if (json && Array.isArray(json.data)) {
        setTherapyTypeList(json.data);
      }
    } catch (e) {}
  }, []);

  // Fetch the therapist list (for the day-grid columns)
  const fetchTherapists = useCallback(async () => {
    try {
      const token = localStorage.getItem("therapist-token");
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/home-details`, {
        headers: {
          Authorization: `${token}`,
        },
      });
      const json = await res.json();
      if (json && Array.isArray(json.therapists)) {
        setTherapistList(
          json.therapists.map((t: any) => ({
            _id: t._id,
            therapistId: t.therapistId,
            name: t.name,
          }))
        );
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    setDataLoading(false);
  }, []);

  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchSessions();
      fetchTherapyTypes();
      fetchTherapists();
    }
  }, [dataLoading, loading, fetchSessions, fetchTherapyTypes, fetchTherapists]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Calendar related calculation
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // FILTERED sessions logic
  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (filters.patientName.trim() !== "") {
      const term = filters.patientName.trim().toLowerCase();
      result = result.filter(
        s =>
          (s.patient?.name?.toLowerCase().includes(term) ?? false) ||
          (s.patient?.patientId?.toLowerCase().includes(term) ?? false)
      );
    }
    if (filters.therapistName.trim() !== "") {
      const term = filters.therapistName.trim().toLowerCase();
      result = result.filter(
        s =>
          (s.therapist?.userId?.name?.toLowerCase().includes(term) ?? false) ||
          (s.therapist?.name?.toLowerCase().includes(term) ?? false) ||
          (s.therapist?.therapistId?.toLowerCase().includes(term) ?? false)
      );
    }
    if (filters.therapyType.trim() !== "") {
      result = result.filter(
        s => s.therapyTypeId?._id === filters.therapyType
      );
    }
    if (filters.slotId && filters.slotId.trim() !== "") {
      result = result.filter(
        s => s.slotId === filters.slotId
      );
    }
    if (filters.onlyLimited) {
      result = result.filter(s =>
        SESSION_TIME_OPTIONS.find(opt => opt.id === s.slotId)?.limited
      );
    }
    if (filters.checkedIn === "yes") {
      result = result.filter(s => s.isCheckedIn);
    } else if (filters.checkedIn === "no") {
      result = result.filter(s => !s.isCheckedIn);
    }
    if (filters.status && filters.status !== "") {
      result = result.filter(s => s.status === filters.status);
    }
    return result;
  }, [sessions, filters]);

  // Map filtered sessions by date
  const sessionMap: { [date: string]: Session[] } = useMemo(() => {
    const m: { [date: string]: Session[] } = {};
    filteredSessions.forEach((session) => {
      if (!session.date) return;
      if (!m[session.date]) m[session.date] = [];
      m[session.date].push(session);
    });
    return m;
  }, [filteredSessions]);

  function getSessionsForDay(day: number) {
    const mth = month + 1;
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const dateStr = `${year}-${pad(mth)}-${pad(day)}`;
    return sessionMap[dateStr] || [];
  }

  // calendar rendering helpers
  const changeMonth = (dir: "prev" | "next") => {
    if (dir === "prev") {
      if (month === 0) {
        setMonth(11);
        setYear((y) => y - 1);
      } else setMonth((m) => m - 1);
    } else {
      if (month === 11) {
        setMonth(0);
        setYear((y) => y + 1);
      } else setMonth((m) => m + 1);
    }
    setModalDay(null);
    setModalSessions(null);
  };
  function getCalendarWeeks() {
    const calendarCells = startDay + daysInMonth;
    return Math.ceil(calendarCells / 7);
  }

  // Clicking a day in month view -> jump straight into the day grid for that date
  function handleDayClick(day: number) {
    const mth = month + 1;
    const pad = (n: number) => `${n}`.padStart(2, "0");
    const dateStr = `${year}-${pad(mth)}-${pad(day)}`;
    setSelectedDayDate(dateStr);
    setViewMode("day");
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen min-w-screen h-screen w-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold"
        >
          Loading Sessions…
        </motion.div>
      </div>
    );
  }

  if (viewMode === "day") {
    return (
      <DayGridView
        selectedDate={selectedDayDate}
        setSelectedDate={setSelectedDayDate}
        sessions={sessions}
        therapists={therapistList}
        onBackToMonth={() => setViewMode("month")}
        refetchSessions={fetchSessions}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full w-full max-w-full bg-slate-50"
    >
      {/* Search and Filter */}
      <CalendarSearchFilter
        filters={filters}
        setFilters={setFilters}
        therapyTypes={therapyTypeList}
      />

      <div className="flex flex-col w-full h-full flex-1">
        <div className="bg-white border rounded-lg flex flex-col shadow h-full w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b bg-slate-50">
            <div className="flex items-center gap-2 font-semibold text-lg">
              <FiCalendar />
              {new Date(year, month).toLocaleString("default", {
                month: "long",
              })}{" "}
              {year}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => changeMonth("prev")}
                className="p-2 border rounded bg-white hover:bg-slate-100"
              >
                <FiChevronLeft />
              </button>
              <button
                onClick={() => {
                  setSelectedDayDate(toISODate(new Date()));
                  setViewMode("day");
                }}
                className="px-3 py-2 border rounded bg-white hover:bg-slate-100 text-sm font-medium"
              >
                Today's grid
              </button>
              <button
                onClick={() => changeMonth("next")}
                className="p-2 border rounded bg-white hover:bg-slate-100"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
          {/* Days header */}
          <div className="grid grid-cols-7 text-xs text-slate-500 border-b bg-slate-100">
            {DAYS.map((d) => (
              <div key={d} className="p-2 text-center font-medium select-none">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar body */}
          <CalendarMonthGrid
            today={today}
            year={year}
            month={month}
            daysInMonth={daysInMonth}
            startDay={startDay}
            getCalendarWeeks={getCalendarWeeks}
            getSessionsForDay={getSessionsForDay}
            onDayClick={handleDayClick}
          />
        </div>
      </div>

      {/* Kept for reference only — no longer wired to a click handler since
          day cells now open the therapist/slot grid directly instead of
          this read-only popup. Safe to delete if unused. */}
      <Modal
        open={modalDay !== null}
        onClose={() => {
          setModalDay(null);
          setModalSessions(null);
        }}
        title={
          modalDay
            ? `All Sessions on ${formatDateForDisplay(`${year}-${String(month + 1).padStart(2, "0")}-${String(
                  modalDay
                ).padStart(2, "0")}`)}`
            : undefined
        }
      >
        {modalDay && modalSessions && modalSessions.length > 0 ? (
          <div className="flex flex-col gap-2">
            {modalSessions.map((session, idx) => (
              <div key={session._id || `${session.date}-${session.slotId}-${idx}`}>
                <CalendarSessionItem session={session} showAllDetails={true} />
              </div>
            ))}
          </div>
        ) : (
          <div>No sessions</div>
        )}
      </Modal>
    </motion.div>
  );
}