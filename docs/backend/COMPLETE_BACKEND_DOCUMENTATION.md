# LifeOS v36 - Complete Backend Documentation

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Multi-Tenant Architecture](#multi-tenant-architecture)
4. [Row Level Security (RLS)](#row-level-security)
5. [Helper Functions](#helper-functions)
6. [Edge Functions](#edge-functions)
7. [Input Validation](#input-validation)
8. [Security Best Practices](#security-best-practices)
9. [Deployment Guide](#deployment-guide)
10. [Troubleshooting](#troubleshooting)

---

## Overview

LifeOS is a comprehensive Life Operating System built on Supabase/PostgreSQL with a React frontend. The system implements:

- **Multi-tenant architecture** (families, teams, organizations)
- **Enterprise-grade security** (JWT, RLS, RBAC)
- **Event-driven automation** (rules engine, action queue)
- **AI-powered insights** (daily/weekly/monthly coaching)
- **Comprehensive tracking** (habits, projects, calendar, metrics)

### Technology Stack

- **Database**: PostgreSQL (via Supabase)
- **Backend**: Supabase Edge Functions (Deno)
- **Frontend**: React + TypeScript + Tailwind
- **Authentication**: Supabase Auth (JWT)
- **Validation**: Zod schemas

---

## Database Schema

### Core Tables Overview

| Table | Purpose | Tenant-Scoped | User-Scoped |
|-------|---------|---------------|-------------|
| `tenants` | Organizations/workspaces | N/A | ✅ |
| `profiles` | User display info | ❌ | ✅ |
| `user_roles` | Global roles | ❌ | ✅ |
| `memberships` | User ↔ Tenant relationships | ✅ | ✅ |
| `hubs` | Life areas (Finance, Health, etc.) | ❌ | ❌ |
| `ultra_domains` | 7 Ultra domains | ❌ | ❌ |
| `logs` | Activity logs | ✅ | ✅ |
| `metrics` | Hub-level metrics | ✅ | ✅ |
| `ultra_metrics` | Ultra Score metrics | ✅ | ✅ |
| `projects` | Project management | ✅ | ✅ |
| `tasks` | Tasks under projects | via project | via project |
| `habits` | Habit definitions | ✅ | ✅ |
| `habit_checkins` | Daily habit tracking | via habit | via habit |
| `calendar_entries` | Time blocking events | ✅ | ✅ |
| `automation_rules` | Rule definitions | ❌ | ❌ |
| `automation_action_queue` | Action execution queue | ✅ | ✅ |
| `automation_executions` | Execution history | ✅ | ✅ |
| `automation_logs` | System logs | ✅ | ✅ |
| `auto_actions` | Recommended actions | ✅ | ✅ |
| `system_state_daily` | Daily state snapshots | ✅ | ✅ |
| `state_warnings` | User alerts | ✅ | ✅ |
| `notifications` | In-app notifications | ✅ | ✅ |
| `notification_preferences` | User notification settings | ✅ | ✅ |
| `audit_logs` | Security audit trail | ❌ | ✅ |
| `security_settings` | User security config | ❌ | ✅ |

### Reference Data (Hubs)

The `hubs` table contains 9 predefined life areas:

- Finance (FINANCE)
- Health (HEALTH)
- Work (WORK)
- Academy (ACADEMY)
- Personal Development (PERSONAL_DEV)
- Household (HOUSEHOLD)
- Relationships (RELATIONSHIPS)
- Projects (PROJECTS)
- Mindset (MINDSET)

### Reference Data (Ultra Domains)

The `ultra_domains` table contains 7 ultra performance domains:

- Spirituality (SPIRITUALITY)
- Career Master (CAREER_MASTER)
- Social Life (SOCIAL_LIFE)
- Emotional Intelligence (EMOTIONAL_INTELLIGENCE)
- Personal Branding & Online Influence (PERSONAL_BRANDING)
- Fitness Performance (FITNESS_PERFORMANCE)
- Dating & Attraction (DATING_ATTRACTION)

---

## Multi-Tenant Architecture

### How Tenants Work

1. **Tenant Creation**: When a user signs up, a personal tenant is auto-created
2. **Membership**: User becomes the owner of their personal tenant
3. **Data Isolation**: All user data is scoped to their tenant(s)
4. **Role-Based Access**: Users can have different roles in different tenants

### Tenant Hierarchy

```
Tenant (Organization/Family)
  ├── Owner (full control)
  ├── Admin (manage members, view all data)
  ├── Member (CRUD own data)
  └── Viewer (read-only)
```

### Data Scoping Rules

**Tenant-Scoped Tables** (have `tenant_id` column):
- Users can only access data in tenants they're members of
- Admins can view all data within their tenant
- No cross-tenant data access is allowed

**User-Scoped Tables** (have `user_id` column):
- Users can only access their own data
- Tenant admins can view data of members in their tenant

**Global Tables** (no scoping):
- `hubs` and `ultra_domains` are read-only reference data
- Visible to all authenticated users

---

## Row Level Security (RLS)

### RLS Philosophy

Every table storing user or tenant data has RLS enabled with policies that:

1. **Default Deny**: No access unless explicitly granted
2. **User Isolation**: Users can only access their own data
3. **Tenant Isolation**: Users cannot cross tenant boundaries
4. **Admin Override**: Tenant admins can view member data in their tenant

### Common Policy Patterns

#### Pattern 1: User-Only Access
```sql
-- Users can only view their own data
CREATE POLICY "Users can view own data" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

#### Pattern 2: User + Tenant Admin Access
```sql
-- Users view own data OR tenant admins view member data
CREATE POLICY "Users can view own data or tenant admins" ON table_name
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.status = 'active'
        AND (m.tenant_id = table_name.tenant_id OR table_name.tenant_id IS NULL)
    )
  );
```

#### Pattern 3: Tenant Membership Check
```sql
-- Users can insert if they're members of the tenant
CREATE POLICY "Users can insert with tenant check" ON table_name
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id IS NULL OR public.is_tenant_member(auth.uid(), tenant_id))
  );
```

### Policy Verification

To check if a table has RLS enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'your_table_name';
```

To view policies on a table:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'your_table_name';
```

---

## Helper Functions

### Global Role Functions

#### `has_role(user_id, role)`
Check if user has a specific global role.

```sql
SELECT has_role(auth.uid(), 'admin'::app_role);
```

**Roles**: `owner`, `admin`, `member`, `viewer`, `guest`

#### `is_owner(user_id)`
Check if user is a global owner (system-wide admin).

#### `is_admin(user_id)`
Check if user is a global admin or owner.

### Tenant Role Functions

#### `is_tenant_member(user_id, tenant_id)`
Check if user is an active member of a tenant.

```sql
SELECT is_tenant_member(auth.uid(), '...');
```

#### `has_tenant_role(user_id, tenant_id, role)`
Check if user has a specific role within a tenant.

```sql
SELECT has_tenant_role(auth.uid(), '...', 'admin'::membership_role);
```

**Roles**: `owner`, `admin`, `member`, `viewer`

#### `is_tenant_admin(user_id, tenant_id)`
Check if user is an admin or owner within a tenant.

#### `get_user_tenant_role(user_id, tenant_id)`
Get user's role within a tenant (returns `membership_role`).

### Security Functions

All helper functions:
- Use `SECURITY DEFINER` (execute with function owner privileges)
- Have `SET search_path = public` to prevent search path attacks
- Are optimized for performance with proper indexing

---

## Edge Functions

### Overview

LifeOS uses 13+ Supabase Edge Functions for backend logic:

| Function | Purpose | JWT Required |
|----------|---------|--------------|
| `data-flow-processor` | Central orchestration | ✅ |
| `automation-trigger` | Event dispatcher | ✅ |
| `automation-evaluator` | Rule evaluation | ✅ |
| `automation-processor` | Action execution | ✅ |
| `calculate-ultra-score` | Score computation | ✅ |
| `evaluate-automation` | Rule checking | ✅ |
| `generate-daily-insight` | AI insights | ✅ |
| `generate-weekly-review` | Weekly summary | ✅ |
| `generate-monthly-insights` | Monthly analysis | ✅ |
| `calendar-autofill` | Auto-schedule | ✅ |
| `system-validate` | Health checks | ✅ |
| `notification-generator` | Alert creation | ✅ |
| `tenant-operations` | Tenant CRUD | ✅ |

### Security Requirements

**ALL edge functions MUST**:

1. **Require JWT authentication** (`verify_jwt = true` in config.toml)
2. **Extract user_id from JWT** (never trust client input)
3. **Validate all inputs** with Zod schemas
4. **Check tenant membership** before accessing tenant data
5. **Log security events** to audit_logs
6. **Return sanitized errors** (no internal details)

### Standard Edge Function Structure

```typescript
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define validation schema
const RequestSchema = z.object({
  field: z.string(),
}).strict();

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 2. Extract and verify user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const userId = user.id;

    // 3. Parse and validate request body
    const body = await req.json();
    const validated = RequestSchema.parse(body);

    // 4. Verify tenant membership (if applicable)
    if (validated.tenant_id) {
      const { data: membership } = await supabase
        .from('memberships')
        .select('role')
        .eq('user_id', userId)
        .eq('tenant_id', validated.tenant_id)
        .eq('status', 'active')
        .single();

      if (!membership) {
        throw new Error('Not a member of this tenant');
      }
    }

    // 5. Execute business logic
    // ... your function logic here

    // 6. Return response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { 
        status: error.message?.includes('Unauthorized') ? 401 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

### Configuration

All functions are configured in `supabase/config.toml`:

```toml
project_id = "ggaonvyheaxrbobmxism"

[functions.data-flow-processor]
verify_jwt = true

[functions.automation-trigger]
verify_jwt = true

# ... repeat for all functions
```

---

## Input Validation

### Why Validation Matters

**Security Risks Without Validation:**
- SQL injection
- XSS attacks
- Buffer overflow
- Type confusion
- Denial of service

### Validation Strategy

**Client-Side** (React):
- Basic validation with React Hook Form
- Zod schemas for type safety
- Immediate user feedback

**Server-Side** (Edge Functions):
- Comprehensive Zod validation
- Enum validation
- Length limits
- Type checking
- Format validation (UUID, date, email)

### Example: Validating a Create Project Request

```typescript
import { CreateProjectSchema } from './validation.ts';

try {
  const validated = CreateProjectSchema.parse(requestBody);
  // validated.title, validated.status, etc. are now type-safe
} catch (error) {
  if (error instanceof z.ZodError) {
    return { error: 'Validation failed', details: error.errors };
  }
}
```

### Validation Rules

**String Fields:**
- Must be trimmed
- Must have min/max length
- Must match regex pattern (where applicable)

**UUID Fields:**
- Must match UUID v4 format
- Validated with `z.string().uuid()`

**Enum Fields:**
- Must match one of predefined values
- Validated with `z.enum([...])`

**Date Fields:**
- Must match YYYY-MM-DD format
- Validated with `z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`

**Numeric Fields:**
- Must be valid numbers
- Must respect min/max bounds

---

## Security Best Practices

### Critical Security Rules

#### 1. NEVER Trust Client Input

```typescript
// ❌ WRONG - Client can lie about user_id
const { user_id } = await req.json();

// ✅ CORRECT - Extract from JWT
const { data: { user } } = await supabase.auth.getUser(token);
const userId = user.id;
```

#### 2. ALWAYS Validate Input

```typescript
// ❌ WRONG - No validation
const { title } = await req.json();

// ✅ CORRECT - Validate with Zod
const validated = CreateProjectSchema.parse(await req.json());
```

#### 3. ALWAYS Check Tenant Membership

```typescript
// ❌ WRONG - No tenant check
await supabase.from('projects').select('*').eq('tenant_id', tenantId);

// ✅ CORRECT - Verify membership first
const isMember = await supabase.rpc('is_tenant_member', {
  _user_id: userId,
  _tenant_id: tenantId
});

if (!isMember) throw new Error('Unauthorized');
```

#### 4. NEVER Use SECURITY DEFINER Views

```sql
-- ❌ WRONG - Can escalate privileges
CREATE VIEW admin_stats WITH (security_definer = on) AS ...

-- ✅ CORRECT - Use SECURITY INVOKER
CREATE VIEW admin_stats WITH (security_invoker = on) AS ...
```

#### 5. ALWAYS Set search_path on Functions

```sql
-- ❌ WRONG - Vulnerable to search path attacks
CREATE FUNCTION my_func() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER AS ...

-- ✅ CORRECT - Locked to public schema
CREATE FUNCTION my_func() RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
SET search_path = public AS ...
```

### Authentication Flow

1. User signs up → `auth.users` record created
2. Trigger fires → `profiles` record created
3. Trigger fires → `user_roles` record created (first user = owner)
4. Trigger fires → Personal `tenant` created
5. Trigger fires → `membership` created (user = owner of tenant)

### Authorization Checks

**Frontend (React)**:
```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) navigate('/auth');
```

**Backend (Edge Function)**:
```typescript
const token = req.headers.get('Authorization')?.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);
if (error || !user) throw new Error('Unauthorized');
```

**Database (RLS)**:
```sql
-- Policy automatically enforces user_id = auth.uid()
CREATE POLICY "Users view own" ON table_name
  FOR SELECT USING (user_id = auth.uid());
```

---

## Deployment Guide

### Prerequisites

- Supabase project created
- Environment variables configured
- Database accessible

### Step 1: Apply Database Schema

```bash
# Copy the SQL from docs/backend/COMPLETE_BACKEND_FOUNDATION.sql
# Paste into Supabase SQL Editor
# Run the entire script
```

The script is safe to run multiple times (uses `IF NOT EXISTS` and `CREATE OR REPLACE`).

### Step 2: Configure Edge Functions

```bash
# Copy config.toml content
cp docs/backend/EDGE_FUNCTIONS_CONFIG.toml supabase/config.toml

# Deploy all functions
supabase functions deploy
```

### Step 3: Verify Deployment

Run verification checks:

```sql
-- Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check policies exist
SELECT tablename, COUNT(*) as policy_count 
FROM pg_policies 
GROUP BY tablename 
ORDER BY tablename;

-- Check helper functions exist
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace;
```

### Step 4: Test Authentication

```bash
# Run integration tests
npm test tests/integration/auth.test.ts
```

### Step 5: Test RLS

```bash
# Run penetration tests
cd tests/pentest
npm install
npm run test:all
```

Expected result: All attacks blocked (100% PASS rate)

### Step 6: Deploy Frontend

```bash
npm run build
vercel deploy --prod
```

---

## Troubleshooting

### Issue: "Row violates row-level security policy"

**Cause**: User doesn't own the resource or isn't in the tenant.

**Fix**:
1. Check `user_id` matches `auth.uid()`
2. Check `tenant_id` matches user's membership
3. Verify RLS policies are correct

### Issue: "Missing authorization header"

**Cause**: No JWT token in request.

**Fix**:
1. Ensure user is signed in
2. Pass token in Authorization header: `Bearer <token>`

### Issue: "Function returned undefined"

**Cause**: Helper function doesn't exist or returns null.

**Fix**:
1. Verify function exists: `SELECT proname FROM pg_proc WHERE proname = 'is_tenant_member';`
2. Check function definition matches expected signature

### Issue: Cross-tenant data leak

**Cause**: RLS policy doesn't properly filter by tenant_id.

**Fix**:
1. Review policy: `SELECT * FROM pg_policies WHERE tablename = 'your_table';`
2. Ensure policy checks tenant membership
3. Test with multiple users in different tenants

### Issue: Admin can see all users globally

**Cause**: Admin policy doesn't scope to tenant.

**Fix**:
```sql
-- ❌ WRONG - Global admin access
CREATE POLICY "Admins view all" ON table_name
  FOR SELECT USING (is_admin(auth.uid()));

-- ✅ CORRECT - Tenant-scoped admin access
CREATE POLICY "Admins view tenant data" ON table_name
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.role IN ('admin', 'owner')
        AND m.tenant_id = table_name.tenant_id
    )
  );
```

---

## API Reference

### Authentication Endpoints

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: { full_name: 'John Doe' }
  }
});
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
});
```

#### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Data Operations

#### Create Log
```typescript
const { data, error } = await supabase
  .from('logs')
  .insert({
    log_date: '2025-11-30',
    source: 'Finance_Log',
    metric: 'Income',
    value: 5000,
    notes: 'Salary received',
  });
```

#### Create Project
```typescript
const { data, error } = await supabase
  .from('projects')
  .insert({
    title: 'Website Redesign',
    status: 'In Progress',
    priority: 'High',
  });
```

#### Create Habit
```typescript
const { data, error } = await supabase
  .from('habits')
  .insert({
    name: 'Morning Meditation',
    description: '10 minutes daily',
  });
```

### Edge Function Invocation

```typescript
const { data, error } = await supabase.functions.invoke('calculate-ultra-score');

const { data, error } = await supabase.functions.invoke('automation-trigger', {
  body: {
    trigger_type: 'log_created',
    entity_id: logId,
  }
});
```

---

## Monitoring & Observability

### Audit Logs

All security-critical operations are logged to `audit_logs`:

```sql
SELECT 
  user_id,
  table_name,
  operation,
  created_at
FROM audit_logs
WHERE user_id = '...'
ORDER BY created_at DESC
LIMIT 100;
```

### Automation Logs

```sql
SELECT 
  event_type,
  message,
  severity,
  created_at
FROM automation_logs
WHERE user_id = '...'
ORDER BY created_at DESC;
```

### Performance Monitoring

Key metrics to track:
- API response times (p95 < 1sec)
- Database query times (p95 < 500ms)
- Error rates (< 0.5%)
- Failed authentication attempts

---

## Data Model Relationships

### Entity Relationship Diagram

```
auth.users (Supabase managed)
  ↓
profiles (1:1)
user_roles (1:N)
memberships (N:M via tenants)
  ↓
tenants (workspaces)
  ↓
logs, metrics, projects, habits, calendar_entries
  ↓
tasks (under projects)
habit_checkins (under habits)
```

### Key Relationships

- **User → Profile**: 1:1 (CASCADE delete)
- **User → Memberships**: 1:N (CASCADE delete)
- **Tenant → Memberships**: 1:N (CASCADE delete)
- **User → Logs**: 1:N (CASCADE delete)
- **Project → Tasks**: 1:N (CASCADE delete)
- **Habit → Checkins**: 1:N (CASCADE delete)

---

## Migration Best Practices

### Safe Migration Process

1. **Backup first**: Always create backup before migration
2. **Test in staging**: Apply migration to staging environment first
3. **Validate schema**: Check constraints, indexes, policies
4. **Monitor errors**: Watch logs during and after migration
5. **Rollback plan**: Have restore script ready

### Migration Script

```bash
./scripts/safe-migration.sh path/to/migration.sql
```

This script:
- Creates automatic backup
- Validates SQL syntax
- Executes migration
- Validates post-migration state
- Creates rollback script
- Rolls back automatically on failure

---

## Glossary

**Tenant**: Organization, workspace, or family unit  
**Membership**: User's relationship to a tenant with a role  
**Hub**: Life area (Finance, Health, Work, etc.)  
**Ultra Domain**: Core performance domain (7 total)  
**Ultra Score**: Composite score (0-100) across all domains  
**Automation Rule**: Condition → Action logic  
**RLS**: Row Level Security (database-enforced access control)  
**RBAC**: Role-Based Access Control  
**JWT**: JSON Web Token (authentication)

---

## Support & Resources

- **Architecture**: See `docs/SYSTEM_ARCHITECTURE.md`
- **Security**: See `docs/SECURITY_ARCHITECTURE.md`
- **API Blueprint**: See `docs/API_BLUEPRINT.md`
- **Testing**: See `tests/README.md`

---

**Document Version**: 1.0  
**Last Updated**: Phase 2 Complete  
**Maintained By**: LifeOS Backend Team
