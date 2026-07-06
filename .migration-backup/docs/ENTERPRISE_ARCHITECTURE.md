# LifeOS Enterprise Architecture Documentation

## Overview

LifeOS is designed as a cloud-native, multi-tenant SaaS application built for scale, performance, and reliability. This document outlines the enterprise-grade architecture, performance optimizations, scalability strategies, and operational requirements.

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Web App (React)          Mobile App (Future)                   │
│  - Vite Build             - React Native                        │
│  - Code Splitting         - Offline Support                     │
│  - Service Worker Cache   - Push Notifications                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ HTTPS/WSS
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                      CDN / EDGE LAYER                            │
├─────────────────────────────────────────────────────────────────┤
│  Cloudflare / Vercel Edge                                       │
│  - Static Asset Caching (1 year TTL)                            │
│  - DDoS Protection                                              │
│  - SSL/TLS Termination                                          │
│  - Brotli/Gzip Compression                                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │
┌──────────────────▼──────────────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Supabase API Gateway                                           │
│  - JWT Authentication                                           │
│  - Rate Limiting (per user/IP)                                  │
│  - Request Validation                                           │
│  - Response Caching (ETag/Last-Modified)                        │
└──────────────────┬──────────────────────────────────────────────┘
                   │
       ┌───────────┴───────────┐
       │                       │
┌──────▼─────────┐    ┌───────▼────────┐
│  EDGE FUNCTIONS│    │  DATABASE      │
│  LAYER         │    │  LAYER         │
├────────────────┤    ├────────────────┤
│ - Serverless   │◄───┤ PostgreSQL 15+ │
│ - Auto-scale   │    │ - Primary DB   │
│ - Stateless    │    │ - Read Replica │
│ - Async Queue  │    │ - Backups 24hr │
└────────────────┘    └────────────────┘
       │
       │
┌──────▼─────────────────────────────────────┐
│        BACKGROUND SERVICES                  │
├────────────────────────────────────────────┤
│  Queue Workers (pg_cron / Supabase Cron)   │
│  - Daily AI Insights (6 AM)                │
│  - Weekly Reports (Sunday)                 │
│  - Automation Evaluations (hourly)         │
│  - Notification Delivery                   │
└────────────────────────────────────────────┘
```

---

## Performance Requirements

### Latency Targets

| Operation | Target | Maximum |
|-----------|--------|---------|
| API Response (cached) | < 50ms | < 100ms |
| API Response (uncached) | < 200ms | < 500ms |
| Database Query | < 20ms | < 100ms |
| Edge Function Cold Start | < 1s | < 2s |
| Edge Function Warm | < 100ms | < 200ms |
| Dashboard Load (First Paint) | < 1s | < 2s |
| Dashboard Interactive | < 2s | < 3s |

### Throughput Targets

- **Concurrent Users**: 1,000 - 100,000
- **Requests per Second**: 1,000 - 10,000
- **Database Connections**: 100 - 500 (pooled)
- **Edge Function Concurrency**: Auto-scaling (unlimited)

---

## Database Performance

### Connection Pooling

```typescript
// Supabase handles connection pooling automatically
// Max connections: 50 (can be increased)
// Connection timeout: 30s
// Idle timeout: 600s
```

### Indexes Strategy

✅ **Implemented Indexes** (see migration):
- User/tenant filtering indexes
- Date-range query indexes
- Status and flag indexes
- Composite indexes for common queries

### Query Optimization Rules

1. **Always filter by `user_id` and `tenant_id` first**
2. **Use date indexes for time-range queries**
3. **Limit result sets (pagination)**
4. **Use `SELECT specific_columns` instead of `SELECT *`**
5. **Avoid N+1 queries (use JOINs or batch fetches)**
6. **Use `EXPLAIN ANALYZE` to verify query plans**

### Read Replica Strategy (Future)

```
┌──────────────┐
│  Primary DB  │ ◄── Writes Only
└──────┬───────┘
       │ Replication
       ├──────────────┐
       │              │
┌──────▼───────┐ ┌───▼──────────┐
│ Read Replica │ │ Read Replica │ ◄── Reads
│  (Region 1)  │ │  (Region 2)  │
└──────────────┘ └──────────────┘
```

**When to implement**: > 10,000 active users

---

## API Performance

### Response Caching Strategy

| Endpoint | Cache Duration | Cache Key |
|----------|----------------|-----------|
| GET /hubs | 24 hours | Static |
| GET /ultra_domains | 24 hours | Static |
| GET /automation_rules | 1 hour | Static |
| GET /metrics | 5 minutes | user_id + date_range |
| GET /logs | 5 minutes | user_id + date_range |
| GET /ultra/score | 30 seconds | user_id + date |
| GET /automation/evaluate | None | Real-time |

### Caching Implementation

```typescript
// Example edge function with caching
export default async (req: Request) => {
  const cacheKey = `user:${userId}:metrics:${date}`;
  const cached = await getCachedResponse(cacheKey);
  
  if (cached && isFreshEnough(cached, 300)) {
    return new Response(cached, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'ETag': generateETag(cached),
        'X-Cache': 'HIT'
      }
    });
  }
  
  const data = await fetchFromDatabase();
  await setCachedResponse(cacheKey, data, 300);
  
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'ETag': generateETag(data),
      'X-Cache': 'MISS'
    }
  });
};
```

### Pagination Standards

All list endpoints MUST support:
- `?limit=50` (default: 50, max: 200)
- `?offset=0`
- Response includes: `{ data: [], total: 1000, page: 1, hasMore: true }`

### Rate Limiting

| User Type | Rate Limit |
|-----------|------------|
| Anonymous | 10 req/min |
| Free User | 60 req/min |
| Pro User | 300 req/min |
| Enterprise | 1000 req/min |

Implementation via `automation_context_cache` table tracking request counts.

---

## Frontend Performance

### Code Splitting Strategy

```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Analytics = lazy(() => import('@/pages/Analytics'));
const Automation = lazy(() => import('@/pages/Automation'));
const HubDetail = lazy(() => import('@/pages/HubDetail'));

// Component-based splitting for heavy components
const CrossModuleAnalytics = lazy(() => 
  import('@/components/dashboard/CrossModuleAnalytics')
);
```

### Asset Optimization

- **Images**: WebP format, lazy loading, responsive sizes
- **Fonts**: Preload critical fonts, font-display: swap
- **JS Bundles**: < 200KB initial, < 100KB per route
- **CSS**: Critical CSS inline, defer non-critical

### Service Worker Caching

```typescript
// Cache static assets for 1 year
// Cache API responses for 5 minutes
// Network-first for user data
// Cache-first for static assets
```

### React Query Optimization

```typescript
// Aggressive caching for static data
queryClient.setDefaultOptions({
  queries: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    retry: 1
  }
});

// Prefetch next page
useEffect(() => {
  queryClient.prefetchQuery(['metrics', nextDate]);
}, [currentDate]);
```

---

## Scalability Architecture

### Horizontal Scaling

**Current (MVP)**: Single Supabase instance
**Future (Scale)**:
- Multiple edge function instances (auto-scaling)
- Database read replicas (manual scaling)
- CDN edge caching (global)

### Vertical Scaling

**Database Sizing**:
| Users | vCPU | RAM | Storage |
|-------|------|-----|---------|
| 1-1K | 2 | 4GB | 20GB |
| 1K-10K | 4 | 8GB | 50GB |
| 10K-50K | 8 | 16GB | 200GB |
| 50K-100K | 16 | 32GB | 500GB |

### Auto-Scaling Triggers

- CPU > 70% for 5 minutes → Scale up
- Memory > 80% for 5 minutes → Scale up
- Request queue > 100 → Add instance
- CPU < 30% for 30 minutes → Scale down

---

## Reliability & High Availability

### Backup Strategy

| Type | Frequency | Retention | RPO | RTO |
|------|-----------|-----------|-----|-----|
| Full Backup | Daily (2 AM UTC) | 30 days | 24h | 2h |
| Incremental | Every 6 hours | 7 days | 6h | 30min |
| Point-in-Time | Continuous WAL | 7 days | 5min | 15min |

### Disaster Recovery Plan

1. **Detection**: Automated health checks every 30s
2. **Notification**: Alert admin via email/SMS
3. **Failover**: Switch to read replica (manual)
4. **Recovery**: Restore from latest backup
5. **Validation**: Run smoke tests
6. **Resume**: Switch back to primary

### Health Checks

```typescript
// /health endpoint
{
  status: "healthy",
  database: "connected",
  edge_functions: "operational",
  uptime: "99.95%",
  last_backup: "2024-01-15T02:00:00Z"
}
```

---

## Fault Tolerance Patterns

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
      setTimeout(() => this.state = 'HALF_OPEN', 60000);
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

### Retry with Exponential Backoff

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
  throw new Error('Max retries exceeded');
}
```

### Graceful Degradation

```typescript
// If AI insights fail, show cached version
try {
  const insights = await generateAIInsights(userId);
  return insights;
} catch (error) {
  console.error('AI insights failed:', error);
  return getCachedInsights(userId) ?? getDefaultInsights();
}
```

---

## Monitoring & Observability

### Metrics to Track

**Application Metrics**:
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users (concurrent)
- API endpoint usage

**Database Metrics**:
- Query response time
- Connection pool usage
- Cache hit rate
- Index usage stats
- Table sizes

**Business Metrics**:
- Daily active users (DAU)
- Logs created per day
- Automation rules triggered
- AI insights generated
- User retention rate

### Structured Logging

```typescript
interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  service: string;
  userId?: string;
  tenantId?: string;
  action: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

// Example
logger.info({
  service: 'calculate-ultra-score',
  userId: 'user-123',
  action: 'score_calculated',
  duration_ms: 45,
  metadata: { score: 78, domains: 7 }
});
```

### Alert Thresholds

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | > 5% errors in 5min | CRITICAL |
| Slow Queries | > 500ms p95 | WARNING |
| Database CPU | > 80% for 10min | CRITICAL |
| Low Disk Space | < 10% free | WARNING |
| Edge Function Errors | > 10 errors/min | WARNING |
| User Login Failures | > 50 failures/hour | WARNING |

---

## Caching Layer Strategy

### Application-Level Cache (Current)

Using `automation_context_cache` table:
- Key-value storage
- TTL-based expiration
- User-scoped cache keys

```typescript
// Example cache usage
const cacheKey = `ultra-score:${userId}:${date}`;
const cached = await supabase
  .from('automation_context_cache')
  .select('cache_value')
  .eq('cache_key', cacheKey)
  .eq('user_id', userId)
  .gt('expires_at', new Date().toISOString())
  .single();

if (cached?.cache_value) {
  return cached.cache_value;
}

const score = await calculateUltraScore(userId, date);

await supabase
  .from('automation_context_cache')
  .insert({
    user_id: userId,
    cache_key: cacheKey,
    cache_value: score,
    expires_at: new Date(Date.now() + 30000).toISOString() // 30s TTL
  });

return score;
```

### Redis Cache (Future)

**When to implement**: > 10,000 users

```typescript
// Redis cache structure
cache.set('ultra-score:user-123:2024-01-15', score, 'EX', 30);
cache.set('dashboard:user-123', dashboardData, 'EX', 300);
cache.set('automation-rules', rules, 'EX', 3600);
```

**Cache Invalidation Strategy**:
- Write-through on updates
- TTL-based expiration
- Manual invalidation on critical data changes

---

## Background Job Queue

### Current Implementation

Using Supabase `pg_cron`:

```sql
-- Daily AI insights at 6 AM
SELECT cron.schedule(
  'generate-daily-insights',
  '0 6 * * *',
  $$ SELECT net.http_post(
    url:='https://[project-ref].supabase.co/functions/v1/generate-daily-insight',
    headers:='{"Authorization": "Bearer [service-role-key]"}'::jsonb
  ) $$
);

-- Hourly automation evaluations
SELECT cron.schedule(
  'evaluate-automation',
  '0 * * * *',
  $$ SELECT net.http_post(
    url:='https://[project-ref].supabase.co/functions/v1/automation-trigger',
    headers:='{"Authorization": "Bearer [service-role-key]"}'::jsonb,
    body:='{"trigger_type": "scheduled"}'::jsonb
  ) $$
);
```

### Future Queue System

**When to implement**: > 50,000 users or complex workflows

Options:
- **pg_cron** (current): Good for simple scheduled jobs
- **BullMQ + Redis**: For complex job queues with priorities
- **Cloud Tasks**: For serverless job processing

---

## Load Testing

### Test Scenarios

1. **Baseline Load**
   - 100 concurrent users
   - 10 requests per user per minute
   - Duration: 10 minutes
   - Expected: < 200ms p95 response time

2. **Stress Test**
   - 1,000 concurrent users
   - 20 requests per user per minute
   - Duration: 30 minutes
   - Expected: < 500ms p95 response time

3. **Spike Test**
   - 0 → 5,000 users in 1 minute
   - Sustained for 5 minutes
   - Expected: Auto-scaling triggers, no errors

4. **Endurance Test**
   - 500 concurrent users
   - 24 hour duration
   - Expected: No memory leaks, stable performance

### Tools

- **k6**: Load testing scripts
- **Artillery**: HTTP load testing
- **JMeter**: Complex scenario testing

---

## Security & Compliance

### Data Encryption

- **In Transit**: TLS 1.3
- **At Rest**: AES-256 (Supabase default)
- **Secrets**: Supabase Vault / Environment variables

### GDPR Compliance

- User data export endpoint
- User data deletion endpoint (cascade)
- Consent tracking
- Right to be forgotten
- Data processing agreements

### Audit Logging

All security-relevant actions logged to `audit_logs`:
- Login attempts (success/failure)
- Password changes
- Role changes
- Data exports
- Account deletions

---

## Deployment Strategy

### Zero-Downtime Deployment

1. **Build**: New version in staging
2. **Test**: Automated smoke tests
3. **Deploy**: Blue-green deployment
4. **Monitor**: Watch error rates for 10 minutes
5. **Rollback**: Automatic if error rate > 5%

### Rollback Procedure

1. Switch traffic back to previous version
2. Investigate issue
3. Apply fix
4. Redeploy

### Environment Strategy

| Environment | Purpose | Auto-Deploy |
|-------------|---------|-------------|
| Development | Local development | No |
| Staging | Testing & QA | Yes (on merge to staging) |
| Production | Live users | Manual approval |

---

## Cost Optimization

### Database Optimization

- Use indexes to reduce query time
- Partition large tables (> 10M rows)
- Archive old data (> 1 year)
- Vacuum regularly

### Edge Function Optimization

- Minimize cold starts (keep functions warm)
- Batch operations
- Use connection pooling
- Cache aggressively

### Monitoring Costs

| Service | Monthly Cost (estimate) |
|---------|-------------------------|
| Supabase Pro | $25 |
| Vercel Pro | $20 |
| Resend Email | $10-50 |
| Total (< 10K users) | $55-95 |

---

## Future Scalability Enhancements

### Phase 1 (1K-10K users)
- ✅ Database indexes
- ✅ API caching
- ✅ Frontend optimization
- 🔲 Read replicas

### Phase 2 (10K-50K users)
- 🔲 Redis caching layer
- 🔲 Background job queue
- 🔲 Multi-region deployment
- 🔲 Advanced monitoring (Grafana)

### Phase 3 (50K-100K+ users)
- 🔲 Kubernetes orchestration
- 🔲 Database sharding
- 🔲 Microservices architecture
- 🔲 Real-time WebSocket infrastructure

---

## Conclusion

LifeOS is architected for enterprise-grade performance, scalability, and reliability from day one. The current Supabase-based architecture provides excellent scalability up to 10,000+ users with minimal operational overhead. As the user base grows, the documented future enhancements provide a clear path to supporting 100,000+ users while maintaining sub-200ms response times and 99.9%+ uptime.

Key principles:
- **Stateless architecture**: Easy horizontal scaling
- **Database-first**: Leverage PostgreSQL performance
- **Cache aggressively**: Reduce database load
- **Monitor everything**: Observability is key
- **Automate operations**: Reduce human error
