# ATX UXR — Website

The refreshed website for **ATX UXR (Austin UX Researchers)** — "the people-people of ATX." Built on **Next.js 15 (App Router) + TypeScript + Tailwind + Supabase**.

---

## Quick start

```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The site works without Supabase env vars (you'll see public pages but auth-gated routes redirect to sign-in).

Scripts:

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

---

## What's in here

- **App Router** under `app/` with `page.tsx`, `layout.tsx`, and route handlers under `app/api/`.
- **Shared chrome** under `components/` — `Nav`, `Footer`, `Feedback`, `AuthModal`, `Mailing`, plus brand primitives (`Mark`, `Wordmark`, `Btn`, `Tag`, `Eyebrow`, `Icon`).
- **Static data** in `lib/events.ts` (events + socials). Migrating to Supabase later swaps these for server queries.
- **Design tokens** in `app/globals.css` (the same `colors_and_type.css` from the legacy site, with the `@font-face` paths repointed to `/fonts/`).
- **Self-hosted fonts** in `public/fonts/` (Inter). Bricolage Grotesque + Space Mono pull from Google Fonts in the layout.
- **Supabase clients** in `lib/supabase/` (browser + server + middleware refresh).
- **Initial SQL schema** in `supabase/migrations/001_initial.sql` — run it in the Supabase SQL editor.
- **Legacy + design reference** preserved in `legacy/` and `design_handoff_blog_community/` so an AI agent can study the original prototype. **Don't ship those folders to prod** — they're excluded from TypeScript and the Tailwind content glob.

See `CLAUDE.md` for editing conventions.

---

## Supabase setup

1. Create a project at supabase.com.
2. Copy `URL`, `anon` key, and `service_role` key into `.env.local`.
3. Open the SQL editor and paste `supabase/migrations/001_initial.sql`. Run it.
4. Enable **Google** as an auth provider in Authentication → Providers, and add `https://atxuxr.com/auth/callback` (plus `http://localhost:3000/auth/callback` for local) to the allowed redirect URLs.
5. Sign up with `maral@atxuxr.com` and re-run the seed `update public.members ...` block at the bottom of the migration to mark her as admin.

---

## Deploy

Netlify auto-detects Next.js — push to the connected branch and the build runs. `netlify.toml` just sets `command = "npm run build"` and `publish = ".next"`.

---

## Phase plan

- **Phase 1 (this build):** scaffold, static pages (Home / Events / Volunteer / Donate), auth UI, profile setup. Forms log to console; no DB writes yet.
- **Phase 2:** wire forms to Supabase (RSVP, mailing list, volunteer, feedback).
- **Phase 3:** blog (list, article, contribute, OG meta) + community directory + admin dashboard.
- **Phase 4:** Resend for transactional email + email blasts.
