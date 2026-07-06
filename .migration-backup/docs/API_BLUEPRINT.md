# LifeOS v30 - Complete API Blueprint

## API Architecture

### Base URL
```
Production: https://ggaonvyheaxrbobmxism.supabase.co
Edge Functions: https://ggaonvyheaxrbobmxism.supabase.co/functions/v1
```

### Authentication
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer <supabase_jwt_token>
```

### Response Format
```typescript
{
  data: T | T[] | null,
  error: { message: string, code: string } | null,
  count?: number // for paginated endpoints
}
```

## Core Data Endpoints

### Authentication

#### POST /auth/signup
```typescript
Body: {
  email: string
  password: string
  full_name: string
}
Response: {
  user: User
  session: Session
}
```

#### POST /auth/login
```typescript
Body: {
  email: string
  password: string
}
Response: {
  user: User
  session: Session
}
```

#### POST /auth/logout
```typescript
Response: { success: boolean }
```

### Users & Profiles

#### GET /profiles
```typescript
Query: {
  user_id?: uuid
}
Response: Profile
```

#### PATCH /profiles
```typescript
Body: {
  full_name?: string
  role?: string
}
Response: Profile
```

### Ultra Metrics

#### GET /ultra_metrics
```typescript
Query: {
  metric_date?: date
  name?: string // 'ULTRA_Score' | domain name
  start_date?: date
  end_date?: date
  order_by?: 'metric_date.asc' | 'metric_date.desc'
  limit?: number
}
Response: UltraMetric[]
```

#### POST /ultra_metrics
```typescript
Body: {
  metric_date: date
  name: string
  value: number (0-100)
  domain_id?: number
}
Response: UltraMetric
```

#### PATCH /ultra_metrics/:id
```typescript
Body: {
  value?: number
  metric_date?: date
}
Response: UltraMetric
```

#### DELETE /ultra_metrics/:id
```typescript
Response: { success: boolean }
```

### Hub Metrics

#### GET /metrics
```typescript
Query: {
  hub_id?: number
  metric_date?: date
  name?: string
  start_date?: date
  end_date?: date
}
Response: Metric[]
```

#### POST /metrics
```typescript
Body: {
  hub_id?: number
  metric_date: date
  name: string
  value: number
}
Response: Metric
```

### Logs

#### GET /logs
```typescript
Query: {
  hub_id?: number
  log_date?: date
  source?: string
  start_date?: date
  end_date?: date
  limit?: number
  offset?: number
}
Response: {
  data: Log[]
  count: number
}
```

#### POST /logs
```typescript
Body: {
  hub_id?: number
  log_date: date
  source: string
  metric?: string
  value?: number
  notes?: string
}
Response: Log
```

#### PATCH /logs/:id
```typescript
Body: {
  notes?: string
  value?: number
  metric?: string
}
Response: Log
```

#### DELETE /logs/:id
```typescript
Response: { success: boolean }
```

### Habits

#### GET /habits
```typescript
Query: {
  include_checkins?: boolean
}
Response: Habit[]
```

#### POST /habits
```typescript
Body: {
  name: string
  description?: string
}
Response: Habit
```

#### PATCH /habits/:id
```typescript
Body: {
  name?: string
  description?: string
  streak?: number
}
Response: Habit
```

#### DELETE /habits/:id
```typescript
Response: { success: boolean }
```

### Habit Checkins

#### GET /habit_checkins
```typescript
Query: {
  habit_id?: number
  date?: date
  start_date?: date
  end_date?: date
}
Response: HabitCheckin[]
```

#### POST /habit_checkins
```typescript
Body: {
  habit_id: number
  date: date
  done: boolean
}
Response: HabitCheckin
```

### Projects

#### GET /projects
```typescript
Query: {
  hub_id?: number
  status?: string
  priority?: string
  include_tasks?: boolean
}
Response: Project[]
```

#### POST /projects
```typescript
Body: {
  title: string
  hub_id?: number
  status?: string
  priority?: string
  due_date?: date
  sprint?: string
  notes?: string
}
Response: Project
```

#### PATCH /projects/:id
```typescript
Body: {
  title?: string
  status?: string
  priority?: string
  due_date?: date
  notes?: string
}
Response: Project
```

#### DELETE /projects/:id
```typescript
Response: { success: boolean }
```

### Tasks

#### GET /tasks
```typescript
Query: {
  project_id?: number
  status?: string
  priority?: string
  due_date?: date
}
Response: Task[]
```

#### POST /tasks
```typescript
Body: {
  project_id: number
  title: string
  description?: string
  status?: string
  priority?: string
  importance?: number
  due_date?: date
}
Response: Task
```

#### PATCH /tasks/:id
```typescript
Body: {
  title?: string
  description?: string
  status?: string
  priority?: string
  importance?: number
  due_date?: date
}
Response: Task
```

#### DELETE /tasks/:id
```typescript
Response: { success: boolean }
```

### Calendar Entries

#### GET /calendar_entries
```typescript
Query: {
  date?: date
  start_date?: date
  end_date?: date
  hub_id?: number
  focus_domain?: string
}
Response: CalendarEntry[]
```

#### POST /calendar_entries
```typescript
Body: {
  date: date
  title: string
  description?: string
  start_time?: string
  end_time?: string
  hub_id?: number
  focus_domain?: string
}
Response: CalendarEntry
```

#### PATCH /calendar_entries/:id
```typescript
Body: {
  title?: string
  description?: string
  start_time?: string
  end_time?: string
  date?: date
}
Response: CalendarEntry
```

#### DELETE /calendar_entries/:id
```typescript
Response: { success: boolean }
```

### Reference Data

#### GET /hubs
```typescript
Query: {
  is_active?: boolean
}
Response: Hub[]
```

#### GET /ultra_domains
```typescript
Response: UltraDomain[]
```

### Automation Rules

#### GET /automation_rules
```typescript
Query: {
  is_active?: boolean
}
Response: AutomationRule[]
```

#### POST /automation_rules
```typescript
Body: {
  name: string
  description?: string
  condition_type: string
  condition_value?: number
  action_target: string
  action_value?: string
  is_active?: boolean
}
Response: AutomationRule
```

#### PATCH /automation_rules/:id
```typescript
Body: {
  name?: string
  description?: string
  is_active?: boolean
  condition_value?: number
  action_value?: string
}
Response: AutomationRule
```

#### DELETE /automation_rules/:id
```typescript
Response: { success: boolean }
```

### Auto Actions

#### GET /auto_actions
```typescript
Query: {
  action_date?: date
  status?: string
  action_type?: string
}
Response: AutoAction[]
```

#### PATCH /auto_actions/:id
```typescript
Body: {
  status?: string
  completed_at?: timestamptz
}
Response: AutoAction
```

### State Warnings

#### GET /state_warnings
```typescript
Query: {
  dismissed?: boolean
  severity?: string
}
Response: StateWarning[]
```

#### PATCH /state_warnings/:id
```typescript
Body: {
  dismissed?: boolean
  dismissed_at?: timestamptz
}
Response: StateWarning
```

### System State

#### GET /system_state_daily
```typescript
Query: {
  state_date?: date
  start_date?: date
  end_date?: date
}
Response: SystemStateDaily[]
```

## Edge Function Endpoints

### Calculate ULTRA Score

#### POST /functions/v1/calculate-ultra-score
```typescript
Body: {
  date?: date // defaults to today
}
Response: {
  ultra_score: number
  domain_scores: Record<string, number>
  calculated_at: timestamptz
}
```

### Evaluate Automation

#### GET /functions/v1/evaluate-automation
```typescript
Response: {
  ultra_score: number
  state: string
  base_state: string
  state_color: string
  state_icon: string
  state_level: 'GREEN' | 'YELLOW' | 'ORANGE' | 'RED'
  state_reasons: string[]
  priority_zone: string
  priority_hub: { code: string, name: string } | null
  priority_score: number
  weakest_hub: { code: string, name: string } | null
  weakest_score: number
  strongest_hub: { code: string, name: string } | null
  hubs_in_danger: number
  hub_imbalance: number
  habit_consistency: number
  calendar_load: number
  score_trend: number
  recent_activity: number
  triggered_actions: Array<{
    rule: string
    target: string
    value: string
    reason: string
  }>
  focus_recommendations: {
    primary_domain: string
    secondary_domain: string
    suggested_actions: string[]
    risk_factors: string[]
    opportunities: string[]
  }
  date: string
}
```

### Automation Evaluator (Enhanced)

#### GET /functions/v1/automation-evaluator
```typescript
Response: {
  ultra_score: number
  hub_scores: Record<string, number>
  domain_scores: Record<string, number>
  system_state: string
  ultra_state: string
  weakest_hub: { name: string, score: number }
  weakest_domain: { name: string, score: number }
  priority_level: string
  priority_score: number
  focus_domain: string
  triggered_rules: Array<{
    rule_id: number
    rule_name: string
    reason: string
    action: {
      action_type: string
      target: string
      value: string | null
    }
  }>
  recommended_actions: string[]
  daily_brief: string
  metrics_snapshot: {
    habit_consistency: number
    calendar_load: number
    recent_activity: number
  }
  timestamp: string
}
```

### Generate Daily Insight

#### GET /functions/v1/generate-daily-insight
```typescript
Response: {
  insight: string
  score: number
  delta: number
  best_hub: string
  worst_hub: string
  suggestions: string[]
  generated_at: timestamptz
}
```

### Calendar Autofill

#### POST /functions/v1/calendar-autofill
```typescript
Body: {
  date: date
}
Response: {
  blocks_generated: number
  time_blocks: Array<{
    title: string
    start_time: string
    end_time: string
    focus_domain: string
    hub_id: number
  }>
}
```

### System Validate

#### GET /functions/v1/system-validate
```typescript
Query: {
  auto_fix?: boolean
}
Response: {
  total_issues: number
  fixes_applied: number
  errors: string[]
  warnings: string[]
  recommendations: string[]
}
```

### Automation Rebalance

#### POST /functions/v1/automation-rebalance
```typescript
Response: {
  rebalanced_tasks: number
  state: string
  priority_adjustments: Array<{
    task_id: number
    old_priority: string
    new_priority: string
  }>
}
```

### Automation Trigger

#### POST /functions/v1/automation-trigger
```typescript
Body: {
  trigger_type: 'log_created' | 'metric_updated' | 'habit_checkin' | 'project_updated'
  user_id: uuid
  entity_id?: number
}
Response: {
  success: boolean
  trigger_type: string
  results: string[]
  timestamp: timestamptz
}
```

### Generate Weekly Review

#### POST /functions/v1/generate-weekly-review
```typescript
Body: {
  week_start?: date
}
Response: {
  week_summary: string
  score_change: number
  top_achievements: string[]
  areas_for_improvement: string[]
  next_week_goals: string[]
}
```

### Generate Monthly Insights

#### POST /functions/v1/generate-monthly-insights
```typescript
Body: {
  month?: string // YYYY-MM
}
Response: {
  monthly_summary: string
  score_trend: number[]
  best_performing_hubs: string[]
  needs_attention: string[]
  key_milestones: string[]
  recommendations: string[]
}
```

## Aggregation Endpoints (Computed)

### Dashboard Summary

#### GET /api/dashboard/summary
```typescript
Response: {
  ultra_score: number
  daily_score: number
  weakest_hub: string
  priority_zone: string
  pending_actions: number
  active_warnings: number
  habit_streak_avg: number
  upcoming_events: number
}
```

### Trends Analysis

#### GET /api/trends/ultra
```typescript
Query: {
  days?: number // default 30
}
Response: {
  dates: date[]
  scores: number[]
  avg_score: number
  trend_direction: 'up' | 'down' | 'stable'
  change_percent: number
}
```

#### GET /api/trends/hubs
```typescript
Query: {
  hub_id?: number
  days?: number
}
Response: Record<string, {
  dates: date[]
  scores: number[]
  avg_score: number
  trend_direction: string
}>
```

### Analytics

#### GET /api/analytics/completion-rate
```typescript
Query: {
  start_date?: date
  end_date?: date
}
Response: {
  tasks: { total: number, completed: number, rate: number }
  habits: { total: number, completed: number, rate: number }
  actions: { total: number, completed: number, rate: number }
}
```

#### GET /api/analytics/hub-distribution
```typescript
Response: Array<{
  hub_name: string
  log_count: number
  avg_score: number
  percentage: number
}>
```

## Real-time Subscriptions

### Subscribe to Updates

```typescript
// ULTRA Score updates
supabase
  .channel('ultra_metrics')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'ultra_metrics',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe()

// Auto Actions updates
supabase
  .channel('auto_actions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'auto_actions',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe()

// Warnings updates
supabase
  .channel('state_warnings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'state_warnings',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe()
```

## Error Codes

```typescript
{
  'UNAUTHORIZED': 401,
  'FORBIDDEN': 403,
  'NOT_FOUND': 404,
  'VALIDATION_ERROR': 422,
  'INTERNAL_ERROR': 500,
  'SERVICE_UNAVAILABLE': 503
}
```

## Rate Limits

- Authentication: 10 requests/minute
- Data endpoints: 100 requests/minute
- Edge functions: 50 requests/minute
- Real-time: Unlimited subscriptions

## Pagination

Standard pagination parameters:
```typescript
{
  limit?: number // max 1000, default 100
  offset?: number // default 0
  order_by?: string // column.asc or column.desc
}
```

## Filtering

Standard filter operators:
- `eq`: equals
- `neq`: not equals
- `gt`: greater than
- `gte`: greater than or equal
- `lt`: less than
- `lte`: less than or equal
- `like`: pattern matching
- `ilike`: case-insensitive pattern matching
- `in`: in array
- `is`: is null/not null

## API Versioning

Current version: v1
Future versions will be namespaced: `/v2/...`

## SDK Usage

```typescript
import { supabase } from '@/integrations/supabase/client';

// Query data
const { data, error } = await supabase
  .from('logs')
  .select('*')
  .eq('user_id', userId)
  .order('log_date', { ascending: false })
  .limit(10);

// Insert data
const { data, error } = await supabase
  .from('logs')
  .insert({
    log_date: today,
    source: 'Health',
    notes: 'Morning workout'
  });

// Call edge function
const { data, error } = await supabase.functions.invoke(
  'evaluate-automation'
);
```