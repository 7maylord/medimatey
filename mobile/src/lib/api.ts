// Client for the frontend's Next.js API routes — the AI key stays server-side.
// Dev: frontend runs on your LAN (npm run dev in ../frontend), EXPO_PUBLIC_API_BASE
// in mobile/.env points at it. Prod: point at the deployed Vercel URL.

const BASE = process.env.EXPO_PUBLIC_API_BASE ?? "http://localhost:3000";

export interface ScanFields {
  name?: string;
  genericName?: string;
  dosage?: string;
  form?: string;
  frequency?: string;
  instructions?: string;
  warnings?: string[];
  confidence?: number;
}

export async function analyzePill(imageBase64: string): Promise<ScanFields> {
  const res = await fetch(`${BASE}/api/analyze-pill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
  const data = (await res.json().catch(() => ({}))) as ScanFields & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `Scan failed (HTTP ${res.status})`);
  return data;
}
