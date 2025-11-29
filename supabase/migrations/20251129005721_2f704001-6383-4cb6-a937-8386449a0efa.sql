-- ============================================================================
-- LIFEOS MULTI-TENANT ARCHITECTURE
-- Big Rock A: Core Accounts, Security & Tenant Model
-- ============================================================================
-- This migration adds comprehensive multi-tenant support with:
-- 1. Tenants (workspaces) table
-- 2. Memberships (user-tenant relationships with roles)
-- 3. Tenant scoping for all user data
-- 4. Enhanced security functions
-- 5. Updated RLS policies for tenant isolation
-- ============================================================================

-- ============================================================================
-- SECTION 1: TENANTS (WORKSPACES)
-- ============================================================================

-- Create plan enum for tenant subscriptions
CREATE TYPE public.subscription_plan AS ENUM ('free', 'starter', 'pro', 'enterprise');

-- Create tenants table
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT tenants_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
  CONSTRAINT tenants_slug_format CHECK (slug ~ '^[a-z0-9-]+$' AND LENGTH(slug) >= 3 AND LENGTH(slug) <= 50)
);

-- Add index on slug for fast lookups
CREATE INDEX idx_tenants_slug ON public.tenants(slug);

-- Enable RLS on tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: MEMBERSHIPS (USER-TENANT RELATIONSHIPS)
-- ============================================================================

-- Create membership status enum
CREATE TYPE public.membership_status AS ENUM ('pending', 'active', 'revoked');

-- Create membership role enum (extends existing app_role)
CREATE TYPE public.membership_role AS ENUM ('owner', 'admin', 'member', 'viewer');

-- Create memberships table
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'member',
  status membership_status NOT NULL DEFAULT 'active',
  invited_email TEXT,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Each user can only have one membership per tenant
  UNIQUE(user_id, tenant_id)
);

-- Add indexes for fast lookups
CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_tenant_id ON public.memberships(tenant_id);
CREATE INDEX idx_memberships_status ON public.memberships(status);

-- Enable RLS on memberships
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 3: ADD TENANT_ID TO ALL USER DATA TABLES
-- ============================================================================

-- Add tenant_id to metrics
ALTER TABLE public.metrics ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_metrics_tenant_id ON public.metrics(tenant_id);

-- Add tenant_id to ultra_metrics
ALTER TABLE public.ultra_metrics ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_ultra_metrics_tenant_id ON public.ultra_metrics(tenant_id);

-- Add tenant_id to logs
ALTER TABLE public.logs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_logs_tenant_id ON public.logs(tenant_id);

-- Add tenant_id to projects
ALTER TABLE public.projects ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_projects_tenant_id ON public.projects(tenant_id);

-- Add tenant_id to habits
ALTER TABLE public.habits ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_habits_tenant_id ON public.habits(tenant_id);

-- Add tenant_id to calendar_entries
ALTER TABLE public.calendar_entries ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_calendar_entries_tenant_id ON public.calendar_entries(tenant_id);

-- Add tenant_id to auto_actions
ALTER TABLE public.auto_actions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_auto_actions_tenant_id ON public.auto_actions(tenant_id);

-- Add tenant_id to automation_executions
ALTER TABLE public.automation_executions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_automation_executions_tenant_id ON public.automation_executions(tenant_id);

-- Add tenant_id to system_state_daily
ALTER TABLE public.system_state_daily ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_system_state_daily_tenant_id ON public.system_state_daily(tenant_id);

-- Add tenant_id to state_warnings
ALTER TABLE public.state_warnings ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_state_warnings_tenant_id ON public.state_warnings(tenant_id);

-- Add tenant_id to automation_context_cache
ALTER TABLE public.automation_context_cache ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
CREATE INDEX idx_automation_context_cache_tenant_id ON public.automation_context_cache(tenant_id);

-- ============================================================================
-- SECTION 4: SECURITY HELPER FUNCTIONS
-- ============================================================================

-- Function: Check if user is member of tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
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

-- Function: Check if user has specific role in tenant
CREATE OR REPLACE FUNCTION public.has_tenant_role(_user_id UUID, _tenant_id UUID, _role membership_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
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

-- Function: Check if user is owner or admin of tenant
CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id UUID, _tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
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

-- Function: Get user's role in tenant
CREATE OR REPLACE FUNCTION public.get_user_tenant_role(_user_id UUID, _tenant_id UUID)
RETURNS membership_role
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.memberships
  WHERE user_id = _user_id
    AND tenant_id = _tenant_id
    AND status = 'active'
  LIMIT 1
$$;

-- ============================================================================
-- SECTION 5: RLS POLICIES FOR TENANTS
-- ============================================================================

-- Tenants: Users can view tenants they are members of
CREATE POLICY "Users can view their tenants"
  ON public.tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.memberships
      WHERE memberships.tenant_id = tenants.id
        AND memberships.user_id = auth.uid()
        AND memberships.status = 'active'
    )
  );

-- Tenants: Users can create new tenants (they become owner)
CREATE POLICY "Users can create tenants"
  ON public.tenants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tenants: Owners and admins can update tenants
CREATE POLICY "Owners and admins can update tenants"
  ON public.tenants
  FOR UPDATE
  TO authenticated
  USING (
    public.is_tenant_admin(auth.uid(), id)
  );

-- Tenants: Only owners can delete tenants
CREATE POLICY "Owners can delete tenants"
  ON public.tenants
  FOR DELETE
  TO authenticated
  USING (
    public.has_tenant_role(auth.uid(), id, 'owner')
  );

-- ============================================================================
-- SECTION 6: RLS POLICIES FOR MEMBERSHIPS
-- ============================================================================

-- Memberships: Users can view memberships of their tenants
CREATE POLICY "Users can view memberships of their tenants"
  ON public.memberships
  FOR SELECT
  TO authenticated
  USING (
    public.is_tenant_member(auth.uid(), tenant_id)
  );

-- Memberships: Owners and admins can create memberships
CREATE POLICY "Owners and admins can create memberships"
  ON public.memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Memberships: Owners and admins can update memberships
CREATE POLICY "Owners and admins can update memberships"
  ON public.memberships
  FOR UPDATE
  TO authenticated
  USING (
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- Memberships: Owners and admins can delete memberships
CREATE POLICY "Owners and admins can delete memberships"
  ON public.memberships
  FOR DELETE
  TO authenticated
  USING (
    public.is_tenant_admin(auth.uid(), tenant_id)
  );

-- ============================================================================
-- SECTION 7: UPDATE RLS POLICIES FOR USER DATA (TENANT-SCOPED)
-- ============================================================================

-- Drop existing policies and recreate with tenant checks
-- We'll update the main data tables to include tenant_id checks

-- METRICS: Update policies to include tenant check
DROP POLICY IF EXISTS "Users can view own metrics" ON public.metrics;
CREATE POLICY "Users can view metrics in their tenants"
  ON public.metrics
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND 
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can insert own metrics" ON public.metrics;
CREATE POLICY "Users can insert metrics in their tenants"
  ON public.metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own metrics" ON public.metrics;
CREATE POLICY "Users can update metrics in their tenants"
  ON public.metrics
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own metrics" ON public.metrics;
CREATE POLICY "Users can delete metrics in their tenants"
  ON public.metrics
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- ULTRA_METRICS: Update policies
DROP POLICY IF EXISTS "Users can view own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can view ultra metrics in their tenants"
  ON public.ultra_metrics
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can insert own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can insert ultra metrics in their tenants"
  ON public.ultra_metrics
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can update ultra metrics in their tenants"
  ON public.ultra_metrics
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own ultra metrics" ON public.ultra_metrics;
CREATE POLICY "Users can delete ultra metrics in their tenants"
  ON public.ultra_metrics
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- LOGS: Update policies
DROP POLICY IF EXISTS "Users can view own logs" ON public.logs;
CREATE POLICY "Users can view logs in their tenants"
  ON public.logs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can insert own logs" ON public.logs;
CREATE POLICY "Users can insert logs in their tenants"
  ON public.logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own logs" ON public.logs;
CREATE POLICY "Users can update logs in their tenants"
  ON public.logs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own logs" ON public.logs;
CREATE POLICY "Users can delete logs in their tenants"
  ON public.logs
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- PROJECTS: Update policies
DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
CREATE POLICY "Users can view projects in their tenants"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can insert own projects" ON public.projects;
CREATE POLICY "Users can insert projects in their tenants"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
CREATE POLICY "Users can update projects in their tenants"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;
CREATE POLICY "Users can delete projects in their tenants"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- HABITS: Update policies
DROP POLICY IF EXISTS "Users can view own habits" ON public.habits;
CREATE POLICY "Users can view habits in their tenants"
  ON public.habits
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can insert own habits" ON public.habits;
CREATE POLICY "Users can insert habits in their tenants"
  ON public.habits
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own habits" ON public.habits;
CREATE POLICY "Users can update habits in their tenants"
  ON public.habits
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own habits" ON public.habits;
CREATE POLICY "Users can delete habits in their tenants"
  ON public.habits
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- CALENDAR_ENTRIES: Update policies
DROP POLICY IF EXISTS "Users can view own calendar entries" ON public.calendar_entries;
CREATE POLICY "Users can view calendar entries in their tenants"
  ON public.calendar_entries
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can insert own calendar entries" ON public.calendar_entries;
CREATE POLICY "Users can insert calendar entries in their tenants"
  ON public.calendar_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can update own calendar entries" ON public.calendar_entries;
CREATE POLICY "Users can update calendar entries in their tenants"
  ON public.calendar_entries
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

DROP POLICY IF EXISTS "Users can delete own calendar entries" ON public.calendar_entries;
CREATE POLICY "Users can delete calendar entries in their tenants"
  ON public.calendar_entries
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid() AND
    (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );

-- ============================================================================
-- SECTION 8: TRIGGERS FOR AUTOMATIC TENANT CREATION
-- ============================================================================

-- Function: Auto-create personal tenant when user signs up
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
  -- Generate unique slug from user email
  user_slug := LOWER(REGEXP_REPLACE(
    SPLIT_PART(NEW.email, '@', 1),
    '[^a-z0-9]',
    '-',
    'g'
  ));
  
  -- Ensure slug is unique by appending random suffix if needed
  WHILE EXISTS (SELECT 1 FROM public.tenants WHERE slug = user_slug) LOOP
    user_slug := user_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
  END LOOP;
  
  -- Create personal tenant
  INSERT INTO public.tenants (name, slug, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Workspace'),
    user_slug,
    'free'
  )
  RETURNING id INTO new_tenant_id;
  
  -- Create owner membership
  INSERT INTO public.memberships (user_id, tenant_id, role, status)
  VALUES (NEW.id, new_tenant_id, 'owner', 'active');
  
  RETURN NEW;
END;
$$;

-- Trigger: Create personal tenant on user creation
CREATE TRIGGER on_auth_user_created_create_tenant
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_personal_tenant();

-- ============================================================================
-- SECTION 9: UPDATE TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- Add updated_at trigger for tenants
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for memberships
CREATE TRIGGER update_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 10: COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE public.tenants IS 'Workspaces/organizations that users belong to. Each tenant is an isolated environment.';
COMMENT ON TABLE public.memberships IS 'User-tenant relationships with roles and status. Defines who can access what tenant and with what permissions.';
COMMENT ON COLUMN public.tenants.slug IS 'URL-friendly unique identifier for the tenant (e.g., magaya-family)';
COMMENT ON COLUMN public.tenants.plan IS 'Subscription plan: free, starter, pro, or enterprise';
COMMENT ON COLUMN public.memberships.role IS 'User role within tenant: owner (full control), admin (manage users), member (CRUD own data), viewer (read-only)';
COMMENT ON COLUMN public.memberships.status IS 'Membership status: pending (invited), active (accepted), revoked (removed)';
COMMENT ON FUNCTION public.is_tenant_member IS 'Check if user has active membership in tenant';
COMMENT ON FUNCTION public.has_tenant_role IS 'Check if user has specific role in tenant';
COMMENT ON FUNCTION public.is_tenant_admin IS 'Check if user is owner or admin of tenant';
COMMENT ON FUNCTION public.get_user_tenant_role IS 'Get user role in specific tenant';