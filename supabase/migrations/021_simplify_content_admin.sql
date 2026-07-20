-- =============================================================
-- 021_simplify_content_admin.sql
-- Groundwork for the simplified content + scheduling admin (2026-07).
--   1) posts.pillar        — the live blog had no pillar column, so cadence
--                            analysis on it was always blank. Add it.
--   2) calendar_drafts.status — collapse to the four chips the admin now uses:
--                            drafting / ready / scheduled / published.
--   3) publish linkage     — give calendar_drafts a real FK into posts, plus an
--                            auto-publish time, cover image, topic tags, and a
--                            source pointer used by the one-time content_calendar
--                            merge.
-- Safe to run once. Wrapped in a transaction.
-- =============================================================

begin;

-- 1) posts.pillar -------------------------------------------------------------
alter table public.posts
  add column if not exists pillar text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'posts_pillar_check') then
    alter table public.posts
      add constraint posts_pillar_check check (
        pillar is null or pillar in (
          'Probabilistic User Research',
          'Trust, Verification, and Safe Reliance',
          'Agentic and Anticipatory UX',
          'AI Economics and Value',
          'Research Craft in the AI Era'
        )
      );
  end if;
end $$;

create index if not exists posts_pillar_idx on public.posts (pillar);

-- 2) calendar_drafts.status ---------------------------------------------------
--    old: draft / reviewing / scheduled / published
--    new: drafting / ready / scheduled / published
alter table public.calendar_drafts alter column status drop default;
-- drop the old constraint BEFORE remapping values, else the update violates it
alter table public.calendar_drafts drop constraint if exists calendar_drafts_status_check;

update public.calendar_drafts set status = 'drafting' where status = 'draft';
update public.calendar_drafts set status = 'ready'    where status = 'reviewing';
alter table public.calendar_drafts
  add constraint calendar_drafts_status_check
    check (status in ('drafting','ready','scheduled','published'));

alter table public.calendar_drafts alter column status set default 'drafting';

-- 3) publish linkage + auto-publish time + cover + topic tags + merge source --
alter table public.calendar_drafts
  add column if not exists published_post_id uuid references public.posts(id) on delete set null,
  add column if not exists scheduled_time text,
  add column if not exists cover_image_url text,
  add column if not exists topics text[] not null default '{}',
  add column if not exists source_calendar_id uuid;

comment on column public.calendar_drafts.scheduled_time is
  'Auto-publish time of day (HH:mm, America/Chicago). Null = use default publish time.';
comment on column public.calendar_drafts.cover_image_url is
  'Optional cover image for the published blog post (manual upload).';
comment on column public.calendar_drafts.source_calendar_id is
  'If migrated from legacy content_calendar, the source row id. Prevents double-import.';

create unique index if not exists calendar_drafts_source_calendar_uidx
  on public.calendar_drafts (source_calendar_id)
  where source_calendar_id is not null;

commit;
