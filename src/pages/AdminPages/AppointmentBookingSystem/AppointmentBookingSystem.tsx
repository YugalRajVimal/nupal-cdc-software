import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  FiInfo,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiClock,
  FiUser,
  FiTag,
  FiChevronUp,
  FiChevronDown,
  FiList,
} from "react-icons/fi";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// Sample data for patients and therapies
const SAMPLE_PATIENTS = [
  { id: "1", name: "Aarav Sharma" },
  { id: "2", name: "Meera Patel" },
  { id: "3", name: "Kabir Singh" },
];

const SAMPLE_THERAPIES = [
  { id: "speech", label: "Speech Therapy" },
  { id: "occupational", label: "Occupational Therapy" },
  { id: "behavior", label: "Behavior Therapy" },
];

// Sample appointments for Booking Summary (used as demo data when nothing is selected)
const SAMPLE_APPOINTMENTS = [
  {
    patient: SAMPLE_PATIENTS[0],
    therapy: SAMPLE_THERAPIES[0],
    sessions: [
      { date: "2024-07-14", time: "09:00" },
      { date: "2024-07-18", time: "11:30" }
    ],
  },
  {
    patient: SAMPLE_PATIENTS[1],
    therapy: SAMPLE_THERAPIES[2],
    sessions: [
      { date: "2024-07-16", time: "10:15" }
    ],
  },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function AppointmentBookingSystem() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  // Use IDs for patient and therapy (to work well with dropdown)
  const [patientId, setPatientId] = useState<string>("");
  const [therapyId, setTherapyId] = useState<string>("");

  const [sessionCount, setSessionCount] = useState(1);

  const [sessions, setSessions] = useState<
    { date: string; time: string }[]
  >([]);

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);


  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold"
        >
          Loading Consultations & Leads…
        </motion.div>
      </div>
    );
  }

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
  };

  const toggleDate = (day: number) => {
    const dateKey = `${year}-${month + 1}-${day}`;

    const exists = sessions.find((s) => s.date === dateKey);
    if (exists) {
      setSessions((prev) => prev.filter((s) => s.date !== dateKey));
      return;
    }

    if (sessions.length < sessionCount) {
      setSessions((prev) => [...prev, { date: dateKey, time: "" }]);
    }
  };

  const updateTime = (date: string, time: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.date === date ? { ...s, time } : s))
    );
  };

  // Get the patient and therapy objects based on selection
  const selectedPatient =
    SAMPLE_PATIENTS.find((p) => p.id === patientId) || null;
  const selectedTherapy =
    SAMPLE_THERAPIES.find((t) => t.id === therapyId) || null;

  const canBook =
    !!selectedPatient &&
    !!selectedTherapy &&
    sessions.length === sessionCount &&
    sessions.every((s) => s.time);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-8"
    >
      {/* Guide */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`bg-blue-50 border border-blue-200 rounded-lg p-0 mb-8 overflow-hidden cursor-pointer`}
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
            {guideOpen ? (
              <FiChevronUp className="text-blue-600" />
            ) : (
              <FiChevronDown className="text-blue-600" />
            )}
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
              onClick={e => e.stopPropagation()} // So inner elements don't re-trigger collapse
            >
              <p className="text-sm text-blue-700 mb-4">
                Manage therapy schedules, book new sessions, and view conflicts.
              </p>

              <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                  <FiList /> Steps to Follow
                </div>
                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                  <li>Use the calendar to check therapist availability.</li>
                  <li>Select a child and therapy type in 'Quick Book'.</li>
                  <li>Click 'Book Now' to confirm and generate an invoice.</li>
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white border rounded-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 font-semibold">
              <FiCalendar />
              {new Date(year, month).toLocaleString("default", {
                month: "long",
              })} {year}
            </div>
            <div className="flex gap-2">
              <button onClick={() => changeMonth("prev")} className="p-2 border rounded">
                <FiChevronLeft />
              </button>
              <button onClick={() => changeMonth("next")} className="p-2 border rounded">
                <FiChevronRight />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 text-xs text-slate-500 border-b">
            {DAYS.map((d) => (
              <div key={d} className="p-2 text-center font-medium">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-24 border" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateKey = `${year}-${month + 1}-${day}`;
              const selected = sessions.find((s) => s.date === dateKey);

              return (
                <div
                  key={day}
                  onClick={() => toggleDate(day)}
                  className={`h-24 border cursor-pointer p-2 transition ${
                    selected
                      ? "bg-blue-50 border-blue-400"
                      : "hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${selected ? "bg-blue-600 text-white" : ""}`}>
                    {day}
                  </div>
                  {selected && (
                    <div className="mt-2 text-xs text-blue-700 font-medium">
                      {selectedPatient ? selectedPatient.name : "Selected"}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Book */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">Quick Book</h3>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiUser /> Patient Name
          </label>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Patient</option>
            {SAMPLE_PATIENTS.map((patient) => (
              <option key={patient.id} value={patient.id}>{patient.name}</option>
            ))}
          </select>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiTag /> Therapy Type
          </label>
          <select
            value={therapyId}
            onChange={e => setTherapyId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
          >
            <option value="">Select Therapy</option>
            {SAMPLE_THERAPIES.map((therapy) => (
              <option key={therapy.id} value={therapy.id}>{therapy.label}</option>
            ))}
          </select>

          <label className="block text-sm mb-1">Sessions Needed</label>
          <input
            type="number"
            min={1}
            value={sessionCount}
            onChange={(e) => {
              const val = Math.max(1, Number(e.target.value));
              setSessionCount(val);
              setSessions([]);
            }}
            className="w-full border rounded px-3 py-2 mb-4"
          />

          <div className="space-y-3 mb-4">
            {sessions.map((s) => (
              <div key={s.date} className="flex items-center gap-2 text-sm">
                <span className="flex-1">{s.date}</span>
                <FiClock className="text-slate-400" />
                <input
                  type="time"
                  value={s.time}
                  onChange={(e) => updateTime(s.date, e.target.value)}
                  className="border rounded px-2 py-1"
                />
              </div>
            ))}
            {sessions.length < sessionCount && (
              <p className="text-xs text-slate-400">Select {sessionCount - sessions.length} more date(s)</p>
            )}
          </div>

          <button
            disabled={!canBook}
            className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          >
            Book Now
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6">
        <div className="bg-white border rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Booking Summary</p>
          {(sessions.length === 0 || !selectedPatient || !selectedTherapy) ? (
            <div>
              <p className="text-slate-500 mb-3">No sessions selected.<br />Sample Bookings:</p>
              <div className="flex flex-col gap-4">
                {SAMPLE_APPOINTMENTS.map((appt, idx) => (
                  <div
                    className="border p-3 rounded bg-sky-50"
                    key={appt.patient.id + "-" + idx}
                  >
                    <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                      <FiUser className="text-blue-600" />
                      {appt.patient.name}
                    </div>
                    <div className="mb-2 flex items-center gap-2">
                      <FiTag className="text-slate-500" />
                      <span className="text-slate-700">{appt.therapy.label}</span>
                    </div>
                    <div>
                      <span className="text-xs uppercase text-slate-500 font-medium">
                        Sessions:
                      </span>
                      <ul className="mt-1 space-y-1">
                        {appt.sessions.map((s, sidx) => (
                          <li key={s.date + "-" + sidx} className="flex items-center gap-2 text-slate-700">
                            <FiClock className="text-blue-400 text-xs" />
                            <span>
                              {s.date} {s.time && `at ${s.time}`}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="border p-3 rounded bg-sky-50">
                <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                  <FiUser className="text-blue-600" />
                  {selectedPatient.name}
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <FiTag className="text-slate-500" />
                  <span className="text-slate-700">{selectedTherapy.label}</span>
                </div>
                <div>
                  <span className="text-xs uppercase text-slate-500 font-medium">Sessions:</span>
                  <ul className="mt-1 space-y-1">
                    {sessions.map((s, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-slate-700">
                        <FiClock className="text-blue-400 text-xs" />
                        <span>{s.date} {s.time && `at ${s.time}`}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
