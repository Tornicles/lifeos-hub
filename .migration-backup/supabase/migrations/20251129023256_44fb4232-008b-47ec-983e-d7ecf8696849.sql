-- Performance Optimization: Add Strategic Indexes
-- Note: These are created without CONCURRENTLY to work in migrations
-- For large tables in production, consider creating manually with CONCURRENTLY

-- Core user/tenant filtering indexes
CREATE INDEX IF NOT EXISTS idx_logs_user_tenant_date 
  ON logs(user_id, tenant_id, log_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_user_tenant_date 
  ON metrics(user_id, tenant_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_ultra_metrics_user_tenant_date 
  ON ultra_metrics(user_id, tenant_id, metric_date DESC);

CREATE INDEX IF NOT EXISTS idx_habits_user_tenant 
  ON habits(user_id, tenant_id) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_user_tenant_status 
  ON projects(user_id, tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_calendar_user_tenant_date 
  ON calendar_entries(user_id, tenant_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_automation_rules_active 
  ON automation_rules(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_automation_action_queue_status 
  ON automation_action_queue(user_id, status, scheduled_for) 
  WHERE status IN ('PENDING', 'PROCESSING');

CREATE INDEX IF NOT EXISTS idx_automation_logs_user_created 
  ON automation_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_habits_streak 
  ON habits(user_id, streak DESC) WHERE streak > 0;

CREATE INDEX IF NOT EXISTS idx_habit_checkins_date 
  ON habit_checkins(habit_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, created_at DESC) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_tasks_project_status 
  ON tasks(project_id, status);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date 
  ON tasks(due_date) WHERE status != 'Done';

CREATE INDEX IF NOT EXISTS idx_system_state_user_date 
  ON system_state_daily(user_id, state_date DESC);

CREATE INDEX IF NOT EXISTS idx_metrics_hub_date 
  ON metrics(hub_id, metric_date DESC) WHERE hub_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_logs_hub_date 
  ON logs(hub_id, log_date DESC) WHERE hub_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created 
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memberships_tenant_status 
  ON memberships(tenant_id, status) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_ultra_metrics_domain_date 
  ON ultra_metrics(domain_id, metric_date DESC, user_id) WHERE domain_id IS NOT NULL;