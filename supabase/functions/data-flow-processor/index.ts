import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Data Flow Processor - Central orchestrator for all cross-module data flows
 * 
 * Handles:
 * - Log → Hub Score → Ultra Score
 * - Habit Check-in → Automation Triggers  
 * - Project Updates → Hub Scores
 * - Calendar Events → Time Blocking Intelligence
 */

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { flow_type, user_id, data } = await req.json();

    console.log('Processing data flow:', flow_type, 'for user:', user_id);

    let result;

    switch (flow_type) {
      case 'log_created': {
        // Log → Hub Score → Ultra Score flow
        const { hub_id, value, log_date } = data;
        
        // Recalculate hub score
        const { data: recentLogs } = await supabase
          .from('logs')
          .select('value')
          .eq('user_id', user_id)
          .eq('hub_id', hub_id)
          .gte('log_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('log_date', { ascending: false });

        const avgScore = recentLogs && recentLogs.length > 0
          ? recentLogs.reduce((sum, l) => sum + (l.value || 0), 0) / recentLogs.length
          : value || 0;

        // Update hub metric
        await supabase.from('metrics').upsert({
          user_id,
          hub_id,
          name: 'hub_score',
          value: avgScore,
          metric_date: log_date || new Date().toISOString().split('T')[0],
        });

        // Trigger Ultra Score recalculation
        await supabase.functions.invoke('calculate-ultra-score', {
          body: { user_id }
        });

        // Trigger notification check
        await supabase.functions.invoke('notification-generator', {
          body: { user_id }
        });

        result = { hub_score_updated: avgScore, ultra_score_triggered: true };
        break;
      }

      case 'habit_checkin': {
        // Habit Check-in → Automation Triggers flow
        const { habit_id, streak, date } = data;

        // Check if streak is significant
        if (streak >= 7 || streak <= 2) {
          // Generate notification
          const message = streak >= 7 
            ? `Great job! You've maintained a ${streak}-day streak!`
            : `Your streak dropped to ${streak}. Don't give up!`;

          await supabase.from('notifications').insert({
            user_id,
            type: streak >= 7 ? 'positive_growth' : 'habit_reminder',
            severity: streak >= 7 ? 'low' : 'medium',
            title: streak >= 7 ? 'Streak Milestone!' : 'Streak Alert',
            message,
            related_entity_type: 'habit',
            related_entity_id: habit_id.toString(),
          });
        }

        // Trigger automation evaluation
        await supabase.functions.invoke('evaluate-automation');

        result = { notification_created: streak >= 7 || streak <= 2 };
        break;
      }

      case 'project_updated': {
        // Project Updates → Hub Scores flow
        const { project_id, status, tasks_completed, tasks_total } = data;

        // Calculate project health
        const progress = tasks_total > 0 ? (tasks_completed / tasks_total) * 100 : 0;
        const projectHealth = status === 'Done' ? 100 : progress;

        // Get Work hub
        const { data: workHub } = await supabase
          .from('hubs')
          .select('id')
          .eq('code', 'WORK')
          .single();

        if (workHub) {
          // Update Work hub metric based on project health
          const { data: activeProjects } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user_id)
            .neq('status', 'Done');

          const avgProjectHealth = activeProjects && activeProjects.length > 0
            ? activeProjects.reduce((sum, p) => sum + (p.status === 'In Progress' ? 50 : 25), 0) / activeProjects.length
            : 50;

          await supabase.from('metrics').upsert({
            user_id,
            hub_id: workHub.id,
            name: 'project_health',
            value: avgProjectHealth,
            metric_date: new Date().toISOString().split('T')[0],
          });

          // Trigger Ultra Score update
          await supabase.functions.invoke('calculate-ultra-score', {
            body: { user_id }
          });
        }

        // Check for overdue tasks
        const { data: project } = await supabase
          .from('projects')
          .select('*, tasks(*)')
          .eq('id', project_id)
          .single();

        const overdueTasks = project?.tasks?.filter((t: any) => 
          t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'Done'
        ) || [];

        if (overdueTasks.length > 0) {
          await supabase.from('notifications').insert({
            user_id,
            type: 'project_task',
            severity: 'high',
            title: 'Overdue Tasks',
            message: `Project has ${overdueTasks.length} overdue task(s)`,
            related_entity_type: 'project',
            related_entity_id: project_id.toString(),
          });
        }

        result = { work_hub_updated: true, overdue_tasks: overdueTasks.length };
        break;
      }

      case 'calendar_event': {
        // Calendar Events → Time Blocking Intelligence flow
        const { date, start_time, end_time, hub_id } = data;

        // Analyze calendar density
        const { data: todayEvents } = await supabase
          .from('calendar_entries')
          .select('*')
          .eq('user_id', user_id)
          .eq('date', date);

        const eventCount = todayEvents?.length || 0;
        const calendarDensity = eventCount > 8 ? 'overloaded' : eventCount > 5 ? 'busy' : 'balanced';

        // Generate recommendations based on density
        if (calendarDensity === 'overloaded') {
          await supabase.from('notifications').insert({
            user_id,
            type: 'calendar',
            severity: 'medium',
            title: 'Calendar Overload',
            message: `You have ${eventCount} events today. Consider rescheduling or delegating.`,
            related_entity_type: 'calendar',
            related_entity_id: date,
          });
        }

        result = { calendar_density: calendarDensity, event_count: eventCount };
        break;
      }

      default:
        throw new Error('Invalid flow_type');
    }

    console.log('Data flow processed:', result);

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error processing data flow:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
