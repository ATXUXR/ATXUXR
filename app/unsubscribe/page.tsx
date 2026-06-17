import type { Metadata } from "next";
import Link from "next/link";
import {
  createServiceClient,
  isServiceClientConfigured,
} from "@/lib/supabase/service";
import { Btn } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { ResubscribeButton } from "./ResubscribeButton";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Manage your ATX UXR email subscription.",
};

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const sp = await searchParams;
  const token = (sp.token || "").trim();

  if (!token) {
    return (
      <Shell
        icon="mail"
        title="Manage your subscription"
        body="You'll need the unsubscribe link from one of our emails. If you can't find it, reach out to hello@atxuxr.com and we'll handle it for you."
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Btn variant="secondary">Back to atxuxr.com</Btn>
        </Link>
      </Shell>
    );
  }

  if (!isServiceClientConfigured()) {
    return (
      <Shell
        icon="alert-circle"
        title="Subscription service offline"
        body="We couldn't reach our database. Try again in a few minutes — or reply to any of our emails and we'll unsubscribe you by hand."
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Btn variant="secondary">Back home</Btn>
        </Link>
      </Shell>
    );
  }

  const supabase = createServiceClient();
  const { data: signup } = await supabase
    .from("signups")
    .select("id, name, email, unsubscribed, tags")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!signup) {
    return (
      <Shell
        icon="search-x"
        title="We couldn't find that link"
        body="The token may have expired or already been used. If you keep getting emails, write us at hello@atxuxr.com."
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <Btn variant="secondary">Back home</Btn>
        </Link>
      </Shell>
    );
  }

  // Idempotent: mark unsubscribed even if it was already done. Add the
  // 'unsubscribed' tag so legacy filters still work.
  if (!signup.unsubscribed) {
    const nextTags = Array.from(
      new Set<string>([...(signup.tags ?? []), "unsubscribed"]),
    );
    await supabase
      .from("signups")
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
        tags: nextTags,
      })
      .eq("id", signup.id);
  }

  const first = (signup.name || signup.email).split(/\s+/)[0];
  return (
    <Shell
      icon="check"
      iconTone="success"
      title={`You're unsubscribed${first ? `, ${first}` : ""}.`}
      body="We won't send you any more updates. Thanks for being part of ATX UXR — the door's always open if you change your mind."
    >
      <ResubscribeButton token={token} />
      <Link href="/" style={{ textDecoration: "none" }}>
        <Btn variant="secondary">Back to atxuxr.com</Btn>
      </Link>
    </Shell>
  );
}

function Shell({
  icon,
  iconTone = "muted",
  title,
  body,
  children,
}: {
  icon: string;
  iconTone?: "success" | "muted";
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  const tone =
    iconTone === "success"
      ? { bg: "var(--success-bg)", fg: "var(--success)" }
      : { bg: "var(--surface-sunk)", fg: "var(--fg-muted)" };
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
            background: tone.bg,
            color: tone.fg,
            marginBottom: 18,
          }}
        >
          <Icon name={icon} size={30} />
        </span>
        <h2 style={{ fontSize: 26, margin: "0 0 10px" }}>{title}</h2>
        <p
          style={{
            fontSize: 16,
            color: "var(--fg-muted)",
            margin: "0 0 22px",
            lineHeight: 1.55,
          }}
        >
          {body}
        </p>
        <div
          style={{
            display: "inline-flex",
            gap: 10,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      </div>
    </section>
  );
}
