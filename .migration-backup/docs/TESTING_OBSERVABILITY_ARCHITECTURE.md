# LifeOS Testing, Observability & Stability Architecture

## Overview

This document defines the complete testing, logging, analytics, monitoring, and observability infrastructure for LifeOS Ultra OmniSuite. This transforms LifeOS from a prototype to a production-ready, monitorable, testable SaaS application.

---

## 1. Testing Strategy - Full Implementation

### 1.1 Testing Pyramid Structure

```
           /\
          /  \     E2E Tests (5%)
         /____\    - Critical user journeys
        /      \   Integration Tests (15%)
       /________\  - API + DB interactions
      /          \ Unit Tests (80%)
     /____________\- Models, logic, utilities
```

### 1.2 Unit Tests (Backend)

**Framework**: `pytest` + `pytest-asyncio` + `pytest-cov`

**Structure**:
```
tests/
├── __init__.py
├── conftest.py                    # Shared fixtures
├── test_models.py                 # Model creation/validation
├── test_ultra_logic.py            # Ultra Score calculations
├── test_automation_engine.py      # Rule evaluation
├── test_hub_calculations.py       # Hub score logic
├── test_calendar_logic.py         # Calendar autofill
├── test_insights_generation.py    # Daily insights
└── test_api/
    ├── test_users.py
    ├── test_logs.py
    ├── test_metrics.py
    ├── test_projects.py
    ├── test_habits.py
    ├── test_automation.py
    └── test_calendar.py
```

**Key Test Cases**:

```python
# tests/test_models.py
def test_user_creation():
    """Test user model creation with valid data"""
    
def test_hub_creation():
    """Test all 9 hubs are created correctly"""
    
def test_metric_relationships():
    """Test metric → hub → user relationships"""
    
def test_ultra_metric_creation():
    """Test ultra domain metric creation"""

# tests/test_ultra_logic.py
def test_ultra_score_calculation_basic():
    """Test Ultra Score = avg of 7 domains"""
    
def test_ultra_score_with_habits():
    """Test habit streak bonus affects Ultra Score"""
    
def test_ultra_state_classification():
    """Test state mapping: Critical, Danger, Weak, Stable, Good, Excellent, Elite"""
    
def test_ultra_score_trend_detection():
    """Test 7-day trend calculation"""

# tests/test_automation_engine.py
def test_rule_evaluation_ultra_below():
    """Test ULTRA_BELOW condition triggers correctly"""
    
def test_rule_evaluation_hub_below():
    """Test HUB_BELOW condition for weak hubs"""
    
def test_action_queue_generation():
    """Test automation generates correct actions"""
    
def test_conflict_resolution():
    """Test conflicting rules resolve by priority"""
    
def test_quiet_hours_respect():
    """Test actions respect user quiet hours"""

# tests/test_hub_calculations.py
def test_hub_score_from_metrics():
    """Test hub score calculated from metrics"""
    
def test_hub_state_classification():
    """Test hub state: Danger, Weak, Average, Good, Prime"""
    
def test_weakest_hub_detection():
    """Test system identifies weakest hub"""
```

### 1.3 Integration Tests (API)

**Framework**: FastAPI `TestClient` or `httpx.AsyncClient`

**Test Database**: In-memory SQLite or PostgreSQL test instance

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

@pytest.fixture
def test_db():
    """Create test database"""
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield TestingSessionLocal()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def client(test_db):
    """Create test client"""
    app.dependency_overrides[get_db] = lambda: test_db
    return TestClient(app)

# tests/test_api/test_logs.py
def test_create_log(client, test_db):
    """Test POST /logs creates log entry"""
    response = client.post("/logs", json={
        "user_id": "user-123",
        "hub_id": 1,
        "source": "Finance_Log",
        "metric": "Spending",
        "value": 45.0,
        "notes": "Groceries",
        "log_date": "2025-11-29"
    })
    assert response.status_code == 201
    assert response.json()["metric"] == "Spending"

def test_get_logs_by_user(client, test_db):
    """Test GET /logs?user_id filters correctly"""
    
def test_get_logs_by_hub(client, test_db):
    """Test GET /logs?hub_id filters correctly"""

# tests/test_api/test_automation.py
def test_evaluate_automation(client, test_db):
    """Test /automation/evaluate returns triggered actions"""
    # Setup: Create user, metrics, rules
    # Execute: Call /automation/evaluate
    # Assert: Correct actions returned
    
def test_action_queue_creation(client, test_db):
    """Test triggered actions populate queue"""
```

### 1.4 E2E Tests (Frontend)

**Framework**: Playwright or Cypress

**Critical User Journeys**:

1. **New User Onboarding**
   - Sign up → Create first log → View dashboard → See Ultra Score
   - Expected: Dashboard shows zero state → first log → score appears

2. **Habit Tracking Flow**
   - Create habit → Check in → View streak → Miss day → See reset warning
   - Expected: Streak increments, warning appears on miss

3. **Project Management**
   - Create project → Add 3 tasks → Mark 1 done → Update project status
   - Expected: Progress reflects completed tasks

4. **Calendar Autofill**
   - View calendar → Trigger autofill → See AI-generated blocks → Edit block
   - Expected: Time blocks appear based on system state

5. **Automation in Action**
   - Log activity that triggers rule → See notification → View queued action → Complete action
   - Expected: Full automation cycle visible to user

**Example Playwright Test**:
```typescript
// tests/e2e/habit-flow.spec.ts
test('user can create and check in habit', async ({ page }) => {
  await page.goto('/habits');
  await page.click('button:has-text("Add Habit")');
  await page.fill('input[name="name"]', 'Morning Meditation');
  await page.click('button:has-text("Create")');
  
  await expect(page.locator('text=Morning Meditation')).toBeVisible();
  await page.click('button[aria-label="Check in Morning Meditation"]');
  
  await expect(page.locator('text=Streak: 1')).toBeVisible();
});
```

### 1.5 Test Configuration

**Makefile**:
```makefile
.PHONY: test test-unit test-integration test-e2e test-coverage

test:
	pytest tests/ -v

test-unit:
	pytest tests/test_*.py -v

test-integration:
	pytest tests/test_api/ -v

test-coverage:
	pytest tests/ --cov=app --cov-report=html --cov-report=term

test-e2e:
	npx playwright test
```

**GitHub Actions CI**:
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
        ports:
          - 5432:5432
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run unit tests
        run: make test-unit
      
      - name: Run integration tests
        run: make test-integration
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 2. Logging & Audit Trail System

### 2.1 Application Logging Architecture

**Framework**: Python `logging` + structured JSON logs

**Log Levels**:
- `DEBUG`: Development/troubleshooting details
- `INFO`: Normal operation events (requests, actions)
- `WARNING`: Unexpected but handled situations
- `ERROR`: Application errors requiring attention
- `CRITICAL`: System failure requiring immediate action

**Log Structure** (JSON):
```json
{
  "timestamp": "2025-11-29T10:30:45.123Z",
  "level": "INFO",
  "request_id": "req_abc123xyz",
  "user_id": "user-456",
  "tenant_id": "tenant-789",
  "endpoint": "/logs",
  "method": "POST",
  "status_code": 201,
  "duration_ms": 45,
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "message": "Log entry created successfully",
  "context": {
    "hub_id": 1,
    "metric": "Spending",
    "value": 45.0
  }
}
```

### 2.2 Logging Implementation

**FastAPI Middleware**:
```python
# app/middleware/logging.py
import time
import uuid
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("lifeos")

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        # Log incoming request
        logger.info({
            "event": "request_started",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "ip": request.client.host,
            "user_agent": request.headers.get("user-agent")
        })
        
        response = await call_next(request)
        
        duration = (time.time() - start_time) * 1000
        
        # Log response
        logger.info({
            "event": "request_completed",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration, 2)
        })
        
        response.headers["X-Request-ID"] = request_id
        return response
```

**Logging Configuration**:
```python
# app/core/logging_config.py
import logging
import sys
from pythonjsonlogger import jsonlogger

def setup_logging(environment: str):
    logger = logging.getLogger("lifeos")
    logger.setLevel(logging.DEBUG if environment == "dev" else logging.INFO)
    
    handler = logging.StreamHandler(sys.stdout)
    
    if environment == "prod":
        formatter = jsonlogger.JsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger
```

### 2.3 Audit Log System

**Database Model**:
```python
# app/models/audit.py
from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.dialects.postgresql import UUID, INET
import uuid
from datetime import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True)
    tenant_id = Column(UUID(as_uuid=True), index=True)
    
    action = Column(String(50), nullable=False)  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT
    entity_type = Column(String(50), nullable=False)  # Project, Habit, Metric, Log
    entity_id = Column(String(100))
    
    details = Column(JSON)  # Non-sensitive metadata
    ip_address = Column(INET)
    user_agent = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('ix_audit_logs_user_action', 'user_id', 'action'),
        Index('ix_audit_logs_entity', 'entity_type', 'entity_id'),
    )
```

**Audit Helper Functions**:
```python
# app/services/audit.py
from app.models.audit import AuditLog
from sqlalchemy.orm import Session
from fastapi import Request

async def log_audit_event(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    details: dict = None,
    request: Request = None
):
    """Record audit event"""
    audit_log = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=sanitize_audit_details(details),
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("user-agent") if request else None
    )
    db.add(audit_log)
    db.commit()

def sanitize_audit_details(details: dict) -> dict:
    """Remove sensitive data from audit logs"""
    if not details:
        return {}
    
    sanitized = details.copy()
    
    # Remove sensitive fields
    sensitive_fields = ['password', 'ssn', 'credit_card', 'bank_account']
    for field in sensitive_fields:
        if field in sanitized:
            sanitized[field] = "[REDACTED]"
    
    # Mask financial values if too specific
    if 'value' in sanitized and sanitized.get('metric') in ['Income', 'Spending']:
        sanitized['value'] = round(sanitized['value'], -1)  # Round to nearest 10
    
    return sanitized
```

**Integration in Routes**:
```python
# app/api/projects.py
@router.post("/projects")
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None
):
    new_project = Project(**project.dict(), user_id=current_user.id)
    db.add(new_project)
    db.commit()
    
    # Log audit event
    await log_audit_event(
        db=db,
        user_id=current_user.id,
        action="CREATE",
        entity_type="Project",
        entity_id=str(new_project.id),
        details={"title": project.title, "status": project.status},
        request=request
    )
    
    return new_project
```

### 2.4 Log Retention & Rotation

**Retention Policy**:
- Application logs: 90 days (hot storage) → 1 year (cold storage) → delete
- Audit logs: 7 years (compliance requirement for financial data)
- Error logs: 1 year
- Performance logs: 30 days

**Cleanup Job**:
```python
# app/jobs/log_cleanup.py
from datetime import datetime, timedelta
from sqlalchemy import delete

async def cleanup_old_logs(db: Session):
    """Run daily to clean up old logs"""
    ninety_days_ago = datetime.utcnow() - timedelta(days=90)
    
    # Delete old application logs
    db.execute(
        delete(ApplicationLog).where(
            ApplicationLog.created_at < ninety_days_ago
        )
    )
    
    # Archive (not delete) audit logs older than 7 years
    seven_years_ago = datetime.utcnow() - timedelta(days=7*365)
    
    # Move to archive table or S3
    old_audits = db.query(AuditLog).filter(
        AuditLog.created_at < seven_years_ago
    ).all()
    
    # Export to S3/Blob storage
    for audit in old_audits:
        await archive_to_s3(audit)
    
    db.commit()
```

---

## 3. Product Analytics & Usage Metrics

### 3.1 Analytics Event Model

**Database Table**:
```python
# app/models/analytics.py
class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True)
    tenant_id = Column(UUID(as_uuid=True), index=True)
    
    event_name = Column(String(100), nullable=False, index=True)
    properties = Column(JSON)  # Non-sensitive event metadata
    
    session_id = Column(String(100), index=True)
    device_type = Column(String(20))  # mobile, desktop, tablet
    browser = Column(String(50))
    os = Column(String(50))
    
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    __table_args__ = (
        Index('ix_analytics_user_event', 'user_id', 'event_name'),
        Index('ix_analytics_date', 'created_at'),
    )
```

### 3.2 Core Events to Track

**User Lifecycle**:
- `user_signed_up`
- `user_logged_in`
- `user_logged_out`
- `user_onboarding_completed`
- `user_subscription_started`
- `user_subscription_cancelled`

**Engagement Events**:
- `dashboard_viewed`
- `hub_viewed`
- `ultra_score_viewed`
- `automation_settings_viewed`

**Feature Usage**:
- `log_created`
- `metric_created`
- `project_created`
- `task_completed`
- `habit_checked_in`
- `habit_streak_milestone` (properties: streak_count)
- `calendar_block_created`
- `calendar_autofill_triggered`
- `automation_action_completed`

**System Events**:
- `ultra_score_calculated`
- `system_state_changed` (properties: old_state, new_state)
- `automation_rule_triggered` (properties: rule_id, action_type)

### 3.3 Analytics Tracking Implementation

**Event Tracking Service**:
```python
# app/services/analytics.py
from app.models.analytics import AnalyticsEvent
from user_agents import parse

async def track_event(
    db: Session,
    user_id: str,
    event_name: str,
    properties: dict = None,
    request: Request = None
):
    """Track analytics event"""
    
    # Parse user agent
    ua = parse(request.headers.get("user-agent", "")) if request else None
    
    event = AnalyticsEvent(
        user_id=user_id,
        event_name=event_name,
        properties=sanitize_properties(properties),
        device_type=get_device_type(ua),
        browser=ua.browser.family if ua else None,
        os=ua.os.family if ua else None
    )
    
    db.add(event)
    db.commit()

def sanitize_properties(properties: dict) -> dict:
    """Remove PII from event properties"""
    if not properties:
        return {}
    
    safe_props = properties.copy()
    
    # Remove sensitive fields
    pii_fields = ['email', 'phone', 'address', 'ssn', 'credit_card']
    for field in pii_fields:
        if field in safe_props:
            del safe_props[field]
    
    # Truncate long text
    for key, value in safe_props.items():
        if isinstance(value, str) and len(value) > 200:
            safe_props[key] = value[:200] + "..."
    
    return safe_props
```

**Automatic Tracking Middleware**:
```python
# app/middleware/analytics.py
class AnalyticsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Track page views
        if request.method == "GET" and response.status_code == 200:
            path = request.url.path
            if path in ["/dashboard", "/hubs", "/ultra", "/projects", "/habits"]:
                await track_event(
                    db=request.state.db,
                    user_id=request.state.user_id,
                    event_name=f"{path.replace('/', '')}_viewed",
                    request=request
                )
        
        return response
```

### 3.4 Analytics Dashboard Endpoint

```python
# app/api/admin/analytics.py
from datetime import datetime, timedelta
from sqlalchemy import func, distinct

@router.get("/admin/analytics-summary")
async def get_analytics_summary(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get product analytics summary"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total users
    total_users = db.query(func.count(User.id)).scalar()
    
    # Active users (logged in last 7 days)
    active_7d = db.query(func.count(distinct(AnalyticsEvent.user_id))).filter(
        AnalyticsEvent.event_name == "user_logged_in",
        AnalyticsEvent.created_at >= datetime.utcnow() - timedelta(days=7)
    ).scalar()
    
    # Active users (last 30 days)
    active_30d = db.query(func.count(distinct(AnalyticsEvent.user_id))).filter(
        AnalyticsEvent.event_name == "user_logged_in",
        AnalyticsEvent.created_at >= start_date
    ).scalar()
    
    # Total logs created
    total_logs = db.query(func.count(LogEntry.id)).scalar()
    
    # Logs created in period
    logs_period = db.query(func.count(LogEntry.id)).filter(
        LogEntry.created_at >= start_date
    ).scalar()
    
    # Projects created
    projects_total = db.query(func.count(Project.id)).scalar()
    
    # Habits checked in
    habit_checkins = db.query(func.count(HabitCheckin.id)).filter(
        HabitCheckin.date >= start_date
    ).scalar()
    
    # Top events
    top_events = db.query(
        AnalyticsEvent.event_name,
        func.count(AnalyticsEvent.id).label('count')
    ).filter(
        AnalyticsEvent.created_at >= start_date
    ).group_by(
        AnalyticsEvent.event_name
    ).order_by(
        func.count(AnalyticsEvent.id).desc()
    ).limit(10).all()
    
    # Hub usage breakdown
    hub_logs = db.query(
        Hub.name,
        func.count(LogEntry.id).label('log_count')
    ).join(
        LogEntry, Hub.id == LogEntry.hub_id
    ).filter(
        LogEntry.created_at >= start_date
    ).group_by(
        Hub.name
    ).all()
    
    return {
        "period_days": days,
        "users": {
            "total": total_users,
            "active_7d": active_7d,
            "active_30d": active_30d
        },
        "logs": {
            "total": total_logs,
            "period": logs_period
        },
        "projects": {
            "total": projects_total
        },
        "habits": {
            "checkins_period": habit_checkins
        },
        "top_events": [
            {"event": e.event_name, "count": e.count} 
            for e in top_events
        ],
        "hub_usage": [
            {"hub": h.name, "logs": h.log_count}
            for h in hub_logs
        ]
    }
```

### 3.5 Frontend Analytics Dashboard

**Component**: `src/pages/Admin/Analytics.tsx`

```typescript
export default function AdminAnalytics() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => supabase.functions.invoke('admin-analytics-summary')
  });

  return (
    <div className="container mx-auto p-6">
      <h1>Product Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={analytics?.users.total}
          icon={Users}
        />
        <StatCard
          title="Active Users (7d)"
          value={analytics?.users.active_7d}
          icon={TrendingUp}
        />
        <StatCard
          title="Total Logs"
          value={analytics?.logs.total}
          icon={FileText}
        />
      </div>
      
      <div className="mt-8">
        <h2>Top Events (Last 30 Days)</h2>
        <BarChart data={analytics?.top_events} />
      </div>
      
      <div className="mt-8">
        <h2>Hub Usage</h2>
        <PieChart data={analytics?.hub_usage} />
      </div>
    </div>
  );
}
```

---

## 4. Error Handling, Resilience & Timeouts

### 4.1 Global Error Handling

**FastAPI Exception Handlers**:
```python
# app/core/errors.py
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, OperationalError
import logging

logger = logging.getLogger("lifeos")

class LifeOSException(Exception):
    """Base exception for LifeOS"""
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code

class ResourceNotFoundError(LifeOSException):
    pass

class UnauthorizedError(LifeOSException):
    pass

def setup_exception_handlers(app: FastAPI):
    
    @app.exception_handler(LifeOSException)
    async def lifeos_exception_handler(request: Request, exc: LifeOSException):
        logger.error(f"LifeOS error: {exc.error_code} - {exc.message}")
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error_code": exc.error_code,
                "message": exc.message,
                "request_id": request.state.request_id
            }
        )
    
    @app.exception_handler(ResourceNotFoundError)
    async def not_found_handler(request: Request, exc: ResourceNotFoundError):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error_code": exc.error_code,
                "message": exc.message,
                "request_id": request.state.request_id
            }
        )
    
    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(request: Request, exc: RequestValidationError):
        errors = exc.errors()
        user_friendly_errors = [
            {
                "field": ".".join(str(loc) for loc in err["loc"] if loc != "body"),
                "message": err["msg"],
                "type": err["type"]
            }
            for err in errors
        ]
        
        logger.warning(f"Validation error: {user_friendly_errors}")
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error_code": "VALIDATION_ERROR",
                "message": "Invalid request data",
                "errors": user_friendly_errors,
                "request_id": request.state.request_id
            }
        )
    
    @app.exception_handler(IntegrityError)
    async def database_integrity_handler(request: Request, exc: IntegrityError):
        logger.error(f"Database integrity error: {str(exc)}")
        
        # Parse common integrity errors
        error_msg = str(exc.orig)
        if "duplicate key" in error_msg.lower():
            message = "A record with this data already exists"
            error_code = "DUPLICATE_RECORD"
        elif "foreign key" in error_msg.lower():
            message = "Referenced record does not exist"
            error_code = "INVALID_REFERENCE"
        else:
            message = "Database constraint violation"
            error_code = "INTEGRITY_ERROR"
        
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error_code": error_code,
                "message": message,
                "request_id": request.state.request_id
            }
        )
    
    @app.exception_handler(OperationalError)
    async def database_operational_handler(request: Request, exc: OperationalError):
        logger.critical(f"Database operational error: {str(exc)}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error_code": "DATABASE_UNAVAILABLE",
                "message": "System is temporarily unavailable. Please try again in a few moments.",
                "request_id": request.state.request_id
            }
        )
    
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        logger.critical(f"Unhandled exception: {type(exc).__name__} - {str(exc)}")
        
        # Don't leak internal errors to users
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error_code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Our team has been notified.",
                "request_id": request.state.request_id
            }
        )
```

### 4.2 Timeout Configuration

**Database Query Timeout**:
```python
# app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,  # Wait 30s for connection from pool
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "connect_timeout": 10,  # TCP connection timeout
        "options": "-c statement_timeout=30000"  # Query timeout 30s
    }
)
```

**HTTP Request Timeout**:
```python
# app/services/external.py
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_external_api(url: str, payload: dict):
    """Call external API with retry and timeout"""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()
        except httpx.TimeoutException:
            logger.error(f"Timeout calling external API: {url}")
            raise
        except httpx.HTTPError as e:
            logger.error(f"HTTP error calling {url}: {e}")
            raise
```

### 4.3 Circuit Breaker Pattern

**For External Services**:
```python
# app/core/circuit_breaker.py
from datetime import datetime, timedelta
from enum import Enum

class CircuitState(Enum):
    CLOSED = "closed"  # Normal operation
    OPEN = "open"      # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing recovery

class CircuitBreaker:
    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: int = 60,
        expected_exception: type = Exception
    ):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
        
        self.failure_count = 0
        self.last_failure_time = None
        self.state = CircuitState.CLOSED
    
    def call(self, func, *args, **kwargs):
        if self.state == CircuitState.OPEN:
            if self._should_attempt_reset():
                self.state = CircuitState.HALF_OPEN
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except self.expected_exception as e:
            self._on_failure()
            raise e
    
    def _on_success(self):
        self.failure_count = 0
        self.state = CircuitState.CLOSED
    
    def _on_failure(self):
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitState.OPEN
            logger.warning(f"Circuit breaker opened after {self.failure_count} failures")
    
    def _should_attempt_reset(self):
        return (
            self.last_failure_time and
            datetime.utcnow() - self.last_failure_time >= timedelta(seconds=self.recovery_timeout)
        )
```

### 4.4 Frontend Error Handling

**Error Boundary Component**:
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-muted-foreground mb-6">
              We've been notified and are working on a fix.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**API Error Handling Hook**:
```typescript
// src/hooks/useApiError.ts
import { toast } from 'sonner';

export function useApiError() {
  const handleError = (error: any) => {
    if (error.response) {
      const { error_code, message } = error.response.data;
      
      switch (error_code) {
        case 'VALIDATION_ERROR':
          toast.error('Please check your input and try again');
          break;
        case 'UNAUTHORIZED':
          toast.error('You need to log in to continue');
          // Redirect to login
          break;
        case 'DUPLICATE_RECORD':
          toast.error(message || 'This record already exists');
          break;
        case 'DATABASE_UNAVAILABLE':
          toast.error('Service temporarily unavailable. Please try again shortly.');
          break;
        default:
          toast.error(message || 'Something went wrong. Please try again.');
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
  };

  return { handleError };
}
```

---

## 5. Performance & Capacity Planning

### 5.1 Database Optimization

**Critical Indexes**:
```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant ON users(tenant_id);

-- Metrics
CREATE INDEX idx_metrics_user_date ON metrics(user_id, metric_date DESC);
CREATE INDEX idx_metrics_hub ON metrics(hub_id);
CREATE INDEX idx_metrics_composite ON metrics(user_id, hub_id, metric_date);

-- Logs
CREATE INDEX idx_logs_user_date ON logs(user_id, log_date DESC);
CREATE INDEX idx_logs_hub ON logs(hub_id);
CREATE INDEX idx_logs_source ON logs(source);

-- Ultra Metrics
CREATE INDEX idx_ultra_user_date ON ultra_metrics(user_id, metric_date DESC);
CREATE INDEX idx_ultra_domain ON ultra_metrics(domain_id);

-- Projects
CREATE INDEX idx_projects_user ON projects(user_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_user_status ON projects(user_id, status);

-- Tasks
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- Habits
CREATE INDEX idx_habits_user ON habits(user_id);

-- Calendar
CREATE INDEX idx_calendar_user_date ON calendar_entries(user_id, date);

-- Automation
CREATE INDEX idx_automation_queue_status ON automation_action_queue(status, scheduled_for);
CREATE INDEX idx_automation_logs_user ON automation_logs(user_id, created_at);

-- Analytics
CREATE INDEX idx_analytics_user_event ON analytics_events(user_id, event_name);
CREATE INDEX idx_analytics_date ON analytics_events(created_at);
```

**Partitioning Strategy** (for logs and metrics):
```sql
-- Partition logs by month
CREATE TABLE logs (
    id SERIAL,
    user_id UUID,
    hub_id INT,
    log_date DATE,
    ...
) PARTITION BY RANGE (log_date);

CREATE TABLE logs_2025_11 PARTITION OF logs
    FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE logs_2025_12 PARTITION OF logs
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Auto-create partitions with cron job
```

### 5.2 Caching Strategy

**Redis Cache Configuration**:
```python
# app/core/cache.py
import redis
from functools import wraps
import json
import hashlib

redis_client = redis.Redis(
    host=REDIS_HOST,
    port=6379,
    decode_responses=True,
    socket_timeout=5,
    socket_connect_timeout=5
)

def cache_result(ttl: int = 300):
    """Decorator to cache function results"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{func.__name__}:{hash_args(args, kwargs)}"
            
            # Try to get from cache
            cached = redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result, default=str)
            )
            
            return result
        return wrapper
    return decorator

def hash_args(args, kwargs):
    """Generate hash from function arguments"""
    key_str = f"{args}:{sorted(kwargs.items())}"
    return hashlib.md5(key_str.encode()).hexdigest()
```

**Cache Usage**:
```python
# app/api/hubs.py
@cache_result(ttl=300)  # Cache for 5 minutes
async def get_hub_scores(user_id: str, db: Session):
    """Get all hub scores for user"""
    return db.query(
        Hub.id,
        Hub.name,
        func.avg(Metric.value).label('score')
    ).join(
        Metric, Hub.id == Metric.hub_id
    ).filter(
        Metric.user_id == user_id,
        Metric.metric_date >= datetime.utcnow() - timedelta(days=7)
    ).group_by(
        Hub.id, Hub.name
    ).all()
```

**Cache Invalidation**:
```python
# app/services/cache.py
def invalidate_user_cache(user_id: str):
    """Invalidate all cache entries for user"""
    pattern = f"*:*{user_id}*"
    keys = redis_client.keys(pattern)
    if keys:
        redis_client.delete(*keys)

# Call after data changes
@router.post("/logs")
async def create_log(...):
    # ... create log
    invalidate_user_cache(current_user.id)
    return new_log
```

### 5.3 Pagination Implementation

**Backend Pagination**:
```python
# app/schemas/pagination.py
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

def paginate(
    query,
    page: int = 1,
    page_size: int = 50,
    max_page_size: int = 100
):
    """Paginate SQLAlchemy query"""
    page_size = min(page_size, max_page_size)
    
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=(total + page_size - 1) // page_size
    )

# Usage in routes
@router.get("/logs")
async def get_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(LogEntry).filter(...)
    return paginate(query, page, page_size)
```

**Frontend Infinite Scroll**:
```typescript
// src/hooks/useInfiniteScroll.ts
import { useInfiniteQuery } from '@tanstack/react-query';

export function useInfiniteLogs(userId: string) {
  return useInfiniteQuery({
    queryKey: ['logs', userId],
    queryFn: ({ pageParam = 1 }) =>
      fetchLogs(userId, pageParam),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
  });
}
```

### 5.4 Rate Limiting

**Rate Limiter Middleware**:
```python
# app/middleware/rate_limit.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/hour"]
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Apply to specific routes
@router.post("/logs")
@limiter.limit("30/minute")
async def create_log(request: Request, ...):
    ...

@router.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

---

## 6. Monitoring & Health Checks

### 6.1 Health Endpoint

```python
# app/api/health.py
from fastapi import APIRouter, status
from sqlalchemy import text

router = APIRouter()

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    
    health_status = {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "services": {}
    }
    
    # Check database
    try:
        db.execute(text("SELECT 1"))
        health_status["services"]["database"] = {
            "status": "ok",
            "latency_ms": 0  # Measure actual latency
        }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status["services"]["database"] = {
            "status": "error",
            "error": "Database unreachable"
        }
        health_status["status"] = "degraded"
    
    # Check Redis
    try:
        redis_client.ping()
        health_status["services"]["cache"] = {"status": "ok"}
    except Exception as e:
        logger.error(f"Redis health check failed: {e}")
        health_status["services"]["cache"] = {
            "status": "error",
            "error": "Cache unavailable"
        }
        health_status["status"] = "degraded"
    
    # Overall status
    status_code = status.HTTP_200_OK if health_status["status"] == "ok" else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(content=health_status, status_code=status_code)

@router.get("/health/ready")
async def readiness_check():
    """Kubernetes readiness probe"""
    return {"ready": True}

@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"alive": True}
```

### 6.2 Metrics Endpoint (Prometheus Format)

```python
# app/api/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest

# Define metrics
request_count = Counter(
    'lifeos_requests_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'lifeos_request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

active_users = Gauge(
    'lifeos_active_users',
    'Currently active users'
)

@router.get("/metrics")
async def prometheus_metrics():
    """Prometheus metrics endpoint"""
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

### 6.3 Application Performance Monitoring

**Performance Tracking Middleware**:
```python
# app/middleware/performance.py
import time
from app.api.metrics import request_duration, request_count

class PerformanceMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        
        # Record metrics
        request_duration.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        request_count.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        # Log slow requests
        if duration > 1.0:  # > 1 second
            logger.warning(
                f"Slow request: {request.method} {request.url.path} took {duration:.2f}s",
                extra={
                    "request_id": request.state.request_id,
                    "user_id": getattr(request.state, 'user_id', None)
                }
            )
        
        return response
```

### 6.4 Alert Configuration

**Alert Rules** (Prometheus format):
```yaml
# alerts.yml
groups:
  - name: lifeos_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(lifeos_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} req/s"
      
      - alert: DatabaseUnreachable
        expr: up{job="lifeos-db"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Database is unreachable"
      
      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(lifeos_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "95th percentile response time > 2s"
      
      - alert: LowDiskSpace
        expr: node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} < 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Disk space below 10%"
```

**Alerting Integration**:
```python
# app/services/alerting.py
import httpx
from typing import Dict

async def send_slack_alert(message: str, severity: str = "warning"):
    """Send alert to Slack"""
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")
    
    color = {
        "info": "#36a64f",
        "warning": "#ff9900",
        "critical": "#ff0000"
    }[severity]
    
    payload = {
        "attachments": [{
            "color": color,
            "title": f"LifeOS Alert [{severity.upper()}]",
            "text": message,
            "ts": int(datetime.utcnow().timestamp())
        }]
    }
    
    async with httpx.AsyncClient() as client:
        await client.post(webhook_url, json=payload)

async def send_email_alert(to: str, subject: str, message: str):
    """Send alert via email"""
    # Implement email sending (SendGrid, AWS SES, etc.)
    pass
```

---

## 7. Environment Management & Deployment

### 7.1 Environment Configuration

**Environment Variables**:
```bash
# .env.dev
ENVIRONMENT=dev
DEBUG=true
DATABASE_URL=sqlite:///./lifeos_dev.db
REDIS_URL=redis://localhost:6379
LOG_LEVEL=DEBUG
FRONTEND_URL=http://localhost:3000

# .env.staging
ENVIRONMENT=staging
DEBUG=false
DATABASE_URL=postgresql://user:pass@staging-db:5432/lifeos
REDIS_URL=redis://staging-redis:6379
LOG_LEVEL=INFO
FRONTEND_URL=https://staging.lifeos.app

# .env.prod
ENVIRONMENT=prod
DEBUG=false
DATABASE_URL=postgresql://user:pass@prod-db:5432/lifeos
REDIS_URL=redis://prod-redis:6379
LOG_LEVEL=WARNING
FRONTEND_URL=https://app.lifeos.app
SENTRY_DSN=https://...
```

**Config Management**:
```python
# app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    environment: str = "dev"
    debug: bool = False
    
    database_url: str
    redis_url: str
    
    log_level: str = "INFO"
    
    frontend_url: str
    
    sentry_dsn: str | None = None
    
    # JWT
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    access_token_expire: int = 30  # minutes
    
    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
```

### 7.2 Database Seeding

**Seed Script**:
```python
# app/db/seed.py
from app.models import Hub, UltraDomain, User, AutomationRule
from app.core.database import SessionLocal

async def seed_database():
    """Seed database with initial data"""
    db = SessionLocal()
    
    try:
        # Check if already seeded
        if db.query(Hub).count() > 0:
            logger.info("Database already seeded")
            return
        
        # Seed hubs
        hubs = [
            Hub(name="Finance", code="FIN", category="Life Management"),
            Hub(name="Health", code="HLT", category="Life Management"),
            Hub(name="Work", code="WRK", category="Career"),
            Hub(name="Academy", code="ACD", category="Learning"),
            Hub(name="Personal Development", code="PD", category="Growth"),
            Hub(name="Household", code="HSE", category="Life Management"),
            Hub(name="Relationships", code="REL", category="Social"),
            Hub(name="Projects", code="PRJ", category="Productivity"),
            Hub(name="Mindset", code="MND", category="Mental Health")
        ]
        db.add_all(hubs)
        
        # Seed ultra domains
        domains = [
            UltraDomain(name="Spirituality", code="SPR", weight=1.0),
            UltraDomain(name="Career Master", code="CAR", weight=1.0),
            UltraDomain(name="Social Life", code="SOC", weight=1.0),
            UltraDomain(name="Emotional Intelligence", code="EMO", weight=1.0),
            UltraDomain(name="Personal Branding & Online Influence", code="BRD", weight=1.0),
            UltraDomain(name="Fitness Performance", code="FIT", weight=1.0),
            UltraDomain(name="Dating & Attraction", code="DAT", weight=1.0)
        ]
        db.add_all(domains)
        
        # Seed default automation rules
        rules = [
            AutomationRule(
                name="Critical Mode - Ultra Score Below 40",
                description="Activate recovery plan when Ultra Score drops critically low",
                condition_type="ULTRA_BELOW",
                condition_value=40,
                action_target="SYSTEM_STATE",
                action_value="Critical Mode",
                priority=1,
                is_active=True
            ),
            AutomationRule(
                name="Health Priority - Low Health Score",
                description="Focus on health when score is low",
                condition_type="HUB_BELOW",
                condition_value=40,
                action_target="PRIORITY_HUB",
                action_value="Health",
                priority=2,
                is_active=True
            ),
            # Add more default rules...
        ]
        db.add_all(rules)
        
        db.commit()
        logger.info("Database seeded successfully")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_database())
```

### 7.3 CI/CD Pipeline

**GitHub Actions Workflow**:
```yaml
# .github/workflows/deploy.yml
name: Deploy Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: lifeos_test
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
      
      - name: Run tests
        run: |
          pytest tests/ --cov=app --cov-report=xml
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/lifeos_test
          REDIS_URL: redis://localhost:6379
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
  
  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker image
        run: |
          docker build -t ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo "${{ secrets.GITHUB_TOKEN }}" | docker login ${{ env.REGISTRY }} -u ${{ github.actor }} --password-stdin
          docker push ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
  
  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment: staging
    
    steps:
      - name: Deploy to staging
        run: |
          # Deploy to staging environment
          # kubectl set image deployment/lifeos lifeos=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          echo "Deploying to staging..."
  
  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Deploy to production
        run: |
          # Deploy to production environment
          echo "Deploying to production..."
```

### 7.4 Docker Configuration

**Dockerfile**:
```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Create non-root user
RUN useradd -m -u 1000 lifeos && chown -R lifeos:lifeos /app
USER lifeos

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import requests; requests.get('http://localhost:8000/health')"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Docker Compose**:
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/lifeos
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  db:
    image: postgres:16
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=lifeos
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

---

## 8. Implementation Checklist

### Phase 1: Foundation (Week 1-2)
- [ ] Set up test infrastructure (pytest, fixtures, test database)
- [ ] Implement structured logging with JSON format
- [ ] Add request ID tracking middleware
- [ ] Create audit log table and helper functions
- [ ] Set up environment configuration management
- [ ] Implement health check endpoint
- [ ] Add database indexes for performance

### Phase 2: Error Handling & Resilience (Week 3)
- [ ] Implement global exception handlers
- [ ] Add validation error formatting
- [ ] Configure database timeouts
- [ ] Implement circuit breaker for external services
- [ ] Add retry logic with exponential backoff
- [ ] Create frontend error boundary

### Phase 3: Testing (Week 4)
- [ ] Write unit tests for models
- [ ] Write unit tests for Ultra Score logic
- [ ] Write unit tests for automation engine
- [ ] Write integration tests for API endpoints
- [ ] Set up CI/CD with GitHub Actions
- [ ] Achieve 70%+ code coverage

### Phase 4: Analytics & Monitoring (Week 5)
- [ ] Create analytics event model
- [ ] Implement event tracking service
- [ ] Build admin analytics dashboard
- [ ] Add Prometheus metrics endpoint
- [ ] Set up performance monitoring
- [ ] Configure alerting rules

### Phase 5: Optimization (Week 6)
- [ ] Implement Redis caching
- [ ] Add pagination to all list endpoints
- [ ] Implement rate limiting
- [ ] Optimize database queries
- [ ] Add database partitioning for logs
- [ ] Frontend performance optimization

### Phase 6: Deployment (Week 7)
- [ ] Create Docker configuration
- [ ] Set up staging environment
- [ ] Implement database seeding
- [ ] Configure log retention
- [ ] Set up monitoring dashboards
- [ ] Run load tests

### Phase 7: Polish & Launch (Week 8)
- [ ] Write E2E tests for critical flows
- [ ] Security audit
- [ ] Performance audit
- [ ] Documentation review
- [ ] Production deployment
- [ ] Post-launch monitoring

---

## 9. Success Metrics

### Technical Metrics
- **Test Coverage**: >70% for backend, >60% for frontend
- **API Response Time**: p95 < 500ms, p99 < 1s
- **Error Rate**: <1% of requests
- **Uptime**: 99.5% (allow 3.65 hours downtime/month)

### User Metrics
- **Daily Active Users (DAU)**: Track growth
- **Feature Adoption**: % users using each feature
- **User Retention**: Day 1, Day 7, Day 30
- **Session Duration**: Average time in app

### Business Metrics
- **Sign-up Conversion**: % visitors who sign up
- **Subscription Conversion**: % free → paid
- **Churn Rate**: Monthly subscription cancellations
- **Revenue per User**: Monthly average

---

## 10. Maintenance & Operations

### Daily Operations
- Review error logs for critical issues
- Monitor uptime and response times
- Check database size and growth rate
- Review user feedback and support tickets

### Weekly Operations
- Review analytics dashboard
- Check test coverage trends
- Review slow query log
- Update dependencies (security patches)

### Monthly Operations
- Performance audit and optimization
- Capacity planning review
- Security audit
- Feature usage analysis
- Cost optimization review

### Quarterly Operations
- Major dependency updates
- Architecture review
- Disaster recovery drill
- User research and feedback sessions
- Roadmap planning

---

This completes the comprehensive Testing, Observability, and Stability Architecture for LifeOS Ultra OmniSuite.