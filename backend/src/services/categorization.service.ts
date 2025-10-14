/**
 * Document Categorization Service
 * ML-based automatic document classification for real estate documents
 */

import { createLogger } from '../utils/logger';

const logger = createLogger('categorization');

export interface CategoryPrediction {
  category: string;
  confidence: number;
  alternativeCategories: Array<{ category: string; confidence: number }>;
}

export type DocumentType =
  | 'Deed'
  | 'Mortgage/Deed of Trust'
  | 'Title Policy'
  | 'Closing Statement (HUD-1/CD)'
  | 'Property Survey'
  | 'Home Inspection'
  | 'Insurance Documents'
  | 'Tax Documents';

export class CategorizationService {
  private categoryKeywords: Map<DocumentType, string[]>;
  private mlEnabled: boolean;

  constructor() {
    this.mlEnabled = process.env.ML_CATEGORIZATION_ENABLED !== 'false';
    this.categoryKeywords = this.initializeCategoryKeywords();

    logger.info(`Document categorization service initialized (ML: ${this.mlEnabled})`);
  }

  /**
   * Initialize category keywords for rule-based classification
   */
  private initializeCategoryKeywords(): Map<DocumentType, string[]> {
    return new Map<DocumentType, string[]>([
      [
        'Deed',
        [
          'deed',
          'grantor',
          'grantee',
          'warranty deed',
          'quitclaim deed',
          'special warranty deed',
          'conveyance',
          'hereby grant',
        ],
      ],
      [
        'Mortgage/Deed of Trust',
        [
          'mortgage',
          'deed of trust',
          'promissory note',
          'lender',
          'borrower',
          'loan agreement',
          'security interest',
          'indebtedness',
          'principal amount',
        ],
      ],
      [
        'Title Policy',
        [
          'title insurance',
          'title policy',
          'insured',
          'title company',
          'title examination',
          'schedule a',
          'schedule b',
          'exceptions',
          'insuring provisions',
        ],
      ],
      [
        'Closing Statement (HUD-1/CD)',
        [
          'hud-1',
          'closing disclosure',
          'settlement statement',
          'good faith estimate',
          'closing costs',
          'loan estimate',
          'trid',
          'settlement charges',
        ],
      ],
      [
        'Property Survey',
        [
          'survey',
          'surveyor',
          'boundary',
          'plat',
          'legal description',
          'easement',
          'encroachment',
          'metes and bounds',
          'property line',
        ],
      ],
      [
        'Home Inspection',
        [
          'inspection report',
          'home inspection',
          'property inspection',
          'inspector',
          'structural',
          'hvac',
          'electrical',
          'plumbing',
          'foundation',
          'roof',
        ],
      ],
      [
        'Insurance Documents',
        [
          'insurance policy',
          'homeowners insurance',
          'property insurance',
          'liability coverage',
          'premium',
          'deductible',
          'coverage amount',
          'policy number',
        ],
      ],
      [
        'Tax Documents',
        [
          'property tax',
          'tax assessment',
          'tax bill',
          'millage rate',
          'assessed value',
          'tax collector',
          'tax certificate',
          'exemption',
        ],
      ],
    ]);
  }

  /**
   * Categorize document based on content and filename
   */
  async categorize(
    text: string,
    filename: string,
    metadata?: Record<string, any>
  ): Promise<CategoryPrediction> {
    try {
      // Combine text and filename for analysis
      const contentToAnalyze = `${filename.toLowerCase()} ${text.toLowerCase()}`;

      // Calculate scores for each category
      const scores = new Map<DocumentType, number>();

      for (const [category, keywords] of this.categoryKeywords.entries()) {
        const score = this.calculateCategoryScore(contentToAnalyze, keywords);
        scores.set(category, score);
      }

      // Find best match
      const sortedScores = Array.from(scores.entries())
        .sort((a, b) => b[1] - a[1])
        .filter(([, score]) => score > 0);

      if (sortedScores.length === 0) {
        logger.warn(`No category match found for: ${filename}`);
        return {
          category: 'Unknown',
          confidence: 0,
          alternativeCategories: [],
        };
      }

      const [bestCategory, bestScore] = sortedScores[0];

      // Normalize confidence score (0-1 scale)
      const confidence = Math.min(bestScore / 100, 1.0);

      // Get alternative categories
      const alternativeCategories = sortedScores
        .slice(1, 4)
        .map(([category, score]) => ({
          category,
          confidence: Math.min(score / 100, 1.0),
        }));

      logger.info(
        `Document categorized: ${filename} -> ${bestCategory} (${(confidence * 100).toFixed(1)}%)`
      );

      return {
        category: bestCategory,
        confidence,
        alternativeCategories,
      };
    } catch (error) {
      logger.error('Categorization error:', error);
      throw new Error(`Failed to categorize document: ${error}`);
    }
  }

  /**
   * Calculate category score based on keyword matching
   */
  private calculateCategoryScore(text: string, keywords: string[]): number {
    let score = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);

      if (matches) {
        // Weight score based on keyword specificity and frequency
        const frequency = matches.length;
        const keywordScore = keyword.length > 10 ? 15 : 10; // Longer keywords = more specific
        score += keywordScore * Math.min(frequency, 3); // Cap frequency bonus at 3x
      }
    }

    return score;
  }

  /**
   * Batch categorize multiple documents
   */
  async categorizeMultiple(
    documents: Array<{ text: string; filename: string; metadata?: Record<string, any> }>
  ): Promise<Map<string, CategoryPrediction>> {
    const results = new Map<string, CategoryPrediction>();

    // Process in parallel
    const promises = documents.map(async (doc) => {
      const prediction = await this.categorize(doc.text, doc.filename, doc.metadata);
      results.set(doc.filename, prediction);
    });

    await Promise.all(promises);

    logger.info(`Batch categorization completed: ${documents.length} documents`);

    return results;
  }

  /**
   * Get all available categories
   */
  getAvailableCategories(): DocumentType[] {
    return Array.from(this.categoryKeywords.keys());
  }

  /**
   * Validate if category exists
   */
  isValidCategory(category: string): boolean {
    return this.categoryKeywords.has(category as DocumentType);
  }

  /**
   * Get category description
   */
  getCategoryDescription(category: DocumentType): string {
    const descriptions: Record<DocumentType, string> = {
      Deed: 'Legal document transferring property ownership',
      'Mortgage/Deed of Trust': 'Loan agreement and security instrument',
      'Title Policy': 'Insurance policy protecting property ownership',
      'Closing Statement (HUD-1/CD)': 'Final settlement statement with all costs',
      'Property Survey': 'Professional survey of property boundaries',
      'Home Inspection': 'Detailed report on property condition',
      'Insurance Documents': 'Property and liability insurance policies',
      'Tax Documents': 'Property tax assessments and bills',
    };

    return descriptions[category] || 'Unknown document type';
  }

  /**
   * Suggest category based on partial information
   */
  suggestCategory(partialText: string): DocumentType[] {
    const suggestions: Array<{ category: DocumentType; score: number }> = [];

    for (const [category, keywords] of this.categoryKeywords.entries()) {
      const score = this.calculateCategoryScore(partialText.toLowerCase(), keywords);
      if (score > 10) {
        suggestions.push({ category, score });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.category);
  }
}

// Export singleton instance
export const categorizationService = new CategorizationService();
