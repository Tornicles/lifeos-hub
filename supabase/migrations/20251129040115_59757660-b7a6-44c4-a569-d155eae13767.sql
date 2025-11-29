-- =====================================================
-- LIFEOS v30 - DATABASE SCHEMA - PART 1: ENUMS & CORE TABLES
-- =====================================================

-- Create enums (wrapped in DO blocks for safety)
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('owner', 'admin', 'member', 'viewer');
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

-- =====================================================
-- CORE TABLES - AUTHENTICATION & USERS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'User',
  role TEXT DEFAULT 'Owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.security_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  login_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_login TIMESTAMPTZ,
  account_locked_until TIMESTAMPTZ,
  trusted_ips INET[],
  password_changed_at TIMESTAMPTZ,
  session_timeout_minutes INTEGER NOT NULL DEFAULT 480,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- MULTI-TENANT ARCHITECTURE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- =====================================================
-- LIFE HUBS & METRICS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.hubs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id),
  metric TEXT,
  value NUMERIC,
  source TEXT NOT NULL,
  notes TEXT,
  log_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ULTRA DOMAINS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.ultra_domains (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ultra_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain_id INTEGER REFERENCES public.ultra_domains(id),
  name TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metric_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_state_daily (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  state_date DATE NOT NULL,
  state TEXT NOT NULL,
  ultra_score NUMERIC NOT NULL,
  priority_zone TEXT,
  strongest_hub_id INTEGER REFERENCES public.hubs(id),
  weakest_hub_id INTEGER REFERENCES public.hubs(id),
  state_reasons JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.state_warnings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL,
  warning_text TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  related_hub_id INTEGER REFERENCES public.hubs(id),
  related_habit_id INTEGER,
  related_project_id INTEGER,
  dismissed BOOLEAN DEFAULT FALSE,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HABITS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.habits (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  streak INTEGER DEFAULT 0,
  last_checkin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.habit_checkins (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  done BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(habit_id, date)
);

-- =====================================================
-- PROJECTS & TASKS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.projects (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id),
  title TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'Not Started',
  priority TEXT DEFAULT 'Medium',
  sprint TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CALENDAR
-- =====================================================

CREATE TABLE IF NOT EXISTS public.calendar_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id),
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT,
  end_time TEXT,
  focus_domain TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AUTO-ACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.auto_actions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  hub_id INTEGER REFERENCES public.hubs(id),
  domain_id INTEGER REFERENCES public.ultra_domains(id),
  action_type TEXT NOT NULL,
  action_text TEXT NOT NULL,
  action_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_metrics_user_date ON public.metrics(user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_user_date ON public.logs(user_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_ultra_metrics_user_date ON public.ultra_metrics(user_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_habits_user ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_user ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON public.calendar_entries(user_id, date DESC);