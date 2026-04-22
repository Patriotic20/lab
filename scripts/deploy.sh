#!/bin/bash
#
# Simple Deployment Script
# Usage: ./scripts/deploy.sh  /  make deploy
#
#   1. Build new images
#   2. Apply database migrations (one-shot container)
#   3. Recreate all services
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE="docker compose -f $PROJECT_DIR/docker-compose.yml -f $PROJECT_DIR/docker-compose.prod.yml"

# ─── On failure: dump logs so the real error is visible ─────────────────────
on_error() {
    local exit_code=$?
    echo ""
    echo "❌ DEPLOY FAILED (exit $exit_code) — container logs follow:"
    for c in nusmt_backend nusmt_face_detection nusmt_frontend nusmt_nginx database; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
            echo ""
            echo "─── $c (last 40 lines) ───"
            docker logs --tail 40 "$c" 2>&1 || true
        fi
    done
    exit $exit_code
}
trap on_error ERR

cd "$PROJECT_DIR"

echo "🔨 [1/3] Building images..."
$COMPOSE build --parallel face-detection backend frontend

echo ""
echo "🗄️  [2/3] Applying database migrations..."
$COMPOSE up -d --no-build database redis
for i in $(seq 1 30); do
    if docker exec database pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; then break; fi
    sleep 2
done
$COMPOSE run --rm --no-deps backend sh -c "cd /face/app && uv run alembic upgrade head"

echo ""
echo "🚀 [3/3] Starting all services..."
$COMPOSE up -d --no-build --remove-orphans

echo ""
echo "🧹 Pruning dangling images..."
docker image prune -f > /dev/null

echo ""
echo "✅ Deployment complete!"
$COMPOSE ps
