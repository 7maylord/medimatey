"use client";

import { useState, useEffect } from "react";

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

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
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

// --- Types ---

type MoodLevel = "great" | "good" | "okay" | "poor" | "bad";

interface JournalEntryData {
  id: string;
  date: string;
  inputMethod: "voice" | "text";
  rawInput: string;
  summary: string;
  symptoms: { name: string; severity: number }[];
  mood: MoodLevel;
}

const moodEmojis: Record<MoodLevel, { emoji: string; label: string; color: string }> = {
  great: { emoji: "😊", label: "Great", color: "var(--med-emerald-500)" },
  good: { emoji: "🙂", label: "Good", color: "var(--med-teal-500)" },
  okay: { emoji: "😐", label: "Okay", color: "var(--med-amber-500)" },
  poor: { emoji: "😔", label: "Poor", color: "var(--med-coral-400)" },
  bad: { emoji: "😞", label: "Bad", color: "var(--med-coral-600)" },
};

// --- Mock Data ---

const mockEntries: JournalEntryData[] = [
  {
    id: "1",
    date: new Date().toISOString(),
    inputMethod: "voice",
    rawInput: "I felt a bit dizzy this morning after taking my medication. Headache is mostly gone though. Energy levels are decent.",
    summary: "Mild dizziness in the morning (possibly medication-related). Headache improving. Normal energy levels.",
    symptoms: [
      { name: "Dizziness", severity: 2 },
      { name: "Headache", severity: 1 },
    ],
    mood: "good",
  },
  {
    id: "2",
    date: new Date(Date.now() - 86400000).toISOString(),
    inputMethod: "text",
    rawInput: "Had a bad headache all day. Feeling tired and nauseous. Took extra rest.",
    summary: "Persistent headache throughout the day. Fatigue and nausea present. Patient rested more than usual.",
    symptoms: [
      { name: "Headache", severity: 4 },
      { name: "Fatigue", severity: 3 },
      { name: "Nausea", severity: 2 },
    ],
    mood: "poor",
  },
  {
    id: "3",
    date: new Date(Date.now() - 172800000).toISOString(),
    inputMethod: "voice",
    rawInput: "Feeling much better today. No pain, good sleep last night. Blood sugar was 110.",
    summary: "Significant improvement. No pain reported. Good sleep quality. Blood glucose at 110 mg/dL (well-controlled).",
    symptoms: [],
    mood: "great",
  },
];

export default function JournalPage() {
  const [mounted, setMounted] = useState(false);
  const [entries] = useState<JournalEntryData[]>(mockEntries);
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleListening = () => {
    setIsListening((prev) => !prev);
    if (!isListening) {
      // Mock voice input
      setTimeout(() => {
        setInputText("Feeling okay today. Some mild back pain but manageable. Took all my morning medications on time.");
        setIsListening(false);
      }, 3000);
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
    const colors = [
      "var(--med-emerald-500)",
      "var(--med-teal-500)",
      "var(--med-amber-500)",
      "var(--med-coral-400)",
      "var(--med-coral-600)",
    ];
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className="w-4 h-1.5 rounded-full transition-all"
            style={{
              backgroundColor: level <= severity ? colors[severity - 1] : "var(--card-border)",
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto gradient-mesh min-h-screen">
      {/* Header */}
      <div
        className={`mb-8 transition-all duration-700 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1 className="text-3xl font-bold font-[family-name:var(--font-outfit)] mb-1">
          Symptom Journal
        </h1>
        <p className="text-foreground-muted">
          Track how you feel daily — speak or type your entries
        </p>
      </div>

      {/* New Entry Card */}
      <div
        className={`glass-card-strong p-6 mb-8 transition-all duration-700 delay-100 ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h2 className="text-lg font-bold font-[family-name:var(--font-outfit)] mb-4">
          How are you feeling today?
        </h2>

        {/* Mood Selector */}
        <div className="flex items-center gap-2 mb-4">
          {(Object.keys(moodEmojis) as MoodLevel[]).map((mood) => (
            <button
              key={mood}
              onClick={() => setSelectedMood(mood)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                selectedMood === mood
                  ? "glass-card scale-105 ring-2"
                  : "hover:bg-[var(--card-bg)]"
              }`}
              style={selectedMood === mood ? { borderColor: moodEmojis[mood].color, outlineColor: moodEmojis[mood].color } : {}}
            >
              <span className="text-2xl">{moodEmojis[mood].emoji}</span>
              <span className="text-xs font-medium text-foreground-muted">
                {moodEmojis[mood].label}
              </span>
            </button>
          ))}
        </div>

        {/* Voice / Text Input */}
        <div className="relative mb-4">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Describe your symptoms, energy levels, side effects..."
            className="w-full h-28 p-4 pr-14 rounded-xl glass-card resize-none text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--med-teal-500)] bg-transparent"
          />
          {/* Voice button */}
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
        </div>

        {isListening && (
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--med-coral-500)]/5 border border-[var(--med-coral-500)]/20 animate-fade-in">
            {/* Audio wave bars */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--med-coral-500)] rounded-full animate-wave"
                  style={{
                    height: `${8 + Math.random() * 12}px`,
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              ))}
            </div>
            <span className="text-sm text-[var(--med-coral-500)] font-medium">
              Listening... speak naturally
            </span>
          </div>
        )}

        {/* Submit */}
        <button
          className="btn-primary w-full py-3"
          disabled={!inputText && !selectedMood}
        >
          <span className="flex items-center justify-center gap-2">
            <SparklesIcon className="w-4 h-4" />
            Save Entry with AI Summary
          </span>
        </button>
      </div>

      {/* Entry History */}
      <div>
        <h2
          className={`text-lg font-bold font-[family-name:var(--font-outfit)] mb-4 transition-all duration-700 delay-200 ${
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          Previous Entries
        </h2>

        <div className="space-y-4">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className={`glass-card-strong p-5 transition-all duration-700 ${
                mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: `${300 + i * 100}ms` }}
            >
              {/* Entry Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{moodEmojis[entry.mood].emoji}</span>
                  <div>
                    <div className="text-sm font-semibold">{formatDate(entry.date)}</div>
                    <div className="text-xs text-foreground-muted flex items-center gap-1">
                      {entry.inputMethod === "voice" ? (
                        <>
                          <MicIcon className="w-3 h-3" />
                          Voice entry
                        </>
                      ) : (
                        <>
                          <SendIcon className="w-3 h-3" />
                          Text entry
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className="badge"
                  style={{
                    backgroundColor: `${moodEmojis[entry.mood].color}20`,
                    color: moodEmojis[entry.mood].color,
                  }}
                >
                  {moodEmojis[entry.mood].label}
                </span>
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
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
                    Symptoms
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {entry.symptoms.map((symptom, si) => (
                      <div
                        key={si}
                        className="glass-card px-3 py-2 flex items-center gap-2"
                      >
                        <span className="text-xs font-medium">{symptom.name}</span>
                        {severityBar(symptom.severity)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Raw Input (collapsed) */}
              <details className="mt-3">
                <summary className="text-xs text-foreground-muted cursor-pointer hover:text-foreground transition-colors">
                  View original input
                </summary>
                <p className="text-xs text-foreground-muted mt-2 p-3 rounded-lg bg-[var(--background-secondary)] leading-relaxed">
                  &ldquo;{entry.rawInput}&rdquo;
                </p>
              </details>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-12 glass-card p-4 text-xs text-foreground-muted leading-relaxed text-center">
        ⚕️ <strong>Not medical advice.</strong> Journal entries are processed by AI for summarization only.
        Share these with your healthcare provider during visits.
      </div>
    </div>
  );
}
