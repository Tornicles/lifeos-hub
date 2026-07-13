-- 0009_missions_protocols

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  category text not null,
  title text not null,
  teaching text,
  action_text text not null,
  proof_types text[] not null default '{}',
  safety_tags text[] not null default '{}',
  difficulty text not null default 'standard',
  xp_reward int not null default 25 check (xp_reward >= 0),
  status text not null default 'published' check (status in ('draft','published','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mission_proof_submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  proof_type text not null,
  storage_path text,
  note text,
  status text not null default 'submitted' check (status in ('submitted','approved','rejected','revision')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.protocols (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  promise_text text,
  duration_days int not null check (duration_days between 1 and 90),
  outcome_type text,
  audience text not null default 'individual',
  status text not null default 'published',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.protocol_phases (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  phase_number int not null,
  title text not null,
  description text,
  unique (protocol_id, phase_number)
);

create table if not exists public.protocol_days (
  id uuid primary key default gen_random_uuid(),
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  day_number int not null,
  phase_id uuid references public.protocol_phases(id) on delete set null,
  prayer text,
  verse_reference text,
  verse_text text,
  teaching text,
  mission_id uuid references public.missions(id) on delete set null,
  reflection_prompt text,
  closing_prayer text,
  is_milestone boolean not null default false,
  unique (protocol_id, day_number)
);

create table if not exists public.user_protocols (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  protocol_id uuid not null references public.protocols(id) on delete cascade,
  current_day int not null default 1,
  status text not null default 'active' check (status in ('active','paused','completed','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  privacy text not null default 'private',
  unique (user_id, protocol_id, started_at)
);

create table if not exists public.user_missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mission_id uuid not null references public.missions(id) on delete cascade,
  source_type text,
  source_id uuid,
  due_date date,
  status text not null default 'assigned' check (status in ('assigned','in_progress','completed','skipped')),
  difficulty text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles(id),
  scope_type text not null check (scope_type in ('personal','couple','circle','community')),
  scope_id uuid,
  title text not null,
  description text,
  duration_days int not null default 7,
  settings jsonb not null default '{}'::jsonb,
  ai_origin boolean not null default false,
  review_state text not null default 'approved',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  joined_at timestamptz not null default now(),
  primary key (challenge_id, user_id)
);

create index if not exists protocol_days_protocol_day_idx on public.protocol_days (protocol_id, day_number);
create index if not exists user_missions_user_status_due_idx on public.user_missions (user_id, status, due_date);
create index if not exists mission_proof_user_idx on public.mission_proof_submissions (user_id, created_at desc);
