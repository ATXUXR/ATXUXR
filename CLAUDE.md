# CLAUDE.md — ATX UXR website

This file tells an AI coding agent (Claude Code) how this project is built so it can make safe, on-brand edits.

## What this is
A **zero-build static website** for ATX UXR (Austin UX Researchers) — "the people-people of ATX." It is a brand refresh of austinuxresearchers.com. No bundler, no install step: open `index.html` and it runs. React, Babel, and Lucide load from CDN; the `.jsx` files are transpiled in the browser.

## Run / preview locally
Serve the folder with any static server (the in-browser Babel needs http://, not file://):
```
npx serve .        # or: python3 -m http.server
```
Then open the printed URL. That's it — no `npm install`.

## File map
- `index.html` — entry point. Loads fonts, `colors_and_type.css`, then each `site/*.jsx` in order.
- `colors_and_type.css` — **the design system.** All colors, type, spacing, radii, shadows as CSS variables, plus the self-hosted Inter `@font-face`. Change brand values here, not inline.
- `site/shared.jsx` — primitives (`Icon`, `Mark`, `Wordmark`, `Btn`, `Tag`, `Eyebrow`), the `.ics` download helper, and **all site content/data** (`EVENTS`, `EVENT_TYPES`, `SOCIALS`). Edit events here.
- `site/blocks.jsx` — reused sections: `EventTypes`, `EventRow`, `Mailing`.
- `site/Nav.jsx`, `site/Footer.jsx` — chrome.
- `site/Home.jsx`, `site/Events.jsx`, `site/EventDetail.jsx`, `site/Simple.jsx` (Volunteer + Donate) — the four views.
- `site/app.jsx` — mounts `<App>` and switches views via `view` state (`home` / `events` / `detail` / `volunteer` / `donate`). No router; navigation is in-state.
- `assets/` — logo / skyline-mark PNGs (orange, white, ink, gray). `fonts/` — Inter.

## Conventions (follow these)
- **Components attach to `window`** at the end of each file (`window.Foo = Foo;` or `Object.assign(window, {...})`). Each `<script type="text/babel">` has its own scope, so cross-file sharing goes through `window`. If you add a new component file, add a `<script>` tag for it in `index.html` **before** `site/app.jsx`, and export it to `window`.
- **No `const styles = {}`** with a generic name — styling is inline per element or via `colors_and_type.css` variables. Always use the CSS variables (`var(--primary)`, `var(--paper)`, etc.) rather than raw hex.
- **Icons:** Lucide via `<Icon name="..." />`. Brand glyphs (LinkedIn/Meetup/etc.) are NOT in Lucide core — use a neutral icon or add an inline SVG.
- **Fonts:** Bricolage Grotesque (display), Inter (body/UI, self-hosted), Space Mono (labels/eyebrows). Sentence case for headings; UPPERCASE only for the mono "field-note" tags.
- **Voice:** warm, plainspoken, people-first. "We" for the community, "you" to the reader. No emoji in headlines.

## Common edits
- **Add/update an event:** edit the `EVENTS` array in `site/shared.jsx`. Set `status: 'open'` to enable the RSVP form on its detail page; anything else shows "RSVP closed."
- **Change brand color/font:** edit the variable in `colors_and_type.css`.
- **Edit page copy:** the four view files in `site/`.

## Production upgrade (optional, when ready)
The in-browser Babel transformer prints a console warning and adds ~1s to first paint. For a faster production build, migrate to **Vite + React** (move each `window.X` into real `import`/`export`, keep `colors_and_type.css` as-is). The components are already factored to make this mechanical. Do this only if performance matters — the current setup deploys and works fine today.

## Deploy
See `README.md`. Any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages) serves this folder directly.
