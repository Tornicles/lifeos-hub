-- RLS Policies for ALL Remaining Tables

-- Habits and Calendar
CREATE POLICY "Users can view own habits" ON public.habits
  FOR SELECT USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));
CREATE POLICY "Users can insert own habits" ON public.habits
  FOR INSERT WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));
CREATE POLICY "Users can update own habits" ON public.habits
  FOR UPDATE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));
CREATE POLICY "Users can delete own habits" ON public.habits
  FOR DELETE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can view own habit checkins" ON public.habit_checkins
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.habits WHERE id = habit_checkins.habit_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert own habit checkins" ON public.habit_checkins
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.habits WHERE id = habit_checkins.habit_id AND user_id = auth.uid()));
CREATE POLICY "Users can update own habit checkins" ON public.habit_checkins
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.habits WHERE id = habit_checkins.habit_id AND user_id = auth.uid()));
CREATE POLICY "Users can delete own habit checkins" ON public.habit_checkins
  FOR DELETE USING (EXISTS (SELECT 1 FROM public.habits WHERE id = habit_checkins.habit_id AND user_id = auth.uid()));

CREATE POLICY "Users can view own calendar" ON public.calendar_entries
  FOR SELECT USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));
CREATE POLICY "Users can insert own calendar" ON public.calendar_entries
  FOR INSERT WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));
CREATE POLICY "Users can update own calendar" ON public.calendar_entries
  FOR UPDATE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));
CREATE POLICY "Users can delete own calendar" ON public.calendar_entries
  FOR DELETE USING (user_id = auth.uid() AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id)));

CREATE POLICY "Users can view own system state" ON public.system_state_daily
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own system state" ON public.system_state_daily
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own system state" ON public.system_state_daily
  FOR UPDATE USING (user_id = auth.uid());

-- Automation Tables
CREATE POLICY "All can view automation rules" ON public.automation_rules
  FOR SELECT USING (true);

CREATE POLICY "All can view rule conditions" ON public.automation_rule_conditions
  FOR SELECT USING (true);

CREATE POLICY "All can view rule actions" ON public.automation_rule_actions
  FOR SELECT USING (true);

CREATE POLICY "Users can view own executions" ON public.automation_executions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own executions" ON public.automation_executions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own trigger events" ON public.automation_trigger_events
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert trigger events" ON public.automation_trigger_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own action queue" ON public.automation_action_queue
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can manage action queue" ON public.automation_action_queue
  FOR ALL USING (true);

CREATE POLICY "Users can view own automation logs" ON public.automation_logs
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert automation logs" ON public.automation_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own cache" ON public.automation_context_cache
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own cache" ON public.automation_context_cache
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own cache" ON public.automation_context_cache
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own cache" ON public.automation_context_cache
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own automation settings" ON public.user_automation_settings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own automation settings" ON public.user_automation_settings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own automation settings" ON public.user_automation_settings
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own auto actions" ON public.auto_actions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own auto actions" ON public.auto_actions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own auto actions" ON public.auto_actions
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own auto actions" ON public.auto_actions
  FOR DELETE USING (user_id = auth.uid());

-- Notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notifications" ON public.notifications
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own notifications" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view own notification prefs" ON public.notification_preferences
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own notification prefs" ON public.notification_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own notification prefs" ON public.notification_preferences
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can view own warnings" ON public.state_warnings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own warnings" ON public.state_warnings
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own warnings" ON public.state_warnings
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own warnings" ON public.state_warnings
  FOR DELETE USING (user_id = auth.uid());

-- Admin Tables
CREATE POLICY "Admins can view admin settings" ON public.admin_settings
  FOR SELECT USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'));
CREATE POLICY "Admins can update admin settings" ON public.admin_settings
  FOR ALL USING (public.is_admin(auth.uid()) OR public.has_role(auth.uid(), 'owner'));

CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_admin(auth.uid()));
CREATE POLICY "Owners can view all audit logs" ON public.audit_logs
  FOR SELECT USING (public.is_owner(auth.uid()));
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);