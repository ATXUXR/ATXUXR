-- =============================================================
-- Social post log: tracks each share attempt from the admin Share dialog so
-- the admin can see what's been posted where, and we can surface failures.
-- =============================================================

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('event', 'blog', 'announcement')),
  -- Loose FK on purpose: events and posts each have their own tables, and
  -- ad-hoc announcements have no source. NULL is fine for ad-hoc.
  source_id uuid,
  channel text not null check (channel in (
    'slack-events', 'slack-blog', 'slack-general',
    'linkedin', 'linkedin-group', 'instagram'
  )),
  caption text,
  status text not null check (status in ('sent', 'failed', 'opened')),
  -- 'sent' = Slack returned 200
  -- 'failed' = Slack returned an error (reason in error column)
  -- 'opened' = admin clicked the LinkedIn/IG share button (we can't confirm
  --            the actual post landed; this just records that the dialog
  --            was opened for them)
  error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists social_posts_created_at_idx
  on public.social_posts (created_at desc);
create index if not exists social_posts_source_idx
  on public.social_posts (source_id);

alter table public.social_posts enable row level security;

-- Admins read/write, anyone else: nothing.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_posts'
      and policyname = 'social_posts_admin_select'
  ) then
    create policy social_posts_admin_select on public.social_posts
      for select using (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      );
  end if;
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_posts'
      and policyname = 'social_posts_admin_insert'
  ) then
    create policy social_posts_admin_insert on public.social_posts
      for insert with check (
        exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true)
      );
  end if;
end $$;
