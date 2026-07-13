-- 0005_circles

create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id),
  name text not null check (char_length(name) between 3 and 100),
  purpose text not null check (char_length(purpose) <= 1000),
  visibility public.circle_visibility not null default 'private',
  member_limit smallint not null default 10 check (member_limit between 2 and 10),
  status text not null default 'active' check (status in ('draft','active','frozen','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- FK from community_posts.circle_id now that circles exists
do $$ begin
  alter table public.community_posts
    add constraint community_posts_circle_id_fkey
    foreign key (circle_id) references public.circles(id) on delete cascade;
exception when duplicate_object then null; end $$;

create table if not exists public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.circle_role not null default 'member',
  status text not null default 'active' check (status in ('invited','active','left','removed')),
  helper_categories text[] not null default '{}',
  notification_settings jsonb not null default '{}'::jsonb,
  joined_at timestamptz,
  left_at timestamptz,
  primary key (circle_id, user_id)
);

create table if not exists public.circle_join_requests (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending','approved','denied','cancelled')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index if not exists circle_join_requests_pending_uidx
  on public.circle_join_requests (circle_id, user_id)
  where status = 'pending';

create table if not exists public.circle_challenges (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'active' check (status in ('draft','active','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.circle_contributions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid references public.circle_challenges(id) on delete set null,
  contribution_type text not null check (contribution_type in ('win','struggle','question','prayer','task','resource','voice','update')),
  body text not null,
  media_path text,
  visibility text not null default 'circle' check (visibility in ('circle','leaders','private')),
  created_at timestamptz not null default now()
);

create index if not exists circles_owner_idx on public.circles (owner_id);
create index if not exists circle_members_user_idx on public.circle_members (user_id, status);
create index if not exists circle_contributions_circle_created_idx
  on public.circle_contributions (circle_id, created_at desc);

drop trigger if exists circles_set_updated_at on public.circles;
create trigger circles_set_updated_at
  before update on public.circles
  for each row execute function private.set_updated_at();
