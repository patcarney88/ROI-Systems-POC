import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { Client, ClientStatus } from '../models/Client';
import { Document } from '../models/Document';
import { User } from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';

const logger = createLogger('client-controller');

/**
 * Create a new client
 */
export const createClient = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, address, propertyCount = 0, status = 'active', notes } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Check if client with same email already exists for this user
  const existingClient = await Client.findOne({ where: { userId, email } });
  if (existingClient) {
    throw new AppError(409, 'CLIENT_EXISTS', 'Client with this email already exists');
  }

  // Create new client
  const newClient = await Client.create({
    userId,
    name,
    email,
    phone,
    address,
    propertyCount,
    lastContact: new Date(),
    engagementScore: 50, // Default score
    status: (status as ClientStatus) || ClientStatus.ACTIVE,
    notes
  });

  // Load associations
  await newClient.reload({
    include: [
      { model: User, as: 'agent', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  logger.info(`Client created: ${newClient.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: { client: newClient }
  });
});

/**
 * Get all clients for authenticated user
 */
export const getClients = asyncHandler(async (req: Request, res: Response) => {
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
      { email: { [Op.iLike]: `%${search}%` } },
      { phone: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Determine sort order
  const order: any = [[sortBy as string, sortOrder === 'asc' ? 'ASC' : 'DESC']];

  // Query with pagination and associations
  const { count, rows: clientsList } = await Client.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    include: [
      { 
        model: Document, 
        as: 'documents',
        attributes: ['id', 'title', 'type', 'status'],
        separate: true,
        limit: 5
      },
      { model: User, as: 'agent', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ],
    order
  });

  res.json({
    success: true,
    data: {
      clients: paginatedClients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredClients.length,
        pages: Math.ceil(filteredClients.length / limitNum)
      }
    }
  });
});

/**
 * Get a single client by ID
 */
export const getClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const client = clients.find(c => c.id === id && c.userId === userId);

  if (!client) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  res.json({
    success: true,
    data: { client }
  });
});

/**
 * Update a client
 */
export const updateClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, propertyCount, status, notes, engagementScore } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const clientIndex = clients.findIndex(c => c.id === id && c.userId === userId);

  if (clientIndex === -1) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  // Update client fields
  if (name) clients[clientIndex].name = name;
  if (email) clients[clientIndex].email = email;
  if (phone) clients[clientIndex].phone = phone;
  if (propertyCount !== undefined) clients[clientIndex].propertyCount = propertyCount;
  if (status) clients[clientIndex].status = status;
  if (notes !== undefined) clients[clientIndex].notes = notes;
  if (engagementScore !== undefined) clients[clientIndex].engagementScore = engagementScore;

  clients[clientIndex].lastContact = new Date();
  clients[clientIndex].updatedAt = new Date();

  logger.info(`Client updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { client: clients[clientIndex] }
  });
});

/**
 * Delete a client
 */
export const deleteClient = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const clientIndex = clients.findIndex(c => c.id === id && c.userId === userId);

  if (clientIndex === -1) {
    throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
  }

  // Remove client
  clients.splice(clientIndex, 1);

  logger.info(`Client deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Client deleted successfully' }
  });
});

/**
 * Get client statistics
 */
export const getClientStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const userClients = clients.filter(c => c.userId === userId);

  const stats = {
    total: userClients.length,
    byStatus: {
      active: userClients.filter(c => c.status === 'active').length,
      'at-risk': userClients.filter(c => c.status === 'at-risk').length,
      dormant: userClients.filter(c => c.status === 'dormant').length
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

  res.json({
    success: true,
    data: { stats }
  });
});
