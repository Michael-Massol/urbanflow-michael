create table if not exists public.completed_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  origin_label text not null check (char_length(origin_label) between 1 and 160),
  destination_label text not null check (char_length(destination_label) between 1 and 160),
  departure_at timestamptz not null,
  arrival_at timestamptz not null,
  duration_minutes integer not null check (duration_minutes > 0),
  distance_meters integer not null check (distance_meters >= 0),
  modes text[] not null check (cardinality(modes) > 0),
  emissions_grams_co2e numeric(12, 2) not null check (emissions_grams_co2e >= 0),
  car_reference_grams_co2e numeric(12, 2) not null check (car_reference_grams_co2e >= 0),
  avoided_grams_co2e numeric(12, 2) not null check (avoided_grams_co2e >= 0),
  factor_version text not null,
  provider text not null,
  confirmed_at timestamptz not null default now()
);

create index if not exists completed_journeys_user_confirmed_at_idx
  on public.completed_journeys (user_id, confirmed_at desc);

alter table public.completed_journeys enable row level security;

revoke all on public.completed_journeys from anon;
grant select, insert, delete on public.completed_journeys to authenticated;

create policy "Users can read their own completed journeys"
on public.completed_journeys for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own completed journeys"
on public.completed_journeys for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own completed journeys"
on public.completed_journeys for delete to authenticated
using ((select auth.uid()) = user_id);
