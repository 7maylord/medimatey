"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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

// --- Mock Data ---

const mockSchedule = [
  { id: "1", time: "8:00 AM", label: "Morning", med: "Metformin 500mg", taken: true, color: "var(--med-teal-500)" },
  { id: "2", time: "8:00 AM", label: "Morning", med: "Lisinopril 10mg", taken: true, color: "var(--med-indigo-500)" },
  { id: "3", time: "12:00 PM", label: "Afternoon", med: "Aspirin 81mg", taken: false, color: "var(--med-amber-500)" },
  { id: "4", time: "6:00 PM", label: "Evening", med: "Metformin 500mg", taken: false, color: "var(--med-teal-500)" },
  { id: "5", time: "10:00 PM", label: "Bedtime", med: "Atorvastatin 20mg", taken: false, color: "var(--med-coral-500)" },
];

const mockMedications = [
  { name: "Metformin", dosage: "500mg", form: "Tablet", color: "var(--med-teal-500)" },
  { name: "Lisinopril", dosage: "10mg", form: "Tablet", color: "var(--med-indigo-500)" },
  { name: "Aspirin", dosage: "81mg", form: "Tablet", color: "var(--med-amber-500)" },
  { name: "Atorvastatin", dosage: "20mg", form: "Tablet", color: "var(--med-coral-500)" },
];

const mockInteractions = [
  {
    drugA: "Aspirin",
    drugB: "Lisinopril",
    severity: "moderate" as const,
    description: "Aspirin may reduce the blood pressure-lowering effect of Lisinopril.",
  },
];

// --- Quick Action Cards ---

const quickActions = [
  {
    href: "/scan",
    icon: CameraIcon,
    title: "Scan a Pill",
    description: "Use your camera to identify medications",
    gradient: "from-[var(--med-teal-500)] to-[var(--med-teal-700)]",
    shadowColor: "rgba(13,148,136,0.3)",
  },
  {
    href: "/journal",
    icon: MicIcon,
    title: "Voice Check-in",
    description: "Log how you're feeling today",
    gradient: "from-[var(--med-indigo-400)] to-[var(--med-indigo-600)]",
    shadowColor: "rgba(99,102,241,0.3)",
  },
  {
    href: "/schedule",
    icon: CalendarIcon,
    title: "View Schedule",
    description: "See today's full medication plan",
    gradient: "from-[var(--med-amber-400)] to-[var(--med-amber-600)]",
    shadowColor: "rgba(245,158,11,0.3)",
  },
];

// --- Component ---

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const takenCount = mockSchedule.filter((s) => s.taken).length;
  const totalCount = mockSchedule.length;
  const completionPct = Math.round((takenCount / totalCount) * 100);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl md:text-4xl font-bold font-[family-name:var(--font-outfit)] mb-1">
          {greeting()} 👋
        </h1>
        <p className="text-foreground-muted">
          {currentTime && <span className="mr-2">{currentTime} ·</span>}
          {takenCount} of {totalCount} medications taken today
        </p>
      </div>

      {/* Quick Actions */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 transition-all duration-700 delay-100 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        {quickActions.map((action, i) => (
          <Link
            key={i}
            href={action.href}
            className="group glass-card-strong p-5 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300"
          >
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}
              style={{ boxShadow: `0 4px 16px ${action.shadowColor}` }}
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
        {/* Today's Schedule — Main Column */}
        <div
          className={`lg:col-span-2 glass-card-strong p-6 transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)]">
                Today&apos;s Schedule
              </h2>
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
              {/* Circular progress */}
              <div className="w-12 h-12 relative">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--card-border)"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="var(--med-teal-500)"
                    strokeWidth="3"
                    strokeDasharray={`${completionPct}, 100`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            {mockSchedule.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 cursor-pointer group ${
                  entry.taken
                    ? "bg-[var(--med-emerald-500)]/5 border border-[var(--med-emerald-500)]/20"
                    : "glass-card hover:border-[var(--med-teal-500)]/30"
                }`}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Time */}
                <div className="w-20 flex-shrink-0 text-right">
                  <div className="text-sm font-semibold">{entry.time}</div>
                  <div className="text-xs text-foreground-muted">{entry.label}</div>
                </div>

                {/* Timeline line */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full border-2 transition-all ${
                      entry.taken
                        ? "bg-[var(--med-emerald-500)] border-[var(--med-emerald-500)]"
                        : "border-[var(--med-slate-400)] group-hover:border-[var(--med-teal-500)]"
                    }`}
                  />
                </div>

                {/* Med info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className={`text-sm font-medium ${entry.taken ? "line-through text-foreground-muted" : ""}`}>
                      {entry.med}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {entry.taken ? (
                    <CheckCircleIcon className="w-5 h-5 text-[var(--med-emerald-500)]" />
                  ) : (
                    <ClockIcon className="w-5 h-5 text-foreground-muted group-hover:text-[var(--med-teal-500)] transition-colors" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Medications */}
          <div
            className={`glass-card-strong p-6 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)]">
                My Medications
              </h2>
              <Link href="/scan" className="btn-icon w-8 h-8">
                <PlusIcon className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {mockMedications.map((med, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl glass-card">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${med.color}20` }}
                  >
                    <PillIcon className="w-5 h-5" style={{ color: med.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{med.name}</div>
                    <div className="text-xs text-foreground-muted">
                      {med.dosage} · {med.form}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interaction Warnings */}
          {mockInteractions.length > 0 && (
            <div
              className={`glass-card-strong p-6 border-l-4 border-l-[var(--med-amber-500)] transition-all duration-700 delay-[400ms] ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangleIcon className="w-5 h-5 text-[var(--med-amber-500)]" />
                <h2 className="text-sm font-bold">Interaction Warning</h2>
              </div>
              {mockInteractions.map((interaction, i) => (
                <div key={i} className="text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-warning">
                      {interaction.severity}
                    </span>
                  </div>
                  <p className="text-foreground-muted text-xs leading-relaxed">
                    <strong>{interaction.drugA}</strong> + <strong>{interaction.drugB}</strong>:{" "}
                    {interaction.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Safety Disclaimer */}
          <div className="glass-card p-4 text-xs text-foreground-muted leading-relaxed">
            <p>
              ⚕️ <strong>Not medical advice.</strong> Always consult your healthcare provider before
              making changes to your medications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
