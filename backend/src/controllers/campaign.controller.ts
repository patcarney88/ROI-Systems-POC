import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { Campaign } from '../types';

const logger = createLogger('campaign-controller');

// Mock campaign database (replace with actual database in production)
const campaigns: Campaign[] = [];

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
  const newCampaign: Campaign = {
    id: `campaign_${Date.now()}`,
    userId,
    name,
    subject,
    template,
    recipients,
    schedule,
    scheduleDate: scheduleDate ? new Date(scheduleDate) : undefined,
    message,
    status: schedule === 'now' ? 'sent' : 'scheduled',
    sentAt: schedule === 'now' ? new Date() : undefined,
    stats: {
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  campaigns.push(newCampaign);

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

  // Filter campaigns
  let filteredCampaigns = campaigns.filter(campaign => campaign.userId === userId);

  if (status) {
    filteredCampaigns = filteredCampaigns.filter(campaign => campaign.status === status);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredCampaigns = filteredCampaigns.filter(campaign =>
      campaign.name.toLowerCase().includes(searchLower) ||
      campaign.subject.toLowerCase().includes(searchLower)
    );
  }

  // Sorting
  filteredCampaigns.sort((a, b) => {
    const field = sortBy as keyof Campaign;
    const aVal = a[field];
    const bVal = b[field];

    if (aVal !== undefined && bVal !== undefined) {
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedCampaigns = filteredCampaigns.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      campaigns: paginatedCampaigns,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredCampaigns.length,
        pages: Math.ceil(filteredCampaigns.length / limitNum)
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

  const campaign = campaigns.find(c => c.id === id && c.userId === userId);

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
  const { name, subject, message, scheduleDate } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaignIndex = campaigns.findIndex(c => c.id === id && c.userId === userId);

  if (campaignIndex === -1) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  // Only allow updates for draft or scheduled campaigns
  if (campaigns[campaignIndex].status === 'sent') {
    throw new AppError(400, 'INVALID_OPERATION', 'Cannot update a campaign that has already been sent');
  }

  // Update campaign fields
  if (name) campaigns[campaignIndex].name = name;
  if (subject) campaigns[campaignIndex].subject = subject;
  if (message) campaigns[campaignIndex].message = message;
  if (scheduleDate) campaigns[campaignIndex].scheduleDate = new Date(scheduleDate);

  campaigns[campaignIndex].updatedAt = new Date();

  logger.info(`Campaign updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { campaign: campaigns[campaignIndex] }
  });
});

/**
 * Send/trigger a campaign
 */
export const sendCampaign = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const campaignIndex = campaigns.findIndex(c => c.id === id && c.userId === userId);

  if (campaignIndex === -1) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  const campaign = campaigns[campaignIndex];

  if (campaign.status === 'sent') {
    throw new AppError(400, 'ALREADY_SENT', 'Campaign has already been sent');
  }

  // Simulate sending to recipients (in production, integrate with email service)
  const recipientCounts = {
    all: 100,
    active: 75,
    'at-risk': 15,
    dormant: 10,
    recent: 50
  };

  const recipientCount = recipientCounts[campaign.recipients] || 0;

  // Update campaign status
  campaigns[campaignIndex].status = 'sent';
  campaigns[campaignIndex].sentAt = new Date();
  campaigns[campaignIndex].stats = {
    sent: recipientCount,
    opened: 0,
    clicked: 0,
    bounced: 0
  };

  logger.info(`Campaign sent: ${id} to ${recipientCount} recipients by user ${userId}`);

  res.json({
    success: true,
    data: {
      campaign: campaigns[campaignIndex],
      message: `Campaign sent to ${recipientCount} recipients`
    }
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

  const campaignIndex = campaigns.findIndex(c => c.id === id && c.userId === userId);

  if (campaignIndex === -1) {
    throw new AppError(404, 'CAMPAIGN_NOT_FOUND', 'Campaign not found');
  }

  // Remove campaign
  campaigns.splice(campaignIndex, 1);

  logger.info(`Campaign deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Campaign deleted successfully' }
  });
});

/**
 * Get campaign statistics
 */
export const getCampaignStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const userCampaigns = campaigns.filter(c => c.userId === userId);

  const stats = {
    total: userCampaigns.length,
    byStatus: {
      draft: userCampaigns.filter(c => c.status === 'draft').length,
      scheduled: userCampaigns.filter(c => c.status === 'scheduled').length,
      sent: userCampaigns.filter(c => c.status === 'sent').length,
      failed: userCampaigns.filter(c => c.status === 'failed').length
    },
    totalSent: userCampaigns
      .filter(c => c.stats)
      .reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
    averageOpenRate: userCampaigns.length > 0
      ? Math.round(
          (userCampaigns
            .filter(c => c.stats && c.stats.sent > 0)
            .reduce((sum, c) => sum + ((c.stats!.opened / c.stats!.sent) * 100), 0) /
            userCampaigns.filter(c => c.stats && c.stats.sent > 0).length) || 0
        )
      : 0,
    averageClickRate: userCampaigns.length > 0
      ? Math.round(
          (userCampaigns
            .filter(c => c.stats && c.stats.sent > 0)
            .reduce((sum, c) => sum + ((c.stats!.clicked / c.stats!.sent) * 100), 0) /
            userCampaigns.filter(c => c.stats && c.stats.sent > 0).length) || 0
        )
      : 0
  };

  res.json({
    success: true,
    data: { stats }
  });
});
