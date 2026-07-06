-- =====================================================
-- PART 3: AUTOMATION AND NOTIFICATION TABLES
-- =====================================================

-- Automation Rules table
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_value NUMERIC,
  action_target TEXT NOT NULL,
  action_value TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  conflict_group TEXT,
  requires_user_confirmation BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON public.automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_priority ON public.automation_rules(priority);

-- Automation Rule Conditions table
CREATE TABLE IF NOT EXISTS public.automation_rule_conditions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  metric_name TEXT,
  operator TEXT NOT NULL,
  threshold_value NUMERIC,
  comparison_window INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rule_conditions_rule_id ON public.automation_rule_conditions(rule_id);

-- Automation Rule Actions table
CREATE TABLE IF NOT EXISTS public.automation_rule_actions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_payload JSONB,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_rule_actions_rule_id ON public.automation_rule_actions(rule_id);

-- Automation Executions table
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  execution_date TIMESTAMPTZ DEFAULT now(),
  execution_result TEXT,
  conditions_met JSONB,
  actions_executed JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_user_id ON public.automation_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_rule_id ON public.automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_execution_date ON public.automation_executions(execution_date);

-- Automation Trigger Events table
CREATE TABLE IF NOT EXISTS public.automation_trigger_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  trigger_data JSONB,
  triggered_at TIMESTAMPTZ DEFAULT now(),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_user_id ON public.automation_trigger_events(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_processed ON public.automation_trigger_events(processed);
CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_triggered_at ON public.automation_trigger_events(triggered_at);

-- Automation Action Queue table
CREATE TABLE IF NOT EXISTS public.automation_action_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL,
  status TEXT DEFAULT 'PENDING',
  priority INTEGER DEFAULT 1,
  scheduled_for TIMESTAMPTZ DEFAULT now(),
  executed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_action_queue_user_id ON public.automation_action_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_status ON public.automation_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_scheduled_for ON public.automation_action_queue(scheduled_for);

-- Automation Logs table
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO',
  context_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON public.automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_event_type ON public.automation_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_severity ON public.automation_logs(severity);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at);

-- Automation Context Cache table
CREATE TABLE IF NOT EXISTS public.automation_context_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_automation_context_cache_user_id ON public.automation_context_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_context_cache_cache_key ON public.automation_context_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_automation_context_cache_expires_at ON public.automation_context_cache(expires_at);

-- User Automation Settings table
CREATE TABLE IF NOT EXISTS public.user_automation_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  automation_enabled BOOLEAN DEFAULT true,
  max_daily_actions INTEGER DEFAULT 20,
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb,
  priority_override TEXT,
  notification_preferences JSONB DEFAULT '{"in_app": true, "email": true, "push": false}'::jsonb,
  enabled_categories JSONB DEFAULT '["score_alerts", "habit_suggestions", "calendar_autofill", "task_generation", "state_updates"]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_automation_settings_user_id ON public.user_automation_settings(user_id);

-- Auto Actions table
CREATE TABLE IF NOT EXISTS public.auto_actions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  domain_id INTEGER REFERENCES public.ultra_domains(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_text TEXT NOT NULL,
  action_date DATE NOT NULL,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auto_actions_user_id ON public.auto_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_actions_status ON public.auto_actions(status);
CREATE INDEX IF NOT EXISTS idx_auto_actions_action_date ON public.auto_actions(action_date);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  related_entity_type TEXT,
  related_entity_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Notification Preferences table
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  weekly_reports_enabled BOOLEAN DEFAULT true,
  monthly_reports_enabled BOOLEAN DEFAULT true,
  habit_reminders_enabled BOOLEAN DEFAULT true,
  performance_alerts_enabled BOOLEAN DEFAULT true,
  calendar_alerts_enabled BOOLEAN DEFAULT true,
  project_alerts_enabled BOOLEAN DEFAULT true,
  life_event_alerts_enabled BOOLEAN DEFAULT true,
  intensity_level TEXT DEFAULT 'medium',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  max_notifications_per_hour INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- State Warnings table
CREATE TABLE IF NOT EXISTS public.state_warnings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL,
  warning_text TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  related_hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  related_habit_id INTEGER REFERENCES public.habits(id) ON DELETE SET NULL,
  related_project_id INTEGER REFERENCES public.projects(id) ON DELETE SET NULL,
  dismissed BOOLEAN DEFAULT false,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_warnings_user_id ON public.state_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_state_warnings_dismissed ON public.state_warnings(dismissed);