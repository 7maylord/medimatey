// Self-check for schedule cadence + idempotent IDs. Run: node src/lib/schedule-utils.test.mjs
// Mirrors the pure logic in schedule-utils.ts (isDueOn + deterministic id) so it
// runs without a bundler/IndexedDB. If this drifts from the .ts, fix the .ts.
import assert from "node:assert/strict";

const DAY_MS = 86_400_000;
const dayNumber = (iso) => Math.floor(new Date(`${iso}T00:00:00`).getTime() / DAY_MS);

function isDueOn(med, date) {
  const start = med.startDate?.split("T")[0];
  const end = med.endDate?.split("T")[0];
  if (start && date < start) return false;
  if (end && date > end) return false;
  switch (med.frequency) {
    case "as_needed": return false;
    case "every_other_day": return !start || (dayNumber(date) - dayNumber(start)) % 2 === 0;
    case "weekly": return !start || new Date(`${start}T00:00:00`).getDay() === new Date(`${date}T00:00:00`).getDay();
    default: return true;
  }
}
const entryId = (medId, date, time) => `${medId}:${date}:${time}`;

// once_daily: due every day within range
assert.equal(isDueOn({ frequency: "once_daily", startDate: "2026-07-20" }, "2026-07-25"), true);
// before start / after end
assert.equal(isDueOn({ frequency: "once_daily", startDate: "2026-07-20" }, "2026-07-19"), false);
assert.equal(isDueOn({ frequency: "once_daily", startDate: "2026-07-01", endDate: "2026-07-10" }, "2026-07-11"), false);
// as_needed never scheduled
assert.equal(isDueOn({ frequency: "as_needed" }, "2026-07-20"), false);
// every_other_day: on start day and +2, not +1
assert.equal(isDueOn({ frequency: "every_other_day", startDate: "2026-07-20" }, "2026-07-20"), true);
assert.equal(isDueOn({ frequency: "every_other_day", startDate: "2026-07-20" }, "2026-07-21"), false);
assert.equal(isDueOn({ frequency: "every_other_day", startDate: "2026-07-20" }, "2026-07-22"), true);
// weekly: same weekday only (2026-07-20 is a Monday)
assert.equal(isDueOn({ frequency: "weekly", startDate: "2026-07-20" }, "2026-07-27"), true);
assert.equal(isDueOn({ frequency: "weekly", startDate: "2026-07-20" }, "2026-07-26"), false);
// deterministic id → regenerating the same dose collides (idempotent, no dupes)
assert.equal(entryId("m1", "2026-07-20", "08:00"), entryId("m1", "2026-07-20", "08:00"));
assert.notEqual(entryId("m1", "2026-07-20", "08:00"), entryId("m1", "2026-07-21", "08:00"));

console.log("schedule-utils self-check passed");
