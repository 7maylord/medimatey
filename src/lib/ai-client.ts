import type { AIMessage, AIResponse, AIBackend } from "@/types";
import { ollamaChat, ollamaChatStream, checkOllamaConnection } from "./ollama";
import { googleAIChat, googleAIChatStream, isGoogleAIAvailable } from "./google-ai";

export type { AIBackend };

async function resolveBackend(): Promise<AIBackend> {
  const ollamaOk = await checkOllamaConnection();
  if (ollamaOk) return "ollama";
  if (isGoogleAIAvailable()) return "google-ai";
  throw new Error("No AI backend available. Start Ollama or set GOOGLE_AI_API_KEY.");
}

export async function aiChat(
  messages: AIMessage[],
  preferredBackend?: AIBackend
): Promise<AIResponse> {
  const backend = preferredBackend ?? (await resolveBackend());

  if (backend === "ollama") return ollamaChat(messages);
  return googleAIChat(messages);
}

export async function aiChatStream(
  messages: AIMessage[],
  preferredBackend?: AIBackend
): Promise<ReadableStream<string>> {
  const backend = preferredBackend ?? (await resolveBackend());

  if (backend === "ollama") return ollamaChatStream(messages);
  return googleAIChatStream(messages);
}

export async function getActiveBackend(): Promise<AIBackend | null> {
  try {
    return await resolveBackend();
  } catch {
    return null;
  }
}
