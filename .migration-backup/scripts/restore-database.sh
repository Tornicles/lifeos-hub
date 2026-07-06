#!/bin/bash

###############################################################################
# Database Restore Script
# 
# Restores a database backup created by backup-database.sh
#
# Usage: ./scripts/restore-database.sh <backup-file.tar.gz>
###############################################################################

set -e

if [ -z "$1" ]; then
  echo "❌ Error: Backup file not specified"
  echo "Usage: ./scripts/restore-database.sh <backup-file.tar.gz>"
  exit 1
fi

BACKUP_FILE="$1"
PROJECT_ID="${SUPABASE_PROJECT_ID:-ggaonvyheaxrbobmxism}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "🔵 Starting database restore"
echo "Backup file: ${BACKUP_FILE}"
echo "Project ID: ${PROJECT_ID}"
echo ""
echo "⚠️  WARNING: This will OVERWRITE your current database!"
read -p "Are you sure you want to continue? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^yes$ ]]; then
  echo "❌ Restore cancelled"
  exit 0
fi

# Extract backup
echo "📦 Extracting backup..."
TEMP_DIR=$(mktemp -d)
tar -xzf "${BACKUP_FILE}" -C "${TEMP_DIR}"

BACKUP_DIR=$(ls -d "${TEMP_DIR}"/*/ | head -1)

# Restore schema
echo "📝 Restoring schema..."
psql "${DATABASE_URL}" < "${BACKUP_DIR}/schema.sql"

# Restore policies
echo "🔒 Restoring RLS policies..."
psql "${DATABASE_URL}" < "${BACKUP_DIR}/policies.sql"

# Restore data
echo "💾 Restoring data..."
psql "${DATABASE_URL}" < "${BACKUP_DIR}/data.sql"

# Cleanup
rm -rf "${TEMP_DIR}"

echo "✅ Database restore complete"
echo "💡 Run migrations if needed: npx supabase db push"
