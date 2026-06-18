-- =============================================================
-- Seed the Content Calendar with Maral's existing editorial plan:
--   - 5 Assured Reliance series posts (Jun 22 – Jul 6, 2026)
--   - 12 anchor pieces from the Thought Leadership Operating System
-- Each calendar row gets blank drafts created for its target channels.
-- Tier rules:
--   regular  = atxuxr + linkedin + slack   (3 channels)
--   marquee  = atxuxr + linkedin + slack + medium + instagram (5 channels)
-- Marquee gets set true for series openers/closers and original POVs.
-- =============================================================

begin;

-- --------------- Assured Reliance series (already drafted) -----------------
insert into public.content_calendar
  (id, pillar, post_type, anchor_title, scheduled_date, marquee, status, source_files, notes)
values
  ('11111111-1111-1111-1111-000000000001',
   'Trust, Verification, and Safe Reliance', 'original',
   'Trust Is the Wrong Goal for Enterprise AI',
   '2026-06-22', true, 'drafting',
   ARRAY['Assured-Reliance-Series/Post-1-Wrong-Goal/blog_post_1_website.md',
         'Assured-Reliance-Series/Post-1-Wrong-Goal/linkedin_post_1.md'],
   'Series opener. Marquee — all 5 channels. Visuals: three-layers · quadrant · the-loop.'),
  ('11111111-1111-1111-1111-000000000002',
   'Trust, Verification, and Safe Reliance', 'reflection',
   'The Model I Had to Break',
   '2026-06-25', false, 'drafting',
   ARRAY['Assured-Reliance-Series/Post-2-Model-To-Break/blog_post_2_website.md',
         'Assured-Reliance-Series/Post-2-Model-To-Break/linkedin_post_2.md'],
   'Personal post-mortem framing. Regular tier.'),
  ('11111111-1111-1111-1111-000000000003',
   'Trust, Verification, and Safe Reliance', 'original',
   'The Levers: Mechanisms by Layer',
   '2026-06-29', false, 'drafting',
   ARRAY['Assured-Reliance-Series/Post-3-Levers/blog_post_3_website.md',
         'Assured-Reliance-Series/Post-3-Levers/linkedin_post_3.md'],
   'Frameworks post. Regular tier.'),
  ('11111111-1111-1111-1111-000000000004',
   'Trust, Verification, and Safe Reliance', 'original',
   'The Substrate: Why the 87% Has to Be True',
   '2026-07-02', false, 'drafting',
   ARRAY['Assured-Reliance-Series/Post-4-Substrate/blog_post_4_website.md',
         'Assured-Reliance-Series/Post-4-Substrate/linkedin_post_4.md'],
   'Reliability + diagnostic 2×2. Regular tier.'),
  ('11111111-1111-1111-1111-000000000005',
   'Trust, Verification, and Safe Reliance', 'original',
   'The Second Order: Trusting the Silence',
   '2026-07-06', true, 'drafting',
   ARRAY['Assured-Reliance-Series/Post-5-Second-Order/blog_post_5_website.md',
         'Assured-Reliance-Series/Post-5-Second-Order/linkedin_post_5.md'],
   'Series closer. Marquee — all 5 channels. Visuals: funnel · first-vs-second · suppression-review.')
on conflict (id) do nothing;

-- --------------- 12-week starter calendar (anchor pieces) -----------------
-- Follows weekly cadence from Operating System doc, starting the Monday after
-- the Assured Reliance series wraps (Jul 13, 2026). Each is the canonical
-- weekly essay for its week; series shorts can be added later.
insert into public.content_calendar
  (id, pillar, post_type, anchor_title, scheduled_date, marquee, status, source_files, notes)
values
  ('22222222-2222-2222-2222-000000000001',
   'Probabilistic User Research', 'original',
   'Why classic UX research breaks on probabilistic AI',
   '2026-07-13', true, 'planned',
   ARRAY['Content Dump/Probabilistic-User-Research-PUR.pptx',
         'Content Dump/Foundational-Knowledge-Report_Probabilistic-AI-Research.docx'],
   'Start with the deterministic vs probabilistic contrast. Marquee — pillar opener.'),
  ('22222222-2222-2222-2222-000000000002',
   'Trust, Verification, and Safe Reliance', 'original',
   'Trust is the wrong design goal. Verification is the work.',
   '2026-07-20', false, 'planned',
   ARRAY['Content Dump/0-Trust/Maral-Splunk AI Verification Operating System 2.pptx',
         'Content Dump/0-Trust/Maral-Trust.pptx'],
   'Public-safe pass required — internal stakeholder details must come out.'),
  ('22222222-2222-2222-2222-000000000003',
   'Trust, Verification, and Safe Reliance', 'original',
   'Safe reliance beats blind trust and zero trust',
   '2026-07-27', false, 'planned',
   ARRAY['Content Dump/Designing_Safe_AI_Reliance.pptx',
         'Content Dump/AI Acceptance vs. Trustworthiness Analysis.docx'],
   'Frame as a design + research concept, not a Splunk product point.'),
  ('22222222-2222-2222-2222-000000000004',
   'Probabilistic User Research', 'original',
   'How to test nondeterministic AI without faking certainty',
   '2026-08-03', false, 'planned',
   ARRAY['Content Dump/Testing Non-Deterministic AI Systems.docx',
         'Content Dump/Researching Probabilistic AI.pptx'],
   'Methods-heavy. Good candidate for a carousel of test patterns.'),
  ('22222222-2222-2222-2222-000000000005',
   'Agentic and Anticipatory UX', 'original',
   'Agentic UX needs visibility, not magic',
   '2026-08-10', true, 'planned',
   ARRAY['Content Dump/0-Trust/0-Trust-Outshift/Human Agent Interaction (HAX).pptx',
         'Content Dump/0-Trust/0-Trust-Outshift/Trust in Multi-Agent Systems.docx'],
   'Marquee — pillar opener. Sources are meeting-adjacent; scrub carefully.'),
  ('22222222-2222-2222-2222-000000000006',
   'Agentic and Anticipatory UX', 'original',
   'Anticipatory design is not prediction theater',
   '2026-08-17', false, 'planned',
   ARRAY['Content Dump/Anticipatory_Design_Study_Guide.pptx',
         'Content Dump/The Anticipatory Design Playbook_26_03_27_17_53_02.pdf'],
   'Teaching piece. One clear boundary rule.'),
  ('22222222-2222-2222-2222-000000000007',
   'AI Economics and Value', 'original',
   'The AI pricing paradox in enterprise SaaS',
   '2026-08-24', true, 'planned',
   ARRAY['Content Dump/0-AI Economics & Value/AI Pricing Paradox Research for SaaS.docx',
         'Content Dump/0-AI Economics & Value/AI_Product_Economics_Report.docx'],
   'Marquee — pillar opener. Tie value to outcomes + verification cost.'),
  ('22222222-2222-2222-2222-000000000008',
   'AI Economics and Value', 'original',
   'Prompt behavior is product health telemetry',
   '2026-08-31', false, 'planned',
   ARRAY['Content Dump/Measuring Prompting Behavior Evolution.docx',
         'Content Dump/Measuring Prompting Behavior for SaaS Health.docx'],
   'Avoid unsupported performance claims; cite only public sources.'),
  ('22222222-2222-2222-2222-000000000009',
   'Research Craft in the AI Era', 'reflection',
   'The qualitative researcher becomes an interpretive auditor',
   '2026-09-07', false, 'planned',
   ARRAY['Content Dump/Multimodal Qualitative Data Analysis in the Era of Generative AI_ Advancing Thematic Coding and Correlation Workflows.docx'],
   'Identity piece. Personal reflection format.'),
  ('22222222-2222-2222-2222-00000000000a',
   'Trust, Verification, and Safe Reliance', 'original',
   'Disambiguation is trust work',
   '2026-09-14', false, 'planned',
   ARRAY['Content Dump/0-Trust/0-disambiguation research/AI Disambiguation.pdf',
         'Content Dump/0-Trust/0-Cisco + Splunk-RAI-Trust/Disambiguation Research readout.pdf'],
   'Public-safe pass required — sources are internal. Reframe as generic pattern.'),
  ('22222222-2222-2222-2222-00000000000b',
   'Research Craft in the AI Era', 'original',
   'A research playbook for enterprise AI teams',
   '2026-09-21', false, 'planned',
   ARRAY['Content Dump/Prompt Engineering Playbook for Researchers.docx',
         'Content Dump/AI Research Training Program Development.docx'],
   'Practical template. Could be a downloadable PDF.'),
  ('22222222-2222-2222-2222-00000000000c',
   'Research Craft in the AI Era', 'original',
   'What AI product teams need from research now',
   '2026-09-28', true, 'planned',
   ARRAY['Content Dump/UXR Capabilities -  2025.pptx',
         'Content Dump/Researching AI in SaaS Product Lifecycle.docx'],
   'Marquee — pilot closer and synthesis post.')
on conflict (id) do nothing;

-- ---------- Auto-create empty drafts for every calendar × channel ----------
-- Regular posts: atxuxr, linkedin, slack
insert into public.content_drafts (calendar_id, channel, status)
select c.id, ch.channel, 'todo'
  from public.content_calendar c
  cross join (values ('atxuxr'), ('linkedin'), ('slack')) as ch(channel)
  where c.marquee = false
on conflict (calendar_id, channel) do nothing;

-- Marquee posts: all 5 channels
insert into public.content_drafts (calendar_id, channel, status)
select c.id, ch.channel, 'todo'
  from public.content_calendar c
  cross join (values ('atxuxr'), ('linkedin'), ('medium'), ('slack'), ('instagram')) as ch(channel)
  where c.marquee = true
on conflict (calendar_id, channel) do nothing;

commit;
