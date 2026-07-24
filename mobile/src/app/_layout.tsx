import { useEffect } from "react";
import { Tabs } from "expo-router";
import { Text, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "@/lib/theme";
import { initNotifications, rescheduleAllReminders, attachResponseHandler } from "@/lib/notifications";

// ponytail: emoji tab icons — no icon-font dependency
const icon = (emoji: string) => () => <Text style={{ fontSize: 18 }}>{emoji}</Text>;

export default function RootLayout() {
  useEffect(() => {
    let sub: { remove(): void } | undefined;
    (async () => {
      if (await initNotifications()) await rescheduleAllReminders();
      sub = attachResponseHandler(() => rescheduleAllReminders());
    })();
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") rescheduleAllReminders();
    });
    return () => { sub?.remove(); appState.remove(); };
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          tabBarActiveTintColor: colors.teal,
          tabBarInactiveTintColor: colors.muted,
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Today", tabBarIcon: icon("📅") }} />
        <Tabs.Screen name="meds" options={{ title: "Meds", tabBarIcon: icon("💊") }} />
        <Tabs.Screen name="scan" options={{ title: "Scan", tabBarIcon: icon("📷") }} />
        <Tabs.Screen name="journal" options={{ title: "Journal", tabBarIcon: icon("📓") }} />
        <Tabs.Screen name="settings" options={{ title: "Settings", tabBarIcon: icon("⚙️") }} />
      </Tabs>
    </>
  );
}
