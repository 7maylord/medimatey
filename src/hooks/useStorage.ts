"use client";

import { useState, useEffect, useCallback } from "react";
import type { Medication, ScheduleEntry, JournalEntry } from "@/types";
import {
  getMedications,
  saveMedication,
  deleteMedication,
  getScheduleForDate,
  saveScheduleEntry,
  updateScheduleEntry,
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
} from "@/lib/storage";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

// --- Medications ---

export function useMedications() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const meds = await getMedications();
    setMedications(meds);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (med: Medication) => {
    await saveMedication(med);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteMedication(id);
    await refresh();
  }, [refresh]);

  return { medications, loading, add, remove, refresh };
}

// --- Today's Schedule ---

export function useTodaySchedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getScheduleForDate(todayISO());
    setEntries(data.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const markTaken = useCallback(async (id: string) => {
    await updateScheduleEntry(id, { taken: true, takenAt: new Date().toISOString(), skipped: false });
    await refresh();
  }, [refresh]);

  const markSkipped = useCallback(async (id: string, reason?: string) => {
    await updateScheduleEntry(id, { skipped: true, skippedReason: reason, taken: false });
    await refresh();
  }, [refresh]);

  const addEntry = useCallback(async (entry: ScheduleEntry) => {
    await saveScheduleEntry(entry);
    await refresh();
  }, [refresh]);

  return { entries, loading, markTaken, markSkipped, addEntry, refresh };
}

// --- Journal ---

export function useJournal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await getJournalEntries();
    setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = useCallback(async (entry: JournalEntry) => {
    await saveJournalEntry(entry);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id: string) => {
    await deleteJournalEntry(id);
    await refresh();
  }, [refresh]);

  return { entries, loading, add, remove, refresh };
}
