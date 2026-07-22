import type { Medication, MedicationFrequency, ScheduleEntry, TimeSlot } from "@/types";
import { saveScheduleEntry } from "@/lib/storage";

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

// ── Schedule entry generator ────────────────────────────────────────────────

export function buildScheduleEntries(med: Medication, date: string): ScheduleEntry[] {
  const slots = med.timeSlots?.length ? med.timeSlots : freqToTimeSlots(med.frequency);
  return slots.map((slot) => ({
    id: crypto.randomUUID(),
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

// Saves entries and returns the count saved (0 for as_needed).
export async function scheduleForToday(med: Medication): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const entries = buildScheduleEntries(med, today);
  await Promise.all(entries.map(saveScheduleEntry));
  return entries.length;
}
