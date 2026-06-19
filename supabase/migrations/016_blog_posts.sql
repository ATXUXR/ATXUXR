-- Published blog posts table. Posts can be created from calendar items or directly.
-- Links to calendar_id for tracking which calendar post it came from.

begin;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  calendar_id uuid references public.content_calendar(id) on delete set null,
  title text not null,
  slug text not null unique,
  body_md text not null,
  summary text,
  author_id uuid not null references public.members(id) on delete set null,
  featured_image_url text,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists blog_posts_calendar_idx on public.blog_posts(calendar_id);
create index if not exists blog_posts_published_idx on public.blog_posts(published_at);
create index if not exists blog_posts_slug_idx on public.blog_posts(slug);

-- Trigger to auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
  before update on public.blog_posts
  for each row
  execute function public.touch_updated_at();

-- RLS: Everyone can read published posts.
-- Authors can edit their own. Admins can do anything.
alter table public.blog_posts enable row level security;

create policy blog_posts_read on public.blog_posts
  for select
  using (true);

create policy blog_posts_author_write on public.blog_posts
  for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy blog_posts_admin on public.blog_posts
  for all
  using (exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true))
  with check (exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true));

commit;
