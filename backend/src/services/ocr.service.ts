/**
 * OCR Service using AWS Textract
 * Extracts text from documents with confidence scoring
 */

import { TextractClient, DetectDocumentTextCommand, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
import { createLogger } from '../utils/logger';

const logger = createLogger('ocr-service');

export interface OCRResult {
  text: string;
  confidence: number;
  pages: number;
  extractedData?: {
    keyValuePairs?: Array<{ key: string; value: string; confidence: number }>;
    tables?: Array<{ rows: number; columns: number; data: string[][] }>;
  };
  processingTime: number;
}

export class OCRService {
  private textractClient: TextractClient;
  private ocrEnabled: boolean;

  constructor() {
    this.ocrEnabled = process.env.OCR_ENABLED !== 'false';

    if (this.ocrEnabled) {
      this.textractClient = new TextractClient({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        },
      });

      logger.info('AWS Textract OCR service initialized');
    } else {
      logger.warn('OCR disabled - development mode');
    }
  }

  /**
   * Extract text from document using AWS Textract
   */
  async extractText(fileBuffer: Buffer, filename: string): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      if (!this.ocrEnabled) {
        logger.info(`OCR bypassed for: ${filename} (development mode)`);
        return {
          text: '',
          confidence: 0,
          pages: 0,
          processingTime: Date.now() - startTime,
        };
      }

      // Determine document type
      const isImage = this.isImageFile(filename);

      // Use appropriate Textract API
      const result = isImage
        ? await this.detectDocumentText(fileBuffer)
        : await this.analyzeDocument(fileBuffer);

      const processingTime = Date.now() - startTime;

      logger.info(`OCR completed for ${filename}: ${result.text.length} chars (${processingTime}ms)`);

      return {
        ...result,
        processingTime,
      };
    } catch (error) {
      logger.error(`OCR error for ${filename}:`, error);
      throw new Error(`OCR processing failed: ${error}`);
    }
  }

  /**
   * Simple text detection for images
   */
  private async detectDocumentText(fileBuffer: Buffer): Promise<OCRResult> {
    const command = new DetectDocumentTextCommand({
      Document: {
        Bytes: fileBuffer,
      },
    });

    const response = await this.textractClient.send(command);

    // Extract text and calculate average confidence
    const blocks = response.Blocks || [];
    const textBlocks = blocks.filter((block) => block.BlockType === 'LINE');

    const text = textBlocks
      .map((block) => block.Text)
      .filter(Boolean)
      .join('\n');

    const confidences = textBlocks
      .map((block) => block.Confidence || 0)
      .filter((c) => c > 0);

    const avgConfidence =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

    return {
      text,
      confidence: avgConfidence / 100, // Convert to 0-1 scale
      pages: 1,
      processingTime: 0, // Will be set by caller
    };
  }

  /**
   * Advanced document analysis for PDFs and complex documents
   */
  private async analyzeDocument(fileBuffer: Buffer): Promise<OCRResult> {
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: fileBuffer,
      },
      FeatureTypes: ['FORMS', 'TABLES'], // Extract forms and tables
    });

    const response = await this.textractClient.send(command);

    const blocks = response.Blocks || [];

    // Extract text
    const textBlocks = blocks.filter((block) => block.BlockType === 'LINE');
    const text = textBlocks
      .map((block) => block.Text)
      .filter(Boolean)
      .join('\n');

    // Calculate confidence
    const confidences = textBlocks
      .map((block) => block.Confidence || 0)
      .filter((c) => c > 0);

    const avgConfidence =
      confidences.length > 0
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length
        : 0;

    // Extract key-value pairs (forms)
    const keyValuePairs = this.extractKeyValuePairs(blocks);

    // Extract tables
    const tables = this.extractTables(blocks);

    return {
      text,
      confidence: avgConfidence / 100,
      pages: response.DocumentMetadata?.Pages || 1,
      extractedData: {
        keyValuePairs,
        tables,
      },
      processingTime: 0,
    };
  }

  /**
   * Extract key-value pairs from form data
   */
  private extractKeyValuePairs(
    blocks: any[]
  ): Array<{ key: string; value: string; confidence: number }> {
    const kvPairs: Array<{ key: string; value: string; confidence: number }> = [];

    const keyBlocks = blocks.filter(
      (block) => block.BlockType === 'KEY_VALUE_SET' && block.EntityTypes?.includes('KEY')
    );

    for (const keyBlock of keyBlocks) {
      if (!keyBlock.Relationships) continue;

      // Find the associated value block
      const valueRelation = keyBlock.Relationships.find(
        (rel: any) => rel.Type === 'VALUE'
      );

      if (!valueRelation) continue;

      const valueBlockId = valueRelation.Ids?.[0];
      const valueBlock = blocks.find((b) => b.Id === valueBlockId);

      if (!valueBlock) continue;

      // Extract text from child blocks
      const keyText = this.extractChildText(blocks, keyBlock);
      const valueText = this.extractChildText(blocks, valueBlock);

      if (keyText && valueText) {
        kvPairs.push({
          key: keyText,
          value: valueText,
          confidence: Math.min(keyBlock.Confidence || 0, valueBlock.Confidence || 0) / 100,
        });
      }
    }

    return kvPairs;
  }

  /**
   * Extract tables from document
   */
  private extractTables(blocks: any[]): Array<{ rows: number; columns: number; data: string[][] }> {
    const tables: Array<{ rows: number; columns: number; data: string[][] }> = [];

    const tableBlocks = blocks.filter((block) => block.BlockType === 'TABLE');

    for (const tableBlock of tableBlocks) {
      if (!tableBlock.Relationships) continue;

      const cellRelation = tableBlock.Relationships.find((rel: any) => rel.Type === 'CHILD');

      if (!cellRelation) continue;

      const cellIds = cellRelation.Ids || [];
      const cells = blocks.filter((b) => cellIds.includes(b.Id));

      // Build table structure
      const tableData: string[][] = [];
      let maxRow = 0;
      let maxCol = 0;

      for (const cell of cells) {
        if (cell.BlockType !== 'CELL') continue;

        const row = cell.RowIndex || 1;
        const col = cell.ColumnIndex || 1;

        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);

        if (!tableData[row - 1]) {
          tableData[row - 1] = [];
        }

        tableData[row - 1][col - 1] = this.extractChildText(blocks, cell);
      }

      tables.push({
        rows: maxRow,
        columns: maxCol,
        data: tableData,
      });
    }

    return tables;
  }

  /**
   * Extract text from child blocks
   */
  private extractChildText(blocks: any[], parentBlock: any): string {
    if (!parentBlock.Relationships) return '';

    const childRelation = parentBlock.Relationships.find((rel: any) => rel.Type === 'CHILD');

    if (!childRelation) return '';

    const childIds = childRelation.Ids || [];
    const childBlocks = blocks.filter((b) => childIds.includes(b.Id));

    return childBlocks
      .map((block) => block.Text)
      .filter(Boolean)
      .join(' ');
  }

  /**
   * Check if file is an image
   */
  private isImageFile(filename: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some((ext) => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Check if OCR is applicable for this file type
   */
  isOCRApplicable(mimetype: string): boolean {
    const ocrTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    return ocrTypes.includes(mimetype);
  }
}

// Export singleton instance
export const ocrService = new OCRService();
