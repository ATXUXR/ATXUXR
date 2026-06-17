"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { formatDate } from "@/lib/utils";
import type { AdminMember } from "@/lib/admin";

interface Props {
  members: AdminMember[];
  meId: string;
}

export function MembersTab({ members, meId }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return members;
    return members.filter((m) =>
      [m.name, m.email, m.role, m.company]
        .filter(Boolean)
        .some((f) => f.toLowerCase().includes(term)),
    );
  }, [members, q]);

  const toggleAdmin = async (m: AdminMember) => {
    if (m.id === meId) return;
    setBusy(m.id);
    try {
      const res = await fetch(`/api/admin/members/${m.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin: !m.admin }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Update failed");
      }
      startTransition(() => router.refresh());
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <div style={{ position: "relative" }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fg-subtle)",
              display: "inline-flex",
            }}
          >
            <Icon name="search" size={18} />
          </span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, role…"
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 14.5,
              padding: "11px 14px 11px 42px",
              borderRadius: "var(--radius-pill)",
              border: "1.5px solid var(--border-strong)",
              background: "var(--surface)",
              color: "var(--fg)",
              width: "100%",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              minWidth: 720,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                {["Member", "Role @ Company", "Joined", "Organizer"].map(
                  (h, i) => (
                    <th
                      key={h}
                      style={{
                        textAlign: i === 3 ? "center" : "left",
                        padding: "13px 16px",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--fg-subtle)",
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td style={{ padding: "14px 16px" }}>
                    <Link
                      href={`/members/${m.id}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                        color: "inherit",
                      }}
                    >
                      <Avatar member={m} size={40} />
                      <div>
                        <div
                          style={{
                            fontSize: 14.5,
                            fontWeight: 600,
                            color: "var(--fg)",
                          }}
                        >
                          {m.name || "—"}{" "}
                          {m.id === meId && (
                            <span
                              style={{
                                fontFamily: "var(--font-mono)",
                                fontSize: 10,
                                color: "var(--primary)",
                              }}
                            >
                              (you)
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 12.5,
                            color: "var(--fg-subtle)",
                          }}
                        >
                          {m.email}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 13.5,
                      color: "var(--fg-muted)",
                    }}
                  >
                    {[m.role, m.company].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td
                    style={{
                      padding: "14px 16px",
                      fontSize: 13.5,
                      color: "var(--fg-subtle)",
                    }}
                  >
                    {formatDate(m.joined)}
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "center" }}>
                    <button
                      type="button"
                      onClick={() => toggleAdmin(m)}
                      disabled={m.id === meId || busy === m.id}
                      title={
                        m.id === meId
                          ? "You can't change your own admin status"
                          : ""
                      }
                      style={{
                        position: "relative",
                        width: 44,
                        height: 24,
                        borderRadius: 999,
                        border: "none",
                        cursor:
                          m.id === meId ? "not-allowed" : "pointer",
                        opacity: m.id === meId ? 0.5 : 1,
                        background: m.admin
                          ? "var(--primary)"
                          : "var(--border-strong)",
                        transition: "var(--transition)",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: 3,
                          left: m.admin ? 23 : 3,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          transition: "var(--transition)",
                        }}
                      />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "40px 20px",
                      textAlign: "center",
                      color: "var(--fg-muted)",
                    }}
                  >
                    No members match.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
