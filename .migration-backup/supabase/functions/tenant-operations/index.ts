/**
 * Tenant Operations Edge Function
 * 
 * Handles multi-tenant workspace operations:
 * - List user's tenants
 * - Create new tenant
 * - Get tenant details
 * - Update tenant
 * - Delete tenant (owner only)
 * - Manage memberships
 * 
 * Security: Full RLS enforcement + role-based access control
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  corsHeaders,
  getAuthUser,
  getSupabaseClient,
  handleError,
  createSuccessResponse,
  createErrorResponse,
  validateMethod,
  parseJsonBody,
  logAuditEvent,
  getIpAddress,
  getUserAgent,
  ValidationError,
  PermissionError,
} from '../_shared/security.ts';

// ============================================================================
// TYPES
// ============================================================================

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  updated_at: string;
}

interface Membership {
  id: string;
  user_id: string;
  tenant_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'active' | 'revoked';
  invited_email?: string;
  invited_by?: string;
  created_at: string;
  updated_at: string;
}

interface TenantWithRole extends Tenant {
  role: string;
  member_count?: number;
}

interface CreateTenantRequest {
  name: string;
  slug?: string;
}

interface UpdateTenantRequest {
  name?: string;
}

interface InviteMemberRequest {
  email: string;
  role: 'admin' | 'member' | 'viewer';
}

interface UpdateMemberRoleRequest {
  role: 'owner' | 'admin' | 'member' | 'viewer';
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate unique slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Ensure slug is unique by appending number if needed
 */
async function ensureUniqueSlug(
  supabase: any,
  baseSlug: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    const { data, error } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return slug;
    
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

/**
 * Check if user has specific role in tenant
 */
async function checkTenantRole(
  supabase: any,
  userId: string,
  tenantId: string,
  requiredRole: 'owner' | 'admin'
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('has_tenant_role', {
      _user_id: userId,
      _tenant_id: tenantId,
      _role: requiredRole,
    });
  
  if (error) {
    console.error('Role check error:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Check if user is admin (owner or admin role)
 */
async function checkTenantAdmin(
  supabase: any,
  userId: string,
  tenantId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('is_tenant_admin', {
      _user_id: userId,
      _tenant_id: tenantId,
    });
  
  if (error) {
    console.error('Admin check error:', error);
    return false;
  }
  
  return data === true;
}

// ============================================================================
// ROUTE HANDLERS
// ============================================================================

/**
 * GET /tenant-operations
 * List all tenants where user is member
 */
async function listTenants(
  supabase: any,
  userId: string
): Promise<TenantWithRole[]> {
  // Get tenants with membership info
  const { data: memberships, error: membershipsError } = await supabase
    .from('memberships')
    .select(`
      role,
      tenants (
        id,
        name,
        slug,
        plan,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active');
  
  if (membershipsError) throw membershipsError;
  
  // Transform to flat structure
  const tenantsWithRoles: TenantWithRole[] = memberships.map((m: any) => ({
    ...m.tenants,
    role: m.role,
  }));
  
  // Get member counts for each tenant
  for (const tenant of tenantsWithRoles) {
    const { count, error: countError } = await supabase
      .from('memberships')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .eq('status', 'active');
    
    if (!countError) {
      tenant.member_count = count || 0;
    }
  }
  
  return tenantsWithRoles;
}

/**
 * POST /tenant-operations
 * Create new tenant
 */
async function createTenant(
  supabase: any,
  userId: string,
  request: CreateTenantRequest
): Promise<TenantWithRole> {
  // Validate input
  if (!request.name || request.name.trim().length === 0) {
    throw new ValidationError('Tenant name is required');
  }
  
  if (request.name.length > 100) {
    throw new ValidationError('Tenant name must be 100 characters or less');
  }
  
  // Generate slug
  const baseSlug = request.slug || generateSlug(request.name);
  const slug = await ensureUniqueSlug(supabase, baseSlug);
  
  // Create tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: request.name.trim(),
      slug,
      plan: 'free',
    })
    .select()
    .single();
  
  if (tenantError) throw tenantError;
  
  // Create owner membership
  const { error: membershipError } = await supabase
    .from('memberships')
    .insert({
      user_id: userId,
      tenant_id: tenant.id,
      role: 'owner',
      status: 'active',
    });
  
  if (membershipError) throw membershipError;
  
  return {
    ...tenant,
    role: 'owner',
    member_count: 1,
  };
}

/**
 * GET /tenant-operations?tenant_id=xxx
 * Get tenant details
 */
async function getTenant(
  supabase: any,
  userId: string,
  tenantId: string
): Promise<TenantWithRole> {
  // Get tenant with user's role
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select(`
      role,
      tenants (
        id,
        name,
        slug,
        plan,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();
  
  if (membershipError) {
    throw new PermissionError('Tenant not found or access denied');
  }
  
  // Get member count
  const { count } = await supabase
    .from('memberships')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'active');
  
  return {
    ...membership.tenants,
    role: membership.role,
    member_count: count || 0,
  };
}

/**
 * PATCH /tenant-operations?tenant_id=xxx
 * Update tenant (admin only)
 */
async function updateTenant(
  supabase: any,
  userId: string,
  tenantId: string,
  updates: UpdateTenantRequest
): Promise<Tenant> {
  // Check admin permission
  const isAdmin = await checkTenantAdmin(supabase, userId, tenantId);
  if (!isAdmin) {
    throw new PermissionError('Only owners and admins can update tenant');
  }
  
  // Validate updates
  if (updates.name !== undefined) {
    if (updates.name.trim().length === 0) {
      throw new ValidationError('Tenant name cannot be empty');
    }
    if (updates.name.length > 100) {
      throw new ValidationError('Tenant name must be 100 characters or less');
    }
  }
  
  // Update tenant
  const { data, error } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * DELETE /tenant-operations?tenant_id=xxx
 * Delete tenant (owner only)
 */
async function deleteTenant(
  supabase: any,
  userId: string,
  tenantId: string
): Promise<void> {
  // Check owner permission
  const isOwner = await checkTenantRole(supabase, userId, tenantId, 'owner');
  if (!isOwner) {
    throw new PermissionError('Only tenant owner can delete tenant');
  }
  
  // Delete tenant (CASCADE will delete memberships and data)
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', tenantId);
  
  if (error) throw error;
}

/**
 * GET /tenant-operations/members?tenant_id=xxx
 * List tenant members
 */
async function listMembers(
  supabase: any,
  userId: string,
  tenantId: string
): Promise<any[]> {
  // Check membership
  const { data: userMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single();
  
  if (!userMembership) {
    throw new PermissionError('Not a member of this tenant');
  }
  
  // Get all members with user profiles
  const { data, error } = await supabase
    .from('memberships')
    .select(`
      id,
      user_id,
      role,
      status,
      invited_email,
      created_at,
      profiles:user_id (
        full_name
      )
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  
  return data.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    name: m.profiles?.full_name || m.invited_email || 'Unknown',
    email: m.invited_email,
    role: m.role,
    status: m.status,
    joined_at: m.created_at,
  }));
}

/**
 * POST /tenant-operations/members?tenant_id=xxx
 * Invite new member (admin only)
 */
async function inviteMember(
  supabase: any,
  userId: string,
  tenantId: string,
  request: InviteMemberRequest
): Promise<Membership> {
  // Check admin permission
  const isAdmin = await checkTenantAdmin(supabase, userId, tenantId);
  if (!isAdmin) {
    throw new PermissionError('Only owners and admins can invite members');
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(request.email)) {
    throw new ValidationError('Invalid email address');
  }
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .rpc('get_user_by_email', { email: request.email });
  
  let targetUserId = existingUser?.id;
  
  // Create membership
  const { data, error } = await supabase
    .from('memberships')
    .insert({
      user_id: targetUserId,
      tenant_id: tenantId,
      role: request.role,
      status: targetUserId ? 'active' : 'pending',
      invited_email: request.email,
      invited_by: userId,
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('User is already a member of this tenant');
    }
    throw error;
  }
  
  // TODO: Send invitation email if status is pending
  
  return data;
}

/**
 * PATCH /tenant-operations/members?tenant_id=xxx&member_id=xxx
 * Update member role (admin only)
 */
async function updateMemberRole(
  supabase: any,
  userId: string,
  tenantId: string,
  memberId: string,
  request: UpdateMemberRoleRequest
): Promise<Membership> {
  // Check admin permission
  const isAdmin = await checkTenantAdmin(supabase, userId, tenantId);
  if (!isAdmin) {
    throw new PermissionError('Only owners and admins can update roles');
  }
  
  // Get target membership
  const { data: targetMembership, error: fetchError } = await supabase
    .from('memberships')
    .select('*')
    .eq('id', memberId)
    .eq('tenant_id', tenantId)
    .single();
  
  if (fetchError || !targetMembership) {
    throw new ValidationError('Membership not found');
  }
  
  // Prevent changing owner role (must use transfer ownership)
  if (targetMembership.role === 'owner' && request.role !== 'owner') {
    throw new PermissionError('Cannot change owner role. Use transfer ownership instead.');
  }
  
  // Only owner can assign owner role
  if (request.role === 'owner') {
    const isOwner = await checkTenantRole(supabase, userId, tenantId, 'owner');
    if (!isOwner) {
      throw new PermissionError('Only owner can assign owner role');
    }
  }
  
  // Update role
  const { data, error } = await supabase
    .from('memberships')
    .update({ role: request.role })
    .eq('id', memberId)
    .select()
    .single();
  
  if (error) throw error;
  
  return data;
}

/**
 * DELETE /tenant-operations/members?tenant_id=xxx&member_id=xxx
 * Remove member (admin only)
 */
async function removeMember(
  supabase: any,
  userId: string,
  tenantId: string,
  memberId: string
): Promise<void> {
  // Check admin permission
  const isAdmin = await checkTenantAdmin(supabase, userId, tenantId);
  if (!isAdmin) {
    throw new PermissionError('Only owners and admins can remove members');
  }
  
  // Get target membership
  const { data: targetMembership } = await supabase
    .from('memberships')
    .select('role')
    .eq('id', memberId)
    .eq('tenant_id', tenantId)
    .single();
  
  if (!targetMembership) {
    throw new ValidationError('Membership not found');
  }
  
  // Prevent removing owner
  if (targetMembership.role === 'owner') {
    throw new PermissionError('Cannot remove tenant owner');
  }
  
  // Remove membership
  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', memberId);
  
  if (error) throw error;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabase = getSupabaseClient();
    const user = await getAuthUser(req, supabase);
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id');
    const memberId = url.searchParams.get('member_id');
    const path = url.pathname;
    
    // Route to appropriate handler
    if (path.includes('/members')) {
      // Member operations
      validateMethod(req, ['GET', 'POST', 'PATCH', 'DELETE']);
      
      if (!tenantId) {
        throw new ValidationError('tenant_id is required');
      }
      
      if (req.method === 'GET') {
        const members = await listMembers(supabase, user.id, tenantId);
        return createSuccessResponse({ members });
      }
      
      if (req.method === 'POST') {
        const body = await parseJsonBody<InviteMemberRequest>(req);
        const membership = await inviteMember(supabase, user.id, tenantId, body);
        
        // Log audit event
        await logAuditEvent(supabase, {
          userId: user.id,
          tableName: 'memberships',
          recordId: membership.id,
          operation: 'INSERT',
          newValues: { email: body.email, role: body.role },
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
        
        return createSuccessResponse({ membership }, 201);
      }
      
      if (req.method === 'PATCH') {
        if (!memberId) {
          throw new ValidationError('member_id is required');
        }
        
        const body = await parseJsonBody<UpdateMemberRoleRequest>(req);
        const membership = await updateMemberRole(
          supabase,
          user.id,
          tenantId,
          memberId,
          body
        );
        
        // Log audit event
        await logAuditEvent(supabase, {
          userId: user.id,
          tableName: 'memberships',
          recordId: membership.id,
          operation: 'UPDATE',
          newValues: { role: body.role },
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
        
        return createSuccessResponse({ membership });
      }
      
      if (req.method === 'DELETE') {
        if (!memberId) {
          throw new ValidationError('member_id is required');
        }
        
        await removeMember(supabase, user.id, tenantId, memberId);
        
        // Log audit event
        await logAuditEvent(supabase, {
          userId: user.id,
          tableName: 'memberships',
          recordId: memberId,
          operation: 'DELETE',
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
        
        return createSuccessResponse({ message: 'Member removed successfully' });
      }
    } else {
      // Tenant operations
      validateMethod(req, ['GET', 'POST', 'PATCH', 'DELETE']);
      
      if (req.method === 'GET') {
        if (tenantId) {
          const tenant = await getTenant(supabase, user.id, tenantId);
          return createSuccessResponse({ tenant });
        } else {
          const tenants = await listTenants(supabase, user.id);
          return createSuccessResponse({ tenants });
        }
      }
      
      if (req.method === 'POST') {
        const body = await parseJsonBody<CreateTenantRequest>(req);
        const tenant = await createTenant(supabase, user.id, body);
        
        // Log audit event
        await logAuditEvent(supabase, {
          userId: user.id,
          tableName: 'tenants',
          recordId: tenant.id,
          operation: 'INSERT',
          newValues: { name: body.name, slug: tenant.slug },
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
        
        return createSuccessResponse({ tenant }, 201);
      }
      
      if (req.method === 'PATCH') {
        if (!tenantId) {
          throw new ValidationError('tenant_id is required');
        }
        
        const body = await parseJsonBody<UpdateTenantRequest>(req);
        const tenant = await updateTenant(supabase, user.id, tenantId, body);
        
        // Log audit event
        await logAuditEvent(supabase, {
          userId: user.id,
          tableName: 'tenants',
          recordId: tenant.id,
          operation: 'UPDATE',
          newValues: body,
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
        
        return createSuccessResponse({ tenant });
      }
      
      if (req.method === 'DELETE') {
        if (!tenantId) {
          throw new ValidationError('tenant_id is required');
        }
        
        await deleteTenant(supabase, user.id, tenantId);
        
        // Log audit event
        await logAuditEvent(supabase, {
          userId: user.id,
          tableName: 'tenants',
          recordId: tenantId,
          operation: 'DELETE',
          ipAddress: getIpAddress(req),
          userAgent: getUserAgent(req),
        });
        
        return createSuccessResponse({ message: 'Tenant deleted successfully' });
      }
    }
    
    throw new ValidationError('Invalid request');
    
  } catch (error) {
    return handleError(error);
  }
});