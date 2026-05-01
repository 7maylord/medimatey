"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { getMedications } from "@/lib/storage";
import { useSpeech } from "@/hooks/useSpeech";
import type { AIMessage, Medication } from "@/types";

// ── Icons ───────────────────────────────────────────────────────────────────

function SendIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

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

function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
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

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

// ── Suggestion chips ─────────────────────────────────────────────────────────

const DEFAULT_SUGGESTIONS = [
  "What should I do if I miss a dose?",
  "Can I take ibuprofen with blood pressure medication?",
  "What are common side effects of statins?",
  "How do I store my medications safely?",
];

function medSuggestions(meds: Medication[]): string[] {
  if (meds.length === 0) return DEFAULT_SUGGESTIONS;
  const first = meds[0].name;
  const suggestions = [
    `What are the side effects of ${first}?`,
    `What should I know about taking ${first}?`,
    "Are there any interactions between my medications?",
    "What should I do if I miss a dose?",
  ];
  if (meds.length >= 2) {
    suggestions[2] = `Is it safe to take ${meds[0].name} with ${meds[1].name}?`;
  }
  return suggestions;
}

// ── Markdown-lite renderer ────────────────────────────────────────────────────
// Renders **bold**, *italic*, and bullet lists without a library.

function renderContent(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) {
      elements.push(<br key={i} />);
      continue;
    }

    const isBullet = /^[-*•]\s/.test(line);
    const content = isBullet ? line.replace(/^[-*•]\s/, "") : line;

    // Inline: **bold** and *italic*
    const formatted = content.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*"))
        return <em key={j}>{part.slice(1, -1)}</em>;
      return part;
    });

    if (isBullet) {
      elements.push(
        <div key={i} className="flex gap-2 items-start">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[var(--med-teal-500)] flex-shrink-0" />
          <span>{formatted}</span>
        </div>
      );
    } else {
      elements.push(<p key={i} className="leading-relaxed">{formatted}</p>);
    }
  }
  return <div className="space-y-1 text-sm">{elements}</div>;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [messages, setMessages]     = useState<ChatMessage[]>([]);
  const [input, setInput]           = useState("");
  const [streaming, setStreaming]   = useState(false);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [backend, setBackend]       = useState<string | null>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const abortRef   = useRef<AbortController | null>(null);

  const { isListening, transcript, isSupported, startListening, stopListening, clearTranscript } = useSpeech();

  // Load medications for context injection
  useEffect(() => {
    getMedications().then(setMedications);
  }, []);

  // Pull voice transcript into input
  useEffect(() => {
    if (transcript) setInput(transcript);
  }, [transcript]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const buildContext = useCallback((): string => {
    if (medications.length === 0) return "";
    const list = medications.map((m) => `${m.name} ${m.dosage} (${m.frequency.replace(/_/g, " ")})`).join(", ");
    return `[Patient context: currently taking ${list}]`;
  }, [medications]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    clearTranscript();
    setInput("");

    // Inject medication context into first user message only
    const contextPrefix = messages.length === 0 ? buildContext() : "";
    const userContent = contextPrefix ? `${contextPrefix}\n\n${trimmed}` : trimmed;

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMsg: ChatMessage = { id: crypto.randomUUID(), role: "assistant", content: "", streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    // Build full history for the API (use actual content, not display text)
    const history: AIMessage[] = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userContent },
    ];

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      setBackend(res.headers.get("X-AI-Backend"));

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setMessages((prev) =>
          prev.map((m) => m.id === assistantMsg.id ? { ...m, content: full } : m)
        );
      }

      setMessages((prev) =>
        prev.map((m) => m.id === assistantMsg.id ? { ...m, streaming: false } : m)
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, content: `Sorry, I couldn't get a response. ${msg}`, streaming: false }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [messages, streaming, buildContext, clearTranscript]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleVoice() {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      setInput("");
      startListening();
    }
  }

  const suggestions = medSuggestions(medications);

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)] glass-card-strong flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--med-teal-500)]/10 flex items-center justify-center">
            <SparklesIcon className="w-5 h-5 text-[var(--med-teal-500)]" />
          </div>
          <div>
            <h1 className="text-base font-bold font-[family-name:var(--font-outfit)]">Ask MediMate</h1>
            <p className="text-xs text-foreground-muted">
              {backend
                ? `Gemma 4 · ${backend === "ollama" ? "Local" : "Cloud"}`
                : "Powered by Gemma 4 AI"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { setMessages([]); setBackend(null); }}
            className="btn-icon w-8 h-8"
            title="Clear chat"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-6">

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-xl shadow-[var(--med-teal-500)]/20 mb-5">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold font-[family-name:var(--font-outfit)] mb-2">
              How can I help you?
            </h2>
            <p className="text-sm text-foreground-muted max-w-sm mb-8">
              Ask me anything about your medications, side effects, interactions, or general health questions.
            </p>
            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="glass-card px-4 py-2 text-sm hover:border-[var(--med-teal-500)]/40 hover:text-[var(--med-teal-500)] transition-all rounded-xl text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${
              msg.role === "user"
                ? "bg-[var(--med-indigo-500)]/20 text-[var(--med-indigo-500)]"
                : "bg-[var(--med-teal-500)]/20 text-[var(--med-teal-500)]"
            }`}>
              {msg.role === "user" ? "U" : <SparklesIcon className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[78%] rounded-2xl px-4 py-3 ${
              msg.role === "user"
                ? "bg-[var(--med-teal-500)]/15 border border-[var(--med-teal-500)]/20 rounded-tr-sm"
                : "glass-card rounded-tl-sm"
            }`}>
              {msg.role === "assistant" && msg.content
                ? renderContent(msg.content)
                : <p className="text-sm leading-relaxed">{msg.content}</p>
              }
              {/* Streaming cursor */}
              {msg.streaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-[var(--med-teal-500)] rounded-sm animate-pulse align-middle" />
              )}
              {/* Thinking indicator */}
              {msg.streaming && !msg.content && (
                <div className="flex gap-1 items-center py-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[var(--med-teal-500)]/60 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 px-4 md:px-6 py-4 border-t border-[var(--card-border)] glass-card-strong">
        {/* Listening indicator */}
        {isListening && (
          <div className="flex items-center gap-2 mb-2 text-xs text-[var(--med-coral-500)]">
            <span className="w-2 h-2 rounded-full bg-[var(--med-coral-500)] animate-pulse" />
            Listening… speak your question
          </div>
        )}

        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your medications…"
            className="flex-1 resize-none px-4 py-3 rounded-xl glass-card text-sm placeholder-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--med-teal-500)] bg-transparent max-h-32 overflow-y-auto"
            style={{ height: "auto" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
          />

          {isSupported && (
            <button
              onClick={handleVoice}
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isListening
                  ? "bg-[var(--med-coral-500)] text-white shadow-lg shadow-[var(--med-coral-500)]/30"
                  : "btn-icon"
              }`}
              title={isListening ? "Stop listening" : "Voice input"}
            >
              <MicIcon className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="w-11 h-11 rounded-xl bg-[var(--med-teal-500)] text-white flex items-center justify-center flex-shrink-0 hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--med-teal-500)]/20"
            title="Send"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-foreground-muted mt-2 text-center">
          Not medical advice · Always consult your healthcare provider
        </p>
      </div>

    </div>
  );
}
