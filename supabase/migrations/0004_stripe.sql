-- Add Stripe billing columns to profiles
alter table public.profiles
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_ends_at timestamptz;
