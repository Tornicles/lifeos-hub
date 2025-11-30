# LifeOS Security Audit Checklist

Use this checklist before deploying to production or after major security changes.

---

## 1. Authentication & Authorization

### JWT Verification
- [ ] All edge functions have `verify_jwt = true` in `supabase/config.toml`
- [ ] No edge function accepts `user_id` from request body
- [ ] User ID is always extracted from JWT via `supabase.auth.getUser(token)`
- [ ] Invalid/expired tokens return 401 Unauthorized
- [ ] Missing authorization header returns 401 Unauthorized

### Role-Based Access Control (RBAC)
- [ ] `user_roles` table exists with app roles (owner, admin, member, viewer, guest)
- [ ] `memberships` table exists with tenant roles (owner, admin, member, viewer)
- [ ] Helper functions (`has_role`, `is_admin`, `is_tenant_admin_for`) use `SECURITY DEFINER`
- [ ] All helper functions have `SET search_path = public`
- [ ] Admin views use `SECURITY INVOKER` (NOT `SECURITY DEFINER`)
- [ ] No direct queries to `auth.users` in application code or views

---

## 2. Row-Level Security (RLS)

### RLS Enabled
- [ ] RLS enabled on `profiles` table
- [ ] RLS enabled on `logs` table
- [ ] RLS enabled on `metrics` table
- [ ] RLS enabled on `ultra_metrics` table
- [ ] RLS enabled on `habits` table
- [ ] RLS enabled on `habit_checkins` table
- [ ] RLS enabled on `projects` table
- [ ] RLS enabled on `tasks` table
- [ ] RLS enabled on `calendar_entries` table
- [ ] RLS enabled on `notifications` table
- [ ] RLS enabled on `auto_actions` table
- [ ] RLS enabled on `audit_logs` table

### User Isolation Policies
- [ ] Users can only SELECT their own data (`user_id = auth.uid()`)
- [ ] Users can only INSERT with their own user_id
- [ ] Users can only UPDATE their own data
- [ ] Users can only DELETE their own data

### Tenant Isolation Policies
- [ ] All tenant-scoped tables filter by `tenant_id`
- [ ] Users can only access data within their tenant memberships
- [ ] Admins can only access data within their managed tenants (NOT global)
- [ ] Tenant creation is rate-limited (max 5 per user)

### Admin Access Scoping
- [ ] Admin SELECT policies check tenant membership via JOIN
- [ ] Admins CANNOT see data across all tenants globally
- [ ] Admin views filter by tenant relationships
- [ ] No hardcoded `role = 'admin'` checks without tenant context

---

## 3. Input Validation

### Zod Schema Validation
- [ ] All edge functions use Zod for input validation
- [ ] Enum fields validated with `z.enum()`
- [ ] UUID fields validated with `z.string().uuid()`
- [ ] Date fields validated with regex or `z.string().datetime()`
- [ ] Numbers validated with `z.number().min().max()`
- [ ] Strings validated with `z.string().min().max()`

### Payload Size Limits
- [ ] All edge functions check payload size (<20KB recommended)
- [ ] Oversized requests return 413 Payload Too Large
- [ ] File uploads have size limits enforced

### SQL Injection Prevention
- [ ] No raw SQL queries with string interpolation
- [ ] All queries use parameterized queries (Supabase client methods)
- [ ] User inputs never directly embedded in SQL

---

## 4. Rate Limiting

### Implemented Rate Limits
- [ ] Login attempts limited (5 per minute)
- [ ] Data mutations limited (20 per minute)
- [ ] Heavy computations limited (10 per minute)
- [ ] Exports limited (2 per hour)
- [ ] Tenant creation limited (5 total per user)

### Rate Limit Enforcement
- [ ] Rate limits use `automation_context_cache` table
- [ ] Rate-limited requests return 429 Too Many Requests
- [ ] Rate limit violations logged in audit trail

---

## 5. Audit Logging

### Events Logged
- [ ] User authentication (login, logout, failed attempts)
- [ ] Data mutations (create, update, delete)
- [ ] Permission changes (role assignments)
- [ ] Admin actions (tenant management, user management)
- [ ] Security violations (unauthorized access attempts)
- [ ] Rate limit breaches

### Log Contents
- [ ] `user_id` captured
- [ ] `table_name` and `record_id` captured
- [ ] `operation` type captured (INSERT, UPDATE, DELETE)
- [ ] `ip_address` captured
- [ ] `user_agent` captured
- [ ] `timestamp` captured
- [ ] No passwords or secrets logged
- [ ] No PII in clear text (unless encrypted)

---

## 6. Multi-Tenant Isolation

### Tenant Boundaries
- [ ] All user data tables have `tenant_id` column
- [ ] All queries filter by `tenant_id` where applicable
- [ ] Users CANNOT query across tenant boundaries
- [ ] Admins CANNOT access data outside their tenants

### Tenant Management
- [ ] Tenant creation enforces uniqueness on `slug`
- [ ] Only tenant owners can delete tenants
- [ ] Only owners/admins can manage memberships
- [ ] Tenant creation is rate-limited

---

## 7. Edge Function Security

### Security Headers
- [ ] CORS headers configured for allowed origins
- [ ] HSTS header enabled in production
- [ ] Content-Security-Policy header set
- [ ] X-Frame-Options: DENY or SAMEORIGIN
- [ ] X-Content-Type-Options: nosniff

### Error Handling
- [ ] No stack traces leaked in responses
- [ ] Error messages sanitized (no internal details)
- [ ] 500 errors logged but not exposed to client
- [ ] Validation errors return specific field errors (safe)

### Ownership Verification
- [ ] Edge functions verify entity ownership before operations
- [ ] Users cannot trigger automation for other users' entities
- [ ] Cross-user UPDATE/DELETE attempts blocked

---

## 8. Database Security

### Admin Views
- [ ] All admin views use `security_invoker = on`
- [ ] No admin views reference `auth.users` directly
- [ ] Admin views have RLS policies requiring admin role
- [ ] Views filter data by tenant relationships

### Helper Functions
- [ ] All RBAC helper functions use `SECURITY DEFINER`
- [ ] All functions have `SET search_path = public`
- [ ] No functions allow SQL injection via parameters
- [ ] Functions return only boolean or scalar values (not full rows)

---

## 9. Password Security

### Password Policies
- [ ] Minimum password length enforced (8+ characters)
- [ ] Password complexity enforced (uppercase, lowercase, number, symbol)
- [ ] Leaked Password Protection enabled in Supabase Auth dashboard
- [ ] Password hashing uses Argon2id (Supabase default)

### Password Reset
- [ ] Password reset requires email verification
- [ ] Reset tokens expire after 1 hour
- [ ] Reset tokens are single-use

---

## 10. Testing

### Penetration Tests Passed
- [ ] Missing JWT test (should fail with 401)
- [ ] Forged JWT test (should fail with 401)
- [ ] Expired JWT test (should fail with 401)
- [ ] User impersonation test (should fail with 401/403)
- [ ] Cross-user data access test (should fail with empty result)
- [ ] Cross-tenant data access test (should fail with empty result)
- [ ] Unauthorized UPDATE test (should fail with 403)
- [ ] Unauthorized DELETE test (should fail with 403)
- [ ] SQL injection test (should be prevented)
- [ ] Rate limit test (should return 429 after limit)
- [ ] Oversized payload test (should return 413)

### Integration Tests Passed
- [ ] Authentication flow (signup, login, logout)
- [ ] RLS user isolation (users can't see each other's data)
- [ ] RLS tenant isolation (users can't access other tenants)
- [ ] Edge function JWT enforcement
- [ ] Edge function input validation
- [ ] Edge function authorization checks
- [ ] Automation rule evaluation
- [ ] Habit check-in flow
- [ ] Project CRUD flow

---

## 11. Production Deployment

### Environment Configuration
- [ ] All secrets stored in environment variables (never hardcoded)
- [ ] Production uses separate Supabase project from dev/staging
- [ ] API keys rotated regularly
- [ ] Service role key NEVER exposed to frontend
- [ ] Anonymous key used for frontend auth

### Monitoring & Alerting
- [ ] Error tracking enabled (Sentry, Rollbar, etc.)
- [ ] Slow query alerts configured (>1sec)
- [ ] Failed authentication spike alerts configured
- [ ] Rate limit breach alerts configured
- [ ] Database connection pool alerts configured

### Backup & Recovery
- [ ] Daily automated backups enabled
- [ ] Point-in-time recovery (PITR) enabled
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented

---

## 12. Compliance

### Data Privacy
- [ ] GDPR data deletion endpoint implemented
- [ ] User can export their data
- [ ] User can delete their account
- [ ] Privacy policy updated and accessible
- [ ] Terms of service updated and accessible

### Audit & Logging
- [ ] Audit logs retained for minimum 90 days
- [ ] Security events logged and monitored
- [ ] Access logs available for review

---

## Sign-Off

### Review Completed By

- **Reviewer Name**: _______________________
- **Role**: _______________________
- **Date**: _______________________
- **Signature**: _______________________

### Issues Found

- [ ] No critical issues found
- [ ] All critical issues resolved
- [ ] All high-priority issues resolved
- [ ] All medium-priority issues resolved or accepted as risk

### Approval

- [ ] System approved for production deployment
- [ ] System requires additional work before deployment

**Notes**:
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
