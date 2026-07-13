-- 0002_profiles_onboarding

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  bio text check (char_length(bio) <= 500),
  avatar_path text,
  timezone text not null default 'UTC',
  locale text not null default 'en',
  visibility public.profile_visibility not null default 'private',
  discoverable boolean not null default false,
  birth_year smallint,
  plan_status text not null default 'free',
  account_status text not null default 'active' check (account_status in ('active','suspended','deleted','pending')),
  onboarding_state text not null default 'profile',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  prayer_reminders boolean not null default true,
  lesson_reminders boolean not null default true,
  privacy_defaults jsonb not null default '{}'::jsonb,
  reflection_mode text not null default 'standard',
  accessibility jsonb not null default '{}'::jsonb,
  content_interests text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.staff_role not null,
  scope_type text,
  scope_id uuid,
  granted_by uuid references public.profiles(id),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, role, scope_type, scope_id)
);

create table if not exists public.onboarding_state (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  current_step text not null default 'profile',
  completed_steps text[] not null default '{}',
  skipped_invites boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;
create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function private.set_updated_at();

drop trigger if exists onboarding_state_set_updated_at on public.onboarding_state;
create trigger onboarding_state_set_updated_at
  before update on public.onboarding_state
  for each row execute function private.set_updated_at();

-- Auto-create profile shell on signup
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), 'New Member')
  )
  on conflict (id) do nothing;

  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.onboarding_state (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();
