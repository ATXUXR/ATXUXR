# CLAUDE.md — ATX UXR website

This file tells an AI coding agent how this project is built so it can make safe, on-brand edits.

## What this is
A **Next.js 15 (App Router) + TypeScript + Tailwind + Supabase** site for ATX UXR (Austin UX Researchers) — "the people-people of ATX." A brand refresh of austinuxresearchers.com.

The original prototype (zero-build static React-via-Babel) lives in `legacy/`. A higher-fidelity design prototype for the blog + community + admin lives in `design_handoff_blog_community/`. **Both folders are reference-only — never deploy or import code from them at runtime.** They're excluded from the TypeScript build and the Tailwind content glob.

## Run / preview locally
```bash
npm install
cp .env.local.example .env.local   # fill in Supabase keys
npm run dev
```
The site works without Supabase env vars (public pages render; auth-gated routes redirect to sign-in).

## File map
- `app/` — App Router. `layout.tsx` mounts `<NavServer />`, `<Footer />`, `<Feedback />`, and `<AuthModal />`.
  - `page.tsx` (Home), `events/`, `volunteer/`, `donate/`, `onboarding/`, `profile/`, `blog/` (stub), `community/` (stub), `auth/callback/`, `api/rsvp/`.
- `app/globals.css` — **the design system.** All colors, type, spacing, radii, shadows as CSS variables, plus the self-hosted Inter `@font-face`. Change brand values here, not inline.
- `components/` — `Nav` (client) + `NavServer` (server data fetch), `Footer`, `Mailing`, `Feedback`, `AuthModal`, `Modal`, `PageHero`, `EventTypes`, `EventRow`, `Mark`, `Wordmark`. Primitives in `components/ui/`: `Button`, `Icon`, `Tag`, `Eyebrow`.
- `lib/events.ts` — the `EVENTS`, `EVENT_TYPES`, `SOCIALS` arrays + `.ics` helper. **Edit events here** until they move to Supabase.
- `lib/utils.ts` — `cn`, `initials`, `toneForName`, `toneForTag`, `readMinutes`.
- `lib/supabase/{client,server,middleware}.ts` — Supabase clients per `@supabase/ssr` docs.
- `middleware.ts` — refreshes Supabase sessions on every request.
- `supabase/migrations/001_initial.sql` — full schema + RLS. Run it in the Supabase SQL editor.
- `public/fonts/` — self-hosted Inter (.ttf). `public/assets/` — brand mark PNGs.

## Conventions
- **Server components by default.** Mark a component `"use client"` only if it needs hooks, browser APIs, or event handlers.
- **Use CSS variables for color** (`var(--primary)`, `var(--bg)`, etc.), never raw hex. The token source is `app/globals.css`.
- **Tailwind** is available for layout/utility classes; brand color is still surfaced through CSS variables so a token edit cascades everywhere.
- **Icons:** Lucide via `<Icon name="..." />` (camelCase or kebab-case). Brand glyphs (LinkedIn/X/etc.) are inlined as SVG in the components that need them.
- **Fonts:** Bricolage Grotesque (display), Inter (body/UI, self-hosted in `public/fonts/`), Space Mono (labels/eyebrows). Sentence case for headings; UPPERCASE only for mono "field-note" tags.
- **Voice:** warm, plainspoken, people-first. "We" for the community, "you" to the reader. No emoji in headlines.
- **Type safety:** strict TS; use Zod for form validation. No `any`.
- **Socials:** LinkedIn / X / Instagram only. **No Meetup.** No embedded donate widget — donation is Venmo + (later) Stripe.

## Common edits
- **Add/update an event:** edit `EVENTS` in `lib/events.ts`. Status `'open'` enables the RSVP form on the detail page.
- **Change brand color/font:** edit the variable in `app/globals.css`.
- **Edit page copy:** the page files under `app/<route>/page.tsx`.

## Deploy
Netlify (auto-detects Next via the runtime). Push to the connected branch and a deploy runs.
