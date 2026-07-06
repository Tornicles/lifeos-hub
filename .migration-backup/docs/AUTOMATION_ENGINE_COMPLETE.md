# LifeOS v30 Complete Automation Engine Architecture

## Executive Summary

The LifeOS Automation Engine is an enterprise-grade, event-driven system that monitors user metrics, detects patterns, and executes intelligent actions across 9 Life Hubs and 7 Ultra Domains. This document provides complete implementation specifications for converting the Excel-based automation logic into a scalable, production-ready backend system.

**System Scale**: Designed to handle millions of users with real-time processing and background job execution.

---

## 1. PURPOSE & OBJECTIVES

### 1.1 Core Mission
Transform the Excel `AUTOMATION_ENGINE` sheet into a backend system that:
- Reacts to user metrics (daily score, hub scores, ultra score)
- Detects patterns (declines, spikes, consistency, missing logs)
- Determines user's weakest areas
- Generates daily priorities
- Suggests calendar events, goals, and tasks
- Updates Ultra States
- Writes alerts and insights
- Integrates with Projects, Habits, Calendar, Ultra Domains

### 1.2 Design Principles
- **Scalability**: Support millions of users without performance degradation
- **Consistency**: Behave identically to Excel logic but 10× more robust
- **Real-time**: Process events as they occur
- **Extensibility**: Easy to add new rules and conditions
- **Auditability**: Complete logging of all automation decisions
- **Safety**: No contradictory actions, conflict resolution built-in

---

## 2. TRIGGER TYPES

### 2.1 Score-Based Triggers
**When**: Score calculations complete

| Trigger Name | Event | Example Condition | Example Action |
|--------------|-------|-------------------|----------------|
| `ULTRA_SCORE_CALCULATED` | New ULTRA Score computed | Score < 40 | Activate CRITICAL MODE |
| `HUB_SCORE_CALCULATED` | Hub score updated | Finance score declining 3+ days | Create finance recovery task |
| `DAILY_SCORE_UPDATED` | Daily aggregation complete | Daily score dropped 15+ points | Send alert notification |
| `WEEKLY_AVERAGE_GENERATED` | Weekly rollup complete | 7-day average < historical avg | Suggest recovery week |
| `LIFETIME_TREND_UPDATED` | Long-term trend recalculated | 30-day trend negative | Trigger system analysis |

### 2.2 Behavior-Based Triggers
**When**: User performs actions

| Trigger Name | Event | Example Condition | Example Action |
|--------------|-------|-------------------|----------------|
| `LOG_CREATED` | User logs activity | Health log created | Update health hub score |
| `LOG_MISSING` | No logs in timeframe | No finance logs 7+ days | Send reminder |
| `HABIT_CHECKED_IN` | Habit completed | Streak milestone (7, 14, 30 days) | Send congratulations |
| `HABIT_STREAK_BROKEN` | Habit missed 2+ days | Meditation streak broken | Suggest recovery habit |
| `NO_ACTIVITY` | User inactive | No activity 24+ hours | Send engagement notification |
| `PROJECT_TASK_COMPLETED` | Task marked done | Task in priority hub | Update hub score |
| `PROJECT_TASK_OVERDUE` | Task past due date | 3+ tasks overdue | Trigger priority rebalance |

### 2.3 Time-Based Triggers
**When**: Scheduled times reached

| Trigger Name | Schedule | Condition | Action |
|--------------|----------|-----------|--------|
| `DAILY_MORNING_AUTOMATION` | 6:00 AM user timezone | Every day | Generate daily priority |
| `DAILY_EVENING_REFLECTION` | 9:00 PM user timezone | Every day | Prompt reflection log |
| `WEEKLY_REVIEW` | Sunday 8:00 PM | Every week | Generate weekly insights |
| `MONTHLY_EVALUATION` | 1st of month 9:00 AM | Every month | Generate monthly report |
| `QUARTERLY_ANALYSIS` | Quarter end | Every 3 months | Deep system analysis |

### 2.4 Emotional / Ultra Domain Triggers
**When**: Domain-specific conditions met

| Trigger Name | Domain | Condition | Action |
|--------------|--------|-----------|--------|
| `EMOTIONAL_SCORE_LOW` | Emotional Intelligence | Score < 30 | Suggest grounding habits |
| `SOCIAL_STRESS_DETECTED` | Social Life | Negative social logs | Suggest recovery steps |
| `BRANDING_DOMAIN_LOW` | Personal Branding | Score < 40 | Suggest content tasks |
| `FITNESS_PLATEAU` | Fitness Performance | No improvement 14+ days | Suggest new workout |
| `CAREER_STAGNATION` | Career Mastery | No career logs 7+ days | Suggest skill development |
| `DATING_DECLINE` | Dating & Attraction | Score dropped 20+ points | Suggest social activities |
| `SPIRITUAL_NEGLECT` | Spirituality | No spiritual logs 10+ days | Suggest meditation/prayer |

### 2.5 Relationship Triggers
**When**: Relationship data changes

| Trigger Name | Event | Condition | Action |
|--------------|-------|-----------|--------|
| `CONFLICT_LOG_DETECTED` | Conflict log created | Relationship log contains "conflict" | Suggest emotional recovery |
| `RELATIONSHIP_SCORE_DROP` | Score declined | Relationship hub score -15 points | Notify user + suggest action |
| `POSITIVE_INTERACTION` | Positive log created | Quality time log | Reinforce behavior |
| `NEGLECTED_RELATIONSHIP` | No interaction logs | No relationship logs 7+ days | Remind to connect |

---

## 3. RULE TYPES

### 3.1 Simple Conditional Rule
**Structure**: `IF condition THEN action`

```typescript
interface SimpleRule {
  id: string;
  name: string;
  condition: Condition;
  action: Action;
  priority: number;
  is_active: boolean;
}

// Example
{
  name: "Critical Mode Activation",
  condition: { type: "ULTRA_BELOW", value: 40 },
  action: { type: "CHANGE_MODE", value: "CRITICAL" },
  priority: 100
}
```

### 3.2 Compound Rule
**Structure**: `IF condition1 AND condition2 THEN action`

```typescript
interface CompoundRule {
  id: string;
  name: string;
  conditions: Condition[];
  logical_operator: "AND" | "OR";
  action: Action;
  priority: number;
}

// Example
{
  name: "Health Priority Trigger",
  conditions: [
    { type: "HUB_BELOW", hub: "Health", value: 40 },
    { type: "LOG_CONTAINS", field: "notes", value: "stress" }
  ],
  logical_operator: "AND",
  action: { type: "SET_PRIORITY", value: "Health" }
}
```

### 3.3 Trend Rule
**Structure**: Detect patterns over time

```typescript
interface TrendRule {
  id: string;
  name: string;
  metric: string; // "HealthScore", "UltraScore", etc.
  trend_type: "DECLINE" | "RISE" | "PLATEAU";
  duration_days: number;
  threshold_change: number;
  action: Action;
}

// Example
{
  name: "Health Decline Alert",
  metric: "HealthScore",
  trend_type: "DECLINE",
  duration_days: 3,
  threshold_change: -10,
  action: { type: "SEND_ALERT", value: "Health declining 3 days" }
}
```

### 3.4 Missing Activity Rule
**Structure**: Detect absence of logs/actions

```typescript
interface MissingActivityRule {
  id: string;
  name: string;
  activity_type: "LOG" | "HABIT" | "PROJECT";
  hub_filter?: string;
  missing_duration_hours: number;
  action: Action;
}

// Example
{
  name: "Finance Log Reminder",
  activity_type: "LOG",
  hub_filter: "Finance",
  missing_duration_hours: 168, // 7 days
  action: { type: "SEND_REMINDER", value: "Log your finances" }
}
```

### 3.5 Surge Rule
**Structure**: Detect spikes above baseline

```typescript
interface SurgeRule {
  id: string;
  name: string;
  metric: string;
  baseline_days: number;
  surge_threshold_percent: number;
  action: Action;
}

// Example
{
  name: "Spending Spike Alert",
  metric: "FinanceSpending",
  baseline_days: 30,
  surge_threshold_percent: 40,
  action: { type: "SEND_ALERT", value: "Spending 40% above average" }
}
```

### 3.6 Priority Conflict Resolution Rule
**Algorithm**: When multiple rules suggest different priorities

```typescript
interface ConflictResolutionRule {
  priority_hierarchy: string[]; // Ordered list
  recency_weight: number; // 0-1, weight given to recent actions
  user_preference_weight: number; // 0-1, weight given to user's selected focus
}

// Example
{
  priority_hierarchy: [
    "Health",      // Always highest
    "Finance",     // Critical needs
    "Work",        // Career stability
    "Relationships",
    "Personal Development",
    "Fitness",
    "Social",
    "Projects",
    "Mindset"
  ],
  recency_weight: 0.3,
  user_preference_weight: 0.5
}
```

**Conflict Resolution Algorithm**:
```typescript
function resolvePriorityConflict(
  triggeredRules: Rule[],
  userPreference: string | null,
  recentActions: Action[]
): string {
  // 1. Calculate priority scores
  const scores = new Map<string, number>();
  
  for (const rule of triggeredRules) {
    const hierarchyScore = getHierarchyScore(rule.target);
    const recencyScore = getRecencyScore(rule.target, recentActions);
    const preferenceScore = rule.target === userPreference ? 100 : 0;
    
    const totalScore = 
      hierarchyScore * 0.5 +
      recencyScore * conflictResolution.recency_weight * 50 +
      preferenceScore * conflictResolution.user_preference_weight;
    
    scores.set(rule.target, totalScore);
  }
  
  // 2. Return highest scoring target
  return Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])[0][0];
}
```

---

## 4. DATA MODEL (DATABASE TABLES)

### 4.1 automation_rules
**Purpose**: Store all automation rules

```sql
CREATE TABLE automation_rules (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  condition_type TEXT NOT NULL, -- ULTRA_BELOW, HUB_BELOW, etc.
  condition_value NUMERIC,
  action_target TEXT NOT NULL, -- Hub, Domain, Project, Calendar
  action_value TEXT,
  priority INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by_user_id UUID,
  version INTEGER DEFAULT 1
);

CREATE INDEX idx_automation_rules_active ON automation_rules(is_active);
CREATE INDEX idx_automation_rules_condition_type ON automation_rules(condition_type);
```

### 4.2 automation_rule_conditions
**Purpose**: Support multi-condition rules

```sql
CREATE TABLE automation_rule_conditions (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES automation_rules(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  metric_name TEXT, -- "HealthScore", "UltraScore", etc.
  operator TEXT NOT NULL, -- <, >, <=, >=, =, !=
  threshold_value NUMERIC,
  comparison_window INTEGER DEFAULT 1, -- Days to look back
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rule_conditions_rule_id ON automation_rule_conditions(rule_id);
```

### 4.3 automation_rule_actions
**Purpose**: Support multi-action rules

```sql
CREATE TABLE automation_rule_actions (
  id SERIAL PRIMARY KEY,
  rule_id INTEGER REFERENCES automation_rules(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_payload JSONB, -- Flexible action parameters
  priority INTEGER DEFAULT 1, -- Execution order
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rule_actions_rule_id ON automation_rule_actions(rule_id);
```

### 4.4 automation_trigger_events
**Purpose**: Log all trigger events for audit

```sql
CREATE TABLE automation_trigger_events (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  trigger_type TEXT NOT NULL,
  trigger_source TEXT, -- "user_action", "schedule", "calculation"
  trigger_data JSONB,
  triggered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_trigger_events_user_id ON automation_trigger_events(user_id);
CREATE INDEX idx_trigger_events_type ON automation_trigger_events(trigger_type);
CREATE INDEX idx_trigger_events_triggered_at ON automation_trigger_events(triggered_at);
```

### 4.5 automation_action_queue
**Purpose**: Queue actions for execution

```sql
CREATE TABLE automation_action_queue (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  rule_id INTEGER REFERENCES automation_rules(id),
  action_type TEXT NOT NULL,
  action_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, executing, completed, failed
  priority INTEGER DEFAULT 10,
  scheduled_for TIMESTAMP DEFAULT NOW(),
  executed_at TIMESTAMP,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_action_queue_user_id ON automation_action_queue(user_id);
CREATE INDEX idx_action_queue_status ON automation_action_queue(status);
CREATE INDEX idx_action_queue_scheduled_for ON automation_action_queue(scheduled_for);
```

### 4.6 automation_executions
**Purpose**: Complete log of rule executions (already exists, enhanced)

```sql
-- Already exists, no changes needed
CREATE TABLE automation_executions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID,
  rule_id INTEGER REFERENCES automation_rules(id),
  trigger_type TEXT NOT NULL,
  conditions_met JSONB,
  actions_executed JSONB,
  execution_result TEXT, -- success, partial, failed
  execution_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.7 automation_logs
**Purpose**: Detailed execution logs for debugging

```sql
CREATE TABLE automation_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  execution_id INTEGER REFERENCES automation_executions(id),
  log_level TEXT NOT NULL, -- debug, info, warn, error
  message TEXT NOT NULL,
  context JSONB,
  logged_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_automation_logs_user_id ON automation_logs(user_id);
CREATE INDEX idx_automation_logs_execution_id ON automation_logs(execution_id);
CREATE INDEX idx_automation_logs_level ON automation_logs(log_level);
```

### 4.8 user_automation_settings
**Purpose**: User preferences for automation

```sql
CREATE TABLE user_automation_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  enabled_categories JSONB DEFAULT '[]', -- ["health", "finance", etc.]
  disabled_rules JSONB DEFAULT '[]', -- Array of rule IDs
  notification_preferences JSONB DEFAULT '{}',
  priority_override TEXT, -- User's manual priority selection
  auto_calendar_enabled BOOLEAN DEFAULT true,
  auto_task_enabled BOOLEAN DEFAULT true,
  auto_habit_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_automation_settings_user_id ON user_automation_settings(user_id);
```

---

## 5. CONDITIONS ENGINE

### 5.1 Supported Condition Types

```typescript
enum ConditionType {
  // Numeric Comparisons
  ULTRA_BELOW = "ULTRA_BELOW",
  ULTRA_ABOVE = "ULTRA_ABOVE",
  ULTRA_BETWEEN = "ULTRA_BETWEEN",
  HUB_BELOW = "HUB_BELOW",
  HUB_ABOVE = "HUB_ABOVE",
  HUB_BETWEEN = "HUB_BETWEEN",
  
  // Trend Detection
  HUB_TREND_DECLINE = "HUB_TREND_DECLINE",
  HUB_TREND_RISE = "HUB_TREND_RISE",
  ULTRA_TREND_DECLINE = "ULTRA_TREND_DECLINE",
  ULTRA_TREND_RISE = "ULTRA_TREND_RISE",
  
  // Habit Conditions
  HABIT_STREAK_UNDER = "HABIT_STREAK_UNDER",
  HABIT_STREAK_ABOVE = "HABIT_STREAK_ABOVE",
  HABIT_STREAK_MILESTONE = "HABIT_STREAK_MILESTONE",
  HABIT_CONSISTENCY_LOW = "HABIT_CONSISTENCY_LOW",
  
  // Log Conditions
  LOG_CONTAINS = "LOG_CONTAINS",
  LOG_MISSING = "LOG_MISSING",
  NO_LOGS_24H = "NO_LOGS_24H",
  NO_LOGS_WEEK = "NO_LOGS_WEEK",
  
  // Calendar Conditions
  CALENDAR_EMPTY = "CALENDAR_EMPTY",
  CALENDAR_OVERLOAD = "CALENDAR_OVERLOAD",
  
  // Financial Conditions
  SPENDING_SPIKE = "SPENDING_SPIKE",
  INCOME_DROP = "INCOME_DROP",
  
  // Emotional Conditions
  MOOD_DROP = "MOOD_DROP",
  STRESS_HIGH = "STRESS_HIGH",
  
  // State Conditions
  STATE_CHANGED = "STATE_CHANGED",
  IS_WEAKEST_HUB = "IS_WEAKEST_HUB",
  IS_STRONGEST_HUB = "IS_STRONGEST_HUB",
  
  // Project Conditions
  TASKS_OVERDUE = "TASKS_OVERDUE",
  PROJECT_STAGNANT = "PROJECT_STAGNANT"
}
```

### 5.2 Condition Evaluation Engine

```typescript
interface ConditionEvaluator {
  evaluateCondition(
    condition: Condition,
    context: EvaluationContext
  ): Promise<boolean>;
}

interface EvaluationContext {
  userId: string;
  tenantId: string;
  currentMetrics: MetricsSnapshot;
  historicalData: HistoricalData;
  userSettings: UserSettings;
}

class ConditionEngine implements ConditionEvaluator {
  async evaluateCondition(
    condition: Condition,
    context: EvaluationContext
  ): Promise<boolean> {
    switch (condition.type) {
      case ConditionType.ULTRA_BELOW:
        return context.currentMetrics.ultraScore < condition.value;
      
      case ConditionType.HUB_BELOW:
        const hubScore = context.currentMetrics.hubScores[condition.hub];
        return hubScore < condition.value;
      
      case ConditionType.HUB_TREND_DECLINE:
        const trend = this.calculateTrend(
          condition.hub,
          condition.days,
          context.historicalData
        );
        return trend < -condition.threshold;
      
      case ConditionType.HABIT_STREAK_UNDER:
        const streak = await this.getHabitStreak(
          condition.habitId,
          context.userId
        );
        return streak < condition.value;
      
      case ConditionType.NO_LOGS_24H:
        const recentLogs = await this.getRecentLogs(
          context.userId,
          24
        );
        return recentLogs.length === 0;
      
      case ConditionType.IS_WEAKEST_HUB:
        const weakest = this.getWeakestHub(context.currentMetrics);
        return weakest === condition.hub;
      
      // ... more condition handlers
      
      default:
        throw new Error(`Unknown condition type: ${condition.type}`);
    }
  }
  
  private calculateTrend(
    hub: string,
    days: number,
    history: HistoricalData
  ): number {
    const recentScores = history.hubScores[hub].slice(-days);
    if (recentScores.length < 2) return 0;
    
    const firstScore = recentScores[0];
    const lastScore = recentScores[recentScores.length - 1];
    return lastScore - firstScore;
  }
  
  private getWeakestHub(metrics: MetricsSnapshot): string {
    return Object.entries(metrics.hubScores)
      .sort((a, b) => a[1] - b[1])[0][0];
  }
}
```

---

## 6. ACTION TYPES

### 6.1 All Action Types

```typescript
enum ActionType {
  // Notifications
  SEND_NOTIFICATION = "SEND_NOTIFICATION",
  SEND_ALERT = "SEND_ALERT",
  SEND_REMINDER = "SEND_REMINDER",
  
  // Calendar
  CREATE_CALENDAR_BLOCK = "CREATE_CALENDAR_BLOCK",
  SUGGEST_TIME_BLOCK = "SUGGEST_TIME_BLOCK",
  AUTOFILL_CALENDAR = "AUTOFILL_CALENDAR",
  
  // Habits
  RECOMMEND_HABIT = "RECOMMEND_HABIT",
  REINFORCE_HABIT = "REINFORCE_HABIT",
  RESET_HABIT_STREAK = "RESET_HABIT_STREAK",
  SUGGEST_RECOVERY_HABIT = "SUGGEST_RECOVERY_HABIT",
  
  // Goals & Tasks
  CREATE_TASK = "CREATE_TASK",
  GENERATE_GOAL = "GENERATE_GOAL",
  PRIORITIZE_TASKS = "PRIORITIZE_TASKS",
  AUTO_RESCHEDULE_TASKS = "AUTO_RESCHEDULE_TASKS",
  
  // Ultra State
  CHANGE_SYSTEM_MODE = "CHANGE_SYSTEM_MODE",
  SET_PRIORITY_HUB = "SET_PRIORITY_HUB",
  UPDATE_ULTRA_STATE = "UPDATE_ULTRA_STATE",
  
  // Insights
  GENERATE_INSIGHT = "GENERATE_INSIGHT",
  GENERATE_DAILY_BRIEF = "GENERATE_DAILY_BRIEF",
  GENERATE_WEEKLY_REVIEW = "GENERATE_WEEKLY_REVIEW",
  
  // Recovery
  TRIGGER_RECOVERY_MODE = "TRIGGER_RECOVERY_MODE",
  SUGGEST_RECOVERY_ACTIONS = "SUGGEST_RECOVERY_ACTIONS"
}
```

### 6.2 Action Execution Engine

```typescript
interface ActionExecutor {
  executeAction(
    action: Action,
    context: ExecutionContext
  ): Promise<ActionResult>;
}

interface ExecutionContext {
  userId: string;
  tenantId: string;
  triggerData: any;
  ruleId: number;
}

interface ActionResult {
  success: boolean;
  result: any;
  error?: string;
}

class ActionEngine implements ActionExecutor {
  async executeAction(
    action: Action,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      switch (action.type) {
        case ActionType.SEND_NOTIFICATION:
          return await this.sendNotification(action, context);
        
        case ActionType.CREATE_CALENDAR_BLOCK:
          return await this.createCalendarBlock(action, context);
        
        case ActionType.CREATE_TASK:
          return await this.createTask(action, context);
        
        case ActionType.RECOMMEND_HABIT:
          return await this.recommendHabit(action, context);
        
        case ActionType.CHANGE_SYSTEM_MODE:
          return await this.changeSystemMode(action, context);
        
        case ActionType.GENERATE_INSIGHT:
          return await this.generateInsight(action, context);
        
        // ... more action handlers
        
        default:
          throw new Error(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      return {
        success: false,
        result: null,
        error: error.message
      };
    }
  }
  
  private async sendNotification(
    action: Action,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { userId } = context;
    const { message, priority } = action.payload;
    
    await supabase.from('auto_actions').insert({
      user_id: userId,
      action_type: 'notification',
      action_text: message,
      priority: priority || 2,
      status: 'pending'
    });
    
    return { success: true, result: { notificationCreated: true } };
  }
  
  private async createCalendarBlock(
    action: Action,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const { userId, tenantId } = context;
    const { title, duration, hub, date } = action.payload;
    
    await supabase.from('calendar_entries').insert({
      user_id: userId,
      tenant_id: tenantId,
      title,
      date: date || new Date().toISOString().split('T')[0],
      start_time: this.findAvailableSlot(userId, duration),
      hub_id: hub
    });
    
    return { success: true, result: { blockCreated: true } };
  }
}
```

---

## 7. AUTOMATION PIPELINE

### 7.1 Complete Execution Flow

```typescript
/**
 * Main Automation Pipeline
 * Executes in this exact order
 */
class AutomationPipeline {
  async execute(trigger: TriggerEvent): Promise<PipelineResult> {
    const executionId = this.generateExecutionId();
    
    try {
      // Step 1: Log trigger event
      await this.logTriggerEvent(trigger);
      
      // Step 2: Load active rules
      const rules = await this.loadActiveRules(trigger);
      
      // Step 3: Gather evaluation context
      const context = await this.gatherContext(trigger.userId);
      
      // Step 4: Evaluate conditions for each rule
      const matchedRules = await this.evaluateRules(rules, context);
      
      // Step 5: Resolve conflicts if multiple rules match
      const resolvedActions = await this.resolveConflicts(matchedRules);
      
      // Step 6: Queue actions for execution
      await this.queueActions(resolvedActions, context);
      
      // Step 7: Log execution results
      await this.logExecution(executionId, matchedRules, resolvedActions);
      
      // Step 8: Execute queued actions
      const results = await this.executeActions(resolvedActions, context);
      
      // Step 9: Update metrics and state
      await this.updateSystemState(trigger.userId, results);
      
      return {
        executionId,
        triggeredRules: matchedRules.length,
        actionsExecuted: results.length,
        success: true
      };
    } catch (error) {
      await this.logError(executionId, error);
      return {
        executionId,
        triggeredRules: 0,
        actionsExecuted: 0,
        success: false,
        error: error.message
      };
    }
  }
  
  private async loadActiveRules(trigger: TriggerEvent): Promise<Rule[]> {
    // Load rules that match this trigger type
    const { data } = await supabase
      .from('automation_rules')
      .select('*, automation_rule_conditions(*), automation_rule_actions(*)')
      .eq('is_active', true);
    
    return data.filter(rule => 
      this.ruleMatchesTrigger(rule, trigger)
    );
  }
  
  private async gatherContext(userId: string): Promise<EvaluationContext> {
    // Gather all data needed for rule evaluation
    const [
      ultraScore,
      hubScores,
      habits,
      recentLogs,
      calendarEntries,
      projects
    ] = await Promise.all([
      this.getUltraScore(userId),
      this.getHubScores(userId),
      this.getHabits(userId),
      this.getRecentLogs(userId, 7),
      this.getCalendarEntries(userId, 3),
      this.getProjects(userId)
    ]);
    
    return {
      userId,
      currentMetrics: {
        ultraScore,
        hubScores,
        habits,
        recentLogs,
        calendarEntries,
        projects
      },
      historicalData: await this.getHistoricalData(userId),
      userSettings: await this.getUserSettings(userId)
    };
  }
  
  private async evaluateRules(
    rules: Rule[],
    context: EvaluationContext
  ): Promise<MatchedRule[]> {
    const matched: MatchedRule[] = [];
    
    for (const rule of rules) {
      const conditionsMet = await this.evaluateRuleConditions(
        rule.conditions,
        context
      );
      
      if (conditionsMet) {
        matched.push({
          rule,
          reason: this.generateReason(rule, context),
          priority: rule.priority
        });
      }
    }
    
    return matched;
  }
  
  private async resolveConflicts(
    matchedRules: MatchedRule[]
  ): Promise<Action[]> {
    // Group rules by action target
    const grouped = this.groupByTarget(matchedRules);
    
    // For each target with multiple rules, resolve conflict
    const resolved: Action[] = [];
    
    for (const [target, rules] of Object.entries(grouped)) {
      if (rules.length === 1) {
        resolved.push(...rules[0].rule.actions);
      } else {
        // Multiple rules for same target - apply conflict resolution
        const winner = this.selectWinningRule(rules);
        resolved.push(...winner.rule.actions);
      }
    }
    
    return resolved;
  }
  
  private async queueActions(
    actions: Action[],
    context: EvaluationContext
  ): Promise<void> {
    const queueEntries = actions.map(action => ({
      user_id: context.userId,
      tenant_id: context.tenantId,
      action_type: action.type,
      action_data: action.payload,
      priority: action.priority || 10,
      status: 'pending'
    }));
    
    await supabase.from('automation_action_queue').insert(queueEntries);
  }
  
  private async executeActions(
    actions: Action[],
    context: ExecutionContext
  ): Promise<ActionResult[]> {
    const executor = new ActionEngine();
    const results: ActionResult[] = [];
    
    // Execute actions in priority order
    const sorted = actions.sort((a, b) => b.priority - a.priority);
    
    for (const action of sorted) {
      const result = await executor.executeAction(action, context);
      results.push(result);
      
      // Update queue status
      await this.updateQueueStatus(action.id, result);
    }
    
    return results;
  }
}
```

### 7.2 Execution Modes

The pipeline runs in three modes:

#### Real-Time Mode
- Triggered immediately when events occur
- Processes within 100ms
- Used for: log creation, habit check-ins, task completion

#### Background Job Mode
- Runs every 5 minutes
- Processes queued actions
- Used for: scheduled tasks, cleanup, retries

#### Scheduled Mode
- Runs at specific times (6 AM, 9 PM, etc.)
- Generates daily/weekly/monthly insights
- Used for: morning automation, evening reflection, reviews

---

## 8. WORKFLOW EXAMPLES

### 8.1 Daily Morning Automation

**Trigger**: 6:00 AM user timezone
**Steps**:
1. Get yesterday's scores
2. Analyze early trends
3. Identify weakest hub
4. Calculate priority zone
5. Generate daily focus
6. Create recommended schedule blocks
7. Update Ultra State
8. Send morning notification

**Code**:
```typescript
async function dailyMorningAutomation(userId: string) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  // 1. Get yesterday's scores
  const { data: ultraMetric } = await supabase
    .from('ultra_metrics')
    .select('value')
    .eq('user_id', userId)
    .eq('name', 'ULTRA_Score')
    .eq('metric_date', yesterdayStr)
    .single();
  
  const yesterdayScore = ultraMetric?.value || 50;
  
  // 2. Analyze trends (last 7 days)
  const { data: recentScores } = await supabase
    .from('ultra_metrics')
    .select('value, metric_date')
    .eq('user_id', userId)
    .eq('name', 'ULTRA_Score')
    .gte('metric_date', getDateDaysAgo(7))
    .order('metric_date', { ascending: true });
  
  const trend = calculateTrend(recentScores);
  
  // 3. Identify weakest hub
  const hubScores = await getHubScores(userId);
  const weakestHub = Object.entries(hubScores)
    .sort((a, b) => a[1] - b[1])[0];
  
  // 4. Calculate priority zone
  const priorityZone = determinePriorityZone(yesterdayScore, weakestHub);
  
  // 5. Generate daily focus
  const focus = {
    primary: weakestHub[0],
    secondary: getSecondaryFocus(hubScores, weakestHub[0]),
    actions: generateRecommendedActions(weakestHub[0], yesterdayScore)
  };
  
  // 6. Create schedule blocks
  await createScheduleBlocks(userId, focus);
  
  // 7. Update state
  await updateSystemState(userId, yesterdayScore, priorityZone);
  
  // 8. Send notification
  await sendMorningBrief(userId, {
    score: yesterdayScore,
    trend,
    focus,
    priorityZone
  });
}
```

### 8.2 User Logs Activity

**Trigger**: Log created
**Steps**:
1. Recalculate hub score
2. Recalculate Ultra Score if needed
3. Check rule conditions
4. Suggest reinforcement (gamification)
5. Update streaks
6. Generate insights

**Code**:
```typescript
async function onLogCreated(logId: number, userId: string) {
  const { data: log } = await supabase
    .from('logs')
    .select('*, hubs(*)')
    .eq('id', logId)
    .single();
  
  // 1. Recalculate hub score
  await recalculateHubScore(userId, log.hub_id);
  
  // 2. Check if Ultra Score needs update
  const shouldUpdateUltra = await checkUltraUpdateNeeded(userId);
  if (shouldUpdateUltra) {
    await invokeFunction('calculate-ultra-score', { userId });
  }
  
  // 3. Trigger automation evaluation
  await invokeFunction('automation-trigger', {
    trigger_type: 'log_created',
    user_id: userId,
    entity_id: logId
  });
  
  // 4. Gamification - reinforce behavior
  if (log.value > 70) {
    await createAutoAction(userId, {
      action_type: 'POSITIVE_REINFORCEMENT',
      action_text: `Great ${log.hubs.name} log! Keep it up!`,
      priority: 1
    });
  }
  
  // 5. Check for streaks
  const streak = await checkLogStreak(userId, log.hub_id);
  if (streak > 0 && streak % 7 === 0) {
    await createMilestoneReward(userId, log.hubs.name, streak);
  }
}
```

### 8.3 Habit Streak Broken

**Trigger**: No habit check-in for 48+ hours
**Steps**:
1. Detect missed habit
2. Reset streak to 0
3. Create recovery action
4. Update consistency metrics
5. Send recovery nudge

**Code**:
```typescript
async function onHabitStreakBroken(habitId: number, userId: string) {
  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .single();
  
  const previousStreak = habit.streak;
  
  // 1. Reset streak
  await supabase
    .from('habits')
    .update({ streak: 0 })
    .eq('id', habitId);
  
  // 2. Create recovery action
  await supabase.from('auto_actions').insert({
    user_id: userId,
    action_type: 'HABIT_RECOVERY',
    action_text: `Your ${habit.name} streak was broken after ${previousStreak} days. Let's start fresh today!`,
    priority: 2,
    status: 'pending',
    action_date: new Date().toISOString().split('T')[0]
  });
  
  // 3. Update consistency metrics
  await recalculateHabitConsistency(userId);
  
  // 4. Trigger Ultra Score recalculation
  await invokeFunction('calculate-ultra-score', { userId });
  
  // 5. If streak was significant, send empathetic nudge
  if (previousStreak >= 7) {
    await sendRecoveryNudge(userId, habit.name, previousStreak);
  }
}
```

---

## 9. EDGE CASES HANDLING

### 9.1 No Logs Scenario
**Issue**: User has no logs in system
**Solution**:
```typescript
if (logs.length === 0) {
  // Use default baseline scores
  const defaultScores = {
    ultraScore: 50,
    hubScores: Object.fromEntries(
      HUBS.map(h => [h.name, 50])
    )
  };
  
  // Create onboarding actions
  await createOnboardingActions(userId);
  
  return defaultScores;
}
```

### 9.2 Missing Hub Metrics
**Issue**: Hub has no recent logs
**Solution**:
```typescript
function getHubScore(hubId: string, logs: Log[]): number {
  const hubLogs = logs.filter(l => l.hub_id === hubId);
  
  if (hubLogs.length === 0) {
    // No logs - use last known score or default
    const lastKnownScore = getLastKnownScore(hubId);
    return lastKnownScore || 50; // Default to neutral
  }
  
  // Calculate from available logs
  return calculateHubScore(hubLogs);
}
```

### 9.3 Contradicting Rules
**Issue**: Two rules suggest opposite actions
**Solution**:
```typescript
function resolveContradiction(rules: MatchedRule[]): Action {
  // Apply priority hierarchy
  const sorted = rules.sort((a, b) => {
    // Higher priority wins
    if (a.rule.priority !== b.rule.priority) {
      return b.rule.priority - a.rule.priority;
    }
    
    // If same priority, more recent creation wins
    return new Date(b.rule.created_at).getTime() - 
           new Date(a.rule.created_at).getTime();
  });
  
  // Log the conflict
  await logConflict(rules);
  
  // Return highest priority action
  return sorted[0].rule.actions[0];
}
```

### 9.4 Overlapping Automation Events
**Issue**: Multiple triggers fire simultaneously
**Solution**:
```typescript
class AutomationQueue {
  private processing = new Set<string>();
  
  async process(trigger: TriggerEvent): Promise<void> {
    const key = `${trigger.userId}:${trigger.type}`;
    
    // Prevent duplicate processing
    if (this.processing.has(key)) {
      console.log(`Already processing ${key}, skipping`);
      return;
    }
    
    this.processing.add(key);
    
    try {
      await this.pipeline.execute(trigger);
    } finally {
      this.processing.delete(key);
    }
  }
}
```

### 9.5 Weekend vs Weekday Workflows
**Issue**: Different automation needs on weekends
**Solution**:
```typescript
function shouldApplyRule(rule: Rule, date: Date): boolean {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  
  if (rule.conditions.includes('WORK_FOCUSED') && isWeekend) {
    return false; // Skip work rules on weekends
  }
  
  if (rule.conditions.includes('RECOVERY_MODE') && !isWeekend) {
    return false; // Recovery suggestions for weekends
  }
  
  return true;
}
```

### 9.6 User Disabled Automations
**Issue**: User disabled certain automation categories
**Solution**:
```typescript
async function filterByUserSettings(
  rules: Rule[],
  userId: string
): Promise<Rule[]> {
  const { data: settings } = await supabase
    .from('user_automation_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (!settings) return rules;
  
  return rules.filter(rule => {
    // Check if category is enabled
    if (!settings.enabled_categories.includes(rule.category)) {
      return false;
    }
    
    // Check if specific rule is disabled
    if (settings.disabled_rules.includes(rule.id)) {
      return false;
    }
    
    return true;
  });
}
```

### 9.7 First-Time User Defaults
**Issue**: New user with no data
**Solution**:
```typescript
async function initializeNewUser(userId: string) {
  // Create default automation settings
  await supabase.from('user_automation_settings').insert({
    user_id: userId,
    enabled_categories: [
      'health', 'finance', 'work', 'habits', 'calendar'
    ],
    auto_calendar_enabled: true,
    auto_task_enabled: true,
    auto_habit_enabled: true
  });
  
  // Create welcome actions
  await supabase.from('auto_actions').insert([
    {
      user_id: userId,
      action_type: 'ONBOARDING',
      action_text: 'Welcome to LifeOS! Start by logging your first activity.',
      priority: 1,
      status: 'pending',
      action_date: new Date().toISOString().split('T')[0]
    },
    {
      user_id: userId,
      action_type: 'ONBOARDING',
      action_text: 'Set up your first habit to track.',
      priority: 2,
      status: 'pending',
      action_date: new Date().toISOString().split('T')[0]
    }
  ]);
  
  // Initialize with baseline scores
  await initializeBaselineScores(userId);
}
```

---

## 10. SECURITY & DATA PROTECTION

### 10.1 Core Security Principles

1. **No Sensitive Data Exposure**
   - All automation logs sanitized
   - Financial amounts masked
   - Relationship details encrypted

2. **All Actions Logged**
   - Complete audit trail
   - Reversible operations
   - User consent tracking

3. **User Control**
   - Can disable any automation category
   - Can override any suggestion
   - Can delete automation history

4. **Permission Checks**
   - Every rule validates user_id
   - Tenant isolation enforced
   - RLS policies applied

### 10.2 Implementation

```typescript
// Security middleware for automation
class AutomationSecurityMiddleware {
  async validateAccess(
    userId: string,
    tenantId: string,
    operation: string
  ): Promise<boolean> {
    // 1. Verify user exists
    const { data: user } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      throw new Error('Unauthorized: Invalid user');
    }
    
    // 2. Check tenant membership
    const { data: membership } = await supabase
      .from('memberships')
      .select('role')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single();
    
    if (!membership) {
      throw new Error('Unauthorized: Not a tenant member');
    }
    
    // 3. Check operation permission
    const hasPermission = await this.checkPermission(
      membership.role,
      operation
    );
    
    if (!hasPermission) {
      throw new Error(`Unauthorized: Cannot perform ${operation}`);
    }
    
    return true;
  }
  
  sanitizeData(data: any, sensitiveFields: string[]): any {
    const sanitized = { ...data };
    
    for (const field of sensitiveFields) {
      if (field in sanitized) {
        if (typeof sanitized[field] === 'number') {
          sanitized[field] = '***';
        } else {
          sanitized[field] = sanitized[field].slice(0, 3) + '***';
        }
      }
    }
    
    return sanitized;
  }
  
  async logSecurityEvent(
    userId: string,
    eventType: string,
    details: any
  ): Promise<void> {
    await supabase.from('audit_logs').insert({
      user_id: userId,
      table_name: 'automation_security',
      operation: eventType,
      new_values: details,
      ip_address: this.getClientIP()
    });
  }
}
```

---

## 11. API ENDPOINTS

### 11.1 Core Endpoints

#### GET /automation/rules
**Purpose**: List all automation rules
**Auth**: Required
**Response**:
```typescript
{
  "rules": [
    {
      "id": 1,
      "name": "Low Health Alert",
      "description": "Alert when health score drops below 40",
      "condition_type": "HUB_BELOW",
      "condition_value": 40,
      "action_target": "SEND_ALERT",
      "action_value": "Focus on health recovery",
      "is_active": true,
      "priority": 100,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### GET /automation/rule/{id}
**Purpose**: Get single rule details
**Auth**: Required
**Response**:
```typescript
{
  "id": 1,
  "name": "Low Health Alert",
  "conditions": [
    {
      "type": "HUB_BELOW",
      "hub": "Health",
      "value": 40
    }
  ],
  "actions": [
    {
      "type": "SEND_ALERT",
      "payload": {
        "message": "Focus on health recovery",
        "priority": "high"
      }
    }
  ],
  "execution_history": [
    {
      "executed_at": "2024-01-20T08:00:00Z",
      "result": "success",
      "triggered_by": "morning_automation"
    }
  ]
}
```

#### POST /automation/rules
**Purpose**: Create new rule
**Auth**: Admin required
**Request**:
```typescript
{
  "name": "Finance Spike Alert",
  "description": "Alert when spending spikes 40% above average",
  "conditions": [
    {
      "type": "SPENDING_SPIKE",
      "threshold_percent": 40,
      "baseline_days": 30
    }
  ],
  "actions": [
    {
      "type": "SEND_ALERT",
      "payload": {
        "message": "Spending is 40% above your 30-day average",
        "priority": "high"
      }
    },
    {
      "type": "CREATE_TASK",
      "payload": {
        "title": "Review budget and recent expenses",
        "hub": "Finance",
        "priority": "high"
      }
    }
  ],
  "priority": 90,
  "is_active": true
}
```

#### PATCH /automation/rule/{id}
**Purpose**: Update existing rule
**Auth**: Admin required
**Request**:
```typescript
{
  "is_active": false,
  "priority": 50
}
```

#### DELETE /automation/rule/{id}
**Purpose**: Delete rule
**Auth**: Admin required

#### GET /automation/evaluate
**Purpose**: Run automation evaluation for user
**Auth**: Required
**Query Params**: `user_id` (optional, defaults to current user)
**Response**:
```typescript
{
  "ultra_score": 67,
  "state": "STABLE",
  "base_state": "STABLE",
  "state_level": "GREEN",
  "state_reasons": [
    "Ultra Score in healthy range",
    "All hubs above minimum thresholds"
  ],
  "priority_zone": "Balance",
  "priority_hub": {
    "code": "FINANCE",
    "name": "Finance"
  },
  "priority_score": 58,
  "weakest_hub": {
    "code": "FINANCE",
    "name": "Finance"
  },
  "weakest_score": 58,
  "triggered_actions": [
    {
      "rule": "Focus on Weakest Hub",
      "target": "Finance",
      "value": "Review budget",
      "reason": "Finance is your current priority area"
    }
  ],
  "focus_recommendations": {
    "primary_domain": "Career Master",
    "secondary_domain": "Finance",
    "suggested_actions": [
      "Review your budget and spending patterns",
      "Log at least 3 finance activities this week",
      "Create a savings goal for next month"
    ],
    "risk_factors": [
      "Finance hub below average for 3+ days"
    ],
    "opportunities": [
      "Health hub trending positive"
    ]
  },
  "date": "2024-01-20"
}
```

#### POST /automation/trigger
**Purpose**: Manually trigger automation evaluation
**Auth**: Required
**Request**:
```typescript
{
  "trigger_type": "manual",
  "user_id": "user-uuid",
  "force": true
}
```

#### GET /automation/logs
**Purpose**: Get automation execution logs
**Auth**: Required
**Query Params**: 
- `limit` (default: 50, max: 500)
- `offset` (default: 0)
- `level` (debug, info, warn, error)
**Response**:
```typescript
{
  "logs": [
    {
      "id": 12345,
      "execution_id": 456,
      "log_level": "info",
      "message": "Rule 'Low Health Alert' triggered",
      "context": {
        "health_score": 38,
        "threshold": 40
      },
      "logged_at": "2024-01-20T08:05:23Z"
    }
  ],
  "total": 150,
  "has_more": true
}
```

#### GET /automation/queue
**Purpose**: Get pending automation actions
**Auth**: Required
**Response**:
```typescript
{
  "queue": [
    {
      "id": 789,
      "action_type": "CREATE_TASK",
      "action_data": {
        "title": "Review budget",
        "hub": "Finance",
        "priority": "high"
      },
      "status": "pending",
      "priority": 90,
      "scheduled_for": "2024-01-20T09:00:00Z"
    }
  ],
  "total": 5
}
```

---

## 12. FRONTEND REQUIREMENTS

### 12.1 Component List

1. **AutomationRuleBuilder**
   - Visual IF/THEN rule creator
   - Condition dropdown selectors
   - Action configuration
   - Test rule preview

2. **RuleCard**
   - Displays rule summary
   - Enable/disable toggle
   - Edit/delete actions
   - Execution count badge

3. **AutomationDashboard**
   - System status overview
   - Recent triggers
   - Pending actions
   - Performance metrics

4. **ExecutionTimeline**
   - Chronological execution log
   - Success/failure indicators
   - Expandable details

5. **ActionQueueViewer**
   - List of pending actions
   - Priority sorting
   - Manual execution option
   - Cancel action button

6. **ConflictResolutionDialog**
   - Shows conflicting rules
   - Priority comparison
   - Manual override option

7. **AutomationSettings**
   - Enable/disable categories
   - Notification preferences
   - Schedule configuration

### 12.2 State Management

```typescript
// Automation state in React
interface AutomationState {
  rules: Rule[];
  executions: Execution[];
  queuedActions: QueuedAction[];
  systemStatus: {
    lastEvaluation: string;
    triggeredRules: number;
    pendingActions: number;
  };
  settings: UserAutomationSettings;
}

// Using React Query
function useAutomationRules() {
  return useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Rule[];
    }
  });
}
```

---

## 13. CRON SCHEDULE SUGGESTIONS

```typescript
// Edge function: automation-scheduler
// Deployed as cron job

const SCHEDULES = {
  // Every 5 minutes - Process queue
  'process-queue': '*/5 * * * *',
  
  // 6:00 AM daily - Morning automation
  'morning-automation': '0 6 * * *',
  
  // 9:00 PM daily - Evening reflection
  'evening-reflection': '0 21 * * *',
  
  // 12:00 PM daily - Midday check
  'midday-check': '0 12 * * *',
  
  // Sunday 8:00 PM - Weekly review
  'weekly-review': '0 20 * * 0',
  
  // 1st of month 9:00 AM - Monthly evaluation
  'monthly-evaluation': '0 9 1 * *',
  
  // Every hour - System health check
  'health-check': '0 * * * *',
  
  // Every 15 minutes - Metric recalculation
  'metric-recalc': '*/15 * * * *'
};

// Implementation using Supabase pg_cron
select cron.schedule(
  'automation-morning',
  '0 6 * * *',
  $$
  select net.http_post(
    url := 'https://PROJECT_ID.supabase.co/functions/v1/automation-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ANON_KEY"}'::jsonb,
    body := '{"job": "morning-automation"}'::jsonb
  ) as request_id;
  $$
);
```

---

## 14. EXAMPLE PAYLOADS

### 14.1 Rule Evaluation Request
```json
{
  "user_id": "uuid-1234",
  "tenant_id": "uuid-5678",
  "trigger_type": "LOG_CREATED",
  "trigger_data": {
    "log_id": 999,
    "hub": "Health",
    "value": 35
  }
}
```

### 14.2 Rule Evaluation Response
```json
{
  "execution_id": "exec-123456",
  "user_id": "uuid-1234",
  "triggered_rules": 2,
  "matched_rules": [
    {
      "rule_id": 5,
      "rule_name": "Low Health Alert",
      "conditions_met": [
        {
          "type": "HUB_BELOW",
          "hub": "Health",
          "threshold": 40,
          "actual": 35
        }
      ],
      "actions_generated": [
        {
          "type": "SEND_ALERT",
          "message": "Health score below 40 - focus on recovery"
        },
        {
          "type": "CREATE_TASK",
          "task": {
            "title": "Log 3 health activities today",
            "priority": "high",
            "hub": "Health"
          }
        }
      ]
    }
  ],
  "actions_queued": 2,
  "system_state_updated": true,
  "timestamp": "2024-01-20T10:30:00Z"
}
```

### 14.3 Create Rule Request
```json
{
  "name": "Habit Milestone Celebration",
  "description": "Send congratulations when habit streak hits milestone",
  "conditions": [
    {
      "type": "HABIT_STREAK_MILESTONE",
      "milestones": [7, 14, 30, 60, 90, 180, 365]
    }
  ],
  "actions": [
    {
      "type": "SEND_NOTIFICATION",
      "payload": {
        "message": "🎉 Congratulations! You've hit a {{streak}}-day streak on {{habit_name}}!",
        "priority": "normal"
      }
    },
    {
      "type": "GENERATE_INSIGHT",
      "payload": {
        "type": "milestone_achievement",
        "include_stats": true
      }
    }
  ],
  "priority": 50,
  "is_active": true
}
```

---

## 15. PERFORMANCE & SCALABILITY

### 15.1 Performance Targets

- **Rule Evaluation**: < 50ms per user
- **Action Execution**: < 200ms per action
- **Queue Processing**: < 5 seconds for 100 actions
- **Morning Automation**: < 10 seconds per user
- **Database Queries**: < 10ms average

### 15.2 Scalability Architecture

```typescript
// Horizontal scaling via queue partitioning
class PartitionedAutomationQueue {
  private partitions = 10;
  
  getPartition(userId: string): number {
    // Hash user ID to partition
    const hash = this.hashCode(userId);
    return Math.abs(hash) % this.partitions;
  }
  
  async processPartition(partition: number): Promise<void> {
    // Each worker processes specific partition
    const { data: queueItems } = await supabase
      .from('automation_action_queue')
      .select('*')
      .eq('partition', partition)
      .eq('status', 'pending')
      .limit(100);
    
    await this.processItems(queueItems);
  }
}

// Caching layer
class AutomationCache {
  private redis: RedisClient;
  
  async getCachedEvaluation(userId: string): Promise<any> {
    const key = `automation:eval:${userId}`;
    const cached = await this.redis.get(key);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  }
  
  async cacheEvaluation(
    userId: string,
    result: any,
    ttl: number = 300 // 5 minutes
  ): Promise<void> {
    const key = `automation:eval:${userId}`;
    await this.redis.setex(key, ttl, JSON.stringify(result));
  }
}
```

---

## 16. MONITORING & ALERTS

### 16.1 Key Metrics to Track

1. **Rule Execution Rate**: Rules triggered per minute
2. **Action Success Rate**: % of actions that execute successfully
3. **Queue Depth**: Number of pending actions
4. **Average Latency**: Time from trigger to action execution
5. **Error Rate**: Failed executions per hour
6. **User Engagement**: % of users with active automations

### 16.2 Alert Conditions

```typescript
interface AlertCondition {
  metric: string;
  threshold: number;
  duration_minutes: number;
  severity: 'warning' | 'error' | 'critical';
}

const ALERTS: AlertCondition[] = [
  {
    metric: 'queue_depth',
    threshold: 10000,
    duration_minutes: 15,
    severity: 'warning'
  },
  {
    metric: 'error_rate',
    threshold: 100,
    duration_minutes: 5,
    severity: 'critical'
  },
  {
    metric: 'average_latency_ms',
    threshold: 5000,
    duration_minutes: 10,
    severity: 'error'
  }
];
```

---

## 17. TESTING STRATEGY

### 17.1 Unit Tests

```typescript
describe('ConditionEngine', () => {
  it('should correctly evaluate ULTRA_BELOW condition', async () => {
    const condition = {
      type: 'ULTRA_BELOW',
      value: 50
    };
    
    const context = {
      currentMetrics: { ultraScore: 45 }
    };
    
    const result = await conditionEngine.evaluateCondition(
      condition,
      context
    );
    
    expect(result).toBe(true);
  });
  
  it('should detect 3-day declining trend', async () => {
    const condition = {
      type: 'HUB_TREND_DECLINE',
      hub: 'Health',
      days: 3,
      threshold: -10
    };
    
    const context = {
      historicalData: {
        hubScores: {
          Health: [70, 65, 60, 55] // Declining
        }
      }
    };
    
    const result = await conditionEngine.evaluateCondition(
      condition,
      context
    );
    
    expect(result).toBe(true);
  });
});
```

### 17.2 Integration Tests

```typescript
describe('Automation Pipeline', () => {
  it('should execute complete pipeline for log creation', async () => {
    const trigger = {
      type: 'LOG_CREATED',
      userId: 'test-user',
      data: { hub: 'Finance', value: 30 }
    };
    
    const result = await automationPipeline.execute(trigger);
    
    expect(result.success).toBe(true);
    expect(result.triggeredRules).toBeGreaterThan(0);
    expect(result.actionsExecuted).toBeGreaterThan(0);
    
    // Verify actions were queued
    const { data: queuedActions } = await supabase
      .from('automation_action_queue')
      .select('*')
      .eq('user_id', 'test-user')
      .eq('status', 'pending');
    
    expect(queuedActions.length).toBeGreaterThan(0);
  });
});
```

---

## 18. DEPLOYMENT CHECKLIST

- [ ] All database tables created
- [ ] All indexes added for performance
- [ ] RLS policies configured
- [ ] Edge functions deployed
- [ ] Cron jobs scheduled
- [ ] Monitoring alerts configured
- [ ] Error tracking integrated
- [ ] Rate limiting enabled
- [ ] Cache layer configured
- [ ] Load tests passed (1000 concurrent users)
- [ ] Backup strategy implemented
- [ ] Documentation completed
- [ ] Admin panel deployed
- [ ] User settings page deployed
- [ ] Mobile responsive verified

---

## CONCLUSION

This automation engine provides enterprise-grade rule-based automation for LifeOS, ensuring scalability to millions of users while maintaining the sophisticated logic of the Excel system. The architecture supports real-time processing, background jobs, scheduled tasks, and provides complete auditability and user control.

**Next Steps**:
1. Implement database schema
2. Deploy edge functions
3. Build frontend components
4. Configure cron schedules
5. Test with production data
6. Monitor and optimize

---

**Document Version**: 1.0.0
**Last Updated**: 2024-01-20
**Author**: LifeOS Engineering Team
