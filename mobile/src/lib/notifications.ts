import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { getScheduleForDate, updateScheduleEntry } from "@/lib/storage";
import { ensureScheduleForDate } from "@/lib/schedule-utils";
import { planNotifications } from "@/lib/notification-plan";
import { syncIfEnabled } from "@/lib/caregiver";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function dayISO(offset = 0): string {
  return new Date(Date.now() + offset * 86_400_000).toISOString().split("T")[0];
}

export async function initNotifications(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("doses", {
      name: "Dose reminders",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  await Notifications.setNotificationCategoryAsync("dose", [
    { identifier: "taken", buttonTitle: "✓ Mark taken", options: { opensAppToForeground: false } },
  ]);
  return true;
}

// Idempotent: materialize today+tomorrow, cancel everything, schedule pending
// future doses. Call on app foreground and after any med/schedule change.
export async function rescheduleAllReminders(): Promise<void> {
  await ensureScheduleForDate(dayISO());
  await ensureScheduleForDate(dayISO(1));
  const entries = [...(await getScheduleForDate(dayISO())), ...(await getScheduleForDate(dayISO(1)))];

  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const p of planNotifications(entries, new Date())) {
    await Notifications.scheduleNotificationAsync({
      identifier: p.entryId, // dose id = notification id → actions map back trivially
      content: {
        title: "💊 Time to take your medication",
        body: `${p.medicationName} — ${p.dosage}`,
        categoryIdentifier: "dose",
        data: { entryId: p.entryId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: p.fireAt,
        channelId: "doses",
      },
    });
  }

  void syncIfEnabled(); // fire-and-forget: keep the caregiver relay in step (no-op if off)
}

// Handles "Mark taken" from the notification (works with app backgrounded;
// if the app was killed, the response is delivered on next launch).
export function attachResponseHandler(onChange?: () => void) {
  return Notifications.addNotificationResponseReceivedListener(async (response) => {
    const entryId = response.notification.request.content.data?.entryId as string | undefined;
    if (response.actionIdentifier === "taken" && entryId) {
      await updateScheduleEntry(entryId, { taken: true, takenAt: new Date().toISOString(), skipped: false });
      onChange?.();
    }
  });
}
