-- 0011_couple_household

create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references public.profiles(id) on delete cascade,
  user_b_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','active','disconnected')),
  connected_at timestamptz,
  disconnected_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);

create unique index if not exists couples_unique_active_pair
  on public.couples (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id))
  where status in ('pending','active');

create table if not exists public.couple_answers (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  session_key text not null,
  prompt_key text not null,
  author_id uuid not null references public.profiles(id) on delete cascade,
  answer_body jsonb not null default '{}'::jsonb,
  share_state public.share_state not null default 'private',
  submitted_at timestamptz not null default now(),
  unique (couple_id, session_key, prompt_key, author_id)
);

create table if not exists public.reveal_states (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  session_key text not null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  ready boolean not null default false,
  revealed_at timestamptz,
  unique (couple_id, session_key, user_id)
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz,
  agenda jsonb not null default '[]'::jsonb,
  notes jsonb not null default '{}'::jsonb,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.decisions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  question text not null,
  values_notes text,
  facts_notes text,
  emotions_notes text,
  risks_notes text,
  tradeoffs_notes text,
  conclusion text,
  review_date date,
  status text not null default 'open',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.covenants (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  title text not null,
  body jsonb not null default '{}'::jsonb,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft','active','superseded')),
  acknowledged_by_a boolean not null default false,
  acknowledged_by_b boolean not null default false,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create index if not exists couple_answers_couple_session_idx on public.couple_answers (couple_id, session_key);
create index if not exists meetings_couple_idx on public.meetings (couple_id, scheduled_at);
