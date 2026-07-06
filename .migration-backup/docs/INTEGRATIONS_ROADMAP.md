# LifeOS Third-Party Integrations Roadmap

## Overview

This document outlines the integration strategy for LifeOS, including current implementations, planned integrations, and technical specifications for each service.

---

## Current Integrations

### ✅ 1. AI Services (Implemented)

**Lovable AI via Gemini**

**Status**: ✅ Fully Implemented

**Why**: Generate intelligent daily insights, recommendations, and coaching messages

**Implementation**: `supabase/functions/ai-insights-engine/index.ts`

**Models Used**:
- `google/gemini-2.5-flash`: Primary model for daily insights
- `google/gemini-2.5-pro`: Optional for complex analysis

**Security**: API key managed via Supabase secrets, not exposed to client

**Rate Limits**: Via Lovable AI (no user API key required)

**Caching**: Insights cached for 24 hours in `automation_context_cache`

**Cost**: Included in Lovable platform usage

---

## Planned Integrations

### 🔲 2. Email Notifications

**Provider**: Resend

**Status**: 🔲 Ready to implement (requires API key)

**Why**: Send transactional emails (welcome, reports, alerts, password reset)

**Use Cases**:
- Welcome email on signup
- Daily/weekly insights summary
- Critical automation alerts
- Password reset links
- Team invitations

**Email Types**:

| Template | Trigger | Priority |
|----------|---------|----------|
| Welcome | User signup | High |
| Daily Insights | 6 AM daily | Medium |
| Weekly Report | Sunday 8 AM | Medium |
| Critical Alert | Ultra Score < 20 | High |
| Password Reset | User request | High |
| Team Invite | Admin action | High |

**Implementation Plan**:

```typescript
// supabase/functions/notification-generator/index.ts

import { Resend } from 'resend';

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function sendEmail(template: string, to: string, data: any) {
  const templates = {
    welcome: {
      subject: 'Welcome to LifeOS!',
      html: welcomeEmailTemplate(data)
    },
    daily_insights: {
      subject: `Your Daily LifeOS Insights - ${data.date}`,
      html: dailyInsightsTemplate(data)
    },
    critical_alert: {
      subject: '⚠️ Critical Alert: Your LifeOS Score Needs Attention',
      html: criticalAlertTemplate(data)
    }
  };
  
  await resend.emails.send({
    from: 'LifeOS <hello@lifeos.app>',
    to,
    subject: templates[template].subject,
    html: templates[template].html
  });
}
```

**Database Schema**:

```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  template_name TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL, -- sent, failed, bounced
  sent_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Rate Limits**:
- Welcome emails: No limit
- Daily insights: 1 per user per day
- Alerts: Max 5 per user per day

**Cost Estimate**: $0.10 per 1,000 emails

**Security**:
- API key stored in Supabase secrets
- Verify email ownership before sending
- Rate limiting per user
- Unsubscribe link in all marketing emails

---

### 🔲 3. Calendar Integrations

**Providers**: Google Calendar, Outlook Calendar (iCloud future)

**Status**: 🔲 Planned (Phase 2)

**Why**: Sync LifeOS calendar with user's existing calendar for unified time management

**Use Cases**:
- Import events from Google/Outlook → LifeOS
- Export LifeOS planned time blocks → Google/Outlook
- Detect calendar conflicts
- Auto-fill calendar based on system state

#### Google Calendar Integration

**OAuth 2.0 Flow**:

```typescript
// 1. User clicks "Connect Google Calendar"
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${CLIENT_ID}&` +
  `redirect_uri=${REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=https://www.googleapis.com/auth/calendar&` +
  `access_type=offline`;

// 2. User approves, redirects back with code
const { code } = req.query;

// 3. Exchange code for tokens
const tokens = await oauth2Client.getToken(code);
const { access_token, refresh_token } = tokens.credentials;

// 4. Store tokens securely
await supabase
  .from('calendar_integrations')
  .insert({
    user_id: userId,
    provider: 'google',
    access_token: encrypt(access_token),
    refresh_token: encrypt(refresh_token),
    expires_at: new Date(Date.now() + 3600000)
  });
```

**Database Schema**:

```sql
CREATE TABLE calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tenant_id UUID REFERENCES tenants(id),
  provider TEXT NOT NULL, -- 'google', 'outlook', 'icloud'
  access_token TEXT NOT NULL, -- encrypted
  refresh_token TEXT NOT NULL, -- encrypted
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, provider)
);

CREATE TABLE calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID NOT NULL REFERENCES calendar_integrations(id),
  sync_direction TEXT NOT NULL, -- 'import', 'export'
  events_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'success', 'partial', 'failed'
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**API Endpoints**:

```typescript
// Edge function: calendar-sync

// POST /calendar-sync
{
  "action": "import", // or "export"
  "provider": "google",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  }
}

// Import flow:
// 1. Fetch events from Google Calendar
// 2. Transform to LifeOS calendar_entries format
// 3. Insert non-duplicate events
// 4. Return sync summary

// Export flow:
// 1. Fetch LifeOS calendar_entries
// 2. Transform to Google Calendar event format
// 3. Create events in Google Calendar
// 4. Update LifeOS entries with external_event_id
```

**Sync Strategy**:
- **Bidirectional sync**: Every 30 minutes
- **Conflict resolution**: User preference (LifeOS wins or Google wins)
- **Deduplication**: Match by title + time + duration

**Rate Limits**:
- Google Calendar: 1,000 requests/min
- Sync frequency: Every 30 minutes max

**Cost**: Free (Google Calendar API is free)

**Security**:
- OAuth 2.0 with PKCE
- Tokens encrypted at rest
- Refresh tokens stored separately
- Automatic token refresh

---

### 🔲 4. Health & Fitness Integrations

**Providers**: Apple Health, Google Fit, Fitbit (future)

**Status**: 🔲 Planned (Phase 3)

**Why**: Auto-log health metrics (steps, workouts, sleep) into LifeOS Health Hub

**Use Cases**:
- Import daily steps → Health Hub metric
- Import workout sessions → Fitness domain score
- Import sleep data → Recovery score
- Track weight changes
- Monitor heart rate trends

#### Apple Health Integration

**Implementation**: Via HealthKit (iOS app required)

**Metrics to Sync**:
- Steps (daily)
- Active calories
- Workouts (type, duration, calories)
- Sleep analysis
- Heart rate
- Weight
- Water intake

**Database Storage**:

```sql
-- Extend logs table or create health_metrics
CREATE TABLE health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  metric_type TEXT NOT NULL, -- 'steps', 'workout', 'sleep', 'weight'
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL, -- 'count', 'minutes', 'kg', 'hours'
  source TEXT NOT NULL, -- 'apple_health', 'google_fit', 'manual'
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metadata JSONB -- { workout_type: 'running', distance_km: 5.2 }
);
```

**Auto-Mapping to Hubs**:

| Health Metric | Maps To | Rule |
|---------------|---------|------|
| Steps > 10,000 | Health Hub | +5 to Health score |
| Workout 30+ min | Fitness Domain | +10 to Fitness score |
| Sleep 7-9 hours | Health Hub | +5 to Health score |
| Sleep < 6 hours | Health Hub | -10 to Health score |

**Sync Frequency**: Every 1 hour (background)

**Cost**: Free (HealthKit is free, Google Fit is free)

**Security**:
- User must grant permission via iOS settings
- Data never leaves user's device except to LifeOS backend
- Encrypted in transit and at rest

---

### 🔲 5. Finance Integrations

**Providers**: Plaid (primary), Stripe (future)

**Status**: 🔲 Planned (Phase 4)

**Why**: Auto-track financial health, income, expenses, savings rate

**Use Cases**:
- Link bank accounts
- Track income deposits
- Categorize expenses
- Monitor net worth
- Calculate savings rate

#### Plaid Integration

**Implementation**:

```typescript
// Link bank account flow
const plaidClient = new PlaidApi(configuration);

// 1. Create link token
const linkToken = await plaidClient.linkTokenCreate({
  user: { client_user_id: userId },
  products: ['transactions'],
  country_codes: ['US'],
  language: 'en'
});

// 2. User completes Plaid Link UI
// 3. Exchange public_token for access_token
const { access_token } = await plaidClient.itemPublicTokenExchange({
  public_token: publicToken
});

// 4. Store access_token securely
await supabase
  .from('finance_integrations')
  .insert({
    user_id: userId,
    provider: 'plaid',
    access_token: encrypt(access_token),
    item_id: itemId
  });

// 5. Fetch transactions
const transactions = await plaidClient.transactionsGet({
  access_token,
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});

// 6. Store in logs table
for (const txn of transactions.transactions) {
  await supabase
    .from('logs')
    .insert({
      user_id: userId,
      hub_id: FINANCE_HUB_ID,
      source: 'plaid',
      metric: txn.category[0], // e.g., 'Food', 'Transport'
      value: txn.amount,
      notes: txn.name,
      log_date: txn.date
    });
}
```

**Database Schema**:

```sql
CREATE TABLE finance_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  provider TEXT NOT NULL, -- 'plaid', 'stripe'
  access_token TEXT NOT NULL, -- encrypted
  item_id TEXT,
  institution_name TEXT,
  sync_enabled BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

**Auto-Mapping**:
- Income transactions → Finance Hub +
- Expense transactions → Finance Hub -
- Savings rate = (Income - Expenses) / Income

**Rate Limits**: Plaid has rate limits per tier (check their docs)

**Cost**: 
- Development: Free
- Production: $0.01 - $0.05 per item per month

**Security**:
- Plaid handles bank authentication
- Access tokens encrypted
- PCI DSS compliant
- Read-only access (cannot initiate transfers)

**IMPORTANT**: Requires business verification with Plaid

---

### 🔲 6. Social Media Integrations

**Providers**: Instagram Insights, LinkedIn, YouTube Analytics (future)

**Status**: 🔲 Planned (Phase 5)

**Why**: Track Personal Branding & Online Influence metrics

**Use Cases**:
- Track follower growth
- Monitor engagement rates
- Track post performance
- Calculate influence score

#### Instagram Insights

**Prerequisites**: Instagram Business Account + Facebook App

**Metrics to Track**:
- Follower count
- Impressions
- Reach
- Engagement rate
- Story views

**Implementation**:

```typescript
// OAuth flow to get Instagram access token
const instagramMetrics = await fetch(
  `https://graph.instagram.com/me/insights?metric=impressions,reach,follower_count&period=day&access_token=${token}`
);

// Store in ultra_metrics
await supabase
  .from('ultra_metrics')
  .insert({
    user_id: userId,
    domain_id: PERSONAL_BRANDING_DOMAIN_ID,
    name: 'instagram_followers',
    value: followerCount,
    metric_date: today
  });
```

**Auto-Mapping**:
- Follower growth > 5% weekly → +10 to Personal Branding score
- Engagement rate > 5% → +5 to Personal Branding score

**Rate Limits**: Instagram API limits per app

**Cost**: Free (Instagram Graph API is free)

**Security**: OAuth 2.0, short-lived tokens (refresh required)

---

## Integration Priority Matrix

| Integration | Business Value | Technical Complexity | User Demand | Priority |
|-------------|----------------|----------------------|-------------|----------|
| Email (Resend) | High | Low | High | 🔥 Phase 1 |
| Calendar (Google) | High | Medium | High | 📅 Phase 2 |
| Health (Apple/Google) | Medium | Medium | Medium | 💪 Phase 3 |
| Finance (Plaid) | Medium | High | Medium | 💰 Phase 4 |
| Social Media | Low | Medium | Low | 📱 Phase 5 |

---

## General Integration Patterns

### OAuth 2.0 Flow (Standard)

```typescript
// 1. Redirect to provider authorization
const authUrl = buildAuthUrl(provider, scopes, redirectUri);
redirect(authUrl);

// 2. Handle callback
const { code } = req.query;
const tokens = await exchangeCodeForTokens(code);

// 3. Store tokens securely
await storeEncryptedTokens(userId, provider, tokens);

// 4. Sync data
await syncData(userId, provider);
```

### Webhook Handling

```typescript
// supabase/functions/webhooks/index.ts

// Verify webhook signature
const isValid = verifyWebhookSignature(
  req.body,
  req.headers['x-webhook-signature'],
  WEBHOOK_SECRET
);

if (!isValid) {
  return new Response('Invalid signature', { status: 401 });
}

// Process webhook event
const { type, data } = req.body;

switch (type) {
  case 'transaction.created':
    await handleNewTransaction(data);
    break;
  case 'calendar.event.updated':
    await syncCalendarEvent(data);
    break;
}

return new Response('OK', { status: 200 });
```

### Rate Limiting per Integration

```typescript
const rateLimits = {
  email: { maxPerHour: 100, maxPerDay: 500 },
  calendar_sync: { maxPerHour: 60 },
  health_sync: { maxPerHour: 12 },
  finance_sync: { maxPerDay: 24 },
  social_sync: { maxPerDay: 48 }
};

async function checkRateLimit(userId: string, integration: string) {
  const key = `rate:${integration}:${userId}`;
  const count = await incrementRateLimitCounter(key);
  
  if (count > rateLimits[integration].maxPerHour) {
    throw new Error('Rate limit exceeded');
  }
}
```

---

## Security Best Practices

1. **Token Storage**:
   - Encrypt all access tokens and refresh tokens
   - Use Supabase Vault or environment variables for secrets
   - Never expose tokens to client-side code

2. **OAuth Scopes**:
   - Request minimum necessary scopes
   - Explain to users why each scope is needed

3. **Webhook Security**:
   - Verify webhook signatures
   - Use HTTPS only
   - Implement replay attack prevention

4. **Data Retention**:
   - Only store necessary integration data
   - Provide user data deletion on account closure
   - Comply with GDPR/CCPA

5. **Error Handling**:
   - Don't expose internal errors to users
   - Log integration failures for debugging
   - Provide clear user-facing error messages

---

## Testing Strategy

### Integration Test Checklist

- [ ] OAuth flow completes successfully
- [ ] Token refresh works automatically
- [ ] Data sync imports correct data
- [ ] Duplicate detection works
- [ ] Rate limiting prevents abuse
- [ ] Disconnection removes stored tokens
- [ ] Webhook signature verification works
- [ ] Error handling is graceful

### Mock Data for Testing

Create mock integration responses for:
- Google Calendar events
- Apple Health metrics
- Plaid transactions
- Instagram insights

---

## Cost Summary (Estimated)

| Integration | Setup Cost | Monthly Cost (1K users) | Monthly Cost (10K users) |
|-------------|------------|-------------------------|--------------------------|
| Resend Email | $0 | $10 | $50 |
| Google Calendar | $0 | $0 | $0 |
| Apple Health | $0 | $0 | $0 |
| Plaid | $0 | $50 | $500 |
| Instagram | $0 | $0 | $0 |
| **Total** | **$0** | **$60** | **$550** |

---

## Implementation Timeline

**Phase 1 (MVP)**: Email notifications ✅
**Phase 2 (Q2 2024)**: Google Calendar sync
**Phase 3 (Q3 2024)**: Apple Health + Google Fit
**Phase 4 (Q4 2024)**: Plaid finance integration
**Phase 5 (2025)**: Social media integrations

---

## Conclusion

LifeOS integrations are designed with security, scalability, and user experience as top priorities. Each integration follows OAuth 2.0 best practices, implements proper rate limiting, and provides graceful error handling. The phased rollout ensures we deliver high-value integrations first while maintaining system stability.
