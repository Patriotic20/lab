#!/bin/bash
#
# Logs Backup Script
# Usage: ./scripts/backup_logs.sh
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
BACKUP_DIR="$BACKUP_DIR_BASE/logs"
LOGS_DIR="$PROJECT_DIR/backend/logs"
MAX_BACKUPS=10

# ─── Setup ───────────────────────────────────────────────
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/logs_${TIMESTAMP}.tar.gz"

# ─── Check logs directory ───────────────────────────────
if [ ! -d "$LOGS_DIR" ] || [ -z "$(ls -A "$LOGS_DIR" 2>/dev/null)" ]; then
    echo "⚠️  No logs found in $LOGS_DIR"
    exit 0
fi

# ─── Create backup ──────────────────────────────────────
echo "📦 Creating logs backup: $BACKUP_FILE"

tar -czf "$BACKUP_FILE" -C "$PROJECT_DIR/backend" logs/

SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "✅ Logs backup complete: $SIZE"

# ─── Rotate old backups ─────────────────────────────────
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/logs_*.tar.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
    echo "🔄 Rotating: removing $REMOVE_COUNT old backup(s)"
    ls -1t "$BACKUP_DIR"/logs_*.tar.gz | tail -n "$REMOVE_COUNT" | xargs rm -f
fi

# ─── List backups ────────────────────────────────────────
echo ""
echo "📂 Log backups ($BACKUP_DIR):"
ls -lh "$BACKUP_DIR"/logs_*.tar.gz 2>/dev/null | awk '{print "   " $NF " (" $5 ")"}'
