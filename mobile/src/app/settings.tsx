import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from "react-native";
import * as Crypto from "expo-crypto";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import * as Print from "expo-print";
import { getProfile, saveProfile, exportBackup, importBackup, getMedications, getJournalEntries } from "@/lib/storage";
import { checkInteractions } from "@/lib/drug-data";
import { rescheduleAllReminders } from "@/lib/notifications";
import { colors } from "@/lib/theme";
import type { UserProfile } from "@/types";

export default function SettingsScreen() {
  const [form, setForm] = useState({ name: "", age: "", allergies: "", conditions: "" });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getProfile().then((p) => {
      if (!p) return;
      setForm({
        name: p.name ?? "",
        age: p.age != null ? String(p.age) : "",
        allergies: (p.allergies ?? []).join(", "),
        conditions: (p.conditions ?? []).join(", "),
      });
    });
  }, []);

  async function handleSave() {
    const existing = await getProfile();
    const profile: UserProfile = {
      id: existing?.id ?? Crypto.randomUUID(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: form.name.trim() || undefined,
      age: form.age ? parseInt(form.age, 10) : undefined,
      allergies: form.allergies.split(",").map((x) => x.trim()).filter(Boolean),
      conditions: form.conditions.split(",").map((x) => x.trim()).filter(Boolean),
    };
    await saveProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleExport() {
    const backup = await exportBackup();
    const uri = FileSystem.cacheDirectory + `medimate-backup-${new Date().toISOString().split("T")[0]}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(backup, null, 2));
    await Sharing.shareAsync(uri, { mimeType: "application/json" });
  }

  async function handleImport() {
    const picked = await DocumentPicker.getDocumentAsync({ type: "application/json" });
    if (picked.canceled || !picked.assets[0]) return;
    Alert.alert("Restore backup?", "This REPLACES all data on this device.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Restore", style: "destructive",
        onPress: async () => {
          try {
            const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri);
            await importBackup(JSON.parse(raw));
            await rescheduleAllReminders();
            Alert.alert("Restored", "Backup imported successfully.");
          } catch (e) {
            Alert.alert("Import failed", e instanceof Error ? e.message : "Invalid file.");
          }
        },
      },
    ]);
  }

  async function handleReport() {
    const [meds, journal, profile] = await Promise.all([getMedications(), getJournalEntries(), getProfile()]);
    const interactions = meds.length >= 2 ? checkInteractions(meds.map((m) => m.name)).interactions : [];
    const html = `
      <html><body style="font-family:-apple-system,sans-serif;padding:24px">
      <h1>MediMate — Medication Report</h1>
      <p>${profile?.name ?? ""} · Generated ${new Date().toLocaleDateString()}</p>
      <h2>Medications (${meds.length})</h2>
      <table border="1" cellpadding="6" cellspacing="0" width="100%">
        <tr><th>Name</th><th>Dosage</th><th>Frequency</th><th>Since</th></tr>
        ${meds.map((m) => `<tr><td>${m.name}</td><td>${m.dosage}</td><td>${m.frequency.replace(/_/g, " ")}</td><td>${m.startDate}</td></tr>`).join("")}
      </table>
      ${interactions.length ? `<h2>Interaction warnings</h2><ul>${interactions.map((ix) => `<li><b>${ix.severity}</b>: ${ix.drugA} + ${ix.drugB} — ${ix.description}</li>`).join("")}</ul>` : ""}
      <h2>Recent journal</h2>
      <ul>${journal.slice(0, 10).map((j) => `<li>${new Date(j.date).toLocaleDateString()} (${j.mood}): ${j.rawInput}</li>`).join("")}</ul>
      <p style="color:#666;font-size:12px">Not medical advice. Generated on-device by MediMate.</p>
      </body></html>`;
    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri, { mimeType: "application/pdf" });
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ gap: 10, paddingBottom: 40 }}>
      <Text style={s.section}>Patient profile</Text>
      <TextInput style={s.input} placeholder="Full name" placeholderTextColor={colors.muted}
        value={form.name} onChangeText={(t) => setForm({ ...form, name: t })} />
      <TextInput style={s.input} placeholder="Age" placeholderTextColor={colors.muted} keyboardType="number-pad"
        value={form.age} onChangeText={(t) => setForm({ ...form, age: t })} />
      <TextInput style={s.input} placeholder="Allergies (comma-separated)" placeholderTextColor={colors.muted}
        value={form.allergies} onChangeText={(t) => setForm({ ...form, allergies: t })} />
      <TextInput style={s.input} placeholder="Conditions (comma-separated)" placeholderTextColor={colors.muted}
        value={form.conditions} onChangeText={(t) => setForm({ ...form, conditions: t })} />
      <Pressable style={s.btn} onPress={handleSave}>
        <Text style={s.btnText}>{saved ? "✓ Saved" : "Save profile"}</Text>
      </Pressable>

      <Text style={s.section}>Data</Text>
      <Pressable style={s.secondaryBtn} onPress={handleExport}><Text style={s.secondaryText}>Export backup</Text></Pressable>
      <Pressable style={s.secondaryBtn} onPress={handleImport}><Text style={s.secondaryText}>Restore from file</Text></Pressable>
      <Pressable style={s.secondaryBtn} onPress={handleReport}><Text style={s.secondaryText}>Doctor report (PDF)</Text></Pressable>

      <Text style={s.footnote}>
        All data stays on this device. Backups use the same file format as the MediMate web app.
        Not medical advice — always consult your healthcare provider.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  section: { color: colors.text, fontWeight: "700", fontSize: 16, marginTop: 10 },
  input: { backgroundColor: colors.card, borderRadius: 10, padding: 12, color: colors.text },
  btn: { backgroundColor: colors.teal, borderRadius: 12, padding: 14, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { borderColor: colors.border, borderWidth: 1, borderRadius: 12, padding: 14, alignItems: "center" },
  secondaryText: { color: colors.text },
  footnote: { color: colors.muted, fontSize: 11, marginTop: 16, lineHeight: 16 },
});
