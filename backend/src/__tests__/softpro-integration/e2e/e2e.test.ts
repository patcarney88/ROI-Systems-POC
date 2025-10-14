/**
 * SoftPro Integration End-to-End Tests
 * Complete workflow testing from OAuth to data synchronization
 */

import request from 'supertest';
import { app } from '../../../index';
import { db } from '../../../config/database';
import { redis } from '../../../config/redis';
import { mockResponses } from '../fixtures/mock-responses';
import { webhookPayloads, generateWebhookSignature } from '../fixtures/webhook-payloads';

describe('SoftPro Integration E2E Tests', () => {
  let authToken: string;
  let integrationId: string;
  let organizationId: string;

  beforeAll(async () => {
    // Setup test organization and user
    const org = await db.organization.create({
      data: {
        name: 'Test Org',
        email: 'test@org.com',
        subscriptionTier: 'PROFESSIONAL',
        subscriptionStatus: 'ACTIVE',
      },
    });
    organizationId = org.id;

    const user = await db.user.create({
      data: {
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User',
        passwordHash: 'hashed_password',
        organizationId: org.id,
        role: 'ADMIN',
        emailVerified: true,
      },
    });

    // Generate auth token for API calls
    authToken = generateTestAuthToken(user.id, org.id);
  });

  afterAll(async () => {
    // Cleanup test data
    await db.softProIntegration.deleteMany({
      where: { organizationId },
    });
    await db.user.deleteMany({
      where: { organizationId },
    });
    await db.organization.delete({
      where: { id: organizationId },
    });
    await redis.flushdb();
  });

  // ============================================================================
  // OAUTH FLOW E2E TESTS
  // ============================================================================

  describe('Complete OAuth Flow', () => {
    it('should complete full OAuth authentication flow', async () => {
      // Step 1: Generate authorization URL
      const authUrlResponse = await request(app)
        .post('/api/v1/integrations/softpro/connect')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          redirectUri: 'http://localhost:3000/callback',
        })
        .expect(200);

      expect(authUrlResponse.body).toHaveProperty('authorizationUrl');
      expect(authUrlResponse.body.authorizationUrl).toContain('softpro.com/oauth/authorize');

      // Step 2: Simulate OAuth callback with authorization code
      const callbackResponse = await request(app)
        .get('/api/v1/integrations/softpro/callback')
        .query({
          code: 'mock_authorization_code',
          state: authUrlResponse.body.state,
        })
        .expect(302); // Redirect after successful OAuth

      // Step 3: Verify integration created
      const integrationsResponse = await request(app)
        .get('/api/v1/integrations/softpro')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(integrationsResponse.body.data).toHaveLength(1);
      integrationId = integrationsResponse.body.data[0].id;

      // Step 4: Verify tokens stored and encrypted
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      expect(integration).toBeTruthy();
      expect(integration?.accessToken).toBeTruthy();
      expect(integration?.refreshToken).toBeTruthy();
      expect(integration?.active).toBe(true);
    });

    it('should handle OAuth errors gracefully', async () => {
      const errorResponse = await request(app)
        .get('/api/v1/integrations/softpro/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access',
        })
        .expect(400);

      expect(errorResponse.body.error).toBe('access_denied');
    });

    it('should refresh expired tokens automatically', async () => {
      // Simulate expired token
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          tokenExpiry: new Date(Date.now() - 1000), // Expired
        },
      });

      // Make API call that triggers token refresh
      const response = await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify token was refreshed
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      expect(integration?.tokenExpiry).toBeInstanceOf(Date);
      expect(integration?.tokenExpiry!.getTime()).toBeGreaterThan(Date.now());
    });
  });

  // ============================================================================
  // TRANSACTION SYNC E2E TESTS
  // ============================================================================

  describe('Transaction Synchronization', () => {
    it('should sync transaction from SoftPro to ROI', async () => {
      // Mock SoftPro API response
      mockSoftProAPI('/api/v1/transactions', mockResponses.transactionList);

      // Trigger sync
      const syncResponse = await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(syncResponse.body).toMatchObject({
        success: true,
        recordsProcessed: 3,
        recordsSucceeded: 3,
      });

      // Verify transactions created in database
      const transactions = await db.transaction.findMany({
        where: { integrationId },
      });

      expect(transactions).toHaveLength(3);
      expect(transactions[0]).toMatchObject({
        externalId: 'SP-12345',
        fileNumber: '2024-001234',
        status: 'IN_PROGRESS',
      });
    });

    it('should apply field mappings during sync', async () => {
      // Create custom field mapping
      await db.fieldMapping.create({
        data: {
          integrationId,
          sourceField: 'file_number',
          targetField: 'customFileNumber',
          transformationType: 'DIRECT',
        },
      });

      mockSoftProAPI('/api/v1/transactions', mockResponses.transactionList);

      await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const transaction = await db.transaction.findFirst({
        where: {
          integrationId,
          externalId: 'SP-12345',
        },
      });

      expect(transaction?.metadata).toHaveProperty('customFileNumber', '2024-001234');
    });

    it('should handle sync conflicts with configured strategy', async () => {
      // Create existing transaction with different data
      await db.transaction.create({
        data: {
          integrationId,
          externalId: 'SP-12345',
          fileNumber: '2024-001234',
          status: 'CLOSED', // Different status
          updatedAt: new Date(Date.now() + 1000), // Newer than SoftPro
        },
      });

      // Configure conflict strategy
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          conflictStrategy: 'NEWEST_WINS',
        },
      });

      mockSoftProAPI('/api/v1/transactions', mockResponses.transactionList);

      await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify local (newer) data was preserved
      const transaction = await db.transaction.findFirst({
        where: {
          integrationId,
          externalId: 'SP-12345',
        },
      });

      expect(transaction?.status).toBe('CLOSED'); // Local status preserved
    });
  });

  // ============================================================================
  // WEBHOOK PROCESSING E2E TESTS
  // ============================================================================

  describe('Webhook Processing', () => {
    it('should receive and process webhook event', async () => {
      const webhookSecret = 'test_webhook_secret';

      // Update integration with webhook secret
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: { webhookSecret },
      });

      const payload = webhookPayloads.transactionCreated;
      const signature = generateWebhookSignature(payload, webhookSecret);

      // Send webhook
      const response = await request(app)
        .post(`/api/v1/webhooks/softpro/${integrationId}`)
        .set('x-softpro-signature', signature)
        .send(payload)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Webhook received',
      });

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Verify transaction created from webhook
      const transaction = await db.transaction.findFirst({
        where: {
          integrationId,
          externalId: 'SP-12345',
        },
      });

      expect(transaction).toBeTruthy();
      expect(transaction?.fileNumber).toBe('2024-001234');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = webhookPayloads.transactionCreated;

      const response = await request(app)
        .post(`/api/v1/webhooks/softpro/${integrationId}`)
        .set('x-softpro-signature', 'invalid_signature')
        .send(payload)
        .expect(401);

      expect(response.body.error).toContain('Invalid signature');
    });

    it('should deduplicate webhook events', async () => {
      const webhookSecret = 'test_webhook_secret';
      const payload = webhookPayloads.transactionUpdated;
      const signature = generateWebhookSignature(payload, webhookSecret);

      // Send same webhook twice
      await request(app)
        .post(`/api/v1/webhooks/softpro/${integrationId}`)
        .set('x-softpro-signature', signature)
        .send(payload)
        .expect(200);

      const duplicateResponse = await request(app)
        .post(`/api/v1/webhooks/softpro/${integrationId}`)
        .set('x-softpro-signature', signature)
        .send(payload)
        .expect(200);

      expect(duplicateResponse.body.message).toContain('Duplicate');
    });

    it('should retry failed webhook processing', async () => {
      const webhookSecret = 'test_webhook_secret';
      const payload = webhookPayloads.documentUploaded;
      const signature = generateWebhookSignature(payload, webhookSecret);

      // Cause processing to fail by invalid data
      const failingPayload = {
        ...payload,
        event: {
          ...payload.event,
          data: null, // Invalid data
        },
      };

      await request(app)
        .post(`/api/v1/webhooks/softpro/${integrationId}`)
        .set('x-softpro-signature', signature)
        .send(failingPayload)
        .expect(200); // Accepted but will fail processing

      // Wait for retry processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify retry was attempted
      const webhookEvents = await db.webhookEvent.findMany({
        where: {
          integrationId,
          status: 'RETRYING',
        },
      });

      expect(webhookEvents.length).toBeGreaterThan(0);
      expect(webhookEvents[0].retryCount).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // DOCUMENT SYNC E2E TESTS
  // ============================================================================

  describe('Document Synchronization', () => {
    it('should upload document to SoftPro', async () => {
      mockSoftProAPI('/api/v1/documents', mockResponses.document, 'POST');

      const response = await request(app)
        .post('/api/v1/integrations/softpro/documents/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('test file content'), 'test-document.pdf')
        .field('orderId', 'SP-12345')
        .field('documentType', 'PURCHASE_AGREEMENT')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        documentId: 'D-001',
      });
    });

    it('should sync documents from SoftPro to ROI', async () => {
      mockSoftProAPI('/api/v1/documents', mockResponses.documentList);

      const response = await request(app)
        .post('/api/v1/integrations/softpro/sync/documents')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ orderId: 'SP-12345' })
        .expect(200);

      expect(response.body.recordsSucceeded).toBe(3);

      const documents = await db.document.findMany({
        where: {
          integrationId,
        },
      });

      expect(documents).toHaveLength(3);
    });
  });

  // ============================================================================
  // ERROR RECOVERY E2E TESTS
  // ============================================================================

  describe('Error Recovery', () => {
    it('should recover from rate limit errors', async () => {
      // Mock rate limit error first, then success
      mockSoftProAPIWithRetry(
        '/api/v1/transactions',
        { error: 'RATE_LIMIT_EXCEEDED', retryAfter: 1 },
        mockResponses.transactionList
      );

      const response = await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle network errors with retry', async () => {
      // Mock network errors followed by success
      mockSoftProAPIWithErrors(
        '/api/v1/transactions',
        ['ECONNREFUSED', 'ETIMEDOUT'],
        mockResponses.transactionList
      );

      const response = await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should rollback on sync failure', async () => {
      const initialTransactionCount = await db.transaction.count({
        where: { integrationId },
      });

      // Mock API to fail mid-sync
      mockSoftProAPIWithPartialFailure('/api/v1/transactions');

      await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(500);

      // Verify rollback occurred
      const finalTransactionCount = await db.transaction.count({
        where: { integrationId },
      });

      expect(finalTransactionCount).toBe(initialTransactionCount);
    });
  });

  // ============================================================================
  // MONITORING & METRICS E2E TESTS
  // ============================================================================

  describe('Monitoring and Metrics', () => {
    it('should track sync metrics', async () => {
      mockSoftProAPI('/api/v1/transactions', mockResponses.transactionList);

      await request(app)
        .post('/api/v1/integrations/softpro/sync/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const metricsResponse = await request(app)
        .get('/api/v1/integrations/softpro/metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(metricsResponse.body).toMatchObject({
        totalSyncs: expect.any(Number),
        successfulSyncs: expect.any(Number),
        failedSyncs: expect.any(Number),
        averageSyncDuration: expect.any(Number),
      });
    });

    it('should track webhook metrics', async () => {
      const metricsResponse = await request(app)
        .get('/api/v1/integrations/softpro/webhook-metrics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(metricsResponse.body).toMatchObject({
        totalWebhooks: expect.any(Number),
        successfulWebhooks: expect.any(Number),
        failedWebhooks: expect.any(Number),
        averageProcessingTime: expect.any(Number),
      });
    });

    it('should provide health status', async () => {
      const healthResponse = await request(app)
        .get('/api/v1/integrations/softpro/health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(healthResponse.body).toMatchObject({
        status: 'healthy',
        integration: {
          active: true,
          lastSync: expect.any(String),
          tokenValid: true,
        },
        dependencies: {
          database: 'up',
          redis: 'up',
          softproApi: 'up',
        },
      });
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateTestAuthToken(userId: string, organizationId: string): string {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { userId, organizationId, role: 'ADMIN' },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
}

function mockSoftProAPI(path: string, response: any, method: string = 'GET') {
  const nock = require('nock');
  nock('https://api.softpro.com')
    [method.toLowerCase()](path)
    .reply(200, response);
}

function mockSoftProAPIWithRetry(path: string, errorResponse: any, successResponse: any) {
  const nock = require('nock');
  nock('https://api.softpro.com')
    .get(path)
    .reply(429, errorResponse)
    .get(path)
    .reply(200, successResponse);
}

function mockSoftProAPIWithErrors(path: string, errors: string[], successResponse: any) {
  const nock = require('nock');
  let mock = nock('https://api.softpro.com');

  errors.forEach((error) => {
    mock = mock.get(path).replyWithError(error);
  });

  mock.get(path).reply(200, successResponse);
}

function mockSoftProAPIWithPartialFailure(path: string) {
  const nock = require('nock');
  nock('https://api.softpro.com')
    .get(path)
    .reply(500, { error: 'Internal Server Error' });
}
