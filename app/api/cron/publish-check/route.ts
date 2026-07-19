import { NextResponse } from "next/server";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { publishCalendarDraft } from "@/lib/publish-draft";
import { getResend, EMAIL_FROM } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called once a day by the Netlify scheduled function. Publishes every draft
// that's in 'scheduled' status with a scheduled_date of today or earlier,
// reusing the same publish path as the manual admin action. Guarded by a
// shared secret so the endpoint can't be triggered by the public.
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header =
    req.headers.get("authorization") || req.headers.get("x-cron-secret") || "";
  return header === `Bearer ${secret}` || header === secret;
}

async function run(req: Request) {
  if (!authorized(req))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isServiceClientConfigured())
    return NextResponse.json(
      { error: "Service role not configured" },
      { status: 503 },
    );

  const service = createServiceClient();

  // "Today" in the site's timezone (Central), as YYYY-MM-DD.
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
  }).format(new Date());

  const { data: due, error } = await service
    .from("calendar_drafts")
    .select("id, title, scheduled_date")
    .eq("status", "scheduled")
    .lte("scheduled_date", today);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  // Author for auto-published posts: env override, else the first admin.
  const { data: admin } = await service
    .from("members")
    .select("id, email")
    .eq("admin", true)
    .limit(1)
    .maybeSingle();
  const authorId = process.env.CRON_PUBLISH_AUTHOR_ID || admin?.id;
  const notifyTo = process.env.ADMIN_NOTIFY_EMAIL || admin?.email || null;

  if (!authorId)
    return NextResponse.json(
      { error: "No author available for publishing" },
      { status: 500 },
    );

  const publishedIds: string[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const d of due || []) {
    try {
      const res = await publishCalendarDraft(service, d.id, authorId);
      publishedIds.push(res.postId);
      await notifyPublished(d.title || "Untitled", res.url, notifyTo);
    } catch (e) {
      failed.push({
        id: d.id,
        error: e instanceof Error ? e.message : "publish failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    checked: (due || []).length,
    published: publishedIds.length,
    failed,
  });
}

async function notifyPublished(
  title: string,
  url: string,
  to: string | null,
) {
  const resend = getResend();
  if (!resend || !to) return;
  try {
    await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Published: ${title}`,
      text: `"${title}" was scheduled for today and is now live on the ATX UXR blog.\n\n${url}`,
    });
  } catch {
    // best-effort — never fail the run on email
  }
}

export async function POST(req: Request) {
  return run(req);
}
export async function GET(req: Request) {
  return run(req);
}
