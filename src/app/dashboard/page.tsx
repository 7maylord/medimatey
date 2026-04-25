"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useMedications, useTodaySchedule } from "@/hooks/useStorage";
import { useAI } from "@/hooks/useAI";
import { checkInteractions } from "@/lib/drug-data";

// --- Icons ---
function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function CalendarIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PillIcon({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3" />
    </svg>
  );
}

function AlertTriangleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
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

function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const MED_COLORS = [
  "var(--med-teal-500)",
  "var(--med-indigo-500)",
  "var(--med-amber-500)",
  "var(--med-coral-500)",
  "var(--med-emerald-500)",
];

const quickActions = [
  { href: "/scan",     icon: CameraIcon,   title: "Scan a Pill",      description: "Identify medications with camera", gradient: "from-[var(--med-teal-500)] to-[var(--med-teal-700)]",    shadow: "rgba(13,148,136,0.3)" },
  { href: "/journal",  icon: MicIcon,      title: "Voice Check-in",   description: "Log how you're feeling today",      gradient: "from-[var(--med-indigo-400)] to-[var(--med-indigo-600)]", shadow: "rgba(99,102,241,0.3)" },
  { href: "/schedule", icon: CalendarIcon, title: "View Schedule",    description: "See today's full medication plan",  gradient: "from-[var(--med-amber-400)] to-[var(--med-amber-600)]",  shadow: "rgba(245,158,11,0.3)" },
];

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState("");

  const { medications } = useMedications();
  const { entries: scheduleEntries, markTaken } = useTodaySchedule();
  const { isConnected, backend } = useAI();

  // Derive interactions synchronously — no effect needed
  const interactions = useMemo(
    () => medications.length >= 2
      ? checkInteractions(medications.map((m) => m.name)).interactions
      : [],
    [medications]
  );

  // Live clock
  useEffect(() => {
    const update = () => {
      setCurrentTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }));
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  const takenCount = scheduleEntries.filter((e) => e.taken).length;
  const totalCount = scheduleEntries.length;
  const completionPct = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-outfit)] mb-1">
          {greeting()} 👋
        </h1>
        <p className="text-foreground-muted">
          {currentTime && <span className="mr-2">{currentTime} ·</span>}
          {totalCount > 0
            ? `${takenCount} of ${totalCount} medications taken today`
            : "No medications scheduled yet"}
          {isConnected && (
            <span className="ml-2 text-xs text-[var(--med-teal-500)]">
              · AI: {backend === "ollama" ? "Ollama (local)" : "Google AI"}
            </span>
          )}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group glass-card-strong p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
              style={{ boxShadow: `0 4px 16px ${action.shadow}` }}
            >
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{action.title}</h3>
              <p className="text-xs text-foreground-muted">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 glass-card-strong p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)]">Today&apos;s Schedule</h2>
              <p className="text-sm text-foreground-muted">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-2xl font-bold text-[var(--med-teal-500)] font-[family-name:var(--font-outfit)]">
                  {completionPct}%
                </div>
                <div className="text-xs text-foreground-muted">complete</div>
              </div>
              <div className="w-12 h-12 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--card-border)" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--med-teal-500)" strokeWidth="3" strokeDasharray={`${completionPct}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
                </svg>
              </div>
            </div>
          </div>

          {scheduleEntries.length === 0 ? (
            <div className="text-center py-8 text-foreground-muted text-sm">
              No medications scheduled today.{" "}
              <Link href="/scan" className="text-[var(--med-teal-500)] hover:underline">Scan a pill bottle</Link> to get started.
            </div>
          ) : (
            <div className="space-y-3">
              {scheduleEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => !entry.taken && markTaken(entry.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer group ${
                    entry.taken
                      ? "bg-[var(--med-emerald-500)]/5 border border-[var(--med-emerald-500)]/20"
                      : "glass-card hover:border-[var(--med-teal-500)]/30"
                  }`}
                >
                  <div className="w-20 flex-shrink-0 text-right">
                    <div className="text-sm font-semibold">{entry.scheduledTime}</div>
                    <div className="text-xs text-foreground-muted capitalize">{entry.timeLabel}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full border-2 transition-all flex-shrink-0 ${
                    entry.taken
                      ? "bg-[var(--med-emerald-500)] border-[var(--med-emerald-500)]"
                      : "border-[var(--med-slate-400)] group-hover:border-[var(--med-teal-500)]"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${entry.taken ? "line-through text-foreground-muted" : ""}`}>
                      {entry.medicationName} {entry.dosage}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    {entry.taken
                      ? <CheckCircleIcon className="w-5 h-5 text-[var(--med-emerald-500)]" />
                      : <ClockIcon className="w-5 h-5 text-foreground-muted group-hover:text-[var(--med-teal-500)] transition-colors" />
                    }
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Medications */}
          <div className="glass-card-strong p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)]">My Medications</h2>
              <Link href="/scan" className="btn-icon w-8 h-8">
                <PlusIcon className="w-4 h-4" />
              </Link>
            </div>

            {medications.length === 0 ? (
              <p className="text-sm text-foreground-muted text-center py-4">
                No medications yet.{" "}
                <Link href="/scan" className="text-[var(--med-teal-500)] hover:underline">Add one</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {medications.slice(0, 5).map((med, i) => (
                  <div key={med.id} className="flex items-center gap-3 p-3 rounded-xl glass-card">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${MED_COLORS[i % MED_COLORS.length]}20` }}
                    >
                      <PillIcon className="w-5 h-5" style={{ color: MED_COLORS[i % MED_COLORS.length] }} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{med.name}</div>
                      <div className="text-xs text-foreground-muted">{med.dosage} · {med.form}</div>
                    </div>
                  </div>
                ))}
                {medications.length > 5 && (
                  <p className="text-xs text-foreground-muted text-center">+{medications.length - 5} more</p>
                )}
              </div>
            )}
          </div>

          {/* Interaction Warnings */}
          {interactions.length > 0 && (
            <div className="glass-card-strong p-6 border-l-4 border-l-[var(--med-amber-500)]">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangleIcon className="w-5 h-5 text-[var(--med-amber-500)]" />
                <h2 className="text-sm font-bold">Interaction Warning{interactions.length > 1 ? "s" : ""}</h2>
              </div>
              <div className="space-y-3">
                {interactions.slice(0, 2).map((interaction, i) => (
                  <div key={i} className="text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-warning capitalize">{interaction.severity}</span>
                    </div>
                    <p className="text-foreground-muted text-xs leading-relaxed">
                      <strong>{interaction.drugA}</strong> + <strong>{interaction.drugB}</strong>: {interaction.description}
                    </p>
                  </div>
                ))}
                {interactions.length > 2 && (
                  <p className="text-xs text-foreground-muted">+{interactions.length - 2} more interactions</p>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="glass-card p-4 text-xs text-foreground-muted leading-relaxed">
            ⚕️ <strong>Not medical advice.</strong> Always consult your healthcare provider before making changes to your medications.
          </div>
        </div>
      </div>
    </div>
  );
}
