# LifeOS v30 - Complete System Architecture

## System Overview

LifeOS v30 is a comprehensive Life Operating System that transforms personal productivity through intelligent automation, state-based decision making, and holistic life domain tracking across 7 Ultra Domains and 9 Life Hubs.

## Core Architecture Layers

### Layer 1: Data Layer
- **Database**: Supabase PostgreSQL
- **Tables**: 15+ normalized tables
- **Relationships**: Fully typed foreign keys
- **RLS**: Row-level security on all user data

### Layer 2: Business Logic Layer
- **Edge Functions**: 8 serverless functions
- **Automation Engine**: Rule-based intelligent system
- **States Engine**: Real-time state classification
- **Score Calculator**: Multi-domain scoring system

### Layer 3: API Layer
- **RESTful**: Supabase auto-generated
- **Edge Functions**: Custom business logic
- **Real-time**: WebSocket subscriptions
- **Caching**: Context cache optimization

### Layer 4: Application Layer
- **Framework**: React 18 + TypeScript
- **Routing**: React Router v6
- **State**: TanStack Query
- **UI**: Shadcn/ui + Tailwind CSS

### Layer 5: Intelligence Layer
- **Automation Rules**: Dynamic condition evaluation
- **AI Insights**: Daily coaching
- **Predictive**: Trend forecasting
- **Recommendations**: Context-aware actions

## System Entity Graph

### Core Entities

```
users (auth.users)
  ↓
profiles
  ├→ ultra_metrics (ULTRA Score + 7 domains)
  ├→ metrics (9 hub scores)
  ├→ logs (activity entries)
  ├→ habits
  │   └→ habit_checkins
  ├→ projects
  │   └→ tasks
  ├→ calendar_entries
  ├→ auto_actions
  ├→ state_warnings
  └→ system_state_daily

hubs (reference data)
  ├→ metrics
  ├→ logs
  ├→ calendar_entries
  └→ projects

ultra_domains (reference data)
  ├→ ultra_metrics
  └→ auto_actions

automation_rules
  ├→ automation_rule_conditions
  ├→ automation_rule_actions
  └→ automation_executions

automation_context_cache
```

### Entity Relationships

**One-to-Many:**
- users → profiles (1:1)
- users → ultra_metrics (1:N)
- users → metrics (1:N)
- users → logs (1:N)
- users → habits (1:N)
- habits → habit_checkins (1:N)
- users → projects (1:N)
- projects → tasks (1:N)
- users → calendar_entries (1:N)
- automation_rules → automation_rule_conditions (1:N)
- automation_rules → automation_rule_actions (1:N)

**Many-to-One:**
- logs → hubs (N:1)
- metrics → hubs (N:1)
- ultra_metrics → ultra_domains (N:1)
- auto_actions → hubs (N:1, optional)
- auto_actions → ultra_domains (N:1, optional)

## Complete Entity Definitions

### profiles
```typescript
{
  id: uuid (PK, FK to auth.users)
  full_name: text
  role: text (default: 'Owner')
  created_at: timestamptz
  updated_at: timestamptz
}
```

### ultra_metrics
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  metric_date: date
  name: text ('ULTRA_Score' | domain names)
  value: numeric (0-100)
  domain_id: bigint (FK, nullable)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### metrics
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  hub_id: bigint (FK, nullable)
  metric_date: date
  name: text (metric type)
  value: numeric
  created_at: timestamptz
  updated_at: timestamptz
}
```

### logs
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  hub_id: bigint (FK, nullable)
  log_date: date
  source: text (log category)
  metric: text (nullable)
  value: numeric (nullable)
  notes: text (nullable)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### habits
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  name: text
  description: text (nullable)
  streak: integer (default: 0)
  last_checkin: date (nullable)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### habit_checkins
```typescript
{
  id: bigint (PK)
  habit_id: bigint (FK)
  date: date
  done: boolean (default: true)
  created_at: timestamptz
}
```

### projects
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  hub_id: bigint (FK, nullable)
  title: text
  status: text (default: 'Not Started')
  priority: text (default: 'Medium')
  due_date: date (nullable)
  sprint: text (nullable)
  notes: text (nullable)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### tasks
```typescript
{
  id: bigint (PK)
  project_id: bigint (FK)
  title: text
  description: text (nullable)
  status: text (default: 'Not Started')
  priority: text (default: 'Medium')
  importance: integer (default: 1)
  due_date: date (nullable)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### calendar_entries
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  hub_id: bigint (FK, nullable)
  date: date
  title: text
  description: text (nullable)
  start_time: text (nullable)
  end_time: text (nullable)
  focus_domain: text (nullable)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### hubs (reference)
```typescript
{
  id: bigint (PK)
  code: text (unique)
  name: text
  category: text (nullable)
  is_active: boolean (default: true)
  created_at: timestamptz
}
```

### ultra_domains (reference)
```typescript
{
  id: bigint (PK)
  code: text (unique)
  name: text
  description: text (nullable)
  created_at: timestamptz
}
```

### automation_rules
```typescript
{
  id: bigint (PK)
  name: text
  description: text (nullable)
  condition_type: text
  condition_value: numeric (nullable)
  action_target: text
  action_value: text (nullable)
  is_active: boolean (default: true)
  created_at: timestamptz
  updated_at: timestamptz
}
```

### automation_rule_conditions
```typescript
{
  id: bigint (PK)
  rule_id: bigint (FK)
  condition_type: text
  metric_name: text (nullable)
  operator: text
  threshold_value: numeric (nullable)
  comparison_window: integer (default: 1)
  created_at: timestamptz
}
```

### automation_rule_actions
```typescript
{
  id: bigint (PK)
  rule_id: bigint (FK)
  action_type: text
  action_payload: jsonb (nullable)
  priority: integer (default: 1)
  created_at: timestamptz
}
```

### automation_executions
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  rule_id: bigint (FK, nullable)
  execution_date: timestamptz
  trigger_type: text
  conditions_met: jsonb (nullable)
  actions_executed: jsonb (nullable)
  execution_result: text
  created_at: timestamptz
}
```

### auto_actions
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  hub_id: bigint (FK, nullable)
  domain_id: bigint (FK, nullable)
  action_date: date
  action_type: text
  action_text: text
  priority: integer (default: 1)
  status: text (default: 'pending')
  completed_at: timestamptz (nullable)
  created_at: timestamptz
}
```

### state_warnings
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  warning_type: text
  warning_text: text
  severity: text (default: 'medium')
  related_hub_id: bigint (FK, nullable)
  related_habit_id: bigint (FK, nullable)
  related_project_id: bigint (FK, nullable)
  dismissed: boolean (default: false)
  dismissed_at: timestamptz (nullable)
  created_at: timestamptz
}
```

### system_state_daily
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  state_date: date
  ultra_score: numeric
  state: text
  priority_zone: text (nullable)
  weakest_hub_id: bigint (FK, nullable)
  strongest_hub_id: bigint (FK, nullable)
  state_reasons: jsonb (nullable)
  created_at: timestamptz
}
```

### automation_context_cache
```typescript
{
  id: bigint (PK)
  user_id: uuid (FK)
  cache_key: text
  cache_value: jsonb
  expires_at: timestamptz
  created_at: timestamptz
  UNIQUE(user_id, cache_key)
}
```

## Database Normalization Compliance

### First Normal Form (1NF) ✓
- All tables have atomic values
- No repeating groups
- Each cell contains single value
- Each record is unique (PK)

### Second Normal Form (2NF) ✓
- Meets 1NF requirements
- All non-key attributes fully depend on PK
- No partial dependencies

### Third Normal Form (3NF) ✓
- Meets 2NF requirements
- No transitive dependencies
- All non-key attributes depend only on PK

### Boyce-Codd Normal Form (BCNF) ✓
- Meets 3NF requirements
- Every determinant is a candidate key
- No anomalies in current schema

## Foreign Key Constraints

All relationships properly enforced:
- CASCADE on user deletion (user owns all data)
- CASCADE on parent record deletion
- SET NULL for optional relationships
- Proper indexing on all FK columns

## Computed Fields Strategy

Computed values NOT stored, calculated on-demand:
- ULTRA Score (via `calculate-ultra-score`)
- Hub States (via `evaluate-automation`)
- Priority calculations (real-time)
- Trend analysis (windowed queries)
- Weakest/Strongest hubs (aggregation)

## Index Strategy

Primary indexes:
- All primary keys (automatic)
- All foreign keys (explicit)
- Date fields used in queries
- User lookup fields
- Cache key combinations

## Data Integrity Rules

1. **User Isolation**: All user data filtered by `auth.uid()`
2. **Date Validation**: All dates validated on insert
3. **Score Ranges**: 0-100 enforced in application
4. **Status Enums**: Validated via application logic
5. **Required Fields**: NOT NULL constraints
6. **Unique Constraints**: Applied where needed
7. **Check Constraints**: Avoided (use triggers)

## Naming Conventions

### Tables
- `snake_case`
- Plural nouns for collections
- Singular for reference data
- Descriptive, not abbreviated

### Columns
- `snake_case`
- Descriptive names
- Suffixes: `_id` (FK), `_at` (timestamps), `_date` (dates)
- Booleans: `is_`, `has_`, `should_`

### Foreign Keys
- Format: `fk_<table>_<column>`
- Always indexed
- Clearly indicates relationship

### Indexes
- Format: `idx_<table>_<column(s)>`
- Compound: `idx_<table>_<col1>_<col2>`
- Unique: `unique_<table>_<column>`

## Reference Data

### Hubs (9)
1. Finance (`FINANCE`)
2. Health (`HEALTH`)
3. Work (`WORK`)
4. Academy (`ACADEMY`)
5. Personal Development (`PERSONAL_DEV`)
6. Household (`HOUSEHOLD`)
7. Relationships (`RELATIONSHIPS`)
8. Projects (`PROJECTS`)
9. Mindset (`MINDSET`)

### Ultra Domains (7)
1. Spirituality (`SPIRITUALITY`)
2. Career Mastery (`CAREER_MASTER`)
3. Social Life (`SOCIAL_LIFE`)
4. Emotional Intelligence (`EMOTIONAL_INTELLIGENCE`)
5. Personal Branding & Online Influence (`PERSONAL_BRANDING`)
6. Fitness Performance (`FITNESS_PERFORMANCE`)
7. Dating & Attraction (`DATING_ATTRACTION`)

## System Constants

### Score Ranges
- Minimum: 0
- Maximum: 100
- Default: 50

### State Classifications
- Critical: 0-20
- Danger: 21-40
- Weak: 41-55
- Stable: 56-70
- Good: 71-80
- Excellent: 81-90
- Elite: 91-100

### Priority Levels
- Low: 0-50
- Medium: 51-100
- High: 101-200
- Emergency: 200+

### Status Values
- Tasks/Projects: Not Started, In Progress, Completed, On Hold, Cancelled
- Actions: pending, in_progress, completed, dismissed
- Warnings: active, dismissed

## Migration Strategy

All schema changes via:
1. Supabase migrations
2. Version controlled
3. Forward-only (no rollbacks in prod)
4. Tested in development first
5. Applied during low-usage windows

## Backup Strategy

- Automated daily backups (Supabase)
- Point-in-time recovery available
- Export functionality for user data
- Audit logs for critical changes