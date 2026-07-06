-- =====================================================
-- PART 1: ENUMS AND TYPE DEFINITIONS
-- =====================================================

-- Create enums for role-based access control
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
  CREATE TYPE membership_status AS ENUM ('active', 'pending', 'revoked');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- PART 2: CORE TABLES
-- =====================================================

-- Tenants/Workspaces table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);

-- User Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'Owner',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User Roles table (separate from profiles for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Memberships table (user-tenant relationships)
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  status membership_status NOT NULL DEFAULT 'active',
  invited_by UUID REFERENCES auth.users(id),
  invited_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON public.memberships(status);

-- Security Settings table
CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_login TIMESTAMPTZ,
  account_locked_until TIMESTAMPTZ,
  password_changed_at TIMESTAMPTZ,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
  trusted_ips INET[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_security_settings_user_id ON public.security_settings(user_id);

-- Hubs table (Life management areas)
CREATE TABLE IF NOT EXISTS public.hubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hubs_code ON public.hubs(code);
CREATE INDEX IF NOT EXISTS idx_hubs_is_active ON public.hubs(is_active);

-- Ultra Domains table
CREATE TABLE IF NOT EXISTS public.ultra_domains (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ultra_domains_code ON public.ultra_domains(code);

-- Logs table (User activity logging)
CREATE TABLE IF NOT EXISTS public.logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  source TEXT NOT NULL,
  metric TEXT,
  value NUMERIC,
  notes TEXT,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_tenant_id ON public.logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_logs_hub_id ON public.logs(hub_id);
CREATE INDEX IF NOT EXISTS idx_logs_log_date ON public.logs(log_date);
CREATE INDEX IF NOT EXISTS idx_logs_source ON public.logs(source);

-- Metrics table (Hub performance metrics)
CREATE TABLE IF NOT EXISTS public.metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_metrics_user_id ON public.metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant_id ON public.metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_hub_id ON public.metrics(hub_id);
CREATE INDEX IF NOT EXISTS idx_metrics_metric_date ON public.metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON public.metrics(name);

-- Ultra Metrics table (Domain scores)
CREATE TABLE IF NOT EXISTS public.ultra_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain_id INTEGER REFERENCES public.ultra_domains(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ultra_metrics_user_id ON public.ultra_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_tenant_id ON public.ultra_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_domain_id ON public.ultra_metrics(domain_id);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_metric_date ON public.ultra_metrics(metric_date);

-- Projects table
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_tenant_id ON public.projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_hub_id ON public.projects(hub_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_due_date ON public.projects(due_date);

-- Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  importance INTEGER DEFAULT 1,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);

-- Habits table
CREATE TABLE IF NOT EXISTS public.habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  streak INTEGER DEFAULT 0,
  last_checkin DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_tenant_id ON public.habits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_habits_last_checkin ON public.habits(last_checkin);

-- Habit Checkins table
CREATE TABLE IF NOT EXISTS public.habit_checkins (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habit_checkins_habit_id ON public.habit_checkins(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_checkins_date ON public.habit_checkins(date);

-- Calendar Entries table
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
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendar_entries_user_id ON public.calendar_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_tenant_id ON public.calendar_entries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_calendar_entries_date ON public.calendar_entries(date);

-- System State Daily table
CREATE TABLE IF NOT EXISTS public.system_state_daily (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  state TEXT NOT NULL,
  ultra_score NUMERIC NOT NULL,
  weakest_hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  strongest_hub_id INTEGER REFERENCES public.hubs(id) ON DELETE SET NULL,
  priority_zone TEXT,
  state_reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, state_date)
);

CREATE INDEX IF NOT EXISTS idx_system_state_daily_user_id ON public.system_state_daily(user_id);
CREATE INDEX IF NOT EXISTS idx_system_state_daily_state_date ON public.system_state_daily(state_date);