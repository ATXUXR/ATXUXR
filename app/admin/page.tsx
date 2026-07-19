import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { getAdminBundle } from "@/lib/admin";
import { AdminShell } from "./AdminShell";

export const metadata = { title: "Admin" };

interface PageProps {
  searchParams: Promise<{ tab?: string; days?: string }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const tab = (sp.tab ?? "content-submissions") as
    | "content-submissions"
    | "content-schedule"
    | "calendar"
    | "events"
    | "share"
    | "members"
    | "signups"
    | "volunteers"
    | "feedback"
    | "email"
    | "analytics";
  const rawDays = Number(sp.days);
  const days = [7, 30, 90].includes(rawDays) ? rawDays : 30;

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return (
      <NotAdmin
        title="Supabase isn't configured yet"
        body="Wire NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY before opening admin."
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/?auth=signin&next=/admin");

  const { data: me } = await supabase
    .from("members")
    .select("id, admin, name")
    .eq("id", user.id)
    .maybeSingle();
  if (!me?.admin) {
    return (
      <NotAdmin
        title="You're not on the organizer list."
        body="Reach out if you think that's a mistake — we can promote you in the admin panel."
      />
    );
  }

  const [bundle, { data: blogSubmissions }, { data: draftsRaw }] =
    await Promise.all([
      getAdminBundle({ analyticsDays: days }),
      supabase
        .from("blog_submissions")
        .select("*")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("calendar_drafts")
        .select("*, calendar_draft_versions(*)")
        .order("updated_at", { ascending: false }),
    ]);

  const drafts = (draftsRaw || []).map((d: any) => ({
    ...d,
    versions: d.calendar_draft_versions || [],
  }));
  if (!bundle) {
    return (
      <NotAdmin
        title="Couldn't load admin data"
        body="The Supabase request failed. Check the server logs and try again."
      />
    );
  }

  return (
    <>
      <section
        style={{
          background: "var(--neutral-950)",
          color: "var(--fg-on-dark)",
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "40px 28px 30px",
          }}
        >
          <Eyebrow style={{ marginBottom: 12, color: "var(--orange-300)" }}>
            ADMIN · ORGANIZER TOOLS
          </Eyebrow>
          <h1
            style={{
              fontSize: "clamp(2rem, 1.5rem + 1.8vw, 2.9rem)",
              color: "#fff",
              margin: "0 0 26px",
            }}
          >
            Community dashboard
          </h1>
          <div
            className="admin-stats"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
            }}
          >
            <Stat
              icon="users"
              value={bundle.members.length}
              label="Community members"
              tone="teal"
            />
            <Stat
              icon="inbox"
              value={bundle.pending.length}
              label="Awaiting review"
              tone="flame"
            />
            <Stat
              icon="file-text"
              value={bundle.published.length}
              label="Published posts"
              tone="honey"
            />
          </div>
        </div>
      </section>

      <AdminShell
        bundle={bundle}
        tab={tab}
        meId={me.id}
        days={days}
        drafts={drafts}
        formSubmissions={bundle.pending}
        blogSubmissions={blogSubmissions || []}
      />
    </>
  );
}

function NotAdmin({ title, body }: { title: string; body: string }) {
  return (
    <section
      style={{
        background: "var(--bg)",
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
        padding: 40,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 460 }}>
        <span
          style={{
            display: "inline-grid",
            placeItems: "center",
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--danger-bg)",
            color: "var(--danger)",
            marginBottom: 18,
          }}
        >
          <Icon name="shield-x" size={30} />
        </span>
        <h2 style={{ fontSize: 26, margin: "0 0 10px" }}>{title}</h2>
        <p style={{ fontSize: 16, color: "var(--fg-muted)", margin: "0 0 22px" }}>
          {body}
        </p>
        <a href="/" style={{ textDecoration: "none" }}>
          <Btn variant="secondary">Back home</Btn>
        </a>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
  tone,
}: {
  icon: string;
  value: number;
  label: string;
  tone: "flame" | "teal" | "honey";
}) {
  const tones = {
    flame: { bg: "var(--orange-50)", fg: "var(--orange-700)" },
    teal: { bg: "var(--teal-50)", fg: "var(--teal-700)" },
    honey: { bg: "var(--honey-100)", fg: "var(--honey-700)" },
  }[tone];
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "22px 24px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 50,
          height: 50,
          borderRadius: "var(--radius-md)",
          background: tones.bg,
          color: tones.fg,
          flex: "none",
        }}
      >
        <Icon name={icon} size={24} />
      </span>
      <div>
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: 30,
            lineHeight: 1,
            color: "var(--fg)",
          }}
        >
          {value}
        </div>
        <div style={{ fontSize: 13.5, color: "var(--fg-muted)", marginTop: 4 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
