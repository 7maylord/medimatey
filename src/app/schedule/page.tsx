"use client";

import { useState, useEffect } from "react";

// --- Icons ---
function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ClockIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SunIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function CloudIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  );
}

function MoonIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function VolumeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
    </svg>
  );
}

// --- Data ---

interface ScheduleItem {
  id: string;
  time: string;
  med: string;
  dosage: string;
  taken: boolean;
  color: string;
}

interface TimeBlock {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: ScheduleItem[];
}

const scheduleData: TimeBlock[] = [
  {
    label: "Morning",
    icon: SunIcon,
    items: [
      { id: "1", time: "8:00 AM", med: "Metformin", dosage: "500mg", taken: true, color: "var(--med-teal-500)" },
      { id: "2", time: "8:00 AM", med: "Lisinopril", dosage: "10mg", taken: true, color: "var(--med-indigo-500)" },
    ],
  },
  {
    label: "Afternoon",
    icon: CloudIcon,
    items: [
      { id: "3", time: "12:00 PM", med: "Aspirin", dosage: "81mg", taken: false, color: "var(--med-amber-500)" },
    ],
  },
  {
    label: "Evening",
    icon: SunIcon,
    items: [
      { id: "4", time: "6:00 PM", med: "Metformin", dosage: "500mg", taken: false, color: "var(--med-teal-500)" },
    ],
  },
  {
    label: "Bedtime",
    icon: MoonIcon,
    items: [
      { id: "5", time: "10:00 PM", med: "Atorvastatin", dosage: "20mg", taken: false, color: "var(--med-coral-500)" },
    ],
  },
];

export default function SchedulePage() {
  const [mounted, setMounted] = useState(false);
  const [schedule, setSchedule] = useState(scheduleData);
  const [view, setView] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalItems = schedule.reduce((sum, block) => sum + block.items.length, 0);
  const takenItems = schedule.reduce(
    (sum, block) => sum + block.items.filter((i) => i.taken).length,
    0
  );
  const completionPct = totalItems > 0 ? Math.round((takenItems / totalItems) * 100) : 0;

  const toggleTaken = (blockIndex: number, itemId: string) => {
    setSchedule((prev) =>
      prev.map((block, bi) =>
        bi === blockIndex
          ? {
              ...block,
              items: block.items.map((item) =>
                item.id === itemId ? { ...item, taken: !item.taken } : item
              ),
            }
          : block
      )
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1">
              Medication Schedule
            </h1>
            <p className="text-foreground-muted">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button className="btn-icon" title="Read schedule aloud">
            <VolumeIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* View Toggle + Progress */}
      <div
        className={`flex items-center justify-between mb-6 transition-all duration-700 delay-100 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {/* Toggle */}
        <div className="glass-card p-1 flex gap-1">
          {(["daily", "weekly"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                view === v
                  ? "bg-[var(--med-teal-500)] text-white shadow-lg"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {v === "daily" ? "Today" : "This Week"}
            </button>
          ))}
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div>
            <div className="text-sm font-semibold text-right">
              {takenItems}/{totalItems}
            </div>
            <div className="text-xs text-foreground-muted">taken</div>
          </div>
          <div className="w-24 h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--med-teal-500)] to-[var(--med-emerald-400)] transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="space-y-6">
        {schedule.map((block, blockIndex) => (
          <div
            key={block.label}
            className={`transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${200 + blockIndex * 100}ms` }}
          >
            {/* Time Block Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--med-teal-500)]/10 flex items-center justify-center">
                <block.icon className="w-4 h-4 text-[var(--med-teal-500)]" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
                {block.label}
              </h3>
              <div className="flex-1 h-px bg-[var(--card-border)]" />
            </div>

            {/* Medication Items */}
            <div className="space-y-3 ml-4 pl-7 border-l-2 border-[var(--card-border)]">
              {block.items.map((item) => (
                <div
                  key={item.id}
                  className={`glass-card-strong p-4 flex items-center gap-4 group cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                    item.taken ? "border-[var(--med-emerald-500)]/20" : ""
                  }`}
                  onClick={() => toggleTaken(blockIndex, item.id)}
                >
                  {/* Check Circle */}
                  <button
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                      item.taken
                        ? "bg-[var(--med-emerald-500)] border-[var(--med-emerald-500)] text-white scale-110"
                        : "border-[var(--med-slate-400)] group-hover:border-[var(--med-teal-500)]"
                    }`}
                  >
                    {item.taken && <CheckIcon className="w-4 h-4" />}
                  </button>

                  {/* Pill color dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />

                  {/* Med info */}
                  <div className="flex-1">
                    <div className={`font-semibold text-sm ${item.taken ? "line-through text-foreground-muted" : ""}`}>
                      {item.med}
                    </div>
                    <div className="text-xs text-foreground-muted">{item.dosage}</div>
                  </div>

                  {/* Time */}
                  <div className="flex items-center gap-1 text-foreground-muted">
                    <ClockIcon className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom disclaimer */}
      <div className="mt-12 glass-card p-4 text-xs text-foreground-muted leading-relaxed text-center">
        ⚕️ <strong>Not medical advice.</strong> Always follow your doctor&apos;s prescribed schedule.
        Tap any medication to mark it as taken.
      </div>
    </div>
  );
}
