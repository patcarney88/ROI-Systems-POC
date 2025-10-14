# Email Service Testing Guide

Comprehensive testing guide for the multi-provider email webhook system.

---

## Test Categories

### 1. Unit Tests
Test individual components in isolation.

### 2. Integration Tests
Test component interactions and database operations.

### 3. End-to-End Tests
Test complete email workflows from send to webhook processing.

### 4. Load Tests
Test system performance under high load.

### 5. Provider Tests
Test provider-specific webhook handling.

---

## Running Tests

### All Tests
```bash
npm test -- email
```

### Specific Test Suites
```bash
# Unit tests
npm test -- email/webhooks.test.ts

# Integration tests
npm test -- email/integration.test.ts

# E2E tests
npm test -- email/e2e.test.ts

# Load tests
npm test -- email/load.test.ts
```

### Watch Mode
```bash
npm test -- --watch email
```

### Coverage Report
```bash
npm test -- --coverage email
```

---

## Test Setup

### 1. Test Environment

Create `.env.test`:
```bash
# Test Database
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db

# Test Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Test Provider Keys (use test mode keys)
SENDGRID_API_KEY=SG.test_key
SENDGRID_WEBHOOK_SECRET=test_secret

MAILGUN_API_KEY=test_key
MAILGUN_WEBHOOK_SECRET=test_secret

# Mock Services
MOCK_EMAIL_SERVER=true
MOCK_WEBHOOKS=true
```

### 2. Test Database

```bash
# Create test database
createdb test_db

# Run migrations
DATABASE_URL=postgresql://user:pass@localhost:5432/test_db \
  npx prisma migrate deploy

# Seed test data
npm run test:seed
```

### 3. Redis Setup

```bash
# Start Redis for testing
redis-server --port 6380

# Or use Docker
docker run -d -p 6380:6379 redis:7-alpine
```

---

## Example Tests

### Unit Test - Webhook Handler

```typescript
// webhooks.test.ts
import { emailWebhookHandler, EmailProviderType } from '@/services/email/webhook-handler.service';
import { SendGridWebhookHandler } from '@/services/email/webhooks/sendgrid-webhook';

describe('Email Webhook Handler', () => {
  describe('SendGrid', () => {
    let handler: SendGridWebhookHandler;

    beforeEach(() => {
      handler = new SendGridWebhookHandler();
    });

    it('should validate valid signature', async () => {
      const payload = [mockSendGridEvent()];
      const signature = generateValidSignature(payload);
      const headers = {
        'x-twilio-email-event-webhook-signature': signature,
        'x-twilio-email-event-webhook-timestamp': Date.now().toString()
      };

      const result = await handler.validateSignature(payload, signature, headers);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid signature', async () => {
      const payload = [mockSendGridEvent()];
      const invalidSignature = 'invalid_signature';
      const headers = {
        'x-twilio-email-event-webhook-signature': invalidSignature,
        'x-twilio-email-event-webhook-timestamp': Date.now().toString()
      };

      const result = await handler.validateSignature(payload, invalidSignature, headers);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Invalid signature');
    });

    it('should reject old timestamps', async () => {
      const payload = [mockSendGridEvent()];
      const signature = generateValidSignature(payload);
      const oldTimestamp = (Date.now() / 1000 - 700).toString(); // 11+ minutes old
      const headers = {
        'x-twilio-email-event-webhook-signature': signature,
        'x-twilio-email-event-webhook-timestamp': oldTimestamp
      };

      const result = await handler.validateSignature(payload, signature, headers);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Timestamp');
    });

    it('should normalize events correctly', () => {
      const sendGridEvents = [
        {
          email: 'test@example.com',
          timestamp: Math.floor(Date.now() / 1000),
          event: 'delivered',
          sg_event_id: 'event_123',
          sg_message_id: 'msg_456',
          campaignId: 'campaign_789',
          subscriberId: 'subscriber_101'
        }
      ];

      const normalized = handler.parseEvents(sendGridEvents);

      expect(normalized).toHaveLength(1);
      expect(normalized[0].provider).toBe(EmailProviderType.SENDGRID);
      expect(normalized[0].eventType).toBe('DELIVERED');
      expect(normalized[0].recipientEmail).toBe('test@example.com');
      expect(normalized[0].campaignId).toBe('campaign_789');
    });

    it('should map all SendGrid event types', () => {
      const events = [
        'processed', 'delivered', 'open', 'click',
        'bounce', 'deferred', 'dropped',
        'unsubscribe', 'group_unsubscribe', 'spamreport'
      ];

      events.forEach(eventType => {
        const normalized = handler.parseEvents([{
          ...mockSendGridEvent(),
          event: eventType
        }]);

        expect(normalized[0].eventType).toBeDefined();
        expect(normalized[0].eventType).not.toBe('FAILED'); // Should map to specific type
      });
    });
  });

  describe('Deduplication', () => {
    it('should prevent duplicate event processing', async () => {
      const event = mockNormalizedEvent();

      // Process first time
      const result1 = await emailWebhookHandler.processWebhook(
        EmailProviderType.SENDGRID,
        [event],
        'valid_signature',
        {}
      );
      expect(result1.processed).toBe(1);

      // Process same event again
      const result2 = await emailWebhookHandler.processWebhook(
        EmailProviderType.SENDGRID,
        [event],
        'valid_signature',
        {}
      );
      expect(result2.processed).toBe(0); // Skipped duplicate
    });

    it('should allow same event after TTL expires', async () => {
      // This would require mocking Redis TTL or waiting
      // Kept as placeholder for implementation
    });
  });
});
```

### Integration Test - Event Processor

```typescript
// integration.test.ts
import { emailEventQueue } from '@/queues/email-event.queue';
import { db } from '@/config/database';
import { NormalizedEvent, EmailEventType } from '@/services/email/webhook-handler.service';

describe('Event Processor Integration', () => {
  let testCampaign: any;
  let testSubscriber: any;
  let testEmail: any;

  beforeEach(async () => {
    // Create test data
    testCampaign = await db.emailCampaign.create({
      data: {
        name: 'Test Campaign',
        subject: 'Test',
        htmlContent: '<p>Test</p>',
        status: 'SENDING',
        organizationId: 'org_test',
        fromEmail: 'test@example.com',
        fromName: 'Test'
      }
    });

    testSubscriber = await db.emailSubscriber.create({
      data: {
        email: 'subscriber@example.com',
        firstName: 'Test',
        lastName: 'Subscriber',
        status: 'ACTIVE',
        organizationId: 'org_test'
      }
    });

    testEmail = await db.emailQueue.create({
      data: {
        campaignId: testCampaign.id,
        subscriberId: testSubscriber.id,
        to: testSubscriber.email,
        subject: testCampaign.subject,
        htmlContent: testCampaign.htmlContent,
        status: 'SENT',
        messageId: 'test_message_123'
      }
    });
  });

  afterEach(async () => {
    // Cleanup
    await db.emailEvent.deleteMany({});
    await db.emailQueue.deleteMany({});
    await db.emailSubscriber.deleteMany({});
    await db.emailCampaign.deleteMany({});
  });

  it('should process delivered event and update database', async () => {
    const event: NormalizedEvent = {
      provider: 'sendgrid',
      providerMessageId: testEmail.messageId,
      eventType: EmailEventType.DELIVERED,
      timestamp: new Date(),
      recipientEmail: testSubscriber.email,
      emailId: testEmail.id,
      campaignId: testCampaign.id,
      subscriberId: testSubscriber.id,
      metadata: {},
      rawData: {}
    };

    // Queue event
    await emailEventQueue.add('process-email-event', event);

    // Wait for processing
    await waitForJobCompletion(emailEventQueue, 5000);

    // Verify email status updated
    const updatedEmail = await db.emailQueue.findUnique({
      where: { id: testEmail.id }
    });
    expect(updatedEmail?.status).toBe('SENT');

    // Verify event record created
    const eventRecord = await db.emailEvent.findFirst({
      where: { messageId: testEmail.messageId }
    });
    expect(eventRecord).toBeDefined();
    expect(eventRecord?.eventType).toBe('DELIVERED');

    // Verify campaign stats updated
    const updatedCampaign = await db.emailCampaign.findUnique({
      where: { id: testCampaign.id }
    });
    expect(updatedCampaign?.deliveredCount).toBe(1);
  });

  it('should handle bounce and add to suppression list', async () => {
    const event: NormalizedEvent = {
      provider: 'sendgrid',
      providerMessageId: testEmail.messageId,
      eventType: EmailEventType.BOUNCED,
      timestamp: new Date(),
      recipientEmail: testSubscriber.email,
      emailId: testEmail.id,
      campaignId: testCampaign.id,
      subscriberId: testSubscriber.id,
      metadata: {
        bounceType: 'HARD',
        bounceReason: 'Invalid email address'
      },
      rawData: {}
    };

    await emailEventQueue.add('process-email-event', event);
    await waitForJobCompletion(emailEventQueue, 5000);

    // Verify subscriber marked as bounced
    const updatedSubscriber = await db.emailSubscriber.findUnique({
      where: { id: testSubscriber.id }
    });
    expect(updatedSubscriber?.status).toBe('BOUNCED');
    expect(updatedSubscriber?.bounceCount).toBe(1);

    // Verify added to suppression list
    const suppression = await db.suppressionList.findFirst({
      where: { email: testSubscriber.email }
    });
    expect(suppression).toBeDefined();
    expect(suppression?.reason).toBe('HARD_BOUNCE');
  });

  it('should update engagement score on open', async () => {
    const event: NormalizedEvent = {
      provider: 'sendgrid',
      providerMessageId: testEmail.messageId,
      eventType: EmailEventType.OPENED,
      timestamp: new Date(),
      recipientEmail: testSubscriber.email,
      emailId: testEmail.id,
      campaignId: testCampaign.id,
      subscriberId: testSubscriber.id,
      metadata: {},
      rawData: {}
    };

    await emailEventQueue.add('process-email-event', event);
    await waitForJobCompletion(emailEventQueue, 5000);

    // Verify engagement record created/updated
    const engagement = await db.emailEngagement.findUnique({
      where: { subscriberId: testSubscriber.id }
    });

    expect(engagement).toBeDefined();
    expect(engagement?.emailsOpened).toBe(1);
    expect(engagement?.engagementScore).toBeGreaterThan(50); // Base + open bonus
  });
});
```

### E2E Test - Complete Flow

```typescript
// e2e.test.ts
import request from 'supertest';
import app from '@/app';
import { emailService } from '@/services/email.service';
import { db } from '@/config/database';

describe('Email E2E Flow', () => {
  it('should complete full email lifecycle', async () => {
    // 1. Send email
    const sendResult = await emailService.sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>Test content</p>',
      customArgs: {
        campaignId: 'test_campaign',
        subscriberId: 'test_subscriber'
      }
    });

    expect(sendResult.messageId).toBeDefined();

    // 2. Simulate delivered webhook
    await request(app)
      .post('/api/webhooks/email/sendgrid')
      .send([{
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        event: 'delivered',
        sg_message_id: sendResult.messageId,
        sg_event_id: 'delivered_event_123',
        campaignId: 'test_campaign',
        subscriberId: 'test_subscriber'
      }])
      .expect(200);

    // 3. Wait for async processing
    await delay(2000);

    // 4. Verify delivered status
    const email = await db.emailQueue.findFirst({
      where: { messageId: sendResult.messageId }
    });
    expect(email?.status).toBe('SENT');

    // 5. Simulate open webhook
    await request(app)
      .post('/api/webhooks/email/sendgrid')
      .send([{
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        event: 'open',
        sg_message_id: sendResult.messageId,
        sg_event_id: 'open_event_456',
        campaignId: 'test_campaign',
        subscriberId: 'test_subscriber',
        ip: '192.168.1.1',
        useragent: 'Mozilla/5.0...'
      }])
      .expect(200);

    // 6. Wait for processing
    await delay(2000);

    // 7. Verify analytics updated
    const campaign = await db.emailCampaign.findFirst({
      where: { id: 'test_campaign' }
    });
    expect(campaign?.openCount).toBeGreaterThan(0);

    // 8. Simulate click webhook
    await request(app)
      .post('/api/webhooks/email/sendgrid')
      .send([{
        email: 'test@example.com',
        timestamp: Math.floor(Date.now() / 1000),
        event: 'click',
        sg_message_id: sendResult.messageId,
        sg_event_id: 'click_event_789',
        campaignId: 'test_campaign',
        subscriberId: 'test_subscriber',
        url: 'https://example.com/link'
      }])
      .expect(200);

    // 9. Wait and verify
    await delay(2000);

    const updatedCampaign = await db.emailCampaign.findFirst({
      where: { id: 'test_campaign' }
    });
    expect(updatedCampaign?.clickCount).toBeGreaterThan(0);
  });
});
```

### Load Test - High Volume

```typescript
// load.test.ts
import { emailEventQueue } from '@/queues/email-event.queue';
import { mockNormalizedEvent } from '../helpers/mock-data';

describe('Email Service Load Tests', () => {
  it('should handle 1000 webhook events in < 5 seconds', async () => {
    const events = Array(1000).fill(null).map((_, i) =>
      mockNormalizedEvent({
        providerEventId: `event_${i}`,
        recipientEmail: `test${i}@example.com`
      })
    );

    const startTime = Date.now();

    await Promise.all(
      events.map(event =>
        emailEventQueue.add('process-email-event', event)
      )
    );

    const queueTime = Date.now() - startTime;
    expect(queueTime).toBeLessThan(5000);

    // Wait for processing
    await waitForQueueEmpty(emailEventQueue, 60000);

    const processingTime = Date.now() - startTime;
    expect(processingTime).toBeLessThan(30000); // 30 seconds max
  });

  it('should maintain < 1% error rate under load', async () => {
    const eventCount = 5000;
    const events = Array(eventCount).fill(null).map((_, i) =>
      mockNormalizedEvent({ providerEventId: `load_event_${i}` })
    );

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, i + batchSize);
      await Promise.all(
        batch.map(event =>
          emailEventQueue.add('process-email-event', event)
        )
      );
    }

    // Wait for all jobs to complete
    await waitForQueueEmpty(emailEventQueue, 120000);

    // Check error rate
    const stats = await emailEventQueue.getJobCounts();
    const errorRate = (stats.failed / eventCount) * 100;

    expect(errorRate).toBeLessThan(1);
  });
});
```

---

## Test Helpers

### Mock Data

```typescript
// helpers/mock-data.ts
export function mockSendGridEvent(overrides = {}) {
  return {
    email: 'test@example.com',
    timestamp: Math.floor(Date.now() / 1000),
    event: 'delivered',
    sg_event_id: 'event_123',
    sg_message_id: 'msg_456',
    ...overrides
  };
}

export function mockNormalizedEvent(overrides = {}) {
  return {
    provider: 'sendgrid',
    providerMessageId: 'msg_123',
    providerEventId: 'event_456',
    eventType: 'DELIVERED',
    timestamp: new Date(),
    recipientEmail: 'test@example.com',
    metadata: {},
    rawData: {},
    ...overrides
  };
}
```

### Test Utilities

```typescript
// helpers/test-utils.ts
export async function waitForJobCompletion(
  queue: Queue,
  timeout: number
): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const stats = await queue.getJobCounts();
    if (stats.active === 0 && stats.waiting === 0) {
      return;
    }
    await delay(100);
  }

  throw new Error('Job completion timeout');
}

export async function waitForQueueEmpty(
  queue: Queue,
  timeout: number
): Promise<void> {
  return waitForJobCompletion(queue, timeout);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

---

## Coverage Requirements

### Minimum Coverage Targets
- **Unit Tests**: 95%
- **Integration Tests**: 85%
- **E2E Tests**: 70%

### Critical Paths (100% Coverage)
- Signature validation
- Event normalization
- Deduplication logic
- Suppression list management
- Campaign analytics updates

---

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Email Service Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
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

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
        run: npx prisma migrate deploy

      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test_db
          REDIS_HOST: localhost
          REDIS_PORT: 6379
        run: npm test -- email --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## Best Practices

### 1. Test Isolation
- ✅ Use separate test database
- ✅ Clean up after each test
- ✅ Mock external services
- ✅ Use test-specific Redis keys

### 2. Test Data
- ✅ Use factories for consistent test data
- ✅ Avoid hardcoded IDs
- ✅ Clean up test data after tests
- ✅ Use realistic mock data

### 3. Async Testing
- ✅ Always await async operations
- ✅ Use proper timeouts
- ✅ Handle promise rejections
- ✅ Clean up async resources

### 4. Error Testing
- ✅ Test error conditions
- ✅ Test edge cases
- ✅ Test retry logic
- ✅ Test timeout scenarios

---

**Last Updated**: January 2025
**Version**: 1.0.0
