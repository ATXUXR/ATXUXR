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
    "Academic research visualization with professional minimalist aesthetic. Show research methodology, data visualization, or insights in progress. Use muted earth tones (grays, blues, greens), clean typography, and scientific illustrations. Style: modern academic paper cover.",
  linkedin:
    "Corporate professional image optimized for LinkedIn. Show workplace collaboration, leadership, strategy, or business insights. Use professional color palette (blues, whites, modern accents), modern design, confident composition. Style: professional headshot or business meeting aesthetic.",
  medium:
    "Medium article feature image with warm, engaging storytelling aesthetic. Show narrative progression, human elements, or thoughtful reflection. Use warm color palette (oranges, warm blues, earth tones), illustrated style, narrative composition. Style: illustrated feature for thought leadership.",
  slack:
    "Casual team communication image that's friendly but professional. Show collaboration, discussion, or learning moments. Use friendly but not childish colors (approachable palette), approachable illustrations, conversational feel. Style: friendly team chat cover.",
  instagram:
    "Eye-catching Instagram visual designed for high engagement and shareability. Use bold, vibrant colors with high contrast, modern abstract or illustrated elements, striking composition. Style: Instagram post/story with trending aesthetic, visually compelling and memorable.",
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

    // Extract key themes from content for better visual representation
    const contentPreview = plainContent.substring(0, 300);
    const hasKeywords = (keywords: string[]) =>
      keywords.some(kw => contentPreview.toLowerCase().includes(kw.toLowerCase()));

    let themeHints = "";
    if (hasKeywords(["research", "study", "data", "analysis"])) {
      themeHints = "Focus on data visualization, research methodology, or analytical insights. ";
    } else if (hasKeywords(["team", "collaborate", "together", "meeting"])) {
      themeHints = "Focus on collaboration, teamwork, and human connection. ";
    } else if (hasKeywords(["learn", "growth", "develop", "improve"])) {
      themeHints = "Focus on learning, progress, and personal/professional growth. ";
    } else if (hasKeywords(["innovation", "new", "future", "build"])) {
      themeHints = "Focus on innovation, creativity, and forward-thinking concepts. ";
    }

    // Build image generation prompt
    const imagePrompt = `Create an image for a ${channel} post about: "${contentPreview}${contentPreview.length > 300 ? "..." : ""}"

    Visual theme: ${themeHints}
    Style guidelines: ${CHANNEL_IMAGE_PROMPTS[channel] || "Professional and engaging"}
    ${plainPrompt ? `Additional notes: ${plainPrompt}` : ""}

    Make the image directly relevant to the content topic. The visual should enhance understanding and encourage sharing on ${channel}.`;

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
