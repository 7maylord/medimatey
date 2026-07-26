import jwt from "jsonwebtoken";
import { config } from "../config.ts";

// Signed capability token: the patient's device holds a JWT whose subject is the
// patientId. /sync and /taken derive the patient from the verified token, so the
// id is never spoofable and never travels in the request body.

export function signPatientToken(patientId: string): string {
  return jwt.sign({ sub: patientId }, config.jwtSecret, { expiresIn: "365d" });
}

export function verifyPatientToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { sub?: string };
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
