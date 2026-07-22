import type { Medication, MedicationFrequency, ScheduleEntry, TimeSlot } from "@/types";
import { getMedications, getScheduleForDate, saveScheduleEntry } from "@/lib/storage";

// ── Frequency normaliser ────────────────────────────────────────────────────
// Maps raw AI strings ("twice daily", "BID", "every 12 hrs") → enum value.

export function parseFrequency(raw: string | undefined): MedicationFrequency {
  if (!raw) return "once_daily";
  const s = raw.toLowerCase().trim();

  if (/four|4\s*x|qid|every\s*6\s*h/.test(s))           return "four_times_daily";
  if (/three|3\s*x|tid|every\s*8\s*h/.test(s))           return "three_times_daily";
  if (/twice|2\s*x|bid|every\s*12\s*h|two\s*times/.test(s)) return "twice_daily";
  if (/once\s*daily|1\s*x|once\s*a\s*day|^daily$|once$/.test(s)) return "once_daily";
  if (/every\s*other|alternate/.test(s))                  return "every_other_day";
  if (/week/.test(s))                                     return "weekly";
  if (/as\s*need|prn/.test(s))                            return "as_needed";

  return "once_daily";
}

// ── Default time slots per frequency ───────────────────────────────────────

const FREQ_SLOTS: Record<MedicationFrequency, TimeSlot[]> = {
  once_daily:        [{ time: "08:00", label: "morning" }],
  twice_daily:       [{ time: "08:00", label: "morning" },
                      { time: "20:00", label: "evening" }],
  three_times_daily: [{ time: "08:00", label: "morning" },
                      { time: "13:00", label: "afternoon" },
                      { time: "20:00", label: "evening" }],
  four_times_daily:  [{ time: "08:00", label: "morning" },
                      { time: "12:00", label: "afternoon" },
                      { time: "17:00", label: "evening" },
                      { time: "21:00", label: "bedtime" }],
  every_other_day:   [{ time: "08:00", label: "morning" }],
  weekly:            [{ time: "08:00", label: "morning" }],
  as_needed:         [],
  custom:            [{ time: "08:00", label: "morning" }],
};

export function freqToTimeSlots(freq: MedicationFrequency): TimeSlot[] {
  return FREQ_SLOTS[freq] ?? [{ time: "08:00", label: "morning" }];
}

// ── Cadence: is a medication due on a given date? ───────────────────────────

const DAY_MS = 86_400_000;
function dayNumber(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00`).getTime() / DAY_MS);
}

export function isDueOn(med: Medication, date: string): boolean {
  const start = med.startDate?.split("T")[0];
  const end = med.endDate?.split("T")[0];
  if (start && date < start) return false;
  if (end && date > end) return false;

  switch (med.frequency) {
    case "as_needed":
      return false;
    case "every_other_day":
      return !start || (dayNumber(date) - dayNumber(start)) % 2 === 0;
    case "weekly":
      return !start || new Date(`${start}T00:00:00`).getDay() === new Date(`${date}T00:00:00`).getDay();
    default:
      return true;
  }
}

// ── Schedule entry generator ────────────────────────────────────────────────
// IDs are deterministic per (med, date, time) so regeneration is idempotent —
// re-running never creates duplicate doses and never clobbers `taken` state.

export function buildScheduleEntries(med: Medication, date: string): ScheduleEntry[] {
  if (!isDueOn(med, date)) return [];
  const slots = med.timeSlots?.length ? med.timeSlots : freqToTimeSlots(med.frequency);
  return slots.map((slot) => ({
    id: `${med.id}:${date}:${slot.time}`,
    medicationId:   med.id,
    medicationName: med.name,
    dosage:         med.dosage,
    scheduledTime:  slot.time,
    timeLabel:      slot.label,
    taken:    false,
    skipped:  false,
    date,
  }));
}

// Persists only entries that don't already exist for the date, preserving the
// taken/skipped state of any that do. Returns the number newly created.
async function saveMissing(entries: ScheduleEntry[], date: string): Promise<number> {
  const existing = await getScheduleForDate(date);
  const have = new Set(existing.map((e) => e.id));
  const missing = entries.filter((e) => !have.has(e.id));
  await Promise.all(missing.map(saveScheduleEntry));
  return missing.length;
}

// Materialize one medication's doses for today. Returns count saved (0 for as_needed).
export async function scheduleForToday(med: Medication): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  return saveMissing(buildScheduleEntries(med, today), today);
}

// Materialize every active medication's doses for a date. Idempotent — safe to
// call on every app load / day rollover.
export async function ensureScheduleForDate(date: string): Promise<number> {
  const meds = await getMedications();
  const entries = meds.flatMap((m) => buildScheduleEntries(m, date));
  return saveMissing(entries, date);
}
