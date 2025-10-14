# SoftPro 360 Integration - Backend Documentation

## Overview

This document provides comprehensive documentation for the SoftPro 360 integration backend implementation for the ROI Systems platform. The integration enables seamless bidirectional data synchronization between ROI Systems and SoftPro 360 title production software.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [Services](#services)
4. [API Endpoints](#api-endpoints)
5. [Authentication Flow](#authentication-flow)
6. [Data Synchronization](#data-synchronization)
7. [Error Handling](#error-handling)
8. [Configuration](#configuration)
9. [Testing](#testing)
10. [Deployment](#deployment)

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                     ROI Systems Platform                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │   Frontend    │───▶│ API Gateway  │───│  Database   │ │
│  │  Application  │    │ (Express.js) │   │ (PostgreSQL)│ │
│  └───────────────┘    └──────────────┘   └─────────────┘ │
│                              │                             │
│                              ▼                             │
│                    ┌──────────────────┐                   │
│                    │  SoftPro OAuth   │                   │
│                    │     Service      │                   │
│                    └──────────────────┘                   │
│                              │                             │
│                              ▼                             │
│                    ┌──────────────────┐                   │
│                    │  SoftPro API     │                   │
│                    │     Client       │                   │
│                    └──────────────────┘                   │
│                              │                             │
│                              ▼                             │
│                    ┌──────────────────┐                   │
│                    │  Sync Service    │                   │
│                    └──────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  SoftPro 360 API │
                    │   (External)     │
                    └──────────────────┘
```

### Technology Stack

- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: OAuth 2.0
- **Encryption**: AES-256 for token storage
- **Logging**: Winston
- **Testing**: Jest

## Database Schema

### Core Models

#### SoftProIntegration

Stores integration configuration and OAuth tokens.

```prisma
model SoftProIntegration {
  id                String
  organizationId    String @unique
  clientId          String
  clientSecret      String // Encrypted
  environment       IntegrationEnvironment // SANDBOX | PRODUCTION
  accessToken       String? // Encrypted
  refreshToken      String? // Encrypted
  tokenExpiresAt    DateTime?
  status            IntegrationStatus
  lastSyncAt        DateTime?
  lastErrorAt       DateTime?
  lastErrorMessage  String?
  syncEnabled       Boolean
  syncFrequency     Int // seconds
  syncTransactions  Boolean
  syncDocuments     Boolean
  syncContacts      Boolean
  webhooksEnabled   Boolean
  metadata          Json?
  createdAt         DateTime
  updatedAt         DateTime
  deletedAt         DateTime?
}
```

#### IntegrationMapping

Defines field mappings between SoftPro and ROI Systems.

```prisma
model IntegrationMapping {
  id                String
  integrationId     String
  entityType        EntityType // TRANSACTION, CONTACT, DOCUMENT
  softproField      String
  roiSystemsField   String
  direction         SyncDirection // SOFTPRO_TO_ROI, ROI_TO_SOFTPRO, BIDIRECTIONAL
  transformationRule Json?
  required          Boolean
  defaultValue      String?
  enabled           Boolean
  createdAt         DateTime
  updatedAt         DateTime
}
```

#### SyncLog

Tracks all synchronization operations.

```prisma
model SyncLog {
  id                String
  integrationId     String
  syncType          SyncType // MANUAL, SCHEDULED, WEBHOOK
  entityType        EntityType
  entityId          String?
  roiEntityId       String?
  operation         SyncOperation // CREATE, UPDATE, DELETE
  direction         SyncDirection
  status            SyncStatus // PENDING, IN_PROGRESS, COMPLETED, FAILED
  recordsProcessed  Int
  recordsFailed     Int
  requestPayload    Json?
  responsePayload   Json?
  errorMessage      String?
  stackTrace        String?
  startedAt         DateTime
  completedAt       DateTime?
  duration          Int? // milliseconds
  attempts          Int
  maxAttempts       Int
  nextRetryAt       DateTime?
}
```

#### WebhookEvent

Tracks incoming webhook events from SoftPro.

```prisma
model WebhookEvent {
  id                String
  integrationId     String
  eventType         WebhookEventType
  eventId           String @unique
  entityType        EntityType
  entityId          String
  payload           Json
  headers           Json?
  signature         String?
  signatureVerified Boolean
  processed         Boolean
  processedAt       DateTime?
  processingError   String?
  attempts          Int
  maxAttempts       Int
  nextRetryAt       DateTime?
  receivedAt        DateTime
  createdAt         DateTime
}
```

## Services

### OAuth Service (`softpro-oauth.service.ts`)

Manages OAuth 2.0 authentication flow with SoftPro.

**Key Functions:**

```typescript
// Generate OAuth authorization URL
getAuthorizationUrl(organizationId: string, redirectPath?: string): Promise<string>

// Exchange authorization code for tokens
exchangeCodeForTokens(code: string, state: string): Promise<StateData>

// Refresh access token
refreshAccessToken(integrationId: string): Promise<string>

// Get valid access token (auto-refresh if needed)
getValidAccessToken(integrationId: string): Promise<string>

// Revoke access (disconnect)
revokeAccess(integrationId: string): Promise<void>

// Validate token
validateToken(accessToken: string): Promise<boolean>
```

**Security Features:**
- Encrypted token storage using AES-256
- CSRF protection with state parameter
- Automatic token refresh before expiry
- Secure token revocation

### API Client Service (`softpro-api.service.ts`)

Provides a RESTful wrapper for all SoftPro 360 API endpoints.

**Key Functions:**

**Transactions:**
```typescript
getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>>
getTransaction(orderId: string): Promise<Transaction>
createTransaction(data: TransactionData): Promise<Transaction>
updateTransaction(orderId: string, data: Partial<TransactionData>): Promise<Transaction>
deleteTransaction(orderId: string): Promise<void>
```

**Documents:**
```typescript
getDocuments(orderId: string, filters?: DocumentFilters): Promise<Document[]>
getDocument(orderId: string, documentId: string): Promise<Document>
uploadDocument(orderId: string, file: Buffer, metadata: DocumentMetadata): Promise<Document>
downloadDocument(orderId: string, documentId: string): Promise<Buffer>
deleteDocument(orderId: string, documentId: string): Promise<void>
```

**Contacts:**
```typescript
getContacts(filters?: ContactFilters): Promise<PaginatedResponse<Contact>>
getContact(contactId: string): Promise<Contact>
createContact(data: ContactData): Promise<Contact>
updateContact(contactId: string, data: Partial<ContactData>): Promise<Contact>
```

**Features:**
- Automatic authentication header injection
- Rate limit handling (100 requests/minute)
- Exponential backoff retry logic
- Request/response logging
- Error transformation
- Support for sandbox and production environments

### Sync Service (`softpro-sync.service.ts`)

Handles bidirectional data synchronization.

**Key Functions:**

```typescript
syncAllTransactions(integrationId: string): Promise<SyncResult>
syncAllContacts(integrationId: string): Promise<SyncResult>
syncTransaction(integrationId: string, orderId: string, direction: SyncDirection): Promise<void>
syncContact(integrationId: string, contactId: string, direction: SyncDirection): Promise<void>
transformToSoftPro(entityType: string, data: any, mappings: any[]): any
transformFromSoftPro(entityType: string, data: any, mappings: any[]): any
resolveConflict(local: any, remote: any, strategy: ConflictStrategy): any
```

**Features:**
- Full and incremental sync
- Batch processing (configurable batch size)
- Field mapping and transformation
- Conflict resolution strategies
- Delta sync (only changed records)

### Retry Manager (`retry-manager.ts`)

Implements exponential backoff for API retries.

**Features:**
- Configurable max attempts
- Exponential backoff with jitter
- Retryable error classification
- Rate limit specific handling

**Usage:**
```typescript
const retryManager = new RetryManager({
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [ErrorType.NETWORK, ErrorType.RATE_LIMIT]
});

await retryManager.executeWithRetry(async () => {
  // Your operation here
}, 'operationContext');
```

## API Endpoints

### OAuth Endpoints

#### Connect to SoftPro
```
POST /api/v1/integrations/softpro/connect
Authorization: Bearer <token>

Request Body:
{
  "organizationId": "org-uuid"
}

Response:
{
  "success": true,
  "data": {
    "authorizationUrl": "https://auth.softprocorp.com/oauth/authorize?..."
  }
}
```

#### OAuth Callback
```
GET /api/v1/integrations/softpro/callback?code=xxx&state=yyy

Redirects to: ${FRONTEND_URL}?integration=softpro&status=connected
```

#### Disconnect
```
DELETE /api/v1/integrations/softpro/disconnect/:integrationId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Integration disconnected successfully"
}
```

### Status and Configuration

#### Get Integration Status
```
GET /api/v1/integrations/softpro/status?organizationId=xxx
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": "integration-uuid",
    "status": "CONNECTED",
    "environment": "SANDBOX",
    "lastSyncAt": "2025-01-01T00:00:00.000Z",
    "syncEnabled": true,
    "syncFrequency": 300
  }
}
```

#### Get Field Mappings
```
GET /api/v1/integrations/softpro/mappings?integrationId=xxx
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "mapping-uuid",
      "entityType": "TRANSACTION",
      "softproField": "orderNumber",
      "roiSystemsField": "transaction_number",
      "direction": "BIDIRECTIONAL",
      "enabled": true
    }
  ]
}
```

#### Update Field Mappings
```
PUT /api/v1/integrations/softpro/mappings
Authorization: Bearer <token>

Request Body:
{
  "integrationId": "integration-uuid",
  "mappings": [
    {
      "entityType": "TRANSACTION",
      "softproField": "orderNumber",
      "roiSystemsField": "transaction_number",
      "direction": "BIDIRECTIONAL",
      "required": true,
      "enabled": true
    }
  ]
}

Response:
{
  "success": true,
  "message": "Mappings updated successfully"
}
```

### Sync Endpoints

#### Sync Transactions
```
POST /api/v1/integrations/softpro/sync/transactions
Authorization: Bearer <token>

Request Body:
{
  "integrationId": "integration-uuid"
}

Response:
{
  "success": true,
  "data": {
    "success": true,
    "entityType": "TRANSACTION",
    "operation": "sync",
    "recordsProcessed": 50,
    "recordsSucceeded": 48,
    "recordsFailed": 2,
    "duration": 5000,
    "startedAt": "2025-01-01T00:00:00.000Z",
    "completedAt": "2025-01-01T00:00:05.000Z"
  }
}
```

#### Sync Contacts
```
POST /api/v1/integrations/softpro/sync/contacts
Authorization: Bearer <token>

Request Body:
{
  "integrationId": "integration-uuid"
}

Response:
{
  "success": true,
  "data": {
    "success": true,
    "entityType": "CONTACT",
    "operation": "sync",
    "recordsProcessed": 30,
    "recordsSucceeded": 30,
    "recordsFailed": 0,
    "duration": 3000,
    "startedAt": "2025-01-01T00:00:00.000Z",
    "completedAt": "2025-01-01T00:00:03.000Z"
  }
}
```

#### Get Sync Logs
```
GET /api/v1/integrations/softpro/sync/logs?integrationId=xxx&limit=50&offset=0
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "log-uuid",
      "syncType": "MANUAL",
      "entityType": "TRANSACTION",
      "operation": "SYNC",
      "status": "COMPLETED",
      "recordsProcessed": 50,
      "recordsFailed": 0,
      "startedAt": "2025-01-01T00:00:00.000Z",
      "completedAt": "2025-01-01T00:00:05.000Z",
      "duration": 5000
    }
  ],
  "meta": {
    "total": 100,
    "limit": 50,
    "offset": 0
  }
}
```

## Authentication Flow

### OAuth 2.0 Authorization Code Flow

```
1. User clicks "Connect to SoftPro" in frontend
   ↓
2. Frontend calls POST /api/v1/integrations/softpro/connect
   ↓
3. Backend generates authorization URL with state parameter
   ↓
4. Frontend redirects user to SoftPro authorization page
   ↓
5. User authorizes application in SoftPro
   ↓
6. SoftPro redirects to callback URL with code and state
   ↓
7. Backend validates state and exchanges code for tokens
   ↓
8. Backend stores encrypted tokens in database
   ↓
9. Backend redirects to frontend with success status
```

### Token Management

- **Access Token**: Valid for 1 hour, automatically refreshed
- **Refresh Token**: Valid for 30 days, used to obtain new access tokens
- **Storage**: All tokens encrypted using AES-256
- **Expiry Buffer**: Tokens refreshed 5 minutes before expiry

## Data Synchronization

### Sync Strategies

#### Full Sync
- Fetches all records from source
- Batch processing for efficiency
- Suitable for initial setup

#### Incremental Sync
- Only syncs changed records since last sync
- Uses `lastSyncAt` timestamp
- More efficient for ongoing synchronization

#### Delta Sync
- Compares checksums/timestamps
- Only syncs actual changes
- Minimizes API calls and data transfer

### Sync Directions

- **SOFTPRO_TO_ROI**: Data flows from SoftPro to ROI Systems
- **ROI_TO_SOFTPRO**: Data flows from ROI Systems to SoftPro
- **BIDIRECTIONAL**: Two-way synchronization

### Field Mappings

Configure custom field mappings for each entity type:

```typescript
{
  entityType: "TRANSACTION",
  softproField: "orderNumber",
  roiSystemsField: "transaction_number",
  direction: "BIDIRECTIONAL",
  transformationRule: null, // Optional JSONata transformation
  required: true,
  defaultValue: null,
  enabled: true
}
```

### Conflict Resolution

Strategies for handling data conflicts:

- **SOFTPRO_WINS**: SoftPro data takes precedence
- **ROI_WINS**: ROI Systems data takes precedence
- **NEWEST_WINS**: Most recently updated data wins
- **MERGE**: Combine both datasets
- **MANUAL_REVIEW**: Flag for manual resolution

## Error Handling

### Error Types

```typescript
class SoftProAPIError extends Error {
  statusCode: number;
  errorCode: string;
  details?: any;
}

class AuthenticationError extends SoftProAPIError // 401
class RateLimitError extends SoftProAPIError      // 429
class ValidationError extends SoftProAPIError     // 400
class ConflictError extends SoftProAPIError       // 409
class NetworkError extends SoftProAPIError        // 503
```

### Retry Strategy

**Exponential Backoff:**
- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 seconds delay
- Attempt 4: 4 seconds delay
- Maximum delay: 30 seconds

**Retryable Errors:**
- Network errors (ECONNREFUSED, ETIMEDOUT)
- Rate limit errors (429)
- Server errors (5xx)
- Timeout errors

**Non-Retryable Errors:**
- Authentication errors (401)
- Validation errors (400)
- Not found errors (404)

## Configuration

### Environment Variables

```bash
# SoftPro 360 Integration
SOFTPRO_SANDBOX_BASE_URL=https://api-sandbox.softprocorp.com/api/v1
SOFTPRO_PRODUCTION_BASE_URL=https://api.softprocorp.com/api/v1
SOFTPRO_OAUTH_AUTHORIZE_URL=https://auth.softprocorp.com/oauth/authorize
SOFTPRO_OAUTH_TOKEN_URL=https://auth.softprocorp.com/oauth/token
SOFTPRO_OAUTH_REVOKE_URL=https://auth.softprocorp.com/oauth/revoke
SOFTPRO_OAUTH_REDIRECT_URI=http://localhost:3000/api/v1/integrations/softpro/callback
SOFTPRO_WEBHOOK_SECRET=your_webhook_secret_here

# Integration Encryption
INTEGRATION_ENCRYPTION_KEY=your_32_character_encryption_key_here

# Sync Settings
SOFTPRO_SYNC_BATCH_SIZE=50
SOFTPRO_SYNC_INTERVAL=300
SOFTPRO_MAX_RETRIES=3
SOFTPRO_RATE_LIMIT_PER_MIN=100
```

### Database Setup

1. Apply Prisma schema:
```bash
npx prisma db push --schema=prisma/schema.softpro-integration.prisma
```

2. Generate Prisma client:
```bash
npx prisma generate
```

3. Create initial migration:
```bash
npx prisma migrate dev --name init_softpro_integration
```

## Testing

### Unit Tests

Test individual services and utilities:

```bash
npm test -- softpro-oauth.service.test.ts
npm test -- softpro-api.service.test.ts
npm test -- softpro-sync.service.test.ts
npm test -- retry-manager.test.ts
```

### Integration Tests

Test API endpoints:

```bash
npm test -- softpro-integration.controller.test.ts
```

### End-to-End Tests

Test complete flows:

```bash
npm run test:e2e
```

## Deployment

### Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Encryption keys generated and secured
- [ ] OAuth credentials obtained from SoftPro
- [ ] Webhook endpoints configured
- [ ] Rate limits configured
- [ ] Logging configured
- [ ] Error monitoring enabled

### Production Considerations

1. **Security**
   - Use production OAuth credentials
   - Rotate encryption keys regularly
   - Enable HTTPS only
   - Implement rate limiting
   - Monitor for suspicious activity

2. **Performance**
   - Configure appropriate batch sizes
   - Use connection pooling
   - Enable caching where appropriate
   - Monitor API rate limits

3. **Reliability**
   - Set up health checks
   - Configure automatic retries
   - Implement circuit breakers
   - Set up alerting for failures

4. **Monitoring**
   - Log all API calls
   - Track sync success rates
   - Monitor error rates
   - Set up dashboards

## Support

For issues or questions:
- Email: support@roisystems.com
- Documentation: https://docs.roisystems.com
- SoftPro API Documentation: https://docs.softprocorp.com

## License

Copyright © 2025 ROI Systems. All rights reserved.
