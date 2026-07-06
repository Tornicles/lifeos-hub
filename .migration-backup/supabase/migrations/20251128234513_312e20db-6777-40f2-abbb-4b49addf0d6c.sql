-- Create automation_rule_conditions table
CREATE TABLE IF NOT EXISTS public.automation_rule_conditions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  metric_name TEXT,
  operator TEXT NOT NULL,
  threshold_value NUMERIC,
  comparison_window INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation_rule_actions table
CREATE TABLE IF NOT EXISTS public.automation_rule_actions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_payload JSONB,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation_executions table (logs of rule firings)
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  execution_date TIMESTAMPTZ DEFAULT NOW(),
  trigger_type TEXT NOT NULL,
  conditions_met JSONB,
  actions_executed JSONB,
  execution_result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create automation_context_cache table
CREATE TABLE IF NOT EXISTS public.automation_context_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);

-- Enable RLS
ALTER TABLE public.automation_rule_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_context_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rule_conditions
CREATE POLICY "Users can view conditions of viewable rules"
  ON public.automation_rule_conditions FOR SELECT
  USING (true);

-- RLS Policies for automation_rule_actions
CREATE POLICY "Users can view actions of viewable rules"
  ON public.automation_rule_actions FOR SELECT
  USING (true);

-- RLS Policies for automation_executions
CREATE POLICY "Users can view own execution logs"
  ON public.automation_executions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own execution logs"
  ON public.automation_executions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for automation_context_cache
CREATE POLICY "Users can view own cache"
  ON public.automation_context_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cache"
  ON public.automation_context_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cache"
  ON public.automation_context_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cache"
  ON public.automation_context_cache FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_automation_rule_conditions_rule_id ON public.automation_rule_conditions(rule_id);
CREATE INDEX idx_automation_rule_actions_rule_id ON public.automation_rule_actions(rule_id);
CREATE INDEX idx_automation_executions_user_id ON public.automation_executions(user_id);
CREATE INDEX idx_automation_executions_rule_id ON public.automation_executions(rule_id);
CREATE INDEX idx_automation_executions_date ON public.automation_executions(execution_date DESC);
CREATE INDEX idx_automation_context_cache_user_key ON public.automation_context_cache(user_id, cache_key);
CREATE INDEX idx_automation_context_cache_expires ON public.automation_context_cache(expires_at);