import { NextResponse } from "next/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { icsForEvent } from "@/lib/calendar";
import { getEventById as getLegacyEvent, buildICS } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DbEvent {
  id: string;
  slug: string | null;
  title: string;
  description: string;
  where_: string;
  address: string | null;
  starts_at: string;
  ends_at: string | null;
}

function fileName(title: string): string {
  return (
    (title || "event")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") + ".ics"
  );
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  // Try DB first.
  if (isServiceClientConfigured()) {
    const supabase = createServiceClient();
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const q = supabase
      .from("events")
      .select(
        "id, slug, title, description, where_, address, starts_at, ends_at",
      );
    const { data } = await (isUuid ? q.eq("id", id) : q.eq("slug", id))
      .maybeSingle();
    if (data) {
      const e = data as DbEvent;
      const ics = icsForEvent({
        id: e.id,
        title: e.title,
        description: e.description || "",
        location: e.address || e.where_ || "",
        startsAt: e.starts_at,
        endsAt: e.ends_at,
      });
      return new NextResponse(ics, {
        status: 200,
        headers: {
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileName(e.title)}"`,
          "Cache-Control": "public, max-age=300",
        },
      });
    }
  }
  // Fall back to the hardcoded legacy events.
  const legacy = getLegacyEvent(id);
  if (legacy) {
    const ics = buildICS(legacy);
    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileName(legacy.title)}"`,
        "Cache-Control": "public, max-age=300",
      },
    });
  }
  return new NextResponse("Event not found", { status: 404 });
}
