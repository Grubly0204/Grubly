-- Add confirmed status to meal_plans
alter table public.meal_plans add column if not exists confirmed boolean not null default false;

-- favourites table
create table public.favourites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  meal_name  text not null,
  meal_data  jsonb not null,
  created_at timestamp with time zone not null default now()
);

alter table public.favourites enable row level security;

create policy "Users can view their own favourites"
  on public.favourites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favourites"
  on public.favourites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favourites"
  on public.favourites for delete
  using (auth.uid() = user_id);

create index favourites_user_id_idx on public.favourites (user_id);
