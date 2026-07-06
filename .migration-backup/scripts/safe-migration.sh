#!/bin/bash

###############################################################################
# Safe Migration Framework
# 
# Executes migrations with automatic backup and rollback capability
#
# Usage: ./scripts/safe-migration.sh <migration-file.sql>
###############################################################################

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Migration file not specified"
  echo "Usage: ./scripts/safe-migration.sh <migration-file.sql>"
  exit 1
fi

MIGRATION_FILE="$1"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PROJECT_ID="${SUPABASE_PROJECT_ID:-ggaonvyheaxrbobmxism}"

if [ ! -f "${MIGRATION_FILE}" ]; then
  echo "❌ Error: Migration file not found: ${MIGRATION_FILE}"
  exit 1
fi

echo "🔵 Safe Migration Framework"
echo "Migration: ${MIGRATION_FILE}"
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Step 1: Pre-migration backup
echo "📦 Step 1/5: Creating pre-migration backup..."
./scripts/backup-database.sh
BACKUP_FILE="backups/backup_${TIMESTAMP}.tar.gz"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup failed - aborting migration"
  exit 1
fi

echo "✅ Backup created: ${BACKUP_FILE}"
echo ""

# Step 2: Pre-migration validation
echo "🔍 Step 2/5: Running pre-migration validation..."

# Check database connectivity
echo "Checking database connectivity..."
npx supabase db ping --project-id "${PROJECT_ID}" || {
  echo "❌ Database unreachable - aborting"
  exit 1
}

# Validate SQL syntax
echo "Validating SQL syntax..."
psql -d "${DATABASE_URL}" --dry-run < "${MIGRATION_FILE}" 2>&1 | grep -i "error" && {
  echo "❌ SQL validation failed - aborting"
  exit 1
}

echo "✅ Pre-migration validation passed"
echo ""

# Step 3: Execute migration
echo "⚡ Step 3/5: Executing migration..."
psql -d "${DATABASE_URL}" < "${MIGRATION_FILE}" || {
  echo "❌ Migration failed - rolling back..."
  ./scripts/restore-database.sh "${BACKUP_FILE}"
  exit 1
}

echo "✅ Migration executed successfully"
echo ""

# Step 4: Post-migration validation
echo "🔍 Step 4/5: Running post-migration validation..."

# Verify tables exist
echo "Verifying table integrity..."
npx supabase db lint --project-id "${PROJECT_ID}" || {
  echo "⚠️  Linter warnings detected"
}

# Verify RLS is still enabled
echo "Verifying RLS policies..."
psql -d "${DATABASE_URL}" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;" | grep -v "0 rows" && {
  echo "❌ RLS disabled on some tables - rolling back..."
  ./scripts/restore-database.sh "${BACKUP_FILE}"
  exit 1
}

echo "✅ Post-migration validation passed"
echo ""

# Step 5: Create rollback script
echo "📝 Step 5/5: Creating rollback script..."
cat > "migrations/rollback_${TIMESTAMP}.sh" <<EOF
#!/bin/bash
# Rollback script for migration: ${MIGRATION_FILE}
# Created: ${TIMESTAMP}

echo "Rolling back migration..."
./scripts/restore-database.sh "${BACKUP_FILE}"
echo "Rollback complete"
EOF

chmod +x "migrations/rollback_${TIMESTAMP}.sh"

echo "✅ Rollback script created: migrations/rollback_${TIMESTAMP}.sh"
echo ""
echo "🎉 Migration completed successfully!"
echo ""
echo "💡 To rollback: ./migrations/rollback_${TIMESTAMP}.sh"
