# LifeOS v30 - Complete Frontend Navigation & Screen Architecture

## Application Structure

### Route Hierarchy

```
/ (redirect to /dashboard)
/auth (public)
/dashboard (protected) ✓ IMPLEMENTED
/ultra (protected) ✓ IMPLEMENTED
/hubs/:hubCode (protected) - COMING SOON
/projects (protected) ✓ IMPLEMENTED
/habits (protected) ✓ IMPLEMENTED
/calendar (protected) ✓ IMPLEMENTED
/logs (protected) ✓ IMPLEMENTED
/automation (protected) ✓ IMPLEMENTED
/automation-rules (protected) ✓ IMPLEMENTED
/automation-diagnostics (protected) ✓ IMPLEMENTED
/states-engine (protected) ✓ IMPLEMENTED
/insights (protected) ✓ IMPLEMENTED
/settings (protected) ✓ IMPLEMENTED
/reports (protected) - COMING SOON
```

## Navigation Components

### Primary Navigation (Sidebar)

**Main Section**
- Command Center → /dashboard
- Ultra Hub → /ultra

**Life Hubs Section** (9 items)
- Finance → /hubs/finance
- Health → /hubs/health
- Work → /hubs/work
- Academy → /hubs/academy
- Personal Dev → /hubs/personal-dev
- Household → /hubs/household
- Relationships → /hubs/relationships
- Projects Hub → /hubs/projects
- Mindset → /hubs/mindset

**Tools Section**
- Projects → /projects
- Calendar → /calendar
- Habits → /habits
- Logs → /logs

**System Section**
- States Engine → /states-engine
- Diagnostics → /automation-diagnostics
- Reports → /reports
- Automation → /automation
- Rule Builder → /automation-rules
- Insights → /insights
- Settings → /settings

## Implemented Pages Status

### ✓ Dashboard (Command Center)
**Components:**
- KPI cards (ULTRA Score, Daily Score, Weakest Hub, Priority Focus)
- Daily timeline
- Ultra insight panel
- Quick actions
- State badge

**Data Sources:**
- `useAutomationEngine()` hook
- `useDailyInsight()` hook
- Real-time metrics

### ✓ Ultra Hub
**Components:**
- ULTRA Score ring
- 7 Domain tiles with scores
- Trend indicators
- Domain detail modals

**Data Sources:**
- `/ultra_metrics` table
- Domain scores calculation

### ✓ Projects Manager
**Components:**
- Kanban board (Not Started, In Progress, Completed)
- Task cards
- Priority badges
- Due date indicators

**Data Sources:**
- `/projects` and `/tasks` tables
- Hub relationships

### ✓ Habits Engine
**Components:**
- Habit list with streaks
- Check-in calendar heatmap
- Streak counters
- Last check-in dates

**Data Sources:**
- `/habits` and `/habit_checkins` tables

### ✓ Calendar
**Components:**
- Month/week/day views
- Time blocks
- Focus domain indicators
- Event creation modal

**Data Sources:**
- `/calendar_entries` table
- Hub relationships

### ✓ Logs System
**Components:**
- Master log table
- Filters (hub, date range, source)
- Quick-add forms
- Notes display

**Data Sources:**
- `/logs` table
- Hub relationships

### ✓ Automation Control Center
**Components:**
- System status overview
- Control panel (validate, rebalance, generate)
- Auto-generated actions list
- System warnings
- Active rules display

**Data Sources:**
- `evaluate-automation` function
- `/auto_actions` table
- `/state_warnings` table

### ✓ Automation Rules Builder
**Components:**
- Rule list with activation toggles
- Rule creation form
- Condition type selector
- Action target configuration
- Test execution button
- Execution history timeline

**Data Sources:**
- `/automation_rules` table
- `/automation_executions` table

### ✓ Automation Diagnostics
**Components:**
- Daily intelligence brief
- ULTRA Score gauge
- System state indicator
- Priority level badge
- Weakest hub/domain cards
- Triggered rules list
- Recommended actions
- Metrics snapshot
- Hub scores breakdown

**Data Sources:**
- `automation-evaluator` function

### ✓ States Engine Dashboard
**Components:**
- ULTRA Score ring
- Overall state classification
- Weakest hub identification
- Priority hub card
- Recommended actions list
- System metrics grid
- Opportunities/risks
- Manual execution button

**Data Sources:**
- `evaluate-automation` function

### ✓ Insights
**Data Sources:**
- `generate-daily-insight` function

### ✓ Settings
**Components:**
- Profile management
- Theme settings
- Account options

## Reusable Component Library

### Score Components ✓
- `ScoreRing`: Circular progress indicator
- `ScoreCard`: Score display with label
- `KPICard`: Key performance indicator card

### State Components ✓
- `StateBadge`: Dynamic state indicator
- `StateCard`: Full state display
- `PriorityCard`: Priority information card
- `WeakestCard`: Weakest hub display

### Automation Components ✓
- `RuleExecutionTimeline`: Execution history
- `ConditionsMatrix`: Condition evaluation display

### Data Components (Implemented in pages)
- Log tables with filters
- Habit tracking lists
- Project kanban boards
- Task cards
- Calendar grids

## UI/UX Patterns

### Loading States
- Skeleton loaders for all async content
- Spinner for actions
- Toast notifications for feedback

### Error Handling
- Alert components for errors
- Inline validation messages
- Toast notifications for failures

### Real-time Updates
- React Query auto-refetch (30-60s intervals)
- Manual refresh buttons
- Optimistic updates

### Responsive Design
- Mobile-first approach
- Collapsible sidebar
- Adaptive layouts
- Touch-friendly interactions

## Data Flow Architecture

```
User Action
  ↓
React Component
  ↓
TanStack Query Hook
  ↓
Supabase Client
  ↓
[Database OR Edge Function]
  ↓
Response
  ↓
Cache Update
  ↓
UI Re-render
```

## State Management

- **Server State**: TanStack Query (React Query)
- **Client State**: React useState/useReducer
- **Form State**: React Hook Form (where needed)
- **URL State**: React Router params/search

## Performance Optimizations

- Query caching (TanStack Query)
- Lazy loading (React.lazy)
- Code splitting (Vite)
- Debounced inputs
- Memoized calculations
- Virtualized lists (for large datasets)