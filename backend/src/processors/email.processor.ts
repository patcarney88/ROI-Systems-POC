/**
 * Email Queue Processor
 * Processes email sending jobs from Bull Queue
 * Target: 10,000+ emails per hour with retry logic
 */

import { Job, DoneCallback } from 'bull';
import { emailQueue, campaignQueue, EmailJobData, BulkEmailJobData } from '../queues/email.queue';
import { sendGridService } from '../services/sendgrid.service';
import { createLogger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const logger = createLogger('email-processor');
const db = new PrismaClient();

/**
 * Process individual email sending job
 */
emailQueue.process(async (job: Job<EmailJobData>) => {
  const { queueItemId, campaignId, subscriberId, to, subject, htmlContent, fromName, fromEmail, mergeData, utmParams } = job.data;

  logger.info(`📧 Processing email job: ${job.id} for ${to}`);

  try {
    // Update queue item status to sending
    await db.emailQueue.update({
      where: { id: queueItemId },
      data: { status: 'SENDING', sentAt: new Date() }
    });

    // Apply personalization (merge tags)
    let personalizedHtml = htmlContent;
    let personalizedSubject = subject;

    if (mergeData) {
      personalizedHtml = applyMergeTags(htmlContent, mergeData);
      personalizedSubject = applyMergeTags(subject, mergeData);
    }

    // Add tracking pixel
    personalizedHtml = sendGridService.addTrackingPixel(
      personalizedHtml,
      queueItemId,
      subscriberId
    );

    // Process links for tracking and UTM parameters
    if (utmParams) {
      personalizedHtml = sendGridService.processLinksForTracking(
        personalizedHtml,
        queueItemId,
        subscriberId,
        utmParams
      );
    }

    // Generate unsubscribe URL
    const unsubscribeUrl = sendGridService.generateUnsubscribeUrl(subscriberId, campaignId);

    // Add unsubscribe link to footer
    personalizedHtml = addUnsubscribeLink(personalizedHtml, unsubscribeUrl);

    // Send email via SendGrid
    const result = await sendGridService.sendEmail({
      to,
      from: {
        email: fromEmail,
        name: fromName
      },
      subject: personalizedSubject,
      html: personalizedHtml,
      customArgs: {
        queueItemId,
        campaignId,
        subscriberId
      },
      categories: ['automated-campaign', job.data.metadata?.campaignType || 'general']
    });

    logger.info(`✅ Email sent successfully: ${job.id} - Message ID: ${result.messageId}`);

    // Update queue item status to sent
    await db.emailQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'SENT',
        messageId: result.messageId,
        sentAt: new Date()
      }
    });

    // Create delivery event
    await db.emailEvent.create({
      data: {
        campaignId,
        subscriberId,
        messageId: result.messageId,
        type: 'DELIVERED',
        timestamp: new Date(),
        metadata: {
          jobId: job.id,
          processingTime: Date.now() - job.timestamp
        }
      }
    });

    // Update campaign stats
    await updateCampaignStats(campaignId, 'sent');

    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    logger.error(`❌ Failed to send email: ${job.id}`, error);

    // Update queue item status to failed
    await db.emailQueue.update({
      where: { id: queueItemId },
      data: {
        status: 'FAILED',
        error: error.message,
        retryCount: { increment: 1 }
      }
    });

    // Create failed event
    await db.emailEvent.create({
      data: {
        campaignId,
        subscriberId,
        messageId: queueItemId, // Use queue ID as fallback
        type: 'FAILED',
        timestamp: new Date(),
        metadata: {
          error: error.message,
          attemptNumber: job.attemptsMade,
          jobId: job.id
        }
      }
    });

    // Update campaign stats
    await updateCampaignStats(campaignId, 'failed');

    // Rethrow error for Bull retry logic
    throw error;
  }
});

/**
 * Process campaign (bulk email creation)
 */
campaignQueue.process(async (job: Job<BulkEmailJobData>) => {
  const { campaignId, subscriberIds, priority = 5 } = job.data;

  logger.info(`📨 Processing campaign: ${job.id} with ${subscriberIds.length} recipients`);

  try {
    // Get campaign details
    const campaign = await db.emailCampaign.findUnique({
      where: { id: campaignId },
      include: {
        organization: true,
        agent: true,
        template: true
      }
    });

    if (!campaign) {
      throw new Error(`Campaign not found: ${campaignId}`);
    }

    // Get subscribers
    const subscribers = await db.emailSubscriber.findMany({
      where: {
        id: { in: subscriberIds },
        status: 'ACTIVE'
      },
      include: {
        client: true,
        propertyData: true
      }
    });

    logger.info(`Found ${subscribers.length} active subscribers for campaign ${campaignId}`);

    // Create queue items for each subscriber
    const queueItems: EmailJobData[] = [];

    for (const subscriber of subscribers) {
      // Check if subscriber is suppressed
      const suppressed = await db.suppressionList.findFirst({
        where: {
          email: subscriber.email,
          organizationId: campaign.organizationId
        }
      });

      if (suppressed) {
        logger.warn(`Skipping suppressed email: ${subscriber.email}`);
        continue;
      }

      // Prepare merge data for personalization
      const mergeData = {
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        email: subscriber.email,
        propertyAddress: subscriber.client?.propertyAddress || '',
        closingDate: subscriber.client?.closingDate?.toISOString() || '',
        agentName: campaign.agent?.name || campaign.organization.name,
        agentPhone: campaign.agent?.phone || '',
        agentEmail: campaign.agent?.email || campaign.fromEmail,
        companyName: campaign.organization.name
      };

      // Create queue item in database
      const queueItem = await db.emailQueue.create({
        data: {
          campaignId,
          subscriberId: subscriber.id,
          to: subscriber.email,
          subject: campaign.subject,
          htmlContent: campaign.htmlContent,
          status: 'QUEUED',
          priority,
          scheduledFor: campaign.scheduledFor || new Date(),
          retryCount: 0
        }
      });

      // Prepare job data
      queueItems.push({
        queueItemId: queueItem.id,
        campaignId,
        subscriberId: subscriber.id,
        to: subscriber.email,
        subject: campaign.subject,
        htmlContent: campaign.htmlContent,
        textContent: campaign.textContent || undefined,
        fromName: campaign.fromName,
        fromEmail: campaign.fromEmail,
        replyTo: campaign.replyTo || undefined,
        mergeData,
        utmParams: {
          source: 'email',
          medium: 'automated',
          campaign: campaign.name,
          content: campaign.type
        },
        organizationId: campaign.organizationId,
        metadata: {
          campaignType: campaign.type,
          campaignName: campaign.name
        }
      });
    }

    // Bulk queue emails
    if (queueItems.length > 0) {
      await emailQueue.addBulk(
        queueItems.map((item) => ({
          data: item,
          opts: {
            priority,
            jobId: item.queueItemId,
            attempts: 3,
            backoff: {
              type: 'exponential',
              delay: 2000
            }
          }
        }))
      );

      logger.info(`✅ Campaign ${campaignId} queued: ${queueItems.length} emails`);
    }

    // Update campaign status and recipient count
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: 'SENDING',
        totalRecipients: queueItems.length,
        sentAt: new Date()
      }
    });

    return { success: true, queuedEmails: queueItems.length };
  } catch (error: any) {
    logger.error(`❌ Failed to process campaign: ${job.id}`, error);

    // Update campaign status to failed
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'FAILED' }
    });

    throw error;
  }
});

/**
 * Apply merge tags to content
 */
function applyMergeTags(content: string, mergeData: Record<string, any>): string {
  let result = content;

  for (const [key, value] of Object.entries(mergeData)) {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
    result = result.replace(placeholder, String(value || ''));
  }

  return result;
}

/**
 * Add unsubscribe link to email footer
 */
function addUnsubscribeLink(html: string, unsubscribeUrl: string): string {
  const unsubscribeHtml = `
    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
      <p>You're receiving this email because you worked with us on your real estate closing.</p>
      <p>
        <a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: underline;">Unsubscribe</a> |
        <a href="${unsubscribeUrl.replace('/unsubscribe', '/preferences')}" style="color: #0066cc; text-decoration: underline;">Manage Preferences</a>
      </p>
    </div>
  `;

  // Insert before closing </body> tag, or at the end if no body tag
  if (html.includes('</body>')) {
    return html.replace('</body>', `${unsubscribeHtml}</body>`);
  }

  return `${html}${unsubscribeHtml}`;
}

/**
 * Update campaign statistics
 */
async function updateCampaignStats(campaignId: string, statType: 'sent' | 'failed'): Promise<void> {
  try {
    if (statType === 'sent') {
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: { sentCount: { increment: 1 } }
      });
    } else if (statType === 'failed') {
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } }
      });
    }
  } catch (error) {
    logger.error(`Failed to update campaign stats for ${campaignId}:`, error);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGTERM', async () => {
  logger.info('📭 SIGTERM received, closing email processor...');

  await emailQueue.close();
  await campaignQueue.close();
  await db.$disconnect();

  logger.info('✅ Email processor closed gracefully');
  process.exit(0);
});

export { emailQueue, campaignQueue };
