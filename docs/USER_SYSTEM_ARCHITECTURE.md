# LifeOS User System Architecture

## Overview

The LifeOS User System provides comprehensive authentication, authorization, and user management capabilities built on Supabase Auth with custom role-based access control (RBAC) and multi-tenant support.

## Core Components

### 1. Authentication System

#### Supabase Auth Integration
- **Email/Password Authentication**: Standard email and password login
- **Session Management**: JWT-based with automatic token refresh
- **Password Reset**: Secure password recovery flow via email
- **Email Verification**: Optional email confirmation (can be disabled for development)

#### Security Features
- **Password Hashing**: Supabase handles password hashing (bcrypt)
- **Secure Sessions**: HTTP-only cookies for session storage
- **CSRF Protection**: Built into Supabase Auth
- **Rate Limiting**: Implemented at edge function level
- **Account Lockout**: Tracked via `security_settings` table

### 2. User Data Model

#### Tables

**profiles**
```sql
- id (uuid, FK to auth.users)
- full_name (text)
- role (text, deprecated - use user_roles instead)
- created_at (timestamp)
- updated_at (timestamp)
```

**user_roles**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- role (app_role enum: owner, admin, member, viewer, guest)
- assigned_at (timestamp)
- assigned_by (uuid, nullable)
- expires_at (timestamp, nullable)
```

**security_settings**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- mfa_enabled (boolean)
- mfa_secret (text, encrypted)
- login_attempts (integer)
- last_failed_login (timestamp)
- account_locked_until (timestamp)
- password_changed_at (timestamp)
- session_timeout_minutes (integer, default 480)
- trusted_ips (inet[])
- created_at (timestamp)
- updated_at (timestamp)
```

**audit_logs**
```sql
- id (uuid, PK)
- user_id (uuid, nullable)
- table_name (text)
- record_id (text)
- operation (text)
- old_values (jsonb)
- new_values (jsonb)
- changed_fields (text[])
- ip_address (inet)
- user_agent (text)
- created_at (timestamp)
```

### 3. Role-Based Access Control (RBAC)

#### Role Hierarchy
1. **Owner**: Full platform control, can assign all roles
2. **Admin**: Can manage users and system settings
3. **Member**: Standard user with full personal data access
4. **Viewer**: Read-only access to assigned resources
5. **Guest**: Limited access, temporary

#### Permission System
- Roles stored in separate `user_roles` table (security best practice)
- Security Definer functions for role checks: `has_role()`, `is_admin()`, `is_owner()`
- Row-Level Security (RLS) policies enforce access control
- All user data tables filter by `user_id` and optionally `tenant_id`

#### Permission Checks
```typescript
// Client-side hooks
useUserRole() // Get all user roles
useHasRole(role) // Check for specific role
useIsOwner() // Check if user is owner
useHighestRole() // Get highest privilege role
useAdminAccess() // Check admin access (owner or admin)
```

### 4. Multi-Tenant Architecture

#### Tenant System
- Each user automatically gets a personal tenant on signup
- Users can belong to multiple tenants (workspaces/teams)
- `memberships` table tracks user-tenant relationships with roles

**tenants**
```sql
- id (uuid, PK)
- name (text)
- slug (text, unique)
- plan (subscription_plan enum: free, starter, pro, enterprise)
- created_at (timestamp)
- updated_at (timestamp)
```

**memberships**
```sql
- id (uuid, PK)
- user_id (uuid, FK to auth.users)
- tenant_id (uuid, FK to tenants)
- role (membership_role enum: owner, admin, member, viewer)
- status (membership_status enum: pending, active, revoked)
- invited_by (uuid, nullable)
- invited_email (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Tenant-Level Roles
- **Owner**: Full tenant control, billing, can delete tenant
- **Admin**: Manage members, settings (except billing)
- **Member**: Standard tenant access
- **Viewer**: Read-only tenant access

### 5. Data Isolation & Security

#### Row-Level Security (RLS)
All user data tables implement RLS policies:

```sql
-- Example pattern for user data isolation
CREATE POLICY "Users can access own data"
ON table_name
FOR ALL
USING (user_id = auth.uid() AND (tenant_id IS NULL OR is_tenant_member(auth.uid(), tenant_id)))
WITH CHECK (user_id = auth.uid() AND (tenant_id IS NULL OR is_tenant_member(auth.uid(), tenant_id)));
```

#### Security Functions
- `is_tenant_member(user_id, tenant_id)`: Check tenant membership
- `has_tenant_role(user_id, tenant_id, role)`: Check tenant-level role
- `is_tenant_admin(user_id, tenant_id)`: Check tenant admin status
- `has_role(user_id, role)`: Check application-level role
- `is_admin(user_id)`: Check if user is admin or owner
- `log_security_event()`: Audit logging for security events

### 6. Frontend Pages

#### Authentication Pages
- `/auth` - Login and signup with validation
- `/password-reset` - Password recovery flow
- Password reset link redirects to `/password-reset?code=...`

#### User Management Pages
- `/profile` - User profile view and editing
- `/settings` - General settings (theme, data export, logout)
- `/security` - Security settings (coming soon: 2FA, devices, audit log)

#### Admin Pages (Owner/Admin only)
- `/admin` - Admin dashboard with platform metrics
- User management (coming soon)
- System monitoring (coming soon)

### 7. Security Best Practices Implemented

#### Input Validation
- Zod schemas for all user input (`lib/validation.ts`)
- Email format and length validation
- Password strength requirements (min 6 chars, must contain letters)
- Text field length limits
- Number range validation

#### Defense in Depth
1. **Client-side validation**: Immediate feedback, UX improvement
2. **API validation**: Edge functions validate inputs
3. **Database constraints**: NOT NULL, UNIQUE, CHECK constraints
4. **RLS policies**: Database-level access control
5. **Audit logging**: Track all security-relevant actions

#### Session Security
- JWT tokens with expiration
- Automatic token refresh
- Secure session storage (handled by Supabase)
- Session timeout configuration per user

#### Account Security
- Failed login attempt tracking
- Account lockout after threshold
- Password reset tokens with expiration
- IP address logging for suspicious activity detection

### 8. Authentication Flow

#### Signup Flow
```
1. User enters email, password, full name
2. Client validates input (Zod schemas)
3. Supabase creates auth.users entry
4. Database trigger creates profiles entry
5. Database trigger creates personal tenant
6. Database trigger creates owner membership
7. Database trigger assigns default role
8. Database trigger creates security_settings
9. User redirected to /dashboard
```

#### Login Flow
```
1. User enters email, password
2. Client validates input
3. Supabase verifies credentials
4. Session created with JWT token
5. Client stores session
6. Failed attempts tracked in security_settings
7. Account locked after 5 failed attempts
8. User redirected to /dashboard
```

#### Password Reset Flow
```
1. User requests reset at /password-reset
2. Email with magic link sent
3. User clicks link → /password-reset?code=...
4. User enters new password
5. Supabase updates password
6. All sessions invalidated
7. User must log in again
```

### 9. Audit Logging

All security-relevant events are logged to `audit_logs`:

**Logged Events**
- User signup/login/logout
- Failed login attempts
- Password changes
- Profile updates
- Role changes
- Admin actions
- Permission violations
- Data exports
- Account deletions

**Audit Log Fields**
- User ID (who performed action)
- Table name (what was affected)
- Operation (INSERT, UPDATE, DELETE)
- Old values (before change)
- New values (after change)
- IP address
- User agent
- Timestamp

### 10. Future Enhancements

#### Phase 1: Advanced Security
- [ ] Two-factor authentication (2FA)
- [ ] Device management and trusted devices
- [ ] Security dashboard showing login history
- [ ] Suspicious activity alerts
- [ ] IP whitelisting/blacklisting

#### Phase 2: Enhanced User Management
- [ ] Profile picture uploads
- [ ] Custom user fields
- [ ] User preferences and settings
- [ ] Notification preferences
- [ ] Timezone and language settings

#### Phase 3: Team Features
- [ ] Team invitation flow
- [ ] Team management UI
- [ ] Shared resources (projects, calendar)
- [ ] Team analytics
- [ ] Team billing

#### Phase 4: Advanced Admin
- [ ] User impersonation (for support)
- [ ] Bulk user operations
- [ ] Advanced user search and filtering
- [ ] User lifecycle management
- [ ] Compliance tools (GDPR, data export)

## API Endpoints

### Authentication
- `POST /auth/v1/signup` - Create account
- `POST /auth/v1/token?grant_type=password` - Login
- `POST /auth/v1/logout` - Logout
- `POST /auth/v1/recover` - Request password reset
- `PUT /auth/v1/user` - Update user (including password)

### User Management
- `GET /rest/v1/profiles?id=eq.{userId}` - Get profile
- `PATCH /rest/v1/profiles?id=eq.{userId}` - Update profile
- `GET /rest/v1/user_roles?user_id=eq.{userId}` - Get roles

### Tenant Operations (Edge Function)
- `GET /functions/v1/tenant-operations/tenants` - List user's tenants
- `POST /functions/v1/tenant-operations/tenants` - Create tenant
- `GET /functions/v1/tenant-operations/tenants/{id}` - Get tenant details
- `PATCH /functions/v1/tenant-operations/tenants/{id}` - Update tenant
- `DELETE /functions/v1/tenant-operations/tenants/{id}` - Delete tenant
- `POST /functions/v1/tenant-operations/tenants/{id}/members` - Invite member
- `GET /functions/v1/tenant-operations/tenants/{id}/members` - List members
- `PATCH /functions/v1/tenant-operations/tenants/{id}/members/{memberId}` - Update member role
- `DELETE /functions/v1/tenant-operations/tenants/{id}/members/{memberId}` - Remove member

## Testing

### Development Setup
1. Disable email confirmation in Supabase Auth settings for faster testing
2. Use test accounts with different roles
3. Check RLS policies are working correctly

### Security Testing
1. Test account lockout after failed attempts
2. Verify password reset flow
3. Confirm RLS prevents unauthorized access
4. Test role-based UI elements
5. Verify audit logging captures events

## Migration Guide

### From Single-User to Multi-User
1. All tables already have `tenant_id` fields
2. RLS policies already check tenant membership
3. Add team invitation UI
4. Implement shared resource logic

### Adding New Roles
1. Add role to `app_role` enum
2. Update `has_role()` checks
3. Add RLS policies for new role
4. Update frontend role checks
5. Add role to documentation

## Troubleshooting

### Common Issues

**Issue**: User can't login
- Check email is verified (or verification disabled)
- Check account not locked (security_settings)
- Verify password is correct
- Check RLS policies allow auth

**Issue**: Permission denied errors
- Verify user has correct role in user_roles
- Check RLS policies on affected table
- Confirm tenant membership if required
- Check security functions return correct values

**Issue**: Session expired immediately
- Check Supabase JWT settings
- Verify session timeout in security_settings
- Check browser cookies enabled

## Conclusion

The LifeOS User System provides a secure, scalable foundation for user management with:
- Industry-standard authentication
- Granular role-based access control
- Multi-tenant support
- Comprehensive audit logging
- Defense-in-depth security
- Extensible architecture

All components are designed to be secure by default while remaining flexible for future enhancements.