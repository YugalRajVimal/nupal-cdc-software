import { useEffect, useState } from "react";
import PageMeta from "../../../components/common/PageMeta";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

// --------- Calendar-picker integration --------
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

interface PerDayStat {
  date: string;
  sessionsCompleted?: number;
  sessionsScheduled?: number;
  bookingsCreated?: number;
}

interface DashboardData {
  activeChildren: number;
  activeTherapists: number;
  totalSessions: number;
  todaysTotalSessions: number;
  todaysPendingSessions: number;
  todaysCompletedSessions: number;
  allTimePendingPayments: number;
  thisMonthsPendingPayments: number;
  pendingTasks: number;
  pendingBookingRequests: number;
  pendingSessionEditRequests: number;
  pendingTherapistManualSignUp: number;
  sessionsCompletedPerDay: PerDayStat[];
  sessionScheduledPerDay: PerDayStat[];
  bookingsCreatedPerDay: PerDayStat[];
}

const API_URL = import.meta.env.VITE_API_URL;

function getDateRangeFromStats(stats: PerDayStat[] = []): [string, string] | null {
  if (!stats.length) return null;
  const sorted = [...stats].sort((a, b) => a.date.localeCompare(b.date));
  return [sorted[0].date, sorted[sorted.length - 1].date];
}

function todayISODateStr() {
  const today = new Date();
  return today.toISOString().slice(0, 10);
}

function getDaysAgoISODateStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// For DayPicker (calendar), convert yyyy-mm-dd to Date and vice versa:
function isoToDate(iso: string): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}
function dateToIso(date?: Date): string {
  if (!date) return "";
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Helper to calculate date difference in days
function dateDiffInDays(a: string, b: string) {
  const d1 = new Date(a);
  const d2 = new Date(b);
  // 86400000 ms in a day
  return Math.floor(Math.abs((d2.getTime() - d1.getTime()) / 86400000));
}

export default function AdminDashboardHome() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date range state for filtering - using ISO strings for data filtering
  const [startDate, setStartDate] = useState<string>(getDaysAgoISODateStr(7));
  const [endDate, setEndDate] = useState<string>(todayISODateStr());

  // Calendar popover visibility
  const [showStartCal, setShowStartCal] = useState(false);
  const [showEndCal, setShowEndCal] = useState(false);

  // Set range after data loads
  useEffect(() => {
    if (dashboardData) {
      const rangeStats =
        dashboardData.sessionScheduledPerDay && dashboardData.sessionScheduledPerDay.length
          ? dashboardData.sessionScheduledPerDay
          : dashboardData.sessionsCompletedPerDay;
      const range = getDateRangeFromStats(rangeStats);
      if (range) {
        const computedEnd = todayISODateStr() < range[1] ? todayISODateStr() : range[1];
        const computedStart = (() => {
          const date = new Date(computedEnd);
          date.setDate(date.getDate() - 7);
          const iso = date.toISOString().slice(0, 10);
          return iso < range[0] ? range[0] : iso;
        })();
        setStartDate(computedStart);
        setEndDate(computedEnd);
      } else {
        setStartDate(getDaysAgoISODateStr(7));
        setEndDate(todayISODateStr());
      }
    }
  }, [dashboardData]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const url =
      (API_URL ? API_URL.replace(/\/+$/, "") : "") +
      "/api/admin/bookings/overview";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to fetch overview data");
        }
        return res.json();
      })
      .then((json) => {
        if (json.success && json.data) {
          setDashboardData(json.data);
        } else {
          throw new Error(json.message || "Invalid dashboard response");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Helper: get value as numeric (or undefined/NaN), fallback for non-numeric "--"
  function getValueAsNumber(val: any) {
    if (val === "--" || val === undefined || val === null) return undefined;
    const num = typeof val === "string" ? parseInt(val, 10) : val;
    return isNaN(num) ? undefined : num;
  }

  const statCardConfig = [
    {
      title: "PENDING PAYMENTS (ALL TIME)",
      key: "allTimePendingPayments",
      value: dashboardData?.allTimePendingPayments ?? "--",
      sub: dashboardData
        ? `${dashboardData.allTimePendingPayments} pending`
        : "",
      color: "border-blue-400",
    },
    {
      title: "PENDING PAYMENTS (THIS MONTH)",
      key: "thisMonthsPendingPayments",
      value: dashboardData?.thisMonthsPendingPayments ?? "--",
      sub: dashboardData
        ? `${dashboardData.thisMonthsPendingPayments} pending this month`
        : "",
      color: "border-blue-600",
    },
    {
      title: "PENDING LEADS / TASKS",
      key: "pendingTasks",
      value: dashboardData?.pendingTasks ?? "--",
      sub: null,
      color: "border-green-400",
    },
    {
      title: "SESSIONS STATS",
      key: "todaysPendingSessions",
      value:
        dashboardData?.todaysPendingSessions !== undefined
          ? dashboardData.todaysPendingSessions
          : "--",
      sub: dashboardData
        ? `Pending Today: ${dashboardData.todaysPendingSessions}, All: ${dashboardData.totalSessions}, Total Today: ${dashboardData.todaysTotalSessions}, Done: ${dashboardData.todaysCompletedSessions}`
        : "",
      color: "border-yellow-400",
    },
  ];

  function buildMergedSessionData(
    completed: PerDayStat[] = [],
    scheduled: PerDayStat[] = []
  ) {
    const dateMap: Record<
      string,
      { date: string; sessionsCompleted: number; sessionsScheduled: number }
    > = {};
    for (const obj of scheduled) {
      const sessionsScheduled =
        obj.sessionsScheduled !== undefined
          ? obj.sessionsScheduled
          : (obj as any).sessionScheduled;
      dateMap[obj.date] = {
        date: obj.date,
        sessionsCompleted: 0,
        sessionsScheduled: sessionsScheduled ?? 0,
      };
    }
    for (const obj of completed) {
      if (!dateMap[obj.date]) {
        dateMap[obj.date] = {
          date: obj.date,
          sessionsCompleted: obj.sessionsCompleted ?? 0,
          sessionsScheduled: 0,
        };
      } else {
        dateMap[obj.date].sessionsCompleted = obj.sessionsCompleted ?? 0;
      }
    }
    return Object.values(dateMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => ({
        ...d,
        sessionsCompleted: d.sessionsCompleted ?? 0,
        sessionsScheduled: d.sessionsScheduled ?? 0,
      }));
  }

  function filterMergedSessionDataByDate(
    data: ReturnType<typeof buildMergedSessionData>
  ) {
    if (!startDate || !endDate) return [];
    return data.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );
  }

  function filterBookingsPerDayByDate(
    data: { date: string; value: number }[]
  ) {
    if (!startDate || !endDate) return [];
    return data.filter((d) => d.date >= startDate && d.date <= endDate);
  }

  const mergedSessionDataRaw = buildMergedSessionData(
    dashboardData?.sessionsCompletedPerDay,
    dashboardData?.sessionScheduledPerDay
  );

  const mergedSessionData = filterMergedSessionDataByDate(mergedSessionDataRaw);

  const bookingsPerDayRaw =
    dashboardData?.bookingsCreatedPerDay?.map(({ date, bookingsCreated }) => ({
      date,
      value: bookingsCreated,
    })) ?? [];

  const bookingsPerDay = filterBookingsPerDayByDate(
    bookingsPerDayRaw.filter((b): b is { date: string; value: number } => typeof b.value === 'number')
  );

  function StatusCircle({ value }: { value: any }) {
    const numValue = getValueAsNumber(value);
    const isGreen = numValue === 0;
    return (
      <span
        className={`inline-block ml-2 w-5 h-5 opacity-50 rounded-full ${
          isGreen ? "bg-green-500" : "bg-red-500"
        }`}
        style={{
          verticalAlign: "middle",
        }}
        aria-label={isGreen ? "No pending" : "Has pending"}
      ></span>
    );
  }

  const sessionStatsRange = getDateRangeFromStats(
    dashboardData?.sessionScheduledPerDay?.length
      ? dashboardData.sessionScheduledPerDay
      : dashboardData?.sessionsCompletedPerDay ?? []
  );
  const dateMin = sessionStatsRange ? sessionStatsRange[0] : "";
  const dateMax = sessionStatsRange ? sessionStatsRange[1] : todayISODateStr();

  // Calendar constraints so dates can be limited to available stats:
  const minDateObj = isoToDate(dateMin);
  const maxDateObj = isoToDate(dateMax);

  // Calendar accessibility: close calendar on outside click/key
  function closeStartCalendar() {
    setShowStartCal(false);
  }
  function closeEndCalendar() {
    setShowEndCal(false);
  }

  // Calculate the day difference for current filter range
  const numDays =
    startDate && endDate ? dateDiffInDays(startDate, endDate) + 1 : 1;

  // Determine chart layout based on days difference: vertical (col) if >8, horizontal (row/left-right) if <=8
  const isChartsStackedVertical = numDays > 8;
  const chartsGridClass = isChartsStackedVertical
    ? "grid grid-cols-1 gap-6 mb-8"
    : "grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8";

  return (
    <div className="w-full">
      <PageMeta
        title="Nupal CDC"
        description="Admin and Sub-Admin Panel for Nupal CDC"
      />
      <div className="p-6 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-10 h-10 border-4 border-t-brand-500 border-gray-200 rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md mb-6">
            {error}
          </div>
        ) : (
          <>
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
              {statCardConfig.map((card, i) => (
                <div
                  key={i}
                  className={`bg-white rounded-xl border-l-4 ${card.color} p-5 shadow-sm flex items-center`}
                >
                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-red-600 mb-2">
                      {card.title}
                    </h3>
                    <div className="text-2xl font-bold text-gray-800">
                      {card.value}
                    </div>
                    {card.sub && (
                      <p className="text-sm text-gray-500 mt-1">{card.sub}</p>
                    )}
                  </div>
                  <div className="flex items-center h-full justify-center ml-2">
                    <StatusCircle value={card.value} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-3 flex flex-col md:flex-row md:items-center gap-2 relative">
              {/* CALENDAR PICKERS (From/To) */}
              <div className="relative">
                <label
                  htmlFor="startDate"
                  className="text-gray-700 font-medium mr-2"
                >
                  From:
                </label>
                <button
                  type="button"
                  id="startDate"
                  className="border border-gray-300 rounded px-2 py-1 min-w-[110px] text-left bg-white"
                  onClick={() => setShowStartCal((s) => !s)}
                >
                  {startDate}
                </button>
                {/* Calendar for "from" */}
                {showStartCal && (
                  <div className="absolute z-20 mt-2 bg-white p-2 rounded shadow-lg border">
                    <DayPicker
                      mode="single"
                      selected={isoToDate(startDate)}
                      onSelect={d => {
                        if (d) {
                          const iso = dateToIso(d);
                          setStartDate(iso);
                          setShowStartCal(false);
                          // If chosen start is after end, adjust endDate too
                          if (iso > endDate) setEndDate(iso);
                        }
                      }}
                      fromDate={minDateObj}
                      toDate={maxDateObj}
                      disabled={endDate && isoToDate(endDate) ? [{ after: isoToDate(endDate) as Date }] : undefined}
                    />
                    <button
                      className="mt-2 text-xs text-blue-600 underline"
                      onClick={closeStartCalendar}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
              <div className="relative">
                <label
                  htmlFor="endDate"
                  className="text-gray-700 font-medium mr-2"
                >
                  To:
                </label>
                <button
                  type="button"
                  id="endDate"
                  className="border border-gray-300 rounded px-2 py-1 min-w-[110px] text-left bg-white"
                  onClick={() => setShowEndCal((s) => !s)}
                >
                  {endDate}
                </button>
                {/* Calendar for "to" */}
                {showEndCal && (
                  <div className="absolute z-20 mt-2 bg-white p-2 rounded shadow-lg border">
                    <DayPicker
                      mode="single"
                      selected={isoToDate(endDate)}
                      onSelect={d => {
                        if (d) {
                          const iso = dateToIso(d);
                          setEndDate(iso);
                          setShowEndCal(false);
                          // If chosen end is before start, adjust startDate too
                          if (iso < startDate) setStartDate(iso);
                        }
                      }}
                      fromDate={minDateObj}
                      toDate={maxDateObj}
                      disabled={startDate && isoToDate(startDate) ? [{ before: isoToDate(startDate) as Date }] : undefined}
                    />
                    <button
                      className="mt-2 text-xs text-blue-600 underline"
                      onClick={closeEndCalendar}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-400 ml-1 mt-1 md:mt-0">
                (Showing {mergedSessionData.length} days)
              </div>
            </div>
            {/* Charts Section */}
            <div className={chartsGridClass}>
              {/* Check-Ins vs Scheduled Sessions, double bar, date filter on top */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-2">
                  Check-Ins vs Scheduled Sessions Per Day
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={mergedSessionData}
                      margin={{ top: 16, right: 24, left: 8, bottom: 32 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={-40}
                        textAnchor="end"
                        height={60}
                        interval={0}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="sessionsCompleted"
                        name="Sessions Completed"
                        fill="#48bb78"
                        barSize={18}
                      />
                      <Bar
                        dataKey="sessionsScheduled"
                        name="Sessions Scheduled"
                        fill="#fbbf24"
                        barSize={18}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              {/* Bookings Created Per Day */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-2">
                  Bookings Created Per Day
                </h2>
                <div className="h-64 w-full overflow-x-auto">
                  <div style={{ minWidth: Math.max(600, bookingsPerDay.length * 50) }}>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={bookingsPerDay}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          angle={-40}
                          textAnchor="end"
                          height={60}
                          interval={0}
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="value"
                          name="Bookings Created"
                          stroke="#3182ce"
                          strokeWidth={3}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span>Active Therapists</span>
                    <span className="font-bold text-blue-600">
                      {dashboardData?.activeTherapists ?? "--"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span>Active Parents</span>
                    <span className="font-bold text-purple-600">
                      {dashboardData?.activeChildren ?? "--"}
                    </span>
                  </div>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-white rounded-xl border shadow p-5">
                <h2 className="font-semibold text-lg mb-4">System Alerts</h2>

                <div className="space-y-3">
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700 flex items-center">
                    <span className="mr-2">⚠</span>
                    <span>
                      {dashboardData?.pendingBookingRequests ?? "--"} Pending Booking Requests
                    </span>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 flex items-center">
                    <span className="mr-2">📝</span>
                    <span>
                      {dashboardData?.pendingSessionEditRequests ?? "--"} Pending Session Edit Requests
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 flex items-center">
                    <span className="mr-2">🕑</span>
                    <span>
                      {dashboardData?.pendingTherapistManualSignUp ?? "--"} Pending Therapist Approvals
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
