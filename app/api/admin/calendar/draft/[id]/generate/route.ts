import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface ClaudeMessage {
  content: Array<{ type: string; text: string }>;
}

const CHANNEL_GUIDELINES: Record<string, string> = {
  atxuxr:
    "This is for the ATXUXR blog (austinuxresearchers.com). It should be in-depth, thoughtful, and suitable for a professional research community. Include clear examples and citations. Maintain the warm, plainspoken voice of the community.",
  linkedin:
    "This is for LinkedIn. Make it professional, engaging, and optimized for the platform. Include a hook in the first 2 lines. Use short paragraphs. Add 1-2 relevant hashtags at the end. Target working UX professionals and researchers.",
  medium:
    "This is for Medium. Write for a broader audience than LinkedIn. Focus on storytelling and practical insights. Break it into digestible sections with clear headers. Include a compelling narrative arc.",
  slack:
    "This is for Slack. Keep it concise (under 500 words). Use conversational tone. Include a clear call-to-action or discussion prompt. Format for easy reading with line breaks.",
  instagram:
    "This is for Instagram. Create an engaging, visual post caption. Use accessible language. Include 3-5 relevant emojis and hashtags. Max 300 words. Make it shareable and inspiring.",
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
  const { channel } = body;

  if (!channel || !(channel in CHANNEL_GUIDELINES)) {
    return NextResponse.json(
      { error: "Invalid channel" },
      { status: 400 }
    );
  }

  // Get the draft
  const { data: draft, error: draftError } = await supabase
    .from("calendar_drafts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (draftError || !draft) {
    return NextResponse.json(
      { error: "Draft not found" },
      { status: 404 }
    );
  }

  if (!draft.main_content) {
    return NextResponse.json(
      { error: "Main content is required for generation" },
      { status: 400 }
    );
  }

  // Call Claude API to generate content
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-opus-4-6",
        max_tokens: 2000,
        messages: [
          {
            role: "user",
            content: `You are a social media and content adaptation specialist. Given the main content below, adapt it for the ${channel} platform following these guidelines:

${CHANNEL_GUIDELINES[channel]}

Original content:
${draft.main_content}

${draft.notes ? `Additional context: ${draft.notes}` : ""}

Please generate the adapted content. Return ONLY the adapted content without any preamble or explanation.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || "Claude API error" },
        { status: 500 }
      );
    }

    const data = (await response.json()) as ClaudeMessage;
    const generatedContent =
      data.content[0].type === "text" ? data.content[0].text : "";

    if (!generatedContent) {
      return NextResponse.json(
        { error: "Failed to generate content" },
        { status: 500 }
      );
    }

    // Save the generated content to the version
    const { data: existing } = await supabase
      .from("calendar_draft_versions")
      .select("id")
      .eq("draft_id", params.id)
      .eq("channel", channel)
      .single();

    let result;
    if (existing) {
      // Update existing version
      const { data: updated, error: updateError } = await supabase
        .from("calendar_draft_versions")
        .update({
          content: generatedContent,
          generated_from_main: true,
          last_generated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("draft_id", params.id)
        .eq("channel", channel)
        .select()
        .single();

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message },
          { status: 400 }
        );
      }

      result = updated;
    } else {
      // Create new version with generated content
      const { data: created, error: createError } = await supabase
        .from("calendar_draft_versions")
        .insert({
          draft_id: params.id,
          channel,
          enabled: true,
          content: generatedContent,
          generated_from_main: true,
          last_generated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 }
        );
      }

      result = created;
    }

    return NextResponse.json(result);
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to generate content: ${error}` },
      { status: 500 }
    );
  }
}
