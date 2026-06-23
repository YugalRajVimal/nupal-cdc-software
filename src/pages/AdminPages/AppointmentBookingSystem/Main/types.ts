

// // --- Constants ---
// export const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// export const SESSION_TIME_OPTIONS = [
//   { id: '1000-1045', label: '10:00 to 10:45', limited: false },
//   { id: '1045-1130', label: '10:45 to 11:30', limited: false },
//   { id: '1130-1215', label: '11:30 to 12:15', limited: false },
//   { id: '1215-1300', label: '12:15 to 13:00', limited: false },
//   { id: '1300-1345', label: '13:00 to 13:45', limited: false },
//   { id: '1415-1500', label: '14:15 to 15:00', limited: false },
//   { id: '1500-1545', label: '15:00 to 15:45', limited: false },
//   { id: '1545-1630', label: '15:45 to 16:30', limited: false },
//   { id: '1630-1715', label: '16:30 to 17:15', limited: false },
//   { id: '1715-1800', label: '17:15 to 18:00', limited: false },
//   { id: '0830-0915', label: '08:30 to 09:15', limited: true },
//   { id: '0915-1000', label: '09:15 to 10:00', limited: true },
//   { id: '1800-1845', label: '18:00 to 18:45', limited: true },
//   { id: '1845-1930', label: '18:45 to 19:30', limited: true },
//   { id: '1930-2015', label: '19:30 to 20:15', limited: true },
// ];

// export const PAGE_SIZE_OPTIONS = [5, 15, 25, 50];

// // --- Types ---
// export type Patient = { id: string; patientId: string; name: string; phoneNo?: string };
// export type Therapy = { _id: string; name: string };
// export type Package = {
//   _id: string;
//   name: string;
//   totalSessions?: number;
//   costPerSession?: number;
//   totalCost?: number;
//   sessionCount?: number;
// };
// export type TherapistHoliday = {
//   date: string;
//   reason?: string;
//   isFullDay?: boolean;
//   slots?: Array<{ slotId: string; label: string }>;
// };
// export type Therapist = {
//   _id: string;
//   therapistId: string;
//   name: string;
//   userId?: { name?: string; [key: string]: any }; // Added userId?.name support
//   holidays?: TherapistHoliday[];
//   mobile1?: string;
//   bookedSlots?: { [date: string]: string[] };
//   bookedSlotCount?: { [date: string]: number };
// };
// export type BookingSession = {
//   sessionId: string;
//   date: string;
//   slotId: string;
//   therapistId?: string;
//   therapyType?: string;
//   therapyTypeId?: { _id: string; name: string; [key: string]: any } | string;
//   _id?: string;
//   therapist?: { _id: string; therapistId: string; name: string; [key: string]: any };
//   [key: string]: any;
// };
// export type Booking = {
//   _id: string;
//   appointmentId?: string;
//   patient: Patient;
//   therapy: Therapy;
//   package: Package | null;
//   therapist: Therapist | string;
//   sessions: BookingSession[];
//   discountInfo?: { coupon: any; time?: string };
//   isPaid?: boolean;
//   payment?: { status?: string; amount?: number; amountPaid?: number; _id?: string };
//   remark?: string;
// };
// export type DaySlotSummary = {
//   bookedSlots: number;
//   totalAvailableSlots: number;
//   limitedBookedSlots: number;
//   totalLimitedAvailableSlots: number;
//   BookedSlots: { [therapistId: string]: string[] };
// };
// export type MonthlySlotsSummary = { [date: string]: DaySlotSummary };

// /**
//  * Preset settings chosen in the Quick Fill Modal.
//  * When active, clicking a calendar day auto-fills each new session with
//  * these values (therapist, therapy type, time slot).
//  * If the chosen slotId turns out to be unavailable for a picked date,
//  * an inline warning is shown in the session row.
//  */
// export type QuickFillSettings = {
//   therapistId: string;
//   therapyTypeId: string;
//   slotId: string;
// };

// // --- Utilities ---
// export function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
// export function getDateKey(year: number, month: number, day: number): string {
//   return `${year}-${pad2(month)}-${pad2(day)}`;
// }
// export function getDaysInMonth(year: number, month: number) {
//   return new Date(year, month + 1, 0).getDate();
// }
// export function getStartDay(year: number, month: number) {
//   return new Date(year, month, 1).getDay();
// }
// export function formatDateDDMMYYYY(dateStr: string): string {
//   if (!dateStr) return '';
//   const d = new Date(dateStr);
//   if (isNaN(d.getTime())) return dateStr;
//   const day = String(d.getDate()).padStart(2, '0');
//   const month = String(d.getMonth() + 1).padStart(2, '0');
//   const year = d.getFullYear();
//   return `${day}/${month}/${year}`;
// }
// export function getTotalSessionsForPackage(pkg: Package | null): number | undefined {
//   if (!pkg) return undefined;
//   return (
//     pkg.totalSessions ||
//     pkg.sessionCount ||
//     (() => {
//       const m = pkg.name?.match(/^\s*(\d+)[^\d]/);
//       return m ? Number(m[1]) : undefined;
//     })()
//   );
// }
// export function getPackageDisplay(pkg: Package | null): string {
//   if (!pkg) return "—";
//   const sessions = getTotalSessionsForPackage(pkg);
//   const totalCost = pkg.totalCost;
//   const costPerSession =
//     pkg.costPerSession ||
//     (totalCost && sessions ? Math.round(totalCost / sessions) : undefined);
//   const parts: string[] = [];
//   if (pkg.name) parts.push(pkg.name);
//   if (sessions || totalCost) {
//     const subparts: string[] = [];
//     if (totalCost) subparts.push("Total Cost " + totalCost);
//     if (costPerSession) subparts.push(`[${costPerSession}]`);
//     if (subparts.length > 0) parts.push(subparts.join(" "));
//   }
//   return parts.join("; ");
// }
// export function getPatientDisplayName(patient: Patient | undefined | null): string {
//   if (!patient) return "";
//   const pid = patient.patientId ? patient.patientId : "";
//   return pid ? `${patient.name} (${pid})` : patient.name;
// }

// --- Constants ---
export const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const SESSION_TIME_OPTIONS = [
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

export const PAGE_SIZE_OPTIONS = [5, 15, 25, 50];

// --- Types ---
export type Patient = { id: string; patientId: string; name: string; phoneNo?: string };
export type Therapy = { _id: string; name: string };
export type Package = {
  _id: string;
  name: string;
  totalSessions?: number;
  costPerSession?: number;
  totalCost?: number;
  sessionCount?: number;
};
export type TherapistHoliday = {
  date: string;
  reason?: string;
  isFullDay?: boolean;
  slots?: Array<{ slotId: string; label: string }>;
};
export type Therapist = {
  _id: string;
  therapistId: string;
  name: string;
  userId?: { name?: string; [key: string]: any }; // Added userId?.name support
  holidays?: TherapistHoliday[];
  mobile1?: string;
  bookedSlots?: { [date: string]: string[] };
  bookedSlotCount?: { [date: string]: number };
};
export type SessionStatus = 'CheckedIn' | 'NotCheckedIn' | 'Missed';

export type BookingSession = {
  sessionId: string;
  date: string;
  slotId: string;
  therapistId?: string;
  therapyType?: string;
  therapyTypeId?: { _id: string; name: string; [key: string]: any } | string;
  _id?: string;
  therapist?: { _id: string; therapistId: string; name: string; [key: string]: any };
  /** Check-in / attendance state of this session, as recorded server-side */
  isCheckedIn?: boolean;
  status?: SessionStatus;
  [key: string]: any;
};
export type Booking = {
  _id: string;
  appointmentId?: string;
  patient: Patient;
  therapy: Therapy;
  package: Package | null;
  therapist: Therapist | string;
  sessions: BookingSession[];
  discountInfo?: { coupon: any; time?: string };
  isPaid?: boolean;
  payment?: { status?: string; amount?: number; amountPaid?: number; _id?: string };
  remark?: string;
};
export type DaySlotSummary = {
  bookedSlots: number;
  totalAvailableSlots: number;
  limitedBookedSlots: number;
  totalLimitedAvailableSlots: number;
  BookedSlots: { [therapistId: string]: string[] };
};
export type MonthlySlotsSummary = { [date: string]: DaySlotSummary };

/**
 * Preset settings chosen in the Quick Fill Modal.
 * When active, clicking a calendar day auto-fills each new session with
 * these values (therapist, therapy type, time slot).
 * If the chosen slotId turns out to be unavailable for a picked date,
 * an inline warning is shown in the session row.
 */
export type QuickFillSettings = {
  therapistId: string;
  therapyTypeId: string;
  slotId: string;
};

// --- Utilities ---
export function pad2(n: number) { return n < 10 ? `0${n}` : `${n}`; }
export function getDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}
export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
export function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
export function formatDateDDMMYYYY(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
export function getTotalSessionsForPackage(pkg: Package | null): number | undefined {
  if (!pkg) return undefined;
  return (
    pkg.totalSessions ||
    pkg.sessionCount ||
    (() => {
      const m = pkg.name?.match(/^\s*(\d+)[^\d]/);
      return m ? Number(m[1]) : undefined;
    })()
  );
}

/**
 * Counts how many of the given sessions are marked as 'Missed'.
 * Used to extend the package's session cap: a missed session still
 * "used up" a package slot, so Admin is allowed to add this many
 * replacement sessions beyond the package's normal total.
 */
export function getMissedSessionsCount(sessions: BookingSession[] | undefined | null): number {
  if (!Array.isArray(sessions)) return 0;
  return sessions.filter((s) => s?.status === 'Missed').length;
}

/**
 * Effective max number of sessions selectable for a booking: the package's
 * normal total, plus one extra slot for every session already marked
 * 'Missed' (so Admin can book a replacement for each missed session
 * without being blocked by the original package cap).
 */
export function getEffectiveMaxSessions(
  pkg: Package | null,
  sessions: BookingSession[] | undefined | null
): number | undefined {
  const base = getTotalSessionsForPackage(pkg);
  if (typeof base !== 'number') return undefined;
  return base + getMissedSessionsCount(sessions);
}
export function getPackageDisplay(pkg: Package | null): string {
  if (!pkg) return "—";
  const sessions = getTotalSessionsForPackage(pkg);
  const totalCost = pkg.totalCost;
  const costPerSession =
    pkg.costPerSession ||
    (totalCost && sessions ? Math.round(totalCost / sessions) : undefined);
  const parts: string[] = [];
  if (pkg.name) parts.push(pkg.name);
  if (sessions || totalCost) {
    const subparts: string[] = [];
    if (totalCost) subparts.push("Total Cost " + totalCost);
    if (costPerSession) subparts.push(`[${costPerSession}]`);
    if (subparts.length > 0) parts.push(subparts.join(" "));
  }
  return parts.join("; ");
}
export function getPatientDisplayName(patient: Patient | undefined | null): string {
  if (!patient) return "";
  const pid = patient.patientId ? patient.patientId : "";
  return pid ? `${patient.name} (${pid})` : patient.name;
}