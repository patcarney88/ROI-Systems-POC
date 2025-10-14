import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { cacheService } from '../services/cache.service';
import { manualInvalidate } from '../middleware/cacheInvalidation';
import { Client, ClientStatus } from '../models/Client';
import { Op } from 'sequelize';

const logger = createLogger('client-controller-cached');

/**
 * Cache Configuration for Clients
 * CLIENT_LIST_TTL: 10 minutes (600 seconds) - Client lists change moderately
 * CLIENT_DETAIL_TTL: 15 minutes (900 seconds) - Individual clients change less often
 * CLIENT_ENGAGEMENT_TTL: 1 hour (3600 seconds) - Expensive calculation, cache longer
 * CLIENT_STATS_TTL: 10 minutes (600 seconds) - Statistics can be slightly stale
 */
const CLIENT_LIST_TTL = 600; // 10 minutes
const CLIENT_DETAIL_TTL = 900; // 15 minutes
const CLIENT_ENGAGEMENT_TTL = 3600; // 1 hour
const CLIENT_STATS_TTL = 600; // 10 minutes

/**
 * Create a new client with cache invalidation
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, propertyCount = 0, status = ClientStatus.ACTIVE, notes } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Check if client with same email already exists for this user
  const existingClient = await Client.findOne({
    where: { userId, email }
  });

  if (existingClient) {
    throw new AppError(409, 'CLIENT_EXISTS', 'Client with this email already exists');
  }

  // Create new client
  const newClient = await Client.create({
    userId,
    name,
    email,
    phone,
    propertyCount,
    lastContact: new Date(),
    engagementScore: 50, // Default score
    status: status as ClientStatus,
    notes
  });

  // Invalidate related caches
  await manualInvalidate([
    `clients:list:${userId}:*`,
    `clients:stats:${userId}`
  ], { userId });

  logger.info(`Client created and caches invalidated: ${newClient.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: { client: newClient }
  });
});

/**
 * Get all clients with caching
 * PERFORMANCE: Caches paginated results for 10 minutes
 * TARGET: 60ms → 12ms (80% faster)
 */
export const getClients = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { status, search, page = '1', limit = '20', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Build cache key
  const cacheKey = `clients:list:${userId}:page:${page}:limit:${limit}:status:${status || 'all'}:search:${search || 'none'}:sort:${sortBy}:${sortOrder}`;

  // Try cache first
  const cached = await cacheService.get<any>(cacheKey);
  if (cached) {
    logger.debug(`Client list cache hit for user: ${userId}`);
    return res.json({
      success: true,
      data: cached,
      _cached: true
    });
  }

  // Cache miss - query database
  logger.debug(`Client list cache miss for user: ${userId}`);

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = { userId };
  if (status) where.status = status;
  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Query with pagination
  const { count, rows: clients } = await Client.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [[sortBy as string, sortOrder as string]]
  });

  const result = {
    clients,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    }
  };

  // Cache the result
  await cacheService.set(cacheKey, result, CLIENT_LIST_TTL);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get a single client with caching
 * PERFORMANCE: Caches individual clients for 15 minutes
 */
export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Try cache first
  const cacheKey = `client:${id}`;
  const cached = await cacheService.get<any>(cacheKey);

  if (cached) {
    // Verify user has access
    if (cached.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this client');
    }

    logger.debug(`Client cache hit: ${id}`);
    return res.json({
      success: true,
      data: { client: cached },
      _cached: true
    });
  }

  // Cache miss - fetch from database
  logger.debug(`Client cache miss: ${id}`);
  const client = await Client.findOne({
    where: { id, userId }
  });

  if (!client) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  // Cache the client
  await cacheService.set(cacheKey, client, CLIENT_DETAIL_TTL);

  res.json({
    success: true,
    data: { client }
  });
});

/**
 * Update a client with cache invalidation
 */
export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, propertyCount, status, notes, engagementScore } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const client = await Client.findOne({
    where: { id, userId }
  });

  if (!client) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  // Update client fields
  if (name) client.name = name;
  if (email) client.email = email;
  if (phone) client.phone = phone;
  if (propertyCount !== undefined) client.propertyCount = propertyCount;
  if (status) client.status = status as ClientStatus;
  if (notes !== undefined) client.notes = notes;
  if (engagementScore !== undefined) client.engagementScore = engagementScore;

  client.lastContact = new Date();
  await client.save();

  // Invalidate related caches
  await manualInvalidate([
    `client:${id}`,
    `client:engagement:${id}`,
    `clients:list:${userId}:*`,
    `clients:stats:${userId}`
  ], { userId, id });

  logger.info(`Client updated and caches invalidated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { client }
  });
});

/**
 * Delete a client with cache invalidation
 */
export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const client = await Client.findOne({
    where: { id, userId }
  });

  if (!client) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  // Delete client
  await client.destroy();

  // Invalidate all related caches
  await manualInvalidate([
    `client:${id}`,
    `client:engagement:${id}`,
    `clients:list:${userId}:*`,
    `clients:stats:${userId}`
  ], { userId, id });

  logger.info(`Client deleted and caches invalidated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Client deleted successfully' }
  });
});

/**
 * Get client statistics with caching
 * PERFORMANCE: Caches expensive aggregations for 10 minutes
 */
export const getClientStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Try cache first
  const cacheKey = `clients:stats:${userId}`;
  const cached = await cacheService.get<any>(cacheKey);

  if (cached) {
    logger.debug(`Client stats cache hit for user: ${userId}`);
    return res.json({
      success: true,
      data: { stats: cached },
      _cached: true
    });
  }

  // Cache miss - calculate stats
  logger.debug(`Client stats cache miss for user: ${userId}`);

  const userClients = await Client.findAll({
    where: { userId },
    attributes: ['status', 'engagementScore', 'propertyCount', 'lastContact']
  });

  const stats = {
    total: userClients.length,
    byStatus: {
      active: userClients.filter(c => c.status === ClientStatus.ACTIVE).length,
      'at-risk': userClients.filter(c => c.status === ClientStatus.AT_RISK).length,
      dormant: userClients.filter(c => c.status === ClientStatus.DORMANT).length
    },
    averageEngagementScore: userClients.length > 0
      ? Math.round(userClients.reduce((sum, c) => sum + c.engagementScore, 0) / userClients.length)
      : 0,
    totalProperties: userClients.reduce((sum, c) => sum + c.propertyCount, 0),
    recentActivity: userClients.filter(c => {
      const daysSinceContact = Math.floor((Date.now() - c.lastContact.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceContact <= 30;
    }).length
  };

  // Cache the stats
  await cacheService.set(cacheKey, stats, CLIENT_STATS_TTL);

  res.json({
    success: true,
    data: { stats }
  });
});

/**
 * Get client engagement score with caching
 * PERFORMANCE: Caches expensive calculation for 1 hour
 * This is a placeholder for expensive engagement score calculation
 */
export const getClientEngagement = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Try cache first
  const cacheKey = `client:engagement:${id}`;
  const cached = await cacheService.get<any>(cacheKey);

  if (cached) {
    logger.debug(`Client engagement cache hit: ${id}`);
    return res.json({
      success: true,
      data: cached,
      _cached: true
    });
  }

  // Cache miss - calculate engagement
  logger.debug(`Client engagement cache miss: ${id}`);

  const client = await Client.findOne({
    where: { id, userId }
  });

  if (!client) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  // Calculate engagement score (expensive operation)
  // This is a placeholder - in production, this would involve:
  // - Email open rates
  // - Response times
  // - Property views
  // - Document interactions
  // - Meeting attendance
  const engagementData = {
    score: client.engagementScore,
    trend: 'stable', // 'increasing', 'decreasing', 'stable'
    lastInteraction: client.lastContact,
    metrics: {
      emailEngagement: 0.75,
      propertyInterest: 0.80,
      documentReviews: 0.60,
      responseRate: 0.85
    }
  };

  // Cache for 1 hour
  await cacheService.set(cacheKey, engagementData, CLIENT_ENGAGEMENT_TTL);

  res.json({
    success: true,
    data: engagementData
  });
});

export default {
  createClient,
  getClients,
  getClient,
  updateClient,
  deleteClient,
  getClientStats,
  getClientEngagement
};
