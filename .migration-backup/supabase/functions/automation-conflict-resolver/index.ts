import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConflictRule {
  id: number;
  name: string;
  priority: number;
  conflict_group: string;
  action_target: string;
  action_value: string;
}

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
      throw new Error('Missing authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { triggered_rules } = await req.json();

    console.log('Resolving conflicts for', triggered_rules.length, 'rules');

    // Group rules by conflict_group
    const groupedRules: Record<string, ConflictRule[]> = {};
    for (const rule of triggered_rules) {
      if (rule.conflict_group) {
        if (!groupedRules[rule.conflict_group]) {
          groupedRules[rule.conflict_group] = [];
        }
        groupedRules[rule.conflict_group].push(rule);
      }
    }

    const conflicts = [];
    const resolved = [];

    // Detect conflicts and resolve
    for (const [group, rules] of Object.entries(groupedRules)) {
      if (rules.length > 1) {
        // Conflict detected
        conflicts.push({
          group,
          rules: rules.map(r => ({
            id: r.id,
            name: r.name,
            priority: r.priority,
            action: `${r.action_target}: ${r.action_value}`,
          })),
        });

        // Resolve by priority (higher priority wins)
        const sorted = [...rules].sort((a, b) => b.priority - a.priority);
        const winner = sorted[0];
        const losers = sorted.slice(1);

        resolved.push({
          group,
          winner: {
            id: winner.id,
            name: winner.name,
            priority: winner.priority,
          },
          suppressed: losers.map(r => ({
            id: r.id,
            name: r.name,
            priority: r.priority,
          })),
        });

        // Log conflict
        await supabase.from('automation_logs').insert({
          user_id: user.id,
          rule_id: winner.id,
          event_type: 'CONFLICT_DETECTED',
          severity: 'WARNING',
          message: `Conflict in group "${group}": ${rules.length} rules triggered. Rule "${winner.name}" (priority ${winner.priority}) wins.`,
          context_data: {
            conflict_group: group,
            winner: winner.id,
            suppressed: losers.map(r => r.id),
          },
        });
      }
    }

    // Return resolved rules (remove suppressed ones)
    const suppressedIds = new Set(
      resolved.flatMap(r => r.suppressed.map(s => s.id))
    );

    const finalRules = triggered_rules.filter(
      (rule: ConflictRule) => !suppressedIds.has(rule.id)
    );

    return new Response(
      JSON.stringify({
        conflicts_detected: conflicts.length,
        conflicts,
        resolved,
        final_rules: finalRules,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in conflict-resolver:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
