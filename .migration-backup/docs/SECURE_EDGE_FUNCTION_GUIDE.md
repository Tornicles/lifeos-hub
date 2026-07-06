# Secure Edge Function Development Guide

## Overview

This guide provides step-by-step instructions for creating secure Supabase Edge Functions for LifeOS, incorporating all security best practices.

## Template Usage

Use `supabase/functions/secure-example/index.ts` as your starting template. It implements:

✅ CORS handling
✅ Authentication & authorization
✅ Rate limiting
✅ Input validation & sanitization
✅ Audit logging
✅ Error handling
✅ Security headers

## Step-by-Step Guide

### 1. Create New Edge Function

```bash
# Copy template
cp supabase/functions/secure-example/index.ts supabase/functions/my-function/index.ts

# Edit config.toml to register function
# Add to supabase/config.toml:
[functions.my-function]
verify_jwt = true  # Require authentication (default: true)
```

### 2. Define Function Purpose

```typescript
/**
 * My Function - Brief Description
 * 
 * Purpose: What does this function do?
 * Authentication: Required/Optional
 * Rate Limit: X requests per Y seconds
 * Permissions: Which roles can use this?
 * 
 * Request:
 *  - Method: POST
 *  - Body: { field1: string, field2: number }
 * 
 * Response:
 *  - Success: { data: {...}, rateLimit: {...} }
 *  - Error: { error: string }
 */
```

### 3. Implement Authentication

```typescript
// Always authenticate first
const user = await getAuthUser(req, supabase);

// For public endpoints (rare), check config.toml instead
[functions.my-function]
verify_jwt = false
```

### 4. Implement Authorization (RBAC)

```typescript
// Check if user has required role
const isOwner = await checkRole(supabase, user.id, 'owner');

if (!isOwner) {
  throw new PermissionError(
    'This action requires owner permissions'
  );
}

// Or check multiple roles
const hasAccess = await checkRole(supabase, user.id, 'owner')
  || await checkRole(supabase, user.id, 'member');
```

### 5. Implement Rate Limiting

```typescript
// Choose appropriate rate limit category
const rateLimit = await checkRateLimit(
  supabase,
  user.id,
  'data:create',  // Options: auth:login, auth:signup, data:create, data:query, export:generate
  getIpAddress(req)
);

if (!rateLimit.allowed) {
  throw new RateLimitError(
    'Rate limit exceeded',
    429,
    rateLimit.resetAt
  );
}

// Return rate limit info in response
return createSuccessResponse({
  data: result,
  rateLimit: {
    remaining: rateLimit.remaining,
    resetAt: rateLimit.resetAt,
  },
});
```

### 6. Validate & Sanitize Input

```typescript
// Parse and sanitize JSON body
const body = await parseJsonBody<ExpectedType>(req);

// Validate with zod (recommended)
import { z } from 'https://deno.land/x/zod/mod.ts';

const schema = z.object({
  title: z.string().min(1).max(200),
  value: z.number().min(0).max(100),
  notes: z.string().max(5000).optional(),
});

const validated = schema.parse(body);

// Check for SQL injection / XSS patterns (defense in depth)
if (detectSQLInjection(validated.title)) {
  throw new ValidationError('Invalid input detected');
}
```

### 7. Database Operations

```typescript
// ALWAYS set user_id from auth token, NEVER from request body
const { data, error } = await supabase
  .from('table_name')
  .insert({
    ...validated,
    user_id: user.id,  // Critical: Always from token
  })
  .select()
  .single();

if (error) {
  console.error('Database error:', error);
  throw new Error('Failed to create record');
}

// RLS automatically filters queries by user_id
const { data: userRecords } = await supabase
  .from('table_name')
  .select('*');  // Only returns user's records
```

### 8. Audit Logging

```typescript
// Log all data mutations (INSERT, UPDATE, DELETE)
await logAuditEvent(supabase, {
  userId: user.id,
  tableName: 'logs',
  recordId: data.id,
  operation: 'INSERT',
  newValues: data,
  ipAddress: getIpAddress(req),
  userAgent: getUserAgent(req),
});

// For updates, include old values
await logAuditEvent(supabase, {
  userId: user.id,
  tableName: 'logs',
  recordId: recordId,
  operation: 'UPDATE',
  oldValues: existingRecord,
  newValues: updatedRecord,
  ipAddress: getIpAddress(req),
  userAgent: getUserAgent(req),
});

// For security-relevant events
await logSecurityEvent(
  supabase,
  user.id,
  'data_export',
  { recordCount: 1000, format: 'csv' },
  getIpAddress(req),
  getUserAgent(req)
);
```

### 9. Error Handling

```typescript
try {
  // Your function logic
  
  return createSuccessResponse({ data: result });
} catch (error) {
  // Global error handler sanitizes errors
  return handleError(error, user?.id);
}

// Custom errors for specific scenarios
if (invalidCondition) {
  throw new ValidationError('Specific validation message');
}

if (notAuthorized) {
  throw new PermissionError('Insufficient permissions');
}

if (rateLimitExceeded) {
  throw new RateLimitError('Too many requests', 429, resetDate);
}
```

### 10. Response Format

```typescript
// Success response
return createSuccessResponse({
  data: yourData,
  meta: {
    timestamp: new Date().toISOString(),
    version: '1.0',
  },
  rateLimit: {
    remaining: rateLimit.remaining,
    resetAt: rateLimit.resetAt,
  },
});

// Error response (handled automatically by handleError)
return createErrorResponse(
  'User-friendly error message',
  400,  // Status code
  { field: 'title', issue: 'too_long' }  // Optional details
);
```

## Security Checklist

Before deploying an edge function, verify:

- [ ] **Authentication**: User identity verified via JWT
- [ ] **Authorization**: Role/permission checks implemented
- [ ] **Rate Limiting**: Appropriate limits configured
- [ ] **Input Validation**: All inputs validated and sanitized
- [ ] **User ID Source**: Always from auth token, never from request
- [ ] **RLS Reliance**: Trusting RLS policies for data isolation
- [ ] **Audit Logging**: Critical operations logged
- [ ] **Error Handling**: Generic errors, no stack traces
- [ ] **CORS Headers**: Configured correctly
- [ ] **Security Headers**: HSTS, X-Frame-Options, etc.
- [ ] **Secrets**: No hardcoded credentials
- [ ] **SQL Injection**: Using parameterized queries (Supabase client)
- [ ] **XSS Prevention**: Input sanitization implemented
- [ ] **Documentation**: Purpose and usage documented

## Common Patterns

### Pattern 1: Simple CRUD with Security

```typescript
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    validateMethod(req, ['GET', 'POST', 'PUT', 'DELETE']);
    const supabase = getSupabaseClient();
    const user = await getAuthUser(req, supabase);
    
    const rateLimit = await checkRateLimit(supabase, user.id, 'data:create');
    if (!rateLimit.allowed) {
      throw new RateLimitError('Rate limit exceeded', 429, rateLimit.resetAt);
    }

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { data, error } = await supabase
        .from('table')
        .insert({ ...body, user_id: user.id })
        .select()
        .single();
      
      if (error) throw error;
      
      await logAuditEvent(supabase, {
        userId: user.id,
        tableName: 'table',
        recordId: data.id,
        operation: 'INSERT',
        newValues: data,
      });
      
      return createSuccessResponse({ data }, 201);
    }

    // ... other methods

  } catch (error) {
    return handleError(error);
  }
});
```

### Pattern 2: Owner-Only Admin Function

```typescript
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabase = getSupabaseClient();
    const user = await getAuthUser(req, supabase);
    
    // Check owner permission
    const isOwner = await checkRole(supabase, user.id, 'owner');
    if (!isOwner) {
      throw new PermissionError('Owner access required');
    }

    // Admin operations...
    
    await logSecurityEvent(
      supabase,
      user.id,
      'admin_action',
      { action: 'performed_admin_task' }
    );

    return createSuccessResponse({ success: true });
  } catch (error) {
    return handleError(error);
  }
});
```

### Pattern 3: Data Export with Enhanced Logging

```typescript
Deno.serve(async (req) => {
  try {
    const supabase = getSupabaseClient();
    const user = await getAuthUser(req, supabase);
    
    // Strict rate limit for exports
    const rateLimit = await checkRateLimit(supabase, user.id, 'export:generate');
    if (!rateLimit.allowed) {
      throw new RateLimitError('Export limit exceeded', 429, rateLimit.resetAt);
    }

    // Fetch data
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;

    // Log export with details
    await logSecurityEvent(
      supabase,
      user.id,
      'data_export',
      {
        table: 'logs',
        recordCount: data.length,
        format: 'json',
        timestamp: new Date().toISOString(),
      },
      getIpAddress(req),
      getUserAgent(req)
    );

    return createSuccessResponse({
      data,
      meta: {
        count: data.length,
        exportedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleError(error);
  }
});
```

## Testing Edge Functions

### Local Testing

```bash
# Start local Supabase
supabase start

# Test function
supabase functions serve secure-example --env-file supabase/.env.local

# Call function
curl -i --location --request POST 'http://localhost:54321/functions/v1/secure-example' \
  --header 'Authorization: Bearer YOUR_JWT_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{\\\"test\\\": \\\"data\\\"}'
```

### Security Testing

```typescript
// Test 1: Unauthorized access
fetch(url, { /* no auth header */ })
// Expected: 401

// Test 2: Invalid JWT
fetch(url, { headers: { Authorization: 'Bearer invalid' } })
// Expected: 401

// Test 3: Rate limiting
for (let i = 0; i < 10; i++) {
  fetch(url, { /* valid auth */ });
}
// Expected: 429 after limit

// Test 4: IDOR attempt
fetch(url + '?user_id=other-user-id', { /* valid auth */ })
// Expected: Empty result (RLS blocks)

// Test 5: SQL injection
fetch(url, {
  body: JSON.stringify({ notes: \"; DROP TABLE logs;--\" })
})
// Expected: Rejected by validation
```

## Deployment

```bash
# Deploy single function
npm run deploy:function secure-example

# Deploy all functions
npm run deploy:functions

# Check logs
supabase functions logs secure-example
```

## Monitoring

Monitor these metrics for each function:

- **Request volume**: Requests per minute
- **Error rate**: 4xx and 5xx responses
- **Response time**: P50, P95, P99 latency
- **Rate limit hits**: How often limits are reached
- **Auth failures**: Invalid tokens, missing auth
- **Permission denials**: Authorization failures

Set up alerts for:
- Error rate > 5%
- Response time P95 > 1 second
- Rate limit hits > 100/hour
- Auth failures > 50/hour

## Best Practices Summary

1. **Never trust client input** - Always validate and sanitize
2. **Always authenticate** - Verify JWT on every request
3. **Check permissions** - Don't assume authentication = authorization
4. **Use RLS** - Let database enforce data isolation
5. **Rate limit** - Protect against abuse
6. **Log security events** - Audit trail for compliance
7. **Handle errors securely** - Don't leak internal details
8. **Test thoroughly** - Security testing is not optional
9. **Monitor production** - Detect issues before users report
10. **Keep it simple** - Complex code has more vulnerabilities

## Common Mistakes to Avoid

❌ Trusting `user_id` from request body
❌ Skipping input validation "just this once"
❌ Returning detailed error messages
❌ Bypassing rate limits for "trusted" users
❌ Not logging sensitive operations
❌ Hardcoding secrets in code
❌ Forgetting CORS preflight handling
❌ Not checking role/permissions
❌ Exposing internal IDs or structure
❌ Implementing custom auth logic

## Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [LifeOS Security Architecture](./ADVANCED_SECURITY_ARCHITECTURE.md)
- [Security Implementation Guide](./SECURITY_IMPLEMENTATION_GUIDE.md)
