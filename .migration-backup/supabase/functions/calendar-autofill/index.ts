import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TimeBlock {
  time: string;
  title: string;
  description: string;
  hub_id?: number;
  domain_id?: number;
  duration_minutes: number;
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

    const { date } = await req.json();
    const targetDate = date || new Date().toISOString().split('T')[0];

    // Get current system state
    const { data: stateData } = await supabaseClient
      .from('system_state_daily')
      .select('*')
      .eq('user_id', user.id)
      .order('state_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const state = stateData?.state || 'NEUTRAL';
    const priorityZone = stateData?.priority_zone || 'Balance';
    const weakestHubId = stateData?.weakest_hub_id;

    // Get weakest hub details
    let weakestHub = null;
    if (weakestHubId) {
      const { data: hubData } = await supabaseClient
        .from('hubs')
        .select('*')
        .eq('id', weakestHubId)
        .single();
      weakestHub = hubData;
    }

    // Generate time blocks based on state
    const timeBlocks: TimeBlock[] = [];

    // Morning blocks (6AM-9AM)
    if (state === 'CRISIS' || state === 'WEAK') {
      timeBlocks.push({
        time: '06:00',
        title: '🚨 Emergency Reset Session',
        description: 'Deep breathing, assessment, and recovery planning',
        duration_minutes: 30
      });
      timeBlocks.push({
        time: '07:00',
        title: '🩹 Crisis Recovery Action',
        description: weakestHub ? `Focus on ${weakestHub.name} repair` : 'Address critical issues',
        hub_id: weakestHubId || undefined,
        duration_minutes: 60
      });
    } else if (state === 'GROWTH' || state === 'AFFLUENCE') {
      timeBlocks.push({
        time: '06:00',
        title: '🧘 Peak Performance Ritual',
        description: 'Meditation, visualization, and goal review',
        duration_minutes: 30
      });
      timeBlocks.push({
        time: '07:00',
        title: '🚀 Strategic Deep Work',
        description: 'High-impact work on key objectives',
        duration_minutes: 90
      });
    } else {
      timeBlocks.push({
        time: '06:00',
        title: '☀️ Morning Reset',
        description: 'Mindfulness and daily planning',
        duration_minutes: 20
      });
      timeBlocks.push({
        time: '07:30',
        title: `📍 ${priorityZone} Focus`,
        description: 'Priority work session',
        duration_minutes: 60
      });
    }

    // Mid-morning (9AM-12PM)
    if (state === 'CRISIS') {
      timeBlocks.push({
        time: '09:00',
        title: '🛠️ Essential Tasks Only',
        description: 'Handle critical must-dos',
        duration_minutes: 120
      });
    } else if (state === 'WEAK') {
      timeBlocks.push({
        time: '09:00',
        title: '💪 Rebuild Foundation',
        description: 'Work on weak areas systematically',
        hub_id: weakestHubId || undefined,
        duration_minutes: 90
      });
    } else if (state === 'GROWTH') {
      timeBlocks.push({
        time: '09:00',
        title: '📚 Skill Development',
        description: 'Learning and upskilling session',
        duration_minutes: 90
      });
    } else if (state === 'AFFLUENCE') {
      timeBlocks.push({
        time: '09:00',
        title: '🎯 Strategic Projects',
        description: 'High-leverage project work',
        duration_minutes: 120
      });
    } else {
      timeBlocks.push({
        time: '09:00',
        title: '💼 Core Work Session',
        description: 'Focus on main responsibilities',
        duration_minutes: 90
      });
    }

    // Midday (12PM-2PM)
    timeBlocks.push({
      time: '12:00',
      title: '🍽️ Mindful Break',
      description: 'Lunch and recharge',
      duration_minutes: 60
    });

    // Afternoon (2PM-6PM)
    if (state === 'CRISIS') {
      timeBlocks.push({
        time: '14:00',
        title: '🏥 Health Priority',
        description: 'Rest, movement, or medical attention',
        duration_minutes: 60
      });
    } else {
      timeBlocks.push({
        time: '14:00',
        title: '🏃 Fitness & Wellness',
        description: 'Physical activity and health maintenance',
        duration_minutes: 45
      });
      
      if (state === 'GROWTH' || state === 'AFFLUENCE') {
        timeBlocks.push({
          time: '16:00',
          title: '🌐 Networking & Relationships',
          description: 'Connect with others, build relationships',
          duration_minutes: 60
        });
      } else {
        timeBlocks.push({
          time: '16:00',
          title: `🎯 ${priorityZone} Action`,
          description: 'Address priority area',
          duration_minutes: 60
        });
      }
    }

    // Evening (6PM-9PM)
    if (state === 'CRISIS' || state === 'WEAK') {
      timeBlocks.push({
        time: '18:00',
        title: '🛡️ Self-Care Essential',
        description: 'Basic needs and recovery',
        duration_minutes: 90
      });
    } else {
      timeBlocks.push({
        time: '18:00',
        title: '🏠 Life Management',
        description: 'Household, admin, and personal tasks',
        duration_minutes: 60
      });
      timeBlocks.push({
        time: '19:30',
        title: '❤️ Relationships & Connection',
        description: 'Quality time with important people',
        duration_minutes: 60
      });
    }

    // Night routine (9PM-10PM)
    timeBlocks.push({
      time: '21:00',
      title: '📝 Daily Reflection',
      description: 'Review day, log wins, plan tomorrow',
      duration_minutes: 20
    });

    // Insert time blocks into calendar
    const calendarEntries = [];
    for (const block of timeBlocks) {
      const { error: insertError } = await supabaseClient
        .from('calendar_entries')
        .insert({
          user_id: user.id,
          date: targetDate,
          start_time: block.time,
          title: block.title,
          description: block.description,
          hub_id: block.hub_id,
          focus_domain: block.domain_id ? `Domain_${block.domain_id}` : null,
        });

      if (!insertError) {
        calendarEntries.push(block);
      }
    }

    return new Response(
      JSON.stringify({
        date: targetDate,
        state,
        priority_zone: priorityZone,
        blocks_generated: calendarEntries.length,
        time_blocks: calendarEntries,
        message: `Generated ${calendarEntries.length} time blocks for ${state} mode`,
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
