/**
 * Enhanced Document Controller
 * Complete document management with virus scanning, OCR, categorization, and search
 */

import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import { db } from '../config/database';
import { s3Service } from '../services/s3.service';
import { virusScanService } from '../services/virus-scan.service';
import { ocrService } from '../services/ocr.service';
import { categorizationService } from '../services/categorization.service';
import { searchService } from '../services/search.service';
import { UploadStatus, VirusScanStatus, OCRStatus, DocumentStatus } from '@prisma/client';

const logger = createLogger('document-controller-enhanced');

/**
 * Upload single document with full processing pipeline
 * POST /api/v1/documents/upload
 */
export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  const { clientId, title, description, categoryId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  if (!req.file) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No file uploaded');
  }

  const file = req.file;

  logger.info(`Processing document upload: ${file.originalname} by user ${userId}`);

  try {
    // Step 1: Validate file type and size
    if (!virusScanService.isFileTypeAllowed(file.mimetype)) {
      throw new AppError(400, 'INVALID_FILE_TYPE', `File type ${file.mimetype} not allowed`);
    }

    if (!virusScanService.isFileSizeValid(file.size)) {
      throw new AppError(400, 'FILE_TOO_LARGE', 'File size exceeds 50MB limit');
    }

    // Step 2: Find or create default category
    let category = await db.documentCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      category = await db.documentCategory.findFirst({
        where: { name: 'Unknown' },
      });

      if (!category) {
        category = await db.documentCategory.create({
          data: {
            name: 'Unknown',
            description: 'Uncategorized documents',
          },
        });
      }
    }

    // Step 3: Create initial document record
    const retentionDate = new Date();
    retentionDate.setFullYear(retentionDate.getFullYear() + 10); // 10-year retention

    const document = await db.document.create({
      data: {
        userId,
        clientId: clientId || undefined,
        categoryId: category.id,
        title: title || file.originalname,
        description,
        originalFileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        s3Bucket: process.env.AWS_S3_BUCKET || '',
        s3Key: `documents/${userId}/${Date.now()}-${file.originalname}`,
        encryptionKey: 'pending', // Will be updated after upload
        status: DocumentStatus.PENDING,
        uploadStatus: UploadStatus.UPLOADING,
        virusScanStatus: VirusScanStatus.PENDING,
        ocrStatus: OCRStatus.PENDING,
        retentionDate,
      },
    });

    // Step 4: Virus scan (async)
    const scanResult = await virusScanService.scanFile(file.buffer, file.originalname);

    if (!scanResult.isClean) {
      await db.document.update({
        where: { id: document.id },
        data: {
          virusScanStatus: VirusScanStatus.INFECTED,
          virusScanResult: scanResult.virus,
          uploadStatus: UploadStatus.FAILED,
        },
      });

      // Log access
      await db.documentAccessLog.create({
        data: {
          documentId: document.id,
          userId,
          action: 'VIRUS_SCAN',
          success: false,
          errorMessage: `Virus detected: ${scanResult.virus}`,
        },
      });

      throw new AppError(400, 'VIRUS_DETECTED', `File contains virus: ${scanResult.virus}`);
    }

    // Step 5: Upload to S3 with encryption
    const s3Result = await s3Service.uploadFile(file, document.s3Key, {
      userId,
      documentId: document.id,
    });

    // Step 6: Update document with S3 details
    await db.document.update({
      where: { id: document.id },
      data: {
        s3ETag: s3Result.etag,
        encryptionKey: s3Result.encryptionKey,
        uploadStatus: UploadStatus.COMPLETED,
        virusScanStatus: VirusScanStatus.CLEAN,
      },
    });

    // Step 7: Perform OCR (if applicable, async)
    let ocrText = '';
    let ocrConfidence = 0;

    if (ocrService.isOCRApplicable(file.mimetype)) {
      try {
        const ocrResult = await ocrService.extractText(file.buffer, file.originalname);
        ocrText = ocrResult.text;
        ocrConfidence = ocrResult.confidence;

        await db.document.update({
          where: { id: document.id },
          data: {
            ocrStatus: OCRStatus.COMPLETED,
            ocrText: ocrResult.text,
            ocrConfidence: ocrResult.confidence,
          },
        });
      } catch (error) {
        logger.error('OCR processing error:', error);
        await db.document.update({
          where: { id: document.id },
          data: { ocrStatus: OCRStatus.FAILED },
        });
      }
    } else {
      await db.document.update({
        where: { id: document.id },
        data: { ocrStatus: OCRStatus.NOT_APPLICABLE },
      });
    }

    // Step 8: Categorize document (ML-based)
    try {
      const categoryPrediction = await categorizationService.categorize(
        ocrText,
        file.originalname
      );

      if (categoryPrediction.confidence > 0.7) {
        // Find matching category
        const matchedCategory = await db.documentCategory.findFirst({
          where: { name: categoryPrediction.category },
        });

        if (matchedCategory) {
          await db.document.update({
            where: { id: document.id },
            data: {
              categoryId: matchedCategory.id,
              classifiedCategory: categoryPrediction.category,
              classificationConfidence: categoryPrediction.confidence,
            },
          });
        }
      }
    } catch (error) {
      logger.error('Categorization error:', error);
    }

    // Step 9: Index in Elasticsearch for search
    const finalDocument = await db.document.findUnique({
      where: { id: document.id },
      include: { category: true },
    });

    if (finalDocument) {
      try {
        await searchService.indexDocument({
          id: finalDocument.id,
          userId: finalDocument.userId,
          clientId: finalDocument.clientId || undefined,
          categoryId: finalDocument.categoryId,
          title: finalDocument.title,
          description: finalDocument.description || undefined,
          originalFileName: finalDocument.originalFileName,
          mimeType: finalDocument.mimeType,
          ocrText: finalDocument.ocrText || undefined,
          category: finalDocument.category.name,
          uploadedAt: finalDocument.uploadedAt,
          fileSize: finalDocument.fileSize,
          status: finalDocument.status,
        });
      } catch (error) {
        logger.error('Search indexing error:', error);
      }
    }

    // Step 10: Create version 1
    await db.documentVersion.create({
      data: {
        documentId: document.id,
        userId,
        version: 1,
        versionLabel: 'Original',
        s3Key: document.s3Key,
        fileSize: document.fileSize,
        checksum: scanResult.fileHash,
        changeDescription: 'Initial upload',
      },
    });

    // Step 11: Log upload action
    await db.documentAccessLog.create({
      data: {
        documentId: document.id,
        userId,
        action: 'UPLOAD',
        success: true,
      },
    });

    // Generate presigned URL for immediate access
    const presignedUrl = await s3Service.getPresignedUrl(document.s3Key, 3600);

    await db.document.update({
      where: { id: document.id },
      data: {
        presignedUrl,
        presignedUrlExpiry: new Date(Date.now() + 3600 * 1000),
        status: DocumentStatus.ACTIVE,
        processedAt: new Date(),
      },
    });

    const updatedDocument = await db.document.findUnique({
      where: { id: document.id },
      include: {
        category: true,
        client: true,
      },
    });

    logger.info(`Document uploaded successfully: ${document.id}`);

    res.status(201).json({
      success: true,
      data: {
        document: updatedDocument,
        processing: {
          virusScan: 'completed',
          ocr: finalDocument?.ocrStatus,
          categorization: 'completed',
          searchIndexing: 'completed',
        },
      },
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    throw error;
  }
});

/**
 * Bulk upload documents with progress tracking
 * POST /api/v1/documents/upload/bulk
 */
export const bulkUploadDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No files uploaded');
  }

  logger.info(`Processing bulk upload: ${files.length} files by user ${userId}`);

  const results = {
    successful: [] as string[],
    failed: [] as { filename: string; error: string }[],
    total: files.length,
  };

  // Process files sequentially to avoid overwhelming the system
  for (const file of files) {
    try {
      // Create a mock request with single file
      const mockReq = {
        ...req,
        file,
        body: {
          ...req.body,
          title: file.originalname,
        },
      };

      // Reuse single upload logic
      await uploadDocument(mockReq as Request, res);

      results.successful.push(file.originalname);
    } catch (error: any) {
      results.failed.push({
        filename: file.originalname,
        error: error.message,
      });
    }
  }

  logger.info(
    `Bulk upload completed: ${results.successful.length} successful, ${results.failed.length} failed`
  );

  res.status(200).json({
    success: true,
    data: results,
  });
});

/**
 * Get all documents with pagination and filtering
 * GET /api/v1/documents
 */
export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const {
    status,
    categoryId,
    clientId,
    page = '1',
    limit = '20',
    sortBy = 'uploadedAt',
    sortOrder = 'desc',
  } = req.query;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = { userId, deletedAt: null };

  if (status) where.status = status;
  if (categoryId) where.categoryId = categoryId;
  if (clientId) where.clientId = clientId;

  // Get documents
  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        category: true,
        client: true,
      },
    }),
    db.document.count({ where }),
  ]);

  // Log access
  await db.documentAccessLog.createMany({
    data: documents.map((doc) => ({
      documentId: doc.id,
      userId,
      action: 'VIEW' as any,
      success: true,
    })),
  });

  res.json({
    success: true,
    data: {
      documents,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    },
  });
});

/**
 * Get single document by ID
 * GET /api/v1/documents/:id
 */
export const getDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await db.document.findFirst({
    where: { id, userId, deletedAt: null },
    include: {
      category: true,
      client: true,
      versions: {
        orderBy: { version: 'desc' },
      },
    },
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Generate fresh presigned URL if expired
  if (!document.presignedUrl || !document.presignedUrlExpiry || document.presignedUrlExpiry < new Date()) {
    const presignedUrl = await s3Service.getPresignedUrl(document.s3Key, 3600);

    await db.document.update({
      where: { id },
      data: {
        presignedUrl,
        presignedUrlExpiry: new Date(Date.now() + 3600 * 1000),
        lastAccessedAt: new Date(),
      },
    });

    document.presignedUrl = presignedUrl;
  }

  // Log access
  await db.documentAccessLog.create({
    data: {
      documentId: id,
      userId,
      action: 'VIEW',
      success: true,
    },
  });

  res.json({
    success: true,
    data: { document },
  });
});

/**
 * Search documents with full-text search
 * GET /api/v1/documents/search
 */
export const searchDocuments = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const {
    q,
    categoryId,
    clientId,
    dateFrom,
    dateTo,
    page = '1',
    limit = '20',
    sortBy = 'uploadedAt',
    sortOrder = 'desc',
  } = req.query;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  if (!q) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Search query required');
  }

  const searchResults = await searchService.search({
    query: q as string,
    filters: {
      userId,
      categoryId: categoryId as string,
      clientId: clientId as string,
      dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
      dateTo: dateTo ? new Date(dateTo as string) : undefined,
    },
    pagination: {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    },
    sort: {
      field: sortBy as string,
      order: sortOrder as 'asc' | 'desc',
    },
  });

  res.json({
    success: true,
    data: searchResults,
  });
});

/**
 * Update document metadata
 * PUT /api/v1/documents/:id
 */
export const updateDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, categoryId, clientId, status } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await db.document.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Update document
  const updatedDocument = await db.document.update({
    where: { id },
    data: {
      title: title || document.title,
      description: description !== undefined ? description : document.description,
      categoryId: categoryId || document.categoryId,
      clientId: clientId !== undefined ? clientId : document.clientId,
      status: status || document.status,
    },
    include: {
      category: true,
      client: true,
    },
  });

  // Update search index
  await searchService.updateDocument(id, {
    title: updatedDocument.title,
    description: updatedDocument.description,
    categoryId: updatedDocument.categoryId,
    clientId: updatedDocument.clientId,
    status: updatedDocument.status,
  });

  // Log update
  await db.documentAccessLog.create({
    data: {
      documentId: id,
      userId,
      action: 'UPDATE',
      success: true,
    },
  });

  logger.info(`Document updated: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { document: updatedDocument },
  });
});

/**
 * Categorize document (manual or automatic)
 * PUT /api/v1/documents/:id/categorize
 */
export const categorizeDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { categoryId } = req.body;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await db.document.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  const updatedDocument = await db.document.update({
    where: { id },
    data: { categoryId },
    include: { category: true },
  });

  // Log categorization
  await db.documentAccessLog.create({
    data: {
      documentId: id,
      userId,
      action: 'CLASSIFY',
      success: true,
    },
  });

  logger.info(`Document categorized: ${id} -> ${updatedDocument.category.name}`);

  res.json({
    success: true,
    data: { document: updatedDocument },
  });
});

/**
 * Get document versions
 * GET /api/v1/documents/:id/versions
 */
export const getDocumentVersions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await db.document.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  const versions = await db.documentVersion.findMany({
    where: { documentId: id },
    orderBy: { version: 'desc' },
    include: { user: { select: { email: true, firstName: true, lastName: true } } },
  });

  res.json({
    success: true,
    data: { versions },
  });
});

/**
 * Delete document (soft delete)
 * DELETE /api/v1/documents/:id
 */
export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const document = await db.document.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!document) {
    throw new AppError(404, 'DOCUMENT_NOT_FOUND', 'Document not found');
  }

  // Soft delete
  await db.document.update({
    where: { id },
    data: {
      deletedAt: new Date(),
      status: DocumentStatus.ARCHIVED,
    },
  });

  // Remove from search index
  await searchService.deleteDocument(id);

  // Log deletion
  await db.documentAccessLog.create({
    data: {
      documentId: id,
      userId,
      action: 'DELETE',
      success: true,
    },
  });

  logger.info(`Document deleted: ${id} by user ${userId}`);

  res.json({
    success: true,
    data: { message: 'Document deleted successfully' },
  });
});
