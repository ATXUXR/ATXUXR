"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "./Wordmark";
import { Btn } from "./ui/Button";
import { Icon } from "./ui/Icon";
import { initials, toneForName } from "@/lib/utils";

interface NavProps {
  initialUser: User | null;
  isAdmin?: boolean;
}

const LINKS: { label: string; href: string }[] = [
  { label: "Home", href: "/" },
  { label: "Events", href: "/events" },
  { label: "Blog", href: "/blog" },
  { label: "Community", href: "/community" },
  { label: "Volunteer", href: "/volunteer" },
  { label: "Donate", href: "/donate" },
];

export function Nav({ initialUser, isAdmin = false }: NavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(initialUser);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Lock body scroll when the mobile drawer is open + close on Escape.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Close the mobile drawer when route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const logOut = async () => {
    setMenuOpen(false);
    await supabase.auth.signOut();
    router.refresh();
  };

  const name =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email ??
    "Member";
  const tone = toneForName(name);

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: scrolled ? "rgba(248,244,238,0.85)" : "rgba(248,244,238,0)",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled
          ? "1px solid var(--border)"
          : "1px solid transparent",
        transition: "var(--transition)",
      }}
    >
      <div
        style={{
          maxWidth: 1140,
          margin: "0 auto",
          padding: "0 28px",
          height: 74,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ display: "flex" }} onClick={() => setOpen(false)}>
          <Wordmark height={30} />
        </Link>

        <nav
          className="nav-desktop"
          style={{ display: "flex", alignItems: "center", gap: 24 }}
        >
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: active ? "var(--primary)" : "var(--fg)",
                  position: "relative",
                }}
              >
                {l.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: -6,
                      height: 2,
                      background: "var(--primary)",
                      borderRadius: 2,
                    }}
                  />
                )}
              </Link>
            );
          })}

          {user ? (
            <div ref={menuRef} style={{ position: "relative" }}>
              <button
                type="button"
                onClick={() => setMenuOpen((m) => !m)}
                aria-label="Account menu"
                style={{
                  display: "inline-grid",
                  placeItems: "center",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: tone.bg,
                  color: tone.fg,
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "1.5px solid var(--border-strong)",
                  cursor: "pointer",
                }}
              >
                {initials(name)}
              </button>
              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 46,
                    minWidth: 200,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-md)",
                    boxShadow: "var(--shadow-md)",
                    padding: 6,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                  }}
                >
                  <MenuLink
                    href="/profile"
                    label="Profile"
                    icon="user"
                    onClick={() => setMenuOpen(false)}
                  />
                  <MenuLink
                    href="/blog/new"
                    label="Contribute"
                    icon="pen-line"
                    onClick={() => setMenuOpen(false)}
                  />
                  {isAdmin && (
                    <MenuLink
                      href="/admin"
                      label="Admin"
                      icon="shield"
                      onClick={() => setMenuOpen(false)}
                    />
                  )}
                  <button
                    type="button"
                    onClick={logOut}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--fg)",
                    }}
                  >
                    <Icon name="log-out" size={16} />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/?auth=signin" style={{ textDecoration: "none" }}>
              <Btn variant="primary" size="sm" icon="log-in">
                Sign in
              </Btn>
            </Link>
          )}
        </nav>

        <button
          className="nav-burger"
          type="button"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--fg)",
          }}
        >
          <Icon name={open ? "x" : "menu"} size={26} />
        </button>
      </div>

      {open && (
        <div
          style={{
            padding: "8px 28px 22px",
            borderTop: "1px solid var(--border)",
            background: "var(--paper)",
          }}
        >
          {LINKS.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 0",
                  fontSize: 17,
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                  color: active ? "var(--primary)" : "var(--fg)",
                }}
              >
                {l.label}
              </Link>
            );
          })}
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 0",
                  fontSize: 17,
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
              >
                Profile
              </Link>
              <Link
                href="/blog/new"
                onClick={() => setOpen(false)}
                style={{
                  display: "block",
                  padding: "12px 0",
                  fontSize: 17,
                  fontWeight: 600,
                  borderBottom: "1px solid var(--border)",
                  color: "var(--fg)",
                }}
              >
                Contribute
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "12px 0",
                    fontSize: 17,
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                    color: "var(--fg)",
                  }}
                >
                  Admin
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  setOpen(false);
                  await supabase.auth.signOut();
                  router.refresh();
                }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 0",
                  fontSize: 17,
                  fontWeight: 600,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--fg-muted)",
                }}
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              href="/?auth=signin"
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "12px 0",
                fontSize: 17,
                fontWeight: 600,
                color: "var(--primary)",
              }}
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}

function MenuLink({
  href,
  label,
  icon,
  onClick,
}: {
  href: string;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        borderRadius: "var(--radius-sm)",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 500,
        color: "var(--fg)",
      }}
    >
      <Icon name={icon} size={16} />
      {label}
    </Link>
  );
}
