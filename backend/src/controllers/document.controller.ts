import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { Document, DocumentType, DocumentStatus } from '../models/Document';
import { Client } from '../models/Client';
import { User } from '../models/User';
import { Op } from 'sequelize';
import sequelize from '../config/database';
import { localStorageService } from '../services/local-storage.service';
import path from 'path';

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

  try {
    // Upload file using local storage service
    const uploadResult = await localStorageService.uploadFile(req.file, {
      folder: `user_${userId}`,
      allowedTypes: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']
    });

    // Create document record
    const newDocument = await Document.create({
      userId,
      clientId: clientId,
      title: title || req.file.originalname,
      type: (type as DocumentType) || DocumentType.OTHER,
      status: DocumentStatus.PENDING,
      fileUrl: uploadResult.url,
      size: uploadResult.size,
      uploadDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      metadata: {
        originalName: uploadResult.originalName,
        mimeType: uploadResult.mimetype,
        filename: uploadResult.filename,
        path: uploadResult.path,
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
  } catch (error) {
    // Clean up file if database operation fails
    if (req.file) {
      try {
        await localStorageService.deleteFile(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to clean up file after error', cleanupError);
      }
    }
    throw error;
  }
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

/**
 * Download a document file
 */
export const downloadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  // Find document and verify ownership
  const document = await Document.findOne({
    where: { id, userId }
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  try {
    // Get file from storage
    const downloadResult = await localStorageService.downloadFile(document.fileUrl);

    // Set response headers
    res.setHeader('Content-Type', downloadResult.mimetype);
    res.setHeader('Content-Length', downloadResult.size.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(document.metadata?.originalName || downloadResult.filename)}"`
    );

    // Stream file to response
    downloadResult.stream.pipe(res);

    logger.info(`Document downloaded: ${id} by user ${userId}`);
  } catch (error: any) {
    if (error.code === 'FILE_NOT_FOUND') {
      throw new AppError(404, 'FILE_NOT_FOUND', 'Document file not found on server');
    }
    throw error;
  }
});

/**
 * Serve document file (for direct access via URL)
 */
export const serveDocumentFile = asyncHandler(async (req: Request, res: Response) => {
  const relativePath = req.params[0]; // Catch-all route parameter

  try {
    // Get file path (with security checks)
    const filePath = await localStorageService.getFilePath(relativePath);

    // Determine MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Send file
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);

    logger.info(`File served: ${relativePath}`);
  } catch (error: any) {
    if (error.code === 'FILE_NOT_FOUND' || error.code === 'ENOENT') {
      throw new AppError(404, 'FILE_NOT_FOUND', 'File not found');
    }
    if (error.code === 'FORBIDDEN') {
      throw new AppError(403, 'FORBIDDEN', 'Access denied');
    }
    throw error;
  }
});
