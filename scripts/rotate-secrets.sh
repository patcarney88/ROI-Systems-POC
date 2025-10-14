#!/bin/bash

################################################################################
# ROI Systems POC - Secret Rotation Automation Script
#
# Purpose: Automate the rotation of secrets with zero-downtime
# Security Level: CRITICAL
# Compliance: SOC2, PCI-DSS secret rotation requirements
#
# Usage:
#   ./scripts/rotate-secrets.sh [environment] [secret_type]
#
# Arguments:
#   environment - development, staging, or production
#   secret_type - all, jwt, database, redis, api_keys, or encryption
#
# Process:
#   1. Generate new secrets
#   2. Apply dual-secret validation period
#   3. Update services with new secrets
#   4. Verify service health
#   5. Retire old secrets
################################################################################

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-development}"
SECRET_TYPE="${2:-all}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CURRENT_ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
NEW_ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT.new"
ROTATION_LOG="$PROJECT_ROOT/.secrets-backup/rotation-log-$(date +%Y%m%d_%H%M%S).log"

# Rotation configuration
DUAL_SECRET_PERIOD=3600  # 1 hour grace period (seconds)
MAX_RETRIES=3
HEALTH_CHECK_TIMEOUT=30

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$ROTATION_LOG"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$ROTATION_LOG"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$ROTATION_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$ROTATION_LOG"
}

################################################################################
# Validation Functions
################################################################################

check_prerequisites() {
    log_info "Checking prerequisites..."

    if [ ! -f "$CURRENT_ENV_FILE" ]; then
        log_error "Current environment file not found: $CURRENT_ENV_FILE"
        exit 1
    fi

    if ! command -v openssl &> /dev/null; then
        log_error "openssl is required but not installed"
        exit 1
    fi

    if [ "$ENVIRONMENT" = "production" ]; then
        log_warning "Production secret rotation detected!"
        log_warning "This will rotate secrets in PRODUCTION environment"
        read -p "Type 'ROTATE PRODUCTION' to confirm: " confirm
        if [ "$confirm" != "ROTATE PRODUCTION" ]; then
            log_info "Aborting rotation"
            exit 0
        fi
    fi

    log_success "Prerequisites validated"
}

################################################################################
# Secret Generation Functions
################################################################################

generate_secret() {
    local length=$1
    openssl rand -base64 "$length" | tr -d '\n' | head -c "$length"
}

generate_password() {
    local length=$1
    LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+=-' < /dev/urandom | head -c "$length"
}

################################################################################
# Secret Rotation Functions
################################################################################

rotate_jwt_secrets() {
    log_info "Rotating JWT secrets..."

    local new_jwt_secret=$(generate_secret 64)
    local new_jwt_refresh_secret=$(generate_secret 64)

    # Update environment file with new secrets
    sed -i.bak "s/^JWT_SECRET=.*/JWT_SECRET=$new_jwt_secret/" "$NEW_ENV_FILE"
    sed -i.bak "s/^JWT_REFRESH_SECRET=.*/JWT_REFRESH_SECRET=$new_jwt_refresh_secret/" "$NEW_ENV_FILE"

    # Store old secret for dual-validation period
    local old_jwt_secret=$(grep "^JWT_SECRET=" "$CURRENT_ENV_FILE" | cut -d'=' -f2)
    echo "JWT_SECRET_OLD=$old_jwt_secret" >> "$NEW_ENV_FILE"

    log_success "JWT secrets rotated"
}

rotate_database_secrets() {
    log_info "Rotating database password..."

    local new_db_password=$(generate_password 32)

    # Update environment file
    sed -i.bak "s/^DB_PASSWORD=.*/DB_PASSWORD=$new_db_password/" "$NEW_ENV_FILE"
    sed -i.bak "s|postgresql://[^:]*:[^@]*@|postgresql://roi_user:$new_db_password@|" "$NEW_ENV_FILE"

    # Update database user password
    if command -v docker &> /dev/null && docker ps | grep -q roi-poc-postgres; then
        log_info "Updating database password in PostgreSQL..."
        docker exec roi-poc-postgres psql -U roi_user -d roi_poc -c "ALTER USER roi_user WITH PASSWORD '$new_db_password';"
        log_success "Database password updated in PostgreSQL"
    else
        log_warning "PostgreSQL container not running - password will be updated on next startup"
    fi

    log_success "Database secrets rotated"
}

rotate_redis_secrets() {
    log_info "Rotating Redis password..."

    local new_redis_password=$(generate_password 32)

    # Update environment file
    sed -i.bak "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$new_redis_password/" "$NEW_ENV_FILE"
    sed -i.bak "s|redis://[^:]*:[^@]*@|redis://default:$new_redis_password@|" "$NEW_ENV_FILE"

    # Redis password change requires restart with new config
    log_warning "Redis password rotation requires container restart with new configuration"

    log_success "Redis secrets rotated"
}

rotate_api_keys() {
    log_info "Rotating API keys..."

    local new_internal_api_key=$(generate_secret 48)
    local new_webhook_secret=$(generate_secret 48)

    # Update environment file
    sed -i.bak "s/^INTERNAL_API_KEY=.*/INTERNAL_API_KEY=$new_internal_api_key/" "$NEW_ENV_FILE"
    sed -i.bak "s/^WEBHOOK_SECRET=.*/WEBHOOK_SECRET=$new_webhook_secret/" "$NEW_ENV_FILE"

    log_success "API keys rotated"
}

rotate_encryption_keys() {
    log_info "Rotating encryption keys..."
    log_warning "Encryption key rotation requires data re-encryption"

    local new_encryption_key=$(generate_secret 64)

    # Store old key for migration period
    local old_encryption_key=$(grep "^ENCRYPTION_KEY=" "$CURRENT_ENV_FILE" | cut -d'=' -f2)
    echo "ENCRYPTION_KEY_OLD=$old_encryption_key" >> "$NEW_ENV_FILE"

    # Update environment file
    sed -i.bak "s/^ENCRYPTION_KEY=.*/ENCRYPTION_KEY=$new_encryption_key/" "$NEW_ENV_FILE"

    log_warning "Data re-encryption required - run: ./scripts/migrate-encryption.sh"
    log_success "Encryption keys rotated"
}

################################################################################
# Service Management Functions
################################################################################

update_aws_secrets_manager() {
    log_info "Updating AWS Secrets Manager..."

    if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
        log_info "Skipping AWS Secrets Manager for $ENVIRONMENT environment"
        return
    fi

    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found - skipping Secrets Manager update"
        return
    fi

    local secret_name="roi-poc/$ENVIRONMENT/app-secrets"

    # Read the new environment file and create JSON
    local secret_json=$(grep -v "^#" "$NEW_ENV_FILE" | grep -v "^$" | jq -R -s -c 'split("\n") | map(select(length > 0)) | map(split("=")) | map({(.[0]): (.[1:] | join("="))}) | add')

    # Update or create secret
    if aws secretsmanager describe-secret --secret-id "$secret_name" &> /dev/null; then
        aws secretsmanager update-secret \
            --secret-id "$secret_name" \
            --secret-string "$secret_json"
        log_success "Updated AWS Secrets Manager: $secret_name"
    else
        aws secretsmanager create-secret \
            --name "$secret_name" \
            --description "ROI Systems POC secrets for $ENVIRONMENT" \
            --secret-string "$secret_json"
        log_success "Created AWS Secrets Manager: $secret_name"
    fi
}

restart_services() {
    log_info "Restarting services with new secrets..."

    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        log_warning "Production/Staging restart must be done through deployment pipeline"
        log_info "Run: kubectl rollout restart deployment -n $ENVIRONMENT"
        return
    fi

    # Development environment - restart Docker Compose services
    if command -v docker-compose &> /dev/null; then
        log_info "Restarting Docker Compose services..."
        docker-compose --env-file "$NEW_ENV_FILE" up -d --force-recreate
        log_success "Services restarted"
    else
        log_warning "docker-compose not found - manual restart required"
    fi
}

verify_service_health() {
    log_info "Verifying service health..."

    local api_url="${API_URL:-http://localhost:4000}"
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf "$api_url/health" > /dev/null 2>&1; then
            log_success "API health check passed"
            return 0
        fi
        log_info "Waiting for services to be healthy (attempt $attempt/$max_attempts)..."
        sleep 3
        ((attempt++))
    done

    log_error "Service health check failed after $max_attempts attempts"
    return 1
}

################################################################################
# Rollback Functions
################################################################################

rollback_rotation() {
    log_error "Rolling back secret rotation..."

    if [ -f "$CURRENT_ENV_FILE.backup" ]; then
        cp "$CURRENT_ENV_FILE.backup" "$CURRENT_ENV_FILE"
        log_success "Rolled back to previous secrets"

        # Restart services with old secrets
        restart_services
    else
        log_error "No backup file found for rollback!"
    fi
}

################################################################################
# Main Rotation Process
################################################################################

execute_rotation() {
    log_info "Starting secret rotation for $ENVIRONMENT environment..."
    log_info "Secret type: $SECRET_TYPE"

    # Create backup directory
    mkdir -p "$(dirname "$ROTATION_LOG")"

    # Check prerequisites
    check_prerequisites

    # Backup current secrets
    cp "$CURRENT_ENV_FILE" "$CURRENT_ENV_FILE.backup"
    cp "$CURRENT_ENV_FILE" "$NEW_ENV_FILE"
    log_success "Current secrets backed up"

    # Rotate secrets based on type
    case $SECRET_TYPE in
        all)
            rotate_jwt_secrets
            rotate_database_secrets
            rotate_redis_secrets
            rotate_api_keys
            rotate_encryption_keys
            ;;
        jwt)
            rotate_jwt_secrets
            ;;
        database)
            rotate_database_secrets
            ;;
        redis)
            rotate_redis_secrets
            ;;
        api_keys)
            rotate_api_keys
            ;;
        encryption)
            rotate_encryption_keys
            ;;
        *)
            log_error "Invalid secret type: $SECRET_TYPE"
            log_error "Valid options: all, jwt, database, redis, api_keys, encryption"
            exit 1
            ;;
    esac

    # Update rotation metadata
    sed -i.bak "s/^SECRETS_GENERATED_AT=.*/SECRETS_GENERATED_AT=$(date -u +"%Y-%m-%d %H:%M:%S UTC")/" "$NEW_ENV_FILE"
    sed -i.bak "s/^SECRETS_ROTATION_DUE=.*/SECRETS_ROTATION_DUE=$(date -u -v+90d +"%Y-%m-%d" 2>/dev/null || date -u -d "+90 days" +"%Y-%m-%d")/" "$NEW_ENV_FILE"

    # Update AWS Secrets Manager
    update_aws_secrets_manager

    # Apply new secrets
    mv "$NEW_ENV_FILE" "$CURRENT_ENV_FILE"
    log_success "New secrets applied to $CURRENT_ENV_FILE"

    # Restart services
    restart_services

    # Verify service health
    if ! verify_service_health; then
        log_error "Service health check failed after rotation"
        rollback_rotation
        exit 1
    fi

    # Clean up backup files
    rm -f "$NEW_ENV_FILE.bak"

    log_success "Secret rotation completed successfully!"
}

################################################################################
# Reporting Functions
################################################################################

generate_rotation_report() {
    echo ""
    echo "================================================================================"
    log_success "Secret Rotation Complete"
    echo "================================================================================"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Secret Type: $SECRET_TYPE"
    echo "Rotation Time: $(date)"
    echo "Log File: $ROTATION_LOG"
    echo ""
    echo "Rotated Secrets:"
    case $SECRET_TYPE in
        all)
            echo "  - JWT secrets"
            echo "  - Database password"
            echo "  - Redis password"
            echo "  - API keys"
            echo "  - Encryption keys"
            ;;
        *)
            echo "  - $SECRET_TYPE"
            ;;
    esac
    echo ""
    echo "Post-Rotation Tasks:"
    echo "  1. Verify all services are running correctly"
    echo "  2. Check application logs for any errors"
    echo "  3. Update any external systems with new API keys"
    echo "  4. Schedule next rotation for $(date -u -v+90d +"%Y-%m-%d" 2>/dev/null || date -u -d "+90 days" +"%Y-%m-%d")"
    echo ""
    echo "Backup Location: $CURRENT_ENV_FILE.backup"
    echo ""
    if [ "$ENVIRONMENT" = "production" ]; then
        echo "CRITICAL: Production secrets rotated - notify team and update documentation"
        echo ""
    fi
    echo "================================================================================"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo "================================================================================"
    echo "ROI Systems POC - Secret Rotation"
    echo "================================================================================"
    echo ""

    # Execute rotation
    execute_rotation

    # Generate report
    generate_rotation_report

    log_info "Rotation log saved to: $ROTATION_LOG"
}

# Trap errors and rollback
trap 'rollback_rotation' ERR

# Run main function
main
