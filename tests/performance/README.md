# Performance Testing Guide

## Overview

This directory contains performance testing scripts and configurations for the ROI Systems POC application. The tests are designed to validate performance targets and identify bottlenecks.

## Performance Targets

- **p95 Response Time**: <200ms
- **Error Rate**: <1%
- **Throughput**: 1K-5K requests/second
- **Concurrent Users**: 100-500

## Testing Tools

### 1. k6 (Recommended)

Modern load testing tool with scripting capabilities.

#### Installation
```bash
# macOS
brew install k6

# Linux
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows
choco install k6
```

#### Usage
```bash
# Run basic load test
k6 run tests/performance/k6-load-test.js

# Run with custom VUs and duration
k6 run --vus 100 --duration 10m tests/performance/k6-load-test.js

# Run with environment variables
k6 run --env BASE_URL=http://api.roi-systems.com tests/performance/k6-load-test.js

# Output results to InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 tests/performance/k6-load-test.js
```

#### Test Scenarios

**Scenario 1: Ramp Up (16 minutes)**
- Start: 0 users
- Ramp to: 50 users over 2 minutes
- Hold: 5 minutes at 50 users
- Ramp to: 100 users over 2 minutes
- Hold: 5 minutes at 100 users
- Ramp down: 2 minutes to 0 users

**Scenario 2: Constant Load (10 minutes)**
- Constant: 50 users
- Duration: 10 minutes

**Scenario 3: Spike Test (4 minutes)**
- Spike to: 200 users in 1 minute
- Hold: 2 minutes at 200 users
- Drop: 1 minute to 0 users

### 2. Artillery

Alternative load testing tool with YAML configuration.

#### Installation
```bash
npm install -g artillery
```

#### Usage
```bash
# Run load test
artillery run tests/performance/artillery-config.yml

# Run with custom target
artillery run --target http://api.roi-systems.com tests/performance/artillery-config.yml

# Generate HTML report
artillery run --output report.json tests/performance/artillery-config.yml
artillery report report.json
```

## Test Data

### Test Users

Test user credentials are stored in `test-users.csv`:
- 10 test users with format: `test{N}@roi-systems.com`
- All use password: `Test123!@#`

**Important**: Create these users in the database before running tests.

### Seed Data Script

```bash
# Run seed script to create test data
npm run db:seed

# Or manually create test users
psql -d roi_poc_dev -f tests/performance/seed-test-users.sql
```

## Running Performance Tests

### Step 1: Prepare Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
docker-compose -f docker-compose.dev.yml ps

# Verify services are running
curl http://localhost:3000/health
curl http://localhost:6379 # Redis
curl http://localhost:5432 # PostgreSQL
```

### Step 2: Seed Test Data

```bash
# Create test users and sample data
npm run db:seed

# Verify test data
psql -d roi_poc_dev -c "SELECT COUNT(*) FROM users WHERE email LIKE 'test%@roi-systems.com';"
```

### Step 3: Run Load Tests

```bash
# Option A: k6 (Recommended)
k6 run tests/performance/k6-load-test.js

# Option B: Artillery
artillery run tests/performance/artillery-config.yml

# Option C: Apache Bench (quick test)
ab -n 1000 -c 10 http://localhost:3000/api/v1/health
```

### Step 4: Analyze Results

Results will be saved to:
- k6: `summary.json` (in current directory)
- Artillery: `artillery-report.json` and `artillery-report.html`

## Monitoring During Tests

### Prometheus Metrics

```bash
# View metrics endpoint
curl http://localhost:3000/metrics

# Access Prometheus UI
open http://localhost:9090
```

### Grafana Dashboards

```bash
# Access Grafana
open http://localhost:3030
# Username: admin
# Password: admin123

# Import dashboard
# - Go to Dashboards > Import
# - Upload: monitoring/grafana/dashboards/performance.json
```

### Real-time Logs

```bash
# Backend logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Database logs
docker-compose -f docker-compose.dev.yml logs -f postgres

# Redis logs
docker-compose -f docker-compose.dev.yml logs -f redis
```

## Performance Benchmarks

### Current Baseline (Mock Data)

```
Endpoint: GET /api/v1/documents
- Avg: 5ms
- p50: 4ms
- p95: 8ms
- p99: 12ms

Endpoint: POST /api/v1/auth/login
- Avg: 20ms
- p50: 18ms
- p95: 30ms
- p99: 45ms

Endpoint: GET /health
- Avg: 2ms
- p50: 1ms
- p95: 3ms
- p99: 5ms
```

### Expected After Optimization

```
Endpoint: GET /api/v1/documents (with DB)
- Avg: 30ms
- p50: 25ms
- p95: 60ms
- p99: 150ms

Endpoint: POST /api/v1/auth/login (with cache)
- Avg: 15ms
- p50: 12ms
- p95: 25ms
- p99: 40ms

Endpoint: GET /health
- Avg: 2ms
- p50: 1ms
- p95: 3ms
- p99: 5ms
```

## Common Issues and Solutions

### Issue 1: Connection Refused

**Symptom**: Tests fail with "Connection refused" error

**Solution**:
```bash
# Check if services are running
docker-compose ps

# Restart services
docker-compose down
docker-compose up -d

# Verify connectivity
curl http://localhost:3000/health
```

### Issue 2: Rate Limiting

**Symptom**: Tests receive 429 (Too Many Requests) errors

**Solution**:
```bash
# Temporarily disable rate limiting for tests
# Edit backend/.env
RATE_LIMIT_ENABLED=false

# Or increase rate limits
RATE_LIMIT_MAX_REQUESTS=10000
RATE_LIMIT_WINDOW_MS=60000
```

### Issue 3: Authentication Failures

**Symptom**: Tests receive 401 (Unauthorized) errors

**Solution**:
```bash
# Verify test users exist
npm run db:seed

# Check JWT secret is configured
grep JWT_SECRET backend/.env

# Verify token expiration is reasonable
grep JWT_EXPIRES_IN backend/.env
```

### Issue 4: Database Connection Pool Exhausted

**Symptom**: Tests timeout or receive database errors

**Solution**:
```bash
# Increase connection pool size
# Edit backend/.env
DB_POOL_MAX=100

# Restart backend
docker-compose restart backend
```

## Best Practices

### 1. Incremental Load Testing

Always start with low load and gradually increase:
```bash
# Start with 10 users
k6 run --vus 10 --duration 2m tests/performance/k6-load-test.js

# Then 50 users
k6 run --vus 50 --duration 5m tests/performance/k6-load-test.js

# Then 100 users
k6 run --vus 100 --duration 10m tests/performance/k6-load-test.js
```

### 2. Warm-up Period

Always include a warm-up period:
- Allows connection pools to fill
- Warms up caches
- Stabilizes JIT compilation

### 3. Realistic Test Data

Use realistic test data:
- Typical document sizes
- Realistic query patterns
- Appropriate data volumes

### 4. Monitor System Resources

During tests, monitor:
- CPU usage
- Memory usage
- Network bandwidth
- Disk I/O
- Database connections

### 5. Test Isolation

Ensure tests don't affect each other:
- Use separate test database
- Clean up test data after tests
- Reset connection pools between runs

## CI/CD Integration

### GitHub Actions

```yaml
name: Performance Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Start services
        run: docker-compose -f docker-compose.dev.yml up -d

      - name: Wait for services
        run: ./scripts/wait-for-services.sh

      - name: Run k6 tests
        uses: k6io/action@v0.1
        with:
          filename: tests/performance/k6-load-test.js

      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: performance-results
          path: summary.json
```

## Performance Testing Checklist

Before running performance tests:

- [ ] All services are running (docker-compose ps)
- [ ] Database is seeded with test data
- [ ] Test users are created
- [ ] Rate limiting is configured appropriately
- [ ] Monitoring is enabled (Prometheus, Grafana)
- [ ] Baseline metrics are recorded
- [ ] Test environment matches production specs

During tests:

- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor database connections
- [ ] Monitor response times
- [ ] Monitor error rates
- [ ] Check for memory leaks
- [ ] Verify cache hit rates

After tests:

- [ ] Analyze results against targets
- [ ] Identify bottlenecks
- [ ] Document findings
- [ ] Create optimization tickets
- [ ] Clean up test data
- [ ] Update performance baselines

## Resources

- [k6 Documentation](https://k6.io/docs/)
- [Artillery Documentation](https://www.artillery.io/docs)
- [Performance Testing Best Practices](https://www.guru99.com/performance-testing.html)
- [Load Testing Guidelines](https://k6.io/docs/test-types/load-testing)

## Support

For questions or issues with performance testing:

1. Check the [Performance Analysis Report](../../PERFORMANCE_ANALYSIS.md)
2. Review [troubleshooting guide](../../docs/troubleshooting.md)
3. Open an issue on GitHub
4. Contact the performance engineering team

---

**Last Updated**: 2025-10-14
**Maintained By**: Performance Engineering Team
