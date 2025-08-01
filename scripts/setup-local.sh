#!/bin/bash

# ROI Systems POC - Local Development Environment Setup Script
# Supports: macOS, Linux, Windows (WSL)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║        ROI Systems POC - Development Setup               ║"
echo "║        Real Estate Document Management Platform          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        OS="windows"
    else
        echo -e "${RED}Unsupported OS: $OSTYPE${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Detected OS: $OS${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "\n${BLUE}Checking prerequisites...${NC}"
    
    # Check Docker
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}✓ Docker installed: $(docker --version)${NC}"
    else
        echo -e "${RED}✗ Docker not found. Please install Docker Desktop${NC}"
        echo "  Visit: https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        echo -e "${GREEN}✓ Docker Compose installed${NC}"
    else
        echo -e "${RED}✗ Docker Compose not found${NC}"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        echo -e "${GREEN}✓ Node.js installed: $NODE_VERSION${NC}"
        
        # Check Node version
        MIN_NODE_VERSION="18.0.0"
        if [ "$(printf '%s\n' "$MIN_NODE_VERSION" "${NODE_VERSION:1}" | sort -V | head -n1)" != "$MIN_NODE_VERSION" ]; then
            echo -e "${RED}✗ Node.js version must be >= $MIN_NODE_VERSION${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Node.js not found. Please install Node.js >= 18${NC}"
        echo "  Visit: https://nodejs.org/"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        echo -e "${GREEN}✓ npm installed: $(npm -v)${NC}"
    else
        echo -e "${RED}✗ npm not found${NC}"
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        echo -e "${GREEN}✓ Git installed: $(git --version)${NC}"
    else
        echo -e "${RED}✗ Git not found${NC}"
        exit 1
    fi
    
    # Check Python (for ML services)
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        echo -e "${GREEN}✓ Python installed: $PYTHON_VERSION${NC}"
    else
        echo -e "${YELLOW}⚠ Python 3 not found (optional for ML services)${NC}"
    fi
    
    # Check AWS CLI (optional)
    if command -v aws &> /dev/null; then
        echo -e "${GREEN}✓ AWS CLI installed: $(aws --version)${NC}"
    else
        echo -e "${YELLOW}⚠ AWS CLI not found (optional)${NC}"
    fi
}

# Create directories
create_directories() {
    echo -e "\n${BLUE}Creating directory structure...${NC}"
    
    # Create necessary directories if they don't exist
    mkdir -p infrastructure/docker/{nginx/conf.d,nginx/ssl,postgres,localstack}
    mkdir -p logs/{nginx,app}
    mkdir -p data/{uploads,temp}
    
    echo -e "${GREEN}✓ Directory structure created${NC}"
}

# Generate SSL certificates
generate_ssl_certs() {
    echo -e "\n${BLUE}Generating SSL certificates for local development...${NC}"
    
    SSL_DIR="infrastructure/docker/nginx/ssl"
    
    if [ -f "$SSL_DIR/localhost.crt" ] && [ -f "$SSL_DIR/localhost.key" ]; then
        echo -e "${YELLOW}⚠ SSL certificates already exist. Skipping...${NC}"
    else
        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SSL_DIR/localhost.key" \
            -out "$SSL_DIR/localhost.crt" \
            -subj "/C=US/ST=State/L=City/O=ROI Systems/CN=localhost" \
            2>/dev/null
        
        echo -e "${GREEN}✓ SSL certificates generated${NC}"
    fi
}

# Setup environment variables
setup_env_variables() {
    echo -e "\n${BLUE}Setting up environment variables...${NC}"
    
    if [ -f ".env" ]; then
        echo -e "${YELLOW}⚠ .env file already exists. Creating .env.backup${NC}"
        cp .env .env.backup
    fi
    
    # Create .env from example
    cat > .env << EOF
# Environment
NODE_ENV=development
ENVIRONMENT=local

# Database
DB_USER=roi_user
DB_PASSWORD=roi_dev_pass_$(openssl rand -hex 8)
DB_NAME=roi_poc
DATABASE_URL=postgresql://roi_user:roi_dev_pass@localhost:5432/roi_poc

# Redis
REDIS_PASSWORD=redis_dev_pass_$(openssl rand -hex 8)
REDIS_URL=redis://default:redis_dev_pass@localhost:6379

# JWT
JWT_SECRET=jwt_dev_secret_$(openssl rand -hex 32)
JWT_EXPIRES_IN=7d

# AWS (LocalStack)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_ENDPOINT=http://localhost:4566

# S3 Buckets
S3_DOCUMENTS_BUCKET=roi-poc-documents
S3_ML_MODELS_BUCKET=roi-poc-ml-models

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Email (Mailhog)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@roi-systems.local

# API URLs
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
NEXT_PUBLIC_WS_URL=ws://localhost:4000/graphql

# ML Service
ML_API_URL=http://localhost:8000

# Monitoring
SENTRY_DSN=
DATADOG_API_KEY=

# Feature Flags
ENABLE_ML_FEATURES=true
ENABLE_EMAIL_CAMPAIGNS=true
ENABLE_ANALYTICS=true
EOF
    
    echo -e "${GREEN}✓ Environment variables configured${NC}"
}

# Create nginx configuration
setup_nginx_config() {
    echo -e "\n${BLUE}Setting up Nginx configuration...${NC}"
    
    cat > infrastructure/docker/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    
    access_log /var/log/nginx/access.log main;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;
    
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    include /etc/nginx/conf.d/*.conf;
}
EOF

    cat > infrastructure/docker/nginx/conf.d/default.conf << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name localhost;
    return 301 https://$server_name$request_uri;
}

# Web App
server {
    listen 443 ssl http2;
    server_name localhost;
    
    ssl_certificate /etc/nginx/ssl/localhost.crt;
    ssl_certificate_key /etc/nginx/ssl/localhost.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://web:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API
server {
    listen 443 ssl http2;
    server_name api.localhost;
    
    ssl_certificate /etc/nginx/ssl/localhost.crt;
    ssl_certificate_key /etc/nginx/ssl/localhost.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://api:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
    
    echo -e "${GREEN}✓ Nginx configuration created${NC}"
}

# Install dependencies
install_dependencies() {
    echo -e "\n${BLUE}Installing npm dependencies...${NC}"
    
    # Install root dependencies
    npm install
    
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

# Initialize database
init_database() {
    echo -e "\n${BLUE}Initializing database...${NC}"
    
    # Create init SQL script
    cat > infrastructure/docker/postgres/init.sql << 'EOF'
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS documents;
CREATE SCHEMA IF NOT EXISTS analytics;

-- Set search path
SET search_path TO public, auth, documents, analytics;

-- Grant permissions
GRANT ALL ON SCHEMA public TO roi_user;
GRANT ALL ON SCHEMA auth TO roi_user;
GRANT ALL ON SCHEMA documents TO roi_user;
GRANT ALL ON SCHEMA analytics TO roi_user;
EOF
    
    echo -e "${GREEN}✓ Database initialization script created${NC}"
}

# Initialize LocalStack
init_localstack() {
    echo -e "\n${BLUE}Setting up LocalStack initialization...${NC}"
    
    cat > infrastructure/docker/localstack/init.sh << 'EOF'
#!/bin/bash

# Wait for LocalStack to be ready
sleep 10

# Create S3 buckets
aws --endpoint-url=http://localhost:4566 s3 mb s3://roi-poc-documents
aws --endpoint-url=http://localhost:4566 s3 mb s3://roi-poc-ml-models

# Create SQS queues
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name roi-poc-email-queue
aws --endpoint-url=http://localhost:4566 sqs create-queue --queue-name roi-poc-document-processing

# Create secrets in Secrets Manager
aws --endpoint-url=http://localhost:4566 secretsmanager create-secret \
    --name roi-poc/database \
    --secret-string '{"username":"roi_user","password":"roi_pass"}'

echo "LocalStack initialization complete!"
EOF
    
    chmod +x infrastructure/docker/localstack/init.sh
    
    echo -e "${GREEN}✓ LocalStack initialization script created${NC}"
}

# Start services
start_services() {
    echo -e "\n${BLUE}Starting Docker services...${NC}"
    
    # Pull images
    echo "Pulling Docker images..."
    docker-compose pull
    
    # Start services
    echo "Starting services..."
    docker-compose up -d
    
    # Wait for services to be healthy
    echo -e "\n${BLUE}Waiting for services to be healthy...${NC}"
    
    # Function to check service health
    check_service() {
        local service=$1
        local port=$2
        local max_attempts=30
        local attempt=0
        
        while [ $attempt -lt $max_attempts ]; do
            if nc -z localhost $port 2>/dev/null; then
                echo -e "${GREEN}✓ $service is ready${NC}"
                return 0
            fi
            echo -n "."
            sleep 2
            ((attempt++))
        done
        
        echo -e "\n${RED}✗ $service failed to start${NC}"
        return 1
    }
    
    # Check each service
    check_service "PostgreSQL" 5432
    check_service "Redis" 6379
    check_service "Elasticsearch" 9200
    check_service "LocalStack" 4566
    check_service "API" 4000
    check_service "Web App" 3000
    
    echo -e "\n${GREEN}✓ All services started successfully!${NC}"
}

# Run database migrations
run_migrations() {
    echo -e "\n${BLUE}Running database migrations...${NC}"
    
    # Wait a bit for services to stabilize
    sleep 5
    
    # Run migrations
    npm run db:migrate || {
        echo -e "${YELLOW}⚠ Migrations will be run when the schema is ready${NC}"
    }
}

# Display success message
display_success() {
    echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║         🎉 Setup Complete! 🎉                            ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    
    echo -e "\n${BLUE}Access your application at:${NC}"
    echo -e "  Web App:        ${GREEN}https://localhost${NC}"
    echo -e "  API:            ${GREEN}https://api.localhost${NC}"
    echo -e "  GraphQL:        ${GREEN}http://localhost:4000/graphql${NC}"
    echo -e "  Mailhog:        ${GREEN}http://localhost:8025${NC}"
    echo -e "  Elasticsearch:  ${GREEN}http://localhost:9200${NC}"
    
    echo -e "\n${BLUE}Useful commands:${NC}"
    echo -e "  View logs:      ${YELLOW}docker-compose logs -f [service]${NC}"
    echo -e "  Stop services:  ${YELLOW}docker-compose down${NC}"
    echo -e "  Restart:        ${YELLOW}docker-compose restart [service]${NC}"
    echo -e "  Run tests:      ${YELLOW}npm test${NC}"
    
    echo -e "\n${BLUE}Note:${NC} You may need to add these to your /etc/hosts file:"
    echo -e "  127.0.0.1    localhost"
    echo -e "  127.0.0.1    api.localhost"
    
    echo -e "\n${GREEN}Happy coding! 🚀${NC}"
}

# Error handler
handle_error() {
    echo -e "\n${RED}❌ An error occurred during setup${NC}"
    echo -e "${YELLOW}Please check the logs and try again${NC}"
    echo -e "${YELLOW}You can also run individual steps manually${NC}"
    exit 1
}

# Set error handler
trap handle_error ERR

# Main execution
main() {
    detect_os
    check_prerequisites
    create_directories
    generate_ssl_certs
    setup_env_variables
    setup_nginx_config
    install_dependencies
    init_database
    init_localstack
    start_services
    run_migrations
    display_success
}

# Run main function
main