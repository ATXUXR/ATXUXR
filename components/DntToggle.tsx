"use client";

import { useEffect, useState } from "react";

const DNT_KEY = "atxuxr_dnt";

export function DntToggle() {
  // Default to "not opted out" on first paint to avoid hydration flicker;
  // we read the real value once mounted.
  const [optedOut, setOptedOut] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setOptedOut(window.localStorage.getItem(DNT_KEY) === "1");
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  function toggle() {
    try {
      if (optedOut) {
        window.localStorage.removeItem(DNT_KEY);
        setOptedOut(false);
      } else {
        window.localStorage.setItem(DNT_KEY, "1");
        setOptedOut(true);
      }
    } catch {
      // ignore
    }
  }

  if (!ready) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={
        optedOut
          ? "You're opted out of first-party analytics. Click to re-enable."
          : "Stop sending anonymous, first-party analytics from your browser."
      }
      style={{
        border: 0,
        background: "transparent",
        padding: 0,
        cursor: "pointer",
        fontSize: 12,
        color: "var(--fg-subtle)",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.04em",
        textDecoration: "underline",
        textUnderlineOffset: 2,
      }}
    >
      {optedOut ? "Tracking opted out — undo" : "Don't track me"}
    </button>
  );
}
