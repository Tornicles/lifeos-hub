import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  fix_available: boolean;
  fix_applied?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { auto_fix = false } = await req.json().catch(() => ({ auto_fix: false }));

    const issues: ValidationIssue[] = [];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    // 1. Check for missing Ultra Score
    const { data: ultraScore } = await supabaseClient
      .from('ultra_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'ULTRA_Score')
      .eq('metric_date', today)
      .maybeSingle();

    if (!ultraScore) {
      issues.push({
        type: 'warning',
        category: 'ULTRA_SCORE',
        message: 'Missing ULTRA Score for today. Score calculation needed.',
        fix_available: true,
        fix_applied: false
      });

      if (auto_fix) {
        // Trigger score calculation
        await supabaseClient.functions.invoke('calculate-ultra-score', {
          body: { date: today }
        });
        issues[issues.length - 1].fix_applied = true;
      }
    }

    // 2. Check for missing logs (48 hours)
    const { count: recentLogs } = await supabaseClient
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('log_date', twoDaysAgo);

    if ((recentLogs || 0) === 0) {
      issues.push({
        type: 'warning',
        category: 'NO_LOGS',
        message: 'No activity logs in past 48 hours. System visibility reduced.',
        fix_available: false
      });

      // Create warning
      if (auto_fix) {
        await supabaseClient
          .from('state_warnings')
          .insert({
            user_id: user.id,
            warning_type: 'NO_LOGS',
            warning_text: 'No logs recorded in 48 hours. Start tracking to improve insights.',
            severity: 'medium'
          });
      }
    }

    // 3. Check for broken habit streaks
    const { data: habits } = await supabaseClient
      .from('habits')
      .select('id, name, streak, last_checkin')
      .eq('user_id', user.id);

    const brokenHabits = habits?.filter(h => {
      if (!h.last_checkin) return false;
      const daysSince = Math.floor((Date.now() - new Date(h.last_checkin).getTime()) / 86400000);
      return h.streak > 0 && daysSince > 1;
    }) || [];

    if (brokenHabits.length > 0) {
      issues.push({
        type: 'warning',
        category: 'HABIT_BROKEN',
        message: `${brokenHabits.length} habit streak(s) broken. Restart recommended.`,
        fix_available: true,
        fix_applied: false
      });

      if (auto_fix) {
        // Reset broken streaks
        for (const habit of brokenHabits) {
          await supabaseClient
            .from('habits')
            .update({ streak: 0 })
            .eq('id', habit.id);

          await supabaseClient
            .from('state_warnings')
            .insert({
              user_id: user.id,
              warning_type: 'HABIT_BROKEN',
              warning_text: `Habit "${habit.name}" streak reset due to missed check-ins.`,
              severity: 'medium',
              related_habit_id: habit.id
            });
        }
        issues[issues.length - 1].fix_applied = true;
      }
    }

    // 4. Check for stuck projects (7+ days inactive)
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const { data: projects } = await supabaseClient
      .from('projects')
      .select('id, title, updated_at, status')
      .eq('user_id', user.id)
      .neq('status', 'Completed')
      .lt('updated_at', sevenDaysAgo);

    if (projects && projects.length > 0) {
      issues.push({
        type: 'warning',
        category: 'PROJECT_STUCK',
        message: `${projects.length} project(s) inactive for 7+ days. Review needed.`,
        fix_available: true,
        fix_applied: false
      });

      if (auto_fix) {
        for (const project of projects) {
          await supabaseClient
            .from('state_warnings')
            .insert({
              user_id: user.id,
              warning_type: 'PROJECT_STUCK',
              warning_text: `Project "${project.title}" has been inactive for over a week.`,
              severity: 'medium',
              related_project_id: project.id
            });
        }
        issues[issues.length - 1].fix_applied = true;
      }
    }

    // 5. Check for critical hub scores
    const { data: hubScores } = await supabaseClient
      .from('metrics')
      .select('hub_id, value, hubs(name)')
      .eq('user_id', user.id)
      .eq('name', 'DailyScore')
      .eq('metric_date', today)
      .lt('value', 30);

    if (hubScores && hubScores.length > 0) {
      issues.push({
        type: 'error',
        category: 'HUB_CRITICAL',
        message: `${hubScores.length} hub(s) in critical state (<30). Immediate action required.`,
        fix_available: false
      });

      if (auto_fix) {
        for (const hub of hubScores) {
          const hubData = Array.isArray(hub.hubs) ? hub.hubs[0] : hub.hubs;
          if (hubData) {
            await supabaseClient
              .from('state_warnings')
              .insert({
                user_id: user.id,
                warning_type: 'HUB_CRITICAL',
                warning_text: `${hubData.name} hub is in critical state (${hub.value.toFixed(1)}). Emergency recovery needed.`,
                severity: 'critical',
                related_hub_id: hub.hub_id
              });
          }
        }
      }
    }

    // 6. Check for orphaned tasks (no project)
    const { count: orphanedTasks } = await supabaseClient
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .is('project_id', null);

    if ((orphanedTasks || 0) > 0) {
      issues.push({
        type: 'info',
        category: 'ORPHANED_TASKS',
        message: `${orphanedTasks} task(s) not linked to any project.`,
        fix_available: false
      });
    }

    // 7. Check for missing domain scores
    const { data: domainScores } = await supabaseClient
      .from('ultra_metrics')
      .select('domain_id')
      .eq('user_id', user.id)
      .eq('metric_date', today)
      .not('domain_id', 'is', null);

    if (!domainScores || domainScores.length < 7) {
      issues.push({
        type: 'warning',
        category: 'MISSING_DOMAINS',
        message: `Only ${domainScores?.length || 0}/7 domain scores recorded today.`,
        fix_available: false
      });
    }

    return new Response(
      JSON.stringify({
        validation_date: today,
        total_issues: issues.length,
        errors: issues.filter(i => i.type === 'error'),
        warnings: issues.filter(i => i.type === 'warning'),
        info: issues.filter(i => i.type === 'info'),
        fixes_available: issues.filter(i => i.fix_available).length,
        fixes_applied: auto_fix ? issues.filter(i => i.fix_applied).length : 0,
        issues,
        system_health: issues.filter(i => i.type === 'error').length === 0 ? 'healthy' : 'needs_attention',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
