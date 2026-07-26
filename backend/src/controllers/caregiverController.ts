import type { Request, Response } from "express";
import { linkCaregiver } from "../models/patientStore.ts";

// Caregiver links their Expo push token using the patient's pairing code.
export function link(req: Request, res: Response): void {
  const { pairingCode, expoPushToken } = req.body ?? {};
  if (typeof pairingCode !== "string" || typeof expoPushToken !== "string") {
    res.status(400).json({ error: "pairingCode and expoPushToken required" });
    return;
  }
  const ok = linkCaregiver(pairingCode.toUpperCase(), expoPushToken);
  if (ok) res.json({ linked: true });
  else res.status(400).json({ error: "invalid or expired code" });
}
