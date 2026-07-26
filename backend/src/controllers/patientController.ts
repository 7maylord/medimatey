import type { Request, Response } from "express";
import { createPatient, newPairingCode } from "../models/patientStore.ts";
import { signPatientToken } from "../services/token.ts";
import type { AuthedRequest } from "../middleware/auth.ts";

// Patient self-registers → receives a signed token (kept on device) + a pairing
// code to hand the caregiver.
export function create(_req: Request, res: Response): void {
  const { patientId, pairingCode } = createPatient();
  res.json({ token: signPatientToken(patientId), pairingCode });
}

// Patient regenerates an expired pairing code (auth required).
export function regenerateCode(req: AuthedRequest, res: Response): void {
  const code = newPairingCode(req.patientId!);
  if (code) res.json({ pairingCode: code });
  else res.status(404).json({ error: "unknown patient" });
}
