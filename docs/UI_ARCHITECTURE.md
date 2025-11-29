# LifeOS v30 UI Architecture

## Overview

The LifeOS UI is built with React, TypeScript, TanStack Router, Shadcn/ui, and Tailwind CSS. The interface follows a mobile-first responsive design with a cohesive color system based on deep blue (#1F4E79) primary and gold (#FFC000) accent colors.

## Design System

### Color Palette
- **Primary**: Deep Blue (#1F4E79) - Main brand color
- **Secondary**: Gold (#FFC000) - Accent and highlights
- **Success**: Green (#7FBA00) - Positive states
- **Neutral**: Gray (#F3F3F3) - Backgrounds
- **Semantic tokens**: Defined in `index.css` for consistency

### Typography
- **Font Family**: Inter (UI), Open Sans (body text)
- **Scale**: 8px grid system
- **Weights**: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- **Grid**: 8px base unit
- **Component Padding**: 12px, 16px, 24px
- **Card Spacing**: 16px internal, 24px between cards

### Border Radius
- **Small**: 8px (buttons, badges)
- **Medium**: 12px (cards, inputs)
- **Large**: 16px (modals, major containers)

## Navigation Structure

### Primary Navigation (Sidebar)

#### Main Section
- **Command Center** (`/dashboard`) - Home dashboard with Ultra Score and overview
- **Ultra Hub** (`/ultra`) - Ultra domains and overall system status

#### Life Hubs Section
- **Finance** (`/hubs/finance`) - Financial tracking and metrics
- **Health** (`/hubs/health`) - Health and wellness data
- **Work** (`/hubs/work`) - Professional activities
- **Academy** (`/hubs/academy`) - Learning and education
- **Personal Dev** (`/hubs/personal-dev`) - Personal development
- **Household** (`/hubs/household`) - Home and domestic
- **Relationships** (`/hubs/relationships`) - Social connections
- **Projects Hub** (`/hubs/projects`) - Project-specific hub
- **Mindset** (`/hubs/mindset`) - Mental and emotional state

#### Tools Section
- **Projects** (`/projects`) - Project management
- **Calendar** (`/calendar`) - Time management
- **Habits** (`/habits`) - Habit tracking
- **Logs** (`/logs`) - Activity logging

#### System Section
- **States Engine** (`/states-engine`) - System state visualization
- **Diagnostics** (`/automation-diagnostics`) - System health
- **Reports** (`/reports`) - Analytics and reports
- **Automation** (`/automation`) - Automation control panel
- **Rule Builder** (`/automation-rules`) - Create/edit rules
- **Auto Settings** (`/automation-settings`) - Automation preferences
- **Insights** (`/insights`) - AI-generated insights
- **Security** (`/security`) - Security dashboard
- **Settings** (`/settings`) - App settings

#### Admin Section (Admins Only)
- **Admin Panel** (`/admin`) - System administration

### Mobile Navigation (Bottom Nav)
- **Dashboard** - Quick access to home
- **Hubs** - Hub overview
- **Add Log** - Quick log creation
- **Calendar** - Calendar view
- **Profile** - User profile

## Page Structure

### Common Page Elements

All pages follow this structure:
```tsx
<div className="space-y-6 pb-6">
  {/* Header Section */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-3xl font-bold">Page Title</h1>
      <p className="text-muted-foreground">Page description</p>
    </div>
    <div className="flex gap-2">
      {/* Action buttons */}
    </div>
  </div>

  {/* Content Cards */}
  <Card>
    {/* Content */}
  </Card>
</div>
```

### Page Types

#### 1. Dashboard (`/dashboard`)
**Purpose**: Main command center showing system overview

**Sections**:
- Greeting header with current date
- Ultra Score card with system state
- System status overview
- Priority hub card
- Hub tiles grid (9 hubs)
- Daily insight
- Focus recommendations
- Quick actions

**Components Used**:
- `StateBadge` - System state indicator
- `PriorityHubCard` - Priority hub display
- `HubTile` - Individual hub cards
- `RecommendationCard` - Action recommendations
- `KPICard` - Key metrics

#### 2. Hub Detail (`/hubs/:hubCode`)
**Purpose**: Detailed view of individual hub

**Sections**:
- Hub header with icon and navigation
- Current score display
- 7-day trend indicator
- Recent activity count
- Tabs:
  - Metrics: Historical metrics data
  - Logs: Activity logs for the hub

**Dynamic Features**:
- Hub-specific theming (colors, icons)
- Empty states for no data
- Add metric/log CTAs

**Hub Codes**:
- `finance`, `health`, `work`, `academy`, `personal-dev`
- `household`, `relationships`, `projects`, `mindset`

#### 3. Ultra Hub (`/ultra`)
**Purpose**: Ultra Score and domain overview

**Sections**:
- Ultra Score ring visualization
- 7 Ultra Domains breakdown
- Domain trend charts
- System state analysis
- Daily coaching insight
- Action recommendations

**Ultra Domains**:
1. Spirituality
2. Career Master
3. Social Life
4. Emotional Intelligence
5. Personal Branding & Online Influence
6. Fitness Performance
7. Dating & Attraction

#### 4. Projects (`/projects`)
**Purpose**: Project management and tracking

**Views**:
- Kanban board (Not Started, In Progress, Done)
- List view with filters
- Project creation modal

**Actions**:
- Create project
- Edit project
- Change status
- Add tasks
- Archive/delete

#### 5. Project Detail (`/projects/:projectId`)
**Purpose**: Detailed project view

**Sections**:
- Project header with status badges
- Progress bar with completion %
- Tasks list with check-off
- Project notes (editable)
- Due date tracking

**Features**:
- Toggle task completion
- Edit notes inline
- Navigate back to projects
- Task priority indicators
- Status color coding

#### 6. Habits (`/habits`)
**Purpose**: Habit tracking and management

**Sections**:
- Active habits grid
- Streak indicators
- Check-in buttons
- Habit creation

**Features**:
- Daily check-ins
- Streak tracking
- Habit templates
- Consistency metrics

#### 7. Habit Detail (`/habits/:habitId`)
**Purpose**: Individual habit tracking

**Sections**:
- Habit header
- Current streak display (flame icon)
- 7-day consistency percentage
- Total check-ins count
- Check-in button for today
- Calendar view of check-ins
- Editable description
- Recent check-ins history

**Features**:
- Visual calendar with marked days
- Streak visualization
- Check-in toggle
- Historical data

#### 8. Calendar (`/calendar`)
**Purpose**: Time management and planning

**Views**:
- Month view
- Week view
- Day view

**Features**:
- Add events
- Edit events
- Drag-and-drop reordering
- Hub/domain tagging

#### 9. Logs (`/logs`)
**Purpose**: Activity logging and data entry

**Features**:
- Filter by hub/source/metric
- Sortable columns
- Export CSV
- Bulk operations
- Add log modal

#### 10. Automation (`/automation`)
**Purpose**: Automation control and monitoring

**Sections**:
- System status
- Control panel (validate, rebalance, generate calendar)
- Auto-generated actions list
- System warnings
- Active rules display

#### 11. Automation Rules (`/automation-rules`)
**Purpose**: Create and manage automation rules

**Features**:
- Rule builder UI
- Condition editor
- Action configuration
- Rule testing
- Execution history

#### 12. Automation Settings (`/automation-settings`)
**Purpose**: User automation preferences

**Tabs**:
1. **Settings**: Master toggle, categories, notifications, quiet hours
2. **Action Queue**: Queued and processing actions with status
3. **Logs**: Automation event logs with severity levels

**Features**:
- Enable/disable automation
- Category toggles
- Notification preferences (email, push, in-app)
- Quiet hours configuration
- Max daily actions limit
- Real-time queue monitoring
- Manual action processing

#### 13. States Engine (`/states-engine`)
**Purpose**: System state visualization

**Features**:
- State classification
- Priority determination
- Weakest hub identification
- Condition analysis

#### 14. Insights (`/insights`)
**Purpose**: AI-generated insights and analysis

**Sections**:
- Daily summary
- Weekly review
- Monthly insights
- Health of LifeOS score
- Personalized recommendations

#### 15. Settings (`/settings`)
**Purpose**: App configuration

**Subsections**:
- User profile
- Notifications
- Themes (dark/light)
- Data export
- Security
- Integrations
- Subscription

#### 16. Admin Panel (`/admin`)
**Purpose**: System administration (admins only)

**Sections**:
- User management
- System metrics
- Activity logs
- Configuration
- Database tools

## Component Library

### Global Components

#### 1. AppLayout
- Sidebar navigation
- Top header
- Main content area
- Footer

#### 2. AppSidebar
- Collapsible sidebar
- Grouped navigation
- Active route highlighting
- Icon + text layout
- Mini mode support

#### 3. TopNav
- App logo
- User menu
- Notifications
- Dark/light toggle
- Quick search

#### 4. NavLink
- Custom Link component
- Active state styling
- Accessible navigation

### Card Components

#### 1. HubTile
**Purpose**: Display hub status at a glance

**Props**:
- `hub`: Hub data object
- `score`: Current score
- `trend`: Score trend
- `onClick`: Navigation handler

**Visual States**:
- Green: Score 80-100 (Excellent)
- Blue: Score 60-79 (Good)
- Yellow: Score 40-59 (Warning)
- Red: Score 0-39 (Critical)

#### 2. UltraDomainTile
**Purpose**: Display Ultra Domain metrics

**Props**:
- `domain`: Domain name
- `score`: Current score
- `icon`: Domain icon
- `trend`: Score change

#### 3. KPICard
**Purpose**: Key Performance Indicator display

**Props**:
- `title`: KPI name
- `value`: Current value
- `trend`: Positive/negative
- `percentage`: Change percentage
- `icon`: Visual indicator

#### 4. ScoreCard
**Purpose**: Score display with ring visualization

**Props**:
- `score`: Numeric score
- `maxScore`: Maximum possible
- `size`: Card size
- `color`: Theme color

#### 5. RecommendationCard
**Purpose**: Action recommendations from automation

**Props**:
- `title`: Recommendation title
- `description`: Details
- `priority`: Priority level
- `actions`: Available actions

#### 6. StatePill
**Purpose**: System state badge

**Props**:
- `state`: State name
- `color`: State color
- `size`: Badge size

#### 7. TrendBar
**Purpose**: Visual trend indicator

**Props**:
- `value`: Trend value
- `direction`: Up/down/neutral
- `timeframe`: Period

### Automation Components

#### 1. StateBadge
**Purpose**: Display automation state with styling

**Props**:
- `automation`: Automation result object
- `size`: Badge size
- `showReasons`: Show state reasons

#### 2. PriorityHubCard
**Purpose**: Highlight priority/weakest hub

**Props**:
- `automation`: Automation result
- `variant`: Priority or weakest

#### 3. StateCard
**Purpose**: Full state information display

**Props**:
- `state`: Current state
- `reasons`: State reasons
- `recommendations`: Suggested actions

#### 4. ConditionsMatrix
**Purpose**: Visual display of rule conditions

**Props**:
- `conditions`: Array of conditions
- `status`: Met/not met

#### 5. AutomationSettings
**Purpose**: User automation preferences

**Features**:
- Category toggles
- Notification settings
- Quiet hours
- Max actions limit

#### 6. ActionQueueViewer
**Purpose**: Monitor action queue

**Features**:
- Real-time status
- Priority indicators
- Manual processing
- Error display

#### 7. AutomationLogsViewer
**Purpose**: Audit trail viewer

**Features**:
- Event filtering
- Severity levels
- Context data
- Timeline view

### Form Components

#### 1. Modal
**Purpose**: Overlay dialogs

**Uses**:
- Add log
- Add metric
- Create project
- Create habit
- Edit forms

#### 2. Table
**Purpose**: Data grid display

**Features**:
- Sorting
- Filtering
- Pagination
- Row selection
- Bulk actions

### Utility Components

#### 1. Skeleton
**Purpose**: Loading placeholder

#### 2. Toast
**Purpose**: Feedback notifications

#### 3. EmptyState
**Purpose**: No data display

**Elements**:
- Illustration
- Message
- CTA button

## State Management

### Global State
- **User Authentication**: Supabase auth state
- **Theme**: Dark/light mode
- **Navigation**: Current route

### Local State
- **Form Data**: Form inputs
- **Modal Visibility**: Dialog states
- **Loading States**: API calls
- **Error States**: Error handling

### Server State (TanStack Query)
- **User Data**: Profile, settings
- **Metrics**: Hub scores, Ultra score
- **Logs**: Activity logs
- **Projects**: Project data
- **Habits**: Habit tracking
- **Automation**: Rules, executions, queue
- **Calendar**: Events

## Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Mobile Adaptations
- Bottom navigation replaces sidebar
- Stacked layouts
- Touch-optimized controls
- Simplified tables
- Drawer modals

### Desktop Features
- Persistent sidebar
- Multi-column layouts
- Hover states
- Keyboard shortcuts
- Advanced filtering

## Error Handling

### Error States
1. **Loading State**: Skeleton placeholders
2. **Empty State**: No data message + CTA
3. **Error State**: Error message + retry
4. **Permission State**: Access denied message

### Error Boundaries
- Page-level error catching
- Component-level fallbacks
- Toast notifications for user errors
- Console logging for debugging

## Accessibility

### Standards
- WCAG 2.1 AA compliance
- Semantic HTML
- ARIA attributes
- Keyboard navigation
- Screen reader support

### Features
- Focus indicators
- Alt text for images
- Form labels
- Error messages
- Skip links
- High contrast mode

## Performance

### Optimization Strategies
- Code splitting by route
- Lazy loading images
- Debounced search
- Memoized components
- Virtual scrolling for lists
- Optimistic UI updates

### Loading States
- Skeleton screens
- Progress indicators
- Spinner for actions
- Stale-while-revalidate

## Testing Strategy

### Unit Tests
- Component rendering
- User interactions
- Form validation
- Utility functions

### Integration Tests
- Navigation flows
- Form submissions
- API interactions
- State management

### E2E Tests
- User journeys
- Critical paths
- Cross-browser
- Mobile scenarios

## Future Enhancements

### Phase 2
- Advanced charting
- Data export tools
- Bulk operations
- Advanced filters

### Phase 3
- Collaborative features
- Real-time sync
- Offline support
- PWA capabilities

### Phase 4
- AI-powered insights
- Predictive analytics
- Voice commands
- AR/VR interfaces

## Conclusion

The LifeOS UI architecture provides a comprehensive, scalable foundation for a personal operating system. With proper component reuse, consistent design system, and robust error handling, the interface delivers a professional user experience that scales from mobile to desktop while maintaining performance and accessibility.
