# Docker Compose Environment Setup

## File Structure

- **docker-compose.yml** - Base configuration (shared by all environments)
- **docker-compose.override.yml** - Development (localhost, no nginx)
- **docker-compose.prod.yml** - Production (with nginx reverse proxy)
- **.env.template** - Root environment variables template
- **backend/.env.template** - Backend environment variables template

## Quick Start

### 1. Create Environment Files

Create .env files from templates:
```bash
make env-create
# This creates .env from .env.template
```

Then edit `.env` and `backend/.env` with your actual secrets:
```bash
# Edit the root .env
nano .env

# Edit the backend .env  
cp backend/.env.template backend/.env
nano backend/.env
```

**⚠️ Important**: Replace all `your-*` placeholders with actual secrets:
- Database passwords
- JWT secrets (generate with: `python -c "import secrets; print(secrets.token_urlsafe(32))"`)
- Admin password
- Logfire token (if using monitoring)

## Usage

### Local Development
```bash
# First time setup
make env-create          # Create .env from template
# Edit .env with your secrets
nano .env
cp backend/.env.template backend/.env
nano backend/.env

# Then start services (uses docker-compose.override.yml automatically)
docker-compose up
```

Access services on localhost:
- Backend: http://localhost:8000
- Frontend: http://localhost:3000
- PgAdmin: http://localhost:5050
- Redis: localhost:6379
- Database: localhost:5436

### Production
```bash
# Setup environment files
cp .env.template .env
cp backend/.env.template backend/.env
# Edit both files with your production secrets
nano .env
nano backend/.env

# Then start with production config (includes nginx)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up
```

In production:
- Only nginx exposes ports 80 and 443
- Backend, frontend, and database are internal only
- No direct access to individual services from outside
- All traffic goes through nginx reverse proxy


## Makefile Commands

For convenience, use these make commands:

```bash
# Environment setup
make env-create          # Create .env from .env.template

# Development (localhost)
make up                  # Start services
make down                # Stop services
make restart             # Restart services
make logs                # View all logs
make frontend-logs       # View frontend logs
make backend-logs        # View backend logs

# Production (with nginx)
make prod-up             # Start services
make prod-down           # Stop services
make prod-restart        # Restart services
make prod-logs           # View logs

# Backup & Restore
make backup              # Backup everything
make backup-database     # Backup database only
make restore FILE=path   # Restore from backup
```

## Stopping Services

```bash
# Development
make down
# or
docker-compose down

# Production
make prod-down
# or
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

## Key Differences

| Aspect | Development | Production |
|--------|-------------|-----------|
| Nginx | ❌ No | ✅ Yes |
| Direct Ports | ✅ Yes | ❌ No |
| Port Exposure | All services | Only port 80/443 |
| Setup | Auto-loaded | Manual specification |
| .env.template | ✅ Yes | ✅ Yes |
