# GitHub Secrets Setup for CI/CD

## Required GitHub Secrets

Add these secrets to your GitHub repository settings (`Settings > Secrets and variables > Actions`).

### Database & Infrastructure Secrets
- `POSTGRES_USER` - PostgreSQL username (e.g., `bekzod`)
- `POSTGRES_PASSWORD` - PostgreSQL password (⚠️ SECURE)
- `POSTGRES_DB` - Database name (e.g., `basic_database`)

### JWT Secrets (Generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- `APP_CONFIG__JWT__ACCESS_TOKEN_SECRET` - Access token secret (⚠️ SECURE)
- `APP_CONFIG__JWT__REFRESH_TOKEN_SECRET` - Refresh token secret (⚠️ SECURE)

### Admin Credentials
- `APP_CONFIG__ADMIN__USERNAME` - Admin username (e.g., `admin`)
- `APP_CONFIG__ADMIN__PASSWORD` - Admin password (⚠️ SECURE)
- `APP_CONFIG__ADMIN__SECRET_KEY` - Admin secret key (⚠️ SECURE)

### Database URLs (Production)
- `APP_CONFIG__DATABASE__URL` - Production database connection URL
  - Example: `postgresql+asyncpg://user:password@prod.db.host:5432/database_name`
- `APP_CONFIG__DATABASE__TEST_URL` - Test database connection URL
  - Example: `postgresql+asyncpg://user:password@test.db.host:5432/test_db`

### File Upload & APIs
- `APP_CONFIG__FILE_URL__HTTP` - HTTP URL for file uploads (e.g., `https://yourdomain.com/uploads/questions`)
- `APP_CONFIG__FILE_URL__UPLOAD_DIR` - Upload directory (can be non-secret, in template)
- `APP_CONFIG__HEMIS__LOGIN_URL` - HEMIS login URL (can be non-secret, in template)
- `APP_CONFIG__HEMIS__ME_URL` - HEMIS account URL (can be non-secret, in template)

### Caching
- `APP_CONFIG__REDIS__PREFIX` - Redis key prefix (non-sensitive, in template)

### Monitoring & Logging
- `LOGFIRE_PROJECT_NAME` - Logfire project name
- `LOGFIRE_TOKEN` - Logfire authentication token (⚠️ SECURE)

### Admin Dashboard Secrets
- `PGADMIN_DEFAULT_EMAIL` - PgAdmin admin email
- `PGADMIN_DEFAULT_PASSWORD` - PgAdmin admin password (⚠️ SECURE)

## What's NOT in Secrets (from .env.template)

These non-sensitive values are loaded from `.env.template` and don't need secrets:

```
APP_CONFIG__DATABASE__ECHO=False
APP_CONFIG__DATABASE__ECHO_POOL=False
APP_CONFIG__DATABASE__POOL_SIZE=50
APP_CONFIG__DATABASE__MAX_OVERFLOW=10
APP_CONFIG__SERVER__APP_PATH=main:app
APP_CONFIG__SERVER__HOST=0.0.0.0
APP_CONFIG__SERVER__PORT=8000
APP_CONFIG__JWT__ACCESS_TOKEN_EXPIRES_MINUTES=30
APP_CONFIG__JWT__REFRESH_TOKEN_EXPIRES_DAYS=7
APP_CONFIG__JWT__ALGORITHM=HS256
APP_CONFIG__REDIS__HOST=redis  (or localhost for dev)
APP_CONFIG__REDIS__PORT=6379
```

## How It Works

### Development (CI Tests)
1. `.env.template` is loaded (non-sensitive defaults)
2. CI-specific values override (test database, localhost Redis)
3. No GitHub secrets needed for tests

### Production (Deployment)
1. `.env.template` is copied to `.env` and `backend/.env`
2. GitHub secrets override sensitive data:
   - Database passwords
   - JWT tokens
   - Admin credentials
   - API tokens
3. Template values are used for non-sensitive config
4. Result: Secure, maintainable, less secret sprawl

## Adding Secrets to GitHub

```bash
# Via GitHub CLI
gh secret set POSTGRES_PASSWORD --body your_password
gh secret set APP_CONFIG__JWT__ACCESS_TOKEN_SECRET --body your_secret
# ... etc
```

Or manually in GitHub UI:
1. Go to `Settings > Secrets and variables > Actions`
2. Click `New repository secret`
3. Add Name and Value
4. Click `Add secret`

## ✅ Validation

After adding secrets, verify in CI/CD logs that:
- ✅ `.env` files are created with correct values
- ✅ Docker containers start successfully
- ✅ No hardcoded secrets appear in logs
- ✅ All sensitive data comes from GitHub secrets
