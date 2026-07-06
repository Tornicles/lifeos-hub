# Admin Security Guide

## Overview
This guide explains the security measures protecting admin functionality in LifeOS and how to properly implement admin-only features.

---

## Role Hierarchy

LifeOS uses a five-tier role system:

1. **Owner** (Highest privilege)
   - Full system access
   - Can manage all users and roles
   - Can view all audit logs
   - Can access all admin views and statistics

2. **Admin**
   - Can manage users (except owners)
   - Can view system statistics
   - Can access admin dashboard
   - Cannot modify owner roles

3. **Member**
   - Standard user access
   - Can manage own data only
   - Cannot access admin features

4. **Viewer**
   - Read-only access to assigned data
   - Cannot modify data

5. **Guest** (Lowest privilege)
   - Limited temporary access
   - Minimal permissions

---

## Security Mechanisms

### 1. Database-Level Protection (RLS)

All admin views and tables are protected by Row-Level Security policies:

```sql
-- Example: Admin metrics view policy
CREATE POLICY "Admin metrics visible only to admins and owners"
ON logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner')
    AND (user_roles.expires_at IS NULL OR user_roles.expires_at > now())
  )
);
```

**What this means:**
- Non-admin users get empty results or permission denied errors
- No data leakage even if API is compromised
- Defense in depth: multiple security layers

---

### 2. Application-Level Protection

Frontend hooks gracefully handle permission denied errors:

```typescript
// useAdminStats.ts
export const useAdminUserStats = () => {
  return useQuery({
    queryKey: ['admin-user-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_user_stats')
        .select('*')
        .single();
      
      if (error) {
        // If RLS blocks access, return null instead of throwing
        if (error.code === 'PGRST116') {
          console.warn('Admin access required for user stats');
          return null;
        }
        throw error;
      }
      return data as AdminUserStats;
    },
    retry: false, // Don't retry if access is denied
  });
};
```

---

### 3. Security Definer Functions

Critical security checks use `SECURITY DEFINER` functions to avoid RLS recursion:

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;
```

**Key Points:**
- Functions execute with elevated privileges
- Explicit `search_path` prevents injection attacks
- Used only for security checks, not data access

---

## Admin-Protected Resources

### Database Views
- ✅ `admin_metrics_overview` - System-wide activity statistics
- ✅ `admin_user_stats` - User growth and subscription metrics

### Tables with Admin Access
- ✅ `audit_logs` - All security events and user actions
- ✅ `user_roles` - Role assignments (owners only)
- ✅ `admin_settings` - System configuration

### API Endpoints (Future)
- `/admin/users` - User management
- `/admin/metrics` - System analytics
- `/admin/audit-logs` - Security logs
- `/admin/settings` - Configuration

---

## Implementing Admin-Only Features

### Step 1: Check Admin Access

```typescript
import { useAdminAccess } from '@/hooks/useAdminAccess';

export const AdminDashboard = () => {
  const { isAdmin, isLoading } = useAdminAccess();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAdmin) {
    return <AccessDenied message="Admin access required" />;
  }

  return <AdminContent />;
};
```

### Step 2: Use Admin Hooks

```typescript
import { useAdminMetricsOverview, useAdminUserStats } from '@/hooks/useAdminStats';

export const AdminStats = () => {
  const { data: metrics } = useAdminMetricsOverview();
  const { data: userStats } = useAdminUserStats();

  // Hooks return null if user lacks permissions
  if (!metrics || !userStats) {
    return <AccessDenied />;
  }

  return (
    <div>
      <MetricsCard data={metrics} />
      <UserStatsCard data={userStats} />
    </div>
  );
};
```

### Step 3: Handle Permission Errors

```typescript
// Always check for null data
const { data, error } = useAdminUserStats();

if (error) {
  // Unexpected error (not permission denied)
  return <ErrorMessage error={error} />;
}

if (!data) {
  // Permission denied or still loading
  return <AccessDenied />;
}
```

---

## Testing Admin Security

### Test 1: Non-Admin User Access

```sql
-- Set session as non-admin user
SET LOCAL "request.jwt.claims" = '{"sub": "user-id-here", "role": "authenticated"}';

-- These should return empty or error
SELECT * FROM admin_metrics_overview;
SELECT * FROM admin_user_stats;
SELECT * FROM audit_logs;
```

**Expected Result**: Empty results or permission denied errors

---

### Test 2: Admin User Access

```sql
-- Set session as admin user
SET LOCAL "request.jwt.claims" = '{"sub": "admin-user-id", "role": "authenticated"}';

-- First, ensure user has admin role
INSERT INTO user_roles (user_id, role) VALUES ('admin-user-id', 'admin');

-- These should return data
SELECT * FROM admin_metrics_overview;
SELECT * FROM admin_user_stats;
SELECT * FROM audit_logs LIMIT 10;
```

**Expected Result**: Full data access

---

### Test 3: Frontend Access Control

1. **Login as non-admin user**
2. **Navigate to `/admin`**
3. **Expected**: "Access Denied" message
4. **Check DevTools**: Console shows "Admin access required" warnings

---

## Security Best Practices

### DO:
✅ Always use `useAdminAccess` hook to check permissions  
✅ Handle `null` data gracefully in admin components  
✅ Display clear "Access Denied" messages to users  
✅ Log failed admin access attempts  
✅ Use RLS policies for all admin data access  

### DON'T:
❌ Store admin status in localStorage or cookies  
❌ Trust client-side role checks alone  
❌ Expose admin routes without permission checks  
❌ Show admin UI elements to non-admin users  
❌ Skip error handling for admin queries  

---

## Role Assignment

### Assigning Admin Role (Owner Only)

```sql
-- Only owners can assign admin role
INSERT INTO user_roles (user_id, role, assigned_by)
VALUES (
  'target-user-id',
  'admin',
  auth.uid() -- Must be owner
);
```

**Frontend:**
```typescript
// Only visible to owners
const { isAdmin } = useAdminAccess();
const { role } = useHighestRole();

if (role === 'owner') {
  return <UserRoleManager />; // Can assign admin role
}
```

---

## Audit Logging

All admin actions are automatically logged to `audit_logs`:

```typescript
// Example: Log admin action
await supabase.rpc('log_security_event', {
  p_user_id: userId,
  p_event_type: 'ADMIN_ACTION',
  p_details: {
    action: 'grant_admin_role',
    target_user: targetUserId,
    timestamp: new Date().toISOString()
  }
});
```

**Audit logs include:**
- User ID (who performed the action)
- Action type
- Target resource
- IP address
- User agent
- Timestamp

---

## Privilege Escalation Prevention

### Multiple Security Layers:

1. **Database RLS**: First line of defense
2. **Security Definer Functions**: Prevent RLS recursion
3. **Role Expiration**: Optional time-limited admin access
4. **Audit Logging**: Track all admin actions
5. **Frontend Guards**: Prevent accidental exposure

### Example Attack Prevention:

**Attack**: User tries to query admin view directly
```sql
SELECT * FROM admin_metrics_overview;
```

**Defense**:
- RLS policy checks if user has admin/owner role
- Query returns empty result (no error message)
- Attempt is logged in audit_logs
- User sees "No data" in UI

---

## Troubleshooting

### Issue: Admin user can't access admin views

**Solution:**
1. Verify user has admin or owner role:
   ```sql
   SELECT * FROM user_roles WHERE user_id = auth.uid();
   ```
2. Check role expiration:
   ```sql
   SELECT * FROM user_roles 
   WHERE user_id = auth.uid() 
   AND (expires_at IS NULL OR expires_at > now());
   ```
3. Verify RLS policies are active:
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd, qual 
   FROM pg_policies 
   WHERE tablename IN ('admin_metrics_overview', 'admin_user_stats');
   ```

---

### Issue: "Permission denied" errors in console

**Solution:**
This is expected behavior when non-admin users access the app. The hooks gracefully handle these errors:

```typescript
// No action needed - hooks return null automatically
const { data } = useAdminUserStats();
// data will be null for non-admin users
```

---

## Migration Impact

The security hardening migration made these changes:

1. ✅ Converted SECURITY DEFINER views to SECURITY INVOKER
2. ✅ Added strict RLS policies to admin views
3. ✅ Removed MFA secrets from database
4. ✅ Restricted audit log access to admins only
5. ✅ Hardened profile enumeration protection

**No breaking changes** for existing admin users with proper roles.

---

## Future Enhancements

- [ ] IP-based access restrictions for admin panel
- [ ] Two-factor authentication for admin actions
- [ ] Admin action approval workflow
- [ ] Scheduled permission reviews
- [ ] Admin session time limits

---

**Last Updated**: 2025-11-29  
**Security Level**: Enterprise Grade  
**Status**: ✅ Production Ready