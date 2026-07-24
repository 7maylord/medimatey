import { useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import type { Medication, ScheduleEntry, JournalEntry, UserProfile } from "@/types";
import {
  getMedications, saveMedication, deleteMedication,
  getScheduleForDate, getAllScheduleEntries, updateScheduleEntry,
  getJournalEntries, saveJournalEntry, deleteJournalEntry, getProfile,
} from "@/lib/storage";
import { ensureScheduleForDate } from "@/lib/schedule-utils";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// Re-runs `refresh` whenever the tab gains focus (mobile equivalent of the
// web app's on-mount refresh — tabs stay mounted in RN).
function useFocusRefresh(refresh: () => void) {
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
}

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setMedications(await getMedications());
    setLoading(false);
  }, []);
  useFocusRefresh(refresh);

  const add = useCallback(async (med: Medication) => { await saveMedication(med); await refresh(); }, [refresh]);
  const remove = useCallback(async (id: string) => { await deleteMedication(id); await refresh(); }, [refresh]);

  return { medications, loading, add, remove, refresh };
}

export function useTodaySchedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const today = todayISO();
    await ensureScheduleForDate(today); // idempotent materialization, same as web
    const data = await getScheduleForDate(today);
    setEntries(data.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));
    setLoading(false);
  }, []);
  useFocusRefresh(refresh);

  const markTaken = useCallback(async (id: string) => {
    await updateScheduleEntry(id, { taken: true, takenAt: new Date().toISOString(), skipped: false });
    await refresh();
  }, [refresh]);

  const markSkipped = useCallback(async (id: string, reason?: string) => {
    await updateScheduleEntry(id, { skipped: true, skippedReason: reason, taken: false });
    await refresh();
  }, [refresh]);

  return { entries, loading, markTaken, markSkipped, refresh };
}

export function useAllSchedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const refresh = useCallback(async () => { setEntries(await getAllScheduleEntries()); }, []);
  useFocusRefresh(refresh);
  return { entries, refresh };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const refresh = useCallback(async () => { setProfile((await getProfile()) ?? null); }, []);
  useFocusRefresh(refresh);
  return { profile, refresh };
}

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setEntries(await getJournalEntries()); setLoading(false); }, []);
  useFocusRefresh(refresh);
  const add = useCallback(async (e: JournalEntry) => { await saveJournalEntry(e); await refresh(); }, [refresh]);
  const remove = useCallback(async (id: string) => { await deleteJournalEntry(id); await refresh(); }, [refresh]);
  return { entries, loading, add, remove, refresh };
}
