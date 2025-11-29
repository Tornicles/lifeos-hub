-- RLS Policies for Core User Tables
-- Tenants
CREATE POLICY "Users can view their tenants" ON public.tenants
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.memberships WHERE tenant_id = tenants.id AND user_id = auth.uid() AND status = 'active'));

CREATE POLICY "Users can create tenants" ON public.tenants
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Owners and admins can update tenants" ON public.tenants
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), id));

CREATE POLICY "Owners can delete tenants" ON public.tenants
  FOR DELETE USING (public.has_tenant_role(auth.uid(), id, 'owner'));

-- Profiles
CREATE POLICY "Users can view own profile only" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Owners can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_owner(auth.uid()));

CREATE POLICY "Owners can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_owner(auth.uid()));

CREATE POLICY "Owners can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_owner(auth.uid()));

-- Memberships
CREATE POLICY "Users can view memberships" ON public.memberships
  FOR SELECT USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can create memberships" ON public.memberships
  FOR INSERT WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Admins can update memberships" ON public.memberships
  FOR UPDATE USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE POLICY "Admins can delete memberships" ON public.memberships
  FOR DELETE USING (public.is_tenant_admin(auth.uid(), tenant_id));

-- Security Settings
CREATE POLICY "Users can view own security settings" ON public.security_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security settings" ON public.security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security settings" ON public.security_settings
  FOR UPDATE USING (auth.uid() = user_id);