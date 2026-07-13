-- 0003_relationships_invitations

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invite_type public.invite_type not null,
  target_email_hash text,
  token_hash text not null unique,
  scope_id uuid,
  status public.invite_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_by uuid references public.profiles(id),
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  relationship_type public.relationship_type not null,
  status text not null check (status in ('pending','accepted','declined','removed')),
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  check (requester_id <> recipient_id)
);

create unique index if not exists relationships_unique_active_pair
  on public.relationships (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id),
    relationship_type
  )
  where status in ('pending','accepted');

create unique index if not exists relationships_unique_active_partner_pair
  on public.relationships (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  )
  where relationship_type = 'partner' and status = 'accepted';

create table if not exists public.blocked_relationships (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  reason_code text,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null,
  version text not null,
  scope_id uuid,
  resource_type text,
  resource_id uuid,
  decision boolean not null,
  source text not null default 'app',
  created_at timestamptz not null default now()
);

create index if not exists invites_inviter_idx on public.invites (inviter_id, status);
create index if not exists consent_events_user_idx on public.consent_events (user_id, created_at desc);
create index if not exists blocked_relationships_blocked_idx on public.blocked_relationships (blocked_id);
