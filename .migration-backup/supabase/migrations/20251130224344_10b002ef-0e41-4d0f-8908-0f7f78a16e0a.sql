-- Fix admin views to use SECURITY INVOKER (CRITICAL SECURITY FIX)
-- Views inherit RLS from underlying tables, no need for policies on views

-- Drop existing views
DROP VIEW IF EXISTS admin_user_stats CASCADE;
DROP VIEW IF EXISTS admin_metrics_overview CASCADE;

-- Recreate admin_user_stats with SECURITY INVOKER
CREATE OR REPLACE VIEW admin_user_stats
WITH (security_invoker = on) AS
SELECT 
  (SELECT COUNT(*) FROM profiles) AS total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE) AS new_users_today,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS new_users_week,
  (SELECT COUNT(*) FROM profiles WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_users_month,
  (SELECT COUNT(*) FROM tenants) AS total_tenants,
  (SELECT COUNT(*) FROM tenants WHERE plan = 'starter') AS starter_subscribers,
  (SELECT COUNT(*) FROM tenants WHERE plan = 'pro') AS pro_subscribers,
  (SELECT COUNT(*) FROM tenants WHERE plan = 'enterprise') AS enterprise_subscribers;

-- Recreate admin_metrics_overview with SECURITY INVOKER
CREATE OR REPLACE VIEW admin_metrics_overview  
WITH (security_invoker = on) AS
SELECT 
  (SELECT COUNT(*) FROM logs) AS total_logs,
  (SELECT COUNT(DISTINCT user_id) FROM logs WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS active_users,
  (SELECT COUNT(*) FROM logs WHERE log_date = CURRENT_DATE) AS logs_today,
  (SELECT AVG(value) FROM ultra_metrics WHERE name = 'ULTRA_Score' AND metric_date >= CURRENT_DATE - INTERVAL '7 days') AS avg_ultra_score,
  (SELECT COUNT(DISTINCT hub_id) FROM metrics WHERE metric_date >= CURRENT_DATE - INTERVAL '7 days') AS active_hubs;

-- Add helpful comments
COMMENT ON VIEW admin_user_stats IS 'Admin dashboard user statistics - uses SECURITY INVOKER to enforce RLS from underlying tables';
COMMENT ON VIEW admin_metrics_overview IS 'Admin dashboard metrics overview - uses SECURITY INVOKER to enforce RLS from underlying tables';