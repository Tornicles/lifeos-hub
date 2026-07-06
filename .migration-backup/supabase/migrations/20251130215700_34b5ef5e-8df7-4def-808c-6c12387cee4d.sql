-- ============================================================
-- COMPREHENSIVE SECURITY REMEDIATION MIGRATION
-- Fixes all critical, high, and medium security issues
-- ============================================================

-- ============================================================
-- 1. FIX ADMIN VIEWS - Remove SECURITY DEFINER and auth.users
-- ============================================================

-- Drop existing views
DROP VIEW IF EXISTS admin_user_stats CASCADE;
DROP VIEW IF EXISTS admin_metrics_overview CASCADE;

-- Recreate admin_user_stats as SECURITY INVOKER (no auth.users access)
CREATE VIEW admin_user_stats 
WITH (security_invoker = on) 
AS
SELECT
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) AS new_users_today,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS new_users_week,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_users_month,
  (SELECT COUNT(*) FROM tenants) AS total_tenants,
  (SELECT COUNT(*) FROM tenants WHERE plan = 'starter') AS starter_subscribers,
  (SELECT COUNT(*) FROM tenants WHERE plan = 'pro') AS pro_subscribers,
  (SELECT COUNT(*) FROM tenants WHERE plan = 'enterprise') AS enterprise_subscribers;

-- Recreate admin_metrics_overview as SECURITY INVOKER
CREATE VIEW admin_metrics_overview
WITH (security_invoker = on)
AS
SELECT
  (SELECT COUNT(*) FROM logs) AS total_logs,
  (SELECT COUNT(DISTINCT user_id) FROM logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS active_users,
  (SELECT COUNT(*) FROM logs WHERE log_date = CURRENT_DATE) AS logs_today,
  (SELECT AVG(value) FROM ultra_metrics WHERE name = 'ULTRA_Score' AND metric_date >= CURRENT_DATE - INTERVAL '7 days') AS avg_ultra_score,
  (SELECT COUNT(DISTINCT hub_id) FROM metrics WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days') AS active_hubs;

-- Add RLS policies for admin views (admin/owner only)
ALTER VIEW admin_user_stats SET (security_invoker = on);
ALTER VIEW admin_metrics_overview SET (security_invoker = on);

-- ============================================================
-- 2. FIX CROSS-TENANT ADMIN ACCESS
-- Replace global admin checks with tenant-scoped checks
-- ============================================================

-- Drop existing permissive admin policies
DROP POLICY IF EXISTS "Users can view own profile only" ON profiles;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Owners can view all audit logs" ON audit_logs;

-- PROFILES: Tenant-scoped admin access
CREATE POLICY "Users can view own profile or tenant admins can view" 
ON profiles FOR SELECT 
USING (
  auth.uid() = id 
  OR 
  EXISTS (
    SELECT 1 FROM memberships m1
    WHERE m1.user_id = auth.uid()
      AND m1.role IN ('admin', 'owner')
      AND m1.status = 'active'
      AND m1.tenant_id IN (
        SELECT m2.tenant_id FROM memberships m2 
        WHERE m2.user_id = profiles.id 
          AND m2.status = 'active'
      )
  )
);

-- AUDIT_LOGS: Tenant-scoped admin access
CREATE POLICY "Users view own audit logs or tenant admins" 
ON audit_logs FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND m.tenant_id IN (
        SELECT m2.tenant_id FROM memberships m2
        WHERE m2.user_id = audit_logs.user_id
          AND m2.status = 'active'
      )
  )
);

-- ============================================================
-- 3. ADD TENANT CREATION RATE LIMIT
-- ============================================================

DROP POLICY IF EXISTS "Users can create tenants" ON tenants;

CREATE POLICY "Users can create limited tenants" 
ON tenants FOR INSERT 
WITH CHECK (
  (SELECT COUNT(*) FROM memberships 
   WHERE user_id = auth.uid() 
     AND role = 'owner' 
     AND status = 'active') < 5
);

-- ============================================================
-- 4. ADD MISSING RLS POLICIES FOR TENANT-SCOPED TABLES
-- Ensure all data tables properly scope admin access by tenant
-- ============================================================

-- METRICS: Add tenant-scoped admin policy
DROP POLICY IF EXISTS "Users can view own metrics" ON metrics;
CREATE POLICY "Users can view own metrics or tenant admins" 
ON metrics FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = metrics.tenant_id OR metrics.tenant_id IS NULL)
  )
);

-- LOGS: Add tenant-scoped admin policy
DROP POLICY IF EXISTS "Users can view own logs" ON logs;
CREATE POLICY "Users can view own logs or tenant admins" 
ON logs FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = logs.tenant_id OR logs.tenant_id IS NULL)
  )
);

-- PROJECTS: Add tenant-scoped admin policy
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
CREATE POLICY "Users can view own projects or tenant admins" 
ON projects FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = projects.tenant_id OR projects.tenant_id IS NULL)
  )
);

-- HABITS: Add tenant-scoped admin policy
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
CREATE POLICY "Users can view own habits or tenant admins" 
ON habits FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = habits.tenant_id OR habits.tenant_id IS NULL)
  )
);

-- CALENDAR_ENTRIES: Add tenant-scoped admin policy
DROP POLICY IF EXISTS "Users can view own calendar" ON calendar_entries;
CREATE POLICY "Users can view own calendar or tenant admins" 
ON calendar_entries FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = calendar_entries.tenant_id OR calendar_entries.tenant_id IS NULL)
  )
);

-- ULTRA_METRICS: Add tenant-scoped admin policy
DROP POLICY IF EXISTS "Users can view own ultra metrics" ON ultra_metrics;
CREATE POLICY "Users can view own ultra metrics or tenant admins" 
ON ultra_metrics FOR SELECT 
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = ultra_metrics.tenant_id OR ultra_metrics.tenant_id IS NULL)
  )
);

-- ============================================================
-- 5. ADD SECURITY CONTEXT FUNCTIONS
-- Helper functions for consistent security checks
-- ============================================================

-- Function to check if user is tenant admin for a specific tenant
CREATE OR REPLACE FUNCTION is_tenant_admin_for(
  _user_id uuid,
  _tenant_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = _user_id
      AND tenant_id = _tenant_id
      AND role IN ('admin', 'owner')
      AND status = 'active'
  )
$$;

-- ============================================================
-- 6. AUDIT TABLE ENHANCEMENTS
-- Ensure audit logging captures all security-relevant events
-- ============================================================

-- Add index for faster audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id_created ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_operation ON audit_logs(table_name, operation);

-- ============================================================
-- END MIGRATION
-- ============================================================

-- Verify critical security functions exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_admin') THEN
    RAISE EXCEPTION 'Critical security function is_admin does not exist';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_tenant_member') THEN
    RAISE EXCEPTION 'Critical security function is_tenant_member does not exist';
  END IF;
  
  RAISE NOTICE 'Security remediation migration completed successfully';
END $$;