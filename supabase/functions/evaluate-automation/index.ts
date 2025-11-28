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
  | 'OVERLOAD_WARNING'
  | 'WEAK';

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
      .select('hub_id, name, value, hubs(id, code, name)')
      .eq('user_id', user.id)
      .eq('name', 'DailyScore')
      .eq('metric_date', today);

    const hubScores = (hubMetrics || []).map(m => ({
      score: m.value,
      hub_id: m.hub_id,
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

    // EXACT STATE CLASSIFICATION (Per Prompt 7 Requirements)
    // State Table: 0-29=CRISIS, 30-49=WEAK, 50-64=NEUTRAL, 65-79=GROWTH, 80-100=AFFLUENCE
    let state: SystemState = 'NEUTRAL_MODE';
    let baseState = 'NEUTRAL'; // CRISIS, WEAK, NEUTRAL, GROWTH, AFFLUENCE
    let stateColor = '#808080';
    let stateIcon = 'minus-circle';
    let stateLevel: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED' = 'YELLOW';
    const stateReasons: string[] = [];
    
    // Base state determination from ULTRA Score
    if (ultraScore < 30) {
      baseState = 'CRISIS';
      state = 'CRISIS_MODE';
      stateColor = '#FF0000';
      stateIcon = 'alert-octagon';
      stateLevel = 'RED';
      stateReasons.push('Emergency danger - ULTRA Score below 30');
    } else if (ultraScore < 50) {
      baseState = 'WEAK';
      state = 'WEAK';
      stateColor = '#FF4500';
      stateIcon = 'alert-triangle';
      stateLevel = 'RED';
      stateReasons.push('System failing - needs recovery');
    } else if (ultraScore < 65) {
      baseState = 'NEUTRAL';
      state = 'NEUTRAL_MODE';
      stateColor = '#808080';
      stateIcon = 'minus-circle';
      stateLevel = 'YELLOW';
      stateReasons.push('Stable but not improving');
    } else if (ultraScore < 80) {
      baseState = 'GROWTH';
      state = 'GROWTH_MODE';
      stateColor = '#00BCF2';
      stateIcon = 'trending-up';
      stateLevel = 'GREEN';
      stateReasons.push('Good improvement trajectory');
    } else {
      baseState = 'AFFLUENCE';
      state = 'AFFLUENCE_MODE';
      stateColor = '#7FBA00';
      stateIcon = 'check-circle';
      stateLevel = 'GREEN';
      stateReasons.push('High performance - peak zone');
    }
    
    // Enhance base state with modifiers
    if (avgStreak >= 7 && hubImbalance < 30 && baseState === 'AFFLUENCE') {
      state = 'AFFLUENCE_MODE';
      stateReasons.push('Strong habit consistency');
      stateReasons.push('Well-balanced domains');
    } else if (scoreTrend > 10 && (baseState === 'GROWTH' || baseState === 'AFFLUENCE')) {
      state = 'ASCENSION_MODE';
      stateColor = '#00BCF2';
      stateIcon = 'trending-up';
      stateReasons.push('Exceptional positive momentum');
    } else if (hubImbalance > 40 && baseState !== 'CRISIS') {
      stateReasons.push('Significant domain imbalance detected');
    }
    
    // Additional state modifiers and warnings
    if ((recentLogs || 0) < 3) {
      stateReasons.push('Low logging activity - system visibility reduced');
    }
    
    if (avgStreak < 2 && ultraScore < 60) {
      stateReasons.push('Habit consistency breakdown');
    }
    
    if ((calendarLoad || 0) > 8) {
      stateReasons.push('Calendar overload - burnout risk');
      if (state === 'GROWTH_MODE' || state === 'ASCENSION_MODE') {
        state = 'OVERLOAD_WARNING';
        stateColor = '#FFD700';
        stateIcon = 'alert-circle';
      }
    }
    
    if (hubsInCrisis >= 1 && baseState !== 'CRISIS') {
      state = 'RESET_MODE';
      baseState = 'WEAK';
      stateColor = '#DC143C';
      stateIcon = 'refresh-cw';
      stateLevel = 'RED';
      stateReasons.push('Critical hub failure - emergency reset activated');
    }
    
    if (scoreTrend < -10) {
      stateReasons.push(`Declining trend: ${scoreTrend.toFixed(1)} points in 7 days`);
    }

    // PRIORITY HUB ENGINE - Advanced calculation
    let priorityHub: { code: string; name: string } | null = null;
    let priorityHubId: number | null = null;
    let priorityScore = 0;
    let weakestHub: { code: string; name: string } | null = null;
    let weakestHubId: number | null = null;
    let weakestScore = 100;
    
    for (const hub of hubScores) {
      // Find absolute weakest
      if (hub.score < weakestScore) {
        weakestScore = hub.score;
        weakestHub = hub.hub;
        weakestHubId = hub.hub_id;
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
        priorityHubId = hub.hub_id;
      }
    }

    // Fetch active automation rules
    const { data: rules } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('is_active', true);

    const triggeredActions = [];

    // RULE EVALUATION ENGINE - All 7 Rule Families
    if (rules) {
      for (const rule of rules) {
        let triggered = false;

        switch (rule.condition_type) {
          // Family A: ULTRA Score Based
          case 'ULTRA_BELOW':
            if (ultraScore < (rule.condition_value || 0)) triggered = true;
            break;
          case 'ULTRA_ABOVE':
            if (ultraScore >= (rule.condition_value || 0)) triggered = true;
            break;
          case 'ULTRA_RANGE':
            const [min, max] = (rule.action_value || '0,100').split(',').map(Number);
            if (ultraScore >= min && ultraScore < max) triggered = true;
            break;
            
          // Family B: Weakest Hub Based
          case 'HUB_BELOW':
            if (weakestScore < (rule.condition_value || 0)) triggered = true;
            break;
          case 'WEAKEST_HUB_IS':
            if (weakestHub?.code === rule.action_value) triggered = true;
            break;
          case 'HUBS_IN_DANGER':
            if (hubsInDanger >= (rule.condition_value || 0)) triggered = true;
            break;
            
          // Family C: Missing Logs
          case 'NO_LOGS_TODAY':
            if ((recentLogs || 0) === 0) triggered = true;
            break;
          case 'LOGS_BELOW':
            if ((recentLogs || 0) < (rule.condition_value || 0)) triggered = true;
            break;
            
          // Family D: Habit Logic
          case 'HABIT_STREAK_BELOW':
            if (avgStreak < (rule.condition_value || 0)) triggered = true;
            break;
          case 'HABIT_STREAK_ABOVE':
            if (avgStreak >= (rule.condition_value || 0)) triggered = true;
            break;
            
          // Family E: Emotional Triggers
          case 'SCORE_TREND_NEGATIVE':
            if (scoreTrend < -5) triggered = true;
            break;
            
          // Family F: Calendar/Project Logic
          case 'CALENDAR_OVERLOAD':
            if ((calendarLoad || 0) > (rule.condition_value || 0)) triggered = true;
            break;
          case 'HUB_IMBALANCE_HIGH':
            if (hubImbalance > (rule.condition_value || 0)) triggered = true;
            break;
            
          // Family G: State-Based Modes
          case 'STATE_IS':
            if (baseState === rule.action_value) triggered = true;
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

    // PRIORITY ZONE CALCULATION (Per Prompt 7)
    let priorityZone = '';
    if (baseState === 'CRISIS') {
      priorityZone = priorityHub?.name || 'Emergency Recovery';
    } else if (baseState === 'WEAK') {
      // Weakest hub OR critical life domain (health/finance)
      const criticalHubs = ['HEALTH', 'FINANCE'];
      const isCritical = criticalHubs.includes(priorityHub?.code || '');
      priorityZone = isCritical ? `CRITICAL: ${priorityHub?.name}` : (priorityHub?.name || 'Recovery');
    } else if (baseState === 'NEUTRAL') {
      // Ultra domain causing imbalance
      priorityZone = sortedHubs[0]?.hub.name || 'Domain Rebalance';
    } else if (baseState === 'GROWTH') {
      priorityZone = 'Strategic Goals & Projects';
    } else { // AFFLUENCE
      priorityZone = 'Long-term Scaling & Expansion';
    }

    // Store daily state in database
    try {
      await supabaseClient
        .from('system_state_daily')
        .upsert({
          user_id: user.id,
          state_date: today,
          state: baseState,
          ultra_score: ultraScore,
          weakest_hub_id: weakestHubId,
          strongest_hub_id: hubScores.length > 0 
            ? hubScores.reduce((max, h) => h.score > max.score ? h : max, hubScores[0])?.hub_id 
            : null,
          priority_zone: priorityZone,
          state_reasons: JSON.stringify(stateReasons),
        }, {
          onConflict: 'user_id,state_date'
        });
    } catch (storeError) {
      console.error('Error storing daily state:', storeError);
    }

    return new Response(
      JSON.stringify({
        ultra_score: ultraScore,
        state,
        base_state: baseState,
        state_color: stateColor,
        state_icon: stateIcon,
        state_level: stateLevel,
        state_reasons: stateReasons,
        priority_zone: priorityZone,
        priority_hub: priorityHub,
        priority_score: priorityScore,
        weakest_hub: weakestHub,
        weakest_score: weakestScore,
        strongest_hub: hubScores.length > 0 
          ? hubScores.reduce((max, h) => h.score > max.score ? h : max, hubScores[0]).hub 
          : null,
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
