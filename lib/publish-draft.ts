import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizeBody } from "./sanitize";
import { readMinutes } from "./utils";
import { BLURB_CHANNELS, channelBlurb, postUrl } from "./channel-blurbs";

export interface PublishResult {
  postId: string;
  url: string;
  alreadyPublished: boolean;
}

/** First ~40 words of the body, for posts.excerpt (NOT NULL on the blog). */
function deriveExcerpt(html: string): string {
  const text = (html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (!text) return "";
  const words = text.split(" ");
  const head = words.slice(0, 40).join(" ");
  return words.length > 40 ? head + "…" : head;
}

/** calendar_drafts.pillar may be a single string or an array; take the primary. */
function firstPillar(pillar: unknown): string | null {
  if (Array.isArray(pillar)) return (pillar[0] as string) ?? null;
  if (typeof pillar === "string" && pillar.trim()) return pillar;
  return null;
}

/**
 * Publish a calendar_draft to the live blog (`posts`). Shared by the manual
 * admin publish action and the scheduled auto-publish job.
 *
 * Guards against duplicates: if the draft already links a published post, that
 * post is returned untouched. `client` must be allowed to insert into posts and
 * update calendar_drafts (an admin-scoped server client, or the service client
 * for the unattended cron job). `authorId` becomes posts.author_id.
 */
export async function publishCalendarDraft(
  client: SupabaseClient,
  draftId: string,
  authorId: string,
): Promise<PublishResult> {
  const { data: draft, error: draftErr } = await client
    .from("calendar_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();

  if (draftErr || !draft) throw new Error("Draft not found");

  if (draft.published_post_id) {
    return {
      postId: draft.published_post_id,
      url: postUrl(draft.published_post_id),
      alreadyPublished: true,
    };
  }

  if (!draft.title) throw new Error("Draft needs a title before publishing");

  // Canonical blog body = the draft's main content (fall back to an atxuxr version).
  let bodyHtml: string = draft.main_content || "";
  if (!bodyHtml.trim()) {
    const { data: v } = await client
      .from("calendar_draft_versions")
      .select("content")
      .eq("draft_id", draftId)
      .eq("channel", "atxuxr")
      .maybeSingle();
    bodyHtml = v?.content || "";
  }
  if (!bodyHtml.trim()) throw new Error("Draft has no content to publish");

  const body = sanitizeBody(bodyHtml);

  const { data: post, error: postErr } = await client
    .from("posts")
    .insert({
      title: draft.title,
      excerpt: deriveExcerpt(body),
      body,
      cover: draft.cover_image_url || null,
      tags: Array.isArray(draft.topics) ? draft.topics : [],
      author_id: authorId,
      read_mins: readMinutes(body),
      pillar: firstPillar(draft.pillar),
      status: "published",
    })
    .select("id")
    .single();

  if (postErr || !post) throw new Error(postErr?.message || "Failed to create post");

  await client
    .from("calendar_drafts")
    .update({ status: "published", published_post_id: post.id })
    .eq("id", draftId);

  // Seed brief, editable channel blurbs that link back to the live post.
  const versions = BLURB_CHANNELS.map((channel) => ({
    draft_id: draftId,
    channel,
    enabled: true,
    content: channelBlurb(channel, draft.title as string, post.id),
    generated_from_main: false,
  }));
  await client
    .from("calendar_draft_versions")
    .upsert(versions, { onConflict: "draft_id,channel" });

  return { postId: post.id, url: postUrl(post.id), alreadyPublished: false };
}
