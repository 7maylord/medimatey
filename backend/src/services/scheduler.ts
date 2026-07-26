import { allMonitored, markAlertSent } from "../models/patientStore.ts";
import { findOverdue } from "./overdue.ts";
import { sendExpoPush } from "./push.ts";
import { config } from "../config.ts";

// ponytail: naive per-tick scan of every monitored patient. Fine for modest
// volume; index doses by time or use a queue if this ever gets big.

export function startScheduler(): void {
  setInterval(tick, config.tickMs);
  console.log(`scheduler: tick every ${config.tickMs / 1000}s, grace ${config.graceMs / 60000}min`);
}

// exported so a test can drive one pass without waiting for the interval
export async function tick(now = Date.now()): Promise<void> {
  for (const { patientId, caregiverTokens, doses } of allMonitored()) {
    for (const d of findOverdue(doses, now, config.graceMs)) {
      console.log(`alert → patient ${patientId}: missed ${d.medName} (due ${d.scheduledTime})`);
      await sendExpoPush(
        caregiverTokens,
        "⚠️ Missed medication",
        `A dose of ${d.medName} was not confirmed by the scheduled time.`
      );
      markAlertSent(patientId, d.doseId); // don't re-alert the same dose
    }
  }
}
