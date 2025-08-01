#!/bin/bash

set -e

echo "🚀 Setting up ROI Systems POC Development Environment"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        print_error "Python 3 is not installed. Please install Python 3.11+."
        exit 1
    fi
    
    print_status "Prerequisites check passed ✓"
}

# Create environment files
create_env_files() {
    print_status "Creating environment files..."
    
    # Root .env file
    if [ ! -f .env ]; then
        cat > .env << EOF
# Development Environment Variables
NODE_ENV=development
PYTHON_ENV=development

# Database
DATABASE_URL=postgresql://roi_dev:dev_password_123@localhost:5432/roi_poc_dev
POSTGRES_USER=roi_dev
POSTGRES_PASSWORD=dev_password_123
POSTGRES_DB=roi_poc_dev

# Redis
REDIS_URL=redis://roi_dev:dev_redis_pass@localhost:6379

# JWT Secrets (Development Only)
JWT_SECRET=dev_jwt_secret_key_very_long_and_secure_for_development_only
JWT_REFRESH_SECRET=dev_refresh_secret_key_very_long_and_secure_for_development_only

# AWS/LocalStack
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
S3_ENDPOINT=http://localhost:4566
S3_BUCKET=roi-documents-dev

# Claude AI (Set your actual API key)
CLAUDE_API_KEY=your_claude_api_key_here

# Email (Development - using MailHog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# RabbitMQ
RABBITMQ_URL=amqp://roi_dev:dev_rabbit_pass@localhost:5672
EOF
        print_status "Created .env file - Please update CLAUDE_API_KEY"
    fi
    
    # Create service-specific env files
    for service in auth-service user-service document-service ai-service; do
        if [ ! -d "services/${service}" ]; then
            mkdir -p "services/${service}"
        fi
        if [ ! -f "services/${service}/.env" ]; then
            cp .env "services/${service}/.env"
        fi
    done
}

# Initialize databases
initialize_databases() {
    print_status "Initializing databases..."
    
    # Start only database services first
    docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch
    
    # Wait for services to be ready
    print_status "Waiting for database services to be ready..."
    sleep 30
    
    # Run database migrations
    if [ -d "database/migrations" ]; then
        print_status "Running database migrations..."
        # Add migration commands here
    fi
    
    # Create Elasticsearch indices
    print_status "Creating Elasticsearch indices..."
    curl -X PUT "localhost:9200/documents" -H "Content-Type: application/json" -d '{
        "mappings": {
            "properties": {
                "title": {"type": "text", "analyzer": "standard"},
                "content": {"type": "text", "analyzer": "standard"},
                "document_type": {"type": "keyword"},
                "tags": {"type": "keyword"},
                "created_at": {"type": "date"}
            }
        }
    }' || print_warning "Elasticsearch index creation failed (may already exist)"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    if [ -f package.json ]; then
        npm install
    fi
    
    # Install service dependencies
    for service_dir in services/*/; do
        if [ -f "${service_dir}package.json" ]; then
            print_status "Installing dependencies for $(basename "$service_dir")"
            cd "$service_dir"
            npm install
            cd - > /dev/null
        elif [ -f "${service_dir}requirements.txt" ]; then
            print_status "Installing Python dependencies for $(basename "$service_dir")"
            cd "$service_dir"
            pip install -r requirements.txt
            pip install -r requirements-dev.txt 2>/dev/null || true
            cd - > /dev/null
        fi
    done
}

# Setup LocalStack S3 bucket
setup_localstack() {
    print_status "Setting up LocalStack S3 bucket..."
    
    # Wait for LocalStack to be ready
    sleep 10
    
    # Create S3 bucket
    aws --endpoint-url=http://localhost:4566 s3 mb s3://roi-documents-dev || print_warning "S3 bucket may already exist"
    
    print_status "LocalStack setup complete"
}

# Main execution
main() {
    print_status "Starting development environment setup..."
    
    check_prerequisites
    create_env_files
    
    # Start infrastructure services
    print_status "Starting infrastructure services..."
    docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch rabbitmq mailhog localstack
    
    initialize_databases
    install_dependencies
    setup_localstack
    
    print_status "Development environment setup complete! 🎉"
    print_status ""
    print_status "Next steps:"
    print_status "1. Update CLAUDE_API_KEY in .env file"
    print_status "2. Run 'npm run dev' to start all services"
    print_status "3. Visit http://localhost:3000 for API Gateway"
    print_status "4. Visit http://localhost:8025 for MailHog (email testing)"
    print_status "5. Visit http://localhost:15672 for RabbitMQ Management (roi_dev/dev_rabbit_pass)"
    print_status ""
    print_status "Available services:"
    print_status "- API Gateway: http://localhost:3000"
    print_status "- Auth Service: http://localhost:3001"
    print_status "- User Service: http://localhost:3002"
    print_status "- Document Service: http://localhost:3003"
    print_status "- AI Service: http://localhost:8000"
    print_status "- Elasticsearch: http://localhost:9200"
    print_status "- Redis: localhost:6379"
    print_status "- PostgreSQL: localhost:5432"
}

# Execute main function
main "$@"