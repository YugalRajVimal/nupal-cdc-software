

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  FiInfo, FiCalendar, FiChevronLeft, FiChevronRight,
  FiChevronUp, FiChevronDown, FiList, FiCheckCircle, FiZap, FiUser, FiClock,
} from "react-icons/fi";
import { DAYS, getDateKey } from "./types";

// ─── HeaderGuide ─────────────────────────────────────────────────────────────

type HeaderGuideProps = {
  guideOpen: boolean;
  setGuideOpen: (fn: (v: boolean) => boolean) => void;
  editBookingId: string | null;
};

export function HeaderGuide({ guideOpen, setGuideOpen, editBookingId }: HeaderGuideProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-0 mb-8 overflow-hidden cursor-pointer"
      onClick={() => setGuideOpen((v) => !v)}
      tabIndex={0}
      role="button"
      aria-expanded={guideOpen}
      style={{ outline: "none" }}
    >
      <div className="px-6 py-6">
        <div className="flex items-center justify-between select-none">
          <div className="flex items-center gap-2 text-blue-700 font-semibold">
            <FiInfo /> Appointment Booking System
          </div>
          {guideOpen ? <FiChevronUp className="text-blue-600" /> : <FiChevronDown className="text-blue-600" />}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {guideOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden px-6 pb-6 pt-0"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-blue-700 mb-4">
              Manage therapy schedules, book new sessions, and view existing bookings.
            </p>
            <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
              <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                <FiList /> Steps to Follow
              </div>
              <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                <li>Use the calendar to view and check bookings. Booked/Total slots for each day are shown.</li>
                <li>Select children, therapy, package. Each session can have its own therapist, therapy type, and time.</li>
                <li>
                  Use <strong>⚡ Quick Fill</strong> (in the form below) to pre-set a therapist, therapy type and
                  time slot — every date you click will be auto-filled. Change the preset any time to assign a
                  different therapist for subsequent dates.
                </li>
                <li>For a given date, each session must have a different time and can set a different therapist and therapy type.</li>
                <li>
                  Click '{editBookingId ? "Update Booking" : "Book Now"}' to {editBookingId ? "update" : "confirm"} a booking.
                </li>
                <li>
                  <span className="font-medium">
                    Each therapist has max <span className="text-blue-900">10 normal slots</span> and{" "}
                    <span className="text-blue-900">5 limited case slots</span> per day, except holidays.
                  </span>
                </li>
                <li>You can apply a coupon code. If valid, discount will show in pricing.</li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── CalendarPanel ────────────────────────────────────────────────────────────

type CalendarPanelProps = {
  year: number;
  month: number;
  changeMonth: (dir: "prev" | "next") => void;
  startDay: number;
  daysInMonth: number;
  sessions: { date: string; slotId: string }[];
  toggleDate: (day: number) => void;
  getDaySlotSummary: (dateKey: string) => {
    total: number | undefined;
    booked: number | undefined;
    limitedTotal: number | undefined;
    limitedBooked: number | undefined;
  };
  maxSelectableDates: number | undefined;
  /** When true, show a ⚡ indicator in the calendar header */
  quickFillActive?: boolean;
  /** Returns available slots for the selected therapist on a given YYYY-MM-DD date */
  getTherapistAvailableSlotsForDay?: (dateStr: string) => {
    availableSlots: { id: string; label: string; limited: boolean }[];
    isHoliday: boolean;
  } | null;
  /** Display name of the currently selected therapist */
  selectedTherapistName?: string;
};

export function CalendarPanel({
  year, month, changeMonth, startDay, daysInMonth,
  sessions, toggleDate, getDaySlotSummary, maxSelectableDates,
  quickFillActive, getTherapistAvailableSlotsForDay, selectedTherapistName,
}: CalendarPanelProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  const getSessionCountForDate = (dateKey: string) =>
    sessions.filter((s) => s.date === dateKey).length;

  // Calculate total selected sessions and selected dates
  const totalSelectedSessions = sessions.length;
  const uniqueSelectedDates = Array.from(new Set(sessions.map((s) => s.date))).length;

  return (
    <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
      {/* --- Show total selected sessions and dates at the top, centered --- */}

      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b mt-2">
        <div className="flex items-center gap-2 font-semibold whitespace-nowrap">
          <FiCalendar />
          {new Date(year, month).toLocaleString("default", { month: "long" })} {year}
          {/* Quick Fill active indicator */}
          {quickFillActive && (
            <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 border border-yellow-300 text-yellow-700">
              <FiZap size={11} className="text-yellow-500" /> Quick Fill on
            </span>
          )}
        </div>
        <div className="w-full flex flex-col items-center justify-center pt-4 pb-0">
        <div className="flex flex-row gap-6 items-center justify-center bg-slate-50 px-3 py-2 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold text-sm">
              {totalSelectedSessions}
            </span>
            <span className="text-xs text-slate-700 font-semibold">
              sessions selected
            </span>
          </div>
          <div className="h-6 border-l border-slate-300 mx-2" />
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-bold text-sm">
              {uniqueSelectedDates}
            </span>
            <span className="text-xs text-slate-700 font-semibold">
              unique dates
            </span>
          </div>
        </div>
   
      </div>
        <div className="flex gap-2">
          <button onClick={() => changeMonth("prev")} className="p-2 border rounded"><FiChevronLeft /></button>
          <button onClick={() => changeMonth("next")} className="p-2 border rounded"><FiChevronRight /></button>
        </div>
      </div>

      {/* Quick Fill calendar hint */}
      {quickFillActive && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-200 text-xs text-yellow-700 flex items-center gap-2">
          <FiZap size={12} className="text-yellow-500 shrink-0" />
          <span>
            <strong>Quick Fill active.</strong> Each date you click below will be auto-filled with your preset
            therapist, therapy type and time slot. If the slot is unavailable the row will show a warning.
          </span>
        </div>
      )}

      {/* Day labels */}
      <div className="grid grid-cols-7 text-xs text-slate-500 border-b">
        {DAYS.map((d) => (
          <div key={d} className="p-2 text-center font-medium">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-32 border" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dateKey = getDateKey(year, month + 1, day);
          const selectedCount = getSessionCountForDate(dateKey);
          const isAtMax =
            typeof maxSelectableDates === "number" && sessions.length >= maxSelectableDates;
          const { total, booked, limitedTotal, limitedBooked } = getDaySlotSummary(dateKey);

          // Therapist-specific slot info
          const therapistSlotInfo = getTherapistAvailableSlotsForDay
            ? getTherapistAvailableSlotsForDay(dateKey)
            : null;
          const isHovered = hoveredDay === day;

          const normalAvail = therapistSlotInfo
            ? therapistSlotInfo.availableSlots.filter((s) => !s.limited)
            : [];
          const limitedAvail = therapistSlotInfo
            ? therapistSlotInfo.availableSlots.filter((s) => s.limited)
            : [];

          return (
            <div
              key={day}
              onClick={() => { if (!isAtMax) toggleDate(day); }}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={`h-32 border cursor-pointer flex flex-col justify-between p-2 transition relative ${
                selectedCount > 0
                  ? "bg-blue-50 border-blue-400"
                  : isAtMax
                  ? "bg-gray-100 cursor-not-allowed opacity-60"
                  : quickFillActive
                  ? "hover:bg-yellow-50 hover:border-yellow-300"
                  : "hover:bg-slate-50"
              }`}
              style={isAtMax ? { pointerEvents: "none" } : {}}
            >
              <div className="flex flex-col justify-start">
                <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                  selectedCount > 0 ? "bg-blue-600 text-white" : ""
                }`}>
                  {day}
                </div>
                {selectedCount > 0 && (
                  <div className="mt-1 text-xs text-blue-700 font-medium">
                    Selected ({selectedCount})
                  </div>
                )}
              </div>

              {/* Overall slot availability badge */}
              {typeof total !== "number" ? (
                <span className="text-gray-300">Loading…</span>
              ) : total > 0 || (limitedTotal && limitedTotal > 0) ? (
                <span className="flex items-center w-fit gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-700 border border-green-300 shadow">
                  <FiCheckCircle className="inline mr-0.5 text-green-500" size={13} />
                  <span data-testid="booked-total" className="tabular-nums font-semibold">
                    {booked}/{total}
                    {typeof limitedTotal === "number" && typeof limitedBooked === "number" && limitedBooked > 0 && (
                      <>
                        <br />
                        <span className="tabular-nums font-semibold text-blue-800">
                          {limitedBooked}/{limitedTotal} ltd.
                        </span>
                      </>
                    )}
                  </span>
                </span>
              ) : (
                <span className="text-gray-400">No slots</span>
              )}

              {/* Therapist available slots badge */}
              {therapistSlotInfo && (
                <div className="mt-1">
                  {therapistSlotInfo.isHoliday ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-600 border border-red-200">
                      <FiUser size={10} /> Holiday
                    </span>
                  ) : (
                    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-semibold border ${
                      therapistSlotInfo.availableSlots.length === 0
                        ? "bg-red-50 text-red-500 border-red-200"
                        : therapistSlotInfo.availableSlots.length <= 3
                        ? "bg-orange-50 text-orange-600 border-orange-200"
                        : "bg-violet-50 text-violet-700 border-violet-200"
                    }`}>
                      <FiUser size={10} />
                      {therapistSlotInfo.availableSlots.length} free
                    </span>
                  )}
                </div>
              )}

              {/* Hover tooltip: list of available slots for the therapist */}
              {isHovered && therapistSlotInfo && !therapistSlotInfo.isHoliday && therapistSlotInfo.availableSlots.length > 0 && (
                <div
                  className="absolute z-50 bottom-full left-0 mb-2 w-56 bg-white border border-violet-200 rounded-lg shadow-xl p-3 pointer-events-none"
                  style={{ minWidth: "13rem" }}
                >
                  <div className="flex items-center gap-1.5 mb-2 text-violet-700 font-semibold text-xs border-b border-violet-100 pb-1.5">
                    <FiUser size={11} />
                    <span className="truncate">{selectedTherapistName || "Therapist"}</span>
                    <span className="ml-auto text-violet-400 font-normal">{therapistSlotInfo.availableSlots.length} slots</span>
                  </div>
                  {normalAvail.length > 0 && (
                    <div className="mb-1.5">
                      <div className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                        <FiClock size={10} /> Normal
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {normalAvail.map((s) => (
                          <span key={s.id} className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 text-xs font-medium">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {limitedAvail.length > 0 && (
                    <div>
                      <div className="text-xs text-slate-400 font-medium mb-1 flex items-center gap-1">
                        <FiClock size={10} /> Limited
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {limitedAvail.map((s) => (
                          <span key={s.id} className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hover tooltip: holiday */}
              {isHovered && therapistSlotInfo?.isHoliday && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-44 bg-white border border-red-200 rounded-lg shadow-xl p-3 pointer-events-none">
                  <div className="flex items-center gap-1.5 text-red-600 font-semibold text-xs">
                    <FiUser size={11} />
                    <span className="truncate">{selectedTherapistName || "Therapist"}</span>
                  </div>
                  <div className="mt-1 text-xs text-red-500">On holiday — no slots available.</div>
                </div>
              )}

              {/* Hover tooltip: all slots booked */}
              {isHovered && therapistSlotInfo && !therapistSlotInfo.isHoliday && therapistSlotInfo.availableSlots.length === 0 && (
                <div className="absolute z-50 bottom-full left-0 mb-2 w-44 bg-white border border-orange-200 rounded-lg shadow-xl p-3 pointer-events-none">
                  <div className="flex items-center gap-1.5 text-orange-600 font-semibold text-xs">
                    <FiUser size={11} />
                    <span className="truncate">{selectedTherapistName || "Therapist"}</span>
                  </div>
                  <div className="mt-1 text-xs text-orange-500">All slots booked for this day.</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {typeof maxSelectableDates === "number" && (
        <div className="px-4 pt-2 pb-1 text-xs text-slate-600">
          {`You can select up to ${maxSelectableDates} sessions for this package. `}
          <span className="text-blue-700">
            Multiple for the same date is allowed as long as time slots are different.
          </span>
          <br />
          {sessions.length >= maxSelectableDates && (
            <span className="text-blue-700">Limit reached.</span>
          )}
          <br />
          <span className="text-blue-700">
            Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots available per day.
          </span>
        </div>
      )}
    </div>
  );
}