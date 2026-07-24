import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { useTodaySchedule } from "@/hooks/useStorage";
import { rescheduleAllReminders } from "@/lib/notifications";
import { colors } from "@/lib/theme";

export default function TodayScreen() {
  const { entries, loading, markTaken, markSkipped } = useTodaySchedule();
  const taken = entries.filter((e) => e.taken).length;

  return (
    <View style={s.container}>
      <Text style={s.progress}>
        {entries.length > 0 ? `${taken} of ${entries.length} doses taken` : ""}
      </Text>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={
          <Text style={s.empty}>{loading ? "Loading…" : "No doses today. Add medications in the Meds tab."}</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[s.card, item.taken && s.cardTaken]}
            onPress={() => { if (!item.taken) markTaken(item.id).then(rescheduleAllReminders); }}
            onLongPress={() => { if (!item.taken) markSkipped(item.id).then(rescheduleAllReminders); }}
          >
            <Text style={s.time}>{item.scheduledTime}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.name, item.taken && s.strike]}>
                {item.medicationName} {item.dosage}
              </Text>
              <Text style={s.label}>{item.skipped ? "skipped" : item.timeLabel}</Text>
            </View>
            <Text style={{ fontSize: 18 }}>{item.taken ? "✅" : item.skipped ? "⏭" : "⭕"}</Text>
          </Pressable>
        )}
      />
      <Text style={s.hint}>Tap a dose to mark taken · long-press to skip</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  progress: { color: colors.teal, fontWeight: "700", marginBottom: 10 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 },
  cardTaken: { opacity: 0.55 },
  time: { color: colors.text, fontWeight: "700", width: 52 },
  name: { color: colors.text, fontWeight: "600" },
  strike: { textDecorationLine: "line-through", color: colors.muted },
  label: { color: colors.muted, fontSize: 12, textTransform: "capitalize" },
  hint: { color: colors.muted, fontSize: 11, textAlign: "center", paddingVertical: 6 },
});
