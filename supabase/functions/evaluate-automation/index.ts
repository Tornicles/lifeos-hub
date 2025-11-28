import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SystemState = 
  | 'AFFLUENCE_MODE' 
  | 'ULTRA_MODE' 
  | 'ASCENSION_MODE' 
  | 'GROWTH_MODE' 
  | 'BALANCED_MODE'
  | 'NEUTRAL_MODE' 
  | 'STRUGGLING_MODE'
  | 'DANGER_MODE' 
  | 'CRISIS_MODE' 
  | 'RESET_MODE'
  | 'OVERLOAD_WARNING';

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
    const { data: hubMetrics } = await supabaseClient
      .from('metrics')
      .select('hub_id, name, value, hubs(code, name)')
      .eq('user_id', user.id)
      .eq('name', 'DailyScore')
      .eq('metric_date', today);

    const hubScores = (hubMetrics || []).map(m => ({
      score: m.value,
      hub: Array.isArray(m.hubs) ? m.hubs[0] : m.hubs
    })).filter(h => h.hub);

    // Get habit data for consistency scoring
    const { data: habits } = await supabaseClient
      .from('habits')
      .select('streak, last_checkin')
      .eq('user_id', user.id);

    const avgStreak = habits && habits.length > 0
      ? habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length
      : 0;

    // Get calendar load (events today and next 3 days)
    const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    
    const { count: calendarLoad } = await supabaseClient
      .from('calendar_entries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', today)
      .lte('date', threeDaysLater);

    // Get logs from last 3 days for trend
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0];
    const { count: recentLogs } = await supabaseClient
      .from('logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('log_date', threeDaysAgo);

    // Get last 7 days ULTRA scores for trend analysis
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const { data: recentScores } = await supabaseClient
      .from('ultra_metrics')
      .select('value, metric_date')
      .eq('user_id', user.id)
      .eq('name', 'ULTRA_Score')
      .gte('metric_date', sevenDaysAgo)
      .order('metric_date', { ascending: false })
      .limit(7);

    const scoreTrend = recentScores && recentScores.length >= 2
      ? recentScores[0].value - recentScores[recentScores.length - 1].value
      : 0;

    // Hub imbalance calculation
    const hubScoreValues = hubScores.map(h => h.score);
    const maxHub = hubScoreValues.length > 0 ? Math.max(...hubScoreValues) : 0;
    const minHub = hubScoreValues.length > 0 ? Math.min(...hubScoreValues) : 0;
    const hubImbalance = maxHub - minHub;
    
    const hubsInDanger = hubScores.filter(h => h.score < 40).length;
    const hubsInCrisis = hubScores.filter(h => h.score < 20).length;

    // ADVANCED STATE CLASSIFICATION ALGORITHM
    let state: SystemState = 'NEUTRAL_MODE';
    let stateColor = '#808080';
    let stateIcon = 'minus-circle';
    let stateLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'YELLOW';
    const stateReasons: string[] = [];
    
    if (ultraScore >= 80 && avgStreak >= 7 && hubImbalance < 30 && (calendarLoad || 0) < 5) {
      state = 'AFFLUENCE_MODE';
      stateColor = '#7FBA00';
      stateIcon = 'check-circle';
      stateLevel = 'GREEN';
      stateReasons.push('Excellent overall performance');
      stateReasons.push('Strong habit consistency');
      stateReasons.push('Well-balanced domains');
    } else if (ultraScore >= 80) {
      state = 'ULTRA_MODE';
      stateColor = '#7FBA00';
      stateIcon = 'zap';
      stateLevel = 'GREEN';
      stateReasons.push('High ULTRA Score');
    } else if (ultraScore >= 60 && scoreTrend > 0) {
      state = 'ASCENSION_MODE';
      stateColor = '#00BCF2';
      stateIcon = 'trending-up';
      stateLevel = 'GREEN';
      stateReasons.push('Positive trend detected');
      stateReasons.push('Growing momentum');
    } else if (ultraScore >= 60) {
      state = 'GROWTH_MODE';
      stateColor = '#00BCF2';
      stateIcon = 'activity';
      stateLevel = 'YELLOW';
      stateReasons.push('Stable performance');
    } else if (ultraScore >= 40 && hubImbalance < 40) {
      state = 'BALANCED_MODE';
      stateColor = '#FFA500';
      stateIcon = 'target';
      stateLevel = 'YELLOW';
      stateReasons.push('Moderate performance');
      stateReasons.push('Room for improvement');
    } else if (ultraScore >= 40) {
      state = 'NEUTRAL_MODE';
      stateColor = '#808080';
      stateIcon = 'minus-circle';
      stateLevel = 'ORANGE';
      stateReasons.push('Below optimal levels');
    } else if (ultraScore >= 30 || (hubsInDanger >= 2 && hubsInDanger < 4)) {
      state = 'STRUGGLING_MODE';
      stateColor = '#FF8C00';
      stateIcon = 'alert-triangle';
      stateLevel = 'ORANGE';
      stateReasons.push('Multiple hubs need attention');
      if (avgStreak < 3) stateReasons.push('Low habit consistency');
    } else if (ultraScore >= 20 || hubsInDanger >= 2) {
      state = 'DANGER_MODE';
      stateColor = '#FF4500';
      stateIcon = 'alert-triangle';
      stateLevel = 'RED';
      stateReasons.push('Critical attention required');
      stateReasons.push(`${hubsInDanger} hub${hubsInDanger > 1 ? 's' : ''} in danger zone`);
    } else {
      state = 'CRISIS_MODE';
      stateColor = '#FF0000';
      stateIcon = 'alert-octagon';
      stateLevel = 'RED';
      stateReasons.push('Emergency intervention needed');
      stateReasons.push('System-wide performance collapse');
    }
    
    // Additional state modifiers
    if ((recentLogs || 0) < 3 && state !== 'CRISIS_MODE') {
      stateReasons.push('Low logging activity detected');
    }
    
    if (avgStreak < 2 && ultraScore < 60) {
      stateReasons.push('Habit streaks need rebuilding');
    }
    
    if ((calendarLoad || 0) > 8) {
      stateReasons.push('High calendar stress load');
      if (state === 'GROWTH_MODE' || state === 'ASCENSION_MODE') {
        state = 'OVERLOAD_WARNING';
        stateColor = '#FFD700';
        stateIcon = 'alert-circle';
      }
    }
    
    if (hubsInCrisis >= 1) {
      state = 'RESET_MODE';
      stateColor = '#DC143C';
      stateIcon = 'refresh-cw';
      stateLevel = 'RED';
      stateReasons.push('Critical hub failure - reset protocol activated');
    }
    
    if (scoreTrend < -10 && ultraScore < 50) {
      stateReasons.push('Declining trend detected');
    }

    // PRIORITY HUB ENGINE - Advanced calculation
    let priorityHub: { code: string; name: string } | null = null;
    let priorityScore = 0;
    let weakestHub: { code: string; name: string } | null = null;
    let weakestScore = 100;
    
    for (const hub of hubScores) {
      // Find absolute weakest
      if (hub.score < weakestScore) {
        weakestScore = hub.score;
        weakestHub = hub.hub;
      }
      
      // Priority calculation: (100 - score) + trend_penalty + impact_weight
      const scorePenalty = 100 - hub.score;
      const trendPenalty = hub.score < 40 ? 20 : hub.score < 60 ? 10 : 0;
      
      // Impact weights (critical hubs get higher priority)
      const impactWeights: Record<string, number> = {
        'HEALTH': 1.3,
        'FINANCE': 1.2,
        'WORK': 1.1,
        'MINDSET': 1.2,
        'RELATIONSHIPS': 1.1,
        'PERSONAL_DEV': 1.0,
        'ACADEMY': 1.0,
        'HOUSEHOLD': 0.9,
        'PROJECTS': 0.9
      };
      
      const impactWeight = impactWeights[hub.hub.code] || 1.0;
      const calculatedPriority = (scorePenalty + trendPenalty) * impactWeight;
      
      if (calculatedPriority > priorityScore) {
        priorityScore = calculatedPriority;
        priorityHub = hub.hub;
      }
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

    // AI BEHAVIOR ENGINE - Generate intelligent recommendations
    const sortedHubs = [...hubScores].sort((a, b) => a.score - b.score);
    const secondWeakest = sortedHubs[1]?.hub.name || 'Consistency';
    
    const focusRecommendations = {
      primary_domain: priorityHub?.name || weakestHub?.name || 'Overall Balance',
      secondary_domain: secondWeakest,
      suggested_actions: generateActions(state, priorityHub?.code || weakestHub?.code || '', ultraScore, avgStreak, recentLogs || 0),
      risk_factors: [] as string[],
      opportunities: [] as string[],
    };
    
    // Identify risk factors
    if (hubsInDanger >= 2) focusRecommendations.risk_factors.push('Multiple domains critically low');
    if (avgStreak < 3) focusRecommendations.risk_factors.push('Habit consistency breakdown');
    if (scoreTrend < -5) focusRecommendations.risk_factors.push('Negative momentum trend');
    if ((calendarLoad || 0) > 8) focusRecommendations.risk_factors.push('Calendar overload risk');
    if ((recentLogs || 0) < 3) focusRecommendations.risk_factors.push('Low activity logging');
    
    // Identify opportunities
    if (scoreTrend > 5) focusRecommendations.opportunities.push('Positive growth momentum');
    if (avgStreak >= 7) focusRecommendations.opportunities.push('Strong habit foundation');
    if (hubImbalance < 20) focusRecommendations.opportunities.push('Well-balanced domains');
    if (ultraScore >= 70) focusRecommendations.opportunities.push('High performance baseline');

    return new Response(
      JSON.stringify({
        ultra_score: ultraScore,
        state,
        state_color: stateColor,
        state_icon: stateIcon,
        state_level: stateLevel,
        state_reasons: stateReasons,
        priority_hub: priorityHub,
        priority_score: priorityScore,
        weakest_hub: weakestHub,
        weakest_score: weakestScore,
        hubs_in_danger: hubsInDanger,
        hub_imbalance: hubImbalance,
        habit_consistency: avgStreak,
        calendar_load: calendarLoad || 0,
        score_trend: scoreTrend,
        recent_activity: recentLogs || 0,
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

function generateActions(
  state: SystemState, 
  priorityHubCode: string, 
  score: number, 
  avgStreak: number,
  recentLogs: number
): string[] {
  const actions: string[] = [];
  
  // CRISIS / RESET MODE
  if (state.includes('CRISIS') || state.includes('RESET')) {
    actions.push('🚨 EMERGENCY: Stop everything. Focus only on survival essentials today.');
    actions.push('Cancel all non-critical meetings and commitments immediately.');
    actions.push('Schedule 60-minute recovery/reset session - no distractions.');
    actions.push('Reach out to support system (friend/family/coach) for help.');
    return actions.slice(0, 3);
  }
  
  // DANGER MODE
  if (state.includes('DANGER') || state.includes('STRUGGLING')) {
    actions.push('⚠️ Reduce workload by 50% today - cut non-essentials ruthlessly.');
    actions.push('Focus ONLY on foundational habits: sleep, water, basic movement.');
    
    if (priorityHubCode === 'HEALTH') {
      actions.push('Critical: 20-minute walk + 8 hours sleep tonight - non-negotiable.');
    } else if (priorityHubCode === 'FINANCE') {
      actions.push('Financial triage: Review all expenses NOW and freeze spending today.');
    } else if (priorityHubCode === 'MINDSET') {
      actions.push('Mental health priority: 15-min meditation or journaling session.');
    } else if (priorityHubCode === 'RELATIONSHIPS') {
      actions.push('Connection repair: Reach out to 1 person you care about today.');
    } else {
      actions.push(`Priority action: Dedicate 45 focused minutes to ${priorityHubCode} recovery.`);
    }
    return actions.slice(0, 3);
  }
  
  // OVERLOAD WARNING
  if (state.includes('OVERLOAD')) {
    actions.push('📅 Calendar overload detected - reschedule or delegate 3+ items.');
    actions.push('Block 2 hours for deep work - protect this time fiercely.');
    actions.push('Take 3 strategic breaks today to prevent burnout.');
    return actions.slice(0, 3);
  }
  
  // GROWTH / ASCENSION MODE
  if (state.includes('GROWTH') || state.includes('ASCENSION')) {
    actions.push('🚀 Momentum is strong - maintain consistency at all costs.');
    actions.push('Level up: Add one new challenging habit or skill this week.');
    actions.push('Document your current systems - what\'s working exceptionally well?');
    if (avgStreak >= 7) {
      actions.push('Reward system: Celebrate your 7+ day streak with something meaningful.');
    }
    return actions.slice(0, 3);
  }
  
  // ULTRA / AFFLUENCE MODE
  if (state.includes('ULTRA') || state.includes('AFFLUENCE')) {
    actions.push('⚡ Peak performance mode - optimize and refine existing systems.');
    actions.push('Give back: Mentor someone or share knowledge (multiplier effect).');
    actions.push('Strategic planning: Define next-level ambitious goals for next quarter.');
    actions.push('Maintain excellence: Review all 7 domains for micro-improvements.');
    return actions.slice(0, 3);
  }
  
  // NEUTRAL / BALANCED MODE (Default)
  if (recentLogs < 3) {
    actions.push('⚡ Logging gap detected - track at least 5 activities today for visibility.');
  }
  
  if (avgStreak < 3) {
    actions.push('🎯 Rebuild habit foundation - complete 3 core habits today.');
  }
  
  if (priorityHubCode) {
    const hubActions: Record<string, string> = {
      'HEALTH': '🏃 Health focus: 30-min workout + whole food meals + 7hrs sleep',
      'FINANCE': '💰 Finance focus: Track every expense + review budget + no impulse buys',
      'WORK': '💼 Work focus: Complete 1 high-impact task + clear inbox + plan tomorrow',
      'ACADEMY': '📚 Academy focus: 60-min focused study session on key skill',
      'PERSONAL_DEV': '🌱 Growth focus: 30-min skill development + read 20 pages',
      'HOUSEHOLD': '🏠 Household focus: Complete 3 organization tasks + clean workspace',
      'RELATIONSHIPS': '❤️ Connection focus: Quality time with 2 important people',
      'PROJECTS': '🎯 Project focus: Move 1 key project forward significantly today',
      'MINDSET': '🧠 Mindset focus: Morning reflection + evening gratitude practice'
    };
    
    actions.push(hubActions[priorityHubCode] || `Focus on ${priorityHubCode}: Dedicate 45 minutes of deep work.`);
  }
  
  actions.push('📊 Complete daily review: Log wins, challenges, and tomorrow\'s priorities.');
  actions.push('🎯 One high-impact action: What single thing moves the needle most today?');
  
  return actions.slice(0, 3);
}
