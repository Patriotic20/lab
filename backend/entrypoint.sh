#!/bin/bash
set -e

# Migrations are applied by scripts/deploy.sh in a one-shot container
# before backend starts — no need to run them again on every container boot.

echo "Starting application..."
exec uv run "$@"