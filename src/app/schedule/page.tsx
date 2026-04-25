"use client";

import { useTodaySchedule } from "@/hooks/useStorage";
import { useSpeech } from "@/hooks/useSpeech";

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

type TimeLabel = "morning" | "afternoon" | "evening" | "bedtime" | "custom";

const timeLabelMeta: Record<TimeLabel, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  morning:   { label: "Morning",   Icon: SunIcon },
  afternoon: { label: "Afternoon", Icon: CloudIcon },
  evening:   { label: "Evening",   Icon: SunIcon },
  bedtime:   { label: "Bedtime",   Icon: MoonIcon },
  custom:    { label: "Custom",    Icon: ClockIcon },
};

export default function SchedulePage() {
  const { entries, loading, markTaken, markSkipped } = useTodaySchedule();
  const { speak, isSpeaking, isSupported: speechSupported } = useSpeech();

  const takenCount = entries.filter((e) => e.taken).length;
  const totalCount = entries.length;
  const completionPct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Group entries by time label
  const groups = entries.reduce<Record<TimeLabel, typeof entries>>((acc, entry) => {
    const key = entry.timeLabel as TimeLabel;
    if (!acc[key]) acc[key] = [];
    acc[key].push(entry);
    return acc;
  }, {} as Record<TimeLabel, typeof entries>);

  const orderedLabels: TimeLabel[] = ["morning", "afternoon", "evening", "bedtime", "custom"];
  const activeGroups = orderedLabels.filter((k) => groups[k]?.length > 0);

  const readScheduleAloud = () => {
    if (!speechSupported || entries.length === 0) return;
    const pending = entries.filter((e) => !e.taken && !e.skipped);
    if (pending.length === 0) {
      speak("All medications have been taken today. Great job!");
      return;
    }
    const lines = pending.map((e) => `${e.medicationName} ${e.dosage} at ${e.scheduledTime}`);
    speak(`You still need to take: ${lines.join(", ")}.`);
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1">Medication Schedule</h1>
            <p className="text-foreground-muted">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {speechSupported && (
            <button
              onClick={readScheduleAloud}
              className={`btn-icon ${isSpeaking ? "text-[var(--med-teal-500)]" : ""}`}
              title="Read schedule aloud"
            >
              <VolumeIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-foreground-muted">
          {takenCount} of {totalCount} medications taken
        </div>
        <div className="flex items-center gap-3">
          <div className="w-32 h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--med-teal-500)] to-[var(--med-emerald-400)] transition-all duration-700"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-[var(--med-teal-500)]">{completionPct}%</span>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-foreground-muted text-sm py-16">Loading schedule…</div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && (
        <div className="glass-card-strong p-12 text-center">
          <ClockIcon className="w-12 h-12 text-foreground-muted mx-auto mb-4" />
          <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] mb-2">No medications scheduled</h2>
          <p className="text-foreground-muted text-sm">
            Scan a pill bottle or add medications to build your daily schedule.
          </p>
        </div>
      )}

      {/* Schedule Timeline */}
      {!loading && activeGroups.length > 0 && (
        <div className="space-y-6">
          {activeGroups.map((timeLabel, blockIndex) => {
            const meta = timeLabelMeta[timeLabel];
            const Icon = meta.Icon;
            return (
              <div
                key={timeLabel}
                className="transition-all duration-300"
                style={{ transitionDelay: `${200 + blockIndex * 100}ms` }}
              >
                {/* Time Block Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--med-teal-500)]/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-[var(--med-teal-500)]" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground-muted">
                    {meta.label}
                  </h3>
                  <div className="flex-1 h-px bg-[var(--card-border)]" />
                </div>

                {/* Medication Items */}
                <div className="space-y-3 ml-4 pl-7 border-l-2 border-[var(--card-border)]">
                  {groups[timeLabel].map((item) => (
                    <div
                      key={item.id}
                      className={`glass-card-strong p-4 flex items-center gap-4 group cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
                        item.taken ? "border-[var(--med-emerald-500)]/20" : ""
                      } ${item.skipped ? "opacity-50" : ""}`}
                      onClick={() => !item.skipped && markTaken(item.id)}
                    >
                      {/* Check Circle */}
                      <button
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          item.taken
                            ? "bg-[var(--med-emerald-500)] border-[var(--med-emerald-500)] text-white scale-110"
                            : "border-[var(--med-slate-400)] group-hover:border-[var(--med-teal-500)]"
                        }`}
                        onClick={(e) => { e.stopPropagation(); if (!item.skipped) markTaken(item.id); }}
                      >
                        {item.taken && <CheckIcon className="w-4 h-4" />}
                      </button>

                      {/* Med info */}
                      <div className="flex-1">
                        <div className={`font-semibold text-sm ${item.taken ? "line-through text-foreground-muted" : ""}`}>
                          {item.medicationName}
                        </div>
                        <div className="text-xs text-foreground-muted">{item.dosage}</div>
                      </div>

                      {/* Time + skip */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-1 text-foreground-muted">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{item.scheduledTime}</span>
                        </div>
                        {!item.taken && !item.skipped && (
                          <button
                            onClick={(e) => { e.stopPropagation(); markSkipped(item.id, "skipped by user"); }}
                            className="text-xs text-foreground-muted hover:text-[var(--med-coral-500)] transition-colors"
                          >
                            Skip
                          </button>
                        )}
                        {item.skipped && (
                          <span className="text-xs text-foreground-muted">Skipped</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-12 glass-card p-4 text-xs text-foreground-muted leading-relaxed text-center">
        ⚕️ <strong>Not medical advice.</strong> Always follow your doctor&apos;s prescribed schedule.
        Tap any medication to mark it as taken.
      </div>
    </div>
  );
}
