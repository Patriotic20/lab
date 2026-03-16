.PHONY: help up down restart logs frontend-logs backend-logs face-logs prod-up prod-down prod-restart prod-logs backup backup-database backup-logs backup-images restore

.DEFAULT_GOAL := help

# Show this help message with usage examples
help:
	@echo "╔════════════════════════════════════════════════════════════════╗"
	@echo "║         Available commands (Development & Production)          ║"
	@echo "╚════════════════════════════════════════════════════════════════╝"
	@echo ""
	@echo "DEVELOPMENT (localhost, no nginx):"
	@echo "──────────────────────────────────"
	@echo "make up               - Start all services (dev, localhost)"
	@echo "make down             - Stop all services"
	@echo "make restart          - Restart all services"
	@echo "make logs             - View logs for all services"
	@echo "make frontend-logs    - View frontend logs"
	@echo "make backend-logs     - View backend logs"
	@echo "make face-logs        - View face detection logs"
	@echo ""
	@echo "PRODUCTION (with nginx reverse proxy):"
	@echo "────────────────────────────────────"
	@echo "make prod-up          - Start all services (prod, with nginx)"
	@echo "make prod-down        - Stop all services"
	@echo "make prod-restart     - Restart all services"
	@echo "make prod-logs        - View logs for all services"
	@echo ""
	@echo "BACKUP & RESTORE:"
	@echo "────────────────"
	@echo "make backup           - Backup database, logs, and images"
	@echo "make backup-database  - Backup only the PostgreSQL database"
	@echo "make backup-logs      - Backup only backend logs"
	@echo "make backup-images    - Backup only uploaded images"
	@echo "make restore FILE=path/to/backup.sql.gz - Restore from backup"
	@echo ""

# Start development services (localhost, no nginx)
up:
	docker compose up -d --build

# Stop development services
down:
	docker compose down

# Restart development services
restart: down up

# View development logs
logs:
	docker compose logs -f

# View frontend logs
frontend-logs:
	docker compose logs -f frontend

# View backend logs
backend-logs:
	docker compose logs -f backend

# View face detection logs
face-logs:
	docker compose logs -f face-detection

# Start production services (with nginx reverse proxy)
prod-up:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# Stop production services
prod-down:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml down

# Restart production services
prod-restart: prod-down prod-up

# View production logs
prod-logs:
	docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Backup everything (database, logs, and images)
backup: backup-database backup-logs backup-images

# Backup just the database
backup-database:
	./ndktu-student-platform/scripts/backup.sh

# Backup just the logs
backup-logs:
	./ndktu-student-platform/scripts/backup_logs.sh

# Backup just the images
backup-images:
	./ndktu-student-platform/scripts/backup_images.sh

# Restore database from backup file
restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=path/to/backup.sql.gz"; exit 1; fi
	./ndktu-student-platform/scripts/restore.sh $$(realpath $(FILE))
