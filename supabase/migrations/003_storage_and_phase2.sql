-- =============================================================
-- Phase 2 — Storage + remaining table policies
-- =============================================================
-- Adds:
--   • Storage buckets: avatars, covers (public read)
--   • Storage RLS: signed-in users can write only to their own folder
--   • Posts INSERT policy already exists ("members can submit posts");
--     here we extend cover handling and add reaction-toggle policy gaps.
-- =============================================================

-- ---- Buckets (public so the CDN URL works without signed URLs) ----
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('covers',  'covers',  true)
on conflict (id) do update set public = excluded.public;

-- ---- Storage RLS ----
-- Anyone can read images (public buckets).
drop policy if exists "Public read avatars" on storage.objects;
create policy "Public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Public read covers" on storage.objects;
create policy "Public read covers"
  on storage.objects for select
  using (bucket_id = 'covers');

-- Authenticated users can upload/update/delete ONLY in their own folder.
-- Files are stored at  <bucket>/<auth.uid()>/<filename>  so the first path
-- segment must equal the user id.
drop policy if exists "Users write own avatars" on storage.objects;
create policy "Users write own avatars"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own avatars" on storage.objects;
create policy "Users update own avatars"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own avatars" on storage.objects;
create policy "Users delete own avatars"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users write own covers" on storage.objects;
create policy "Users write own covers"
  on storage.objects for insert
  with check (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own covers" on storage.objects;
create policy "Users update own covers"
  on storage.objects for update
  using (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own covers" on storage.objects;
create policy "Users delete own covers"
  on storage.objects for delete
  using (
    bucket_id = 'covers'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================
-- Phase 2 table policies (gaps from 001)
-- =============================================================

-- ---- comments: signed-in users can delete their own ----
-- (001 already lets anyone insert + admins/authors delete; SELECT is open.)
-- Nothing to add — the existing policies cover the UI flow.

-- ---- reactions: SELECT is open in 001, "members manage own" covers
--      INSERT/UPDATE/DELETE. Nothing to add.

-- ---- emails: 001 restricted to admins. Nothing to add.

-- ---- helpful indexes for Phase 2 reads ----
create index if not exists members_expertise_idx on public.members using gin (expertise);
create index if not exists members_admin_idx on public.members (admin) where admin = true;
