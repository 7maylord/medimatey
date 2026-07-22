"use client";

import { useState, useEffect, useRef } from "react";
import { getProfile, saveProfile, exportBackup, importBackup } from "@/lib/storage";
import type { UserProfile } from "@/types";

const INPUT_CLS =
  "w-full px-4 py-2.5 rounded-xl glass-card text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--med-teal-500)] bg-transparent";

function SaveIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
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

interface FormState {
  name: string;
  age: string;
  allergies: string;
  conditions: string;
  ecName: string;
  ecPhone: string;
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>({
    name: "", age: "", allergies: "", conditions: "", ecName: "", ecPhone: "",
  });
  const [saved, setSaved] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const [dataMsg, setDataMsg] = useState<string | null>(null);

  async function handleExport() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medimate-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    if (!confirm("Restoring will REPLACE all current medications, schedule, and journal on this device. Continue?")) return;
    try {
      const data = JSON.parse(await file.text());
      await importBackup(data);
      setDataMsg("Backup restored. Reloading…");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setDataMsg(err instanceof Error ? err.message : "Import failed.");
    }
  }

  useEffect(() => {
    getProfile().then((p) => {
      if (!p) return;
      setForm({
        name: p.name ?? "",
        age: p.age != null ? String(p.age) : "",
        allergies: (p.allergies ?? []).join(", "),
        conditions: (p.conditions ?? []).join(", "),
        ecName: p.emergencyContact?.name ?? "",
        ecPhone: p.emergencyContact?.phone ?? "",
      });
    });
  }, []);

  function field(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSave() {
    const existing = await getProfile();
    const profile: UserProfile = {
      id: existing?.id ?? crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: form.name.trim() || undefined,
      age: form.age ? parseInt(form.age, 10) : undefined,
      allergies: form.allergies.split(",").map((s) => s.trim()).filter(Boolean),
      conditions: form.conditions.split(",").map((s) => s.trim()).filter(Boolean),
      emergencyContact:
        form.ecName || form.ecPhone
          ? { name: form.ecName.trim(), phone: form.ecPhone.trim() }
          : undefined,
    };
    await saveProfile(profile);
    setSaved(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-(family-name:--font-outfit) mb-1">Settings</h1>
        <p className="text-foreground-muted text-sm">Your profile is stored only on this device.</p>
      </div>

      <div className="glass-card-strong p-6 space-y-5">
        <h2 className="text-base font-semibold">Patient Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Full Name</span>
            <input type="text" className={INPUT_CLS} placeholder="e.g. Jane Smith"
              value={form.name} onChange={field("name")} />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Age</span>
            <input type="number" min="0" max="120" className={INPUT_CLS} placeholder="e.g. 54"
              value={form.age} onChange={field("age")} />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Known Allergies</span>
          <input type="text" className={INPUT_CLS}
            placeholder="e.g. Penicillin, Sulfa drugs (comma-separated)"
            value={form.allergies} onChange={field("allergies")} />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Medical Conditions</span>
          <input type="text" className={INPUT_CLS}
            placeholder="e.g. Type 2 Diabetes, Hypertension (comma-separated)"
            value={form.conditions} onChange={field("conditions")} />
        </label>

        <div>
          <span className="text-sm font-medium text-foreground-muted mb-1.5 block">Emergency Contact</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input type="text" className={INPUT_CLS} placeholder="Contact name"
              value={form.ecName} onChange={field("ecName")} />
            <input type="tel" className={INPUT_CLS} placeholder="+1 555 0100"
              value={form.ecPhone} onChange={field("ecPhone")} />
          </div>
        </div>

        <button
          onClick={handleSave}
          className={`btn-primary flex items-center gap-2 text-sm py-2.5 px-5 transition-all ${saved ? "bg-med-emerald-500!" : ""}`}
        >
          {saved ? (
            <><CheckIcon className="w-4 h-4" />Saved!</>
          ) : (
            <><SaveIcon className="w-4 h-4" />Save Profile</>
          )}
        </button>
      </div>

      {/* Backup & Restore */}
      <div className="glass-card-strong p-6 mt-6 space-y-3">
        <h2 className="text-base font-semibold">Backup &amp; Restore</h2>
        <p className="text-xs text-foreground-muted leading-relaxed">
          Your data lives only in this browser — clearing browser data erases it. Export a backup
          file to keep a copy or move to another device, then restore it here.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleExport} className="btn-secondary text-sm py-2.5 px-5">
            Export backup
          </button>
          <button onClick={() => fileInput.current?.click()} className="btn-secondary text-sm py-2.5 px-5">
            Restore from file
          </button>
          <input ref={fileInput} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
        </div>
        {dataMsg && <p className="text-xs text-med-teal-500 font-medium">{dataMsg}</p>}
      </div>

      <div className="glass-card p-4 mt-6 text-xs text-foreground-muted leading-relaxed">
        ⚕️ <strong>Privacy Notice:</strong> All data is stored locally in your browser&apos;s IndexedDB.
        Nothing is sent to any server. Clearing browser data will erase your profile.
      </div>
    </div>
  );
}
