#!/bin/bash

# ===================================
# ROI Systems - Database Setup Script
# ===================================

set -e  # Exit on error

echo "🚀 ROI Systems - Database Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="roi_systems"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if PostgreSQL is installed
echo "1. Checking PostgreSQL installation..."
if command -v psql &> /dev/null; then
    print_success "PostgreSQL is installed"
    psql --version
else
    print_error "PostgreSQL is not installed"
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS:   brew install postgresql@14"
    echo "  Ubuntu:  sudo apt-get install postgresql-14"
    echo "  Docker:  docker run --name roi-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:14"
    exit 1
fi

echo ""

# Check if PostgreSQL is running
echo "2. Checking if PostgreSQL is running..."
if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
    print_success "PostgreSQL is running"
else
    print_warning "PostgreSQL is not running"
    echo "Start PostgreSQL:"
    echo "  macOS:   brew services start postgresql@14"
    echo "  Ubuntu:  sudo systemctl start postgresql"
    echo "  Docker:  docker start roi-postgres"
    exit 1
fi

echo ""

# Check if database exists
echo "3. Checking if database exists..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    print_warning "Database '$DB_NAME' already exists"
    read -p "Do you want to drop and recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Dropping database..."
        dropdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
        print_success "Database dropped"
    else
        print_warning "Keeping existing database"
    fi
fi

# Create database if it doesn't exist
if ! psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo "Creating database..."
    createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME
    print_success "Database '$DB_NAME' created"
fi

echo ""

# Test database connection
echo "4. Testing database connection..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" &> /dev/null; then
    print_success "Database connection successful"
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" | head -3
else
    print_error "Failed to connect to database"
    exit 1
fi

echo ""

# Check if .env file exists
echo "5. Checking environment configuration..."
if [ -f .env ]; then
    print_success ".env file exists"
else
    print_warning ".env file not found"
    if [ -f .env.example ]; then
        echo "Creating .env from .env.example..."
        cp .env.example .env
        print_success ".env file created"
        print_warning "Please update .env with your configuration"
    else
        print_error ".env.example not found"
    fi
fi

echo ""

# Run migrations
echo "6. Running database migrations..."
if [ -f "node_modules/.bin/sequelize" ]; then
    npm run migrate 2>&1 | tail -10
    print_success "Migrations completed"
else
    print_warning "Sequelize CLI not found, skipping migrations"
    echo "Run: npm install"
fi

echo ""

# Seed database (optional)
echo "7. Seeding database (optional)..."
read -p "Do you want to seed the database with test data? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "node_modules/.bin/sequelize" ]; then
        npm run seed 2>&1 | tail -10
        print_success "Database seeded"
    else
        print_warning "Sequelize CLI not found, skipping seeding"
    fi
else
    print_warning "Skipping database seeding"
fi

echo ""

# Summary
echo "================================"
echo "✓ Database Setup Complete!"
echo "================================"
echo ""
echo "Database Details:"
echo "  Name:     $DB_NAME"
echo "  Host:     $DB_HOST"
echo "  Port:     $DB_PORT"
echo "  User:     $DB_USER"
echo ""
echo "Connection String:"
echo "  postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""
echo "Next Steps:"
echo "  1. Update .env with your configuration"
echo "  2. Run: npm run dev"
echo "  3. Test: curl http://localhost:3000/health"
echo ""
