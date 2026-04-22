#!/bin/bash
#
# Merge Backup into Current DB (non-destructive)
# Usage: ./scripts/merge.sh backups/backup_YYYY-MM-DD.sql.gz
#
# Unlike restore.sh, this does NOT drop existing data.
# It loads the backup into a temp DB, exports data with ON CONFLICT DO NOTHING,
# and applies to the current DB — existing rows are preserved, only missing rows added.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env"
DB_CONTAINER="database"
TEMP_DB="temp_merge_$(date +%s)"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found at $ENV_FILE"
    exit 1
fi

DB_NAME=$(grep -E '^POSTGRES_DB=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)
DB_USER=$(grep -E '^POSTGRES_USER=' "$ENV_FILE" | head -n1 | cut -d'=' -f2-)

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

echo "🔀 MERGE mode: existing rows in '$DB_NAME' will be KEPT."
echo "   New rows from $BACKUP_FILE will be added."
echo "   Conflicts on primary keys → skipped (ON CONFLICT DO NOTHING)."
read -p "Proceed? (y/N): " confirm
if [[ "$confirm" != [yY] ]]; then
    echo "Cancelled."
    exit 0
fi

# ─── 0. Clean up on exit ────────────────────────────────
cleanup() {
    echo "🧹 Dropping temp database $TEMP_DB..."
    docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS $TEMP_DB;" > /dev/null 2>&1 || true
}
trap cleanup EXIT

# ─── 1. Create temp DB ──────────────────────────────────
echo "🗃️  Creating temp database $TEMP_DB..."
docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $TEMP_DB;" > /dev/null

# ─── 2. Load backup into temp DB ───────────────────────
echo "📦 Loading backup into temp DB..."
gunzip -c "$BACKUP_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$TEMP_DB" > /dev/null

# ─── 3. Dump data-only from temp with ON CONFLICT DO NOTHING ──
echo "📤 Exporting data with ON CONFLICT DO NOTHING..."
TMP_SQL="/tmp/merge_$(date +%s).sql"
docker exec "$DB_CONTAINER" pg_dump \
    -U "$DB_USER" \
    -d "$TEMP_DB" \
    --data-only \
    --rows-per-insert=1000 \
    --on-conflict-do-nothing \
    --disable-triggers \
    --exclude-table=alembic_version \
    > "$TMP_SQL"

echo "   Dump size: $(du -h "$TMP_SQL" | cut -f1)"

# ─── 4. Apply to main DB inside a transaction ──────────
echo "📥 Merging into main DB '$DB_NAME'..."
cat "$TMP_SQL" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 --single-transaction > /dev/null

rm -f "$TMP_SQL"

# ─── 5. Reset all sequences to MAX(id)+1 — prevents PK conflicts on next INSERT ──
echo "🔢 Resetting sequences to max(id)+1 in '$DB_NAME'..."
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 <<'SQL' > /dev/null
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT
      pg_get_serial_sequence(quote_ident(schemaname) || '.' || quote_ident(tablename), 'id') AS seq,
      quote_ident(schemaname) || '.' || quote_ident(tablename) AS tbl
    FROM pg_tables
    WHERE schemaname = 'public'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = pg_tables.schemaname
          AND table_name = pg_tables.tablename
          AND column_name = 'id'
      )
  LOOP
    IF r.seq IS NOT NULL THEN
      EXECUTE format('SELECT setval(%L, COALESCE((SELECT MAX(id) FROM %s), 0) + 1, false)', r.seq, r.tbl);
    END IF;
  END LOOP;
END $$;
SQL

echo "✅ Merge complete!"
echo ""

# ─── 6. Show counts ────────────────────────────────────
echo "📊 Row counts in '$DB_NAME':"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" -c \
    "SELECT relname AS table, n_live_tup AS rows
     FROM pg_stat_user_tables
     WHERE n_live_tup > 0
     ORDER BY n_live_tup DESC
     LIMIT 20;" 2>/dev/null
