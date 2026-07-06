# LifeOS Automation Engine - Complete Implementation Guide

## Overview

The LifeOS Automation Engine is a fully programmable, intelligent system that replicates and enhances the Excel v30 automation logic as a scalable backend service. It provides dynamic rules, real-time state classification, intelligent recommendations, and automated priority routing.

## System Architecture

### 1. Core Components

#### Automation Evaluator (`automation-evaluator`)
The brain of the system that:
- Gathers all metrics (ULTRA Score, Hub Scores, Domain Scores)
- Evaluates all active automation rules
- Calculates system states
- Determines priority levels
- Generates intelligent recommendations
- Produces daily intelligence briefs

#### Rule Engine
Dynamic rule evaluation system supporting:
- 10+ condition types
- 8+ action types
- Multi-condition logic
- Real-time evaluation
- Execution history logging

#### States Engine
Classifies system performance across multiple dimensions:
- ULTRA Score States (Critical → Elite)
- Hub States (per hub scoring)
- Domain States (per domain scoring)
- System Modes (Crisis, Danger, Growth, Affluence, etc.)

## State Classification System

### ULTRA Score → State Mapping

| Score Range | State Label | System Mode | Priority |
|-------------|-------------|-------------|----------|
| 0-20 | Critical | CRISIS_MODE | Emergency |
| 21-40 | Danger | DANGER_MODE | High |
| 41-55 | Weak | STRUGGLING_MODE | High |
| 56-70 | Stable | BALANCED_MODE | Medium |
| 71-80 | Good | GROWTH_MODE | Medium |
| 81-90 | Excellent | ULTRA_MODE | Low |
| 91-100 | Elite | AFFLUENCE_MODE | Growth |

### Hub/Domain States
Each hub and domain uses the same classification:
- **0-20**: Critical Hub/Domain
- **21-40**: Emergency State
- **41-55**: Weak Performance
- **56-70**: Stable Foundation
- **71-80**: Good Performance
- **81-90**: Excellent State
- **91-100**: Elite Performance

## Automation Rule Object Structure

```typescript
{
  rule_id: number,
  rule_name: string,
  description: string,
  is_active: boolean,
  condition: {
    metric_source: "ULTRA_SCORE" | "HUB_SCORE" | "DOMAIN_SCORE" | "LOG_ENTRY",
    metric_name: string,
    comparison: "<" | "<=" | "==" | ">" | ">=",
    value: number
  },
  action: {
    action_type: "SET_STATE" | "SET_PRIORITY" | "GENERATE_TASK" | 
                 "GENERATE_RECOMMENDATION" | "FOCUS_DOMAIN" | "ALERT_USER",
    target: string,
    value: string
  }
}
```

## Condition Types

### 1. ULTRA Score Conditions
- `ULTRA_SCORE_THRESHOLD`: Triggers when ULTRA Score crosses threshold
- `ULTRA_BELOW`: Fires when score drops below value
- `ULTRA_ABOVE`: Fires when score exceeds value

### 2. Hub-Based Conditions
- `HUB_SCORE_THRESHOLD`: Monitors individual hub performance
- `HUB_BELOW`: Weakest hub below threshold
- `IS_WEAKEST`: Identifies current weakest hub
- `IS_STRONGEST`: Identifies current strongest hub

### 3. Trend Conditions
- `TREND_DROP`: Detects declining performance over time
- `TREND_RISE`: Detects improving performance over time

### 4. Activity Conditions
- `MISSING_LOGS`: Flags when logging activity drops
- `CONSISTENCY_LOW`: Monitors habit consistency
- `CALENDAR_OVERLOAD`: Detects excessive scheduling

### 5. Special Conditions
- `STREAK_BROKEN`: Habit streak dropped to zero
- `STATE_CHANGE`: System state transitioned

## Action Types

### 1. Task Generation
- `CREATE_TASK`: Generate new task with description
- `GENERATE_RECOMMENDATION`: Create AI recommendation

### 2. Calendar Management
- `CREATE_CALENDAR_BLOCK`: Schedule time block
- `FOCUS_DOMAIN`: Set focus area for the day

### 3. Alerts & Notifications
- `SEND_ALERT`: Trigger user alert
- `ALERT_USER`: Push critical notification

### 4. System Control
- `SET_PRIORITY`: Change priority level
- `SET_STATE`: Override system state
- `TRIGGER_RECOVERY`: Activate recovery mode
- `CHANGE_MODE`: Switch system mode

### 5. Intelligence
- `GENERATE_INSIGHT`: Create AI insight
- `RECOMMEND_HABIT`: Suggest new habit

## Priority Calculation Algorithm

```typescript
priority_score = 
  (100 - ultra_score) +
  (100 - lowest_hub_score) +
  (triggered_rules_count * 5) +
  ((7 - recent_activity_count) * 3)

Priority Levels:
- 0-50: Low Priority
- 51-100: Medium Priority  
- 101-200: High Priority
- 200+: Emergency Mode
```

## Rule Evaluation Flow

```
1. Load all active automation rules
   ↓
2. Gather current metrics (ULTRA, Hubs, Domains, Habits, Logs)
   ↓
3. For each rule:
   - Evaluate condition against metrics
   - If condition met → Mark rule as triggered
   - Generate action from rule definition
   ↓
4. Collect all triggered rules
   ↓
5. Calculate priority score
   ↓
6. Determine weakest hub and domain
   ↓
7. Generate daily intelligence brief
   ↓
8. Return complete evaluation result
   ↓
9. Log execution to automation_executions table
```

## Evaluation Output Structure

```json
{
  "ultra_score": 72.5,
  "hub_scores": { "Health": 65, "Finance": 45, ... },
  "domain_scores": { "Spirituality": 70, ... },
  "system_state": "BALANCED_MODE",
  "ultra_state": "Good",
  "weakest_hub": { "name": "Finance", "score": 45 },
  "weakest_domain": { "name": "Emotional Intelligence", "score": 52 },
  "priority_level": "High Priority",
  "priority_score": 105,
  "focus_domain": "Finance",
  "triggered_rules": [
    {
      "rule_id": 3,
      "rule_name": "Low Finance Alert",
      "reason": "Finance score 45 < 50",
      "action": {
        "action_type": "CREATE_TASK",
        "target": "CREATE_TASK",
        "value": "Review monthly budget"
      }
    }
  ],
  "recommended_actions": [
    "Review monthly budget",
    "Schedule 30-min Finance planning session",
    "Add expense tracking habit"
  ],
  "daily_brief": "Your ULTRA Score is 72.5 (Good). 
    Weakest Hub: Finance (45.0). 
    Weakest Domain: Emotional Intelligence (52.0).
    Priority Level: High Priority.
    3 Automation Rules Triggered.
    Focus Domain Today: Finance.",
  "metrics_snapshot": {
    "habit_consistency": 5.2,
    "calendar_load": 12,
    "recent_activity": 15
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## API Endpoints

### GET `/automation-evaluator`
Runs complete system evaluation and returns full diagnostics.

**Authorization**: Requires Bearer token

**Response**: Complete evaluation object (see structure above)

### GET `/evaluate-automation`
Legacy endpoint for basic state evaluation.

### POST `/automation-trigger`
Triggers automation recalculation after data changes.

**Body**:
```json
{
  "trigger_type": "log_created" | "metric_updated" | "habit_checkin" | ...,
  "user_id": "uuid",
  "entity_id": 123
}
```

## Database Schema

### automation_rules
Main rule definitions
- `id`: Primary key
- `name`: Rule identifier
- `description`: What the rule does
- `condition_type`: Primary condition type
- `condition_value`: Threshold value
- `action_target`: Primary action type
- `action_value`: Action parameter
- `is_active`: Whether rule is enabled

### automation_rule_conditions
Extended condition specifications
- `rule_id`: Link to parent rule
- `condition_type`: Detailed condition type
- `metric_name`: Specific metric to evaluate
- `operator`: Comparison operator
- `threshold_value`: Numeric threshold
- `comparison_window`: Days for trend analysis

### automation_rule_actions
Action specifications
- `rule_id`: Link to parent rule
- `action_type`: Type of action
- `action_payload`: JSON configuration
- `priority`: Execution priority

### automation_executions
Execution audit log
- `user_id`: User
- `rule_id`: Executed rule
- `execution_date`: When executed
- `trigger_type`: What triggered it
- `conditions_met`: JSON of conditions
- `actions_executed`: JSON of actions
- `execution_result`: success/failed

### automation_context_cache
Performance optimization cache
- `user_id`: Cache owner
- `cache_key`: Unique identifier
- `cache_value`: Cached data
- `expires_at`: Expiration timestamp

## UI Components

### 1. Automation Rules Page (`/automation-rules`)
Visual rule builder with:
- Condition type selector
- Threshold configuration
- Action target selection
- Rule activation toggle
- Test execution button
- Execution history

### 2. Automation Diagnostics Page (`/automation-diagnostics`)
Complete system analysis showing:
- Daily intelligence brief
- ULTRA Score with state
- System state classification
- Priority level indicator
- Weakest hub/domain identification
- Triggered rules list
- Recommended actions
- Metrics snapshot
- Hub scores breakdown

### 3. Automation Control Center (`/automation`)
System controls including:
- Current status overview
- Manual triggers
- Auto-generated actions
- System warnings
- Active rules display

### 4. States Engine Dashboard (`/states-engine`)
Real-time state monitoring with:
- ULTRA Score gauge
- State badge
- Weakest hub card
- Priority recommendations
- System metrics

## Integration Points

The Automation Engine integrates with:
- **Metrics API**: Reads hub and domain scores
- **Ultra Metrics API**: Reads ULTRA Score
- **Logs API**: Analyzes activity patterns
- **Habits API**: Evaluates consistency
- **Calendar API**: Monitors scheduling load
- **Projects API**: Tracks task status

## Usage Examples

### Example 1: Creating a Low ULTRA Score Rule

```sql
INSERT INTO automation_rules (name, description, condition_type, condition_value, action_target, action_value, is_active)
VALUES (
  'Crisis Mode Activation',
  'Triggers when ULTRA Score drops below 30',
  'ULTRA_BELOW',
  30,
  'SET_STATE',
  'CRISIS_MODE',
  true
);
```

### Example 2: Hub Recovery Rule

```sql
INSERT INTO automation_rules (name, description, condition_type, condition_value, action_target, action_value, is_active)
VALUES (
  'Health Hub Recovery',
  'Creates recovery task when Health drops below 40',
  'HUB_BELOW',
  40,
  'CREATE_TASK',
  'Complete 20-minute recovery workout',
  true
);
```

### Example 3: Habit Consistency Alert

```sql
INSERT INTO automation_rules (name, description, condition_type, condition_value, action_target, action_value, is_active)
VALUES (
  'Low Consistency Warning',
  'Alert when habit consistency drops below 3 days',
  'CONSISTENCY_LOW',
  3,
  'SEND_ALERT',
  'Habit consistency declining - restart key routines',
  true
);
```

## Best Practices

1. **Start Simple**: Begin with 3-5 essential rules, then expand
2. **Test Rules**: Use the test button before activating
3. **Monitor Executions**: Check execution logs regularly
4. **Avoid Rule Conflicts**: Ensure rules don't contradict
5. **Set Realistic Thresholds**: Base thresholds on historical data
6. **Review Weekly**: Adjust rules based on performance
7. **Use Priorities**: Set appropriate priority levels
8. **Document Rules**: Add clear descriptions

## Troubleshooting

### Issue: Rules Not Triggering
- Check if rule is active
- Verify threshold values are realistic
- Ensure metrics are being updated
- Check execution logs for errors

### Issue: Too Many Rules Triggering
- Increase threshold values
- Add cooldown periods
- Consolidate similar rules
- Review priority scores

### Issue: Incorrect State Classification
- Verify ULTRA Score calculation
- Check hub score accuracy
- Review state thresholds
- Ensure metrics are current

## Future Enhancements

- Machine learning-based rule suggestions
- Predictive analytics for trend detection
- Natural language rule creation
- Mobile push notifications
- Voice-activated rule management
- Multi-user family mode
- Advanced analytics dashboard
- Custom metric support
- Rule templates library
- A/B testing for rules