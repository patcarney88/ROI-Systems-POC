# 🚀 DevOps Setup Documentation
## ROI Systems POC - Infrastructure & Development Environment

### 📋 Overview

This document provides comprehensive guidance for setting up and maintaining the ROI Systems POC development and production environments.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Production                            │
├─────────────────────────┬────────────────────────────────────┤
│      AWS CloudFront     │         AWS ECS Fargate          │
│    (CDN + SSL + WAF)    │    (Container Orchestration)     │
└────────────┬────────────┴──────────────┬─────────────────────┘
             │                           │
             │                    ┌──────┴──────┐
             │                    │ AWS ALB/NLB │
             │                    └──────┬──────┘
             │                           │
    ┌────────┴────────┐        ┌────────┴────────┐
    │   S3 Buckets    │        │  RDS PostgreSQL │
    │  (Static + Docs) │        │   + Read Replicas│
    └─────────────────┘        └─────────────────┘
```

## 🛠️ Local Development Setup

### Prerequisites

1. **System Requirements**
   - macOS, Linux, or Windows 10+ with WSL2
   - 16GB RAM minimum (32GB recommended)
   - 50GB free disk space
   - Intel/AMD x64 or Apple Silicon processor

2. **Required Software**
   ```bash
   # Check versions
   docker --version          # >= 20.10
   docker-compose --version  # >= 2.0
   node --version           # >= 18.0
   npm --version            # >= 8.0
   git --version            # >= 2.30
   aws --version            # >= 2.0 (optional)
   ```

### Quick Start

```bash
# Clone repository
git clone https://github.com/roi-systems/roi-poc.git
cd roi-poc

# Run automated setup
make setup

# Or manually
chmod +x scripts/setup-local.sh
./scripts/setup-local.sh
```

### Manual Setup Steps

1. **Environment Configuration**
   ```bash
   # Copy example environment file
   cp .env.example .env
   
   # Edit with your values
   nano .env
   ```

2. **SSL Certificates**
   ```bash
   # Generate local SSL certificates
   make ssl-gen
   
   # Add to hosts file
   echo "127.0.0.1 localhost api.localhost" | sudo tee -a /etc/hosts
   ```

3. **Docker Services**
   ```bash
   # Start all services
   docker-compose up -d
   
   # Check service health
   docker-compose ps
   
   # View logs
   docker-compose logs -f
   ```

4. **Database Setup**
   ```bash
   # Run migrations
   npm run db:migrate
   
   # Seed test data
   npm run db:seed
   ```

## 🐳 Docker Configuration

### Service Architecture

| Service | Port | Purpose |
|---------|------|---------|
| nginx | 80, 443 | Reverse proxy & SSL termination |
| web | 3000 | Next.js web application |
| api | 4000 | GraphQL API server |
| auth | 5001 | Authentication service |
| documents | 5002 | Document management service |
| postgres | 5432 | Primary database |
| redis | 6379 | Cache & sessions |
| elasticsearch | 9200 | Document search |
| localstack | 4566 | AWS services mock |
| ml-api | 8000 | ML prediction service |
| mailhog | 1025, 8025 | Email testing |

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Rebuild containers
docker-compose build --no-cache

# View logs
docker-compose logs -f [service]

# Execute commands in container
docker-compose exec [service] [command]

# Clean everything
docker-compose down -v
docker system prune -af
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflows

1. **Continuous Integration** (`ci.yml`)
   - Triggered on: Push to main/develop, PRs
   - Steps: Lint → Type Check → Unit Tests → Integration Tests → Security Scan → Build

2. **Continuous Deployment**
   - `cd-dev.yml`: Auto-deploy to development
   - `cd-staging.yml`: Deploy to staging (manual)
   - `cd-prod.yml`: Deploy to production (manual approval)

3. **Security Scanning** (`security-scan.yml`)
   - Daily scheduled scans
   - Container vulnerability scanning
   - Dependency checking
   - Secret detection

### Deployment Process

```bash
# Development deployment (automatic)
git push origin develop

# Staging deployment
git checkout -b release/v1.0.0
git push origin release/v1.0.0

# Production deployment
# Create PR from release → main
# Requires 2 approvals + all checks passing
```

## 🔐 Security Configuration

### Security Baseline

1. **Network Security**
   ```yaml
   # AWS Security Groups
   - Ingress: 80, 443 (public)
   - Egress: Restricted to required services
   - Database: Private subnet only
   ```

2. **Application Security**
   ```bash
   # Environment variables
   - Never commit .env files
   - Use AWS Secrets Manager in production
   - Rotate secrets regularly
   ```

3. **Container Security**
   ```dockerfile
   # Best practices
   - Use official base images
   - Run as non-root user
   - Minimize image layers
   - Scan for vulnerabilities
   ```

### SSL/TLS Configuration

```nginx
# Nginx SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_timeout 1d;
ssl_session_cache shared:SSL:10m;
ssl_stapling on;
ssl_stapling_verify on;
```

## 📊 Monitoring & Logging

### Application Monitoring

1. **Metrics Collection**
   - CloudWatch Metrics
   - Custom application metrics
   - Performance benchmarks

2. **Log Aggregation**
   ```bash
   # View logs
   docker-compose logs -f
   
   # Production logs
   aws logs tail /aws/ecs/roi-poc --follow
   ```

3. **Health Checks**
   ```bash
   # Local health check
   make health-check
   
   # Production health endpoints
   curl https://api.roi-systems.com/health
   ```

### Alerting

- CPU usage > 80%
- Memory usage > 85%
- Error rate > 1%
- Response time > 500ms
- Failed deployments

## 🚨 Troubleshooting

### Common Issues

1. **Docker Issues**
   ```bash
   # Reset Docker
   docker-compose down -v
   docker system prune -af
   docker-compose up -d
   ```

2. **Database Connection**
   ```bash
   # Check database logs
   docker-compose logs postgres
   
   # Connect manually
   docker-compose exec postgres psql -U roi_user -d roi_poc
   ```

3. **Port Conflicts**
   ```bash
   # Find process using port
   lsof -i :3000
   
   # Kill process
   kill -9 <PID>
   ```

### Debug Mode

```bash
# Enable debug logging
export DEBUG=*
export LOG_LEVEL=debug

# Run with verbose output
docker-compose up
```

## 🔄 Backup & Recovery

### Database Backup

```bash
# Manual backup
make backup

# Automated daily backups (production)
0 2 * * * /usr/local/bin/backup-roi-db.sh
```

### Disaster Recovery

1. **RTO**: 1 hour
2. **RPO**: 15 minutes
3. **Backup retention**: 30 days
4. **Geographic redundancy**: Multi-AZ

## 📚 Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Security Policies](./SECURITY.md)
- [Deployment Guide](./DEPLOYMENT.md)

## 🤝 Support

- **Slack**: #roi-poc-devops
- **On-call**: devops@roi-systems.com
- **Wiki**: https://wiki.roi-systems.com/devops

---

**Last Updated**: DevOps Team - Day 1-3 Sprint
**Version**: 1.0.0