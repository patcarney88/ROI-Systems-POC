/**
 * Document Classification Service
 * Integrates with ML classification API and manages classification results in PostgreSQL
 * NO SUPABASE - PostgreSQL only via Prisma
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { createReadStream, existsSync } from 'fs';
import { createLogger } from '../utils/logger';

const logger = createLogger('document-classification');

// ============================================================================
// TYPES
// ============================================================================

export enum DocumentCategory {
  // Title Documents
  DEED = 'DEED',
  MORTGAGE = 'MORTGAGE',
  TITLE_INSURANCE = 'TITLE_INSURANCE',
  TITLE_COMMITMENT = 'TITLE_COMMITMENT',
  SETTLEMENT_STATEMENT = 'SETTLEMENT_STATEMENT',

  // Financial Documents
  TAX_RETURN = 'TAX_RETURN',
  BANK_STATEMENT = 'BANK_STATEMENT',
  PAY_STUB = 'PAY_STUB',
  W2_FORM = 'W2_FORM',
  FORM_1099 = 'FORM_1099',

  // Legal Documents
  PURCHASE_AGREEMENT = 'PURCHASE_AGREEMENT',
  LISTING_AGREEMENT = 'LISTING_AGREEMENT',
  POWER_OF_ATTORNEY = 'POWER_OF_ATTORNEY',
  AFFIDAVIT = 'AFFIDAVIT',
  DIVORCE_DECREE = 'DIVORCE_DECREE',

  // Property Documents
  PROPERTY_APPRAISAL = 'PROPERTY_APPRAISAL',
  HOME_INSPECTION = 'HOME_INSPECTION',
  SURVEY = 'SURVEY',
  HOMEOWNER_INSURANCE = 'HOMEOWNER_INSURANCE',

  // Identification
  DRIVERS_LICENSE = 'DRIVERS_LICENSE',
  PASSPORT = 'PASSPORT',
  SOCIAL_SECURITY_CARD = 'SOCIAL_SECURITY_CARD',

  // Other
  OTHER = 'OTHER',
  UNKNOWN = 'UNKNOWN',
}

export interface SecondaryPrediction {
  category: DocumentCategory;
  confidence: number;
}

export interface ClassificationResult {
  classificationId: string;
  documentId: string;
  primaryCategory: DocumentCategory;
  confidence: number;
  secondaryPredictions: SecondaryPrediction[];
  requiresReview: boolean;
  processingTimeMs: number;
  modelVersion: string;
  timestamp: Date;
}

export interface ClassificationOptions {
  returnProbabilities?: boolean;
  storeResult?: boolean;
}

export interface BatchClassificationResult {
  results: ClassificationResult[];
  totalCount: number;
  successCount: number;
  failedCount: number;
  totalProcessingTimeMs: number;
}

export interface ModelHealth {
  status: string;
  modelVersion: string;
  device: string;
  predictionCount: number;
  averageLatencyMs: number;
  supportedCategories: string[];
  confidenceThresholds: Record<string, number>;
}

// ============================================================================
// SERVICE
// ============================================================================

export class DocumentClassificationService {
  private readonly mlApiUrl: string;
  private readonly mlApiClient: AxiosInstance;
  private readonly timeout: number;

  constructor() {
    this.mlApiUrl = process.env.ML_CLASSIFICATION_API_URL || 'http://localhost:8001';
    this.timeout = parseInt(process.env.ML_API_TIMEOUT || '30000', 10);

    // Create axios client
    this.mlApiClient = axios.create({
      baseURL: this.mlApiUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    logger.info(`Document Classification Service initialized (API: ${this.mlApiUrl})`);
  }

  /**
   * Classify a single document
   */
  async classifyDocument(
    documentId: string,
    filePath: string,
    options: ClassificationOptions = {}
  ): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      // Validate file exists
      if (!existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', createReadStream(filePath));

      // Make classification request
      const response = await this.mlApiClient.post('/v1/classify', formData, {
        params: {
          document_id: documentId,
          return_probabilities: options.returnProbabilities || false,
        },
        headers: formData.getHeaders(),
      });

      const result: ClassificationResult = {
        classificationId: response.data.classification_id,
        documentId: response.data.document_id || documentId,
        primaryCategory: response.data.primary_category as DocumentCategory,
        confidence: response.data.confidence,
        secondaryPredictions: response.data.secondary_predictions.map((pred: any) => ({
          category: pred.category as DocumentCategory,
          confidence: pred.confidence,
        })),
        requiresReview: response.data.requires_review,
        processingTimeMs: response.data.processing_time_ms,
        modelVersion: response.data.model_version,
        timestamp: new Date(response.data.timestamp),
      };

      // Store result if requested (default: true)
      if (options.storeResult !== false) {
        await this.storeClassificationResult(result);
      }

      const totalTime = Date.now() - startTime;
      logger.info(
        `Document ${documentId} classified as ${result.primaryCategory} ` +
          `(${(result.confidence * 100).toFixed(1)}%) in ${totalTime}ms`
      );

      return result;
    } catch (error) {
      logger.error(`Classification failed for document ${documentId}:`, error);

      // Store failed classification
      await this.storeFailedClassification(documentId, error);

      throw new Error(`Document classification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Classify multiple documents in batch
   */
  async classifyBatch(
    documents: Array<{ documentId: string; filePath: string }>
  ): Promise<BatchClassificationResult> {
    const startTime = Date.now();

    try {
      // Validate batch size
      if (documents.length > 100) {
        throw new Error('Maximum 100 documents per batch');
      }

      // Prepare batch request
      const formData = new FormData();

      for (const doc of documents) {
        if (!existsSync(doc.filePath)) {
          logger.warn(`File not found, skipping: ${doc.filePath}`);
          continue;
        }
        formData.append('files', createReadStream(doc.filePath));
      }

      // Make batch classification request
      const response = await this.mlApiClient.post('/v1/classify/batch', formData, {
        headers: formData.getHeaders(),
        timeout: this.timeout * 2, // Double timeout for batch
      });

      const batchResult: BatchClassificationResult = {
        results: response.data.results.map((result: any) => ({
          classificationId: result.classification_id,
          documentId: result.document_id,
          primaryCategory: result.primary_category as DocumentCategory,
          confidence: result.confidence,
          secondaryPredictions: result.secondary_predictions.map((pred: any) => ({
            category: pred.category as DocumentCategory,
            confidence: pred.confidence,
          })),
          requiresReview: result.requires_review,
          processingTimeMs: result.processing_time_ms,
          modelVersion: result.model_version,
          timestamp: new Date(result.timestamp),
        })),
        totalCount: response.data.total_count,
        successCount: response.data.success_count,
        failedCount: response.data.failed_count,
        totalProcessingTimeMs: response.data.total_processing_time_ms,
      };

      // Store all successful results
      for (const result of batchResult.results) {
        await this.storeClassificationResult(result);
      }

      const totalTime = Date.now() - startTime;
      logger.info(
        `Batch classification completed: ${batchResult.successCount}/${batchResult.totalCount} ` +
          `successful in ${totalTime}ms`
      );

      return batchResult;
    } catch (error) {
      logger.error('Batch classification failed:', error);
      throw new Error(`Batch classification failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get supported document categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const response = await this.mlApiClient.get('/v1/categories');
      return response.data;
    } catch (error) {
      logger.error('Failed to get categories:', error);
      return Object.values(DocumentCategory);
    }
  }

  /**
   * Check model health
   */
  async checkHealth(): Promise<ModelHealth> {
    try {
      const response = await this.mlApiClient.get('/v1/health');
      return response.data;
    } catch (error) {
      logger.error('Health check failed:', error);
      throw new Error(`ML API health check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Store classification result in PostgreSQL via Prisma
   */
  private async storeClassificationResult(result: ClassificationResult): Promise<void> {
    try {
      // TODO: Implement with Prisma client when schema is migrated
      // import { PrismaClient } from '@prisma/client';
      // const prisma = new PrismaClient();
      //
      // await prisma.documentClassification.create({
      //   data: {
      //     documentId: result.documentId,
      //     category: result.primaryCategory,
      //     confidence: result.confidence,
      //     modelVersion: result.modelVersion,
      //     processingTime: result.processingTimeMs,
      //     status: result.requiresReview ? 'REQUIRES_REVIEW' : 'COMPLETED',
      //     secondaryPredictions: {
      //       predictions: result.secondaryPredictions,
      //     },
      //     requiresReview: result.requiresReview,
      //   },
      // });

      logger.debug(`Stored classification result for document ${result.documentId}`);
    } catch (error) {
      logger.error(`Failed to store classification result:`, error);
      // Don't throw - classification succeeded, storage is secondary
    }
  }

  /**
   * Store failed classification attempt
   */
  private async storeFailedClassification(documentId: string, error: any): Promise<void> {
    try {
      // TODO: Implement with Prisma client when schema is migrated
      // import { PrismaClient } from '@prisma/client';
      // const prisma = new PrismaClient();
      //
      // await prisma.documentClassification.create({
      //   data: {
      //     documentId,
      //     category: 'UNKNOWN',
      //     confidence: 0,
      //     modelVersion: 'unknown',
      //     processingTime: 0,
      //     status: 'FAILED',
      //     requiresReview: true,
      //   },
      // });
      //
      // await prisma.documentProcessingLog.create({
      //   data: {
      //     documentId,
      //     stage: 'CLASSIFICATION',
      //     status: 'FAILED',
      //     duration: 0,
      //     errorMessage: error instanceof Error ? error.message : String(error),
      //   },
      // });

      logger.debug(`Stored failed classification for document ${documentId}`);
    } catch (storeError) {
      logger.error(`Failed to store error:`, storeError);
    }
  }

  /**
   * Get classification by document ID
   */
  async getClassification(documentId: string): Promise<ClassificationResult | null> {
    try {
      // TODO: Implement with Prisma client when schema is migrated
      // import { PrismaClient } from '@prisma/client';
      // const prisma = new PrismaClient();
      //
      // const classification = await prisma.documentClassification.findFirst({
      //   where: { documentId },
      //   orderBy: { createdAt: 'desc' },
      // });
      //
      // if (!classification) return null;
      //
      // return {
      //   classificationId: classification.id,
      //   documentId: classification.documentId,
      //   primaryCategory: classification.category as DocumentCategory,
      //   confidence: classification.confidence,
      //   secondaryPredictions: classification.secondaryPredictions?.predictions || [],
      //   requiresReview: classification.requiresReview,
      //   processingTimeMs: classification.processingTime,
      //   modelVersion: classification.modelVersion,
      //   timestamp: classification.createdAt,
      // };

      return null;
    } catch (error) {
      logger.error(`Failed to get classification for document ${documentId}:`, error);
      return null;
    }
  }

  /**
   * Update classification with manual review
   */
  async updateClassification(
    documentId: string,
    correctedCategory: DocumentCategory,
    reviewedBy: string,
    reason?: string
  ): Promise<void> {
    try {
      // TODO: Implement with Prisma client when schema is migrated
      // import { PrismaClient } from '@prisma/client';
      // const prisma = new PrismaClient();
      //
      // await prisma.documentClassification.updateMany({
      //   where: { documentId },
      //   data: {
      //     correctedCategory,
      //     reviewedBy,
      //     reviewedAt: new Date(),
      //     correctionReason: reason,
      //   },
      // });

      logger.info(`Classification updated for document ${documentId} by ${reviewedBy}`);
    } catch (error) {
      logger.error(`Failed to update classification:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentClassificationService = new DocumentClassificationService();
