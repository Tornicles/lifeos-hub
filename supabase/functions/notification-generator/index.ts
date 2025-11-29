import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRule {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: Record<string, any>;
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
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log('Generating notifications for user:', user.id);

    // Get user preferences
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no preferences exist, create default ones
    if (!prefs) {
      await supabase.from('notification_preferences').insert({
        user_id: user.id,
      });
    }

    const preferences = prefs || {
      performance_alerts_enabled: true,
      habit_reminders_enabled: true,
      project_alerts_enabled: true,
      intensity_level: 'medium',
      max_notifications_per_hour: 3,
    };

    // Check rate limiting
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if (recentCount && recentCount >= (preferences.max_notifications_per_hour || 3)) {
      console.log('Rate limit reached for user:', user.id);
      return new Response(
        JSON.stringify({ message: 'Rate limit reached', notifications: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notifications: NotificationRule[] = [];

    // 1. Performance Drop Alerts
    if (preferences.performance_alerts_enabled) {
      const { data: ultraMetrics } = await supabase
        .from('ultra_metrics')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'ULTRA_Score')
        .order('metric_date', { ascending: false })
        .limit(2);

      if (ultraMetrics && ultraMetrics.length > 0) {
        const latestScore = ultraMetrics[0].value;
        
        if (latestScore < 40) {
          notifications.push({
            type: 'performance_drop',
            severity: 'critical',
            title: 'Critical: Ultra Score Below 40',
            message: `Your Ultra Score has dropped to ${latestScore}. This indicates a critical state. Consider activating Recovery Mode.`,
            relatedEntityType: 'ultra_score',
            relatedEntityId: ultraMetrics[0].id.toString(),
            metadata: { score: latestScore },
          });
        } else if (latestScore < 55) {
          notifications.push({
            type: 'performance_drop',
            severity: 'high',
            title: 'Warning: Ultra Score Below 55',
            message: `Your Ultra Score is ${latestScore}. Focus on your weakest domains to improve.`,
            relatedEntityType: 'ultra_score',
            relatedEntityId: ultraMetrics[0].id.toString(),
            metadata: { score: latestScore },
          });
        }

        // Check for score drops
        if (ultraMetrics.length > 1) {
          const previousScore = ultraMetrics[1].value;
          const drop = previousScore - latestScore;
          if (drop >= 10) {
            notifications.push({
              type: 'performance_drop',
              severity: 'high',
              title: 'Significant Score Drop Detected',
              message: `Your Ultra Score dropped by ${drop.toFixed(1)} points. Review recent activities to identify the cause.`,
              relatedEntityType: 'ultra_score',
              relatedEntityId: ultraMetrics[0].id.toString(),
              metadata: { current: latestScore, previous: previousScore, drop },
            });
          }
        }
      }

      // Check Hub scores
      const { data: metrics } = await supabase
        .from('metrics')
        .select('*, hubs(name)')
        .eq('user_id', user.id)
        .order('metric_date', { ascending: false })
        .limit(20);

      if (metrics) {
        const hubScores = metrics.reduce((acc: any, m: any) => {
          const hubName = m.hubs?.name || 'Unknown';
          if (!acc[hubName] || new Date(m.metric_date) > new Date(acc[hubName].metric_date)) {
            acc[hubName] = m;
          }
          return acc;
        }, {});

        Object.values(hubScores).forEach((metric: any) => {
          if (metric.value < 30) {
            notifications.push({
              type: 'performance_drop',
              severity: 'high',
              title: `${metric.hubs.name} Hub Critical`,
              message: `${metric.hubs.name} score is ${metric.value}, below critical threshold. Immediate attention needed.`,
              relatedEntityType: 'hub',
              relatedEntityId: metric.hub_id.toString(),
              metadata: { hub: metric.hubs.name, score: metric.value },
            });
          }
        });
      }

      // Check habit streaks
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (habits) {
        habits.forEach((habit) => {
          if (habit.streak && habit.streak < 3 && habit.last_checkin) {
            const daysSinceCheckin = Math.floor(
              (Date.now() - new Date(habit.last_checkin).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceCheckin >= 1) {
              notifications.push({
                type: 'performance_drop',
                severity: 'medium',
                title: 'Habit Streak Broken',
                message: `Your "${habit.name}" streak dropped to ${habit.streak}. Check in today to rebuild momentum.`,
                relatedEntityType: 'habit',
                relatedEntityId: habit.id.toString(),
                metadata: { habit: habit.name, streak: habit.streak },
              });
            }
          }
        });
      }
    }

    // 2. Positive Growth Alerts
    const { data: ultraMetricsGrowth } = await supabase
      .from('ultra_metrics')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', 'ULTRA_Score')
      .order('metric_date', { ascending: false })
      .limit(2);

    if (ultraMetricsGrowth && ultraMetricsGrowth.length > 1) {
      const latestScore = ultraMetricsGrowth[0].value;
      const previousScore = ultraMetricsGrowth[1].value;
      const improvement = latestScore - previousScore;
      
      if (improvement >= 10) {
        notifications.push({
          type: 'positive_growth',
          severity: 'low',
          title: 'Great Progress!',
          message: `Your Ultra Score improved by ${improvement.toFixed(1)} points! Keep up the momentum.`,
          relatedEntityType: 'ultra_score',
          relatedEntityId: ultraMetricsGrowth[0].id.toString(),
          metadata: { improvement },
        });
      }
    }

    // 3. Project & Task Alerts
    if (preferences.project_alerts_enabled) {
      const today = new Date().toISOString().split('T')[0];
      const { data: projects } = await supabase
        .from('projects')
        .select('*, tasks(*)')
        .eq('user_id', user.id);

      if (projects) {
        projects.forEach((project) => {
          // Overdue tasks
          const overdueTasks = project.tasks?.filter(
            (t: any) => t.due_date && t.due_date < today && t.status !== 'Done'
          );
          if (overdueTasks && overdueTasks.length > 0) {
            notifications.push({
              type: 'project_task',
              severity: 'high',
              title: 'Overdue Tasks',
              message: `Project "${project.title}" has ${overdueTasks.length} overdue task(s). Review and update priorities.`,
              relatedEntityType: 'project',
              relatedEntityId: project.id.toString(),
              metadata: { project: project.title, overdueCount: overdueTasks.length },
            });
          }

          // Upcoming deadlines (within 3 days)
          const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];
          const upcomingTasks = project.tasks?.filter(
            (t: any) =>
              t.due_date &&
              t.due_date >= today &&
              t.due_date <= threeDaysFromNow &&
              t.status !== 'Done'
          );
          if (upcomingTasks && upcomingTasks.length > 0) {
            notifications.push({
              type: 'project_task',
              severity: 'medium',
              title: 'Upcoming Deadlines',
              message: `Project "${project.title}" has ${upcomingTasks.length} task(s) due within 3 days.`,
              relatedEntityType: 'project',
              relatedEntityId: project.id.toString(),
              metadata: { project: project.title, upcomingCount: upcomingTasks.length },
            });
          }
        });
      }
    }

    // 4. Habit Reminders (time-based - would typically run on schedule)
    if (preferences.habit_reminders_enabled) {
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id);

      if (habits) {
        const today = new Date().toISOString().split('T')[0];
        for (const habit of habits) {
          // Check if habit was checked in today
          const { data: checkins } = await supabase
            .from('habit_checkins')
            .select('*')
            .eq('habit_id', habit.id)
            .eq('date', today);

          if (!checkins || checkins.length === 0) {
            notifications.push({
              type: 'habit_reminder',
              severity: 'low',
              title: 'Habit Reminder',
              message: `Don't forget to check in "${habit.name}" today!`,
              relatedEntityType: 'habit',
              relatedEntityId: habit.id.toString(),
              metadata: { habit: habit.name },
            });
          }
        }
      }
    }

    // Insert notifications into database
    const notificationsToInsert = notifications.map((n) => ({
      user_id: user.id,
      type: n.type,
      severity: n.severity,
      title: n.title,
      message: n.message,
      related_entity_type: n.relatedEntityType,
      related_entity_id: n.relatedEntityId,
      metadata: n.metadata || {},
    }));

    if (notificationsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert)
        .select();

      if (insertError) {
        console.error('Error inserting notifications:', insertError);
        throw insertError;
      }

      console.log(`Created ${inserted.length} notifications`);

      return new Response(
        JSON.stringify({ success: true, notifications: inserted }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, notifications: [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating notifications:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
