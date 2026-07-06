# LifeOS v30 - Full System Integration Guide

## Overview

This document describes how all LifeOS modules, features, and data flows are integrated into one seamless operating system.

## Architecture Summary

LifeOS is built as an interconnected system where data flows bidirectionally between modules, triggers automatic calculations, generates AI insights, and updates the user interface in real-time.

### Core Integration Layers

1. **Data Layer** (Supabase PostgreSQL)
2. **Logic Layer** (Edge Functions)
3. **Intelligence Layer** (AI/Automation)
4. **Presentation Layer** (React UI)

---

## Module Integration Map

### 1. Users Module

**Purpose**: Authentication, profiles, preferences

**Integrations**:
- All tables reference `user_id` for data isolation
- User preferences control notification settings
- Profile data feeds into AI insights
- Authentication gates all API access

**Data Flow**:
```
User Signs In → Auth Token → All Modules Filter by user_id
```

---

### 2. Hubs Engine (9 Core Hubs)

**Hubs**: Finance, Health, Work, Academy, PersonalDev, Household, Relationships, Projects, Mindset

**Integrations**:
- Each hub has dedicated `logs` entries (source field)
- Hub scores calculated from `metrics` table
- Hub performance feeds into Ultra Score
- Weak hubs trigger notifications
- Hub-specific actions recommended by AI

**Data Flow**:
```
Log Created → Hub Score Recalculated → Ultra Score Updated → AI Insights Regenerated → Notifications Triggered
```

**Edge Functions**:
- `data-flow-processor` handles log → hub score flow
- `calculate-ultra-score` aggregates hub scores
- `notification-generator` alerts on hub drops

**UI Components**:
- `HubTile` - Display hub status
- `HubDetail` - Deep dive into hub metrics
- Cross-hub comparison in Analytics

---

### 3. Ultra Engine (7 Domains)

**Domains**: Spirituality, Career Master, Social Life, Emotional Intelligence, Personal Branding, Fitness Performance, Dating & Attraction

**Integrations**:
- Domain scores stored in `ultra_metrics` table
- ULTRA Score is weighted average of 7 domains
- Domain performance drives automation rules
- AI Coach prioritizes weakest domain
- Weekly/monthly reports analyze domain trends

**Data Flow**:
```
Domain Metrics → ULTRA Score Calculation → State Classification → AI Analysis → Recommendations
```

**Edge Functions**:
- `calculate-ultra-score` - Computes weighted score
- `ai-insights-engine` - Analyzes domain balance
- `generate-weekly-review` - Domain trend analysis

**UI Components**:
- `UltraDomainTile` - Individual domain cards
- `ScoreRing` - ULTRA Score visualization
- `AICoachCard` - Domain-aware recommendations

---

### 4. Automation Engine

**Purpose**: Rule-based intelligence and automated recommendations

**Integrations**:
- Reads data from all modules (hubs, ultra, habits, projects, calendar)
- Evaluates 70+ predefined rules
- Triggers notifications
- Generates action recommendations
- Adapts system mode (Crisis, Balance, Growth)

**Data Flow**:
```
All Modules → Automation Evaluator → Rules Engine → Actions Queue → Notifications + Recommendations
```

**Edge Functions**:
- `evaluate-automation` - Main rule evaluator
- `automation-processor` - Execute queued actions
- `automation-conflict-resolver` - Handle rule conflicts
- `automation-rebalance` - Redistribute priorities

**UI Components**:
- `StateBadge` - System state indicator
- `PriorityHubCard` - Focus recommendation
- `RuleExecutionTimeline` - Automation history
- `AutomationSettings` - User configuration

---

### 5. AI Intelligence System

**Purpose**: Generate personalized insights using Lovable AI

**Integrations**:
- Consumes data from all modules
- Generates daily focus recommendations
- Predicts mood and energy levels
- Identifies strengths and weaknesses
- Provides actionable advice

**Data Flow**:
```
All User Data → Context Builder → Lovable AI (Gemini) → Structured Insights → Dashboard Display
```

**Edge Functions**:
- `ai-insights-engine` - Main AI orchestrator
- Uses `google/gemini-2.5-flash` model
- Tool calling for structured JSON output

**Features**:
- Daily Focus
- Primary Action
- Secondary Actions
- Weakest Area Analysis
- Strength Recognition
- Mood Prediction
- Energy Recommendation
- Weekly Theme

**UI Components**:
- `AICoachCard` - Main insights display
- Integrated into Dashboard as centerpiece

---

### 6. Habits Engine

**Purpose**: Track daily habits and streaks

**Integrations**:
- Habit check-ins trigger automation
- Streak data affects ULTRA Score
- Broken streaks generate notifications
- Milestone streaks get positive alerts
- Habit consistency feeds into insights

**Data Flow**:
```
Habit Check-in → Streak Updated → data-flow-processor → Notifications → AI Insights
```

**Edge Functions**:
- `data-flow-processor` (habit_checkin flow)
- `notification-generator` (streak alerts)

**Automation Triggers**:
- Streak >= 7: Positive growth notification
- Streak <= 2: Warning notification
- Missed 2+ days: Recovery suggestion

**UI Components**:
- `HabitTile` - Habit status card
- `HabitDetail` - Check-in interface
- Habit charts in Analytics

---

### 7. Projects Manager

**Purpose**: Scrum-style project and task management

**Integrations**:
- Project completion affects Work hub score
- Overdue tasks trigger high-priority notifications
- Task density influences time blocking
- Project health feeds into Ultra Score
- Sprint progress tracked in weekly reports

**Data Flow**:
```
Task Updated → Project Health Calculated → Work Hub Score → data-flow-processor → Notifications
```

**Edge Functions**:
- `data-flow-processor` (project_updated flow)
- `automation-rebalance` (overdue task handling)

**Automation Triggers**:
- Overdue tasks: High severity notification
- Sprint ending: Reminder notification
- Project milestone: Positive alert

**UI Components**:
- `ProjectCard` - Project overview
- `ProjectDetail` - Task management
- Kanban board view
- Project analytics

---

### 8. Calendar Engine

**Purpose**: Time blocking and event management

**Integrations**:
- Calendar density affects automation recommendations
- Hub-specific events link to hub performance
- Time blocks generated by AI planner
- Event load influences energy recommendations
- Conflicts trigger alerts

**Data Flow**:
```
Event Created → Calendar Density Analyzed → data-flow-processor → Time Blocking Recommendations
```

**Edge Functions**:
- `data-flow-processor` (calendar_event flow)
- `calendar-autofill` - AI time blocking

**Automation Triggers**:
- Density > 8 events: Overload warning
- Density < 3 events: Free time suggestion
- Conflicting events: Schedule alert

**UI Components**:
- `Calendar` page - Event management
- `Planner` page - Time blocking
- Calendar integration in Dashboard

---

### 9. Notifications System

**Purpose**: Intelligent alerts and reminders

**Integrations**:
- Connected to ALL modules
- Triggered by automation rules
- AI-generated messages
- User preference-based filtering
- Rate limiting to prevent overload

**Data Flow**:
```
Any Module Event → notification-generator → Rule Evaluation → Notification Created → UI Badge/List
```

**Edge Functions**:
- `notification-generator` - Create notifications
- `notification-processor` - Handle actions (read/resolve/delete)

**Notification Types**:
1. Performance Drop Alerts
2. Positive Growth Alerts
3. Habit Reminders
4. Project/Task Alerts
5. Calendar Alerts
6. Life Event Alerts
7. Weekly/Monthly Reports
8. Ultra State Alerts

**UI Components**:
- `NotificationBell` - Badge counter
- `Notifications` page - Full list
- `NotificationSettings` - User preferences

---

### 10. Analytics Engine

**Purpose**: Cross-module insights and correlations

**Integrations**:
- Aggregates data from all modules
- Calculates correlations
- Visualizes trends
- Identifies patterns
- Supports predictive insights

**Data Flow**:
```
All Modules → Data Aggregation → Statistical Analysis → Visualization Components
```

**Features**:
- Hub balance radar chart
- Ultra Score trend line
- Habit streak bar chart
- Performance correlations
- Predictive forecasting

**UI Components**:
- `CrossModuleAnalytics` - Main dashboard
- `Analytics` page - Detailed view
- Charts using Recharts library

---

## Data Flow Integration Examples

### Example 1: Log Entry Creation

```typescript
// User creates a log entry
1. POST /logs
   - user_id, hub_id, value, log_date

2. data-flow-processor triggered
   - flow_type: 'log_created'
   - Calculates 7-day average for hub
   - Updates metrics table

3. calculate-ultra-score invoked
   - Aggregates all hub scores
   - Calculates ULTRA Score
   - Updates ultra_metrics

4. notification-generator invoked
   - Checks if score dropped
   - Creates notification if threshold met

5. UI auto-refreshes
   - Dashboard updates
   - AI insights regenerated
```

### Example 2: Habit Check-in

```typescript
// User checks in a habit
1. POST /habits/checkin
   - habit_id, date, done: true

2. Streak calculation
   - If consecutive: streak++
   - If broken: streak = 0

3. data-flow-processor triggered
   - flow_type: 'habit_checkin'
   - Evaluates streak significance

4. Notification created (if applicable)
   - Milestone streak: Positive alert
   - Broken streak: Recovery suggestion

5. evaluate-automation invoked
   - Recalculates habit consistency factor
   - Updates Ultra Score

6. UI updates
   - Habit card shows new streak
   - Notification badge increments
```

### Example 3: Project Task Completion

```typescript
// User marks task as done
1. PATCH /tasks/{id}
   - status: 'Done'

2. Project health recalculated
   - tasks_completed / tasks_total * 100

3. data-flow-processor triggered
   - flow_type: 'project_updated'
   - Updates Work hub metric

4. calculate-ultra-score invoked
   - Work hub score affects ULTRA Score

5. Notifications checked
   - If all tasks done: Milestone alert
   - If overdue tasks remaining: Warning

6. AI insights refreshed
   - New recommendations based on progress
```

---

## Cross-Module Intelligence

### Daily Insights Generation

The `ai-insights-engine` combines data from:

1. **Ultra Metrics**: Current score + 7-day trend
2. **Hub Metrics**: Weakest/strongest identification
3. **Habits**: Streak status + consistency
4. **Projects**: Active count + overdue tasks
5. **Calendar**: Event density
6. **Logs**: Recent activity level

**AI Prompt Structure**:
```
System: You are an AI life coach...
User: 
- Ultra Score: 67 (+3.2 this week)
- Weakest Hub: Health (42/100)
- Broken Streaks: 1
- Overdue Tasks: 3
- Today Events: 5

→ Generate personalized insights
```

**Output** (via tool calling):
```json
{
  "daily_focus": "Prioritize health recovery today",
  "primary_action": "Complete 30-minute workout",
  "secondary_actions": ["Meal prep", "Sleep 8 hours"],
  "weakest_area": "Health",
  "weakest_area_advice": "Start with light exercise...",
  "strengths": ["Work consistency", "Strong social connections"],
  "mood_prediction": "challenged",
  "energy_recommendation": "balance",
  "weekly_theme": "Health Recovery"
}
```

---

## API Endpoint Summary

### Users
- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`

### Hubs
- `GET /hubs`
- `GET /hubs/:code`

### Logs
- `GET /logs`
- `POST /logs` → Triggers data-flow-processor
- `PATCH /logs/:id`
- `DELETE /logs/:id`

### Metrics
- `GET /metrics`
- `POST /metrics`

### Ultra Metrics
- `GET /ultra-metrics`
- `GET /ultra/score`

### Habits
- `GET /habits`
- `POST /habits`
- `POST /habits/checkin` → Triggers data-flow-processor

### Projects
- `GET /projects`
- `POST /projects`
- `PATCH /projects/:id` → Triggers data-flow-processor

### Calendar
- `GET /calendar-entries`
- `POST /calendar-entries` → Triggers data-flow-processor

### Automation
- `GET /automation/evaluate`
- `GET /automation/rules`

### Notifications
- `GET /notifications`
- `POST /notifications/generate`
- `PATCH /notifications/:id/read`

### AI Insights
- `POST /ai-insights-engine`

### Data Flows
- `POST /data-flow-processor`

---

## Edge Function Architecture

### Function Hierarchy

```
┌─────────────────────────────────────────┐
│     User Actions (UI)                   │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│   data-flow-processor (Orchestrator)    │
│   - Handles all cross-module triggers   │
└─────────────────────────────────────────┘
            ↓           ↓           ↓
┌─────────────┐ ┌────────────┐ ┌──────────────┐
│ calculate-  │ │notification│ │evaluate-     │
│ ultra-score │ │-generator  │ │automation    │
└─────────────┘ └────────────┘ └──────────────┘
            ↓
┌─────────────────────────────────────────┐
│   ai-insights-engine                    │
│   - Lovable AI integration              │
└─────────────────────────────────────────┘
```

### Function Communication

Functions communicate via:
1. **Direct invocation**: `supabase.functions.invoke('function-name')`
2. **Shared database**: All read/write to same PostgreSQL
3. **Event queueing**: `automation_action_queue` table

---

## UI Component Hierarchy

### Dashboard (Homepage)

```
Dashboard
├── AICoachCard (Primary)
│   ├── Daily Focus
│   ├── Primary Action
│   ├── Secondary Actions
│   ├── Weakest Area
│   ├── Strengths
│   └── Mood/Energy Indicators
├── Ultra Score Card
├── System Status Card
├── Hub Grid (9 tiles)
├── Priority Hub Card
└── Recent Activity Feed
```

### Navigation Structure

```
Main Nav
├── Dashboard (/)
├── Ultra Hub (/ultra)
├── Hubs Dropdown
│   ├── Finance (/hubs/FIN)
│   ├── Health (/hubs/HEA)
│   ├── Work (/hubs/WOR)
│   ├── Academy (/hubs/ACA)
│   ├── Personal Dev (/hubs/PER)
│   ├── Household (/hubs/HOU)
│   ├── Relationships (/hubs/REL)
│   ├── Projects (/hubs/PRO)
│   └── Mindset (/hubs/MIN)
├── Projects (/projects)
├── Habits (/habits)
├── Calendar (/calendar)
├── Logs (/logs)
├── Analytics (/analytics)
├── Notifications (/notifications)
├── Automation (/automation-settings)
└── Settings (/settings)
```

---

## State Management

### React Query Keys

```typescript
['ultra-metrics'] // Ultra Score data
['metrics'] // Hub scores
['logs'] // Log entries
['habits'] // Habit list + checkins
['projects'] // Projects + tasks
['calendar-entries'] // Calendar events
['automation-engine'] // Automation state
['ai-insights'] // AI-generated insights
['notifications'] // Notification list
['notifications-unread-count'] // Badge counter
```

### Automatic Invalidation

When data changes, relevant queries are automatically invalidated:

```typescript
// After log creation
queryClient.invalidateQueries(['metrics'])
queryClient.invalidateQueries(['ultra-metrics'])
queryClient.invalidateQueries(['ai-insights'])

// After habit check-in
queryClient.invalidateQueries(['habits'])
queryClient.invalidateQueries(['notifications'])

// After project update
queryClient.invalidateQueries(['projects'])
queryClient.invalidateQueries(['metrics'])
```

---

## Security & Access Control

### Row Level Security (RLS)

All tables enforce user isolation:

```sql
-- Example RLS policy
CREATE POLICY "Users can view own logs"
  ON logs FOR SELECT
  USING (auth.uid() = user_id);
```

### Edge Function Authentication

All edge functions validate user:

```typescript
const { data: { user }, error } = await supabase.auth.getUser(authHeader);
if (!user) throw new Error('Unauthorized');
```

---

## Performance Optimizations

### 1. Database Indexes

```sql
CREATE INDEX idx_metrics_user_date ON metrics(user_id, metric_date DESC);
CREATE INDEX idx_logs_user_hub ON logs(user_id, hub_id);
CREATE INDEX idx_ultra_metrics_user_name_date ON ultra_metrics(user_id, name, metric_date DESC);
```

### 2. Query Caching

React Query caches responses with:
- `staleTime: 5 minutes` for AI insights
- `staleTime: 1 minute` for automation state
- Automatic background refetch

### 3. Pagination

All list endpoints support `limit` and `offset`:

```typescript
const { data } = await supabase
  .from('logs')
  .select('*')
  .range(0, 49) // First 50 results
```

### 4. Rate Limiting

Notification generation limited to 3 per hour per user to prevent spam.

---

## Testing Strategy

### Unit Tests

```bash
# Test individual edge functions
deno test supabase/functions/*/index.test.ts

# Test React components
npm run test
```

### Integration Tests

```bash
# Test full data flows
npm run test:integration
```

### E2E Tests

```bash
# Test complete user journeys
npx playwright test
```

---

## Deployment

### Continuous Deployment

1. Code pushed to `main` branch
2. GitHub Actions triggers
3. Supabase functions deployed automatically
4. Frontend built and deployed to Vercel/Netlify
5. Database migrations applied

### Monitoring

- Edge function logs: Supabase dashboard
- Frontend errors: Sentry (future)
- Performance: Web Vitals (future)

---

## Future Enhancements

1. **Weekly/Monthly Reports** - AI-generated summaries
2. **Export Center** - PDF/CSV/Excel exports
3. **Mobile App** - React Native implementation
4. **Webhook Integrations** - Connect external tools
5. **Team Features** - Multi-user workspaces
6. **Advanced Analytics** - Predictive modeling

---

## Conclusion

LifeOS v30 is a fully integrated personal operating system where every module communicates with others, data flows trigger automatic calculations, AI provides personalized insights, and the UI updates in real-time. The system is built on a solid foundation of Supabase (database + edge functions), React (UI), React Query (state management), and Lovable AI (intelligence), creating a cohesive and powerful life management platform.

For detailed technical documentation on specific modules, see:
- [Database Architecture](./DATABASE_ARCHITECTURE.md)
- [Automation Engine](./AUTOMATION_ENGINE_COMPLETE.md)
- [Security Architecture](./SECURITY_ARCHITECTURE.md)
- [Testing & Observability](./TESTING_OBSERVABILITY_ARCHITECTURE.md)
