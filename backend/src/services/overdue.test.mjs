// Self-check for miss-detection. Run: node src/services/overdue.test.mjs
// Mirrors the pure logic in overdue.ts. If this drifts from the .ts, fix the .ts.
import assert from "node:assert/strict";

function findOverdue(doses, now, graceMs) {
  return doses.filter(
    (d) => d.critical && !d.taken && !d.alertSent && now - Date.parse(d.scheduledTime) > graceMs
  );
}

const now = Date.parse("2026-07-25T12:00:00Z");
const grace = 30 * 60 * 1000;
const mk = (o) => ({
  doseId: "d", medName: "Warfarin", scheduledTime: "2026-07-25T11:00:00Z",
  taken: false, critical: true, alertSent: false, ...o,
});

assert.equal(findOverdue([mk({})], now, grace).length, 1);                                   // 60min past 30min grace
assert.equal(findOverdue([mk({ scheduledTime: "2026-07-25T11:45:00Z" })], now, grace).length, 0); // within grace
assert.equal(findOverdue([mk({ taken: true })], now, grace).length, 0);                      // taken
assert.equal(findOverdue([mk({ alertSent: true })], now, grace).length, 0);                  // already alerted
assert.equal(findOverdue([mk({ critical: false })], now, grace).length, 0);                  // non-critical
assert.equal(findOverdue([mk({ scheduledTime: "2026-07-25T13:00:00Z" })], now, grace).length, 0); // future

console.log("overdue self-check passed");
