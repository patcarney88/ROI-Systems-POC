/**
 * Enhanced Document OCR Service
 * Integration with Python ML OCR services
 * PostgreSQL storage for OCR results, entities, tables, and signatures
 *
 * CRITICAL: PostgreSQL ONLY - NO Supabase or DynamoDB
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

const logger = createLogger('document-ocr-enhanced');
const db = new PrismaClient();

export interface OCRProcessingOptions {
  mode?: 'tesseract' | 'textract' | 'hybrid';
  extractEntities?: boolean;
  extractTables?: boolean;
  detectSignatures?: boolean;
  confidenceThreshold?: number;
}

export interface OCRResult {
  provider: string;
  fullText: string;
  confidence: number;
  pageCount: number;
  processingTime: number;
  cost?: number;
  entities?: any[];
  tables?: any[];
  signatures?: any[];
}

export class DocumentOCRServiceEnhanced {
  private readonly mlApiUrl: string;
  private readonly s3Bucket: string;

  constructor() {
    this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';
    this.s3Bucket = process.env.AWS_S3_BUCKET || '';

    if (!this.s3Bucket) {
      logger.warn('AWS_S3_BUCKET not configured');
    }

    logger.info('Enhanced Document OCR Service initialized');
  }

  /**
   * Process document with full OCR pipeline
   */
  async processDocument(
    documentId: string,
    filePath: string,
    options: OCRProcessingOptions = {}
  ): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info(`Starting OCR processing for document ${documentId}`);

      // Call ML OCR API
      const ocrResult = await this.callMLOCRService(filePath, options);

      // Store OCR results in PostgreSQL
      const ocrRecord = await this.storeOCRResult(
        documentId,
        ocrResult,
        Date.now() - startTime
      );

      // Extract and store entities if requested
      if (options.extractEntities && ocrResult.entities) {
        await this.storeEntities(documentId, ocrRecord.id, ocrResult.entities);
      }

      // Extract and store tables if requested
      if (options.extractTables && ocrResult.tables) {
        await this.storeTables(documentId, ocrRecord.id, ocrResult.tables);
      }

      // Detect and store signatures if requested
      if (options.detectSignatures && ocrResult.signatures) {
        await this.storeSignatures(documentId, ocrRecord.id, ocrResult.signatures);
      }

      // Store processing metrics
      await this.storeProcessingMetrics(documentId, ocrResult, Date.now() - startTime);

      logger.info(`OCR processing completed for document ${documentId}`);
    } catch (error) {
      logger.error(`OCR processing failed for document ${documentId}:`, error);

      // Store error in database
      await this.storeOCRError(documentId, error);

      throw error;
    }
  }

  /**
   * Call ML API for OCR processing
   */
  private async callMLOCRService(
    filePath: string,
    options: OCRProcessingOptions
  ): Promise<OCRResult> {
    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('mode', options.mode || 'hybrid');
      formData.append('extract_entities', String(options.extractEntities !== false));
      formData.append('extract_tables', String(options.extractTables !== false));
      formData.append('detect_signatures', String(options.detectSignatures !== false));
      formData.append('confidence_threshold', String(options.confidenceThreshold || 0.85));

      // Generate S3 key for Textract fallback
      const s3Key = `ocr/${Date.now()}_${path.basename(filePath)}`;
      formData.append('s3_bucket', this.s3Bucket);
      formData.append('s3_key', s3Key);

      const response = await axios.post(`${this.mlApiUrl}/v1/ocr/process`, formData, {
        headers: formData.getHeaders(),
        timeout: 300000, // 5 minutes timeout
      });

      return response.data;
    } catch (error) {
      logger.error('ML OCR API call failed:', error);
      throw new Error(`ML OCR API call failed: ${error}`);
    }
  }

  /**
   * Store OCR results in PostgreSQL
   */
  private async storeOCRResult(
    documentId: string,
    result: OCRResult,
    processingTime: number
  ) {
    return await db.documentOCR.create({
      data: {
        documentId,
        ocrProvider: result.provider as any,
        fullText: result.fullText,
        confidence: result.confidence,
        pageCount: result.pageCount,
        processingTime,
        cost: result.cost,
        pages: result,
        status: 'COMPLETED',
        preprocessingApplied: true,
        fallbackUsed: result.provider === 'HYBRID',
      },
    });
  }

  /**
   * Store extracted entities
   */
  private async storeEntities(
    documentId: string,
    ocrId: string,
    entities: any[]
  ): Promise<void> {
    for (const entity of entities) {
      try {
        await db.extractedEntity.create({
          data: {
            documentId,
            ocrId,
            entityType: entity.entity_type,
            entityValue: entity.entity_value,
            confidence: entity.confidence,
            pageNumber: entity.page_number || 1,
            boundingBox: entity.bounding_box,
            contextText: entity.context_text,
            startPosition: entity.start_position,
            endPosition: entity.end_position,
            normalizedValue: entity.normalized_value,
            extractionMethod: entity.extraction_method || 'SPACY',
            metadata: entity.metadata,
          },
        });
      } catch (error) {
        logger.error(`Failed to store entity ${entity.entity_type}:`, error);
      }
    }

    logger.info(`Stored ${entities.length} entities for document ${documentId}`);
  }

  /**
   * Store extracted tables
   */
  private async storeTables(
    documentId: string,
    ocrId: string,
    tables: any[]
  ): Promise<void> {
    for (const table of tables) {
      try {
        await db.extractedTable.create({
          data: {
            documentId,
            ocrId,
            tableName: table.table_type,
            pageNumber: table.page_number || 1,
            rowCount: table.row_count,
            columnCount: table.column_count,
            headers: table.headers,
            rows: table.rows,
            confidence: table.confidence,
            tableType: table.table_type,
            boundingBox: table.bounding_box,
            cellMetadata: table.cell_metadata,
          },
        });
      } catch (error) {
        logger.error('Failed to store table:', error);
      }
    }

    logger.info(`Stored ${tables.length} tables for document ${documentId}`);
  }

  /**
   * Store detected signatures
   */
  private async storeSignatures(
    documentId: string,
    ocrId: string,
    signatures: any[]
  ): Promise<void> {
    for (const signature of signatures) {
      try {
        await db.signatureDetection.create({
          data: {
            documentId,
            ocrId,
            pageNumber: signature.page_number || 1,
            signatureType: signature.signature_type,
            confidence: signature.confidence,
            boundingBox: signature.bounding_box,
            signed: signature.signed,
            signerName: signature.signer_name,
            signerRole: signature.signer_role,
            fieldLabel: signature.field_label,
            sectionName: signature.section_name,
          },
        });
      } catch (error) {
        logger.error('Failed to store signature:', error);
      }
    }

    logger.info(`Stored ${signatures.length} signatures for document ${documentId}`);
  }

  /**
   * Store OCR processing metrics
   */
  private async storeProcessingMetrics(
    documentId: string,
    result: OCRResult,
    processingTime: number
  ): Promise<void> {
    await db.oCRProcessingMetrics.create({
      data: {
        documentId,
        ocrProvider: result.provider as any,
        processingTimeMs: processingTime,
        pageCount: result.pageCount,
        averageConfidence: result.confidence,
        estimatedCost: result.cost,
        entitiesExtracted: result.entities?.length || 0,
        keyValuePairs: 0, // Would be extracted from entities
        tablesExtracted: result.tables?.length || 0,
        signaturesFound: result.signatures?.length || 0,
        fallbackUsed: result.provider === 'HYBRID',
      },
    });
  }

  /**
   * Store OCR error
   */
  private async storeOCRError(documentId: string, error: any): Promise<void> {
    try {
      await db.documentOCR.create({
        data: {
          documentId,
          ocrProvider: 'HYBRID',
          fullText: '',
          confidence: 0,
          pageCount: 0,
          processingTime: 0,
          pages: {},
          status: 'FAILED',
          errorMessage: error.message || 'Unknown error',
        },
      });
    } catch (dbError) {
      logger.error('Failed to store OCR error:', dbError);
    }
  }

  /**
   * Get OCR results for a document
   */
  async getOCRResults(documentId: string) {
    return await db.documentOCR.findFirst({
      where: { documentId },
      include: {
        entities: true,
        keyValues: true,
        tables: true,
        signatures: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get entities by type
   */
  async getEntitiesByType(documentId: string, entityType: string) {
    return await db.extractedEntity.findMany({
      where: {
        documentId,
        entityType: entityType as any,
      },
      orderBy: { pageNumber: 'asc' },
    });
  }

  /**
   * Get all tables for a document
   */
  async getTables(documentId: string) {
    return await db.extractedTable.findMany({
      where: { documentId },
      orderBy: { pageNumber: 'asc' },
    });
  }

  /**
   * Get signature verification status
   */
  async getSignatureStatus(documentId: string) {
    const signatures = await db.signatureDetection.findMany({
      where: { documentId },
      orderBy: { pageNumber: 'asc' },
    });

    const totalSignatures = signatures.length;
    const signedCount = signatures.filter((s) => s.signed).length;
    const verifiedCount = signatures.filter((s) => s.verified).length;

    return {
      totalSignatures,
      signedCount,
      verifiedCount,
      completionPercentage: totalSignatures > 0 ? (signedCount / totalSignatures) * 100 : 0,
      verificationPercentage:
        totalSignatures > 0 ? (verifiedCount / totalSignatures) * 100 : 0,
      signatures,
    };
  }

  /**
   * Verify entity
   */
  async verifyEntity(entityId: string, verifiedBy: string): Promise<void> {
    await db.extractedEntity.update({
      where: { id: entityId },
      data: {
        verified: true,
        verifiedBy,
        verifiedAt: new Date(),
      },
    });
  }

  /**
   * Get OCR processing metrics
   */
  async getProcessingMetrics(documentId: string) {
    return await db.oCRProcessingMetrics.findMany({
      where: { documentId },
      orderBy: { processedAt: 'desc' },
    });
  }

  /**
   * Search entities across documents
   */
  async searchEntities(query: string, entityType?: string) {
    return await db.extractedEntity.findMany({
      where: {
        entityValue: {
          contains: query,
          mode: 'insensitive',
        },
        ...(entityType && { entityType: entityType as any }),
      },
      take: 100,
      orderBy: { confidence: 'desc' },
    });
  }
}

// Export singleton instance
export const documentOCRServiceEnhanced = new DocumentOCRServiceEnhanced();
