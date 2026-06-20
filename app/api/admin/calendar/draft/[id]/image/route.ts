import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/image-generation";

// Strip HTML tags for cleaner prompts
function htmlToPlainText(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .trim();
}

const CHANNEL_IMAGE_PROMPTS: Record<string, string> = {
  atxuxr:
    "Professional, minimalist, research-focused illustration with modern design. Clean typography and muted colors.",
  linkedin:
    "Professional, corporate-style image. Modern, clean aesthetic suitable for business professionals.",
  medium:
    "Engaging, narrative-driven illustration. Warm colors, storytelling focused, accessible design.",
  slack:
    "Friendly, approachable illustration. Casual but professional. Suitable for team communication.",
  instagram:
    "Visually striking, vibrant image. High contrast, shareable aesthetic. Engaging and inspiring.",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Check admin
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: member } = await supabase
    .from("members")
    .select("admin")
    .eq("id", user.id)
    .single();

  if (!member?.admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { channel, content, prompt } = body;

  if (!channel || !content) {
    return NextResponse.json(
      { error: "Channel and content required" },
      { status: 400 }
    );
  }

  try {
    // Convert HTML content to plain text for image generation
    const plainContent = htmlToPlainText(content);
    const plainPrompt = prompt ? htmlToPlainText(prompt) : "";

    // Build image generation prompt
    const imagePrompt = `Create an image for a ${channel} post about: "${plainContent.substring(0, 200)}${plainContent.length > 200 ? "..." : ""}"

    Style guidelines: ${CHANNEL_IMAGE_PROMPTS[channel] || "Professional and engaging"}
    ${plainPrompt ? `Additional context: ${plainPrompt}` : ""}

    The image should be visually appropriate for the content and the platform.`;

    // Generate image via Replicate
    const { url: imageUrl } = await generateImage(imagePrompt);

    // Store image URL in the draft version
    const { data: existing } = await supabase
      .from("calendar_draft_versions")
      .select("id")
      .eq("draft_id", id)
      .eq("channel", channel)
      .single();

    if (existing) {
      await supabase
        .from("calendar_draft_versions")
        .update({
          image_url: imageUrl,
          image_prompt: imagePrompt,
          updated_at: new Date().toISOString(),
        })
        .eq("draft_id", id)
        .eq("channel", channel);
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    const error = err instanceof Error ? err.message : "Image generation failed";
    console.error("Image generation error:", err);
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}
