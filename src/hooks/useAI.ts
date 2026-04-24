"use client";

import { useState, useCallback, useEffect } from "react";
import type { AIMessage, AIBackend, DrugInteraction } from "@/types";

interface AIState {
  loading: boolean;
  error: string | null;
  response: string;
  backend: AIBackend | null;
  isConnected: boolean;
}

export function useAI() {
  const [state, setState] = useState<AIState>({
    loading: false,
    error: null,
    response: "",
    backend: null,
    isConnected: false,
  });

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ai-status");
      const data = await res.json();
      setState((prev) => ({
        ...prev,
        isConnected: data.isConnected,
        backend: data.backend,
      }));
    } catch {
      setState((prev) => ({ ...prev, isConnected: false, backend: null }));
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const chat = useCallback(async (messages: AIMessage[]): Promise<string> => {
    setState((prev) => ({ ...prev, loading: true, error: null, response: "" }));
    let full = "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const backend = (res.headers.get("X-AI-Backend") ?? null) as AIBackend | null;
      setState((prev) => ({ ...prev, backend, isConnected: true }));

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        full += chunk;
        setState((prev) => ({ ...prev, response: prev.response + chunk }));
      }

      setState((prev) => ({ ...prev, loading: false }));
      return full;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({ ...prev, loading: false, error: message }));
      throw err;
    }
  }, []);

  const analyzePill = useCallback(
    async (imageBase64: string): Promise<Record<string, unknown>> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await fetch("/api/analyze-pill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64 }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

        setState((prev) => ({
          ...prev,
          loading: false,
          backend: data.backend ?? prev.backend,
        }));
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  const checkInteractions = useCallback(
    async (drugs: string[]): Promise<DrugInteraction[]> => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const res = await fetch("/api/interactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drugs }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);

        setState((prev) => ({ ...prev, loading: false }));
        return data.interactions ?? [];
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setState((prev) => ({ ...prev, loading: false, error: message }));
        throw err;
      }
    },
    []
  );

  return {
    ...state,
    chat,
    analyzePill,
    checkInteractions,
    checkStatus,
  };
}
