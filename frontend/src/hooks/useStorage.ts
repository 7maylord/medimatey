"use client";

import { useState, useEffect, useCallback } from "react";
import type { Medication, ScheduleEntry, JournalEntry, UserProfile } from "@/types";
import {
  getMedications,
  saveMedication,
  deleteMedication,
  getScheduleForDate,
  getAllScheduleEntries,
  saveScheduleEntry,
  updateScheduleEntry,
  getJournalEntries,
  saveJournalEntry,
  deleteJournalEntry,
  getProfile,
} from "@/lib/storage";
import { ensureScheduleForDate } from "@/lib/schedule-utils";

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
    const today = todayISO();
    await ensureScheduleForDate(today); // idempotent: materializes missing doses for today
    const data = await getScheduleForDate(today);
    setEntries(data.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)));
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // The service worker posts this after "Mark taken" is tapped on a notification.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.serviceWorker) return;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "schedule-updated") refresh();
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [refresh]);

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

// --- All schedule entries (for refill math / adherence) ---

export function useAllSchedule() {
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);

  const refresh = useCallback(async () => {
    setEntries(await getAllScheduleEntries());
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { entries, refresh };
}

// --- Patient profile ---

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const refresh = useCallback(async () => {
    setProfile((await getProfile()) ?? null);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, refresh };
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
