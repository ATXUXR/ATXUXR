"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Btn } from "@/components/ui/Button";

interface AdminEventsToolbarProps {
  eventId: string;
  isAdmin: boolean;
}

export function AdminEventsToolbar({ eventId, isAdmin }: AdminEventsToolbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this event? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/events/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ eventId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      router.push("/events");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
        padding: "16px 0",
        borderTop: "1px solid var(--border)",
        marginTop: 32,
      }}
    >
      <Link href={`/events/${eventId}/files`} style={{ textDecoration: "none" }}>
        <Btn
          variant="secondary"
          size="sm"
          icon="file-plus"
        >
          Files
        </Btn>
      </Link>
      <Link href={`/events/${eventId}/edit`} style={{ textDecoration: "none" }}>
        <Btn
          variant="secondary"
          size="sm"
          icon="pencil"
        >
          Edit
        </Btn>
      </Link>
      <Btn
        variant="secondary"
        size="sm"
        icon="trash-2"
        onClick={handleDelete}
        disabled={loading}
      >
        {loading ? "Deleting…" : "Delete"}
      </Btn>
    </div>
  );
}
