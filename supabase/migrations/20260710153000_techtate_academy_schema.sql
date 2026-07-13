-- Tech-Tate Academy - Supabase Schema Migration
-- Purpose: Store the 100-day Christian strategic and financial intelligence academy.
-- Notes:
-- 1. This is education-first content. It does not connect bank accounts, move money, or provide personalized advice.
-- 2. Use public-domain Bible translations such as WEB or KJV for embedded verse text unless you have a license.
-- 3. Keep investment, tax, insurance, legal, and real-estate topics labeled with disclaimer_type.

create extension if not exists "pgcrypto";

-- MODULES -------------------------------------------------------------------
create table if not exists public.academy_modules (
  id uuid primary key default gen_random_uuid(),
  module_number int not null unique check (module_number between 1 and 10),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  day_start int not null check (day_start between 1 and 100),
  day_end int not null check (day_end between 1 and 100),
  level_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- LESSONS -------------------------------------------------------------------
create table if not exists public.academy_lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.academy_modules(id) on delete cascade,
  day_number int not null unique check (day_number between 1 and 100),
  slug text not null unique,
  title text not null,
  subtitle text,
  audience text not null default 'individuals_and_couples',
  estimated_minutes int not null default 15 check (estimated_minutes between 5 and 60),
  xp_reward int not null default 180 check (xp_reward >= 0),
  disclaimer_type text not null default 'education' check (
    disclaimer_type in ('education','investing','tax','insurance','retirement','real_estate','legal_adjacent','crypto','business')
  ),
  opening_prayer text not null,
  opening_bible_reference text not null,
  opening_bible_text text not null,
  opening_bible_translation text not null default 'WEB',
  devotional text,
  closing_bible_reference text not null,
  closing_bible_text text not null,
  closing_bible_translation text not null default 'WEB',
  closing_prayer text not null,
  individual_prompt text,
  couples_prompt text,
  status text not null default 'draft' check (status in ('draft','review','published','archived')),
  is_premium boolean not null default true,
  content_version int not null default 1,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists academy_lessons_module_idx on public.academy_lessons(module_id);
create index if not exists academy_lessons_status_day_idx on public.academy_lessons(status, day_number);

-- LESSON CARDS ---------------------------------------------------------------
create table if not exists public.lesson_cards (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  card_number int not null check (card_number between 1 and 12),
  system_step text not null,
  display_title text not null,
  body text not null,
  takeaway text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, card_number)
);

create index if not exists lesson_cards_lesson_idx on public.lesson_cards(lesson_id, card_number);

-- QUIZ QUESTIONS AND OPTIONS -------------------------------------------------
create table if not exists public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  question_number int not null check (question_number between 1 and 5),
  question_text text not null,
  question_type text not null default 'multiple_choice' check (question_type in ('multiple_choice','scenario_choice')),
  explanation text not null,
  points int not null default 20 check (points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lesson_id, question_number)
);

create table if not exists public.quiz_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.quiz_questions(id) on delete cascade,
  option_index int not null check (option_index between 0 and 5),
  option_text text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  unique (question_id, option_index)
);

create index if not exists quiz_questions_lesson_idx on public.quiz_questions(lesson_id, question_number);
create index if not exists quiz_options_question_idx on public.quiz_options(question_id, option_index);

-- GAME / STRATEGY CHALLENGE --------------------------------------------------
create table if not exists public.lesson_games (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.academy_lessons(id) on delete cascade,
  game_type text not null default 'strategy_scenario' check (game_type in ('strategy_scenario','decision_lab','ranking','budget_allocation','risk_sort','case_builder')),
  title text not null,
  prompt text not null,
  scenario_context text,
  reward_xp int not null default 40 check (reward_xp >= 0),
  success_explanation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.lesson_game_choices (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.lesson_games(id) on delete cascade,
  choice_index int not null check (choice_index between 0 and 9),
  choice_text text not null,
  is_best_choice boolean not null default false,
  feedback text,
  created_at timestamptz not null default now(),
  unique (game_id, choice_index)
);

-- USER PROGRESS --------------------------------------------------------------
create table if not exists public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','completed')),
  prayer_completed boolean not null default false,
  opening_verse_viewed boolean not null default false,
  cards_completed_count int not null default 0 check (cards_completed_count between 0 and 12),
  quiz_completed boolean not null default false,
  quiz_score int check (quiz_score between 0 and 100),
  game_completed boolean not null default false,
  closing_verse_viewed boolean not null default false,
  closing_prayer_completed boolean not null default false,
  xp_earned int not null default 0 check (xp_earned >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists user_lesson_progress_user_idx on public.user_lesson_progress(user_id, status);

create table if not exists public.user_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  score int not null check (score between 0 and 100),
  correct_count int not null check (correct_count between 0 and 5),
  total_questions int not null default 5,
  answers jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_game_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.academy_lessons(id) on delete cascade,
  game_id uuid not null references public.lesson_games(id) on delete cascade,
  result jsonb not null default '{}'::jsonb,
  xp_earned int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.user_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid references public.academy_lessons(id) on delete set null,
  event_type text not null check (event_type in ('lesson_complete','quiz_score','game_complete','streak_bonus','manual_adjustment')),
  points int not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak int not null default 0 check (current_streak >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  last_completed_on date,
  updated_at timestamptz not null default now()
);

-- HELPER VIEW: PUBLISHED LESSON WITH CARD COUNT ------------------------------
create or replace view public.published_lesson_overview as
select
  l.id,
  l.day_number,
  l.slug,
  l.title,
  l.subtitle,
  l.estimated_minutes,
  l.xp_reward,
  l.disclaimer_type,
  m.module_number,
  m.title as module_title,
  count(c.id) as card_count
from public.academy_lessons l
join public.academy_modules m on m.id = l.module_id
left join public.lesson_cards c on c.lesson_id = l.id
where l.status = 'published'
group by l.id, m.module_number, m.title
order by l.day_number;

-- ROW LEVEL SECURITY ---------------------------------------------------------
alter table public.academy_modules enable row level security;
alter table public.academy_lessons enable row level security;
alter table public.lesson_cards enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.lesson_games enable row level security;
alter table public.lesson_game_choices enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.user_quiz_attempts enable row level security;
alter table public.user_game_attempts enable row level security;
alter table public.user_xp_events enable row level security;
alter table public.user_streaks enable row level security;

-- Content read policies. Use authenticated-only for premium content if desired.
do $$ begin
  create policy "Published modules are readable" on public.academy_modules
    for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Published lessons are readable" on public.academy_lessons
    for select using (status = 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Cards readable for published lessons" on public.lesson_cards
    for select using (exists (
      select 1 from public.academy_lessons l where l.id = lesson_cards.lesson_id and l.status = 'published'
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Quiz questions readable for published lessons" on public.quiz_questions
    for select using (exists (
      select 1 from public.academy_lessons l where l.id = quiz_questions.lesson_id and l.status = 'published'
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Quiz options readable for published questions" on public.quiz_options
    for select using (exists (
      select 1 from public.quiz_questions q
      join public.academy_lessons l on l.id = q.lesson_id
      where q.id = quiz_options.question_id and l.status = 'published'
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Games readable for published lessons" on public.lesson_games
    for select using (exists (
      select 1 from public.academy_lessons l where l.id = lesson_games.lesson_id and l.status = 'published'
    ));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Game choices readable for published games" on public.lesson_game_choices
    for select using (exists (
      select 1 from public.lesson_games g
      join public.academy_lessons l on l.id = g.lesson_id
      where g.id = lesson_game_choices.game_id and l.status = 'published'
    ));
exception when duplicate_object then null; end $$;

-- User-owned progress policies.
do $$ begin
  create policy "Users read own lesson progress" on public.user_lesson_progress
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own lesson progress" on public.user_lesson_progress
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users update own lesson progress" on public.user_lesson_progress
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users read own quiz attempts" on public.user_quiz_attempts
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own quiz attempts" on public.user_quiz_attempts
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users read own game attempts" on public.user_game_attempts
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own game attempts" on public.user_game_attempts
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users read own xp events" on public.user_xp_events
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own xp events" on public.user_xp_events
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users read own streak" on public.user_streaks
    for select using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users insert own streak" on public.user_streaks
    for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Users update own streak" on public.user_streaks
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
