/**
 * SoftPro Queue Processor
 * Handles async processing of webhook events and sync jobs using Bull queues
 *
 * Features:
 * - Multi-queue architecture (webhooks, sync, retry)
 * - Priority-based job processing
 * - Exponential backoff retry strategy
 * - Comprehensive error handling
 * - Performance monitoring
 * - Job lifecycle management
 */

import Bull, { Job, Queue, JobOptions } from 'bull';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import { WebhookEventType, WebhookEventStatus } from '../services/softpro-webhook.service';

const logger = createLogger('softpro-queue-processor');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum QueueName {
  WEBHOOK_EVENTS = 'softpro:webhook-events',
  SYNC_TRANSACTIONS = 'softpro:sync-transactions',
  SYNC_CONTACTS = 'softpro:sync-contacts',
  SYNC_DOCUMENTS = 'softpro:sync-documents',
  RETRY_FAILED = 'softpro:retry-failed',
}

export interface WebhookEventData {
  webhookEventId: string;
  integrationId: string;
  eventType: WebhookEventType;
  payload: any;
  priority: number;
}

export interface SyncJobData {
  integrationId: string;
  syncType: 'transactions' | 'contacts' | 'documents';
  lastSyncTime?: Date;
  batchSize?: number;
  options?: Record<string, any>;
}

export interface RetryJobData {
  originalJobId: string;
  webhookEventId: string;
  retryCount: number;
  error: string;
}

export interface QueueStats {
  queueName: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

// ============================================================================
// QUEUE CONFIGURATION
// ============================================================================

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
};

const defaultJobOptions: JobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 seconds
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 500, // Keep last 500 failed jobs for debugging
  timeout: 30000, // 30 second timeout per job
};

// ============================================================================
// SOFTPRO QUEUE PROCESSOR
// ============================================================================

export class SoftProQueueProcessor {
  private webhookQueue: Bull.Queue<WebhookEventData>;
  private syncTransactionsQueue: Bull.Queue<SyncJobData>;
  private syncContactsQueue: Bull.Queue<SyncJobData>;
  private syncDocumentsQueue: Bull.Queue<SyncJobData>;
  private retryQueue: Bull.Queue<RetryJobData>;

  constructor() {
    // Initialize all queues
    this.webhookQueue = new Bull(QueueName.WEBHOOK_EVENTS, {
      redis: redisConfig,
      defaultJobOptions,
    });

    this.syncTransactionsQueue = new Bull(QueueName.SYNC_TRANSACTIONS, {
      redis: redisConfig,
      defaultJobOptions: {
        ...defaultJobOptions,
        timeout: 300000, // 5 minutes for sync jobs
      },
    });

    this.syncContactsQueue = new Bull(QueueName.SYNC_CONTACTS, {
      redis: redisConfig,
      defaultJobOptions: {
        ...defaultJobOptions,
        timeout: 300000,
      },
    });

    this.syncDocumentsQueue = new Bull(QueueName.SYNC_DOCUMENTS, {
      redis: redisConfig,
      defaultJobOptions: {
        ...defaultJobOptions,
        timeout: 600000, // 10 minutes for document sync
      },
    });

    this.retryQueue = new Bull(QueueName.RETRY_FAILED, {
      redis: redisConfig,
      defaultJobOptions: {
        ...defaultJobOptions,
        attempts: 3,
      },
    });

    // Register processors
    this.registerProcessors();

    // Setup event handlers
    this.setupEventHandlers();

    logger.info('✅ SoftPro queue processor initialized');
  }

  // ============================================================================
  // QUEUE PROCESSORS
  // ============================================================================

  /**
   * Register all queue processors
   */
  private registerProcessors(): void {
    // Webhook event processor
    this.webhookQueue.process(async (job: Job<WebhookEventData>) => {
      return this.processWebhookEvent(job);
    });

    // Sync processors
    this.syncTransactionsQueue.process(async (job: Job<SyncJobData>) => {
      return this.processSyncJob(job, 'transactions');
    });

    this.syncContactsQueue.process(async (job: Job<SyncJobData>) => {
      return this.processSyncJob(job, 'contacts');
    });

    this.syncDocumentsQueue.process(async (job: Job<SyncJobData>) => {
      return this.processSyncJob(job, 'documents');
    });

    // Retry processor
    this.retryQueue.process(async (job: Job<RetryJobData>) => {
      return this.processRetryJob(job);
    });
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(job: Job<WebhookEventData>): Promise<any> {
    const { webhookEventId, integrationId, eventType, payload } = job.data;
    const startTime = Date.now();

    logger.info(`🔄 Processing webhook event: ${webhookEventId} (${eventType})`);

    try {
      // Update status to processing
      await db.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: WebhookEventStatus.PROCESSING,
          processingStartedAt: new Date(),
        },
      });

      // Import service dynamically to avoid circular dependencies
      const { softProWebhookService } = await import('../services/softpro-webhook.service');

      // Route to appropriate handler based on event type
      switch (eventType) {
        case WebhookEventType.TRANSACTION_CREATED:
          await softProWebhookService.handleTransactionCreated(integrationId, payload.data);
          break;

        case WebhookEventType.TRANSACTION_UPDATED:
          await softProWebhookService.handleTransactionUpdated(integrationId, payload.data);
          break;

        case WebhookEventType.DOCUMENT_UPLOADED:
        case WebhookEventType.DOCUMENT_UPDATED:
          await softProWebhookService.handleDocumentUploaded(integrationId, payload.data);
          break;

        case WebhookEventType.TRANSACTION_STATUS_CHANGED:
          await softProWebhookService.handleStatusChanged(integrationId, payload.data);
          break;

        case WebhookEventType.CONTACT_CREATED:
        case WebhookEventType.CONTACT_UPDATED:
          await softProWebhookService.handleContactUpdated(integrationId, payload.data);
          break;

        default:
          logger.warn(`⚠️ Unhandled event type: ${eventType}`);
      }

      const processingTime = Date.now() - startTime;

      // Update status to completed
      await db.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: WebhookEventStatus.COMPLETED,
          processedAt: new Date(),
          processingTimeMs: processingTime,
        },
      });

      logger.info(`✅ Webhook event processed: ${webhookEventId} (${processingTime}ms)`);

      return {
        success: true,
        webhookEventId,
        eventType,
        processingTime,
      };
    } catch (error: any) {
      logger.error(`❌ Error processing webhook event ${webhookEventId}:`, error);

      // Update status to failed
      await db.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: WebhookEventStatus.FAILED,
          error: error.message,
          failedAt: new Date(),
        },
      });

      throw error; // Bull will handle retry
    }
  }

  /**
   * Process sync job
   */
  async processSyncJob(
    job: Job<SyncJobData>,
    syncType: 'transactions' | 'contacts' | 'documents'
  ): Promise<any> {
    const { integrationId, lastSyncTime, batchSize = 100, options = {} } = job.data;
    const startTime = Date.now();

    logger.info(`📥 Processing sync job: ${syncType} for integration ${integrationId}`);

    try {
      // Get integration
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.active) {
        throw new Error(`Integration not active: ${integrationId}`);
      }

      let recordsSynced = 0;

      // Import SoftPro API service
      const { softProApiService } = await import('../services/softpro-api.service');

      switch (syncType) {
        case 'transactions':
          // Fetch transactions from SoftPro API
          const transactions = await softProApiService.getTransactions(integration, {
            since: lastSyncTime,
            limit: batchSize,
            ...options,
          });

          // Bulk upsert transactions
          for (const transaction of transactions) {
            await db.transaction.upsert({
              where: {
                integrationId_externalId: {
                  integrationId,
                  externalId: transaction.id,
                },
              },
              create: {
                externalId: transaction.id,
                integrationId,
                fileNumber: transaction.file_number,
                propertyAddress: transaction.property?.address,
                closingDate: transaction.closing_date
                  ? new Date(transaction.closing_date)
                  : null,
                status: transaction.status,
                transactionType: transaction.type,
                metadata: transaction,
              },
              update: {
                fileNumber: transaction.file_number,
                propertyAddress: transaction.property?.address,
                closingDate: transaction.closing_date
                  ? new Date(transaction.closing_date)
                  : null,
                status: transaction.status,
                transactionType: transaction.type,
                metadata: transaction,
                updatedAt: new Date(),
              },
            });
          }

          recordsSynced = transactions.length;
          break;

        case 'contacts':
          // Fetch contacts from SoftPro API
          const contacts = await softProApiService.getContacts(integration, {
            since: lastSyncTime,
            limit: batchSize,
            ...options,
          });

          // Bulk upsert contacts
          for (const contact of contacts) {
            await db.contact.upsert({
              where: {
                integrationId_externalId: {
                  integrationId,
                  externalId: contact.id,
                },
              },
              create: {
                externalId: contact.id,
                integrationId,
                firstName: contact.first_name,
                lastName: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                role: contact.role || contact.type,
                company: contact.company,
                metadata: contact,
              },
              update: {
                firstName: contact.first_name,
                lastName: contact.last_name,
                email: contact.email,
                phone: contact.phone,
                role: contact.role || contact.type,
                company: contact.company,
                metadata: contact,
                updatedAt: new Date(),
              },
            });
          }

          recordsSynced = contacts.length;
          break;

        case 'documents':
          // Fetch documents from SoftPro API
          const documents = await softProApiService.getDocuments(integration, {
            since: lastSyncTime,
            limit: batchSize,
            ...options,
          });

          // Create document records
          for (const document of documents) {
            await db.document.upsert({
              where: {
                integrationId_externalId: {
                  integrationId,
                  externalId: document.id,
                },
              },
              create: {
                externalId: document.id,
                integrationId,
                transactionId: document.transaction_id,
                fileName: document.name || document.filename,
                fileType: document.type || document.mime_type,
                fileSize: document.size,
                documentType: document.document_type || document.category,
                uploadedAt: document.uploaded_at ? new Date(document.uploaded_at) : new Date(),
                metadata: document,
              },
              update: {
                fileName: document.name || document.filename,
                fileType: document.type || document.mime_type,
                fileSize: document.size,
                documentType: document.document_type || document.category,
                metadata: document,
                updatedAt: new Date(),
              },
            });
          }

          recordsSynced = documents.length;
          break;
      }

      // Update integration last sync time
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'COMPLETED',
        },
      });

      const processingTime = Date.now() - startTime;

      logger.info(
        `✅ Sync completed: ${syncType} - ${recordsSynced} records (${processingTime}ms)`
      );

      return {
        success: true,
        syncType,
        recordsSynced,
        processingTime,
      };
    } catch (error: any) {
      logger.error(`❌ Error processing sync job:`, error);

      // Update integration sync status
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'FAILED',
          lastSyncError: error.message,
        },
      });

      throw error;
    }
  }

  /**
   * Process retry job
   */
  async processRetryJob(job: Job<RetryJobData>): Promise<any> {
    const { webhookEventId, retryCount, originalJobId } = job.data;

    logger.info(`🔄 Retrying webhook event: ${webhookEventId} (attempt ${retryCount})`);

    try {
      // Get original webhook event
      const event = await db.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });

      if (!event) {
        throw new Error(`Webhook event not found: ${webhookEventId}`);
      }

      // Re-queue webhook event with higher priority
      await this.addWebhookEvent({
        webhookEventId: event.id,
        integrationId: event.integrationId,
        eventType: event.eventType as WebhookEventType,
        payload: event.payload,
        priority: 1, // High priority for retries
      });

      logger.info(`✅ Retry queued: ${webhookEventId}`);

      return {
        success: true,
        webhookEventId,
        retryCount,
      };
    } catch (error: any) {
      logger.error(`❌ Error processing retry job:`, error);
      throw error;
    }
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Add webhook event to queue
   */
  async addWebhookEvent(data: WebhookEventData): Promise<Job<WebhookEventData>> {
    try {
      const job = await this.webhookQueue.add(data, {
        priority: data.priority,
        jobId: data.webhookEventId,
      });

      logger.info(`📨 Webhook event queued: ${data.webhookEventId} (priority: ${data.priority})`);
      return job;
    } catch (error) {
      logger.error('Error queueing webhook event:', error);
      throw error;
    }
  }

  /**
   * Add sync job to queue
   */
  async addSyncJob(data: SyncJobData): Promise<Job<SyncJobData>> {
    try {
      let queue: Bull.Queue<SyncJobData>;

      switch (data.syncType) {
        case 'transactions':
          queue = this.syncTransactionsQueue;
          break;
        case 'contacts':
          queue = this.syncContactsQueue;
          break;
        case 'documents':
          queue = this.syncDocumentsQueue;
          break;
        default:
          throw new Error(`Unknown sync type: ${data.syncType}`);
      }

      const job = await queue.add(data, {
        priority: 3,
      });

      logger.info(`📥 Sync job queued: ${data.syncType} for integration ${data.integrationId}`);
      return job;
    } catch (error) {
      logger.error('Error queueing sync job:', error);
      throw error;
    }
  }

  /**
   * Add retry job to queue
   */
  async addRetryJob(webhookEventId: string, delay: number = 0): Promise<Job<RetryJobData>> {
    try {
      const event = await db.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });

      if (!event) {
        throw new Error(`Event not found: ${webhookEventId}`);
      }

      const job = await this.retryQueue.add(
        {
          originalJobId: event.id,
          webhookEventId,
          retryCount: event.retryCount + 1,
          error: event.error || '',
        },
        {
          delay,
        }
      );

      logger.info(`🔄 Retry job queued: ${webhookEventId} (delay: ${delay}ms)`);
      return job;
    } catch (error) {
      logger.error('Error queueing retry job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<QueueStats[]> {
    try {
      const queues = [
        { name: QueueName.WEBHOOK_EVENTS, queue: this.webhookQueue },
        { name: QueueName.SYNC_TRANSACTIONS, queue: this.syncTransactionsQueue },
        { name: QueueName.SYNC_CONTACTS, queue: this.syncContactsQueue },
        { name: QueueName.SYNC_DOCUMENTS, queue: this.syncDocumentsQueue },
        { name: QueueName.RETRY_FAILED, queue: this.retryQueue },
      ];

      const stats = await Promise.all(
        queues.map(async ({ name, queue }) => {
          const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
            queue.isPaused(),
          ]);

          return {
            queueName: name,
            waiting,
            active,
            completed,
            failed,
            delayed,
            paused,
          };
        })
      );

      return stats;
    } catch (error) {
      logger.error('Error getting queue stats:', error);
      throw error;
    }
  }

  /**
   * Get failed jobs
   */
  async getFailedJobs(limit: number = 100): Promise<Job[]> {
    try {
      const failedJobs = await this.webhookQueue.getFailed(0, limit);
      return failedJobs;
    } catch (error) {
      logger.error('Error getting failed jobs:', error);
      throw error;
    }
  }

  /**
   * Retry all failed jobs
   */
  async retryFailedJobs(): Promise<number> {
    try {
      const failedJobs = await this.webhookQueue.getFailed();
      let retriedCount = 0;

      for (const job of failedJobs) {
        try {
          await job.retry();
          retriedCount++;
        } catch (error) {
          logger.error(`Error retrying job ${job.id}:`, error);
        }
      }

      logger.info(`🔄 Retried ${retriedCount} failed jobs`);
      return retriedCount;
    } catch (error) {
      logger.error('Error retrying failed jobs:', error);
      throw error;
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Setup queue event handlers
   */
  private setupEventHandlers(): void {
    // Webhook queue events
    this.webhookQueue.on('completed', (job, result) => {
      logger.info(`✅ Webhook job completed: ${job.id}`);
    });

    this.webhookQueue.on('failed', (job, err) => {
      logger.error(`❌ Webhook job failed: ${job?.id}`, err);
    });

    this.webhookQueue.on('stalled', (job) => {
      logger.warn(`⚠️ Webhook job stalled: ${job.id}`);
    });

    // Sync queue events
    const syncQueues = [
      this.syncTransactionsQueue,
      this.syncContactsQueue,
      this.syncDocumentsQueue,
    ];

    syncQueues.forEach((queue) => {
      queue.on('completed', (job, result) => {
        logger.info(`✅ Sync job completed: ${job.id} - ${result.recordsSynced} records`);
      });

      queue.on('failed', (job, err) => {
        logger.error(`❌ Sync job failed: ${job?.id}`, err);
      });
    });

    // Global error handler
    [this.webhookQueue, ...syncQueues, this.retryQueue].forEach((queue) => {
      queue.on('error', (error) => {
        logger.error(`Queue error:`, error);
      });
    });
  }

  /**
   * Graceful shutdown
   */
  async close(): Promise<void> {
    try {
      await Promise.all([
        this.webhookQueue.close(),
        this.syncTransactionsQueue.close(),
        this.syncContactsQueue.close(),
        this.syncDocumentsQueue.close(),
        this.retryQueue.close(),
      ]);

      logger.info('✅ All queues closed gracefully');
    } catch (error) {
      logger.error('❌ Error closing queues:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const softProQueueProcessor = new SoftProQueueProcessor();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('📭 SIGTERM received, closing queue processor...');
  await softProQueueProcessor.close();
  process.exit(0);
});
