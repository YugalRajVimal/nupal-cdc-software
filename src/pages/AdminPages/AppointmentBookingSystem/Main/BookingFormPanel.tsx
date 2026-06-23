
// // import { useState } from "react";
// // import { AnimatePresence, motion } from "framer-motion";
// // import {
// //   FiUser, FiTag, FiPackage, FiClock, FiX, FiHash, FiZap, FiAlertTriangle,
// // } from "react-icons/fi";
// // import {
// //   Therapist, Therapy, Package, Patient, BookingSession, QuickFillSettings,
// //   SESSION_TIME_OPTIONS as _SLOTS,
// //   formatDateDDMMYYYY, getTotalSessionsForPackage, getPatientDisplayName, getPackageDisplay,
// // } from "./types";

// // // --- Helper: Sorts ---
// // // (1) Sort therapists by name
// // function sortTherapistsByName(therapists: Therapist[]): Therapist[] {
// //   return [...therapists].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
// // }

// // // (2) Sort therapies by name
// // function sortTherapiesByName(therapies: Therapy[]): Therapy[] {
// //   return [...therapies].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
// // }

// // // (3) Sort patients/children by name
// // function sortPatientsByName(patients: Patient[]): Patient[] {
// //   return [...patients].sort((a, b) => {
// //     const aName = getPatientDisplayName(a) || "";
// //     const bName = getPatientDisplayName(b) || "";
// //     return aName.localeCompare(bName);
// //   });
// // }

// // // ─── QuickFillModal ───────────────────────────────────────────────────────────

// // type QuickFillModalProps = {
// //   open: boolean;
// //   onClose: () => void;
// //   therapists: Therapist[];
// //   therapies: Therapy[];
// //   /** Currently saved settings (null = not yet configured) */
// //   settings: QuickFillSettings | null;
// //   onSave: (s: QuickFillSettings) => void;
// //   onClear: () => void;
// // };

// // function QuickFillModal({
// //   open, onClose, therapists, therapies, settings, onSave, onClear,
// // }: QuickFillModalProps) {
// //   const [localTherapistId, setLocalTherapistId] = useState(settings?.therapistId ?? "");
// //   const [localTherapyTypeId, setLocalTherapyTypeId] = useState(settings?.therapyTypeId ?? "");
// //   const [localSlotId, setLocalSlotId] = useState(settings?.slotId ?? "");

// //   // Sync local state when modal reopens with new settings
// //   const handleOpen = () => {
// //     setLocalTherapistId(settings?.therapistId ?? "");
// //     setLocalTherapyTypeId(settings?.therapyTypeId ?? "");
// //     setLocalSlotId(settings?.slotId ?? "");
// //   };

// //   const canSave = localTherapistId && localTherapyTypeId && localSlotId;

// //   const handleSave = () => {
// //     if (!canSave) return;
// //     onSave({ therapistId: localTherapistId, therapyTypeId: localTherapyTypeId, slotId: localSlotId });
// //     onClose();
// //   };

// //   if (!open) return null;

// //   // Sort therapists and therapies by name for dropdowns
// //   const sortedTherapists = sortTherapistsByName(therapists);
// //   const sortedTherapies = sortTherapiesByName(therapies);

// //   return (
// //     <AnimatePresence>
// //       <motion.div
// //         key="qf-overlay"
// //         className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
// //         style={{ backdropFilter: "blur(2px)" }}
// //         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
// //         onClick={onClose}
// //       >
// //         <motion.div
// //           initial={{ scale: 0.95, opacity: 0 }}
// //           animate={{ scale: 1, opacity: 1 }}
// //           exit={{ scale: 0.95, opacity: 0 }}
// //           transition={{ type: "spring", stiffness: 300, damping: 28 }}
// //           className="bg-white rounded-xl shadow-xl w-full max-w-md border border-blue-100 relative"
// //           onClick={e => e.stopPropagation()}
// //           onAnimationComplete={handleOpen}
// //         >
// //           {/* Header */}
// //           <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-blue-50">
// //             <div className="flex items-center gap-2 text-blue-700 font-semibold text-base">
// //               <FiZap className="text-yellow-500" />
// //               Quick Fill Settings
// //             </div>
// //             <button onClick={onClose} className="text-slate-400 hover:text-slate-600" type="button">
// //               <FiX size={20} />
// //             </button>
// //           </div>

// //           {/* Body */}
// //           <div className="px-6 py-5 space-y-4">
// //             <p className="text-xs text-slate-500 leading-relaxed">
// //               Choose a <strong>therapist</strong>, <strong>therapy type</strong>, and <strong>time slot</strong>.
// //               Every date you click on the calendar will be auto-filled with these values.
// //               You can change these settings any time to assign a different therapist or slot for subsequent dates.
// //             </p>

// //             {/* Therapist */}
// //             <div>
// //               <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
// //                 <FiUser size={12} /> Therapist <span className="text-red-500">*</span>
// //               </label>
// //               <select
// //                 value={localTherapistId}
// //                 onChange={e => setLocalTherapistId(e.target.value)}
// //                 className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
// //               >
// //                 <option value="">Select therapist…</option>
// //                 {sortedTherapists.map(t => (
// //                   <option key={t._id} value={t._id}>
// //                     {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>

// //             {/* Therapy type */}
// //             <div>
// //               <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
// //                 <FiTag size={12} /> Therapy Type <span className="text-red-500">*</span>
// //               </label>
// //               <select
// //                 value={localTherapyTypeId}
// //                 onChange={e => setLocalTherapyTypeId(e.target.value)}
// //                 className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
// //               >
// //                 <option value="">Select therapy type…</option>
// //                 {sortedTherapies.map(t => (
// //                   <option key={t._id} value={t._id}>{t.name}</option>
// //                 ))}
// //               </select>
// //             </div>

// //             {/* Time slot */}
// //             <div>
// //               <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
// //                 <FiClock size={12} /> Time Slot <span className="text-red-500">*</span>
// //               </label>
// //               <select
// //                 value={localSlotId}
// //                 onChange={e => setLocalSlotId(e.target.value)}
// //                 className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
// //               >
// //                 <option value="">Select time slot…</option>
// //                 {_SLOTS.map(s => (
// //                   <option key={s.id} value={s.id}>
// //                     {s.label}{s.limited ? " (Limited case)" : ""}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>

// //             <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
// //               ⚠️ If the chosen slot is already booked or unavailable on a specific date, a warning will appear
// //               in that session row. You can still override the time manually in the table below.
// //             </p>
// //           </div>

// //           {/* Footer */}
// //           <div className="flex gap-2 px-6 pb-5 pt-1">
// //             <button
// //               type="button"
// //               className="flex-1 rounded-lg border border-blue-500 bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
// //               disabled={!canSave}
// //               onClick={handleSave}
// //             >
// //               Save &amp; Activate
// //             </button>
// //             {settings && (
// //               <button
// //                 type="button"
// //                 className="px-4 rounded-lg border border-red-300 text-red-600 bg-red-50 text-sm hover:bg-red-100 transition"
// //                 onClick={() => { onClear(); onClose(); }}
// //               >
// //                 Clear
// //               </button>
// //             )}
// //           </div>
// //         </motion.div>
// //       </motion.div>
// //     </AnimatePresence>
// //   );
// // }

// // // ─── QuickFillBadge ───────────────────────────────────────────────────────────

// // type QuickFillBadgeProps = {
// //   settings: QuickFillSettings;
// //   therapists: Therapist[];
// //   therapies: Therapy[];
// //   onEdit: () => void;
// //   onClear: () => void;
// // };

// // function QuickFillBadge({ settings, therapists, therapies, onEdit, onClear }: QuickFillBadgeProps) {
// //   // Show sorted display name, though single match
// //   const tName = sortTherapistsByName(therapists).find(t => t._id === settings.therapistId)?.name ?? "—";
// //   const tyName = sortTherapiesByName(therapies).find(t => t._id === settings.therapyTypeId)?.name ?? "—";
// //   const slotLabel = _SLOTS.find(s => s.id === settings.slotId)?.label ?? settings.slotId;

// //   return (
// //     <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2.5 mb-4">
// //       <FiZap className="text-yellow-500 mt-0.5 shrink-0" size={16} />
// //       <div className="flex-1 min-w-0 text-xs">
// //         <span className="font-semibold text-yellow-800">Quick Fill active —</span>{" "}
// //         <span className="text-yellow-700">
// //           {tName} · {tyName} · {slotLabel}
// //         </span>
// //         <br />
// //         <span className="text-yellow-600">Click calendar dates to auto-fill sessions with these settings.</span>
// //       </div>
// //       <div className="flex gap-1 shrink-0">
// //         <button
// //           type="button"
// //           onClick={onEdit}
// //           className="text-xs px-2 py-1 rounded border border-yellow-400 text-yellow-800 hover:bg-yellow-100 transition"
// //         >Edit</button>
// //         <button
// //           type="button"
// //           onClick={onClear}
// //           className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition"
// //         >Off</button>
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── SessionDatesTimesTable ───────────────────────────────────────────────────

// // type SessionDatesTimesTableProps = {
// //   sessions: BookingSession[];
// //   updateSlotId: (date: string, slotId: string, idx: number) => void;
// //   updateSessionTherapist: (idx: number, therapistId: string) => void;
// //   updateSessionTherapyType: (idx: number, therapyTypeId: string) => void;
// //   editBookingId: string | null;
// //   therapists: Therapist[];
// //   therapistId: string;
// //   therapies: Therapy[];
// //   therapyId: string;
// //   getAvailableSlotsForDate: (
// //     date: string,
// //     sessions: any[],
// //     currSlotId: string,
// //     currTherapistId?: string,
// //     isEdit?: boolean
// //   ) => { [slotId: string]: { disabled: boolean; reason: string } };
// //   bookedSlotsPerRow: { [rowKey: string]: string[] };
// //   removeSession: (idx: number) => void;
// //   /** When set, rows whose auto-filled slot is unavailable show an inline warning */
// //   quickFillSettings: QuickFillSettings | null;
// // };

// // function SessionDatesTimesTable({
// //   sessions, updateSlotId, updateSessionTherapist, updateSessionTherapyType,
// //   editBookingId, therapists, therapistId, therapies, therapyId,
// //   getAvailableSlotsForDate, bookedSlotsPerRow, removeSession,
// //   quickFillSettings,
// // }: SessionDatesTimesTableProps) {
// //   // Sorted therapists and therapies for dropdown
// //   const sortedTherapists = sortTherapistsByName(therapists);
// //   const sortedTherapies = sortTherapiesByName(therapies);

// //   return (
// //     <div className="space-y-3 mb-4">
// //       <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
// //         <FiClock /> Session Dates &amp; Times
// //       </div>
// //       <div className="overflow-x-auto">
// //         <table className="min-w-[680px] w-fit border-collapse text-xs">
// //           <thead>
// //             <tr>
// //               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
// //               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
// //                 <FiClock className="inline mr-1" />Time Slot
// //               </th>
// //               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
// //                 <FiUser className="inline mr-1" />Therapist
// //               </th>
// //               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
// //                 <FiTag className="inline mr-1" />Therapy Type
// //               </th>
// //               <th className="px-2 py-1 border border-slate-200 bg-slate-100" />
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {sessions.map((s, idx, arr) => {
// //               const rowTherapistId = s.therapistId || therapistId;
// //               let slotInfo: { [slotId: string]: { disabled: boolean; reason: string } };
// //               try {
// //                 slotInfo = getAvailableSlotsForDate(s.date, arr, s.slotId, rowTherapistId, !!editBookingId);
// //               } catch {
// //                 slotInfo = Object.fromEntries(_SLOTS.map(sl => [sl.id, { disabled: true, reason: "Error loading slots" }]));
// //               }

// //               const bookedSlotsForRow = bookedSlotsPerRow[`${s.date}:${rowTherapistId}`] || [];
// //               const duplicateSlot = arr.some(
// //                 (other, oi) => oi !== idx && s.date === other.date && s.slotId && s.slotId === other.slotId
// //               );

// //               // Detect auto-filled slot conflict: slot was pre-set by quickFill but is now disabled
// //               const isQuickFillConflict =
// //                 quickFillSettings &&
// //                 s.slotId &&
// //                 s.slotId === quickFillSettings.slotId &&
// //                 slotInfo[s.slotId]?.disabled;

// //               let therapyTypeIdVal = "";
// //               if (s.therapyTypeId && typeof s.therapyTypeId === "object" && (s.therapyTypeId as any)._id) {
// //                 therapyTypeIdVal = (s.therapyTypeId as any)._id;
// //               } else if (typeof s.therapyTypeId === "string") {
// //                 therapyTypeIdVal = s.therapyTypeId;
// //               } else {
// //                 therapyTypeIdVal = therapyId;
// //               }

// //               return (
// //                 <tr key={s.date + ":" + idx} className={`text-sm ${isQuickFillConflict ? "bg-red-50" : ""}`}>
// //                   {/* Date */}
// //                   <td className="px-2 py-1 border border-slate-200 font-mono align-top">
// //                     {formatDateDDMMYYYY(s.date)}
// //                   </td>

// //                   {/* Time Slot */}
// //                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
// //                     <select
// //                       value={s.slotId}
// //                       onChange={e => updateSlotId(s.date, e.target.value, idx)}
// //                       className={`border rounded px-2 py-1 ${
// //                         duplicateSlot || (idx === 0 && !s.slotId) || isQuickFillConflict
// //                           ? "border-red-400"
// //                           : ""
// //                       }`}
// //                       required={idx === 0}
// //                       style={{ minWidth: 180 }}
// //                     >
// //                       <option value="">Select Time Slot</option>
// //                       {_SLOTS.map(slot => {
// //                         const info = slotInfo[slot.id] || { disabled: true, reason: "N/A" };
// //                         let label = slot.label;
// //                         if (slot.limited) label += " (Limited case)";
// //                         if (info.disabled && info.reason === "Already booked") label += " - Already Booked";
// //                         else if (info.disabled && info.reason) label += `  - ${info.reason}`;
// //                         const takenBySelf = arr.some(
// //                           (other, oi) => oi !== idx && other.date === s.date && other.slotId === slot.id
// //                         );
// //                         return (
// //                           <option key={slot.id} value={slot.id} disabled={info.disabled || takenBySelf}>
// //                             {label}
// //                           </option>
// //                         );
// //                       })}
// //                     </select>
// // <br/>
// //                     {/* Inline warnings */}
// //                     {isQuickFillConflict && (
// //                       <div className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
// //                         <FiAlertTriangle size={11} />
// //                         Auto-filled slot unavailable for this date —{" "}
// //                         {slotInfo[s.slotId]?.reason || "conflict"}.
// //                         Please choose another time.
// //                       </div>
// //                     )}
// //                     {!isQuickFillConflict && duplicateSlot && (
// //                       <span className="text-xs text-red-500 ml-2">
// //                         Cannot choose same time for the same date.
// //                       </span>
// //                     )}
// //                     {bookedSlotsForRow.length > 0 && (
// //                       <span className="block mt-1 text-xs text-amber-700">
// //                         Already booked:{" "}
// //                         {bookedSlotsForRow
// //                           .map(id => _SLOTS.find(opt => opt.id === id)?.label || id)
// //                           .join(", ")}
// //                       </span>
// //                     )}
// //                     {idx === 0 && !s.slotId && (
// //                       <span className="text-xs text-red-500 ml-2">Time required</span>
// //                     )}
// //                   </td>

// //                   {/* Therapist */}
// //                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
// //                     <select
// //                       value={s.therapistId || therapistId}
// //                       onChange={e => updateSessionTherapist(idx, e.target.value)}
// //                       className="border rounded px-2 py-1 min-w-[120px]"
// //                     >
// //                       <option value="">Select Therapist</option>
// //                       {sortedTherapists.map(t => (
// //                         <option value={t._id} key={t._id}>
// //                           {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
// //                         </option>
// //                       ))}
// //                     </select>
// //                   </td>

// //                   {/* Therapy Type */}
// //                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
// //                     <select
// //                       value={therapyTypeIdVal}
// //                       onChange={e => updateSessionTherapyType(idx, e.target.value)}
// //                       className="border rounded px-2 py-1 min-w-[150px]"
// //                       required
// //                     >
// //                       <option value="">Select Therapy Type</option>
// //                       {sortedTherapies.map(therapy => (
// //                         <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
// //                       ))}
// //                     </select>
// //                   </td>

// //                   {/* Remove */}
// //                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-center align-top">
// //                     <button
// //                       type="button"
// //                       title="Remove this session"
// //                       className="text-red-500 hover:text-red-700 focus:outline-none"
// //                       style={{
// //                         display: "inline-flex", alignItems: "center", justifyContent: "center",
// //                         padding: 2, borderRadius: 999, minWidth: 24, minHeight: 24,
// //                       }}
// //                       onClick={() => removeSession(idx)}
// //                       aria-label="Remove session"
// //                     >
// //                       <FiX />
// //                     </button>
// //                   </td>
// //                 </tr>
// //               );
// //             })}
// //           </tbody>
// //         </table>
// //       </div>
// //       <div className="text-xs text-slate-600 mt-1">
// //         <b>Tip:</b> Multiple sessions per date are allowed — each must have a different time slot.
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── PricingSummary ───────────────────────────────────────────────────────────

// // type PricingSummaryProps = {
// //   selectedPackage: Package;
// //   appliedCoupon: any | null;
// // };

// // function PricingSummary({ selectedPackage, appliedCoupon }: PricingSummaryProps) {
// //   const discountValue = appliedCoupon?.discount ? Number(appliedCoupon.discount) : 0;
// //   const totalSessions = getTotalSessionsForPackage(selectedPackage);
// //   const pkgTotal =
// //     selectedPackage.totalCost ??
// //     (selectedPackage.costPerSession && totalSessions
// //       ? Number(selectedPackage.costPerSession) * Number(totalSessions)
// //       : 0);

// //   return (
// //     <div className="w-full flex flex-col items-stretch mt-3 mb-3">
// //       <div className="flex flex-col gap-0.5 w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
// //         <div className="flex justify-between items-center py-0.5">
// //           <span className="text-sm text-slate-700 font-medium">Package Price</span>
// //           <span className="font-mono text-base text-slate-900">
// //             ₹{selectedPackage.totalCost ??
// //               (selectedPackage.costPerSession && totalSessions
// //                 ? Number(selectedPackage.costPerSession) * Number(totalSessions)
// //                 : selectedPackage.costPerSession ?? "—")}
// //           </span>
// //         </div>
// //         {discountValue > 0 && pkgTotal > 0 ? (
// //           <>
// //             <div className="flex justify-between items-center py-0.5">
// //               <span className="text-sm text-emerald-700 font-medium">
// //                 Discount{appliedCoupon ? ` (${appliedCoupon.couponCode})` : ""}
// //               </span>
// //               <span className="text-base text-emerald-900 font-mono">
// //                 -{discountValue}%{" "}
// //                 <span className="opacity-60 text-xs ml-1">
// //                   (-₹{Math.round((pkgTotal * discountValue) / 100)})
// //                 </span>
// //               </span>
// //             </div>
// //             <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
// //               <span className="text-base font-semibold text-blue-900">
// //                 <FiTag className="inline mr-1 text-blue-400" />Total After Discount
// //               </span>
// //               <span className="font-mono text-lg font-bold text-blue-900">
// //                 ₹{Math.max(pkgTotal - Math.round((pkgTotal * discountValue) / 100), 0)}
// //               </span>
// //             </div>
// //           </>
// //         ) : discountValue === 0 && appliedCoupon ? (
// //           <div className="flex justify-between items-center py-0.5">
// //             <span className="text-sm text-orange-700 font-medium">Discount</span>
// //             <span className="text-xs text-orange-700">
// //               Coupon "{appliedCoupon.couponCode}" has no discount
// //             </span>
// //           </div>
// //         ) : (
// //           <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
// //             <span className="text-base font-semibold text-blue-900">
// //               <FiTag className="inline mr-1 text-blue-400" />Total
// //             </span>
// //             <span className="font-mono text-lg font-bold text-blue-900">₹{pkgTotal}</span>
// //           </div>
// //         )}
// //       </div>
// //     </div>
// //   );
// // }

// // // ─── BookingFormPanel (public export) ────────────────────────────────────────

// // export type BookingFormPanelProps = {
// //   editBookingId: string | null;
// //   handleReset: () => void;
// //   handleCancelEdit: () => void;
// //   handleBookOrUpdate: (e: React.MouseEvent<HTMLButtonElement>) => void;
// //   canBook: boolean;
// //   bookingLoading: boolean;
// //   bookingError: string | null;
// //   bookingSuccess: string | null;
// //   // Core selects
// //   therapistId: string;
// //   setTherapistId: (id: string) => void;
// //   therapists: Therapist[];
// //   patientId: string;
// //   setPatientId: (id: string) => void;
// //   patients: Patient[];
// //   therapyId: string;
// //   setTherapyId: (id: string) => void;
// //   therapies: Therapy[];
// //   packageId: string;
// //   setPackageId: (id: string) => void;
// //   packages: Package[];
// //   // Coupon
// //   couponInput: string;
// //   setCouponInput: (v: string) => void;
// //   appliedCoupon: any | null;
// //   couponStatus: null | "valid" | "invalid";
// //   setCouponStatus: (s: null | "valid" | "invalid") => void;
// //   handleCouponApply: () => void;
// //   handleCouponClear: () => void;
// //   // Remark
// //   remark: string;
// //   setRemark: (v: string) => void;
// //   // Sessions
// //   sessions: BookingSession[];
// //   selectedPackage: Package | null;
// //   earliestSession: { date: string; slotId: string } | null;
// //   updateSlotId: (date: string, slotId: string, idx: number) => void;
// //   updateSessionTherapist: (idx: number, therapistId: string) => void;
// //   updateSessionTherapyType: (idx: number, therapyTypeId: string) => void;
// //   removeSession: (idx: number) => void;
// //   bookedSlotsPerRow: { [rowKey: string]: string[] };
// //   getAvailableSlotsForDate: (
// //     date: string,
// //     sessions: any[],
// //     currSlotId: string,
// //     currTherapistId?: string,
// //     isEdit?: boolean
// //   ) => { [slotId: string]: { disabled: boolean; reason: string } };
// //   bookings: any[];
// //   // Quick Fill
// //   quickFillSettings: QuickFillSettings | null;
// //   setQuickFillSettings: (s: QuickFillSettings | null) => void;
// // };

// // export function BookingFormPanel({
// //   editBookingId, handleReset, handleCancelEdit, handleBookOrUpdate,
// //   canBook, bookingLoading, bookingError, bookingSuccess,
// //   therapistId, setTherapistId, therapists,
// //   patientId, setPatientId, patients,
// //   therapyId, setTherapyId, therapies,
// //   packageId, setPackageId, packages,
// //   couponInput, setCouponInput, appliedCoupon, couponStatus, setCouponStatus,
// //   handleCouponApply, handleCouponClear,
// //   remark, setRemark,
// //   sessions, selectedPackage, earliestSession,
// //   updateSlotId, updateSessionTherapist, updateSessionTherapyType, removeSession,
// //   bookedSlotsPerRow, getAvailableSlotsForDate,
// //   bookings,
// //   quickFillSettings, setQuickFillSettings,
// // }: BookingFormPanelProps) {
// //   const [qfModalOpen, setQfModalOpen] = useState(false);
// //   const totalSessions = getTotalSessionsForPackage(selectedPackage);

// //   // Sort therapists, patients, therapies for dropdowns by name
// //   const sortedTherapists = sortTherapistsByName(therapists);
// //   const sortedTherapies = sortTherapiesByName(therapies);
// //   const sortedPatients = sortPatientsByName(patients);

// //   return (
// //     <div className="flex-1 bg-white border rounded-lg p-6">
// //       {/* Quick Fill Modal */}
// //       <QuickFillModal
// //         open={qfModalOpen}
// //         onClose={() => setQfModalOpen(false)}
// //         therapists={sortedTherapists}
// //         therapies={sortedTherapies}
// //         settings={quickFillSettings}
// //         onSave={setQuickFillSettings}
// //         onClear={() => setQuickFillSettings(null)}
// //       />

// //       {/* Header row */}
// //       <div className="flex items-center justify-between mb-4">
// //         <h3 className="font-semibold">
// //           {editBookingId ? "Edit Booking" : "Quick Book"}
// //           {editBookingId && (
// //             <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
// //               Editing
// //             </span>
// //           )}
// //         </h3>
// //         <div className="flex gap-2">
// //           {/* ⚡ Quick Fill toggle button */}
// //           <button
// //             type="button"
// //             onClick={() => setQfModalOpen(true)}
// //             className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border transition ${
// //               quickFillSettings
// //                 ? "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
// //                 : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
// //             }`}
// //             title="Configure Quick Fill — auto-fill therapist, therapy type and time slot when clicking calendar dates"
// //           >
// //             <FiZap size={13} className={quickFillSettings ? "text-yellow-500" : "text-slate-500"} />
// //             Quick Fill{quickFillSettings ? " (on)" : ""}
// //           </button>
// //           <button
// //             type="button"
// //             className="px-3 py-1 rounded text-xs bg-red-100 text-red-700 font-medium hover:bg-red-200 transition"
// //             onClick={handleReset}
// //           >
// //             Reset
// //           </button>
// //         </div>
// //       </div>

// //       {/* Quick Fill active badge */}
// //       {quickFillSettings && (
// //         <QuickFillBadge
// //           settings={quickFillSettings}
// //           therapists={sortedTherapists}
// //           therapies={sortedTherapies}
// //           onEdit={() => setQfModalOpen(true)}
// //           onClear={() => setQuickFillSettings(null)}
// //         />
// //       )}

// //       {/* Therapist */}
// //       <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Therapist</label>
// //       <select
// //         value={therapistId}
// //         onChange={e => setTherapistId(e.target.value)}
// //         className="w-full border rounded px-3 py-2 mb-3"
// //         disabled={!!editBookingId}
// //       >
// //         <option value="">Select Therapist</option>
// //         {sortedTherapists.map(t => (
// //           <option key={t._id} value={t._id}>
// //             {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
// //           </option>
// //         ))}
// //       </select>

// //       {/* Appointment ID (edit only) */}
// //       {editBookingId && (() => {
// //         const b = bookings?.find((b: any) => b._id === editBookingId);
// //         if (b?.appointmentId) {
// //           return (
// //             <div className="mb-3">
// //               <label className="block text-sm mb-1 flex items-center gap-1 text-gray-700 font-semibold">
// //                 <FiHash /> Booking ID
// //               </label>
// //               <input
// //                 type="text"
// //                 value={b.appointmentId}
// //                 className="w-full border rounded px-3 py-2 bg-slate-100 font-mono text-gray-500"
// //                 readOnly disabled
// //               />
// //             </div>
// //           );
// //         }
// //         return null;
// //       })()}

// //       {/* Patient */}
// //       <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Children Name</label>
// //       <select
// //         value={patientId}
// //         onChange={e => setPatientId(e.target.value)}
// //         className="w-full border rounded px-3 py-2 mb-3"
// //         disabled={!!editBookingId}
// //       >
// //         <option value="">Select Children</option>
// //         {sortedPatients.map(p => (
// //           <option key={p.id} value={p.id}>{getPatientDisplayName(p)}</option>
// //         ))}
// //       </select>

// //       {/* Therapy */}
// //       <label className="block text-sm mb-1 flex items-center gap-1"><FiTag /> Therapy Type</label>
// //       <select
// //         value={therapyId}
// //         onChange={e => setTherapyId(e.target.value)}
// //         className="w-full border rounded px-3 py-2 mb-3"
// //       >
// //         <option value="">Select Therapy</option>
// //         {sortedTherapies.map(t => (
// //           <option key={t._id} value={t._id}>{t.name}</option>
// //         ))}
// //       </select>

// //       {/* Package */}
// //       <label className="block text-sm mb-1 flex items-center gap-1"><FiPackage /> Package</label>
// //       <select
// //         value={packageId}
// //         onChange={e => setPackageId(e.target.value)}
// //         className="w-full border rounded px-3 py-2 mb-5"
// //       >
// //         <option value="">Select Package</option>
// //         {packages.map(pkg => (
// //           <option key={pkg._id} value={pkg._id}>{getPackageDisplay(pkg)}</option>
// //         ))}
// //       </select>

// //       {/* Coupon */}
// //       <label className="block text-sm mb-1 font-semibold text-blue-700">Discount Coupon</label>
// //       <div className="flex gap-2 mb-4">
// //         <input
// //           type="text"
// //           className="w-full border rounded px-3 py-2"
// //           placeholder="Enter Coupon Code"
// //           value={couponInput}
// //           onChange={e => { setCouponInput(e.target.value); setCouponStatus(null); }}
// //           disabled={!!editBookingId}
// //         />
// //         <button
// //           type="button"
// //           className="px-3 py-2 rounded bg-blue-500 text-white text-xs"
// //           style={{ minWidth: 90 }}
// //           onClick={handleCouponApply}
// //           disabled={!couponInput.trim()}
// //         >Apply</button>
// //         <button
// //           type="button"
// //           className="px-3 py-2 rounded bg-gray-200 text-gray-900 text-xs"
// //           style={{ minWidth: 70 }}
// //           disabled={!couponInput.trim()}
// //           onClick={handleCouponClear}
// //         >Clear</button>
// //       </div>
// //       {couponStatus === "valid" && appliedCoupon && (
// //         <div className="text-xs text-blue-700 mb-4">
// //           🔖 Coupon <span className="font-mono">{appliedCoupon.couponCode}</span> applied!{" "}
// //           {appliedCoupon.discount}% off, valid {appliedCoupon.validityDays} days.
// //         </div>
// //       )}
// //       {couponStatus === "invalid" && (
// //         <div className="text-xs text-red-600 mb-4">🚫 Invalid or expired coupon code.</div>
// //       )}

// //       {/* Remark */}
// //       <label className="block text-sm mb-1 font-semibold text-slate-700">Remark</label>
// //       <textarea
// //         className="w-full border rounded px-3 py-2 mb-4"
// //         rows={2}
// //         placeholder="Add a remark or note for this booking (optional)"
// //         value={remark}
// //         onChange={e => setRemark(e.target.value)}
// //       />

// //       {/* Sessions table */}
// //       {sessions.length > 0 && (
// //         <SessionDatesTimesTable
// //           sessions={sessions}
// //           updateSlotId={updateSlotId}
// //           updateSessionTherapist={updateSessionTherapist}
// //           updateSessionTherapyType={updateSessionTherapyType}
// //           editBookingId={editBookingId}
// //           therapists={sortedTherapists}
// //           therapistId={therapistId}
// //           therapies={sortedTherapies}
// //           therapyId={therapyId}
// //           getAvailableSlotsForDate={getAvailableSlotsForDate}
// //           bookedSlotsPerRow={bookedSlotsPerRow}
// //           removeSession={removeSession}
// //           quickFillSettings={quickFillSettings}
// //         />
// //       )}

// //       {/* Pricing */}
// //       {selectedPackage && (
// //         <PricingSummary selectedPackage={selectedPackage} appliedCoupon={appliedCoupon} />
// //       )}

// //       {/* Error / Success */}
// //       {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
// //       {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}

// //       {/* Action buttons */}
// //       <div className="flex gap-2">
// //         <button
// //           disabled={!canBook || bookingLoading}
// //           className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
// //           onClick={handleBookOrUpdate}
// //         >
// //           {bookingLoading
// //             ? editBookingId ? "Updating..." : "Booking..."
// //             : editBookingId ? "Update Booking" : "Book Now"}
// //         </button>
// //         {editBookingId && (
// //           <button
// //             className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
// //             type="button"
// //             onClick={handleCancelEdit}
// //           >
// //             <FiX className="inline mr-1" />Cancel Edit
// //           </button>
// //         )}
// //       </div>

// //       {/* Footer hints */}
// //       {typeof totalSessions === "number" && (
// //         <div className="text-xs text-blue-700 mt-3">
// //           {`Up to ${totalSessions} session${totalSessions > 1 ? "s" : ""} for this package.`}
// //           {" "}Multiple sessions per day allowed — times must differ.
// //           <br />
// //           Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots per day.
// //         </div>
// //       )}
// //       {sessions.length === 0 && (
// //         <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
// //       )}
// //       {sessions.length > 0 && (!earliestSession || !earliestSession.slotId) && (
// //         <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
// //       )}
// //     </div>
// //   );
// // }

// import { useState } from "react";
// import { AnimatePresence, motion } from "framer-motion";
// import {
//   FiUser, FiTag, FiPackage, FiClock, FiX, FiHash, FiZap, FiAlertTriangle,
// } from "react-icons/fi";
// import {
//   Therapist, Therapy, Package, Patient, BookingSession, QuickFillSettings,
//   SESSION_TIME_OPTIONS as _SLOTS,
//   formatDateDDMMYYYY, getTotalSessionsForPackage, getPatientDisplayName, getPackageDisplay,
// } from "./types";

// // --- Helper: Sorts ---
// // (1) Sort therapists by name
// function sortTherapistsByName(therapists: Therapist[]): Therapist[] {
//   return [...therapists].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
// }

// // (2) Sort therapies by name
// function sortTherapiesByName(therapies: Therapy[]): Therapy[] {
//   return [...therapies].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
// }

// // (3) Sort patients/children by name
// function sortPatientsByName(patients: Patient[]): Patient[] {
//   return [...patients].sort((a, b) => {
//     const aName = getPatientDisplayName(a) || "";
//     const bName = getPatientDisplayName(b) || "";
//     return aName.localeCompare(bName);
//   });
// }

// // ─── QuickFillModal ───────────────────────────────────────────────────────────

// type QuickFillModalProps = {
//   open: boolean;
//   onClose: () => void;
//   therapists: Therapist[];
//   therapies: Therapy[];
//   /** Currently saved settings (null = not yet configured) */
//   settings: QuickFillSettings | null;
//   onSave: (s: QuickFillSettings) => void;
//   onClear: () => void;
// };

// function QuickFillModal({
//   open, onClose, therapists, therapies, settings, onSave, onClear,
// }: QuickFillModalProps) {
//   const [localTherapistId, setLocalTherapistId] = useState(settings?.therapistId ?? "");
//   const [localTherapyTypeId, setLocalTherapyTypeId] = useState(settings?.therapyTypeId ?? "");
//   const [localSlotId, setLocalSlotId] = useState(settings?.slotId ?? "");

//   // Sync local state when modal reopens with new settings
//   const handleOpen = () => {
//     setLocalTherapistId(settings?.therapistId ?? "");
//     setLocalTherapyTypeId(settings?.therapyTypeId ?? "");
//     setLocalSlotId(settings?.slotId ?? "");
//   };

//   const canSave = localTherapistId && localTherapyTypeId && localSlotId;

//   const handleSave = () => {
//     if (!canSave) return;
//     onSave({ therapistId: localTherapistId, therapyTypeId: localTherapyTypeId, slotId: localSlotId });
//     onClose();
//   };

//   if (!open) return null;

//   // Sort therapists and therapies by name for dropdowns
//   const sortedTherapists = sortTherapistsByName(therapists);
//   const sortedTherapies = sortTherapiesByName(therapies);

//   return (
//     <AnimatePresence>
//       <motion.div
//         key="qf-overlay"
//         className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
//         style={{ backdropFilter: "blur(2px)" }}
//         initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.95, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.95, opacity: 0 }}
//           transition={{ type: "spring", stiffness: 300, damping: 28 }}
//           className="bg-white rounded-xl shadow-xl w-full max-w-md border border-blue-100 relative"
//           onClick={e => e.stopPropagation()}
//           onAnimationComplete={handleOpen}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-blue-50">
//             <div className="flex items-center gap-2 text-blue-700 font-semibold text-base">
//               <FiZap className="text-yellow-500" />
//               Quick Fill Settings
//             </div>
//             <button onClick={onClose} className="text-slate-400 hover:text-slate-600" type="button">
//               <FiX size={20} />
//             </button>
//           </div>

//           {/* Body */}
//           <div className="px-6 py-5 space-y-4">
//             <p className="text-xs text-slate-500 leading-relaxed">
//               Choose a <strong>therapist</strong>, <strong>therapy type</strong>, and <strong>time slot</strong>.
//               Every date you click on the calendar will be auto-filled with these values.
//               You can change these settings any time to assign a different therapist or slot for subsequent dates.
//             </p>

//             {/* Therapist */}
//             <div>
//               <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
//                 <FiUser size={12} /> Therapist <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={localTherapistId}
//                 onChange={e => setLocalTherapistId(e.target.value)}
//                 className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
//               >
//                 <option value="">Select therapist…</option>
//                 {sortedTherapists.map(t => (
//                   <option key={t._id} value={t._id}>
//                     {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             {/* Therapy type */}
//             <div>
//               <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
//                 <FiTag size={12} /> Therapy Type <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={localTherapyTypeId}
//                 onChange={e => setLocalTherapyTypeId(e.target.value)}
//                 className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
//               >
//                 <option value="">Select therapy type…</option>
//                 {sortedTherapies.map(t => (
//                   <option key={t._id} value={t._id}>{t.name}</option>
//                 ))}
//               </select>
//             </div>

//             {/* Time slot */}
//             <div>
//               <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
//                 <FiClock size={12} /> Time Slot <span className="text-red-500">*</span>
//               </label>
//               <select
//                 value={localSlotId}
//                 onChange={e => setLocalSlotId(e.target.value)}
//                 className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
//               >
//                 <option value="">Select time slot…</option>
//                 {_SLOTS.map(s => (
//                   <option key={s.id} value={s.id}>
//                     {s.label}{s.limited ? " (Limited case)" : ""}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
//               ⚠️ If the chosen slot is already booked or unavailable on a specific date, a warning will appear
//               in that session row. You can still override the time manually in the table below.
//             </p>
//           </div>

//           {/* Footer */}
//           <div className="flex gap-2 px-6 pb-5 pt-1">
//             <button
//               type="button"
//               className="flex-1 rounded-lg border border-blue-500 bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
//               disabled={!canSave}
//               onClick={handleSave}
//             >
//               Save &amp; Activate
//             </button>
//             {settings && (
//               <button
//                 type="button"
//                 className="px-4 rounded-lg border border-red-300 text-red-600 bg-red-50 text-sm hover:bg-red-100 transition"
//                 onClick={() => { onClear(); onClose(); }}
//               >
//                 Clear
//               </button>
//             )}
//           </div>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }

// // ─── QuickFillBadge ───────────────────────────────────────────────────────────

// type QuickFillBadgeProps = {
//   settings: QuickFillSettings;
//   therapists: Therapist[];
//   therapies: Therapy[];
//   onEdit: () => void;
//   onClear: () => void;
// };

// function QuickFillBadge({ settings, therapists, therapies, onEdit, onClear }: QuickFillBadgeProps) {
//   // Show sorted display name, though single match
//   const tName = sortTherapistsByName(therapists).find(t => t._id === settings.therapistId)?.name ?? "—";
//   const tyName = sortTherapiesByName(therapies).find(t => t._id === settings.therapyTypeId)?.name ?? "—";
//   const slotLabel = _SLOTS.find(s => s.id === settings.slotId)?.label ?? settings.slotId;

//   return (
//     <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2.5 mb-4">
//       <FiZap className="text-yellow-500 mt-0.5 shrink-0" size={16} />
//       <div className="flex-1 min-w-0 text-xs">
//         <span className="font-semibold text-yellow-800">Quick Fill active —</span>{" "}
//         <span className="text-yellow-700">
//           {tName} · {tyName} · {slotLabel}
//         </span>
//         <br />
//         <span className="text-yellow-600">Click calendar dates to auto-fill sessions with these settings.</span>
//       </div>
//       <div className="flex gap-1 shrink-0">
//         <button
//           type="button"
//           onClick={onEdit}
//           className="text-xs px-2 py-1 rounded border border-yellow-400 text-yellow-800 hover:bg-yellow-100 transition"
//         >Edit</button>
//         <button
//           type="button"
//           onClick={onClear}
//           className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition"
//         >Off</button>
//       </div>
//     </div>
//   );
// }

// // ─── SessionDatesTimesTable ───────────────────────────────────────────────────

// type SessionDatesTimesTableProps = {
//   sessions: BookingSession[];
//   updateSlotId: (date: string, slotId: string, idx: number) => void;
//   updateSessionTherapist: (idx: number, therapistId: string) => void;
//   updateSessionTherapyType: (idx: number, therapyTypeId: string) => void;
//   editBookingId: string | null;
//   therapists: Therapist[];
//   therapistId: string;
//   therapies: Therapy[];
//   therapyId: string;
//   getAvailableSlotsForDate: (
//     date: string,
//     sessions: any[],
//     currSlotId: string,
//     currTherapistId?: string,
//     isEdit?: boolean
//   ) => { [slotId: string]: { disabled: boolean; reason: string } };
//   bookedSlotsPerRow: { [rowKey: string]: string[] };
//   removeSession: (idx: number) => void;
//   /** When set, rows whose auto-filled slot is unavailable show an inline warning */
//   quickFillSettings: QuickFillSettings | null;
// };

// function SessionDatesTimesTable({
//   sessions, updateSlotId, updateSessionTherapist, updateSessionTherapyType,
//   editBookingId, therapists, therapistId, therapies, therapyId,
//   getAvailableSlotsForDate, bookedSlotsPerRow, removeSession,
//   quickFillSettings,
// }: SessionDatesTimesTableProps) {
//   // Sorted therapists and therapies for dropdown
//   const sortedTherapists = sortTherapistsByName(therapists);
//   const sortedTherapies = sortTherapiesByName(therapies);

//   return (
//     <div className="space-y-3 mb-4">
//       <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
//         <FiClock /> Session Dates &amp; Times
//       </div>
//       <div className="overflow-x-auto">
//         <table className="min-w-[680px] w-fit border-collapse text-xs">
//           <thead>
//             <tr>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
//                 <FiClock className="inline mr-1" />Time Slot
//               </th>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
//                 <FiUser className="inline mr-1" />Therapist
//               </th>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
//                 <FiTag className="inline mr-1" />Therapy Type
//               </th>
//               <th className="px-2 py-1 border border-slate-200 bg-slate-100" />
//             </tr>
//           </thead>
//           <tbody>
//             {sessions.map((s, idx, arr) => {
//               const rowTherapistId = s.therapistId || therapistId;
//               let slotInfo: { [slotId: string]: { disabled: boolean; reason: string } };
//               try {
//                 slotInfo = getAvailableSlotsForDate(s.date, arr, s.slotId, rowTherapistId, !!editBookingId);
//               } catch {
//                 slotInfo = Object.fromEntries(_SLOTS.map(sl => [sl.id, { disabled: true, reason: "Error loading slots" }]));
//               }

//               const bookedSlotsForRow = bookedSlotsPerRow[`${s.date}:${rowTherapistId}`] || [];
//               const duplicateSlot = arr.some(
//                 (other, oi) => oi !== idx && s.date === other.date && s.slotId && s.slotId === other.slotId
//               );

//               // Detect auto-filled slot conflict: slot was pre-set by quickFill but is now disabled
//               const isQuickFillConflict =
//                 quickFillSettings &&
//                 s.slotId &&
//                 s.slotId === quickFillSettings.slotId &&
//                 slotInfo[s.slotId]?.disabled;

//               let therapyTypeIdVal = "";
//               if (s.therapyTypeId && typeof s.therapyTypeId === "object" && (s.therapyTypeId as any)._id) {
//                 therapyTypeIdVal = (s.therapyTypeId as any)._id;
//               } else if (typeof s.therapyTypeId === "string") {
//                 therapyTypeIdVal = s.therapyTypeId;
//               } else {
//                 therapyTypeIdVal = therapyId;
//               }

//               return (
//                 <tr key={s.date + ":" + idx} className={`text-sm ${isQuickFillConflict ? "bg-red-50" : ""}`}>
//                   {/* Date */}
//                   <td className="px-2 py-1 border border-slate-200 font-mono align-top">
//                     {formatDateDDMMYYYY(s.date)}
//                   </td>

//                   {/* Time Slot */}
//                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
//                     <select
//                       value={s.slotId}
//                       onChange={e => updateSlotId(s.date, e.target.value, idx)}
//                       className={`border rounded px-2 py-1 ${
//                         duplicateSlot || (idx === 0 && !s.slotId) || isQuickFillConflict
//                           ? "border-red-400"
//                           : ""
//                       }`}
//                       required={idx === 0}
//                       style={{ minWidth: 180 }}
//                     >
//                       <option value="">Select Time Slot</option>
//                       {_SLOTS.map(slot => {
//                         const info = slotInfo[slot.id] || { disabled: true, reason: "N/A" };
//                         let label = slot.label;
//                         if (slot.limited) label += " (Limited case)";
//                         if (info.disabled && info.reason === "Already booked") label += " - Already Booked";
//                         else if (info.disabled && info.reason) label += `  - ${info.reason}`;
//                         const takenBySelf = arr.some(
//                           (other, oi) => oi !== idx && other.date === s.date && other.slotId === slot.id
//                         );
//                         return (
//                           <option key={slot.id} value={slot.id} disabled={info.disabled || takenBySelf}>
//                             {label}
//                           </option>
//                         );
//                       })}
//                     </select>
// <br/>
//                     {/* Inline warnings */}
//                     {isQuickFillConflict && (
//                       <div className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
//                         <FiAlertTriangle size={11} />
//                         Auto-filled slot unavailable for this date —{" "}
//                         {slotInfo[s.slotId]?.reason || "conflict"}.
//                         Please choose another time.
//                       </div>
//                     )}
//                     {!isQuickFillConflict && duplicateSlot && (
//                       <span className="text-xs text-red-500 ml-2">
//                         Cannot choose same time for the same date.
//                       </span>
//                     )}
//                     {bookedSlotsForRow.length > 0 && (
//                       <span className="block mt-1 text-xs text-amber-700">
//                         Already booked:{" "}
//                         {bookedSlotsForRow
//                           .map(id => _SLOTS.find(opt => opt.id === id)?.label || id)
//                           .join(", ")}
//                       </span>
//                     )}
//                     {idx === 0 && !s.slotId && (
//                       <span className="text-xs text-red-500 ml-2">Time required</span>
//                     )}
//                   </td>

//                   {/* Therapist */}
//                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
//                     {(() => {
//                       // When a slot is selected for this row, compute which therapists
//                       // already have that slot booked on this date (mirrors slot-side logic).
//                       const rowSlotId = s.slotId;
//                       const rowDate = s.date;

//                       // Build per-therapist availability only when a slot is chosen
//                       const therapistSlotStatus: Record<string, { booked: boolean; holiday: boolean }> = {};
//                       if (rowSlotId && rowDate) {
//                         const jsDate = new Date(rowDate);
//                         const apiDate = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, "0")}-${String(jsDate.getDate()).padStart(2, "0")}`;

//                         for (const t of sortedTherapists) {
//                           // Full-day holiday?
//                           const fullDayOff = (t.holidays || []).some(
//                             h => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined)
//                           );
//                           if (fullDayOff) { therapistSlotStatus[t._id] = { booked: false, holiday: true }; continue; }

//                           // Partial holiday covers this slot?
//                           const partialOff = (t.holidays || []).some(
//                             h => h.date === apiDate && h.isFullDay === false &&
//                               (h.slots || []).some(sl => sl.slotId === rowSlotId)
//                           );
//                           if (partialOff) { therapistSlotStatus[t._id] = { booked: false, holiday: true }; continue; }

//                           // Already has this slot booked?
//                           const isBooked = (t.bookedSlots?.[apiDate] || []).includes(rowSlotId);
//                           therapistSlotStatus[t._id] = { booked: isBooked, holiday: false };
//                         }
//                       }

//                       const slotSelected = !!rowSlotId;

//                       return (
//                         <select
//                           value={s.therapistId || therapistId}
//                           onChange={e => updateSessionTherapist(idx, e.target.value)}
//                           className="border rounded px-2 py-1 min-w-[120px]"
//                         >
//                           <option value="">Select Therapist</option>
//                           {sortedTherapists.map(t => {
//                             const status = therapistSlotStatus[t._id];
//                             const isBooked = slotSelected && status?.booked;
//                             const isOnHoliday = slotSelected && status?.holiday;
//                             const suffix = isOnHoliday
//                               ? " — Holiday"
//                               : isBooked
//                               ? " — Already Booked"
//                               : "";
//                             return (
//                               <option
//                                 value={t._id}
//                                 key={t._id}
//                                 disabled={isBooked || isOnHoliday}
//                               >
//                                 {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}{suffix}
//                               </option>
//                             );
//                           })}
//                         </select>
//                       );
//                     })()}
//                   </td>

//                   {/* Therapy Type */}
//                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
//                     <select
//                       value={therapyTypeIdVal}
//                       onChange={e => updateSessionTherapyType(idx, e.target.value)}
//                       className="border rounded px-2 py-1 min-w-[150px]"
//                       required
//                     >
//                       <option value="">Select Therapy Type</option>
//                       {sortedTherapies.map(therapy => (
//                         <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
//                       ))}
//                     </select>
//                   </td>

//                   {/* Remove */}
//                   <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-center align-top">
//                     <button
//                       type="button"
//                       title="Remove this session"
//                       className="text-red-500 hover:text-red-700 focus:outline-none"
//                       style={{
//                         display: "inline-flex", alignItems: "center", justifyContent: "center",
//                         padding: 2, borderRadius: 999, minWidth: 24, minHeight: 24,
//                       }}
//                       onClick={() => removeSession(idx)}
//                       aria-label="Remove session"
//                     >
//                       <FiX />
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//       <div className="text-xs text-slate-600 mt-1">
//         <b>Tip:</b> Multiple sessions per date are allowed — each must have a different time slot.
//       </div>
//     </div>
//   );
// }

// // ─── PricingSummary ───────────────────────────────────────────────────────────

// type PricingSummaryProps = {
//   selectedPackage: Package;
//   appliedCoupon: any | null;
// };

// function PricingSummary({ selectedPackage, appliedCoupon }: PricingSummaryProps) {
//   const discountValue = appliedCoupon?.discount ? Number(appliedCoupon.discount) : 0;
//   const totalSessions = getTotalSessionsForPackage(selectedPackage);
//   const pkgTotal =
//     selectedPackage.totalCost ??
//     (selectedPackage.costPerSession && totalSessions
//       ? Number(selectedPackage.costPerSession) * Number(totalSessions)
//       : 0);

//   return (
//     <div className="w-full flex flex-col items-stretch mt-3 mb-3">
//       <div className="flex flex-col gap-0.5 w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
//         <div className="flex justify-between items-center py-0.5">
//           <span className="text-sm text-slate-700 font-medium">Package Price</span>
//           <span className="font-mono text-base text-slate-900">
//             ₹{selectedPackage.totalCost ??
//               (selectedPackage.costPerSession && totalSessions
//                 ? Number(selectedPackage.costPerSession) * Number(totalSessions)
//                 : selectedPackage.costPerSession ?? "—")}
//           </span>
//         </div>
//         {discountValue > 0 && pkgTotal > 0 ? (
//           <>
//             <div className="flex justify-between items-center py-0.5">
//               <span className="text-sm text-emerald-700 font-medium">
//                 Discount{appliedCoupon ? ` (${appliedCoupon.couponCode})` : ""}
//               </span>
//               <span className="text-base text-emerald-900 font-mono">
//                 -{discountValue}%{" "}
//                 <span className="opacity-60 text-xs ml-1">
//                   (-₹{Math.round((pkgTotal * discountValue) / 100)})
//                 </span>
//               </span>
//             </div>
//             <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
//               <span className="text-base font-semibold text-blue-900">
//                 <FiTag className="inline mr-1 text-blue-400" />Total After Discount
//               </span>
//               <span className="font-mono text-lg font-bold text-blue-900">
//                 ₹{Math.max(pkgTotal - Math.round((pkgTotal * discountValue) / 100), 0)}
//               </span>
//             </div>
//           </>
//         ) : discountValue === 0 && appliedCoupon ? (
//           <div className="flex justify-between items-center py-0.5">
//             <span className="text-sm text-orange-700 font-medium">Discount</span>
//             <span className="text-xs text-orange-700">
//               Coupon "{appliedCoupon.couponCode}" has no discount
//             </span>
//           </div>
//         ) : (
//           <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
//             <span className="text-base font-semibold text-blue-900">
//               <FiTag className="inline mr-1 text-blue-400" />Total
//             </span>
//             <span className="font-mono text-lg font-bold text-blue-900">₹{pkgTotal}</span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// // ─── BookingFormPanel (public export) ────────────────────────────────────────

// export type BookingFormPanelProps = {
//   editBookingId: string | null;
//   handleReset: () => void;
//   handleCancelEdit: () => void;
//   handleBookOrUpdate: (e: React.MouseEvent<HTMLButtonElement>) => void;
//   canBook: boolean;
//   bookingLoading: boolean;
//   bookingError: string | null;
//   bookingSuccess: string | null;
//   // Core selects
//   therapistId: string;
//   setTherapistId: (id: string) => void;
//   therapists: Therapist[];
//   patientId: string;
//   setPatientId: (id: string) => void;
//   patients: Patient[];
//   therapyId: string;
//   setTherapyId: (id: string) => void;
//   therapies: Therapy[];
//   packageId: string;
//   setPackageId: (id: string) => void;
//   packages: Package[];
//   // Coupon
//   couponInput: string;
//   setCouponInput: (v: string) => void;
//   appliedCoupon: any | null;
//   couponStatus: null | "valid" | "invalid";
//   setCouponStatus: (s: null | "valid" | "invalid") => void;
//   handleCouponApply: () => void;
//   handleCouponClear: () => void;
//   // Remark
//   remark: string;
//   setRemark: (v: string) => void;
//   // Sessions
//   sessions: BookingSession[];
//   selectedPackage: Package | null;
//   earliestSession: { date: string; slotId: string } | null;
//   updateSlotId: (date: string, slotId: string, idx: number) => void;
//   updateSessionTherapist: (idx: number, therapistId: string) => void;
//   updateSessionTherapyType: (idx: number, therapyTypeId: string) => void;
//   removeSession: (idx: number) => void;
//   bookedSlotsPerRow: { [rowKey: string]: string[] };
//   getAvailableSlotsForDate: (
//     date: string,
//     sessions: any[],
//     currSlotId: string,
//     currTherapistId?: string,
//     isEdit?: boolean
//   ) => { [slotId: string]: { disabled: boolean; reason: string } };
//   bookings: any[];
//   // Quick Fill
//   quickFillSettings: QuickFillSettings | null;
//   setQuickFillSettings: (s: QuickFillSettings | null) => void;
// };

// export function BookingFormPanel({
//   editBookingId, handleReset, handleCancelEdit, handleBookOrUpdate,
//   canBook, bookingLoading, bookingError, bookingSuccess,
//   therapistId, setTherapistId, therapists,
//   patientId, setPatientId, patients,
//   therapyId, setTherapyId, therapies,
//   packageId, setPackageId, packages,
//   couponInput, setCouponInput, appliedCoupon, couponStatus, setCouponStatus,
//   handleCouponApply, handleCouponClear,
//   remark, setRemark,
//   sessions, selectedPackage, earliestSession,
//   updateSlotId, updateSessionTherapist, updateSessionTherapyType, removeSession,
//   bookedSlotsPerRow, getAvailableSlotsForDate,
//   bookings,
//   quickFillSettings, setQuickFillSettings,
// }: BookingFormPanelProps) {
//   const [qfModalOpen, setQfModalOpen] = useState(false);
//   const totalSessions = getTotalSessionsForPackage(selectedPackage);

//   // Sort therapists, patients, therapies for dropdowns by name
//   const sortedTherapists = sortTherapistsByName(therapists);
//   const sortedTherapies = sortTherapiesByName(therapies);
//   const sortedPatients = sortPatientsByName(patients);

//   return (
//     <div className="flex-1 bg-white border rounded-lg p-6">
//       {/* Quick Fill Modal */}
//       <QuickFillModal
//         open={qfModalOpen}
//         onClose={() => setQfModalOpen(false)}
//         therapists={sortedTherapists}
//         therapies={sortedTherapies}
//         settings={quickFillSettings}
//         onSave={setQuickFillSettings}
//         onClear={() => setQuickFillSettings(null)}
//       />

//       {/* Header row */}
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="font-semibold">
//           {editBookingId ? "Edit Booking" : "Quick Book"}
//           {editBookingId && (
//             <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
//               Editing
//             </span>
//           )}
//         </h3>
//         <div className="flex gap-2">
//           {/* ⚡ Quick Fill toggle button */}
//           <button
//             type="button"
//             onClick={() => setQfModalOpen(true)}
//             className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border transition ${
//               quickFillSettings
//                 ? "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
//                 : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
//             }`}
//             title="Configure Quick Fill — auto-fill therapist, therapy type and time slot when clicking calendar dates"
//           >
//             <FiZap size={13} className={quickFillSettings ? "text-yellow-500" : "text-slate-500"} />
//             Quick Fill{quickFillSettings ? " (on)" : ""}
//           </button>
//           <button
//             type="button"
//             className="px-3 py-1 rounded text-xs bg-red-100 text-red-700 font-medium hover:bg-red-200 transition"
//             onClick={handleReset}
//           >
//             Reset
//           </button>
//         </div>
//       </div>

//       {/* Quick Fill active badge */}
//       {quickFillSettings && (
//         <QuickFillBadge
//           settings={quickFillSettings}
//           therapists={sortedTherapists}
//           therapies={sortedTherapies}
//           onEdit={() => setQfModalOpen(true)}
//           onClear={() => setQuickFillSettings(null)}
//         />
//       )}

//       {/* Therapist */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Therapist</label>
//       <select
//         value={therapistId}
//         onChange={e => setTherapistId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-3"
//         disabled={!!editBookingId}
//       >
//         <option value="">Select Therapist</option>
//         {sortedTherapists.map(t => (
//           <option key={t._id} value={t._id}>
//             {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
//           </option>
//         ))}
//       </select>

//       {/* Appointment ID (edit only) */}
//       {editBookingId && (() => {
//         const b = bookings?.find((b: any) => b._id === editBookingId);
//         if (b?.appointmentId) {
//           return (
//             <div className="mb-3">
//               <label className="block text-sm mb-1 flex items-center gap-1 text-gray-700 font-semibold">
//                 <FiHash /> Booking ID
//               </label>
//               <input
//                 type="text"
//                 value={b.appointmentId}
//                 className="w-full border rounded px-3 py-2 bg-slate-100 font-mono text-gray-500"
//                 readOnly disabled
//               />
//             </div>
//           );
//         }
//         return null;
//       })()}

//       {/* Patient */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Children Name</label>
//       <select
//         value={patientId}
//         onChange={e => setPatientId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-3"
//         disabled={!!editBookingId}
//       >
//         <option value="">Select Children</option>
//         {sortedPatients.map(p => (
//           <option key={p.id} value={p.id}>{getPatientDisplayName(p)}</option>
//         ))}
//       </select>

//       {/* Therapy */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiTag /> Therapy Type</label>
//       <select
//         value={therapyId}
//         onChange={e => setTherapyId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-3"
//       >
//         <option value="">Select Therapy</option>
//         {sortedTherapies.map(t => (
//           <option key={t._id} value={t._id}>{t.name}</option>
//         ))}
//       </select>

//       {/* Package */}
//       <label className="block text-sm mb-1 flex items-center gap-1"><FiPackage /> Package</label>
//       <select
//         value={packageId}
//         onChange={e => setPackageId(e.target.value)}
//         className="w-full border rounded px-3 py-2 mb-5"
//       >
//         <option value="">Select Package</option>
//         {packages.map(pkg => (
//           <option key={pkg._id} value={pkg._id}>{getPackageDisplay(pkg)}</option>
//         ))}
//       </select>

//       {/* Coupon */}
//       <label className="block text-sm mb-1 font-semibold text-blue-700">Discount Coupon</label>
//       <div className="flex gap-2 mb-4">
//         <input
//           type="text"
//           className="w-full border rounded px-3 py-2"
//           placeholder="Enter Coupon Code"
//           value={couponInput}
//           onChange={e => { setCouponInput(e.target.value); setCouponStatus(null); }}
//           // disabled={!!editBookingId}
//         />
//         <button
//           type="button"
//           className="px-3 py-2 rounded bg-blue-500 text-white text-xs"
//           style={{ minWidth: 90 }}
//           onClick={handleCouponApply}
//           disabled={!couponInput.trim()}
//         >Apply</button>
//         <button
//           type="button"
//           className="px-3 py-2 rounded bg-gray-200 text-gray-900 text-xs"
//           style={{ minWidth: 70 }}
//           disabled={!couponInput.trim()}
//           onClick={handleCouponClear}
//         >Clear</button>
//       </div>
//       {couponStatus === "valid" && appliedCoupon && (
//         <div className="text-xs text-blue-700 mb-4">
//           🔖 Coupon <span className="font-mono">{appliedCoupon.couponCode}</span> applied!{" "}
//           {appliedCoupon.discount}% off, valid {appliedCoupon.validityDays} days.
//         </div>
//       )}
//       {couponStatus === "invalid" && (
//         <div className="text-xs text-red-600 mb-4">🚫 Invalid or expired coupon code.</div>
//       )}

//       {/* Remark */}
//       <label className="block text-sm mb-1 font-semibold text-slate-700">Remark</label>
//       <textarea
//         className="w-full border rounded px-3 py-2 mb-4"
//         rows={2}
//         placeholder="Add a remark or note for this booking (optional)"
//         value={remark}
//         onChange={e => setRemark(e.target.value)}
//       />

//       {/* Sessions table */}
//       {sessions.length > 0 && (
//         <SessionDatesTimesTable
//           sessions={sessions}
//           updateSlotId={updateSlotId}
//           updateSessionTherapist={updateSessionTherapist}
//           updateSessionTherapyType={updateSessionTherapyType}
//           editBookingId={editBookingId}
//           therapists={sortedTherapists}
//           therapistId={therapistId}
//           therapies={sortedTherapies}
//           therapyId={therapyId}
//           getAvailableSlotsForDate={getAvailableSlotsForDate}
//           bookedSlotsPerRow={bookedSlotsPerRow}
//           removeSession={removeSession}
//           quickFillSettings={quickFillSettings}
//         />
//       )}

//       {/* Pricing */}
//       {selectedPackage && (
//         <PricingSummary selectedPackage={selectedPackage} appliedCoupon={appliedCoupon} />
//       )}

//       {/* Error / Success */}
//       {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
//       {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}

//       {/* Action buttons */}
//       <div className="flex gap-2">
//         <button
//           disabled={!canBook || bookingLoading}
//           className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
//           onClick={handleBookOrUpdate}
//         >
//           {bookingLoading
//             ? editBookingId ? "Updating..." : "Booking..."
//             : editBookingId ? "Update Booking" : "Book Now"}
//         </button>
//         {editBookingId && (
//           <button
//             className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
//             type="button"
//             onClick={handleCancelEdit}
//           >
//             <FiX className="inline mr-1" />Cancel Edit
//           </button>
//         )}
//       </div>

//       {/* Footer hints */}
//       {typeof totalSessions === "number" && (
//         <div className="text-xs text-blue-700 mt-3">
//           {`Up to ${totalSessions} session${totalSessions > 1 ? "s" : ""} for this package.`}
//           {" "}Multiple sessions per day allowed — times must differ.
//           <br />
//           Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots per day.
//         </div>
//       )}
//       {sessions.length === 0 && (
//         <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
//       )}
//       {sessions.length > 0 && (!earliestSession || !earliestSession.slotId) && (
//         <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
//       )}
//     </div>
//   );
// }


import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiUser, FiTag, FiPackage, FiClock, FiX, FiHash, FiZap, FiAlertTriangle,
} from "react-icons/fi";
import {
  Therapist, Therapy, Package, Patient, BookingSession, QuickFillSettings,
  SESSION_TIME_OPTIONS as _SLOTS,
  formatDateDDMMYYYY, getTotalSessionsForPackage, getPatientDisplayName, getPackageDisplay,
} from "./types";
 
// --- Helper: Sorts ---
// (1) Sort therapists by name
function sortTherapistsByName(therapists: Therapist[]): Therapist[] {
  return [...therapists].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}
 
// (2) Sort therapies by name
function sortTherapiesByName(therapies: Therapy[]): Therapy[] {
  return [...therapies].sort((a, b) => (a.name || "").localeCompare(b.name || ""));
}
 
// (3) Sort patients/children by name
function sortPatientsByName(patients: Patient[]): Patient[] {
  return [...patients].sort((a, b) => {
    const aName = getPatientDisplayName(a) || "";
    const bName = getPatientDisplayName(b) || "";
    return aName.localeCompare(bName);
  });
}
 
// ─── QuickFillModal ───────────────────────────────────────────────────────────
 
type QuickFillModalProps = {
  open: boolean;
  onClose: () => void;
  therapists: Therapist[];
  therapies: Therapy[];
  /** Currently saved settings (null = not yet configured) */
  settings: QuickFillSettings | null;
  onSave: (s: QuickFillSettings) => void;
  onClear: () => void;
};
 
function QuickFillModal({
  open, onClose, therapists, therapies, settings, onSave, onClear,
}: QuickFillModalProps) {
  const [localTherapistId, setLocalTherapistId] = useState(settings?.therapistId ?? "");
  const [localTherapyTypeId, setLocalTherapyTypeId] = useState(settings?.therapyTypeId ?? "");
  const [localSlotId, setLocalSlotId] = useState(settings?.slotId ?? "");
 
  // Sync local state when modal reopens with new settings
  const handleOpen = () => {
    setLocalTherapistId(settings?.therapistId ?? "");
    setLocalTherapyTypeId(settings?.therapyTypeId ?? "");
    setLocalSlotId(settings?.slotId ?? "");
  };
 
  const canSave = localTherapistId && localTherapyTypeId && localSlotId;
 
  const handleSave = () => {
    if (!canSave) return;
    onSave({ therapistId: localTherapistId, therapyTypeId: localTherapyTypeId, slotId: localSlotId });
    onClose();
  };
 
  if (!open) return null;
 
  // Sort therapists and therapies by name for dropdowns
  const sortedTherapists = sortTherapistsByName(therapists);
  const sortedTherapies = sortTherapiesByName(therapies);
 
  return (
    <AnimatePresence>
      <motion.div
        key="qf-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
        style={{ backdropFilter: "blur(2px)" }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          className="bg-white rounded-xl shadow-xl w-full max-w-md border border-blue-100 relative"
          onClick={e => e.stopPropagation()}
          onAnimationComplete={handleOpen}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-blue-50">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-base">
              <FiZap className="text-yellow-500" />
              Quick Fill Settings
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600" type="button">
              <FiX size={20} />
            </button>
          </div>
 
          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-slate-500 leading-relaxed">
              Choose a <strong>therapist</strong>, <strong>therapy type</strong>, and <strong>time slot</strong>.
              Every date you click on the calendar will be auto-filled with these values.
              You can change these settings any time to assign a different therapist or slot for subsequent dates.
            </p>
 
            {/* Therapist */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FiUser size={12} /> Therapist <span className="text-red-500">*</span>
              </label>
              <select
                value={localTherapistId}
                onChange={e => setLocalTherapistId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              >
                <option value="">Select therapist…</option>
                {sortedTherapists.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
                  </option>
                ))}
              </select>
            </div>
 
            {/* Therapy type */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FiTag size={12} /> Therapy Type <span className="text-red-500">*</span>
              </label>
              <select
                value={localTherapyTypeId}
                onChange={e => setLocalTherapyTypeId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              >
                <option value="">Select therapy type…</option>
                {sortedTherapies.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
 
            {/* Time slot */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <FiClock size={12} /> Time Slot <span className="text-red-500">*</span>
              </label>
              <select
                value={localSlotId}
                onChange={e => setLocalSlotId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none"
              >
                <option value="">Select time slot…</option>
                {_SLOTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.label}{s.limited ? " (Limited case)" : ""}
                  </option>
                ))}
              </select>
            </div>
 
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              ⚠️ If the chosen slot is already booked or unavailable on a specific date, a warning will appear
              in that session row. You can still override the time manually in the table below.
            </p>
          </div>
 
          {/* Footer */}
          <div className="flex gap-2 px-6 pb-5 pt-1">
            <button
              type="button"
              className="flex-1 rounded-lg border border-blue-500 bg-blue-600 text-white py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
              disabled={!canSave}
              onClick={handleSave}
            >
              Save &amp; Activate
            </button>
            {settings && (
              <button
                type="button"
                className="px-4 rounded-lg border border-red-300 text-red-600 bg-red-50 text-sm hover:bg-red-100 transition"
                onClick={() => { onClear(); onClose(); }}
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
 
// ─── QuickFillBadge ───────────────────────────────────────────────────────────
 
type QuickFillBadgeProps = {
  settings: QuickFillSettings;
  therapists: Therapist[];
  therapies: Therapy[];
  onEdit: () => void;
  onClear: () => void;
};
 
function QuickFillBadge({ settings, therapists, therapies, onEdit, onClear }: QuickFillBadgeProps) {
  // Show sorted display name, though single match
  const tName = sortTherapistsByName(therapists).find(t => t._id === settings.therapistId)?.name ?? "—";
  const tyName = sortTherapiesByName(therapies).find(t => t._id === settings.therapyTypeId)?.name ?? "—";
  const slotLabel = _SLOTS.find(s => s.id === settings.slotId)?.label ?? settings.slotId;
 
  return (
    <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-300 rounded-lg px-4 py-2.5 mb-4">
      <FiZap className="text-yellow-500 mt-0.5 shrink-0" size={16} />
      <div className="flex-1 min-w-0 text-xs">
        <span className="font-semibold text-yellow-800">Quick Fill active —</span>{" "}
        <span className="text-yellow-700">
          {tName} · {tyName} · {slotLabel}
        </span>
        <br />
        <span className="text-yellow-600">Click calendar dates to auto-fill sessions with these settings.</span>
      </div>
      <div className="flex gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="text-xs px-2 py-1 rounded border border-yellow-400 text-yellow-800 hover:bg-yellow-100 transition"
        >Edit</button>
        <button
          type="button"
          onClick={onClear}
          className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 transition"
        >Off</button>
      </div>
    </div>
  );
}
 
// ─── SessionDatesTimesTable ───────────────────────────────────────────────────
 
type SessionDatesTimesTableProps = {
  sessions: BookingSession[];
  updateSlotId: (date: string, slotId: string, idx: number) => void;
  updateSessionTherapist: (idx: number, therapistId: string) => void;
  updateSessionTherapyType: (idx: number, therapyTypeId: string) => void;
  editBookingId: string | null;
  therapists: Therapist[];
  therapistId: string;
  therapies: Therapy[];
  therapyId: string;
  getAvailableSlotsForDate: (
    date: string,
    sessions: any[],
    currSlotId: string,
    currTherapistId?: string,
    isEdit?: boolean
  ) => { [slotId: string]: { disabled: boolean; reason: string } };
  bookedSlotsPerRow: { [rowKey: string]: string[] };
  removeSession: (idx: number) => void;
  /** When set, rows whose auto-filled slot is unavailable show an inline warning */
  quickFillSettings: QuickFillSettings | null;
};
 
function SessionDatesTimesTable({
  sessions, updateSlotId, updateSessionTherapist, updateSessionTherapyType,
  editBookingId, therapists, therapistId, therapies, therapyId,
  getAvailableSlotsForDate, bookedSlotsPerRow, removeSession,
  quickFillSettings,
}: SessionDatesTimesTableProps) {
  // Sorted therapists and therapies for dropdown
  const sortedTherapists = sortTherapistsByName(therapists);
  const sortedTherapies = sortTherapiesByName(therapies);
 
  return (
    <div className="space-y-3 mb-4">
      <div className="text-sm font-semibold text-blue-800 flex items-center gap-2 mb-0">
        <FiClock /> Session Dates &amp; Times
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[680px] w-fit border-collapse text-xs">
          <thead>
            <tr>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">Date</th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                <FiClock className="inline mr-1" />Time Slot
              </th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                <FiUser className="inline mr-1" />Therapist
              </th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100 font-semibold text-left">
                <FiTag className="inline mr-1" />Therapy Type
              </th>
              <th className="px-2 py-1 border border-slate-200 bg-slate-100" />
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, idx, arr) => {
              const rowTherapistId = s.therapistId || therapistId;
              let slotInfo: { [slotId: string]: { disabled: boolean; reason: string } };
              try {
                slotInfo = getAvailableSlotsForDate(s.date, arr, s.slotId, rowTherapistId, !!editBookingId);
              } catch {
                slotInfo = Object.fromEntries(_SLOTS.map(sl => [sl.id, { disabled: true, reason: "Error loading slots" }]));
              }
 
              const bookedSlotsForRow = bookedSlotsPerRow[`${s.date}:${rowTherapistId}`] || [];
              const duplicateSlot = arr.some(
                (other, oi) => oi !== idx && s.date === other.date && s.slotId && s.slotId === other.slotId
              );
 
              // Detect auto-filled slot conflict: slot was pre-set by quickFill but is now disabled
              const isQuickFillConflict =
                quickFillSettings &&
                s.slotId &&
                s.slotId === quickFillSettings.slotId &&
                slotInfo[s.slotId]?.disabled;
 
              let therapyTypeIdVal = "";
              if (s.therapyTypeId && typeof s.therapyTypeId === "object" && (s.therapyTypeId as any)._id) {
                therapyTypeIdVal = (s.therapyTypeId as any)._id;
              } else if (typeof s.therapyTypeId === "string") {
                therapyTypeIdVal = s.therapyTypeId;
              } else {
                therapyTypeIdVal = therapyId;
              }
 
              return (
                <tr key={s.date + ":" + idx} className={`text-sm ${isQuickFillConflict ? "bg-red-50" : ""}`}>
                  {/* Date */}
                  <td className="px-2 py-1 border border-slate-200 font-mono align-top">
                    {formatDateDDMMYYYY(s.date)}
                  </td>
 
                  {/* Time Slot */}
                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
                    <select
                      value={s.slotId}
                      onChange={e => updateSlotId(s.date, e.target.value, idx)}
                      className={`border rounded px-2 py-1 ${
                        duplicateSlot || (idx === 0 && !s.slotId) || isQuickFillConflict
                          ? "border-red-400"
                          : ""
                      }`}
                      required={idx === 0}
                      style={{ minWidth: 180 }}
                    >
                      <option value="">Select Time Slot</option>
                      {_SLOTS.map(slot => {
                        const info = slotInfo[slot.id] || { disabled: true, reason: "N/A" };
                        let label = slot.label;
                        if (slot.limited) label += " (Limited case)";
                        if (info.disabled && info.reason === "Already booked") label += " - Already Booked";
                        else if (info.disabled && info.reason) label += `  - ${info.reason}`;
                        const takenBySelf = arr.some(
                          (other, oi) => oi !== idx && other.date === s.date && other.slotId === slot.id
                        );
                        return (
                          <option key={slot.id} value={slot.id} disabled={info.disabled || takenBySelf}>
                            {label}
                          </option>
                        );
                      })}
                    </select>
<br/>
                    {/* Inline warnings */}
                    {isQuickFillConflict && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-red-600 font-medium">
                        <FiAlertTriangle size={11} />
                        Auto-filled slot unavailable for this date —{" "}
                        {slotInfo[s.slotId]?.reason || "conflict"}.
                        Please choose another time.
                      </div>
                    )}
                    {!isQuickFillConflict && duplicateSlot && (
                      <span className="text-xs text-red-500 ml-2">
                        Cannot choose same time for the same date.
                      </span>
                    )}
                    {bookedSlotsForRow.length > 0 && (
                      <span className="block mt-1 text-xs text-amber-700">
                        Already booked:{" "}
                        {bookedSlotsForRow
                          .map(id => _SLOTS.find(opt => opt.id === id)?.label || id)
                          .join(", ")}
                      </span>
                    )}
                    {idx === 0 && !s.slotId && (
                      <span className="text-xs text-red-500 ml-2">Time required</span>
                    )}
                  </td>
 
                  {/* Therapist */}
                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
                    {(() => {
                      // When a slot is selected for this row, compute which therapists
                      // already have that slot booked on this date (mirrors slot-side logic).
                      const rowSlotId = s.slotId;
                      const rowDate = s.date;
 
                      // Build per-therapist availability only when a slot is chosen
                      const therapistSlotStatus: Record<string, { booked: boolean; holiday: boolean }> = {};
                      if (rowSlotId && rowDate) {
                        const jsDate = new Date(rowDate);
                        const apiDate = `${jsDate.getFullYear()}-${String(jsDate.getMonth() + 1).padStart(2, "0")}-${String(jsDate.getDate()).padStart(2, "0")}`;
 
                        for (const t of sortedTherapists) {
                          // Full-day holiday?
                          const fullDayOff = (t.holidays || []).some(
                            h => h.date === apiDate && (h.isFullDay === true || h.isFullDay === undefined)
                          );
                          if (fullDayOff) { therapistSlotStatus[t._id] = { booked: false, holiday: true }; continue; }
 
                          // Partial holiday covers this slot?
                          const partialOff = (t.holidays || []).some(
                            h => h.date === apiDate && h.isFullDay === false &&
                              (h.slots || []).some(sl => sl.slotId === rowSlotId)
                          );
                          if (partialOff) { therapistSlotStatus[t._id] = { booked: false, holiday: true }; continue; }
 
                          // Already has this slot booked?
                          const isBooked = (t.bookedSlots?.[apiDate] || []).includes(rowSlotId);
                          therapistSlotStatus[t._id] = { booked: isBooked, holiday: false };
                        }
                      }
 
                      const slotSelected = !!rowSlotId;
 
                      return (
                        <select
                          value={s.therapistId || therapistId}
                          onChange={e => updateSessionTherapist(idx, e.target.value)}
                          className="border rounded px-2 py-1 min-w-[120px]"
                        >
                          <option value="">Select Therapist</option>
                          {sortedTherapists.map(t => {
                            const status = therapistSlotStatus[t._id];
                            const isBooked = slotSelected && status?.booked;
                            const isOnHoliday = slotSelected && status?.holiday;
                            const suffix = isOnHoliday
                              ? " — Holiday"
                              : isBooked
                              ? " — Already Booked"
                              : "";
                            return (
                              <option
                                value={t._id}
                                key={t._id}
                                disabled={isBooked || isOnHoliday}
                              >
                                {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}{suffix}
                              </option>
                            );
                          })}
                        </select>
                      );
                    })()}
                  </td>
 
                  {/* Therapy Type */}
                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap align-top">
                    <select
                      value={therapyTypeIdVal}
                      onChange={e => updateSessionTherapyType(idx, e.target.value)}
                      className="border rounded px-2 py-1 min-w-[150px]"
                      required
                    >
                      <option value="">Select Therapy Type</option>
                      {sortedTherapies.map(therapy => (
                        <option key={therapy._id} value={therapy._id}>{therapy.name}</option>
                      ))}
                    </select>
                  </td>
 
                  {/* Remove */}
                  <td className="px-2 py-1 border border-slate-200 whitespace-nowrap text-center align-top">
                    <button
                      type="button"
                      title="Remove this session"
                      className="text-red-500 hover:text-red-700 focus:outline-none"
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        padding: 2, borderRadius: 999, minWidth: 24, minHeight: 24,
                      }}
                      onClick={() => removeSession(idx)}
                      aria-label="Remove session"
                    >
                      <FiX />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="text-xs text-slate-600 mt-1">
        <b>Tip:</b> Multiple sessions per date are allowed — each must have a different time slot.
      </div>
    </div>
  );
}
 
// ─── PricingSummary ───────────────────────────────────────────────────────────
 
type PricingSummaryProps = {
  selectedPackage: Package;
  appliedCoupon: any | null;
};
 
function PricingSummary({ selectedPackage, appliedCoupon }: PricingSummaryProps) {
  const discountValue = appliedCoupon?.discount ? Number(appliedCoupon.discount) : 0;
  const totalSessions = getTotalSessionsForPackage(selectedPackage);
  const pkgTotal =
    selectedPackage.totalCost ??
    (selectedPackage.costPerSession && totalSessions
      ? Number(selectedPackage.costPerSession) * Number(totalSessions)
      : 0);
 
  return (
    <div className="w-full flex flex-col items-stretch mt-3 mb-3">
      <div className="flex flex-col gap-0.5 w-full rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 shadow-sm">
        <div className="flex justify-between items-center py-0.5">
          <span className="text-sm text-slate-700 font-medium">Package Price</span>
          <span className="font-mono text-base text-slate-900">
            ₹{selectedPackage.totalCost ??
              (selectedPackage.costPerSession && totalSessions
                ? Number(selectedPackage.costPerSession) * Number(totalSessions)
                : selectedPackage.costPerSession ?? "—")}
          </span>
        </div>
        {discountValue > 0 && pkgTotal > 0 ? (
          <>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-sm text-emerald-700 font-medium">
                Discount{appliedCoupon ? ` (${appliedCoupon.couponCode})` : ""}
              </span>
              <span className="text-base text-emerald-900 font-mono">
                -{discountValue}%{" "}
                <span className="opacity-60 text-xs ml-1">
                  (-₹{Math.round((pkgTotal * discountValue) / 100)})
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
              <span className="text-base font-semibold text-blue-900">
                <FiTag className="inline mr-1 text-blue-400" />Total After Discount
              </span>
              <span className="font-mono text-lg font-bold text-blue-900">
                ₹{Math.max(pkgTotal - Math.round((pkgTotal * discountValue) / 100), 0)}
              </span>
            </div>
          </>
        ) : discountValue === 0 && appliedCoupon ? (
          <div className="flex justify-between items-center py-0.5">
            <span className="text-sm text-orange-700 font-medium">Discount</span>
            <span className="text-xs text-orange-700">
              Coupon "{appliedCoupon.couponCode}" has no discount
            </span>
          </div>
        ) : (
          <div className="flex justify-between items-center border-t border-blue-200 mt-2 pt-2">
            <span className="text-base font-semibold text-blue-900">
              <FiTag className="inline mr-1 text-blue-400" />Total
            </span>
            <span className="font-mono text-lg font-bold text-blue-900">₹{pkgTotal}</span>
          </div>
        )}
      </div>
    </div>
  );
}
 
// ─── BookingFormPanel (public export) ────────────────────────────────────────
 
export type BookingFormPanelProps = {
  editBookingId: string | null;
  handleReset: () => void;
  handleCancelEdit: () => void;
  handleBookOrUpdate: (e: React.MouseEvent<HTMLButtonElement>) => void;
  canBook: boolean;
  bookingLoading: boolean;
  bookingError: string | null;
  bookingSuccess: string | null;
  // Core selects
  therapistId: string;
  setTherapistId: (id: string) => void;
  therapists: Therapist[];
  patientId: string;
  setPatientId: (id: string) => void;
  patients: Patient[];
  therapyId: string;
  setTherapyId: (id: string) => void;
  therapies: Therapy[];
  packageId: string;
  setPackageId: (id: string) => void;
  packages: Package[];
  // Coupon
  couponInput: string;
  setCouponInput: (v: string) => void;
  appliedCoupon: any | null;
  couponStatus: null | "valid" | "invalid";
  setCouponStatus: (s: null | "valid" | "invalid") => void;
  handleCouponApply: () => void;
  handleCouponClear: () => void;
  // Remark
  remark: string;
  setRemark: (v: string) => void;
  // Sessions
  sessions: BookingSession[];
  selectedPackage: Package | null;
  earliestSession: { date: string; slotId: string } | null;
  /** Count of sessions in this booking already marked 'Missed' — these are
   *  allowed extra slots on top of the package total (see footer hint). */
  missedSessionsCount?: number;
  updateSlotId: (date: string, slotId: string, idx: number) => void;
  updateSessionTherapist: (idx: number, therapistId: string) => void;
  updateSessionTherapyType: (idx: number, therapyTypeId: string) => void;
  removeSession: (idx: number) => void;
  bookedSlotsPerRow: { [rowKey: string]: string[] };
  getAvailableSlotsForDate: (
    date: string,
    sessions: any[],
    currSlotId: string,
    currTherapistId?: string,
    isEdit?: boolean
  ) => { [slotId: string]: { disabled: boolean; reason: string } };
  bookings: any[];
  // Quick Fill
  quickFillSettings: QuickFillSettings | null;
  setQuickFillSettings: (s: QuickFillSettings | null) => void;
};
 
export function BookingFormPanel({
  editBookingId, handleReset, handleCancelEdit, handleBookOrUpdate,
  canBook, bookingLoading, bookingError, bookingSuccess,
  therapistId, setTherapistId, therapists,
  patientId, setPatientId, patients,
  therapyId, setTherapyId, therapies,
  packageId, setPackageId, packages,
  couponInput, setCouponInput, appliedCoupon, couponStatus, setCouponStatus,
  handleCouponApply, handleCouponClear,
  remark, setRemark,
  sessions, selectedPackage, earliestSession,
  missedSessionsCount = 0,
  updateSlotId, updateSessionTherapist, updateSessionTherapyType, removeSession,
  bookedSlotsPerRow, getAvailableSlotsForDate,
  bookings,
  quickFillSettings, setQuickFillSettings,
}: BookingFormPanelProps) {
  const [qfModalOpen, setQfModalOpen] = useState(false);
  const totalSessions = getTotalSessionsForPackage(selectedPackage);
 
  // Sort therapists, patients, therapies for dropdowns by name
  const sortedTherapists = sortTherapistsByName(therapists);
  const sortedTherapies = sortTherapiesByName(therapies);
  const sortedPatients = sortPatientsByName(patients);
 
  return (
    <div className="flex-1 bg-white border rounded-lg p-6">
      {/* Quick Fill Modal */}
      <QuickFillModal
        open={qfModalOpen}
        onClose={() => setQfModalOpen(false)}
        therapists={sortedTherapists}
        therapies={sortedTherapies}
        settings={quickFillSettings}
        onSave={setQuickFillSettings}
        onClear={() => setQuickFillSettings(null)}
      />
 
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {editBookingId ? "Edit Booking" : "Quick Book"}
          {editBookingId && (
            <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-normal">
              Editing
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          {/* ⚡ Quick Fill toggle button */}
          <button
            type="button"
            onClick={() => setQfModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold border transition ${
              quickFillSettings
                ? "bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200"
                : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200"
            }`}
            title="Configure Quick Fill — auto-fill therapist, therapy type and time slot when clicking calendar dates"
          >
            <FiZap size={13} className={quickFillSettings ? "text-yellow-500" : "text-slate-500"} />
            Quick Fill{quickFillSettings ? " (on)" : ""}
          </button>
          <button
            type="button"
            className="px-3 py-1 rounded text-xs bg-red-100 text-red-700 font-medium hover:bg-red-200 transition"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </div>
 
      {/* Quick Fill active badge */}
      {quickFillSettings && (
        <QuickFillBadge
          settings={quickFillSettings}
          therapists={sortedTherapists}
          therapies={sortedTherapies}
          onEdit={() => setQfModalOpen(true)}
          onClear={() => setQuickFillSettings(null)}
        />
      )}
 
      {/* Therapist */}
      <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Therapist</label>
      <select
        value={therapistId}
        onChange={e => setTherapistId(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
        disabled={!!editBookingId}
      >
        <option value="">Select Therapist</option>
        {sortedTherapists.map(t => (
          <option key={t._id} value={t._id}>
            {t.name}{t.therapistId ? ` (${t.therapistId})` : ""}
          </option>
        ))}
      </select>
 
      {/* Appointment ID (edit only) */}
      {editBookingId && (() => {
        const b = bookings?.find((b: any) => b._id === editBookingId);
        if (b?.appointmentId) {
          return (
            <div className="mb-3">
              <label className="block text-sm mb-1 flex items-center gap-1 text-gray-700 font-semibold">
                <FiHash /> Booking ID
              </label>
              <input
                type="text"
                value={b.appointmentId}
                className="w-full border rounded px-3 py-2 bg-slate-100 font-mono text-gray-500"
                readOnly disabled
              />
            </div>
          );
        }
        return null;
      })()}
 
      {/* Patient */}
      <label className="block text-sm mb-1 flex items-center gap-1"><FiUser /> Children Name</label>
      <select
        value={patientId}
        onChange={e => setPatientId(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
        disabled={!!editBookingId}
      >
        <option value="">Select Children</option>
        {sortedPatients.map(p => (
          <option key={p.id} value={p.id}>{getPatientDisplayName(p)}</option>
        ))}
      </select>
 
      {/* Therapy */}
      <label className="block text-sm mb-1 flex items-center gap-1"><FiTag /> Therapy Type</label>
      <select
        value={therapyId}
        onChange={e => setTherapyId(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-3"
      >
        <option value="">Select Therapy</option>
        {sortedTherapies.map(t => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
      </select>
 
      {/* Package */}
      <label className="block text-sm mb-1 flex items-center gap-1"><FiPackage /> Package</label>
      <select
        value={packageId}
        onChange={e => setPackageId(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-5"
      >
        <option value="">Select Package</option>
        {packages.map(pkg => (
          <option key={pkg._id} value={pkg._id}>{getPackageDisplay(pkg)}</option>
        ))}
      </select>
 
      {/* Coupon */}
      <label className="block text-sm mb-1 font-semibold text-blue-700">Discount Coupon</label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="Enter Coupon Code"
          value={couponInput}
          onChange={e => { setCouponInput(e.target.value); setCouponStatus(null); }}
          // disabled={!!editBookingId}
        />
        <button
          type="button"
          className="px-3 py-2 rounded bg-blue-500 text-white text-xs"
          style={{ minWidth: 90 }}
          onClick={handleCouponApply}
          disabled={!couponInput.trim()}
        >Apply</button>
        <button
          type="button"
          className="px-3 py-2 rounded bg-gray-200 text-gray-900 text-xs"
          style={{ minWidth: 70 }}
          disabled={!couponInput.trim()}
          onClick={handleCouponClear}
        >Clear</button>
      </div>
      {couponStatus === "valid" && appliedCoupon && (
        <div className="text-xs text-blue-700 mb-4">
          🔖 Coupon <span className="font-mono">{appliedCoupon.couponCode}</span> applied!{" "}
          {appliedCoupon.discount}% off, valid {appliedCoupon.validityDays} days.
        </div>
      )}
      {couponStatus === "invalid" && (
        <div className="text-xs text-red-600 mb-4">🚫 Invalid or expired coupon code.</div>
      )}
 
      {/* Remark */}
      <label className="block text-sm mb-1 font-semibold text-slate-700">Remark</label>
      <textarea
        className="w-full border rounded px-3 py-2 mb-4"
        rows={2}
        placeholder="Add a remark or note for this booking (optional)"
        value={remark}
        onChange={e => setRemark(e.target.value)}
      />
 
      {/* Sessions table */}
      {sessions.length > 0 && (
        <SessionDatesTimesTable
          sessions={sessions}
          updateSlotId={updateSlotId}
          updateSessionTherapist={updateSessionTherapist}
          updateSessionTherapyType={updateSessionTherapyType}
          editBookingId={editBookingId}
          therapists={sortedTherapists}
          therapistId={therapistId}
          therapies={sortedTherapies}
          therapyId={therapyId}
          getAvailableSlotsForDate={getAvailableSlotsForDate}
          bookedSlotsPerRow={bookedSlotsPerRow}
          removeSession={removeSession}
          quickFillSettings={quickFillSettings}
        />
      )}
 
      {/* Pricing */}
      {selectedPackage && (
        <PricingSummary selectedPackage={selectedPackage} appliedCoupon={appliedCoupon} />
      )}
 
      {/* Error / Success */}
      {bookingError && <div className="text-xs text-red-600 mt-1">{bookingError}</div>}
      {bookingSuccess && <div className="text-xs text-green-600 mt-1">{bookingSuccess}</div>}
 
      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          disabled={!canBook || bookingLoading}
          className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50"
          onClick={handleBookOrUpdate}
        >
          {bookingLoading
            ? editBookingId ? "Updating..." : "Booking..."
            : editBookingId ? "Update Booking" : "Book Now"}
        </button>
        {editBookingId && (
          <button
            className="px-3 py-2 rounded border border-gray-300 text-slate-700 bg-gray-100"
            type="button"
            onClick={handleCancelEdit}
          >
            <FiX className="inline mr-1" />Cancel Edit
          </button>
        )}
      </div>
 
      {/* Footer hints */}
      {typeof totalSessions === "number" && (
        <div className="text-xs text-blue-700 mt-3">
          {`Up to ${totalSessions} session${totalSessions > 1 ? "s" : ""} for this package.`}
          {missedSessionsCount > 0 && (
            <>
              {" "}
              <span className="font-semibold text-amber-700">
                +{missedSessionsCount} replacement{missedSessionsCount > 1 ? "s" : ""} allowed
              </span>{" "}
              for missed session{missedSessionsCount > 1 ? "s" : ""} (max {totalSessions + missedSessionsCount} total).
            </>
          )}
          {" "}Multiple sessions per day allowed — times must differ.
          <br />
          Each therapist: <b>10 normal</b> and <b>5 limited</b> case slots per day.
        </div>
      )}
      {sessions.length === 0 && (
        <div className="text-xs text-red-600 mt-2">At least one session date must be selected.</div>
      )}
      {sessions.length > 0 && (!earliestSession || !earliestSession.slotId) && (
        <div className="text-xs text-red-600 mt-2">Please set a time for the first session date.</div>
      )}
    </div>
  );
}








