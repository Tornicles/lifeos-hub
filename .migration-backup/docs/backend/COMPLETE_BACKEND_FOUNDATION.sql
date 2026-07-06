-- ============================================================================
-- LIFEOS v36 - COMPLETE BACKEND FOUNDATION
-- ============================================================================
-- This file contains the complete SQL schema, RLS policies, and helper
-- functions for the LifeOS multi-tenant SaaS platform.
--
-- EXECUTION ORDER:
-- 1. Run SECTION 1 (Core Schema)
-- 2. Run SECTION 2 (Helper Functions)
-- 3. Run SECTION 3 (RLS Policies)
-- 4. Run SECTION 4 (Triggers)
--
-- SAFETY: This script uses CREATE IF NOT EXISTS and CREATE OR REPLACE
-- patterns to be safe to run on existing databases.
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE TABLE SCHEMA (DDL)
-- ============================================================================

-- Custom Types / Enums
-- ----------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member', 'viewer', 'guest');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM ('pending', 'active', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tenants Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT tenants_slug_check CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT tenants_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON public.tenants(plan);

COMMENT ON TABLE public.tenants IS 'Organizations/workspaces/families - each tenant is a separate isolated environment';

-- Profiles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT profiles_full_name_length CHECK (char_length(full_name) >= 1 AND char_length(full_name) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);

COMMENT ON TABLE public.profiles IS 'User profiles linked to auth.users - stores display name and basic info';

-- User Roles Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

COMMENT ON TABLE public.user_roles IS 'Global user roles (owner, admin, member) - separate from tenant roles';

-- Memberships Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  status membership_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);

COMMENT ON TABLE public.memberships IS 'User-Tenant relationships with per-tenant roles';

-- Hubs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT hubs_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 50),
  CONSTRAINT hubs_code_check CHECK (code ~ '^[A-Z_]+$')
);

CREATE INDEX IF NOT EXISTS idx_hubs_code ON public.hubs(code);
CREATE INDEX IF NOT EXISTS idx_hubs_is_active ON public.hubs(is_active);

COMMENT ON TABLE public.hubs IS 'Life areas: Finance, Health, Work, Academy, PersonalDev, Household, Relationships, Projects, Mindset';

-- Ultra Domains Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ultra_domains (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT ultra_domains_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT ultra_domains_code_check CHECK (code ~ '^[A-Z_]+$')
);

CREATE INDEX IF NOT EXISTS idx_ultra_domains_code ON public.ultra_domains(code);

COMMENT ON TABLE public.ultra_domains IS '7 Ultra domains: Spirituality, Career Master, Social, EQ, Brand, Fitness, Dating';

-- Logs Table (Unified)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  log_date DATE NOT NULL,
  source TEXT NOT NULL,
  metric TEXT,
  value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT logs_source_length CHECK (char_length(source) >= 1 AND char_length(source) <= 50),
  CONSTRAINT logs_notes_length CHECK (char_length(notes) <= 5000)
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_tenant_id ON public.logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logs_hub_id ON public.logs(hub_id);
CREATE INDEX IF NOT EXISTS idx_logs_log_date ON public.logs(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_source ON public.logs(source);

COMMENT ON TABLE public.logs IS 'Unified log entries from all hubs (Finance_Log, Health_Log, etc.)';

-- Metrics Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT metrics_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON public.metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant_id ON public.metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_hub_id ON public.metrics(hub_id);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_date ON public.metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON public.metrics(name);

COMMENT ON TABLE public.metrics IS 'Hub-level metrics (daily scores, KPIs)';

-- Ultra Metrics Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ultra_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain_id INTEGER REFERENCES public.ultra_domains(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT ultra_metrics_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

CREATE INDEX IF NOT EXISTS idx_ultra_metrics_user_id ON public.ultra_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_tenant_id ON public.ultra_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_domain_id ON public.ultra_metrics(domain_id);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_metric_date ON public.ultra_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_name ON public.ultra_metrics(name);

COMMENT ON TABLE public.ultra_metrics IS 'ULTRA_Score and per-domain ultra scores';

-- Projects Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  sprint TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT projects_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT projects_notes_length CHECK (char_length(notes) <= 5000),
  CONSTRAINT projects_status_check CHECK (status IN ('Not Started', 'In Progress', 'Done', 'On Hold')),
  CONSTRAINT projects_priority_check CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent'))
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_hub_id ON public.projects(hub_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);

COMMENT ON TABLE public.projects IS 'Scrum-style project management root table';

-- Tasks Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  importance INTEGER DEFAULT 1,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT tasks_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT tasks_description_length CHECK (char_length(description) <= 5000),
  CONSTRAINT tasks_status_check CHECK (status IN ('Not Started', 'In Progress', 'Done')),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('Low', 'Medium', 'High')),
  CONSTRAINT tasks_importance_check CHECK (importance >= 1 AND importance <= 5)
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

COMMENT ON TABLE public.tasks IS 'Tasks under projects';

-- Habits Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  streak INTEGER DEFAULT 0,
  last_checkin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT habits_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT habits_description_length CHECK (char_length(description) <= 1000),
  CONSTRAINT habits_streak_check CHECK (streak >= 0)
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_tenant_id ON public.habits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_habits_last_checkin ON public.habits(last_checkin DESC);

COMMENT ON TABLE public.habits IS 'User habit definitions';

-- Habit Checkins Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.habit_checkins (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_checkins_habit_id ON public.habit_checkins(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_date ON public.habit_checkins(date DESC);

COMMENT ON TABLE public.habit_checkins IS 'Daily habit check-in log for streak tracking';

-- Calendar Entries Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  start_time TEXT,
  end_time TEXT,
  focus_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT calendar_entries_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 200),
  CONSTRAINT calendar_entries_description_length CHECK (char_length(description) <= 2000)
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_id ON public.calendar_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_tenant_id ON public.calendar_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_hub_id ON public.calendar_entries(hub_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_date ON public.calendar_entries(date);

COMMENT ON TABLE public.calendar_entries IS 'Time-blocking planner and UltraCalendar events';

-- Automation Rules Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL,
  condition_value NUMERIC,
  action_target TEXT NOT NULL,
  action_value TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 1,
  requires_user_confirmation BOOLEAN DEFAULT FALSE,
  conflict_group TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT automation_rules_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100),
  CONSTRAINT automation_rules_priority_check CHECK (priority >= 1 AND priority <= 100)
);

CREATE INDEX IF NOT EXISTS idx_automation_rules_is_active ON public.automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_automation_rules_condition_type ON public.automation_rules(condition_type);

COMMENT ON TABLE public.automation_rules IS 'Automation engine rules (mimics Excel AUTOMATION_ENGINE)';

-- Automation Rule Conditions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rule_conditions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  operator TEXT NOT NULL,
  metric_name TEXT,
  threshold_value NUMERIC,
  comparison_window INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT automation_rule_conditions_operator_check CHECK (operator IN ('>', '<', '>=', '<=', '=', '!='))
);

CREATE INDEX IF NOT EXISTS idx_automation_rule_conditions_rule_id ON public.automation_rule_conditions(rule_id);

COMMENT ON TABLE public.automation_rule_conditions IS 'Detailed conditions for automation rules';

-- Automation Rule Actions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_rule_actions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_payload JSONB,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_rule_actions_rule_id ON public.automation_rule_actions(rule_id);

COMMENT ON TABLE public.automation_rule_actions IS 'Actions to execute when rules trigger';

-- Automation Action Queue Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_action_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  action_payload JSONB NOT NULL,
  priority INTEGER DEFAULT 1,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'PENDING',
  executed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT automation_action_queue_status_check CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_automation_action_queue_user_id ON public.automation_action_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_status ON public.automation_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_scheduled_for ON public.automation_action_queue(scheduled_for);

COMMENT ON TABLE public.automation_action_queue IS 'Queue for executing automation actions with retry logic';

-- Automation Executions Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_executions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  trigger_type TEXT NOT NULL,
  conditions_met JSONB,
  actions_executed JSONB,
  execution_result TEXT,
  execution_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_executions_user_id ON public.automation_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_executions_execution_date ON public.automation_executions(execution_date DESC);

COMMENT ON TABLE public.automation_executions IS 'Log of automation rule executions';

-- Automation Logs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'INFO',
  context_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT automation_logs_severity_check CHECK (severity IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'))
);

CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON public.automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_event_type ON public.automation_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at DESC);

COMMENT ON TABLE public.automation_logs IS 'Automation system event logs';

-- Auto Actions Table
-- ----------------------------------------------------------------------------
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT auto_actions_status_check CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_auto_actions_user_id ON public.auto_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_actions_status ON public.auto_actions(status);
CREATE INDEX IF NOT EXISTS idx_auto_actions_action_date ON public.auto_actions(action_date);

COMMENT ON TABLE public.auto_actions IS 'Generated action recommendations from automation engine';

-- System State Daily Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_state_daily (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  state TEXT NOT NULL,
  ultra_score NUMERIC NOT NULL,
  priority_zone TEXT,
  weakest_hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  strongest_hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  state_reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, state_date)
);

CREATE INDEX IF NOT EXISTS idx_system_state_daily_user_id ON public.system_state_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_system_state_daily_state_date ON public.system_state_daily(state_date DESC);

COMMENT ON TABLE public.system_state_daily IS 'Daily system state snapshots (Critical/Danger/Weak/Stable/Good/Excellent/Elite)';

-- State Warnings Table
-- ----------------------------------------------------------------------------
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
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT state_warnings_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_state_warnings_user_id ON public.state_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_state_warnings_dismissed ON public.state_warnings(dismissed);

COMMENT ON TABLE public.state_warnings IS 'System-generated warnings and alerts for users';

-- Notifications Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  related_entity_type TEXT,
  related_entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT notifications_severity_check CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

COMMENT ON TABLE public.notifications IS 'In-app notifications for users';

-- Notification Preferences Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  intensity_level TEXT DEFAULT 'medium',
  habit_reminders_enabled BOOLEAN DEFAULT TRUE,
  performance_alerts_enabled BOOLEAN DEFAULT TRUE,
  project_alerts_enabled BOOLEAN DEFAULT TRUE,
  calendar_alerts_enabled BOOLEAN DEFAULT TRUE,
  life_event_alerts_enabled BOOLEAN DEFAULT TRUE,
  weekly_reports_enabled BOOLEAN DEFAULT TRUE,
  monthly_reports_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  max_notifications_per_hour INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT notification_preferences_intensity_check CHECK (intensity_level IN ('low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

COMMENT ON TABLE public.notification_preferences IS 'User preferences for notification delivery';

-- Audit Logs Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT audit_logs_operation_check CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'SELECT'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

COMMENT ON TABLE public.audit_logs IS 'Security audit trail for all sensitive operations';

-- Security Settings Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  account_locked_until TIMESTAMPTZ,
  last_failed_login TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  trusted_ips INET[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON public.security_settings(user_id);

COMMENT ON TABLE public.security_settings IS 'Per-user security configuration';

-- Automation Context Cache Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_context_cache (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_automation_context_cache_expires_at ON public.automation_context_cache(expires_at);

COMMENT ON TABLE public.automation_context_cache IS 'Cache for automation context and rate limiting';

-- Automation Trigger Events Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.automation_trigger_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  trigger_source TEXT NOT NULL,
  trigger_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_user_id ON public.automation_trigger_events(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_processed ON public.automation_trigger_events(processed);

COMMENT ON TABLE public.automation_trigger_events IS 'Events that trigger automation evaluations';

-- Admin Settings Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_setting_key ON public.admin_settings(setting_key);

COMMENT ON TABLE public.admin_settings IS 'Global admin configuration settings';

-- User Automation Settings Table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_automation_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  automation_enabled BOOLEAN DEFAULT TRUE,
  enabled_categories JSONB DEFAULT '["score_alerts", "habit_suggestions", "calendar_autofill", "task_generation", "state_updates"]',
  max_daily_actions INTEGER DEFAULT 20,
  priority_override TEXT,
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}',
  notification_preferences JSONB DEFAULT '{"email": true, "push": false, "in_app": true"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_automation_settings_user_id ON public.user_automation_settings(user_id);

COMMENT ON TABLE public.user_automation_settings IS 'User preferences for automation behavior';


-- ============================================================================
-- SECTION 2: TENANT + ROLE HELPER FUNCTIONS + RPCs
-- ============================================================================

-- Function: has_role
-- Check if user has a specific global role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > NOW())
  )
$$;

COMMENT ON FUNCTION public.has_role IS 'Check if user has a specific global role (owner, admin, member, etc.)';

-- Function: is_owner
-- Check if user is a global owner
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_owner(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'owner'::app_role)
$$;

COMMENT ON FUNCTION public.is_owner IS 'Check if user is a global owner';

-- Function: is_admin
-- Check if user is a global admin or owner
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role) OR public.has_role(_user_id, 'owner'::app_role)
$$;

COMMENT ON FUNCTION public.is_admin IS 'Check if user is a global admin or owner';

-- Function: is_tenant_member
-- Check if user is a member of a specific tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND status = 'active'
  )
$$;

COMMENT ON FUNCTION public.is_tenant_member IS 'Check if user is an active member of a tenant';

-- Function: has_tenant_role
-- Check if user has a specific role within a tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role membership_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role = _role
      AND status = 'active'
  )
$$;

COMMENT ON FUNCTION public.has_tenant_role IS 'Check if user has a specific role within a tenant';

-- Function: is_tenant_admin
-- Check if user is an admin or owner within a tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
$$;

COMMENT ON FUNCTION public.is_tenant_admin IS 'Check if user is an admin or owner within a tenant';

-- Function: is_tenant_admin_for (alias)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_tenant_admin_for(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_tenant_admin(_user_id, _tenant_id)
$$;

COMMENT ON FUNCTION public.is_tenant_admin_for IS 'Alias for is_tenant_admin';

-- Function: get_user_tenant_role
-- Get user's role within a tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_tenant_role(_user_id UUID, _tenant_id UUID)
RETURNS membership_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.memberships
  WHERE user_id = _user_id
    AND tenant_id = _tenant_id
    AND status = 'active'
  LIMIT 1
$$;

COMMENT ON FUNCTION public.get_user_tenant_role IS 'Get user role within a tenant';


-- ============================================================================
-- SECTION 3: RLS POLICIES
-- ============================================================================

-- Enable RLS on all tables
-- ----------------------------------------------------------------------------
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultra_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ultra_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_rule_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_state_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_warnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_context_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_automation_settings ENABLE ROW LEVEL SECURITY;

-- Tenants Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their tenants" ON public.tenants;
CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = tenants.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

DROP POLICY IF EXISTS "Users can create limited tenants" ON public.tenants;
CREATE POLICY "Users can create limited tenants" ON public.tenants
  FOR INSERT WITH CHECK (
    (SELECT COUNT(*) FROM public.memberships
     WHERE user_id = auth.uid()
       AND role = 'owner'
       AND status = 'active') < 5
  );

DROP POLICY IF EXISTS "Owners and admins can update tenants" ON public.tenants;
CREATE POLICY "Owners and admins can update tenants" ON public.tenants
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), id));

DROP POLICY IF EXISTS "Owners can delete tenants" ON public.tenants;
CREATE POLICY "Owners can delete tenants" ON public.tenants
  FOR DELETE USING (public.has_tenant_role(auth.uid(), id, 'owner'));

-- Profiles Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile or tenant admins can view" ON public.profiles;
CREATE POLICY "Users can view own profile or tenant admins can view" ON public.profiles
  FOR SELECT USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.memberships m1
      WHERE m1.user_id = auth.uid()
        AND m1.role IN ('admin', 'owner')
        AND m1.status = 'active'
        AND m1.tenant_id IN (
          SELECT m2.tenant_id FROM public.memberships m2
          WHERE m2.user_id = profiles.id
            AND m2.status = 'active'
        )
    )
  );

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Roles Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and owners can view user roles" ON public.user_roles;
CREATE POLICY "Admins and owners can view user roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners can manage roles" ON public.user_roles;
CREATE POLICY "Owners can manage roles" ON public.user_roles
  FOR ALL USING (public.is_owner(auth.uid()));

-- Memberships Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view memberships" ON public.memberships;
CREATE POLICY "Users can view memberships" ON public.memberships
  FOR SELECT USING (
    public.is_tenant_member(auth.uid(), tenant_id)
    OR public.is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can create memberships" ON public.memberships;
CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins can update memberships" ON public.memberships;
CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), tenant_id));

DROP POLICY IF EXISTS "Admins can delete memberships" ON public.memberships;
CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- Hubs Policies (global read-only reference data)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Hubs viewable by all" ON public.hubs;
CREATE POLICY "Hubs viewable by all" ON public.hubs
  FOR SELECT USING (true);

-- Ultra Domains Policies (global read-only reference data)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Ultra domains viewable by all" ON public.ultra_domains;
CREATE POLICY "Ultra domains viewable by all" ON public.ultra_domains
  FOR SELECT USING (true);

-- Logs Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own logs or tenant admins" ON public.logs;
CREATE POLICY "Users can view own logs or tenant admins" ON public.logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = logs.tenant_id OR logs.tenant_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert own logs" ON public.logs;
CREATE POLICY "Users can insert own logs" ON public.logs
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own logs" ON public.logs;
CREATE POLICY "Users can update own logs" ON public.logs
  FOR UPDATE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own logs" ON public.logs;
CREATE POLICY "Users can delete own logs" ON public.logs
  FOR DELETE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- Metrics Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own metrics or tenant admins" ON public.metrics;
CREATE POLICY "Users can view own metrics or tenant admins" ON public.metrics
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = metrics.tenant_id OR metrics.tenant_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert own metrics" ON public.metrics;
CREATE POLICY "Users can insert own metrics" ON public.metrics
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own metrics" ON public.metrics;
CREATE POLICY "Users can update own metrics" ON public.metrics
  FOR UPDATE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own metrics" ON public.metrics;
CREATE POLICY "Users can delete own metrics" ON public.metrics
  FOR DELETE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- Ultra Metrics Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own ultra metrics or tenant admins" ON public.ultra_metrics;
CREATE POLICY "Users can view own ultra metrics or tenant admins" ON public.ultra_metrics
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = ultra_metrics.tenant_id OR ultra_metrics.tenant_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can insert own ultra metrics" ON public.ultra_metrics
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can update own ultra metrics" ON public.ultra_metrics
  FOR UPDATE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can delete own ultra metrics" ON public.ultra_metrics
  FOR DELETE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- Projects Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own projects or tenant admins" ON public.projects;
CREATE POLICY "Users can view own projects or tenant admins" ON public.projects
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = projects.tenant_id OR projects.tenant_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- Tasks Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own project tasks" ON public.tasks;
CREATE POLICY "Users can view own project tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert tasks into own projects" ON public.tasks;
CREATE POLICY "Users can insert tasks into own projects" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own project tasks" ON public.tasks;
CREATE POLICY "Users can update own project tasks" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own project tasks" ON public.tasks;
CREATE POLICY "Users can delete own project tasks" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = tasks.project_id
        AND projects.user_id = auth.uid()
    )
  );

-- Habits Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own habits or tenant admins" ON public.habits;
CREATE POLICY "Users can view own habits or tenant admins" ON public.habits
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = habits.tenant_id OR habits.tenant_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert own habits" ON public.habits
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- Habit Checkins Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own habit checkins" ON public.habit_checkins;
CREATE POLICY "Users can view own habit checkins" ON public.habit_checkins
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
        AND habits.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own habit checkins" ON public.habit_checkins;
CREATE POLICY "Users can insert own habit checkins" ON public.habit_checkins
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
        AND habits.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own habit checkins" ON public.habit_checkins;
CREATE POLICY "Users can update own habit checkins" ON public.habit_checkins
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
        AND habits.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own habit checkins" ON public.habit_checkins;
CREATE POLICY "Users can delete own habit checkins" ON public.habit_checkins
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_checkins.habit_id
        AND habits.user_id = auth.uid()
    )
  );

-- Calendar Entries Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own calendar or tenant admins" ON public.calendar_entries;
CREATE POLICY "Users can view own calendar or tenant admins" ON public.calendar_entries
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = calendar_entries.tenant_id OR calendar_entries.tenant_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Users can insert own calendar" ON public.calendar_entries;
CREATE POLICY "Users can insert own calendar" ON public.calendar_entries
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own calendar" ON public.calendar_entries;
CREATE POLICY "Users can update own calendar" ON public.calendar_entries
  FOR UPDATE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own calendar" ON public.calendar_entries;
CREATE POLICY "Users can delete own calendar" ON public.calendar_entries
  FOR DELETE USING (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- Automation Rules Policies (global rules, read by all)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "All can view automation rules" ON public.automation_rules;
CREATE POLICY "All can view automation rules" ON public.automation_rules
  FOR SELECT USING (true);

-- Automation Rule Conditions Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "All can view rule conditions" ON public.automation_rule_conditions;
CREATE POLICY "All can view rule conditions" ON public.automation_rule_conditions
  FOR SELECT USING (true);

-- Automation Rule Actions Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "All can view rule actions" ON public.automation_rule_actions;
CREATE POLICY "All can view rule actions" ON public.automation_rule_actions
  FOR SELECT USING (true);

-- Automation Action Queue Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own action queue" ON public.automation_action_queue;
CREATE POLICY "Users can view own action queue" ON public.automation_action_queue
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can manage action queue" ON public.automation_action_queue;
CREATE POLICY "System can manage action queue" ON public.automation_action_queue
  FOR ALL USING (true);

-- Automation Executions Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own executions" ON public.automation_executions;
CREATE POLICY "Users can view own executions" ON public.automation_executions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own executions" ON public.automation_executions;
CREATE POLICY "Users can insert own executions" ON public.automation_executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Automation Logs Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own automation logs" ON public.automation_logs;
CREATE POLICY "Users can view own automation logs" ON public.automation_logs
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert automation logs" ON public.automation_logs;
CREATE POLICY "System can insert automation logs" ON public.automation_logs
  FOR INSERT WITH CHECK (true);

-- Auto Actions Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own auto actions" ON public.auto_actions;
CREATE POLICY "Users can view own auto actions" ON public.auto_actions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own auto actions" ON public.auto_actions;
CREATE POLICY "Users can insert own auto actions" ON public.auto_actions
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own auto actions" ON public.auto_actions;
CREATE POLICY "Users can update own auto actions" ON public.auto_actions
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own auto actions" ON public.auto_actions;
CREATE POLICY "Users can delete own auto actions" ON public.auto_actions
  FOR DELETE USING (user_id = auth.uid());

-- System State Daily Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own system state" ON public.system_state_daily;
CREATE POLICY "Users can view own system state" ON public.system_state_daily
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own system state" ON public.system_state_daily;
CREATE POLICY "Users can insert own system state" ON public.system_state_daily
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own system state" ON public.system_state_daily;
CREATE POLICY "Users can update own system state" ON public.system_state_daily
  FOR UPDATE USING (user_id = auth.uid());

-- State Warnings Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own warnings" ON public.state_warnings;
CREATE POLICY "Users can view own warnings" ON public.state_warnings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own warnings" ON public.state_warnings;
CREATE POLICY "Users can insert own warnings" ON public.state_warnings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own warnings" ON public.state_warnings;
CREATE POLICY "Users can update own warnings" ON public.state_warnings
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own warnings" ON public.state_warnings;
CREATE POLICY "Users can delete own warnings" ON public.state_warnings
  FOR DELETE USING (user_id = auth.uid());

-- Notifications Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- Notification Preferences Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can view own notification prefs" ON public.notification_preferences
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification prefs" ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notification prefs" ON public.notification_preferences;
CREATE POLICY "Users can update own notification prefs" ON public.notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

-- Audit Logs Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own audit logs or tenant admins" ON public.audit_logs;
CREATE POLICY "Users view own audit logs or tenant admins" ON public.audit_logs
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND m.tenant_id IN (
          SELECT m2.tenant_id FROM public.memberships m2
          WHERE m2.user_id = audit_logs.user_id
            AND m2.status = 'active'
        )
    )
  );

DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

-- Security Settings Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own security settings" ON public.security_settings;
CREATE POLICY "Users can view own security settings" ON public.security_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security settings" ON public.security_settings;
CREATE POLICY "Users can insert own security settings" ON public.security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security settings" ON public.security_settings;
CREATE POLICY "Users can update own security settings" ON public.security_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Automation Context Cache Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own cache" ON public.automation_context_cache;
CREATE POLICY "Users can view own cache" ON public.automation_context_cache
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own cache" ON public.automation_context_cache;
CREATE POLICY "Users can insert own cache" ON public.automation_context_cache
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own cache" ON public.automation_context_cache;
CREATE POLICY "Users can update own cache" ON public.automation_context_cache
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own cache" ON public.automation_context_cache;
CREATE POLICY "Users can delete own cache" ON public.automation_context_cache
  FOR DELETE USING (user_id = auth.uid());

-- Automation Trigger Events Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own trigger events" ON public.automation_trigger_events;
CREATE POLICY "Users can view own trigger events" ON public.automation_trigger_events
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert trigger events" ON public.automation_trigger_events;
CREATE POLICY "System can insert trigger events" ON public.automation_trigger_events
  FOR INSERT WITH CHECK (true);

-- Admin Settings Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view admin settings" ON public.admin_settings;
CREATE POLICY "Admins can view admin settings" ON public.admin_settings
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'));

DROP POLICY IF EXISTS "Admins can update admin settings" ON public.admin_settings;
CREATE POLICY "Admins can update admin settings" ON public.admin_settings
  FOR ALL USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'));

-- User Automation Settings Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own automation settings" ON public.user_automation_settings;
CREATE POLICY "Users can view own automation settings" ON public.user_automation_settings
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own automation settings" ON public.user_automation_settings;
CREATE POLICY "Users can insert own automation settings" ON public.user_automation_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own automation settings" ON public.user_automation_settings;
CREATE POLICY "Users can update own automation settings" ON public.user_automation_settings
  FOR UPDATE USING (user_id = auth.uid());


-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Trigger: Auto-update updated_at timestamps
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_memberships_updated_at ON public.memberships;
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_logs_updated_at ON public.logs;
CREATE TRIGGER update_logs_updated_at
  BEFORE UPDATE ON public.logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_metrics_updated_at ON public.metrics;
CREATE TRIGGER update_metrics_updated_at
  BEFORE UPDATE ON public.metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ultra_metrics_updated_at ON public.ultra_metrics;
CREATE TRIGGER update_ultra_metrics_updated_at
  BEFORE UPDATE ON public.ultra_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_habits_updated_at ON public.habits;
CREATE TRIGGER update_habits_updated_at
  BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_entries_updated_at ON public.calendar_entries;
CREATE TRIGGER update_calendar_entries_updated_at
  BEFORE UPDATE ON public.calendar_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_rules_updated_at ON public.automation_rules;
CREATE TRIGGER update_automation_rules_updated_at
  BEFORE UPDATE ON public.automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_automation_action_queue_updated_at ON public.automation_action_queue;
CREATE TRIGGER update_automation_action_queue_updated_at
  BEFORE UPDATE ON public.automation_action_queue
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_security_settings_updated_at ON public.security_settings;
CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_automation_settings_updated_at ON public.user_automation_settings;
CREATE TRIGGER update_user_automation_settings_updated_at
  BEFORE UPDATE ON public.user_automation_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Handle new user creation
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    'Owner'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Assign default role
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.user_roles;
  
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role, assigned_by)
    VALUES (NEW.id, 'owner'::app_role, NEW.id)
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'member'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;
  
  INSERT INTO public.security_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_assign_role ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- Trigger: Create personal tenant
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_personal_tenant()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  user_slug TEXT;
BEGIN
  user_slug := LOWER(REGEXP_REPLACE(
    SPLIT_PART(NEW.email, '@', 1),
    '[^a-z0-9]',
    '-',
    'g'
  ));
  
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = user_slug) LOOP
    user_slug := user_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
  END LOOP;
  
  INSERT INTO public.tenants (name, slug, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace'),
    user_slug,
    'free'
  )
  RETURNING id INTO new_tenant_id;
  
  INSERT INTO public.memberships (user_id, tenant_id, role, status)
  VALUES (NEW.id, new_tenant_id, 'owner', 'active');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_tenant ON auth.users;
CREATE TRIGGER on_auth_user_created_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_personal_tenant();

-- Security event logging function
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_details JSONB,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    table_name,
    record_id,
    operation,
    new_values,
    ip_address,
    user_agent
  )
  VALUES (
    p_user_id,
    'security_events',
    p_event_type,
    'INSERT',
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- ============================================================================
-- END OF SQL SCHEMA
-- ============================================================================
