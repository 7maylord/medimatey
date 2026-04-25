"use client";

import { useState, useEffect } from "react";
import { exportAllData } from "@/lib/storage";
import { checkInteractions } from "@/lib/drug-data";
import type { Medication, JournalEntry, DrugInteraction } from "@/types";

interface ReportData {
  medications: Medication[];
  journal: JournalEntry[];
  interactions: DrugInteraction[];
  generatedAt: string;
  patientName?: string;
}

function PrintIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  );
}

function ArrowLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

const SEVERITY_COLORS: Record<string, string> = {
  minor: "#10b981",
  moderate: "#f59e0b",
  major: "#f43f5e",
  contraindicated: "#7c3aed",
};

const MOOD_LABELS: Record<string, string> = {
  great: "Great 😊", good: "Good 🙂", okay: "Okay 😐", poor: "Poor 😔", bad: "Bad 😞",
};

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    exportAllData().then(({ medications, journal, profile }) => {
      const interactions =
        medications.length >= 2
          ? checkInteractions(medications.map((m) => m.name)).interactions
          : [];
      setData({
        medications,
        journal,
        interactions,
        generatedAt: new Date().toLocaleString("en-US", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        }),
        patientName: profile?.name,
      });
      setLoading(false);
    });
  }, []);

  const takenLast7Days = data?.journal.filter((e) => {
    const date = new Date(e.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    return date >= cutoff;
  }).length ?? 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-foreground-muted">Generating report…</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      {/* Screen-only controls */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-b border-[var(--card-border)] px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="btn-secondary flex items-center gap-2 text-sm py-2 px-4"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-sm font-semibold">Doctor Report Preview</h1>
        <button
          onClick={() => window.print()}
          className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
        >
          <PrintIcon className="w-4 h-4" />
          Print / Save PDF
        </button>
      </div>

      {/* Report content */}
      <div className="max-w-3xl mx-auto px-8 py-12 print:py-0 print:px-0 mt-16 print:mt-0">

        {/* Header */}
        <div className="border-b-2 border-[#14b8a6] pb-6 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a] print:text-black">
                MediMate — Medication Report
              </h1>
              {data.patientName && (
                <p className="text-base text-gray-600 mt-1">Patient: <strong>{data.patientName}</strong></p>
              )}
              <p className="text-sm text-gray-500 mt-1">Generated: {data.generatedAt}</p>
            </div>
            <div className="text-right text-xs text-gray-400">
              <p>MediMate v1.0</p>
              <p>AI-Powered Medication Companion</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            ⚕️ <strong>Not medical advice.</strong> This report is for informational purposes only.
            Always consult a qualified healthcare provider for medical decisions.
          </div>
        </div>

        {/* Medications */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#0f172a] print:text-black mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#14b8a6] text-white text-xs flex items-center justify-center font-bold">1</span>
            Current Medications ({data.medications.length})
          </h2>

          {data.medications.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No medications recorded.</p>
          ) : (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 print:bg-gray-100">
                  <th className="text-left p-3 border border-gray-200 font-semibold">Medication</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Dosage</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Form</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Frequency</th>
                  <th className="text-left p-3 border border-gray-200 font-semibold">Start Date</th>
                </tr>
              </thead>
              <tbody>
                {data.medications.map((med, i) => (
                  <tr key={med.id} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className="p-3 border border-gray-200">
                      <div className="font-semibold">{med.name}</div>
                      {med.genericName && <div className="text-gray-500 text-xs">{med.genericName}</div>}
                    </td>
                    <td className="p-3 border border-gray-200">{med.dosage}</td>
                    <td className="p-3 border border-gray-200 capitalize">{med.form}</td>
                    <td className="p-3 border border-gray-200 capitalize">{med.frequency.replace(/_/g, " ")}</td>
                    <td className="p-3 border border-gray-200">{med.startDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Drug Interactions */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#0f172a] print:text-black mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#f59e0b] text-white text-xs flex items-center justify-center font-bold">2</span>
            Drug Interaction Alerts ({data.interactions.length})
          </h2>

          {data.interactions.length === 0 ? (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded p-3">
              ✓ No known interactions detected among current medications.
            </p>
          ) : (
            <div className="space-y-3">
              {data.interactions.map((interaction, i) => (
                <div key={i} className="border rounded p-4" style={{ borderLeftWidth: 4, borderLeftColor: SEVERITY_COLORS[interaction.severity] ?? "#64748b" }}>
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded uppercase"
                      style={{
                        backgroundColor: `${SEVERITY_COLORS[interaction.severity]}20`,
                        color: SEVERITY_COLORS[interaction.severity],
                      }}
                    >
                      {interaction.severity}
                    </span>
                    <span className="font-semibold text-sm">
                      {interaction.drugA} + {interaction.drugB}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{interaction.description}</p>
                  <p className="text-sm font-medium text-gray-700">
                    <strong>Recommendation:</strong> {interaction.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Symptom Journal Summary */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-[#0f172a] print:text-black mb-2 flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-[#6366f1] text-white text-xs flex items-center justify-center font-bold">3</span>
            Symptom Journal
          </h2>
          <p className="text-sm text-gray-500 mb-4">{takenLast7Days} entries in the last 7 days · {data.journal.length} total</p>

          {data.journal.length === 0 ? (
            <p className="text-gray-500 text-sm italic">No journal entries recorded.</p>
          ) : (
            <div className="space-y-4">
              {data.journal.slice(0, 10).map((entry) => (
                <div key={entry.id} className="border border-gray-200 rounded p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">
                      {new Date(entry.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-xs text-gray-500">{MOOD_LABELS[entry.mood] ?? entry.mood}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{entry.summary}</p>
                  {entry.symptoms.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.symptoms.map((s, si) => (
                        <span key={si} className="text-xs bg-gray-100 border border-gray-200 rounded px-2 py-1">
                          {s.name} — severity {s.severity}/5
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {data.journal.length > 10 && (
                <p className="text-xs text-gray-400 text-center">
                  Showing 10 of {data.journal.length} entries. Print from the journal page to see all.
                </p>
              )}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 text-xs text-gray-400 text-center">
          <p>Generated by MediMate · Powered by Gemma 4 AI · Data stored locally on device</p>
          <p className="mt-1">This report does not replace professional medical advice. Consult your healthcare provider.</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: white; color: black; }
          .print\\:hidden { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </>
  );
}
