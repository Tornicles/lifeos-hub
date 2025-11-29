/**
 * Example Secure Edge Function
 * 
 * Demonstrates best practices for secure edge function implementation:
 * - Rate limiting
 * - Authentication
 * - Authorization (RBAC)
 * - Input validation
 * - Audit logging
 * - Error handling
 * - CORS
 * 
 * Use this as a template for creating new edge functions.
 */

import {
  corsHeaders,
  getSupabaseClient,
  getAuthUser,
  checkRateLimit,
  logAuditEvent,
  createErrorResponse,
  createSuccessResponse,
  validateMethod,
  handleError,
  parseJsonBody,
  RateLimitError,
  getIpAddress,
  getUserAgent,
} from '../_shared/security.ts';

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // 1. Validate HTTP method
    validateMethod(req, ['GET', 'POST']);

    // 2. Initialize Supabase client
    const supabase = getSupabaseClient();

    // 3. Authenticate user
    const user = await getAuthUser(req, supabase);

    // 4. Rate limiting
    const ipAddress = getIpAddress(req);
    const rateLimit = await checkRateLimit(
      supabase,
      user.id,
      'data:query',
      ipAddress
    );

    if (!rateLimit.allowed) {
      throw new RateLimitError(
        'Rate limit exceeded. Please try again later.',
        429,
        rateLimit.resetAt
      );
    }

    // 5. Handle request based on method
    if (req.method === 'GET') {
      // GET: Retrieve data
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Log data access (optional for GET)
      await logAuditEvent(supabase, {
        userId: user.id,
        tableName: 'logs',
        recordId: 'query',
        operation: 'INSERT',
        newValues: { action: 'query_logs', count: data.length },
        ipAddress,
        userAgent: getUserAgent(req),
      });

      return createSuccessResponse({
        data,
        rateLimit: {
          remaining: rateLimit.remaining,
          resetAt: rateLimit.resetAt,
        },
      });
    }

    if (req.method === 'POST') {
      // POST: Create data
      const body = await parseJsonBody(req);

      // Validate body (use zod schema in production)
      if (!body || typeof body !== 'object') {
        return createErrorResponse('Invalid request body', 400);
      }

      // Create record (RLS automatically enforces user_id)
      const { data, error } = await supabase
        .from('logs')
        .insert({
          ...body,
          user_id: user.id, // Always set from auth, never trust client
        })
        .select()
        .single();

      if (error) throw error;

      // Log creation
      await logAuditEvent(supabase, {
        userId: user.id,
        tableName: 'logs',
        recordId: data.id,
        operation: 'INSERT',
        newValues: data,
        ipAddress,
        userAgent: getUserAgent(req),
      });

      return createSuccessResponse(
        { data },
        201
      );
    }

    return createErrorResponse('Method not implemented', 501);
  } catch (error) {
    return handleError(error);
  }
});
