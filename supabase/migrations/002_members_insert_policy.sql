-- =============================================================
-- Fix: missing INSERT policy on members
-- -------------------------------------------------------------
-- The initial migration enabled RLS on `members` but only wrote
-- UPDATE / SELECT / DELETE policies. When the auth trigger missed
-- a sign-in (e.g. OAuth race condition) and the client tried to
-- upsert their profile, the INSERT got blocked.
-- =============================================================

drop policy if exists "members can insert self" on public.members;
create policy "members can insert self"
  on public.members for insert
  with check (auth.uid() = id);

-- Backfill: create a members row for any auth.users that don't have one.
insert into public.members (id, email, name)
select u.id, u.email,
       coalesce(u.raw_user_meta_data->>'name',
                u.raw_user_meta_data->>'full_name',
                '')
from auth.users u
where u.id not in (select id from public.members);
