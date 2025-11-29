-- RLS Policies for Static Data Tables
-- Hubs (read-only for all authenticated users)
CREATE POLICY "Hubs viewable by all" ON public.hubs
  FOR SELECT USING (true);

-- Ultra Domains (read-only for all authenticated users)
CREATE POLICY "Ultra domains viewable by all" ON public.ultra_domains
  FOR SELECT USING (true);