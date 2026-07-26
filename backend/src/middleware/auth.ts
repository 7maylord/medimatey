import type { Request, Response, NextFunction } from "express";
import { verifyPatientToken } from "../services/token.ts";
import { patientExists } from "../models/patientStore.ts";

export interface AuthedRequest extends Request {
  patientId?: string;
}

// Derives req.patientId from a verified Bearer token; 401s otherwise.
export function requirePatient(req: AuthedRequest, res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const patientId = token ? verifyPatientToken(token) : null;
  if (!patientId || !patientExists(patientId)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  req.patientId = patientId;
  next();
}
