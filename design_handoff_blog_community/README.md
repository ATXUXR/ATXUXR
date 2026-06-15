# Handoff: ATX UXR — Blog + Community

## Overview
This package extends the **Austin UX Researchers (ATX UXR)** website with three new capabilities:

1. **Blog** — a feed of articles with cards, full reading view, tag filtering, search, social sharing (X / LinkedIn / Medium + copy link), and a "Contribute a post" flow with a rich editor that submits to a review queue.
2. **Community** — email + Google sign-up, a post-signup profile-setup step, member profiles (photo, name, role, company, LinkedIn, website, location, bio, expertise tags), and a filterable member directory.
3. **Admin** — an organizer dashboard to review/approve/reject post submissions, manage members and roles, see mailing-list signups, RSVPs, volunteers, send email blasts, and view basic analytics.

The first registered owner (`maral@atxuxr.com`) is seeded as an **admin**.

---

## About the design files
The files in `design-reference/` are a **design prototype built in HTML + in-browser React (via Babel)**. They are a faithful reference for *look, copy, and behavior* — **not production code to ship as-is.** All data is held in the browser's `localStorage` (see `site/store.js`), and "Continue with Google" is a mock.

**Your task:** recreate these designs in a real production stack — pick the framework that fits the target deployment (the prototype is React, so Next.js / Remix / plain React + an API are natural fits), wire a real database, real authentication (including Google OAuth), and replace the `localStorage` data layer with real API calls. The prototype was deliberately structured to make this straightforward: **every read and write funnels through a single `Store` object** in `store.js`, so its methods map almost 1:1 onto API endpoints (see "Data model & API mapping" below).

**On-disk note:** the `site/` script files are saved with a trailing `.txt` suffix (e.g. `store.js.txt`, `app.js.txt`) so they are treated as plain reference text and not picked up by build tooling. Logical names in this README omit the suffix for readability. To run the bundle locally, open `design-reference/site/index.html` (it references the `.js.txt` files directly and transpiles them in-browser via Babel) — sign-up, contributing a post, approving it in Admin, editing a profile, etc. all work against localStorage; use Admin → "Reset all data" for a clean slate. The canonical, always-runnable version of this prototype lives in the source design-system project's `site/` folder.

## Fidelity
**High-fidelity.** Colors, typography, spacing, copy, iconography, and interactions are final and intended to be matched closely. The full token set lives in `design-reference/colors_and_type.css` and is consumed via CSS custom properties throughout. Recreate the UI pixel-closely using those tokens; lift exact values from the CSS file rather than eyeballing.

---

## Tech reality vs. target
| Concern | Prototype (this bundle) | Production target |
|---|---|---|
| Rendering | React 18 via Babel-in-browser, one `index.html` | Compiled framework (Next.js/Remix/etc.) |
| Components | Global-scope functions sharing `window` | Real module imports / a component library |
| Data | `localStorage` singleton (`Store`) | Database (Postgres/etc.) + API |
| Auth | Mock email + mock Google | Real session auth + Google OAuth (OIDC) |
| Images | base64 data URLs in localStorage | Object storage (S3/R2) + CDN URLs |
| Email | Logged to an in-memory "outbox" | Transactional email provider (Resend/SES/Postmark) |
| Sharing | Real intent URLs (already production-ready) | Keep as-is; add server-rendered OG meta tags |

---

## Data model & API mapping
The canonical schema is `site/store.js`. Entities and their fields:

### `members` (users)
`id, name, email, photo (url), role (job title), company, linkedin, website, location, bio, expertise (string[] of tags), admin (bool), joined (date), fresh (bool — true until profile setup completed)`

### `posts`
`id, authorId → members.id, title, excerpt, body (HTML), tags (string[]), cover (url|null), date, status ('published' | 'pending' | 'rejected'), readMins (derived: ~words/200)`

### `comments`
`id, postId → posts.id, authorId → members.id (nullable for guests), name, text, date`

### `reactions`
Per-post counts keyed by type: `{ postId: { up, heart, insight } }`. `myReactions` tracks which the current viewer toggled (move to a per-user join table in production).

### `signups` (mailing list — not full members)
`id, name, email, source, date`

### `events` / `rsvps` / `volunteers` / `feedback` / `emails` (outbox) / `analytics`
Supporting collections for the admin dashboard. See `seed*()` functions in `store.js` for exact shapes. `emails` is a sent/scheduled log; `analytics` holds visit/source/device/post-view aggregates (replace with a real analytics source or computed queries).

### `Store` methods → suggested endpoints
| Store method | Endpoint |
|---|---|
| `signUp`, `logIn`, `logOut`, `currentUser` | `POST /auth/signup`, `POST /auth/login`, `POST /auth/logout`, `GET /me` |
| `updateMember`, `setMemberRole`, `setAdmin`, `removeMember` | `PATCH /members/:id`, `DELETE /members/:id` (admin-gated) |
| `publishedPosts`, `pendingPosts`, `postById` | `GET /posts?status=`, `GET /posts/:id` |
| `submitPost` | `POST /posts` (creates with `status: 'pending'`) |
| `setPostStatus`, `deletePost` | `PATCH /posts/:id` (admin), `DELETE /posts/:id` |
| `allTags` | `GET /tags` (curated set ∪ tags in use) |
| `commentsForPost`, `addComment`, `deleteComment` | `GET/POST/DELETE /posts/:id/comments` |
| `reactionsFor`, `toggleReaction` | `POST /posts/:id/reactions` |
| `addSignup` | `POST /mailing-list` |
| `createEvent`, `updateEvent`, `deleteEvent`, `addRSVP` | events + RSVP CRUD |
| `addVolunteer`, `addFeedback` | `POST /volunteers`, `POST /feedback` |
| `sendBlast`, `announceEvent`, `scheduleReminder` | email-provider calls |
| `trackPostView`, `analytics`, `postEngagement` | analytics ingest + query |

---

## Screens / views
Routing in the prototype is state-based (`view` in `site/app.js`). Production routes suggested in brackets.

### Blog index `[/blog]` — `site/Blog.js`
- Header with eyebrow "BLOG", title, intro, and a "Contribute" CTA (gated by auth — opens sign-up if logged out).
- **Search** input (filters by title/excerpt/body text).
- **Tag filter** row: horizontally scrollable chips from `Store.allTags()`; "All" + each tag; active chip uses the tag's deterministic tone.
- **Card grid** of published posts (`Store.publishedPosts()`, newest first): cover image (or generated branded cover via `PostCover`), tags, title, excerpt, author avatar + name + date + read time. Card click → article.
- Empty state when search/filter yields nothing.

### Article reading view `[/blog/:id]` — `site/Article.js`
- Back link, tags, large title, author byline (avatar + name → links to profile, date, read time).
- Cover image, then rendered HTML body styled by `PROSE_CSS` (`.atx-prose`: h2/h3, paragraphs, `<ul>/<ol>`, `<blockquote>`, links).
- **Share bar** (sticky/inline): X, LinkedIn, Medium, and Copy link. Exact production-ready URLs:
  - X: `https://twitter.com/intent/tweet?text={title}&url={postUrl}`
  - LinkedIn: `https://www.linkedin.com/sharing/share-offsite/?url={postUrl}`
  - Medium import: `https://medium.com/p/import?url={postUrl}`
  - Copy: `navigator.clipboard.writeText(postUrl)` with a "Copied!" confirmation for 1.8s.
  - **Important:** these need a public, crawlable canonical URL per post and server-rendered Open Graph / Twitter Card meta (`og:title`, `og:description`, `og:image` = cover, `twitter:card=summary_large_image`) so shared links unfurl. The prototype uses a `#/article/:id` hash link as a stand-in.
- Reactions (up / heart / insight), comments list + add-comment box (guest or member).
- "More from the blog" related cards.

### Contribute `[/blog/new]` — `site/Contribute.js`
- **Auth-gated**: logged-out users see a "Sign in to contribute" gate.
- Fields: **Cover image** (upload → preview, optional; falls back to a generated branded cover), **Title**, **Summary/excerpt**, **Tags** (`TagPicker`), **Body** (`RichEditor`).
- **RichEditor**: a `contentEditable` surface with a toolbar — H2, H3, Bold, Italic, bulleted list, numbered list, blockquote, link, normal paragraph. Produces HTML. Live word count + read-time estimate. *(In production prefer a maintained rich-text editor — TipTap/ProseMirror/Lexical — that emits sanitized HTML; do not trust `document.execCommand`. Sanitize all stored HTML server-side.)*
- Validation: title required, body ≥ ~20 words, summary required.
- Submit → `status: 'pending'` → success screen ("Submitted for review"). Appears in the feed only after an admin approves.

### Community directory `[/community]` — `site/Community.js`
- Header + "Join" CTA for logged-out visitors.
- **Filter** by expertise/role; **grid of member cards**: avatar, name, role @ company, location, expertise tag chips. Card → profile.

### Profile `[/members/:id]` — `site/Profile.js`
- Header band with large avatar, name, role @ company, location, join date; "Edit profile" if it's you.
- About/bio, expertise tags, "Find me" links (LinkedIn, website, email), and the member's published posts.

### Profile setup / edit `[/onboarding]`, `[/settings/profile]` — `ProfileSetup` in `site/Profile.js`
- Shown automatically right after a fresh sign-up (`fresh: true`), and reachable later as "Edit profile".
- Fields: photo upload, name, role/title, company, location, bio, **research interests** (`TagPicker` — powers directory filters), LinkedIn, personal website.

### Auth modal — `site/Auth.js`
- Modal with **Continue with Google** (mock; replace with Google Identity Services / OAuth), an OR divider, and email form (name on sign-up, email, password). Toggles between Sign up / Sign in.
- On fresh sign-up → routes to profile setup. Otherwise resumes whatever action triggered the gate (e.g. "Contribute").
- **Production:** real password hashing or passwordless/magic-link, real Google OAuth, sessions/JWT, email verification.

### Admin dashboard `[/admin]` — `site/Admin.js`
- **Admin-gated** (`member.admin === true`). Tabs/sections for: **Submissions** queue (approve → `published`, reject, preview), **Members** (view, change role, grant/revoke admin, remove), **Mailing-list signups**, **RSVPs**, **Volunteers**, **Feedback**, **Email** (compose blast / outbox log), and **Analytics** (visits, sources, devices, weekly trend, per-post engagement).

### Shared chrome
- `site/Nav.js` — top nav with Home, Events, **Blog**, **Community**, Volunteer, Donate; auth state (Sign in / avatar menu with Profile, Contribute, Admin if applicable, Log out). Mobile hamburger.
- `site/Footer.js` — nav, socials, mailing-list block. *(Note: this org has no Meetup and no embedded donate widget — donation is Venmo only. Do not reintroduce either.)*
- `site/Feedback.js` — floating feedback widget (rating + message) on every page.

---

## Interactions & behavior
- **Auth gating** (`requireAuth` in `app.js`): protected actions either run immediately (if signed in) or open the auth modal and resume the queued action after sign-in.
- **Post lifecycle:** `submitPost` → `pending` → admin `setPostStatus('published'|'rejected')`. Only `published` appears in the public feed.
- **Tagging:** `TagPicker` (`site/ui.js`) — pick from curated `TAG_SUGGESTIONS` or type to add a free-form tag (Enter/comma to commit, click chip × to remove). `Store.allTags()` returns the curated set unioned with every tag actually used.
- **Sharing:** opens intent URLs in a new tab (`window.open(href, '_blank', 'noopener')`); copy-link uses the clipboard API with a transient confirmation.
- **Cover/photo upload:** `FileReader.readAsDataURL` → base64 preview (replace with real upload to object storage in production).
- **Read time:** `Math.max(1, round(wordCount/200))`.
- **Deep links:** prototype listens for `#/article/:id` to open a shared article; production = real per-post routes.
- **Reduced motion / no-JS:** entrance treatments are subtle; ensure content renders without JS in the SSR build.

## State management
Prototype: a single `Store` singleton with a `subscribe`/`useStore()` hook re-rendering on any change; persisted to `localStorage` under key `atxuxr:v2`. Production: replace with server state (DB) + a client cache (React Query/SWR) or framework data loaders. The `currentUser` is derived from `authUserId`; in production this is the authenticated session.

---

## Design tokens
Full source: `design-reference/colors_and_type.css` (CSS custom properties — use it verbatim). Highlights:

- **Brand color:** warm "flame" orange primary (`--primary` / `--orange-*`), with **teal**, **honey**, and **ink** accent families used for tag tones (`toneForTag`) and avatar fallbacks (`toneForName`).
- **Neutrals:** warm taupe surface/border/foreground ramp (`--bg`, `--surface`, `--surface-sunk`, `--border`, `--border-strong`, `--fg`, `--fg-muted`, `--fg-subtle`).
- **Semantic:** `--success`, `--danger`, `--success-bg`, `--danger-bg`.
- **Type families:** `--font-display` (Bricolage Grotesque), `--font-sans` (Inter), `--font-mono` (Space Mono). Eyebrows/labels use mono, uppercase, letter-spaced; headings use the display face with tight tracking. *(Self-host these fonts in production; the prototype loads display+mono via Google Fonts and self-hosts Inter.)*
- **Radii:** `--radius-sm/md/lg/pill`. **Motion:** `--transition`. Avatars are circular; the brand "mark" badge uses an asymmetric `999px 999px 16px 16px` radius — a recurring motif worth keeping.

## Assets
- `design-reference/site/` — all view/component source (`*.js`) + `index.html` entry.
- `design-reference/colors_and_type.css` — design tokens.
- Brand/social SVG logos (X, LinkedIn, Medium, Google) are inlined in `Auth.js` and `Article.js`.
- Icons: Lucide (loaded in `index.html`); the `Icon` helper renders by name.
- Member photos & post covers in the prototype are user-uploaded base64; seed members use generated initials avatars. No proprietary image assets are required.

## Files
```
design-reference/
  colors_and_type.css        Design tokens (colors, type, radii, motion)
  site/
    index.html               Entry: loads React/Babel, fonts, Lucide, all scripts
    app.js                  Root: routing, auth gating, view switching
    store.js                ★ DATA MODEL & all reads/writes (map to your API)
    shared.js               Brand primitives, icon helper, real content/socials
    ui.js                   Avatar, Field, Input, Textarea, TagPicker, Modal, PostCover, prose CSS
    blocks.js               Shared marketing blocks (event types, mailing list, etc.)
    Nav.js / Footer.js     Site chrome
    Home.js / Events.js / EventDetail.js / Simple.js   Existing pages
    Blog.js                 Blog index (cards, search, tag filter)
    Article.js              Article reading view + share bar + comments/reactions
    Contribute.js           Rich editor + submission flow
    Community.js            Member directory + filters
    Profile.js              Profile view + ProfileSetup (onboarding/edit)
    Auth.js                 Sign-up / sign-in modal (email + Google)
    Admin.js                Organizer dashboard
    Feedback.js             Floating feedback widget
```

### Build order suggestion
1. Stand up data model + auth (members, sessions, Google OAuth).
2. Posts CRUD + status workflow; public blog feed + article route with OG meta.
3. Tagging, search, filtering.
4. Contribute editor (use a real rich-text lib; sanitize HTML).
5. Community directory + profiles + profile setup.
6. Admin dashboard.
7. Sharing OG tags, email provider, image uploads, analytics.
