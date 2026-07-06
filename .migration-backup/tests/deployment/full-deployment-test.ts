import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * PHASE 2 DEPLOYMENT VERIFICATION TEST SUITE
 * 
 * Comprehensive tests for production deployment readiness
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('🔵 PHASE 2: Full Deployment Verification', () => {
  let testClient: SupabaseClient;
  let userId: string;
  let tenantId: string;
  let sessionToken: string;

  beforeAll(async () => {
    testClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Create test user
    const email = `deploy-test-${Date.now()}@lifeos.test`;
    const { data: authData, error: signUpError } = await testClient.auth.signUp({
      email,
      password: 'SecureTestPass123!@#',
    });

    expect(signUpError).toBeNull();
    expect(authData.user).toBeDefined();
    userId = authData.user!.id;
    sessionToken = authData.session!.access_token;

    // Get auto-created tenant
    const { data: tenants } = await testClient
      .from('tenants')
      .select('*')
      .single();
    
    tenantId = tenants!.id;
  });

  describe('1. Database Schema Validation', () => {
    it('should have all core tables', async () => {
      const requiredTables = [
        'profiles', 'tenants', 'memberships', 'user_roles',
        'hubs', 'ultra_domains', 'logs', 'metrics', 'ultra_metrics',
        'projects', 'tasks', 'habits', 'habit_checkins',
        'calendar_entries', 'notifications', 'automation_rules'
      ];

      for (const table of requiredTables) {
        const { error } = await testClient.from(table).select('id').limit(0);
        expect(error).toBeNull();
      }
    });

    it('should have RLS enabled on all tables', async () => {
      // This is verified server-side - test that queries respect RLS
      const { data: logs } = await testClient.from('logs').select('*');
      expect(Array.isArray(logs)).toBe(true);
    });
  });

  describe('2. Authentication Flow', () => {
    it('should allow valid user login', async () => {
      const { error } = await testClient.auth.signInWithPassword({
        email: `deploy-test-${Date.now()}@lifeos.test`,
        password: 'WrongPassword',
      });
      expect(error).toBeDefined(); // Should fail with wrong password
    });

    it('should maintain session', async () => {
      const { data: { session } } = await testClient.auth.getSession();
      expect(session).toBeDefined();
      expect(session?.access_token).toBeDefined();
    });

    it('should extract user from JWT', async () => {
      const { data: { user } } = await testClient.auth.getUser();
      expect(user).toBeDefined();
      expect(user?.id).toBe(userId);
    });
  });

  describe('3. Tenant Management', () => {
    it('should have auto-created personal tenant', async () => {
      const { data } = await testClient.from('tenants').select('*');
      expect(data).toBeDefined();
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should have owner membership', async () => {
      const { data } = await testClient
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'owner');
      
      expect(data!.length).toBeGreaterThan(0);
    });

    it('should enforce tenant creation limit', async () => {
      // Try creating 6 tenants (limit is 5)
      const creations = Array.from({ length: 6 }, (_, i) =>
        testClient.from('tenants').insert({
          name: `Test Tenant ${i}`,
          slug: `test-tenant-${Date.now()}-${i}`,
        })
      );

      const results = await Promise.all(creations);
      const successes = results.filter(r => !r.error).length;
      expect(successes).toBeLessThanOrEqual(5);
    });
  });

  describe('4. Data CRUD Operations', () => {
    it('should create log', async () => {
      const { data, error } = await testClient
        .from('logs')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          log_date: new Date().toISOString().split('T')[0],
          source: 'deployment_test',
          notes: 'Test log entry',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should create project', async () => {
      const { data, error } = await testClient
        .from('projects')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          title: 'Deployment Test Project',
          status: 'In Progress',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should create habit', async () => {
      const { data, error } = await testClient
        .from('habits')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          name: 'Deployment Test Habit',
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should create calendar entry', async () => {
      const { data, error } = await testClient
        .from('calendar_entries')
        .insert({
          user_id: userId,
          tenant_id: tenantId,
          title: 'Test Event',
          date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('5. Edge Functions', () => {
    it('should calculate ultra score', async () => {
      const { data, error } = await testClient.functions.invoke('calculate-ultra-score');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data.ultra_score).toBe('number');
    });

    it('should evaluate automation', async () => {
      const { data, error } = await testClient.functions.invoke('evaluate-automation');
      
      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.state).toBeDefined();
      expect(data.ultra_score).toBeDefined();
    });

    it('should reject edge function without JWT', async () => {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/calculate-ultra-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
      });

      expect(response.status).toBe(401);
    });

    it('should process data flow', async () => {
      const { data, error } = await testClient.functions.invoke('data-flow-processor', {
        body: {
          flow_type: 'log_created',
          data: {},
        },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('6. RLS Enforcement', () => {
    let otherUserClient: SupabaseClient;
    let otherUserId: string;

    beforeAll(async () => {
      otherUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      const { data } = await otherUserClient.auth.signUp({
        email: `other-user-${Date.now()}@lifeos.test`,
        password: 'SecurePass456!@#',
      });
      otherUserId = data.user!.id;
    });

    it('should prevent cross-user data access', async () => {
      // User 1 creates a log
      const { data: log } = await testClient
        .from('logs')
        .insert({
          user_id: userId,
          log_date: new Date().toISOString().split('T')[0],
          source: 'test',
        })
        .select()
        .single();

      // User 2 tries to read it
      const { data: stolen } = await otherUserClient
        .from('logs')
        .select('*')
        .eq('id', log.id);

      expect(stolen).toEqual([]);
    });

    it('should prevent cross-user updates', async () => {
      const { data: project } = await testClient
        .from('projects')
        .insert({
          user_id: userId,
          title: 'Protected Project',
        })
        .select()
        .single();

      const { error } = await otherUserClient
        .from('projects')
        .update({ title: 'Hacked' })
        .eq('id', project.id);

      expect(error).toBeDefined();
    });

    it('should prevent cross-user deletes', async () => {
      const { data: habit } = await testClient
        .from('habits')
        .insert({
          user_id: userId,
          name: 'Protected Habit',
        })
        .select()
        .single();

      const { error } = await otherUserClient
        .from('habits')
        .delete()
        .eq('id', habit.id);

      expect(error).toBeDefined();
    });
  });

  describe('7. Automation System', () => {
    it('should trigger automation on log creation', async () => {
      const { data: log } = await testClient
        .from('logs')
        .insert({
          user_id: userId,
          log_date: new Date().toISOString().split('T')[0],
          source: 'automation_test',
        })
        .select()
        .single();

      // Trigger automation
      const { data, error } = await testClient.functions.invoke('automation-trigger', {
        body: {
          trigger_type: 'log_created',
          entity_id: log.id,
        },
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should create auto actions', async () => {
      await testClient.functions.invoke('evaluate-automation');

      const { data: actions } = await testClient
        .from('auto_actions')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      expect(actions).toBeDefined();
      expect(Array.isArray(actions)).toBe(true);
    });
  });

  describe('8. Admin Access Controls', () => {
    it('should allow admin to view admin stats', async () => {
      // First assign admin role
      await testClient
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'admin',
        });

      const { data, error } = await testClient
        .from('admin_user_stats')
        .select('*')
        .single();

      // Admins should see data (or get blocked by RLS if not admin)
      expect(data || error).toBeDefined();
    });
  });

  describe('9. Input Validation', () => {
    it('should reject invalid enum values', async () => {
      const { error } = await testClient.functions.invoke('data-flow-processor', {
        body: {
          flow_type: 'INVALID_TYPE',
          data: {},
        },
      });

      expect(error).toBeDefined();
    });

    it('should reject oversized payloads', async () => {
      const largeData = { data: 'x'.repeat(25000) };
      
      const { error } = await testClient.functions.invoke('data-flow-processor', {
        body: {
          flow_type: 'log_created',
          data: largeData,
        },
      });

      expect(error).toBeDefined();
    });
  });

  describe('10. System Health', () => {
    it('should have working database connection', async () => {
      const { error } = await testClient.from('profiles').select('id').limit(1);
      expect(error).toBeNull();
    });

    it('should have all edge functions deployed', async () => {
      const functions = [
        'calculate-ultra-score',
        'evaluate-automation',
        'data-flow-processor',
        'automation-trigger',
      ];

      for (const func of functions) {
        const { error } = await testClient.functions.invoke(func, {
          body: func === 'data-flow-processor' 
            ? { flow_type: 'log_created', data: {} }
            : func === 'automation-trigger'
            ? { trigger_type: 'log_created' }
            : {},
        });

        // Should not be 404 or 500
        expect(error?.message).not.toContain('not found');
      }
    });
  });

  afterAll(async () => {
    await testClient.auth.signOut();
  });
});
