# Alert Routing Quick Start Guide

## 5-Minute Setup

### 1. Create Agent Profiles (1 minute)

```bash
# Create profile for Agent John
curl -X PUT http://localhost:3000/api/v1/alerts/agents/agent-john-123/profile \
  -H "Content-Type: application/json" \
  -d '{
    "maxConcurrentAlerts": 10,
    "territories": ["San Francisco", "Oakland"],
    "skills": ["sell", "buy", "refinance"],
    "specializations": ["luxury"],
    "available": true,
    "autoAssign": true
  }'

# Create profile for Agent Sarah
curl -X PUT http://localhost:3000/api/v1/alerts/agents/agent-sarah-456/profile \
  -H "Content-Type: application/json" \
  -d '{
    "maxConcurrentAlerts": 15,
    "territories": ["San Jose", "Palo Alto"],
    "skills": ["sell", "buy", "investment"],
    "specializations": ["commercial", "investment"],
    "available": true,
    "autoAssign": true
  }'
```

### 2. Create Basic Routing Rules (2 minutes)

```bash
# Rule 1: High confidence alerts to skilled agents
curl -X POST http://localhost:3000/api/v1/alerts/routing/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "High Confidence to Skilled Agents",
    "priority": 100,
    "enabled": true,
    "conditions": [
      {"field": "confidence", "operator": "greater_than", "value": 0.8}
    ],
    "actions": [
      {"type": "assign_by_skill", "params": {"requiredSkills": ["luxury"]}}
    ]
  }'

# Rule 2: Territory-based routing
curl -X POST http://localhost:3000/api/v1/alerts/routing/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "San Francisco Territory",
    "priority": 80,
    "enabled": true,
    "conditions": [
      {"field": "territory", "operator": "equals", "value": "San Francisco"}
    ],
    "actions": [
      {"type": "assign_to_territory", "params": {"territory": "San Francisco"}}
    ]
  }'

# Rule 3: Default round-robin
curl -X POST http://localhost:3000/api/v1/alerts/routing/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Default Round Robin",
    "priority": 10,
    "enabled": true,
    "conditions": [
      {"field": "priority", "operator": "in", "value": ["MEDIUM", "LOW"]}
    ],
    "actions": [
      {"type": "assign_by_skill", "params": {"requiredSkills": []}}
    ]
  }'
```

### 3. Route Your First Alert (1 minute)

```bash
# Route an alert
curl -X POST http://localhost:3000/api/v1/alerts/route \
  -H "Content-Type: application/json" \
  -d '{
    "alertId": "alert-123",
    "userId": "user-456",
    "alertType": "LIKELY_TO_SELL",
    "confidence": 0.85,
    "priority": "HIGH",
    "territory": "San Francisco"
  }'

# Response:
# {
#   "success": true,
#   "data": {
#     "alertId": "alert-123",
#     "agentId": "agent-john-123",
#     "assignmentReason": "Assigned via territory_based routing",
#     "confidence": 0.85,
#     "routingStrategy": "territory_based"
#   }
# }
```

### 4. Check Agent Workload (30 seconds)

```bash
# Get all available agents
curl http://localhost:3000/api/v1/alerts/agents/available

# Get specific agent workload
curl http://localhost:3000/api/v1/alerts/agents/agent-john-123/workload
```

### 5. View Routing Statistics (30 seconds)

```bash
# Get routing statistics
curl http://localhost:3000/api/v1/alerts/routing/stats
```

---

## Common Routing Scenarios

### Scenario 1: Route High-Value Leads to Senior Agents

```json
{
  "name": "High Value to Senior Agents",
  "priority": 100,
  "enabled": true,
  "conditions": [
    {"field": "confidence", "operator": "greater_than", "value": 0.8},
    {"field": "metadata.propertyValue", "operator": "greater_than", "value": 2000000}
  ],
  "actions": [
    {"type": "assign_by_skill", "params": {"requiredSkills": ["luxury", "high_value"]}}
  ]
}
```

### Scenario 2: Escalate Critical Alerts

```json
{
  "name": "Escalate Critical Alerts",
  "priority": 90,
  "enabled": true,
  "conditions": [
    {"field": "priority", "operator": "equals", "value": "CRITICAL"},
    {"field": "confidence", "operator": "greater_than", "value": 0.85}
  ],
  "actions": [
    {"type": "escalate", "params": {}}
  ]
}
```

### Scenario 3: Skill-Based Routing for Refinance

```json
{
  "name": "Refinance to Specialists",
  "priority": 70,
  "enabled": true,
  "conditions": [
    {"field": "alertType", "operator": "equals", "value": "REFINANCE_OPPORTUNITY"}
  ],
  "actions": [
    {"type": "assign_by_skill", "params": {"requiredSkills": ["refinance", "financial"]}}
  ]
}
```

### Scenario 4: Load Balancing with Overflow

```json
{
  "name": "Balanced Distribution",
  "priority": 50,
  "enabled": true,
  "conditions": [
    {"field": "priority", "operator": "in", "value": ["MEDIUM", "LOW"]}
  ],
  "actions": [
    {"type": "assign_by_skill", "params": {"requiredSkills": []}}
  ]
}
```

---

## Integration with ML Scoring

```typescript
// After ML scoring generates alerts, automatically route them
import { mlScoringService } from './services/ml-scoring.service';
import { alertRoutingService } from './services/alert-routing.service';

// In your alert processor
async function processAndRouteAlert(userId: string) {
  // 1. ML Scoring generates alert
  const alerts = await mlScoringService.scoreUser(userId, signals);

  // 2. Automatically route each alert
  for (const alert of alerts) {
    const routingContext = {
      alertId: alert.alertId,
      userId: alert.userId,
      alertType: alert.alertType,
      confidence: alert.confidence,
      priority: calculatePriority(alert.confidence),
      territory: await getUserTerritory(userId)
    };

    const assignment = await alertRoutingService.routeAlert(routingContext);
    console.log(`Alert ${alert.alertId} assigned to agent ${assignment.agentId}`);
  }
}
```

---

## Scheduled Tasks

### Daily Stale Alert Handling

```typescript
import cron from 'node-cron';
import { alertRoutingService } from './services/alert-routing.service';

// Check for stale alerts every day at midnight
cron.schedule('0 0 * * *', async () => {
  await alertRoutingService.handleStaleAlerts(3); // Escalate if > 3 days old
  console.log('Stale alerts processed');
});
```

### Weekly Performance Report

```typescript
// Generate routing performance report every Monday at 9 AM
cron.schedule('0 9 * * 1', async () => {
  const stats = await fetch('/api/v1/alerts/routing/stats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });

  console.log('Weekly Routing Statistics:', stats.data);
  // Send report to management
});
```

---

## Testing Your Configuration

### Test 1: Verify Agent Profiles

```bash
# Check that all agents are configured
curl http://localhost:3000/api/v1/alerts/agents/available | jq '.data.agents[] | {agentId, availableCapacity, territories, skills}'
```

### Test 2: Verify Routing Rules

```bash
# Check all enabled rules
curl http://localhost:3000/api/v1/alerts/routing/rules | jq '.data.rules[] | {name, priority, enabled}'
```

### Test 3: Simulate Alert Routing

```bash
# Test routing with different scenarios
for confidence in 0.5 0.7 0.9; do
  curl -X POST http://localhost:3000/api/v1/alerts/route \
    -H "Content-Type: application/json" \
    -d "{
      \"alertId\": \"test-alert-$confidence\",
      \"userId\": \"test-user\",
      \"alertType\": \"LIKELY_TO_SELL\",
      \"confidence\": $confidence,
      \"priority\": \"HIGH\",
      \"territory\": \"San Francisco\"
    }"
done
```

### Test 4: Check Assignment Distribution

```bash
# Verify fair distribution among agents
curl http://localhost:3000/api/v1/alerts/routing/stats | jq '.data.byStrategy'
```

---

## Troubleshooting

### Problem: Alerts Not Being Assigned

**Check 1: Verify agents are available**
```bash
curl http://localhost:3000/api/v1/alerts/agents/available
```
**Solution**: Ensure agents have `available: true` and `autoAssign: true`

**Check 2: Verify routing rules exist**
```bash
curl http://localhost:3000/api/v1/alerts/routing/rules
```
**Solution**: Create at least one default routing rule

**Check 3: Check agent capacity**
```bash
curl http://localhost:3000/api/v1/alerts/agents/:agentId/workload
```
**Solution**: If all agents at capacity, increase `maxConcurrentAlerts`

### Problem: Alerts Always Go to Same Agent

**Cause**: High-priority rules may be too specific

**Solution**: Review rule priorities and conditions
```bash
curl http://localhost:3000/api/v1/alerts/routing/rules | jq '.data.rules | sort_by(.priority) | reverse'
```

### Problem: High Reassignment Rate

**Cause**: Initial routing not optimal

**Solution**: Analyze routing statistics and adjust rules
```bash
curl http://localhost:3000/api/v1/alerts/routing/stats
```

---

## Best Practices

### 1. Agent Configuration
- ✅ Set realistic `maxConcurrentAlerts` (10-15 typical)
- ✅ Keep agent profiles up to date
- ✅ Define clear territories and skills
- ✅ Use specializations for niche expertise

### 2. Routing Rules
- ✅ Use priority system effectively (100 = highest, 10 = default)
- ✅ Test rules in development before enabling in production
- ✅ Keep conditions simple and focused
- ✅ Document rule purpose in description field

### 3. Monitoring
- ✅ Check routing statistics daily
- ✅ Monitor reassignment rates (should be < 15%)
- ✅ Set up alerts for agent overload
- ✅ Review stale alert counts weekly

### 4. Performance
- ✅ Cache is automatically managed by Redis
- ✅ Routing rules cached for 5 minutes
- ✅ Agent workload cached for 1 minute
- ✅ Use bulk assignment for multiple alerts

---

## API Cheat Sheet

```bash
# ROUTING
POST   /api/v1/alerts/route                    # Route alert
POST   /api/v1/alerts/:id/reassign             # Reassign alert
POST   /api/v1/alerts/bulk-assign              # Bulk assign

# AGENTS
GET    /api/v1/alerts/agents/available         # List agents
GET    /api/v1/alerts/agents/:id/workload      # Get workload
GET    /api/v1/alerts/agents/:id/profile       # Get profile
PUT    /api/v1/alerts/agents/:id/profile       # Update profile

# RULES
GET    /api/v1/alerts/routing/rules            # List rules
POST   /api/v1/alerts/routing/rules            # Create rule
PATCH  /api/v1/alerts/routing/rules/:id        # Update rule
DELETE /api/v1/alerts/routing/rules/:id        # Delete rule

# STATS
GET    /api/v1/alerts/routing/stats            # Routing stats
GET    /api/v1/alerts/:id/assignments          # Assignment history

# MAINTENANCE
POST   /api/v1/alerts/routing/handle-stale    # Escalate stale alerts
```

---

## Next Steps

1. ✅ Set up agent profiles for your team
2. ✅ Create routing rules based on your business logic
3. ✅ Test routing with sample alerts
4. ✅ Integrate with ML scoring pipeline
5. ✅ Set up monitoring and scheduled tasks
6. ✅ Review and optimize based on statistics

**Need Help?** Check the full documentation in `ALERT_ROUTING_DOCUMENTATION.md`
