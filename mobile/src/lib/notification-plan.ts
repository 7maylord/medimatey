import type { ScheduleEntry } from "@/types";

export interface PlannedNotification {
  entryId: string;
  medicationName: string;
  dosage: string;
  fireAt: Date;
}

// Pure planner: pending future doses → notification list, soonest first.
// iOS caps scheduled locals at 64; default limit stays safely under it.
export function planNotifications(
  entries: ScheduleEntry[],
  now: Date,
  limit = 60
): PlannedNotification[] {
  return entries
    .filter((e) => !e.taken && !e.skipped)
    .map((e) => ({
      entryId: e.id,
      medicationName: e.medicationName,
      dosage: e.dosage,
      fireAt: new Date(`${e.date}T${e.scheduledTime}:00`), // no TZ suffix → local time
    }))
    .filter((p) => p.fireAt.getTime() > now.getTime())
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, limit);
}
