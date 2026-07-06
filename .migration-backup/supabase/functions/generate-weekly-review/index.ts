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

    console.log('[generate-weekly-review] Starting for user:', user.id);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    // Fetch weekly data
    const [
      { data: logs },
      { data: habits },
      { data: ultraMetrics },
      { data: projects },
      { data: calendarEntries }
    ] = await Promise.all([
      supabase.from('logs').select('*').eq('user_id', user.id).gte('log_date', sevenDaysAgo),
      supabase.from('habits').select('*, habit_checkins(*)').eq('user_id', user.id),
      supabase.from('ultra_metrics').select('*, ultra_domains(name)').eq('user_id', user.id).gte('metric_date', sevenDaysAgo),
      supabase.from('projects').select('*, tasks(*)').eq('user_id', user.id),
      supabase.from('calendar_entries').select('*').eq('user_id', user.id).gte('date', sevenDaysAgo),
    ]);

    // Calculate statistics
    const totalLogs = logs?.length || 0;
    const completedHabits = habits?.filter(h => {
      const recentCheckins = h.habit_checkins?.filter((c: any) => c.date >= sevenDaysAgo);
      return recentCheckins && recentCheckins.length >= 5;
    }).length || 0;

    const avgUltraScore = ultraMetrics && ultraMetrics.length > 0
      ? ultraMetrics.filter(m => m.name === 'ULTRA_SCORE').reduce((sum, m) => sum + m.value, 0) / Math.max(ultraMetrics.filter(m => m.name === 'ULTRA_SCORE').length, 1)
      : 0;

    const tasksCompleted = projects?.reduce((sum, p) => {
      return sum + (p.tasks?.filter((t: any) => t.status === 'Done').length || 0);
    }, 0) || 0;

    // Domain trends
    const domainTrends: Record<string, number[]> = {};
    ultraMetrics?.forEach(m => {
      if (m.ultra_domains?.name && m.name !== 'ULTRA_SCORE') {
        if (!domainTrends[m.ultra_domains.name]) {
          domainTrends[m.ultra_domains.name] = [];
        }
        domainTrends[m.ultra_domains.name].push(m.value);
      }
    });

    const domainSummary = Object.entries(domainTrends).map(([name, values]) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const trend = values.length > 1 ? values[values.length - 1] - values[0] : 0;
      return { name, avg, trend };
    }).sort((a, b) => b.avg - a.avg);

    // Generate AI review if Lovable AI is enabled
    let aiSummary = '';
    if (lovableApiKey) {
      const prompt = `Generate a concise weekly review based on this data:
- Total logs: ${totalLogs}
- Habits maintained: ${completedHabits}/${habits?.length || 0}
- Average Ultra Score: ${avgUltraScore.toFixed(1)}
- Tasks completed: ${tasksCompleted}
- Calendar events: ${calendarEntries?.length || 0}
- Top performing domain: ${domainSummary[0]?.name || 'None'} (${domainSummary[0]?.avg.toFixed(1) || 0})
- Most improved: ${domainSummary.filter(d => d.trend > 0)[0]?.name || 'None'} (+${domainSummary.filter(d => d.trend > 0)[0]?.trend.toFixed(1) || 0})
- Needs attention: ${domainSummary[domainSummary.length - 1]?.name || 'None'} (${domainSummary[domainSummary.length - 1]?.avg.toFixed(1) || 0})

Provide:
1. Overall week assessment (2 sentences)
2. Key wins (2-3 bullet points)
3. Areas to improve (2-3 bullet points)
4. Next week focus (1 sentence)

Keep it motivating and actionable.`;

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
              { role: 'system', content: 'You are a personal productivity coach providing weekly reviews.' },
              { role: 'user', content: prompt }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices[0].message.content;
        }
      } catch (aiError) {
        console.error('[generate-weekly-review] AI error:', aiError);
        aiSummary = 'AI review temporarily unavailable.';
      }
    }

    const review = {
      period: `${sevenDaysAgo} to ${today}`,
      statistics: {
        total_logs: totalLogs,
        habits_completed: completedHabits,
        habits_total: habits?.length || 0,
        avg_ultra_score: avgUltraScore,
        tasks_completed: tasksCompleted,
        calendar_events: calendarEntries?.length || 0,
      },
      domain_performance: domainSummary,
      ai_summary: aiSummary,
      generated_at: new Date().toISOString(),
    };

    console.log('[generate-weekly-review] Completed successfully');

    return new Response(
      JSON.stringify(review),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[generate-weekly-review] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
