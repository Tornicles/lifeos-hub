-- RLS Policies for Data Tables (logs, metrics, ultra_metrics)
CREATE POLICY "Users can view own logs" ON public.logs
  FOR SELECT USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can insert own logs" ON public.logs
  FOR INSERT WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can update own logs" ON public.logs
  FOR UPDATE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can delete own logs" ON public.logs
  FOR DELETE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can view own metrics" ON public.metrics
  FOR SELECT USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can insert own metrics" ON public.metrics
  FOR INSERT WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can update own metrics" ON public.metrics
  FOR UPDATE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can delete own metrics" ON public.metrics
  FOR DELETE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can view own ultra metrics" ON public.ultra_metrics
  FOR SELECT USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can insert own ultra metrics" ON public.ultra_metrics
  FOR INSERT WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can update own ultra metrics" ON public.ultra_metrics
  FOR UPDATE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can delete own ultra metrics" ON public.ultra_metrics
  FOR DELETE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));