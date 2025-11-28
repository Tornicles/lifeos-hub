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
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Get today's and yesterday's ULTRA_Score
    const { data: scores } = await supabaseClient
      .from('ultra_metrics')
      .select('value, metric_date')
      .eq('user_id', user.id)
      .eq('name', 'ULTRA_Score')
      .in('metric_date', [today, yesterday])
      .order('metric_date', { ascending: false });

    const todayScore = scores?.[0]?.value || 0;
    const yesterdayScore = scores?.[1]?.value || 0;
    const scoreDelta = todayScore - yesterdayScore;

    // Get today's logs count
    const { count: logsCount } = await supabaseClient
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('log_date', today);

    // Get hub scores
    const { data: hubScores } = await supabaseClient
      .from('metrics')
      .select('hub_id, value, hubs(name)')
      .eq('user_id', user.id)
      .eq('name', 'DailyScore')
      .eq('metric_date', today);

    let bestHub: { name: string } | null = null;
    let bestScore = 0;
    let worstHub: { name: string } | null = null;
    let worstScore = 100;

    if (hubScores && hubScores.length > 0) {
      for (const hub of hubScores) {
        const hubData = Array.isArray(hub.hubs) ? hub.hubs[0] : hub.hubs;
        if (hub.value > bestScore && hubData) {
          bestScore = hub.value;
          bestHub = { name: hubData.name };
        }
        if (hub.value < worstScore && hubData) {
          worstScore = hub.value;
          worstHub = { name: hubData.name };
        }
      }
    }

    // Get habit streaks
    const { data: habits } = await supabaseClient
      .from('habits')
      .select('streak')
      .eq('user_id', user.id)
      .order('streak', { ascending: false })
      .limit(1);

    const bestStreak = habits?.[0]?.streak || 0;

    // Generate insight summary
    let summary = '';
    let tone = '';

    if (todayScore >= 80) {
      tone = 'excellent';
      summary = `🔵 Outstanding day! Your ULTRA Score is ${todayScore.toFixed(1)}.`;
    } else if (todayScore >= 60) {
      tone = 'positive';
      summary = `🟢 Solid progress today with a score of ${todayScore.toFixed(1)}.`;
    } else if (todayScore >= 40) {
      tone = 'neutral';
      summary = `🟡 Steady pace today at ${todayScore.toFixed(1)}.`;
    } else if (todayScore >= 20) {
      tone = 'concern';
      summary = `🟠 Focus needed - score at ${todayScore.toFixed(1)}.`;
    } else {
      tone = 'critical';
      summary = `🔴 Critical attention required - score at ${todayScore.toFixed(1)}.`;
    }

    if (scoreDelta > 5) {
      summary += ` Great improvement (+${scoreDelta.toFixed(1)})!`;
    } else if (scoreDelta < -5) {
      summary += ` Down ${Math.abs(scoreDelta).toFixed(1)} from yesterday.`;
    }

    if (bestHub) {
      summary += ` ${bestHub.name} is your strongest area today (${bestScore.toFixed(1)}).`;
    }

    if (worstHub && worstScore < 50) {
      summary += ` ${worstHub.name} needs attention (${worstScore.toFixed(1)}).`;
    }

    if (logsCount && logsCount > 5) {
      summary += ` Strong logging activity with ${logsCount} entries.`;
    } else if (logsCount && logsCount < 3) {
      summary += ' Consider logging more activities to improve tracking.';
    }

    if (bestStreak >= 7) {
      summary += ` Your best habit streak is ${bestStreak} days - keep it going!`;
    }

    return new Response(
      JSON.stringify({
        summary,
        tone,
        ultra_score: todayScore,
        score_delta: scoreDelta,
        best_hub: bestHub,
        best_score: bestScore,
        worst_hub: worstHub,
        worst_score: worstScore,
        logs_count: logsCount || 0,
        best_streak: bestStreak,
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
