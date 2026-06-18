-- =============================================================
-- Content Calendar: editorial planning for Maral's thought-leadership pieces.
-- Two tables:
--   content_calendar — one row per planned post (pillar + type + schedule)
--   content_drafts   — one row per channel per post (atxuxr/linkedin/medium/
--                      slack/instagram) with the channel-specific copy and
--                      image-gen prompt.
-- =============================================================

create table if not exists public.content_calendar (
  id uuid primary key default gen_random_uuid(),
  -- One of the 5 pillars from the Thought Leadership Operating System.
  pillar text not null check (pillar in (
    'Probabilistic User Research',
    'Trust, Verification, and Safe Reliance',
    'Agentic and Anticipatory UX',
    'AI Economics and Value',
    'Research Craft in the AI Era'
  )),
  -- Format mix layer: which lane this post fits in.
  --   original  = original thought leadership / Maral's own framework
  --   reflection = personal commentary on her own experience
  --   industry   = commentary tied to an external industry article/product/talk
  --   academic   = commentary tied to a paper / research citation
  post_type text not null check (post_type in (
    'original', 'reflection', 'industry', 'academic'
  )),
  anchor_title text not null,
  scheduled_date date,
  -- "Marquee" pieces unlock the secondary channels (Medium + Instagram). Regular
  -- pieces are atxuxr + linkedin + slack only.
  marquee boolean not null default false,
  status text not null default 'planned' check (status in (
    'planned', 'drafting', 'public-safe-review', 'scheduled', 'published'
  )),
  source_files text[],
  notes text,
  -- Optional FK to a published blog post once it's live on atxuxr.com.
  published_post_id uuid references public.posts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_calendar_scheduled_idx
  on public.content_calendar (scheduled_date);
create index if not exists content_calendar_pillar_idx
  on public.content_calendar (pillar);
create index if not exists content_calendar_status_idx
  on public.content_calendar (status);

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid not null references public.content_calendar(id) on delete cascade,
  channel text not null check (channel in (
    'atxuxr', 'linkedin', 'medium', 'slack', 'instagram'
  )),
  status text not null default 'todo' check (status in (
    'todo', 'drafting', 'ready', 'published'
  )),
  body_md text,
  -- Prompt suitable to feed an AI image generator (Midjourney, Stable
  -- Diffusion, OpenAI image API, etc.) to produce the visual for this channel.
  image_prompt text,
  -- URL of the finished visual once Maral has generated and uploaded it.
  image_url text,
  -- Free-form notes (alt text, hashtags, scheduling caveats).
  notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (calendar_id, channel)
);

create index if not exists content_drafts_calendar_idx
  on public.content_drafts (calendar_id);

-- updated_at triggers (keeps editor UI honest about freshness).
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists content_calendar_touch on public.content_calendar;
create trigger content_calendar_touch before update on public.content_calendar
  for each row execute function public.touch_updated_at();

drop trigger if exists content_drafts_touch on public.content_drafts;
create trigger content_drafts_touch before update on public.content_drafts
  for each row execute function public.touch_updated_at();

alter table public.content_calendar enable row level security;
alter table public.content_drafts   enable row level security;

-- Admins-only on both tables.
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='content_calendar'
      and policyname='content_calendar_admin'
  ) then
    create policy content_calendar_admin on public.content_calendar
      for all using (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      ) with check (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='content_drafts'
      and policyname='content_drafts_admin'
  ) then
    create policy content_drafts_admin on public.content_drafts
      for all using (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      ) with check (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      );
  end if;
end $$;
