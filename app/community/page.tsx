import Link from "next/link";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { Btn } from "@/components/ui/Button";
import { getAllMembers } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";
import { CommunityClient } from "./CommunityClient";

export const metadata = { title: "Community" };

export default async function CommunityPage() {
  const members = await getAllMembers();

  let me: { id: string } | null = null;
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    me = user ? { id: user.id } : null;
  }

  return (
    <>
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
              "radial-gradient(circle at 50% 50%, rgba(15,126,108,0.12), transparent 64%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "64px 28px 32px",
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
            <div style={{ maxWidth: "36ch" }}>
              <Eyebrow style={{ marginBottom: 14 }}>THE PEOPLE-PEOPLE</Eyebrow>
              <h1
                style={{
                  fontSize: "clamp(2.3rem, 1.6rem + 2.4vw, 3.4rem)",
                  lineHeight: 1.02,
                  margin: "0 0 14px",
                }}
              >
                Meet the community
              </h1>
              <p className="lead" style={{ fontSize: 18, margin: 0 }}>
                {members.length} Austin researchers connecting, learning, and
                reflecting together. Find a peer, a mentor, or a collaborator.
              </p>
            </div>
            {me ? (
              <Link href={`/members/${me.id}`} style={{ textDecoration: "none" }}>
                <Btn variant="secondary" size="lg" icon="user">
                  View my profile
                </Btn>
              </Link>
            ) : (
              <Link href="/?auth=signup" style={{ textDecoration: "none" }}>
                <Btn variant="primary" size="lg" icon="user-plus">
                  Join the community
                </Btn>
              </Link>
            )}
          </div>
        </div>
      </section>

      <CommunityClient members={members} />
    </>
  );
}
