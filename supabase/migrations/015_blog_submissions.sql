-- Blog submissions table for users to propose content for the blog.
-- Admins can review, edit, and approve submissions to add them to the calendar.

begin;

create table if not exists public.blog_submissions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  title text not null,
  body_md text not null,
  summary text,
  pillar text check (pillar in (
    'Probabilistic User Research',
    'Trust, Verification, and Safe Reliance',
    'Agentic and Anticipatory UX',
    'AI Economics and Value',
    'Research Craft in the AI Era'
  )),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_submissions_status_idx on public.blog_submissions(status);
create index if not exists blog_submissions_member_idx on public.blog_submissions(member_id);

-- Trigger to auto-update updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists blog_submissions_touch on public.blog_submissions;
create trigger blog_submissions_touch
  before update on public.blog_submissions
  for each row
  execute function public.touch_updated_at();

-- RLS: Everyone can read public submitted posts; members can read their own.
-- Admins can read/write all.
alter table public.blog_submissions enable row level security;

create policy blog_submissions_public_read on public.blog_submissions
  for select
  using (true);

create policy blog_submissions_member_write on public.blog_submissions
  for insert
  with check (member_id = auth.uid());

create policy blog_submissions_admin on public.blog_submissions
  for all
  using (exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true))
  with check (exists (select 1 from public.members m where m.id = auth.uid() and m.admin = true));

commit;
