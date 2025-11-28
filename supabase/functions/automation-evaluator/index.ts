import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetricData {
  ultra_score: number;
  hub_scores: Record<string, number>;
  domain_scores: Record<string, number>;
  habit_consistency: number;
  calendar_load: number;
  recent_activity: number;
}

interface AutomationRule {
  id: number;
  name: string;
  description: string;
  condition_type: string;
  condition_value: number | null;
  action_target: string;
  action_value: string | null;
  is_active: boolean;
}

interface TriggeredRule {
  rule_id: number;
  rule_name: string;
  reason: string;
  action: {
    action_type: string;
    target: string;
    value: string | null;
  };
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

    const today = new Date().toISOString().split('T')[0];

    // Gather all metrics
    const metrics = await gatherMetrics(supabaseClient, user.id, today);

    // Calculate states
    const ultraState = calculateState(metrics.ultra_score);
    const systemState = determineSystemState(metrics);
    
    // Load active automation rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) throw rulesError;

    // Evaluate all rules
    const triggeredRules: TriggeredRule[] = [];
    const recommendedActions: string[] = [];

    for (const rule of (rules || [])) {
      const evaluation = evaluateRule(rule, metrics);
      if (evaluation.triggered) {
        triggeredRules.push({
          rule_id: rule.id,
          rule_name: rule.name,
          reason: evaluation.reason,
          action: {
            action_type: rule.action_target,
            target: rule.action_target,
            value: rule.action_value,
          },
        });

        // Generate action from rule
        const action = generateActionFromRule(rule, metrics);
        if (action) recommendedActions.push(action);
      }
    }

    // Find weakest hub and domain
    const weakestHub = findWeakest(metrics.hub_scores);
    const weakestDomain = findWeakest(metrics.domain_scores);
    
    // Calculate priority
    const priority = calculatePriority(metrics, triggeredRules.length);

    // Generate daily brief
    const dailyBrief = generateDailyBrief({
      ultra_score: metrics.ultra_score,
      state: ultraState,
      weakestHub,
      weakestDomain,
      priority,
      triggeredCount: triggeredRules.length,
    });

    // Log execution
    await supabaseClient.from('automation_executions').insert({
      user_id: user.id,
      trigger_type: 'MANUAL_EVALUATION',
      execution_date: new Date().toISOString(),
      conditions_met: { triggered_rules: triggeredRules.length },
      actions_executed: recommendedActions,
      execution_result: 'success',
    });

    const result = {
      ultra_score: metrics.ultra_score,
      hub_scores: metrics.hub_scores,
      domain_scores: metrics.domain_scores,
      system_state: systemState,
      ultra_state: ultraState,
      weakest_hub: weakestHub,
      weakest_domain: weakestDomain,
      priority_level: priority.level,
      priority_score: priority.score,
      focus_domain: weakestDomain.name,
      triggered_rules: triggeredRules,
      recommended_actions: recommendedActions,
      daily_brief: dailyBrief,
      metrics_snapshot: {
        habit_consistency: metrics.habit_consistency,
        calendar_load: metrics.calendar_load,
        recent_activity: metrics.recent_activity,
      },
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[automation-evaluator] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function gatherMetrics(supabase: any, userId: string, today: string): Promise<MetricData> {
  // Get ULTRA Score
  const { data: ultraData } = await supabase
    .from('ultra_metrics')
    .select('value')
    .eq('user_id', userId)
    .eq('name', 'ULTRA_Score')
    .order('metric_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const ultra_score = ultraData?.value || 0;

  // Get Hub Scores
  const { data: hubMetrics } = await supabase
    .from('metrics')
    .select('name, value, hubs(code, name)')
    .eq('user_id', userId)
    .eq('name', 'DailyScore')
    .eq('metric_date', today);

  const hub_scores: Record<string, number> = {};
  (hubMetrics || []).forEach((m: any) => {
    const hub = Array.isArray(m.hubs) ? m.hubs[0] : m.hubs;
    if (hub) {
      hub_scores[hub.name] = m.value;
    }
  });

  // Get Domain Scores
  const { data: domainData } = await supabase
    .from('ultra_metrics')
    .select('name, value')
    .eq('user_id', userId)
    .eq('metric_date', today)
    .neq('name', 'ULTRA_Score');

  const domain_scores: Record<string, number> = {};
  (domainData || []).forEach((m: any) => {
    domain_scores[m.name] = m.value;
  });

  // Get Habit Consistency
  const { data: habits } = await supabase
    .from('habits')
    .select('streak')
    .eq('user_id', userId);

  const habit_consistency = habits && habits.length > 0
    ? habits.reduce((sum: number, h: any) => sum + (h.streak || 0), 0) / habits.length
    : 0;

  // Get Calendar Load (next 3 days)
  const threeDaysLater = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
  const { count: calendar_load } = await supabase
    .from('calendar_entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', today)
    .lte('date', threeDaysLater);

  // Get Recent Activity (last 7 days logs)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
  const { count: recent_activity } = await supabase
    .from('logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('log_date', sevenDaysAgo);

  return {
    ultra_score,
    hub_scores,
    domain_scores,
    habit_consistency,
    calendar_load: calendar_load || 0,
    recent_activity: recent_activity || 0,
  };
}

function calculateState(score: number): string {
  if (score >= 91) return 'Elite';
  if (score >= 81) return 'Excellent';
  if (score >= 71) return 'Good';
  if (score >= 56) return 'Stable';
  if (score >= 41) return 'Weak';
  if (score >= 21) return 'Danger';
  return 'Critical';
}

function determineSystemState(metrics: MetricData): string {
  const { ultra_score, habit_consistency, recent_activity } = metrics;
  
  if (ultra_score < 25) return 'CRISIS_MODE';
  if (ultra_score < 40) return 'DANGER_MODE';
  if (ultra_score < 55) return 'STRUGGLING_MODE';
  if (ultra_score >= 80 && habit_consistency >= 7) return 'ULTRA_MODE';
  if (ultra_score >= 70) return 'GROWTH_MODE';
  return 'BALANCED_MODE';
}

function evaluateRule(rule: AutomationRule, metrics: MetricData): { triggered: boolean; reason: string } {
  const { condition_type, condition_value } = rule;

  switch (condition_type) {
    case 'ULTRA_SCORE_THRESHOLD':
    case 'ULTRA_BELOW':
      if (condition_value && metrics.ultra_score < condition_value) {
        return { triggered: true, reason: `ULTRA Score ${metrics.ultra_score} < ${condition_value}` };
      }
      break;

    case 'ULTRA_ABOVE':
      if (condition_value && metrics.ultra_score > condition_value) {
        return { triggered: true, reason: `ULTRA Score ${metrics.ultra_score} > ${condition_value}` };
      }
      break;

    case 'HUB_SCORE_THRESHOLD':
    case 'HUB_BELOW':
      const lowestHub = findWeakest(metrics.hub_scores);
      if (condition_value && lowestHub.score < condition_value) {
        return { triggered: true, reason: `${lowestHub.name} score ${lowestHub.score} < ${condition_value}` };
      }
      break;

    case 'IS_WEAKEST':
      const weakest = findWeakest(metrics.hub_scores);
      return { triggered: true, reason: `${weakest.name} is the weakest hub (${weakest.score})` };

    case 'CONSISTENCY_LOW':
      if (condition_value && metrics.habit_consistency < condition_value) {
        return { triggered: true, reason: `Habit consistency ${metrics.habit_consistency} < ${condition_value}` };
      }
      break;

    case 'CALENDAR_OVERLOAD':
      if (condition_value && metrics.calendar_load > condition_value) {
        return { triggered: true, reason: `Calendar has ${metrics.calendar_load} events (> ${condition_value})` };
      }
      break;

    case 'MISSING_LOGS':
      if (condition_value && metrics.recent_activity < condition_value) {
        return { triggered: true, reason: `Only ${metrics.recent_activity} logs in 7 days (< ${condition_value})` };
      }
      break;
  }

  return { triggered: false, reason: '' };
}

function generateActionFromRule(rule: AutomationRule, metrics: MetricData): string | null {
  const weakestHub = findWeakest(metrics.hub_scores);

  switch (rule.action_target) {
    case 'CREATE_TASK':
      return `Create task: ${rule.action_value || `Improve ${weakestHub.name}`}`;
    
    case 'CREATE_CALENDAR_BLOCK':
      return `Schedule: ${rule.action_value || `${weakestHub.name} focus block`}`;
    
    case 'SEND_ALERT':
      return `Alert: ${rule.action_value || rule.description}`;
    
    case 'RECOMMEND_HABIT':
      return `Habit recommendation: ${rule.action_value || `Add ${weakestHub.name} routine`}`;
    
    case 'SET_PRIORITY':
      return `Priority focus: ${rule.action_value || weakestHub.name}`;
    
    case 'TRIGGER_RECOVERY':
      return `Activate recovery mode for ${weakestHub.name}`;
    
    default:
      return rule.action_value;
  }
}

function findWeakest(scores: Record<string, number>): { name: string; score: number } {
  let weakest = { name: 'Unknown', score: 100 };
  
  for (const [name, score] of Object.entries(scores)) {
    if (score < weakest.score) {
      weakest = { name, score };
    }
  }
  
  return weakest;
}

function calculatePriority(metrics: MetricData, triggeredCount: number): { score: number; level: string } {
  const lowestHub = findWeakest(metrics.hub_scores);
  
  const priorityScore = 
    (100 - metrics.ultra_score) +
    (100 - lowestHub.score) +
    (triggeredCount * 5) +
    ((7 - metrics.recent_activity) * 3);

  let level = 'Low Priority';
  if (priorityScore >= 200) level = 'Emergency Mode';
  else if (priorityScore >= 101) level = 'High Priority';
  else if (priorityScore >= 51) level = 'Medium Priority';

  return { score: Math.round(priorityScore), level };
}

function generateDailyBrief(data: {
  ultra_score: number;
  state: string;
  weakestHub: { name: string; score: number };
  weakestDomain: { name: string; score: number };
  priority: { level: string };
  triggeredCount: number;
}): string {
  return `Your ULTRA Score is ${data.ultra_score.toFixed(1)} (${data.state}). 
Weakest Hub: ${data.weakestHub.name} (${data.weakestHub.score.toFixed(1)}). 
Weakest Domain: ${data.weakestDomain.name} (${data.weakestDomain.score.toFixed(1)}).
Priority Level: ${data.priority.level}.
${data.triggeredCount} Automation Rule${data.triggeredCount !== 1 ? 's' : ''} Triggered.
Focus Domain Today: ${data.weakestDomain.name}.`;
}