import { useMemo, useState } from "react";
import {
  View, Text, TextInput, Pressable, FlatList, Modal, StyleSheet, Alert, ScrollView,
} from "react-native";
import * as Crypto from "expo-crypto";
import { useMedications, useAllSchedule, useProfile } from "@/hooks/useStorage";
import { checkInteractions } from "@/lib/drug-data";
import { checkAllergyConflicts, pillsRemaining, daysRemaining, isLowSupply } from "@/lib/safety";
import { scheduleForToday, freqToTimeSlots } from "@/lib/schedule-utils";
import { rescheduleAllReminders } from "@/lib/notifications";
import { colors } from "@/lib/theme";
import type { Medication, MedicationFrequency } from "@/types";

const FREQ_OPTIONS: { value: MedicationFrequency; label: string }[] = [
  { value: "once_daily", label: "1×/day" },
  { value: "twice_daily", label: "2×/day" },
  { value: "three_times_daily", label: "3×/day" },
  { value: "four_times_daily", label: "4×/day" },
  { value: "every_other_day", label: "Every other day" },
  { value: "weekly", label: "Weekly" },
  { value: "as_needed", label: "As needed" },
];

function blankMedication(): Medication {
  const now = new Date().toISOString();
  return {
    id: Crypto.randomUUID(),
    name: "", dosage: "", form: "tablet",
    frequency: "once_daily",
    timeSlots: freqToTimeSlots("once_daily"),
    startDate: now.split("T")[0],
    addedAt: now, updatedAt: now,
  };
}

export default function MedsScreen() {
  const { medications, add, remove } = useMedications();
  const { entries: allSchedule } = useAllSchedule();
  const { profile } = useProfile();
  const [editing, setEditing] = useState<Medication | null>(null);

  const interactions = useMemo(
    () => medications.length >= 2 ? checkInteractions(medications.map((m) => m.name)).interactions : [],
    [medications]
  );
  const allergyWarnings = useMemo(
    () => profile?.allergies?.length
      ? checkAllergyConflicts(medications.map((m) => m.name), profile.allergies) : [],
    [medications, profile]
  );

  async function handleSave(med: Medication) {
    if (!med.name.trim() || !med.dosage.trim()) return;
    await add({ ...med, timeSlots: freqToTimeSlots(med.frequency), updatedAt: new Date().toISOString() });
    await scheduleForToday(med);
    await rescheduleAllReminders();
    setEditing(null);
  }

  function confirmDelete(med: Medication) {
    Alert.alert("Remove medication?", `${med.name} and its schedule will be deleted.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => remove(med.id).then(rescheduleAllReminders) },
    ]);
  }

  return (
    <View style={s.container}>
      {allergyWarnings.length > 0 && (
        <View style={[s.banner, { borderLeftColor: colors.coral }]}>
          <Text style={[s.bannerTitle, { color: colors.coral }]}>Allergy conflict</Text>
          {allergyWarnings.map((w, i) => (
            <Text key={i} style={s.bannerText}>{w.medName} may conflict with your allergy: {w.allergy}</Text>
          ))}
        </View>
      )}
      {interactions.length > 0 && (
        <View style={[s.banner, { borderLeftColor: colors.amber }]}>
          <Text style={[s.bannerTitle, { color: colors.amber }]}>Interactions</Text>
          {interactions.slice(0, 2).map((ix, i) => (
            <Text key={i} style={s.bannerText}>{ix.severity}: {ix.drugA} + {ix.drugB}</Text>
          ))}
        </View>
      )}

      <FlatList
        data={medications}
        keyExtractor={(m) => m.id}
        ListEmptyComponent={<Text style={s.empty}>No medications yet. Add one below or use Scan.</Text>}
        renderItem={({ item }) => {
          const remaining = pillsRemaining(item, allSchedule);
          const low = isLowSupply(item, remaining);
          const days = daysRemaining(item, remaining);
          return (
            <Pressable style={s.card} onLongPress={() => confirmDelete(item)}>
              <View style={{ flex: 1 }}>
                <Text style={s.medName}>{item.name}</Text>
                <Text style={s.medMeta}>{item.dosage} · {item.frequency.replace(/_/g, " ")}</Text>
                {remaining != null && (
                  <Text style={[s.medMeta, low && { color: colors.coral }]}>
                    {low ? "⚠ " : ""}{remaining} left{days != null ? ` (~${days}d)` : ""}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
      />

      <Pressable style={s.addBtn} onPress={() => setEditing(blankMedication())}>
        <Text style={s.addBtnText}>+ Add medication</Text>
      </Pressable>

      <Modal visible={!!editing} animationType="slide" transparent>
        {editing && (
          <View style={s.modalWrap}>
            <ScrollView style={s.modal} contentContainerStyle={{ gap: 10, paddingBottom: 24 }}>
              <Text style={s.modalTitle}>Medication</Text>
              <TextInput style={s.input} placeholder="Name *" placeholderTextColor={colors.muted}
                value={editing.name} onChangeText={(t) => setEditing({ ...editing, name: t })} />
              <TextInput style={s.input} placeholder="Dosage * (e.g. 500mg)" placeholderTextColor={colors.muted}
                value={editing.dosage} onChangeText={(t) => setEditing({ ...editing, dosage: t })} />
              <TextInput style={s.input} placeholder="Pills on hand (refill tracking)" placeholderTextColor={colors.muted}
                keyboardType="number-pad"
                value={editing.quantity != null ? String(editing.quantity) : ""}
                onChangeText={(t) => setEditing({
                  ...editing,
                  quantity: t.trim() === "" ? undefined : Math.max(0, parseInt(t, 10) || 0),
                  quantityUpdatedAt: new Date().toISOString(),
                })} />
              <View style={s.chipRow}>
                {FREQ_OPTIONS.map((f) => (
                  <Pressable key={f.value}
                    style={[s.chip, editing.frequency === f.value && s.chipActive]}
                    onPress={() => setEditing({ ...editing, frequency: f.value })}>
                    <Text style={[s.chipText, editing.frequency === f.value && { color: "#fff" }]}>{f.label}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={s.saveBtn} onPress={() => handleSave(editing)}>
                <Text style={s.addBtnText}>Save</Text>
              </Pressable>
              <Pressable style={s.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={{ color: colors.muted }}>Cancel</Text>
              </Pressable>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  banner: { backgroundColor: colors.card, borderLeftWidth: 4, borderRadius: 10, padding: 12, marginBottom: 10 },
  bannerTitle: { fontWeight: "700", marginBottom: 4 },
  bannerText: { color: colors.muted, fontSize: 12 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row" },
  medName: { color: colors.text, fontSize: 16, fontWeight: "600" },
  medMeta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  addBtn: { backgroundColor: colors.teal, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modal: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: "80%" },
  modalTitle: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, color: colors.text },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderColor: colors.border, borderWidth: 1, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  chipText: { color: colors.muted, fontSize: 12 },
  saveBtn: { backgroundColor: colors.teal, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 8 },
  cancelBtn: { alignItems: "center", padding: 10 },
});
