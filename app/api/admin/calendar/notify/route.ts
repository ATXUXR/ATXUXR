import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload: NotificationPayload = await req.json();

    // Build email body based on type
    let emailSubject = "";
    let emailBody = "";

    switch (payload.type) {
      case "scheduled":
        emailSubject = `📅 Content Scheduled: ${payload.title}`;
        emailBody = `
Your content has been scheduled for publication:

📝 Title: ${payload.title}
🏷️ Pillar: ${payload.pillar}
📅 Publish Date: ${new Date(payload.scheduledDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}

You'll receive a reminder notification when the content is published.
        `.trim();
        break;
      case "published":
        emailSubject = `✅ Content Published: ${payload.title}`;
        emailBody = `
Your scheduled content has been published!

📝 Title: ${payload.title}
🏷️ Pillar: ${payload.pillar}
📅 Published: ${new Date(payload.scheduledDate).toLocaleDateString()}

Congratulations on another great contribution to ATX UXR!
        `.trim();
        break;
      case "overdue":
        emailSubject = `⚠️ Pillar Update Needed: ${payload.pillar}`;
        emailBody = `
The "${payload.pillar}" pillar hasn't been updated recently and is falling behind schedule.

Consider scheduling new content for this pillar to maintain consistent cadence.

Visit your content calendar to schedule a new post.
        `.trim();
        break;
    }

    // Log the notification (in production, would send actual email via SendGrid/Resend/etc)
    console.log(`[NOTIFICATION] ${payload.type.toUpperCase()} - To: ${payload.recipientEmail}`);
    console.log(`Subject: ${emailSubject}`);
    console.log(`Body:\n${emailBody}`);

    // Store notification in database for audit trail
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
      created_at: new Date().toISOString(),
    });

    if (logError) {
      console.error("Error logging notification:", logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ success: true, notificationId: null });
  } catch (err) {
    console.error("Notification error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
