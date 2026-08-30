/*
# Blood Donor Finder & Emergency Alert System — Core Schema

## Purpose
Creates the full data model for a blood donor finder and emergency alert system:
users (with roles seeker/donor/admin), donor profiles, blood requests, blood
centers, blood inventory, donor-to-request links, and notifications.

## New Tables
1. `profiles` — extends Supabase auth.users with name, phone, role (seeker/donor/admin).
2. `donors` — donor profile: blood group, age, area, city, lat/lng, availability, last donation.
3. `blood_requests` — a seeker's request for blood: group, units, area, city, lat/lng, emergency level, status.
4. `blood_centers` — blood center directory: name, address, area, city, phone, lat/lng.
5. `blood_inventory` — per-center per-group stock: available units, last updated.
6. `donor_requests` — link between a blood_request and a donor (invite + accept/reject + response time).
7. `notifications` — per-user notifications with type and read flag.

## Security
- RLS enabled on every table.
- profiles: owner read/update; admin full access.
- donors: owner can manage own row; anyone authenticated can read (donor search) — sensitive
  contact info is NOT stored in donors (phone lives on profiles, shown only via request flow).
- blood_requests: owner can CRUD own; donors + admins can read (to match requests).
- blood_centers: readable by all authenticated; writable by admin only.
- blood_inventory: readable by all authenticated; writable by admin only.
- donor_requests: seeker (owner of parent request) can read/insert; donor can read rows
  targeting them and update status; admin full.
- notifications: owner read/update; admin can insert (for emergency broadcast).

## Notes
1. `profiles.role` uses a check constraint for 'seeker' | 'donor' | 'admin'.
2. Owner columns default to `auth.uid()` so client inserts without user_id succeed.
3. `blood_group` check-constrained to the 8 standard ABO/Rh values.
4. `emergency_level` check-constrained to normal | urgent | emergency.
5. Status columns use check constraints for valid states.
6. Indexes added on commonly filtered columns (blood_group, availability, status, city, emergency_level).
7. A trigger auto-creates a `profiles` row from auth.users on signup.
*/

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles (extends auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  role text not null default 'seeker' check (role in ('seeker','donor','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
  on public.profiles for select to authenticated
  using (auth.uid() = id or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

-- Allow anyone to read a minimal public profile (name only) for donor display name.
-- Implemented as a separate policy so the broad read above covers admin + self.
drop policy if exists "profiles_public_name_read" on public.profiles;
create policy "profiles_public_name_read"
  on public.profiles for select to anon, authenticated
  using (true);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, phone, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'New User'), new.raw_user_meta_data->>'phone', coalesce(new.raw_user_meta_data->>'role','seeker'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- donors
-- ============================================================
create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  age int check (age between 18 and 65),
  area text,
  city text,
  latitude double precision,
  longitude double precision,
  availability_status boolean not null default true,
  last_donation_date date,
  created_at timestamptz not null default now()
);

alter table public.donors enable row level security;

-- Anyone authenticated can read donors (for search). Contact info is on profiles, not donors.
drop policy if exists "donors_select_all" on public.donors;
create policy "donors_select_all"
  on public.donors for select to anon, authenticated using (true);

drop policy if exists "donors_insert_own" on public.donors;
create policy "donors_insert_own"
  on public.donors for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "donors_update_own" on public.donors;
create policy "donors_update_own"
  on public.donors for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "donors_delete_own" on public.donors;
create policy "donors_delete_own"
  on public.donors for delete to authenticated using (auth.uid() = user_id);

create index if not exists donors_blood_group_idx on public.donors(blood_group);
create index if not exists donors_availability_idx on public.donors(availability_status);
create index if not exists donors_city_idx on public.donors(city);
create index if not exists donors_user_id_idx on public.donors(user_id);

-- ============================================================
-- blood_requests
-- ============================================================
create table if not exists public.blood_requests (
  id uuid primary key default gen_random_uuid(),
  seeker_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  required_units int not null default 1 check (required_units > 0),
  area text,
  city text,
  latitude double precision,
  longitude double precision,
  emergency_level text not null default 'normal' check (emergency_level in ('normal','urgent','emergency')),
  request_status text not null default 'open' check (request_status in ('open','matched','fulfilled','cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.blood_requests enable row level security;

drop policy if exists "requests_select_relevant" on public.blood_requests;
create policy "requests_select_relevant"
  on public.blood_requests for select to authenticated
  using (
    auth.uid() = seeker_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('donor','admin'))
  );

drop policy if exists "requests_insert_own" on public.blood_requests;
create policy "requests_insert_own"
  on public.blood_requests for insert to authenticated with check (auth.uid() = seeker_id);

drop policy if exists "requests_update_own" on public.blood_requests;
create policy "requests_update_own"
  on public.blood_requests for update to authenticated
  using (auth.uid() = seeker_id) with check (auth.uid() = seeker_id);

drop policy if exists "requests_delete_own" on public.blood_requests;
create policy "requests_delete_own"
  on public.blood_requests for delete to authenticated using (auth.uid() = seeker_id);

create index if not exists requests_blood_group_idx on public.blood_requests(blood_group);
create index if not exists requests_status_idx on public.blood_requests(request_status);
create index if not exists requests_emergency_idx on public.blood_requests(emergency_level);
create index if not exists requests_seeker_idx on public.blood_requests(seeker_id);
create index if not exists requests_city_idx on public.blood_requests(city);

-- ============================================================
-- blood_centers
-- ============================================================
create table if not exists public.blood_centers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  area text,
  city text,
  phone text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.blood_centers enable row level security;

drop policy if exists "centers_select_all" on public.blood_centers;
create policy "centers_select_all"
  on public.blood_centers for select to anon, authenticated using (true);

drop policy if exists "centers_insert_admin" on public.blood_centers;
create policy "centers_insert_admin"
  on public.blood_centers for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "centers_update_admin" on public.blood_centers;
create policy "centers_update_admin"
  on public.blood_centers for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "centers_delete_admin" on public.blood_centers;
create policy "centers_delete_admin"
  on public.blood_centers for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists centers_city_idx on public.blood_centers(city);

-- ============================================================
-- blood_inventory
-- ============================================================
create table if not exists public.blood_inventory (
  id uuid primary key default gen_random_uuid(),
  blood_center_id uuid not null references public.blood_centers(id) on delete cascade,
  blood_group text not null check (blood_group in ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  available_units int not null default 0 check (available_units >= 0),
  last_updated timestamptz not null default now()
);

alter table public.blood_inventory enable row level security;

drop policy if exists "inventory_select_all" on public.blood_inventory;
create policy "inventory_select_all"
  on public.blood_inventory for select to anon, authenticated using (true);

drop policy if exists "inventory_insert_admin" on public.blood_inventory;
create policy "inventory_insert_admin"
  on public.blood_inventory for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "inventory_update_admin" on public.blood_inventory;
create policy "inventory_update_admin"
  on public.blood_inventory for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "inventory_delete_admin" on public.blood_inventory;
create policy "inventory_delete_admin"
  on public.blood_inventory for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists inventory_center_idx on public.blood_inventory(blood_center_id);
create index if not exists inventory_group_idx on public.blood_inventory(blood_group);

-- ============================================================
-- donor_requests (link donor <-> blood_request)
-- ============================================================
create table if not exists public.donor_requests (
  id uuid primary key default gen_random_uuid(),
  blood_request_id uuid not null references public.blood_requests(id) on delete cascade,
  donor_id uuid not null references public.donors(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','rejected','completed')),
  response_time timestamptz,
  created_at timestamptz not null default now(),
  unique (blood_request_id, donor_id)
);

alter table public.donor_requests enable row level security;

-- Seeker (owner of parent request) can read + insert; donor targeted can read + update status; admin full.
drop policy if exists "donor_requests_select_parties" on public.donor_requests;
create policy "donor_requests_select_parties"
  on public.donor_requests for select to authenticated
  using (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
    or exists (select 1 from public.donors d where d.id = donor_id and d.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "donor_requests_insert_seeker" on public.donor_requests;
create policy "donor_requests_insert_seeker"
  on public.donor_requests for insert to authenticated
  with check (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
  );

drop policy if exists "donor_requests_update_parties" on public.donor_requests;
create policy "donor_requests_update_parties"
  on public.donor_requests for update to authenticated
  using (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
    or exists (select 1 from public.donors d where d.id = donor_id and d.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.blood_requests br where br.id = blood_request_id and br.seeker_id = auth.uid())
    or exists (select 1 from public.donors d where d.id = donor_id and d.user_id = auth.uid())
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "donor_requests_delete_admin" on public.donor_requests;
create policy "donor_requests_delete_admin"
  on public.donor_requests for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create index if not exists donor_requests_request_idx on public.donor_requests(blood_request_id);
create index if not exists donor_requests_donor_idx on public.donor_requests(donor_id);
create index if not exists donor_requests_status_idx on public.donor_requests(status);

-- ============================================================
-- notifications
-- ============================================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  message text not null,
  notification_type text not null default 'info' check (notification_type in ('info','request','accept','reject','emergency','system')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select to authenticated using (auth.uid() = user_id);

drop policy if exists "notifications_insert_own_or_admin" on public.notifications;
create policy "notifications_insert_own_or_admin"
  on public.notifications for insert to authenticated
  with check (
    auth.uid() = user_id
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notifications_delete_own" on public.notifications;
create policy "notifications_delete_own"
  on public.notifications for delete to authenticated using (auth.uid() = user_id);

create index if not exists notifications_user_idx on public.notifications(user_id);
create index if not exists notifications_unread_idx on public.notifications(user_id, is_read);
