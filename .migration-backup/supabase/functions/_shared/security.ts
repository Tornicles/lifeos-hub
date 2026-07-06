/**
 * Shared Security Utilities for Edge Functions
 * 
 * Provides rate limiting, audit logging, error handling,
 * and other security utilities for Supabase edge functions.
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

// Security headers for all responses
export const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

// Rate limit configuration
export const RATE_LIMITS = {
  'auth:login': { requests: 5, window: 60 },
  'auth:signup': { requests: 3, window: 60 },
  'data:create': { requests: 20, window: 60 },
  'data:update': { requests: 30, window: 60 },
  'data:query': { requests: 100, window: 60 },
  'export:generate': { requests: 2, window: 3600 },
};

/**
 * Initialize Supabase client with service role
 */
export function getSupabaseClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Get authenticated user from request
 * Extracts JWT from Authorization header and validates
 */
export async function getAuthUser(req: Request, supabase: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  
  if (!authHeader) {
    throw new AuthError('Missing authorization header', 401);
  }
  
  const token = authHeader.replace('Bearer ', '');
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new AuthError('Invalid or expired token', 401);
  }
  
  return user;
}

/**
 * Check rate limit for user/action combination
 * Uses automation_context_cache as simple rate limit store
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  action: keyof typeof RATE_LIMITS,
  ipAddress?: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const limit = RATE_LIMITS[action];
  const identifier = ipAddress || userId;
  const cacheKey = `ratelimit:${identifier}:${action}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + limit.window * 1000);
  
  try {
    // Get current count
    const { data: cached } = await supabase
      .from('automation_context_cache')
      .select('cache_value, expires_at')
      .eq('cache_key', cacheKey)
      .eq('user_id', userId)
      .gte('expires_at', now.toISOString())
      .maybeSingle();
    
    const count = cached ? ((cached.cache_value as any).count || 0) : 0;
    
    if (count >= limit.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(cached?.expires_at || expiresAt),
      };
    }
    
    // Increment counter
    await supabase.from('automation_context_cache').upsert({
      user_id: userId,
      cache_key: cacheKey,
      cache_value: { count: count + 1, action, timestamp: now.toISOString() },
      expires_at: expiresAt.toISOString(),
    });
    
    return {
      allowed: true,
      remaining: limit.requests - count - 1,
      resetAt: expiresAt,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow request (fail open for availability)
    return { allowed: true, remaining: limit.requests, resetAt: expiresAt };
  }
}

/**
 * Log audit event
 * Records security-relevant actions for compliance and forensics
 */
export async function logAuditEvent(
  supabase: SupabaseClient,
  event: {
    userId: string;
    tableName: string;
    recordId: string;
    operation: 'INSERT' | 'UPDATE' | 'DELETE';
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const changedFields = event.oldValues && event.newValues
      ? Object.keys(event.newValues).filter(
          key => event.oldValues![key] !== event.newValues![key]
        )
      : undefined;
    
    await supabase.from('audit_logs').insert({
      user_id: event.userId,
      table_name: event.tableName,
      record_id: event.recordId,
      operation: event.operation,
      old_values: event.oldValues || null,
      new_values: event.newValues || null,
      changed_fields: changedFields || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null,
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit logging error:', error);
  }
}

/**
 * Log security event
 * Wrapper around audit logging for security-specific events
 */
export async function logSecurityEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent(supabase, {
    userId,
    tableName: 'security_events',
    recordId: eventType,
    operation: 'INSERT',
    newValues: details,
    ipAddress,
    userAgent,
  });
}

/**
 * Extract IP address from request
 */
export function getIpAddress(req: Request): string | undefined {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || req.headers.get('x-real-ip')
    || undefined;
}

/**
 * Extract user agent from request
 */
export function getUserAgent(req: Request): string | undefined {
  return req.headers.get('user-agent') || undefined;
}

/**
 * Create error response with proper security headers
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: any
): Response {
  return new Response(
    JSON.stringify({
      error: message,
      ...(details && { details }),
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...securityHeaders,
      },
    }
  );
}

/**
 * Create success response with proper security headers
 */
export function createSuccessResponse(
  data: any,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
        ...securityHeaders,
      },
    }
  );
}

/**
 * Validate request method
 */
export function validateMethod(
  req: Request,
  allowedMethods: string[]
): void {
  if (req.method === 'OPTIONS') {
    return; // CORS preflight
  }
  
  if (!allowedMethods.includes(req.method)) {
    throw new ValidationError(
      `Method ${req.method} not allowed. Allowed: ${allowedMethods.join(', ')}`,
      405
    );
  }
}

/**
 * Check if user has required role
 */
export async function checkRole(
  supabase: SupabaseClient,
  userId: string,
  requiredRole: 'owner' | 'member' | 'viewer' | 'guest'
): Promise<boolean> {
  const { data, error } = await supabase.rpc('has_role', {
    _user_id: userId,
    _role: requiredRole,
  });
  
  if (error) {
    console.error('Role check error:', error);
    return false;
  }
  
  return data === true;
}

/**
 * Custom error classes
 */
export class AuthError extends Error {
  constructor(message: string, public status: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ValidationError extends Error {
  constructor(message: string, public status: number = 400) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string,
    public status: number = 429,
    public resetAt?: Date
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class PermissionError extends Error {
  constructor(message: string, public status: number = 403) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * Global error handler for edge functions
 * Sanitizes errors and logs them appropriately
 */
export function handleError(error: unknown, userId?: string): Response {
  console.error('Edge function error:', error);
  
  // Known error types with appropriate responses
  if (error instanceof AuthError) {
    return createErrorResponse(error.message, error.status);
  }
  
  if (error instanceof ValidationError) {
    return createErrorResponse(error.message, error.status);
  }
  
  if (error instanceof RateLimitError) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...corsHeaders,
      ...securityHeaders,
    };
    
    if (error.resetAt) {
      headers['X-RateLimit-Reset'] = error.resetAt.toISOString();
    }
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: error.status, headers }
    );
  }
  
  if (error instanceof PermissionError) {
    return createErrorResponse(error.message, error.status);
  }
  
  // Generic error - don't leak internal details
  return createErrorResponse(
    'An internal error occurred. Please try again later.',
    500
  );
}

/**
 * Sanitize user input
 * Remove potentially dangerous characters and patterns
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[\x00-\x1F\x7F]/g, '')
    .slice(0, 10000);
}

/**
 * Validate and sanitize JSON body
 */
export async function parseJsonBody<T>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    
    // Recursively sanitize string values
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return sanitizeInput(obj);
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = sanitize(value);
        }
        return result;
      }
      return obj;
    };
    
    return sanitize(body) as T;
  } catch (error) {
    throw new ValidationError('Invalid JSON body');
  }
}
