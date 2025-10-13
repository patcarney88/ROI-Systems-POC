import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { Document } from '../types';

const logger = createLogger('document-controller');

// Mock document database (replace with actual database in production)
const documents: Document[] = [];

/**
 * Upload a new document
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
  const newDocument: Document = {
    id: `doc_${Date.now()}`,
    userId,
    clientId: clientId || 'unassigned',
    title: title || req.file.originalname,
    type: type || 'Purchase Agreement',
    status: 'pending',
    fileUrl: `/uploads/${req.file.filename}`,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadDate: new Date(),
    metadata: metadata ? JSON.parse(metadata) : undefined
  };

  documents.push(newDocument);

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

  // Filter documents
  let filteredDocs = documents.filter(doc => doc.userId === userId);

  if (status) {
    filteredDocs = filteredDocs.filter(doc => doc.status === status);
  }

  if (type) {
    filteredDocs = filteredDocs.filter(doc => doc.type === type);
  }

  if (clientId) {
    filteredDocs = filteredDocs.filter(doc => doc.clientId === clientId);
  }

  if (search) {
    const searchLower = (search as string).toLowerCase();
    filteredDocs = filteredDocs.filter(doc =>
      doc.title.toLowerCase().includes(searchLower) ||
      doc.type.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const startIndex = (pageNum - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedDocs = filteredDocs.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: {
      documents: paginatedDocs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: filteredDocs.length,
        pages: Math.ceil(filteredDocs.length / limitNum)
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

  const document = documents.find(doc => doc.id === id && doc.userId === userId);

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
  const { title, type, status, clientId, metadata } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const documentIndex = documents.findIndex(doc => doc.id === id && doc.userId === userId);

  if (documentIndex === -1) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Update document
  if (title) documents[documentIndex].title = title;
  if (type) documents[documentIndex].type = type;
  if (status) documents[documentIndex].status = status;
  if (clientId) documents[documentIndex].clientId = clientId;
  if (metadata) documents[documentIndex].metadata = metadata;

  logger.info(`Document updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { document: documents[documentIndex] }
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

  const documentIndex = documents.findIndex(doc => doc.id === id && doc.userId === userId);

  if (documentIndex === -1) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Soft delete - mark as expired
  documents[documentIndex].status = 'expired';

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

  const userDocs = documents.filter(doc => doc.userId === userId);

  const stats = {
    total: userDocs.length,
    byStatus: {
      pending: userDocs.filter(d => d.status === 'pending').length,
      active: userDocs.filter(d => d.status === 'active').length,
      expiring: userDocs.filter(d => d.status === 'expiring').length,
      expired: userDocs.filter(d => d.status === 'expired').length
    },
    byType: userDocs.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  res.json({
    success: true,
    data: { stats }
  });
});
