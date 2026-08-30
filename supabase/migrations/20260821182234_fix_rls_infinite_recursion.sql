/*
# Fix RLS infinite recursion on profiles

## Purpose
The profiles_select_own_or_admin policy (and several other policies across
blood_centers, blood_inventory, blood_requests, donor_requests, notifications)
query the profiles table inside a subquery to check the user's role. Since
profiles itself has an RLS policy that does the same thing, this creates
infinite recursion.

## Fix
1. Create two SECURITY DEFINER helper functions that read profiles.role
   while bypassing RLS:
   - public.is_admin() returns true if the current user's role is 'admin'
   - public.is_donor_or_admin() returns true if role is 'donor' or 'admin'
2. Replace all EXISTS (SELECT 1 FROM profiles ...) subqueries in policies
   with calls to these helper functions.

## Security
- The helper functions are SECURITY DEFINER with search_path = public,
  so they bypass RLS. This is safe because they only read the role column
  and return a boolean. EXECUTE is revoked from anon and authenticated.

## Notes
1. No data is modified or lost.
2. All policy changes are drop-first-then-create for idempotency.
*/

-- ============================================================
-- Helper functions (SECURITY DEFINER, bypass RLS)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_donor_or_admin()
returns boolean
language sql
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('donor', 'admin')
  );
$$;

-- Revoke direct RPC access (only used internally by policies)
revoke execute on function public.is_admin() from anon, authenticated;
revoke execute on function public.is_donor_or_admin() from anon, authenticated;

-- ============================================================
-- Fix profiles policies
-- ============================================================
drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin());

-- ============================================================
-- Fix blood_centers policies
-- ============================================================
drop policy if exists "centers_insert_admin" on public.blood_centers;
create policy "centers_insert_admin"
  on public.blood_centers for insert to authenticated
  with check (public.is_admin());

drop policy if exists "centers_update_admin" on public.blood_centers;
create policy "centers_update_admin"
  on public.blood_centers for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "centers_delete_admin" on public.blood_centers;
create policy "centers_delete_admin"
  on public.blood_centers for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- Fix blood_inventory policies
-- ============================================================
drop policy if exists "inventory_insert_admin" on public.blood_inventory;
create policy "inventory_insert_admin"
  on public.blood_inventory for insert to authenticated
  with check (public.is_admin());

drop policy if exists "inventory_update_admin" on public.blood_inventory;
create policy "inventory_update_admin"
  on public.blood_inventory for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "inventory_delete_admin" on public.blood_inventory;
create policy "inventory_delete_admin"
  on public.blood_inventory for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- Fix blood_requests policies
-- ============================================================
drop policy if exists "requests_select_relevant" on public.blood_requests;
create policy "requests_select_relevant"
  on public.blood_requests for select to authenticated
  using (
    auth.uid() = seeker_id
    or public.is_donor_or_admin()
  );

-- ============================================================
-- Fix donor_requests policies
-- ============================================================
drop policy if exists "donor_requests_select_parties" on public.donor_requests;
create policy "donor_requests_select_parties"
  on public.donor_requests for select to authenticated
  using (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
    or exists (select 1 from public.donors d where d.id = donor_id and d.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "donor_requests_update_parties" on public.donor_requests;
create policy "donor_requests_update_parties"
  on public.donor_requests for update to authenticated
  using (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
    or exists (select 1 from public.donors d where d.id = donor_id and d.user_id = auth.uid())
    or public.is_admin()
  )
  with check (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
    or exists (select 1 from public.donors d where d.id = donor_id and d.user_id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "donor_requests_delete_admin" on public.donor_requests;
create policy "donor_requests_delete_admin"
  on public.donor_requests for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- Fix notifications policies
-- ============================================================
drop policy if exists "notifications_insert_own_or_admin" on public.notifications;
create policy "notifications_insert_own_or_admin"
  on public.notifications for insert to authenticated
  with check (
    auth.uid() = user_id
    or public.is_admin()
  );
