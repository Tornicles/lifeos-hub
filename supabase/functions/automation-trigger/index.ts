import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Automation Trigger Function
 * Called whenever data changes to recalculate dependent values and trigger automation rules
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { trigger_type, user_id, entity_id } = await req.json();

    console.log('[automation-trigger] Triggered:', trigger_type, 'for user:', user_id);

    const results: string[] = [];

    // Step 1: Recalculate Ultra Score if needed
    if (['log_created', 'metric_updated', 'ultra_metric_updated'].includes(trigger_type)) {
      console.log('[automation-trigger] Recalculating Ultra Score');
      try {
        const { error } = await supabase.functions.invoke('calculate-ultra-score', {
          headers: { Authorization: `Bearer ${supabaseKey}` },
        });
        if (error) throw error;
        results.push('Ultra Score recalculated');
      } catch (error) {
        console.error('Error recalculating Ultra Score:', error);
        results.push('Ultra Score recalculation failed');
      }
    }

    // Step 2: Evaluate automation rules
    console.log('[automation-trigger] Evaluating automation rules');
    try {
      const { error } = await supabase.functions.invoke('evaluate-automation', {
        headers: { Authorization: `Bearer ${supabaseKey}` },
      });
      if (error) throw error;
      results.push('Automation rules evaluated');
    } catch (error) {
      console.error('Error evaluating automation:', error);
      results.push('Automation evaluation failed');
    }

    // Step 3: Run system validation if significant change
    if (['project_updated', 'habit_checkin', 'log_created'].includes(trigger_type)) {
      console.log('[automation-trigger] Running system validation');
      try {
        const { error } = await supabase.functions.invoke('system-validate', {
          headers: { Authorization: `Bearer ${supabaseKey}` },
        });
        if (error) throw error;
        results.push('System validation completed');
      } catch (error) {
        console.error('Error in system validation:', error);
        results.push('System validation failed');
      }
    }

    // Step 4: Check for auto-actions based on trigger type
    switch (trigger_type) {
      case 'habit_checkin':
        // Check if habit streak rules should trigger
        const { data: habit } = await supabase
          .from('habits')
          .select('streak')
          .eq('id', entity_id)
          .single();

        if (habit && habit.streak === 0) {
          // Habit streak broken - create recovery action
          await supabase.from('auto_actions').insert({
            user_id,
            action_type: 'habit_recovery',
            action_text: 'Habit streak broken. Consider scheduling a recovery block today.',
            action_date: new Date().toISOString().split('T')[0],
            priority: 2,
            status: 'pending',
          });
          results.push('Habit recovery action created');
        }
        break;

      case 'project_updated':
        // Check for overdue tasks
        const { data: project } = await supabase
          .from('projects')
          .select('*, tasks(*)')
          .eq('id', entity_id)
          .single();

        if (project) {
          const overdueTasks = project.tasks?.filter((t: any) => 
            t.status !== 'Done' && t.due_date && new Date(t.due_date) < new Date()
          );

          if (overdueTasks && overdueTasks.length > 0) {
            await supabase.from('auto_actions').insert({
              user_id,
              action_type: 'project_alert',
              action_text: `Project "${project.title}" has ${overdueTasks.length} overdue task(s).`,
              action_date: new Date().toISOString().split('T')[0],
              priority: 3,
              status: 'pending',
              project_id: entity_id,
            });
            results.push('Overdue task alert created');
          }
        }
        break;

      case 'log_created':
        // Check if this log fills a gap in weak hub
        const { data: log } = await supabase
          .from('logs')
          .select('*, hubs(*)')
          .eq('id', entity_id)
          .single();

        if (log) {
          results.push(`Log added to ${log.hubs?.name || 'Unknown Hub'}`);
        }
        break;
    }

    console.log('[automation-trigger] Completed. Results:', results);

    return new Response(
      JSON.stringify({
        success: true,
        trigger_type,
        results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[automation-trigger] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
