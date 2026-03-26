.PHONY: help up down restart logs frontend-logs backend-logs backup backup-database backup-logs backup-images restore deploy

.DEFAULT_GOAL := help

# Show this help message with usage examples
help:
	@echo "Available commands:"
	@echo "-------------------"
	@echo "make up               - Start all Docker services in the background"
	@echo "                        Example: make up"
	@echo "make down             - Stop and remove all Docker containers"
	@echo "                        Example: make down"
	@echo "make restart          - Restart all Docker services"
	@echo "                        Example: make restart"
	@echo "make logs             - View logs for all services"
	@echo "                        Example: make logs"
	@echo "make frontend-logs    - View logs specifically for the frontend container"
	@echo "                        Example: make frontend-logs"
	@echo "make backend-logs     - View logs specifically for the backend container"
	@echo "                        Example: make backend-logs"
	@echo "make backup           - Backup database, logs, and images"
	@echo "                        Example (default path): make backup"
	@echo "                        Example (custom path):  make backup FILE=/my/custom/path"
	@echo "make backup-database  - Backup only the PostgreSQL database"
	@echo "                        Example (default path): make backup-database"
	@echo "                        Example (custom path):  make backup-database FILE=/my/custom/path"
	@echo "make backup-logs      - Backup only backend logs"
	@echo "                        Example (default path): make backup-logs"
	@echo "                        Example (custom path):  make backup-logs FILE=/my/custom/path"
	@echo "make backup-images    - Backup only uploaded images"
	@echo "                        Example (default path): make backup-images"
	@echo "                        Example (custom path):  make backup-images FILE=/my/custom/path"
	@echo "make restore          - Restore the database from a given SQL.GZ backup file"
	@echo "                        Example: make restore FILE=backups/backup_2026-02-18_13-00-00.sql.gz"
	@echo ""
	@echo "make deploy           - Zero-downtime update for backend"
	@echo "                        Example: make deploy"

# Start all services
up:
	docker compose up -d --build

# Stop operations
down:
	docker compose down

# Restart operations
restart: down up

# Tail all logs
logs:
	docker compose logs -f

# Tail frontend logs
frontend-logs:
	docker compose logs -f frontend

# Tail backend logs
backend-logs:
	docker compose logs -f backend

# Backup everything (database, logs, and images)
backup: backup-database backup-logs backup-images

# Backup just the database
backup-database:
	FILE="$(FILE)" ./scripts/backup.sh

# Backup just the logs
backup-logs:
	FILE="$(FILE)" ./scripts/backup_logs.sh

# Backup just the images
backup-images:
	FILE="$(FILE)" ./scripts/backup_images.sh

# Target to restore database from backup file
restore:
	@if [ -z "$(FILE)" ]; then echo "Usage: make restore FILE=backups/backup_YYYY-MM-DD_HH-MM-SS.sql.gz"; exit 1; fi
	./scripts/restore.sh $(FILE)


# Zero-Downtime Deployment
deploy:
	@echo "🚀 Starting Zero-Downtime Deployment..."
	
	# 1. Update Backend (Zero-Downtime)
	@echo "Updating Backend..."
	docker compose up -d --build backend
	
	# 2. Update Frontend (Zero-Downtime)
	@echo "Updating Frontend..."
	docker compose up -d --build frontend
	
	@echo "✅ Deployment finished successfully!"
	
	# Clean up old images
	docker image prune -f