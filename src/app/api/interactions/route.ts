import { checkInteractions } from "@/lib/drug-data";

export async function POST(request: Request): Promise<Response> {
  let body: { drugs?: string[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { drugs } = body;
  if (!Array.isArray(drugs) || drugs.length < 2) {
    return Response.json(
      { error: "drugs array with at least 2 entries is required" },
      { status: 400 }
    );
  }

  const result = checkInteractions(drugs);
  return Response.json(result, { status: 200 });
}
