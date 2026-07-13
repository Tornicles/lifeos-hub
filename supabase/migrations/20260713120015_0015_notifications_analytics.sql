-- 0015_notifications_analytics

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  push_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  categories jsonb not null default '{}'::jsonb,
  quiet_hours jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  template_key text not null,
  channel text not null check (channel in ('email','push','sms','in_app')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','cancelled')),
  scheduled_for timestamptz not null default now(),
  attempts int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.notification_queue(id) on delete cascade,
  provider text,
  provider_message_id text,
  status text not null,
  error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  event_name text not null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  session_id text,
  app_version text
);

create table if not exists public.experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  experiment_key text not null,
  variant text not null,
  assigned_at timestamptz not null default now(),
  unique (user_id, experiment_key)
);

create table if not exists public.report_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  report_type text not null,
  period_start date,
  period_end date,
  status text not null default 'queued' check (status in ('queued','processing','ready','failed')),
  input_snapshot jsonb not null default '{}'::jsonb,
  output_path text,
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists notification_queue_due_idx
  on public.notification_queue (status, scheduled_for)
  where status = 'pending';

create index if not exists analytics_events_user_idx
  on public.analytics_events (user_id, occurred_at desc);

create index if not exists report_jobs_owner_idx
  on public.report_jobs (owner_id, report_type, created_at desc);
