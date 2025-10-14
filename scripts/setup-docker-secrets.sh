#!/bin/bash

################################################################################
# ROI Systems POC - Docker Secrets Setup Script
#
# Purpose: Create Docker secrets for production deployment
# Security Level: CRITICAL
#
# Usage:
#   ./scripts/setup-docker-secrets.sh [environment] [version]
#
# Arguments:
#   environment - production, staging (default: production)
#   version - secret version (default: v1)
#
# Prerequisites:
#   - Docker Swarm initialized: docker swarm init
#   - Environment file exists: .env.[environment]
#   - Secrets generated: ./scripts/generate-secrets.sh [environment]
################################################################################

set -euo pipefail

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
ENVIRONMENT="${1:-production}"
VERSION="${2:-v1}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"

# Secret prefix
SECRET_PREFIX="roi-poc"

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# Validation Functions
################################################################################

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi

    # Check if Swarm is initialized
    if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
        log_error "Docker Swarm is not initialized"
        log_info "Initialize with: docker swarm init"
        exit 1
    fi

    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Generate secrets with: ./scripts/generate-secrets.sh $ENVIRONMENT"
        exit 1
    fi

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(production|staging)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid options: production, staging"
        exit 1
    fi

    log_success "Prerequisites validated"
}

################################################################################
# Secret Creation Functions
################################################################################

create_secret() {
    local secret_name=$1
    local secret_value=$2
    local full_secret_name="${SECRET_PREFIX}-${secret_name}-${VERSION}"

    # Check if secret already exists
    if docker secret ls --format '{{.Name}}' | grep -q "^${full_secret_name}$"; then
        log_warning "Secret already exists: $full_secret_name"
        return 0
    fi

    # Create secret
    echo -n "$secret_value" | docker secret create "$full_secret_name" - 2>/dev/null

    if [ $? -eq 0 ]; then
        log_success "Created secret: $full_secret_name"
        return 0
    else
        log_error "Failed to create secret: $full_secret_name"
        return 1
    fi
}

load_and_create_secrets() {
    log_info "Loading secrets from $ENV_FILE..."

    # Source environment file
    set -a
    source "$ENV_FILE"
    set +a

    log_info "Creating Docker secrets..."

    local failed_secrets=0

    # JWT Secrets
    log_info "Creating JWT secrets..."
    create_secret "jwt-secret" "$JWT_SECRET" || ((failed_secrets++))
    create_secret "jwt-refresh-secret" "$JWT_REFRESH_SECRET" || ((failed_secrets++))

    # Database Secrets
    log_info "Creating database secrets..."
    create_secret "db-password" "$DB_PASSWORD" || ((failed_secrets++))

    # Redis Secrets
    log_info "Creating Redis secrets..."
    create_secret "redis-password" "$REDIS_PASSWORD" || ((failed_secrets++))

    # Session Secret
    log_info "Creating session secrets..."
    create_secret "session-secret" "$SESSION_SECRET" || ((failed_secrets++))

    # Encryption Key
    log_info "Creating encryption secrets..."
    create_secret "encryption-key" "$ENCRYPTION_KEY" || ((failed_secrets++))

    # API Keys
    log_info "Creating API key secrets..."
    create_secret "internal-api-key" "$INTERNAL_API_KEY" || ((failed_secrets++))
    create_secret "webhook-secret" "$WEBHOOK_SECRET" || ((failed_secrets++))

    # AWS Secrets (production only)
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "Creating AWS secrets..."
        if [ -n "${AWS_ACCESS_KEY_ID:-}" ]; then
            create_secret "aws-access-key-id" "$AWS_ACCESS_KEY_ID" || ((failed_secrets++))
        fi
        if [ -n "${AWS_SECRET_ACCESS_KEY:-}" ]; then
            create_secret "aws-secret-access-key" "$AWS_SECRET_ACCESS_KEY" || ((failed_secrets++))
        fi
    fi

    # Elasticsearch Password (if set)
    if [ -n "${ELASTIC_PASSWORD:-}" ]; then
        log_info "Creating Elasticsearch secrets..."
        create_secret "elastic-password" "$ELASTIC_PASSWORD" || ((failed_secrets++))
    fi

    # External service secrets (optional)
    if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
        log_info "Creating external service secrets..."
        create_secret "anthropic-api-key" "$ANTHROPIC_API_KEY" || ((failed_secrets++))
    fi

    if [ $failed_secrets -gt 0 ]; then
        log_error "$failed_secrets secret(s) failed to create"
        return 1
    fi

    log_success "All secrets created successfully"
    return 0
}

################################################################################
# Secret Management Functions
################################################################################

list_secrets() {
    log_info "Listing Docker secrets..."
    echo ""
    docker secret ls --format "table {{.Name}}\t{{.CreatedAt}}\t{{.UpdatedAt}}" | grep "$SECRET_PREFIX"
    echo ""
}

verify_secrets() {
    log_info "Verifying created secrets..."

    local expected_secrets=(
        "jwt-secret"
        "jwt-refresh-secret"
        "db-password"
        "redis-password"
        "session-secret"
        "encryption-key"
        "internal-api-key"
        "webhook-secret"
    )

    if [ "$ENVIRONMENT" = "production" ]; then
        expected_secrets+=("aws-access-key-id" "aws-secret-access-key")
    fi

    local missing_secrets=()
    for secret in "${expected_secrets[@]}"; do
        local full_name="${SECRET_PREFIX}-${secret}-${VERSION}"
        if ! docker secret ls --format '{{.Name}}' | grep -q "^${full_name}$"; then
            missing_secrets+=("$secret")
        fi
    done

    if [ ${#missing_secrets[@]} -eq 0 ]; then
        log_success "All expected secrets are present"
        return 0
    else
        log_error "Missing secrets: ${missing_secrets[*]}"
        return 1
    fi
}

generate_compose_secret_config() {
    log_info "Generating Docker Compose secret configuration..."

    cat > "$PROJECT_ROOT/docker-compose.secrets.yml" << EOF
# Generated Docker Compose secrets configuration
# Version: $VERSION
# Environment: $ENVIRONMENT
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

secrets:
  jwt_secret:
    external: true
    name: ${SECRET_PREFIX}-jwt-secret-${VERSION}
  jwt_refresh_secret:
    external: true
    name: ${SECRET_PREFIX}-jwt-refresh-secret-${VERSION}
  db_password:
    external: true
    name: ${SECRET_PREFIX}-db-password-${VERSION}
  redis_password:
    external: true
    name: ${SECRET_PREFIX}-redis-password-${VERSION}
  session_secret:
    external: true
    name: ${SECRET_PREFIX}-session-secret-${VERSION}
  encryption_key:
    external: true
    name: ${SECRET_PREFIX}-encryption-key-${VERSION}
  internal_api_key:
    external: true
    name: ${SECRET_PREFIX}-internal-api-key-${VERSION}
  webhook_secret:
    external: true
    name: ${SECRET_PREFIX}-webhook-secret-${VERSION}
EOF

    if [ "$ENVIRONMENT" = "production" ]; then
        cat >> "$PROJECT_ROOT/docker-compose.secrets.yml" << EOF
  aws_access_key_id:
    external: true
    name: ${SECRET_PREFIX}-aws-access-key-id-${VERSION}
  aws_secret_access_key:
    external: true
    name: ${SECRET_PREFIX}-aws-secret-access-key-${VERSION}
  elastic_password:
    external: true
    name: ${SECRET_PREFIX}-elastic-password-${VERSION}
EOF
    fi

    log_success "Generated docker-compose.secrets.yml"
}

################################################################################
# Cleanup Functions
################################################################################

remove_old_secrets() {
    local old_version="${1:-}"

    if [ -z "$old_version" ]; then
        log_warning "No old version specified for cleanup"
        return 0
    fi

    log_info "Removing old secrets (version: $old_version)..."

    local old_secrets=$(docker secret ls --format '{{.Name}}' | grep "${SECRET_PREFIX}-.*-${old_version}")

    if [ -z "$old_secrets" ]; then
        log_info "No old secrets found with version: $old_version"
        return 0
    fi

    echo "$old_secrets" | while read -r secret_name; do
        # Check if secret is in use
        if docker service ls --quiet | xargs -I {} docker service inspect {} --format '{{range .Spec.TaskTemplate.ContainerSpec.Secrets}}{{.SecretName}}{{"\n"}}{{end}}' 2>/dev/null | grep -q "$secret_name"; then
            log_warning "Secret is in use, skipping: $secret_name"
        else
            docker secret rm "$secret_name" 2>/dev/null && log_success "Removed old secret: $secret_name" || log_warning "Failed to remove: $secret_name"
        fi
    done
}

################################################################################
# Reporting Functions
################################################################################

generate_report() {
    echo ""
    echo "================================================================================"
    log_success "Docker Secrets Setup Complete"
    echo "================================================================================"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Version: $VERSION"
    echo "Created: $(date)"
    echo ""
    echo "Created Secrets:"
    docker secret ls --format "  - {{.Name}}" | grep "$SECRET_PREFIX-.*-$VERSION"
    echo ""
    echo "Next Steps:"
    echo "  1. Verify secrets: docker secret ls | grep $SECRET_PREFIX"
    echo "  2. Deploy stack: docker stack deploy -c docker-compose.prod.yml roi-poc"
    echo "  3. Check services: docker stack services roi-poc"
    echo "  4. Monitor logs: docker service logs roi-poc_api"
    echo ""
    echo "Secret Management:"
    echo "  - View secrets: docker secret ls"
    echo "  - Inspect secret: docker secret inspect ${SECRET_PREFIX}-jwt-secret-${VERSION}"
    echo "  - Update secret: Create new version and update service"
    echo "  - Remove secret: docker secret rm <secret-name>"
    echo ""
    echo "Documentation:"
    echo "  - Secrets Management: docs/SECRETS_MANAGEMENT.md"
    echo "  - Docker Secrets: docs/DOCKER_SECRETS.md"
    echo "  - Rotation Policy: docs/SECRET_ROTATION_POLICY.md"
    echo ""
    echo "================================================================================"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo "================================================================================"
    echo "ROI Systems POC - Docker Secrets Setup"
    echo "================================================================================"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Load and create secrets
    if ! load_and_create_secrets; then
        log_error "Secret creation failed"
        exit 1
    fi

    # List created secrets
    list_secrets

    # Verify all expected secrets
    verify_secrets

    # Generate compose configuration
    generate_compose_secret_config

    # Generate report
    generate_report

    log_success "Docker secrets setup completed successfully!"
}

# Run main function
main
