/**
 * TherapistReassignmentPanel.tsx
 *
 * 3-step wizard for reassigning all future sessions of a departing therapist:
 *   Step 1 – Select the departing therapist and fetch AI-generated chain plan
 *   Step 2 – Review plan, override individual session assignments as needed
 *   Step 3 – Confirm summary and execute (updates DB + page reload on success)
 *
 * Mount anywhere in your admin routes, e.g.:
 *   <Route path="/admin/therapist-reassignment" element={<TherapistReassignmentPanel />} />
 *
 * Depends on: react-toastify (already in project), Tailwind CSS.
 */

import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import {
  FiAlertTriangle, FiCheckCircle, FiUser, FiArrowRight,
  FiRefreshCw, FiEdit2, FiXCircle, FiInfo, FiChevronDown,
} from "react-icons/fi";
import { formatDateDDMMYYYY, SESSION_TIME_OPTIONS } from "../Main/types";

type TherapistOption = {
  _id: string;
  name: string;
  therapistId: string;
};

type SessionPlan = {
  bookingId: string;
  appointmentId: string;
  sessionMongoId: string;
  sessionId: string;
  date: string;
  slotId: string;
  patient: { name: string; patientId: string };
  suggestedTherapistId: string | null;
  suggestedTherapistName: string;
  chainLevel: number;
  isUnresolvable: boolean;
};

type TherapistAnalysisRow = {
  therapist: TherapistOption;
  canTakeCount: number;
  conflictCount: number;
  conflictSessionIds: string[];
};

type SuggestionsResult = {
  sessionsToReassign: SessionPlan[];
  therapistAnalysis: TherapistAnalysisRow[];
  suggestedPlan: SessionPlan[];
  allAvailableTherapists: TherapistOption[];
  message?: string;
};

function getSlotLabel(slotId: string) {
  return SESSION_TIME_OPTIONS.find(o => o.id === slotId)?.label ?? slotId;
}

function apiBase(): string {
  const e = (import.meta as any).env?.VITE_API_URL || (window as any).VITE_API_URL || "";
  return e.replace(/\/$/, "");
}

const CHAIN_COLORS = [
  "bg-blue-100  border-blue-400  text-blue-800",
  "bg-green-100 border-green-400 text-green-800",
  "bg-purple-100 border-purple-400 text-purple-800",
  "bg-amber-100 border-amber-400  text-amber-800",
  "bg-pink-100  border-pink-400   text-pink-800",
  "bg-teal-100  border-teal-400   text-teal-800",
  "bg-indigo-100 border-indigo-400 text-indigo-800",
  "bg-orange-100 border-orange-400 text-orange-800",
];
const UNRESOLVABLE_COLOR = "bg-red-100 border-red-400 text-red-800";

function chainColor(level: number, unresolvable: boolean) {
  if (unresolvable) return UNRESOLVABLE_COLOR;
  return CHAIN_COLORS[level % CHAIN_COLORS.length];
}

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2
      ${done   ? "bg-green-500 border-green-500 text-white"
       : active ? "bg-blue-600  border-blue-600  text-white"
               : "bg-white     border-gray-300   text-gray-400"}`}>
      {done ? <FiCheckCircle size={16} /> : n}
    </div>
  );
}

function StepHeader({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Select Therapist", "Review Plan", "Confirm & Execute"];
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <StepBadge n={i + 1} active={step === i + 1} done={step > i + 1} />
          <span className={`text-sm font-medium ${step === i + 1 ? "text-blue-700" : step > i + 1 ? "text-green-600" : "text-gray-400"}`}>
            {label}
          </span>
          {i < steps.length - 1 && <FiArrowRight className="text-gray-300 mx-1" />}
        </div>
      ))}
    </div>
  );
}

export default function TherapistReassignmentPanel() {
  // State vars (unchanged)
  const [departingId,    setDepartingId]    = useState("");
  const [departingName,  setDepartingName]  = useState("");
  const [therapistInput, setTherapistInput] = useState("");
  const [suggestions,    setSuggestions]    = useState<SuggestionsResult | null>(null);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [searchResults,  setSearchResults]  = useState<TherapistOption[]>([]);
  const [searchLoading,  setSearchLoading]  = useState(false);
  const [showDropdown,   setShowDropdown]   = useState(false);
  const [step,     setStep]     = useState<1 | 2 | 3>(1);
  const [loading,  setLoading]  = useState(false);
  const [executing, setExecuting] = useState(false);

  // Therapist search
  const searchTherapists = useCallback(async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return; }
    setSearchLoading(true);
    try {
      const resp = await fetch(`${apiBase()}/api/admin/bookings/home-details`);
      const data = await resp.json();
      const therapists: TherapistOption[] = (data.therapists || []).map((t: any) => ({
        _id: String(t._id),
        name: t.name || "",
        therapistId: t.therapistId || "",
      }));
      setSearchResults(
        therapists.filter(t =>
          t.name.toLowerCase().includes(q.toLowerCase()) ||
          t.therapistId.toLowerCase().includes(q.toLowerCase())
        )
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Fetch suggestions (edited to handle empty result)
  const fetchSuggestions = async () => {
    if (!departingId) { toast.error("Please select a therapist first."); return; }
    setLoading(true);
    setSuggestions(null);
    setOverrides({});
    try {
      const token = localStorage.getItem("admin-token");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) };
      const resp = await fetch(`${apiBase()}/api/admin/therapists/${departingId}/reassignment-suggestions`, { headers });

      if (!resp.ok) throw new Error((await resp.json())?.message || "API error");

      // Safely handle both empty JSON & explicit empty object (no response or error during parsing)
      const tryParse = async () => {
        try {
          return await resp.json();
        } catch {
          return null;
        }
      };
      const data: SuggestionsResult | null = await tryParse();

      // Handle logic for empty/undefined/empty-data response (lines 137-146 in backend)
      if (
        !data ||
        !Array.isArray(data.sessionsToReassign) ||
        data.sessionsToReassign.length === 0
      ) {
        // Compose the most accurate message per backend (see context 0)
        const msg = (data && typeof data.message === "string" && data.message.trim())
          ? data.message
          : "No future pending sessions found for this therapist.";
        toast.info(msg);
        setLoading(false);
        setSuggestions(null);
        setOverrides({});
        setStep(1);
        return;
      }

      setSuggestions(data);
      // Seed overrides from suggested plan
      const init: Record<string, string> = {};
      (data.suggestedPlan || []).forEach(s => {
        init[s.sessionMongoId] = s.suggestedTherapistId ?? "";
      });
      setOverrides(init);
      setStep(2);
    } catch (err: any) {
      toast.error(err?.message || "Failed to load suggestions.");
    } finally {
      setLoading(false);
    }
  };

  const finalAssignments = suggestions?.suggestedPlan.map(s => ({
    ...s,
    finalTherapistId:   overrides[s.sessionMongoId] ?? s.suggestedTherapistId ?? "",
    finalTherapistName: overrides[s.sessionMongoId]
      ? suggestions.allAvailableTherapists.find(t => t._id === overrides[s.sessionMongoId])?.name ?? "—"
      : s.suggestedTherapistName,
  })) ?? [];

  const unassignedCount = finalAssignments.filter(a => !a.finalTherapistId).length;

  const execute = async () => {
    const toSubmit = finalAssignments
      .filter(a => !!a.finalTherapistId)
      .map(a => ({
        bookingId:      a.bookingId,
        sessionMongoId: a.sessionMongoId,
        newTherapistId: a.finalTherapistId,
      }));

    if (toSubmit.length === 0) { toast.error("No valid assignments to execute."); return; }

    setExecuting(true);
    try {
      const token = localStorage.getItem("admin-token");
      const headers: Record<string, string> = { "Content-Type": "application/json", ...(token ? { Authorization: token } : {}) };
      const resp = await fetch(
        `${apiBase()}/api/admin/therapists/${departingId}/execute-reassignment`,
        { method: "POST", headers, body: JSON.stringify({ assignments: toSubmit }) }
      );
      if (!resp.ok) throw new Error((await resp.json())?.message || "Failed.");
      const data = await resp.json();
      toast.success(data.message || "Reassignment complete!", { autoClose: 2500 });
      setTimeout(() => window.location.reload(), 2500);
    } catch (err: any) {
      toast.error(err?.message || "Execution failed.");
    } finally {
      setExecuting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">

        {/* ── Page title ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FiRefreshCw className="text-blue-600" />
            Therapist Session Reassignment
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Move all future pending sessions of a departing therapist to one or more replacements.
          </p>
        </div>

        {/* ── Step header ── */}
        <StepHeader step={step} />

        {/* ══════════════════════════════════════════════════════════════════
            STEP 1 – Select departing therapist
        ══════════════════════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Which therapist is leaving?
            </h2>

            {/* Therapist search input */}
            <div className="relative max-w-md">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm">
                <FiUser className="ml-3 text-gray-400 shrink-0" />
                <input
                  className="flex-1 px-3 py-2.5 text-sm outline-none"
                  placeholder="Search therapist by name or ID…"
                  value={therapistInput}
                  onChange={e => {
                    setTherapistInput(e.target.value);
                    setDepartingId("");
                    setDepartingName("");
                    setShowDropdown(true);
                    searchTherapists(e.target.value);
                  }}
                  onFocus={() => { if (therapistInput) setShowDropdown(true); }}
                />
                {searchLoading && (
                  <FiRefreshCw className="mr-3 text-gray-400 animate-spin" size={14} />
                )}
              </div>

              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                  {searchResults.map(t => (
                    <button
                      key={t._id}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 flex items-center gap-2"
                      onClick={() => {
                        setDepartingId(t._id);
                        setDepartingName(t.name);
                        setTherapistInput(`${t.name} (${t.therapistId})`);
                        setShowDropdown(false);
                      }}
                    >
                      <FiUser className="text-gray-400 shrink-0" size={13} />
                      <span className="font-medium">{t.name}</span>
                      <span className="text-gray-400 text-xs ml-auto">{t.therapistId}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected therapist badge */}
            {departingId && (
              <div className="mt-4 inline-flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
                <FiXCircle size={15} />
                <span>Departing: <strong>{departingName}</strong></span>
              </div>
            )}

            <button
              onClick={fetchSuggestions}
              disabled={!departingId || loading}
              className={`mt-6 flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white transition
                ${departingId && !loading ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}
            >
              {loading ? <><FiRefreshCw className="animate-spin" size={14} /> Analysing…</> : <>Analyse & Get Suggestions <FiArrowRight /></>}
            </button>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 2 – Review plan
        ══════════════════════════════════════════════════════════════════ */}
        {step === 2 && suggestions && (
          <div className="space-y-5">

            {/* ── Summary banner ── */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2 text-blue-800">
                <FiUser />
                <span>Departing: <strong>{departingName}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-blue-800">
                <FiInfo size={14} />
                <span><strong>{suggestions.sessionsToReassign.length}</strong> sessions to move</span>
              </div>
              {unassignedCount > 0 && (
                <div className="flex items-center gap-2 text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-lg">
                  <FiAlertTriangle size={14} />
                  <span><strong>{unassignedCount}</strong> unassignable – assign manually below</span>
                </div>
              )}
            </div>

            {/* ── Therapist coverage analysis ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-700 text-sm">Top Replacement Candidates</h3>
                <p className="text-gray-400 text-xs mt-0.5">Therapists ranked by how many sessions they can absorb conflict-free</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-5 py-2.5 text-left font-medium">Therapist</th>
                      <th className="px-4 py-2.5 text-center font-medium">Can Take</th>
                      <th className="px-4 py-2.5 text-center font-medium">Conflicts</th>
                      <th className="px-4 py-2.5 text-center font-medium">Coverage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.therapistAnalysis.map((row, i) => {
                      const pct = suggestions.sessionsToReassign.length
                        ? Math.round((row.canTakeCount / suggestions.sessionsToReassign.length) * 100)
                        : 0;
                      return (
                        <tr key={row.therapist._id} className={`border-b border-gray-50 ${i === 0 ? "bg-green-50" : "hover:bg-gray-50"}`}>
                          <td className="px-5 py-2.5 flex items-center gap-2">
                            {i === 0 && <span className="text-xs bg-green-100 text-green-700 border border-green-200 rounded px-1.5 py-0.5 font-semibold">Best</span>}
                            <span className="font-medium text-gray-800">{row.therapist.name}</span>
                            <span className="text-gray-400 text-xs">{row.therapist.therapistId}</span>
                          </td>
                          <td className="px-4 py-2.5 text-center text-green-700 font-semibold">{row.canTakeCount}</td>
                          <td className="px-4 py-2.5 text-center text-red-500 font-semibold">{row.conflictCount}</td>
                          <td className="px-4 py-2.5 text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="text-xs text-gray-500">{pct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Chain plan legend ── */}
            {(() => {
              const levels = [...new Set(finalAssignments.map(a => a.chainLevel))].sort((a, b) => a - b);
              const levelMeta = levels.map(level => {
                const items = finalAssignments.filter(a => a.chainLevel === level && !a.isUnresolvable);
                const name  = items[0]?.finalTherapistName ?? "—";
                return { level, name, count: items.length };
              });
              const unresolvable = finalAssignments.filter(a => a.isUnresolvable);
              return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Assignment Chain</p>
                  <div className="flex flex-wrap gap-2">
                    {levelMeta.map(lm => (
                      <div key={lm.level} className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-medium ${chainColor(lm.level, false)}`}>
                        <span>Chain {lm.level + 1}: {lm.name}</span>
                        <span className="bg-white bg-opacity-60 rounded-full px-1.5 py-0.5">{lm.count}</span>
                      </div>
                    ))}
                    {unresolvable.length > 0 && (
                      <div className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-medium ${UNRESOLVABLE_COLOR}`}>
                        <FiAlertTriangle size={11} />
                        <span>Unassignable</span>
                        <span className="bg-white bg-opacity-60 rounded-full px-1.5 py-0.5">{unresolvable.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* ── Sessions table ── */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-700 text-sm">Session Assignments</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Override the suggested therapist for any row using the dropdown</p>
                </div>
                <button
                  onClick={() => {
                    // Reset all overrides to suggestion
                    const reset: Record<string, string> = {};
                    suggestions.suggestedPlan.forEach(s => { reset[s.sessionMongoId] = s.suggestedTherapistId ?? ""; });
                    setOverrides(reset);
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  <FiRefreshCw size={11} /> Reset to suggested
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 border-b border-gray-100">
                      <th className="px-4 py-2.5 text-left font-medium">Date</th>
                      <th className="px-4 py-2.5 text-left font-medium">Time Slot</th>
                      <th className="px-4 py-2.5 text-left font-medium">Patient</th>
                      <th className="px-4 py-2.5 text-left font-medium">Appointment ID</th>
                      <th className="px-4 py-2.5 text-left font-medium w-56">Assign To</th>
                      <th className="px-4 py-2.5 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {finalAssignments
                      .sort((a, b) => a.date.localeCompare(b.date))
                      .map(row => {
                        const chosenId   = overrides[row.sessionMongoId] ?? row.suggestedTherapistId ?? "";
                        const isEdited   = chosenId !== (row.suggestedTherapistId ?? "");
                        const color      = chainColor(row.chainLevel, row.isUnresolvable || !chosenId);
                        return (
                          <tr key={row.sessionMongoId} className="border-b border-gray-50 hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-700 font-medium whitespace-nowrap">
                              {formatDateDDMMYYYY(row.date)}
                            </td>
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                              {getSlotLabel(row.slotId)}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-gray-800">{row.patient.name}</span>
                              {row.patient.patientId && (
                                <span className="text-gray-400 text-xs ml-1">({row.patient.patientId})</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-xs">{row.appointmentId}</td>
                            <td className="px-4 py-3">
                              <div className="relative">
                                <select
                                  className={`w-full text-xs border rounded-lg px-2 py-1.5 pr-6 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-300
                                    ${!chosenId ? "border-red-300 bg-red-50" : isEdited ? "border-amber-400 bg-amber-50" : "border-gray-200 bg-white"}`}
                                  value={chosenId}
                                  onChange={e => setOverrides(prev => ({ ...prev, [row.sessionMongoId]: e.target.value }))}
                                >
                                  <option value="">— Unassigned —</option>
                                  {suggestions.allAvailableTherapists.map(t => (
                                    <option key={t._id} value={t._id}>{t.name}</option>
                                  ))}
                                </select>
                                <FiChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 font-medium ${color}`}>
                                {row.isUnresolvable || !chosenId
                                  ? <><FiAlertTriangle size={10} /> Unassigned</>
                                  : isEdited
                                    ? <><FiEdit2 size={10} /> Overridden</>
                                    : <><FiCheckCircle size={10} /> Chain {row.chainLevel + 1}</>
                                }
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Navigation ── */}
            <div className="flex justify-between pt-2">
              <button onClick={() => { setStep(1); setSuggestions(null); setOverrides({}); }}
                className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={finalAssignments.filter(a => !!a.finalTherapistId).length === 0}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm text-white transition
                  ${finalAssignments.filter(a => !!a.finalTherapistId).length > 0
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-gray-300 cursor-not-allowed"}`}
              >
                Review & Confirm →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            STEP 3 – Confirm & Execute
        ══════════════════════════════════════════════════════════════════ */}
        {step === 3 && suggestions && (
          <div className="space-y-5">

            {/* Warning box */}
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex gap-3">
              <FiAlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-amber-800">
                <p className="font-semibold mb-1">Please review before confirming</p>
                <p>This action will permanently update <strong>{finalAssignments.filter(a => !!a.finalTherapistId).length}</strong> session
                  records across multiple bookings. The change is logged in the audit trail and cannot be reversed from this panel.</p>
              </div>
            </div>

            {/* Summary by target therapist */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-700 text-sm">Summary by Replacement Therapist</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {(() => {
                  const grouped: Record<string, { name: string; sessions: typeof finalAssignments }> = {};
                  finalAssignments.forEach(a => {
                    if (!a.finalTherapistId) return;
                    if (!grouped[a.finalTherapistId]) grouped[a.finalTherapistId] = { name: a.finalTherapistName, sessions: [] };
                    grouped[a.finalTherapistId].sessions.push(a);
                  });
                  return Object.entries(grouped).map(([tid, { name, sessions }]) => (
                    <div key={tid} className="px-5 py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-400" size={14} />
                        <span className="font-medium text-gray-800">{name}</span>
                      </div>
                      <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {sessions.length} session{sessions.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ));
                })()}
                {unassignedCount > 0 && (
                  <div className="px-5 py-3 flex items-center justify-between text-sm bg-red-50">
                    <div className="flex items-center gap-2 text-red-700">
                      <FiAlertTriangle size={14} />
                      <span className="font-medium">Unassigned (skipped)</span>
                    </div>
                    <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">
                      {unassignedCount} session{unassignedCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <button onClick={() => setStep(2)}
                className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1">
                ← Back to Edit
              </button>
              <button
                onClick={execute}
                disabled={executing}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm text-white transition
                  ${executing ? "bg-gray-400 cursor-wait" : "bg-green-600 hover:bg-green-700"}`}
              >
                {executing
                  ? <><FiRefreshCw className="animate-spin" size={14} /> Executing…</>
                  : <><FiCheckCircle size={14} /> Confirm Reassignment</>}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}