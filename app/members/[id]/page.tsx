import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Icon } from "@/components/ui/Icon";
import { Tag } from "@/components/ui/Tag";
import { Avatar } from "@/components/ui/Avatar";
import { PostCard } from "@/components/PostCard";
import { ProfileLinks } from "@/components/ProfileLinks";
import { formatDate, toneForTag } from "@/lib/utils";
import { getPostsByAuthor } from "@/lib/posts";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMember(id: string) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("members")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) return { title: "Member not found" };
  const name = member.name || "ATX UXR member";
  const subtitle =
    [member.role, member.company].filter(Boolean).join(" at ") ||
    "Austin UX researcher";
  return {
    title: name,
    description: `${name} — ${subtitle}. Part of the ATX UXR community.`,
    openGraph: {
      title: `${name} · ATX UXR`,
      description: `${subtitle} in the ATX UXR community.`,
      type: "profile",
      images: member.photo ? [{ url: member.photo }] : undefined,
    },
  };
}

export default async function MemberProfilePage({ params }: PageProps) {
  const { id } = await params;
  const member = await getMember(id);
  if (!member) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isMe = user?.id === member.id;

  const posts = await getPostsByAuthor(member.id);

  return (
    <>
      <section
        style={{
          position: "relative",
          background: "var(--neutral-950)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.5,
            background:
              "radial-gradient(900px 380px at 30% -20%, rgba(238,74,28,0.4), transparent 60%), radial-gradient(700px 320px at 90% 0%, rgba(15,126,108,0.3), transparent 60%)",
          }}
        />
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "30px 28px 0",
            position: "relative",
          }}
        >
          <Link
            href="/community"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontWeight: 600,
              fontSize: 14,
              color: "rgba(247,242,236,0.75)",
              textDecoration: "none",
            }}
          >
            <Icon name="arrow-left" size={16} /> Community
          </Link>
        </div>
        <div style={{ height: 60 }} />
      </section>

      <section style={{ background: "var(--bg)" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "0 28px 70px",
          }}
        >
          <div
            className="profile-header-card"
            style={{
              marginTop: -56,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-xl)",
              boxShadow: "var(--shadow-md)",
              padding: "0 32px 30px",
            }}
          >
            <div style={{ marginTop: -44 }}>
              <Avatar
                member={member}
                size={112}
                ring
                style={{ boxShadow: "0 0 0 5px var(--surface)" }}
              />
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 18,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: "1 1 340px", minWidth: 240 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <h1
                    style={{
                      fontSize: "clamp(1.9rem, 1.5rem + 1.2vw, 2.5rem)",
                      margin: 0,
                      lineHeight: 1.08,
                    }}
                  >
                    {member.name || "Unnamed member"}
                  </h1>
                  {member.admin && <Tag tone="ink">Organizer</Tag>}
                  {isMe && <Tag tone="flame">You</Tag>}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    color: "var(--fg-muted)",
                    marginTop: 8,
                  }}
                >
                  {member.role}
                  {member.company && (
                    <>
                      {" "}
                      at{" "}
                      <strong style={{ color: "var(--fg)", fontWeight: 600 }}>
                        {member.company}
                      </strong>
                    </>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: "6px 18px",
                    flexWrap: "wrap",
                    marginTop: 12,
                    fontSize: 14,
                    color: "var(--fg-muted)",
                  }}
                >
                  {member.location && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <Icon name="map-pin" size={15} />
                      {member.location}
                    </span>
                  )}
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <Icon name="calendar" size={15} />
                    Joined {formatDate(member.joined)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div
            className="profile-body"
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1fr",
              gap: 36,
              marginTop: 36,
              alignItems: "start",
            }}
          >
            <div>
              {member.bio && (
                <div style={{ marginBottom: 34 }}>
                  <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 12px" }}>
                    About
                  </h2>
                  <p
                    style={{
                      fontSize: 16.5,
                      color: "var(--fg-muted)",
                      lineHeight: 1.65,
                      margin: 0,
                    }}
                  >
                    {member.bio}
                  </p>
                </div>
              )}
              <div>
                <h2 style={{ fontSize: "var(--text-2xl)", margin: "0 0 16px" }}>
                  Posts by {(member.name || "this member").split(" ")[0]}
                  {posts.length > 0 && (
                    <span
                      style={{ color: "var(--fg-subtle)", fontWeight: 400 }}
                    >
                      {" "}
                      ({posts.length})
                    </span>
                  )}
                </h2>
                {posts.length === 0 ? (
                  <div
                    style={{
                      padding: "34px 28px",
                      textAlign: "center",
                      background: "var(--surface)",
                      border: "1px dashed var(--border-strong)",
                      borderRadius: "var(--radius-lg)",
                      color: "var(--fg-muted)",
                    }}
                  >
                    <Icon
                      name="pen-line"
                      size={26}
                      style={{ color: "var(--fg-subtle)" }}
                    />
                    <p style={{ margin: "10px 0 0", fontSize: 14.5 }}>
                      No posts published yet.
                    </p>
                  </div>
                ) : (
                  <div
                    className="profile-posts"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, 1fr)",
                      gap: 20,
                    }}
                  >
                    {posts.map((p) => (
                      <PostCard key={p.id} post={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            <aside
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {member.expertise && member.expertise.length > 0 && (
                <div
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-lg)",
                    padding: "22px 24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: 15,
                      margin: "0 0 14px",
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--fg-subtle)",
                    }}
                  >
                    Research interests
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {member.expertise.map((t: string) => (
                      <Tag key={t} tone={toneForTag(t)}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
              <ProfileLinks
                linkedin={member.linkedin}
                website={member.website}
                email={member.email}
                showEmail={Boolean(user)}
              />
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
