import { aiChatStream, getActiveBackend } from "@/lib/ai-client";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import type { AIMessage } from "@/types";

export async function POST(request: Request): Promise<Response> {
  let body: { messages?: AIMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userMessages = body.messages;
  if (!Array.isArray(userMessages) || userMessages.length === 0) {
    return Response.json({ error: "messages array is required" }, { status: 400 });
  }

  const messages: AIMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...userMessages,
  ];

  try {
    const backend = await getActiveBackend();
    if (!backend) {
      return Response.json({ error: "No AI backend available" }, { status: 503 });
    }

    const stream = await aiChatStream(messages, backend);
    const textStream = stream.pipeThrough(
      new TransformStream<string, Uint8Array>({
        transform(chunk, controller) {
          controller.enqueue(new TextEncoder().encode(chunk));
        },
      })
    );

    return new Response(textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-AI-Backend": backend,
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
