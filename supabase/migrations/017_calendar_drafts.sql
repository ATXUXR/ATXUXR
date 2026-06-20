-- =============================================================
-- Calendar Drafts: standalone draft system separate from scheduled calendar
-- Allows admins to create, edit, and review drafts before scheduling
--
-- Tables:
--   calendar_drafts — independent draft posts (no date required, no channel required)
--   calendar_draft_versions — one row per channel per draft with toggle, content, and generation metadata
-- =============================================================

create table if not exists public.calendar_drafts (
  id uuid primary key default gen_random_uuid(),
  -- Optional pillar from thought leadership system
  pillar text check (pillar in (
    'Probabilistic User Research',
    'Trust, Verification, and Safe Reliance',
    'Agentic and Anticipatory UX',
    'AI Economics and Value',
    'Research Craft in the AI Era',
    null
  )),
  -- Format type (same as content_calendar)
  post_type text check (post_type in (
    'original', 'reflection', 'industry', 'academic', null
  )),
  -- Main/anchor title for the draft
  title text,
  -- Main content version (reference for AI generation to other channels)
  main_content text,
  -- Notes visible only to admins
  notes text,
  -- When this draft will be scheduled (optional - can be set later)
  scheduled_date date,
  -- Draft status
  status text not null default 'draft' check (status in (
    'draft', 'reviewing', 'scheduled', 'published'
  )),
  -- Denormalized count of enabled channel versions for quick UI
  enabled_channels_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_drafts_status_idx on public.calendar_drafts (status);
create index if not exists calendar_drafts_scheduled_date_idx on public.calendar_drafts (scheduled_date);
create index if not exists calendar_drafts_pillar_idx on public.calendar_drafts (pillar);

create table if not exists public.calendar_draft_versions (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid not null references public.calendar_drafts(id) on delete cascade,
  channel text not null check (channel in (
    'atxuxr', 'linkedin', 'medium', 'slack', 'instagram'
  )),
  -- Whether this channel is enabled for this draft
  enabled boolean not null default false,
  -- The tailored content for this channel
  content text,
  -- Image URL for this channel version
  image_url text,
  -- Image generation prompt (for regeneration)
  image_prompt text,
  -- Whether this content was AI-generated from main_content
  generated_from_main boolean not null default false,
  -- Timestamp when it was last generated (for tracking iterations)
  last_generated_at timestamptz,
  -- Free-form notes (hashtags, alt text, channel-specific caveats)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (draft_id, channel)
);

create index if not exists calendar_draft_versions_draft_idx
  on public.calendar_draft_versions (draft_id);
create index if not exists calendar_draft_versions_enabled_idx
  on public.calendar_draft_versions (enabled);

-- Trigger to update enabled_channels_count on calendar_drafts when versions change
create or replace function public.update_draft_enabled_count()
returns trigger language plpgsql as $$
begin
  update public.calendar_drafts
  set enabled_channels_count = (
    select count(*) from public.calendar_draft_versions
    where draft_id = new.draft_id and enabled = true
  )
  where id = new.draft_id;
  return new;
end $$;

drop trigger if exists calendar_draft_versions_count_trigger on public.calendar_draft_versions;
create trigger calendar_draft_versions_count_trigger
  after insert or update or delete on public.calendar_draft_versions
  for each row execute function public.update_draft_enabled_count();

-- updated_at triggers
drop trigger if exists calendar_drafts_touch on public.calendar_drafts;
create trigger calendar_drafts_touch before update on public.calendar_drafts
  for each row execute function public.touch_updated_at();

drop trigger if exists calendar_draft_versions_touch on public.calendar_draft_versions;
create trigger calendar_draft_versions_touch before update on public.calendar_draft_versions
  for each row execute function public.touch_updated_at();

-- RLS: Admin-only access
alter table public.calendar_drafts enable row level security;
alter table public.calendar_draft_versions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='calendar_drafts'
      and policyname='calendar_drafts_admin'
  ) then
    create policy calendar_drafts_admin on public.calendar_drafts
      for all using (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      ) with check (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      );
  end if;
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='calendar_draft_versions'
      and policyname='calendar_draft_versions_admin'
  ) then
    create policy calendar_draft_versions_admin on public.calendar_draft_versions
      for all using (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      ) with check (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      );
  end if;
end $$;
