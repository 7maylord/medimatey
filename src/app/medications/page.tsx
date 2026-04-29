"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useMedications } from "@/hooks/useStorage";
import { saveMedication } from "@/lib/storage";
import { checkInteractions } from "@/lib/drug-data";
import type { Medication, MedicationFrequency } from "@/types";

// ── Icons ──────────────────────────────────────────────────────────────────

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function EditIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  );
}

function XIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

// ── Constants ───────────────────────────────────────────────────────────────

const FORM_OPTIONS: Medication["form"][] = ["tablet", "capsule", "liquid", "injection", "topical", "inhaler", "other"];
const FREQ_OPTIONS: { value: MedicationFrequency; label: string }[] = [
  { value: "once_daily",        label: "Once daily" },
  { value: "twice_daily",       label: "Twice daily" },
  { value: "three_times_daily", label: "3× daily" },
  { value: "four_times_daily",  label: "4× daily" },
  { value: "every_other_day",   label: "Every other day" },
  { value: "weekly",            label: "Weekly" },
  { value: "as_needed",         label: "As needed" },
  { value: "custom",            label: "Custom" },
];

const MED_COLORS = [
  "#14b8a6", "#6366f1", "#f59e0b", "#f43f5e", "#10b981",
  "#8b5cf6", "#3b82f6", "#ec4899",
];

const INPUT = "w-full px-3 py-2 rounded-xl glass-card text-sm placeholder-(--foreground-muted) focus:outline-none focus:ring-2 focus:ring-(--med-teal-500) bg-transparent";
const SELECT = `${INPUT} cursor-pointer`;

// ── Edit Modal ───────────────────────────────────────────────────────────────

interface EditModalProps {
  med: Medication;
  onSave: (updated: Medication) => void;
  onClose: () => void;
}

function EditModal({ med, onSave, onClose }: EditModalProps) {
  const [form, setForm] = useState({
    name:         med.name,
    genericName:  med.genericName ?? "",
    dosage:       med.dosage,
    form:         med.form,
    frequency:    med.frequency,
    prescribedBy: med.prescribedBy ?? "",
    startDate:    med.startDate,
    endDate:      med.endDate ?? "",
    instructions: med.instructions ?? "",
  });

  function field(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  function handleSave() {
    if (!form.name.trim() || !form.dosage.trim()) return;
    onSave({
      ...med,
      ...form,
      genericName:  form.genericName  || undefined,
      prescribedBy: form.prescribedBy || undefined,
      endDate:      form.endDate      || undefined,
      instructions: form.instructions || undefined,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card-strong w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-(family-name:--font-outfit)">Edit Medication</h2>
          <button onClick={onClose} className="btn-icon w-8 h-8"><XIcon className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Drug Name *</span>
              <input className={INPUT} value={form.name} onChange={field("name")} placeholder="e.g. Metformin" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Generic Name</span>
              <input className={INPUT} value={form.genericName} onChange={field("genericName")} placeholder="Optional" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Dosage *</span>
              <input className={INPUT} value={form.dosage} onChange={field("dosage")} placeholder="e.g. 500mg" />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Form</span>
              <select className={SELECT} value={form.form} onChange={field("form")}>
                {FORM_OPTIONS.map((f) => <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Frequency</span>
              <select className={SELECT} value={form.frequency} onChange={field("frequency")}>
                {FREQ_OPTIONS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Start Date</span>
              <input type="date" className={INPUT} value={form.startDate} onChange={field("startDate")} />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">End Date</span>
              <input type="date" className={INPUT} value={form.endDate} onChange={field("endDate")} />
            </label>
            <label className="col-span-2 block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Prescribed By</span>
              <input className={INPUT} value={form.prescribedBy} onChange={field("prescribedBy")} placeholder="Doctor's name" />
            </label>
            <label className="col-span-2 block">
              <span className="text-xs font-medium text-foreground-muted mb-1 block">Instructions</span>
              <textarea
                className={`${INPUT} h-20 resize-none`}
                value={form.instructions}
                onChange={field("instructions")}
                placeholder="e.g. Take with food"
              />
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 text-sm py-2.5">Save Changes</button>
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2.5">Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function MedicationsPage() {
  const { medications, remove, refresh } = useMedications();
  const [editing, setEditing] = useState<Medication | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const interactions = useMemo(
    () => medications.length >= 2
      ? checkInteractions(medications.map((m) => m.name)).interactions
      : [],
    [medications]
  );

  async function handleSave(updated: Medication) {
    await saveMedication(updated);
    await refresh();
    setEditing(null);
  }

  async function handleDelete(id: string) {
    await remove(id);
    setConfirmDelete(null);
  }

  const interactionMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const ix of interactions) {
      const kA = ix.drugA.toLowerCase();
      const kB = ix.drugB.toLowerCase();
      m[kA] = (m[kA] ?? 0) + 1;
      m[kB] = (m[kB] ?? 0) + 1;
    }
    return m;
  }, [interactions]);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-(family-name:--font-outfit) mb-1">My Medications</h1>
          <p className="text-foreground-muted text-sm">
            {medications.length} medication{medications.length !== 1 ? "s" : ""}
            {interactions.length > 0 && (
              <span className="ml-2 text-[var(--med-amber-500)] font-medium">
                · {interactions.length} interaction{interactions.length !== 1 ? "s" : ""} detected
              </span>
            )}
          </p>
        </div>
        <Link href="/scan" className="btn-primary flex items-center gap-2 text-sm py-2.5 px-4">
          <PlusIcon className="w-4 h-4" />
          Add via Scan
        </Link>
      </div>

      {/* Interaction banner */}
      {interactions.length > 0 && (
        <div className="glass-card p-4 mb-6 border-l-4 border-l-[var(--med-amber-500)] flex items-start gap-3">
          <AlertIcon className="w-5 h-5 text-[var(--med-amber-500)] flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Drug Interaction{interactions.length > 1 ? "s" : ""} Detected</p>
            {interactions.slice(0, 2).map((ix, i) => (
              <p key={i} className="text-foreground-muted text-xs">
                <span className="capitalize font-medium text-[var(--med-amber-500)]">{ix.severity}</span>
                {" — "}{ix.drugA} + {ix.drugB}: {ix.description}
              </p>
            ))}
            {interactions.length > 2 && (
              <p className="text-xs text-foreground-muted mt-1">+{interactions.length - 2} more</p>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {medications.length === 0 && (
        <div className="glass-card-strong p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-(--med-teal-500)/10 flex items-center justify-center">
            <PlusIcon className="w-8 h-8 text-(--med-teal-500)" />
          </div>
          <h3 className="font-semibold mb-2">No medications yet</h3>
          <p className="text-foreground-muted text-sm mb-6">Scan a pill bottle to add your first medication.</p>
          <Link href="/scan" className="btn-primary text-sm py-2.5 px-6">Scan a Pill Bottle</Link>
        </div>
      )}

      {/* Medication cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {medications.map((med, i) => {
          const color = MED_COLORS[i % MED_COLORS.length];
          const ixCount = interactionMap[med.name.toLowerCase()] ?? 0;
          return (
            <div key={med.id} className="glass-card-strong p-5 flex flex-col gap-4">
              {/* Top row */}
              <div className="flex items-start gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center text-white font-bold text-lg"
                  style={{ background: `${color}25`, color }}
                >
                  {med.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{med.name}</h3>
                  {med.genericName && (
                    <p className="text-xs text-foreground-muted truncate">{med.genericName}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditing(med)}
                    className="btn-icon w-8 h-8"
                    title="Edit"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(med.id)}
                    className="btn-icon w-8 h-8 hover:text-[var(--med-coral-500)] hover:border-[var(--med-coral-500)]/30"
                    title="Delete"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="glass-card px-3 py-2">
                  <p className="text-foreground-muted mb-0.5">Dosage</p>
                  <p className="font-semibold">{med.dosage}</p>
                </div>
                <div className="glass-card px-3 py-2">
                  <p className="text-foreground-muted mb-0.5">Form</p>
                  <p className="font-semibold capitalize">{med.form}</p>
                </div>
                <div className="glass-card px-3 py-2">
                  <p className="text-foreground-muted mb-0.5">Frequency</p>
                  <p className="font-semibold">{med.frequency.replace(/_/g, " ")}</p>
                </div>
                <div className="glass-card px-3 py-2">
                  <p className="text-foreground-muted mb-0.5">Since</p>
                  <p className="font-semibold">{med.startDate}</p>
                </div>
              </div>

              {/* Footer badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {med.prescribedBy && (
                  <span className="text-xs px-2 py-0.5 rounded-full glass-card text-foreground-muted">
                    Dr. {med.prescribedBy}
                  </span>
                )}
                {med.instructions && (
                  <span className="text-xs px-2 py-0.5 rounded-full glass-card text-foreground-muted truncate max-w-[180px]">
                    {med.instructions}
                  </span>
                )}
                {ixCount > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--med-amber-500)]/10 text-[var(--med-amber-500)] font-medium ml-auto">
                    ⚠ {ixCount} interaction{ixCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      {editing && (
        <EditModal
          med={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-card-strong w-full max-w-sm p-6 rounded-2xl text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[var(--med-coral-500)]/10 flex items-center justify-center">
              <TrashIcon className="w-6 h-6 text-[var(--med-coral-500)]" />
            </div>
            <h3 className="font-bold text-lg mb-2">Remove Medication?</h3>
            <p className="text-foreground-muted text-sm mb-6">
              This will permanently delete the medication and all associated schedule entries.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[var(--med-coral-500)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Remove
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="btn-secondary flex-1 text-sm py-2.5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
