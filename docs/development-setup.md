# 🚀 Development Environment Setup
## Digital Docs Platform - ROI Systems POC

### Overview
Complete development environment setup guide for the Digital Docs platform. This setup provides a containerized, production-like environment for local development with hot reloading, debugging, and integrated testing.

### Prerequisites
- Docker Desktop 4.0+ with Kubernetes enabled
- Node.js 18+ and npm 9+
- Python 3.11+ with pip
- Git 2.30+
- VS Code with recommended extensions (optional but recommended)

---

## 🏗️ Project Structure

```
ROI-Systems-POC/
├── services/                    # Microservices
│   ├── auth-service/           # Authentication & JWT
│   ├── user-service/           # User & agency management
│   ├── document-service/       # Document management
│   ├── search-service/         # Elasticsearch integration
│   ├── email-service/          # Campaign management
│   ├── alert-service/          # Notification system
│   ├── ai-service/             # Claude AI integration
│   └── api-gateway/            # API Gateway & routing
├── web/                        # Frontend applications
│   ├── agent-portal/           # Agent dashboard (React)
│   └── client-portal/          # Client access portal
├── infrastructure/             # Infrastructure as code
│   ├── docker/                 # Docker configurations
│   ├── k8s/                    # Kubernetes manifests
│   └── terraform/              # AWS infrastructure
├── database/                   # Database scripts
│   ├── migrations/             # Database migrations
│   ├── seeds/                  # Test data
│   └── scripts/                # Utility scripts
├── docs/                       # Documentation
├── tests/                      # Integration & E2E tests
└── tools/                      # Development tools
```

---

## 🐳 Docker Development Environment

### Core Services Configuration

#### docker-compose.dev.yml
```yaml
version: '3.8'

services:
  # Database Services
  postgres:
    image: postgres:15-alpine
    container_name: roi-postgres
    environment:
      POSTGRES_DB: roi_poc_dev
      POSTGRES_USER: roi_dev
      POSTGRES_PASSWORD: dev_password_123
      POSTGRES_MULTIPLE_DATABASES: auth_db,user_db,document_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
      - ./database/migrations:/migrations
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U roi_dev -d roi_poc_dev"]
      interval: 30s
      timeout: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: roi-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass dev_redis_pass
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: roi-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: roi-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: roi_dev
      RABBITMQ_DEFAULT_PASS: dev_rabbit_pass
    ports:
      - "5672:5672"
      - "15672:15672"  # Management UI
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Development Tools
  mailhog:
    image: mailhog/mailhog:latest
    container_name: roi-mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI
    logging:
      driver: "none"

  localstack:
    image: localstack/localstack:latest
    container_name: roi-localstack
    environment:
      - SERVICES=s3,lambda,apigateway,cloudformation
      - DEBUG=1
      - DATA_DIR=/tmp/localstack/data
      - DOCKER_HOST=unix:///var/run/docker.sock
    ports:
      - "4566:4566"
    volumes:
      - localstack_data:/tmp/localstack
      - /var/run/docker.sock:/var/run/docker.sock

  # API Gateway (Development)
  api-gateway:
    build:
      context: ./services/api-gateway
      dockerfile: Dockerfile.dev
    container_name: roi-api-gateway
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
      - REDIS_URL=redis://roi_dev:dev_redis_pass@redis:6379
      - AUTH_SERVICE_URL=http://auth-service:3001
      - USER_SERVICE_URL=http://user-service:3002
      - DOCUMENT_SERVICE_URL=http://document-service:3003
    volumes:
      - ./services/api-gateway:/app
      - /app/node_modules
    depends_on:
      - redis
      - auth-service
      - user-service
      - document-service
    restart: unless-stopped

  # Core Services
  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile.dev
    container_name: roi-auth-service
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - DATABASE_URL=postgresql://roi_dev:dev_password_123@postgres:5432/auth_db
      - REDIS_URL=redis://roi_dev:dev_redis_pass@redis:6379
      - JWT_SECRET=dev_jwt_secret_key_very_long_and_secure
      - JWT_REFRESH_SECRET=dev_refresh_secret_key_very_long_and_secure
    volumes:
      - ./services/auth-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  user-service:
    build:
      context: ./services/user-service
      dockerfile: Dockerfile.dev
    container_name: roi-user-service
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=development
      - PORT=3002
      - DATABASE_URL=postgresql://roi_dev:dev_password_123@postgres:5432/user_db
      - REDIS_URL=redis://roi_dev:dev_redis_pass@redis:6379
    volumes:
      - ./services/user-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  document-service:
    build:
      context: ./services/document-service
      dockerfile: Dockerfile.dev
    container_name: roi-document-service
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=development
      - PORT=3003
      - DATABASE_URL=postgresql://roi_dev:dev_password_123@postgres:5432/document_db
      - REDIS_URL=redis://roi_dev:dev_redis_pass@redis:6379
      - S3_ENDPOINT=http://localstack:4566
      - S3_BUCKET=roi-documents-dev
      - AI_SERVICE_URL=http://ai-service:8000
    volumes:
      - ./services/document-service:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      - localstack
      - ai-service
    restart: unless-stopped

  ai-service:
    build:
      context: ./services/ai-service
      dockerfile: Dockerfile.dev
    container_name: roi-ai-service
    ports:
      - "8000:8000"
    environment:
      - PYTHON_ENV=development
      - PORT=8000
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - REDIS_URL=redis://roi_dev:dev_redis_pass@redis:6379
    volumes:
      - ./services/ai-service:/app
    depends_on:
      - redis
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  rabbitmq_data:
  localstack_data:

networks:
  default:
    name: roi-network
```

### Development Dockerfiles

#### Node.js Service Template (Dockerfile.dev)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install development dependencies
RUN apk add --no-cache \
    curl \
    git \
    python3 \
    make \
    g++

# Copy package files
COPY package*.json ./

# Install dependencies with dev dependencies
RUN npm ci --include=dev

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Development command with hot reload
CMD ["npm", "run", "dev"]
```

#### Python AI Service Dockerfile (Dockerfile.dev)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt requirements-dev.txt ./

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements-dev.txt

# Copy source code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# Expose port
EXPOSE 8000

# Development command with hot reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

---

## 🔧 Development Scripts

### Setup Script (setup-dev.sh)
```bash
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
```

### Development Commands (package.json)
```json
{
  "name": "roi-systems-poc",
  "version": "1.0.0",
  "description": "ROI Systems Digital Docs Platform POC",
  "scripts": {
    "setup": "./scripts/setup-dev.sh",
    "dev": "docker-compose -f docker-compose.dev.yml up",
    "dev:build": "docker-compose -f docker-compose.dev.yml up --build",
    "dev:down": "docker-compose -f docker-compose.dev.yml down",
    "dev:logs": "docker-compose -f docker-compose.dev.yml logs -f",
    "dev:clean": "docker-compose -f docker-compose.dev.yml down -v --remove-orphans",
    
    "services:start": "docker-compose -f docker-compose.dev.yml up -d postgres redis elasticsearch rabbitmq mailhog localstack",
    "services:stop": "docker-compose -f docker-compose.dev.yml stop postgres redis elasticsearch rabbitmq mailhog localstack",
    
    "db:migrate": "npm run db:migrate --workspace=services/auth-service && npm run db:migrate --workspace=services/user-service && npm run db:migrate --workspace=services/document-service",
    "db:seed": "npm run db:seed --workspace=services/auth-service && npm run db:seed --workspace=services/user-service && npm run db:seed --workspace=services/document-service",
    "db:reset": "npm run dev:clean && npm run setup && npm run db:migrate && npm run db:seed",
    
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "npm run test --workspaces --if-present",
    "test:integration": "jest --config jest.integration.config.js",
    "test:e2e": "npm run test:e2e --workspace=tests/e2e",
    
    "lint": "npm run lint --workspaces --if-present",
    "lint:fix": "npm run lint:fix --workspaces --if-present",
    "format": "prettier --write .",
    
    "build": "npm run build --workspaces --if-present",
    "build:docker": "docker-compose -f docker-compose.yml build"
  },
  "workspaces": [
    "services/*",
    "web/*",
    "tests/*"
  ],
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "prettier": "^2.8.0",
    "eslint": "^8.40.0",
    "supertest": "^6.3.0",
    "cross-env": "^7.0.3"
  }
}
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow (.github/workflows/ci.yml)
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

env:
  NODE_VERSION: '18'
  PYTHON_VERSION: '3.11'

jobs:
  lint-and-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: roi_test
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      elasticsearch:
        image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
        env:
          discovery.type: single-node
          xpack.security.enabled: false
        ports:
          - 9200:9200
        options: >-
          --health-cmd "curl -f http://localhost:9200/_health"
          --health-interval 30s
          --health-timeout 10s
          --health-retries 5

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ env.PYTHON_VERSION }}
        cache: 'pip'

    - name: Install dependencies
      run: |
        npm ci
        npm run install --workspaces

    - name: Lint code
      run: |
        npm run lint
        
    - name: Type check
      run: |
        npm run type-check --workspaces --if-present

    - name: Run unit tests
      run: |
        npm run test:unit
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/roi_test
        REDIS_URL: redis://localhost:6379
        ELASTICSEARCH_URL: http://localhost:9200

    - name: Run integration tests
      run: |
        npm run test:integration
      env:
        NODE_ENV: test
        DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/roi_test
        REDIS_URL: redis://localhost:6379
        ELASTICSEARCH_URL: http://localhost:9200

    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        fail_ci_if_error: true

  security-scan:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

    - name: Run CodeQL analysis
      uses: github/codeql-action/init@v2
      with:
        languages: javascript, python

    - name: Autobuild
      uses: github/codeql-action/autobuild@v2

    - name: Perform CodeQL analysis
      uses: github/codeql-action/analyze@v2

  build-and-push:
    needs: [lint-and-test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: Login to Docker Hub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKER_USERNAME }}
        password: ${{ secrets.DOCKER_PASSWORD }}

    - name: Build and push Docker images
      run: |
        # Build and push each service
        services=("auth-service" "user-service" "document-service" "ai-service" "api-gateway")
        
        for service in "${services[@]}"; do
          echo "Building $service..."
          docker build -t roidocs/$service:${{ github.sha }} -t roidocs/$service:latest ./services/$service
          docker push roidocs/$service:${{ github.sha }}
          docker push roidocs/$service:latest
        done

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    
    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add deployment commands here
        
  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add production deployment commands here
```

### Quality Gates Configuration

#### ESLint Configuration (.eslintrc.js)
```javascript
module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'security', 'import'],
  rules: {
    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-non-literal-fs-filename': 'error',
    'security/detect-non-literal-require': 'error',
    'security/detect-possible-timing-attacks': 'error',
    'security/detect-pseudoRandomBytes': 'error',
    
    // Code quality rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
    
    // Import rules
    'import/order': ['error', {
      groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
      'newlines-between': 'always',
    }],
  },
  overrides: [
    {
      files: ['**/*.test.ts', '**/*.test.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
```

#### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/*.(test|spec).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,js}',
    '!src/**/*.d.ts',
    '!src/types/**',
    '!src/**/*.test.{ts,js}',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
};
```

---

## 🔍 Monitoring & Debugging

### Development Monitoring Stack

#### Prometheus Configuration (monitoring/prometheus.yml)
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

scrape_configs:
  - job_name: 'api-gateway'
    static_configs:
      - targets: ['api-gateway:3000']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'user-service'
    static_configs:
      - targets: ['user-service:3002']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'document-service'
    static_configs:
      - targets: ['document-service:3003']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'ai-service'
    static_configs:
      - targets: ['ai-service:8000']
    metrics_path: /metrics
    scrape_interval: 10s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

#### Docker Compose Monitoring Extension (docker-compose.monitoring.yml)
```yaml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: roi-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: roi-grafana
    ports:
      - "3030:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards

  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: roi-jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_ZIPKIN_HTTP_PORT=9411

volumes:
  prometheus_data:
  grafana_data:
```

---

## 📝 Development Guidelines

### Code Standards
```yaml
TypeScript:
  - Use strict mode
  - Explicit return types for functions
  - Prefer interfaces over types
  - Use enums for constants
  - Avoid 'any' type

JavaScript:
  - ES2022+ features
  - Async/await over promises
  - Arrow functions preferred
  - Destructuring assignments
  - Template literals

Python:
  - Type hints required
  - Black formatter
  - Flake8 linter
  - FastAPI framework conventions
  - Pydantic models for validation

Database:
  - Migration-based schema changes
  - Proper indexing
  - Foreign key constraints
  - Connection pooling
  - Query optimization

Security:
  - Input validation on all endpoints
  - SQL injection prevention
  - XSS protection
  - CSRF tokens
  - Rate limiting
```

### Git Workflow
```yaml
Branches:
  - main: Production-ready code
  - develop: Integration branch
  - feature/*: Feature development
  - bugfix/*: Bug fixes
  - hotfix/*: Production hotfixes

Commit Messages:
  - feat: New feature
  - fix: Bug fix
  - docs: Documentation changes
  - style: Code style changes
  - refactor: Code refactoring
  - test: Test additions/changes
  - chore: Build process or auxiliary tool changes

Pull Requests:
  - Require code review
  - Automated testing must pass
  - Security scan must pass
  - Documentation updated
  - No merge commits (rebase preferred)
```

---

## 🚀 Quick Start Commands

```bash
# Initial setup
git clone <repository-url>
cd ROI-Systems-POC
chmod +x scripts/setup-dev.sh
./scripts/setup-dev.sh

# Start development environment
npm run dev

# View logs
npm run dev:logs

# Stop and clean
npm run dev:clean

# Run tests
npm test

# Database operations
npm run db:migrate
npm run db:seed
npm run db:reset
```

---

**Development Setup By**: DevOps Engineering Team  
**Last Updated**: Week 3, Day 1  
**Next Review**: End of Week 3

*Note: This setup will be continuously refined based on developer feedback and performance requirements.*