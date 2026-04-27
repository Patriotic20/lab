---
description: Pre-deploy sanity checks (nginx config, docker-compose, remote disk + cache state)
argument-hint: "[ssh-host]"
---

Run pre-deploy sanity checks. Report each step as ✅ or ❌. Continue through all steps even if one fails — give the user the full picture.

`$ARGUMENTS` is the optional SSH target for the LMS production runner. If empty, default to `lms` (assumes a `Host lms` entry in `~/.ssh/config`). If neither works, ask the user for the right target (e.g. `user@1.2.3.4`).

## Steps

1. **Validate `nginx-proxy.conf` syntax.** Run nginx in a throwaway container against the file:
   ```bash
   docker run --rm \
     -v "$PWD/nginx-proxy.conf:/etc/nginx/conf.d/default.conf:ro" \
     nginx:alpine nginx -t
   ```
   Look for `syntax is ok` and `test is successful` in the output.

2. **Validate the merged docker-compose** (dev base + prod overlay) parses cleanly:
   ```bash
   docker compose -f docker-compose.yml -f docker-compose.prod.yml config -q
   ```
   No output = good. Any error here will break `make deploy`.

3. **Validate `scripts/deploy.sh` shell syntax**:
   ```bash
   bash -n scripts/deploy.sh
   ```

4. **Check the GitHub Actions workflow YAML parses** (catches accidental indentation breaks):
   ```bash
   python3 -c "import yaml; yaml.safe_load(open('.github/workflows/pipeline.yaml'))"
   ```

5. **Check disk + build cache on the LMS runner.** This is the single most-impactful health signal:
   ```bash
   ssh "${ARGUMENTS:-lms}" 'df -h /var/lib/docker; echo "---"; docker buildx du 2>/dev/null | head -10; echo "---"; docker images --format "{{.Repository}}:{{.Tag}} {{.Size}}" | grep -E "nusmt-|<none>" | head -20'
   ```
   Flag concerns:
   - ✅ `/var/lib/docker` < 70% used → healthy
   - ⚠️ 70–85% used → next deploy may evict useful build cache
   - ❌ > 85% used → recommend cleanup before deploy: `docker system prune -a --volumes --filter 'until=336h'`
   - Empty `docker buildx du` output → no build cache present, first deploy will be slow (this is OK)

6. **Summary.** End with a one-line verdict:
   - All ✅ → `Safe to push to main.`
   - Any ❌ → `Do NOT push yet — fix <X> first.` Be specific about what to fix.

## Constraints

- This command is **read-only**. Do not modify any files, do not run `docker prune` or any cleanup automatically — only suggest commands the user can run.
- If SSH fails (host unreachable, auth refused), don't get stuck retrying — report ❌ for step 5 and continue with the local-only checks summary.
