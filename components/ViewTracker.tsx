"use client";

import { useEffect } from "react";

interface Props {
  postId: string;
}

/**
 * Fire-and-forget post-view ping. Phase 3 wires this to a real analytics
 * provider; for now the endpoint just console.logs.
 */
export function ViewTracker({ postId }: Props) {
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      fetch(`/api/posts/${postId}/view`, {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    }, 600);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [postId]);
  return null;
}
