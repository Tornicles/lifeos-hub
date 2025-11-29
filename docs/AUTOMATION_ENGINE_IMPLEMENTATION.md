# LifeOS v30 Automation Engine - Complete Implementation

## Overview

The LifeOS Automation Engine is a comprehensive, enterprise-grade system that automates user workflows based on metrics, behaviors, and patterns. This document covers the complete implementation including database architecture, edge functions, conflict resolution, action queuing, and frontend interfaces.

## Architecture Components

### 1. Database Layer

#### Core Tables

**automation_rules**
- Stores all automation rules with conditions and actions
- Enhanced with priority, conflict_group, version tracking
- Supports user confirmation requirements

**automation_rule_conditions**
- Defines rule conditions (ULTRA_BELOW, HUB_TREND_DECLINE, etc.)
- Supports comparison windows and threshold values
- Handles complex multi-condition logic

**automation_rule_actions**
- Defines actions to execute when rules trigger
- Supports action payloads and priority ordering

**automation_executions**
- Historical record of rule executions
- Tracks conditions met and actions executed
- Provides audit trail

#### New Enhanced Tables

**automation_trigger_events**
- Tracks all automation triggers
- Records trigger type, source, and data
- Enables event-driven architecture
- Fields: trigger_type, trigger_source, trigger_data, processed

**automation_action_queue**
- Priority-based action queue
- Supports retry logic and error handling
- Status tracking: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED
- Fields: action_type, action_payload, priority (1-4), status, scheduled_for, retry_count

**automation_logs**
- Comprehensive audit trail
- Event types: RULE_TRIGGERED, ACTION_EXECUTED, CONFLICT_DETECTED, ERROR_OCCURRED
- Severity levels: DEBUG, INFO, WARNING, ERROR, CRITICAL

**user_automation_settings**
- Per-user automation preferences
- Enabled/disabled categories
- Notification preferences (email, push, in-app)
- Quiet hours configuration
- Max daily actions limit
- Priority override option

## Trigger Types

### 1. Score-Based Triggers
```typescript
- ULTRA_SCORE_UPDATED: When ULTRA Score recalculates
- HUB_SCORE_UPDATED: When any hub score changes
- DAILY_SCORE_GENERATED: Daily aggregation complete
- WEEKLY_AVERAGE: Weekly trends calculated
- TREND_DETECTED: Pattern identified (3-day decline, spike, etc.)
```

### 2. Behavior-Based Triggers
```typescript
- LOG_CREATED: User logs activity
- LOG_MISSING: Expected log not created
- HABIT_CHECKIN: Habit marked complete
- HABIT_MISSED: Habit not completed
- NO_ACTIVITY: User inactive for X hours
- TASK_COMPLETED: Project task finished
- MILESTONE_REACHED: Habit streak milestone
```

### 3. Time-Based Triggers
```typescript
- MORNING_ROUTINE: 6:00 AM daily
- EVENING_REFLECTION: 9:00 PM daily
- WEEKLY_REVIEW: Sunday evening
- MONTHLY_EVALUATION: Last day of month
```

### 4. Domain-Specific Triggers
```typescript
- EMOTIONAL_LOW: Emotional Intelligence score drops
- SOCIAL_STRESS: Social Life logs indicate stress
- BRANDING_DECLINE: Personal Branding metrics fall
- RELATIONSHIP_CONFLICT: Conflict detected in logs
```

## Rule Types & Condition Engine

### Simple Conditional Rule
```sql
IF ULTRA_SCORE < 50 THEN 
  CREATE action_queue(
    action_type: 'NOTIFICATION',
    payload: { message: 'Activate Recovery Plan' }
  )
```

### Compound Rule
```sql
IF (HEALTH_SCORE < 40 AND STRESS_LOG_TODAY = true) THEN
  CREATE action_queue(
    action_type: 'CALENDAR_CREATE',
    payload: { title: 'Health Recovery Block', duration: 60 }
  )
```

### Trend Rule
```sql
IF (HEALTH_SCORE declined for 3 consecutive days) THEN
  CREATE action_queue(
    action_type: 'TASK_CREATE',
    payload: { title: 'Schedule Health Checkup' }
  )
```

### Missing Activity Rule
```sql
IF (NO_LOGS for 24 hours) THEN
  CREATE action_queue(
    action_type: 'NOTIFICATION',
    payload: { message: 'Time to log your day!' }
  )
```

### Surge Rule
```sql
IF (FINANCE_SPENDING > average * 1.4) THEN
  CREATE action_queue(
    action_type: 'NOTIFICATION',
    payload: { 
      severity: 'warning',
      message: 'Spending spike detected' 
    }
  )
```

## Supported Condition Types

```typescript
enum ConditionType {
  // Score Comparisons
  ULTRA_BELOW = 'ULTRA_BELOW',
  ULTRA_ABOVE = 'ULTRA_ABOVE',
  HUB_BELOW = 'HUB_BELOW',
  HUB_ABOVE = 'HUB_ABOVE',
  
  // Trend Detection
  HUB_TREND_DECLINE = 'HUB_TREND_DECLINE',
  HUB_TREND_RISE = 'HUB_TREND_RISE',
  SCORE_VOLATILE = 'SCORE_VOLATILE',
  
  // Habit Tracking
  HABIT_STREAK_UNDER = 'HABIT_STREAK_UNDER',
  HABIT_STREAK_ABOVE = 'HABIT_STREAK_ABOVE',
  HABIT_CONSISTENCY_LOW = 'HABIT_CONSISTENCY_LOW',
  
  // Activity Detection
  LOG_CONTAINS = 'LOG_CONTAINS',
  NO_LOGS_24H = 'NO_LOGS_24H',
  NO_LOGS_48H = 'NO_LOGS_48H',
  
  // Calendar & Projects
  CALENDAR_EMPTY = 'CALENDAR_EMPTY',
  TASKS_OVERDUE = 'TASKS_OVERDUE',
  PROJECT_STALLED = 'PROJECT_STALLED',
  
  // Financial Patterns
  SPENDING_SPIKE = 'SPENDING_SPIKE',
  SPENDING_BELOW_BUDGET = 'SPENDING_BELOW_BUDGET',
  
  // Emotional & Social
  MOOD_DROP = 'MOOD_DROP',
  SOCIAL_ISOLATION = 'SOCIAL_ISOLATION',
  CONFLICT_DETECTED = 'CONFLICT_DETECTED'
}
```

## Action Types

### 1. Notification Actions
```typescript
{
  action_type: 'NOTIFICATION',
  payload: {
    message: string,
    severity: 'info' | 'warning' | 'critical',
    warning_type: string,
    hub_id?: number
  }
}
```

### 2. Calendar Actions
```typescript
{
  action_type: 'CALENDAR_CREATE',
  payload: {
    title: string,
    description: string,
    date: string,
    start_time: string,
    end_time: string,
    hub_id?: number,
    focus_domain?: string
  }
}
```

### 3. Task Actions
```typescript
{
  action_type: 'TASK_CREATE',
  payload: {
    title: string,
    description: string,
    priority: 'Low' | 'Medium' | 'High',
    due_date?: string,
    project_id?: number,
    hub_id?: number
  }
}
```

### 4. Habit Actions
```typescript
{
  action_type: 'HABIT_SUGGEST',
  payload: {
    name: string,
    description: string,
    target_hub?: number
  }
}
```

### 5. State Update Actions
```typescript
{
  action_type: 'STATE_UPDATE',
  payload: {
    state: string,
    ultra_score: number,
    priority_zone: string,
    state_reasons: string[]
  }
}
```

### 6. Auto Action Creation
```typescript
{
  action_type: 'AUTO_ACTION_CREATE',
  payload: {
    action_type: string,
    action_text: string,
    hub_id?: number,
    domain_id?: number,
    priority: number
  }
}
```

## Automation Pipeline

### Complete Execution Flow

```
1. EVENT OCCURS
   ├─ User creates log
   ├─ Score recalculates
   ├─ Time-based trigger fires
   └─ Pattern detected

2. TRIGGER EVENT CREATED
   └─ Insert into automation_trigger_events
   
3. EVALUATE AUTOMATION
   ├─ Load active rules
   ├─ Match conditions against current state
   ├─ Filter by user automation settings
   └─ Generate triggered rules list

4. CONFLICT RESOLUTION
   ├─ Group rules by conflict_group
   ├─ Detect contradictions
   ├─ Resolve by priority (higher wins)
   ├─ Log conflicts
   └─ Return final rules list

5. QUEUE ACTIONS
   ├─ Create action_queue entries
   ├─ Set priority (1=low, 4=critical)
   ├─ Set scheduled_for timestamp
   ├─ Check max_daily_actions limit
   └─ Respect quiet hours

6. LOG EXECUTION
   └─ Insert into automation_logs

7. PROCESS ACTIONS
   ├─ automation-processor runs
   ├─ Fetch pending actions (ordered by priority)
   ├─ Mark as PROCESSING
   ├─ Execute action
   │  ├─ Success → COMPLETED
   │  └─ Error → Retry or FAILED
   └─ Log results

8. UPDATE SYSTEM STATE
   ├─ Update metrics
   ├─ Update Ultra State
   └─ Trigger dependent automations
```

## Edge Functions

### 1. evaluate-automation
**Purpose**: Core automation evaluation engine
**Flow**:
- Fetch user metrics (ULTRA Score, hub scores, habits)
- Load active automation rules
- Evaluate conditions
- Return triggered actions and recommendations

### 2. automation-trigger
**Purpose**: Event dispatcher
**Flow**:
- Receives trigger events (log_created, habit_checkin, etc.)
- Invokes calculate-ultra-score if needed
- Invokes evaluate-automation
- Handles cascade effects

### 3. automation-processor
**Purpose**: Action queue executor (NEW)
**Flow**:
- Fetches pending actions from automation_action_queue
- Processes in priority order
- Executes each action type
- Handles retries and failures
- Logs all results

**Supported Actions**:
- CALENDAR_CREATE: Creates calendar entries
- TASK_CREATE: Creates project tasks
- STATE_UPDATE: Updates system state
- NOTIFICATION: Creates notifications/warnings
- HABIT_SUGGEST: Suggests new habits
- AUTO_ACTION_CREATE: Creates auto actions

### 4. automation-conflict-resolver
**Purpose**: Detects and resolves rule conflicts (NEW)
**Flow**:
- Receives list of triggered rules
- Groups by conflict_group
- Detects conflicts (multiple rules in same group)
- Resolves by priority
- Logs conflict resolutions
- Returns final rules list

### 5. automation-rebalance
**Purpose**: Task rebalancing based on system state
**Flow**:
- Fetches current system state
- Adjusts task priorities
- Handles overdue tasks
- Creates recovery actions

### 6. system-validate
**Purpose**: System health checks and auto-fixes
**Flow**:
- Checks for missing scores
- Detects broken streaks
- Identifies stuck projects
- Auto-fixes where possible

## Conflict Resolution Algorithm

### Priority-Based Resolution

```typescript
interface ConflictResolution {
  // Rules with same conflict_group
  conflict_group: string;
  
  // All rules that triggered
  rules: Rule[];
  
  // Winner (highest priority)
  winner: Rule;
  
  // Suppressed rules
  suppressed: Rule[];
}

function resolveConflicts(rules: Rule[]): Rule[] {
  const grouped = groupBy(rules, 'conflict_group');
  const resolved = [];
  
  for (const [group, groupRules] of grouped) {
    if (groupRules.length > 1) {
      // Sort by priority (descending)
      const sorted = groupRules.sort((a, b) => 
        b.priority - a.priority
      );
      
      // Winner takes all
      resolved.push(sorted[0]);
      
      // Log conflict
      logConflict({
        group,
        winner: sorted[0],
        suppressed: sorted.slice(1)
      });
    } else {
      resolved.push(groupRules[0]);
    }
  }
  
  return resolved;
}
```

### Example Conflict Scenarios

**Scenario 1: Hub Priority Conflict**
```
Rule A: "Focus on Finance" (priority: 3)
Rule B: "Focus on Health" (priority: 4)
Conflict Group: "daily_priority"

Resolution: Rule B wins (Health priority set)
Suppressed: Rule A
```

**Scenario 2: Calendar Block Overlap**
```
Rule A: "Create gym block 6-7 PM" (priority: 2)
Rule B: "Create work block 5-8 PM" (priority: 3)
Conflict Group: "evening_blocks"

Resolution: Rule B wins
Suppressed: Rule A
```

## User Automation Settings

### Enabled Categories
Users can toggle automation categories:
- `score_alerts`: Score drop notifications
- `habit_suggestions`: Habit recommendations
- `calendar_autofill`: Auto-generate calendar
- `task_generation`: Auto-create tasks
- `state_updates`: System state changes

### Notification Preferences
```typescript
{
  email: boolean,
  push: boolean,
  in_app: boolean
}
```

### Quiet Hours
```typescript
{
  enabled: boolean,
  start: "22:00",  // HH:mm format
  end: "07:00"
}
```

Actions won't execute during quiet hours unless priority is CRITICAL (4).

### Max Daily Actions
Limit on total automated actions per day (default: 20).
Prevents automation overload.

### Priority Override
User can manually set which hub/domain should be prioritized, overriding automation suggestions.

## Frontend Components

### 1. AutomationSettings (/automation-settings)
**Purpose**: User preferences and configuration

**Features**:
- Master automation toggle
- Category enable/disable
- Notification preferences
- Quiet hours configuration
- Max daily actions limit

### 2. ActionQueueViewer
**Purpose**: View queued and historical actions

**Features**:
- Real-time queue display
- Status badges (PENDING, PROCESSING, COMPLETED, FAILED)
- Priority indicators
- Manual action cancellation
- Retry information
- "Process Now" button

### 3. AutomationLogsViewer
**Purpose**: System activity audit trail

**Features**:
- Event type filtering
- Severity-based styling
- Context data display
- Rule linkage
- Real-time updates

### 4. Existing Pages
- **Automation** (/automation): Status and control panel
- **AutomationRules** (/automation-rules): Rule CRUD
- **AutomationDiagnostics** (/automation-diagnostics): System health

## API Endpoints

### Rule Management
```
GET    /automation/rules          - List all rules
GET    /automation/rule/{id}      - Get rule details
POST   /automation/rules          - Create rule
PATCH  /automation/rule/{id}      - Update rule
DELETE /automation/rule/{id}      - Delete rule
```

### Evaluation & Execution
```
GET    /automation/evaluate       - Evaluate rules for user
POST   /automation/trigger        - Fire trigger event
POST   /automation/process        - Process action queue
POST   /automation/resolve        - Resolve conflicts
```

### Monitoring
```
GET    /automation/logs           - Get automation logs
GET    /automation/queue          - Get action queue
GET    /automation/settings       - Get user settings
PUT    /automation/settings       - Update user settings
```

## Edge Cases & Safeguards

### No Logs
- Trigger "missing activity" rules
- Suggest habit check-ins
- Don't auto-create tasks (might be on break)

### Missing Metrics
- Use cached values
- Log warning
- Don't trigger score-based rules

### Contradicting Rules
- Conflict resolver handles
- Log all conflicts
- User can review in UI

### Overlapping Automation Events
- Queue prevents duplicates
- Check scheduled_for timestamps
- Merge similar actions

### Weekend Workflows
- Time-based triggers respect day of week
- Quiet hours extend on weekends
- Lower priority threshold

### User Disabled Categories
- Filter rules before queuing
- Respect user preferences
- Log disabled rule triggers

### First-Time User
- Default settings applied
- Initial automation disabled
- Gradual onboarding

### Rate Limiting
- Max daily actions enforced
- Quiet hours respected
- Critical actions bypass limits

## Security & Privacy

### Data Protection
- No sensitive data in action payloads
- Relationship logs require explicit permission
- Financial details masked
- All actions logged for audit

### Reversibility
- Actions can be cancelled before execution
- Completed actions leave audit trail
- User can disable categories retroactively

### Permission Checks
- All edge functions authenticate user
- RLS policies enforce data isolation
- tenant_id filtering for multi-tenant

### Encryption
- Sensitive payloads encrypted at rest
- Action queue uses secure JSONB
- Audit logs protected by RLS

## Performance & Scalability

### Database Optimization
- Indexed on user_id, status, priority, scheduled_for
- Partitioning for automation_logs (by month)
- Archive completed actions after 90 days

### Edge Function Performance
- Batch action processing (max 10 per run)
- Parallel rule evaluation
- Cached context data
- Connection pooling

### Horizontal Scaling
- Stateless edge functions
- Action queue enables distributed processing
- Event-driven architecture
- Can run multiple processors in parallel

### Cron Jobs
```
*/5 * * * *  - Process action queue (every 5 min)
0 6 * * *    - Morning routine triggers
0 21 * * *   - Evening reflection triggers
0 0 * * 0    - Weekly review (Sunday midnight)
0 0 1 * *    - Monthly evaluation
```

## Monitoring & Alerts

### Health Checks
- Action queue depth
- Failed action rate
- Conflict frequency
- Average processing time
- User opt-out rate

### Alerts
- Queue depth > 100 actions
- Failed rate > 10%
- Edge function errors
- Database timeout

### Metrics Dashboard
- Rules triggered per day
- Actions executed per category
- Conflict resolution rate
- User satisfaction (opt-out rate)
- Processing latency

## Testing Strategy

### Unit Tests
- Condition evaluation logic
- Conflict resolution algorithm
- Action payload validation
- Priority calculation

### Integration Tests
- End-to-end automation flow
- Edge function invocations
- Database transactions
- Rollback scenarios

### Load Tests
- 1000 concurrent users
- 10,000 actions per minute
- Large rule sets (100+ rules)
- Complex condition trees

### User Acceptance
- Automation feels helpful not intrusive
- Conflicts resolved correctly
- Actions arrive at right time
- Settings intuitive

## Migration Guide

### From Excel AUTOMATION_ENGINE

1. **Export Rules**: Extract all IF/THEN logic
2. **Map Conditions**: Convert to condition types
3. **Define Actions**: Create action payloads
4. **Set Priorities**: Assign priority levels
5. **Group Conflicts**: Identify conflict groups
6. **Test Individually**: Verify each rule
7. **Enable Gradually**: Roll out by category

### Example Mapping

**Excel Rule**:
```
IF Ultra Score < 40 THEN 
  Priority = "Health"
  Calendar = "Add Recovery Block"
```

**Database Implementation**:
```sql
INSERT INTO automation_rules (name, priority, conflict_group) 
VALUES ('Crisis Mode - Health Priority', 4, 'daily_priority');

INSERT INTO automation_rule_conditions (rule_id, condition_type, threshold_value)
VALUES (1, 'ULTRA_BELOW', 40);

INSERT INTO automation_rule_actions (rule_id, action_type, action_payload)
VALUES 
  (1, 'STATE_UPDATE', '{"priority_zone": "Health"}'),
  (1, 'CALENDAR_CREATE', '{"title": "Recovery Block", "duration": 60}');
```

## Future Enhancements

### Phase 2
- Machine learning condition prediction
- Natural language rule builder
- A/B testing automation variants
- Collaborative filtering (learn from similar users)

### Phase 3
- Multi-user coordination (family mode)
- External integrations (Google Calendar, Todoist)
- Webhook actions
- Custom JavaScript actions

### Phase 4
- AI-powered action suggestions
- Predictive analytics
- Anomaly detection
- Personalized optimization

## Conclusion

The LifeOS Automation Engine is a production-ready system that translates Excel-based automation into a scalable, secure, and user-friendly web application. With comprehensive conflict resolution, priority management, action queuing, and user controls, it provides enterprise-grade automation while maintaining simplicity and reliability.

The system is designed to scale to millions of users while remaining maintainable, testable, and extensible for future enhancements.
