/**
 * Campaign Management Service
 * Handles campaign creation, scheduling, and recipient list generation
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { queueCampaign } from '../queues/email.queue';
import { addDays, addMonths, addYears, isBefore, isAfter } from 'date-fns';

const logger = createLogger('campaign-service');
const db = new PrismaClient();

export interface CreateCampaignData {
  name: string;
  type: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  organizationId: string;
  agentId?: string;
  templateId?: string;
  scheduledFor?: Date;
  segmentId?: string;
  priority?: number;
}

export interface CampaignRecipientFilters {
  segmentId?: string;
  closingDateRange?: { start: Date; end: Date };
  engagementScore?: { min: number; max: number };
  propertyValue?: { min: number; max: number };
  tags?: string[];
  excludeUnsubscribed?: boolean;
  excludeSuppressed?: boolean;
}

export class CampaignService {
  /**
   * Create a new email campaign
   */
  async createCampaign(data: CreateCampaignData) {
    try {
      const campaign = await db.emailCampaign.create({
        data: {
          name: data.name,
          type: data.type as any,
          subject: data.subject,
          htmlContent: data.htmlContent,
          textContent: data.textContent,
          fromName: data.fromName,
          fromEmail: data.fromEmail,
          replyTo: data.replyTo,
          organizationId: data.organizationId,
          agentId: data.agentId,
          templateId: data.templateId,
          scheduledFor: data.scheduledFor || new Date(),
          status: 'DRAFT',
          sentCount: 0,
          failedCount: 0,
          totalRecipients: 0,
          openRate: 0,
          clickRate: 0
        },
        include: {
          organization: true,
          agent: true,
          template: true
        }
      });

      logger.info(`✅ Campaign created: ${campaign.id} - ${campaign.name}`);

      return campaign;
    } catch (error: any) {
      logger.error('Failed to create campaign:', error);
      throw new Error(`Campaign creation failed: ${error.message}`);
    }
  }

  /**
   * Generate recipient list based on filters
   */
  async generateRecipientList(
    organizationId: string,
    filters: CampaignRecipientFilters
  ): Promise<string[]> {
    try {
      const where: any = {
        organizationId,
        status: 'ACTIVE'
      };

      // Apply segment filter
      if (filters.segmentId) {
        where.segmentId = filters.segmentId;
      }

      // Apply closing date range filter
      if (filters.closingDateRange) {
        where.client = {
          closingDate: {
            gte: filters.closingDateRange.start,
            lte: filters.closingDateRange.end
          }
        };
      }

      // Apply engagement score filter
      if (filters.engagementScore) {
        where.engagementScore = {
          gte: filters.engagementScore.min,
          lte: filters.engagementScore.max
        };
      }

      // Apply property value filter
      if (filters.propertyValue && filters.propertyValue.min > 0) {
        where.propertyData = {
          propertyValue: {
            gte: filters.propertyValue.min,
            lte: filters.propertyValue.max
          }
        };
      }

      // Apply tag filters
      if (filters.tags && filters.tags.length > 0) {
        where.tags = {
          hasSome: filters.tags
        };
      }

      // Exclude unsubscribed
      if (filters.excludeUnsubscribed !== false) {
        where.unsubscribed = false;
      }

      const subscribers = await db.emailSubscriber.findMany({
        where,
        select: { id: true, email: true }
      });

      // Filter out suppressed emails if requested
      if (filters.excludeSuppressed !== false) {
        const suppressedEmails = await db.suppressionList.findMany({
          where: {
            organizationId,
            email: { in: subscribers.map((s) => s.email) }
          },
          select: { email: true }
        });

        const suppressedSet = new Set(suppressedEmails.map((s) => s.email));
        const filteredSubscribers = subscribers.filter((s) => !suppressedSet.has(s.email));

        logger.info(
          `Generated recipient list: ${filteredSubscribers.length} subscribers (excluded ${suppressedSet.size} suppressed)`
        );

        return filteredSubscribers.map((s) => s.id);
      }

      logger.info(`Generated recipient list: ${subscribers.length} subscribers`);

      return subscribers.map((s) => s.id);
    } catch (error: any) {
      logger.error('Failed to generate recipient list:', error);
      throw new Error(`Recipient list generation failed: ${error.message}`);
    }
  }

  /**
   * Send campaign to recipients
   */
  async sendCampaign(campaignId: string, recipientFilters?: CampaignRecipientFilters, priority?: number) {
    try {
      const campaign = await db.emailCampaign.findUnique({
        where: { id: campaignId },
        include: { organization: true }
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
        throw new Error(`Campaign already sent: ${campaignId}`);
      }

      // Generate recipient list
      const subscriberIds = await this.generateRecipientList(
        campaign.organizationId,
        recipientFilters || {}
      );

      if (subscriberIds.length === 0) {
        throw new Error('No recipients found for campaign');
      }

      // Queue campaign for processing
      await queueCampaign({
        campaignId,
        subscriberIds,
        priority: priority || 5
      });

      logger.info(`✅ Campaign ${campaignId} queued for sending to ${subscriberIds.length} recipients`);

      return {
        campaignId,
        recipientCount: subscriberIds.length,
        status: 'QUEUED'
      };
    } catch (error: any) {
      logger.error(`Failed to send campaign ${campaignId}:`, error);
      throw new Error(`Campaign send failed: ${error.message}`);
    }
  }

  /**
   * Schedule recurring campaigns (for automated campaigns)
   */
  async scheduleRecurringCampaign(
    campaignType: string,
    organizationId: string,
    frequency: 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
  ) {
    try {
      let recipientFilters: CampaignRecipientFilters = {
        excludeUnsubscribed: true,
        excludeSuppressed: true
      };

      // Define recipient filters based on campaign type
      switch (campaignType) {
        case 'CLOSING_ANNIVERSARY':
          // Find clients whose closing was exactly 1, 2, 3... years ago
          recipientFilters.closingDateRange = {
            start: addYears(new Date(), -1),
            end: addDays(addYears(new Date(), -1), 7) // 7-day window
          };
          break;

        case 'TAX_SEASON':
          // Send in January for tax season
          recipientFilters.closingDateRange = {
            start: addYears(new Date(), -2),
            end: new Date()
          };
          break;

        case 'HOME_MAINTENANCE':
          // Send quarterly to all active clients
          recipientFilters.closingDateRange = {
            start: addYears(new Date(), -10),
            end: new Date()
          };
          break;

        case 'MARKET_REPORT':
          // Send to engaged subscribers
          recipientFilters.engagementScore = { min: 50, max: 100 };
          break;
      }

      // Get campaign template
      const template = await db.emailTemplate.findFirst({
        where: {
          organizationId,
          type: campaignType as any
        }
      });

      if (!template) {
        throw new Error(`No template found for campaign type: ${campaignType}`);
      }

      // Create campaign
      const campaign = await this.createCampaign({
        name: `${campaignType} - ${new Date().toISOString()}`,
        type: campaignType,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent || undefined,
        fromName: template.fromName,
        fromEmail: template.fromEmail,
        replyTo: template.replyTo || undefined,
        organizationId,
        templateId: template.id,
        scheduledFor: new Date(),
        priority: 5
      });

      // Send campaign
      await this.sendCampaign(campaign.id, recipientFilters);

      logger.info(`✅ Scheduled recurring campaign: ${campaign.id} - ${campaignType}`);

      return campaign;
    } catch (error: any) {
      logger.error(`Failed to schedule recurring campaign for ${campaignType}:`, error);
      throw error;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    try {
      const campaign = await db.emailCampaign.findUnique({
        where: { id: campaignId },
        include: {
          queueItems: {
            select: {
              status: true,
              sentAt: true
            }
          },
          events: {
            select: {
              type: true,
              timestamp: true
            }
          }
        }
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      // Calculate metrics
      const totalSent = campaign.queueItems.filter((q) => q.status === 'SENT').length;
      const totalFailed = campaign.queueItems.filter((q) => q.status === 'FAILED').length;
      const totalOpens = campaign.events.filter((e) => e.type === 'OPENED').length;
      const totalClicks = campaign.events.filter((e) => e.type === 'CLICKED').length;
      const uniqueOpens = new Set(
        campaign.events.filter((e) => e.type === 'OPENED').map((e) => e.subscriberId)
      ).size;
      const uniqueClicks = new Set(
        campaign.events.filter((e) => e.type === 'CLICKED').map((e) => e.subscriberId)
      ).size;

      const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
      const clickToOpenRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;

      return {
        campaignId,
        name: campaign.name,
        type: campaign.type,
        status: campaign.status,
        totalRecipients: campaign.totalRecipients,
        sent: totalSent,
        failed: totalFailed,
        opens: totalOpens,
        clicks: totalClicks,
        uniqueOpens,
        uniqueClicks,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
        clickToOpenRate: Math.round(clickToOpenRate * 100) / 100,
        createdAt: campaign.createdAt,
        sentAt: campaign.sentAt
      };
    } catch (error: any) {
      logger.error(`Failed to get campaign analytics for ${campaignId}:`, error);
      throw new Error(`Analytics retrieval failed: ${error.message}`);
    }
  }

  /**
   * Cancel scheduled campaign
   */
  async cancelCampaign(campaignId: string) {
    try {
      const campaign = await db.emailCampaign.findUnique({
        where: { id: campaignId }
      });

      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      if (campaign.status === 'SENT') {
        throw new Error('Cannot cancel already sent campaign');
      }

      // Update campaign status
      await db.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'CANCELLED' }
      });

      // Remove pending queue items
      await db.emailQueue.deleteMany({
        where: {
          campaignId,
          status: { in: ['QUEUED', 'PENDING'] }
        }
      });

      logger.info(`✅ Campaign cancelled: ${campaignId}`);

      return { success: true };
    } catch (error: any) {
      logger.error(`Failed to cancel campaign ${campaignId}:`, error);
      throw new Error(`Campaign cancellation failed: ${error.message}`);
    }
  }

  /**
   * Get campaigns for organization
   */
  async getCampaigns(organizationId: string, filters?: { status?: string; type?: string; limit?: number }) {
    try {
      const where: any = { organizationId };

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.type) {
        where.type = filters.type;
      }

      const campaigns = await db.emailCampaign.findMany({
        where,
        include: {
          organization: { select: { name: true } },
          agent: { select: { name: true, email: true } },
          template: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50
      });

      return campaigns;
    } catch (error: any) {
      logger.error('Failed to get campaigns:', error);
      throw new Error(`Campaigns retrieval failed: ${error.message}`);
    }
  }
}

// Export singleton instance
export const campaignService = new CampaignService();
