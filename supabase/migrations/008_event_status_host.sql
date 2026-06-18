-- =============================================================
-- Events: add 'cancelled' status + host_id reference to an admin member.
-- =============================================================

-- Drop every CHECK constraint that mentions the status column, then add the
-- new one. Idempotent — safe to rerun.
do $$
declare
  cname text;
begin
  for cname in
    select conname
    from pg_constraint
    where conrelid = 'public.events'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.events drop constraint %I', cname);
  end loop;
end $$;

alter table public.events
  add constraint events_status_check
  check (status in ('open', 'closed', 'cancelled'));

-- Host of the event — links to a members row (typically an admin).
alter table public.events
  add column if not exists host_id uuid references public.members(id) on delete set null;

create index if not exists events_host_id_idx on public.events (host_id);

-- Make sure slug is unique so the seed migration can ON CONFLICT (slug) DO NOTHING.
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'events'
      and indexname = 'events_slug_key'
  ) then
    alter table public.events add constraint events_slug_key unique (slug);
  end if;
end $$;
