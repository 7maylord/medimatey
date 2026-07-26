import { randomBytes } from "node:crypto";

const isProd = process.env.NODE_ENV === "production";

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProd) throw new Error("JWT_SECRET must be set in production");
  jwtSecret = randomBytes(32).toString("hex"); // dev only — tokens reset on restart
  console.warn("config: JWT_SECRET not set — using an ephemeral dev secret");
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret,
  graceMs: Number(process.env.GRACE_MINUTES ?? 30) * 60_000,
  tickMs: Number(process.env.TICK_SECONDS ?? 60) * 1000,
  dataFile: process.env.DATA_FILE, // undefined → store uses its default path
  maxBodyBytes: 100_000,
};
