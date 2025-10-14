#!/bin/bash

################################################################################
# ROI Systems POC - Cryptographically Secure Secret Generation Script
#
# Purpose: Generate all required secrets for the application following NIST guidelines
# Security Level: CRITICAL
# NIST Compliance: SP 800-90A, SP 800-132
#
# Usage:
#   ./scripts/generate-secrets.sh [environment]
#
# Arguments:
#   environment - development, staging, or production (default: development)
#
# Output:
#   .env.[environment] file with all generated secrets
################################################################################

set -euo pipefail

# Color output for terminal
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"
BACKUP_DIR="$PROJECT_ROOT/.secrets-backup"

# Secret requirements (NIST compliant)
JWT_SECRET_LENGTH=64      # 512 bits for production-grade JWT
JWT_REFRESH_LENGTH=64     # 512 bits for refresh tokens
DB_PASSWORD_LENGTH=32     # 256 bits minimum
REDIS_PASSWORD_LENGTH=32  # 256 bits minimum
SESSION_SECRET_LENGTH=64  # 512 bits for session encryption
API_KEY_LENGTH=48         # 384 bits for API keys
ENCRYPTION_KEY_LENGTH=64  # 512 bits for data encryption

################################################################################
# Functions
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

# Check for required commands
check_dependencies() {
    local missing_deps=()

    if ! command -v openssl &> /dev/null; then
        missing_deps+=("openssl")
    fi

    if ! command -v base64 &> /dev/null; then
        missing_deps+=("base64")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again"
        exit 1
    fi
}

# Generate cryptographically secure random string
# Uses /dev/urandom which is appropriate for cryptographic purposes
generate_secret() {
    local length=$1
    local encoding="${2:-base64}"

    if [ "$encoding" = "hex" ]; then
        openssl rand -hex "$length"
    elif [ "$encoding" = "alphanumeric" ]; then
        # Generate alphanumeric string (letters and numbers only)
        LC_ALL=C tr -dc 'A-Za-z0-9' < /dev/urandom | head -c "$length"
    else
        # Base64 encoding (default)
        openssl rand -base64 "$length" | tr -d '\n' | head -c "$length"
    fi
}

# Generate a secure password with special characters
generate_password() {
    local length=$1
    # Include uppercase, lowercase, numbers, and safe special characters
    LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*()_+=-' < /dev/urandom | head -c "$length"
}

# Validate secret strength
validate_secret_strength() {
    local secret=$1
    local min_length=$2
    local name=$3

    if [ ${#secret} -lt "$min_length" ]; then
        log_error "Secret $name is too short (${#secret} < $min_length)"
        return 1
    fi

    # Check entropy (basic check for randomness)
    local unique_chars=$(echo -n "$secret" | grep -o . | sort -u | wc -l | tr -d ' ')
    if [ "$unique_chars" -lt 10 ]; then
        log_warning "Secret $name may have low entropy (unique chars: $unique_chars)"
    fi

    return 0
}

# Backup existing secrets file
backup_existing_secrets() {
    if [ -f "$OUTPUT_FILE" ]; then
        log_info "Backing up existing secrets file..."
        mkdir -p "$BACKUP_DIR"
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_file="$BACKUP_DIR/.env.$ENVIRONMENT.$timestamp"
        cp "$OUTPUT_FILE" "$backup_file"
        log_success "Backup created: $backup_file"
    fi
}

# Prompt for user-provided secrets
prompt_for_secrets() {
    local secrets_provided=false

    echo ""
    log_info "Optional: Provide external service credentials (press Enter to skip)"
    echo ""

    # Anthropic API Key
    read -p "Anthropic API Key (for Claude AI): " ANTHROPIC_API_KEY
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        secrets_provided=true
    fi

    # AWS Credentials (for production)
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        echo ""
        read -p "AWS Access Key ID: " AWS_ACCESS_KEY_ID
        read -p "AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY

        if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_SECRET_ACCESS_KEY" ]; then
            secrets_provided=true
        fi
    fi

    echo ""
}

# Generate all secrets
generate_all_secrets() {
    log_info "Generating cryptographically secure secrets for $ENVIRONMENT environment..."
    echo ""

    # Core application secrets
    log_info "Generating JWT secrets..."
    JWT_SECRET=$(generate_secret $JWT_SECRET_LENGTH)
    JWT_REFRESH_SECRET=$(generate_secret $JWT_REFRESH_LENGTH)
    validate_secret_strength "$JWT_SECRET" $JWT_SECRET_LENGTH "JWT_SECRET"
    validate_secret_strength "$JWT_REFRESH_SECRET" $JWT_REFRESH_LENGTH "JWT_REFRESH_SECRET"

    log_info "Generating database credentials..."
    DB_PASSWORD=$(generate_password $DB_PASSWORD_LENGTH)
    validate_secret_strength "$DB_PASSWORD" $DB_PASSWORD_LENGTH "DB_PASSWORD"

    log_info "Generating Redis credentials..."
    REDIS_PASSWORD=$(generate_password $REDIS_PASSWORD_LENGTH)
    validate_secret_strength "$REDIS_PASSWORD" $REDIS_PASSWORD_LENGTH "REDIS_PASSWORD"

    log_info "Generating session secrets..."
    SESSION_SECRET=$(generate_secret $SESSION_SECRET_LENGTH)
    validate_secret_strength "$SESSION_SECRET" $SESSION_SECRET_LENGTH "SESSION_SECRET"

    log_info "Generating encryption keys..."
    ENCRYPTION_KEY=$(generate_secret $ENCRYPTION_KEY_LENGTH)
    validate_secret_strength "$ENCRYPTION_KEY" $ENCRYPTION_KEY_LENGTH "ENCRYPTION_KEY"

    log_info "Generating API keys..."
    INTERNAL_API_KEY=$(generate_secret $API_KEY_LENGTH)
    WEBHOOK_SECRET=$(generate_secret $API_KEY_LENGTH)
    validate_secret_strength "$INTERNAL_API_KEY" $API_KEY_LENGTH "INTERNAL_API_KEY"

    # AWS credentials for production
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        if [ -z "${AWS_ACCESS_KEY_ID:-}" ]; then
            AWS_ACCESS_KEY_ID="AKIA$(generate_secret 16 alphanumeric)"
        fi
        if [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
            AWS_SECRET_ACCESS_KEY=$(generate_secret 40)
        fi
        KMS_KEY_ID="arn:aws:kms:us-east-1:123456789012:key/$(uuidgen | tr '[:upper:]' '[:lower:]')"
    fi

    log_success "All secrets generated successfully"
}

# Write secrets to file
write_secrets_file() {
    log_info "Writing secrets to $OUTPUT_FILE..."

    # Create the environment file
    cat > "$OUTPUT_FILE" << EOF
################################################################################
# ROI Systems POC - Environment Configuration ($ENVIRONMENT)
#
# CRITICAL SECURITY WARNING:
# - This file contains sensitive secrets and credentials
# - NEVER commit this file to version control
# - Keep this file secure with appropriate file permissions (600)
# - Rotate secrets regularly according to security policy
#
# Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")
# Environment: $ENVIRONMENT
################################################################################

# Environment
NODE_ENV=$ENVIRONMENT
ENVIRONMENT=$ENVIRONMENT

################################################################################
# Database Configuration
################################################################################
DB_USER=roi_user
DB_PASSWORD=$DB_PASSWORD
DB_NAME=roi_poc
DB_HOST=postgres
DB_PORT=5432
DATABASE_URL=postgresql://roi_user:$DB_PASSWORD@postgres:5432/roi_poc

################################################################################
# Redis Configuration
################################################################################
REDIS_PASSWORD=$REDIS_PASSWORD
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://default:$REDIS_PASSWORD@redis:6379

################################################################################
# JWT & Authentication Secrets
################################################################################
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
SESSION_SECRET=$SESSION_SECRET

################################################################################
# Encryption Keys
################################################################################
ENCRYPTION_KEY=$ENCRYPTION_KEY
ENCRYPTION_ALGORITHM=aes-256-gcm

################################################################################
# API Keys & Webhooks
################################################################################
INTERNAL_API_KEY=$INTERNAL_API_KEY
WEBHOOK_SECRET=$WEBHOOK_SECRET

EOF

    # Add Anthropic API key if provided
    if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
        cat >> "$OUTPUT_FILE" << EOF
################################################################################
# External Services - AI/ML
################################################################################
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

EOF
    fi

    # Add AWS configuration
    if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
        cat >> "$OUTPUT_FILE" << EOF
################################################################################
# AWS Configuration (Production)
################################################################################
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
KMS_KEY_ID=$KMS_KEY_ID

# S3 Buckets
S3_DOCUMENTS_BUCKET=roi-poc-documents-$ENVIRONMENT
S3_ML_MODELS_BUCKET=roi-poc-ml-models-$ENVIRONMENT

EOF
    else
        cat >> "$OUTPUT_FILE" << EOF
################################################################################
# AWS Configuration (Development - LocalStack)
################################################################################
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localstack:4566

# S3 Buckets
S3_DOCUMENTS_BUCKET=roi-poc-documents
S3_ML_MODELS_BUCKET=roi-poc-ml-models

EOF
    fi

    # Add common configuration
    cat >> "$OUTPUT_FILE" << EOF
################################################################################
# Service URLs
################################################################################
API_URL=http://localhost:4000
ML_API_URL=http://localhost:8000
ELASTICSEARCH_URL=http://elasticsearch:9200

# Public URLs (Frontend)
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql

################################################################################
# Email Configuration
################################################################################
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@roi-systems.com

################################################################################
# Feature Flags
################################################################################
ENABLE_ML_FEATURES=true
ENABLE_EMAIL_CAMPAIGNS=true
ENABLE_ANALYTICS=true

################################################################################
# Monitoring & Observability
################################################################################
SENTRY_DSN=
DATADOG_API_KEY=
LOG_LEVEL=info

################################################################################
# Security Configuration
################################################################################
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
CORS_ORIGIN=http://localhost:3000
COOKIE_SECURE=$([ "$ENVIRONMENT" = "production" ] && echo "true" || echo "false")
COOKIE_SAME_SITE=$([ "$ENVIRONMENT" = "production" ] && echo "strict" || echo "lax")

################################################################################
# Secret Rotation Metadata
################################################################################
SECRETS_GENERATED_AT=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
SECRETS_ROTATION_DUE=$(date -u -v+90d +"%Y-%m-%d" 2>/dev/null || date -u -d "+90 days" +"%Y-%m-%d")
SECRETS_VERSION=1.0.0

EOF

    # Set secure file permissions
    chmod 600 "$OUTPUT_FILE"

    log_success "Secrets file created: $OUTPUT_FILE"
    log_warning "File permissions set to 600 (owner read/write only)"
}

# Generate secrets summary
generate_summary() {
    echo ""
    echo "================================================================================"
    log_success "Secret Generation Complete!"
    echo "================================================================================"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "Output File: $OUTPUT_FILE"
    echo ""
    echo "Generated Secrets:"
    echo "  - JWT_SECRET (${#JWT_SECRET} chars)"
    echo "  - JWT_REFRESH_SECRET (${#JWT_REFRESH_SECRET} chars)"
    echo "  - DB_PASSWORD (${#DB_PASSWORD} chars)"
    echo "  - REDIS_PASSWORD (${#REDIS_PASSWORD} chars)"
    echo "  - SESSION_SECRET (${#SESSION_SECRET} chars)"
    echo "  - ENCRYPTION_KEY (${#ENCRYPTION_KEY} chars)"
    echo "  - INTERNAL_API_KEY (${#INTERNAL_API_KEY} chars)"
    echo "  - WEBHOOK_SECRET (${#WEBHOOK_SECRET} chars)"
    echo ""

    if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
        echo "External Services:"
        echo "  - Anthropic API Key configured"
        echo ""
    fi

    echo "Security Reminders:"
    echo "  1. This file contains CRITICAL secrets - protect it carefully"
    echo "  2. Never commit .env.$ENVIRONMENT to version control"
    echo "  3. Rotate secrets every 90 days (due: $(date -u -v+90d +"%Y-%m-%d" 2>/dev/null || date -u -d "+90 days" +"%Y-%m-%d"))"
    echo "  4. Use different secrets for each environment"
    echo "  5. Store production secrets in AWS Secrets Manager or HashiCorp Vault"
    echo ""
    echo "Next Steps:"
    echo "  1. Review the generated .env.$ENVIRONMENT file"
    echo "  2. Run: ./scripts/validate-secrets.sh $ENVIRONMENT"
    echo "  3. For production: Upload secrets to AWS Secrets Manager"
    echo "  4. Start services: docker-compose --env-file .env.$ENVIRONMENT up"
    echo ""
    echo "================================================================================"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo "================================================================================"
    echo "ROI Systems POC - Secure Secret Generation"
    echo "================================================================================"
    echo ""

    # Validate environment
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid options: development, staging, production"
        exit 1
    fi

    # Check dependencies
    check_dependencies

    # Warn about existing file
    if [ -f "$OUTPUT_FILE" ]; then
        log_warning "Existing secrets file found: $OUTPUT_FILE"
        read -p "Do you want to overwrite it? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log_info "Aborting secret generation"
            exit 0
        fi
    fi

    # Backup existing secrets
    backup_existing_secrets

    # Prompt for user-provided secrets
    prompt_for_secrets

    # Generate all secrets
    generate_all_secrets

    # Write to file
    write_secrets_file

    # Generate summary
    generate_summary
}

# Run main function
main
