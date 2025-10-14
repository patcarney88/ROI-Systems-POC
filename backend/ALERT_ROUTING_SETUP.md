# Alert Routing System Setup Instructions

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Redis server running
- Backend dependencies installed (`npm install`)

## Step 1: Database Migration

Apply the new database schema for alert routing:

```bash
cd backend

# Generate Prisma migration
npx prisma migrate dev --name add_alert_routing_system

# Generate Prisma Client
npx prisma generate
```

Expected output:
```
✔ Migration applied successfully
✔ Generated Prisma Client

New models created:
  - RoutingRule
  - AgentProfile
  - AlertAssignment
  - AlertOutcome
```

## Step 2: Verify Installation

Check that all new routes are registered:

```bash
# Start the server
npm run dev

# In another terminal, verify endpoints
curl http://localhost:3000/api/v1 | jq '.data.endpoints'
```

Expected output should include:
```json
{
  "alerts": "/api/v1/alerts",
  "alertRouting": "/api/v1/alerts/routing"
}
```

## Step 3: Create Initial Agent Profiles

Create profiles for your agents:

```bash
# Agent 1
curl -X PUT http://localhost:3000/api/v1/alerts/agents/USER_ID_1/profile \
  -H "Content-Type: application/json" \
  -d '{
    "maxConcurrentAlerts": 10,
    "territories": ["San Francisco", "Oakland"],
    "skills": ["sell", "buy", "refinance"],
    "specializations": ["luxury"],
    "available": true,
    "autoAssign": true
  }'

# Agent 2
curl -X PUT http://localhost:3000/api/v1/alerts/agents/USER_ID_2/profile \
  -H "Content-Type: application/json" \
  -d '{
    "maxConcurrentAlerts": 15,
    "territories": ["San Jose", "Palo Alto"],
    "skills": ["sell", "buy", "investment"],
    "specializations": ["commercial"],
    "available": true,
    "autoAssign": true
  }'
```

Replace `USER_ID_1` and `USER_ID_2` with actual user IDs from your database.

## Step 4: Create Initial Routing Rules

Import the example rules:

```bash
# Load rules from routing-examples.json
node -e "
const fs = require('fs');
const examples = JSON.parse(fs.readFileSync('routing-examples.json'));
const fetch = require('node-fetch');

async function createRules() {
  for (const rule of examples.rules.slice(0, 5)) {
    const response = await fetch('http://localhost:3000/api/v1/alerts/routing/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rule)
    });
    const result = await response.json();
    console.log(\`Created rule: \${result.data.name}\`);
  }
}

createRules();
"
```

Or manually create a default rule:

```bash
curl -X POST http://localhost:3000/api/v1/alerts/routing/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Default Round Robin",
    "priority": 10,
    "enabled": true,
    "conditions": [
      {"field": "confidence", "operator": "greater_than", "value": 0}
    ],
    "actions": [
      {"type": "assign_by_skill", "params": {"requiredSkills": []}}
    ]
  }'
```

## Step 5: Test the System

### Test 1: Check Available Agents

```bash
curl http://localhost:3000/api/v1/alerts/agents/available | jq
```

Expected: List of agents with their workload and capacity

### Test 2: Route a Test Alert

```bash
curl -X POST http://localhost:3000/api/v1/alerts/route \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": "test-alert-123",
    "userId": "test-user-456",
    "alertType": "LIKELY_TO_SELL",
    "confidence": 0.85,
    "priority": "HIGH",
    "territory": "San Francisco"
  }' | jq
```

Expected: Alert assigned to appropriate agent

### Test 3: Check Routing Statistics

```bash
curl http://localhost:3000/api/v1/alerts/routing/stats | jq
```

Expected: Routing statistics and assignment counts

## Step 6: Set Up Scheduled Tasks

Add to your application startup or use a cron job:

### Option A: Add to Application Code

Add this to `src/index.ts`:

```typescript
import cron from 'node-cron';
import { alertRoutingService } from './services/alert-routing.service';

// Handle stale alerts daily at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    await alertRoutingService.handleStaleAlerts(3);
    logger.info('Stale alerts processed successfully');
  } catch (error) {
    logger.error('Failed to process stale alerts:', error);
  }
});
```

### Option B: System Cron Job

Add to system crontab:

```bash
# Edit crontab
crontab -e

# Add this line (adjust path to your installation)
0 0 * * * curl -X POST http://localhost:3000/api/v1/alerts/routing/handle-stale -H "Content-Type: application/json" -d '{"maxAgeDays": 3}'
```

## Step 7: Integration with ML Scoring

Update your ML scoring pipeline to automatically route alerts:

Add this to `src/services/ml-scoring.service.ts`:

```typescript
import { alertRoutingService } from './alert-routing.service';

// After creating AlertScore in database
private async createAlertScore(...) {
  // ... existing code to create alert ...

  // NEW: Automatically route the alert
  const routingContext = {
    alertId: alertScore.id,
    userId: alertScore.userId,
    alertType: alertScore.alertType,
    confidence: alertScore.confidence,
    priority: alertScore.priority
  };

  try {
    await alertRoutingService.routeAlert(routingContext);
    logger.info(`Alert ${alertScore.id} routed successfully`);
  } catch (error) {
    logger.error(`Failed to route alert ${alertScore.id}:`, error);
    // Continue even if routing fails
  }
}
```

## Step 8: Monitoring Setup

### Set Up Logging

Logs are automatically written to:
- `logs/combined.log` - All logs
- `logs/error.log` - Errors only

### Monitor Key Metrics

Create a monitoring script:

```bash
#!/bin/bash
# monitor-routing.sh

echo "=== Alert Routing System Health Check ==="
echo

echo "Available Agents:"
curl -s http://localhost:3000/api/v1/alerts/agents/available | jq '.data.availableAgents'

echo
echo "Active Rules:"
curl -s http://localhost:3000/api/v1/alerts/routing/rules | jq '.data.enabledRules'

echo
echo "Recent Statistics:"
curl -s http://localhost:3000/api/v1/alerts/routing/stats | jq '.data'

echo
echo "=== End Health Check ==="
```

Run daily:
```bash
chmod +x monitor-routing.sh
./monitor-routing.sh
```

## Troubleshooting

### Issue: "No agents available for assignment"

**Solution:**
1. Check that agent profiles exist:
   ```bash
   curl http://localhost:3000/api/v1/alerts/agents/available
   ```

2. Verify agents have `available: true` and `autoAssign: true`:
   ```bash
   curl http://localhost:3000/api/v1/alerts/agents/AGENT_ID/profile
   ```

3. Create or update agent profiles if needed

### Issue: "Routing rules not matching"

**Solution:**
1. Check active rules:
   ```bash
   curl http://localhost:3000/api/v1/alerts/routing/rules | jq '.data.rules'
   ```

2. Verify rule priorities (higher = evaluated first)

3. Test rule conditions against your alert data

4. Enable verbose logging:
   ```bash
   # Add to .env
   LOG_LEVEL=debug
   ```

### Issue: Redis connection errors

**Solution:**
1. Verify Redis is running:
   ```bash
   redis-cli ping
   ```

2. Check Redis configuration in `.env`:
   ```bash
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password
   ```

3. Test Redis connection:
   ```bash
   redis-cli -h localhost -p 6379 -a your_password ping
   ```

### Issue: High reassignment rate

**Solution:**
1. Review routing statistics:
   ```bash
   curl http://localhost:3000/api/v1/alerts/routing/stats
   ```

2. Check rule priorities and conditions

3. Adjust agent territories and skills to better match alert distribution

4. Consider increasing `maxConcurrentAlerts` for high-volume agents

## Verification Checklist

After setup, verify all components:

- [ ] Database migration completed successfully
- [ ] All API endpoints respond correctly
- [ ] Agent profiles created for all agents
- [ ] At least one routing rule configured
- [ ] Test alert routes successfully
- [ ] Redis caching works (check logs)
- [ ] Scheduled stale alert handling configured
- [ ] Monitoring script runs successfully
- [ ] Integration with ML scoring pipeline complete
- [ ] Team trained on reassignment procedures

## Performance Benchmarks

Expected performance after setup:

| Metric | Target | Actual |
|--------|--------|--------|
| Alert routing decision | < 50ms | ___ms |
| Rule evaluation | < 10ms | ___ms |
| Agent workload lookup | < 5ms | ___ms |
| Bulk assignment (100 alerts) | < 5s | ___s |
| Cache hit rate | > 90% | __% |

Fill in "Actual" column after running load tests.

## Next Steps

1. **Week 1**: Monitor routing behavior, adjust rules as needed
2. **Week 2**: Analyze routing statistics, optimize agent profiles
3. **Week 3**: Fine-tune cache TTL values, add custom rules
4. **Week 4+**: Consider advanced features (ML-based routing, predictive capacity)

## Support

For issues or questions:
- Check logs: `tail -f logs/combined.log`
- Review documentation: `ALERT_ROUTING_DOCUMENTATION.md`
- Quick reference: `ROUTING_QUICK_START.md`
- Examples: `routing-examples.json`

## Production Deployment

Before deploying to production:

1. **Security**:
   - [ ] Enable authentication on all endpoints
   - [ ] Configure Redis password
   - [ ] Set up SSL/TLS for API
   - [ ] Review and approve all routing rules

2. **Performance**:
   - [ ] Load test with expected traffic
   - [ ] Monitor Redis memory usage
   - [ ] Set up database connection pooling
   - [ ] Configure proper indexes

3. **Monitoring**:
   - [ ] Set up error alerting
   - [ ] Configure performance monitoring
   - [ ] Create routing dashboard
   - [ ] Set up backup procedures

4. **Documentation**:
   - [ ] Document custom routing rules
   - [ ] Create runbook for common issues
   - [ ] Train support team
   - [ ] Establish escalation procedures

---

**Installation Complete!** 🎉

Your Alert Routing & Prioritization System is now ready to intelligently assign alerts to your agents.
