
// export default TherapistIncomeComparison;
import { useEffect, useState, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type TherapistUser = {
  _id: string;
  name?: string;
  email?: string;
  status?: string;
  isDisabled?: boolean;
};
type Therapist = {
  _id: string;
  therapistId: string;
  userId: TherapistUser | string; // can be a user object or legacy string
  name?: string;
  experienceYears: number | null;
};

type Patient = {
  _id: string;
  name: string;
  patientId: string;
};

type Package = {
  _id: string;
  name: string;
  costPerSession: number;
  totalCost: number;
  sessionCount: number;
};

type Session = {
  date: string;
  sessionId?: string;
  slotId: string;
  isCheckedIn: boolean;
  price: number;
  bookingId: string;
  package?: Package;
  patient?: Patient;
};

type Earning = {
  amount: number;
  type: string;
  fromDate: string;
  toDate: string;
  remark: string;
  paidOn: string;
  _id: string;
};

type EarningEntry = {
  earning: Earning;
  sessions: Session[];
  sessionDeliveredSumCost: number;
  earningAmount: number;
  difference: number;
};

type TherapistComparison = {
  therapist: Therapist;
  earnings: EarningEntry[];
  totalSessionDeliveredSumCost: number;
  totalEarningAmount: number;
  totalDifference: number;
  sessionsWithoutEarning?: Session[];
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONEY = (amt: number) =>
  amt.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const initials = (name?: string) =>
  name
    ? name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()
    : "TH";

// SlotId => time range, e.g., 1000-1045 => 10:00 AM – 10:45 AM
function slotIdToTimeRange(slotId: string): string {
  if (!slotId.includes("-")) return slotId;
  const [startStr, endStr] = slotId.split("-");
  const fmt = (val: string) => {
    if (val.length !== 4) return val;
    let hour = Number(val.slice(0, 2));
    const min = Number(val.slice(2, 4));
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12;
    if (hour === 0) hour = 12;
    return `${hour}:${min.toString().padStart(2, "0")} ${ampm}`;
  };
  return `${fmt(startStr)} – ${fmt(endStr)}`;
}

// ─── Session Expandable ───────────────────────────────────────────────────────

const SessionExpand: React.FC<{ sessions: Session[]; label?: string }> = ({
  sessions,
  label = "session",
}) => {
  const [open, setOpen] = useState(false);

  if (!sessions || sessions.length === 0)
    return <span className="text-gray-400 text-xs">—</span>;

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-md transition-colors duration-150"
      >
        <span className="text-[10px]">{open ? "▾" : "▸"}</span>
        {sessions.length} {label}{sessions.length !== 1 ? "s" : ""}
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden animate-[fadeIn_0.15s_ease]">
          <div className="max-h-56 overflow-y-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Date</th>
                  <th className="px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Slot</th>
                  <th className="px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Patient</th>
                  <th className="px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[10px]">Package</th>
                  <th className="px-3 py-2 font-semibold text-gray-500 uppercase tracking-wide text-[10px] text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, i) => (
                  <tr
                    key={s.sessionId ?? i}
                    className="border-t border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <td className="px-3 py-2 font-mono text-gray-600">{s.date}</td>
                    <td className="px-3 py-2 font-mono text-gray-600">
                      {slotIdToTimeRange(s.slotId)}
                    </td>
                    <td className="px-3 py-2">
                      {s.patient ? (
                        <>
                          <span className="font-medium text-gray-700">{s.patient.name}</span>
                          <span className="block font-mono text-gray-400 text-[10px]">{s.patient.patientId}</span>
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-gray-600">{s.package?.name ?? <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-2 font-mono text-gray-700 text-right">{MONEY(s.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Type Badge ───────────────────────────────────────────────────────────────

const TypeBadge: React.FC<{ type: string; violation?: boolean }> = ({ type, violation }) => {
  const base = "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md capitalize";
  const colors =
    type === "salary"
      ? "bg-blue-50 text-blue-700"
      : type === "bonus"
      ? "bg-yellow-50 text-yellow-700"
      : "bg-gray-100 text-gray-600";

  return (
    <span className={`${base} ${colors}`}>
      {violation && <span title="Exceeds 70%">⚠️</span>}
      {type}
    </span>
  );
};

// ─── Summary Stat ─────────────────────────────────────────────────────────────

const Stat: React.FC<{ label: string; value: string | number; danger?: boolean; success?: boolean }> = ({
  label,
  value,
  danger,
  success,
}) => (
  <div className="flex-1 px-5 py-3.5 border-r border-gray-100 last:border-r-0">
    <p className="text-[10.5px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</p>
    <p
      className={`text-[17px] font-semibold font-mono tracking-tight ${
        danger ? "text-red-600" : success ? "text-emerald-600" : "text-gray-800"
      }`}
    >
      {value}
    </p>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

function getTherapistDisplayInfo(therapist: Therapist) {
  // userId can be a reference or populated object
  let name = therapist.name ?? undefined;
  let email = undefined;
  if (therapist.userId && typeof therapist.userId === "object") {
    name = therapist.userId.name ?? name;
    email = therapist.userId.email;
  }
  return { name: name ?? therapist.therapistId, email };
}

// SMALL: Utility to make unique/flat filters for therapist, type, remarks, etc from dataset
function getFilterOptions(
  data: TherapistComparison[]
): {
  therapistNames: string[];
  earningTypes: string[];
  remarkKeywords: string[];
  experienceYears: number[];
  statusOptions: Array<{ value: "all" | "active" | "disabled"; label: string }>;
} {
  const therapistNames = [
    ...new Set(
      data.map((obj) => {
        // Try use name from userId if available
        if (obj.therapist.userId && typeof obj.therapist.userId === "object" && obj.therapist.userId.name) {
          return obj.therapist.userId.name;
        }
        return obj.therapist.name ?? obj.therapist.therapistId;
      }).filter(Boolean)
    ),
  ].sort();
  const earningTypes = [
    ...new Set(data.flatMap((obj) => obj.earnings.map((e) => e.earning.type))),
  ];
  const remarkKeywords = [
    ...new Set(
      data
        .flatMap((obj) =>
          obj.earnings
            .map((e) => e.earning.remark)
            .filter(Boolean)
            .flatMap((r) =>
              r
                ?.split(" ")
                .map((w) => w.trim())
                .filter((w) => w)
            )
        )
    ),
  ].sort();
  const experienceYears = [
    ...new Set(data.map((obj) => obj.therapist.experienceYears).filter((x) => x != null)),
  ].sort((a, b) => (a as number) - (b as number));

  // For therapist active/disabled status filter
  const hasDisabled = data.some(
    (obj) =>
      obj.therapist.userId &&
      typeof obj.therapist.userId === "object" &&
      typeof obj.therapist.userId.isDisabled === "boolean"
  );

  // Only show status filter if any therapist has userId with isDisabled field
  const statusOptions: Array<{ value: "all" | "active" | "disabled"; label: string }> = [
    { value: "all" as const, label: "All" },
    ...(hasDisabled
      ? [
          { value: "active" as const, label: "Active" },
          { value: "disabled" as const, label: "Disabled" },
        ]
      : []),
  ];

  return { therapistNames, earningTypes, remarkKeywords, experienceYears, statusOptions };
}

const TherapistIncomeComparison = () => {
  const [data, setData] = useState<TherapistComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Search and Filter States ────────
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [violationFilter, setViolationFilter] = useState<"all" | "over" | "within">("all");
  const [experienceFilter, setExperienceFilter] = useState<number | "">("");
  const [remarkSearch, setRemarkSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<"" | "earning" | "sessions">(""); // Extra: sorting
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("active"); // New: therapist status filter

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("super-admin-token");
        if (!token) throw new Error("No superadmin token found in localStorage.");
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/super-admin/finance/therapist/salary-session-comparison`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          }
        );
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(
            `API error: ${res.status}${err?.message ? " — " + err.message : ""}`
          );
        }
        // remove debug console.log and assign response only once
        const responseData = await res.json();
        console.log("TherapistIncomeComparison fetch response:", responseData);
        setData(responseData);
      } catch (err: any) {
        setError(err?.message ?? String(err));
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Prepare filter options
  const filterOpts = useMemo(() => getFilterOptions(data), [data]);

  // Filtered and searched data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Search by therapist name/id or email
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((obj) => {
        const therapist = obj.therapist;
        let name = therapist.name;
        let email = "";
        if (therapist.userId && typeof therapist.userId === "object") {
          name = therapist.userId.name ?? name;
          email = therapist.userId.email ?? "";
        }
        const matchName = (name ?? therapist.therapistId).toLowerCase().includes(q);
        const matchEmail = email?.toLowerCase().includes(q);
        const matchId = therapist.therapistId.toLowerCase().includes(q);
        return matchName || matchId || matchEmail;
      });
    }

    // Status filter: active/disabled
    if (statusFilter !== "all") {
      result = result.filter((obj) => {
        if (obj.therapist.userId && typeof obj.therapist.userId === "object") {
          const isDisabled = obj.therapist.userId.isDisabled;
          if (statusFilter === "active") {
            return isDisabled === false || typeof isDisabled === "undefined";
          }
          if (statusFilter === "disabled") {
            return isDisabled === true;
          }
        }
        // If userId is string or missing isDisabled, treat as active unless filter is "disabled"
        return statusFilter === "active";
      });
    }

    // Search earning remark
    if (remarkSearch.trim()) {
      const q = remarkSearch.trim().toLowerCase();
      result = result.filter((obj) =>
        obj.earnings.some((e) => (e.earning.remark ?? "").toLowerCase().includes(q))
      );
    }

    // Earning type filter (salary, bonus)
    if (typeFilter) {
      result = result.filter((obj) =>
        obj.earnings.some((e) => e.earning.type === typeFilter)
      );
    }

    // Experience years filter
    if (experienceFilter !== "") {
      result = result.filter(
        (obj) => obj.therapist.experienceYears === experienceFilter
      );
    }

    // Violation filter
    if (violationFilter !== "all") {
      result = result.filter((obj) => {
        const seventyPct = obj.totalSessionDeliveredSumCost * 0.7;
        const isViolation = obj.totalEarningAmount > seventyPct;
        return violationFilter === "over" ? isViolation : !isViolation;
      });
    }

    // Sorting support (by earning/sessions)
    if (sortBy === "earning") {
      result = result.sort(
        (a, b) => b.totalEarningAmount - a.totalEarningAmount
      );
    }
    if (sortBy === "sessions") {
      result = result.sort(
        (a, b) => b.totalSessionDeliveredSumCost - a.totalSessionDeliveredSumCost
      );
    }

    return result;
  }, [data, search, remarkSearch, typeFilter, violationFilter, experienceFilter, sortBy, statusFilter]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-end gap-3 mb-8">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
          Therapist Income Comparison
        </h2>
        {!loading && !error && data.length > 0 && (
          <span className="mb-0.5 text-xs font-medium bg-gray-200 text-gray-500 rounded-full px-3 py-0.5">
            {data.length} therapists
          </span>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white px-6 py-5 rounded-xl mb-7 flex flex-wrap items-end gap-4 border border-gray-200 shadow-sm">
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Search Therapist
          </label>
          <input
            type="text"
            placeholder="Name, ID, or Email"
            className="rounded-md border border-gray-300 py-1.5 px-3 text-sm w-[180px] focus:outline-indigo-400"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Earning Type
          </label>
          <select
            className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-[120px] bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {filterOpts.earningTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Highlight
          </label>
          <select
            className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-[120px] bg-white"
            value={violationFilter}
            onChange={(e) =>
              setViolationFilter(e.target.value as "all" | "over" | "within")
            }
          >
            <option value="all">All</option>
            <option value="over">Exceeds 70%</option>
            <option value="within">Within 70%</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Experience
          </label>
          <select
            className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-[100px] bg-white"
            value={experienceFilter}
            onChange={(e) =>
              setExperienceFilter(
                e.target.value === "" ? "" : Number(e.target.value)
              )
            }
          >
            <option value="">All</option>
            {filterOpts.experienceYears.map((exp) => (
              <option key={exp} value={exp}>
                {exp} yrs
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Remark Search
          </label>
          <input
            type="text"
            placeholder="Search remark"
            className="rounded-md border border-gray-300 py-1.5 px-3 text-sm w-[140px] focus:outline-indigo-400"
            value={remarkSearch}
            onChange={(e) => setRemarkSearch(e.target.value)}
          />
        </div>
        {/* New: Therapist Status filter */}
        {filterOpts.statusOptions.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1">
              Status
            </label>
            <select
              className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-[110px] bg-white"
              value={statusFilter}
              onChange={e =>
                setStatusFilter(e.target.value as "all" | "active" | "disabled")
              }
            >
              {filterOpts.statusOptions.map(o => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-xs font-semibold text-gray-500 block mb-1">
            Sort By
          </label>
          <select
            className="rounded-md border border-gray-300 py-1.5 px-2 text-sm w-[120px] bg-white"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "" | "earning" | "sessions")
            }
          >
            <option value="">Default</option>
            <option value="earning">Total Earning</option>
            <option value="sessions">Session Sum</option>
          </select>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-20 text-gray-400">
          <div className="text-3xl mb-3">⏳</div>
          <p className="text-sm">Loading therapist data…</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6 text-red-700">
          <span className="text-lg mt-0.5">⚠️</span>
          <div>
            <p className="font-semibold text-sm">Failed to load data</p>
            <p className="text-xs mt-0.5 text-red-500">{error}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredData.length === 0 && (
        <div className="text-center py-16 text-gray-400 text-sm">
          No therapist data found matching filter/search.
        </div>
      )}

      {/* Cards */}
      {!loading &&
        !error &&
        filteredData.map((obj) => {
          const {
            therapist,
            earnings,
            totalSessionDeliveredSumCost,
            totalEarningAmount,
            sessionsWithoutEarning,
          } = obj;

          const seventyPct = totalSessionDeliveredSumCost * 0.7;
          const isViolation = totalEarningAmount > seventyPct;
          const pct =
            totalSessionDeliveredSumCost > 0
              ? Math.min(
                  (totalEarningAmount / totalSessionDeliveredSumCost) * 100,
                  100
                )
              : 0;
          // Get therapist display info (name, email)
          const { name: displayName, email } = getTherapistDisplayInfo(therapist);

          // Get status for this therapist (active/disabled)
          let isDisabled: boolean | undefined = undefined;
          if (therapist.userId && typeof therapist.userId === "object") {
            isDisabled = therapist.userId.isDisabled;
          }
          // const statusLabel = isDisabled === true ? "Disabled" : "Active";

          return (
            <div
              key={therapist._id}
              className={`bg-white rounded-2xl mb-6 overflow-hidden transition-shadow duration-200 hover:shadow-lg ${
                isViolation
                  ? "border-2 border-red-200 shadow-sm"
                  : "border border-gray-200 shadow-sm"
              }`}
            >
              {/* ── Card Header ── */}
              <div
                className={`flex flex-wrap items-center justify-between gap-4 px-6 py-5 border-b ${
                  isViolation
                    ? "bg-red-50 border-red-100"
                    : "bg-white border-gray-100"
                }`}
              >
                {/* Avatar + Name + Email */}
                <div className="flex items-center gap-4">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-semibold flex-shrink-0 ${
                      isViolation
                        ? "bg-gradient-to-br from-pink-400 to-red-500"
                        : "bg-gradient-to-br from-indigo-400 to-violet-600"
                    }`}
                  >
                    {initials(displayName)}
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-gray-900 leading-tight">
                      {displayName}
                    </p>
                    {email && (
                      <p className="text-[12px] font-mono text-blue-700/90 mt-0.5 break-all">{email}</p>
                    )}
                    <p className="text-[12px] font-mono text-gray-400 mt-0.5">
                      {therapist.therapistId}
                      {therapist.experienceYears != null
                        ? ` · ${therapist.experienceYears} yrs exp`
                        : ""}
                    </p>
                  </div>
                </div>

                {/* Status & isDisabled Pill */}
                <div className="flex flex-col items-end gap-1">
                  <div
                    className={`inline-flex items-center gap-2 text-[13px] font-medium px-4 py-1.5 rounded-full whitespace-nowrap ${
                      isDisabled
                        ? "bg-gray-200 text-gray-500"
                        : isViolation
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isDisabled
                          ? "bg-gray-400"
                          : isViolation
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {isDisabled ? "Disabled" : (isViolation
                      ? "Exceeds 70% threshold"
                      : "Within 70% threshold")}
                  </div>
                  {/* Smaller status label, if showing both thresholds and active/disabled */}
                  {!isDisabled && (
                    <span
                      className={"text-xs text-gray-400 font-semibold px-2 py-0"}
                      style={{ fontSize: "10px" }}
                    >
                      Active
                    </span>
                  )}
                </div>
              </div>

              {/* ── Summary Bar ── */}
              <div className="flex bg-gray-50 border-b border-gray-100">
                <Stat
                  label="Total Earnings"
                  value={MONEY(totalEarningAmount)}
                  danger={isViolation}
                />
                <Stat
                  label="Session Sum"
                  value={MONEY(totalSessionDeliveredSumCost)}
                />
                <Stat label="70% Cap" value={MONEY(seventyPct)} />
                <Stat label="Earning Periods" value={earnings.length} />
              </div>

              {/* ── Progress Bar ── */}
              <div className="px-6 pt-4 pb-4 bg-gray-50 border-b border-gray-100">
                <div className="flex justify-between text-[11.5px] text-gray-500 mb-1.5">
                  <span>{pct.toFixed(1)}% of session sum paid out</span>
                  <span
                    className={
                      isViolation
                        ? "text-red-600 font-medium"
                        : "text-emerald-600 font-medium"
                    }
                  >
                    Limit: 70%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isViolation
                        ? "bg-gradient-to-r from-red-400 to-red-600"
                        : "bg-gradient-to-r from-emerald-400 to-emerald-600"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* ── Earnings Table ── */}
              <div className="px-6 py-5 overflow-x-auto">
                {earnings.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-6">
                    No salary or earning periods found for this therapist.
                  </p>
                ) : (
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        {[
                          "Type",
                          "Period",
                          "Remark",
                          "Paid On",
                          "Earning",
                          "Session Sum",
                          "Difference",
                          "Sessions",
                        ].map((h, i) => (
                          <th
                            key={h}
                            className={`px-3 py-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-200 whitespace-nowrap ${
                              i >= 4 && i <= 6
                                ? "text-right"
                                : "text-left"
                            }`}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((e) => {
                        const {
                          earning,
                          sessionDeliveredSumCost,
                          earningAmount,
                          difference,
                          sessions,
                        } = e;
                        const entryViolation =
                          earning.type === "salary" &&
                          earningAmount > sessionDeliveredSumCost * 0.7;

                        return (
                          <tr
                            key={earning._id}
                            className={`border-b border-gray-100 last:border-b-0 transition-colors ${
                              entryViolation
                                ? "bg-red-50 hover:bg-red-100"
                                : "hover:bg-gray-50"
                            }`}
                          >
                            {/* Type */}
                            <td className="px-3 py-3">
                              <TypeBadge
                                type={earning.type}
                                violation={entryViolation}
                              />
                            </td>

                            {/* Period */}
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs text-gray-600">
                                {formatDate(earning.fromDate)} –{" "}
                                {formatDate(earning.toDate)}
                              </span>
                            </td>

                            {/* Remark */}
                            <td className="px-3 py-3 text-xs text-gray-500 max-w-[160px] truncate">
                              {earning.remark || "—"}
                            </td>

                            {/* Paid On */}
                            <td className="px-3 py-3">
                              <span className="font-mono text-xs text-gray-600">
                                {earning.paidOn
                                  ? formatDate(earning.paidOn)
                                  : "—"}
                              </span>
                            </td>

                            {/* Earning */}
                            <td className="px-3 py-3 text-right">
                              <span className="font-mono text-sm font-medium text-gray-800">
                                {MONEY(earningAmount)}
                              </span>
                            </td>

                            {/* Session Sum */}
                            <td className="px-3 py-3 text-right">
                              <span className="font-mono text-sm text-gray-600">
                                {MONEY(sessionDeliveredSumCost)}
                              </span>
                            </td>

                            {/* Difference */}
                            <td className="px-3 py-3 text-right">
                              <span
                                className={`font-mono text-sm font-semibold ${
                                  difference < 0
                                    ? "text-red-600"
                                    : "text-emerald-600"
                                }`}
                              >
                                {difference >= 0 ? "+" : ""}
                                {MONEY(difference)}
                              </span>
                            </td>

                            {/* Sessions */}
                            <td className="px-3 py-3">
                              <SessionExpand sessions={sessions} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* ── Unmapped Sessions Warning ── */}
              {Array.isArray(sessionsWithoutEarning) &&
                sessionsWithoutEarning.length > 0 && (
                  <div className="mx-6 mb-5 flex gap-3 items-start bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
                    <span className="text-lg mt-0.5 flex-shrink-0">⚠️</span>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Unmapped Sessions Detected
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        {sessionsWithoutEarning.length} checked-in session
                        {sessionsWithoutEarning.length !== 1 ? "s" : ""} not
                        covered by any earning period.
                      </p>
                      <div className="mt-2.5">
                        <SessionExpand
                          sessions={sessionsWithoutEarning}
                          label="unmapped session"
                        />
                      </div>
                    </div>
                  </div>
                )}

              {/* ── Violation Notice ── */}
              {isViolation && (
                <div className="mx-6 mb-5 flex gap-3 items-start bg-red-50 border border-red-200 rounded-xl px-5 py-3.5">
                  <span className="text-base mt-0.5 flex-shrink-0">❌</span>
                  <p className="text-xs text-red-700">
                    <span className="font-semibold">Notice: </span>
                    Total earnings of{" "}
                    <span className="font-semibold underline">
                      {MONEY(totalEarningAmount)}
                    </span>{" "}
                    exceed 70% of the session sum ({MONEY(seventyPct)}).
                  </p>
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
};

export default TherapistIncomeComparison;