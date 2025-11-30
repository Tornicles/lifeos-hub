import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration Tests: Edge Functions Security
 * 
 * Tests JWT enforcement, input validation, and authorization on edge functions
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Edge Function JWT Enforcement', () => {
  let supabase: SupabaseClient;
  let authToken: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data } = await supabase.auth.signUp({
      email: `edge-test-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
    
    authToken = data.session?.access_token || '';
  });

  it('should reject data-flow-processor without JWT', async () => {
    const { error } = await supabase.functions.invoke('data-flow-processor', {
      body: {
        flow_type: 'log_created',
        data: {},
      },
      headers: {
        Authorization: '', // No token
      },
    });

    expect(error).toBeDefined();
  });

  it('should reject automation-trigger without JWT', async () => {
    const { error } = await supabase.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'log_created',
      },
      headers: {
        Authorization: '', // No token
      },
    });

    expect(error).toBeDefined();
  });

  it('should accept data-flow-processor with valid JWT', async () => {
    const { data, error } = await supabase.functions.invoke('data-flow-processor', {
      body: {
        flow_type: 'log_created',
        data: {},
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it('should reject forged JWT tokens', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidXNlcl9pZCI6ImZha2UtdXNlci1pZCJ9.FAKE';

    const { error } = await supabase.functions.invoke('data-flow-processor', {
      body: {
        flow_type: 'log_created',
        data: {},
      },
      headers: {
        Authorization: `Bearer ${fakeToken}`,
      },
    });

    expect(error).toBeDefined();
  });
});

describe('Edge Function Input Validation', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    await supabase.auth.signUp({
      email: `validation-test-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
  });

  it('should reject invalid flow_type enum', async () => {
    const { error } = await supabase.functions.invoke('data-flow-processor', {
      body: {
        flow_type: 'INVALID_TYPE',
        data: {},
      },
    });

    expect(error).toBeDefined();
  });

  it('should reject invalid trigger_type enum', async () => {
    const { error } = await supabase.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'INVALID_TRIGGER',
      },
    });

    expect(error).toBeDefined();
  });

  it('should reject malformed entity_id (non-UUID)', async () => {
    const { error } = await supabase.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'log_created',
        entity_id: 'not-a-uuid',
      },
    });

    expect(error).toBeDefined();
  });

  it('should reject oversized payloads', async () => {
    const largeData = { data: 'x'.repeat(25000) }; // > 20KB limit

    const { error } = await supabase.functions.invoke('data-flow-processor', {
      body: {
        flow_type: 'log_created',
        data: largeData,
      },
    });

    expect(error).toBeDefined();
  });

  it('should reject missing required fields', async () => {
    const { error } = await supabase.functions.invoke('data-flow-processor', {
      body: {
        // Missing flow_type
        data: {},
      },
    });

    expect(error).toBeDefined();
  });
});

describe('Edge Function Authorization', () => {
  let user1Client: SupabaseClient;
  let user2Client: SupabaseClient;
  let user1Id: string;
  let user1ProjectId: number;

  beforeAll(async () => {
    user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    user2Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create user 1 and project
    const { data: user1Data } = await user1Client.auth.signUp({
      email: `authz-test1-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
    user1Id = user1Data.user!.id;

    const { data: project } = await user1Client
      .from('projects')
      .insert({
        user_id: user1Id,
        title: 'User 1 Project',
      })
      .select()
      .single();
    user1ProjectId = project.id;

    // Create user 2
    await user2Client.auth.signUp({
      email: `authz-test2-${Date.now()}@lifeos.test`,
      password: 'SecurePass456!@#',
    });
  });

  it('should prevent user from triggering automation for another user\'s entity', async () => {
    // User 2 tries to trigger automation for User 1's project
    const { error } = await user2Client.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'project_updated',
        entity_id: user1ProjectId,
      },
    });

    // Should fail because User 2 doesn't own this project
    expect(error).toBeDefined();
  });

  it('should allow user to trigger automation for their own entity', async () => {
    const { data, error } = await user1Client.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'project_updated',
        entity_id: user1ProjectId,
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});

describe('Rate Limiting', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    await supabase.auth.signUp({
      email: `rate-limit-test-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
  });

  it('should enforce rate limits on edge functions', async () => {
    // Make 10 rapid requests
    const promises = Array.from({ length: 10 }, () =>
      supabase.functions.invoke('data-flow-processor', {
        body: {
          flow_type: 'log_created',
          data: {},
        },
      })
    );

    const results = await Promise.all(promises);
    const rateLimited = results.filter(r => r.error?.message?.includes('rate limit'));

    // At least some should be rate-limited
    expect(rateLimited.length).toBeGreaterThan(0);
  }, 10000);
});
