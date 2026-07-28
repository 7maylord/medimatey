import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { getScheduleForDate } from "@/lib/storage";

// Client for the Phase-B caregiver relay (../../backend). The patient's signed
// token is held in secure storage; possession of it = "caregiver alerts on".
const BASE = process.env.EXPO_PUBLIC_CAREGIVER_API ?? "http://localhost:4000";
const TOKEN_KEY = "mm_patient_token";

function dayISO(offset = 0): string {
  return new Date(Date.now() + offset * 86_400_000).toISOString().split("T")[0];
}

async function api(path: string, body: unknown, token?: string): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body ?? {}),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) throw new Error((data.error as string) ?? `Request failed (${res.status})`);
  return data;
}

export async function getPatientToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function isCaregiverAlertsEnabled(): Promise<boolean> {
  return (await getPatientToken()) != null;
}

// Patient turns on caregiver alerts → returns a pairing code to share.
export async function enableAsPatient(): Promise<string> {
  const { token, pairingCode } = await api("/patients", {});
  await SecureStore.setItemAsync(TOKEN_KEY, token as string);
  await syncIfEnabled();
  return pairingCode as string;
}

export async function disableAsPatient(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function regeneratePairingCode(): Promise<string> {
  const token = await getPatientToken();
  if (!token) throw new Error("Caregiver alerts are off.");
  const { pairingCode } = await api("/pairing-code", {}, token);
  return pairingCode as string;
}

// Caregiver's device registers to watch a patient using their code.
export async function registerAsCaregiver(pairingCode: string): Promise<void> {
  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  const projectId = extra?.eas?.projectId ?? (Constants as { easConfig?: { projectId?: string } }).easConfig?.projectId;
  const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
  await api("/caregivers", { pairingCode: pairingCode.trim(), expoPushToken });
}

// Push the doses worth watching (today + tomorrow) to the relay. No-op if off.
// Called after every reminder reschedule. All synced doses are marked critical —
// the patient opted them in by enabling alerts.
export async function syncIfEnabled(): Promise<void> {
  const token = await getPatientToken();
  if (!token) return;
  const entries = [...(await getScheduleForDate(dayISO())), ...(await getScheduleForDate(dayISO(1)))];
  const doses = entries.map((e) => ({
    doseId: e.id,
    medName: e.medicationName,
    scheduledTime: new Date(`${e.date}T${e.scheduledTime}:00`).toISOString(), // local → UTC
    taken: e.taken,
    critical: true,
  }));
  try {
    await api("/sync", { doses }, token);
  } catch {
    // best-effort; the next reschedule retries
  }
}
