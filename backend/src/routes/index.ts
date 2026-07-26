import express from "express";
import * as patient from "../controllers/patientController.ts";
import * as caregiver from "../controllers/caregiverController.ts";
import * as syncCtrl from "../controllers/syncController.ts";
import { requirePatient } from "../middleware/auth.ts";
import { strictLimiter } from "../middleware/rateLimit.ts";

export const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ ok: true, service: "medimate-backend", ts: new Date().toISOString() });
});

// Public (rate-limited) — self-registration and caregiver pairing.
router.post("/patients", strictLimiter, patient.create);
router.post("/caregivers", strictLimiter, caregiver.link);

// Authenticated — require the patient's signed token.
router.post("/pairing-code", requirePatient, patient.regenerateCode);
router.post("/sync", requirePatient, syncCtrl.sync);
router.post("/taken", requirePatient, syncCtrl.taken);
