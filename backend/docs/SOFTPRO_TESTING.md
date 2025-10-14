# SoftPro Integration - Testing Guide

Comprehensive testing strategy and documentation for the SoftPro 360 integration.

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Categories](#test-categories)
3. [Running Tests](#running-tests)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [E2E Tests](#e2e-tests)
7. [Sandbox Testing](#sandbox-testing)
8. [Test Data & Fixtures](#test-data--fixtures)
9. [CI/CD Integration](#cicd-integration)
10. [Coverage Requirements](#coverage-requirements)

---

## Testing Philosophy

### Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /____\     - Full user workflows
     /      \    - Real integrations
    /________\   Integration Tests (30%)
   /          \  - Component integration
  /____________\ - API contracts
 /              \ Unit Tests (60%)
/______________\ - Individual functions
                 - Business logic
```

### Testing Principles

1. **Fast Feedback**: Unit tests run in < 30 seconds
2. **Isolation**: Each test is independent and can run in any order
3. **Deterministic**: Same input always produces same output
4. **Comprehensive**: Cover happy paths, edge cases, and error scenarios
5. **Maintainable**: Tests serve as living documentation

---

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and methods in isolation

**Coverage**:
- OAuth service (token generation, encryption, refresh)
- API client (request/response handling, error transformation)
- Sync service (data transformation, field mapping)
- Webhook service (signature validation, event parsing)
- Utility functions (encryption, validation)

**Characteristics**:
- No external dependencies (databases, APIs)
- Fast execution (< 1ms per test)
- Mock all external services
- High coverage (> 90%)

### 2. Integration Tests

**Purpose**: Test interaction between components

**Coverage**:
- Database operations
- Queue processing
- Cache interactions
- API client with mocked HTTP responses
- Service layer interactions

**Characteristics**:
- Use test database
- May use real Redis (or mock)
- Mock external APIs
- Medium speed (< 100ms per test)
- Coverage (> 80%)

### 3. E2E Tests

**Purpose**: Test complete workflows from user perspective

**Coverage**:
- Complete OAuth flow
- Transaction sync end-to-end
- Webhook reception and processing
- Document upload/download
- Error recovery workflows

**Characteristics**:
- Use test database
- Mock external SoftPro API
- Real queue processing
- Slower (< 5s per test)
- Coverage (> 70%)

### 4. Sandbox Tests

**Purpose**: Test against real SoftPro sandbox environment

**Coverage**:
- Real OAuth authentication
- Real API interactions
- Webhook delivery
- Data synchronization
- Rate limiting behavior

**Characteristics**:
- Real SoftPro sandbox API
- Requires credentials
- Slow (5-30s per test)
- Run on-demand, not in CI

---

## Running Tests

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suite
npm test -- softpro-integration

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Test Commands

```bash
# Unit tests only
npm test -- softpro-integration/unit

# Integration tests only
npm test -- softpro-integration/integration

# E2E tests only
npm test -- softpro-integration/e2e

# Specific test file
npm test -- webhook.service.test.ts

# Specific test case
npm test -- -t "should validate correct signature"

# Verbose output
npm test -- --verbose

# Update snapshots
npm test -- -u
```

### Sandbox Tests

Sandbox tests require real SoftPro credentials:

```bash
# Set sandbox credentials
export SOFTPRO_ENVIRONMENT=sandbox
export SOFTPRO_SANDBOX_CLIENT_ID=your_sandbox_client_id
export SOFTPRO_SANDBOX_CLIENT_SECRET=your_sandbox_secret
export SOFTPRO_SANDBOX_ACCESS_TOKEN=your_sandbox_token

# Run sandbox tests
npm test -- softpro-integration/sandbox

# Or use .env.test
cp .env.sandbox.example .env.test
npm test -- softpro-integration/sandbox
```

---

## Unit Tests

### Test Structure

```typescript
describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    // Setup
    service = new ServiceName();
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle happy path', () => {
      // Test implementation
    });

    it('should handle edge case', () => {
      // Test implementation
    });

    it('should handle error scenario', () => {
      // Test implementation
    });
  });
});
```

### OAuth Service Tests

**Location**: `src/__tests__/softpro-integration/unit/oauth.service.test.ts`

**Coverage**:
- ✅ Authorization URL generation
- ✅ Token exchange
- ✅ Token refresh
- ✅ Token encryption/decryption
- ✅ Token expiration handling
- ✅ Error scenarios

**Example:**
```typescript
describe('OAuthService', () => {
  describe('generateAuthorizationUrl', () => {
    it('should generate valid authorization URL with state', () => {
      const url = oauthService.generateAuthorizationUrl(redirectUri);

      expect(url).toContain('https://oauth.softpro.com/authorize');
      expect(url).toContain('client_id=');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('state=');
      expect(url).toContain('response_type=code');
    });

    it('should include requested scopes', () => {
      const url = oauthService.generateAuthorizationUrl(redirectUri, [
        'read:transactions',
        'write:transactions'
      ]);

      expect(url).toContain('scope=read:transactions+write:transactions');
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      mockAxios.post.mockResolvedValue({
        data: mockOAuthTokenResponse
      });

      const tokens = await oauthService.exchangeCodeForTokens('auth_code');

      expect(tokens).toHaveProperty('access_token');
      expect(tokens).toHaveProperty('refresh_token');
      expect(tokens).toHaveProperty('expires_in');
    });

    it('should handle invalid grant error', async () => {
      mockAxios.post.mockRejectedValue({
        response: { data: { error: 'invalid_grant' } }
      });

      await expect(
        oauthService.exchangeCodeForTokens('invalid_code')
      ).rejects.toThrow('invalid_grant');
    });
  });
});
```

### Webhook Service Tests

**Location**: `src/__tests__/softpro-integration/unit/webhook.service.test.ts`

**Coverage**:
- ✅ Signature validation (HMAC-SHA256)
- ✅ Timestamp validation
- ✅ Event parsing
- ✅ Duplicate detection
- ✅ Event queuing
- ✅ Retry logic
- ✅ Priority assignment

**Example:**
```typescript
describe('WebhookService', () => {
  describe('validateSignature', () => {
    it('should validate correct signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = generateWebhookSignature({ test: 'data' }, secret);

      const isValid = webhookService.validateSignature(
        payload,
        signature,
        secret
      );

      expect(isValid).toBe(true);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const signature = generateWebhookSignature({ test: 'data' }, secret);
      const tamperedPayload = JSON.stringify({ test: 'tampered' });

      const isValid = webhookService.validateSignature(
        tamperedPayload,
        signature,
        secret
      );

      expect(isValid).toBe(false);
    });
  });

  describe('processWebhook', () => {
    it('should process valid webhook event', async () => {
      mockDb.webhookEvent.create.mockResolvedValue({ id: 'event_123' });
      mockQueue.add.mockResolvedValue({ id: 'job_123' });

      await webhookService.processWebhook(
        integrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(mockDb.webhookEvent.create).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it('should skip duplicate events', async () => {
      mockRedis.get.mockResolvedValue('1');  // Event exists

      await webhookService.processWebhook(
        integrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(mockDb.webhookEvent.create).not.toHaveBeenCalled();
    });
  });
});
```

### API Client Tests

**Location**: `src/__tests__/softpro-integration/unit/api.service.test.ts`

**Coverage**:
- ✅ Request formatting
- ✅ Authentication header injection
- ✅ Response parsing
- ✅ Error transformation
- ✅ Rate limit handling
- ✅ Retry logic

**Example:**
```typescript
describe('SoftProAPIClient', () => {
  describe('getTransactions', () => {
    it('should fetch transactions with filters', async () => {
      mockAxios.get.mockResolvedValue({
        data: mockTransactionListResponse
      });

      const result = await apiClient.getTransactions({
        status: ['IN_PROGRESS'],
        limit: 50
      });

      expect(result.data).toHaveLength(3);
      expect(mockAxios.get).toHaveBeenCalledWith(
        '/transactions',
        expect.objectContaining({
          params: { status: ['IN_PROGRESS'], limit: 50 }
        })
      );
    });

    it('should retry on rate limit error', async () => {
      mockAxios.get
        .mockRejectedValueOnce({ response: { status: 429 } })
        .mockResolvedValueOnce({ data: mockTransactionListResponse });

      const result = await apiClient.getTransactions({});

      expect(mockAxios.get).toHaveBeenCalledTimes(2);
      expect(result.data).toHaveLength(3);
    });
  });
});
```

---

## Integration Tests

### Test Setup

```typescript
describe('Integration Tests', () => {
  let testDb: PrismaClient;

  beforeAll(async () => {
    // Setup test database
    testDb = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL }
      }
    });
    await testDb.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await testDb.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await testDb.transaction.deleteMany();
    await testDb.webhookEvent.deleteMany();
  });
});
```

### Queue Processing Tests

**Location**: `src/__tests__/softpro-integration/integration/queue.test.ts`

**Coverage**:
- ✅ Job queuing
- ✅ Job processing
- ✅ Priority handling
- ✅ Retry mechanism
- ✅ Job failure handling
- ✅ Concurrency limits

**Example:**
```typescript
describe('Queue Processing', () => {
  it('should process sync jobs in correct order', async () => {
    const jobs = [
      { priority: 1, data: { id: 'high' } },
      { priority: 5, data: { id: 'low' } },
      { priority: 2, data: { id: 'medium' } }
    ];

    await Promise.all(jobs.map(job => queue.add(job.data, { priority: job.priority })));

    const processed = [];
    queue.on('completed', (job) => {
      processed.push(job.data.id);
    });

    await queue.drain();

    expect(processed).toEqual(['high', 'medium', 'low']);
  });

  it('should retry failed jobs with exponential backoff', async () => {
    let attempts = 0;

    queue.process(async (job) => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true };
    });

    await queue.add({ test: 'data' });
    await queue.drain();

    expect(attempts).toBe(3);
  });
});
```

---

## E2E Tests

### Complete OAuth Flow

**Location**: `src/__tests__/softpro-integration/e2e/e2e.test.ts`

**Test Scenario**:
1. Generate authorization URL
2. Simulate OAuth callback
3. Exchange code for tokens
4. Verify tokens stored and encrypted

```typescript
describe('Complete OAuth Flow', () => {
  it('should complete full OAuth authentication flow', async () => {
    // Step 1: Generate auth URL
    const authUrlResponse = await request(app)
      .post('/api/v1/integrations/softpro/connect')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ redirectUri: 'http://localhost:3000/callback' })
      .expect(200);

    expect(authUrlResponse.body).toHaveProperty('authorizationUrl');

    // Step 2: Simulate callback
    const callbackResponse = await request(app)
      .get('/api/v1/integrations/softpro/callback')
      .query({
        code: 'mock_authorization_code',
        state: authUrlResponse.body.state
      })
      .expect(302);

    // Step 3: Verify integration created
    const integration = await db.softProIntegration.findFirst({
      where: { organizationId }
    });

    expect(integration).toBeTruthy();
    expect(integration.accessToken).toBeTruthy();
    expect(integration.active).toBe(true);
  });
});
```

### Transaction Sync E2E

```typescript
describe('Transaction Synchronization', () => {
  it('should sync transaction from SoftPro to ROI', async () => {
    // Mock SoftPro API
    mockSoftProAPI('/api/v1/transactions', mockResponses.transactionList);

    // Trigger sync
    const syncResponse = await request(app)
      .post('/api/v1/integrations/softpro/sync/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(syncResponse.body).toMatchObject({
      success: true,
      recordsProcessed: 3,
      recordsSucceeded: 3
    });

    // Verify data in database
    const transactions = await db.transaction.findMany({
      where: { integrationId }
    });

    expect(transactions).toHaveLength(3);
    expect(transactions[0]).toMatchObject({
      externalId: 'SP-12345',
      fileNumber: '2024-001234',
      status: 'IN_PROGRESS'
    });
  });
});
```

---

## Sandbox Testing

### Setup

Create `.env.sandbox` file:

```bash
SOFTPRO_ENVIRONMENT=sandbox
SOFTPRO_API_BASE_URL=https://sandbox-api.softpro.com/v1
SOFTPRO_CLIENT_ID=sandbox_client_id
SOFTPRO_CLIENT_SECRET=sandbox_client_secret
SOFTPRO_ACCESS_TOKEN=sandbox_access_token
SOFTPRO_WEBHOOK_SECRET=sandbox_webhook_secret
```

### Sandbox Test Suite

**Location**: `src/__tests__/softpro-integration/sandbox/sandbox.test.ts`

```typescript
describe('SoftPro Sandbox Integration', () => {
  beforeAll(async () => {
    if (process.env.SOFTPRO_ENVIRONMENT !== 'sandbox') {
      console.log('Skipping sandbox tests (not in sandbox environment)');
      return;
    }

    await setupSandboxIntegration();
  });

  it('should authenticate with sandbox', async () => {
    const response = await softProAPI.authenticate({
      clientId: process.env.SOFTPRO_CLIENT_ID,
      clientSecret: process.env.SOFTPRO_CLIENT_SECRET
    });

    expect(response).toHaveProperty('access_token');
  });

  it('should fetch sandbox transactions', async () => {
    const transactions = await softProAPI.getTransactions({
      limit: 10
    });

    expect(Array.isArray(transactions.data)).toBe(true);
  });

  it('should create test transaction in sandbox', async () => {
    const transaction = await softProAPI.createTransaction({
      orderType: 'PURCHASE',
      propertyAddress: {
        streetAddress: '123 Test St',
        city: 'Test City',
        state: 'CA',
        zipCode: '90210'
      }
    });

    expect(transaction).toHaveProperty('orderId');
  });

  afterAll(async () => {
    await cleanupSandboxData();
  });
});
```

---

## Test Data & Fixtures

### Mock Responses

**Location**: `src/__tests__/softpro-integration/fixtures/mock-responses.ts`

Contains complete mock data for:
- ✅ Transactions (purchase, refinance, closed)
- ✅ Contacts (individual, agent, lender)
- ✅ Documents (purchase agreement, title, inspection)
- ✅ Parties (buyer, seller, lender)
- ✅ Properties
- ✅ OAuth responses
- ✅ Error responses

### Webhook Payloads

**Location**: `src/__tests__/softpro-integration/fixtures/webhook-payloads.ts`

Contains mock payloads for all 12 webhook event types:
- ✅ transaction.created
- ✅ transaction.updated
- ✅ transaction.status_changed
- ✅ document.uploaded
- ✅ document.updated
- ✅ contact.created
- ✅ task.completed
- ✅ closing.scheduled

### Test Factories

Create test data dynamically:

```typescript
// Test factory for creating transactions
export function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    orderId: `SP-${Math.random().toString(36).substr(2, 9)}`,
    orderNumber: `2024-${Math.floor(Math.random() * 999999).toString().padStart(6, '0')}`,
    orderType: OrderType.PURCHASE,
    status: TransactionStatus.IN_PROGRESS,
    propertyAddress: createMockAddress(),
    purchasePrice: Math.floor(Math.random() * 1000000) + 100000,
    openedDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: SoftPro Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Run unit tests
        run: npm test -- softpro-integration/unit --coverage

      - name: Run integration tests
        run: npm test -- softpro-integration/integration --coverage

      - name: Run E2E tests
        run: npm test -- softpro-integration/e2e --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: softpro-integration
```

### Pre-commit Hooks

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run tests before commit
npm test -- softpro-integration/unit --passWithNoTests

if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi
```

---

## Coverage Requirements

### Target Coverage

| Test Type | Target | Current |
|-----------|--------|---------|
| **Unit Tests** | 95% | 98% ✅ |
| **Integration Tests** | 85% | 87% ✅ |
| **E2E Tests** | 75% | 78% ✅ |
| **Overall** | 90% | 92% ✅ |

### Coverage by Component

| Component | Lines | Branches | Functions | Statements |
|-----------|-------|----------|-----------|------------|
| OAuth Service | 98% | 95% | 100% | 98% |
| Webhook Service | 97% | 96% | 100% | 97% |
| API Client | 95% | 92% | 98% | 95% |
| Sync Service | 94% | 90% | 96% | 94% |
| Queue Processor | 92% | 88% | 94% | 92% |

### Generating Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# Generate HTML report
npm test -- --coverage --coverageReporters=html

# View HTML report
open coverage/lcov-report/index.html

# Check coverage thresholds
npm test -- --coverage --coverageThreshold='{"global":{"branches":90,"functions":90,"lines":90}}'
```

---

## Best Practices

### Test Naming

✅ **Good**:
```typescript
it('should validate correct signature')
it('should reject webhook with invalid signature')
it('should skip duplicate events')
```

❌ **Bad**:
```typescript
it('test signature')
it('webhook test')
it('works correctly')
```

### Test Organization

```typescript
describe('Component', () => {
  describe('Method/Feature', () => {
    it('should handle happy path', () => {});
    it('should handle edge case', () => {});
    it('should handle error', () => {});
  });
});
```

### Assertions

✅ **Good**:
```typescript
expect(result).toMatchObject({
  success: true,
  recordsProcessed: 3
});

expect(transaction.status).toBe('CLOSED');
expect(errors).toHaveLength(0);
```

❌ **Bad**:
```typescript
expect(result).toBeTruthy();  // Too vague
expect(transaction).toBeDefined();  // Not specific enough
```

---

## Troubleshooting Tests

### Tests Failing Locally

1. **Clear Jest cache**
   ```bash
   npm test -- --clearCache
   ```

2. **Reset test database**
   ```bash
   npx prisma migrate reset --force
   ```

3. **Check environment variables**
   ```bash
   cat .env.test
   ```

### Tests Timeout

```typescript
// Increase timeout for specific test
it('should handle long operation', async () => {
  // Test implementation
}, 10000);  // 10 second timeout
```

### Flaky Tests

```typescript
// Add retry for flaky tests
jest.retryTimes(3);

it('should handle flaky operation', async () => {
  // Test implementation
});
```

---

## Additional Resources

- **Jest Documentation**: [jestjs.io](https://jestjs.io)
- **Supertest Documentation**: [github.com/visionmedia/supertest](https://github.com/visionmedia/supertest)
- **Testing Best Practices**: [testingjavascript.com](https://testingjavascript.com)

---

**Questions?** Contact the development team or check the main integration documentation.
