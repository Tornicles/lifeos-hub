-- 0004_community

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  circle_id uuid,
  post_type text not null check (post_type in ('post','question','prayer','win','resource','poll','announcement')),
  audience text not null check (audience in ('community','connections','circle')),
  body text not null check (char_length(body) between 1 and 5000),
  media_paths text[] not null default '{}',
  moderation_status text not null default 'visible' check (moderation_status in ('visible','hidden','removed','pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  moderation_status text not null default 'visible',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction_type text not null default 'like',
  created_at timestamptz not null default now(),
  unique (post_id, user_id, reaction_type)
);

create table if not exists public.community_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create table if not exists public.community_saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.community_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists community_posts_feed_idx
  on public.community_posts (created_at desc)
  where moderation_status = 'visible';

create index if not exists community_posts_audience_idx
  on public.community_posts (audience, circle_id, created_at desc);

create index if not exists community_comments_post_idx
  on public.community_comments (post_id, created_at);

drop trigger if exists community_posts_set_updated_at on public.community_posts;
create trigger community_posts_set_updated_at
  before update on public.community_posts
  for each row execute function private.set_updated_at();
