-- ============================================================================
-- LifeOS v30 Database Schema
-- Maps Excel v30 structure to normalized PostgreSQL tables
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE (extends auth.users)
-- ============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Owner'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- HUBS TABLE
-- Maps Excel: Finance, Health, Work, Academy, PersonalDev, Household, 
--             Relationships, Projects, Mindset hubs
-- ============================================================================
CREATE TABLE public.hubs (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Hubs are viewable by all authenticated users"
  ON public.hubs FOR SELECT
  TO authenticated
  USING (TRUE);

-- Insert default hubs
INSERT INTO public.hubs (code, name, category) VALUES
  ('FINANCE', 'Finance', 'Core'),
  ('HEALTH', 'Health', 'Core'),
  ('WORK', 'Work', 'Core'),
  ('ACADEMY', 'Academy', 'Core'),
  ('PERSONALDEV', 'Personal Development', 'Core'),
  ('HOUSEHOLD', 'Household', 'Core'),
  ('RELATIONSHIPS', 'Relationships', 'Core'),
  ('PROJECTS', 'Projects', 'Core'),
  ('MINDSET', 'Mindset', 'Core');

-- ============================================================================
-- ULTRA DOMAINS TABLE
-- Maps Excel: Ultra Hub 7 domains
-- ============================================================================
CREATE TABLE public.ultra_domains (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ultra_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ultra domains are viewable by all authenticated users"
  ON public.ultra_domains FOR SELECT
  TO authenticated
  USING (TRUE);

-- Insert 7 Ultra domains
INSERT INTO public.ultra_domains (code, name, description) VALUES
  ('SPIRITUALITY', 'Spirituality', 'Spiritual practices and growth'),
  ('CAREER', 'Career Master', 'Career advancement and professional development'),
  ('SOCIAL', 'Social Life', 'Social connections and relationships'),
  ('EMOTIONAL', 'Emotional Intelligence', 'Emotional awareness and management'),
  ('BRANDING', 'Personal Branding', 'Online influence and personal brand'),
  ('FITNESS', 'Fitness Performance', 'Physical fitness and performance'),
  ('DATING', 'Dating & Attraction', 'Dating and relationship attraction');

-- ============================================================================
-- METRICS TABLE
-- Maps Excel: Hub-specific metric sheets (Finance_Metrics, Health_Metrics, etc.)
-- ============================================================================
CREATE TABLE public.metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_user_id ON public.metrics(user_id);
CREATE INDEX idx_metrics_hub_id ON public.metrics(hub_id);
CREATE INDEX idx_metrics_date ON public.metrics(metric_date);

ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metrics"
  ON public.metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metrics"
  ON public.metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metrics"
  ON public.metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own metrics"
  ON public.metrics FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- ULTRA METRICS TABLE
-- Maps Excel: Ultra_Metrics sheet (domain scores + ULTRA_Score)
-- ============================================================================
CREATE TABLE public.ultra_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  domain_id INTEGER REFERENCES public.ultra_domains(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ultra_metrics_user_id ON public.ultra_metrics(user_id);
CREATE INDEX idx_ultra_metrics_domain_id ON public.ultra_metrics(domain_id);
CREATE INDEX idx_ultra_metrics_date ON public.ultra_metrics(metric_date);

ALTER TABLE public.ultra_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ultra metrics"
  ON public.ultra_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ultra metrics"
  ON public.ultra_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ultra metrics"
  ON public.ultra_metrics FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ultra metrics"
  ON public.ultra_metrics FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- LOGS TABLE
-- Maps Excel: All *_Log sheets (Ultra_Log, Finance_Log, Health_Log, etc.)
-- ============================================================================
CREATE TABLE public.logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  metric TEXT,
  value NUMERIC,
  notes TEXT,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_logs_user_id ON public.logs(user_id);
CREATE INDEX idx_logs_hub_id ON public.logs(hub_id);
CREATE INDEX idx_logs_date ON public.logs(log_date);
CREATE INDEX idx_logs_source ON public.logs(source);

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON public.logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own logs"
  ON public.logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own logs"
  ON public.logs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROJECTS TABLE
-- Maps Excel: PROJECTS_MANAGER sheet
-- ============================================================================
CREATE TABLE public.projects (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  sprint TEXT,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_hub_id ON public.projects(hub_id);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- TASKS TABLE
-- Maps Excel: PROJECTS_MANAGER task details
-- ============================================================================
CREATE TABLE public.tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  importance INTEGER DEFAULT 1,
  due_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tasks of own projects"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert tasks into own projects"
  ON public.tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of own projects"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of own projects"
  ON public.tasks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- HABITS TABLE
-- Maps Excel: HABITS_ENGINE sheet
-- ============================================================================
CREATE TABLE public.habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  streak INTEGER DEFAULT 0,
  last_checkin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habits_user_id ON public.habits(user_id);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits"
  ON public.habits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HABIT CHECKINS TABLE
-- Maps Excel: Daily habit tracking (replaces Mon/Tue/Wed columns)
-- ============================================================================
CREATE TABLE public.habit_checkins (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

CREATE INDEX idx_habit_checkins_habit_id ON public.habit_checkins(habit_id);
CREATE INDEX idx_habit_checkins_date ON public.habit_checkins(date);

ALTER TABLE public.habit_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view checkins of own habits"
  ON public.habit_checkins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert checkins for own habits"
  ON public.habit_checkins FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update checkins of own habits"
  ON public.habit_checkins FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete checkins of own habits"
  ON public.habit_checkins FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
      AND habits.user_id = auth.uid()
    )
  );

-- ============================================================================
-- CALENDAR ENTRIES TABLE
-- Maps Excel: ULTRA_CALENDAR + AI_PLANNER time blocks
-- ============================================================================
CREATE TABLE public.calendar_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  title TEXT NOT NULL,
  description TEXT,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE CASCADE,
  focus_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calendar_user_id ON public.calendar_entries(user_id);
CREATE INDEX idx_calendar_date ON public.calendar_entries(date);

ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar entries"
  ON public.calendar_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calendar entries"
  ON public.calendar_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar entries"
  ON public.calendar_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar entries"
  ON public.calendar_entries FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- AUTOMATION RULES TABLE
-- Maps Excel: AUTOMATION_ENGINE logic
-- ============================================================================
CREATE TABLE public.automation_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_value NUMERIC,
  action_target TEXT NOT NULL,
  action_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Automation rules are viewable by all authenticated users"
  ON public.automation_rules FOR SELECT
  TO authenticated
  USING (TRUE);

-- Insert default automation rules (based on Excel AUTOMATION_ENGINE)
INSERT INTO public.automation_rules (name, description, condition_type, condition_value, action_target, action_value) VALUES
  ('Low Ultra Score Alert', 'Focus on weakest areas when Ultra score is below 40', 'ULTRA_BELOW', 40, 'FocusDomain', 'WeakestHub'),
  ('Critical State Warning', 'Show critical alert when 3+ hubs are in danger', 'DANGER_HUBS', 3, 'Alert', 'Critical'),
  ('Stability Achievement', 'Celebrate when Ultra score reaches 70+', 'ULTRA_ABOVE', 70, 'Notification', 'Celebration');

-- ============================================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON public.metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ultra_metrics_updated_at BEFORE UPDATE ON public.ultra_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_logs_updated_at BEFORE UPDATE ON public.logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_updated_at BEFORE UPDATE ON public.calendar_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_updated_at BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();