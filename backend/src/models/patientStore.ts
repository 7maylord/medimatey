import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import type { Patient, MonitoredDose } from "./types.ts";
import { config } from "../config.ts";

// ponytail: JSON-file store, single process, in-memory with debounced flush.
// Ceiling: fine for modest volume / one instance; swap for SQLite/Postgres to scale.

interface DB { patients: Record<string, Patient>; }

const FILE: string | URL = config.dataFile ?? new URL("../../data.json", import.meta.url);

let db: DB = { patients: {} };
if (existsSync(FILE)) {
  try { db = JSON.parse(readFileSync(FILE, "utf8")) as DB; } catch { /* corrupt → start fresh */ }
}

let flushTimer: ReturnType<typeof setTimeout> | null = null;
function persist(): void {
  if (flushTimer) return; // debounce: coalesce bursts into one write
  flushTimer = setTimeout(() => {
    flushTimer = null;
    writeFileSync(FILE, JSON.stringify(db));
  }, 500);
}

const secret = (): string => randomBytes(16).toString("hex");
const pairingCode = (): string => randomBytes(5).toString("hex").slice(0, 8).toUpperCase();
const CODE_TTL_MS = 15 * 60 * 1000;

export function createPatient(): { patientId: string; pairingCode: string } {
  const patientId = secret();
  const code = pairingCode();
  db.patients[patientId] = {
    patientId, pairingCode: code, pairingExpires: Date.now() + CODE_TTL_MS,
    caregiverTokens: [], doses: {},
  };
  persist();
  return { patientId, pairingCode: code };
}

export function patientExists(patientId: string): boolean {
  return patientId in db.patients;
}

export function newPairingCode(patientId: string): string | null {
  const p = db.patients[patientId];
  if (!p) return null;
  p.pairingCode = pairingCode();
  p.pairingExpires = Date.now() + CODE_TTL_MS;
  persist();
  return p.pairingCode;
}

export function linkCaregiver(code: string, expoPushToken: string): boolean {
  const p = Object.values(db.patients).find(
    (x) => x.pairingCode === code && (x.pairingExpires ?? 0) > Date.now()
  );
  if (!p) return false;
  if (!p.caregiverTokens.includes(expoPushToken)) p.caregiverTokens.push(expoPushToken);
  p.pairingCode = null; // single-use
  p.pairingExpires = null;
  persist();
  return true;
}

// Patient uploads only the doses it chooses to watch. Upsert by doseId; alertSent
// is preserved across syncs so a taken/re-synced dose isn't re-alerted.
export function syncDoses(
  patientId: string,
  incoming: Array<Pick<MonitoredDose, "doseId" | "medName" | "scheduledTime" | "taken" | "critical">>
): boolean {
  const p = db.patients[patientId];
  if (!p) return false;
  for (const d of incoming) {
    p.doses[d.doseId] = {
      doseId: d.doseId, medName: d.medName, scheduledTime: d.scheduledTime,
      taken: d.taken, critical: d.critical,
      alertSent: p.doses[d.doseId]?.alertSent ?? false,
    };
  }
  const cutoff = Date.now() - 2 * 86_400_000; // prune doses older than 2 days
  for (const [id, d] of Object.entries(p.doses)) {
    if (Date.parse(d.scheduledTime) < cutoff) delete p.doses[id];
  }
  persist();
  return true;
}

export function markTaken(patientId: string, doseId: string): boolean {
  const d = db.patients[patientId]?.doses[doseId];
  if (!d) return false;
  d.taken = true;
  persist();
  return true;
}

export function allMonitored(): Array<{ patientId: string; caregiverTokens: string[]; doses: MonitoredDose[] }> {
  return Object.values(db.patients)
    .filter((p) => p.caregiverTokens.length > 0)
    .map((p) => ({ patientId: p.patientId, caregiverTokens: p.caregiverTokens, doses: Object.values(p.doses) }));
}

export function markAlertSent(patientId: string, doseId: string): void {
  const d = db.patients[patientId]?.doses[doseId];
  if (d) { d.alertSent = true; persist(); }
}
