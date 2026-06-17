import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { initials, toneForName } from "@/lib/utils";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  // If Supabase isn't configured, fall back to a friendly stub.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <section style={{ background: "var(--bg)" }}>
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "96px 28px",
            textAlign: "center",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(2rem, 1.4rem + 2vw, 3rem)",
              margin: "0 0 14px",
            }}
          >
            Sign in to view your profile
          </h1>
          <p style={{ color: "var(--fg-muted)", marginBottom: 18 }}>
            Once Supabase is configured and you sign in, this is where your
            ATX UXR profile lives.
          </p>
        </div>
      </section>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=signin");

  const { data: member } = await supabase
    .from("members")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const name = member?.name ?? user.email ?? "Member";
  const tone = toneForName(name);

  return (
    <section style={{ background: "var(--bg)" }}>
      <div
        style={{
          maxWidth: 760,
          margin: "0 auto",
          padding: "64px 28px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: tone.bg,
              color: tone.fg,
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: 36,
            }}
          >
            {initials(name)}
          </span>
          <div>
            <h1
              style={{
                fontSize: "clamp(2rem, 1.4rem + 2vw, 2.8rem)",
                margin: 0,
              }}
            >
              {name}
            </h1>
            {(member?.role || member?.company) && (
              <div style={{ color: "var(--fg-muted)", marginTop: 4 }}>
                {[member?.role, member?.company].filter(Boolean).join(" at ")}
              </div>
            )}
            {member?.location && (
              <div style={{ color: "var(--fg-subtle)", marginTop: 2, fontSize: 14 }}>
                {member.location}
              </div>
            )}
          </div>
        </div>
        {member?.bio && (
          <p style={{ fontSize: 16.5, color: "var(--fg-muted)", marginBottom: 20 }}>
            {member.bio}
          </p>
        )}
        {member?.expertise && member.expertise.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
            {member.expertise.map((t: string) => (
              <span
                key={t}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 10px",
                  borderRadius: "var(--radius-pill)",
                  background: "var(--orange-50)",
                  color: "var(--orange-700)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <Link href="/onboarding" style={{ textDecoration: "none" }}>
          <Btn variant="secondary" icon="settings">
            Edit profile
          </Btn>
        </Link>
        <div
          style={{
            marginTop: 28,
            padding: "16px 18px",
            border: "1px dashed var(--border-strong)",
            borderRadius: "var(--radius-lg)",
            color: "var(--fg-muted)",
            fontSize: 14,
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Icon name="info" size={16} />
          The full profile view + posts list is part of the community phase.
        </div>
      </div>
    </section>
  );
}
