# LifeOS Developer Setup Guide

## Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **Supabase CLI** (optional for local development)
- **Text Editor** (VS Code recommended)

---

## Quick Start (5 Minutes)

### 1. Clone Repository
```bash
git clone https://github.com/your-org/lifeos.git
cd lifeos
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your values:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:5173`

---

## Full Setup (Development Environment)

### 1. Install Supabase CLI (Optional)
```bash
npm install -g supabase
```

### 2. Link to Supabase Project
```bash
supabase login
supabase link --project-ref ggaonvyheaxrbobmxism
```

### 3. Pull Latest Database Schema
```bash
supabase db pull
```

### 4. Run Migrations Locally
```bash
supabase db reset
```

### 5. Seed Initial Data
```bash
psql $DATABASE_URL < supabase/seed.sql
```

---

## Project Structure

```
lifeos/
├── src/
│   ├── components/        # React components
│   ├── pages/            # Page components (routes)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   ├── integrations/     # Supabase integration
│   └── index.css         # Global styles + design tokens
├── supabase/
│   ├── functions/        # Edge functions (Deno)
│   │   ├── _shared/      # Shared utilities
│   │   ├── calculate-ultra-score/
│   │   ├── evaluate-automation/
│   │   └── ...
│   ├── migrations/       # Database migrations
│   └── config.toml       # Supabase configuration
├── tests/
│   ├── integration/      # Integration tests
│   ├── pentest/          # Security tests
│   └── deployment/       # Deployment verification
├── docs/
│   ├── developer/        # Developer documentation
│   └── deployment/       # Deployment guides
└── scripts/              # Utility scripts
```

---

## Common Development Tasks

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
# Unit tests
npm test

# Integration tests
npm test tests/integration

# Penetration tests
cd tests/pentest && npm run test:all
```

### Deploy Edge Functions
```bash
supabase functions deploy
```

### Create Database Migration
```bash
supabase migration new your_migration_name
# Edit supabase/migrations/TIMESTAMP_your_migration_name.sql
```

### Apply Migrations
```bash
supabase db push
```

---

## Database Development

### Local Supabase Instance
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database (wipes all data!)
supabase db reset
```

### Running Queries
```bash
# Open PostgreSQL shell
psql $DATABASE_URL

# Run SQL file
psql $DATABASE_URL < file.sql
```

### Inspecting Schema
```bash
# Generate types
supabase gen types typescript --local > src/integrations/supabase/types.ts

# View tables
psql $DATABASE_URL -c "\dt"

# View policies
psql $DATABASE_URL -c "SELECT * FROM pg_policies;"
```

---

## Edge Functions Development

### Create New Edge Function
```bash
# Create function directory
mkdir -p supabase/functions/my-function

# Create index.ts
cat > supabase/functions/my-function/index.ts <<EOF
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Your function logic here
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
EOF
```

### Enable JWT Verification
```toml
# Add to supabase/config.toml
[functions.my-function]
verify_jwt = true
```

### Deploy Function
```bash
supabase functions deploy my-function
```

### Test Function Locally
```bash
supabase functions serve my-function --env-file .env.local
```

---

## Testing Guide

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test tests/integration/auth.test.ts
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Run Penetration Tests
```bash
cd tests/pentest
npm install
npm run test:all
```

---

## Debugging

### View Edge Function Logs
```bash
supabase functions logs my-function
```

### View Database Logs
```bash
supabase logs db
```

### Common Errors

#### "Missing authorization header"
- **Cause:** No JWT token in request
- **Fix:** Ensure user is signed in and token is passed

#### "Row violates row-level security policy"
- **Cause:** User doesn't own the resource
- **Fix:** Check user_id and tenant_id filters

#### "Infinite recursion detected in policy"
- **Cause:** Policy references the same table
- **Fix:** Use SECURITY DEFINER helper function

---

## Git Workflow

### Branching Strategy
```
main          - Production
├─ staging    - Pre-production testing
└─ feature/*  - Feature branches
```

### Commit Messages
```
feat: Add habit streak calculation
fix: Resolve RLS policy issue on projects table
security: Enable JWT verification on data-flow-processor
docs: Update API documentation
test: Add integration tests for automation
```

### Pull Request Process
1. Create feature branch from `staging`
2. Make changes and commit
3. Run tests locally
4. Push and create PR
5. Wait for CI checks to pass
6. Request review
7. Merge to `staging`
8. Test in staging environment
9. Merge to `main` for production

---

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## Troubleshooting

### Problem: Can't connect to Supabase
**Solution:** Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_ANON_KEY`

### Problem: Migrations fail
**Solution:** Run `supabase db reset` to start fresh, or restore from backup

### Problem: Edge functions return 401
**Solution:** Ensure user is authenticated and JWT token is valid

### Problem: RLS blocks legitimate queries
**Solution:** Review RLS policies with `SELECT * FROM pg_policies WHERE tablename = 'your_table';`

---

## Additional Resources

- [Architecture Guide](./ARCHITECTURE.md)
- [Security Guide](./SECURITY_GUIDE.md)
- [API Documentation](../API_BLUEPRINT.md)
- [Security Audit Checklist](./SECURITY_AUDIT_CHECKLIST.md)

---

## Getting Help

- **Documentation:** `/docs` directory
- **Issues:** GitHub Issues
- **Security:** security@lifeos.app (private reporting)
