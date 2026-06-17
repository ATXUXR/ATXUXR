"use client";

import { useState } from "react";
import { Btn } from "@/components/ui/Button";

interface Props {
  token: string;
}

export function ResubscribeButton({ token }: Props) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const resubscribe = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/unsubscribe/resubscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to resubscribe");
      }
      setDone(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to resubscribe");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 14px",
          borderRadius: "var(--radius-md)",
          background: "var(--success-bg)",
          color: "var(--success)",
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Welcome back. You're on the list again.
      </span>
    );
  }

  return (
    <>
      <Btn variant="primary" icon="rotate-ccw" onClick={resubscribe} disabled={busy}>
        {busy ? "Resubscribing…" : "Resubscribe"}
      </Btn>
      {err && (
        <span
          style={{
            display: "block",
            width: "100%",
            marginTop: 10,
            fontSize: 13,
            color: "var(--danger)",
          }}
        >
          {err}
        </span>
      )}
    </>
  );
}
