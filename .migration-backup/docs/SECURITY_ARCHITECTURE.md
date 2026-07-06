# LifeOS v30 - Security Architecture

## Overview

This document outlines the comprehensive security architecture implemented for LifeOS v30, covering authentication, authorization, data protection, audit logging, and threat mitigation.

## Security Model

### Defense in Depth

LifeOS implements multiple layers of security:

1. **Network Layer**: HTTPS enforced, CORS protection
2. **Application Layer**: Input validation, rate limiting, CSRF protection
3. **Authentication Layer**: JWT tokens, secure password hashing
4. **Authorization Layer**: RBAC + Row-Level Security
5. **Data Layer**: Encryption at rest, audit logging
6. **Infrastructure Layer**: Supabase managed security

## Authentication System

### JWT Token Management

- **Access Tokens**: Short-lived JWT tokens (1 hour)
- **Refresh Tokens**: Long-lived tokens (7 days), stored in HTTP-only cookies
- **Token Rotation**: Automatic rotation on refresh
- **Session Management**: Handled by Supabase Auth

### Password Security

- **Hashing**: Supabase uses bcrypt with salt
- **Password Policy**:
  - Minimum 6 characters (configurable to 12+)
  - Complexity requirements via validation
  - Password change tracking in security_settings table

### Multi-Factor Authentication (MFA)

- **Status**: Configured in security_settings table
- **Implementation**: Ready for TOTP via Supabase Auth
- **Backup Codes**: Stored securely when enabled

## Authorization System

### Role-Based Access Control (RBAC)

Four application roles defined via `app_role` enum:

#### 1. Owner Role
- Full system access
- Can manage all users and their data
- Can assign/revoke roles
- Can view all audit logs
- Can modify system settings

#### 2. Member Role
- Access to own data only
- Can create/read/update/delete own records
- Can view own audit logs
- Standard user permissions

#### 3. Viewer Role
- Read-only access to shared data
- Cannot modify any records
- Limited visibility based on RLS policies

#### 4. Guest Role
- Temporary limited access
- Time-bound via expires_at field
- Minimal permissions

### Role Assignment Logic

```sql
-- First user automatically becomes Owner
-- Subsequent users default to Member
-- Owners can assign/change roles
-- Roles can have expiration dates
```

### Security Functions

#### has_role(_user_id, _role)
```sql
-- SECURITY DEFINER function prevents RLS recursion
-- Checks if user has specific role
-- Respects role expiration dates
-- Returns boolean
```

#### is_owner(_user_id)
```sql
-- Convenience function for owner checks
-- Used throughout RLS policies
-- Enables admin-level access patterns
```

## Row-Level Security (RLS)

### Principle

Every user-owned table enforces:
```sql
WHERE user_id = auth.uid()
```

### RLS Policy Patterns

#### Standard User Data Pattern
```sql
-- Users can only access their own data
CREATE POLICY "Users can view own records"
ON table_name FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Owners can access all data
CREATE POLICY "Owners can view all records"
ON table_name FOR SELECT
TO authenticated
USING (public.is_owner(auth.uid()));
```

#### Protected Tables

All user-owned tables have RLS enabled:
- profiles
- user_roles
- security_settings
- audit_logs
- ultra_metrics
- metrics
- logs
- habits
- habit_checkins
- projects
- tasks
- calendar_entries
- auto_actions
- state_warnings
- system_state_daily
- automation_context_cache
- automation_executions

#### Reference Tables

System-wide read-only tables:
- hubs (viewable by all authenticated users)
- ultra_domains (viewable by all authenticated users)
- automation_rules (viewable by all authenticated users)
- automation_rule_conditions (viewable by all authenticated users)
- automation_rule_actions (viewable by all authenticated users)

## Audit Logging System

### Audit Log Structure

```typescript
{
  id: UUID
  user_id: UUID
  table_name: string
  record_id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values: JSONB
  new_values: JSONB
  changed_fields: string[]
  ip_address: INET
  user_agent: string
  created_at: timestamptz
}
```

### What Gets Logged

- User authentication events
- Role assignments/changes
- Data modifications (INSERT/UPDATE/DELETE)
- Security setting changes
- Failed login attempts
- Suspicious activity

### Audit Log Access

- Users can view their own audit logs
- Owners can view all audit logs
- System automatically creates audit entries
- Immutable once created (no UPDATE/DELETE policies)

### Retention Policy

- Audit logs retained indefinitely
- Indexed for fast queries
- Queryable by user, table, date range
- Export capability for compliance

## Security Settings

### Per-User Security Configuration

```typescript
{
  mfa_enabled: boolean
  mfa_secret: encrypted_string
  trusted_ips: INET[]
  login_attempts: integer
  last_failed_login: timestamptz
  account_locked_until: timestamptz
  password_changed_at: timestamptz
  session_timeout_minutes: integer (default: 480)
}
```

### Account Lockout

- Max login attempts: 5
- Lockout duration: 30 minutes
- Reset on successful login
- Tracked per user

### IP Whitelisting

- Optional trusted IP list
- Enforced when configured
- Bypass for owner emergency access

## Input Validation & Sanitization

### Validation Layers

1. **Frontend Validation**: Immediate user feedback
2. **API Schema Validation**: zod schemas at edge functions
3. **Database Constraints**: Type enforcement, CHECK constraints

### Sanitization Rules

#### Text Input
- Strip HTML tags
- Remove script tags
- Escape special characters
- Max length enforcement
- No null bytes
- Trim whitespace

#### Numeric Input
- Type checking (no NaN, Infinity)
- Range validation
- Negative number rules per context
- Precision limits

#### Date Input
- ISO format validation
- Range checking (no future dates where invalid)
- Timezone handling

#### JSON Input
- Schema validation
- Max depth limits
- Size limits
- Type enforcement

### SQL Injection Prevention

- **Primary**: Supabase client uses parameterized queries
- **Secondary**: Input validation rejects suspicious patterns
- **Tertiary**: Database permissions limit impact

### XSS Prevention

- All user input escaped before rendering
- No `dangerouslySetInnerHTML` with user content
- Content-Security-Policy headers
- Sanitization library for rich text (if needed)

## API Security

### Rate Limiting

Implemented at edge function level:

```typescript
// Authentication endpoints
POST /auth/login: 5 requests/minute per IP
POST /auth/signup: 3 requests/minute per IP
POST /auth/forgot-password: 3 requests/minute per IP

// Data endpoints
POST /logs: 20 requests/minute per user
POST /metrics: 20 requests/minute per user
POST /ultra-metrics: 10 requests/minute per user
GET /*: 100 requests/minute per user
```

### CORS Configuration

```typescript
{
  origin: [preview-url, production-url],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
```

### Error Handling

- Sanitized error messages (no stack traces to client)
- Generic errors for security failures
- Detailed logging server-side
- HTTP status codes:
  - 400: Bad Request (validation error)
  - 401: Unauthorized (not authenticated)
  - 403: Forbidden (not authorized)
  - 404: Not Found (or hidden by RLS)
  - 429: Too Many Requests (rate limit)
  - 500: Internal Server Error (generic)

## Data Protection

### Encryption

#### At Rest
- All data encrypted by Supabase (AES-256)
- Database credentials encrypted
- Backups encrypted

#### In Transit
- HTTPS enforced (TLS 1.3)
- No HTTP access allowed
- Certificate pinning in production

### Sensitive Data Handling

#### PII (Personally Identifiable Information)
- full_name: Stored in profiles
- email: Stored in auth.users (managed by Supabase)
- Access restricted by RLS

#### Potentially Sensitive Fields
- notes: User logs and journal entries
- relationship logs: Private by default
- health logs: Medical information

#### Data Minimization
- Only collect necessary data
- No unnecessary tracking
- User controls data retention

### Data Isolation

- Complete user data isolation via RLS
- No cross-user queries possible
- Foreign keys enforce referential integrity
- Cascade deletes for data cleanup

## File Upload Security

### Allowed File Types

```typescript
{
  documents: ['.xlsx', '.csv', '.pdf'],
  images: ['.png', '.jpg', '.jpeg', '.webp'],
  maxSize: 10MB per file
}
```

### Upload Validation

1. File type checking (magic bytes, not just extension)
2. Size validation before upload
3. Virus scanning (if storage bucket configured)
4. Filename sanitization
5. Random UUID naming
6. Storage outside public directory
7. Access control on stored files

### File Storage (Supabase Storage)

- User-based storage buckets
- RLS policies on storage.objects
- Signed URLs for secure access
- Time-limited access tokens

## Security Monitoring

### Metrics Tracked

- Failed login attempts per user/IP
- Unusual access patterns
- Rate limit violations
- Permission denied attempts
- Suspicious queries

### Alerts

- Account lockouts
- Multiple failed login attempts
- Role changes
- Security setting modifications
- Anomalous activity detection

### Logging

All security events logged to audit_logs:
- Authentication events
- Authorization failures
- Data access (if configured)
- System modifications
- Security setting changes

## Threat Mitigation

### Common Attack Vectors

#### 1. SQL Injection
- **Mitigation**: Parameterized queries (Supabase client)
- **Detection**: Input validation, pattern matching
- **Response**: Request blocking, audit logging

#### 2. Cross-Site Scripting (XSS)
- **Mitigation**: Input sanitization, output escaping
- **Detection**: Content-Security-Policy violations
- **Response**: Request blocking, audit logging

#### 3. Cross-Site Request Forgery (CSRF)
- **Mitigation**: SameSite cookies, CSRF tokens
- **Detection**: Origin header validation
- **Response**: Request rejection

#### 4. Brute Force Attacks
- **Mitigation**: Rate limiting, account lockout
- **Detection**: Failed login tracking
- **Response**: Temporary account lock, notification

#### 5. Privilege Escalation
- **Mitigation**: RBAC, RLS, security definer functions
- **Detection**: Unauthorized access attempts in logs
- **Response**: Action blocking, immediate alert

#### 6. Session Hijacking
- **Mitigation**: HTTP-only cookies, secure flags, short expiry
- **Detection**: IP/device change detection
- **Response**: Force re-authentication

#### 7. Data Exfiltration
- **Mitigation**: RLS, rate limiting, audit logging
- **Detection**: Unusual query patterns, bulk exports
- **Response**: Throttling, notification

## Compliance & Best Practices

### OWASP Top 10 Coverage

1. ✅ Broken Access Control: RLS + RBAC
2. ✅ Cryptographic Failures: Encryption at rest/transit
3. ✅ Injection: Parameterized queries, validation
4. ✅ Insecure Design: Defense in depth, least privilege
5. ✅ Security Misconfiguration: Secure defaults
6. ✅ Vulnerable Components: Supabase managed updates
7. ✅ Authentication Failures: MFA ready, rate limiting
8. ✅ Software & Data Integrity: Audit logging
9. ✅ Logging & Monitoring: Comprehensive audit system
10. ✅ Server-Side Request Forgery: Input validation, network isolation

### Security Headers

```typescript
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
}
```

### Privacy by Design

- Data minimization
- User consent for data collection
- Right to access (export)
- Right to deletion (cascade deletes)
- Transparency in data usage

## Incident Response

### Security Incident Procedure

1. **Detection**: Monitoring alerts, user reports
2. **Assessment**: Severity evaluation, impact analysis
3. **Containment**: Block access, disable accounts
4. **Eradication**: Remove threat, patch vulnerabilities
5. **Recovery**: Restore services, verify security
6. **Post-Incident**: Review logs, update procedures

### Emergency Contacts

- Owner access: Always available
- Audit logs: Immutable record
- Backups: Available for restoration

## Future Enhancements

### Planned Security Features

1. **Advanced MFA**: TOTP, WebAuthn, biometric
2. **Anomaly Detection**: ML-based threat detection
3. **Geofencing**: Location-based access controls
4. **Data Loss Prevention**: Enhanced export controls
5. **Security Dashboards**: Real-time security metrics
6. **Compliance Tools**: GDPR, HIPAA readiness
7. **Penetration Testing**: Regular security audits
8. **Bug Bounty Program**: Community security review

## Security Checklist

### Deployment Security

- ✅ HTTPS enforced
- ✅ CORS configured
- ✅ RLS enabled on all user tables
- ✅ Audit logging active
- ✅ Rate limiting implemented
- ✅ Input validation in place
- ✅ Error handling secured
- ✅ Secrets in environment variables
- ✅ Database backups automated
- ✅ Monitoring and alerts configured

### Regular Security Tasks

- [ ] Review audit logs weekly
- [ ] Update dependencies monthly
- [ ] Security scan quarterly
- [ ] Penetration test annually
- [ ] Review RLS policies when schema changes
- [ ] Update security documentation with changes
- [ ] Train users on security best practices

## Conclusion

LifeOS v30 implements enterprise-grade security with multiple layers of protection. The system follows security best practices, maintains comprehensive audit trails, and provides granular access control through RBAC and RLS policies. All security measures are designed to be transparent to users while providing robust protection against common threats.

For security concerns or questions, refer to the audit logs system and security settings configuration.
