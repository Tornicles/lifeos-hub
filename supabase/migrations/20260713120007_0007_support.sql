-- 0007_support

create table if not exists public.helper_profiles (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  support_role public.support_role not null,
  status text not null default 'applicant' check (
    status in ('applicant','training','approved','suspended','rejected','expired')
  ),
  categories text[] not null default '{}',
  availability_status text not null default 'offline' check (
    availability_status in ('offline','available','busy')
  ),
  training_acknowledged_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists private.professional_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  credential_type text not null,
  jurisdiction text,
  license_number_ciphertext text,
  evidence_path text,
  source_url text,
  expires_at date,
  verification_status text not null default 'pending' check (
    verification_status in ('pending','verified','rejected','expired')
  ),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.support_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requested_role public.support_role not null,
  category text not null,
  language_code text not null default 'en',
  urgency text not null default 'normal' check (urgency in ('low','normal','high','crisis')),
  status public.support_status not null default 'queued',
  matched_helper_id uuid references public.profiles(id),
  conversation_id uuid references public.conversations(id),
  anonymous_alias text,
  created_at timestamptz not null default now(),
  routed_at timestamptz,
  closed_at timestamptz
);

create table if not exists public.support_matches (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  helper_id uuid not null references public.profiles(id),
  conversation_id uuid not null references public.conversations(id),
  status text not null default 'active' check (status in ('active','closed','escalated')),
  matched_at timestamptz not null default now(),
  closed_at timestamptz,
  unique (support_request_id)
);

create table if not exists public.anonymous_channels (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  requester_alias text not null,
  helper_alias text not null,
  status text not null default 'active' check (status in ('active','expired','closed')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.support_feedback (
  id uuid primary key default gen_random_uuid(),
  support_request_id uuid not null references public.support_requests(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index if not exists support_queue_idx
  on public.support_requests (status, requested_role, category, language_code, created_at);

create index if not exists helper_profiles_availability_idx
  on public.helper_profiles (status, availability_status)
  where status = 'approved';

drop trigger if exists helper_profiles_set_updated_at on public.helper_profiles;
create trigger helper_profiles_set_updated_at
  before update on public.helper_profiles
  for each row execute function private.set_updated_at();
