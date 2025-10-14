import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { Campaign, CampaignStatus } from '../models/Campaign';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';

const logger = createLogger('campaign-controller');

/**
 * Create a new campaign
 */
export const createCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { name, subject, template, recipients, schedule, scheduleDate, message } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Validate schedule date if scheduled
  if (schedule === 'scheduled' && !scheduleDate) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Schedule date is required for scheduled campaigns');
  }

  // Create new campaign
  const newCampaign = await Campaign.create({
    userId,
    name,
    subject,
    template,
    recipients: recipients || [],
    schedule,
    scheduleDate: scheduleDate ? new Date(scheduleDate) : null,
    message,
    status: schedule === 'now' ? CampaignStatus.SENT : CampaignStatus.SCHEDULED,
    sentAt: schedule === 'now' ? new Date() : null,
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0
    }
  });

  // Load associations
  await newCampaign.reload({
    include: [
      { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  logger.info(`Campaign created: ${newCampaign.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: { campaign: newCampaign }
  });
});

/**
 * Get all campaigns for authenticated user
 */
export const getCampaigns = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { status, search, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Build where clause
  const where: any = { userId };

  if (status) {
    where.status = status;
  }

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { subject: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Determine sort order
  const order: any = [[sortBy as string, sortOrder === 'asc' ? 'ASC' : 'DESC']];

  // Query with pagination and associations
  const { count, rows: campaignsList } = await Campaign.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    include: [
      { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ],
    order
  });

  res.json({
    success: true,
    data: {
      campaigns: campaignsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count,
        pages: Math.ceil(count / limitNum)
      }
    }
  });
});

/**
 * Get a single campaign by ID
 */
export const getCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaign = await Campaign.findOne({
    where: { id, userId },
    include: [
      { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  if (!campaign) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  res.json({
    success: true,
    data: { campaign }
  });
});

/**
 * Update a campaign
 */
export const updateCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, subject, template, recipients, schedule, scheduleDate, message, status } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaign = await Campaign.findOne({ where: { id, userId } });

  if (!campaign) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  // Don't allow editing sent campaigns
  if (campaign.status === CampaignStatus.SENT) {
    throw new AppError(400, 'CAMPAIGN_ALREADY_SENT', 'Cannot edit a campaign that has already been sent');
  }

  // Update campaign fields
  if (name) campaign.name = name;
  if (subject) campaign.subject = subject;
  if (template) campaign.template = template;
  if (recipients) campaign.recipients = recipients;
  if (schedule) campaign.schedule = schedule;
  if (scheduleDate !== undefined) campaign.scheduleDate = scheduleDate ? new Date(scheduleDate) : null;
  if (message) campaign.message = message;
  if (status) campaign.status = status as CampaignStatus;

  await campaign.save();

  // Reload with associations
  await campaign.reload({
    include: [
      { model: User, as: 'creator', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  logger.info(`Campaign updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { campaign }
  });
});

/**
 * Delete a campaign
 */
export const deleteCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaign = await Campaign.findOne({ where: { id, userId } });

  if (!campaign) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  // Don't allow deleting sent campaigns
  if (campaign.status === CampaignStatus.SENT) {
    throw new AppError(400, 'CAMPAIGN_ALREADY_SENT', 'Cannot delete a campaign that has already been sent');
  }

  // Soft delete - mark as cancelled
  campaign.status = CampaignStatus.CANCELLED;
  await campaign.save();

  logger.info(`Campaign deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Campaign deleted successfully' }
  });
});

/**
 * Send a campaign
 */
export const sendCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaign = await Campaign.findOne({ where: { id, userId } });

  if (!campaign) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  // Check if already sent
  if (campaign.status === CampaignStatus.SENT) {
    throw new AppError(400, 'CAMPAIGN_ALREADY_SENT', 'Campaign has already been sent');
  }

  // TODO: Integrate with email service (SendGrid)
  // For now, just update the status

  campaign.status = CampaignStatus.SENT;
  campaign.sentAt = new Date();
  campaign.stats = {
    sent: campaign.recipients.length,
    opened: 0,
    clicked: 0,
    bounced: 0
  };

  await campaign.save();

  logger.info(`Campaign sent: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { 
      campaign,
      message: 'Campaign sent successfully'
    }
  });
});

/**
 * Get campaign statistics
 */
export const getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaign = await Campaign.findOne({ where: { id, userId } });

  if (!campaign) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  // Calculate engagement rates
  const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0, bounced: 0 };
  const openRate = stats.sent > 0 ? ((stats.opened / stats.sent) * 100).toFixed(2) : '0.00';
  const clickRate = stats.sent > 0 ? ((stats.clicked / stats.sent) * 100).toFixed(2) : '0.00';
  const bounceRate = stats.sent > 0 ? ((stats.bounced / stats.sent) * 100).toFixed(2) : '0.00';

  res.json({
    success: true,
    data: {
      stats: {
        ...stats,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
        bounceRate: `${bounceRate}%`
      }
    }
  });
});

/**
 * Get all campaign statistics for user
 */
export const getAllCampaignStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Get total count
  const total = await Campaign.count({ where: { userId } });

  // Get counts by status
  const byStatus = {
    draft: await Campaign.count({ where: { userId, status: CampaignStatus.DRAFT } }),
    scheduled: await Campaign.count({ where: { userId, status: CampaignStatus.SCHEDULED } }),
    sent: await Campaign.count({ where: { userId, status: CampaignStatus.SENT } }),
    cancelled: await Campaign.count({ where: { userId, status: CampaignStatus.CANCELLED } })
  };

  // Get aggregate stats
  const campaigns = await Campaign.findAll({
    where: { userId, status: CampaignStatus.SENT },
    attributes: ['stats'],
    raw: true
  });

  const aggregateStats = campaigns.reduce((acc: any, campaign: any) => {
    const stats = campaign.stats || { sent: 0, opened: 0, clicked: 0, bounced: 0 };
    acc.sent += stats.sent || 0;
    acc.opened += stats.opened || 0;
    acc.clicked += stats.clicked || 0;
    acc.bounced += stats.bounced || 0;
    return acc;
  }, { sent: 0, opened: 0, clicked: 0, bounced: 0 });

  const openRate = aggregateStats.sent > 0 ? ((aggregateStats.opened / aggregateStats.sent) * 100).toFixed(2) : '0.00';
  const clickRate = aggregateStats.sent > 0 ? ((aggregateStats.clicked / aggregateStats.sent) * 100).toFixed(2) : '0.00';
  const bounceRate = aggregateStats.sent > 0 ? ((aggregateStats.bounced / aggregateStats.sent) * 100).toFixed(2) : '0.00';

  res.json({
    success: true,
    data: {
      total,
      byStatus,
      aggregateStats: {
        ...aggregateStats,
        openRate: `${openRate}%`,
        clickRate: `${clickRate}%`,
        bounceRate: `${bounceRate}%`
      }
    }
  });
});
