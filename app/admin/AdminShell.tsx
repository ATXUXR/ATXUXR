"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { AdminBundle } from "@/lib/admin";
import { SubmissionsTab } from "./tabs/SubmissionsTab";
import { MembersTab } from "./tabs/MembersTab";
import { SignupsTab } from "./tabs/SignupsTab";
import { RsvpsTab } from "./tabs/RsvpsTab";
import { VolunteersTab } from "./tabs/VolunteersTab";
import { FeedbackTab } from "./tabs/FeedbackTab";
import { EmailTab } from "./tabs/EmailTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";

type TabKey =
  | "submissions"
  | "members"
  | "signups"
  | "rsvps"
  | "volunteers"
  | "feedback"
  | "email"
  | "analytics";

interface Props {
  bundle: AdminBundle;
  tab: TabKey;
  meId: string;
}

export function AdminShell({ bundle, tab, meId }: Props) {
  const params = useSearchParams();

  const tabs: Array<{ key: TabKey; label: string; count?: number }> = [
    { key: "submissions", label: "Submissions", count: bundle.pending.length },
    { key: "members", label: "Members", count: bundle.members.length },
    { key: "signups", label: "Sign-ups", count: bundle.signups.length },
    { key: "rsvps", label: "RSVPs", count: bundle.rsvps.length },
    { key: "volunteers", label: "Volunteers", count: bundle.volunteers.length },
    { key: "feedback", label: "Feedback", count: bundle.feedback.length },
    { key: "email", label: "Email", count: bundle.emails.length },
    { key: "analytics", label: "Analytics" },
  ];

  const tabHref = (key: TabKey) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", key);
    return `/admin?${next.toString()}`;
  };

  return (
    <>
      <section
        style={{
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          position: "sticky",
          top: 73,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            gap: 4,
            overflowX: "auto",
          }}
        >
          {tabs.map((t) => {
            const on = tab === t.key;
            return (
              <Link
                key={t.key}
                href={tabHref(t.key)}
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "18px 18px",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  color: on ? "var(--primary)" : "var(--fg-muted)",
                }}
              >
                {t.label}
                {t.count != null && (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: on
                        ? "var(--orange-50)"
                        : "var(--surface-sunk)",
                      color: on ? "var(--orange-700)" : "var(--fg-subtle)",
                    }}
                  >
                    {t.count}
                  </span>
                )}
                {on && (
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      right: 12,
                      bottom: 0,
                      height: 2.5,
                      background: "var(--primary)",
                      borderRadius: 2,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section style={{ background: "var(--bg)", minHeight: "40vh" }}>
        <div
          style={{
            maxWidth: 1140,
            margin: "0 auto",
            padding: "34px 28px 80px",
          }}
        >
          {tab === "submissions" && <SubmissionsTab posts={bundle.pending} />}
          {tab === "members" && (
            <MembersTab members={bundle.members} meId={meId} />
          )}
          {tab === "signups" && <SignupsTab signups={bundle.signups} />}
          {tab === "rsvps" && (
            <RsvpsTab rsvps={bundle.rsvps} events={bundle.events} />
          )}
          {tab === "volunteers" && (
            <VolunteersTab volunteers={bundle.volunteers} />
          )}
          {tab === "feedback" && <FeedbackTab feedback={bundle.feedback} />}
          {tab === "email" && <EmailTab emails={bundle.emails} />}
          {tab === "analytics" && (
            <AnalyticsTab
              memberCount={bundle.members.length}
              publishedCount={bundle.published.length}
              signupCount={bundle.signups.length}
              topTags={bundle.topTags}
              topPosts={bundle.published
                .map((p) => ({
                  id: p.id,
                  title: p.title,
                  reactions: bundle.reactionStats[p.id] || 0,
                }))
                .sort((a, b) => b.reactions - a.reactions)
                .slice(0, 8)}
            />
          )}
        </div>
      </section>
    </>
  );
}
