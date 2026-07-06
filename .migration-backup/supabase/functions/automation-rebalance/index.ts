import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const today = new Date().toISOString().split('T')[0];

    // Get latest system state
    const { data: stateData } = await supabaseClient
      .from('system_state_daily')
      .select('*')
      .eq('user_id', user.id)
      .order('state_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!stateData) {
      return new Response(
        JSON.stringify({ error: 'No system state found. Run evaluate-automation first.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const state = stateData.state;
    const weakestHubId = stateData.weakest_hub_id;
    const actions = [];

    // TASK REASSIGNMENT BASED ON STATE
    
    // Get all pending/active tasks
    const { data: tasks } = await supabaseClient
      .from('tasks')
      .select('*, projects(hub_id, hubs(code, name))')
      .neq('status', 'Completed')
      .order('due_date', { ascending: true });

    // CRISIS MODE: Only essential tasks
    if (state === 'CRISIS') {
      const essentialHubs = ['HEALTH', 'FINANCE', 'MINDSET'];
      
      // Move all non-essential tasks to low priority
      for (const task of tasks || []) {
        const projectData = Array.isArray(task.projects) ? task.projects[0] : task.projects;
        const hubData = projectData?.hubs ? (Array.isArray(projectData.hubs) ? projectData.hubs[0] : projectData.hubs) : null;
        const hubCode = hubData?.code;
        
        if (hubCode && !essentialHubs.includes(hubCode)) {
          await supabaseClient
            .from('tasks')
            .update({ 
              priority: 'Low',
              status: 'On Hold'
            })
            .eq('id', task.id);
            
          actions.push(`Paused task: "${task.title}" (non-essential during crisis)`);
        }
      }
      
      // Generate crisis recovery actions
      await supabaseClient
        .from('auto_actions')
        .insert([
          {
            user_id: user.id,
            action_date: today,
            action_type: 'RECOVERY',
            action_text: '🚨 CRISIS PROTOCOL: Address only essential survival tasks today',
            priority: 1,
            status: 'pending'
          },
          {
            user_id: user.id,
            action_date: today,
            action_type: 'RECOVERY',
            action_text: '🛡️ Emergency self-care: Rest, hydration, basic nutrition',
            priority: 1,
            status: 'pending'
          },
          {
            user_id: user.id,
            action_date: today,
            action_type: 'RECOVERY',
            action_text: '📞 Reach out to support system for help',
            priority: 1,
            status: 'pending'
          }
        ]);
    }
    
    // WEAK MODE: Focus on recovery
    else if (state === 'WEAK') {
      // Prioritize weakest hub tasks
      for (const task of tasks || []) {
        const projectData = Array.isArray(task.projects) ? task.projects[0] : task.projects;
        
        if (projectData?.hub_id === weakestHubId) {
          await supabaseClient
            .from('tasks')
            .update({ priority: 'High' })
            .eq('id', task.id);
            
          actions.push(`Elevated priority: "${task.title}" (weakest hub focus)`);
        }
      }
      
      await supabaseClient
        .from('auto_actions')
        .insert([
          {
            user_id: user.id,
            action_date: today,
            action_type: 'RECOVERY',
            action_text: '🔧 Recovery mode: Focus only on foundation rebuilding',
            priority: 1,
            hub_id: weakestHubId,
            status: 'pending'
          },
          {
            user_id: user.id,
            action_date: today,
            action_type: 'RECOVERY',
            action_text: '📊 Review weakest hub and create 3-step improvement plan',
            priority: 1,
            hub_id: weakestHubId,
            status: 'pending'
          }
        ]);
    }
    
    // GROWTH MODE: Strategic advancement
    else if (state === 'GROWTH') {
      // Prioritize skill-building and strategic tasks
      const skillKeywords = ['learn', 'skill', 'study', 'course', 'practice', 'develop'];
      
      for (const task of tasks || []) {
        const titleLower = task.title.toLowerCase();
        if (skillKeywords.some(keyword => titleLower.includes(keyword))) {
          await supabaseClient
            .from('tasks')
            .update({ priority: 'High' })
            .eq('id', task.id);
            
          actions.push(`Prioritized growth task: "${task.title}"`);
        }
      }
      
      await supabaseClient
        .from('auto_actions')
        .insert([
          {
            user_id: user.id,
            action_date: today,
            action_type: 'GROWTH',
            action_text: '🚀 Growth mode: Add one challenging skill-building activity',
            priority: 2,
            status: 'pending'
          },
          {
            user_id: user.id,
            action_date: today,
            action_type: 'GROWTH',
            action_text: '📈 Document systems that are working well for replication',
            priority: 2,
            status: 'pending'
          }
        ]);
    }
    
    // AFFLUENCE MODE: Expansion and scaling
    else if (state === 'AFFLUENCE') {
      const expansionKeywords = ['scale', 'expand', 'invest', 'long-term', 'strategy', 'vision'];
      
      for (const task of tasks || []) {
        const titleLower = task.title.toLowerCase();
        if (expansionKeywords.some(keyword => titleLower.includes(keyword))) {
          await supabaseClient
            .from('tasks')
            .update({ priority: 'High' })
            .eq('id', task.id);
            
          actions.push(`Prioritized expansion task: "${task.title}"`);
        }
      }
      
      await supabaseClient
        .from('auto_actions')
        .insert([
          {
            user_id: user.id,
            action_date: today,
            action_type: 'EXPANSION',
            action_text: '⚡ Peak performance: Optimize existing systems for excellence',
            priority: 3,
            status: 'pending'
          },
          {
            user_id: user.id,
            action_date: today,
            action_type: 'EXPANSION',
            action_text: '🌟 Give back: Mentor or share knowledge with others',
            priority: 3,
            status: 'pending'
          },
          {
            user_id: user.id,
            action_date: today,
            action_type: 'EXPANSION',
            action_text: '🎯 Define next-level ambitious goals for next quarter',
            priority: 3,
            status: 'pending'
          }
        ]);
    }
    
    // Handle overdue tasks (universal)
    const { data: overdueTasks } = await supabaseClient
      .from('tasks')
      .select('*')
      .lt('due_date', today)
      .neq('status', 'Completed');
      
    if (overdueTasks && overdueTasks.length > 0) {
      for (const task of overdueTasks) {
        await supabaseClient
          .from('tasks')
          .update({ 
            priority: 'High',
            status: 'In Progress' 
          })
          .eq('id', task.id);
          
        actions.push(`Marked overdue: "${task.title}"`);
      }
    }

    return new Response(
      JSON.stringify({
        state,
        rebalanced_tasks: actions.length,
        actions,
        message: `Task rebalancing complete for ${state} mode`,
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
