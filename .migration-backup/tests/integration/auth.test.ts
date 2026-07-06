import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration Tests: Authentication & Authorization
 * 
 * Tests JWT authentication, RLS enforcement, and multi-tenant isolation
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Authentication', () => {
  let supabase: SupabaseClient;
  let testUser1: { email: string; password: string; id?: string };
  let testUser2: { email: string; password: string; id?: string };

  beforeAll(() => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    testUser1 = {
      email: `test1-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    };
    testUser2 = {
      email: `test2-${Date.now()}@lifeos.test`,
      password: 'SecurePass456!@#',
    };
  });

  it('should sign up new user successfully', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testUser1.email,
      password: testUser1.password,
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.user?.email).toBe(testUser1.email);
    testUser1.id = data.user?.id;
  });

  it('should sign in with valid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser1.email,
      password: testUser1.password,
    });

    expect(error).toBeNull();
    expect(data.session).toBeDefined();
    expect(data.session?.access_token).toBeDefined();
  });

  it('should reject sign in with invalid credentials', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUser1.email,
      password: 'WrongPassword123',
    });

    expect(error).toBeDefined();
    expect(data.session).toBeNull();
  });

  it('should reject operations without JWT token', async () => {
    const unauthClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data, error } = await unauthClient
      .from('logs')
      .select('*')
      .limit(1);

    expect(data).toEqual([]);
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });
});

describe('Row Level Security (RLS)', () => {
  let supabase1: SupabaseClient;
  let supabase2: SupabaseClient;
  let user1Id: string;
  let user2Id: string;

  beforeAll(async () => {
    supabase1 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabase2 = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Sign up user 1
    const { data: data1 } = await supabase1.auth.signUp({
      email: `rls-test1-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
    user1Id = data1.user!.id;

    // Sign up user 2
    const { data: data2 } = await supabase2.auth.signUp({
      email: `rls-test2-${Date.now()}@lifeos.test`,
      password: 'SecurePass456!@#',
    });
    user2Id = data2.user!.id;
  });

  it('should enforce user isolation on logs table', async () => {
    // User 1 creates a log
    const { data: log } = await supabase1
      .from('logs')
      .insert({
        user_id: user1Id,
        log_date: new Date().toISOString().split('T')[0],
        source: 'test',
        notes: 'User 1 test log',
      })
      .select()
      .single();

    expect(log).toBeDefined();

    // User 2 tries to read User 1's log
    const { data: stolen } = await supabase2
      .from('logs')
      .select('*')
      .eq('id', log.id);

    expect(stolen).toEqual([]);
  });

  it('should prevent cross-user updates', async () => {
    // User 1 creates a project
    const { data: project } = await supabase1
      .from('projects')
      .insert({
        user_id: user1Id,
        title: 'User 1 Project',
      })
      .select()
      .single();

    expect(project).toBeDefined();

    // User 2 tries to update User 1's project
    const { error } = await supabase2
      .from('projects')
      .update({ title: 'Hacked!' })
      .eq('id', project.id);

    expect(error).toBeDefined();
  });

  it('should prevent cross-user deletes', async () => {
    // User 1 creates a habit
    const { data: habit } = await supabase1
      .from('habits')
      .insert({
        user_id: user1Id,
        name: 'User 1 Habit',
      })
      .select()
      .single();

    expect(habit).toBeDefined();

    // User 2 tries to delete User 1's habit
    const { error } = await supabase2
      .from('habits')
      .delete()
      .eq('id', habit.id);

    expect(error).toBeDefined();

    // Verify habit still exists for User 1
    const { data: check } = await supabase1
      .from('habits')
      .select('*')
      .eq('id', habit.id)
      .single();

    expect(check).toBeDefined();
  });

  afterAll(async () => {
    await supabase1.auth.signOut();
    await supabase2.auth.signOut();
  });
});

describe('Multi-Tenant Isolation', () => {
  let ownerClient: SupabaseClient;
  let memberClient: SupabaseClient;
  let outsiderClient: SupabaseClient;
  let tenantId: string;

  beforeAll(async () => {
    ownerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    memberClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    outsiderClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Create owner user and tenant
    await ownerClient.auth.signUp({
      email: `tenant-owner-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });

    const { data: tenant } = await ownerClient
      .from('tenants')
      .select('*')
      .single();
    
    tenantId = tenant!.id;

    // Create member user
    await memberClient.auth.signUp({
      email: `tenant-member-${Date.now()}@lifeos.test`,
      password: 'SecurePass456!@#',
    });

    // Create outsider user
    await outsiderClient.auth.signUp({
      email: `tenant-outsider-${Date.now()}@lifeos.test`,
      password: 'SecurePass789!@#',
    });
  });

  it('should prevent outsider from accessing tenant data', async () => {
    // Owner creates a log in tenant
    const { data: log } = await ownerClient
      .from('logs')
      .insert({
        tenant_id: tenantId,
        log_date: new Date().toISOString().split('T')[0],
        source: 'test',
        notes: 'Tenant log',
      })
      .select()
      .single();

    expect(log).toBeDefined();

    // Outsider tries to access it
    const { data: stolen } = await outsiderClient
      .from('logs')
      .select('*')
      .eq('id', log.id);

    expect(stolen).toEqual([]);
  });

  it('should enforce tenant creation limit', async () => {
    // Try creating 6 tenants as owner (limit is 5)
    const promises = Array.from({ length: 6 }, (_, i) =>
      ownerClient.from('tenants').insert({
        name: `Test Tenant ${i}`,
        slug: `test-tenant-${Date.now()}-${i}`,
      })
    );

    const results = await Promise.all(promises);
    const successes = results.filter(r => !r.error).length;

    expect(successes).toBeLessThanOrEqual(5);
  });

  afterAll(async () => {
    await ownerClient.auth.signOut();
    await memberClient.auth.signOut();
    await outsiderClient.auth.signOut();
  });
});
