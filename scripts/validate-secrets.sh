#!/bin/bash

################################################################################
# ROI Systems POC - Secret Validation Script
#
# Purpose: Validate secrets meet security requirements and compliance standards
# Security Level: CRITICAL
# Standards: NIST SP 800-63B, OWASP
#
# Usage:
#   ./scripts/validate-secrets.sh [environment]
#
# Arguments:
#   environment - development, staging, or production (default: development)
#
# Checks:
#   - Secret existence
#   - Minimum length requirements
#   - Entropy validation
#   - Character complexity
#   - Rotation status
#   - Compliance requirements
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
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.$ENVIRONMENT"

# Validation counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Secret requirements (minimum lengths in characters)
declare -A MIN_LENGTHS=(
    ["JWT_SECRET"]=32
    ["JWT_REFRESH_SECRET"]=32
    ["DB_PASSWORD"]=16
    ["REDIS_PASSWORD"]=16
    ["SESSION_SECRET"]=32
    ["ENCRYPTION_KEY"]=32
    ["INTERNAL_API_KEY"]=24
    ["WEBHOOK_SECRET"]=24
)

################################################################################
# Logging Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
}

################################################################################
# Utility Functions
################################################################################

# Calculate entropy of a string
calculate_entropy() {
    local string="$1"
    local length=${#string}

    if [ $length -eq 0 ]; then
        echo "0"
        return
    fi

    # Count frequency of each character
    local -A freq
    for ((i=0; i<length; i++)); do
        local char="${string:$i:1}"
        freq[$char]=$((${freq[$char]:-0} + 1))
    done

    # Calculate entropy using Shannon formula
    local entropy=0
    for char in "${!freq[@]}"; do
        local p=$(echo "scale=10; ${freq[$char]} / $length" | bc)
        local log_p=$(echo "scale=10; l($p) / l(2)" | bc -l)
        entropy=$(echo "scale=10; $entropy - ($p * $log_p)" | bc)
    done

    echo "$entropy"
}

# Check if secret contains common patterns
check_common_patterns() {
    local secret="$1"

    # Check for sequential characters
    if echo "$secret" | grep -qE '(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)'; then
        return 1
    fi

    # Check for repeated characters
    if echo "$secret" | grep -qE '(.)\1{3,}'; then
        return 1
    fi

    # Check for common words
    if echo "$secret" | grep -qiE '(password|admin|secret|key|test|demo)'; then
        return 1
    fi

    return 0
}

# Check character complexity
check_complexity() {
    local secret="$1"
    local has_lower=false
    local has_upper=false
    local has_digit=false
    local has_special=false

    if echo "$secret" | grep -q '[a-z]'; then has_lower=true; fi
    if echo "$secret" | grep -q '[A-Z]'; then has_upper=true; fi
    if echo "$secret" | grep -q '[0-9]'; then has_digit=true; fi
    if echo "$secret" | grep -q '[^a-zA-Z0-9]'; then has_special=true; fi

    local types=0
    $has_lower && ((types++))
    $has_upper && ((types++))
    $has_digit && ((types++))
    $has_special && ((types++))

    echo $types
}

################################################################################
# Validation Functions
################################################################################

validate_secret_exists() {
    local secret_name="$1"
    ((TOTAL_CHECKS++))

    if grep -q "^${secret_name}=" "$ENV_FILE" 2>/dev/null; then
        local value=$(grep "^${secret_name}=" "$ENV_FILE" | cut -d'=' -f2-)
        if [ -n "$value" ] && [ "$value" != "" ]; then
            ((PASSED_CHECKS++))
            log_success "$secret_name exists and has a value"
            echo "$value"
            return 0
        fi
    fi

    ((FAILED_CHECKS++))
    log_error "$secret_name is missing or empty"
    return 1
}

validate_secret_length() {
    local secret_name="$1"
    local secret_value="$2"
    local min_length="${MIN_LENGTHS[$secret_name]:-16}"
    ((TOTAL_CHECKS++))

    local actual_length=${#secret_value}

    if [ $actual_length -ge $min_length ]; then
        ((PASSED_CHECKS++))
        log_success "$secret_name length is sufficient ($actual_length >= $min_length)"
        return 0
    else
        ((FAILED_CHECKS++))
        log_error "$secret_name length is too short ($actual_length < $min_length)"
        return 1
    fi
}

validate_secret_entropy() {
    local secret_name="$1"
    local secret_value="$2"
    local min_entropy=3.0
    ((TOTAL_CHECKS++))

    local entropy=$(calculate_entropy "$secret_value")
    local entropy_ok=$(echo "$entropy >= $min_entropy" | bc -l)

    if [ "$entropy_ok" -eq 1 ]; then
        ((PASSED_CHECKS++))
        log_success "$secret_name has sufficient entropy ($entropy)"
        return 0
    else
        ((FAILED_CHECKS++))
        log_error "$secret_name has low entropy ($entropy < $min_entropy)"
        return 1
    fi
}

validate_secret_complexity() {
    local secret_name="$1"
    local secret_value="$2"
    local min_types=2
    ((TOTAL_CHECKS++))

    local complexity=$(check_complexity "$secret_value")

    if [ $complexity -ge $min_types ]; then
        ((PASSED_CHECKS++))
        log_success "$secret_name has sufficient complexity ($complexity character types)"
        return 0
    else
        ((WARNING_CHECKS++))
        log_warning "$secret_name has low complexity ($complexity < $min_types character types)"
        return 1
    fi
}

validate_no_common_patterns() {
    local secret_name="$1"
    local secret_value="$2"
    ((TOTAL_CHECKS++))

    if check_common_patterns "$secret_value"; then
        ((PASSED_CHECKS++))
        log_success "$secret_name does not contain common patterns"
        return 0
    else
        ((FAILED_CHECKS++))
        log_error "$secret_name contains common patterns or weak sequences"
        return 1
    fi
}

validate_rotation_status() {
    ((TOTAL_CHECKS++))

    if ! grep -q "^SECRETS_ROTATION_DUE=" "$ENV_FILE" 2>/dev/null; then
        ((WARNING_CHECKS++))
        log_warning "No rotation due date found in secrets file"
        return 1
    fi

    local rotation_due=$(grep "^SECRETS_ROTATION_DUE=" "$ENV_FILE" | cut -d'=' -f2)
    local due_timestamp=$(date -j -f "%Y-%m-%d" "$rotation_due" "+%s" 2>/dev/null || date -d "$rotation_due" "+%s" 2>/dev/null || echo "0")
    local now_timestamp=$(date "+%s")

    if [ $due_timestamp -le $now_timestamp ]; then
        ((FAILED_CHECKS++))
        log_error "Secrets rotation is overdue (due: $rotation_due)"
        return 1
    else
        local days_remaining=$(( ($due_timestamp - $now_timestamp) / 86400 ))
        if [ $days_remaining -lt 30 ]; then
            ((WARNING_CHECKS++))
            log_warning "Secrets rotation due soon ($days_remaining days remaining)"
        else
            ((PASSED_CHECKS++))
            log_success "Secrets rotation is up to date ($days_remaining days remaining)"
        fi
        return 0
    fi
}

validate_file_permissions() {
    ((TOTAL_CHECKS++))

    if [ ! -f "$ENV_FILE" ]; then
        ((FAILED_CHECKS++))
        log_error "Environment file not found: $ENV_FILE"
        return 1
    fi

    local perms=$(stat -f "%Lp" "$ENV_FILE" 2>/dev/null || stat -c "%a" "$ENV_FILE" 2>/dev/null)

    if [ "$perms" = "600" ] || [ "$perms" = "400" ]; then
        ((PASSED_CHECKS++))
        log_success "File permissions are secure ($perms)"
        return 0
    else
        ((FAILED_CHECKS++))
        log_error "File permissions are too permissive ($perms) - should be 600 or 400"
        return 1
    fi
}

validate_production_requirements() {
    if [ "$ENVIRONMENT" != "production" ]; then
        return 0
    fi

    log_info "Validating production-specific requirements..."

    ((TOTAL_CHECKS++))
    if grep -q "^AWS_ACCESS_KEY_ID=test" "$ENV_FILE" || grep -q "^DB_PASSWORD=.*password" "$ENV_FILE"; then
        ((FAILED_CHECKS++))
        log_error "Production environment contains development/test credentials"
        return 1
    else
        ((PASSED_CHECKS++))
        log_success "No development credentials found in production"
    fi

    ((TOTAL_CHECKS++))
    if grep -q "^COOKIE_SECURE=true" "$ENV_FILE"; then
        ((PASSED_CHECKS++))
        log_success "Secure cookies enabled for production"
    else
        ((FAILED_CHECKS++))
        log_error "Secure cookies not enabled for production"
    fi

    ((TOTAL_CHECKS++))
    if grep -q "^NODE_ENV=production" "$ENV_FILE"; then
        ((PASSED_CHECKS++))
        log_success "NODE_ENV set to production"
    else
        ((FAILED_CHECKS++))
        log_error "NODE_ENV not set to production"
    fi
}

################################################################################
# Main Validation Process
################################################################################

validate_all_secrets() {
    log_info "Validating secrets in $ENV_FILE..."
    echo ""

    # Validate each required secret
    for secret_name in "${!MIN_LENGTHS[@]}"; do
        echo "----------------------------------------"
        log_info "Validating: $secret_name"

        local secret_value
        if secret_value=$(validate_secret_exists "$secret_name"); then
            validate_secret_length "$secret_name" "$secret_value"
            validate_secret_entropy "$secret_name" "$secret_value"
            validate_secret_complexity "$secret_name" "$secret_value"
            validate_no_common_patterns "$secret_name" "$secret_value"
        fi
        echo ""
    done

    # Additional validations
    echo "----------------------------------------"
    log_info "Additional Security Checks"
    validate_file_permissions
    validate_rotation_status
    validate_production_requirements
    echo ""
}

################################################################################
# Reporting Functions
################################################################################

generate_report() {
    echo "================================================================================"
    echo "Secret Validation Report"
    echo "================================================================================"
    echo ""
    echo "Environment: $ENVIRONMENT"
    echo "File: $ENV_FILE"
    echo "Validated: $(date)"
    echo ""
    echo "Results:"
    echo "  Total Checks: $TOTAL_CHECKS"
    echo "  Passed: ${GREEN}$PASSED_CHECKS${NC}"
    echo "  Failed: ${RED}$FAILED_CHECKS${NC}"
    echo "  Warnings: ${YELLOW}$WARNING_CHECKS${NC}"
    echo ""

    local pass_rate=0
    if [ $TOTAL_CHECKS -gt 0 ]; then
        pass_rate=$(echo "scale=1; ($PASSED_CHECKS * 100) / $TOTAL_CHECKS" | bc)
    fi
    echo "  Pass Rate: $pass_rate%"
    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${GREEN}✓ All critical validations passed${NC}"
        echo ""
        echo "Status: COMPLIANT"
        if [ $WARNING_CHECKS -gt 0 ]; then
            echo "Note: $WARNING_CHECKS warnings require attention"
        fi
    else
        echo -e "${RED}✗ $FAILED_CHECKS critical validation(s) failed${NC}"
        echo ""
        echo "Status: NON-COMPLIANT"
        echo ""
        echo "Action Required:"
        echo "  1. Review failed validations above"
        echo "  2. Regenerate secrets: ./scripts/generate-secrets.sh $ENVIRONMENT"
        echo "  3. Re-run validation: ./scripts/validate-secrets.sh $ENVIRONMENT"
    fi

    echo ""
    echo "================================================================================"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo "================================================================================"
    echo "ROI Systems POC - Secret Validation"
    echo "================================================================================"
    echo ""

    # Validate environment parameter
    if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
        log_error "Invalid environment: $ENVIRONMENT"
        log_error "Valid options: development, staging, production"
        exit 1
    fi

    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found: $ENV_FILE"
        log_info "Run: ./scripts/generate-secrets.sh $ENVIRONMENT"
        exit 1
    fi

    # Check for required commands
    if ! command -v bc &> /dev/null; then
        log_error "bc is required but not installed"
        exit 1
    fi

    # Validate all secrets
    validate_all_secrets

    # Generate report
    generate_report

    # Exit with appropriate code
    if [ $FAILED_CHECKS -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main
