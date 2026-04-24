import { aiChat, getActiveBackend } from "@/lib/ai-client";
import { PILL_ANALYSIS_PROMPT } from "@/lib/prompts";
import type { AIMessage } from "@/types";

export async function POST(request: Request): Promise<Response> {
  let body: { imageBase64?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { imageBase64 } = body;
  if (!imageBase64) {
    return Response.json({ error: "imageBase64 is required" }, { status: 400 });
  }

  const backend = await getActiveBackend();
  if (!backend) {
    return Response.json({ error: "No AI backend available" }, { status: 503 });
  }

  const messages: AIMessage[] = [
    {
      role: "user",
      content: PILL_ANALYSIS_PROMPT,
      images: [imageBase64],
    },
  ];

  try {
    const response = await aiChat(messages, backend);
    const raw = response.message.trim();

    // Strip markdown code fences if present
    const json = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(json);
    } catch {
      return Response.json(
        { error: "AI returned non-JSON response", raw },
        { status: 422 }
      );
    }

    return Response.json({ ...parsed, backend }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
