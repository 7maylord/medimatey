// Self-check for safety helpers. Run: node src/lib/safety.test.mjs
// Mirrors the pure logic in safety.ts (brand→generic, allergy class match, refill
// math). If this drifts from the .ts, fix the .ts.
import assert from "node:assert/strict";

const BRAND_TO_GENERIC = { coumadin: "warfarin", advil: "ibuprofen", bactrim: "sulfamethoxazole" };
const normalizeName = (n) => n.toLowerCase().trim();
const toGeneric = (n) => BRAND_TO_GENERIC[normalizeName(n)] ?? normalizeName(n);

const ALLERGY_CLASSES = {
  penicillin: ["penicillin", "amoxicillin", "ampicillin", "augmentin"],
  sulfa: ["sulfa", "sulfamethoxazole", "bactrim"],
  nsaid: ["ibuprofen", "naproxen", "aspirin"],
};
function checkAllergyConflicts(medNames, allergies) {
  const out = [];
  const seen = new Set();
  for (const rawMed of medNames) {
    const med = toGeneric(rawMed);
    for (const rawAllergy of allergies) {
      const allergy = normalizeName(rawAllergy);
      let hit = med.includes(allergy) || allergy.includes(med);
      if (!hit) {
        for (const [key, members] of Object.entries(ALLERGY_CLASSES)) {
          if ((allergy.includes(key) || key.includes(allergy)) && members.some((m) => med.includes(m))) { hit = true; break; }
        }
      }
      if (hit) { const k = `${rawMed} ${rawAllergy}`; if (!seen.has(k)) { seen.add(k); out.push({ medName: rawMed, allergy: rawAllergy }); } }
    }
  }
  return out;
}

// brand → generic
assert.equal(toGeneric("Coumadin"), "warfarin");
assert.equal(toGeneric("Advil"), "ibuprofen");
assert.equal(toGeneric("metformin"), "metformin");

// allergy: penicillin class catches amoxicillin
assert.equal(checkAllergyConflicts(["Amoxicillin"], ["Penicillin"]).length, 1);
// allergy: brand-name NSAID (Advil→ibuprofen) caught by nsaid class
assert.equal(checkAllergyConflicts(["Advil"], ["NSAID"]).length, 1);
// no conflict for unrelated drug
assert.equal(checkAllergyConflicts(["Metformin"], ["Penicillin"]).length, 0);
// dedupe: same med+allergy once
assert.equal(checkAllergyConflicts(["Amoxicillin", "Amoxicillin"], ["Penicillin"]).length, 1);

// --- refill math ---
const DOSES = { once_daily: 1, twice_daily: 2, every_other_day: 0.5, weekly: 1 / 7, as_needed: 0, custom: 1 };
function pillsRemaining(med, taken) {
  if (med.quantity == null) return null;
  const since = med.quantityUpdatedAt ?? med.addedAt ?? "";
  const used = taken.filter((e) => e.medicationId === med.id && e.taken && (e.takenAt ?? e.date) >= since).length;
  return Math.max(0, med.quantity - used);
}
function daysRemaining(med, remaining) {
  if (remaining == null) return null;
  const perDay = DOSES[med.frequency] ?? 1;
  if (perDay <= 0) return null;
  return Math.floor(remaining / perDay);
}
const med = { id: "m1", quantity: 30, quantityUpdatedAt: "2026-07-01", frequency: "twice_daily", addedAt: "2026-07-01" };
const taken = [
  { medicationId: "m1", taken: true, takenAt: "2026-07-02T08:00:00Z" },
  { medicationId: "m1", taken: true, takenAt: "2026-07-02T20:00:00Z" },
  { medicationId: "m1", taken: false, date: "2026-07-03" },      // not taken → ignored
  { medicationId: "m2", taken: true, takenAt: "2026-07-02T08:00:00Z" }, // other med → ignored
  { medicationId: "m1", taken: true, takenAt: "2026-06-30T08:00:00Z" }, // before count set → ignored
];
const remaining = pillsRemaining(med, taken);
assert.equal(remaining, 28);               // 30 - 2 valid doses
assert.equal(daysRemaining(med, remaining), 14); // 28 / 2 per day
// no quantity → unknown
assert.equal(pillsRemaining({ id: "x", frequency: "once_daily" }, []), null);

console.log("safety self-check passed");
