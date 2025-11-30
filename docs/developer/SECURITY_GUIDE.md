# LifeOS Security Guide

## Table of Contents

1. [Security Architecture](#security-architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Row-Level Security (RLS)](#row-level-security-rls)
4. [Edge Function Security](#edge-function-security)
5. [Input Validation](#input-validation)
6. [Rate Limiting](#rate-limiting)
7. [Audit Logging](#audit-logging)
8. [Multi-Tenant Isolation](#multi-tenant-isolation)
9. [Security Checklist](#security-checklist)

---

## Security Architecture

LifeOS implements defense-in-depth security with multiple layers:

```
┌─────────────────────────────────────────┐
│         Client (React + Tailwind)       │
│  • Input validation                     │
│  • Sanitization                         │
└────────────────┬────────────────────────┘
                 │
                 │ HTTPS/TLS
                 │
┌────────────────▼────────────────────────┐
│      Edge Functions (Deno/TypeScript)   │
│  • JWT verification                     │
│  • User extraction from token           │
│  • Zod schema validation                │
│  • Payload size limits                  │
│  • Ownership verification               │
│  • Rate limiting                        │
│  • Audit logging                        │
└────────────────┬────────────────────────┘
                 │
                 │ Service Role Key
                 │
┌────────────────▼────────────────────────┐
│      Database (PostgreSQL + RLS)        │
│  • Row-level security policies          │
│  • Tenant-scoped data isolation         │
│  • Role-based access control            │
│  • SECURITY INVOKER views               │
│  • Secure helper functions              │
└─────────────────────────────────────────┘
```

---

## Authentication & Authorization

### JWT Authentication

All edge functions MUST require JWT authentication:

**config.toml**
```toml
[functions.your-function]
verify_jwt = true
```

**Extract user from JWT (NEVER trust client input):**
```typescript
// ✅ CORRECT
const authHeader = req.headers.get('Authorization');
if (!authHeader) {
  return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401 });
}

const token = authHeader.replace('Bearer ', '');
const { data: { user }, error } = await supabase.auth.getUser(token);

if (error || !user) {
  return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });
}

const user_id = user.id; // Always use this

// ❌ WRONG - NEVER DO THIS
const { user_id } = await req.json(); // Client can impersonate any user!
```

### Role-Based Access Control (RBAC)

LifeOS uses two role systems:

1. **App Roles** (global): `owner`, `admin`, `member`, `viewer`, `guest`
2. **Tenant Roles** (per workspace): `owner`, `admin`, `member`, `viewer`

**Check roles using security functions:**
```typescript
// Check if user is global admin
const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: user.id });

// Check if user is tenant admin
const { data: isTenantAdmin } = await supabase.rpc('is_tenant_admin_for', {
  _user_id: user.id,
  _tenant_id: tenant_id,
});
```

---

## Row-Level Security (RLS)

### Core Principles

1. **Always enable RLS** on user-data tables
2. **User isolation**: Users can only access their own data
3. **Tenant isolation**: Users can only access data within their tenants
4. **Admin scoping**: Admins can only access data within their managed tenants

### Standard RLS Policy Pattern

```sql
-- Enable RLS
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Users can SELECT their own data
CREATE POLICY "Users can view own logs"
ON public.logs
FOR SELECT
USING (user_id = auth.uid());

-- Tenant admins can SELECT data within their tenant
CREATE POLICY "Tenant admins can view logs"
ON public.logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.role IN ('admin', 'owner')
      AND m.status = 'active'
      AND (m.tenant_id = logs.tenant_id OR logs.tenant_id IS NULL)
  )
);

-- Users can INSERT their own data
CREATE POLICY "Users can insert own logs"
ON public.logs
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND (tenant_id IS NULL OR is_tenant_member(auth.uid(), tenant_id))
);

-- Users can UPDATE their own data
CREATE POLICY "Users can update own logs"
ON public.logs
FOR UPDATE
USING (
  user_id = auth.uid() 
  AND (tenant_id IS NULL OR is_tenant_member(auth.uid(), tenant_id))
);

-- Users can DELETE their own data
CREATE POLICY "Users can delete own logs"
ON public.logs
FOR DELETE
USING (
  user_id = auth.uid() 
  AND (tenant_id IS NULL OR is_tenant_member(auth.uid(), tenant_id))
);
```

### Avoid Infinite Recursion

**❌ WRONG - Causes infinite recursion:**
```sql
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  -- ↑ This references the same table, causing infinite recursion!
);
```

**✅ CORRECT - Use security definer function:**
```sql
-- Create helper function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Use in policy
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));
```

---

## Edge Function Security

### Security Checklist for Edge Functions

Every edge function MUST implement:

1. ✅ **JWT verification** (`verify_jwt = true` in config.toml)
2. ✅ **User extraction from JWT** (never trust client input)
3. ✅ **Input validation** (Zod schemas)
4. ✅ **Payload size limits** (prevent DoS)
5. ✅ **Ownership verification** (before operations)
6. ✅ **Rate limiting** (prevent abuse)
7. ✅ **Audit logging** (track privileged operations)
8. ✅ **CORS headers** (for web clients)
9. ✅ **Error sanitization** (no internal details leaked)

### Template: Secure Edge Function

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define validation schema
const RequestSchema = z.object({
  action: z.enum(['create', 'update', 'delete']),
  entity_id: z.string().uuid().optional(),
  data: z.record(z.any()),
});

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Extract user from JWT (REQUIRED)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const user_id = user.id;

    // 2. Parse and validate request body
    const rawBody = await req.json();
    
    // 3. Check payload size (prevent DoS)
    if (JSON.stringify(rawBody).length > 20000) {
      return new Response(
        JSON.stringify({ error: 'Payload too large' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. Validate with Zod
    const body = RequestSchema.parse(rawBody);

    // 5. Verify ownership if updating/deleting
    if (body.entity_id) {
      const { data: entity } = await supabase
        .from('your_table')
        .select('user_id')
        .eq('id', body.entity_id)
        .single();

      if (!entity || entity.user_id !== user_id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 6. Perform your business logic here
    // Always filter by user_id and tenant_id
    const result = await performOperation(supabase, user_id, body);

    // 7. Log audit event
    await supabase.from('audit_logs').insert({
      user_id,
      table_name: 'your_table',
      operation: body.action,
      record_id: body.entity_id || 'new',
    });

    // 8. Return success response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // 9. Return sanitized error (no internal details)
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## Input Validation

### Use Zod for All Inputs

```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

// Define strict schemas
const CreateLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  source: z.enum(['manual', 'automation', 'sync']),
  metric: z.string().max(50),
  value: z.number().min(0).max(100),
  notes: z.string().max(500).optional(),
});

// Validate
try {
  const validated = CreateLogSchema.parse(requestBody);
  // Use validated data
} catch (error) {
  return new Response(
    JSON.stringify({ error: 'Invalid input', details: error.errors }),
    { status: 400 }
  );
}
```

### Common Validation Patterns

```typescript
// UUID validation
z.string().uuid()

// Enum validation
z.enum(['option1', 'option2', 'option3'])

// Date validation (ISO 8601)
z.string().datetime()

// Email validation
z.string().email()

// Number range
z.number().min(0).max(100)

// String length
z.string().min(3).max(100)

// Array validation
z.array(z.string().uuid()).min(1).max(10)
```

---

## Rate Limiting

### Implementation

Use the `automation_context_cache` table for rate limiting:

```typescript
async function checkRateLimit(
  supabase: SupabaseClient,
  user_id: string,
  action: string,
  windowSeconds: number,
  maxRequests: number
): Promise<boolean> {
  const cacheKey = `rate_limit:${user_id}:${action}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Get recent requests
  const { data: cached } = await supabase
    .from('automation_context_cache')
    .select('cache_value, created_at')
    .eq('user_id', user_id)
    .eq('cache_key', cacheKey)
    .gte('created_at', windowStart.toISOString())
    .order('created_at', { ascending: false });

  if (cached && cached.length >= maxRequests) {
    return false; // Rate limit exceeded
  }

  // Log this request
  await supabase.from('automation_context_cache').insert({
    user_id,
    cache_key: cacheKey,
    cache_value: { timestamp: now.toISOString() },
    expires_at: new Date(now.getTime() + windowSeconds * 1000).toISOString(),
  });

  return true; // Within rate limit
}
```

### Recommended Limits

| Operation | Rate Limit |
|-----------|-----------|
| Login attempts | 5 per minute |
| Data mutations | 20 per minute |
| Heavy computations (Ultra Score) | 10 per minute |
| Exports | 2 per hour |
| Tenant creation | 5 total per user |

---

## Audit Logging

### Log All Privileged Operations

```typescript
await supabase.from('audit_logs').insert({
  user_id,
  table_name: 'projects',
  record_id: project_id,
  operation: 'DELETE',
  old_values: project,
  ip_address: req.headers.get('x-forwarded-for'),
  user_agent: req.headers.get('user-agent'),
});
```

### What to Log

✅ **DO log:**
- User authentication events (login, logout, failed attempts)
- Data mutations (create, update, delete)
- Permission changes
- Admin actions
- Sensitive data access
- Rate limit violations
- Security violations

❌ **DON'T log:**
- Passwords or secrets
- Personal identifiable information (PII) in clear text
- Full request bodies (may contain secrets)

---

## Multi-Tenant Isolation

### Key Principles

1. **Every user data table** must have `tenant_id` column
2. **All queries** must filter by `tenant_id`
3. **Admin access** must be scoped per tenant
4. **No global admin** can see all tenant data

### Tenant-Scoped Query Pattern

```typescript
// ✅ CORRECT - Tenant-scoped
const { data } = await supabase
  .from('logs')
  .select('*')
  .eq('user_id', user_id)
  .eq('tenant_id', tenant_id); // Always include!

// ❌ WRONG - Global query
const { data } = await supabase
  .from('logs')
  .select('*')
  .eq('user_id', user_id); // Missing tenant_id!
```

---

## Security Checklist

### Before Deploying

- [ ] All edge functions have `verify_jwt = true`
- [ ] No edge function accepts `user_id` from request body
- [ ] All user inputs validated with Zod schemas
- [ ] Payload size limits enforced (<20KB)
- [ ] RLS enabled on all user data tables
- [ ] Tenant isolation enforced in all policies
- [ ] Admin views use `SECURITY INVOKER`
- [ ] No direct references to `auth.users` in views
- [ ] Helper functions use `SET search_path = public`
- [ ] Rate limiting implemented on sensitive endpoints
- [ ] Audit logging tracks all privileged operations
- [ ] Error messages don't leak internal details
- [ ] CORS headers configured correctly
- [ ] Tenant creation rate limited (5 max)
- [ ] Leaked password protection enabled in Supabase Auth

### Testing Checklist

- [ ] Attempt cross-user data access (should fail)
- [ ] Attempt cross-tenant data access (should fail)
- [ ] Attempt edge function call without JWT (should fail)
- [ ] Attempt edge function call with forged JWT (should fail)
- [ ] Attempt user impersonation via request body (should fail)
- [ ] Attempt SQL injection in inputs (should fail)
- [ ] Exceed rate limits (should be blocked)
- [ ] Create 6th tenant as owner (should fail)

---

## Contact

For security concerns or to report vulnerabilities, contact: security@lifeos.app

**Do not** publicly disclose security vulnerabilities. Use private channels.
