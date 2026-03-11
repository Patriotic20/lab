#!/bin/bash
#
# Database Restore Script
# Usage: ./scripts/restore.sh backups/backup_2026-02-18_13-00-00.sql.gz
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ROOT_ENV="$PROJECT_DIR/.env"
BACKEND_ENV="$PROJECT_DIR/backend/.env"
DB_CONTAINER="database"

# Try to load from root .env first, then backend .env
ENV_FILE=""
if [ -f "$ROOT_ENV" ]; then
    ENV_FILE="$ROOT_ENV"
elif [ -f "$BACKEND_ENV" ]; then
    ENV_FILE="$BACKEND_ENV"
fi

if [ -z "$ENV_FILE" ]; then
    echo "❌ Neither .env nor backend/.env found"
    exit 1
fi

DB_NAME=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)
DB_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "❌ Could not read POSTGRES_DB or POSTGRES_USER from $ENV_FILE"
    exit 1
fi

# ─── Validate input ─────────────────────────────────────
if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "$PROJECT_DIR"/backups/backup_*.sql.gz 2>/dev/null | awk '{print "  " $NF " (" $5 ")"}'
    exit 1
fi

BACKUP_FILE="$1"
if [[ "$BACKUP_FILE" != /* ]]; then
    BACKUP_FILE="$PROJECT_DIR/$BACKUP_FILE"
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ File not found: $BACKUP_FILE"
    exit 1
fi

# ─── Confirm ────────────────────────────────────────────
echo "⚠️  This will REPLACE ALL DATA in '$DB_NAME' with:"
echo "   $BACKUP_FILE"
echo ""
read -p "Are you sure? (y/N): " confirm
if [[ "$confirm" != [yY] ]]; then
    echo "Cancelled."
    exit 0
fi

# ─── Check container ────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '$DB_CONTAINER' is not running!"
    exit 1
fi

# ─── Restore ────────────────────────────────────────────
echo "🔄 Dropping existing data..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "📦 Restoring from backup..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1

echo "✅ Restore complete!"
echo ""

# Show counts
echo "📊 Table counts:"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "SELECT schemaname, relname AS table, n_live_tup AS rows 
     FROM pg_stat_user_tables 
     ORDER BY relname;" 2>/dev/null


echo "🏷️  Stamping database with current migration head..."

# ─── Find backend container ────────────────────────────────────────────────

BACKEND_CONTAINER=$(docker ps -a | grep "backend" | awk '{print $1}' | head -n1)

if [ -z "$BACKEND_CONTAINER" ]; then
    echo "❌ Could not find a running backend container."
    exit 1
fi

echo "🐳 Running alembic stamp head in container $BACKEND_CONTAINER..."
docker exec -i "$BACKEND_CONTAINER" sh -c "cd /face/app && uv run alembic stamp head"

echo "✅ Stamp complete!"