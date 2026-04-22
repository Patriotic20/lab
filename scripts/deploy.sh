#!/bin/bash
#
# Zero-Downtime Deployment Script
# Usage: ./scripts/deploy.sh
#        make deploy
#
# Strategy:
#   1. Build new images while old containers still serve traffic
#   2. Run DB migrations on the live database
#   3. Restart each service with the pre-built image; wait for healthy before moving on
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE="docker compose -f $PROJECT_DIR/docker-compose.yml -f $PROJECT_DIR/docker-compose.prod.yml"
BACKEND_CONTAINER="nusmt_backend"

# ─── On any failure: dump logs from all app containers so error is visible ──
on_error() {
    local exit_code=$?
    echo ""
    echo "╔══════════════════════════════════════════════════╗"
    echo "║   ❌ DEPLOY FAILED (exit $exit_code) — container logs    ║"
    echo "╚══════════════════════════════════════════════════╝"
    for c in nusmt_backend nusmt_face_detection nusmt_frontend nusmt_nginx database; do
        if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
            echo ""
            echo "─── $c (last 50 lines) ─────────────────────────────"
            docker logs --tail 50 "$c" 2>&1 || true
            echo "─── $c container state ─────────────────────────────"
            docker inspect --format='State: {{.State.Status}} | OOMKilled: {{.State.OOMKilled}} | ExitCode: {{.State.ExitCode}} | Restarts: {{.RestartCount}}' "$c" 2>&1 || true
        fi
    done
    exit $exit_code
}
trap on_error ERR

# ─── Wait for a container to become healthy ─────────────────────────────────
wait_healthy() {
    local container="$1"
    local timeout="${2:-90}"
    local elapsed=0

    echo "   ⏳ Waiting for $container to become healthy..."
    while [ $elapsed -lt $timeout ]; do
        status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "not_found")
        case "$status" in
            healthy)
                echo "   ✅ $container is healthy"
                return 0
                ;;
            unhealthy)
                echo "   ❌ $container is unhealthy — aborting"
                docker logs --tail 30 "$container"
                exit 1
                ;;
            not_found)
                echo "   ❌ Container $container not found"
                exit 1
                ;;
        esac
        sleep 3
        elapsed=$((elapsed + 3))
    done

    echo "   ❌ Timed out waiting for $container to become healthy"
    exit 1
}

cd "$PROJECT_DIR"

echo "╔══════════════════════════════════════════════════╗"
echo "║        Zero-Downtime Deployment                  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ─── Step 1: Build new images (old containers still running) ─────────────────
echo "🔨 [1/7] Building new images (traffic uninterrupted)..."
$COMPOSE build --parallel face-detection backend frontend
echo "   ✅ Images built"
echo ""

# ─── Step 2: Ensure database + redis are up (needed for migrations) ──────────
echo "🗄️  [2/7] Ensuring database + redis are up..."
$COMPOSE up -d --no-build database redis
# Wait for postgres healthcheck (postgres image has its own healthcheck in compose)
for i in $(seq 1 30); do
    if docker exec database pg_isready -U "${POSTGRES_USER:-postgres}" > /dev/null 2>&1; then
        echo "   ✅ Database is ready"
        break
    fi
    sleep 2
done
echo ""

# ─── Step 3: Apply migrations using a fresh one-shot container of new image ──
echo "⬆️  [3/7] Applying database migrations (one-shot with new image)..."
$COMPOSE run --rm --no-deps backend sh -c "cd /face/app && uv run alembic upgrade head"
echo "   ✅ Migrations applied"
echo ""

# ─── Step 4: Rolling restart — face-detection ────────────────────────────────
echo "🔄 [4/7] Restarting face-detection..."
$COMPOSE up -d --no-build --no-deps face-detection
wait_healthy "nusmt_face_detection"
echo ""

# ─── Step 5: Rolling restart — backend ───────────────────────────────────────
echo "🔄 [5/7] Restarting backend..."
$COMPOSE up -d --no-build --no-deps backend
wait_healthy "$BACKEND_CONTAINER"
echo ""

# ─── Step 6: Rolling restart — frontend ──────────────────────────────────────
echo "🔄 [6/7] Restarting frontend..."
$COMPOSE up -d --no-build --no-deps frontend
echo "   ✅ Frontend restarted"
echo ""

# ─── Step 7: Ensure nginx reverse-proxy is up and reload config ──────────────
echo "🔄 [7/7] Reloading nginx reverse-proxy..."
$COMPOSE up -d --no-build --no-deps nginx
docker exec nusmt_nginx nginx -s reload 2>/dev/null || true
echo "   ✅ Nginx reloaded"
echo ""

# ─── Cleanup ─────────────────────────────────────────────────────────────────
echo "🧹 Pruning dangling images..."
docker image prune -f > /dev/null
echo ""

echo "✅ Zero-downtime deployment complete!"
