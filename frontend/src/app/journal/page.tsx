"use client";

import { useState } from "react";
import { useSpeech } from "@/hooks/useSpeech";
import { useJournal } from "@/hooks/useStorage";
import { useAI } from "@/hooks/useAI";
import { SYMPTOM_SUMMARY_PROMPT } from "@/lib/prompts";
import type { JournalEntry, MoodLevel } from "@/types";

// --- Icons ---
function MicIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
      <path d="M19 10v2a7 7 0 01-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function SparklesIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    </svg>
  );
}

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

const moodEmojis: Record<MoodLevel, { emoji: string; label: string; color: string }> = {
  great: { emoji: "😊", label: "Great", color: "var(--med-emerald-500)" },
  good:  { emoji: "🙂", label: "Good",  color: "var(--med-teal-500)" },
  okay:  { emoji: "😐", label: "Okay",  color: "var(--med-amber-500)" },
  poor:  { emoji: "😔", label: "Poor",  color: "var(--med-coral-400)" },
  bad:   { emoji: "😞", label: "Bad",   color: "var(--med-coral-600)" },
};

interface AISummaryResult {
  summary?: string;
  symptoms?: { name: string; severity: number; duration?: string; isNew?: boolean }[];
  mood?: MoodLevel;
}

export default function JournalPage() {
  const [inputText, setInputText] = useState("");
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usedVoice, setUsedVoice] = useState(false);

  const { isListening, transcript, isSupported, startListening, stopListening, clearTranscript } = useSpeech();
  const { entries, loading, add: addEntry, remove: removeEntry } = useJournal();
  const { chat, loading: aiLoading } = useAI();

  const toggleListening = () => {
    if (isListening) {
      stopListening();
      // Pull final transcript into the text box when mic stops
      if (transcript) {
        setInputText(transcript);
        setUsedVoice(true);
      }
    } else {
      clearTranscript();
      setUsedVoice(false);
      startListening();
    }
  };

  const handleSave = async () => {
    if (!inputText.trim() && !selectedMood) return;
    setSaving(true);
    setSaveError(null);

    try {
      let summary = inputText.trim() || moodEmojis[selectedMood ?? "okay"].label;
      let symptoms: JournalEntry["symptoms"] = [];
      let aiMood: MoodLevel = selectedMood ?? "okay";

      if (inputText.trim()) {
        try {
          const raw = await chat([
            { role: "system", content: SYMPTOM_SUMMARY_PROMPT },
            { role: "user", content: inputText.trim() },
          ]);
          const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
          const parsed: AISummaryResult = JSON.parse(json);
          summary = parsed.summary ?? summary;
          symptoms = (parsed.symptoms ?? []).map((s) => ({
            name: s.name,
            severity: Math.min(5, Math.max(1, s.severity)) as 1 | 2 | 3 | 4 | 5,
            duration: s.duration,
            isNew: s.isNew ?? true,
          }));
          if (parsed.mood) aiMood = parsed.mood;
        } catch {
          // AI failed — save raw text as summary, no structured symptoms
        }
      }

      const entry: JournalEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        inputMethod: usedVoice ? "voice" : "text",
        rawInput: inputText.trim(),
        summary,
        symptoms,
        mood: selectedMood ?? aiMood,
      };

      await addEntry(entry);
      setInputText("");
      setSelectedMood(null);
      setUsedVoice(false);
      clearTranscript();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save entry");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const severityBar = (severity: number) => {
    const colors = ["var(--med-emerald-500)", "var(--med-teal-500)", "var(--med-amber-500)", "var(--med-coral-400)", "var(--med-coral-600)"];
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="w-4 h-1.5 rounded-full"
            style={{ backgroundColor: level <= severity ? colors[severity - 1] : "var(--card-border)" }}
          />
        ))}
      </div>
    );
  };

  const isBusy = saving || aiLoading;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1">Symptom Journal</h1>
        <p className="text-foreground-muted">Track how you feel daily — speak or type your entries</p>
      </div>

      {/* New Entry Card */}
      <div className="glass-card-strong p-6 mb-8">
        <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] mb-4">How are you feeling today?</h2>

        {/* Mood Selector */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {(Object.keys(moodEmojis) as MoodLevel[]).map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(selectedMood === mood ? null : mood)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                selectedMood === mood ? "glass-card scale-105" : "hover:bg-[var(--card-bg)]"
              }`}
              style={selectedMood === mood ? { outline: `2px solid ${moodEmojis[mood].color}` } : {}}
            >
              <span className="text-2xl">{moodEmojis[mood].emoji}</span>
              <span className="text-xs font-medium text-foreground-muted">{moodEmojis[mood].label}</span>
            </button>
          ))}
        </div>

        {/* Voice / Text Input */}
        <div className="relative mb-4">
          <textarea
            value={inputText}
            onChange={(e) => { setInputText(e.target.value); setUsedVoice(false); }}
            placeholder="Describe your symptoms, energy levels, side effects..."
            className="w-full h-28 p-4 pr-14 rounded-xl glass-card resize-none text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--med-teal-500)] bg-transparent"
          />
          {isSupported && (
            <button
              onClick={toggleListening}
              className={`absolute bottom-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-[var(--med-coral-500)] text-white animate-pulse-glow"
                  : "bg-[var(--med-teal-500)]/10 text-[var(--med-teal-500)] hover:bg-[var(--med-teal-500)]/20"
              }`}
              title={isListening ? "Stop listening" : "Start voice input"}
            >
              <MicIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Live listening indicator */}
        {isListening && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--med-coral-500)]/5 border border-[var(--med-coral-500)]/20">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-[var(--med-coral-500)] animate-pulse"
                  style={{ height: `${8 + (i % 3) * 6}px`, animationDelay: `${i * 100}ms` }}
                />
              ))}
            </div>
            <span className="text-sm text-[var(--med-coral-500)] font-medium">
              Listening… tap mic again to stop
            </span>
          </div>
        )}

        {!isSupported && (
          <p className="text-xs text-foreground-muted mb-4">
            Voice input unavailable. Use Chrome or Edge for speech recognition.
          </p>
        )}

        {saveError && (
          <p className="text-xs text-[var(--med-coral-500)] mb-3">{saveError}</p>
        )}

        <button
          onClick={handleSave}
          disabled={isBusy || (!inputText.trim() && !selectedMood)}
          className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            {isBusy ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {aiLoading ? "Summarizing with AI…" : "Saving…"}
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Save Entry with AI Summary
              </>
            )}
          </span>
        </button>
      </div>

      {/* Entry History */}
      <div>
        <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] mb-4">Previous Entries</h2>

        {loading && (
          <div className="text-center text-foreground-muted text-sm py-8">Loading entries…</div>
        )}

        {!loading && entries.length === 0 && (
          <div className="glass-card p-8 text-center text-foreground-muted text-sm">
            No journal entries yet. Add your first entry above.
          </div>
        )}

        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="glass-card-strong p-5">
              {/* Entry Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{moodEmojis[entry.mood].emoji}</span>
                  <div>
                    <div className="text-sm font-semibold">{formatDate(entry.date)}</div>
                    <div className="text-xs text-foreground-muted flex items-center gap-1">
                      {entry.inputMethod === "voice"
                        ? <><MicIcon className="w-3 h-3" /> Voice entry</>
                        : "Text entry"
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="badge"
                    style={{ backgroundColor: `${moodEmojis[entry.mood].color}20`, color: moodEmojis[entry.mood].color }}
                  >
                    {moodEmojis[entry.mood].label}
                  </span>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="btn-icon w-7 h-7 text-foreground-muted hover:text-[var(--med-coral-500)]"
                    title="Delete entry"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* AI Summary */}
              <div className="p-3 rounded-xl bg-[var(--med-teal-500)]/5 border border-[var(--med-teal-500)]/15 mb-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <SparklesIcon className="w-3 h-3 text-[var(--med-teal-500)]" />
                  <span className="text-xs font-semibold text-[var(--med-teal-500)]">AI Summary</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{entry.summary}</p>
              </div>

              {/* Symptoms */}
              {entry.symptoms.length > 0 && (
                <div className="space-y-2 mb-3">
                  <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Symptoms</span>
                  <div className="flex flex-wrap gap-2">
                    {entry.symptoms.map((symptom, si) => (
                      <div key={si} className="glass-card px-3 py-2 flex items-center gap-2">
                        <span className="text-xs font-medium">{symptom.name}</span>
                        {severityBar(symptom.severity)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {entry.rawInput && (
                <details className="mt-1">
                  <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground transition-colors">
                    View original input
                  </summary>
                  <p className="text-xs text-foreground-muted mt-2 p-3 rounded-lg bg-[var(--background-secondary)] leading-relaxed">
                    &ldquo;{entry.rawInput}&rdquo;
                  </p>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 glass-card p-4 text-xs text-foreground-muted leading-relaxed text-center">
        ⚕️ <strong>Not medical advice.</strong> Journal entries are processed by AI for summarization only.
        Share these with your healthcare provider during visits.
      </div>
    </div>
  );
}
