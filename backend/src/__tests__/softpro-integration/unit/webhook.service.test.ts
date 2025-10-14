/**
 * SoftPro Webhook Service Unit Tests
 * Comprehensive test coverage for webhook processing, validation, and handling
 */

import { SoftProWebhookService, WebhookEventType, WebhookEventStatus } from '../../../services/softpro-webhook.service';
import { webhookPayloads, generateWebhookSignature } from '../fixtures/webhook-payloads';
import { db } from '../../../config/database';
import { redis } from '../../../config/redis';
import { softProQueueProcessor } from '../../../workers/softpro-queue-processor';

// Mock dependencies
jest.mock('../../../config/database');
jest.mock('../../../config/redis');
jest.mock('../../../workers/softpro-queue-processor');

describe('SoftProWebhookService', () => {
  let webhookService: SoftProWebhookService;
  const mockIntegrationId = 'integration_123';
  const mockWebhookSecret = 'test_webhook_secret_key';

  beforeEach(() => {
    webhookService = new SoftProWebhookService();
    jest.clearAllMocks();
  });

  // ============================================================================
  // SIGNATURE VALIDATION TESTS
  // ============================================================================

  describe('validateSignature', () => {
    it('should validate correct signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = generateWebhookSignature({ test: 'data' }, mockWebhookSecret);

      const isValid = webhookService.validateSignature(payload, signature, mockWebhookSecret);

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid_signature';

      const isValid = webhookService.validateSignature(payload, invalidSignature, mockWebhookSecret);

      expect(isValid).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = generateWebhookSignature({ test: 'data' }, 'wrong_secret');

      const isValid = webhookService.validateSignature(payload, signature, mockWebhookSecret);

      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const originalPayload = JSON.stringify({ test: 'data' });
      const signature = generateWebhookSignature({ test: 'data' }, mockWebhookSecret);
      const tamperedPayload = JSON.stringify({ test: 'tampered_data' });

      const isValid = webhookService.validateSignature(tamperedPayload, signature, mockWebhookSecret);

      expect(isValid).toBe(false);
    });

    it('should handle validation errors gracefully', () => {
      const payload = null as any;
      const signature = 'some_signature';

      const isValid = webhookService.validateSignature(payload, signature, mockWebhookSecret);

      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // TIMESTAMP VALIDATION TESTS
  // ============================================================================

  describe('validateTimestamp', () => {
    it('should accept recent timestamp', () => {
      const recentTimestamp = new Date().toISOString();

      const isValid = webhookService.validateTimestamp(recentTimestamp);

      expect(isValid).toBe(true);
    });

    it('should reject old timestamp (> 5 minutes)', () => {
      const oldTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // 10 minutes ago

      const isValid = webhookService.validateTimestamp(oldTimestamp);

      expect(isValid).toBe(false);
    });

    it('should accept timestamp within custom max age', () => {
      const timestamp = new Date(Date.now() - 8 * 60 * 1000).toISOString(); // 8 minutes ago
      const maxAgeSeconds = 10 * 60; // 10 minutes

      const isValid = webhookService.validateTimestamp(timestamp, maxAgeSeconds);

      expect(isValid).toBe(true);
    });

    it('should reject future timestamp beyond threshold', () => {
      const futureTimestamp = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes future

      const isValid = webhookService.validateTimestamp(futureTimestamp);

      expect(isValid).toBe(false);
    });

    it('should handle invalid timestamp format', () => {
      const invalidTimestamp = 'not-a-timestamp';

      const isValid = webhookService.validateTimestamp(invalidTimestamp);

      expect(isValid).toBe(false);
    });
  });

  // ============================================================================
  // WEBHOOK PROCESSING TESTS
  // ============================================================================

  describe('processWebhook', () => {
    const mockIntegration = {
      id: mockIntegrationId,
      organizationId: 'org_123',
      active: true,
      webhookSecret: mockWebhookSecret,
    };

    const mockWebhookEvent = {
      id: 'webhook_event_123',
      integrationId: mockIntegrationId,
      eventType: WebhookEventType.TRANSACTION_CREATED,
      eventId: 'evt_123',
      status: WebhookEventStatus.RECEIVED,
    };

    beforeEach(() => {
      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (db.webhookEvent.create as jest.Mock).mockResolvedValue(mockWebhookEvent);
      (db.webhookEvent.update as jest.Mock).mockResolvedValue(mockWebhookEvent);
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (softProQueueProcessor.addWebhookEvent as jest.Mock).mockResolvedValue({ id: 'job_123' });
    });

    it('should successfully process valid webhook', async () => {
      const payload = webhookPayloads.transactionCreated;
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(db.softProIntegration.findUnique).toHaveBeenCalledWith({
        where: { id: mockIntegrationId },
      });
      expect(db.webhookEvent.create).toHaveBeenCalled();
      expect(db.webhookEvent.update).toHaveBeenCalled();
      expect(softProQueueProcessor.addWebhookEvent).toHaveBeenCalled();
    });

    it('should reject webhook for inactive integration', async () => {
      const inactiveIntegration = { ...mockIntegration, active: false };
      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(inactiveIntegration);

      const payload = webhookPayloads.transactionCreated;
      const headers = {};

      await expect(
        webhookService.processWebhook(
          mockIntegrationId,
          WebhookEventType.TRANSACTION_CREATED,
          payload,
          headers
        )
      ).rejects.toThrow('Integration is not active');
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = webhookPayloads.transactionCreated;
      const headers = {
        'x-softpro-signature': 'invalid_signature',
      };

      await expect(
        webhookService.processWebhook(
          mockIntegrationId,
          WebhookEventType.TRANSACTION_CREATED,
          payload,
          headers
        )
      ).rejects.toThrow('Invalid webhook signature');
    });

    it('should reject webhook with expired timestamp', async () => {
      const payload = {
        ...webhookPayloads.transactionCreated,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
      };
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      await expect(
        webhookService.processWebhook(
          mockIntegrationId,
          WebhookEventType.TRANSACTION_CREATED,
          payload,
          headers
        )
      ).rejects.toThrow('Webhook timestamp too old or invalid');
    });

    it('should skip duplicate events', async () => {
      (redis.get as jest.Mock).mockResolvedValue('1'); // Event already processed

      const payload = webhookPayloads.transactionCreated;
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(db.webhookEvent.create).not.toHaveBeenCalled();
      expect(softProQueueProcessor.addWebhookEvent).not.toHaveBeenCalled();
    });

    it('should process webhook without signature if secret not configured', async () => {
      const integrationNoSecret = { ...mockIntegration, webhookSecret: null };
      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(integrationNoSecret);

      const payload = webhookPayloads.transactionCreated;
      const headers = {};

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(db.webhookEvent.create).toHaveBeenCalled();
      expect(softProQueueProcessor.addWebhookEvent).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // EVENT HANDLER TESTS
  // ============================================================================

  describe('handleTransactionCreated', () => {
    it('should create new transaction from webhook data', async () => {
      const data = webhookPayloads.transactionCreated.event.data;
      (db.transaction.upsert as jest.Mock).mockResolvedValue({ id: 'trans_123' });

      await webhookService.handleTransactionCreated(mockIntegrationId, data);

      expect(db.transaction.upsert).toHaveBeenCalledWith({
        where: {
          integrationId_externalId: {
            integrationId: mockIntegrationId,
            externalId: data.id,
          },
        },
        create: expect.objectContaining({
          externalId: data.id,
          integrationId: mockIntegrationId,
          fileNumber: data.file_number,
        }),
        update: expect.any(Object),
      });
    });

    it('should handle transaction creation errors', async () => {
      const data = webhookPayloads.transactionCreated.event.data;
      (db.transaction.upsert as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(
        webhookService.handleTransactionCreated(mockIntegrationId, data)
      ).rejects.toThrow('Database error');
    });
  });

  describe('handleTransactionUpdated', () => {
    it('should update existing transaction', async () => {
      const data = webhookPayloads.transactionUpdated.event.data;
      (db.transaction.update as jest.Mock).mockResolvedValue({ id: 'trans_123' });

      await webhookService.handleTransactionUpdated(mockIntegrationId, data);

      expect(db.transaction.update).toHaveBeenCalledWith({
        where: {
          integrationId_externalId: {
            integrationId: mockIntegrationId,
            externalId: data.id,
          },
        },
        data: expect.objectContaining({
          fileNumber: data.file_number,
          status: data.status,
        }),
      });
    });
  });

  describe('handleDocumentUploaded', () => {
    it('should create document record', async () => {
      const data = webhookPayloads.documentUploaded.event.data;
      (db.document.create as jest.Mock).mockResolvedValue({ id: 'doc_123' });

      await webhookService.handleDocumentUploaded(mockIntegrationId, data);

      expect(db.document.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          externalId: data.id,
          integrationId: mockIntegrationId,
          fileName: data.name || data.filename,
        }),
      });
    });
  });

  describe('handleStatusChanged', () => {
    it('should update transaction status and create audit log', async () => {
      const data = webhookPayloads.transactionStatusChanged.event.data;
      (db.transaction.update as jest.Mock).mockResolvedValue({ id: 'trans_123' });
      (db.statusChangeLog.create as jest.Mock).mockResolvedValue({ id: 'log_123' });

      await webhookService.handleStatusChanged(mockIntegrationId, data);

      expect(db.transaction.update).toHaveBeenCalledWith({
        where: {
          integrationId_externalId: {
            integrationId: mockIntegrationId,
            externalId: data.transaction_id,
          },
        },
        data: expect.objectContaining({
          status: data.new_status,
          previousStatus: data.old_status,
        }),
      });

      expect(db.statusChangeLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          transactionId: data.transaction_id,
          oldStatus: data.old_status,
          newStatus: data.new_status,
        }),
      });
    });
  });

  describe('handleContactUpdated', () => {
    it('should upsert contact data', async () => {
      const data = webhookPayloads.contactUpdated.event.data;
      (db.contact.upsert as jest.Mock).mockResolvedValue({ id: 'contact_123' });

      await webhookService.handleContactUpdated(mockIntegrationId, data);

      expect(db.contact.upsert).toHaveBeenCalledWith({
        where: {
          integrationId_externalId: {
            integrationId: mockIntegrationId,
            externalId: data.id,
          },
        },
        create: expect.objectContaining({
          externalId: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
        }),
        update: expect.any(Object),
      });
    });
  });

  // ============================================================================
  // RETRY LOGIC TESTS
  // ============================================================================

  describe('retryFailedEvent', () => {
    it('should retry failed event within retry limit', async () => {
      const mockEvent = {
        id: 'event_123',
        retryCount: 2,
        status: WebhookEventStatus.FAILED,
      };

      (db.webhookEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);
      (db.webhookEvent.update as jest.Mock).mockResolvedValue(mockEvent);
      (softProQueueProcessor.addRetryJob as jest.Mock).mockResolvedValue({ id: 'retry_job_123' });

      await webhookService.retryFailedEvent('event_123');

      expect(db.webhookEvent.update).toHaveBeenCalledWith({
        where: { id: 'event_123' },
        data: {
          status: WebhookEventStatus.RETRYING,
          retryCount: { increment: 1 },
          lastRetryAt: expect.any(Date),
        },
      });

      expect(softProQueueProcessor.addRetryJob).toHaveBeenCalledWith('event_123', 4000); // 2 * 2000ms
    });

    it('should reject retry when max retries exceeded', async () => {
      const mockEvent = {
        id: 'event_123',
        retryCount: 5, // Max retries
        status: WebhookEventStatus.FAILED,
      };

      (db.webhookEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);

      await expect(webhookService.retryFailedEvent('event_123')).rejects.toThrow(
        'Max retries exceeded'
      );

      expect(db.webhookEvent.update).not.toHaveBeenCalled();
    });

    it('should handle event not found', async () => {
      (db.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(webhookService.retryFailedEvent('nonexistent_event')).rejects.toThrow(
        'Event not found'
      );
    });
  });

  // ============================================================================
  // EVENT STATUS TESTS
  // ============================================================================

  describe('getEventStatus', () => {
    it('should return event status with integration details', async () => {
      const mockEvent = {
        id: 'event_123',
        eventType: WebhookEventType.TRANSACTION_CREATED,
        status: WebhookEventStatus.COMPLETED,
        receivedAt: new Date(),
        processedAt: new Date(),
        retryCount: 0,
        error: null,
        integration: {
          id: mockIntegrationId,
          organizationId: 'org_123',
          active: true,
        },
      };

      (db.webhookEvent.findUnique as jest.Mock).mockResolvedValue(mockEvent);

      const status = await webhookService.getEventStatus('event_123');

      expect(status).toMatchObject({
        id: 'event_123',
        eventType: WebhookEventType.TRANSACTION_CREATED,
        status: WebhookEventStatus.COMPLETED,
      });
    });

    it('should handle event not found', async () => {
      (db.webhookEvent.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(webhookService.getEventStatus('nonexistent_event')).rejects.toThrow(
        'Event not found'
      );
    });
  });

  // ============================================================================
  // DEDUPLICATION TESTS
  // ============================================================================

  describe('Deduplication', () => {
    it('should mark first occurrence of event as not duplicate', async () => {
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');

      const payload = webhookPayloads.transactionCreated;
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      const mockIntegration = {
        id: mockIntegrationId,
        active: true,
        webhookSecret: mockWebhookSecret,
      };
      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (db.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'event_123' });
      (db.webhookEvent.update as jest.Mock).mockResolvedValue({ id: 'event_123' });
      (softProQueueProcessor.addWebhookEvent as jest.Mock).mockResolvedValue({ id: 'job_123' });

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(redis.setex).toHaveBeenCalled();
      expect(db.webhookEvent.create).toHaveBeenCalled();
    });

    it('should detect duplicate events', async () => {
      (redis.get as jest.Mock).mockResolvedValue('1'); // Event already exists

      const payload = webhookPayloads.transactionCreated;
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      const mockIntegration = {
        id: mockIntegrationId,
        active: true,
        webhookSecret: mockWebhookSecret,
      };
      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.TRANSACTION_CREATED,
        payload,
        headers
      );

      expect(db.webhookEvent.create).not.toHaveBeenCalled();
      expect(softProQueueProcessor.addWebhookEvent).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // PRIORITY TESTS
  // ============================================================================

  describe('Event Priority', () => {
    it('should assign high priority to status change events', async () => {
      const mockIntegration = {
        id: mockIntegrationId,
        active: true,
        webhookSecret: mockWebhookSecret,
      };

      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (db.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'event_123' });
      (db.webhookEvent.update as jest.Mock).mockResolvedValue({ id: 'event_123' });
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (softProQueueProcessor.addWebhookEvent as jest.Mock).mockResolvedValue({ id: 'job_123' });

      const payload = webhookPayloads.transactionStatusChanged;
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.TRANSACTION_STATUS_CHANGED,
        payload,
        headers
      );

      expect(softProQueueProcessor.addWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 1, // Highest priority
        })
      );
    });

    it('should assign lower priority to contact events', async () => {
      const mockIntegration = {
        id: mockIntegrationId,
        active: true,
        webhookSecret: mockWebhookSecret,
      };

      (db.softProIntegration.findUnique as jest.Mock).mockResolvedValue(mockIntegration);
      (db.webhookEvent.create as jest.Mock).mockResolvedValue({ id: 'event_123' });
      (db.webhookEvent.update as jest.Mock).mockResolvedValue({ id: 'event_123' });
      (redis.get as jest.Mock).mockResolvedValue(null);
      (redis.setex as jest.Mock).mockResolvedValue('OK');
      (softProQueueProcessor.addWebhookEvent as jest.Mock).mockResolvedValue({ id: 'job_123' });

      const payload = webhookPayloads.contactCreated;
      const headers = {
        'x-softpro-signature': generateWebhookSignature(payload, mockWebhookSecret),
      };

      await webhookService.processWebhook(
        mockIntegrationId,
        WebhookEventType.CONTACT_CREATED,
        payload,
        headers
      );

      expect(softProQueueProcessor.addWebhookEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          priority: 4, // Lower priority
        })
      );
    });
  });
});
