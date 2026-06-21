import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/Avatar";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { PostCover } from "@/components/ui/PostCover";
import { PostCard } from "@/components/PostCard";
import { ShareBar } from "@/components/ShareBar";
import { ReactionsBar } from "@/components/ReactionsBar";
import { Comments, type CommentRecord } from "@/components/Comments";
import { ViewTracker } from "@/components/ViewTracker";
import { formatDate, toneForTag } from "@/lib/utils";
import { getPostById, getRelatedPosts } from "@/lib/posts";
import { AdminBlogToolbar } from "@/components/AdminBlogToolbar";

interface PageProps {
  params: Promise<{ id: string }>;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://atxuxr.com";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post || post.status !== "published") {
    return { title: "Post not found" };
  }
  const url = `${SITE_URL}/blog/${post.id}`;
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url,
      images: post.cover ? [{ url: post.cover }] : undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      publishedTime: post.created_at,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPostById(id);
  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Visibility: pending posts are only visible to the author or admins.
  if (post.status !== "published") {
    let canSee = false;
    if (user) {
      if (user.id === post.author_id) canSee = true;
      else {
        const { data: me } = await supabase
          .from("members")
          .select("admin")
          .eq("id", user.id)
          .maybeSingle();
        canSee = Boolean(me?.admin);
      }
    }
    if (!canSee) notFound();
  }

  // Comments + reactions + current member name
  const [commentsRes, reactionsRes, myMemberRes] = await Promise.all([
    supabase
      .from("comments")
      .select(
        `id, post_id, author_id, name, text, created_at,
         author:members!comments_author_id_fkey(id, name, photo)`,
      )
      .eq("post_id", post.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("reactions")
      .select("type, member_id")
      .eq("post_id", post.id),
    user
      ? supabase
          .from("members")
          .select("id, name, photo, admin")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const comments = (commentsRes.data ?? []).map((c) => {
    // Supabase returns joined relations as either an object or an array in
    // some setups — normalize defensively.
    const authorRaw = (c as { author: unknown }).author;
    const author = Array.isArray(authorRaw) ? authorRaw[0] : authorRaw;
    return {
      id: c.id,
      author_id: c.author_id,
      name: c.name,
      text: c.text,
      created_at: c.created_at,
      author: author as CommentRecord["author"],
    };
  }) as CommentRecord[];

  const counts = { up: 0, heart: 0, insight: 0 };
  const mine: Record<"up" | "heart" | "insight", boolean> = {
    up: false,
    heart: false,
    insight: false,
  };
  (reactionsRes.data ?? []).forEach((r) => {
    const t = r.type as "up" | "heart" | "insight";
    counts[t] = (counts[t] || 0) + 1;
    if (user && r.member_id === user.id) mine[t] = true;
  });

  const related = await getRelatedPosts(post);
  const articleUrl = `${SITE_URL}/blog/${post.id}`;

  const currentMember = (myMemberRes as { data: { id: string; name: string; photo: string | null } | null })
    .data;

  return (
    <>
      <ViewTracker postId={post.id} />
      <article style={{ background: "var(--bg)" }}>
        {/* HEADER */}
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "40px 28px 22px",
          }}
        >
          <Link
            href="/blog"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 600,
              fontSize: 14,
              color: "var(--fg-muted)",
              textDecoration: "none",
              marginBottom: 26,
            }}
          >
            <Icon name="arrow-left" size={16} /> All posts
          </Link>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 18,
            }}
          >
            {(post.tags ?? []).map((t) => (
              <Tag key={t} tone={toneForTag(t)} style={{ fontSize: 10 }}>
                {t}
              </Tag>
            ))}
          </div>
          <h1
            style={{
              fontSize: "clamp(2.1rem, 1.5rem + 2.4vw, 3.1rem)",
              lineHeight: 1.05,
              margin: "0 0 18px",
            }}
          >
            {post.title}
          </h1>
          <p className="lead" style={{ fontSize: 20, lineHeight: 1.5, margin: "0 0 28px" }}>
            {post.excerpt}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 18,
              flexWrap: "wrap",
              paddingBottom: 26,
              borderBottom: "1px solid var(--border)",
            }}
          >
            <Link
              href={post.author ? `/members/${post.author.id}` : "#"}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <Avatar member={post.author} size={46} />
              <div style={{ lineHeight: 1.3 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: "var(--fg)",
                  }}
                >
                  {post.author?.name || "Unknown"}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11.5,
                    color: "var(--fg-subtle)",
                  }}
                >
                  {formatDate(post.created_at)} · {post.read_mins} min read
                </div>
              </div>
            </Link>
            <ShareBar title={post.title} url={articleUrl} />
          </div>
        </div>

        {/* COVER */}
        <div
          style={{
            maxWidth: 920,
            margin: "0 auto 8px",
            padding: "0 28px",
          }}
        >
          <PostCover post={post} height={380} radius="var(--radius-xl)" flat />
        </div>

        {/* BODY */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "34px 28px 10px",
          }}
        >
          <div
            className="atx-prose"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />
        </div>

        {/* REACTIONS */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "14px 28px 0",
          }}
        >
          <ReactionsBar
            postId={post.id}
            counts={counts}
            mine={mine}
            signedIn={Boolean(user)}
          />
        </div>

        {/* SHARE FOOTER */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "18px 28px 36px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
              padding: "22px 0",
              borderTop: "1px solid var(--border)",
              borderBottom: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--fg)",
              }}
            >
              Found this useful? Pass it on.
            </span>
            <ShareBar title={post.title} url={articleUrl} label={false} />
          </div>
        </div>

        {/* AUTHOR CARD */}
        {post.author && (
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              padding: "0 28px 20px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 18,
                alignItems: "flex-start",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
                padding: "26px 28px",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <Avatar member={post.author} size={64} />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--fg-subtle)",
                    marginBottom: 6,
                  }}
                >
                  Written by
                </div>
                <h3 style={{ fontSize: 21, margin: "0 0 2px" }}>
                  {post.author.name}
                </h3>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--fg-muted)",
                    marginBottom: 10,
                  }}
                >
                  {post.author.role}
                  {post.author.company ? ` · ${post.author.company}` : ""}
                </div>
                {post.author.bio && (
                  <p
                    style={{
                      fontSize: 14.5,
                      color: "var(--fg-muted)",
                      lineHeight: 1.55,
                      margin: "0 0 14px",
                    }}
                  >
                    {post.author.bio}
                  </p>
                )}
                <Link
                  href={`/members/${post.author.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <Btn variant="secondary" size="sm" iconRight="arrow-right">
                    View profile
                  </Btn>
                </Link>
              </div>
            </div>
          </div>
        )}

        <AdminBlogToolbar postId={post.id} isAdmin={Boolean(currentMember?.admin)} />

        {/* COMMENTS */}
        <Comments
          postId={post.id}
          comments={comments}
          currentMember={currentMember}
        />
      </article>

      {related.length > 0 && (
        <section
          style={{
            background: "var(--bg-alt)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div
            style={{
              maxWidth: 1140,
              margin: "0 auto",
              padding: "60px 28px 80px",
            }}
          >
            <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 28px" }}>
              More from the community
            </h2>
            <div
              className="blog-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
