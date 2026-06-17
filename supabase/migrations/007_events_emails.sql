-- =============================================================
-- ATX UXR — events CRUD, RSVP emails, unsubscribe, email_sends
-- =============================================================
-- Extends `events` with the fields the admin editor needs, adds
-- unsubscribe state to `signups`, creates `email_sends` for
-- per-recipient tracking + RSVP attribution, and wires up the
-- public `events` storage bucket for cover images.
-- =============================================================

-- Events: extend with what the admin editor needs.
alter table public.events
  add column if not exists image       text,
  add column if not exists address     text,
  add column if not exists online_url  text,
  add column if not exists lat         numeric,
  add column if not exists lng         numeric,
  add column if not exists kind_label  text;  -- display label for event type (e.g. 'Happy Hour')

-- Events: RLS so anyone can read open events, admins manage.
alter table public.events enable row level security;

drop policy if exists "events readable by anyone" on public.events;
create policy "events readable by anyone"
  on public.events for select using (true);

drop policy if exists "admins write events" on public.events;
create policy "admins write events"
  on public.events for all
  using (public.is_admin()) with check (public.is_admin());

-- Unsubscribe state on signups. We already have a `tags text[]` from
-- migration 004; 'unsubscribed' is one of those tags. Add a dedicated
-- bool for queryability and an unsubscribe_token for the link.
alter table public.signups
  add column if not exists unsubscribed       boolean not null default false,
  add column if not exists unsubscribed_at    timestamptz,
  add column if not exists unsubscribe_token  text;

create unique index if not exists signups_unsubscribe_token_uidx
  on public.signups (unsubscribe_token)
  where unsubscribe_token is not null;

-- Backfill tokens for existing rows so any later email blasts can include the link.
update public.signups
   set unsubscribe_token = encode(gen_random_bytes(18), 'hex')
 where unsubscribe_token is null;

-- Email send log: one row per recipient per send (not per blast).
-- Lets us count opens / clicks per blast and attribute RSVPs back.
create table if not exists public.email_sends (
  id            uuid primary key default gen_random_uuid(),
  email_id      uuid references public.emails(id) on delete cascade,
  signup_id     uuid references public.signups(id) on delete cascade,
  member_id     uuid references public.members(id) on delete cascade,
  to_address    text not null,
  campaign      text,                -- 'event-invite', 'blast', 'rsvp-confirmation'
  utm           text,                -- the value we put in ?utm= on links
  sent_at       timestamptz not null default now(),
  opened_at     timestamptz,
  clicked_at    timestamptz
);

create index if not exists email_sends_utm_idx on public.email_sends (utm);
create index if not exists email_sends_email_id_idx on public.email_sends (email_id);

alter table public.email_sends enable row level security;

drop policy if exists "admins read email_sends" on public.email_sends;
create policy "admins read email_sends"
  on public.email_sends for select using (public.is_admin());

-- Storage bucket for event images.
insert into storage.buckets (id, name, public)
values ('events', 'events', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public read events bucket" on storage.objects;
create policy "Public read events bucket"
  on storage.objects for select using (bucket_id = 'events');

drop policy if exists "Admins write events bucket" on storage.objects;
create policy "Admins write events bucket"
  on storage.objects for insert
  with check (bucket_id = 'events' and public.is_admin());

drop policy if exists "Admins update events bucket" on storage.objects;
create policy "Admins update events bucket"
  on storage.objects for update
  using (bucket_id = 'events' and public.is_admin());

drop policy if exists "Admins delete events bucket" on storage.objects;
create policy "Admins delete events bucket"
  on storage.objects for delete
  using (bucket_id = 'events' and public.is_admin());
