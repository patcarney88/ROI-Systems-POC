/**
 * SoftPro Webhook Service
 * Real-time webhook handling for SoftPro 360 events
 *
 * Features:
 * - Webhook signature validation (HMAC-SHA256)
 * - Event parsing and validation
 * - Queue-based async processing
 * - Duplicate event detection
 * - Automatic retry on failure (max 5 attempts)
 * - Comprehensive event tracking
 */

import * as crypto from 'crypto';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import { softProQueueProcessor } from '../workers/softpro-queue-processor';

const logger = createLogger('softpro-webhook-service');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum WebhookEventType {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_UPDATED = 'transaction.updated',
  TRANSACTION_STATUS_CHANGED = 'transaction.status_changed',
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_UPDATED = 'document.updated',
  DOCUMENT_DELETED = 'document.deleted',
  CONTACT_CREATED = 'contact.created',
  CONTACT_UPDATED = 'contact.updated',
  CONTACT_DELETED = 'contact.deleted',
  TASK_CREATED = 'task.created',
  TASK_COMPLETED = 'task.completed',
  CLOSING_SCHEDULED = 'closing.scheduled',
  CLOSING_COMPLETED = 'closing.completed',
}

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface WebhookPayload {
  event: WebhookEvent;
  signature: string;
  delivery_id: string;
}

export enum WebhookEventStatus {
  RECEIVED = 'RECEIVED',
  QUEUED = 'QUEUED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
}

// ============================================================================
// SOFTPRO WEBHOOK SERVICE
// ============================================================================

export class SoftProWebhookService {
  private readonly MAX_RETRIES = 5;
  private readonly SIGNATURE_TTL = 300; // 5 minutes
  private readonly DEDUPLICATION_TTL = 86400; // 24 hours

  /**
   * Validate webhook signature using HMAC-SHA256
   */
  validateSignature(payload: string, signature: string, secret: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison to prevent timing attacks
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      logger.error('Error validating webhook signature:', error);
      return false;
    }
  }

  /**
   * Validate webhook timestamp to prevent replay attacks
   */
  validateTimestamp(timestamp: string, maxAgeSeconds: number = this.SIGNATURE_TTL): boolean {
    try {
      const eventTime = new Date(timestamp).getTime();
      const currentTime = Date.now();
      const ageSeconds = Math.abs(currentTime - eventTime) / 1000;

      return ageSeconds <= maxAgeSeconds;
    } catch (error) {
      logger.error('Error validating webhook timestamp:', error);
      return false;
    }
  }

  /**
   * Process incoming webhook event
   */
  async processWebhook(
    integrationId: string,
    eventType: WebhookEventType,
    payload: any,
    headers: any
  ): Promise<void> {
    const startTime = Date.now();
    logger.info(`📥 Processing webhook: ${eventType} for integration ${integrationId}`);

    try {
      // Get integration configuration
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      if (!integration.active) {
        throw new Error(`Integration is not active: ${integrationId}`);
      }

      // Validate signature
      const signature = headers['x-softpro-signature'] || headers['x-signature'];
      const webhookSecret = integration.webhookSecret;

      if (webhookSecret && signature) {
        const payloadString = JSON.stringify(payload);
        const isValid = this.validateSignature(payloadString, signature, webhookSecret);

        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Validate timestamp
      if (payload.timestamp) {
        const isValidTimestamp = this.validateTimestamp(payload.timestamp);
        if (!isValidTimestamp) {
          throw new Error('Webhook timestamp too old or invalid');
        }
      }

      // Check for duplicate event
      const isDuplicate = await this.isDuplicateEvent(payload.id || payload.event?.id);
      if (isDuplicate) {
        logger.warn(`⚠️ Duplicate event detected: ${payload.id}`);
        return;
      }

      // Save webhook event to database
      const webhookEvent = await db.webhookEvent.create({
        data: {
          integrationId,
          eventType,
          eventId: payload.id || payload.event?.id || crypto.randomUUID(),
          payload: payload as any,
          status: WebhookEventStatus.RECEIVED,
          receivedAt: new Date(),
          headers: headers as any,
        },
      });

      logger.info(`✅ Webhook event saved: ${webhookEvent.id}`);

      // Mark event as queued
      await db.webhookEvent.update({
        where: { id: webhookEvent.id },
        data: { status: WebhookEventStatus.QUEUED },
      });

      // Queue for async processing
      await softProQueueProcessor.addWebhookEvent({
        webhookEventId: webhookEvent.id,
        integrationId,
        eventType,
        payload,
        priority: this.getEventPriority(eventType),
      });

      logger.info(
        `⚡ Webhook queued in ${Date.now() - startTime}ms: ${eventType} (${webhookEvent.id})`
      );
    } catch (error) {
      logger.error(`❌ Error processing webhook:`, error);
      throw error;
    }
  }

  /**
   * Handle specific event types
   */
  async handleTransactionCreated(integrationId: string, data: any): Promise<void> {
    logger.info(`📄 Handling transaction created: ${data.id}`);

    try {
      // Extract transaction data
      const transactionData = {
        externalId: data.id,
        integrationId,
        fileNumber: data.file_number,
        propertyAddress: data.property?.address,
        closingDate: data.closing_date ? new Date(data.closing_date) : null,
        status: data.status,
        transactionType: data.type,
        metadata: data,
      };

      // Upsert transaction
      await db.transaction.upsert({
        where: {
          integrationId_externalId: {
            integrationId,
            externalId: data.id,
          },
        },
        create: transactionData,
        update: transactionData,
      });

      logger.info(`✅ Transaction created/updated: ${data.id}`);
    } catch (error) {
      logger.error('Error handling transaction created:', error);
      throw error;
    }
  }

  async handleTransactionUpdated(integrationId: string, data: any): Promise<void> {
    logger.info(`📝 Handling transaction updated: ${data.id}`);

    try {
      await db.transaction.update({
        where: {
          integrationId_externalId: {
            integrationId,
            externalId: data.id,
          },
        },
        data: {
          fileNumber: data.file_number,
          propertyAddress: data.property?.address,
          closingDate: data.closing_date ? new Date(data.closing_date) : null,
          status: data.status,
          transactionType: data.type,
          metadata: data,
          updatedAt: new Date(),
        },
      });

      logger.info(`✅ Transaction updated: ${data.id}`);
    } catch (error) {
      logger.error('Error handling transaction updated:', error);
      throw error;
    }
  }

  async handleDocumentUploaded(integrationId: string, data: any): Promise<void> {
    logger.info(`📎 Handling document uploaded: ${data.id}`);

    try {
      // Extract document data
      const documentData = {
        externalId: data.id,
        integrationId,
        transactionId: data.transaction_id,
        fileName: data.name || data.filename,
        fileType: data.type || data.mime_type,
        fileSize: data.size,
        documentType: data.document_type || data.category,
        uploadedAt: data.uploaded_at ? new Date(data.uploaded_at) : new Date(),
        metadata: data,
      };

      // Create document record
      await db.document.create({
        data: documentData,
      });

      logger.info(`✅ Document created: ${data.id}`);
    } catch (error) {
      logger.error('Error handling document uploaded:', error);
      throw error;
    }
  }

  async handleStatusChanged(integrationId: string, data: any): Promise<void> {
    logger.info(`🔄 Handling status changed: ${data.transaction_id} -> ${data.new_status}`);

    try {
      // Update transaction status
      await db.transaction.update({
        where: {
          integrationId_externalId: {
            integrationId,
            externalId: data.transaction_id,
          },
        },
        data: {
          status: data.new_status,
          previousStatus: data.old_status,
          statusChangedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create status change audit record
      await db.statusChangeLog.create({
        data: {
          transactionId: data.transaction_id,
          integrationId,
          oldStatus: data.old_status,
          newStatus: data.new_status,
          changedBy: data.changed_by,
          reason: data.reason,
          timestamp: new Date(),
        },
      });

      logger.info(`✅ Status updated: ${data.transaction_id}`);
    } catch (error) {
      logger.error('Error handling status changed:', error);
      throw error;
    }
  }

  async handleContactUpdated(integrationId: string, data: any): Promise<void> {
    logger.info(`👤 Handling contact updated: ${data.id}`);

    try {
      const contactData = {
        externalId: data.id,
        integrationId,
        firstName: data.first_name,
        lastName: data.last_name,
        email: data.email,
        phone: data.phone,
        role: data.role || data.type,
        company: data.company,
        metadata: data,
      };

      await db.contact.upsert({
        where: {
          integrationId_externalId: {
            integrationId,
            externalId: data.id,
          },
        },
        create: contactData,
        update: contactData,
      });

      logger.info(`✅ Contact updated: ${data.id}`);
    } catch (error) {
      logger.error('Error handling contact updated:', error);
      throw error;
    }
  }

  /**
   * Retry failed webhook event
   */
  async retryFailedEvent(eventId: string): Promise<void> {
    try {
      const event = await db.webhookEvent.findUnique({
        where: { id: eventId },
      });

      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      if (event.retryCount >= this.MAX_RETRIES) {
        throw new Error(`Max retries exceeded for event: ${eventId}`);
      }

      // Update status to retrying
      await db.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: WebhookEventStatus.RETRYING,
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
        },
      });

      // Re-queue event
      await softProQueueProcessor.addRetryJob(eventId, event.retryCount * 2000);

      logger.info(`🔄 Event retry queued: ${eventId} (attempt ${event.retryCount + 1})`);
    } catch (error) {
      logger.error('Error retrying failed event:', error);
      throw error;
    }
  }

  /**
   * Get event processing status
   */
  async getEventStatus(eventId: string): Promise<any> {
    try {
      const event = await db.webhookEvent.findUnique({
        where: { id: eventId },
        include: {
          integration: {
            select: {
              id: true,
              organizationId: true,
              active: true,
            },
          },
        },
      });

      if (!event) {
        throw new Error(`Event not found: ${eventId}`);
      }

      return {
        id: event.id,
        eventType: event.eventType,
        status: event.status,
        receivedAt: event.receivedAt,
        processedAt: event.processedAt,
        retryCount: event.retryCount,
        error: event.error,
        integration: event.integration,
      };
    } catch (error) {
      logger.error('Error getting event status:', error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if event is duplicate using Redis
   */
  private async isDuplicateEvent(eventId: string): Promise<boolean> {
    try {
      const key = `webhook:dedup:${eventId}`;
      const exists = await redis.get(key);

      if (exists) {
        return true;
      }

      // Mark event as processed
      await redis.setex(key, this.DEDUPLICATION_TTL, '1');
      return false;
    } catch (error) {
      logger.error('Error checking duplicate event:', error);
      return false; // Fail open to prevent blocking valid events
    }
  }

  /**
   * Get event priority for queue processing
   */
  private getEventPriority(eventType: WebhookEventType): number {
    const priorities: Record<string, number> = {
      [WebhookEventType.TRANSACTION_STATUS_CHANGED]: 1, // Highest
      [WebhookEventType.CLOSING_SCHEDULED]: 1,
      [WebhookEventType.CLOSING_COMPLETED]: 1,
      [WebhookEventType.TRANSACTION_UPDATED]: 2,
      [WebhookEventType.TRANSACTION_CREATED]: 2,
      [WebhookEventType.DOCUMENT_UPLOADED]: 3,
      [WebhookEventType.DOCUMENT_UPDATED]: 3,
      [WebhookEventType.CONTACT_UPDATED]: 4,
      [WebhookEventType.CONTACT_CREATED]: 4,
      [WebhookEventType.TASK_CREATED]: 5,
      [WebhookEventType.TASK_COMPLETED]: 5,
    };

    return priorities[eventType] || 5; // Default to lowest priority
  }
}

// Export singleton instance
export const softProWebhookService = new SoftProWebhookService();
