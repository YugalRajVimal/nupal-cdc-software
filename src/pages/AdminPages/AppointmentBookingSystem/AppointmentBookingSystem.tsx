import { useEffect, useState, useCallback } from "react";
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
  FiPackage,
  FiEdit2,
  FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Patient = {
  id: string;
  name: string;
  phoneNo?: string;
  userId?: {
    name?: string;
  };
  mobile1?: string;
  email?: string;
  [key: string]: any;
};

type Therapy = {
  _id: string;
  name: string;
};

type Package = {
  _id: string;
  name: string;
  totalSessions?: number;
  costPerSession?: number;
  totalCost?: number;
  sessionCount?: number;
};

type BookingSession = { date: string; time: string; _id?: string };

type DiscountInfo = {
  discountEnabled?: boolean;
  discount?: number;
  couponCode?: string;
  validityDays?: number;
};

type Booking = {
  _id: string;
  patient: Patient;
  therapy: Therapy;
  package: Package | null;
  sessions: BookingSession[];
  discountInfo?: DiscountInfo;
  discount?: number;
  couponCode?: string;
  couponValidityDays?: number;
};

type Coupon = {
  code: string;
  discount: number;
  validityDays: number;
};

function generateCouponCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; ++i) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getStartDay(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const API_BASE_URL = import.meta.env.VITE_API_URL as string;

export default function AppointmentBookingSystem() {
  const [loading, setLoading] = useState(true);
  const [guideOpen, setGuideOpen] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const [patientId, setPatientId] = useState<string>("");
  const [therapyId, setTherapyId] = useState<string>("");
  const [packageId, setPackageId] = useState<string>("");
  const [sessions, setSessions] = useState<{ date: string; time: string }[]>([]);

  const [discountEnabled, setDiscountEnabled] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>(() => generateCouponCode());
  const [validityDays, setValidityDays] = useState<number>(1);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [therapies, setTherapies] = useState<Therapy[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // EDIT STATE
  // If editBookingId !== null, act in edit mode. State mirrors booking fields.
  const [editBookingId, setEditBookingId] = useState<string | null>(null);

  // days/month for calendar
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDay(year, month);

  // --- BEGIN: Booking Fetch Logic ---

  useEffect(() => {
    async function fetchMasterData() {
      setDataLoading(true);
      setBookingError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/bookings/home-details`);
        const json = await res.json();

        let processedPatients: Patient[] = [];
        if (Array.isArray(json.patients)) {
          processedPatients = json.patients.map((raw: any) => {
            const id =
              typeof raw.id === "string" && raw.id
                ? raw.id
                : typeof raw._id === "string"
                ? raw._id
                : "";

            let patientName = raw.name;
            if (
              (!patientName || patientName.trim() === "") &&
              raw.userId &&
              typeof raw.userId === "object" &&
              typeof raw.userId.name === "string" &&
              raw.userId.name.trim() !== ""
            ) {
              patientName = raw.userId.name;
            }

            let userId = raw.userId;
            if (raw.userId && typeof raw.userId === "object") {
              userId = {
                ...raw.userId,
                name: (raw.userId.name != null ? raw.userId.name : patientName),
              };
            }

            return {
              ...raw,
              id,
              name: patientName,
              userId,
            };
          });
        }
        setPatients(processedPatients);

        setTherapies(json.therapyTypes || []);
        setPackages(json.packages || []);
      } catch {
        setPatients([]);
        setTherapies([]);
        setPackages([]);
        toast.error("Failed to load master data");
      }
      setDataLoading(false);
    }
    fetchMasterData();
    // ToastContainer: see App root for real rendering
  }, []);

  function normalizeBookings(bookings: any[]): Booking[] {
    return bookings.map((b) => {
      let patient = b.patient;
      if (
        patient &&
        patient.userId &&
        typeof patient.userId === "object" &&
        typeof patient.userId.name !== "string"
      ) {
        patient = {
          ...patient,
          userId: {
            ...patient.userId,
            name: patient.name,
          }
        };
      } else if (
        patient &&
        (!patient.userId || typeof patient.userId !== "object") &&
        typeof patient.name === "string"
      ) {
        patient = {
          ...patient,
          userId: {
            name: patient.name,
          }
        };
      }
      if (b.discountInfo && typeof b.discountInfo === "object") {
        return {
          ...b,
          patient,
          discount: b.discountInfo.discount ?? b.discount,
          couponCode: b.discountInfo.couponCode ?? b.couponCode,
          couponValidityDays: b.discountInfo.validityDays ?? b.couponValidityDays,
          discountEnabled: b.discountInfo.discountEnabled,
        };
      }
      return { ...b, patient };
    });
  }

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings`);
      const json = await res.json();
      let bookingsList: Booking[] =
        Array.isArray(json.bookings) ? normalizeBookings(json.bookings) : [];
      setBookings(bookingsList);
    } catch {
      setBookings([]);
      toast.error("Failed to fetch bookings list.");
    }
  }, []);

  useEffect(() => {
    if (!dataLoading && !loading) {
      fetchBookings();
    }
  }, [dataLoading, loading, fetchBookings]);

  // --- END: Booking Fetch Logic

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 700);
    return () => clearTimeout(t);
  }, []);

  // Editing logic. When in edit mode (editBookingId !== null), fields are set to the booking's values.
  const selectedPackage = packages.find((p) => p._id === packageId) || null;
  const getTotalSessionsForPackage = (pkg: Package | null) => {
    if (!pkg) return undefined;
    return (
      pkg.totalSessions ||
      pkg.sessionCount ||
      (() => {
        const m = pkg.name.match(/^\s*(\d+)[^\d]/);
        return m ? Number(m[1]) : undefined;
      })()
    );
  };
  const maxSelectableDates = getTotalSessionsForPackage(selectedPackage);

  // If editing, keep selection <= maxSelectableDates
  useEffect(() => {
    if (maxSelectableDates === undefined) return;
    if (sessions.length > maxSelectableDates) {
      setSessions((prev) => prev.slice(0, maxSelectableDates));
      // toast.info(`Sessions reduced to maximum allowed for this package (${maxSelectableDates}).`);
    }
  }, [packageId, maxSelectableDates]);

  // When entering edit mode, fill fields from booking
  useEffect(() => {
    if (editBookingId) {
      const booking = bookings.find((b) => b._id === editBookingId);
      if (booking) {
        setPatientId(
          booking.patient?.id || booking.patient?._id || booking.patient?.id || ""
        );
        setTherapyId(booking.therapy?._id || "");
        setPackageId(booking.package?._id || "");
        setSessions(
          Array.isArray(booking.sessions)
            ? booking.sessions.map((s) => ({
                date: s.date,
                time: s.time,
              }))
            : []
        );

        // unified discount fields
        let di = booking.discountInfo || {};
        setDiscountEnabled(!!di.discountEnabled);
        setDiscount(
          typeof di.discount === "number"
            ? di.discount
            : booking.discount || 0
        );
        setCouponCode(di.couponCode || booking.couponCode || generateCouponCode());
        setValidityDays(
          typeof di.validityDays === "number"
            ? di.validityDays
            : booking.couponValidityDays || 1
        );
        // toast.info("Now editing booking. Make changes and click Update.");
      }
    }
    // Only update when entering edit mode or bookings change
  }, [editBookingId, bookings]);

  // When leaving edit mode, clear state
  function resetForm() {
    setPatientId("");
    setTherapyId("");
    setPackageId("");
    setSessions([]);
    setDiscountEnabled(false);
    setDiscount(0);
    setCouponCode(generateCouponCode());
    setValidityDays(1);
    setEditBookingId(null);
    setBookingError(null);
    setBookingSuccess(null);
  }

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-slate-600 font-semibold"
        >
          Loading Bookings & Data…
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
      // toast.info(`Date ${dateKey} removed from session selection.`);
      return;
    }
    if (
      typeof maxSelectableDates === "number" &&
      sessions.length >= maxSelectableDates
    ) {
      // toast.warn(`You can select up to ${maxSelectableDates} date${maxSelectableDates > 1 ? "s" : ""}.`);
      return;
    }
    setSessions((prev) => [...prev, { date: dateKey, time: "" }]);
    // toast.success(`Date ${dateKey} added. Please set time.`);
  };

  const updateTime = (date: string, time: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.date === date ? { ...s, time } : s))
    );
    // toast.info(`Time for ${date} updated.`);
  };

  const selectedPatient = patients.find((p) => p.id === patientId) || null;
  const selectedTherapy = therapies.find((t) => t._id === therapyId) || null;

  function getFirstSessionEarliest(sessions: { date: string; time: string }[]) {
    if (!sessions || sessions.length === 0) return null;
    const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0];
  }

  const earliestSession = getFirstSessionEarliest(sessions);

  const canBook =
    !!selectedPatient &&
    !!selectedTherapy &&
    !!selectedPackage &&
    sessions.length > 0 &&
    !!(earliestSession && earliestSession.time);

  function getPatientDisplayName(patient: Patient | undefined | null) {
    if (!patient) return "";
    const name =
      (patient.userId && typeof patient.userId === "object" && patient.userId.name) ||
      patient.name;
    const phone = patient.phoneNo || patient.mobile1 || "";
    return phone ? `${name}${phone ? ` (${phone})` : ""}` : name;
  }
  function getPackageDisplay(pkg: Package | null) {
    if (!pkg) return "—";
    const sessions =
      pkg.totalSessions ||
      pkg.sessionCount ||
      (() => {
        const m = pkg.name.match(/^\s*(\d+)[^\d]/);
        return m ? Number(m[1]) : undefined;
      })();
    const totalCost = pkg.totalCost;
    const costPerSession =
      pkg.costPerSession ||
      (totalCost && sessions ? Math.round(totalCost / sessions) : undefined);
    let parts = [];
    if (pkg.name) {
      parts.push(pkg.name);
    }
    if (sessions || totalCost) {
      const subparts = [];
      if (totalCost) subparts.push("Total Cost " + totalCost);
      if (costPerSession) subparts.push(`[${costPerSession}]`);
      if (subparts.length > 0) parts.push(subparts.join(" "));
    }
    return parts.join("; ");
  }

  const handleRegenerateCouponCode = () => {
    setCouponCode(generateCouponCode());
    // toast.info("Coupon code regenerated.");
  };

  //---------------------------------------------
  // API CALLS (booking create, update, delete, coupon)
  //---------------------------------------------

  // CREATE/EDIT BUTTON
  const handleBookOrUpdate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setBookingSuccess(null);
    setBookingError(null);

    if (!canBook) {
      setBookingError(
        "Please fill all required fields and select session date/time."
      );
      toast.error("Please fill all required fields and select a session date and time.");
      return;
    }

    setBookingLoading(true);

    const payload: any = {
      patient: patientId,
      therapy: therapyId,
      package: packageId,
      sessions: sessions.slice().sort((a, b) => a.date.localeCompare(b.date)),
    };
    payload.discountEnabled = discountEnabled;
    if (discountEnabled) {
      payload.discount = discount;
      payload.couponCode = couponCode;
      payload.validityDays = validityDays;
    }

    try {
      let res, result;
      if (!editBookingId) {
        // NEW BOOKING (POST)
        res = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // EDIT (PUT)
        res = await fetch(`${API_BASE_URL}/api/admin/bookings/${editBookingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      result = await res.json();
      if (!res.ok || result.error) {
        setBookingError(result.message || result.error || "Booking failed.");
        toast.error(result.message || result.error || "Booking failed.");
        setBookingLoading(false);
        return;
      }
      setBookingSuccess(
        !editBookingId
          ? "Booking successfully created."
          : "Booking successfully updated."
      );
      toast.success(
        !editBookingId
          ? "Booking successfully created."
          : "Booking successfully updated."
      );
      await fetchBookings();
      resetForm();
    } catch (e: any) {
      setBookingError(editBookingId ? "Failed to update." : "Booking failed.");
      toast.error(editBookingId ? "Failed to update." : "Booking failed.");
    }
    setBookingLoading(false);
  };

  // Enter edit mode
  function handleEditBooking(bookingId: string) {
    setEditBookingId(bookingId);
    setBookingError(null);
    setBookingSuccess(null);
    // toast.info("Edit mode activated for selected booking.");
  }

  // Cancel edit mode (and clear state)
  function handleCancelEdit() {
    resetForm();
    // toast.info("Edit cancelled. Form cleared.");
  }

  // Delete
  async function handleDeleteBooking(id: string) {
    if (!window.confirm("Delete this booking?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Booking deleted successfully.");
      } else {
        const result = await res.json();
        toast.error(result?.message || "Booking could not be deleted.");
      }
      await fetchBookings();
    } catch {
      toast.error("An error occurred. Booking could not be deleted.");
    }
    if (editBookingId === id) {
      // If deleted while editing, leave edit mode
      resetForm();
      // toast.info("Booking deleted. Exited edit mode.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-slate-50 p-8"
    >
      {/* Optionally place ToastContainer at root or ensure it's rendered in App root */}
      {/* <ToastContainer /> */}

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
              onClick={e => e.stopPropagation()}
            >
              <p className="text-sm text-blue-700 mb-4">
                Manage therapy schedules, book new sessions, and view existing bookings.
              </p>
              <div className="bg-white border border-blue-100 rounded-md p-4 mb-4">
                <div className="flex items-center gap-2 font-medium text-slate-700 mb-2">
                  <FiList /> Steps to Follow
                </div>
                <ol className="list-decimal list-inside text-sm text-slate-600 space-y-1">
                  <li>Use the calendar to view and check bookings.</li>
                  <li>Select a patient, therapy, and package in 'Quick Book'.</li>
                  <li>
                    Select <span className="font-medium text-blue-800">at least one</span> session date; enter a time for the first session. Selecting all dates is <span className="font-medium text-blue-800">not mandatory</span>.
                  </li>
                  <li>Click '{editBookingId ? "Update Booking" : "Book Now"}' to {editBookingId ? "update" : "confirm"} a booking.</li>
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <div className="flex md:flex-row flex-col-reverse  gap-6">
        {/* Calendar */}
        <div className="flex-2 lg:col-span-2 bg-white border rounded-lg">
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
              const isAtMax =
                typeof maxSelectableDates === "number" &&
                sessions.length >= maxSelectableDates &&
                !selected;
              return (
                <div
                  key={day}
                  onClick={() => {
                    if (!isAtMax) toggleDate(day);
                  }}
                  className={`h-24 border cursor-pointer p-2 transition ${
                    selected
                      ? "bg-blue-50 border-blue-400"
                      : isAtMax
                        ? "bg-gray-100 cursor-not-allowed opacity-60"
                        : "hover:bg-slate-50"
                  }`}
                  style={isAtMax ? { pointerEvents: "none" } : {}}
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${selected ? "bg-blue-600 text-white" : ""}`}>
                    {day}
                  </div>
                  {selected && (
                    <div className="mt-2 text-xs text-blue-700 font-medium">
                      Selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {typeof maxSelectableDates === "number" && (
            <div className="px-4 pt-2 pb-1 text-xs text-slate-600">
              {`You can select up to ${maxSelectableDates} date${maxSelectableDates > 1 ? "s" : ""} for this package. `}
              <span className="text-blue-700">Selecting all is not mandatory; at least one is required.</span>
              <br />
              {sessions.length >= maxSelectableDates && (
                <span className="text-blue-700">Limit reached.</span>
              )}
            </div>
          )}
        </div>

        {/* Quick Book / Edit Booking */}
        <div className="flex-1 bg-white border rounded-lg p-6">
          <h3 className="font-semibold mb-4">
            {editBookingId ? "Edit Booking" : "Quick Book"}
            {editBookingId && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
                Editing
              </span>
            )}
          </h3>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiUser /> Patient Name
          </label>
          <select
            value={patientId}
            onChange={e => setPatientId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-3"
            disabled={!!editBookingId}
            // Do not allow changing patient when editing
          >
            <option value="">Select Patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {getPatientDisplayName(patient)}
              </option>
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
            {therapies.map((therapy) => (
              <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
            ))}
          </select>

          <label className="block text-sm mb-1 flex items-center gap-1">
            <FiPackage /> Package
          </label>
          <select
            value={packageId}
            onChange={e => setPackageId(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-5"
          >
            <option value="">Select Package</option>
            {packages.map((pkg) => (
              <option key={pkg._id} value={pkg._id}>
                {getPackageDisplay(pkg)}
              </option>
            ))}
          </select>

          {/* Discount Toggle */}
          <div className="mb-4 flex items-center gap-3">
            <label className="block text-sm font-semibold text-blue-700" htmlFor="toggle-discount">
              Enable Discount/Coupon
            </label>
            <button
              id="toggle-discount"
              type="button"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${discountEnabled ? "bg-blue-600" : "bg-gray-300"}`}
              onClick={() => {
                setDiscountEnabled((v) => !v);
                // toast.info(!discountEnabled ? "Discount enabled." : "Discount disabled.");
              }}
              aria-pressed={discountEnabled}
              role="switch"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow ${discountEnabled ? "translate-x-5" : "translate-x-1"}`}
              />
            </button>
          </div>

          {/* Coupon Fields - shown only if enabled */}
          <AnimatePresence>
            {discountEnabled && (
              <motion.div
                key="discountSection"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="mb-4">
                  <label className="block text-sm mb-1 font-semibold text-blue-700">Discount (%)</label>
                  <input
                    type="number"
                    value={discount}
                    min={0}
                    max={100}
                    onChange={e => {
                      setDiscount(Number(e.target.value));
                      // toast.info("Discount percentage changed.");
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Enter discount percentage"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm mb-1 font-semibold text-blue-700">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      readOnly
                      className="flex-1 border rounded px-3 py-2 bg-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      className="bg-blue-500 text-white px-3 py-2 rounded font-semibold text-xs hover:bg-blue-600"
                      onClick={handleRegenerateCouponCode}
                      title="Regenerate Code"
                    >
                      Regenerate
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">A unique 8 digit alphanumeric code will be generated.</p>
                </div>
                <div className="mb-5">
                  <label className="block text-sm mb-1 font-semibold text-blue-700">Coupon Validity (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={validityDays}
                    onChange={e => {
                      setValidityDays(Number(e.target.value));
                      // toast.info("Coupon validity days changed.");
                    }}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Number of days coupon is valid"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {/* End Coupon Fields */}

          {sessions.length > 0 && (
            <div className="space-y-3 mb-4">
              <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
                <FiClock />
                Session Dates &#38; Times
              </div>
              {sessions
                .slice()
                .sort((a, b) => a.date.localeCompare(b.date))
                .map((s, idx) => (
                  <div key={s.date} className="flex items-center gap-2 text-sm">
                    <span className="flex-1 font-mono">{s.date}</span>
                    <FiClock className="text-slate-400" />
                    <input
                      type="time"
                      value={s.time}
                      onChange={e => updateTime(s.date, e.target.value)}
                      className={`border rounded px-2 py-1 ${
                        idx === 0 && !s.time ? "border-red-400" : ""
                      }`}
                      required={idx === 0}
                      aria-required={idx === 0}
                      placeholder="Time"
                      style={{ minWidth: 110 }}
                    />
                    {idx === 0 && !s.time && (
                      <span className="text-xs text-red-500 ml-2">Time required</span>
                    )}
                  </div>
                ))}
            </div>
          )}

          {/* Booking error/success display */}
          {/* Hide warnings in favor of toast. You may keep these lines as fallback UX or remove */}
          {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
          {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}

          <div className="flex gap-2">
            <button
              disabled={!canBook || bookingLoading}
              className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
              onClick={handleBookOrUpdate}
            >
              {bookingLoading
                ? editBookingId
                  ? "Updating..."
                  : "Booking..."
                : editBookingId
                  ? "Update Booking"
                  : "Book Now"}
            </button>
            {editBookingId && (
              <button
                className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
                type="button"
                onClick={handleCancelEdit}
              >
                <FiX className="inline mr-1" />
                Cancel Edit
              </button>
            )}
          </div>
          {typeof maxSelectableDates === "number" && (
            <div className="text-xs text-blue-700 mt-3">
              {`You can select up to ${maxSelectableDates} date${maxSelectableDates > 1 ? "s" : ""} for this package. Selecting all is not mandatory.`}
            </div>
          )}
          {sessions.length === 0 && (
            <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
          )}
          {sessions.length > 0 && (!earliestSession || !earliestSession.time) && (
            <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
          )}
        </div>
      </div>

      {/* Booking Summary */}
      <div className="mt-6">
        <div className="bg-white border rounded-lg p-4 text-sm">
          <p className="font-medium mb-2">Booking Summary</p>
          {bookings && bookings.length === 0 ? (
            <div>
              <p className="text-slate-500 mb-3">No bookings found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((booking) => (
                <div
                  className={`border p-3 rounded bg-sky-50 relative ${
                    editBookingId === booking._id
                      ? "ring ring-blue-400 ring-offset-2"
                      : ""
                  }`}
                  key={booking._id}
                >
                  <div className="mb-1 font-semibold text-blue-900 flex items-center gap-2">
                    <FiUser className="text-blue-600" />
                    {getPatientDisplayName(booking.patient)}
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FiTag className="text-slate-500" />
                    <span className="text-slate-700">{booking.therapy?.name}</span>
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <FiPackage className="text-purple-500" />
                    <span className="text-purple-700">
                      {getPackageDisplay(booking.package)}
                    </span>
                  </div>
                  {Array.isArray(booking.sessions) && booking.sessions.length > 0 && (
                    <div className="mb-1 text-xs text-slate-700">
                      <span className="font-medium">Sessions:</span>{" "}
                      {booking.sessions.map((s, idx) => (
                        <span key={s._id || s.date}>
                          {s.date} {s.time}
                          {idx < booking.sessions.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* discount/coupon */}
                  {(
                      (typeof booking.discount === "number" && booking.discount > 0) ||
                      (booking.discountInfo && booking.discountInfo.discountEnabled && booking.discountInfo.discount)
                    ) && (
                    <div className="mb-1 text-xs text-blue-700">
                      Discount: <span className="font-semibold">
                        {typeof booking.discount === "number" ? booking.discount : booking.discountInfo?.discount}%</span>
                      {
                        (booking.couponCode || booking.discountInfo?.couponCode) && (
                          <>
                            {" "}
                            (Coupon: <span className="font-mono">
                            {booking.couponCode || booking.discountInfo?.couponCode}
                          </span>
                            {(booking.couponValidityDays || booking.discountInfo?.validityDays) && (
                              <> {` - valid ${booking.couponValidityDays || booking.discountInfo?.validityDays}d`}</>
                            )}
                            )
                          </>
                        )
                      }
                    </div>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs rounded px-2 py-1 border border-blue-400 text-blue-700 hover:bg-blue-50 flex items-center gap-1"
                      onClick={() => handleEditBooking(booking._id)}
                      title="Edit booking"
                      disabled={!!editBookingId && editBookingId !== booking._id}
                    >
                      <FiEdit2 />
                      Edit
                    </button>
                    <button
                      className="text-xs rounded px-2 py-1 border border-red-400 text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteBooking(booking._id)}
                      title="Delete booking"
                      disabled={!!editBookingId && editBookingId === booking._id}
                    >
                      Delete
                    </button>
                  </div>
                  {/* Edit banner overlay */}
                  {editBookingId === booking._id && (
                    <div className="absolute -top-2 right-2">
                      <span className="text-blue-800 text-xs bg-blue-200 px-2 py-0.5 rounded font-bold shadow">
                        Editing
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
