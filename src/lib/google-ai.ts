import type { AIMessage, AIResponse } from "@/types";

const API_KEY = process.env.GOOGLE_AI_API_KEY ?? "";
const DEFAULT_MODEL = process.env.GOOGLE_AI_MODEL ?? "gemma-3-4b-it";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiContent {
  role: "user" | "model";
  parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
}

function toGeminiMessages(messages: AIMessage[]): GeminiContent[] {
  const result: GeminiContent[] = [];

  for (const msg of messages) {
    if (msg.role === "system") {
      // Gemini doesn't have a system role — prepend as first user turn
      result.push({
        role: "user",
        parts: [{ text: `[SYSTEM INSTRUCTIONS]\n${msg.content}\n[END SYSTEM INSTRUCTIONS]` }],
      });
      result.push({ role: "model", parts: [{ text: "Understood. I will follow these instructions." }] });
      continue;
    }

    const parts: GeminiContent["parts"] = [];
    if (msg.content) parts.push({ text: msg.content });
    if (msg.images) {
      for (const b64 of msg.images) {
        // Strip data URL prefix if present
        const data = b64.replace(/^data:image\/\w+;base64,/, "");
        parts.push({ inlineData: { mimeType: "image/jpeg", data } });
      }
    }

    result.push({ role: msg.role === "assistant" ? "model" : "user", parts });
  }

  return result;
}

export async function googleAIChat(
  messages: AIMessage[],
  model = DEFAULT_MODEL
): Promise<AIResponse> {
  if (!API_KEY) throw new Error("GOOGLE_AI_API_KEY is not set");

  const contents = toGeminiMessages(messages);

  const res = await fetch(
    `${BASE_URL}/models/${model}:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google AI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  return { message: text, backend: "google-ai", model };
}

export async function googleAIChatStream(
  messages: AIMessage[],
  model = DEFAULT_MODEL
): Promise<ReadableStream<string>> {
  if (!API_KEY) throw new Error("GOOGLE_AI_API_KEY is not set");

  const contents = toGeminiMessages(messages);

  const res = await fetch(
    `${BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents }),
    }
  );

  if (!res.ok || !res.body) {
    throw new Error(`Google AI stream error ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) { controller.close(); return; }

      const raw = decoder.decode(value);
      const lines = raw.split("\n");
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const json = JSON.parse(line.slice(6));
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
          if (text) controller.enqueue(text);
        } catch {
          // skip
        }
      }
    },
  });
}

export function isGoogleAIAvailable(): boolean {
  return Boolean(API_KEY);
}
