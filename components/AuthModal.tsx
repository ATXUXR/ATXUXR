"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "./Modal";
import { Mark } from "./Mark";
import { Btn } from "./ui/Button";
import { Icon } from "./ui/Icon";

type Mode = "signin" | "signup";

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password is too short"),
});

const SignUpSchema = SignInSchema.extend({
  name: z.string().min(1, "Enter your name"),
});

function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

const fieldStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 15,
  padding: "12px 14px",
  borderRadius: "var(--radius-md)",
  border: "1.5px solid var(--border-strong)",
  background: "var(--surface)",
  color: "var(--fg)",
  width: "100%",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontWeight: 600,
  fontSize: 13.5,
  marginBottom: 6,
  color: "var(--fg)",
};

export function AuthModal() {
  const router = useRouter();
  const params = useSearchParams();
  const authParam = params.get("auth");
  const open = authParam === "signin" || authParam === "signup";
  const mode: Mode = authParam === "signup" ? "signup" : "signin";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open, mode]);

  const supabase = createClient();

  const close = () => {
    const next = new URLSearchParams(params.toString());
    next.delete("auth");
    const qs = next.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname);
  };

  const switchMode = () => {
    const next = new URLSearchParams(params.toString());
    next.set("auth", mode === "signup" ? "signin" : "signup");
    router.replace(`?${next.toString()}`);
  };

  const handleGoogle = async () => {
    setError(null);
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setError("Auth isn't configured yet. Add Supabase env vars to enable sign-in.");
      return;
    }
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${siteUrl}/auth/callback` },
    });
    if (err) setError(err.message);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signup") {
        const parsed = SignUpSchema.safeParse({ name, email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check the form.");
          return;
        }
        const { error: err } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { data: { name: parsed.data.name } },
        });
        if (err) {
          setError(err.message);
          return;
        }
        close();
        router.push("/onboarding");
        router.refresh();
      } else {
        const parsed = SignInSchema.safeParse({ email, password });
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Check the form.");
          return;
        }
        const { error: err } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (err) {
          setError(err.message);
          return;
        }
        close();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const isSignup = mode === "signup";

  return (
    <Modal open={open} onClose={close} width={440}>
      <div style={{ padding: "38px 36px 34px" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <span
            style={{
              display: "inline-grid",
              placeItems: "center",
              width: 62,
              height: 62,
              borderRadius: "999px 999px 16px 16px",
              background: "var(--orange-50)",
              marginBottom: 16,
            }}
          >
            <Mark variant="orange" height={32} />
          </span>
          <h2 style={{ fontSize: 26, margin: "0 0 6px" }}>
            {isSignup ? "Join the community" : "Welcome back"}
          </h2>
          <p style={{ fontSize: 14.5, color: "var(--fg-muted)", margin: 0 }}>
            {isSignup
              ? "Connect with Austin's UX researchers, and contribute to the blog."
              : "Sign in to your ATX UXR account."}
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 11,
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 15,
            padding: "13px 16px",
            borderRadius: "var(--radius-md)",
            background: "var(--surface)",
            color: "var(--fg)",
            border: "1.5px solid var(--border-strong)",
            transition: "var(--transition)",
          }}
        >
          <GoogleMark /> Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            margin: "20px 0",
          }}
        >
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.12em",
              color: "var(--fg-subtle)",
            }}
          >
            OR
          </span>
          <span style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {isSignup && (
            <div>
              <label style={labelStyle}>Full name</label>
              <input
                style={fieldStyle}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jordan Lee"
                required
              />
            </div>
          )}
          <div>
            <label style={labelStyle}>Email</label>
            <input
              style={fieldStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <input
              style={fieldStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "Create a password" : "Your password"}
              required
            />
          </div>
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13.5,
                color: "var(--danger)",
                background: "var(--danger-bg)",
                padding: "9px 12px",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <Icon name="alert-circle" size={16} />
              {error}
            </div>
          )}
          <Btn
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            style={{ width: "100%", justifyContent: "center", marginTop: 2 }}
          >
            {loading
              ? "One moment…"
              : isSignup
              ? "Create account"
              : "Sign in"}
          </Btn>
        </form>

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            color: "var(--fg-muted)",
            margin: "20px 0 0",
          }}
        >
          {isSignup ? "Already a member?" : "New to ATX UXR?"}{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              switchMode();
            }}
            style={{ fontWeight: 600, color: "var(--orange-700)" }}
          >
            {isSignup ? "Sign in" : "Create an account"}
          </a>
        </p>
      </div>
    </Modal>
  );
}
