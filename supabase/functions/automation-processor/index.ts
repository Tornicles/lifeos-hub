import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActionQueueItem {
  id: number;
  user_id: string;
  action_type: string;
  action_payload: any;
  priority: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Processing automation actions for user:', user.id);

    // Get pending actions for this user, ordered by priority and scheduled_for
    const { data: pendingActions, error: fetchError } = await supabase
      .from('automation_action_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'PENDING')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('scheduled_for', { ascending: true })
      .limit(10);

    if (fetchError) throw fetchError;

    const results = [];

    for (const action of (pendingActions || [])) {
      try {
        // Mark as processing
        await supabase
          .from('automation_action_queue')
          .update({ status: 'PROCESSING' })
          .eq('id', action.id);

        // Execute action based on type
        const result = await executeAction(supabase, user.id, action);

        // Mark as completed
        await supabase
          .from('automation_action_queue')
          .update({
            status: 'COMPLETED',
            executed_at: new Date().toISOString(),
          })
          .eq('id', action.id);

        // Log success
        await supabase.from('automation_logs').insert({
          user_id: user.id,
          rule_id: action.rule_id,
          event_type: 'ACTION_EXECUTED',
          severity: 'INFO',
          message: `Successfully executed ${action.action_type}`,
          context_data: { action_id: action.id, result },
        });

        results.push({
          action_id: action.id,
          status: 'success',
          result,
        });
      } catch (actionError: any) {
        console.error('Error executing action:', actionError);

        // Increment retry count
        const newRetryCount = (action.retry_count || 0) + 1;
        const shouldRetry = newRetryCount < (action.max_retries || 3);

        await supabase
          .from('automation_action_queue')
          .update({
            status: shouldRetry ? 'PENDING' : 'FAILED',
            retry_count: newRetryCount,
            error_message: actionError.message,
          })
          .eq('id', action.id);

        // Log error
        await supabase.from('automation_logs').insert({
          user_id: user.id,
          rule_id: action.rule_id,
          event_type: 'ERROR_OCCURRED',
          severity: 'ERROR',
          message: `Failed to execute ${action.action_type}: ${actionError.message}`,
          context_data: { action_id: action.id, error: actionError.message },
        });

        results.push({
          action_id: action.id,
          status: 'error',
          error: actionError.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in automation-processor:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

async function executeAction(
  supabase: any,
  userId: string,
  action: ActionQueueItem
): Promise<any> {
  const { action_type, action_payload } = action;

  switch (action_type) {
    case 'CALENDAR_CREATE':
      return await createCalendarEntry(supabase, userId, action_payload);

    case 'TASK_CREATE':
      return await createTask(supabase, userId, action_payload);

    case 'STATE_UPDATE':
      return await updateSystemState(supabase, userId, action_payload);

    case 'NOTIFICATION':
      return await createNotification(supabase, userId, action_payload);

    case 'HABIT_SUGGEST':
      return await suggestHabit(supabase, userId, action_payload);

    case 'AUTO_ACTION_CREATE':
      return await createAutoAction(supabase, userId, action_payload);

    default:
      throw new Error(`Unknown action type: ${action_type}`);
  }
}

async function createCalendarEntry(
  supabase: any,
  userId: string,
  payload: any
): Promise<any> {
  const { data, error } = await supabase.from('calendar_entries').insert({
    user_id: userId,
    title: payload.title,
    description: payload.description,
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    hub_id: payload.hub_id,
    focus_domain: payload.focus_domain,
  });

  if (error) throw error;
  return { type: 'calendar_entry', data };
}

async function createTask(supabase: any, userId: string, payload: any): Promise<any> {
  // First get or create a project
  let projectId = payload.project_id;

  if (!projectId) {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title: payload.project_title || 'Auto-generated Project',
        status: 'In Progress',
        hub_id: payload.hub_id,
      })
      .select()
      .single();

    if (projectError) throw projectError;
    projectId = project.id;
  }

  const { data, error } = await supabase.from('tasks').insert({
    project_id: projectId,
    title: payload.title,
    description: payload.description,
    priority: payload.priority || 'Medium',
    status: 'Not Started',
    due_date: payload.due_date,
  });

  if (error) throw error;
  return { type: 'task', data };
}

async function updateSystemState(
  supabase: any,
  userId: string,
  payload: any
): Promise<any> {
  const { data, error } = await supabase
    .from('system_state_daily')
    .upsert({
      user_id: userId,
      state_date: new Date().toISOString().split('T')[0],
      state: payload.state,
      ultra_score: payload.ultra_score,
      priority_zone: payload.priority_zone,
      state_reasons: payload.state_reasons,
    });

  if (error) throw error;
  return { type: 'state_update', data };
}

async function createNotification(
  supabase: any,
  userId: string,
  payload: any
): Promise<any> {
  const { data, error } = await supabase.from('state_warnings').insert({
    user_id: userId,
    warning_type: payload.warning_type || 'automation_alert',
    warning_text: payload.message,
    severity: payload.severity || 'medium',
    related_hub_id: payload.hub_id,
  });

  if (error) throw error;
  return { type: 'notification', data };
}

async function suggestHabit(
  supabase: any,
  userId: string,
  payload: any
): Promise<any> {
  // Check if habit already exists
  const { data: existingHabit } = await supabase
    .from('habits')
    .select('id')
    .eq('user_id', userId)
    .eq('name', payload.name)
    .single();

  if (existingHabit) {
    return { type: 'habit_suggest', message: 'Habit already exists', skipped: true };
  }

  const { data, error } = await supabase.from('habits').insert({
    user_id: userId,
    name: payload.name,
    description: payload.description,
  });

  if (error) throw error;
  return { type: 'habit_suggest', data };
}

async function createAutoAction(
  supabase: any,
  userId: string,
  payload: any
): Promise<any> {
  const { data, error } = await supabase.from('auto_actions').insert({
    user_id: userId,
    action_type: payload.action_type,
    action_text: payload.action_text,
    action_date: new Date().toISOString().split('T')[0],
    hub_id: payload.hub_id,
    domain_id: payload.domain_id,
    priority: payload.priority || 1,
    status: 'pending',
  });

  if (error) throw error;
  return { type: 'auto_action', data };
}
