-- =============================================================
-- Add tagging + names to signups so legacy contacts can be imported
-- with their provenance (volunteer, subscriber, rsvp-learn-1, etc.)
-- =============================================================

alter table public.signups
  add column if not exists tags        text[] not null default '{}',
  add column if not exists first_name  text,
  add column if not exists last_name   text,
  add column if not exists company     text,
  add column if not exists position    text;

create index if not exists signups_tags_idx on public.signups using gin (tags);

-- Make email unique so re-imports merge into the same row.
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'signups'
      and indexname = 'signups_email_key'
  ) then
    alter table public.signups
      add constraint signups_email_key unique (email);
  end if;
end $$;
