-- 0012_market_games
-- Market Lab + Games Document 4 schemas

-- Market Lab
create table if not exists public.securities (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  name text not null,
  exchange text,
  security_type text not null default 'equity',
  sector text,
  currency text not null default 'USD',
  provider_identifiers jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (ticker, exchange)
);

create table if not exists public.market_prices_daily (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete cascade,
  price_date date not null,
  open numeric(18,6),
  high numeric(18,6),
  low numeric(18,6),
  close numeric(18,6),
  adjusted_close numeric(18,6),
  volume bigint check (volume is null or volume >= 0),
  provider text not null,
  fetched_at timestamptz not null default now(),
  unique (security_id, price_date, provider)
);

create table if not exists public.market_quotes_cache (
  security_id uuid primary key references public.securities(id) on delete cascade,
  last_price numeric(18,6) not null check (last_price >= 0),
  quote_timestamp timestamptz not null,
  delay_label text not null default 'delayed',
  provider text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.filings (
  id uuid primary key default gen_random_uuid(),
  security_id uuid not null references public.securities(id) on delete cascade,
  accession_or_ref text not null,
  filing_type text,
  section text,
  explanation text,
  questions jsonb not null default '[]'::jsonb,
  status text not null default 'published',
  filed_at date,
  created_at timestamptz not null default now(),
  unique (security_id, accession_or_ref, section)
);

create table if not exists public.investment_theses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  security_id uuid not null references public.securities(id) on delete cascade,
  thesis text not null,
  risks text,
  disconfirming_evidence text,
  horizon text,
  status text not null default 'active',
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.market_portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  starting_cash numeric(18,2) not null default 100000 check (starting_cash >= 0),
  current_cash numeric(18,2) not null default 100000 check (current_cash >= 0),
  base_currency text not null default 'USD',
  status text not null default 'active' check (status in ('active','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists market_portfolios_one_active_per_user
  on public.market_portfolios (user_id)
  where status = 'active';

create table if not exists public.virtual_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  portfolio_id uuid not null references public.market_portfolios(id) on delete cascade,
  security_id uuid not null references public.securities(id),
  side text not null check (side in ('buy','sell')),
  quantity numeric(18,6) not null check (quantity > 0),
  requested_at timestamptz not null default now(),
  execution_price numeric(18,6) check (execution_price is null or execution_price >= 0),
  status text not null default 'pending' check (status in ('pending','filled','rejected','cancelled')),
  thesis_id uuid references public.investment_theses(id),
  reject_reason text
);

create table if not exists public.virtual_positions (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid not null references public.market_portfolios(id) on delete cascade,
  security_id uuid not null references public.securities(id),
  quantity numeric(18,6) not null check (quantity >= 0),
  average_cost numeric(18,6) not null check (average_cost >= 0),
  realized_pnl numeric(18,2) not null default 0,
  unrealized_pnl numeric(18,2) not null default 0,
  unique (portfolio_id, security_id)
);

create table if not exists public.market_data_freshness (
  provider text primary key,
  last_sync_at timestamptz not null,
  status text not null default 'ok',
  detail jsonb not null default '{}'::jsonb
);

-- Games Document 4
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null,
  min_rounds int not null default 5,
  max_rounds int not null default 5,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.game_scenarios (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  category text,
  title text not null,
  scenario_text text not null,
  difficulty text not null default 'medium',
  verse_reference text,
  prayer_text text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.game_choices (
  id uuid primary key default gen_random_uuid(),
  scenario_id uuid not null references public.game_scenarios(id) on delete cascade,
  choice_label text not null,
  choice_text text not null,
  score int not null default 0,
  feedback text,
  is_best boolean not null default false
);

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id),
  status text not null default 'started' check (status in ('started','completed','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score int not null default 0,
  xp_awarded int not null default 0
);

create table if not exists public.game_session_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  scenario_id uuid not null references public.game_scenarios(id),
  choice_id uuid not null references public.game_choices(id),
  score_awarded int not null default 0,
  answered_at timestamptz not null default now()
);

create table if not exists public.game_badges (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  rule_type text not null,
  rule_value int not null default 1,
  xp_bonus int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_game_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id uuid not null references public.game_badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);

create table if not exists public.couple_game_sessions (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  game_id uuid not null references public.games(id),
  session_a_id uuid references public.game_sessions(id),
  session_b_id uuid references public.game_sessions(id),
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists public.daily_game_challenges (
  id uuid primary key default gen_random_uuid(),
  challenge_date date not null unique,
  game_id uuid not null references public.games(id),
  scenario_id uuid references public.game_scenarios(id),
  title text not null,
  xp_bonus int not null default 10,
  created_at timestamptz not null default now()
);

create index if not exists market_prices_security_date_idx on public.market_prices_daily (security_id, price_date desc);
create index if not exists game_sessions_user_idx on public.game_sessions (user_id, started_at desc);
create index if not exists game_scenarios_game_idx on public.game_scenarios (game_id) where active = true;
