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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    console.log('[generate-monthly-insights] Starting for user:', user.id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Fetch monthly data
    const [
      { data: systemStates },
      { data: logs },
      { data: habits },
      { data: projects },
      { data: ultraMetrics }
    ] = await Promise.all([
      supabase.from('system_state_daily').select('*').eq('user_id', user.id).gte('state_date', thirtyDaysAgo).order('state_date'),
      supabase.from('logs').select('*, hubs(name)').eq('user_id', user.id).gte('log_date', thirtyDaysAgo),
      supabase.from('habits').select('*, habit_checkins!inner(*)').eq('user_id', user.id),
      supabase.from('projects').select('*, tasks(*), hubs(name)').eq('user_id', user.id),
      supabase.from('ultra_metrics').select('*, ultra_domains(name)').eq('user_id', user.id).gte('metric_date', thirtyDaysAgo),
    ]);

    // Calculate monthly statistics
    const avgUltraScore = systemStates && systemStates.length > 0
      ? systemStates.reduce((sum, s) => sum + Number(s.ultra_score), 0) / systemStates.length
      : 0;

    const scoreChange = systemStates && systemStates.length > 1
      ? Number(systemStates[systemStates.length - 1].ultra_score) - Number(systemStates[0].ultra_score)
      : 0;

    // State distribution
    const stateCounts: Record<string, number> = {};
    systemStates?.forEach(s => {
      stateCounts[s.state] = (stateCounts[s.state] || 0) + 1;
    });

    // Most active hub
    const hubActivity: Record<string, number> = {};
    logs?.forEach(log => {
      if (log.hubs?.name) {
        hubActivity[log.hubs.name] = (hubActivity[log.hubs.name] || 0) + 1;
      }
    });
    const mostActiveHub = Object.entries(hubActivity).sort(([, a], [, b]) => b - a)[0];

    // Habit consistency
    const habitStats = habits?.map(h => {
      const checkins = h.habit_checkins?.filter((c: any) => c.date >= thirtyDaysAgo);
      const consistency = checkins ? (checkins.length / 30) * 100 : 0;
      return { name: h.name, consistency, streak: h.streak || 0 };
    }).sort((a, b) => b.consistency - a.consistency) || [];

    // Domain performance over month
    const domainPerformance: Record<string, { values: number[], avg: number, trend: string }> = {};
    ultraMetrics?.forEach(m => {
      if (m.ultra_domains?.name && m.name !== 'ULTRA_SCORE') {
        if (!domainPerformance[m.ultra_domains.name]) {
          domainPerformance[m.ultra_domains.name] = { values: [], avg: 0, trend: 'stable' };
        }
        domainPerformance[m.ultra_domains.name].values.push(m.value);
      }
    });

    Object.entries(domainPerformance).forEach(([name, data]) => {
      data.avg = data.values.reduce((a, b) => a + b, 0) / data.values.length;
      if (data.values.length > 2) {
        const recentAvg = data.values.slice(-10).reduce((a, b) => a + b, 0) / Math.min(10, data.values.length);
        const earlyAvg = data.values.slice(0, 10).reduce((a, b) => a + b, 0) / Math.min(10, data.values.length);
        if (recentAvg > earlyAvg + 5) data.trend = 'improving';
        else if (recentAvg < earlyAvg - 5) data.trend = 'declining';
      }
    });

    const sortedDomains = Object.entries(domainPerformance)
      .sort(([, a], [, b]) => b.avg - a.avg)
      .map(([name, data]) => ({ name, ...data }));

    // Generate AI insights
    let aiInsights = '';
    if (lovableApiKey) {
      const prompt = `Generate comprehensive monthly insights based on 30 days of data:

**Overall Performance:**
- Average Ultra Score: ${avgUltraScore.toFixed(1)}
- Score Change: ${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(1)}
- Days in each state: ${Object.entries(stateCounts).map(([s, c]) => `${s}: ${c}`).join(', ')}

**Activity:**
- Total logs: ${logs?.length || 0}
- Most active hub: ${mostActiveHub?.[0] || 'None'} (${mostActiveHub?.[1] || 0} logs)
- Projects: ${projects?.length || 0} total, ${projects?.filter(p => p.status === 'Done').length || 0} completed

**Habits:**
- Best habit: ${habitStats[0]?.name || 'None'} (${habitStats[0]?.consistency.toFixed(0) || 0}% consistency)
- Longest streak: ${Math.max(...habitStats.map(h => h.streak))} days

**Domains:**
- Top performer: ${sortedDomains[0]?.name || 'None'} (${sortedDomains[0]?.avg.toFixed(1) || 0})
- Most improved: ${sortedDomains.find(d => d.trend === 'improving')?.name || 'None'}
- Needs focus: ${sortedDomains[sortedDomains.length - 1]?.name || 'None'} (${sortedDomains[sortedDomains.length - 1]?.avg.toFixed(1) || 0})

Provide:
1. Month in Review (3-4 sentences about overall trajectory)
2. Major Achievements (3-4 specific wins)
3. Growth Areas (2-3 areas that improved significantly)
4. Focus Areas for Next Month (3 specific, actionable priorities)
5. Life Balance Assessment (brief evaluation of domain distribution)

Be insightful, specific, and motivating.`;

      try {
        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are a personal growth analyst providing monthly performance reviews.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiInsights = aiData.choices[0].message.content;
        }
      } catch (aiError) {
        console.error('[generate-monthly-insights] AI error:', aiError);
      }
    }

    const insights = {
      period: `${thirtyDaysAgo} to ${today}`,
      summary: {
        avg_ultra_score: avgUltraScore,
        score_change: scoreChange,
        total_logs: logs?.length || 0,
        most_active_hub: mostActiveHub?.[0] || null,
        state_distribution: stateCounts,
      },
      habits: {
        best_habit: habitStats[0] || null,
        avg_consistency: habitStats.length > 0 ? habitStats.reduce((sum, h) => sum + h.consistency, 0) / habitStats.length : 0,
        longest_streak: Math.max(...habitStats.map(h => h.streak), 0),
      },
      domains: sortedDomains,
      projects: {
        total: projects?.length || 0,
        completed: projects?.filter(p => p.status === 'Done').length || 0,
        in_progress: projects?.filter(p => p.status === 'In Progress').length || 0,
      },
      ai_insights: aiInsights,
      generated_at: new Date().toISOString(),
    };

    console.log('[generate-monthly-insights] Completed successfully');

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-monthly-insights] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
