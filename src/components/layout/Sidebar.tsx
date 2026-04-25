"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// --- Icon Components ---
function HomeIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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

function BookIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <line x1="8" y1="7" x2="16" y2="7" />
      <line x1="8" y1="11" x2="13" y2="11" />
    </svg>
  );
}

function HeartPulseIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1112 6.006a5 5 0 017.5 6.572" />
    </svg>
  );
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HomeIcon },
  { href: "/scan", label: "Scan Pill", icon: CameraIcon },
  { href: "/schedule", label: "Schedule", icon: CalendarIcon },
  { href: "/journal", label: "Journal", icon: BookIcon },
];

interface AIStatus { isConnected: boolean; backend: "ollama" | "google-ai" | null; }

export default function Sidebar() {
  const pathname = usePathname();
  const [aiStatus, setAiStatus] = useState<AIStatus>({ isConnected: false, backend: null });

  useEffect(() => {
    fetch("/api/ai-status")
      .then((r) => r.json())
      .then((d) => setAiStatus({ isConnected: d.isConnected, backend: d.backend }))
      .catch(() => {});
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-sidebar-bg backdrop-blur-xl border-r border-[var(--card-border)] p-4 fixed left-0 top-0 z-30">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 px-3 py-2 mb-8">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-[var(--med-teal-500)]/20">
            <HeartPulseIcon className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold font-[family-name:var(--font-outfit)] tracking-tight">
            Medi<span className="text-[var(--med-teal-500)]">Mate</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-[var(--med-teal-500)]/10 text-[var(--med-teal-600)] dark:text-[var(--med-teal-400)]"
                    : "text-foreground-muted hover:bg-[var(--card-bg)] hover:text-foreground"
                }`}
              >
                <item.icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? "text-[var(--med-teal-500)]" : ""
                  }`}
                />
                {item.label}
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--med-teal-500)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* AI Status */}
        <div className="glass-card p-3 mt-4">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${aiStatus.isConnected ? "bg-[var(--med-emerald-500)] animate-pulse" : "bg-[var(--med-slate-400)]"}`} />
            <span className="text-xs font-semibold">AI Status</span>
          </div>
          <p className="text-xs text-foreground-muted">
            {aiStatus.isConnected
              ? aiStatus.backend === "ollama" ? "Gemma 4 · Local" : "Gemma 4 · Cloud"
              : "No backend connected"}
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-sidebar-bg backdrop-blur-xl border-t border-[var(--card-border)] px-2 py-2 safe-area-inset-bottom">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? "text-[var(--med-teal-500)]"
                    : "text-foreground-muted"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "scale-110" : ""} transition-transform`} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
