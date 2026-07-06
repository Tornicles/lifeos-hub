-- Seed Initial Data
INSERT INTO public.hubs (name, code, category, is_active) VALUES
  ('Finance', 'FIN', 'Financial', true),
  ('Health', 'HEA', 'Wellness', true),
  ('Work', 'WOR', 'Professional', true),
  ('Academy', 'ACA', 'Learning', true),
  ('Personal Development', 'PER', 'Growth', true),
  ('Household', 'HOU', 'Living', true),
  ('Relationships', 'REL', 'Social', true),
  ('Projects', 'PRO', 'Productivity', true),
  ('Mindset', 'MIN', 'Mental', true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.ultra_domains (name, code, description) VALUES
  ('Spirituality', 'SPI', 'Spiritual growth and inner peace'),
  ('Career Master', 'CAR', 'Professional excellence and career advancement'),
  ('Social Life', 'SOC', 'Relationships and social connections'),
  ('Emotional Intelligence', 'EMO', 'Emotional awareness and regulation'),
  ('Personal Branding & Online Influence', 'BRA', 'Online presence and influence'),
  ('Fitness Performance', 'FIT', 'Physical health and fitness'),
  ('Dating & Attraction', 'DAT', 'Romantic relationships and attraction')
ON CONFLICT (code) DO NOTHING;