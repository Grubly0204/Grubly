-- ============================================================
-- Grubly initial schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================


-- ============================================================
-- profiles
-- ============================================================
create table public.profiles (
  id                      uuid primary key references auth.users (id) on delete cascade,
  email                   text,
  full_name               text,
  household_size          integer not null default 4,
  dietary_requirements    text[]  not null default '{}',
  weekly_budget           decimal(10, 2) not null default 60.00,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text not null default 'trialing',
  trial_ends_at           timestamp with time zone,
  created_at              timestamp with time zone not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create a profile row when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- meal_plans
-- ============================================================
create table public.meal_plans (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  week_starting date not null,
  meals         jsonb not null default '{}',
  total_cost    decimal(10, 2),
  savings       decimal(10, 2),
  created_at    timestamp with time zone not null default now()
);

alter table public.meal_plans enable row level security;

create policy "Users can view their own meal plans"
  on public.meal_plans for select
  using (auth.uid() = user_id);

create policy "Users can insert their own meal plans"
  on public.meal_plans for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own meal plans"
  on public.meal_plans for update
  using (auth.uid() = user_id);

create policy "Users can delete their own meal plans"
  on public.meal_plans for delete
  using (auth.uid() = user_id);

create index meal_plans_user_id_week_starting_idx
  on public.meal_plans (user_id, week_starting desc);


-- ============================================================
-- conversations
-- ============================================================
create table public.conversations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  messages   jsonb not null default '[]',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
  on public.conversations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
  on public.conversations for update
  using (auth.uid() = user_id);

create policy "Users can delete their own conversations"
  on public.conversations for delete
  using (auth.uid() = user_id);

-- Keep updated_at current automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute procedure public.set_updated_at();
