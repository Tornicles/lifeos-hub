-- RLS Policies for Projects and Tasks
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can insert own projects" ON public.projects
  FOR INSERT WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can view own project tasks" ON public.tasks
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND user_id = auth.uid()));

CREATE POLICY "Users can insert tasks into own projects" ON public.tasks
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND user_id = auth.uid()));

CREATE POLICY "Users can update own project tasks" ON public.tasks
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND user_id = auth.uid()));

CREATE POLICY "Users can delete own project tasks" ON public.tasks
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.projects WHERE id = tasks.project_id AND user_id = auth.uid()));