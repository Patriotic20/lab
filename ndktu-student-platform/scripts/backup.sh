#!/bin/bash
#
# Database Auto Backup Script
# Usage: ./scripts/backup.sh
# Cron:  0 */6 * * * /path/to/project/scripts/backup.sh
#

set -euo pipefail

# ─── Config ──────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/.backup_config"

CUSTOM_PATH="${FILE:-${1:-}}"
if [ -n "$CUSTOM_PATH" ]; then
    if [[ "$CUSTOM_PATH" != /* ]]; then
        CUSTOM_PATH="$PWD/$CUSTOM_PATH"
    fi
    BACKUP_DIR_BASE="$CUSTOM_PATH"
    echo "BACKUP_DIR_BASE=\"$BACKUP_DIR_BASE\"" > "$CONFIG_FILE"
    echo "💾 Saved custom backup directory: $BACKUP_DIR_BASE"
elif [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
fi

BACKUP_DIR_BASE="${BACKUP_DIR_BASE:-$PROJECT_DIR/backups}"
BACKUP_DIR="$BACKUP_DIR_BASE"
ENV_FILE="$PROJECT_DIR/backend/.env"
DB_CONTAINER="database"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

DB_NAME=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)
DB_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)

if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ]; then
    echo "❌ Could not read POSTGRES_DB or POSTGRES_USER from $ENV_FILE"
    exit 1
fi

MAX_BACKUPS=10  # Keep last N backups

# ─── Setup ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
BACKUP_GZ="$BACKUP_FILE.gz"

# ─── Check container ────────────────────────────────────
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
    echo "❌ Container '$DB_CONTAINER' is not running!"
    exit 1
fi

# ─── Create backup ──────────────────────────────────────
echo "📦 Creating backup: $BACKUP_GZ"
echo "   Database: $DB_NAME | Container: $DB_CONTAINER"

docker exec "$DB_CONTAINER" \
    pg_dump -U "$DB_USER" -d "$DB_NAME" \
    --no-owner --no-privileges \
    | gzip > "$BACKUP_GZ"

SIZE=$(du -h "$BACKUP_GZ" | cut -f1)
echo "✅ Backup complete: $SIZE"

# ─── Rotate old backups ─────────────────────────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🔄 Rotating: removing $REMOVE_COUNT old backup(s)"
    ls -1t "$BACKUP_DIR"/backup_*.sql.gz | tail -n "$REMOVE_COUNT" | xargs rm -f
fi

# ─── List backups ────────────────────────────────────────
echo ""
echo "📂 Backups ($BACKUP_DIR):"
ls -lh "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
echo ""
echo "💡 Restore with: make restore FILE=backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz"
