import type { Medication, ScheduleEntry, JournalEntry, UserProfile } from "@/types";

const DB_NAME = "medimate";
const DB_VERSION = 1;

type StoreName = "medications" | "schedule" | "journal" | "profile";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains("medications")) {
        db.createObjectStore("medications", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("schedule")) {
        const sched = db.createObjectStore("schedule", { keyPath: "id" });
        sched.createIndex("date", "date", { unique: false });
      }
      if (!db.objectStoreNames.contains("journal")) {
        const journal = db.createObjectStore("journal", { keyPath: "id" });
        journal.createIndex("date", "date", { unique: false });
      }
      if (!db.objectStoreNames.contains("profile")) {
        db.createObjectStore("profile", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(
  db: IDBDatabase,
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(store, mode);
    const objectStore = transaction.objectStore(store);
    const request = fn(objectStore);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// --- Medications ---

export async function saveMedication(med: Medication): Promise<void> {
  const db = await openDB();
  await tx(db, "medications", "readwrite", (s) => s.put(med));
}

export async function getMedications(): Promise<Medication[]> {
  const db = await openDB();
  return tx<Medication[]>(db, "medications", "readonly", (s) => s.getAll());
}

export async function deleteMedication(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, "medications", "readwrite", (s) => s.delete(id));
}

// --- Schedule ---

export async function saveScheduleEntry(entry: ScheduleEntry): Promise<void> {
  const db = await openDB();
  await tx(db, "schedule", "readwrite", (s) => s.put(entry));
}

export async function getScheduleForDate(date: string): Promise<ScheduleEntry[]> {
  const db = await openDB();
  return new Promise(async (resolve, reject) => {
    const dbResolved = await openDB().catch(reject);
    if (!dbResolved) return;
    const transaction = dbResolved.transaction("schedule", "readonly");
    const store = transaction.objectStore("schedule");
    const index = store.index("date");
    const request = index.getAll(date);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function updateScheduleEntry(
  id: string,
  update: Partial<ScheduleEntry>
): Promise<void> {
  const db = await openDB();
  const existing = await tx<ScheduleEntry>(db, "schedule", "readonly", (s) => s.get(id));
  if (!existing) return;
  await tx(db, "schedule", "readwrite", (s) => s.put({ ...existing, ...update }));
}

// --- Journal ---

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const db = await openDB();
  await tx(db, "journal", "readwrite", (s) => s.put(entry));
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const db = await openDB();
  const entries = await tx<JournalEntry[]>(db, "journal", "readonly", (s) => s.getAll());
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const db = await openDB();
  await tx(db, "journal", "readwrite", (s) => s.delete(id));
}

// --- User Profile ---

export async function saveProfile(profile: UserProfile): Promise<void> {
  const db = await openDB();
  await tx(db, "profile", "readwrite", (s) => s.put(profile));
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await openDB();
  const all = await tx<UserProfile[]>(db, "profile", "readonly", (s) => s.getAll());
  return all[0];
}

// --- Export all data (for doctor report) ---

export async function exportAllData(): Promise<{
  medications: Medication[];
  journal: JournalEntry[];
  profile: UserProfile | undefined;
}> {
  const [medications, journal, profile] = await Promise.all([
    getMedications(),
    getJournalEntries(),
    getProfile(),
  ]);
  return { medications, journal, profile };
}
