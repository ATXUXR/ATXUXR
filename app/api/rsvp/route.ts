import { NextResponse } from "next/server";
import { z } from "zod";

const Schema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  guests: z.number().int().min(1).max(9),
});

// Stub handler: logs the RSVP and returns success.
// TODO: write to Supabase `rsvps` once the schema is provisioned.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  console.log("[rsvp] (stub)", parsed.data);
  return NextResponse.json({ ok: true });
}
