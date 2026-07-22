"use client";

import { useState, useEffect } from "react";
import { getAllScheduleEntries } from "@/lib/storage";
import type { ScheduleEntry } from "@/types";

// ── helpers ────────────────────────────────────────────────────────────────

function dateRange(days: number): string[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    return d.toISOString().split("T")[0];
  });
}

function rateColor(rate: number) {
  if (rate >= 0.8)  return { bar: "var(--med-emerald-500)", label: "text-[var(--med-emerald-500)]" };
  if (rate >= 0.5)  return { bar: "var(--med-amber-500)",   label: "text-[var(--med-amber-500)]" };
  return              { bar: "var(--med-coral-500)",         label: "text-[var(--med-coral-500)]" };
}

function fmtDate(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function fmtShort(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric" });
}

interface DayStat { date: string; taken: number; total: number; rate: number; }
interface MedStat  { name: string; taken: number; total: number; rate: number; }

// ── icons ──────────────────────────────────────────────────────────────────

function FlameIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 01-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
    </svg>
  );
}

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// ── page ───────────────────────────────────────────────────────────────────

export default function AdherencePage() {
  const [window7,  setWindow7]  = useState<DayStat[]>([]);
  const [window30, setWindow30] = useState<DayStat[]>([]);
  const [byMed,    setByMed]    = useState<MedStat[]>([]);
  const [streak,   setStreak]   = useState(0);
  const [view,     setView]     = useState<7 | 30>(7);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getAllScheduleEntries().then((all: ScheduleEntry[]) => {
      const byDate = new Map<string, ScheduleEntry[]>();
      for (const e of all) {
        const arr = byDate.get(e.date) ?? [];
        arr.push(e);
        byDate.set(e.date, arr);
      }

      function buildWindow(days: number): DayStat[] {
        return dateRange(days).map((date) => {
          const entries = byDate.get(date) ?? [];
          const taken = entries.filter((e) => e.taken).length;
          const total = entries.length;
          return { date, taken, total, rate: total > 0 ? taken / total : -1 };
        });
      }

      const w7  = buildWindow(7);
      const w30 = buildWindow(30);
      setWindow7(w7);
      setWindow30(w30);

      // Streak: consecutive days (backwards from yesterday) with rate >= 0.8
      let s = 0;
      const todayISO = new Date().toISOString().split("T")[0];
      const days30 = dateRange(30).reverse().filter((d) => d !== todayISO);
      for (const d of days30) {
        const entries = byDate.get(d) ?? [];
        if (entries.length === 0) break;
        const r = entries.filter((e) => e.taken).length / entries.length;
        if (r >= 0.8) s++; else break;
      }
      setStreak(s);

      // Per-medication breakdown (last 30 days)
      const medMap = new Map<string, { taken: number; total: number }>();
      for (const e of all) {
        if (!w30.some((d) => d.date === e.date)) continue; // outside window
        const cur = medMap.get(e.medicationName) ?? { taken: 0, total: 0 };
        cur.total++;
        if (e.taken) cur.taken++;
        medMap.set(e.medicationName, cur);
      }
      const meds: MedStat[] = Array.from(medMap.entries())
        .map(([name, { taken, total }]) => ({ name, taken, total, rate: taken / total }))
        .sort((a, b) => b.total - a.total);
      setByMed(meds);
      setLoading(false);
    });
  }, []);

  const days = view === 7 ? window7 : window30;
  const withData = days.filter((d) => d.total > 0);
  const overallRate = withData.length
    ? withData.reduce((s, d) => s + d.taken, 0) / withData.reduce((s, d) => s + d.total, 0)
    : null;
  const totalTaken  = days.reduce((s, d) => s + d.taken, 0);
  const totalMissed = days.reduce((s, d) => s + Math.max(0, d.total - d.taken), 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground-muted text-sm">Loading adherence data…</div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1">Adherence</h1>
          <p className="text-foreground-muted text-sm">How consistently you&apos;ve been taking your medications</p>
        </div>
        <div className="flex items-center gap-1 glass-card p-1 rounded-xl">
          {([7, 30] as const).map((n) => (
            <button
              key={n}
              onClick={() => setView(n)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === n ? "bg-[var(--med-teal-500)] text-white" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {n}d
            </button>
          ))}
        </div>
      </div>

      {withData.length === 0 ? (
        <div className="glass-card-strong p-12 text-center">
          <p className="text-foreground-muted text-sm">No schedule data yet. Start marking doses on the Schedule page.</p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Overall Rate",
                value: overallRate != null ? `${Math.round(overallRate * 100)}%` : "—",
                sub: `last ${view} days`,
                color: overallRate != null ? rateColor(overallRate).label : "text-foreground-muted",
              },
              {
                label: "Streak",
                value: `${streak}d`,
                sub: "consecutive days ≥80%",
                color: streak >= 3 ? "text-[var(--med-emerald-500)]" : "text-foreground-muted",
                icon: streak >= 3 ? <FlameIcon className="w-4 h-4 inline mr-1" /> : null,
              },
              {
                label: "Doses Taken",
                value: String(totalTaken),
                sub: `last ${view} days`,
                color: "text-[var(--med-emerald-500)]",
              },
              {
                label: "Doses Missed",
                value: String(totalMissed),
                sub: `last ${view} days`,
                color: totalMissed > 0 ? "text-[var(--med-coral-500)]" : "text-foreground-muted",
              },
            ].map((s, i) => (
              <div key={i} className="glass-card-strong p-4 text-center">
                <div className={`text-2xl font-bold font-[family-name:var(--font-outfit)] mb-1 ${s.color}`}>
                  {s.icon}{s.value}
                </div>
                <div className="text-xs font-medium mb-0.5">{s.label}</div>
                <div className="text-xs text-foreground-muted">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="glass-card-strong p-6 mb-8">
            <h2 className="text-base font-semibold mb-6">Daily Adherence</h2>
            <div className="flex items-end gap-1 sm:gap-2 h-32">
              {days.map((d) => {
                const hasData = d.total > 0;
                const pct     = hasData ? Math.round(d.rate * 100) : 0;
                const col     = hasData ? rateColor(d.rate) : { bar: "var(--card-border)", label: "" };
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-lg px-2 py-1 text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                      <p className="font-semibold">{fmtDate(d.date)}</p>
                      {hasData ? <p>{d.taken}/{d.total} doses · {pct}%</p> : <p>No doses scheduled</p>}
                    </div>
                    {/* Bar */}
                    <div className="w-full rounded-t-sm transition-all duration-500" style={{
                      height: hasData ? `${Math.max(pct, 4)}%` : "4%",
                      backgroundColor: col.bar,
                      opacity: hasData ? 1 : 0.2,
                    }} />
                    <span className="text-[10px] text-foreground-muted hidden sm:block">
                      {fmtShort(d.date).split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 text-xs text-foreground-muted">
              {[
                { color: "var(--med-emerald-500)", label: "≥80% taken" },
                { color: "var(--med-amber-500)",   label: "50–79%" },
                { color: "var(--med-coral-500)",   label: "<50%" },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* Per-medication */}
          {byMed.length > 0 && (
            <div className="glass-card-strong p-6">
              <h2 className="text-base font-semibold mb-4">By Medication (last 30 days)</h2>
              <div className="space-y-4">
                {byMed.map((m) => {
                  const pct = Math.round(m.rate * 100);
                  const col = rateColor(m.rate);
                  return (
                    <div key={m.name}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium">{m.name}</span>
                        <div className="flex items-center gap-3 text-xs text-foreground-muted">
                          <span className="flex items-center gap-1 text-[var(--med-emerald-500)]">
                            <CheckIcon className="w-3.5 h-3.5" />{m.taken}
                          </span>
                          <span className="flex items-center gap-1 text-[var(--med-coral-500)]">
                            <XCircleIcon className="w-3.5 h-3.5" />{m.total - m.taken}
                          </span>
                          <span className={`font-semibold ${col.label}`}>{pct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--card-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: col.bar }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
