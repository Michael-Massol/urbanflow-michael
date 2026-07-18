create table if not exists public.mobility_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  preferred_modes text[] not null default '{}',
  avoided_modes text[] not null default '{}',
  max_walking_minutes integer not null default 20 check (max_walking_minutes between 0 and 120),
  reduced_mobility boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint mobility_preferences_modes_disjoint
    check (not (preferred_modes && avoided_modes))
);

alter table public.mobility_preferences enable row level security;

create policy "Users can read their own mobility preferences"
on public.mobility_preferences for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own mobility preferences"
on public.mobility_preferences for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own mobility preferences"
on public.mobility_preferences for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

insert into public.mobility_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;

create or replace function public.handle_new_user_mobility_preferences()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.mobility_preferences (user_id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_mobility_preferences on auth.users;
create trigger on_auth_user_created_mobility_preferences
  after insert on auth.users
  for each row execute procedure public.handle_new_user_mobility_preferences();

create trigger mobility_preferences_set_updated_at
  before update on public.mobility_preferences
  for each row execute procedure public.set_updated_at();
