# LifeOS Automation Engine & States Engine Documentation

## Overview

The LifeOS Automation Engine is a complete intelligent system that analyzes user data across all life domains and provides real-time state assessment, priority routing, and automated recommendations.

## System Architecture

### Core Components

1. **States Engine** (`evaluate-automation`)
   - Calculates overall system state
   - Determines weakest hub
   - Calculates priority zone
   - Generates intelligent recommendations

2. **Score Calculator** (`calculate-ultra-score`)
   - Computes ULTRA Score from 7 domain metrics
   - Applies consistency factor from habit streaks
   - Applies trend factor from recent score changes

3. **Daily Insight Generator** (`generate-daily-insight`)
   - Provides contextual coaching based on current state
   - Tracks score deltas
   - Identifies best/worst performing hubs

4. **Calendar Autofill** (`calendar-autofill`)
   - Generates time blocks based on system state
   - Prioritizes weakest areas
   - Adapts schedule to CRISIS/GROWTH/AFFLUENCE modes

5. **System Validator** (`system-validate`)
   - Detects missing metrics
   - Identifies broken habit streaks
   - Flags stuck projects
   - Auto-fixes data inconsistencies

6. **Automation Rebalancer** (`automation-rebalance`)
   - Reassigns task priorities based on state
   - Moves overdue tasks to priority zone
   - Activates/deactivates tasks by urgency

7. **Automation Trigger** (`automation-trigger`)
   - Central orchestrator for recalculations
   - Triggered on data changes (logs, metrics, habits, projects)
   - Calls dependent functions in sequence

## State Classification System

### ULTRA Score States

| Score Range | State Label | Description | Danger Level | Priority |
|-------------|-------------|-------------|--------------|----------|
| 80-100 | EXCELLENT | Peak performance | None | Growth & Expansion |
| 60-79 | STABLE | Solid foundation | Low | Weakest Hub |
| 40-59 | WARNING | Attention needed | Medium | Weakest Hub |
| 25-39 | DANGER | Corrective actions required | High | Emergency Hub |
| 0-24 | CRITICAL | Emergency intervention | Emergency | Critical Hub |

### Hub States

Each hub is classified based on its score:

- **0-20**: CRITICAL HUB - Emergency intervention required
- **20-30**: EMERGENCY HUB - Immediate attention needed
- **30-40**: DANGER - Corrective actions required
- **40-60**: WARNING - Needs improvement
- **60-80**: STABLE - Solid performance
- **80-100**: PRIME - Exceptional performance

## Weakest Hub Algorithm

The system calculates the weakest hub using a weighted priority algorithm:

```typescript
Priority Score = (100 - hub_score) + trend_penalty + (impact_weight * score_penalty)

Impact Weights:
- HEALTH: 1.3
- FINANCE: 1.2
- MINDSET: 1.2
- WORK: 1.1
- RELATIONSHIPS: 1.1
- Others: 1.0-0.9
```

This ensures critical life domains (Health, Finance) receive higher priority even if other hubs have slightly lower scores.

## Automation Rule Families

### Family A: ULTRA Score Based
- `ULTRA_BELOW`: Triggers when score drops below threshold
- `ULTRA_ABOVE`: Triggers when score exceeds threshold
- `ULTRA_RANGE`: Triggers within score range

### Family B: Hub-Based Rules
- `HUB_BELOW`: Weakest hub below threshold
- `WEAKEST_HUB_IS`: Specific hub is weakest
- `HUBS_IN_DANGER`: Multiple hubs in danger zone

### Family C: Missing Logs
- `NO_LOGS_TODAY`: No activity logged today
- `LOGS_BELOW`: Insufficient logging activity

### Family D: Habit Logic
- `HABIT_STREAK_BELOW`: Consistency breakdown
- `HABIT_STREAK_ABOVE`: Strong consistency reward

### Family E: Emotional Triggers
- `SCORE_TREND_NEGATIVE`: Declining momentum

### Family F: Calendar/Project Logic
- `CALENDAR_OVERLOAD`: Too many scheduled events
- `HUB_IMBALANCE_HIGH`: Severe domain imbalance

### Family G: State-Based Modes
- `STATE_IS`: Triggers for specific state (CRISIS, GROWTH, etc.)

## Data Flow

```
User Action (Log/Metric/Habit) 
  ↓
automation-trigger edge function
  ↓
├─→ calculate-ultra-score (if metric/log change)
├─→ evaluate-automation (always)
└─→ system-validate (if significant change)
  ↓
UI Auto-Updates via React Query
```

## Excel to Web App Mapping

| Excel Sheet | Web Database Table | Edge Function |
|-------------|-------------------|---------------|
| Ultra_Metrics | `ultra_metrics` | `calculate-ultra-score` |
| HubStates | `metrics` (DailyScore) | Computed in evaluate-automation |
| AUTOMATION_ENGINE | `automation_rules` | `evaluate-automation` |
| StatesEngine | `system_state_daily` | `evaluate-automation` |
| HABITS_ENGINE | `habits`, `habit_checkins` | Integrated in scoring |
| ULTRA_CALENDAR | `calendar_entries` | `calendar-autofill` |
| PROJECTS_MANAGER | `projects`, `tasks` | `automation-rebalance` |
| *_Log sheets | `logs` (by source) | Triggers recalculation |
| TRENDS_ENGINE | Computed analytics | Weekly/monthly insights |
| INSIGHT_ENGINE | AI summaries | `generate-daily-insight` |

## API Endpoints

### GET `/evaluate-automation`
Returns complete system state analysis:
```json
{
  "ultra_score": 72.5,
  "state": "STABLE",
  "base_state": "STABLE",
  "state_level": "YELLOW",
  "priority_zone": "Health Focus",
  "priority_hub": { "code": "HEALTH", "name": "Health" },
  "weakest_hub": { "code": "HEALTH", "name": "Health" },
  "weakest_score": 45.2,
  "hubs_in_danger": 1,
  "habit_consistency": 6.3,
  "score_trend": 2.1,
  "triggered_actions": [...],
  "focus_recommendations": {
    "primary_domain": "Health",
    "secondary_domain": "Work",
    "suggested_actions": [...],
    "risk_factors": [...],
    "opportunities": [...]
  }
}
```

### POST `/calculate-ultra-score`
Recalculates ULTRA Score:
```json
{
  "date": "2025-01-15" // optional, defaults to today
}
```

### POST `/calendar-autofill`
Generates time blocks:
```json
{
  "date": "2025-01-15",
  "state": "GROWTH",
  "blocks_generated": 10,
  "time_blocks": [...]
}
```

### GET `/system-validate`
Runs diagnostics:
```json
{
  "errors": [...],
  "warnings": [...],
  "fixes_applied": [...]
}
```

## UI Components

### States Engine Dashboard (`/states-engine`)
- Real-time ULTRA Score display
- Overall state classification
- Weakest hub identification
- Priority hub calculation
- Recommended actions list
- System metrics grid
- Opportunities and risk factors

### Dashboard Integration
- Mini Ultra Score gauge
- System status badge
- Daily insight card
- Priority hub card
- AI action plan

## Best Practices

1. **Data Integrity**: Always log activities to maintain accurate state assessment
2. **Habit Consistency**: Maintain streaks to boost consistency factor
3. **Regular Reviews**: Check States Engine daily for priority guidance
4. **Action Completion**: Follow recommended actions to improve scores
5. **Balanced Focus**: Address weakest hub while maintaining strong areas

## Troubleshooting

### Score Not Updating
- Check if logs are being created with correct dates
- Verify hub metrics are being calculated
- Run `system-validate` to check for missing data

### Wrong Priority Hub
- Ensure all hub scores are up to date
- Check impact weights match your priorities
- Verify automation rules are active

### No Recommendations
- Confirm `evaluate-automation` is running
- Check if automation rules exist in database
- Verify ULTRA Score is calculated

## Future Enhancements

- Machine learning-based trend prediction
- Personalized automation rule templates
- Advanced goal-setting integration
- Multi-user family mode support
- Mobile app notifications
- Voice command integration
