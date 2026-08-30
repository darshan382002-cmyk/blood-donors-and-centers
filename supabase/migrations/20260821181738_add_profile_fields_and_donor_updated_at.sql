/*
# Add profile fields and donor updated_at

## Purpose
The Profile page needs to display and edit the user's area, city, and a short bio.
The donors table needs an updated_at timestamp so we can track when a donor last
changed their information (availability, blood group, etc.).

## Changes
1. `profiles` table: add `area` (text), `city` (text), `bio` (text) — all nullable.
2. `donors` table: add `updated_at` (timestamptz, defaults to now()).
3. Add a trigger on `donors` that sets `updated_at = now()` on every UPDATE.

## Security
- No RLS policy changes. The existing `profiles_update_own` policy already allows
  the owner to update any column on their own row. The new columns inherit that.
- The existing `donors_update_own` policy already covers the new `updated_at` column.

## Notes
1. All additions are additive — no existing columns are dropped or renamed.
2. No existing data is modified.
3. The trigger is idempotent (drop + create).
*/

-- profiles: add area, city, bio
alter table public.profiles add column if not exists area text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists bio text;

-- donors: add updated_at
alter table public.donors add column if not exists updated_at timestamptz not null default now();

-- Trigger to keep donors.updated_at fresh on UPDATE
create or replace function public.set_donors_updated_at()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists donors_set_updated_at on public.donors;
create trigger donors_set_updated_at
  before update on public.donors
  for each row execute function public.set_donors_updated_at();
