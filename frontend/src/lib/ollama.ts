import type { AIMessage, AIResponse } from "@/types";

const BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "gemma3:4b";

export async function ollamaChat(
  messages: AIMessage[],
  model = DEFAULT_MODEL
): Promise<AIResponse> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return {
    message: data.message?.content ?? "",
    backend: "ollama",
    model,
  };
}

export async function ollamaChatStream(
  messages: AIMessage[],
  model = DEFAULT_MODEL
): Promise<ReadableStream<string>> {
  const res = await fetch(`${BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Ollama stream error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      const lines = decoder.decode(value).split("\n").filter(Boolean);
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.message?.content) {
            controller.enqueue(parsed.message.content);
          }
          if (parsed.done) controller.close();
        } catch {
          // skip malformed lines
        }
      }
    },
  });
}

export async function checkOllamaConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}
