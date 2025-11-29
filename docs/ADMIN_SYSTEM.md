# LifeOS Admin System

## Overview

The LifeOS Admin System provides a comprehensive control panel for platform administrators to manage users, monitor system health, and configure platform settings.

## Current Implementation (Phase 1)

### Database Layer

1. **Role System**
   - Extended `app_role` enum to include `admin` role
   - Added `is_admin()` security function for permission checks
   - Created `admin_settings` table for system configuration

2. **Admin Views**
   - `admin_user_stats`: Aggregates user metrics (total, new signups, tenant counts, subscription tiers)
   - `admin_metrics_overview`: Platform-wide metrics (logs, active users, Ultra scores, hubs)

### Backend Layer

1. **Security Functions**
   - `is_admin(_user_id)`: Checks if user has owner or admin role
   - RLS policies on `admin_settings` table restrict access to admins only

2. **Hooks**
   - `useAdminAccess()`: Client-side hook to check admin status
   - `useAdminUserStats()`: Fetches user statistics
   - `useAdminMetricsOverview()`: Fetches platform metrics

### Frontend Layer

1. **Admin Dashboard** (`/admin`)
   - Key metrics at-a-glance
   - User statistics (total, new signups by period)
   - Platform metrics (logs, active users, avg Ultra score)
   - Subscription breakdown
   - System status indicators
   - Quick action buttons
   - Recent activity feed

2. **Admin Layout**
   - Role-based access control
   - Beautiful access denied screen for non-admins
   - Clean, professional header

3. **Components**
   - `AdminLayout`: Wraps admin pages with security and layout
   - `AdminStatCard`: Displays key metrics with icons and trends

4. **Navigation**
   - Admin Panel link in sidebar (only visible to admins)
   - Highlighted with shield icon

## Security Features

### Role-Based Access Control (RBAC)

- Only users with `owner` or `admin` roles can access admin areas
- Server-side validation via `is_admin()` function
- Client-side protection via `useAdminAccess()` hook
- RLS policies enforce data isolation

### Audit Logging

- All admin actions logged to `audit_logs` table
- Tracks user_id, action type, timestamp, IP address

## Roadmap: Future Phases

### Phase 2: User Management
- Full user CRUD interface
- User search and filtering
- Role assignment UI
- Account suspension/activation
- Password reset functionality
- User detail pages with activity history

### Phase 3: Hub Management
- Create/edit/delete hubs
- Hub configuration (icons, colors, categories)
- Hub templates
- Dependency management

### Phase 4: Automation Manager
- Visual rule builder
- Rule testing/preview
- Execution logs
- Rule templates

### Phase 5: System Monitoring
- Real-time metrics dashboard
- Error logs viewer
- Performance analytics
- Alert configuration

### Phase 6: Billing & Subscriptions
- Subscription management
- Plan configuration
- Revenue analytics (MRR, ARR, churn)
- Invoice management

### Phase 7: Security Center
- Permission editor
- API key management
- OAuth configuration
- Security event monitoring
- IP whitelisting

### Phase 8: Database Tools
- Table browser
- Backup management
- Query executor (read-only)
- Schema viewer

### Phase 9: Developer Tools
- API key generator
- Webhook management
- API analytics
- Sandbox mode

### Phase 10: Content Management
- Template editor
- Notification templates
- Insight prompts
- Onboarding sequences

## Usage

### Accessing Admin Panel

1. User must have `owner` or `admin` role in `user_roles` table
2. Navigate to `/admin` route
3. Admin Panel link appears in sidebar for authorized users

### Granting Admin Access

```sql
-- Grant admin role to a user
INSERT INTO public.user_roles (user_id, role, assigned_by)
VALUES ('user-uuid-here', 'admin', 'assigner-user-uuid')
ON CONFLICT (user_id, role) DO NOTHING;
```

### Security Views

The admin views use standard views (not materialized) to ensure real-time data:
- Data aggregations happen at query time
- Access controlled via RLS and GRANT statements
- No sensitive individual user data exposed in aggregate views

## Architecture Decisions

1. **Separate Admin Area**: Admin features isolated in dedicated route and components
2. **Role-Based Security**: Server-side validation with client-side convenience checks
3. **Real-Time Metrics**: Views query live data for up-to-date statistics
4. **Extensible Design**: Modular structure allows easy addition of new admin features
5. **Audit Trail**: All admin actions logged for compliance and security

## Next Steps

To build the next phase of the admin system:

1. **User Management**: Create user list table, search/filter UI, user detail pages
2. **Role Assignment**: Build UI for managing user roles and permissions
3. **System Monitoring**: Add real-time charts and performance dashboards
4. **Automation Manager**: Visual rule builder with drag-and-drop interface

Each feature should follow the established patterns:
- Security-first design with RLS policies
- Server-side validation
- Client-side convenience hooks
- Comprehensive audit logging
- Beautiful, intuitive UI