# ROI Systems Database Setup Guide

## Overview

This guide provides instructions for setting up the database for the ROI Systems backend application.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 16+ and npm installed
- Access to PostgreSQL with admin privileges

## Initial Setup Steps

### 1. Create Database

First, create the database for the application:

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database
CREATE DATABASE roi_systems_dev;

# Create a dedicated user (optional but recommended)
CREATE USER roi_user WITH PASSWORD 'secure_password_here';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE roi_systems_dev TO roi_user;

# Exit PostgreSQL
\q
```

### 2. Configure Environment Variables

Copy the example environment file and update with your database credentials:

```bash
# Copy example file
cp .env.example .env

# Edit .env and update the following variables:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=roi_systems_dev
DB_USER=roi_user
DB_PASSWORD=secure_password_here

# Or use DATABASE_URL format:
DATABASE_URL=postgresql://roi_user:secure_password_here@localhost:5432/roi_systems_dev
```

### 3. Run Database Migrations

The application includes Sequelize migrations to set up the database schema:

```bash
# Install dependencies if not already done
npm install

# Create database (if not created manually)
npm run db:create

# Run all migrations
npm run db:migrate

# To undo last migration (if needed)
npm run db:migrate:undo

# To undo all migrations (careful!)
npm run db:migrate:undo:all
```

### 4. Seed Database (Optional)

If seed data is available, populate the database:

```bash
# Run all seeders
npm run db:seed

# To undo all seeds
npm run db:seed:undo
```

### 5. Verify Database Connection

Test the database connection:

```bash
# Start the server in development mode
npm run dev

# In another terminal, check health endpoint
curl http://localhost:3000/health

# Check detailed health (includes database status)
curl http://localhost:3000/health/detailed
```

## Database Management

### Available NPM Scripts

```bash
# Database creation and deletion
npm run db:create          # Create database
npm run db:drop           # Drop database (CAUTION!)

# Migration management
npm run db:migrate        # Run pending migrations
npm run db:migrate:undo   # Undo last migration
npm run db:migrate:undo:all # Undo all migrations

# Seed management
npm run db:seed           # Run all seeders
npm run db:seed:undo      # Undo all seeders
```

### Migration Files

Migrations are located in `/backend/src/migrations/`. Current migrations include:

1. `20251014000001-create-users-table.ts` - Users table
2. `20251014000002-create-clients-table.ts` - Clients table
3. `20251014000003-create-documents-table.ts` - Documents table
4. `20251014000004-create-campaigns-table.ts` - Campaigns table

### Database Schema

The database includes the following main tables:

- **users** - System users and authentication
- **clients** - Real estate client information
- **documents** - Document metadata and AI processing results
- **campaigns** - Marketing campaign management

## Development Features

### Auto-sync Models (Development Only)

For rapid development, you can enable model auto-sync:

```bash
# In .env file, set:
DB_SYNC=true

# WARNING: Only use in development!
# This will alter tables based on model definitions
```

### Connection Pool Configuration

The application uses optimized connection pooling:

- **Development**: Max 20 connections, Min 5
- **Production**: Max 100 connections, Min 10
- **Idle timeout**: 10 seconds
- **Acquire timeout**: 30 seconds

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check status
pg_isready
```

#### 2. Authentication Failed

```
Error: password authentication failed for user
```

**Solution**: Verify credentials and user permissions
```bash
psql -U postgres -c "ALTER USER roi_user WITH PASSWORD 'new_password';"
```

#### 3. Database Does Not Exist

```
Error: database "roi_systems_dev" does not exist
```

**Solution**: Create the database
```bash
npm run db:create
# Or manually:
psql -U postgres -c "CREATE DATABASE roi_systems_dev;"
```

#### 4. Migration Errors

If migrations fail, check:
1. Database connectivity
2. User permissions
3. Existing schema conflicts

Reset and retry:
```bash
npm run db:migrate:undo:all
npm run db:migrate
```

### Health Check Endpoints

Monitor database status using health endpoints:

```bash
# Basic health check
GET http://localhost:3000/health

# Detailed health with database stats
GET http://localhost:3000/health/detailed

# Kubernetes liveness probe
GET http://localhost:3000/health/live

# Kubernetes readiness probe
GET http://localhost:3000/health/ready
```

## Production Considerations

1. **Use Environment Variables**: Never hardcode credentials
2. **Enable SSL**: Use SSL connections in production
3. **Connection Pooling**: Adjust pool settings based on load
4. **Monitoring**: Set up database monitoring and alerts
5. **Backups**: Implement regular backup strategy
6. **Migrations**: Test migrations in staging before production
7. **Security**: Use least-privilege database users

## Additional Resources

- [Sequelize Documentation](https://sequelize.org/docs/v6/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Database Best Practices](https://wiki.postgresql.org/wiki/Main_Page)