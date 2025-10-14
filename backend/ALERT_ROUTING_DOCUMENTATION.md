# Alert Routing & Prioritization System Documentation

## Overview

The Alert Routing & Prioritization Engine is an intelligent system that automatically assigns alerts to the most appropriate agents based on configurable business rules, agent workload, territories, skills, and alert confidence scores.

## Table of Contents

1. [Architecture](#architecture)
2. [Key Features](#key-features)
3. [API Endpoints](#api-endpoints)
4. [Routing Rules](#routing-rules)
5. [Agent Profiles](#agent-profiles)
6. [Configuration Examples](#configuration-examples)
7. [Integration Guide](#integration-guide)

---

## Architecture

### Components

1. **Alert Routing Service** (`alert-routing.service.ts`)
   - Core routing logic and rule evaluation
   - Agent workload management
   - Territory and skill-based routing
   - Redis caching for performance

2. **Routing Rules Engine**
   - JSON-based rule definition
   - Flexible condition evaluation
   - Priority-based rule execution
   - Dynamic rule updates without restart

3. **Workload Balancing**
   - Real-time agent capacity tracking
   - Round-robin distribution
   - Overflow handling
   - Stale alert escalation

4. **API Controllers** (`alert-routing.controller.ts`)
   - REST endpoints for routing operations
   - Agent management
   - Rule configuration
   - Statistics and reporting

### Database Models

```prisma
// Routing Rule - Configurable business rules
model RoutingRule {
  id          String
  name        String
  priority    Int           // Higher = evaluated first
  enabled     Boolean
  conditions  Json          // Array of conditions
  actions     Json          // Array of actions
}

// Agent Profile - Extended agent information
model AgentProfile {
  userId              String
  maxConcurrentAlerts Int
  territories         String[]
  skills              String[]
  available           Boolean
}

// Alert Assignment - Assignment tracking
model AlertAssignment {
  alertScoreId        String
  assignedToId        String
  assignmentReason    String
  routingStrategy     String
  status              AssignmentStatus
}

// Alert Outcome - Effectiveness tracking
model AlertOutcome {
  alertScoreId      String
  outcome           OutcomeType
  converted         Boolean
  conversionValue   Decimal
  timeToConversion  Int
}
```

---

## Key Features

### 1. Confidence-Based Ranking

Alerts are prioritized based on ML-generated confidence scores:

```typescript
// High confidence alerts get priority
if (confidence >= 0.8 && priority === 'CRITICAL') {
  // Assign immediately to best available agent
}
```

### 2. Territory-Based Routing

Automatically route alerts to agents assigned to specific geographic territories:

```typescript
const context = {
  alertId: 'alert-123',
  userId: 'user-456',
  alertType: 'LIKELY_TO_SELL',
  confidence: 0.85,
  priority: 'HIGH',
  territory: 'San Francisco Bay Area'
};

await alertRoutingService.routeAlert(context);
```

### 3. Skill-Based Routing

Match alerts to agents with specific expertise:

```typescript
// Route refinance opportunities to agents with refinance skills
{
  type: 'assign_by_skill',
  params: {
    requiredSkills: ['refinance', 'financial_analysis']
  }
}
```

### 4. Workload Balancing

Prevent agent overload with intelligent capacity management:

```typescript
const workload = await alertRoutingService.getAgentWorkload(agentId);
// Returns:
// {
//   agentId: 'agent-123',
//   activeAlerts: 7,
//   maxConcurrentAlerts: 10,
//   availableCapacity: 3
// }
```

### 5. Round-Robin Distribution

Fair distribution among available agents:

```typescript
// Automatically rotates assignments among agents with capacity
await alertRoutingService.routeAlert(context);
```

### 6. Stale Alert Escalation

Automatically escalate unacknowledged alerts:

```typescript
// Escalate alerts not acknowledged within 3 days
await alertRoutingService.handleStaleAlerts(3);
```

---

## API Endpoints

### Alert Routing

#### Route Alert to Agent

```http
POST /api/v1/alerts/route
Content-Type: application/json

{
  "alertId": "alert-123",
  "userId": "user-456",
  "alertType": "LIKELY_TO_SELL",
  "confidence": 0.85,
  "priority": "HIGH",
  "territory": "San Francisco Bay Area",
  "metadata": {
    "propertyValue": 1200000,
    "leadSource": "website"
  }
}

Response:
{
  "success": true,
  "data": {
    "alertId": "alert-123",
    "agentId": "agent-789",
    "assignmentReason": "Assigned via territory_based routing",
    "confidence": 0.85,
    "routingStrategy": "territory_based"
  }
}
```

#### Reassign Alert

```http
POST /api/v1/alerts/:alertId/reassign
Content-Type: application/json

{
  "newAgentId": "agent-999",
  "reason": "Original agent on vacation"
}

Response:
{
  "success": true,
  "data": {
    "alertId": "alert-123",
    "agentId": "agent-999",
    "assignmentReason": "Original agent on vacation",
    "routingStrategy": "manual_reassignment"
  }
}
```

#### Bulk Assign Alerts

```http
POST /api/v1/alerts/bulk-assign
Content-Type: application/json

{
  "alertIds": ["alert-123", "alert-456", "alert-789"]
}

Response:
{
  "success": true,
  "data": {
    "totalAlerts": 3,
    "successfulAssignments": 3,
    "failedAssignments": 0,
    "results": [...]
  }
}
```

### Agent Management

#### Get Available Agents

```http
GET /api/v1/alerts/agents/available

Response:
{
  "success": true,
  "data": {
    "totalAgents": 15,
    "availableAgents": 12,
    "agents": [
      {
        "agentId": "agent-123",
        "activeAlerts": 5,
        "maxConcurrentAlerts": 10,
        "availableCapacity": 5,
        "territories": ["San Francisco", "Oakland"],
        "skills": ["sell", "buy", "luxury"]
      }
    ]
  }
}
```

#### Get Agent Workload

```http
GET /api/v1/alerts/agents/:agentId/workload

Response:
{
  "success": true,
  "data": {
    "workload": {
      "agentId": "agent-123",
      "activeAlerts": 5,
      "maxConcurrentAlerts": 10,
      "availableCapacity": 5
    },
    "alerts": [
      {
        "id": "alert-123",
        "alertType": "LIKELY_TO_SELL",
        "priority": "HIGH",
        "confidence": 0.85,
        "assignedAt": "2025-01-15T10:00:00Z",
        "status": "PENDING"
      }
    ]
  }
}
```

#### Get/Update Agent Profile

```http
GET /api/v1/alerts/agents/:agentId/profile

Response:
{
  "success": true,
  "data": {
    "userId": "agent-123",
    "maxConcurrentAlerts": 10,
    "territories": ["San Francisco", "Oakland"],
    "skills": ["sell", "buy", "refinance"],
    "specializations": ["luxury", "first_time_buyer"],
    "available": true,
    "autoAssign": true
  }
}

PUT /api/v1/alerts/agents/:agentId/profile
Content-Type: application/json

{
  "maxConcurrentAlerts": 15,
  "territories": ["San Francisco", "Oakland", "San Jose"],
  "skills": ["sell", "buy", "refinance", "investment"],
  "available": true
}
```

### Routing Rules

#### Get Routing Rules

```http
GET /api/v1/alerts/routing/rules

Response:
{
  "success": true,
  "data": {
    "totalRules": 5,
    "enabledRules": 4,
    "rules": [
      {
        "id": "rule-123",
        "name": "High Value Leads to Senior Agents",
        "priority": 100,
        "enabled": true,
        "conditions": [...],
        "actions": [...]
      }
    ]
  }
}
```

#### Create Routing Rule

```http
POST /api/v1/alerts/routing/rules
Content-Type: application/json

{
  "name": "High Confidence Alerts to Best Performers",
  "description": "Route alerts with confidence > 0.8 to top 20% agents",
  "priority": 100,
  "enabled": true,
  "conditions": [
    {
      "field": "confidence",
      "operator": "greater_than",
      "value": 0.8
    },
    {
      "field": "priority",
      "operator": "in",
      "value": ["CRITICAL", "HIGH"]
    }
  ],
  "actions": [
    {
      "type": "assign_by_skill",
      "params": {
        "requiredSkills": ["luxury", "high_value"]
      }
    }
  ]
}
```

#### Update Routing Rule

```http
PATCH /api/v1/alerts/routing/rules/:ruleId
Content-Type: application/json

{
  "enabled": false,
  "priority": 50
}
```

#### Delete Routing Rule

```http
DELETE /api/v1/alerts/routing/rules/:ruleId
```

### Statistics

#### Get Routing Statistics

```http
GET /api/v1/alerts/routing/stats?startDate=2025-01-01&endDate=2025-01-31

Response:
{
  "success": true,
  "data": {
    "totalAssignments": 1250,
    "reassignmentRate": "12.4%",
    "byStrategy": {
      "territory_based": 650,
      "skill_based": 380,
      "round_robin": 220
    },
    "byStatus": {
      "PENDING": 150,
      "ACKNOWLEDGED": 800,
      "COMPLETED": 300
    }
  }
}
```

---

## Routing Rules

### Rule Structure

```typescript
{
  id: string;
  name: string;
  priority: number;        // Higher = evaluated first
  enabled: boolean;
  conditions: [            // All conditions must match
    {
      field: string;       // Context field (e.g., "confidence", "priority")
      operator: string;    // Comparison operator
      value: any;          // Value to compare against
    }
  ];
  actions: [              // Actions to execute when rule matches
    {
      type: string;        // Action type
      params: object;      // Action parameters
    }
  ];
}
```

### Condition Operators

- `equals` - Exact match
- `not_equals` - Does not match
- `greater_than` - Numeric comparison >
- `less_than` - Numeric comparison <
- `in` - Value is in array
- `not_in` - Value is not in array
- `contains` - String contains substring
- `regex` - Regular expression match

### Action Types

1. **assign_to_agent** - Assign to specific agent
   ```json
   {
     "type": "assign_to_agent",
     "params": { "agentId": "agent-123" }
   }
   ```

2. **assign_to_territory** - Assign based on territory
   ```json
   {
     "type": "assign_to_territory",
     "params": { "territory": "San Francisco" }
   }
   ```

3. **assign_by_skill** - Assign based on required skills
   ```json
   {
     "type": "assign_by_skill",
     "params": {
       "requiredSkills": ["refinance", "financial"]
     }
   }
   ```

4. **escalate** - Escalate to supervisor
   ```json
   {
     "type": "escalate",
     "params": {}
   }
   ```

5. **notify** - Send notification
   ```json
   {
     "type": "notify",
     "params": {
       "channel": "slack",
       "message": "High priority alert requires attention"
     }
   }
   ```

---

## Agent Profiles

### Profile Configuration

```typescript
{
  userId: string;
  maxConcurrentAlerts: number;    // Maximum alerts agent can handle
  currentAlertLoad: number;        // Current active alerts
  territories: string[];           // Geographic territories
  primaryTerritory: string;        // Main territory
  skills: string[];                // Agent expertise
  specializations: string[];       // Special areas
  available: boolean;              // Currently available
  availabilitySchedule: object;    // Weekly schedule
  preferredAlertTypes: string[];   // Preferred alert types
  autoAssign: boolean;             // Enable auto-assignment
}
```

### Example Profile

```json
{
  "userId": "agent-123",
  "maxConcurrentAlerts": 15,
  "territories": ["San Francisco", "Oakland", "San Jose"],
  "primaryTerritory": "San Francisco",
  "skills": ["sell", "buy", "refinance", "investment"],
  "specializations": ["luxury", "commercial", "waterfront"],
  "available": true,
  "availabilitySchedule": {
    "monday": { "start": "09:00", "end": "17:00" },
    "tuesday": { "start": "09:00", "end": "17:00" },
    "wednesday": { "start": "09:00", "end": "17:00" },
    "thursday": { "start": "09:00", "end": "17:00" },
    "friday": { "start": "09:00", "end": "17:00" }
  },
  "preferredAlertTypes": ["LIKELY_TO_SELL", "INVESTMENT_INTEREST"],
  "autoAssign": true
}
```

---

## Configuration Examples

### Example 1: High-Value Leads to Senior Agents

```json
{
  "name": "High Value Leads to Senior Agents",
  "priority": 100,
  "enabled": true,
  "conditions": [
    {
      "field": "confidence",
      "operator": "greater_than",
      "value": 0.8
    },
    {
      "field": "metadata.propertyValue",
      "operator": "greater_than",
      "value": 2000000
    }
  ],
  "actions": [
    {
      "type": "assign_by_skill",
      "params": {
        "requiredSkills": ["luxury", "high_value"]
      }
    }
  ]
}
```

### Example 2: Territory-Based Assignment

```json
{
  "name": "San Francisco Leads to SF Agents",
  "priority": 80,
  "enabled": true,
  "conditions": [
    {
      "field": "territory",
      "operator": "equals",
      "value": "San Francisco"
    }
  ],
  "actions": [
    {
      "type": "assign_to_territory",
      "params": {
        "territory": "San Francisco"
      }
    }
  ]
}
```

### Example 3: Escalate Critical Alerts

```json
{
  "name": "Escalate Critical Refinance Opportunities",
  "priority": 90,
  "enabled": true,
  "conditions": [
    {
      "field": "alertType",
      "operator": "equals",
      "value": "REFINANCE_OPPORTUNITY"
    },
    {
      "field": "priority",
      "operator": "equals",
      "value": "CRITICAL"
    },
    {
      "field": "confidence",
      "operator": "greater_than",
      "value": 0.85
    }
  ],
  "actions": [
    {
      "type": "escalate",
      "params": {}
    }
  ]
}
```

### Example 4: Round-Robin for Standard Alerts

```json
{
  "name": "Round Robin for Medium Priority",
  "priority": 10,
  "enabled": true,
  "conditions": [
    {
      "field": "priority",
      "operator": "equals",
      "value": "MEDIUM"
    }
  ],
  "actions": [
    {
      "type": "assign_by_skill",
      "params": {
        "requiredSkills": []
      }
    }
  ]
}
```

---

## Integration Guide

### Step 1: Set Up Agent Profiles

```typescript
// Create agent profile for each agent
await fetch('/api/v1/alerts/agents/agent-123/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    maxConcurrentAlerts: 10,
    territories: ['San Francisco', 'Oakland'],
    skills: ['sell', 'buy', 'refinance'],
    available: true,
    autoAssign: true
  })
});
```

### Step 2: Configure Routing Rules

```typescript
// Create routing rules based on business logic
await fetch('/api/v1/alerts/routing/rules', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'High Confidence to Best Agents',
    priority: 100,
    enabled: true,
    conditions: [
      { field: 'confidence', operator: 'greater_than', value: 0.8 }
    ],
    actions: [
      { type: 'assign_by_skill', params: { requiredSkills: ['luxury'] } }
    ]
  })
});
```

### Step 3: Route Alerts Automatically

```typescript
// After ML scoring generates alerts, route them
const alert = {
  alertId: 'alert-123',
  userId: 'user-456',
  alertType: 'LIKELY_TO_SELL',
  confidence: 0.85,
  priority: 'HIGH',
  territory: 'San Francisco'
};

const result = await fetch('/api/v1/alerts/route', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(alert)
});

console.log(`Alert assigned to agent: ${result.data.agentId}`);
```

### Step 4: Monitor Workload

```typescript
// Check agent workload before manual assignment
const workload = await fetch('/api/v1/alerts/agents/agent-123/workload');

if (workload.data.workload.availableCapacity > 0) {
  // Agent has capacity, can assign more alerts
}
```

### Step 5: Handle Stale Alerts

```typescript
// Set up cron job to check for stale alerts daily
cron.schedule('0 0 * * *', async () => {
  await fetch('/api/v1/alerts/routing/handle-stale', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ maxAgeDays: 3 })
  });
});
```

---

## Performance Considerations

### Caching Strategy

The routing service uses Redis caching for:

1. **Routing Rules** - Cached for 5 minutes
2. **Agent Workload** - Cached for 1 minute
3. **Agent Profiles** - Fetched from database (frequently updated)

### Cache Invalidation

```typescript
// Refresh routing rules cache after changes
await alertRoutingService.refreshRoutingRulesCache();

// Workload cache invalidates automatically after assignments
```

### Optimization Tips

1. **Limit Rule Complexity** - Keep condition count reasonable (< 10 per rule)
2. **Use Priorities Wisely** - Higher priority rules evaluated first
3. **Monitor Cache Hit Rates** - Adjust TTL based on usage patterns
4. **Batch Operations** - Use bulk assignment for multiple alerts
5. **Index Database Fields** - Ensure proper indexes on assignment fields

---

## Error Handling

### Common Errors

1. **No Available Agents**
   ```json
   {
     "success": false,
     "error": "No agents available for assignment"
   }
   ```

2. **Invalid Rule Configuration**
   ```json
   {
     "success": false,
     "error": "Invalid condition operator: 'invalid_op'"
   }
   ```

3. **Agent Over Capacity**
   - System will assign to least busy agent with warning log

### Best Practices

1. **Always set maxConcurrentAlerts** - Prevents agent overload
2. **Test rules before enabling** - Use priority 0 to test without affecting production
3. **Monitor reassignment rates** - High rates indicate routing issues
4. **Set up stale alert monitoring** - Prevent alerts from being ignored
5. **Track routing statistics** - Optimize rules based on performance data

---

## Support

For questions or issues:
- API Documentation: `/api/v1` (root endpoint)
- Logging: Check `logs/combined.log` for routing decisions
- Metrics: Use `/api/v1/alerts/routing/stats` for performance insights
