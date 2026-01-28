import { useEffect, useRef, useState, useMemo } from "react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

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
    { id: '1930-2015', label: '19:30 to 20:15', limited: true }
];

type HolidaySlot = {
    _id?: string;
    slotId: string;
    label: string;
};

type TherapistHoliday = {
    _id?: string;
    date: string;
    reason: string;
    slots: HolidaySlot[];
    isFullDay: boolean;
};

type TherapistProfile = {
    _id: string;
    therapistId?: string;
    userId?: {
        name?: string;
        email?: string;
    };
    name?: string;
    email?: string;
    mobile1?: string;
    holidays?: TherapistHoliday[];
};

type ModalMode = "none" | "full" | "partial";

// Util for therapistId link
function TherapistIdLink({ therapist }: { therapist: TherapistProfile }) {
    // FullCalendar.tsx 174-183 logic reference:
    // therapistId is shown if present, link is opened with therapistUserId
    // therapistUserId = therapist._id
    // display = name

    if (!therapist.therapistId) return <span>-</span>;
    const therapistUserId = therapist._id;
    return (
        <a
            href={`/admin/therapists?therapistId=${encodeURIComponent(therapistUserId)}`}
            className="text-blue-600 hover:underline"
            title="View therapist details"
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
        >
            {therapist.therapistId}
        </a>
    );
}

// Util for therapist name link
function TherapistNameLink({ therapist }: { therapist: TherapistProfile }) {
    // If there is no name, show "-"
    const display = therapist?.userId?.name || therapist.name || "-";
    if (display === "-") return <span>-</span>;
    const therapistUserId = therapist._id;
    return (
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
    );
}

function CalendarPopup({
    value,
    onChange,
    minDate,
    onClose
}: {
    value: string;
    onChange: (date: string) => void;
    minDate?: string;
    onClose?: () => void;
}) {
    const today = minDate || new Date().toISOString().slice(0, 10);
    const [showingMonth, setShowingMonth] = useState(() => {
        if (value) return new Date(value + "T00:00:00");
        return new Date(today + "T00:00:00");
    });

    const calendarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (
                calendarRef.current &&
                !calendarRef.current.contains(e.target as Node)
            ) {
                if (onClose) onClose();
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [onClose]);

    function formatDate(dt: Date) {
        const year = dt.getFullYear();
        const month = (dt.getMonth() + 1).toString().padStart(2, "0");
        const day = dt.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
    }
    function getMonthDays(year: number, month: number) {
        return new Date(year, month + 1, 0).getDate();
    }
    function isBeforeMin(date: string) {
        if (!minDate) return false;
        return date < minDate;
    }

    const month = showingMonth.getMonth();
    const year = showingMonth.getFullYear();
    const daysInMonth = getMonthDays(year, month);

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    let days: React.ReactNode[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(<div key={"empty-" + i} />);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month, day);
        const dateStr = formatDate(dateObj);
        days.push(
            <button
                key={dateStr}
                type="button"
                disabled={isBeforeMin(dateStr)}
                className={
                    "w-8 h-8 rounded-full " +
                    (dateStr === value
                        ? "bg-blue-600 text-white font-bold"
                        : isBeforeMin(dateStr)
                        ? "text-gray-400 cursor-not-allowed"
                        : "hover:bg-blue-100")
                }
                onClick={() => {
                    if (!isBeforeMin(dateStr)) {
                        onChange(dateStr);
                        if (onClose) onClose();
                    }
                }}
            >
                {day}
            </button>
        );
    }

    return (
        <div
            ref={calendarRef}
            className="absolute z-20 left-0 mt-1 bg-white border shadow-lg rounded p-2 w-64"
            style={{ userSelect: "none" }}
        >
            <div className="flex items-center justify-between mb-2">
                <button
                    type="button"
                    className="px-2 py-1"
                    onClick={() => {
                        setShowingMonth((prev) => {
                            const d = new Date(prev.getFullYear(), prev.getMonth() - 1, 1);
                            return d;
                        });
                    }}
                >{"<"}</button>
                <span className="font-semibold text-slate-800">
                    {showingMonth.toLocaleString("default", { month: "long" })} {showingMonth.getFullYear()}
                </span>
                <button
                    type="button"
                    className="px-2 py-1"
                    onClick={() => {
                        setShowingMonth((prev) => {
                            const d = new Date(prev.getFullYear(), prev.getMonth() + 1, 1);
                            return d;
                        });
                    }}
                >{">"}</button>
            </div>
            <div className="grid grid-cols-7 text-xs mb-1">
                {["S", "M", "T", "W", "T", "F", "S"].map((d) =>
                    <div
                        key={d}
                        className="text-center font-medium text-slate-500"
                    >
                        {d}
                    </div>
                )}
            </div>
            <div className="grid grid-cols-7 gap-1">{days}</div>
        </div>
    );
}

function DateInputWithPopup({
    value,
    onChange,
    min,
    placeholder,
    className,
    disabled
}: {
    value: string;
    onChange: (date: string) => void;
    min?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}) {
    const [showCal, setShowCal] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                className={className || "border px-3 py-2 rounded w-full"}
                placeholder={placeholder || "Select date"}
                value={value}
                readOnly
                onClick={() => !disabled && setShowCal(true)}
                onFocus={() => !disabled && setShowCal(true)}
                disabled={disabled}
                style={{ background: "#fff", cursor: "pointer" }}
            />
            <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1.5 text-gray-400"
                style={{ pointerEvents: disabled ? "none" : undefined }}
                onClick={() => !disabled && setShowCal((v) => !v)}
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className="feather feather-calendar"><rect x="3" y="4" width="18" height="18"
                        rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8"
                            y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
            </button>
            {showCal && !disabled && (
                <CalendarPopup
                    value={value}
                    onChange={(date: string) => {
                        onChange(date);
                        setShowCal(false);
                    }}
                    minDate={min}
                    onClose={() => setShowCal(false)}
                />
            )}
        </div>
    );
}

function HolidayList({
    holidays
}: { holidays?: TherapistHoliday[] }) {
    if (!holidays || holidays.length === 0) {
        return <div className="text-gray-500 text-center py-4">No assigned holidays.</div>;
    }

    // Sort holidays by date ascending
    const sortedHolidays = [...holidays].sort((a, b) =>
        (a.date || '').localeCompare(b.date || '')
    );

    return (
        <div className="border rounded px-2 py-2  mt-1 bg-slate-50 max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr>
                        <th className="text-left font-semibold p-1">Date</th>
                        <th className="text-left font-semibold p-1">Type</th>
                        <th className="text-left font-semibold p-1">Reason</th>
                        <th className="text-left font-semibold p-1">Slots</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedHolidays.map((h) => (
                        <tr key={h._id || h.date}>
                            <td className="p-1 font-mono">{h.date}</td>
                            <td className="p-1">
                                {h.isFullDay ? (
                                    <span className="inline-block px-2 py-0.5 rounded bg-green-200 text-green-800 font-semibold">Full Day</span>
                                ) : (
                                    <span className="inline-block px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-semibold">Partial</span>
                                )}
                            </td>
                            <td className="p-1">{h.reason || <span className="italic text-gray-400">—</span>}</td>
                            <td className="p-1">
                                {h.isFullDay
                                    ? <span className="text-gray-400 italic">-</span>
                                    : (
                                        h.slots && h.slots.length > 0
                                            ? h.slots.map(s => s.label).join(", ")
                                            : <span className="text-gray-400 italic">-</span>
                                    )
                                }
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function HolidayModal({
    open,
    therapist,
    onClose,
    onHolidayAssigned
}: {
    open: boolean;
    therapist: TherapistProfile | null;
    onClose: () => void;
    onHolidayAssigned: () => void;
}) {
    const [mode, setMode] = useState<ModalMode>("full");
    // For Full Day
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    // For Partial Day
    const [partialDate, setPartialDate] = useState("");
    const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
    // General state
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Reset when therapist/modal changes
    useEffect(() => {
        setMode("full");
        setFromDate("");
        setToDate("");
        setPartialDate("");
        setSelectedSlots([]);
        setErr(null);
        setSuccessMsg(null);
        setSubmitting(false);
    }, [open, therapist?._id]);

    function handleSlotChange(slotId: string, checked: boolean) {
        setSelectedSlots((prev) =>
            checked ? [...prev, slotId] : prev.filter((s) => s !== slotId)
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setErr(null);
        setSuccessMsg(null);

        if (!therapist || !therapist._id) {
            setErr("Therapist not selected");
            setSubmitting(false);
            return;
        }

        const apiUrl = `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist/${therapist._id}/holidays`;

        if (mode === "full") {
            if (!fromDate || !toDate) {
                setErr("Please select From and To dates");
                setSubmitting(false);
                return;
            }
            try {
                const res = await axios.post(
                    apiUrl,
                    {
                        fromDate,
                        toDate,
                    }
                );
                setSuccessMsg(
                    (res?.data?.message) ||
                    "Full day holiday assigned successfully"
                );
                onHolidayAssigned();
            } catch (error: any) {
                setErr(error?.response?.data?.error || error?.response?.data?.message || "Error assigning holiday");
            }
        } else if (mode === "partial") {
            if (!partialDate || selectedSlots.length === 0) {
                setErr("Please select date and slots");
                setSubmitting(false);
                return;
            }
            try {
                const res = await axios.post(
                    apiUrl,
                    {
                        date: partialDate,
                        slots: selectedSlots,
                    }
                );
                setSuccessMsg(
                    (res?.data?.message) ||
                    "Partial day holiday assigned successfully"
                );
                onHolidayAssigned();
            } catch (error: any) {
                setErr(error?.response?.data?.error || error?.response?.data?.message || "Error assigning holiday");
            }
        }
        setSubmitting(false);
    }

    if (!open) return null;

    return (
        <div className="fixed z-50 inset-0 bg-white/50 bg-opacity-30 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-lg p-6 w-[90vw] max-w-xl relative animate-fadeIn overflow-y-auto max-h-[90vh]">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-xl" onClick={onClose}>&times;</button>
                <h2 className="text-lg font-bold mb-3">
                    Manage Holidays for<br />
                    <span className="text-blue-700">
                        {therapist ? <TherapistNameLink therapist={therapist} /> : "-"}
                    </span>
                </h2>
                {/* Assigned Holidays */}
                <div className="mb-4 " >
                    <label className="block mb-2 font-semibold text-slate-700">
                        Assigned Holidays
                    </label>
                    <HolidayList holidays={therapist?.holidays} />
                </div>
                <div className="flex gap-3 mb-4">
                    <button
                        className={`px-3 py-1.5 rounded ${mode === "full" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"} transition font-semibold`}
                        onClick={() => setMode("full")}
                        type="button"
                    >
                        Assign By Date Range
                    </button>
                    <button
                        className={`px-3 py-1.5 rounded ${mode === "partial" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"} transition font-semibold`}
                        onClick={() => setMode("partial")}
                        type="button"
                    >
                        Assign By Slots (Partial Day)
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    {mode === "full" ? (
                        <div className="mb-4">
                            <label className="block mb-2 font-medium">Select Date Range:</label>
                            <div className="flex gap-2">
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1">From</label>
                                    <DateInputWithPopup
                                        value={fromDate}
                                        onChange={setFromDate}
                                        min={new Date().toISOString().slice(0, 10)}
                                        className="border px-3 py-2 rounded w-full"
                                        placeholder="Select date"
                                        disabled={submitting}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-600 mb-1">To</label>
                                    <DateInputWithPopup
                                        value={toDate}
                                        onChange={setToDate}
                                        min={fromDate || new Date().toISOString().slice(0, 10)}
                                        className="border px-3 py-2 rounded w-full"
                                        placeholder="Select date"
                                        disabled={submitting}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4">
                            <label className="block mb-2 font-medium">Select Date:</label>
                            <DateInputWithPopup
                                value={partialDate}
                                onChange={setPartialDate}
                                min={new Date().toISOString().slice(0, 10)}
                                className="border px-3 py-2 rounded w-full mb-3"
                                placeholder="Select date"
                                disabled={submitting}
                            />
                            <label className="block mb-2 font-medium">Select Slots for Partial Holiday:</label>
                            <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto border p-2 rounded bg-slate-50">
                                {SESSION_TIME_OPTIONS.map((slot) => (
                                    <label key={slot.id} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedSlots.includes(slot.id)}
                                            onChange={e => handleSlotChange(slot.id, e.target.checked)}
                                            disabled={submitting}
                                        />
                                        <span>{slot.label}{slot.limited ? " (Limited)" : ""}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    {err && <div className="text-red-600 mb-2">{err}</div>}
                    {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
                    <div className="mt-5 flex justify-end gap-3">
                        <button
                            className="px-4 py-2 bg-slate-200 rounded text-slate-700 hover:bg-slate-300"
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                            disabled={submitting}
                            type="submit"
                        >
                            {submitting ? "Submitting..." : "Assign Holiday"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Search/Pagination controls are managed OUTSIDE table; state does not reset when data reloads.
function TherapistSearchAndPagination({
    searchValue,
    onSearchValueChange,
    page,
    pageSize,
    onChangePage,
    onChangePageSize,
    filteredCount,
    totalCount
}: {
    searchValue: string;
    onSearchValueChange: (v: string) => void;
    page: number;
    pageSize: number;
    onChangePage: (v: number) => void;
    onChangePageSize: (v: number) => void;
    filteredCount: number;
    totalCount: number;
}) {
    const numPages = Math.max(1, Math.ceil(filteredCount / pageSize));
    return (
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 justify-between">
            {/* Search */}
            <div className="flex gap-2 items-center">
                <label htmlFor="therapist-search" className="font-medium text-slate-700">Search: </label>
                <input
                    id="therapist-search"
                    type="text"
                    className="border px-2 py-1 rounded"
                    value={searchValue}
                    onChange={e => onSearchValueChange(e.target.value)}
                    placeholder="Name, Email, ID or Phone"
                />
            </div>
            {/* Pagination Controls */}
            <div className="flex gap-2 items-center flex-wrap">
                <span className="text-xs text-slate-700">
                    {filteredCount} of {totalCount} found
                </span>
                <select
                    className="border px-2 py-1 rounded"
                    value={pageSize}
                    onChange={e => onChangePageSize(Number(e.target.value))}
                >
                    {[5, 10, 25, 50, 100].map(sz =>
                        <option key={sz} value={sz}>{sz} / page</option>
                    )}
                </select>
                <button
                    type="button"
                    className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-40"
                    onClick={() => onChangePage(page - 1)}
                    disabled={page <= 1}
                >Prev</button>
                <span className="text-xs">
                    Page {page} of {numPages}
                </span>
                <button
                    type="button"
                    className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 disabled:opacity-40"
                    onClick={() => onChangePage(page + 1)}
                    disabled={page >= numPages}
                >Next</button>
            </div>
        </div>
    );
}

export default function ManageHolidays() {
    // Data state
    const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Modal management
    const [holidayModalOpen, setHolidayModalOpen] = useState(false);
    const [selectedTherapist, setSelectedTherapist] = useState<TherapistProfile | null>(null);
    const [refreshFlag, setRefreshFlag] = useState(0);

    // Search/Pagination state (kept separate from data)
    const [searchValue, setSearchValue] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Fetch therapists (no API pagination for now - all are loaded and filtered client-side)
    async function fetchTherapists() {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL.replace(/\/$/, "")}/api/admin/therapist`
            );
            let therapistsArr: TherapistProfile[] = [];
            if (
                res &&
                res.data &&
                (Array.isArray(res.data) || Array.isArray(res.data.therapists))
            ) {
                therapistsArr = Array.isArray(res.data) ? res.data : res.data.therapists;
            } else if (res && res.data && res.data.therapists && typeof res.data.therapists === "object") {
                therapistsArr = Object.values(res.data.therapists).filter(
                    v => typeof v === "object" && v !== null && "_id" in v
                ) as TherapistProfile[];
            }
            setTherapists(therapistsArr);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                err?.message ||
                "Error loading therapists."
            );
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchTherapists();
    }, [refreshFlag]);

    // Filtering (memoized for performance)
    const filteredTherapists = useMemo(() => {
        if (!searchValue.trim()) return therapists;
        const v = searchValue.toLowerCase().trim();
        return therapists.filter(t => {
            return (
                (t.userId?.name?.toLowerCase().includes(v) ?? false) ||
                (t.userId?.email?.toLowerCase().includes(v) ?? false) ||
                (t.name?.toLowerCase().includes(v) ?? false) ||
                (t.email?.toLowerCase().includes(v) ?? false) ||
                (t.therapistId?.toLowerCase().includes(v) ?? false) ||
                (t.mobile1?.toLowerCase().includes(v) ?? false)
            );
        });
    }, [therapists, searchValue]);
    const totalFiltered = filteredTherapists.length;
    const totalTherapists = therapists.length;

    // Pagination - page number clamp and slice logic
    const numPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
    useEffect(() => {
        // Clamp page to valid when filter/search/pagination changes
        if (page > numPages) setPage(numPages);
        if (page < 1 && numPages > 0) setPage(1);
        // Do NOT reset search/page on data reload/refresh, per requirements
        // eslint-disable-next-line
    }, [numPages]);
    const pagedTherapists = useMemo(() => {
        const startIdx = (page - 1) * pageSize;
        return filteredTherapists.slice(startIdx, startIdx + pageSize);
    }, [filteredTherapists, page, pageSize]);

    // Table modal logic
    function openHolidayModal(therapist: TherapistProfile) {
        setSelectedTherapist(therapist);
        setHolidayModalOpen(true);
    }

    function closeHolidayModal() {
        setHolidayModalOpen(false);
        setSelectedTherapist(null);
    }

    function handleHolidayAssigned() {
        setRefreshFlag(r => r + 1);
    }

    // Handlers for pagination/search
    function onSearchValueChange(v: string) {
        setSearchValue(v);
        setPage(1); // Reset page on new search
    }
    function onChangePageSize(sz: number) {
        setPageSize(sz);
        setPage(1); // Reset page on page size change
    }
    function onChangePage(p: number) {
        setPage(Math.max(1, Math.min(numPages, p)));
    }

    return (
        <div className="min-h-screen p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Therapists</h1>
            {/* Search, Pagination controls (always outside table, invariant on data reloads) */}
            <TherapistSearchAndPagination
                searchValue={searchValue}
                onSearchValueChange={onSearchValueChange}
                page={page}
                pageSize={pageSize}
                onChangePage={onChangePage}
                onChangePageSize={onChangePageSize}
                filteredCount={totalFiltered}
                totalCount={totalTherapists}
            />
            {error ? <div className="text-red-500 mb-4">{error}</div> : null}
            <div className="bg-white border rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Therapist ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Email</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Phone No</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {loading ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="text-center py-8">Loading...</div>
                                </td>
                            </tr>
                        ) : pagedTherapists.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <div className="text-center py-8">No therapists found.</div>
                                </td>
                            </tr>
                        ) : (
                            pagedTherapists.map((t) => (
                                <tr key={t._id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 whitespace-nowrap text-slate-700 font-mono">
                                        <TherapistIdLink therapist={t} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-800">
                                        <TherapistNameLink therapist={t} />
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {t?.userId?.email || t.email || "-"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {t.mobile1 || "-"}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <button
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                                            onClick={() => openHolidayModal(t)}
                                            type="button"
                                        >
                                            Manage Holidays
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Holiday Modal */}
                <HolidayModal
                    open={holidayModalOpen}
                    therapist={selectedTherapist}
                    onClose={closeHolidayModal}
                    onHolidayAssigned={handleHolidayAssigned}
                />
            </div>
        </div>
    );
}