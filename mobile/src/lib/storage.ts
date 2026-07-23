import * as SQLite from "expo-sqlite";
import type { Medication, ScheduleEntry, JournalEntry, UserProfile, BackupData } from "@/types";

// SQLite as a JSON-document store — mirrors the web app's IndexedDB semantics
// so frontend/src/lib/storage.ts ports 1:1. One row per object, whole object in `json`.

const BACKUP_VERSION = 1;

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("medimate.db").then(async (db) => {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS medications (id TEXT PRIMARY KEY, json TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS schedule (id TEXT PRIMARY KEY, date TEXT NOT NULL, json TEXT NOT NULL);
        CREATE INDEX IF NOT EXISTS idx_schedule_date ON schedule(date);
        CREATE TABLE IF NOT EXISTS journal (id TEXT PRIMARY KEY, date TEXT NOT NULL, json TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS profile (id TEXT PRIMARY KEY, json TEXT NOT NULL);
      `);
      return db;
    });
  }
  return dbPromise;
}

function parseRows<T>(rows: { json: string }[]): T[] {
  return rows.map((r) => JSON.parse(r.json) as T);
}

// --- Medications ---

export async function saveMedication(med: Medication): Promise<void> {
  const db = await getDB();
  await db.runAsync("INSERT OR REPLACE INTO medications (id, json) VALUES (?, ?)", med.id, JSON.stringify(med));
}

export async function getMedications(): Promise<Medication[]> {
  const db = await getDB();
  return parseRows<Medication>(await db.getAllAsync("SELECT json FROM medications"));
}

export async function deleteMedication(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM medications WHERE id = ?", id);
  // Dose IDs are deterministic `${medId}:${date}:${time}` → cascade delete is a LIKE.
  await db.runAsync("DELETE FROM schedule WHERE id LIKE ?", `${id}:%`);
}

// --- Schedule ---

export async function saveScheduleEntry(entry: ScheduleEntry): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    "INSERT OR REPLACE INTO schedule (id, date, json) VALUES (?, ?, ?)",
    entry.id, entry.date, JSON.stringify(entry)
  );
}

export async function getScheduleForDate(date: string): Promise<ScheduleEntry[]> {
  const db = await getDB();
  return parseRows<ScheduleEntry>(await db.getAllAsync("SELECT json FROM schedule WHERE date = ?", date));
}

export async function updateScheduleEntry(id: string, update: Partial<ScheduleEntry>): Promise<void> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ json: string }>("SELECT json FROM schedule WHERE id = ?", id);
  if (!row) return;
  const merged = { ...(JSON.parse(row.json) as ScheduleEntry), ...update };
  await saveScheduleEntry(merged);
}

export async function getAllScheduleEntries(): Promise<ScheduleEntry[]> {
  const db = await getDB();
  return parseRows<ScheduleEntry>(await db.getAllAsync("SELECT json FROM schedule"));
}

// --- Journal ---

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    "INSERT OR REPLACE INTO journal (id, date, json) VALUES (?, ?, ?)",
    entry.id, entry.date, JSON.stringify(entry)
  );
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const db = await getDB();
  return parseRows<JournalEntry>(await db.getAllAsync("SELECT json FROM journal ORDER BY date DESC"));
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await getDB();
  await db.runAsync("DELETE FROM journal WHERE id = ?", id);
}

// --- User Profile ---

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await getDB();
  await db.runAsync("INSERT OR REPLACE INTO profile (id, json) VALUES (?, ?)", profile.id, JSON.stringify(profile));
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  const row = await db.getFirstAsync<{ json: string }>("SELECT json FROM profile LIMIT 1");
  return row ? (JSON.parse(row.json) as UserProfile) : undefined;
}

// --- Full backup / restore (same file format as the web app) ---

export async function exportBackup(): Promise<BackupData> {
  const [medications, schedule, journal, profile] = await Promise.all([
    getMedications(), getAllScheduleEntries(), getJournalEntries(), getProfile(),
  ]);
  return { version: BACKUP_VERSION, exportedAt: new Date().toISOString(), medications, schedule, journal, profile };
}

function isBackup(data: unknown): data is BackupData {
  const d = data as Partial<BackupData>;
  return !!d && typeof d === "object" &&
    Array.isArray(d.medications) && Array.isArray(d.schedule) && Array.isArray(d.journal);
}

export async function importBackup(data: unknown): Promise<void> {
  if (!isBackup(data)) throw new Error("Not a valid MediMate backup file.");
  const db = await getDB();
  await db.execAsync("DELETE FROM medications; DELETE FROM schedule; DELETE FROM journal; DELETE FROM profile;");
  await Promise.all([
    ...data.medications.map(saveMedication),
    ...data.schedule.map(saveScheduleEntry),
    ...data.journal.map(saveJournalEntry),
    ...(data.profile ? [saveProfile(data.profile)] : []),
  ]);
}
