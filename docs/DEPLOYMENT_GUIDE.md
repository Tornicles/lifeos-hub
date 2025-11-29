# LifeOS Deployment Guide

## Overview

This guide covers deploying LifeOS from local development to production, including CI/CD setup, environment configuration, and operational procedures.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION STACK                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Vercel     │    │  Supabase    │    │   Resend     │ │
│  │   (Frontend) │───▶│  (Backend)   │    │   (Email)    │ │
│  │              │    │  - Database  │    │              │ │
│  │              │    │  - Auth      │    │              │ │
│  │              │    │  - Edge Fns  │    │              │ │
│  └──────────────┘    └──────────────┘    └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Environments

### 1. Local Development

**Purpose**: Developer workstations

**Stack**:
- Vite dev server (localhost:5173)
- Supabase CLI (local database optional)
- Hot reload enabled

**Setup**:
```bash
# Clone repository
git clone https://github.com/yourusername/lifeos.git
cd lifeos

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start dev server
npm run dev
```

**Environment Variables** (`.env`):
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_LOG_LEVEL=DEBUG
```

### 2. Staging Environment

**Purpose**: QA testing, integration testing, demos

**URL**: `https://staging.lifeos.app`

**Stack**:
- Vercel preview deployments
- Supabase staging project
- Staging email provider

**Auto-Deploy**: Triggered on push to `staging` branch

**Environment Variables** (Vercel):
```bash
VITE_SUPABASE_URL=https://staging-project.supabase.co
VITE_SUPABASE_ANON_KEY=staging-anon-key
VITE_SUPABASE_PROJECT_ID=staging-project-id
RESEND_API_KEY=staging-resend-key
VITE_LOG_LEVEL=INFO
```

### 3. Production Environment

**Purpose**: Live users

**URL**: `https://app.lifeos.app`

**Stack**:
- Vercel production
- Supabase production project
- Resend production

**Deploy**: Manual approval required after staging tests pass

**Environment Variables** (Vercel):
```bash
VITE_SUPABASE_URL=https://prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=prod-anon-key
VITE_SUPABASE_PROJECT_ID=prod-project-id
RESEND_API_KEY=prod-resend-key
VITE_LOG_LEVEL=WARN
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy LifeOS

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      
  build:
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: dist/

  deploy-staging:
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    needs: build
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          scope: staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: build
    environment: production
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  migrate-database:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: deploy-production
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
        with:
          version: latest
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

## Database Migrations

### Migration Strategy

1. **Create Migration**: Write SQL in `supabase/migrations/`
2. **Test Locally**: Run `supabase db reset` to test
3. **Push to Staging**: `supabase db push --db-url <staging-url>`
4. **Verify**: Run tests on staging
5. **Push to Production**: `supabase db push --db-url <prod-url>`

### Migration Checklist

Before running migrations on production:

- [ ] Backup database
- [ ] Test migration on staging first
- [ ] Review for breaking changes
- [ ] Check for index locks (use CONCURRENTLY)
- [ ] Verify RLS policies don't break
- [ ] Plan rollback strategy
- [ ] Schedule during low-traffic window

### Rollback Plan

If migration fails:

```sql
-- Option 1: Point-in-time recovery
-- Via Supabase dashboard: Database > Backups > Restore

-- Option 2: Revert migration
-- Create inverse migration file
CREATE MIGRATION rollback_xxx;
-- Write reverse SQL
DROP INDEX IF EXISTS ...;
ALTER TABLE ... DROP COLUMN ...;
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Linting checks passed
- [ ] Build succeeds
- [ ] Database migrations reviewed
- [ ] Environment variables configured
- [ ] Staging deployment tested
- [ ] Performance benchmarks met
- [ ] Security scan passed

### During Deployment

- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify database connections
- [ ] Test critical user flows
- [ ] Monitor edge function logs

### Post-Deployment

- [ ] Smoke tests passed
- [ ] User acceptance testing
- [ ] Monitor for 1 hour
- [ ] Check error tracking (Sentry)
- [ ] Verify metrics dashboard
- [ ] Update changelog
- [ ] Notify team in Slack

---

## Rollback Procedure

### Immediate Rollback

If critical issues detected:

```bash
# Rollback via Vercel CLI
vercel rollback <deployment-id>

# Or via dashboard:
# Vercel Dashboard > Deployments > Previous deployment > Promote
```

### Database Rollback

```bash
# Restore from backup
# Via Supabase dashboard: Database > Backups > Select backup > Restore

# Or via CLI
supabase db dump --db-url <backup-url> | psql <prod-url>
```

### Communication

1. Post in #incidents channel
2. Update status page
3. Notify affected users via email
4. Create post-mortem doc

---

## Monitoring

### Health Checks

**Endpoint**: `https://app.lifeos.app/health`

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "uptime": 123456,
  "database": "connected",
  "edge_functions": "operational"
}
```

**Monitoring Intervals**:
- Every 30 seconds (Vercel)
- Every 60 seconds (external monitor)

### Alerts

**Critical** (Page on-call engineer):
- 5xx error rate > 5%
- Database CPU > 90%
- Response time p95 > 2s
- Health check fails 3 times

**Warning** (Slack notification):
- 4xx error rate > 10%
- Database CPU > 70%
- Response time p95 > 1s
- Disk space < 20%

---

## Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| Time to First Byte (TTFB) | < 200ms | < 500ms |
| First Contentful Paint (FCP) | < 1s | < 2s |
| Largest Contentful Paint (LCP) | < 2s | < 3s |
| Time to Interactive (TTI) | < 3s | < 5s |
| API Response (p95) | < 200ms | < 500ms |
| Database Query (p95) | < 50ms | < 100ms |

---

## Security

### Secrets Management

**Never commit**:
- `.env` files
- API keys
- Database passwords
- JWT secrets

**Store in**:
- Vercel Environment Variables (production)
- GitHub Secrets (CI/CD)
- Supabase Vault (edge functions)

### Access Control

**Production Access**:
- Database: Admin only, via bastion host
- Vercel: Team members with 2FA
- Supabase: Admin only, via dashboard

**Audit**:
- All production access logged
- Review access logs monthly
- Rotate credentials quarterly

---

## Disaster Recovery

### Backup Strategy

**Database**:
- Automated daily backups (2 AM UTC)
- Retained for 30 days
- Point-in-time recovery (7 days)

**Code**:
- Version controlled in Git
- Tagged releases
- Immutable deployments (Vercel)

**Testing**:
- Test restore procedure monthly
- Document recovery time

### Recovery Time Objectives (RTO)

| Scenario | RTO | RPO |
|----------|-----|-----|
| App crash | 5 minutes | 0 |
| Database corruption | 30 minutes | 6 hours |
| Region outage | 2 hours | 24 hours |
| Complete data loss | 4 hours | 24 hours |

---

## Cost Optimization

### Vercel

**Plan**: Pro ($20/month)
- Unlimited bandwidth
- Automatic scaling
- Zero config

**Optimization**:
- Enable compression
- Use CDN for static assets
- Optimize images (WebP)

### Supabase

**Plan**: Pro ($25/month)
- 8GB database
- 50GB bandwidth
- 500k edge function invocations

**Optimization**:
- Use indexes for queries
- Cache frequent data
- Archive old data (> 1 year)
- Monitor connection pool

### Resend

**Plan**: Pay-as-you-go
- $0.10 per 1,000 emails

**Optimization**:
- Batch notifications
- Respect user preferences
- Use templates for efficiency

**Total Monthly Cost** (< 10K users): ~$55-95

---

## Operational Runbooks

### High CPU on Database

1. Check slow query log
2. Identify problematic queries
3. Add missing indexes
4. Consider caching
5. Scale database if needed

### Edge Function Timeout

1. Check function logs
2. Identify slow operations
3. Add timeouts/circuit breakers
4. Optimize queries
5. Consider async processing

### Memory Leak

1. Check memory metrics
2. Review recent deployments
3. Rollback if critical
4. Profile in dev environment
5. Fix and redeploy

---

## Changelog Management

### Version Format

Semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Changelog Entry

```markdown
## [1.2.3] - 2024-01-15

### Added
- Email notifications for critical alerts
- Calendar sync with Google Calendar

### Changed
- Improved dashboard load time by 40%
- Updated automation engine rules

### Fixed
- Fixed habit streak calculation bug
- Resolved mobile nav overflow issue

### Security
- Updated dependencies with security patches
```

---

## Support

### Documentation

- **Architecture**: See `ENTERPRISE_ARCHITECTURE.md`
- **Integrations**: See `INTEGRATIONS_ROADMAP.md`
- **Security**: See `SECURITY_IMPLEMENTATION_GUIDE.md`

### Contact

- **Slack**: #lifeos-engineering
- **Email**: engineering@lifeos.app
- **On-call**: PagerDuty rotation

---

## Conclusion

This deployment guide provides a complete blueprint for deploying and operating LifeOS in production. Follow the checklists, monitor the metrics, and maintain the operational procedures to ensure a reliable, high-performance application for all users.
