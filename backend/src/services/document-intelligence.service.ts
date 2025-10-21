/**
 * Document Intelligence Service
 *
 * Integrates ML-powered document analysis features:
 * - Summarization (extractive and abstractive)
 * - Change detection (text and visual)
 * - Compliance checking
 * - Document relationship detection
 */

import axios, { AxiosInstance } from 'axios';
import { createLogger } from '../utils/logger';

const logger = createLogger('document-intelligence');

// Type definitions
interface SummaryResult {
  executiveSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  mainParties: string[];
  keyDates: Record<string, string>;
  keyAmounts: Record<string, string>;
  actionItems: string[];
  summaryMethod: 'EXTRACTIVE' | 'ABSTRACTIVE' | 'HYBRID';
  wordCount: number;
  originalWordCount: number;
  compressionRatio: number;
  modelVersion?: string;
  confidence?: number;
  processingTime?: number;
}

interface ChangeDetectionResult {
  additions: string[];
  deletions: string[];
  modifications: Array<{
    old: string;
    new: string;
    similarity: number;
  }>;
  changePercentage: number;
  significance: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  changesSummary: string;
  textDiff: string;
  visualDiffUrl?: string;
  criticalChanges: Array<{
    type: 'addition' | 'deletion' | 'modification';
    content?: string;
    oldContent?: string;
    newContent?: string;
    keywords: string[];
  }>;
}

interface ComplianceCheckResult {
  overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIALLY_COMPLIANT' | 'NEEDS_REVIEW';
  checks: Array<{
    checkName: string;
    checkType: string;
    status: 'PASS' | 'FAIL' | 'WARNING';
    message: string;
    severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  }>;
  criticalIssues: number;
  warnings: number;
  suggestions: number;
  missingSignatures: string[];
  missingFields: string[];
  dateInconsistencies: string[];
  formatIssues: string[];
  requiresReview: boolean;
}

interface IntelligenceJobStatus {
  id: string;
  documentId: string;
  jobType: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  progress: number;
  result?: any;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  duration?: number;
}

export class DocumentIntelligenceService {
  private readonly mlApiUrl: string;
  private readonly apiClient: AxiosInstance;
  private readonly requestTimeout: number = 120000; // 2 minutes for ML operations

  constructor() {
    this.mlApiUrl = process.env.ML_API_URL || 'http://localhost:8000';

    this.apiClient = axios.create({
      baseURL: this.mlApiUrl,
      timeout: this.requestTimeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      response => response,
      error => {
        logger.error('ML API request failed:', {
          url: error.config?.url,
          status: error.response?.status,
          message: error.message
        });
        throw error;
      }
    );
  }

  /**
   * Generate document summary
   */
  async generateSummary(
    documentId: string,
    fullText: string,
    category?: string
  ): Promise<SummaryResult> {
    try {
      logger.info(`Generating summary for document ${documentId}`);

      const response = await this.apiClient.post<SummaryResult>(
        '/v1/intelligence/summarize',
        {
          text: fullText,
          category: category
        }
      );

      logger.info(`Summary generated for document ${documentId}`);

      return {
        executiveSummary: response.data.executiveSummary || response.data.executive_summary,
        detailedSummary: response.data.detailedSummary || response.data.detailed_summary,
        keyPoints: response.data.keyPoints || response.data.key_points || [],
        mainParties: response.data.mainParties || response.data.main_parties || [],
        keyDates: response.data.keyDates || response.data.key_dates || {},
        keyAmounts: response.data.keyAmounts || response.data.key_amounts || {},
        actionItems: response.data.actionItems || response.data.action_items || [],
        summaryMethod: response.data.summaryMethod || response.data.summary_method || 'HYBRID',
        wordCount: response.data.wordCount || response.data.word_count || 0,
        originalWordCount: response.data.originalWordCount || response.data.original_word_count || 0,
        compressionRatio: response.data.compressionRatio || response.data.compression_ratio || 0,
        modelVersion: response.data.modelVersion || response.data.model_version,
        confidence: response.data.confidence,
        processingTime: response.data.processingTime || response.data.processing_time
      };

    } catch (error) {
      logger.error(`Failed to generate summary for document ${documentId}:`, error);
      throw new Error(`Summary generation failed: ${error.message}`);
    }
  }

  /**
   * Detect changes between document versions
   */
  async detectChanges(
    documentId: string,
    oldText: string,
    newText: string,
    oldPdfPath?: string,
    newPdfPath?: string
  ): Promise<ChangeDetectionResult> {
    try {
      logger.info(`Detecting changes for document ${documentId}`);

      const response = await this.apiClient.post<any>(
        '/v1/intelligence/changes',
        {
          old_text: oldText,
          new_text: newText,
          old_pdf_path: oldPdfPath,
          new_pdf_path: newPdfPath
        }
      );

      const data = response.data;

      logger.info(`Change detection complete for document ${documentId}: ${data.significance} significance`);

      return {
        additions: data.additions || [],
        deletions: data.deletions || [],
        modifications: data.modifications || [],
        changePercentage: data.change_percentage || data.changePercentage || 0,
        significance: data.significance || 'LOW',
        changesSummary: data.changes_summary || data.changesSummary || '',
        textDiff: data.text_diff || data.textDiff || '',
        visualDiffUrl: data.visual_diff_url || data.visualDiffUrl,
        criticalChanges: data.critical_changes || data.criticalChanges || []
      };

    } catch (error) {
      logger.error(`Failed to detect changes for document ${documentId}:`, error);
      throw new Error(`Change detection failed: ${error.message}`);
    }
  }

  /**
   * Check document compliance
   */
  async checkCompliance(
    documentId: string,
    category: string,
    extractedData: any,
    transactionType?: string
  ): Promise<ComplianceCheckResult> {
    try {
      logger.info(`Checking compliance for document ${documentId} (${category})`);

      const response = await this.apiClient.post<any>(
        '/v1/intelligence/compliance',
        {
          category: category,
          data: extractedData,
          transaction_type: transactionType
        }
      );

      const data = response.data;

      logger.info(`Compliance check completed for document ${documentId}: ${data.overall_status}`);

      return {
        overallStatus: data.overall_status || data.overallStatus || 'NEEDS_REVIEW',
        checks: data.checks || [],
        criticalIssues: data.critical_issues || data.criticalIssues || 0,
        warnings: data.warnings || 0,
        suggestions: data.suggestions || 0,
        missingSignatures: data.missing_signatures || data.missingSignatures || [],
        missingFields: data.missing_fields || data.missingFields || [],
        dateInconsistencies: data.date_inconsistencies || data.dateInconsistencies || [],
        formatIssues: data.format_issues || data.formatIssues || [],
        requiresReview: data.requires_review || data.requiresReview || false
      };

    } catch (error) {
      logger.error(`Compliance check failed for document ${documentId}:`, error);
      throw new Error(`Compliance check failed: ${error.message}`);
    }
  }

  /**
   * Run full document intelligence analysis
   */
  async runFullAnalysis(
    documentId: string,
    fullText: string,
    category: string,
    extractedData: any,
    previousVersionText?: string
  ): Promise<{
    summary: SummaryResult;
    compliance: ComplianceCheckResult;
    changes?: ChangeDetectionResult;
  }> {
    try {
      logger.info(`Running full intelligence analysis for document ${documentId}`);

      // Run all analyses in parallel where possible
      const promises: Array<Promise<any>> = [
        this.generateSummary(documentId, fullText, category),
        this.checkCompliance(documentId, category, extractedData)
      ];

      // Add change detection if previous version exists
      if (previousVersionText) {
        promises.push(
          this.detectChanges(documentId, previousVersionText, fullText)
        );
      }

      const results = await Promise.all(promises);

      const analysis: any = {
        summary: results[0],
        compliance: results[1]
      };

      if (previousVersionText) {
        analysis.changes = results[2];
      }

      logger.info(`Full intelligence analysis complete for document ${documentId}`);

      return analysis;

    } catch (error) {
      logger.error(`Full analysis failed for document ${documentId}:`, error);
      throw new Error(`Full analysis failed: ${error.message}`);
    }
  }

  /**
   * Get job status for async operations
   */
  async getJobStatus(jobId: string): Promise<IntelligenceJobStatus> {
    try {
      const response = await this.apiClient.get<IntelligenceJobStatus>(
        `/v1/intelligence/jobs/${jobId}`
      );

      return response.data;

    } catch (error) {
      logger.error(`Failed to get job status for ${jobId}:`, error);
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  /**
   * Health check for ML API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.apiClient.get('/health', {
        timeout: 5000
      });

      return response.status === 200;

    } catch (error) {
      logger.warn('ML API health check failed:', error.message);
      return false;
    }
  }

  /**
   * Get available document categories for compliance checking
   */
  getAvailableCategories(): string[] {
    return [
      'SETTLEMENT_STATEMENT',
      'PURCHASE_AGREEMENT',
      'LOAN_APPLICATION',
      'TITLE_INSURANCE',
      'DEED',
      'DISCLOSURE',
      'INSPECTION_REPORT',
      'APPRAISAL'
    ];
  }

  /**
   * Determine change type based on change detection result
   */
  determineChangeType(changes: ChangeDetectionResult): string {
    const changePercent = changes.changePercentage;

    if (changePercent > 50) return 'MAJOR_REVISION';
    if (changePercent > 20) return 'MINOR_EDIT';
    if (changePercent > 5) return 'CORRECTION';
    return 'MINOR_EDIT';
  }

  /**
   * Format diff for display
   */
  formatDiff(changes: ChangeDetectionResult): string {
    let diff = '';

    if (changes.additions.length > 0) {
      diff += '+ ADDITIONS:\n' + changes.additions.join('\n') + '\n\n';
    }

    if (changes.deletions.length > 0) {
      diff += '- DELETIONS:\n' + changes.deletions.join('\n') + '\n\n';
    }

    if (changes.modifications.length > 0) {
      diff += '~ MODIFICATIONS:\n';
      changes.modifications.forEach(mod => {
        diff += `  OLD: ${mod.old}\n  NEW: ${mod.new}\n\n`;
      });
    }

    return diff;
  }
}

// Export singleton instance
export const documentIntelligenceService = new DocumentIntelligenceService();
