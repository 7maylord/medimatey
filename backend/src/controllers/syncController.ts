import type { Response } from "express";
import { syncDoses, markTaken } from "../models/patientStore.ts";
import type { AuthedRequest } from "../middleware/auth.ts";

// Patient uploads the doses it wants watched (patientId comes from the token).
export function sync(req: AuthedRequest, res: Response): void {
  const doses = req.body?.doses;
  if (!Array.isArray(doses)) {
    res.status(400).json({ error: "doses[] required" });
    return;
  }
  if (doses.length > 500) {
    res.status(400).json({ error: "too many doses (max 500)" });
    return;
  }
  const clean = [];
  for (const d of doses) {
    if (typeof d?.doseId !== "string" || typeof d?.medName !== "string" || typeof d?.scheduledTime !== "string") {
      res.status(400).json({ error: "each dose needs doseId, medName, scheduledTime" });
      return;
    }
    if (Number.isNaN(Date.parse(d.scheduledTime))) {
      res.status(400).json({ error: "scheduledTime must be an ISO datetime" });
      return;
    }
    clean.push({
      doseId: d.doseId, medName: d.medName, scheduledTime: d.scheduledTime,
      taken: d.taken === true, critical: d.critical === true,
    });
  }
  syncDoses(req.patientId!, clean);
  res.json({ synced: clean.length });
}

// Mark one dose confirmed (e.g. straight from the notification action).
export function taken(req: AuthedRequest, res: Response): void {
  const doseId = req.body?.doseId;
  if (typeof doseId !== "string") {
    res.status(400).json({ error: "doseId required" });
    return;
  }
  const ok = markTaken(req.patientId!, doseId);
  if (ok) res.json({ ok: true });
  else res.status(404).json({ error: "unknown dose" });
}
