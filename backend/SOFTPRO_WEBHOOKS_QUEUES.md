# SoftPro Webhook & Queue Processing System

## Overview

Complete real-time webhook handling and queue-based processing system for SoftPro 360 integration with the ROI Systems platform. This system provides enterprise-grade reliability, scalability, and monitoring capabilities.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        SoftPro 360 API                          │
└────────────────────┬────────────────────────────────────────────┘
                     │ Webhooks
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              Webhook Receiver (Express Endpoint)                │
│  - Signature validation (HMAC-SHA256)                           │
│  - Timestamp verification (5 min window)                        │
│  - Immediate 200 OK response                                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Event Deduplication                           │
│  - Redis-based fingerprinting (24h TTL)                         │
│  - Prevents duplicate processing                                │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Bull Queue System (Redis)                      │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Webhook Events Queue (Priority: 1-5)               │       │
│  │  - Transaction updates (Priority 1-2)               │       │
│  │  - Document uploads (Priority 3)                    │       │
│  │  - Contact updates (Priority 4)                     │       │
│  │  - Batch syncs (Priority 5)                         │       │
│  └─────────────────────────────────────────────────────┘       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Sync Queues (Scheduled)                            │       │
│  │  - Transactions (every 5-15 min)                    │       │
│  │  - Contacts (every 15 min)                          │       │
│  │  - Documents (on-demand + webhook)                  │       │
│  └─────────────────────────────────────────────────────┘       │
│  ┌─────────────────────────────────────────────────────┐       │
│  │  Retry Queue (Exponential Backoff)                  │       │
│  │  - Max 5 attempts                                    │       │
│  │  - 2s, 4s, 8s, 16s, 32s delays                      │       │
│  └─────────────────────────────────────────────────────┘       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Queue Processors (Workers)                      │
│  - Parallel processing with concurrency limits                  │
│  - Error handling and retry logic                               │
│  - Rate limit management (100 req/min)                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              PostgreSQL Database (via Prisma)                   │
│  - Webhook events (audit log)                                   │
│  - Transactions, Contacts, Documents                            │
│  - Status change logs                                           │
│  - Integration configurations                                   │
└─────────────────────────────────────────────────────────────────┘
```

## Features

### ✅ Webhook Processing
- **Signature Validation**: HMAC-SHA256 verification with timing-safe comparison
- **Replay Attack Prevention**: Timestamp validation (5-minute window)
- **Duplicate Detection**: Redis-based event deduplication (24h TTL)
- **Immediate Response**: Non-blocking 200 OK response (<50ms)
- **Async Processing**: Queue-based processing with priority levels

### ✅ Queue System
- **Multi-Queue Architecture**: Separate queues for webhooks, syncs, and retries
- **Priority Processing**: 5-level priority system (1=highest)
- **Exponential Backoff**: Automatic retry with increasing delays
- **Job Lifecycle Management**: Tracking from received → queued → processing → completed/failed
- **Performance Monitoring**: Real-time queue depth and processing metrics

### ✅ Scheduled Sync
- **Cron-Based Scheduling**: Per-integration sync frequencies (5-60+ minutes)
- **Staggered Execution**: Prevents rate limit exhaustion
- **Catch-Up Syncs**: Automatic detection and repair of missed syncs
- **Sync Lock Mechanism**: Prevents concurrent syncs (Redis-based)

### ✅ Error Recovery
- **Automatic Retry**: Up to 5 attempts with exponential backoff
- **Manual Retry**: API endpoints for single and batch retry
- **Gap Detection**: Identifies missing data periods
- **Gap Filling**: Targeted sync jobs to repair data gaps
- **Full Resync**: Emergency complete data synchronization

### ✅ Monitoring & Observability
- **Health Checks**: Integration status (healthy/degraded/unhealthy/disconnected)
- **Performance Metrics**: Processing times, success rates, error rates
- **Queue Metrics**: Depth, oldest job, throughput
- **Error Analytics**: Top errors, frequency, affected events
- **Uptime Tracking**: 24h/7d/30d uptime percentages

### ✅ Rate Limiting
- **Smart Throttling**: Token bucket algorithm with Redis
- **Per-Integration Quotas**: Configurable limits (default 100/min)
- **Automatic Backoff**: Waits for quota availability
- **Quota Monitoring**: Real-time remaining quota tracking

## File Structure

```
backend/src/
├── services/
│   ├── softpro-webhook.service.ts       # Core webhook processing
│   ├── softpro-scheduler.service.ts     # Scheduled sync management
│   ├── softpro-monitoring.service.ts    # Health & metrics
│   └── softpro-recovery.service.ts      # Recovery & rate limiting
├── workers/
│   └── softpro-queue-processor.ts       # Bull queue processors
├── controllers/
│   └── softpro-webhook.controller.ts    # API endpoints
└── routes/
    └── softpro-webhook.routes.ts        # Route definitions
```

## API Endpoints

### Public Endpoints (No Authentication)

#### **POST** `/api/webhooks/softpro/:integrationId`
Webhook receiver endpoint called by SoftPro.

**Headers:**
- `x-softpro-signature` or `x-signature`: HMAC-SHA256 signature
- `content-type`: application/json

**Request Body:**
```json
{
  "id": "evt_123456",
  "type": "transaction.updated",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "id": "txn_789",
    "file_number": "2024-001",
    "status": "in_progress",
    "property": {
      "address": "123 Main St"
    },
    "closing_date": "2024-02-01"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Webhook received",
  "integrationId": "int_abc123",
  "eventType": "transaction.updated"
}
```

#### **GET** `/api/webhooks/health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "softpro-webhook",
    "timestamp": "2024-01-15T10:30:00Z",
    "queues": [...]
  }
}
```

### Protected Endpoints (JWT Required)

#### **GET** `/api/v1/integrations/softpro/webhooks/events`
Get webhook event history with filtering and pagination.

**Query Parameters:**
- `integrationId` (optional): Filter by integration
- `eventType` (optional): Filter by event type
- `status` (optional): Filter by status (RECEIVED, COMPLETED, FAILED, etc.)
- `startDate` (optional): ISO date
- `endDate` (optional): ISO date
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 50): Results per page

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "evt_123",
        "eventType": "transaction.updated",
        "status": "COMPLETED",
        "receivedAt": "2024-01-15T10:30:00Z",
        "processedAt": "2024-01-15T10:30:01Z",
        "processingTimeMs": 1234,
        "retryCount": 0,
        "error": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1250,
      "totalPages": 25
    }
  }
}
```

#### **GET** `/api/v1/integrations/softpro/webhooks/events/:eventId`
Get details of a specific webhook event.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "evt_123",
    "eventType": "transaction.updated",
    "status": "COMPLETED",
    "receivedAt": "2024-01-15T10:30:00Z",
    "processedAt": "2024-01-15T10:30:01Z",
    "retryCount": 0,
    "payload": {...},
    "integration": {
      "id": "int_abc123",
      "organizationId": "org_xyz",
      "active": true
    }
  }
}
```

#### **POST** `/api/v1/integrations/softpro/webhooks/retry/:eventId`
Manually retry a failed webhook event.

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": "evt_123",
    "message": "Event retry queued"
  }
}
```

#### **POST** `/api/v1/integrations/softpro/webhooks/retry-batch`
Batch retry failed events.

**Request Body:**
```json
{
  "integrationId": "int_abc123",
  "eventIds": ["evt_123", "evt_456"]  // Optional, if omitted retries all failed
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "retriedCount": 42,
    "message": "42 events queued for retry"
  }
}
```

#### **GET** `/api/v1/integrations/softpro/webhooks/stats`
Get webhook processing statistics.

**Query Parameters:**
- `integrationId` (optional): Filter by integration
- `period` (optional, default: 24h): 1h, 24h, 7d, 30d

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "24h",
    "startDate": "2024-01-14T10:30:00Z",
    "endDate": "2024-01-15T10:30:00Z",
    "webhookStats": {
      "totalEvents": 1234,
      "received": 1234,
      "completed": 1200,
      "failed": 34,
      "processing": 0,
      "successRate": 97.24,
      "failureRate": 2.76,
      "avgProcessingTimeMs": 856
    },
    "queueStats": [
      {
        "queueName": "softpro:webhook-events",
        "waiting": 12,
        "active": 5,
        "completed": 1200,
        "failed": 34,
        "delayed": 0,
        "paused": false
      }
    ]
  }
}
```

#### **PUT** `/api/v1/integrations/softpro/webhooks/config`
Update webhook configuration.

**Request Body:**
```json
{
  "integrationId": "int_abc123",
  "enabled": true,
  "webhookSecret": "new_secret_key",
  "retryConfig": {
    "maxRetries": 5,
    "initialDelay": 2000
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "integration": {
      "id": "int_abc123",
      "webhookEnabled": true,
      "webhookSecret": "***"
    }
  }
}
```

## Event Types

### Transaction Events
- `transaction.created` - New transaction created
- `transaction.updated` - Transaction details updated
- `transaction.status_changed` - Transaction status changed (priority 1)

### Document Events
- `document.uploaded` - New document uploaded
- `document.updated` - Document metadata updated
- `document.deleted` - Document removed

### Contact Events
- `contact.created` - New contact added
- `contact.updated` - Contact details updated
- `contact.deleted` - Contact removed

### Closing Events
- `closing.scheduled` - Closing date scheduled (priority 1)
- `closing.completed` - Closing finalized (priority 1)

### Task Events
- `task.created` - New task created
- `task.completed` - Task marked complete

## Queue Configuration

### Default Job Options
```typescript
{
  attempts: 5,                  // Max retry attempts
  backoff: {
    type: 'exponential',
    delay: 2000                 // Start with 2 seconds
  },
  removeOnComplete: 100,        // Keep last 100 completed
  removeOnFail: 500,            // Keep last 500 failed
  timeout: 30000                // 30 second timeout
}
```

### Queue Priority Levels
1. **Priority 1 (Highest)**: Status changes, closing events
2. **Priority 2**: Transaction updates
3. **Priority 3**: Document uploads
4. **Priority 4**: Contact updates
5. **Priority 5 (Lowest)**: Batch syncs

### Retry Strategy
- **Attempt 1**: Immediate
- **Attempt 2**: 2 seconds delay
- **Attempt 3**: 4 seconds delay
- **Attempt 4**: 8 seconds delay
- **Attempt 5**: 16 seconds delay
- **Max Attempts**: 5 (then marked as permanently failed)

## Scheduled Sync

### Default Frequencies
- **Transactions**: Every 5 minutes
- **Contacts**: Every 15 minutes
- **Documents**: On-demand + webhook-triggered

### Cron Expression Conversion
```typescript
// 5 minutes: */5 * * * *
// 15 minutes: */15 * * * *
// 1 hour: 0 * * * *
// 2 hours: 0 */2 * * *
```

### Sync Workflow
1. Scheduler triggers at configured interval
2. Check integration is active
3. Acquire sync lock (Redis, 10-minute TTL)
4. Queue sync jobs with staggered delays (10s apart)
5. Process sync job (fetch from API, upsert to database)
6. Release sync lock
7. Update integration `lastSyncAt` timestamp

## Monitoring

### Health Status
- **HEALTHY**: Active, recent syncs, low error rate (<5%)
- **DEGRADED**: Active, old syncs (>2h), moderate errors (5-20%)
- **UNHEALTHY**: Active, very old syncs (>12h), high errors (20-50%)
- **DISCONNECTED**: Inactive or no activity in 24h

### Metrics Collection
```typescript
interface IntegrationMetrics {
  connectionStatus: IntegrationStatus;
  lastSuccessfulSync: Date | null;
  uptime: number;                      // percentage (0-100)
  webhooksReceived24h: number;
  webhooksProcessed24h: number;
  webhookFailureRate: number;
  avgWebhookProcessingTime: number;    // milliseconds
  syncJobsCompleted24h: number;
  syncJobsFailed24h: number;
  avgSyncDuration: number;
  recordsSynced24h: number;
  queueDepth: number;
  oldestPendingJob: Date | null;
  errorRate: number;
  topErrors: ErrorSummary[];
}
```

## Error Recovery

### Automatic Recovery
- Failed jobs automatically retry with exponential backoff
- Max 5 retry attempts before permanent failure
- Retry queue handles delayed re-processing

### Manual Recovery

#### Retry Single Event
```bash
POST /api/v1/integrations/softpro/webhooks/retry/:eventId
```

#### Retry All Failed Events
```bash
POST /api/v1/integrations/softpro/webhooks/retry-batch
{
  "integrationId": "int_abc123"
}
```

#### Detect and Fill Sync Gaps
```typescript
const gaps = await softProRecoveryService.detectSyncGaps(integrationId);
await softProRecoveryService.fillSyncGaps(integrationId, gaps);
```

#### Full Resync (Emergency)
```typescript
await softProRecoveryService.performFullResync(integrationId);
```

### Data Consistency Validation
```typescript
const report = await softProRecoveryService.validateDataConsistency(integrationId);
// Returns: ConsistencyReport with score (0-100) and issues
```

## Rate Limiting

### Configuration
- **Default Limit**: 100 requests per minute per integration
- **Window**: 60 seconds (sliding)
- **Storage**: Redis with TTL
- **Strategy**: Token bucket algorithm

### Usage
```typescript
// Check if request allowed
const canMake = await rateLimitManager.canMakeRequest(integrationId);

// Record request
await rateLimitManager.recordRequest(integrationId);

// Get remaining quota
const remaining = await rateLimitManager.getRemainingQuota(integrationId);

// Wait for quota
await rateLimitManager.waitForQuota(integrationId);
```

## Environment Variables

```bash
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Queue Configuration
QUEUE_CONCURRENCY=5
QUEUE_MAX_RETRIES=5
QUEUE_RETRY_DELAY=2000

# Webhook Configuration
WEBHOOK_SIGNATURE_TTL=300        # 5 minutes
WEBHOOK_DEDUP_TTL=86400          # 24 hours

# Rate Limiting
RATE_LIMIT_DEFAULT=100           # requests per minute
RATE_LIMIT_WINDOW=60000          # 1 minute in ms

# Sync Configuration
SYNC_MIN_INTERVAL=5              # 5 minutes minimum
SYNC_DEFAULT_INTERVAL=15         # 15 minutes default
```

## Database Schema

### webhook_events
```prisma
model WebhookEvent {
  id                  String               @id @default(uuid())
  integrationId       String
  eventId             String               @unique
  eventType           String
  payload             Json
  headers             Json
  status              WebhookEventStatus
  receivedAt          DateTime             @default(now())
  processingStartedAt DateTime?
  processedAt         DateTime?
  failedAt            DateTime?
  processingTimeMs    Int?
  retryCount          Int                  @default(0)
  lastRetryAt         DateTime?
  error               String?

  integration         SoftProIntegration   @relation(fields: [integrationId], references: [id])

  @@index([integrationId])
  @@index([status])
  @@index([receivedAt])
  @@index([eventType])
}
```

### softpro_integrations
```prisma
model SoftProIntegration {
  id                  String     @id @default(uuid())
  organizationId      String
  active              Boolean    @default(true)
  webhookEnabled      Boolean    @default(true)
  webhookSecret       String?
  syncEnabled         Boolean    @default(true)
  syncFrequency       Int        @default(15)  // minutes
  syncTypes           String[]   @default(["transactions", "contacts", "documents"])
  lastSyncAt          DateTime?
  lastScheduledSyncAt DateTime?
  syncStatus          String?    @default("IDLE")
  lastSyncError       String?
  rateLimit           Int        @default(100)  // per minute
  webhookRetryConfig  Json?

  webhookEvents       WebhookEvent[]

  @@index([organizationId])
  @@index([active])
}
```

## Usage Examples

### Starting the System

```typescript
// In your main server file (src/index.ts)
import { softProSchedulerService } from './services/softpro-scheduler.service';
import { softProQueueProcessor } from './workers/softpro-queue-processor';

// Initialize schedulers on startup
await softProSchedulerService.initializeSchedulers();

// Queues are automatically initialized when imported
```

### Processing a Webhook

```typescript
// Handled automatically by routes
// Manual processing:
await softProWebhookService.processWebhook(
  integrationId,
  WebhookEventType.TRANSACTION_UPDATED,
  payload,
  headers
);
```

### Scheduling a Sync

```typescript
await softProSchedulerService.startScheduler(
  integrationId,
  15,  // frequency in minutes
  ['transactions', 'contacts', 'documents']
);
```

### Monitoring Integration Health

```typescript
const metrics = await softProMonitoringService.getIntegrationMetrics(integrationId);
const health = await softProMonitoringService.getHealthStatus(integrationId);

console.log(`Status: ${health.status}`);
console.log(`Score: ${health.score}/100`);
console.log(`Uptime: ${metrics.uptime}%`);
```

## Performance Benchmarks

### Target Metrics
- **Webhook Response Time**: <50ms (95th percentile)
- **Webhook Processing Time**: <5s (95th percentile)
- **Throughput**: 1000+ webhooks/minute
- **Queue Processing**: 100+ jobs/second
- **Sync Duration**: <30s for 100 records
- **Error Rate**: <5% sustained
- **Uptime**: >99.9% (8.7h downtime/year)

## Troubleshooting

### High Error Rate
1. Check `getErrorSummary()` for top errors
2. Review SoftPro API connectivity
3. Validate webhook secret configuration
4. Check rate limiting status

### Sync Delays
1. Check scheduler status with `getSchedulerStatus()`
2. Verify sync lock is not stuck (Redis key: `sync:lock:{id}`)
3. Review queue depth and processing times
4. Check rate limit quota

### Queue Backlog
1. Get queue stats with `getQueueStats()`
2. Check for stalled jobs
3. Review worker concurrency settings
4. Consider scaling workers

### Data Inconsistencies
1. Run consistency validation
2. Detect sync gaps
3. Fill gaps or perform full resync
4. Review webhook event logs

## Security Considerations

1. **Webhook Signature Validation**: Always enabled in production
2. **Timestamp Verification**: 5-minute window to prevent replay attacks
3. **Rate Limiting**: Per-integration quotas to prevent abuse
4. **Secret Rotation**: Regular webhook secret updates
5. **Access Control**: JWT authentication for all management endpoints
6. **Audit Logging**: All webhook events logged with full payload

## Maintenance

### Daily
- Monitor error rates and health status
- Review failed jobs and retry as needed
- Check queue depths and processing times

### Weekly
- Clean up old failed events (30+ days)
- Review sync gap reports
- Analyze top errors and patterns

### Monthly
- Validate data consistency
- Review and optimize sync frequencies
- Update rate limits based on usage

## Support

For issues or questions:
1. Check logs in CloudWatch/Elasticsearch
2. Review monitoring dashboard metrics
3. Run health checks and diagnostics
4. Contact ROI Systems DevOps team

---

**Version**: 1.0.0
**Last Updated**: January 2024
**Maintained By**: ROI Systems Backend Team
