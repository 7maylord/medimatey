// Self-check for the notification planner. Run: node src/lib/notification-plan.test.mjs
// Mirrors the pure logic in notification-plan.ts. If this drifts from the .ts, fix the .ts.
import assert from "node:assert/strict";

function planNotifications(entries, now, limit = 60) {
  return entries
    .filter((e) => !e.taken && !e.skipped)
    .map((e) => ({
      entryId: e.id, medicationName: e.medicationName, dosage: e.dosage,
      fireAt: new Date(`${e.date}T${e.scheduledTime}:00`), // no TZ suffix → local time
    }))
    .filter((p) => p.fireAt.getTime() > now.getTime())
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, limit);
}

const now = new Date("2026-07-22T12:00:00");
const mk = (id, date, time, extra = {}) => ({
  id, medicationId: "m1", medicationName: "Metformin", dosage: "500mg",
  scheduledTime: time, timeLabel: "morning", taken: false, skipped: false, date, ...extra,
});

// past dose excluded, future included
let plan = planNotifications([mk("a", "2026-07-22", "08:00"), mk("b", "2026-07-22", "20:00")], now);
assert.equal(plan.length, 1);
assert.equal(plan[0].entryId, "b");
// taken/skipped excluded
plan = planNotifications([mk("a", "2026-07-22", "20:00", { taken: true }), mk("b", "2026-07-22", "21:00", { skipped: true })], now);
assert.equal(plan.length, 0);
// sorted ascending across days, limit respected
plan = planNotifications([mk("late", "2026-07-23", "08:00"), mk("soon", "2026-07-22", "13:00")], now, 1);
assert.equal(plan.length, 1);
assert.equal(plan[0].entryId, "soon");

console.log("notification-plan self-check passed");
