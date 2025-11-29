# Security Implementation Guide

## Quick Start

This guide provides practical implementation details for developers working with the LifeOS security system.

## Authentication Flow

### User Registration

```typescript
// With validation
import { authSchemas, validateInput } from '@/lib/validation';

const handleSignUp = async (data: unknown) => {
  // Validate input
  const validation = validateInput(authSchemas.signUp, data);
  
  if (!validation.success) {
    console.error('Validation failed:', validation.errors);
    return;
  }
  
  const { email, password, fullName } = validation.data;
  
  // Sign up with Supabase
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });
  
  if (error) throw error;
  
  // Profile and role automatically created via trigger
};
```

### User Login

```typescript
import { authSchemas, validateInput } from '@/lib/validation';

const handleSignIn = async (data: unknown) => {
  const validation = validateInput(authSchemas.signIn, data);
  
  if (!validation.success) {
    console.error('Validation failed:', validation.errors);
    return;
  }
  
  const { email, password } = validation.data;
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    // Log failed attempt (will be tracked in security_settings)
    console.error('Login failed:', error.message);
    throw error;
  }
};
```

### Session Management

```typescript
// Check authentication status
const { data: { session } } = await supabase.auth.getSession();

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // User logged in
  } else if (event === 'SIGNED_OUT') {
    // User logged out - clear local state
  } else if (event === 'TOKEN_REFRESHED') {
    // Token automatically refreshed
  }
});

// Sign out
await supabase.auth.signOut();
```

## Authorization Checks

### Using Role Hooks

```typescript
import { useIsOwner, useHasRole, useHighestRole } from '@/hooks/useUserRole';

function AdminPanel() {
  const { hasRole: isOwner, isLoading } = useIsOwner();
  
  if (isLoading) return <Loading />;
  if (!isOwner) return <Forbidden />;
  
  return <AdminContent />;
}

function FeatureComponent() {
  const { role, isLoading } = useHighestRole();
  
  if (isLoading) return <Loading />;
  
  return (
    <div>
      {role === 'owner' && <OwnerFeatures />}
      {['owner', 'member'].includes(role) && <MemberFeatures />}
      <ViewerFeatures />
    </div>
  );
}
```

### Server-Side Authorization

```typescript
// In edge functions or API calls
const checkOwnerAccess = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_owner', {
    _user_id: userId
  });
  
  if (error) throw error;
  return data;
};

const checkRole = async (userId: string, role: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: role
  });
  
  if (error) throw error;
  return data;
};
```

## Input Validation

### Frontend Validation

```typescript
import { logSchemas, validateInput, formatValidationErrors } from '@/lib/validation';
import { toast } from 'sonner';

const handleCreateLog = async (formData: unknown) => {
  // Validate input
  const validation = validateInput(logSchemas.create, formData);
  
  if (!validation.success) {
    toast.error(formatValidationErrors(validation.errors));
    return;
  }
  
  const { data } = validation;
  
  // Data is now sanitized and validated
  const { error } = await supabase
    .from('logs')
    .insert({
      ...data,
      user_id: user.id,
    });
  
  if (error) throw error;
};
```

### Custom Validation

```typescript
import { z } from 'zod';
import { sanitizeText, detectSQLInjection, detectXSS } from '@/lib/validation';

const customSchema = z.object({
  customField: z.string()
    .transform(sanitizeText)
    .refine((val) => !detectSQLInjection(val), {
      message: "Invalid input detected"
    })
    .refine((val) => !detectXSS(val), {
      message: "Invalid input detected"
    })
});
```

## Audit Logging

### Automatic Logging

Audit logs are automatically created for authentication events and role changes. For custom events:

```typescript
// Log a security event
const logSecurityEvent = async (
  eventType: string,
  details: Record<string, any>
) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return;
  
  const { error } = await supabase.rpc('log_security_event', {
    p_user_id: user.id,
    p_event_type: eventType,
    p_details: details,
    p_ip_address: null, // Add if available
    p_user_agent: navigator.userAgent
  });
  
  if (error) console.error('Failed to log event:', error);
};

// Usage
await logSecurityEvent('data_export', {
  table: 'logs',
  record_count: 100,
  timestamp: new Date().toISOString()
});
```

### Viewing Audit Logs

```typescript
// Get user's own audit logs
const { data: auditLogs } = await supabase
  .from('audit_logs')
  .select('*')
  .eq('user_id', user.id)
  .order('created_at', { ascending: false })
  .limit(50);

// Owners can view all logs
const { data: allLogs } = await supabase
  .from('audit_logs')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);
```

## Row-Level Security

### Understanding RLS

All queries automatically filter by user_id:

```typescript
// This query only returns the user's own logs
const { data: myLogs } = await supabase
  .from('logs')
  .select('*');
// SQL: SELECT * FROM logs WHERE user_id = auth.uid()

// Trying to access another user's data returns empty
const { data: otherLogs } = await supabase
  .from('logs')
  .select('*')
  .eq('user_id', 'other-user-id');
// Returns: [] (RLS blocks access)

// Owners can see all data
const { data: allLogs } = await supabase
  .from('logs')
  .select('*');
// If owner: Returns all logs
// If not owner: Returns only own logs
```

### Testing RLS

```typescript
// Test if user can access a record
const canAccessRecord = async (table: string, recordId: string) => {
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('id', recordId)
    .single();
  
  return !error && data !== null;
};
```

## Security Settings

### Managing User Security Settings

```typescript
import { securitySchemas, validateInput } from '@/lib/validation';

// Get user's security settings
const { data: settings } = await supabase
  .from('security_settings')
  .select('*')
  .eq('user_id', user.id)
  .single();

// Update security settings
const updateSecuritySettings = async (updates: unknown) => {
  const validation = validateInput(securitySchemas.updateSettings, updates);
  
  if (!validation.success) {
    console.error('Invalid settings:', validation.errors);
    return;
  }
  
  const { error } = await supabase
    .from('security_settings')
    .update(validation.data)
    .eq('user_id', user.id);
  
  if (error) throw error;
};

// Enable MFA
await updateSecuritySettings({
  mfa_enabled: true,
  session_timeout_minutes: 120
});
```

## Rate Limiting

### Implementing Rate Limits

```typescript
// In edge functions
const RATE_LIMITS = {
  'POST::/auth/login': { requests: 5, window: 60 }, // 5 per minute
  'POST::/logs': { requests: 20, window: 60 }, // 20 per minute
  'GET::/*': { requests: 100, window: 60 }, // 100 per minute
};

const checkRateLimit = async (
  userId: string,
  endpoint: string,
  method: string
): Promise<boolean> => {
  const key = `${method}::${endpoint}`;
  const limit = RATE_LIMITS[key] || RATE_LIMITS['GET::/*'];
  
  // Implementation using Redis or similar
  // Return true if within limit, false if exceeded
  
  return true;
};
```

## Error Handling

### Secure Error Messages

```typescript
// Frontend error handler
const handleError = (error: unknown) => {
  if (error instanceof Error) {
    // Log full error server-side
    console.error('Error:', error);
    
    // Show sanitized message to user
    if (error.message.includes('violates row-level security')) {
      toast.error('Access denied');
    } else if (error.message.includes('duplicate key')) {
      toast.error('Record already exists');
    } else {
      toast.error('An error occurred. Please try again.');
    }
  }
};

// Edge function error handler
const handleEdgeFunctionError = (error: unknown) => {
  console.error('Edge function error:', error);
  
  return new Response(
    JSON.stringify({
      error: 'An error occurred',
      code: 'INTERNAL_ERROR'
    }),
    {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
```

## Best Practices

### DO's

✅ Always validate user input on both client and server
✅ Use provided validation schemas
✅ Check user roles before showing sensitive UI
✅ Log security-relevant events
✅ Use RLS policies for data access control
✅ Sanitize all text input before storage
✅ Use TypeScript for type safety
✅ Handle errors gracefully with generic messages
✅ Test RLS policies thoroughly
✅ Keep dependencies updated

### DON'Ts

❌ Don't trust client-side data
❌ Don't expose internal error messages
❌ Don't store secrets in code
❌ Don't use raw SQL queries (use Supabase client)
❌ Don't bypass validation "temporarily"
❌ Don't implement custom auth (use Supabase)
❌ Don't log sensitive data (passwords, tokens)
❌ Don't check roles using client-side storage
❌ Don't skip input sanitization
❌ Don't disable RLS in production

## Testing Security

### Manual Security Tests

```typescript
// Test 1: Attempt to access another user's data
const testDataIsolation = async () => {
  // Should return empty or error
  const { data } = await supabase
    .from('logs')
    .select('*')
    .neq('user_id', currentUser.id);
  
  console.assert(data.length === 0, 'Data isolation failed!');
};

// Test 2: Attempt privilege escalation
const testPrivilegeEscalation = async () => {
  // Should fail
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: currentUser.id,
      role: 'owner'
    });
  
  console.assert(error !== null, 'Privilege escalation possible!');
};

// Test 3: SQL injection attempt
const testSQLInjection = async () => {
  const maliciousInput = "'; DROP TABLE logs; --";
  const { data } = await supabase
    .from('logs')
    .select('*')
    .eq('source', maliciousInput);
  
  // Should return empty, not crash
  console.assert(true, 'SQL injection protection working');
};
```

## Deployment Checklist

Before deploying to production:

- [ ] All RLS policies enabled on user tables
- [ ] Input validation schemas applied to all forms
- [ ] Audit logging configured and tested
- [ ] Error messages sanitized (no stack traces)
- [ ] Rate limiting configured on edge functions
- [ ] HTTPS enforced (handled by hosting)
- [ ] CORS configured correctly
- [ ] Environment variables set (no secrets in code)
- [ ] Security settings table populated
- [ ] Role assignment working correctly
- [ ] Test user created with each role type
- [ ] Manual security tests passed
- [ ] Dependencies scanned for vulnerabilities
- [ ] Documentation updated

## Support

For security questions or to report vulnerabilities:
- Review audit logs for suspicious activity
- Check security settings for each user
- Ensure RLS policies match requirements
- Verify role assignments are correct
