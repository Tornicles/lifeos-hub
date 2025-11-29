-- Drop and recreate admin views
DROP VIEW IF EXISTS public.admin_user_stats CASCADE;
DROP VIEW IF EXISTS public.admin_metrics_overview CASCADE;

CREATE VIEW public.admin_user_stats AS
SELECT
  (SELECT COUNT(*) FROM auth.users) AS total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE) AS new_users_today,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS new_users_week,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_users_month,
  (SELECT COUNT(*) FROM public.tenants) AS total_tenants,
  (SELECT COUNT(*) FROM public.tenants WHERE plan = 'starter') AS starter_subscribers,
  (SELECT COUNT(*) FROM public.tenants WHERE plan = 'pro') AS pro_subscribers,
  (SELECT COUNT(*) FROM public.tenants WHERE plan = 'enterprise') AS enterprise_subscribers;

CREATE VIEW public.admin_metrics_overview AS
SELECT
  (SELECT COUNT(DISTINCT user_id) FROM public.logs WHERE log_date >= CURRENT_DATE - INTERVAL '30 days') AS active_users,
  (SELECT COUNT(*) FROM public.logs WHERE log_date = CURRENT_DATE) AS logs_today,
  (SELECT COUNT(*) FROM public.logs) AS total_logs,
  (SELECT COUNT(DISTINCT hub_id) FROM public.logs) AS active_hubs,
  (SELECT AVG(ultra_score) FROM public.system_state_daily WHERE state_date >= CURRENT_DATE - INTERVAL '7 days') AS avg_ultra_score;

-- Seed hubs and domains
INSERT INTO public.hubs (code, name, category) VALUES
  ('FIN', 'Finance', 'Life Management'),
  ('HLT', 'Health', 'Life Management'),
  ('WRK', 'Work', 'Career & Purpose'),
  ('ACD', 'Academy', 'Growth & Learning'),
  ('PD', 'Personal Development', 'Growth & Learning'),
  ('HH', 'Household', 'Life Management'),
  ('REL', 'Relationships', 'Social & Emotional'),
  ('PRJ', 'Projects', 'Career & Purpose'),
  ('MND', 'Mindset', 'Growth & Learning')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ultra_domains (code, name, description) VALUES
  ('SPI', 'Spirituality', 'Connection to purpose, meaning, and inner peace'),
  ('CAR', 'Career Master', 'Professional excellence and career advancement'),
  ('SOC', 'Social Life', 'Quality of relationships and social connections'),
  ('EMO', 'Emotional Intelligence', 'Self-awareness and emotional regulation'),
  ('BRD', 'Personal Branding & Online Influence', 'Digital presence and reputation'),
  ('FIT', 'Fitness Performance', 'Physical health and athletic capability'),
  ('DAT', 'Dating & Attraction', 'Romantic relationships and social magnetism')
ON CONFLICT (code) DO NOTHING;