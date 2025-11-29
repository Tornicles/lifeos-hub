-- =====================================================
-- LIFEOS v30 - PART 5: SEED DATA
-- =====================================================

-- Insert Life Hubs (9 core life areas)
INSERT INTO public.hubs (name, code, category) VALUES
  ('Finance', 'FIN', 'Resource'),
  ('Health', 'HEA', 'Wellbeing'),
  ('Work', 'WRK', 'Professional'),
  ('Academy', 'ACA', 'Growth'),
  ('Personal Development', 'PER', 'Growth'),
  ('Household', 'HOU', 'Environment'),
  ('Relationships', 'REL', 'Social'),
  ('Projects', 'PRO', 'Output'),
  ('Mindset', 'MIN', 'Mental')
ON CONFLICT (code) DO NOTHING;

-- Insert Ultra Domains (7 composite score dimensions)
INSERT INTO public.ultra_domains (name, code, description) VALUES
  ('Spirituality', 'SPI', 'Inner peace, purpose, and spiritual alignment'),
  ('Career Master', 'CAR', 'Professional excellence and career trajectory'),
  ('Social Life', 'SOC', 'Social connections, friendships, and community'),
  ('Emotional Intelligence', 'EMO', 'Self-awareness, regulation, and empathy'),
  ('Personal Branding & Online Influence', 'BRA', 'Digital presence and influence'),
  ('Fitness Performance', 'FIT', 'Physical health, strength, and athleticism'),
  ('Dating & Attraction', 'DAT', 'Romantic relationships and attraction')
ON CONFLICT (code) DO NOTHING;