/**
 * Email Event Processor Worker
 *
 * Processes email events from the webhook queue
 * Handles:
 * - Email status updates
 * - Analytics updates
 * - Engagement score calculation
 * - Suppression list management
 * - Real-time notifications
 */

import { Job } from 'bull';
import { emailEventQueue } from '../queues/email-event.queue';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import {
  NormalizedEvent,
  EmailEventType,
  BounceType
} from '../services/email/webhook-handler.service';
import { SubscriberStatus, SuppressionReason, EmailStatus } from '@prisma/client';

const logger = createLogger('email-event-processor');

/**
 * Process email event from webhook
 */
emailEventQueue.process('process-email-event', async (job: Job<NormalizedEvent>) => {
  const event = job.data;
  const startTime = Date.now();

  try {
    logger.info(`🔄 Processing ${event.eventType} event for ${event.recipientEmail}`);

    // Find email record by message ID
    let email = await findEmailByMessageId(event.providerMessageId);

    // If not found, try to find by campaign and subscriber
    if (!email && event.campaignId && event.subscriberId) {
      email = await findEmailByCampaignSubscriber(event.campaignId, event.subscriberId);
    }

    if (!email) {
      logger.warn(`⚠️ Email record not found for message ID: ${event.providerMessageId}`);
      // Don't fail the job - event might be for an email we don't track
      return { success: true, skipped: true };
    }

    // Update email status
    await updateEmailStatus(email.id, event);

    // Create event record
    await createEventRecord(email.id, event);

    // Update campaign analytics
    if (email.campaignId) {
      await updateCampaignAnalytics(email.campaignId, event);
    }

    // Update subscriber engagement
    if (email.subscriberId) {
      await updateSubscriberEngagement(email.subscriberId, event);
    }

    // Handle special cases
    await handleSpecialCases(email, event);

    // Broadcast real-time update (if applicable)
    if (email.organizationId) {
      await broadcastUpdate(email.organizationId, email.id, event);
    }

    const duration = Date.now() - startTime;
    logger.info(`✅ Processed ${event.eventType} event in ${duration}ms`);

    return {
      success: true,
      emailId: email.id,
      duration
    };

  } catch (error: any) {
    logger.error(`❌ Failed to process event:`, error);
    throw error; // Will trigger Bull retry
  }
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Find email by provider message ID
 */
async function findEmailByMessageId(messageId: string): Promise<any | null> {
  try {
    return await db.emailQueue.findFirst({
      where: {
        OR: [
          { messageId },
          { id: messageId } // Fallback to queue item ID
        ]
      },
      include: {
        campaign: true
      }
    });
  } catch (error) {
    logger.error('Error finding email by message ID:', error);
    return null;
  }
}

/**
 * Find email by campaign and subscriber
 */
async function findEmailByCampaignSubscriber(
  campaignId: string,
  subscriberId: string
): Promise<any | null> {
  try {
    return await db.emailQueue.findFirst({
      where: {
        campaignId,
        subscriberId
      },
      orderBy: { createdAt: 'desc' }, // Get most recent
      include: {
        campaign: true
      }
    });
  } catch (error) {
    logger.error('Error finding email by campaign/subscriber:', error);
    return null;
  }
}

/**
 * Update email status based on event
 */
async function updateEmailStatus(emailId: string, event: NormalizedEvent): Promise<void> {
  try {
    const statusMap: Record<EmailEventType, EmailStatus> = {
      [EmailEventType.QUEUED]: EmailStatus.QUEUED,
      [EmailEventType.SENT]: EmailStatus.SENT,
      [EmailEventType.DELIVERED]: EmailStatus.SENT,
      [EmailEventType.OPENED]: EmailStatus.SENT,
      [EmailEventType.CLICKED]: EmailStatus.SENT,
      [EmailEventType.BOUNCED]: EmailStatus.FAILED,
      [EmailEventType.DEFERRED]: EmailStatus.QUEUED,
      [EmailEventType.DROPPED]: EmailStatus.FAILED,
      [EmailEventType.UNSUBSCRIBED]: EmailStatus.SENT,
      [EmailEventType.SPAM_REPORT]: EmailStatus.FAILED,
      [EmailEventType.COMPLAINED]: EmailStatus.FAILED,
      [EmailEventType.FAILED]: EmailStatus.FAILED
    };

    const status = statusMap[event.eventType];

    await db.emailQueue.update({
      where: { id: emailId },
      data: {
        status,
        ...(event.eventType === EmailEventType.DELIVERED && { sentAt: event.timestamp }),
        ...(event.eventType === EmailEventType.BOUNCED && {
          error: event.metadata.bounceReason,
          errorCode: event.metadata.bounceCode
        }),
        ...(event.eventType === EmailEventType.DROPPED && {
          error: event.metadata.bounceReason
        })
      }
    });

  } catch (error) {
    logger.error('Error updating email status:', error);
    throw error;
  }
}

/**
 * Create event record in database
 */
async function createEventRecord(emailId: string, event: NormalizedEvent): Promise<void> {
  try {
    await db.emailEvent.create({
      data: {
        subscriberId: event.subscriberId || '',
        campaignId: event.campaignId || '',
        eventType: event.eventType,
        messageId: event.providerMessageId,
        recipientEmail: event.recipientEmail,
        eventTimestamp: event.timestamp,
        ipAddress: event.metadata.ipAddress,
        userAgent: event.metadata.userAgent,
        linkUrl: event.metadata.url,
        bounceType: event.metadata.bounceType as any,
        bounceReason: event.metadata.bounceReason,
        metadata: event.metadata as any
      }
    });

  } catch (error) {
    logger.error('Error creating event record:', error);
    throw error;
  }
}

/**
 * Update campaign analytics
 */
async function updateCampaignAnalytics(
  campaignId: string,
  event: NormalizedEvent
): Promise<void> {
  try {
    const updateData: any = {};

    switch (event.eventType) {
      case EmailEventType.SENT:
        updateData.sentCount = { increment: 1 };
        break;
      case EmailEventType.DELIVERED:
        updateData.deliveredCount = { increment: 1 };
        break;
      case EmailEventType.OPENED:
        updateData.openCount = { increment: 1 };
        // Check if unique open
        const isUniqueOpen = await isUniqueEvent(
          `open:${event.subscriberId}:${campaignId}`,
          24 * 60 * 60
        );
        if (isUniqueOpen) {
          updateData.uniqueOpenCount = { increment: 1 };
        }
        break;
      case EmailEventType.CLICKED:
        updateData.clickCount = { increment: 1 };
        // Check if unique click
        const isUniqueClick = await isUniqueEvent(
          `click:${event.subscriberId}:${campaignId}`,
          24 * 60 * 60
        );
        if (isUniqueClick) {
          updateData.uniqueClickCount = { increment: 1 };
        }
        break;
      case EmailEventType.BOUNCED:
        updateData.bounceCount = { increment: 1 };
        break;
      case EmailEventType.UNSUBSCRIBED:
        updateData.unsubscribeCount = { increment: 1 };
        break;
      case EmailEventType.SPAM_REPORT:
      case EmailEventType.COMPLAINED:
        updateData.spamComplaintCount = { increment: 1 };
        break;
      case EmailEventType.FAILED:
      case EmailEventType.DROPPED:
        updateData.failedCount = { increment: 1 };
        break;
    }

    if (Object.keys(updateData).length > 0) {
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: updateData
      });
    }

  } catch (error) {
    logger.error('Error updating campaign analytics:', error);
    // Don't throw - analytics update failure shouldn't fail the job
  }
}

/**
 * Update subscriber engagement
 */
async function updateSubscriberEngagement(
  subscriberId: string,
  event: NormalizedEvent
): Promise<void> {
  try {
    const scoreChanges: Record<EmailEventType, number> = {
      [EmailEventType.OPENED]: 5,
      [EmailEventType.CLICKED]: 10,
      [EmailEventType.UNSUBSCRIBED]: -50,
      [EmailEventType.SPAM_REPORT]: -100,
      [EmailEventType.COMPLAINED]: -100,
      [EmailEventType.BOUNCED]: -20,
      [EmailEventType.QUEUED]: 0,
      [EmailEventType.SENT]: 0,
      [EmailEventType.DELIVERED]: 0,
      [EmailEventType.DEFERRED]: 0,
      [EmailEventType.DROPPED]: 0,
      [EmailEventType.FAILED]: 0
    };

    const scoreChange = scoreChanges[event.eventType] || 0;

    if (scoreChange !== 0) {
      await db.emailEngagement.upsert({
        where: { subscriberId },
        create: {
          subscriberId,
          organizationId: '', // Will need to fetch
          engagementScore: Math.max(0, Math.min(100, 50 + scoreChange)),
          emailsSent: 0,
          emailsOpened: event.eventType === EmailEventType.OPENED ? 1 : 0,
          emailsClicked: event.eventType === EmailEventType.CLICKED ? 1 : 0,
          uniqueOpens: event.eventType === EmailEventType.OPENED ? 1 : 0,
          uniqueClicks: event.eventType === EmailEventType.CLICKED ? 1 : 0,
          lastOpenedAt: event.eventType === EmailEventType.OPENED ? event.timestamp : null,
          lastClickedAt: event.eventType === EmailEventType.CLICKED ? event.timestamp : null
        },
        update: {
          engagementScore: {
            increment: scoreChange
          },
          ...(event.eventType === EmailEventType.OPENED && {
            emailsOpened: { increment: 1 },
            lastOpenedAt: event.timestamp
          }),
          ...(event.eventType === EmailEventType.CLICKED && {
            emailsClicked: { increment: 1 },
            lastClickedAt: event.timestamp
          })
        }
      });

      // Ensure score stays within 0-100
      const engagement = await db.emailEngagement.findUnique({
        where: { subscriberId }
      });

      if (engagement) {
        if (engagement.engagementScore < 0) {
          await db.emailEngagement.update({
            where: { id: engagement.id },
            data: { engagementScore: 0 }
          });
        } else if (engagement.engagementScore > 100) {
          await db.emailEngagement.update({
            where: { id: engagement.id },
            data: { engagementScore: 100 }
          });
        }
      }
    }

  } catch (error) {
    logger.error('Error updating subscriber engagement:', error);
    // Don't throw - engagement update failure shouldn't fail the job
  }
}

/**
 * Handle special cases (bounces, complaints, unsubscribes)
 */
async function handleSpecialCases(email: any, event: NormalizedEvent): Promise<void> {
  try {
    switch (event.eventType) {
      case EmailEventType.BOUNCED:
        await handleBounce(email, event);
        break;

      case EmailEventType.SPAM_REPORT:
      case EmailEventType.COMPLAINED:
        await handleComplaint(email, event);
        break;

      case EmailEventType.UNSUBSCRIBED:
        await handleUnsubscribe(email, event);
        break;
    }
  } catch (error) {
    logger.error('Error handling special case:', error);
    // Don't throw - special case handling failure shouldn't fail the job
  }
}

/**
 * Handle bounce event
 */
async function handleBounce(email: any, event: NormalizedEvent): Promise<void> {
  if (!email.subscriberId) return;

  // Update subscriber bounce tracking
  await db.emailSubscriber.update({
    where: { id: email.subscriberId },
    data: {
      bounceCount: { increment: 1 },
      lastBounceAt: event.timestamp,
      lastBounceType: event.metadata.bounceType as any,
      ...(event.metadata.bounceType === BounceType.HARD && {
        status: SubscriberStatus.BOUNCED
      })
    }
  });

  // Add to suppression list for hard bounces
  if (event.metadata.bounceType === BounceType.HARD) {
    await addToSuppressionList(
      event.recipientEmail,
      SuppressionReason.HARD_BOUNCE,
      event.metadata.bounceReason,
      email.campaign?.organizationId
    );
  }
}

/**
 * Handle complaint/spam report
 */
async function handleComplaint(email: any, event: NormalizedEvent): Promise<void> {
  if (!email.subscriberId) return;

  // Update subscriber status
  await db.emailSubscriber.update({
    where: { id: email.subscriberId },
    data: {
      status: SubscriberStatus.COMPLAINED,
      unsubscribedAt: event.timestamp,
      unsubscribeSource: 'SPAM_COMPLAINT'
    }
  });

  // Create unsubscribe record
  if (email.campaignId) {
    await db.unsubscribeRecord.create({
      data: {
        subscriberId: email.subscriberId,
        organizationId: email.campaign?.organizationId || '',
        campaignId: email.campaignId,
        reason: 'Spam complaint',
        source: 'SPAM_COMPLAINT',
        unsubscribedAt: event.timestamp
      }
    });
  }

  // Add to suppression list
  await addToSuppressionList(
    event.recipientEmail,
    SuppressionReason.SPAM_COMPLAINT,
    'Spam report',
    email.campaign?.organizationId
  );
}

/**
 * Handle unsubscribe event
 */
async function handleUnsubscribe(email: any, event: NormalizedEvent): Promise<void> {
  if (!email.subscriberId) return;

  // Update subscriber status
  await db.emailSubscriber.update({
    where: { id: email.subscriberId },
    data: {
      status: SubscriberStatus.UNSUBSCRIBED,
      unsubscribedAt: event.timestamp,
      unsubscribeSource: 'EMAIL_LINK'
    }
  });

  // Create unsubscribe record
  if (email.campaignId) {
    await db.unsubscribeRecord.create({
      data: {
        subscriberId: email.subscriberId,
        organizationId: email.campaign?.organizationId || '',
        campaignId: email.campaignId,
        reason: 'User unsubscribed',
        source: 'EMAIL_LINK',
        unsubscribedAt: event.timestamp
      }
    });
  }
}

/**
 * Add email to suppression list
 */
async function addToSuppressionList(
  email: string,
  reason: SuppressionReason,
  details?: string,
  organizationId?: string
): Promise<void> {
  try {
    const emailHash = crypto.createHash('sha256').update(email.toLowerCase()).digest('hex');

    await db.suppressionList.upsert({
      where: {
        email_organizationId: {
          email: email.toLowerCase(),
          organizationId: organizationId || null as any
        }
      },
      create: {
        email: email.toLowerCase(),
        emailHash,
        reason,
        reasonDetails: details,
        source: 'webhook',
        scope: organizationId ? 'ORGANIZATION' : 'GLOBAL',
        active: true,
        organizationId: organizationId || null as any
      },
      update: {
        reason,
        reasonDetails: details,
        addedAt: new Date()
      }
    });

    logger.info(`✅ Added ${email} to suppression list: ${reason}`);

  } catch (error) {
    logger.error('Error adding to suppression list:', error);
  }
}

/**
 * Check if event is unique using Redis
 */
async function isUniqueEvent(key: string, ttl: number): Promise<boolean> {
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
 * Broadcast real-time update via WebSocket
 */
async function broadcastUpdate(
  organizationId: string,
  emailId: string,
  event: NormalizedEvent
): Promise<void> {
  try {
    // TODO: Implement WebSocket broadcasting
    // This would use socket.io to send real-time updates to connected clients

    logger.debug(`📡 Broadcasting ${event.eventType} update to org ${organizationId}`);

  } catch (error) {
    logger.error('Error broadcasting update:', error);
    // Don't throw - broadcast failure shouldn't fail the job
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('📭 SIGTERM received, closing email event processor...');

  await emailEventQueue.close();

  logger.info('✅ Email event processor closed gracefully');
  process.exit(0);
});

export { emailEventQueue };
