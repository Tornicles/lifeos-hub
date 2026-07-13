-- 0014_safety_admin

create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  reason_code text not null,
  details text,
  evidence_paths text[] not null default '{}',
  status text not null default 'open' check (status in ('open','triaged','resolved','dismissed')),
  created_at timestamptz not null default now()
);

create table if not exists private.moderation_cases (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.safety_reports(id) on delete set null,
  assigned_to uuid references public.profiles(id),
  status text not null default 'open' check (status in ('open','in_review','escalated','closed')),
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create table if not exists private.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references private.moderation_cases(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  action_type text not null,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.appeals (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null,
  appellant_id uuid not null references public.profiles(id) on delete cascade,
  statement text not null,
  status text not null default 'open' check (status in ('open','accepted','denied')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists private.credential_events (
  id uuid primary key default gen_random_uuid(),
  credential_id uuid not null references private.professional_credentials(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists private.audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists private.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists safety_reports_status_idx on public.safety_reports (status, created_at desc);
create index if not exists audit_events_occurred_idx on private.audit_events (occurred_at desc);
