-- =============================================================
-- ATX UXR — first-party telemetry
-- =============================================================
-- Two tables: page_views (one row per pageview) and behavior_events
-- (clicks, form submits, etc). Inserts come from the /api/track route
-- using the service role key, so RLS insert policies are open as a
-- belt-and-suspenders measure. Reads are admins-only via is_admin().
-- =============================================================

-- =============================================================
-- page_views
-- =============================================================
create table if not exists public.page_views (
  id          bigserial primary key,
  session_id  text not null,         -- sessionStorage UUID
  path        text not null,         -- pathname only (no query)
  referrer    text,                  -- raw Referer header
  source      text,                  -- derived bucket: 'direct' | 'linkedin' | 'google' | 'twitter' | hostname
  device      text,                  -- 'desktop' | 'mobile' | 'tablet'
  country     text,                  -- ISO 3166-1 alpha-2 (e.g. 'US')
  region      text,                  -- US state code (e.g. 'TX')
  ip_hash     text,                  -- sha256(salt || ip)
  user_id     uuid references auth.users(id) on delete set null,
  duration_ms integer,               -- filled in when next pageview arrives or on visibilitychange
  created_at  timestamptz not null default now()
);

create index if not exists page_views_session_idx on public.page_views (session_id, created_at);
create index if not exists page_views_created_at_idx on public.page_views (created_at desc);
create index if not exists page_views_path_idx on public.page_views (path);

alter table public.page_views enable row level security;

drop policy if exists "anyone can insert page_views" on public.page_views;
create policy "anyone can insert page_views"
  on public.page_views for insert
  with check (true);  -- locked down by API key + RPC validation, not RLS

drop policy if exists "admins read page_views" on public.page_views;
create policy "admins read page_views"
  on public.page_views for select
  using (public.is_admin());

-- =============================================================
-- behavior_events (button clicks, form submits, outbound links, etc.)
-- =============================================================
create table if not exists public.behavior_events (
  id         bigserial primary key,
  session_id text not null,
  kind       text not null,          -- 'click' | 'form_submit' | 'outbound' | etc.
  label      text,                   -- e.g. 'Donate on PayPal'
  path       text not null,
  meta       jsonb,
  created_at timestamptz not null default now()
);

create index if not exists behavior_events_kind_idx on public.behavior_events (kind, created_at desc);
create index if not exists behavior_events_session_idx on public.behavior_events (session_id);

alter table public.behavior_events enable row level security;

drop policy if exists "anyone can insert behavior_events" on public.behavior_events;
create policy "anyone can insert behavior_events"
  on public.behavior_events for insert with check (true);

drop policy if exists "admins read behavior_events" on public.behavior_events;
create policy "admins read behavior_events"
  on public.behavior_events for select using (public.is_admin());
