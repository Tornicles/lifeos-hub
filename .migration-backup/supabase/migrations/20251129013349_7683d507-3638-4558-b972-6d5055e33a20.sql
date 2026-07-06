-- Create automation_trigger_events table for tracking all automation triggers
CREATE TABLE IF NOT EXISTS public.automation_trigger_events (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL, -- 'SCORE_UPDATED', 'LOG_CREATED', 'HABIT_CHECKIN', 'TIME_BASED', 'PATTERN_DETECTED'
  trigger_source TEXT NOT NULL, -- 'ultra_score', 'hub_score', 'log', 'habit', 'calendar', 'scheduled'
  trigger_data JSONB, -- Additional context data
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_action_queue table for queuing and processing actions
CREATE TABLE IF NOT EXISTS public.automation_action_queue (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'NOTIFICATION', 'CALENDAR_CREATE', 'TASK_CREATE', 'STATE_UPDATE', 'HABIT_SUGGEST'
  action_payload JSONB NOT NULL,
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high, 4=critical
  status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create automation_logs table for comprehensive audit trail
CREATE TABLE IF NOT EXISTS public.automation_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rule_id BIGINT REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL, -- 'RULE_TRIGGERED', 'ACTION_EXECUTED', 'CONFLICT_DETECTED', 'ERROR_OCCURRED'
  severity TEXT DEFAULT 'INFO', -- 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
  message TEXT NOT NULL,
  context_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_automation_settings table for user preferences
CREATE TABLE IF NOT EXISTS public.user_automation_settings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  enabled_categories JSONB DEFAULT '["score_alerts", "habit_suggestions", "calendar_autofill", "task_generation", "state_updates"]'::jsonb,
  notification_preferences JSONB DEFAULT '{"email": true, "push": false, "in_app": true}'::jsonb,
  quiet_hours JSONB DEFAULT '{"enabled": false, "start": "22:00", "end": "07:00"}'::jsonb,
  automation_enabled BOOLEAN DEFAULT TRUE,
  max_daily_actions INTEGER DEFAULT 20,
  priority_override TEXT, -- User can manually set priority hub
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add priority and conflict_group columns to automation_rules
ALTER TABLE public.automation_rules 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS conflict_group TEXT,
ADD COLUMN IF NOT EXISTS requires_user_confirmation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_user_id ON public.automation_trigger_events(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_processed ON public.automation_trigger_events(processed);
CREATE INDEX IF NOT EXISTS idx_automation_trigger_events_triggered_at ON public.automation_trigger_events(triggered_at);

CREATE INDEX IF NOT EXISTS idx_automation_action_queue_user_id ON public.automation_action_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_status ON public.automation_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_priority ON public.automation_action_queue(priority DESC);
CREATE INDEX IF NOT EXISTS idx_automation_action_queue_scheduled_for ON public.automation_action_queue(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_automation_logs_user_id ON public.automation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id ON public.automation_logs(rule_id);
CREATE INDEX IF NOT EXISTS idx_automation_logs_event_type ON public.automation_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_automation_logs_created_at ON public.automation_logs(created_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.automation_trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_automation_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_trigger_events
CREATE POLICY "Users can view own trigger events" ON public.automation_trigger_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert trigger events" ON public.automation_trigger_events
  FOR INSERT WITH CHECK (true);

-- RLS Policies for automation_action_queue
CREATE POLICY "Users can view own action queue" ON public.automation_action_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage action queue" ON public.automation_action_queue
  FOR ALL USING (true);

-- RLS Policies for automation_logs
CREATE POLICY "Users can view own automation logs" ON public.automation_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert automation logs" ON public.automation_logs
  FOR INSERT WITH CHECK (true);

-- RLS Policies for user_automation_settings
CREATE POLICY "Users can view own automation settings" ON public.user_automation_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own automation settings" ON public.user_automation_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation settings" ON public.user_automation_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_automation_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_action_queue_timestamp
  BEFORE UPDATE ON public.automation_action_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_timestamps();

CREATE TRIGGER update_user_automation_settings_timestamp
  BEFORE UPDATE ON public.user_automation_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_timestamps();