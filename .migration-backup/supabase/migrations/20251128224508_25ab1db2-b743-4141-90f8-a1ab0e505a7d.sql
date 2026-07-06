-- Seed initial automation rules
INSERT INTO automation_rules (name, description, condition_type, condition_value, action_target, action_value, is_active) VALUES
  ('Ultra Crisis Alert', 'Emergency mode when Ultra Score drops below 40', 'ULTRA_BELOW', 40, 'FocusDomain', 'WeakestHub', true),
  ('Multiple Hubs in Danger', 'Critical system alert when 3+ hubs are in danger zone', 'HUBS_IN_DANGER', 3, 'CriticalAlert', 'SystemCritical', true),
  ('Health Priority Trigger', 'Focus on health when hub score drops critically', 'HUB_BELOW', 30, 'PriorityHub', 'HEALTH', true),
  ('Ultra Excellence Mode', 'Maintain high performance when Ultra Score is excellent', 'ULTRA_ABOVE', 80, 'MaintainMomentum', 'Continue', true)
ON CONFLICT DO NOTHING;

-- Seed hubs data
INSERT INTO hubs (code, name, category, is_active) VALUES
  ('FINANCE', 'Finance', 'Core', true),
  ('HEALTH', 'Health', 'Core', true),
  ('WORK', 'Work / Business', 'Core', true),
  ('ACADEMY', 'Academy', 'Core', true),
  ('PERSONAL_DEV', 'Personal Development', 'Core', true),
  ('HOUSEHOLD', 'Household', 'Core', true),
  ('RELATIONSHIPS', 'Relationships', 'Core', true),
  ('PROJECTS', 'Projects', 'Core', true),
  ('MINDSET', 'Mindset', 'Core', true)
ON CONFLICT (code) DO NOTHING;

-- Seed ultra domains
INSERT INTO ultra_domains (code, name, description) VALUES
  ('SPIRITUALITY', 'Spirituality', 'Prayer, meditation, faith, and inner peace'),
  ('CAREER_MASTER', 'Career Master', 'Skills, networking, applications, and career growth'),
  ('SOCIAL_LIFE', 'Social Life', 'Connections, events, support given/received, social energy'),
  ('EMOTIONAL_INTELLIGENCE', 'Emotional Intelligence', 'Emotion tracking, triggers, resilience, stress management'),
  ('PERSONAL_BRANDING', 'Personal Branding & Online Influence', 'Content, followers, engagement, brand quality'),
  ('FITNESS_PERFORMANCE', 'Fitness Performance', 'Steps, training, gym sessions, performance metrics'),
  ('DATING_ATTRACTION', 'Dating & Attraction', 'Date interactions, messages, events, attraction scores')
ON CONFLICT (code) DO NOTHING;