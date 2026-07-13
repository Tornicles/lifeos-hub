-- 0010_notes_books

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled note',
  body jsonb not null default '{}'::jsonb,
  context_type text,
  context_id uuid,
  privacy_state text not null default 'private' check (privacy_state in ('private','shared','circle','partner')),
  seal_state public.note_seal_state not null default 'draft',
  sealed_until timestamptz,
  sealed_milestone text,
  unlocked_at timestamptz,
  status text not null default 'draft',
  current_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.note_revisions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  version_number int not null,
  body jsonb not null,
  revision_type text not null default 'user_edit' check (revision_type in ('original','user_edit','grammar_only','seal_snapshot')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (note_id, version_number)
);

create table if not exists public.note_attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  storage_path text not null,
  attachment_type text not null check (attachment_type in ('image','voice','video','document')),
  byte_size bigint check (byte_size is null or byte_size >= 0),
  checksum text,
  consent_version text,
  retention_state text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  scope_type text not null default 'personal' check (scope_type in ('personal','couple','circle','household')),
  scope_id uuid,
  book_type text not null default 'journey',
  title text not null,
  subtitle text,
  cover_path text,
  layout jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','generating','ready','exported','archived')),
  generated_file_path text,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.book_contributions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  contributor_id uuid not null references public.profiles(id) on delete cascade,
  source_entity_type text not null,
  source_entity_id uuid not null,
  inclusion_mode text not null check (inclusion_mode in ('full','excerpt','summary','excluded')),
  excerpt_text text,
  sort_order int not null default 0,
  consent_version text,
  consent_granted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.book_contribution_consents (
  id uuid primary key default gen_random_uuid(),
  contribution_id uuid not null references public.book_contributions(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  decision boolean not null,
  consent_version text not null,
  created_at timestamptz not null default now()
);

create index if not exists notes_owner_idx on public.notes (owner_id, updated_at desc);
create index if not exists books_owner_idx on public.books (owner_id, status);
create index if not exists book_contributions_book_idx on public.book_contributions (book_id, sort_order);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function private.set_updated_at();

drop trigger if exists books_set_updated_at on public.books;
create trigger books_set_updated_at
  before update on public.books
  for each row execute function private.set_updated_at();
