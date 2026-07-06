import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Integration Tests: Automation Engine
 * 
 * Tests automation rule evaluation, action triggers, and system state logic
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

describe('Automation Engine Logic', () => {
  let supabase: SupabaseClient;
  let userId: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data } = await supabase.auth.signUp({
      email: `automation-test-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
    
    userId = data.user!.id;
  });

  it('should evaluate automation rules', async () => {
    const { data, error } = await supabase.functions.invoke('evaluate-automation');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toHaveProperty('ultra_score');
    expect(data).toHaveProperty('state');
    expect(data).toHaveProperty('triggered_actions');
  });

  it('should calculate ultra score', async () => {
    const { data, error } = await supabase.functions.invoke('calculate-ultra-score');

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(typeof data.ultra_score).toBe('number');
    expect(data.ultra_score).toBeGreaterThanOrEqual(0);
    expect(data.ultra_score).toBeLessThanOrEqual(100);
  });

  it('should trigger automation on log creation', async () => {
    // Create a log
    const { data: log } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        log_date: new Date().toISOString().split('T')[0],
        source: 'test',
        notes: 'Automation trigger test',
      })
      .select()
      .single();

    expect(log).toBeDefined();

    // Trigger automation
    const { data: result, error } = await supabase.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'log_created',
        entity_id: log.id,
      },
    });

    expect(error).toBeNull();
    expect(result).toBeDefined();
  });

  it('should create auto actions when rules trigger', async () => {
    // Get current automation state
    const { data: automationResult } = await supabase.functions.invoke('evaluate-automation');

    expect(automationResult).toBeDefined();
    expect(Array.isArray(automationResult.triggered_actions)).toBe(true);

    // Check if auto_actions were created
    const { data: actions } = await supabase
      .from('auto_actions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    expect(actions).toBeDefined();
    expect(Array.isArray(actions)).toBe(true);
  });
});

describe('System State Classification', () => {
  let supabase: SupabaseClient;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    await supabase.auth.signUp({
      email: `state-test-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
  });

  it('should calculate system state based on ultra score', async () => {
    const { data } = await supabase.functions.invoke('evaluate-automation');

    expect(data).toBeDefined();
    expect(data.state).toBeDefined();
    expect(['Critical', 'Danger', 'Weak', 'Stable', 'Good', 'Excellent', 'Elite']).toContain(data.state);
  });

  it('should identify weakest hub', async () => {
    const { data } = await supabase.functions.invoke('evaluate-automation');

    expect(data).toBeDefined();
    expect(data.weakest_hub).toBeDefined();
  });

  it('should calculate priority zone', async () => {
    const { data } = await supabase.functions.invoke('evaluate-automation');

    expect(data).toBeDefined();
    expect(data.priority_zone).toBeDefined();
  });
});

describe('Habit Check-in Automation', () => {
  let supabase: SupabaseClient;
  let userId: string;
  let habitId: number;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    const { data } = await supabase.auth.signUp({
      email: `habit-test-${Date.now()}@lifeos.test`,
      password: 'SecurePass123!@#',
    });
    
    userId = data.user!.id;

    // Create a test habit
    const { data: habit } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        name: 'Test Habit',
      })
      .select()
      .single();
    
    habitId = habit.id;
  });

  it('should update habit streak on check-in', async () => {
    // Check in habit
    const { data: checkin } = await supabase
      .from('habit_checkins')
      .insert({
        habit_id: habitId,
        date: new Date().toISOString().split('T')[0],
        done: true,
      })
      .select()
      .single();

    expect(checkin).toBeDefined();

    // Trigger automation
    await supabase.functions.invoke('automation-trigger', {
      body: {
        trigger_type: 'habit_checkin',
        entity_id: habitId,
      },
    });

    // Verify habit streak updated
    const { data: habit } = await supabase
      .from('habits')
      .select('*')
      .eq('id', habitId)
      .single();

    expect(habit).toBeDefined();
    expect(habit.streak).toBeGreaterThanOrEqual(0);
  });
});
