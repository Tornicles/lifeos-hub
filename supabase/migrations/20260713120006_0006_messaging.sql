-- 0006_messaging

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  conversation_type text not null check (
    conversation_type in ('direct','couple','group','circle','anonymous_support','admin_support')
  ),
  circle_id uuid references public.circles(id) on delete set null,
  status text not null default 'active' check (status in ('active','closed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  alias text,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(body) between 1 and 10000),
  moderation_status text not null default 'visible',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  storage_path text not null,
  mime_type text,
  byte_size bigint check (byte_size is null or byte_size >= 0),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','blocked','error')),
  created_at timestamptz not null default now()
);

create table if not exists public.shared_inbox_items (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null check (item_type in ('win','struggle','question','prayer','task','resource','voice','update')),
  body text not null,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','archived')),
  created_at timestamptz not null default now()
);

create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id) where left_at is null;
create index if not exists shared_inbox_circle_idx on public.shared_inbox_items (circle_id, created_at desc);

drop trigger if exists conversations_set_updated_at on public.conversations;
create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function private.set_updated_at();
