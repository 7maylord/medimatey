"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

// --- Animated Icons (inline SVG components) ---

function PillIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h.008v.008H10.5v-.008zm0-4.5h.008v.008H10.5v-.008zm0-4.5h.008v.008H10.5V11.25z" />
    </svg>
  );
}

function ShieldIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
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
      <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
    </svg>
  );
}

function HeartPulseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1112 6.006a5 5 0 017.5 6.572" />
      <path d="M12 6v4l2 2" />
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

function WifiOffIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55" />
      <path d="M5 12.55a10.94 10.94 0 015.17-2.39" />
      <path d="M10.71 5.05A16 16 0 0122.56 9" />
      <path d="M1.42 9a15.91 15.91 0 014.7-2.88" />
      <path d="M8.53 16.11a6 6 0 016.95 0" />
      <line x1="12" y1="20" x2="12.01" y2="20" />
    </svg>
  );
}

function ArrowRightIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

// --- Feature Card Data ---

const features = [
  {
    icon: CameraIcon,
    title: "Scan Your Pills",
    description:
      "Point your camera at any pill bottle. AI reads the label, identifies the medication, dosage, and instructions instantly.",
    gradient: "from-[var(--med-teal-500)] to-[var(--med-teal-700)]",
    iconBg: "bg-[rgba(13,148,136,0.15)]",
    iconColor: "text-[var(--med-teal-500)]",
  },
  {
    icon: AlertTriangleIcon,
    title: "Interaction Checker",
    description:
      "Automatically detects dangerous drug-drug interactions across all your medications. Warns you before it's too late.",
    gradient: "from-[var(--med-coral-400)] to-[var(--med-coral-600)]",
    iconBg: "bg-[rgba(244,63,94,0.15)]",
    iconColor: "text-[var(--med-coral-500)]",
  },
  {
    icon: CalendarIcon,
    title: "Smart Scheduler",
    description:
      "Get a personalized daily medication schedule with voice reminders. Never miss a dose again.",
    gradient: "from-[var(--med-indigo-400)] to-[var(--med-indigo-500)]",
    iconBg: "bg-[rgba(99,102,241,0.15)]",
    iconColor: "text-[var(--med-indigo-500)]",
  },
  {
    icon: MicIcon,
    title: "Voice-First Journal",
    description:
      "Speak naturally about how you feel. AI summarizes your symptoms into structured entries for your doctor.",
    gradient: "from-[var(--med-amber-400)] to-[var(--med-amber-500)]",
    iconBg: "bg-[rgba(245,158,11,0.15)]",
    iconColor: "text-[var(--med-amber-500)]",
  },
];

const trustBadges = [
  { icon: WifiOffIcon, label: "100% Offline Capable" },
  { icon: ShieldIcon, label: "Privacy-First Design" },
  { icon: HeartPulseIcon, label: "Open Source" },
];

// --- Page Component ---

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />

      {/* Floating Decorative Orbs */}
      <div className="fixed top-20 left-10 w-72 h-72 rounded-full bg-[var(--med-teal-500)] opacity-[0.04] blur-3xl animate-float pointer-events-none" />
      <div className="fixed top-60 right-20 w-96 h-96 rounded-full bg-[var(--med-indigo-500)] opacity-[0.04] blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />
      <div className="fixed bottom-20 left-1/3 w-80 h-80 rounded-full bg-[var(--med-coral-400)] opacity-[0.03] blur-3xl animate-float pointer-events-none" style={{ animationDelay: "4s" }} />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-[var(--med-teal-500)]/20">
            <HeartPulseIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold font-[family-name:var(--font-outfit)] tracking-tight">
            Medi<span className="text-[var(--med-teal-500)]">Mate</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="btn-secondary text-sm px-5 py-2"
          >
            <span>Dashboard</span>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div
            className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm font-medium text-foreground-muted mb-8 transition-all duration-700 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <SparklesIcon className="w-4 h-4 text-[var(--med-teal-500)]" />
            <span>Powered by Gemma 4 AI — Runs on your device</span>
          </div>

          {/* Heading */}
          <h1
            className={`text-5xl md:text-7xl font-bold font-[family-name:var(--font-outfit)] leading-[1.1] tracking-tight mb-6 transition-all duration-700 delay-100 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Your Personal{" "}
            <span className="gradient-text">Medication</span>
            <br />
            Companion
          </h1>

          {/* Subtitle */}
          <p
            className={`text-lg md:text-xl text-foreground-muted max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            Scan pill bottles, check drug interactions, build smart schedules,
            and journal symptoms — all privately on your device. No internet required.
          </p>

          {/* CTAs */}
          <div
            className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <Link href="/dashboard" className="btn-primary text-base px-8 py-3.5 group">
              <span className="flex items-center gap-2">
                Get Started
                <ArrowRightIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link href="/scan" className="btn-secondary text-base px-8 py-3.5">
              <span className="flex items-center gap-2">
                <CameraIcon className="w-4 h-4" />
                Scan a Pill
              </span>
            </Link>
          </div>

          {/* Trust Badges */}
          <div
            className={`flex flex-wrap items-center justify-center gap-6 md:gap-10 transition-all duration-700 delay-[400ms] ${
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            {trustBadges.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-foreground-muted">
                <badge.icon className="w-4 h-4 text-[var(--med-teal-500)]" />
                <span className="text-sm font-medium">{badge.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Visual — Floating Pill Cards */}
        <div
          className={`mt-20 max-w-5xl mx-auto relative transition-all duration-1000 delay-500 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="glass-card-strong p-8 md:p-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {/* Mini stat cards */}
              {[
                { label: "Medications Tracked", value: "12", icon: PillIcon, color: "var(--med-teal-500)" },
                { label: "Interactions Checked", value: "48", icon: AlertTriangleIcon, color: "var(--med-coral-500)" },
                { label: "Doses On Time", value: "94%", icon: CalendarIcon, color: "var(--med-emerald-500)" },
                { label: "Journal Entries", value: "26", icon: HeartPulseIcon, color: "var(--med-indigo-500)" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="glass-card p-4 md:p-5 text-center group cursor-default animate-slide-up"
                  style={{ animationDelay: `${600 + i * 100}ms`, animationFillMode: "backwards" }}
                >
                  <div
                    className="w-10 h-10 mx-auto mb-3 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${stat.color}20` }}
                  >
                    <span style={{ color: stat.color }}>
                      <stat.icon className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-foreground-muted font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Fake Timeline Preview */}
            <div className="mt-8 pt-8 border-t border-[var(--card-border)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-2 h-2 rounded-full bg-[var(--med-emerald-500)] animate-pulse-glow" />
                <span className="text-sm font-semibold">Today&apos;s Schedule</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[
                  { time: "8:00 AM", med: "Metformin 500mg", taken: true },
                  { time: "12:00 PM", med: "Lisinopril 10mg", taken: true },
                  { time: "6:00 PM", med: "Metformin 500mg", taken: false },
                  { time: "10:00 PM", med: "Atorvastatin 20mg", taken: false },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex-shrink-0 glass-card px-4 py-3 flex items-center gap-3 min-w-[200px] ${
                      item.taken ? "border-[var(--med-emerald-400)]/30" : ""
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        item.taken
                          ? "bg-[var(--med-emerald-500)]/15 text-[var(--med-emerald-500)]"
                          : "bg-[var(--med-slate-200)] dark:bg-[var(--med-slate-700)] text-foreground-muted"
                      }`}
                    >
                      {item.taken ? "✓" : "○"}
                    </div>
                    <div>
                      <div className="text-xs text-foreground-muted">{item.time}</div>
                      <div className="text-sm font-medium">{item.med}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold font-[family-name:var(--font-outfit)] mb-4">
            Everything You Need,{" "}
            <span className="gradient-text">Right On Your Phone</span>
          </h2>
          <p className="text-foreground-muted text-lg max-w-2xl mx-auto">
            No cloud. No subscriptions. No data harvesting. Just intelligent medication management powered by on-device AI.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className="glass-card-strong p-8 group hover:scale-[1.01] transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${feature.iconBg} flex items-center justify-center mb-5 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-3">
                {feature.title}
              </h3>
              <p className="text-foreground-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Safety Disclaimer Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
        <div className="glass-card p-6 border-l-4 border-l-[var(--med-amber-500)]">
          <div className="flex items-start gap-3">
            <AlertTriangleIcon className="w-5 h-5 text-[var(--med-amber-500)] flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm mb-1">Important Medical Disclaimer</h4>
              <p className="text-sm text-foreground-muted leading-relaxed">
                MediMate is <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment.
                Always consult your healthcare provider before making changes to your medication routine.
                This tool provides general guidance only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[var(--card-border)] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <HeartPulseIcon className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold font-[family-name:var(--font-outfit)]">
              MediMate
            </span>
          </div>
          <p className="text-sm text-foreground-muted">
            Built with Gemma 4 for the Gemma 4 Good Hackathon · Open Source · Apache 2.0
          </p>
        </div>
      </footer>
    </div>
  );
}
