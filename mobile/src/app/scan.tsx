import { useMemo, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Crypto from "expo-crypto";
import { analyzePill, type ScanFields } from "@/lib/api";
import { useMedications, useProfile } from "@/hooks/useStorage";
import { parseFrequency, freqToTimeSlots, scheduleForToday } from "@/lib/schedule-utils";
import { checkAllergyConflicts, toGeneric, type AllergyWarning } from "@/lib/safety";
import { checkInteractions } from "@/lib/drug-data";
import { rescheduleAllReminders } from "@/lib/notifications";
import { colors } from "@/lib/theme";
import type { Medication } from "@/types";

type Phase = "idle" | "camera" | "analyzing" | "review" | "saved";

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [fields, setFields] = useState<ScanFields>({});
  const [error, setError] = useState<string | null>(null);
  const { medications, add } = useMedications();
  const { profile } = useProfile();

  // Safety check on the (editable) scanned name before saving — web-app parity.
  const safety = useMemo(() => {
    if (!fields.name) return { allergies: [] as AllergyWarning[], interactions: [] as ReturnType<typeof checkInteractions>["interactions"] };
    const allergies = profile?.allergies?.length ? checkAllergyConflicts([fields.name], profile.allergies) : [];
    const g = toGeneric(fields.name);
    const interactions = checkInteractions([fields.name, ...medications.map((m) => m.name)])
      .interactions.filter((ix) => toGeneric(ix.drugA) === g || toGeneric(ix.drugB) === g);
    return { allergies, interactions };
  }, [fields.name, medications, profile]);

  async function capture() {
    const photo = await camRef.current?.takePictureAsync({ base64: true, quality: 0.5 });
    if (!photo?.base64) return;
    setPhase("analyzing");
    setError(null);
    try {
      setFields(await analyzePill(`data:image/jpeg;base64,${photo.base64}`));
      setPhase("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setPhase("idle");
    }
  }

  async function save() {
    if (!fields.name?.trim()) return;
    const now = new Date().toISOString();
    const frequency = parseFrequency(fields.frequency);
    const med: Medication = {
      id: Crypto.randomUUID(),
      name: fields.name.trim(),
      genericName: fields.genericName,
      dosage: fields.dosage ?? "",
      form: (fields.form as Medication["form"]) ?? "other",
      frequency,
      timeSlots: freqToTimeSlots(frequency),
      instructions: fields.instructions,
      warnings: fields.warnings,
      startDate: now.split("T")[0],
      addedAt: now, updatedAt: now,
    };
    await add(med);
    await scheduleForToday(med);
    await rescheduleAllReminders();
    setPhase("saved");
  }

  if (phase === "camera") {
    if (!permission?.granted) { requestPermission(); }
    return (
      <View style={s.container}>
        <CameraView ref={camRef} facing="back" style={{ flex: 1, borderRadius: 16, overflow: "hidden" }} />
        <View style={s.row}>
          <Pressable style={s.secondaryBtn} onPress={() => setPhase("idle")}><Text style={s.mutedText}>Cancel</Text></Pressable>
          <Pressable style={s.btn} onPress={capture}><Text style={s.btnText}>Capture</Text></Pressable>
        </View>
      </View>
    );
  }

  if (phase === "analyzing") {
    return (
      <View style={[s.container, s.center]}>
        <ActivityIndicator color={colors.teal} size="large" />
        <Text style={[s.mutedText, { marginTop: 12 }]}>Reading label with AI…</Text>
      </View>
    );
  }

  if (phase === "review") {
    return (
      <ScrollView style={s.container} contentContainerStyle={{ gap: 10, paddingBottom: 30 }}>
        <Text style={s.title}>Check before adding</Text>
        <Text style={s.mutedText}>AI-read values — edit anything that looks wrong.</Text>
        {(["name", "dosage", "frequency", "instructions"] as const).map((k) => (
          <TextInput key={k} style={s.input} placeholder={k} placeholderTextColor={colors.muted}
            value={fields[k] ?? ""} onChangeText={(t) => setFields({ ...fields, [k]: t })} />
        ))}
        {safety.allergies.length > 0 && (
          <Text style={{ color: colors.coral }}>⚠ Conflicts with your allergy: {safety.allergies.map((a) => a.allergy).join(", ")}</Text>
        )}
        {safety.interactions.map((ix, i) => (
          <Text key={i} style={{ color: colors.amber }}>⚠ {ix.severity} interaction: {ix.drugA} + {ix.drugB}</Text>
        ))}
        <Pressable style={s.btn} onPress={save}><Text style={s.btnText}>Add to my medications</Text></Pressable>
        <Pressable style={s.secondaryBtn} onPress={() => setPhase("idle")}><Text style={s.mutedText}>Discard</Text></Pressable>
      </ScrollView>
    );
  }

  if (phase === "saved") {
    return (
      <View style={[s.container, s.center]}>
        <Text style={{ fontSize: 40 }}>✅</Text>
        <Text style={s.title}>{fields.name} added</Text>
        <Text style={s.mutedText}>Doses scheduled — reminders are set.</Text>
        <Pressable style={[s.btn, { marginTop: 16 }]} onPress={() => { setFields({}); setPhase("idle"); }}>
          <Text style={s.btnText}>Scan another</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[s.container, s.center]}>
      {error && <Text style={{ color: colors.coral, marginBottom: 12 }}>{error}</Text>}
      <Text style={{ fontSize: 40 }}>📷</Text>
      <Text style={s.title}>Scan a pill bottle</Text>
      <Text style={[s.mutedText, { textAlign: "center" }]}>Photograph the label; AI extracts the details for you to confirm.</Text>
      <Pressable style={[s.btn, { marginTop: 16 }]} onPress={() => setPhase("camera")}>
        <Text style={s.btnText}>Open camera</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  center: { alignItems: "center", justifyContent: "center" },
  title: { color: colors.text, fontSize: 18, fontWeight: "700", marginTop: 8 },
  mutedText: { color: colors.muted },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, color: colors.text },
  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { backgroundColor: colors.teal, borderRadius: 12, padding: 14, alignItems: "center", flex: 1 },
  btnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center", flex: 1 },
});
