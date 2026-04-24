import { getActiveBackend } from "@/lib/ai-client";
import { checkOllamaConnection } from "@/lib/ollama";
import { isGoogleAIAvailable } from "@/lib/google-ai";

export async function GET(): Promise<Response> {
  const [ollamaOk, activeBackend] = await Promise.all([
    checkOllamaConnection(),
    getActiveBackend(),
  ]);

  return Response.json({
    isConnected: activeBackend !== null,
    backend: activeBackend,
    ollama: ollamaOk,
    googleAI: isGoogleAIAvailable(),
  });
}
