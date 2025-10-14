import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { Document, DocumentType, DocumentStatus } from '../models/Document';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';

const logger = createLogger('document-controller');

/**
 * Upload a new document
 */
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, title, type, expiryDate, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No file uploaded');
  }

  // Validate client exists if provided
  if (clientId) {
    const client = await Client.findByPk(clientId);
    if (!client) {
      throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
    }
  }

  // Create document record
  const newDocument = await Document.create({
    userId,
    clientId: clientId,
    title: title || req.file.originalname,
    type: (type as DocumentType) || DocumentType.OTHER,
    status: DocumentStatus.PENDING,
    fileUrl: `/uploads/${req.file.filename}`,
    size: req.file.size,
    uploadDate: new Date(),
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    metadata: {
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      ...(metadata ? JSON.parse(metadata) : {})
    }
  });

  // Load associations
  await newDocument.reload({
    include: [
      { model: Client, as: 'client' },
      { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  logger.info(`Document uploaded: ${newDocument.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: { document: newDocument }
  });
});

/**
 * Get all documents for the authenticated user
 */
export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { status, type, clientId, search, page = 1, limit = 20 } = req.query;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Build where clause
  const where: any = { userId };

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (clientId) {
    where.clientId = clientId;
  }

  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { type: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Query with pagination and associations
  const { count, rows: documents } = await Document.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
      { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ],
    order: [['uploadDate', 'DESC']]
  });

  res.json({
    success: true,
    data: {
      documents,
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
 * Get a single document by ID
 */
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await Document.findOne({
    where: { id, userId },
    include: [
      { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'phone'] },
      { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  res.json({
    success: true,
    data: { document }
  });
});

/**
 * Update document metadata
 */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, type, status, clientId, expiryDate, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await Document.findOne({ where: { id, userId } });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Validate client if provided
  if (clientId) {
    const client = await Client.findByPk(clientId);
    if (!client) {
      throw new AppError(404, 'CLIENT_NOT_FOUND', 'Client not found');
    }
  }

  // Update document
  if (title) document.title = title;
  if (type) document.type = type as DocumentType;
  if (status) document.status = status as DocumentStatus;
  if (clientId !== undefined) document.clientId = clientId;
  if (expiryDate !== undefined) document.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (metadata) document.metadata = { ...document.metadata, ...metadata };

  await document.save();

  // Reload with associations
  await document.reload({
    include: [
      { model: Client, as: 'client' },
      { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] }
    ]
  });

  logger.info(`Document updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { document }
  });
});

/**
 * Delete a document
 */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await Document.findOne({ where: { id, userId } });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Soft delete - mark as expired
  document.status = DocumentStatus.EXPIRED;
  await document.save();

  logger.info(`Document deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Document deleted successfully' }
  });
});

/**
 * Get document statistics
 */
export const getDocumentStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Get total count
  const total = await Document.count({ where: { userId } });

  // Get counts by status
  const byStatus = {
    pending: await Document.count({ where: { userId, status: DocumentStatus.PENDING } }),
    active: await Document.count({ where: { userId, status: DocumentStatus.ACTIVE } }),
    expiring: await Document.count({ where: { userId, status: DocumentStatus.EXPIRING } }),
    expired: await Document.count({ where: { userId, status: DocumentStatus.EXPIRED } })
  };

  // Get counts by type
  const typeGroups = await Document.findAll({
    where: { userId },
    attributes: [
      'type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['type'],
    raw: true
  });

  const byType = typeGroups.reduce((acc: Record<string, number>, group: any) => {
    acc[group.type] = parseInt(group.count);
    return acc;
  }, {});

  const stats = {
    total,
    byStatus,
    byType
  };

  res.json({
    success: true,
    data: { stats }
  });
});
