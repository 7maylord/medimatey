"use client";

import { useEffect, useRef, useState } from "react";
import { getScheduleForDate } from "@/lib/storage";

const PREF_KEY = "medimate-reminders-enabled";

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

export function useReminders() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [enabled, setEnabled] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Read persisted state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(PREF_KEY) === "true";
    const perm = "Notification" in window ? Notification.permission : "denied";
    setPermission(perm);
    setEnabled(stored && perm === "granted");
  }, []);

  // Whenever enabled, schedule today's pending doses
  useEffect(() => {
    if (!enabled) return;
    scheduleTodayReminders();
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  async function scheduleTodayReminders() {
    const entries = await getScheduleForDate(todayISO());
    const now = Date.now();
    timers.current.forEach(clearTimeout);
    timers.current = [];

    for (const entry of entries) {
      if (entry.taken || entry.skipped) continue;
      const [h, m] = entry.scheduledTime.split(":").map(Number);
      const fireAt = new Date();
      fireAt.setHours(h, m, 0, 0);
      const delay = fireAt.getTime() - now;
      if (delay <= 0) continue;

      const id = setTimeout(() => {
        if (Notification.permission !== "granted") return;
        new Notification("💊 Time to take your medication", {
          body: `${entry.medicationName} — ${entry.dosage}`,
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
          tag: entry.id,
        });
      }, delay);
      timers.current.push(id);
    }
  }

  async function enable() {
    if (!("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      localStorage.setItem(PREF_KEY, "true");
      setEnabled(true);
    }
  }

  function disable() {
    localStorage.setItem(PREF_KEY, "false");
    setEnabled(false);
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }

  return {
    permission,
    enabled,
    supported: typeof window !== "undefined" && "Notification" in window,
    enable,
    disable,
    reschedule: scheduleTodayReminders,
  };
}
