import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating AI insights for user:', user.id);

    // Gather all user data
    const [ultraMetrics, metrics, logs, habits, projects, calendarEntries] = await Promise.all([
      supabase.from('ultra_metrics').select('*').eq('user_id', user.id).order('metric_date', { ascending: false }).limit(30),
      supabase.from('metrics').select('*, hubs(name, code)').eq('user_id', user.id).order('metric_date', { ascending: false }).limit(100),
      supabase.from('logs').select('*, hubs(name)').eq('user_id', user.id).order('log_date', { ascending: false }).limit(50),
      supabase.from('habits').select('*, habit_checkins(*)').eq('user_id', user.id),
      supabase.from('projects').select('*, tasks(*)').eq('user_id', user.id),
      supabase.from('calendar_entries').select('*').eq('user_id', user.id).gte('date', new Date().toISOString().split('T')[0])
    ]);

    // Calculate current Ultra Score
    const latestUltraScore = ultraMetrics.data?.find(m => m.name === 'ULTRA_Score')?.value || 0;
    
    // Calculate 7-day trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weeklyScores = ultraMetrics.data?.filter(
      m => m.name === 'ULTRA_Score' && m.metric_date >= sevenDaysAgo
    ) || [];
    const scoreTrend = weeklyScores.length > 1 
      ? weeklyScores[0].value - weeklyScores[weeklyScores.length - 1].value 
      : 0;

    // Find weakest and strongest hubs
    const hubScores = metrics.data?.reduce((acc: any, m: any) => {
      const hubName = m.hubs?.name || 'Unknown';
      if (!acc[hubName] || new Date(m.metric_date) > new Date(acc[hubName].metric_date)) {
        acc[hubName] = m;
      }
      return acc;
    }, {}) || {};

    const hubScoreArray = Object.entries(hubScores).map(([name, data]: [string, any]) => ({
      name,
      score: data.value,
      code: data.hubs?.code
    }));

    hubScoreArray.sort((a, b) => a.score - b.score);
    const weakestHub = hubScoreArray[0];
    const strongestHub = hubScoreArray[hubScoreArray.length - 1];

    // Analyze habits
    const activeHabits = habits.data || [];
    const brokenStreaks = activeHabits.filter(h => h.streak && h.streak < 3);
    const strongStreaks = activeHabits.filter(h => h.streak && h.streak >= 10);
    
    // Analyze projects
    const activeProjects = projects.data?.filter(p => p.status !== 'Done') || [];
    const overdueTasks = projects.data?.flatMap(p => 
      p.tasks?.filter((t: any) => 
        t.due_date && t.due_date < new Date().toISOString().split('T')[0] && t.status !== 'Done'
      ) || []
    ) || [];

    // Analyze calendar load
    const todayEvents = calendarEntries.data?.filter(e => 
      e.date === new Date().toISOString().split('T')[0]
    ) || [];

    // Analyze recent activity
    const recentLogs = logs.data?.filter(l => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      return l.log_date >= threeDaysAgo;
    }) || [];

    // Build context for AI
    const context = {
      ultra_score: latestUltraScore,
      score_trend: scoreTrend,
      weakest_hub: weakestHub,
      strongest_hub: strongestHub,
      broken_streaks: brokenStreaks.length,
      strong_streaks: strongStreaks.length,
      active_projects: activeProjects.length,
      overdue_tasks: overdueTasks.length,
      today_events: todayEvents.length,
      recent_activity: recentLogs.length,
      hubs_below_50: hubScoreArray.filter(h => h.score < 50).length,
    };

    console.log('User context:', context);

    // Generate AI insights using Lovable AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an AI life coach for LifeOS, a personal operating system. 
Analyze the user's performance data and provide actionable, personalized insights.
Be encouraging yet direct. Focus on the top 3 most important actions.
Format your response as JSON with these exact fields:
{
  "daily_focus": "One sentence describing today's main priority",
  "primary_action": "The single most important thing to do today",
  "secondary_actions": ["Action 2", "Action 3"],
  "weakest_area": "Name of the weakest area",
  "weakest_area_advice": "Specific advice for improving it",
  "strengths": ["Strength 1", "Strength 2"],
  "mood_prediction": "one word: positive, neutral, or challenged",
  "energy_recommendation": "rest, balance, or push",
  "weekly_theme": "A motivating 2-3 word theme for the week"
}`;

    const userPrompt = `Current Ultra Score: ${latestUltraScore}/100 (${scoreTrend > 0 ? '+' : ''}${scoreTrend.toFixed(1)} this week)

Weakest Hub: ${weakestHub?.name || 'None'} (${weakestHub?.score || 0}/100)
Strongest Hub: ${strongestHub?.name || 'None'} (${strongestHub?.score || 0}/100)

Habits: ${brokenStreaks.length} broken streak(s), ${strongStreaks.length} strong streak(s)
Projects: ${activeProjects.length} active, ${overdueTasks.length} overdue task(s)
Calendar: ${todayEvents.length} event(s) today
Recent Activity: ${recentLogs.length} log entries in last 3 days
Hubs Below 50: ${context.hubs_below_50}

Generate personalized insights and recommendations.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'generate_insights',
            description: 'Generate personalized insights',
            parameters: {
              type: 'object',
              properties: {
                daily_focus: { type: 'string' },
                primary_action: { type: 'string' },
                secondary_actions: { type: 'array', items: { type: 'string' } },
                weakest_area: { type: 'string' },
                weakest_area_advice: { type: 'string' },
                strengths: { type: 'array', items: { type: 'string' } },
                mood_prediction: { type: 'string', enum: ['positive', 'neutral', 'challenged'] },
                energy_recommendation: { type: 'string', enum: ['rest', 'balance', 'push'] },
                weekly_theme: { type: 'string' }
              },
              required: ['daily_focus', 'primary_action', 'secondary_actions', 'weakest_area', 'weakest_area_advice', 'strengths', 'mood_prediction', 'energy_recommendation', 'weekly_theme'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'generate_insights' } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a few moments.');
      }
      if (aiResponse.status === 402) {
        throw new Error('AI credits depleted. Please add credits to your workspace.');
      }
      throw new Error('AI service unavailable');
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData));

    let insights;
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      insights = JSON.parse(aiData.choices[0].message.tool_calls[0].function.arguments);
    } else {
      // Fallback if tool calling fails
      insights = {
        daily_focus: "Focus on improving your weakest areas",
        primary_action: weakestHub ? `Work on ${weakestHub.name}` : "Log your daily activities",
        secondary_actions: ["Review your habits", "Check overdue tasks"],
        weakest_area: weakestHub?.name || "Unknown",
        weakest_area_advice: "Start with small, consistent actions",
        strengths: strongestHub ? [strongestHub.name] : [],
        mood_prediction: latestUltraScore > 70 ? 'positive' : latestUltraScore > 50 ? 'neutral' : 'challenged',
        energy_recommendation: latestUltraScore > 70 ? 'push' : latestUltraScore > 50 ? 'balance' : 'rest',
        weekly_theme: "Steady Progress"
      };
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        context,
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating AI insights:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
