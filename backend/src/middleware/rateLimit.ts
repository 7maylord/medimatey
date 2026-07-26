import rateLimit from "express-rate-limit";

// Sane global cap per IP.
export const globalLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter on creation / pairing to blunt brute-force + abuse of pairing codes.
export const strictLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});
