/**
 * Webhook Service
 * Processes SendGrid webhook events for real-time email engagement tracking
 *
 * Features:
 * - Async event processing (non-blocking)
 * - Batch database operations
 * - Redis caching for performance
 * - Engagement score calculation
 * - Suppression list management
 */

import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import { EmailEventType, BounceType, SubscriberStatus, SuppressionReason } from '@prisma/client';

const logger = createLogger('webhook-service');

// ============================================================================
// INTERFACES
// ============================================================================

export interface WebhookEvent {
  event: string;
  email: string;
  timestamp: number;
  sg_message_id?: string;
  sg_event_id?: string;
  campaignId?: string;
  subscriberId?: string;
  url?: string;
  bounce_classification?: string;
  reason?: string;
  ip?: string;
  useragent?: string;
  category?: string[];
  asm_group_id?: number;
}

// ============================================================================
// WEBHOOK SERVICE
// ============================================================================

export class WebhookService {
  /**
   * Process SendGrid webhook event asynchronously
   * @param event - SendGrid event data
   */
  async processEvent(event: WebhookEvent): Promise<void> {
    try {
      logger.info(`Processing webhook event: ${event.event} for ${event.email}`);

      // Extract custom args from event
      const { campaignId, subscriberId } = await this.extractCustomArgs(event);

      if (!subscriberId) {
        logger.warn(`No subscriber ID found for email: ${event.email}`);
        return;
      }

      // Route to appropriate handler
      switch (event.event) {
        case 'delivered':
          await this.handleDelivered(event, subscriberId, campaignId);
          break;
        case 'open':
          await this.handleOpen(event, subscriberId, campaignId);
          break;
        case 'click':
          await this.handleClick(event, subscriberId, campaignId);
          break;
        case 'bounce':
          await this.handleBounce(event, subscriberId, campaignId);
          break;
        case 'dropped':
          await this.handleDropped(event, subscriberId, campaignId);
          break;
        case 'deferred':
          await this.handleDeferred(event, subscriberId, campaignId);
          break;
        case 'unsubscribe':
          await this.handleUnsubscribe(event, subscriberId, campaignId);
          break;
        case 'spamreport':
          await this.handleSpamReport(event, subscriberId, campaignId);
          break;
        default:
          logger.warn(`Unknown event type: ${event.event}`);
      }

      logger.info(`✅ Successfully processed ${event.event} event for ${event.email}`);
    } catch (error) {
      logger.error(`❌ Error processing webhook event:`, error);
      throw error;
    }
  }

  /**
   * Extract custom arguments from webhook event
   */
  private async extractCustomArgs(event: WebhookEvent): Promise<{
    campaignId?: string;
    subscriberId?: string;
  }> {
    // Check if custom args are in the event
    if (event.campaignId && event.subscriberId) {
      return {
        campaignId: event.campaignId,
        subscriberId: event.subscriberId,
      };
    }

    // Try to find subscriber by email
    const subscriber = await this.getSubscriberByEmail(event.email);

    return {
      subscriberId: subscriber?.id,
      campaignId: event.campaignId,
    };
  }

  /**
   * Get subscriber by email (with Redis caching)
   */
  private async getSubscriberByEmail(email: string): Promise<{ id: string } | null> {
    const cacheKey = `subscriber:email:${email.toLowerCase()}`;

    try {
      // Try cache first
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Query database
      const subscriber = await db.emailSubscriber.findFirst({
        where: { email: email.toLowerCase() },
        select: { id: true },
      });

      if (subscriber) {
        // Cache for 1 hour
        await redis.setex(cacheKey, 3600, JSON.stringify(subscriber));
      }

      return subscriber;
    } catch (error) {
      logger.error('Error fetching subscriber:', error);
      return null;
    }
  }

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  /**
   * Handle delivered event
   */
  private async handleDelivered(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.DELIVERED,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          eventTimestamp: new Date(event.timestamp * 1000),
          ipAddress: event.ip,
          userAgent: event.useragent,
        },
      })
    );

    // Update queue status
    if (event.sg_message_id) {
      operations.push(
        db.emailQueue.updateMany({
          where: { messageId: event.sg_message_id },
          data: {
            status: 'SENT',
            sentAt: new Date(event.timestamp * 1000),
          },
        })
      );
    }

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: { deliveredCount: { increment: 1 } },
        })
      );
    }

    await Promise.all(operations);
  }

  /**
   * Handle email open event
   */
  private async handleOpen(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    // Check if this is a unique open (Redis for deduplication)
    const isUnique = await this.isUniqueEvent(
      `open:${subscriberId}:${campaignId}`,
      24 * 60 * 60 // 24 hours
    );

    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.OPENED,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          eventTimestamp: new Date(event.timestamp * 1000),
          ipAddress: event.ip,
          userAgent: event.useragent,
        },
      })
    );

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: {
            openCount: { increment: 1 },
            ...(isUnique && { uniqueOpenCount: { increment: 1 } }),
          },
        })
      );
    }

    // Update subscriber engagement
    operations.push(this.updateEngagementScore(subscriberId, 'open'));

    // Update last opened timestamp
    operations.push(
      db.emailSubscriber.update({
        where: { id: subscriberId },
        data: { lastEmailSentAt: new Date(event.timestamp * 1000) },
      })
    );

    await Promise.all(operations);
  }

  /**
   * Handle link click event
   */
  private async handleClick(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    // Check if this is a unique click
    const isUnique = await this.isUniqueEvent(
      `click:${subscriberId}:${campaignId}`,
      24 * 60 * 60 // 24 hours
    );

    const operations = [];

    // Create email event with URL
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.CLICKED,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          linkUrl: event.url,
          eventTimestamp: new Date(event.timestamp * 1000),
          ipAddress: event.ip,
          userAgent: event.useragent,
        },
      })
    );

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: {
            clickCount: { increment: 1 },
            ...(isUnique && { uniqueClickCount: { increment: 1 } }),
          },
        })
      );
    }

    // Update subscriber engagement (clicks are more valuable)
    operations.push(this.updateEngagementScore(subscriberId, 'click'));

    await Promise.all(operations);
  }

  /**
   * Handle bounce event
   */
  private async handleBounce(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    const bounceType = event.bounce_classification === 'hard' ? BounceType.HARD : BounceType.SOFT;

    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.BOUNCED,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          bounceType,
          bounceReason: event.reason,
          eventTimestamp: new Date(event.timestamp * 1000),
        },
      })
    );

    // Update queue status
    if (event.sg_message_id) {
      operations.push(
        db.emailQueue.updateMany({
          where: { messageId: event.sg_message_id },
          data: {
            status: 'FAILED',
            error: event.reason,
            errorCode: 'BOUNCE',
          },
        })
      );
    }

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: { bounceCount: { increment: 1 } },
        })
      );
    }

    // Update subscriber bounce tracking
    operations.push(
      db.emailSubscriber.update({
        where: { id: subscriberId },
        data: {
          bounceCount: { increment: 1 },
          lastBounceAt: new Date(event.timestamp * 1000),
          lastBounceType: bounceType,
          ...(bounceType === BounceType.HARD && {
            status: SubscriberStatus.BOUNCED,
          }),
        },
      })
    );

    // Add to suppression list for hard bounces
    if (bounceType === BounceType.HARD) {
      operations.push(this.addToSuppressionList(event.email, 'HARD_BOUNCE', event.reason));
    }

    await Promise.all(operations);
  }

  /**
   * Handle dropped event
   */
  private async handleDropped(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.DROPPED,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          eventTimestamp: new Date(event.timestamp * 1000),
        },
      })
    );

    // Update queue status
    if (event.sg_message_id) {
      operations.push(
        db.emailQueue.updateMany({
          where: { messageId: event.sg_message_id },
          data: {
            status: 'FAILED',
            error: event.reason,
            errorCode: 'DROPPED',
          },
        })
      );
    }

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: { failedCount: { increment: 1 } },
        })
      );
    }

    await Promise.all(operations);
  }

  /**
   * Handle deferred event
   */
  private async handleDeferred(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    await db.emailEvent.create({
      data: {
        subscriberId,
        campaignId: campaignId || '',
        eventType: EmailEventType.DEFERRED,
        messageId: event.sg_message_id || '',
        recipientEmail: event.email,
        eventTimestamp: new Date(event.timestamp * 1000),
      },
    });
  }

  /**
   * Handle unsubscribe event
   */
  private async handleUnsubscribe(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.UNSUBSCRIBED,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          eventTimestamp: new Date(event.timestamp * 1000),
        },
      })
    );

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: { unsubscribeCount: { increment: 1 } },
        })
      );
    }

    // Update subscriber status
    operations.push(
      db.emailSubscriber.update({
        where: { id: subscriberId },
        data: {
          status: SubscriberStatus.UNSUBSCRIBED,
          unsubscribedAt: new Date(event.timestamp * 1000),
          unsubscribeSource: 'EMAIL_LINK',
        },
      })
    );

    // Create unsubscribe record
    operations.push(
      db.unsubscribeRecord.create({
        data: {
          subscriberId,
          organizationId: '', // Will need to get from subscriber
          campaignId,
          source: 'EMAIL_LINK',
          unsubscribedAt: new Date(event.timestamp * 1000),
        },
      })
    );

    // Update engagement score (negative impact)
    operations.push(this.updateEngagementScore(subscriberId, 'unsubscribe'));

    await Promise.all(operations);
  }

  /**
   * Handle spam report event
   */
  private async handleSpamReport(
    event: WebhookEvent,
    subscriberId: string,
    campaignId?: string
  ): Promise<void> {
    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId: campaignId || '',
          eventType: EmailEventType.SPAM_REPORT,
          messageId: event.sg_message_id || '',
          recipientEmail: event.email,
          eventTimestamp: new Date(event.timestamp * 1000),
        },
      })
    );

    // Update campaign stats
    if (campaignId) {
      operations.push(
        db.emailCampaign.update({
          where: { id: campaignId },
          data: { spamComplaintCount: { increment: 1 } },
        })
      );
    }

    // Update subscriber status
    operations.push(
      db.emailSubscriber.update({
        where: { id: subscriberId },
        data: {
          status: SubscriberStatus.COMPLAINED,
          unsubscribedAt: new Date(event.timestamp * 1000),
          unsubscribeSource: 'SPAM_COMPLAINT',
        },
      })
    );

    // Add to suppression list
    operations.push(this.addToSuppressionList(event.email, 'SPAM_COMPLAINT'));

    // Update engagement score (severe negative impact)
    operations.push(this.updateEngagementScore(subscriberId, 'spam'));

    await Promise.all(operations);
  }

  // ============================================================================
  // TRACKING METHODS
  // ============================================================================

  /**
   * Record email open (from tracking pixel)
   */
  async recordOpen(subscriberId: string, campaignId: string, messageId: string): Promise<void> {
    // Check if this is a unique open
    const isUnique = await this.isUniqueEvent(
      `open:${subscriberId}:${campaignId}`,
      24 * 60 * 60
    );

    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId,
          eventType: EmailEventType.OPENED,
          messageId,
          recipientEmail: '', // Will need to fetch
          eventTimestamp: new Date(),
        },
      })
    );

    // Update campaign stats
    operations.push(
      db.emailCampaign.update({
        where: { id: campaignId },
        data: {
          openCount: { increment: 1 },
          ...(isUnique && { uniqueOpenCount: { increment: 1 } }),
        },
      })
    );

    // Update engagement score
    operations.push(this.updateEngagementScore(subscriberId, 'open'));

    await Promise.all(operations);
  }

  /**
   * Record link click
   */
  async recordClick(
    subscriberId: string,
    campaignId: string,
    messageId: string,
    url: string
  ): Promise<void> {
    // Check if this is a unique click
    const isUnique = await this.isUniqueEvent(
      `click:${subscriberId}:${campaignId}`,
      24 * 60 * 60
    );

    const operations = [];

    // Create email event
    operations.push(
      db.emailEvent.create({
        data: {
          subscriberId,
          campaignId,
          eventType: EmailEventType.CLICKED,
          messageId,
          recipientEmail: '', // Will need to fetch
          linkUrl: url,
          eventTimestamp: new Date(),
        },
      })
    );

    // Update campaign stats
    operations.push(
      db.emailCampaign.update({
        where: { id: campaignId },
        data: {
          clickCount: { increment: 1 },
          ...(isUnique && { uniqueClickCount: { increment: 1 } }),
        },
      })
    );

    // Update engagement score
    operations.push(this.updateEngagementScore(subscriberId, 'click'));

    await Promise.all(operations);
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Check if event is unique (deduplicate using Redis)
   */
  private async isUniqueEvent(key: string, ttl: number): Promise<boolean> {
    try {
      const exists = await redis.get(key);
      if (exists) {
        return false;
      }

      await redis.setex(key, ttl, '1');
      return true;
    } catch (error) {
      logger.error('Redis error in isUniqueEvent:', error);
      return true; // Fail open
    }
  }

  /**
   * Update subscriber engagement score
   *
   * Scoring algorithm:
   * - Open: +5 points (max 50 from opens)
   * - Click: +10 points (max 100 from clicks)
   * - Unsubscribe: -50 points
   * - Spam report: -100 points (set to 0)
   */
  async updateEngagementScore(subscriberId: string, eventType: string): Promise<void> {
    try {
      const scoreChanges: Record<string, number> = {
        open: 5,
        click: 10,
        unsubscribe: -50,
        spam: -100,
      };

      const change = scoreChanges[eventType] || 0;

      // Get current engagement or create if doesn't exist
      const engagement = await db.emailEngagement.upsert({
        where: { subscriberId },
        create: {
          subscriberId,
          organizationId: '', // Will need to fetch
          engagementScore: 50 + change, // Start at 50
          emailsSent: 0,
          emailsOpened: eventType === 'open' ? 1 : 0,
          emailsClicked: eventType === 'click' ? 1 : 0,
          uniqueOpens: eventType === 'open' ? 1 : 0,
          uniqueClicks: eventType === 'click' ? 1 : 0,
        },
        update: {
          engagementScore: {
            increment: change,
          },
          ...(eventType === 'open' && {
            emailsOpened: { increment: 1 },
            uniqueOpens: { increment: 1 },
            lastOpenedAt: new Date(),
          }),
          ...(eventType === 'click' && {
            emailsClicked: { increment: 1 },
            uniqueClicks: { increment: 1 },
            lastClickedAt: new Date(),
          }),
        },
      });

      // Ensure score stays within 0-100 range
      if (engagement.engagementScore < 0) {
        await db.emailEngagement.update({
          where: { id: engagement.id },
          data: { engagementScore: 0 },
        });
      } else if (engagement.engagementScore > 100) {
        await db.emailEngagement.update({
          where: { id: engagement.id },
          data: { engagementScore: 100 },
        });
      }

      // Invalidate cache
      await redis.del(`engagement:${subscriberId}`);
    } catch (error) {
      logger.error('Error updating engagement score:', error);
    }
  }

  /**
   * Add email to suppression list
   */
  private async addToSuppressionList(
    email: string,
    reason: string,
    details?: string
  ): Promise<void> {
    try {
      const emailHash = this.hashEmail(email);

      await db.suppressionList.upsert({
        where: {
          email_organizationId: {
            email: email.toLowerCase(),
            organizationId: null as any, // Global suppression
          },
        },
        create: {
          email: email.toLowerCase(),
          emailHash,
          reason: reason as SuppressionReason,
          reasonDetails: details,
          source: 'webhook',
          scope: 'GLOBAL',
          active: true,
        },
        update: {
          reason: reason as SuppressionReason,
          reasonDetails: details,
          addedAt: new Date(),
        },
      });

      logger.info(`✅ Added ${email} to suppression list: ${reason}`);
    } catch (error) {
      logger.error('Error adding to suppression list:', error);
    }
  }

  /**
   * Hash email for privacy
   */
  private hashEmail(email: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');
  }
}

// Export singleton instance
export const webhookService = new WebhookService();
