-- Set trial_ends_at automatically on new user creation (14 days)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, subscription_status, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    'trialing',
    now() + interval '14 days'
  );
  return new;
end;
$$;
