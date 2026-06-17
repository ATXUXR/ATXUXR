"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const SESSION_KEY = "atxuxr_session";
const DNT_KEY = "atxuxr_dnt";
const LAST_VIEW_KEY = "atxuxr_last_view";

function newSessionId(): string {
  // Prefer crypto.randomUUID, fall back to a hex-ish polyfill.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(16) +
    "-" +
    Math.random().toString(16).slice(2, 10) +
    "-" +
    Math.random().toString(16).slice(2, 10)
  );
}

function getOrCreateSessionId(): string | null {
  try {
    if (typeof window === "undefined") return null;
    let id = window.sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = newSessionId();
      window.sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function shouldTrack(): boolean {
  try {
    if (typeof window === "undefined") return false;
    if (window.localStorage.getItem(DNT_KEY) === "1") return false;
    // honor browser-level Do Not Track too
    const dnt =
      (navigator as Navigator & { doNotTrack?: string }).doNotTrack ||
      (window as Window & { doNotTrack?: string }).doNotTrack;
    if (dnt === "1" || dnt === "yes") return false;
    return true;
  } catch {
    return true;
  }
}

function sendPayload(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify(payload);
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/track", blob);
      if (ok) return;
    }
    // fallback to fetch with keepalive
    fetch("/api/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {
      // swallow — telemetry must never break the page
    });
  } catch {
    // ignore
  }
}

function whenIdle(fn: () => void) {
  if (typeof window === "undefined") return;
  const ric = (window as Window & {
    requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
  }).requestIdleCallback;
  if (typeof ric === "function") {
    ric(fn, { timeout: 500 });
  } else {
    setTimeout(fn, 0);
  }
}

export function Telemetry() {
  const pathname = usePathname();
  const sentRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!shouldTrack()) return;
    if (!pathname) return;
    const sessionId = getOrCreateSessionId();
    if (!sessionId) return;

    // Compute duration for the previous pageview (best-effort).
    let prevDuration: number | null = null;
    try {
      const raw = window.sessionStorage.getItem(LAST_VIEW_KEY);
      if (raw) {
        const last = JSON.parse(raw) as { path: string; at: number };
        if (last && typeof last.at === "number") {
          prevDuration = Math.max(0, Date.now() - last.at);
        }
      }
    } catch {
      // ignore
    }

    const path = pathname;
    const referrer = typeof document !== "undefined" ? document.referrer || null : null;

    whenIdle(() => {
      sendPayload({
        kind: "pageview",
        session_id: sessionId,
        path,
        referrer,
        duration_ms: prevDuration,
      });
      try {
        window.sessionStorage.setItem(
          LAST_VIEW_KEY,
          JSON.stringify({ path, at: Date.now() }),
        );
      } catch {
        // ignore
      }
      sentRef.current = { path, at: Date.now() };
    });
  }, [pathname]);

  // On tab hide / unload, ship a final duration ping for the current page.
  useEffect(() => {
    if (!shouldTrack()) return;
    function shipDuration() {
      const sessionId = getOrCreateSessionId();
      if (!sessionId) return;
      const last = sentRef.current;
      if (!last) return;
      const duration = Math.max(0, Date.now() - last.at);
      sendPayload({
        kind: "event",
        event_kind: "duration",
        session_id: sessionId,
        path: last.path,
        duration_ms: duration,
        meta: { exit: true },
      });
    }
    function onVis() {
      if (document.visibilityState === "hidden") shipDuration();
    }
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", shipDuration);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", shipDuration);
    };
  }, []);

  return null;
}
