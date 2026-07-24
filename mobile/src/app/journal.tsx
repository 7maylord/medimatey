import { useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet, Alert } from "react-native";
import * as Crypto from "expo-crypto";
import { useJournal } from "@/hooks/useStorage";
import { colors } from "@/lib/theme";
import type { JournalEntry, MoodLevel } from "@/types";

const MOODS: { value: MoodLevel; emoji: string }[] = [
  { value: "great", emoji: "😄" }, { value: "good", emoji: "🙂" }, { value: "okay", emoji: "😐" },
  { value: "poor", emoji: "😕" }, { value: "bad", emoji: "😣" },
];

export default function JournalScreen() {
  const { entries, add, remove } = useJournal();
  const [text, setText] = useState("");
  const [mood, setMood] = useState<MoodLevel>("okay");

  async function save() {
    if (!text.trim()) return;
    const entry: JournalEntry = {
      id: Crypto.randomUUID(),
      date: new Date().toISOString(),
      inputMethod: "text",
      rawInput: text.trim(),
      summary: text.trim().slice(0, 140),
      symptoms: [],
      mood,
    };
    await add(entry);
    setText("");
    setMood("okay");
  }

  return (
    <View style={s.container}>
      <TextInput
        style={[s.input, { minHeight: 80 }]} multiline
        placeholder="How are you feeling today?" placeholderTextColor={colors.muted}
        value={text} onChangeText={setText}
      />
      <View style={s.moodRow}>
        {MOODS.map((m) => (
          <Pressable key={m.value} style={[s.mood, mood === m.value && s.moodActive]} onPress={() => setMood(m.value)}>
            <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable style={s.btn} onPress={save}><Text style={s.btnText}>Save entry</Text></Pressable>

      <FlatList
        style={{ marginTop: 16 }}
        data={entries}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={s.empty}>No entries yet.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={s.card}
            onLongPress={() => Alert.alert("Delete entry?", "", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => remove(item.id) },
            ])}
          >
            <Text style={s.cardDate}>
              {MOODS.find((m) => m.value === item.mood)?.emoji} {new Date(item.date).toLocaleString()}
            </Text>
            <Text style={s.cardText}>{item.rawInput}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, color: colors.text, textAlignVertical: "top" },
  moodRow: { flexDirection: "row", gap: 8, marginVertical: 10, justifyContent: "center" },
  mood: { padding: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border },
  moodActive: { borderColor: colors.teal, backgroundColor: colors.card },
  btn: { backgroundColor: colors.teal, borderRadius: 12, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  empty: { color: colors.muted, textAlign: "center", marginTop: 30 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 12, marginBottom: 10 },
  cardDate: { color: colors.muted, fontSize: 11, marginBottom: 4 },
  cardText: { color: colors.text },
});
