/**
 * Email Webhook Handler Service
 *
 * Unified webhook processing for all email providers:
 * - SendGrid
 * - AWS SES
 * - Mailgun
 *
 * Features:
 * - Signature validation
 * - Event normalization
 * - Deduplication
 * - Queue-based processing
 * - Provider failover tracking
 */

import { createLogger } from '../../utils/logger';
import { redis } from '../../config/redis';
import { emailEventQueue } from '../../queues/email-event.queue';
import { SendGridWebhookHandler } from './webhooks/sendgrid-webhook';
import { SESWebhookHandler } from './webhooks/ses-webhook';
import { MailgunWebhookHandler } from './webhooks/mailgun-webhook';

const logger = createLogger('email-webhook-handler');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum EmailProviderType {
  SENDGRID = 'sendgrid',
  AWS_SES = 'ses',
  MAILGUN = 'mailgun'
}

export enum EmailEventType {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  OPENED = 'OPENED',
  CLICKED = 'CLICKED',
  BOUNCED = 'BOUNCED',
  DEFERRED = 'DEFERRED',
  DROPPED = 'DROPPED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  SPAM_REPORT = 'SPAM_REPORT',
  COMPLAINED = 'COMPLAINED',
  FAILED = 'FAILED'
}

export enum BounceType {
  HARD = 'HARD',
  SOFT = 'SOFT',
  TRANSIENT = 'TRANSIENT',
  UNDETERMINED = 'UNDETERMINED'
}

export enum ComplaintType {
  ABUSE = 'ABUSE',
  FRAUD = 'FRAUD',
  NOT_SPAM = 'NOT_SPAM',
  OTHER = 'OTHER'
}

export interface NormalizedEvent {
  // Identification
  emailId?: string;
  campaignId?: string;
  subscriberId?: string;

  // Provider data
  provider: EmailProviderType;
  providerMessageId: string;
  providerEventId?: string;

  // Event details
  eventType: EmailEventType;
  timestamp: Date;
  recipientEmail: string;

  // Optional metadata
  metadata: {
    // Tracking
    ipAddress?: string;
    userAgent?: string;
    device?: string;
    browser?: string;
    location?: {
      country?: string;
      region?: string;
      city?: string;
    };

    // Link tracking
    url?: string;
    linkId?: string;

    // Bounce details
    bounceType?: BounceType;
    bounceReason?: string;
    bounceCode?: string;

    // Complaint details
    complaintType?: ComplaintType;
    complaintFeedbackType?: string;

    // Delivery details
    smtpResponse?: string;
    attemptNumber?: number;

    // Additional provider-specific data
    [key: string]: any;
  };

  // Raw event data for debugging
  rawData: any;
}

export interface WebhookValidationResult {
  valid: boolean;
  reason?: string;
}

// ============================================================================
// EMAIL WEBHOOK HANDLER SERVICE
// ============================================================================

export class EmailWebhookHandler {
  private sendGridHandler: SendGridWebhookHandler;
  private sesHandler: SESWebhookHandler;
  private mailgunHandler: MailgunWebhookHandler;

  // Deduplication cache TTL (24 hours)
  private readonly DEDUP_TTL = 24 * 60 * 60;

  constructor() {
    this.sendGridHandler = new SendGridWebhookHandler();
    this.sesHandler = new SESWebhookHandler();
    this.mailgunHandler = new MailgunWebhookHandler();
  }

  /**
   * Process webhook from any provider
   *
   * @param provider - Email provider type
   * @param payload - Raw webhook payload
   * @param signature - Webhook signature for validation
   * @param headers - Request headers for additional validation
   * @returns Processing result
   */
  async processWebhook(
    provider: EmailProviderType,
    payload: any,
    signature: string,
    headers: Record<string, string | string[]>
  ): Promise<{ success: boolean; processed: number; errors: string[] }> {
    const startTime = Date.now();
    logger.info(`📥 Processing webhook from ${provider}`);

    try {
      // Validate webhook signature
      const validation = await this.validateSignature(provider, payload, signature, headers);
      if (!validation.valid) {
        logger.error(`❌ Invalid webhook signature from ${provider}: ${validation.reason}`);
        return {
          success: false,
          processed: 0,
          errors: [`Invalid signature: ${validation.reason}`]
        };
      }

      // Normalize events based on provider
      const normalizedEvents = await this.normalizeEvents(provider, payload);
      logger.info(`📊 Normalized ${normalizedEvents.length} events from ${provider}`);

      // Process events with deduplication
      const results = await Promise.allSettled(
        normalizedEvents.map(event => this.processEvent(event))
      );

      // Collect errors
      const errors: string[] = [];
      let processed = 0;

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          processed++;
        } else {
          errors.push(`Event ${index}: ${result.reason}`);
          logger.error(`Failed to process event ${index}:`, result.reason);
        }
      });

      const duration = Date.now() - startTime;
      logger.info(
        `✅ Processed ${processed}/${normalizedEvents.length} events from ${provider} in ${duration}ms`
      );

      return {
        success: errors.length === 0,
        processed,
        errors
      };

    } catch (error: any) {
      logger.error(`❌ Error processing webhook from ${provider}:`, error);
      return {
        success: false,
        processed: 0,
        errors: [error.message]
      };
    }
  }

  /**
   * Validate webhook signature based on provider
   */
  private async validateSignature(
    provider: EmailProviderType,
    payload: any,
    signature: string,
    headers: Record<string, string | string[]>
  ): Promise<WebhookValidationResult> {
    try {
      switch (provider) {
        case EmailProviderType.SENDGRID:
          return await this.sendGridHandler.validateSignature(payload, signature, headers);

        case EmailProviderType.AWS_SES:
          return await this.sesHandler.validateSignature(payload, signature, headers);

        case EmailProviderType.MAILGUN:
          return await this.mailgunHandler.validateSignature(payload, signature, headers);

        default:
          return {
            valid: false,
            reason: `Unknown provider: ${provider}`
          };
      }
    } catch (error: any) {
      logger.error(`Error validating signature for ${provider}:`, error);
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  /**
   * Normalize events across providers
   */
  private async normalizeEvents(
    provider: EmailProviderType,
    payload: any
  ): Promise<NormalizedEvent[]> {
    try {
      switch (provider) {
        case EmailProviderType.SENDGRID:
          return this.sendGridHandler.parseEvents(payload);

        case EmailProviderType.AWS_SES:
          return this.sesHandler.parseEvents(payload);

        case EmailProviderType.MAILGUN:
          return this.mailgunHandler.parseEvents(payload);

        default:
          throw new Error(`Unknown provider: ${provider}`);
      }
    } catch (error: any) {
      logger.error(`Error normalizing events for ${provider}:`, error);
      throw error;
    }
  }

  /**
   * Process individual normalized event
   */
  private async processEvent(event: NormalizedEvent): Promise<void> {
    try {
      // Check for duplicate event
      const isDuplicate = await this.isDuplicateEvent(event);
      if (isDuplicate) {
        logger.debug(`⏭️ Skipping duplicate event: ${event.providerEventId || event.providerMessageId}`);
        return;
      }

      // Mark event as processed (for deduplication)
      await this.markEventProcessed(event);

      // Queue event for async processing
      await this.queueEvent(event);

      logger.debug(`✅ Queued event: ${event.eventType} for ${event.recipientEmail}`);

    } catch (error: any) {
      logger.error(`❌ Failed to process event:`, error);
      throw error;
    }
  }

  /**
   * Check if event has already been processed (deduplication)
   */
  private async isDuplicateEvent(event: NormalizedEvent): Promise<boolean> {
    try {
      const dedupeKey = this.getDeduplicationKey(event);
      const exists = await redis.get(dedupeKey);
      return exists !== null;
    } catch (error) {
      logger.error('Error checking duplicate event:', error);
      return false; // Fail open - process event anyway
    }
  }

  /**
   * Mark event as processed in cache
   */
  private async markEventProcessed(event: NormalizedEvent): Promise<void> {
    try {
      const dedupeKey = this.getDeduplicationKey(event);
      await redis.setex(dedupeKey, this.DEDUP_TTL, '1');
    } catch (error) {
      logger.error('Error marking event as processed:', error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Generate deduplication key for event
   */
  private getDeduplicationKey(event: NormalizedEvent): string {
    const eventId = event.providerEventId || event.providerMessageId;
    return `email:event:${event.provider}:${eventId}:${event.eventType}:${event.timestamp.getTime()}`;
  }

  /**
   * Queue event for async processing by worker
   */
  private async queueEvent(event: NormalizedEvent): Promise<void> {
    try {
      await emailEventQueue.add('process-email-event', event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: 1000, // Keep last 1000 completed
        removeOnFail: false // Keep failed for debugging
      });
    } catch (error) {
      logger.error('Error queuing event:', error);
      throw error;
    }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(provider?: EmailProviderType): Promise<any> {
    try {
      const stats: any = {
        timestamp: new Date().toISOString()
      };

      // Get queue stats
      const queueStats = await emailEventQueue.getJobCounts();
      stats.queue = queueStats;

      // Get provider-specific stats if requested
      if (provider) {
        // Count events by provider in cache
        const pattern = `email:event:${provider}:*`;
        const keys = await redis.keys(pattern);
        stats.recentEvents = keys.length;
      }

      return stats;
    } catch (error) {
      logger.error('Error getting webhook stats:', error);
      throw error;
    }
  }

  /**
   * Clear deduplication cache (for testing)
   */
  async clearDeduplicationCache(): Promise<void> {
    try {
      const pattern = 'email:event:*';
      const keys = await redis.keys(pattern);

      if (keys.length > 0) {
        await redis.del(...keys);
        logger.info(`🧹 Cleared ${keys.length} deduplication cache entries`);
      }
    } catch (error) {
      logger.error('Error clearing deduplication cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const emailWebhookHandler = new EmailWebhookHandler();
