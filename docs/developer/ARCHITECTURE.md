# LifeOS Architecture Overview

## System Architecture

LifeOS is a full-stack Life Operating System built with:

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: JWT-based auth via Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase PostgreSQL
- **Compute**: Deno-based Edge Functions

```
┌──────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                         │
│  React + TypeScript + Tailwind + React Query             │
│  • Dashboard • Hubs • Automation • Projects • Habits     │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ HTTPS / WebSocket
                   │
┌──────────────────▼───────────────────────────────────────┐
│                   EDGE FUNCTIONS LAYER                    │
│  Deno/TypeScript Serverless Functions                    │
│  • calculate-ultra-score                                 │
│  • evaluate-automation                                   │
│  • data-flow-processor                                   │
│  • automation-trigger                                    │
│  • generate-daily-insight (AI)                           │
│  • calendar-autofill                                     │
│  • notification-generator                                │
└──────────────────┬───────────────────────────────────────┘
                   │
                   │ Service Role Key
                   │
┌──────────────────▼───────────────────────────────────────┐
│                    DATABASE LAYER                         │
│  PostgreSQL with Row-Level Security                      │
│  • 32+ normalized tables                                 │
│  • RLS policies for multi-tenant isolation               │
│  • Helper functions for RBAC                             │
│  • Triggers for automated workflows                      │
└──────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

1. **Users & Authentication**
   - `profiles` - User profiles (no auth.users references)
   - `user_roles` - App-level roles (owner, admin, member, viewer, guest)
   - `security_settings` - Security preferences per user

2. **Multi-Tenancy**
   - `tenants` - Workspaces/organizations
   - `memberships` - User-tenant relationships with roles

3. **Life Tracking**
   - `logs` - Activity logs across all hubs
   - `metrics` - Calculated hub scores
   - `ultra_metrics` - Ultra domain scores

4. **Ultra System**
   - `ultra_domains` - 7 life domains (Spirituality, Career, Social, etc.)
   - `hubs` - 9 life hubs (Finance, Health, Work, Academy, etc.)

5. **Habits & Projects**
   - `habits` - User habits
   - `habit_checkins` - Daily check-ins
   - `projects` - User projects
   - `tasks` - Project tasks

6. **Calendar**
   - `calendar_entries` - Time blocks and events

7. **Automation**
   - `automation_rules` - Global automation rules
   - `automation_executions` - Rule execution history
   - `automation_logs` - Execution logs
   - `automation_action_queue` - Pending actions
   - `auto_actions` - User-facing suggested actions

8. **Notifications**
   - `notifications` - User notifications
   - `notification_preferences` - User preferences

9. **System**
   - `system_state_daily` - Daily system state snapshots
   - `state_warnings` - User warnings
   - `audit_logs` - Security audit trail

### Entity Relationships

```
profiles (1) ──── (∞) user_roles
profiles (1) ──── (∞) memberships ──── (1) tenants
profiles (1) ──── (∞) logs ──── (1) hubs
profiles (1) ──── (∞) metrics ──── (1) hubs
profiles (1) ──── (∞) ultra_metrics ──── (1) ultra_domains
profiles (1) ──── (∞) habits ──── (∞) habit_checkins
profiles (1) ──── (∞) projects ──── (∞) tasks
profiles (1) ──── (∞) calendar_entries
profiles (1) ──── (∞) notifications
```

---

## Edge Functions

### Primary Functions

| Function | Purpose | Auth Required |
|----------|---------|---------------|
| `calculate-ultra-score` | Compute ULTRA Score from domain metrics | ✅ Yes |
| `evaluate-automation` | Evaluate all rules and return system state | ✅ Yes |
| `data-flow-processor` | Orchestrate cross-module recalculations | ✅ Yes |
| `automation-trigger` | Central event dispatcher | ✅ Yes |
| `generate-daily-insight` | AI-powered daily coaching | ✅ Yes |
| `generate-weekly-review` | Weekly summary generation | ✅ Yes |
| `generate-monthly-insights` | Monthly analysis | ✅ Yes |
| `calendar-autofill` | Auto-generate time blocks | ✅ Yes |
| `system-validate` | System diagnostics | ✅ Yes |
| `automation-rebalance` | Task rebalancing logic | ✅ Yes |
| `notification-generator` | Create notifications | ✅ Yes |

### Function Flow Example

```
User creates log
    │
    ├─> Frontend: POST to /logs table (RLS enforced)
    │
    ├─> Frontend: Invoke data-flow-processor
    │        │
    │        ├─> Extract user_id from JWT
    │        ├─> Validate input with Zod
    │        ├─> Call calculate-ultra-score
    │        │        │
    │        │        └─> Recalculate domain scores
    │        │
    │        ├─> Call evaluate-automation
    │        │        │
    │        │        ├─> Evaluate rules
    │        │        ├─> Determine system state
    │        │        └─> Create auto_actions
    │        │
    │        └─> Call notification-generator
    │                 │
    │                 └─> Create notifications
    │
    └─> Frontend: React Query invalidates cache, UI updates
```

---

## Frontend Architecture

### Page Structure

```
/auth              - Login/signup
/                  - Dashboard (Ultra Score, insights, hub grid)
/ultra-hub         - 7 Ultra Domains visualization
/logs              - Activity feed
/projects          - Project management (Kanban/List)
/habits            - Habit tracking
/calendar          - Calendar view
/automation        - Automation rules management
/insights          - Weekly/monthly insights
/notifications     - Notification center
/settings          - User settings
/admin             - Admin panel (owners/admins only)
```

### Component Library

- **Score Components**: `ScoreRing`, `ScoreCard`, `KPICard`
- **Hub Components**: `HubTile`, `UltraDomainTile`, `StatePill`
- **Automation Components**: `StateBadge`, `PriorityHubCard`, `StateCard`
- **UI Components**: shadcn/ui components (Button, Card, Dialog, etc.)

### State Management

- **React Query** for server state (caching, invalidation)
- **Local state** with React hooks
- **Real-time subscriptions** via Supabase Realtime

---

## Data Flow Patterns

### 1. Log Creation Flow

```
User creates log
  → Frontend validates input
  → Insert into logs table (RLS filters by user_id)
  → Invoke data-flow-processor
    → Recalculate hub scores
    → Recalculate Ultra Score
    → Evaluate automation rules
    → Create notifications
  → React Query invalidates cache
  → UI updates automatically
```

### 2. Habit Check-in Flow

```
User checks in habit
  → Frontend validates input
  → Insert into habit_checkins table
  → Update habit.streak
  → Invoke automation-trigger (habit_checkin)
    → Recalculate consistency factor
    → Update Ultra Score
    → Evaluate milestone rules
    → Create celebration notification
  → UI shows success animation
```

### 3. Automation Evaluation Flow

```
Dashboard loads
  → Frontend: Invoke evaluate-automation
    → Backend: Get latest metrics
    → Backend: Get all active rules
    → Backend: Evaluate conditions
    → Backend: Determine system state
    → Backend: Identify priority hub
    → Backend: Generate recommendations
  → Frontend: Display state badge
  → Frontend: Show priority hub card
  → Frontend: Render suggested actions
```

---

## Security Architecture

See [SECURITY_GUIDE.md](./SECURITY_GUIDE.md) for detailed security documentation.

### Key Security Layers

1. **JWT Authentication** - All edge functions require valid JWT
2. **Row-Level Security** - PostgreSQL policies enforce data isolation
3. **Input Validation** - Zod schemas validate all inputs
4. **Rate Limiting** - Prevent abuse via cache-based limits
5. **Audit Logging** - Track all privileged operations
6. **Multi-Tenant Isolation** - Strict tenant boundaries

---

## Deployment Architecture

### Environments

- **Development**: Local Supabase + React dev server
- **Staging**: Supabase Cloud (test project)
- **Production**: Supabase Cloud (main project)

### CI/CD Pipeline

```
Git Push to main
    │
    ├─> GitHub Actions
    │    │
    │    ├─> Lint (ESLint, Prettier)
    │    ├─> Test (Vitest, Playwright)
    │    ├─> Build (Vite)
    │    └─> Deploy to Staging
    │
    ├─> Manual Approval
    │
    └─> Deploy to Production
         │
         ├─> Deploy Edge Functions
         ├─> Run Migrations
         └─> Deploy Frontend (Vercel/Netlify)
```

---

## Performance Optimization

### Caching Strategy

- **React Query**: 5min stale time for dashboard data
- **Edge Functions**: Cache Ultra Score (30sec TTL)
- **Database**: Indexed on user_id, tenant_id, date fields
- **Frontend**: Service worker caching for static assets

### Database Indexes

```sql
-- Critical indexes for performance
CREATE INDEX idx_logs_user_date ON logs(user_id, log_date DESC);
CREATE INDEX idx_metrics_user_hub ON metrics(user_id, hub_id, metric_date DESC);
CREATE INDEX idx_ultra_metrics_user_domain ON ultra_metrics(user_id, domain_id, metric_date DESC);
CREATE INDEX idx_habits_user ON habits(user_id, last_checkin DESC);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);
CREATE INDEX idx_automation_rules_active ON automation_rules(is_active);
```

---

## Monitoring & Observability

### Logging

- **Edge Functions**: Structured JSON logs with request_id
- **Frontend**: Error boundary with Sentry integration
- **Database**: Slow query logging (>1sec)

### Metrics

- **Request counts** per edge function
- **Error rates** per endpoint
- **Latency** (p50, p95, p99)
- **Cache hit rates**

### Alerting

- Error rate > 1% (5min window)
- Response time > 3sec (p95)
- Database connection pool exhaustion
- Failed authentication spike

---

## Future Architecture Considerations

### Scalability

- Read replicas for database scaling
- CDN for frontend assets
- Redis for distributed caching
- Message queue for async jobs (Celery/BullMQ)

### Features

- Real-time collaboration (multi-user editing)
- Mobile apps (React Native)
- Offline-first with sync (PouchDB/CouchDB)
- GraphQL API layer (Hasura)
- Webhook system for integrations
- Plugin architecture for extensibility
