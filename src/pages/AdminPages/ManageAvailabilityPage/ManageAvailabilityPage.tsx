import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiUser,
  FiCalendar,
  FiCheckCircle,
  FiInfo,
  FiArrowUpRight,
  FiAlertTriangle,
  FiX,
} from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// --- API UTILITIES ---

const API_BASE = `${import.meta.env.VITE_API_URL}/api/admin/availability-slots`;

function getMonthFirstLastDate(year: number, month: number) {
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const lastDayPreviousMonth = new Date(prevYear, prevMonth + 1, 0);
  const lastDayOfThisMonth = new Date(year, month + 1, 0);
  return {
    from: formatDate(lastDayPreviousMonth),
    to: formatDate(lastDayOfThisMonth),
  };
}

type AvailabilityObj = Record<string, Record<string, SlotAvailability>>;

type SlotAvailability = { count: number; booked: number };
type BookedCountObj = { [date: string]: { [slotId: string]: number } };

async function fetchAvailabilitySlots(from: string, to: string): Promise<AvailabilityObj> {
  try {
    const res = await axios.get(`${API_BASE}/range/${from}/${to}`);
    const api = res.data;
    const result: AvailabilityObj = {};
    if (api?.data) {
      for (const day of api.data) {
        if (day?.date && Array.isArray(day.sessions)) {
          result[day.date] = {};
          for (const s of day.sessions) {
            result[day.date][s.id] = {
              count: typeof s.count === "number" ? s.count : 0,
              booked: typeof s.booked === "number" ? s.booked : 0
            };
          }
        }
      }
    }
    return result;
  } catch (err: any) {
    throw new Error(err.response?.data?.error || err.message || "Failed to load availability");
  }
}

async function updateAvailabilitySlots(date: string, slots: Record<string, number>) {
  const sessions = SESSION_TIME_OPTIONS.map(opt => ({
    id: opt.value,
    label: opt.label,
    limited: isLimitedCase(opt),
    count: slots[opt.value] ?? 0,
  }));
  try {
    const res = await axios.put(`${API_BASE}/${date}`, { sessions });
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.error || err.message || "Failed to update slots");
  }
}

async function putDefaultTherapistSlotCount(defaultCapacity: number) {
  try {
    const res = await axios.put(
      `${API_BASE}/default-therapist-count`,
      { defaultCapacity }
    );
    return res.data;
  } catch (err: any) {
    throw new Error(err.response?.data?.error || err.message || "Failed to set default therapist count");
  }
}

async function fetchDefaultTherapistSlotCount(): Promise<number> {
  try {
    const res = await axios.get(`${API_BASE}/default-therapist-count`);
    const api = res.data;
    let n = api?.data?.defaultCapacity ?? 0;
    if (typeof n !== "number" || !Number.isFinite(n)) n = 0;
    return n;
  } catch (err: any) {
    throw new Error(err.response?.data?.error || err.message || "Failed to fetch default therapist count");
  }
}

// --- Bookings Data For Booked Counts ---
async function fetchBookingsInRange(): Promise<BookedCountObj> {
  try {
    const bookedCount: BookedCountObj = {};
    return bookedCount;
  } catch (err: any) {
    return {};
  }
}

// --- SLOT LOGIC ---
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const SESSION_TIME_OPTIONS = [
  { value: "0830-0915", label: "08:30 to 09:15 (Limited case)" },
  { value: "0915-1000", label: "09:15 to 10:00 (Limited case)" },
  { value: "1000-1045", label: "10:00 to 10:45" },
  { value: "1045-1130", label: "10:45 to 11:30" },
  { value: "1130-1215", label: "11:30 to 12:15" },
  { value: "1215-1300", label: "12:15 to 13:00" },
  { value: "1300-1345", label: "13:00 to 13:45" },
  { value: "1415-1500", label: "14:15 to 15:00" },
  { value: "1500-1545", label: "15:00 to 15:45" },
  { value: "1545-1630", label: "15:45 to 16:30" },
  { value: "1630-1715", label: "16:30 to 17:15" },
  { value: "1715-1800", label: "17:15 to 18:00" },
  { value: "1800-1845", label: "18:00 to 18:45 (Limited case)" },
  { value: "1845-1930", label: "18:45 to 19:30 (Limited case)" },
  { value: "1930-2015", label: "19:30 to 20:15 (Limited case)" },
];

function isLimitedCase(opt: { label: string }) {
  return opt.label.toLowerCase().includes("limited case");
}
// function emptySlots(defaultNum = 0): Record<string, SlotAvailability> {
//   const res: Record<string, SlotAvailability> = {};
//   SESSION_TIME_OPTIONS.forEach(opt => {
//     res[opt.value] = {
//       count: isLimitedCase(opt) ? 0 : defaultNum,
//       booked: 0
//     };
//   });
//   return res;
// }
function formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

// Simple Modal component
const Modal = ({
  show,
  onClose,
  children,
}: {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  if (!show) return null;
  return (
    <div className="fixed z-40 left-0 top-0 w-full h-full flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition">
      <div className="bg-white rounded-xl shadow-2xl p-6 min-w-[320px] max-w-full relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600 transition rounded"
          aria-label="Close"
        >
          <FiX size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

// --- COMPONENT

const ManageAvailabilityPage: React.FC = () => {
  const [availability, setAvailability] = useState<AvailabilityObj>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(formatDate(today));


  const [setAllValue, setSetAllValue] = useState<string>("");
  const [setAllError, setSetAllError] = useState<string>("");
  const [defaultTherapistNum, setDefaultTherapistNum] = useState<number>(0);
  const [defaultTherapistInput, setDefaultTherapistInput] = useState<string>("0");
  const [defaultTherapistError, setDefaultTherapistError] = useState<string>("");

  // Modal for confirmation on default therapist set
  const [showDefaultConfirm, setShowDefaultConfirm] = useState(false);
  const [defaultConfirmLoading, setDefaultConfirmLoading] = useState(false);

  // For storing bookings for current calendar range (for booked slots)


  // function getMonthId(y: number, m: number) {
  //   return `${y}-${String(m + 1).padStart(2, "0")}`;
  // }

  useEffect(() => {


    (async () => {
      setLoading(true);
      setApiError(null);

      const { from: calendarFromDate, to: calendarToDate } = getMonthFirstLastDate(year, month);

      try {
        // Fetch slots
        const [slotsObj, defaultN] = await Promise.all([
          fetchAvailabilitySlots(calendarFromDate, calendarToDate),
          fetchDefaultTherapistSlotCount(),
        ]);

        // Fetch bookings (booked slots) for calendar view
        const bookingsObj = await fetchBookingsInRange();

        // Overlay booked counts onto slot availability
        const availabilityWithBooked: AvailabilityObj = {};
        for (const date in slotsObj) {
          availabilityWithBooked[date] = {};
          const daySlots = slotsObj[date] ?? {};
          const dayBooked = bookingsObj[date] ?? {};
          for (const slotKey of Object.keys(daySlots)) {
            availabilityWithBooked[date][slotKey] = {
              count: typeof daySlots[slotKey]?.count === "number" ? daySlots[slotKey].count : 0,
              booked: typeof daySlots[slotKey]?.booked === "number" ? daySlots[slotKey].booked
                : (dayBooked[slotKey] || 0),
            };
          }
        }

        setAvailability(availabilityWithBooked);
        setDefaultTherapistInput(String(defaultN));
        setDefaultTherapistNum(defaultN);

      } catch (e: any) {
        setApiError(typeof e === "string" ? e : (e?.message || "Could not load data."));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [year, month]);

  useEffect(() => {
    if (availability[selectedDate]) {
      setAvailability(prev => ({ ...prev, [selectedDate]: { ...prev[selectedDate] } }));
    }
  }, [selectedDate]);

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // -- UPDATE: Now always return slots for any date, even if it's never been set --
  const getSlotsForDate = (date: string): Record<string, SlotAvailability> => {
    if (availability[date]) {
      return availability[date];
    }
    // If not in availability, return all slots count=0, booked=0
    const res: Record<string, SlotAvailability> = {};
    SESSION_TIME_OPTIONS.forEach(opt => {
      res[opt.value] = { count: isLimitedCase(opt) ? 0 : 0, booked: 0 };
    });
    return res;
  };

  const handleDayClick = (day: number) => {
    const dtStr = formatDate(new Date(year, month, day));
    setSelectedDate(dtStr);
    // If not present, proactively add empty slots to local state (so UI is ready for editing)
    setAvailability(prev => {
      if (!(dtStr in prev)) {
        return { ...prev, [dtStr]: getSlotsForDate(dtStr) };
      }
      return prev;
    });
  };

  const gotoPrevMonth = () => {
    let newMonth = month - 1; let newYear = year;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    setMonth(newMonth); setYear(newYear);
  };

  const gotoNextMonth = () => {
    let newMonth = month + 1, newYear = year;
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setMonth(newMonth); setYear(newYear);
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    const parsed = new Date(e.target.value);
    if (!isNaN(parsed.getTime())) {
      setYear(parsed.getFullYear());
      setMonth(parsed.getMonth());
      // prepopulate if the date is not available and ensure blank slots shown in panel
      setAvailability(prev => {
        if (!(e.target.value in prev)) {
          return { ...prev, [e.target.value]: getSlotsForDate(e.target.value) };
        }
        return prev;
      });
    }
  };

  const handleIncrement = async (date: string, time: string) => {
    // Always allow increment, regardless of whether available
    const newSlots = { ...getSlotsForDate(date) };
    newSlots[time] = {
      count: (newSlots[time]?.count || 0) + 1,
      booked: newSlots[time]?.booked || 0
    };
    setAvailability(prev => ({ ...prev, [date]: newSlots }));
    try {
      await updateAvailabilitySlots(
        date,
        Object.fromEntries(
          Object.entries(newSlots).map(([k, v]) => [k, v.count])
        )
      );
      toast.success("Updated slot!", { autoClose: 1800 });
    } catch (e: any) {
      setAvailability(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [time]: {
            ...prev[date][time],
            count: Math.max(0, (newSlots[time]?.count || 1) - 1)
          }
        }
      }));
      setApiError("Failed to update slot: " + (typeof e === "string" ? e : e?.message));
      toast.error("Failed to update slot", { autoClose: 3000 });
    }
  };

  const handleDecrement = async (date: string, time: string) => {
    const cur = getSlotsForDate(date)[time]?.count || 0;
    if (cur <= 0) return;
    const newSlots = { ...getSlotsForDate(date) };
    newSlots[time] = {
      count: Math.max(0, cur - 1),
      booked: newSlots[time]?.booked || 0
    };
    setAvailability(prev => ({ ...prev, [date]: newSlots }));
    try {
      await updateAvailabilitySlots(
        date,
        Object.fromEntries(
          Object.entries(newSlots).map(([k, v]) => [k, v.count])
        )
      );
      toast.success("Updated slot!", { autoClose: 1800 });
    } catch (e: any) {
      setAvailability(prev => ({
        ...prev,
        [date]: {
          ...prev[date],
          [time]: {
            ...prev[date][time],
            count: cur
          }
        }
      }));
      setApiError("Failed to update slot: " + (typeof e === "string" ? e : e?.message));
      toast.error("Failed to update slot", { autoClose: 3000 });
    }
  };

  const handleToday = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelectedDate(formatDate(now));
  };

  function isSelectedDay(day: number) {
    return formatDate(new Date(year, month, day)) === selectedDate;
  }

  function isToday(day: number) {
    const dt = new Date(year, month, day), now = new Date();
    return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth() && dt.getDate() === now.getDate();
  }

  let panelLabel = "";
  if (selectedDate) {
    const d = new Date(selectedDate);
    panelLabel = `${d.getDate()} ${DAYS[d.getDay()]}, ${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
  }

  const handleSetAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (!/^\d*$/.test(val)) {
      setSetAllError("Please enter a valid number."); setSetAllValue(val); return;
    }
    setSetAllError(""); setSetAllValue(val);
  };

  const handleSetAllSlots = async () => {
    // Now allow Set All even for days that were never present before
    const num = Number(setAllValue);
    if (setAllValue === "" || isNaN(num) || num < 0) {
      setSetAllError("Please enter a valid non-negative number."); return;
    }

    // Always build all slots as present
    const slotsObj: Record<string, SlotAvailability> = {};
    SESSION_TIME_OPTIONS.forEach(opt => {
      slotsObj[opt.value] = {
        count: isLimitedCase(opt) ? 0 : num,
        booked: getSlotsForDate(selectedDate)[opt.value]?.booked || 0
      };
    });
    setAvailability(prev => ({ ...prev, [selectedDate]: slotsObj }));
    setSetAllError("");
    try {
      await updateAvailabilitySlots(
        selectedDate,
        Object.fromEntries(
          Object.entries(slotsObj).map(([k, v]) => [k, v.count])
        )
      );
      toast.success("All session slots updated!", { autoClose: 2000 });
    } catch (e: any) {
      setApiError("Failed to set all slots: " + (typeof e === "string" ? e : e?.message));
      toast.error("Failed to set all slots", { autoClose: 3000 });
    }
  };

  const handleDefaultTherapistInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim();
    if (!/^\d*$/.test(val)) {
      setDefaultTherapistInput(val);
      setDefaultTherapistError("Please enter a valid number.");
      return;
    }
    setDefaultTherapistInput(val);
    setDefaultTherapistError("");
  };

  const handleApplyDefaultTherapist = () => {
    const num = Number(defaultTherapistInput);
    if (defaultTherapistInput === "" || isNaN(num) || num < 0) {
      setDefaultTherapistError("Please enter a valid non-negative number."); return;
    }
    setDefaultTherapistError("");
    setShowDefaultConfirm(true);
  };

  const confirmApplyDefaultTherapist = async () => {
    const num = Number(defaultTherapistInput);
    setShowDefaultConfirm(false);
    setDefaultConfirmLoading(true);
    setLoading(true);
    try {
      await putDefaultTherapistSlotCount(num);
      const reloadStart = new Date();
      reloadStart.setHours(0,0,0,0);
      const reloadEnd = new Date(reloadStart);
      reloadEnd.setDate(reloadStart.getDate() + 14);

      const reloadFrom = formatDate(reloadStart);
      const reloadTo = formatDate(reloadEnd);
      const slotsObj = await fetchAvailabilitySlots(reloadFrom, reloadTo);
      const bookingsObj = await fetchBookingsInRange();

      const availabilityWithBooked: AvailabilityObj = {};
      for (const date in slotsObj) {
        availabilityWithBooked[date] = {};
        const daySlots = slotsObj[date] ?? {};
        const dayBooked = bookingsObj[date] ?? {};
        for (const slotKey of Object.keys(daySlots)) {
          availabilityWithBooked[date][slotKey] = {
            count: typeof daySlots[slotKey]?.count === "number" ? daySlots[slotKey].count : 0,
            booked: typeof daySlots[slotKey]?.booked === "number" ? daySlots[slotKey].booked
              : (dayBooked[slotKey] || 0),
          };
        }
      }

      setAvailability(availabilityWithBooked);
      setApiError(null);
      toast.success("Default therapist slots applied to next 14 days!", { autoClose: 2200 });
    } catch (e: any) {
      setApiError("Failed to set default therapist slots: " + (typeof e === "string" ? e : e?.message));
      toast.error("Failed to set default therapist slots", { autoClose: 3000 });
    } finally {
      setLoading(false);
      setDefaultConfirmLoading(false);
    }
  };

  // --- CALENDAR/TABLE RENDERING ---

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-2 sm:px-6">
      <ToastContainer position="top-center" hideProgressBar={false} />
      {/* Confirmation Modal for default therapist slots */}
      <Modal show={showDefaultConfirm} onClose={() => setShowDefaultConfirm(false)}>
        <div className="flex flex-col items-center py-2">
          <FiAlertTriangle size={42} className="text-yellow-600 mb-2" />
          <h2 className="text-lg font-bold mb-1 text-blue-800">Confirm Therapist Default Change</h2>
          <p className="text-sm text-gray-700 mt-0 text-center mb-2">
            This will set <b>{defaultTherapistInput}</b> therapist(s) for <span className="font-semibold text-blue-600">non-limited session slots</span> on <br />
            <b>the NEXT 14 days only (not including today or past days)</b>.<br />
          </p>
          <ul className="list-disc mb-3 ml-4 text-xs text-gray-600 text-left">
            <li>Limited session slots will remain at 0.</li>
            <li>Current day and previous dates are unaffected.</li>
            <li>
              <span className="text-red-700 font-semibold">Existing customizations for the next 14 days will be <u>overwritten</u>.</span>
            </li>
            <li>This change cannot be undone.</li>
          </ul>
          <div className="w-full flex justify-between gap-2 mt-2">
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 font-medium transition shadow"
              onClick={() => setShowDefaultConfirm(false)}
              disabled={defaultConfirmLoading}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition shadow ml-2"
              onClick={confirmApplyDefaultTherapist}
              disabled={defaultConfirmLoading}
            >
              Confirm &amp; Apply
            </button>
          </div>
          {defaultConfirmLoading && (
            <div className="mt-3 text-sm text-blue-600 font-semibold">Applying...</div>
          )}
        </div>
      </Modal>
      <div className="mb-8  px-6 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4 mb-2 md:mb-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-0.5">Manage Therapist Availability</h1>
            <span className="text-sm text-blue-700 font-medium tracking-wide">
              Calendar-based session slot availability for therapists
            </span>
          </div>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition mb-2 md:mb-0"
          onClick={handleToday}
        >
          <FiCalendar /> Jump to Today
        </button>
      </div>
      {apiError && (
        <div className="mb-4 px-3 py-2 rounded bg-red-100 text-red-700 font-semibold border border-red-200">{apiError}</div>
      )}

      <div className="flex flex-col md:flex-row md:gap-8 gap-6">
        {/* Calendar section */}
        <div className="md:w-1/2 w-full min-w-[285px]">
          {/* Calendar header */}
          <div className="flex justify-between items-center mb-2 px-1">
            <button
              className="p-2 rounded-full hover:bg-blue-100 transition"
              onClick={gotoPrevMonth}
              aria-label="Previous month"
              disabled={loading}
            >
              <FiChevronLeft size={24} />
            </button>
            <div className="flex flex-col items-center">
              <div className="font-semibold text-blue-900 text-lg leading-tight">
                {new Date(year, month).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateInput}
                className="mt-1 text-xs px-2 py-1 rounded shadow-sm border-2 border-blue-200 focus:border-blue-400 focus:ring-blue-200 outline-none"
                style={{ minWidth: 136, width: 136 }}
              />
            </div>
            <button
              className="p-2 rounded-full hover:bg-blue-100 transition"
              onClick={gotoNextMonth}
              aria-label="Next month"
              disabled={loading}
            >
              <FiChevronRight size={24} />
            </button>
          </div>
          {/* Calendar grid */}
          <div className="w-full bg-white rounded-lg shadow-inner p-4">
            {loading ? (
              <div className="flex justify-center items-center h-28 text-blue-500 font-bold">
                Loading calendar...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-7 gap-2 text-xs font-semibold text-blue-500 mb-2">
                  {DAYS.map((d) => (
                    <div className="text-center py-1 tracking-wide" key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(startDay)].map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                    const dtStr = formatDate(new Date(year, month, day));
                    const selected = isSelectedDay(day);
                    const todayCell = isToday(day);
                    const slots = getSlotsForDate(dtStr);

                    let total = 0;
                    let booked = 0;
                    if (availability[dtStr] && slots) {
                      for (const [time, info] of Object.entries(slots)) {
                        const opt = SESSION_TIME_OPTIONS.find(o => o.value === time);
                        if (opt && !isLimitedCase(opt)) {
                          total += info.count || 0;
                          booked += info.booked || 0;
                        }
                      }
                    }

                    const hasData = !!availability[dtStr];

                    return (
                      <button
                        key={dtStr}
                        className={`
                          relative aspect-square flex flex-col justify-center items-center
                          rounded-xl border transition-all duration-150
                          ${selected ? "border-blue-600 ring-4 ring-blue-300" : "border-blue-100"}
                          ${todayCell && !selected ? "font-bold bg-blue-100 text-blue-700 shadow" : "bg-white"}
                          hover:ring-2 hover:ring-blue-200 hover:border-blue-400
                        `}
                        style={{ minWidth: 38, minHeight: 38, fontSize: 16 }}
                        onClick={() => handleDayClick(day)}
                        // All dates are now selectable
                        // disabled={false}
                        title={hasData ? "" : "No availability data yet. You can create availability for this day."}
                      >
                        <span>{day}</span>
                        {hasData && (
                          <span title="Fetched from DB" className="absolute left-1 top-1 w-2 h-2 rounded-full bg-blue-500"></span>
                        )}
                        {hasData && (total > 0 || booked > 0) && (
                          <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-200 text-green-700 border border-green-300 shadow">
                            <FiCheckCircle className="inline mr-0.5 text-green-500" size={13}/>
                            <span data-testid='booked-total' className="tabular-nums font-semibold">
                              {booked}/{total}
                            </span>
                          </span>
                        )}
                        {selected && (
                          <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 mt-0.5 text-[10px] font-medium text-blue-600">
                            Selected
                          </span>
                        )}
                        {!hasData && (
                          <span className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[8px] text-gray-300">No Data</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          {/* Default therapist number feature, improved design */}
          <div className="w-full bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow mt-6 px-4 py-4 md:px-6">
            <div className="flex items-center gap-2 mb-2">
              <FiUser className="text-blue-500" size={18} />
              <span className="font-semibold text-blue-800 text-base tracking-wide">
                Default Therapist Slots
              </span>
              <span className="inline-flex items-center text-xs text-gray-400 font-medium ml-2">
                <FiInfo className="mr-1" /> Set therapist slots for <b>next 14 days only</b>
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  id="default-therapists"
                  min={0}
                  value={defaultTherapistInput}
                  onChange={handleDefaultTherapistInputChange}
                  inputMode="numeric"
                  className="w-24 text-center border border-blue-300 rounded-lg px-2 py-1.5 bg-white text-sm font-semibold focus:ring-blue-400 focus:border-blue-500 shadow"
                  placeholder="eg. 2"
                  aria-label="Set default therapist count"
                  style={{ transition: 'border .1s, box-shadow .1s' }}
                />
                <button
                  onClick={handleApplyDefaultTherapist}
                  type="button"
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg font-semibold text-sm shadow bg-blue-600 hover:bg-blue-700 text-white transition ${
                    defaultTherapistInput === "" || defaultTherapistError
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  disabled={defaultTherapistInput === "" || !!defaultTherapistError}
                >
                  <FiArrowUpRight /> Apply
                </button>
              </div>
            </div>
            {defaultTherapistError &&
              <div className="text-xs text-red-500 font-semibold py-1">{defaultTherapistError}</div>
            }
            <div className="text-xs text-gray-500 mt-1 pl-1">
              <ul className="list-disc ml-4">
                <li>
                  <span className="text-blue-700 font-semibold">{defaultTherapistNum}</span> therapist(s) per non-limited session slot will fill for <span className="font-semibold text-blue-500">next 14 days</span>.
                </li>
                <li>
                  <span className="text-red-700 font-semibold">Does NOT affect previous days or today.</span>
                </li>
                <li>
                  Limited case slots will always be set to 0 by default.
                </li>
                <li>
                  <span className="text-red-700 font-semibold"><b>Existing customizations for the next 14 days will be overwritten.</b></span>
                </li>
                <li>
                  Use the table on the right to override the numbers for specific days/times.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Editing Panel */}
        <div className="md:w-1/2 w-full bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <FiClock className="text-blue-500" size={22} />
            <span className="text-blue-700 font-bold text-lg">{panelLabel}</span>
            <span className="ml-3 text-xs text-gray-400 font-medium">
              Edit available therapist slots for each session
            </span>
          </div>

          {/* --- START: Set All slots at once --- */}
          <div className="flex items-center gap-2 mb-5">
            <label htmlFor="set-all-day-slots" className="text-xs text-gray-600 font-semibold">
              Set all session slots on this day to: 
            </label>
            <input
              id="set-all-day-slots"
              name="set-all-day-slots"
              type="number"
              min={0}
              value={setAllValue}
              onChange={handleSetAllChange}
              className="border px-2 py-1.5 rounded bg-white shadow-sm w-24 text-center text-sm focus:border-blue-500 focus:ring-blue-100"
              placeholder="eg. 2"
            />
            <button
              onClick={handleSetAllSlots}
              className={
                "ml-2 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold text-sm shadow" +
                (setAllValue === "" || setAllError ? " opacity-50 cursor-not-allowed" : "")
              }
              disabled={setAllValue === "" || !!setAllError}
              type="button"
              aria-label="Set all slots for the day"
            >
              Set All
            </button>
            {setAllError && (
              <span className="ml-2 text-xs text-red-500 font-medium">{setAllError}</span>
            )}
          </div>
          {/* --- END: Set All slots at once --- */}

          <div className="overflow-x-auto custom-scroll">
            <table className="min-w-full table-fixed border-separate border-spacing-y-0.5 bg-blue-50 rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-bold text-blue-800 bg-gradient-to-r from-blue-100 to-blue-50 rounded-tl-lg">Session Time</th>
                  <th className="px-3 py-2 text-center text-xs font-bold text-blue-800 bg-gradient-to-r from-blue-100 to-blue-50">Booked/Total</th>
                  <th className="px-2 py-2 text-center text-xs font-bold bg-gradient-to-r from-green-100 to-green-50">Add</th>
                  <th className="px-2 py-2 text-center text-xs font-bold bg-gradient-to-r from-red-100 to-red-50 rounded-tr-lg">Remove</th>
                </tr>
              </thead>
              <tbody>
                {(
                  SESSION_TIME_OPTIONS.map((slot, idx) => {
                    const slotInfo = getSlotsForDate(selectedDate)[slot.value] || { count: 0, booked: 0 };
                    return (
                    <tr
                      key={slot.value}
                      className={`
                        bg-white transition 
                        ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}
                        hover:bg-blue-100
                      `}
                    >
                      <td className="px-3 py-2 font-medium text-gray-700 border-y border-blue-100 ">
                        {slot.label}
                      </td>
                      <td className="px-3 py-2 text-center font-bold text-blue-700 text-base border-y border-blue-100">
                        <span className="tabular-nums">{slotInfo.booked}/{slotInfo.count}</span>
                      </td>
                      <td className="px-2 py-2 text-center border-y border-blue-100">
                        <button
                          onClick={() => handleIncrement(selectedDate, slot.value)}
                          aria-label={`Increase for ${slot.label}`}
                          className="flex justify-center items-center bg-green-200 hover:bg-green-300 text-green-700 rounded-full shadow border border-green-400 transition h-7 w-9 mx-auto"
                          disabled={loading}
                        >
                          <span className="text-lg font-bold">+</span>
                        </button>
                      </td>
                      <td className="px-2 py-2 text-center border-y border-blue-100">
                        <button
                          onClick={() => handleDecrement(selectedDate, slot.value)}
                          aria-label={`Decrease for ${slot.label}`}
                          className={`flex justify-center items-center bg-red-200 hover:bg-red-300 text-red-700 rounded-full shadow border border-red-400 transition h-7 w-9 mx-auto ${
                            slotInfo.count === 0 ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          disabled={slotInfo.count === 0 || loading}
                        >
                          <span className="text-lg font-bold">–</span>
                        </button>
                      </td>
                    </tr>
                  )})
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex gap-3 justify-between items-center flex-wrap">
            <span className="text-gray-500 text-xs italic">
              Tip: Set the number of therapists available for each session slot.<br />
              <span className="font-semibold text-blue-400">Limited case</span> timings have booking restrictions and will stay at <b>0</b> when you update default or use "Set All".<br/>
              <span className="font-semibold text-blue-600">"Default Therapist Slots" tool only applies to the next 14 days, not today or past days.</span>
            </span>
            <button
              className="mt-1 px-4 py-1.5  bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition text-sm shadow"
              style={{ minWidth: 90 }}
              disabled
              title="Save: Feature coming soon"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ManageAvailabilityPage;
