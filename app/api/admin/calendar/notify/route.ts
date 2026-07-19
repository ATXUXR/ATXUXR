import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getResend, EMAIL_FROM } from "@/lib/resend";

interface NotificationPayload {
  type: "scheduled" | "published" | "overdue";
  pillar: string;
  title: string;
  scheduledDate: string;
  recipientEmail: string;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: NotificationPayload = await req.json();

    let emailSubject = "";
    let emailBody = "";
    switch (payload.type) {
      case "scheduled":
        emailSubject = `Scheduled: ${payload.title}`;
        emailBody = `"${payload.title}" (${payload.pillar}) is scheduled to publish on ${new Date(
          payload.scheduledDate,
        ).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })}.`;
        break;
      case "published":
        emailSubject = `Published: ${payload.title}`;
        emailBody = `"${payload.title}" (${payload.pillar}) is now live on the ATX UXR blog.`;
        break;
      case "overdue":
        emailSubject = `Pillar update needed: ${payload.pillar}`;
        emailBody = `The "${payload.pillar}" pillar is falling behind its usual cadence. Consider scheduling a new post.`;
        break;
    }

    // Best-effort send. Email is never a hard dependency — the audit row is
    // written either way, and a missing RESEND_API_KEY just skips the send.
    let sentAt: string | null = null;
    const resend = getResend();
    if (resend && payload.recipientEmail) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: payload.recipientEmail,
          subject: emailSubject,
          text: emailBody,
        });
        sentAt = new Date().toISOString();
      } catch (e) {
        console.error("notify: email send failed", e);
      }
    }

    const { error: logError } = await supabase.from("notifications").insert({
      type: payload.type,
      recipient_email: payload.recipientEmail,
      subject: emailSubject,
      body: emailBody,
      metadata: {
        pillar: payload.pillar,
        title: payload.title,
        scheduledDate: payload.scheduledDate,
      },
      sent_at: sentAt,
      created_at: new Date().toISOString(),
    });
    if (logError) console.error("Error logging notification:", logError);

    return NextResponse.json({ success: true, emailed: sentAt !== null });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
