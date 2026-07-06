import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UltraMetric {
  domain_id: number | null;
  name: string;
  value: number;
  metric_date: string;
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

    // Fetch all 7 domain scores for the date
    const { data: domainMetrics, error: metricsError } = await supabaseClient
      .from('ultra_metrics')
      .select('domain_id, name, value, metric_date')
      .eq('user_id', user.id)
      .eq('metric_date', targetDate)
      .not('domain_id', 'is', null) as { data: UltraMetric[] | null, error: any };

    if (metricsError) {
      console.error('Error fetching domain metrics:', metricsError);
    }

    // Calculate base average from 7 domains
    const domainScores = domainMetrics || [];
    const baseAverage = domainScores.length > 0
      ? domainScores.reduce((sum, m) => sum + (m.value || 0), 0) / domainScores.length
      : 0;

    // Fetch habit streaks for consistency factor
    const { data: habits } = await supabaseClient
      .from('habits')
      .select('streak')
      .eq('user_id', user.id);

    const avgStreak = habits && habits.length > 0
      ? habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length
      : 0;

    // Consistency factor: 1.0 + (avgStreak / 100) capped at 1.2
    const consistencyFactor = Math.min(1.0 + (avgStreak / 100), 1.2);

    // Fetch last 7 days of ULTRA_Score for trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: trendData } = await supabaseClient
      .from('ultra_metrics')
      .select('value, metric_date')
      .eq('user_id', user.id)
      .eq('name', 'ULTRA_Score')
      .gte('metric_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('metric_date', { ascending: false })
      .limit(7);

    // Trend factor: positive trend = 1.05, negative = 0.95, neutral = 1.0
    let trendFactor = 1.0;
    if (trendData && trendData.length >= 2) {
      const recentAvg = trendData.slice(0, 3).reduce((sum, d) => sum + (d.value || 0), 0) / 3;
      const olderAvg = trendData.slice(3).reduce((sum, d) => sum + (d.value || 0), 0) / Math.max(trendData.length - 3, 1);
      if (recentAvg > olderAvg) trendFactor = 1.05;
      else if (recentAvg < olderAvg) trendFactor = 0.95;
    }

    // Final ULTRA_Score calculation
    const ultraScore = Math.min(Math.round(baseAverage * consistencyFactor * trendFactor * 10) / 10, 100);

    // Store the computed ULTRA_Score
    const { error: insertError } = await supabaseClient
      .from('ultra_metrics')
      .upsert({
        user_id: user.id,
        domain_id: null,
        name: 'ULTRA_Score',
        value: ultraScore,
        metric_date: targetDate,
      }, {
        onConflict: 'user_id,name,metric_date',
      });

    if (insertError) {
      console.error('Error storing ULTRA_Score:', insertError);
    }

    return new Response(
      JSON.stringify({
        ultra_score: ultraScore,
        base_average: Math.round(baseAverage * 10) / 10,
        consistency_factor: Math.round(consistencyFactor * 100) / 100,
        trend_factor: Math.round(trendFactor * 100) / 100,
        domain_scores: domainScores,
        date: targetDate,
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
