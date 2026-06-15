-- =============================================================
-- ATX UXR — initial schema
-- =============================================================
-- Run this in the Supabase SQL editor against a fresh project.
-- After running, manually update the seed admin row at the bottom
-- if maral@atxuxr.com isn't the auth.users row you want as admin.
-- =============================================================

-- Helper: updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

-- =============================================================
-- members  (1:1 with auth.users via id)
-- =============================================================
create table if not exists public.members (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  name        text default '',
  photo       text,
  role        text default '',         -- job title
  company     text default '',
  linkedin    text default '',
  website     text default '',
  location    text default '',
  bio         text default '',
  expertise   text[] not null default '{}',
  admin       boolean not null default false,
  fresh       boolean not null default true,
  joined      timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists members_updated on public.members;
create trigger members_updated
  before update on public.members
  for each row execute function public.set_updated_at();

-- Auto-insert a members row when an auth.users row is created.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.members (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================
-- posts
-- =============================================================
create type post_status as enum ('published', 'pending', 'rejected');

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.members(id) on delete cascade,
  title       text not null,
  excerpt     text not null,
  body        text not null,           -- sanitized HTML
  tags        text[] not null default '{}',
  cover       text,
  read_mins   integer not null default 1,
  status      post_status not null default 'pending',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists posts_updated on public.posts;
create trigger posts_updated
  before update on public.posts
  for each row execute function public.set_updated_at();

create index if not exists posts_status_created_at_idx
  on public.posts (status, created_at desc);
create index if not exists posts_author_idx on public.posts (author_id);
create index if not exists posts_tags_idx on public.posts using gin (tags);

-- =============================================================
-- comments
-- =============================================================
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  author_id   uuid references public.members(id) on delete set null,
  name        text not null,           -- denormalized for guest comments
  text        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

-- =============================================================
-- reactions (one row per user per post per type)
-- =============================================================
create type reaction_type as enum ('up', 'heart', 'insight');

create table if not exists public.reactions (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts(id) on delete cascade,
  member_id   uuid not null references public.members(id) on delete cascade,
  type        reaction_type not null,
  created_at  timestamptz not null default now(),
  unique (post_id, member_id, type)
);

create index if not exists reactions_post_idx on public.reactions (post_id);

-- =============================================================
-- signups (mailing list — not full members)
-- =============================================================
create table if not exists public.signups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  source      text default 'site',
  created_at  timestamptz not null default now()
);

create index if not exists signups_email_idx on public.signups (email);

-- =============================================================
-- events
-- =============================================================
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique,
  kind        text not null check (kind in ('CONNECT', 'REFLECT', 'LEARN')),
  title       text not null,
  description text not null default '',
  where_      text not null default '',
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists events_updated on public.events;
create trigger events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

-- =============================================================
-- rsvps
-- =============================================================
create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references public.events(id) on delete cascade,
  member_id   uuid references public.members(id) on delete set null,
  name        text not null,
  email       text not null,
  guests      integer not null default 1,
  created_at  timestamptz not null default now()
);

create index if not exists rsvps_event_idx on public.rsvps (event_id);

-- =============================================================
-- volunteers
-- =============================================================
create table if not exists public.volunteers (
  id          uuid primary key default gen_random_uuid(),
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  company     text,
  position    text,
  role        text not null,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- feedback
-- =============================================================
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid references public.members(id) on delete set null,
  rating      integer,
  message     text not null,
  email       text,
  page        text,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- emails (outbox / blast log)
-- =============================================================
create table if not exists public.emails (
  id          uuid primary key default gen_random_uuid(),
  to_address  text not null,
  subject     text not null,
  body        text not null,
  status      text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  scheduled_for timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz not null default now()
);

-- =============================================================
-- ROW LEVEL SECURITY
-- =============================================================
alter table public.members    enable row level security;
alter table public.posts      enable row level security;
alter table public.comments   enable row level security;
alter table public.reactions  enable row level security;
alter table public.signups    enable row level security;
alter table public.events     enable row level security;
alter table public.rsvps      enable row level security;
alter table public.volunteers enable row level security;
alter table public.feedback   enable row level security;
alter table public.emails     enable row level security;

-- Helper: is the current auth user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select admin from public.members where id = auth.uid()),
    false
  );
$$ language sql stable;

-- ---- members ----
drop policy if exists "members are readable by anyone" on public.members;
create policy "members are readable by anyone"
  on public.members for select using (true);

drop policy if exists "members can update self" on public.members;
create policy "members can update self"
  on public.members for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- Block self-promotion: only admins can change the `admin` flag.
    and (admin = (select admin from public.members where id = auth.uid()))
  );

drop policy if exists "admins can update any member" on public.members;
create policy "admins can update any member"
  on public.members for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete members" on public.members;
create policy "admins can delete members"
  on public.members for delete using (public.is_admin());

-- ---- posts ----
drop policy if exists "published posts readable by anyone" on public.posts;
create policy "published posts readable by anyone"
  on public.posts for select
  using (status = 'published' or auth.uid() = author_id or public.is_admin());

drop policy if exists "members can submit posts" on public.posts;
create policy "members can submit posts"
  on public.posts for insert
  with check (auth.uid() = author_id and status = 'pending');

drop policy if exists "authors can edit own pending posts" on public.posts;
create policy "authors can edit own pending posts"
  on public.posts for update
  using (auth.uid() = author_id and status = 'pending')
  with check (auth.uid() = author_id);

drop policy if exists "admins can update any post" on public.posts;
create policy "admins can update any post"
  on public.posts for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins can delete posts" on public.posts;
create policy "admins can delete posts"
  on public.posts for delete using (public.is_admin());

-- ---- comments ----
drop policy if exists "comments readable by anyone" on public.comments;
create policy "comments readable by anyone"
  on public.comments for select using (true);

drop policy if exists "anyone can post a comment" on public.comments;
create policy "anyone can post a comment"
  on public.comments for insert with check (true);

drop policy if exists "authors and admins can delete comments" on public.comments;
create policy "authors and admins can delete comments"
  on public.comments for delete
  using (auth.uid() = author_id or public.is_admin());

-- ---- reactions ----
drop policy if exists "reactions readable by anyone" on public.reactions;
create policy "reactions readable by anyone"
  on public.reactions for select using (true);

drop policy if exists "members manage own reactions" on public.reactions;
create policy "members manage own reactions"
  on public.reactions for all
  using (auth.uid() = member_id)
  with check (auth.uid() = member_id);

-- ---- signups ----
drop policy if exists "anyone can sign up to mailing list" on public.signups;
create policy "anyone can sign up to mailing list"
  on public.signups for insert with check (true);

drop policy if exists "admins read signups" on public.signups;
create policy "admins read signups"
  on public.signups for select using (public.is_admin());

-- ---- events ----
drop policy if exists "events readable by anyone" on public.events;
create policy "events readable by anyone"
  on public.events for select using (true);

drop policy if exists "admins write events" on public.events;
create policy "admins write events"
  on public.events for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---- rsvps ----
drop policy if exists "anyone can RSVP" on public.rsvps;
create policy "anyone can RSVP"
  on public.rsvps for insert with check (true);

drop policy if exists "admins read all rsvps" on public.rsvps;
create policy "admins read all rsvps"
  on public.rsvps for select using (public.is_admin());

drop policy if exists "members read own rsvps" on public.rsvps;
create policy "members read own rsvps"
  on public.rsvps for select using (auth.uid() = member_id);

-- ---- volunteers ----
drop policy if exists "anyone can volunteer" on public.volunteers;
create policy "anyone can volunteer"
  on public.volunteers for insert with check (true);

drop policy if exists "admins read volunteers" on public.volunteers;
create policy "admins read volunteers"
  on public.volunteers for select using (public.is_admin());

-- ---- feedback ----
drop policy if exists "anyone can leave feedback" on public.feedback;
create policy "anyone can leave feedback"
  on public.feedback for insert with check (true);

drop policy if exists "admins read feedback" on public.feedback;
create policy "admins read feedback"
  on public.feedback for select using (public.is_admin());

-- ---- emails (admin only) ----
drop policy if exists "admins manage emails" on public.emails;
create policy "admins manage emails"
  on public.emails for all
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================
-- SEED: maral@atxuxr.com → admin
-- (no-op if she hasn't signed up yet; rerun after first sign-in)
-- =============================================================
update public.members
   set admin = true,
       fresh = false,
       name  = coalesce(nullif(name, ''), 'Maral Elliott'),
       role  = coalesce(nullif(role, ''), 'Founder & Lead Organizer'),
       company = coalesce(nullif(company, ''), 'ATX UXR')
 where email = 'maral@atxuxr.com';
