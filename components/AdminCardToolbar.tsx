"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Btn } from "@/components/ui/Button";

interface AdminCardToolbarProps {
  itemId: string;
  itemType: "post" | "event";
  isAdmin: boolean;
  status?: string;
  onDeleteSuccess?: () => void;
}

export function AdminCardToolbar({
  itemId,
  itemType,
  isAdmin,
  status = "published",
  onDeleteSuccess,
}: AdminCardToolbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const isHidden = status !== "published";

  if (!isAdmin) return null;

  const baseHref = itemType === "post" ? `/blog/${itemId}` : `/events/${itemId}`;
  const editHref = `${baseHref}/edit`;

  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setStatusLoading(true);
    try {
      const endpoint = itemType === "post" ? `/api/admin/posts/${itemId}` : `/api/admin/events/${itemId}`;
      const newStatus = isHidden ? "published" : "pending";

      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error(`Status update failed`);

      router.refresh();
    } catch (err) {
      console.error("Status update error:", err);
      alert(`Failed to update ${itemType} status`);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm(`Delete this ${itemType}? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        itemType === "post" ? "/api/admin/posts/delete" : "/api/admin/events/delete";
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ [itemType === "post" ? "postId" : "eventId"]: itemId }),
      });

      if (!res.ok) throw new Error(`Delete failed`);

      router.refresh();
      if (onDeleteSuccess) onDeleteSuccess();
    } catch (err) {
      console.error("Delete error:", err);
      alert(`Failed to delete ${itemType}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        position: "absolute",
        top: 12,
        right: 12,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {itemType === "post" && (
        <Btn
          variant="secondary"
          size="sm"
          icon={isHidden ? "eye-off" : "eye"}
          onClick={handleStatusToggle}
          disabled={statusLoading}
          title={isHidden ? "Publish post" : "Hide post"}
        >
          {statusLoading ? "…" : ""}
        </Btn>
      )}
      <Link href={editHref} style={{ textDecoration: "none" }}>
        <Btn
          variant="secondary"
          size="sm"
          icon="pencil"
          title={`Edit ${itemType}`}
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
        title={`Delete ${itemType}`}
      >
        {loading ? "…" : ""}
      </Btn>
    </div>
  );
}
