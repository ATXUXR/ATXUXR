import { NextRequest, NextResponse } from "next/server";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  // Phase 3 will wire this to a real analytics pipeline (or a post_views table).
  // For now it's a no-op so the client tracker doesn't 404.
  console.log("[view]", id);
  return NextResponse.json({ ok: true });
}
