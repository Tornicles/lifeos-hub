-- System State Daily Tracking
CREATE TABLE IF NOT EXISTS public.system_state_daily (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  state TEXT NOT NULL, -- CRISIS, WEAK, NEUTRAL, GROWTH, AFFLUENCE
  ultra_score NUMERIC NOT NULL,
  weakest_hub_id INTEGER REFERENCES public.hubs(id),
  strongest_hub_id INTEGER REFERENCES public.hubs(id),
  priority_zone TEXT,
  state_reasons JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, state_date)
);

-- Auto-Generated Actions
CREATE TABLE IF NOT EXISTS public.auto_actions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_date DATE NOT NULL,
  action_type TEXT NOT NULL, -- RECOVERY, GROWTH, MAINTENANCE, EXPANSION
  action_text TEXT NOT NULL,
  priority INTEGER DEFAULT 1,
  hub_id INTEGER REFERENCES public.hubs(id),
  domain_id INTEGER REFERENCES public.ultra_domains(id),
  status TEXT DEFAULT 'pending', -- pending, completed, dismissed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- State Warnings
CREATE TABLE IF NOT EXISTS public.state_warnings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL, -- NO_LOGS, HABIT_BROKEN, PROJECT_STUCK, HUB_CRITICAL
  warning_text TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  related_hub_id INTEGER REFERENCES public.hubs(id),
  related_habit_id INTEGER REFERENCES public.habits(id),
  related_project_id INTEGER REFERENCES public.projects(id),
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.system_state_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_state_daily
CREATE POLICY "Users can view own system states"
  ON public.system_state_daily FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own system states"
  ON public.system_state_daily FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own system states"
  ON public.system_state_daily FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for auto_actions
CREATE POLICY "Users can view own auto actions"
  ON public.auto_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own auto actions"
  ON public.auto_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own auto actions"
  ON public.auto_actions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own auto actions"
  ON public.auto_actions FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for state_warnings
CREATE POLICY "Users can view own warnings"
  ON public.state_warnings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own warnings"
  ON public.state_warnings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own warnings"
  ON public.state_warnings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own warnings"
  ON public.state_warnings FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_system_state_user_date ON public.system_state_daily(user_id, state_date DESC);
CREATE INDEX idx_auto_actions_user_date ON public.auto_actions(user_id, action_date DESC);
CREATE INDEX idx_auto_actions_status ON public.auto_actions(status) WHERE status = 'pending';
CREATE INDEX idx_state_warnings_user ON public.state_warnings(user_id) WHERE NOT dismissed;