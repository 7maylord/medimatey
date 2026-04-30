"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, getProfile } from "@/lib/storage";
import { useReminders } from "@/hooks/useReminders";

const ONBOARDED_KEY = "medimate-onboarded";

function HeartPulseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1112 6.006a5 5 0 017.5 6.572" />
    </svg>
  );
}

function CameraIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
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

const STEPS = [
  { label: "Welcome" },
  { label: "Your Profile" },
  { label: "Add Medication" },
  { label: "Reminders" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const { supported, permission, enabled, enable } = useReminders();

  async function handleProfileSave() {
    const existing = await getProfile();
    await saveProfile({
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: name.trim() || undefined,
      age: age ? parseInt(age, 10) : undefined,
    });
    setStep(2);
  }

  function finish() {
    localStorage.setItem(ONBOARDED_KEY, "true");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background gradient-mesh flex flex-col items-center justify-center p-6">
      {/* Fixed decorative orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 rounded-full bg-[var(--med-teal-500)] opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-20 w-96 h-96 rounded-full bg-[var(--med-indigo-500)] opacity-[0.04] blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
            <HeartPulseIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-[family-name:var(--font-outfit)]">
            Medi<span className="text-[var(--med-teal-500)]">Mate</span>
          </span>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                i < step  ? "bg-[var(--med-teal-500)] text-white" :
                i === step ? "bg-[var(--med-teal-500)]/20 text-[var(--med-teal-500)] border border-[var(--med-teal-500)]" :
                "bg-[var(--card-border)] text-foreground-muted"
              }`}>
                {i < step ? <CheckIcon className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-8 rounded-full transition-all ${i < step ? "bg-[var(--med-teal-500)]" : "bg-[var(--card-border)]"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="glass-card-strong rounded-2xl p-8">

          {/* Step 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-[var(--med-teal-500)]/20">
                <HeartPulseIcon className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold font-[family-name:var(--font-outfit)] mb-3">
                Welcome to MediMate
              </h1>
              <p className="text-foreground-muted text-sm leading-relaxed mb-8">
                Your private, AI-powered medication companion. Everything stays on your device — no accounts, no cloud, no tracking.
              </p>
              <ul className="text-sm text-left space-y-3 mb-8">
                {[
                  "Scan pill bottles with your camera",
                  "Check for dangerous drug interactions",
                  "Get reminders when doses are due",
                  "Journal symptoms and export a doctor report",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[var(--med-teal-500)]/10 flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="w-3 h-3 text-[var(--med-teal-500)]" />
                    </div>
                    <span className="text-foreground-muted">{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={() => setStep(1)} className="btn-primary w-full py-3 text-sm">
                Get Started
              </button>
            </div>
          )}

          {/* Step 1 — Profile */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-1">Your Profile</h2>
              <p className="text-foreground-muted text-sm mb-6">Stored only on this device. Used on your doctor report.</p>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Your Name</span>
                  <input
                    type="text"
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl glass-card text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--med-teal-500)] bg-transparent"
                    placeholder="e.g. Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleProfileSave()}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Age <span className="font-normal">(optional)</span></span>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    className="w-full px-4 py-2.5 rounded-xl glass-card text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--med-teal-500)] bg-transparent"
                    placeholder="e.g. 54"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                  />
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={handleProfileSave} className="btn-primary flex-1 py-2.5 text-sm">
                  {name.trim() ? "Save & Continue" : "Skip"}
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — Add medication */}
          {step === 2 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--med-teal-500)]/10 flex items-center justify-center">
                <CameraIcon className="w-8 h-8 text-[var(--med-teal-500)]" />
              </div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-2">Add Your First Medication</h2>
              <p className="text-foreground-muted text-sm leading-relaxed mb-8">
                Point your camera at a pill bottle label and Gemma 4 AI will read it for you — or skip and add medications later.
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    localStorage.setItem(ONBOARDED_KEY, "true");
                    router.push("/scan?from=onboarding");
                  }}
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2"
                >
                  <CameraIcon className="w-4 h-4" />
                  Scan a Pill Bottle
                </button>
                <button onClick={() => setStep(3)} className="btn-secondary w-full py-2.5 text-sm">
                  Skip for Now
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Reminders */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--med-indigo-500)]/10 flex items-center justify-center">
                <BellIcon className="w-8 h-8 text-[var(--med-indigo-500)]" />
              </div>
              <h2 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-2">Dose Reminders</h2>
              <p className="text-foreground-muted text-sm leading-relaxed mb-8">
                Get a browser notification when each dose is due. Works even when MediMate is in the background on your phone.
              </p>
              <div className="flex flex-col gap-3">
                {!supported ? (
                  <p className="text-xs text-foreground-muted mb-4">Your browser doesn&apos;t support notifications.</p>
                ) : permission === "denied" ? (
                  <p className="text-xs text-foreground-muted mb-4">Notifications are blocked. You can enable them later in browser settings.</p>
                ) : enabled ? (
                  <div className="flex items-center justify-center gap-2 text-[var(--med-emerald-500)] text-sm font-medium mb-4">
                    <CheckIcon className="w-4 h-4" />
                    Reminders enabled!
                  </div>
                ) : (
                  <button onClick={enable} className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2">
                    <BellIcon className="w-4 h-4" />
                    Enable Reminders
                  </button>
                )}
                <button onClick={finish} className="btn-secondary w-full py-2.5 text-sm">
                  {enabled ? "Go to Dashboard" : "Skip for Now"}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Skip all */}
        {step > 0 && step < 3 && (
          <button onClick={finish} className="mt-4 w-full text-xs text-foreground-muted hover:text-foreground transition-colors py-2">
            Skip setup and go to dashboard
          </button>
        )}
      </div>
    </div>
  );
}
