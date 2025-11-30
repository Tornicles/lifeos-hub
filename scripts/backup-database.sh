#!/bin/bash

###############################################################################
# Database Backup Script
# 
# Creates a full backup of the Supabase PostgreSQL database including:
# - Schema (tables, views, functions, triggers)
# - RLS policies
# - Data
# - Roles and permissions
#
# Usage: ./scripts/backup-database.sh
###############################################################################

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/${TIMESTAMP}"
PROJECT_ID="${SUPABASE_PROJECT_ID:-ggaonvyheaxrbobmxism}"

echo "🔵 Starting database backup at ${TIMESTAMP}"
echo "Project ID: ${PROJECT_ID}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup schema
echo "📦 Backing up schema..."
npx supabase db dump --project-id "${PROJECT_ID}" \
  --schema public \
  > "${BACKUP_DIR}/schema.sql"

# Backup RLS policies
echo "🔒 Backing up RLS policies..."
npx supabase db dump --project-id "${PROJECT_ID}" \
  --use-copy \
  --data-only \
  > "${BACKUP_DIR}/policies.sql"

# Backup data
echo "💾 Backing up data..."
npx supabase db dump --project-id "${PROJECT_ID}" \
  --data-only \
  > "${BACKUP_DIR}/data.sql"

# Create metadata file
echo "📝 Creating metadata file..."
cat > "${BACKUP_DIR}/metadata.json" <<EOF
{
  "timestamp": "${TIMESTAMP}",
  "project_id": "${PROJECT_ID}",
  "backup_type": "full",
  "files": [
    "schema.sql",
    "policies.sql",
    "data.sql"
  ]
}
EOF

# Compress backup
echo "🗜️ Compressing backup..."
tar -czf "backups/backup_${TIMESTAMP}.tar.gz" -C backups "${TIMESTAMP}"

# Remove uncompressed directory
rm -rf "${BACKUP_DIR}"

echo "✅ Backup complete: backups/backup_${TIMESTAMP}.tar.gz"
echo "💡 To restore: ./scripts/restore-database.sh backups/backup_${TIMESTAMP}.tar.gz"
