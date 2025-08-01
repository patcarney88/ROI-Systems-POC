# ROI Systems POC - Makefile
# Convenient commands for development and deployment

.PHONY: help setup dev test build deploy clean

# Default target
help:
	@echo "ROI Systems POC - Available Commands"
	@echo "===================================="
	@echo "make setup      - Set up local development environment"
	@echo "make dev        - Start development servers"
	@echo "make test       - Run all tests"
	@echo "make build      - Build all services"
	@echo "make deploy     - Deploy to staging/production"
	@echo "make clean      - Clean up generated files and containers"
	@echo ""
	@echo "Docker Commands:"
	@echo "make docker-up    - Start all Docker services"
	@echo "make docker-down  - Stop all Docker services"
	@echo "make docker-logs  - View Docker logs"
	@echo "make docker-clean - Remove all Docker volumes and images"
	@echo ""
	@echo "Database Commands:"
	@echo "make db-migrate   - Run database migrations"
	@echo "make db-seed      - Seed database with test data"
	@echo "make db-reset     - Reset database (drop, create, migrate, seed)"
	@echo ""
	@echo "Testing Commands:"
	@echo "make test-unit    - Run unit tests"
	@echo "make test-int     - Run integration tests"
	@echo "make test-e2e     - Run end-to-end tests"
	@echo "make test-sec     - Run security tests"

# Setup local development environment
setup:
	@echo "Setting up local development environment..."
	@chmod +x scripts/setup-local.sh
	@./scripts/setup-local.sh

# Start development servers
dev: docker-up
	@echo "Starting development servers..."
	@echo "Web app: https://localhost"
	@echo "API: https://api.localhost"
	@echo "GraphQL Playground: http://localhost:4000/graphql"

# Run all tests
test: test-unit test-int
	@echo "All tests completed!"

# Run unit tests
test-unit:
	@echo "Running unit tests..."
	@npm run test:unit

# Run integration tests
test-int:
	@echo "Running integration tests..."
	@npm run test:integration

# Run e2e tests
test-e2e:
	@echo "Running end-to-end tests..."
	@npm run test:e2e

# Run security tests
test-sec:
	@echo "Running security tests..."
	@npm audit
	@docker-compose run --rm security-scan

# Build all services
build:
	@echo "Building all services..."
	@npm run build
	@docker-compose build

# Docker commands
docker-up:
	@echo "Starting Docker services..."
	@docker-compose up -d

docker-down:
	@echo "Stopping Docker services..."
	@docker-compose down

docker-logs:
	@docker-compose logs -f

docker-clean:
	@echo "Cleaning Docker resources..."
	@docker-compose down -v
	@docker system prune -af

# Database commands
db-migrate:
	@echo "Running database migrations..."
	@npm run db:migrate

db-seed:
	@echo "Seeding database..."
	@npm run db:seed

db-reset: docker-down
	@echo "Resetting database..."
	@docker-compose up -d postgres
	@sleep 5
	@npm run db:migrate
	@npm run db:seed
	@echo "Database reset complete!"

# Deployment commands
deploy-dev:
	@echo "Deploying to development..."
	@git push origin develop

deploy-staging:
	@echo "Deploying to staging..."
	@git push origin release/current

deploy-prod:
	@echo "Deploying to production..."
	@echo "Please create a PR from release to main"

# Clean everything
clean: docker-clean
	@echo "Cleaning project..."
	@rm -rf node_modules
	@rm -rf apps/*/node_modules
	@rm -rf services/*/node_modules
	@rm -rf packages/*/node_modules
	@rm -rf apps/*/.next
	@rm -rf apps/*/dist
	@rm -rf services/*/dist
	@rm -rf coverage
	@rm -rf logs/*
	@echo "Clean complete!"

# Utility commands
lint:
	@echo "Running linters..."
	@npm run lint

format:
	@echo "Formatting code..."
	@npm run format

type-check:
	@echo "Running type checks..."
	@npm run type-check

# Git hooks
install-hooks:
	@echo "Installing git hooks..."
	@npm run prepare

# Local SSL certificates
ssl-gen:
	@echo "Generating SSL certificates..."
	@mkdir -p infrastructure/docker/nginx/ssl
	@openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout infrastructure/docker/nginx/ssl/localhost.key \
		-out infrastructure/docker/nginx/ssl/localhost.crt \
		-subj "/C=US/ST=State/L=City/O=ROI Systems/CN=localhost"

# Health checks
health-check:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/health || echo "Web app is down"
	@curl -f http://localhost:4000/health || echo "API is down"
	@curl -f http://localhost:5001/health || echo "Auth service is down"
	@curl -f http://localhost:5002/health || echo "Document service is down"

# Monitoring
logs-web:
	@docker-compose logs -f web

logs-api:
	@docker-compose logs -f api

logs-auth:
	@docker-compose logs -f auth

logs-docs:
	@docker-compose logs -f documents

# Performance monitoring
perf-test:
	@echo "Running performance tests..."
	@npm run test:performance

# Backup and restore
backup:
	@echo "Creating backup..."
	@mkdir -p backups
	@docker-compose exec postgres pg_dump -U roi_user roi_poc > backups/roi_poc_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "Backup created!"

restore:
	@echo "Restoring from latest backup..."
	@docker-compose exec -T postgres psql -U roi_user roi_poc < $(shell ls -t backups/*.sql | head -1)
	@echo "Restore complete!"