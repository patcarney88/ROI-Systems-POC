import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { cacheService } from '../services/cache.service';
import { manualInvalidate } from '../middleware/cacheInvalidation';
import { Document, DocumentType, DocumentStatus } from '../models/Document';
import { Op } from 'sequelize';

const logger = createLogger('document-controller-cached');

/**
 * Cache Configuration for Documents
 * DOCUMENT_LIST_TTL: 5 minutes (300 seconds) - List queries change frequently
 * DOCUMENT_DETAIL_TTL: 15 minutes (900 seconds) - Individual documents change less often
 * DOCUMENT_STATS_TTL: 10 minutes (600 seconds) - Statistics can be slightly stale
 */
const DOCUMENT_LIST_TTL = 300; // 5 minutes
const DOCUMENT_DETAIL_TTL = 900; // 15 minutes
const DOCUMENT_STATS_TTL = 600; // 10 minutes

/**
 * Upload a new document with cache invalidation
 * PERFORMANCE: Invalidates list caches after upload
 */
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, title, type, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No file uploaded');
  }

  // Create document record
  const newDocument = await Document.create({
    userId,
    clientId: clientId || null,
    title: title || req.file.originalname,
    type: type as DocumentType || DocumentType.PURCHASE_AGREEMENT,
    status: DocumentStatus.PENDING,
    fileUrl: `/uploads/${req.file.filename}`,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadDate: new Date(),
    metadata: metadata ? JSON.parse(metadata) : null
  });

  // Invalidate related caches
  await manualInvalidate([
    `documents:list:${userId}:*`,
    `documents:user:${userId}`,
    `documents:stats:${userId}`
  ], { userId });

  logger.info(`Document uploaded and caches invalidated: ${newDocument.id} by user ${userId}`);

  res.status(201).json({
    success: true,
    data: { document: newDocument }
  });
});

/**
 * Get all documents with pagination and caching
 * PERFORMANCE: Caches paginated results for 5 minutes
 * TARGET: 80ms → 15ms (81% faster)
 */
export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { status, type, clientId, search, page = '1', limit = '20' } = req.query;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Build cache key from query parameters
  const cacheKey = `documents:list:${userId}:page:${page}:limit:${limit}:status:${status || 'all'}:type:${type || 'all'}:client:${clientId || 'all'}:search:${search || 'none'}`;

  // Try to get from cache
  const cached = await cacheService.get<any>(cacheKey);
  if (cached) {
    logger.debug(`Document list cache hit for user: ${userId}`);
    return res.json({
      success: true,
      data: cached,
      _cached: true
    });
  }

  // Cache miss - query database
  logger.debug(`Document list cache miss for user: ${userId}`);

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const offset = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = { userId };
  if (status) where.status = status;
  if (type) where.type = type;
  if (clientId) where.clientId = clientId;
  if (search) {
    where[Op.or] = [
      { title: { [Op.iLike]: `%${search}%` } },
      { type: { [Op.iLike]: `%${search}%` } }
    ];
  }

  // Query with pagination
  const { count, rows: documents } = await Document.findAndCountAll({
    where,
    limit: limitNum,
    offset,
    order: [['uploadDate', 'DESC']]
  });

  const result = {
    documents,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: count,
      pages: Math.ceil(count / limitNum)
    }
  };

  // Cache the result
  await cacheService.set(cacheKey, result, DOCUMENT_LIST_TTL);

  res.json({
    success: true,
    data: result
  });
});

/**
 * Get a single document with caching
 * PERFORMANCE: Caches individual documents for 15 minutes
 * TARGET: 60ms → 10ms (83% faster)
 */
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Try cache first
  const cacheKey = `document:${id}`;
  const cached = await cacheService.get<any>(cacheKey);

  if (cached) {
    // Verify user has access to this document
    if (cached.userId !== userId) {
      throw new AppError(403, 'FORBIDDEN', 'Access denied to this document');
    }

    logger.debug(`Document cache hit: ${id}`);
    return res.json({
      success: true,
      data: { document: cached },
      _cached: true
    });
  }

  // Cache miss - fetch from database
  logger.debug(`Document cache miss: ${id}`);
  const document = await Document.findOne({
    where: { id, userId }
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Cache the document
  await cacheService.set(cacheKey, document, DOCUMENT_DETAIL_TTL);

  res.json({
    success: true,
    data: { document }
  });
});

/**
 * Update document metadata with cache invalidation
 * PERFORMANCE: Invalidates specific document and list caches
 */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, type, status, clientId, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await Document.findOne({
    where: { id, userId }
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Update document
  if (title) document.title = title;
  if (type) document.type = type as DocumentType;
  if (status) document.status = status as DocumentStatus;
  if (clientId !== undefined) document.clientId = clientId;
  if (metadata) document.metadata = metadata;

  await document.save();

  // Invalidate related caches
  await manualInvalidate([
    `document:${id}`,
    `documents:list:${userId}:*`,
    `documents:user:${userId}`,
    `documents:stats:${userId}`
  ], { userId, id });

  logger.info(`Document updated and caches invalidated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { document }
  });
});

/**
 * Delete a document with cache invalidation
 * PERFORMANCE: Clears all related caches
 */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await Document.findOne({
    where: { id, userId }
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Soft delete - mark as expired
  document.status = DocumentStatus.EXPIRED;
  await document.save();

  // Invalidate all related caches
  await manualInvalidate([
    `document:${id}`,
    `documents:list:${userId}:*`,
    `documents:user:${userId}`,
    `documents:stats:${userId}`
  ], { userId, id });

  logger.info(`Document deleted and caches invalidated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Document deleted successfully' }
  });
});

/**
 * Get document statistics with caching
 * PERFORMANCE: Caches expensive aggregations for 10 minutes
 * TARGET: 100ms → 20ms (80% faster)
 */
export const getDocumentStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Try cache first
  const cacheKey = `documents:stats:${userId}`;
  const cached = await cacheService.get<any>(cacheKey);

  if (cached) {
    logger.debug(`Document stats cache hit for user: ${userId}`);
    return res.json({
      success: true,
      data: { stats: cached },
      _cached: true
    });
  }

  // Cache miss - calculate stats
  logger.debug(`Document stats cache miss for user: ${userId}`);

  const allDocs = await Document.findAll({
    where: { userId },
    attributes: ['status', 'type']
  });

  const stats = {
    total: allDocs.length,
    byStatus: {
      pending: allDocs.filter(d => d.status === DocumentStatus.PENDING).length,
      active: allDocs.filter(d => d.status === DocumentStatus.ACTIVE).length,
      expiring: allDocs.filter(d => d.status === DocumentStatus.EXPIRING).length,
      expired: allDocs.filter(d => d.status === DocumentStatus.EXPIRED).length
    },
    byType: allDocs.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Cache the stats
  await cacheService.set(cacheKey, stats, DOCUMENT_STATS_TTL);

  res.json({
    success: true,
    data: { stats }
  });
});

export default {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  getDocumentStats
};
