-- 0013_billing_entitlements

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  billing_provider public.billing_provider not null default 'stripe',
  provider_customer_id text not null,
  created_at timestamptz not null default now(),
  unique (billing_provider, provider_customer_id),
  unique (user_id, billing_provider)
);

create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid not null references public.billing_customers(id),
  billing_provider public.billing_provider not null default 'stripe',
  provider_subscription_id text not null,
  status public.subscription_status not null,
  plan_key text not null references public.plans(plan_key),
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  household_or_circle_scope text check (household_or_circle_scope in ('personal','household','circle')),
  scope_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_provider, provider_subscription_id)
);

create table if not exists public.subscription_seats (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  seat_role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (subscription_id, user_id)
);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  entitlement_key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.plan_entitlements (
  plan_key text not null references public.plans(plan_key) on delete cascade,
  entitlement_key text not null references public.entitlements(entitlement_key) on delete cascade,
  primary key (plan_key, entitlement_key)
);

create table if not exists public.user_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  entitlement_key text not null references public.entitlements(entitlement_key),
  source_subscription_id uuid references public.subscriptions(id) on delete set null,
  active boolean not null default true,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, entitlement_key)
);

create table if not exists private.webhook_events (
  id uuid primary key default gen_random_uuid(),
  billing_provider public.billing_provider not null,
  provider_event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (billing_provider, provider_event_id)
);

insert into public.plans (plan_key, name, description)
values
  ('free', 'Free', 'Core free access'),
  ('pro', 'Pro', 'Full Tech-Tate Pro access'),
  ('household', 'Household', 'Couples / household plan')
on conflict (plan_key) do nothing;

insert into public.entitlements (entitlement_key, description)
values
  ('academy_full', 'Full academy access'),
  ('market_lab', 'Market Lab simulated trading'),
  ('circles', 'Circles feature'),
  ('journey_books', 'Journey book generation')
on conflict (entitlement_key) do nothing;

insert into public.plan_entitlements (plan_key, entitlement_key)
values
  ('pro','academy_full'),
  ('pro','market_lab'),
  ('pro','circles'),
  ('pro','journey_books'),
  ('household','academy_full'),
  ('household','market_lab'),
  ('household','circles'),
  ('household','journey_books')
on conflict do nothing;
