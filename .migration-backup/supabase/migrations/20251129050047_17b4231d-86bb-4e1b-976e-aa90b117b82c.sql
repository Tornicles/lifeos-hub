-- =====================================================
-- PART 4: ADMIN AND AUDIT TABLES
-- =====================================================

-- Admin Settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_settings_setting_key ON public.admin_settings(setting_key);

-- Audit Logs table
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation ON public.audit_logs(operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- Admin Views for statistics
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
  COUNT(DISTINCT au.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.created_at >= CURRENT_DATE THEN au.id END) as new_users_today,
  COUNT(DISTINCT CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN au.id END) as new_users_week,
  COUNT(DISTINCT CASE WHEN p.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN au.id END) as new_users_month,
  COUNT(DISTINCT t.id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.plan = 'starter' THEN t.id END) as starter_subscribers,
  COUNT(DISTINCT CASE WHEN t.plan = 'pro' THEN t.id END) as pro_subscribers,
  COUNT(DISTINCT CASE WHEN t.plan = 'enterprise' THEN t.id END) as enterprise_subscribers
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
LEFT JOIN public.memberships m ON au.id = m.user_id
LEFT JOIN public.tenants t ON m.tenant_id = t.id;

CREATE OR REPLACE VIEW public.admin_metrics_overview AS
SELECT
  COUNT(DISTINCT l.user_id) as active_users,
  COUNT(DISTINCT CASE WHEN l.created_at >= CURRENT_DATE THEN l.id END) as logs_today,
  COUNT(l.id) as total_logs,
  COUNT(DISTINCT h.id) as active_hubs,
  AVG(um.value) FILTER (WHERE um.name = 'ULTRA_Score' AND um.metric_date >= CURRENT_DATE - INTERVAL '7 days') as avg_ultra_score
FROM public.logs l
LEFT JOIN public.hubs h ON l.hub_id = h.id
LEFT JOIN public.ultra_metrics um ON l.user_id = um.user_id;