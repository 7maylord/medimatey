import type { MonitoredDose } from "../models/types.ts";

// Pure miss-detection — the money path, unit-tested in overdue.test.mjs.
// A dose earns a caregiver alert when it is critical, still unconfirmed, not
// already alerted, and now past its grace window.
export function findOverdue<T extends MonitoredDose>(doses: T[], now: number, graceMs: number): T[] {
  return doses.filter(
    (d) => d.critical && !d.taken && !d.alertSent && now - Date.parse(d.scheduledTime) > graceMs
  );
}
