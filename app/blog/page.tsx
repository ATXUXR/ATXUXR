import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PostCard } from "@/components/PostCard";
import { FeaturedPost } from "@/components/FeaturedPost";
import { getAllPublishedTags, getPublishedPosts } from "@/lib/posts";
import { createClient } from "@/lib/supabase/server";
import { BlogToolbar } from "./BlogToolbar";

export const metadata = { title: "Blog" };

interface PageProps {
  searchParams: Promise<{ q?: string; tag?: string }>;
}

export default async function BlogPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const tag = (sp.tag ?? "").trim();

  const [posts, tags] = await Promise.all([
    getPublishedPosts({ q, tag }),
    getAllPublishedTags(),
  ]);

  // Check signed-in state & admin status.
  let signedIn = false;
  let isAdmin = false;
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    signedIn = Boolean(user);

    if (user) {
      const { data: member } = await supabase
        .from("members")
        .select("admin")
        .eq("id", user.id)
        .maybeSingle();
      isAdmin = Boolean(member?.admin);
    }
  }

  const filtering = Boolean(q) || Boolean(tag);
  const featured = !filtering && posts[0];
  const rest = featured ? posts.slice(1) : posts;
  const contributeHref = signedIn ? "/blog/new" : "/?auth=signin&next=/blog/new";

  return (
    <>
      {/* HERO */}
      <section
        style={{
          position: "relative",
          overflow: "hidden",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -300,
            left: "50%",
            transform: "translateX(-50%)",
            width: 1000,
            height: 600,
            background:
              "radial-gradient(circle at 50% 50%, rgba(238,74,28,0.13), transparent 64%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "64px 28px 30px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: 24,
            }}
          >
            <div style={{ maxWidth: "34ch" }}>
              <Eyebrow style={{ marginBottom: 14 }}>FIELD NOTES</Eyebrow>
              <h1
                style={{
                  fontSize: "clamp(2.3rem, 1.6rem + 2.4vw, 3.4rem)",
                  lineHeight: 1.02,
                  margin: "0 0 14px",
                }}
              >
                The ATX UXR <span style={{ color: "var(--primary)" }}>Blog</span>
              </h1>
              <p className="lead" style={{ fontSize: 18, margin: 0 }}>
                Insights, methods, and stories from Austin&apos;s UX research
                community. Written by members, for members.
              </p>
            </div>
            <Link href={contributeHref} style={{ textDecoration: "none" }}>
              <Btn variant="primary" size="lg" icon="pen-line">
                Contribute a post
              </Btn>
            </Link>
          </div>
        </div>
      </section>

      <BlogToolbar tags={tags} q={q} activeTag={tag} />

      <section style={{ background: "var(--bg)", minHeight: "40vh" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "40px 28px 80px",
          }}
        >
          {posts.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "70px 20px",
                color: "var(--fg-muted)",
              }}
            >
              <Icon
                name="search-x"
                size={40}
                style={{ color: "var(--fg-subtle)" }}
              />
              <h3
                style={{
                  fontSize: 22,
                  margin: "14px 0 6px",
                  color: "var(--fg)",
                }}
              >
                {filtering ? "No posts found" : "No posts yet"}
              </h3>
              <p style={{ margin: 0 }}>
                {filtering
                  ? "Try a different search or clear your filters."
                  : "Check back soon, or write the first post!"}
              </p>
            </div>
          ) : (
            <>
              {featured && (
                <div style={{ marginBottom: 34 }}>
                  <FeaturedPost post={featured} isAdmin={isAdmin} showStatus={isAdmin} />
                </div>
              )}
              {rest.length > 0 && (
                <div
                  className="blog-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 24,
                  }}
                >
                  {rest.map((p) => (
                    <PostCard key={p.id} post={p} isAdmin={isAdmin} showStatus={isAdmin} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
