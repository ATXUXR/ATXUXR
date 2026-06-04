# ATX UXR — Website

The refreshed website for **ATX UXR (Austin UX Researchers)** — "the people-people of ATX." This is a self-contained static site you can deploy anywhere and edit with an AI coding agent. No Wix, no lock-in.

🟠 **Zero build step.** It's just HTML, CSS, JavaScript, and image files. Open it, deploy it, done.

---

## What's inside
- A full site: **Home, Events, Event detail (with RSVP + add-to-calendar), Volunteer, and Donate** — using your real content.
- The complete **brand design system** in `colors_and_type.css` (colors, type, spacing, the sunset-mark logo).
- Deploy configs for Netlify and Vercel, plus a `CLAUDE.md` so an AI agent can safely make changes.

See **`CLAUDE.md`** for the file map and editing conventions.

---

## Quick start (preview locally)
You need a tiny local web server (the site transpiles in-browser, which needs `http://`, not opening the file directly):

```bash
# pick one — no install needed beyond what you have
npx serve .
# or
python3 -m http.server 8080
```

Open the URL it prints. Done.

---

## Deploy it (pick one)

### Option A — Netlify (easiest, drag-and-drop)
1. Go to **app.netlify.com → Add new site → Deploy manually**.
2. Drag this whole folder onto the page.
3. It's live in ~10 seconds on a `*.netlify.app` URL.
4. **Custom domain:** Site settings → Domain management → add `austinuxresearchers.com`, then update your DNS (Netlify shows the exact records). HTTPS is automatic.

### Option B — Vercel
1. Push this folder to a GitHub repo (see below).
2. **vercel.com → Add New → Project → import the repo.** No build settings needed — it's static.
3. Add `austinuxresearchers.com` under the project's **Domains** tab and follow the DNS steps.

### Option C — GitHub Pages
1. Push to a GitHub repo.
2. Repo **Settings → Pages → Deploy from branch → `main` / root**.
3. Add your custom domain in the same panel.

> **Moving the domain off Wix:** your domain's DNS currently points at Wix. To use it here, update the domain's DNS records (A / CNAME) to your new host as shown in that host's domain panel. If the domain is *registered* through Wix, you can keep it there and just repoint DNS, or transfer the registration out — either works.

---

## The AI iteration workflow ("deploy and merge using AI")

This is set up so you can make changes by **asking an AI agent**, review them, and merge:

1. **Put it on GitHub** (one time):
   ```bash
   cd atxuxr-site
   git init && git add -A && git commit -m "Initial ATX UXR site"
   # create an empty repo on github.com, then:
   git remote add origin https://github.com/<you>/atxuxr-site.git
   git push -u origin main
   ```
2. **Connect the repo to Netlify or Vercel** (Option A "from Git" or Option B). Now every push **auto-deploys**.
3. **Edit with AI:** open the repo in **Claude Code** (or any AI coding agent). It reads `CLAUDE.md` to learn the conventions, makes the change on a branch, and opens a **pull request**.
4. **Review & merge:** Netlify/Vercel builds a **preview URL** for the PR so you can see the change before it's live. Merge the PR → it deploys to production automatically.

Example asks for the AI agent:
- *"Add next month's meetup to the events list and mark it RSVP open."*
- *"Change the primary brand color to a deeper orange."*
- *"Add a 'Past speakers' section to the Home page."*

Because content (events, social links) lives in `site/shared.jsx` and all styling lives in `colors_and_type.css`, these are small, safe edits.

---

## Notes & honest caveats
- **In-browser transpile:** the site compiles its JSX in the browser (you'll see one console warning). It's perfectly fine for a community site and deploys with zero setup. When you want faster load times, `CLAUDE.md` explains the optional one-time upgrade to a Vite build.
- **Social icons** use neutral Lucide glyphs — LinkedIn/Meetup/Bluesky brand marks aren't in the icon set. Swap in official SVGs anytime.
- **Forms** (mailing list, volunteer, donate, RSVP) are front-end only — they show success states but don't yet send anywhere. Wire them to a form service (Netlify Forms, Formspree) or your email tool; the AI agent can do this when you're ready. The Venmo donate link is live.
- **Imagery** is intentionally minimal (the sunset mark + warm gradients). Drop in real meetup photos when you have them.
