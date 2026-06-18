-- =============================================================
-- Worked example: Post 1 of the Assured Reliance series, drafted for every
-- channel. Use these as the template/voice reference when drafting the other
-- 16 posts.
-- =============================================================

begin;

-- ATXUXR (canonical) -------------------------------------------------------
-- Note: the full essay lives at Assured-Reliance-Series/Post-1-Wrong-Goal/
-- blog_post_1_website.md. The DB stores a short stub; when publishing on
-- atxuxr.com, copy the full essay from the source file.
update public.content_drafts
set
  status = 'ready',
  body_md = $body$# Trust Is the Wrong Goal for Enterprise AI

*Assured Reliance — Part 1 of 5 · ~8 min read*

Enterprise software vendors talk about trust the way consumer brands talk about love: as a quantity to maximize. In high-stakes settings, that instinct is the mechanism of catastrophe.

This post argues the inversion the rest of the series runs on: **trust is not the goal, and trustworthiness is not a feeling.** It separates three things we collapse into one word — trustworthiness (a system property), trust (an operator attitude), reliance (operator behavior) — and shows why the design target is reliance proportional to demonstrated reliability, not maximum reliance.

The full 8-minute essay covers the reliance-reliability quadrant, the Deception and Underutilization zones, the trust-loop's hysteresis, and what to measure instead of survey-based trust.

> Source file (paste this into the editor when publishing):
> `Assured-Reliance-Series/Post-1-Wrong-Goal/blog_post_1_website.md`

Read the rest of the series:
- Part 2 — The Model I Had to Break (Jun 25)
- Part 3 — The Levers (Jun 29)
- Part 4 — The Substrate (Jul 2)
- Part 5 — The Second Order (Jul 6)
$body$,
  image_prompt = $img$An editorial-style hero image, landscape 16:9, designed for a thought-leadership blog header. Centered: two overlapping translucent layers — a measured-blue "Reliability" stripe and a softer cream "Reliance" stripe — slightly misaligned to show calibration drift. Around them, faint annotation marks suggesting precision/recall, gauges, and a quiet sans-serif label: "Reliance proportional to reliability." Color palette: warm cream background (#F7F2EC), inked navy (#1F2940), a single orange accent (#EE4A1C). Flat editorial illustration, no people, no text bigger than 12pt, no logos. Style references: Stripe Press, The Pudding, Information Is Beautiful.$img$,
  notes = 'Canonical post. Publish first — every other channel links back here. Use the full essay text from the source file. Visual: replace stock infographic with AI-generated hero per image_prompt.'
where calendar_id = '11111111-1111-1111-1111-000000000001' and channel = 'atxuxr';

-- LinkedIn (short, conversation channel) ------------------------------------
update public.content_drafts
set
  status = 'ready',
  body_md = $body$Most enterprise AI teams are optimizing the wrong variable.

We treat trust like a number to maximize. More confident UI. More authoritative language. Fewer speed bumps between the recommendation and the click. And in high-stakes software, that instinct is how you get the analyst who rubber-stamps the "benign" verdict on the alert that was actually the breach.

Maximum trust isn't the goal. It's the failure mode.

Three things wear the same word and live in three different places:

→ Trustworthiness is a property of the system. You measure it — precision, recall, calibration error, failure behavior.
→ Trust is an attitude in the operator's head. Useful as a mediator, dangerous as a target.
→ Reliance is what the operator actually does — accept, override, verify. It's behavior, and it shows up in logs, not surveys.

The design target isn't more reliance. It's reliance proportional to demonstrated reliability. When reliance runs ahead of reliability, you're in the Deception Zone, where harm lives. When reliability runs ahead of reliance, you're in the Underutilization Zone, where most stalled AI pilots quietly die.

Neither is a model-quality problem. Both are legibility problems, pointing in opposite directions.

New series — Assured Reliance. Five posts on what to design and measure instead of "trust." Part 1 is live: {LINK_TO_ATXUXR_POST}

What's your team actually measuring — the attitude, or the behavior?

#EnterpriseAI #AITrust #ProductDesign #UXResearch #ResponsibleAI$body$,
  image_prompt = $img$Square 1080×1080 LinkedIn graphic. A 2×2 quadrant chart on a warm cream background (#F7F2EC). X-axis labeled "Reliance" (low → high), Y-axis "Reliability" (low → high). The diagonal from bottom-left to top-right is highlighted in deep navy ink (#1F2940) and labeled "Calibrated Reliance." The upper-left quadrant is shaded soft sage and labeled "Underutilization Zone — value paid for, never realized." The lower-right quadrant is shaded soft terracotta (#EE4A1C at low opacity) and labeled "Deception Zone — where harm lives." Title at top: "Trust is not the goal." Subtitle: "Reliance proportional to reliability is." Bold serif headline (Bricolage Grotesque), labels in clean sans-serif. No people, no logos. Editorial information-design style; references: Information Is Beautiful, FT Graphics.$img$,
  notes = 'Schedule for Mon Jun 22, 9:00 AM CT. Replace {LINK_TO_ATXUXR_POST} with the live URL after the canonical post goes up.'
where calendar_id = '11111111-1111-1111-1111-000000000001' and channel = 'linkedin';

-- Medium (secondary syndication, 7-10 days later) ---------------------------
update public.content_drafts
set
  status = 'ready',
  body_md = $body$# Trust Is the Wrong Goal for Enterprise AI

> Originally published on [atxuxr.com]({LINK_TO_ATXUXR_POST}). This is a syndicated repost; the canonical version lives there.

*Part 1 of the Assured Reliance series.*

Enterprise software vendors talk about trust the way consumer brands talk about love: as a quantity to maximize. The marketing instinct is to make the operator trust the system more — more confident UI, more authoritative language, fewer speed bumps between the recommendation and the click. In low-stakes software, that instinct is mostly harmless. In high-stakes settings, it's the mechanism of catastrophe.

[Paste full essay body from Assured-Reliance-Series/Post-1-Wrong-Goal/blog_post_1_website.md, preserving section headers]

---

*If this resonated, the rest of the series is at [atxuxr.com/blog](https://atxuxr.com/blog). I write about research and design for probabilistic AI systems in enterprise software. Find me on [LinkedIn](https://www.linkedin.com/in/maralelliott).*

#enterprise-ai #ai-trust #ux-research #responsible-ai #product-design$body$,
  image_prompt = $img$Same hero as the atxuxr.com canonical post — landscape 16:9, editorial style, warm cream background, two overlapping translucent stripes (Reliability blue / Reliance cream) misaligned, with annotation marks. Color palette: cream (#F7F2EC), inked navy (#1F2940), orange accent (#EE4A1C). Use the same hero so the visual identity carries across atxuxr.com and Medium.$img$,
  notes = 'Schedule for Wed Jul 1 (~9 days after canonical). Medium "Import a story" feature can pull the atxuxr post directly and preserve canonical_url. Tags: enterprise-ai, ai-trust, ux-research, responsible-ai, product-design.'
where calendar_id = '11111111-1111-1111-1111-000000000001' and channel = 'medium';

-- Slack #blog (cross-post via Share dialog) ---------------------------------
update public.content_drafts
set
  status = 'ready',
  body_md = $body$:sparkles: *New essay on atxuxr.com — Part 1 of the Assured Reliance series*

*Trust Is the Wrong Goal for Enterprise AI*

Most teams are optimizing the wrong variable. The post separates three things we collapse into one word — trustworthiness (system property), trust (operator attitude), reliance (operator behavior) — and argues the design target is reliance proportional to demonstrated reliability.

8 min read · 5-part series · public-safe drafted

→ {LINK_TO_ATXUXR_POST}$body$,
  image_prompt = $img$Slack auto-unfurls the OG image from the atxuxr.com post, so no separate visual is required for Slack — same hero image used on the canonical post will appear in the message preview.$img$,
  notes = 'Post via the Share dialog in admin Events tab → Share → Slack #blog. Schedule for ~10am CT the day the canonical goes live so it shows up in the day''s scrollback.'
where calendar_id = '11111111-1111-1111-1111-000000000001' and channel = 'slack';

-- Instagram (visual-first, no clickable links) ------------------------------
update public.content_drafts
set
  status = 'ready',
  body_md = $body$Most enterprise AI teams are optimizing the wrong variable.

We treat trust like a number to maximize — confident UI, authoritative language, fewer checks. In high-stakes software, that instinct is how you get the analyst who rubber-stamps the "benign" verdict on the alert that turned out to be the breach.

Maximum trust isn't the goal. It's the failure mode.

Three things wear the same word:
✦ Trustworthiness — a property of the system you measure
✦ Trust — an attitude in the operator's head
✦ Reliance — what the operator actually does

The design target isn't more reliance. It's reliance proportional to demonstrated reliability.

Too much reliance for the system's actual reliability → the Deception Zone (where harm lives).
Too much reliability for actual reliance → the Underutilization Zone (where most pilots quietly die).

Neither is a model-quality problem. Both are legibility problems pointing in opposite directions.

New 5-part series — link in bio for Part 1 on atxuxr.com.

—
#EnterpriseAI #AITrust #UXResearch #ProductDesign #ResponsibleAI #AIProductDesign #ATXUXR #AustinUX$body$,
  image_prompt = $img$Instagram carousel — 4 square 1080×1080 slides, sequential. Style: warm cream background (#F7F2EC), bold serif headlines (Bricolage Grotesque), navy ink (#1F2940), single orange accent (#EE4A1C). High contrast, large type, generous whitespace. No people, no stock photography, no logos.

Slide 1 (hook): full-bleed bold headline "Trust is the wrong goal for enterprise AI" — serif, 64pt. Small subtitle: "A 5-part series on reliance, reliability, and the zones where AI pilots die."

Slide 2 (the three words): three vertical stacked cards. Top card: "TRUSTWORTHINESS — a property of the system." Middle: "TRUST — an attitude in the operator's head." Bottom: "RELIANCE — what the operator actually does." Each card has a one-line definition below the title. Subtle dividing lines between them.

Slide 3 (the quadrant): a 2×2 chart, X-axis "Reliance," Y-axis "Reliability." Diagonal labeled "Calibrated Reliance" in navy ink. Upper-left quadrant shaded sage, labeled "Underutilization Zone." Lower-right quadrant shaded terracotta, labeled "Deception Zone." Clean, oversized labels.

Slide 4 (CTA): centered text "Part 1 is live on atxuxr.com." Below: "Link in bio." Small footer: "Assured Reliance · Part 1 of 5."

Editorial information-design references: Stripe Press, Information Is Beautiful, FT Visual. Match the warmth and texture of the atxuxr.com brand.$img$,
  notes = 'Schedule for Mon Jun 22, 12:00 PM CT (lunch slot for IG engagement). Carousel of 4 slides per image_prompt. Bio link: update to point to the canonical atxuxr.com post. Captions are text-first, no clickable links in feed.'
where calendar_id = '11111111-1111-1111-1111-000000000001' and channel = 'instagram';

commit;
