import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SystemState = 'ULTRA_MODE' | 'GROWTH_MODE' | 'NEUTRAL_MODE' | 'DANGER_MODE' | 'CRISIS_MODE' | 'RESET_MODE';

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

    // Get ULTRA_Score
    const { data: ultraData } = await supabaseClient
      .from('ultra_metrics')
      .select('value, metric_date')
      .eq('user_id', user.id)
      .eq('name', 'ULTRA_Score')
      .order('metric_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const ultraScore = ultraData?.value || 0;

    // Get all hub scores
    const { data: hubScores } = await supabaseClient
      .from('metrics')
      .select('hub_id, name, value, hubs(code, name)')
      .eq('user_id', user.id)
      .eq('name', 'DailyScore')
      .gte('metric_date', today);

    // Calculate weakest hub
    let weakestHub: { code: string; name: string } | null = null;
    let weakestScore = 100;
    let hubsInDanger = 0;

    if (hubScores && hubScores.length > 0) {
      for (const hub of hubScores) {
        const hubData = Array.isArray(hub.hubs) ? hub.hubs[0] : hub.hubs;
        if (hub.value < weakestScore && hubData) {
          weakestScore = hub.value;
          weakestHub = { code: hubData.code, name: hubData.name };
        }
        if (hub.value < 40) hubsInDanger++;
      }
    }

    // Determine system state
    let state: SystemState = 'NEUTRAL_MODE';
    let stateColor = 'yellow';
    let stateIcon = '🟡';

    if (ultraScore >= 80) {
      state = 'ULTRA_MODE';
      stateColor = 'blue';
      stateIcon = '🔵';
    } else if (ultraScore >= 60) {
      state = 'GROWTH_MODE';
      stateColor = 'green';
      stateIcon = '🟢';
    } else if (ultraScore >= 40) {
      state = 'NEUTRAL_MODE';
      stateColor = 'yellow';
      stateIcon = '🟡';
    } else if (ultraScore >= 20) {
      state = 'DANGER_MODE';
      stateColor = 'orange';
      stateIcon = '🟠';
    } else {
      state = 'CRISIS_MODE';
      stateColor = 'red';
      stateIcon = '🔴';
    }

    // Check for RESET_MODE override
    if (hubsInDanger >= 3 || (weakestScore < 30 && ultraScore < 50)) {
      state = 'RESET_MODE';
      stateColor = 'purple';
      stateIcon = '🟣';
    }

    // Fetch active automation rules
    const { data: rules } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('is_active', true);

    const triggeredActions = [];

    // Evaluate rules
    if (rules) {
      for (const rule of rules) {
        let triggered = false;

        switch (rule.condition_type) {
          case 'ULTRA_BELOW':
            if (ultraScore < (rule.condition_value || 0)) triggered = true;
            break;
          case 'ULTRA_ABOVE':
            if (ultraScore >= (rule.condition_value || 0)) triggered = true;
            break;
          case 'HUB_BELOW':
            if (weakestScore < (rule.condition_value || 0)) triggered = true;
            break;
          case 'HUBS_IN_DANGER':
            if (hubsInDanger >= (rule.condition_value || 0)) triggered = true;
            break;
        }

        if (triggered) {
          triggeredActions.push({
            rule: rule.name,
            target: rule.action_target,
            value: rule.action_value === 'WeakestHub' ? weakestHub?.name : rule.action_value,
            reason: `${rule.condition_type} condition met`,
          });
        }
      }
    }

    // Generate focus recommendations
    const focusRecommendations = {
      primary_domain: weakestHub?.name || 'Balance',
      secondary_domain: state === 'CRISIS_MODE' ? 'Mindset' : 'Health',
      suggested_actions: generateActions(state, weakestHub?.code, ultraScore),
    };

    return new Response(
      JSON.stringify({
        ultra_score: ultraScore,
        state,
        state_color: stateColor,
        state_icon: stateIcon,
        weakest_hub: weakestHub,
        weakest_score: weakestScore,
        hubs_in_danger: hubsInDanger,
        triggered_actions: triggeredActions,
        focus_recommendations: focusRecommendations,
        date: today,
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

function generateActions(state: SystemState, weakestCode: string | undefined, score: number): string[] {
  const actions: string[] = [];

  if (state === 'CRISIS_MODE' || state === 'RESET_MODE') {
    actions.push('Take a 10-minute break for deep breathing');
    actions.push('Review your top 3 priorities for today');
    actions.push('Log one small win to build momentum');
  } else if (state === 'DANGER_MODE') {
    actions.push('Focus on your weakest hub for the next hour');
    actions.push('Log 2-3 quick actions in that area');
  } else if (state === 'GROWTH_MODE' || state === 'ULTRA_MODE') {
    actions.push('Maintain current momentum with consistency');
    actions.push('Challenge yourself with a stretch goal');
    actions.push('Share your progress with someone');
  }

  // Hub-specific actions
  if (weakestCode === 'HEALTH') {
    actions.push('Log a 20-minute walk or workout');
  } else if (weakestCode === 'FINANCE') {
    actions.push('Review today\'s expenses and log them');
  } else if (weakestCode === 'RELATIONSHIPS') {
    actions.push('Send a message to check in with someone');
  }

  return actions.slice(0, 3);
}
