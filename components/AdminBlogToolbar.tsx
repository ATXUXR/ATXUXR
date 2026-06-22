"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Btn } from "@/components/ui/Button";

interface AdminBlogToolbarProps {
  postId: string;
  isAdmin: boolean;
}

export function AdminBlogToolbar({ postId, isAdmin }: AdminBlogToolbarProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isAdmin) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post? This cannot be undone.")) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/posts/delete", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId }),
      });

      if (!res.ok) throw new Error("Delete failed");

      router.push("/blog");
      router.refresh();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete post");
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
      <Link href={`/blog/${postId}/edit`} style={{ textDecoration: "none" }}>
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
