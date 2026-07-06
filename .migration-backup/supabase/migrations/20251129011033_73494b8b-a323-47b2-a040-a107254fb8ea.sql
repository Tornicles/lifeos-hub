-- Create admin_settings table for system-wide admin configuration
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins and owners can view admin settings
CREATE POLICY "Admins can view admin settings"
ON public.admin_settings
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- Only admins and owners can update admin settings
CREATE POLICY "Admins can update admin settings"
ON public.admin_settings
FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'owner'::app_role)
);

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'admin'::app_role) OR public.has_role(_user_id, 'owner'::app_role)
$$;

-- Create view for admin user statistics
CREATE OR REPLACE VIEW public.admin_user_stats AS
SELECT
  COUNT(DISTINCT p.id) as total_users,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '1 day' THEN p.id END) as new_users_today,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN p.id END) as new_users_week,
  COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '30 days' THEN p.id END) as new_users_month,
  COUNT(DISTINCT m.tenant_id) as total_tenants,
  COUNT(DISTINCT CASE WHEN t.plan = 'starter' THEN t.id END) as starter_subscribers,
  COUNT(DISTINCT CASE WHEN t.plan = 'pro' THEN t.id END) as pro_subscribers,
  COUNT(DISTINCT CASE WHEN t.plan = 'enterprise' THEN t.id END) as enterprise_subscribers
FROM public.profiles p
LEFT JOIN public.memberships m ON m.user_id = p.id AND m.status = 'active'
LEFT JOIN public.tenants t ON t.id = m.tenant_id;

-- Create view for admin metrics overview
CREATE OR REPLACE VIEW public.admin_metrics_overview AS
SELECT
  COUNT(*) as total_logs,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(CASE WHEN log_date >= CURRENT_DATE THEN 1 END) as logs_today,
  AVG(value) FILTER (WHERE metric = 'ultra_score') as avg_ultra_score,
  COUNT(DISTINCT hub_id) as active_hubs
FROM public.logs
WHERE log_date >= CURRENT_DATE - INTERVAL '30 days';

-- Grant access to admin views for admins
GRANT SELECT ON public.admin_user_stats TO authenticated;
GRANT SELECT ON public.admin_metrics_overview TO authenticated;