import type { Medication, MedicationFrequency, ScheduleEntry, TimeSlot } from "@/types";

// Pure port of frontend/src/lib/schedule-utils.ts — cadence + generation only.
// The persistence half (scheduleForToday / ensureScheduleForDate) lands with the
// expo-sqlite storage layer in milestone 1.

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
