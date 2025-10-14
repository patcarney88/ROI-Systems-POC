/**
 * Elasticsearch Service for Full-Text Document Search
 * Provides advanced search capabilities across all documents
 */

import { Client } from '@elastic/elasticsearch';
import { createLogger } from '../utils/logger';

const logger = createLogger('search-service');

export interface SearchQuery {
  query: string;
  filters?: {
    userId?: string;
    clientId?: string;
    categoryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    fileTypes?: string[];
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  score: number;
  category: string;
  uploadedAt: Date;
  highlights?: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  took: number; // milliseconds
}

export class SearchService {
  private client: Client;
  private indexName: string;
  private enabled: boolean;

  constructor() {
    this.indexName = 'documents';
    this.enabled = process.env.ELASTICSEARCH_ENABLED !== 'false';

    if (this.enabled) {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        auth: {
          username: process.env.ELASTICSEARCH_USERNAME || 'elastic',
          password: process.env.ELASTICSEARCH_PASSWORD || '',
        },
      });

      this.initializeIndex().catch((error) => {
        logger.error('Failed to initialize Elasticsearch index:', error);
      });

      logger.info('Elasticsearch service initialized');
    } else {
      logger.warn('Elasticsearch disabled - development mode');
    }
  }

  /**
   * Initialize Elasticsearch index with mapping
   */
  private async initializeIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });

      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                userId: { type: 'keyword' },
                clientId: { type: 'keyword' },
                categoryId: { type: 'keyword' },
                title: {
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' },
                  },
                },
                description: { type: 'text', analyzer: 'standard' },
                originalFileName: { type: 'text' },
                mimeType: { type: 'keyword' },
                ocrText: {
                  type: 'text',
                  analyzer: 'standard',
                },
                category: { type: 'keyword' },
                uploadedAt: { type: 'date' },
                fileSize: { type: 'long' },
                status: { type: 'keyword' },
              },
            },
            settings: {
              number_of_shards: 1,
              number_of_replicas: 1,
              analysis: {
                analyzer: {
                  standard: {
                    type: 'standard',
                    stopwords: '_english_',
                  },
                },
              },
            },
          },
        });

        logger.info('Elasticsearch index created successfully');
      }
    } catch (error) {
      logger.error('Index initialization error:', error);
      throw error;
    }
  }

  /**
   * Index a document for searching
   */
  async indexDocument(document: {
    id: string;
    userId: string;
    clientId?: string;
    categoryId: string;
    title: string;
    description?: string;
    originalFileName: string;
    mimeType: string;
    ocrText?: string;
    category: string;
    uploadedAt: Date;
    fileSize: number;
    status: string;
  }): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.client.index({
        index: this.indexName,
        id: document.id,
        body: document,
        refresh: true,
      });

      logger.info(`Document indexed: ${document.id}`);
    } catch (error) {
      logger.error('Document indexing error:', error);
      throw new Error(`Failed to index document: ${error}`);
    }
  }

  /**
   * Search documents with full-text search
   */
  async search(searchQuery: SearchQuery): Promise<SearchResponse> {
    if (!this.enabled) {
      return {
        results: [],
        total: 0,
        page: 1,
        limit: 20,
        pages: 0,
        took: 0,
      };
    }

    try {
      const { query, filters, pagination, sort } = searchQuery;

      // Build Elasticsearch query
      const must: any[] = [
        {
          multi_match: {
            query,
            fields: ['title^3', 'description^2', 'ocrText', 'originalFileName^2'],
            type: 'best_fields',
            operator: 'or',
            fuzziness: 'AUTO',
          },
        },
      ];

      // Apply filters
      const filter: any[] = [];

      if (filters?.userId) {
        filter.push({ term: { userId: filters.userId } });
      }

      if (filters?.clientId) {
        filter.push({ term: { clientId: filters.clientId } });
      }

      if (filters?.categoryId) {
        filter.push({ term: { categoryId: filters.categoryId } });
      }

      if (filters?.dateFrom || filters?.dateTo) {
        const range: any = {};
        if (filters.dateFrom) range.gte = filters.dateFrom;
        if (filters.dateTo) range.lte = filters.dateTo;
        filter.push({ range: { uploadedAt: range } });
      }

      if (filters?.fileTypes && filters.fileTypes.length > 0) {
        filter.push({ terms: { mimeType: filters.fileTypes } });
      }

      // Pagination
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 20;
      const from = (page - 1) * limit;

      // Sort
      const sortField = sort?.field || 'uploadedAt';
      const sortOrder = sort?.order || 'desc';

      // Execute search
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          from,
          size: limit,
          sort: [{ [sortField]: { order: sortOrder } }],
          highlight: {
            fields: {
              title: {},
              description: {},
              ocrText: { fragment_size: 150 },
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
          },
        },
      });

      // Parse results
      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number'
        ? response.hits.total
        : response.hits.total?.value || 0;

      const results: SearchResult[] = hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source.title,
        snippet: this.extractSnippet(hit),
        score: hit._score || 0,
        category: hit._source.category,
        uploadedAt: new Date(hit._source.uploadedAt),
        highlights: this.extractHighlights(hit),
      }));

      logger.info(`Search completed: ${total} results found in ${response.took}ms`);

      return {
        results,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
        took: response.took || 0,
      };
    } catch (error) {
      logger.error('Search error:', error);
      throw new Error(`Search failed: ${error}`);
    }
  }

  /**
   * Extract snippet from search result
   */
  private extractSnippet(hit: any): string {
    if (hit.highlight) {
      if (hit.highlight.ocrText && hit.highlight.ocrText[0]) {
        return hit.highlight.ocrText[0];
      }
      if (hit.highlight.description && hit.highlight.description[0]) {
        return hit.highlight.description[0];
      }
      if (hit.highlight.title && hit.highlight.title[0]) {
        return hit.highlight.title[0];
      }
    }

    // Fallback to description or OCR text
    return hit._source.description || hit._source.ocrText?.substring(0, 150) || '';
  }

  /**
   * Extract highlights from search result
   */
  private extractHighlights(hit: any): string[] {
    const highlights: string[] = [];

    if (hit.highlight) {
      for (const field of Object.keys(hit.highlight)) {
        highlights.push(...hit.highlight[field]);
      }
    }

    return highlights;
  }

  /**
   * Update document in index
   */
  async updateDocument(id: string, updates: Partial<any>): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.client.update({
        index: this.indexName,
        id,
        body: {
          doc: updates,
        },
        refresh: true,
      });

      logger.info(`Document updated in index: ${id}`);
    } catch (error) {
      logger.error('Document update error:', error);
      throw new Error(`Failed to update document: ${error}`);
    }
  }

  /**
   * Delete document from index
   */
  async deleteDocument(id: string): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.client.delete({
        index: this.indexName,
        id,
        refresh: true,
      });

      logger.info(`Document deleted from index: ${id}`);
    } catch (error) {
      logger.error('Document deletion error:', error);
      throw new Error(`Failed to delete document: ${error}`);
    }
  }

  /**
   * Bulk index multiple documents
   */
  async bulkIndex(documents: any[]): Promise<void> {
    if (!this.enabled || documents.length === 0) return;

    try {
      const operations = documents.flatMap((doc) => [
        { index: { _index: this.indexName, _id: doc.id } },
        doc,
      ]);

      const response = await this.client.bulk({
        body: operations,
        refresh: true,
      });

      if (response.errors) {
        logger.error('Bulk indexing had errors');
      } else {
        logger.info(`Bulk indexed ${documents.length} documents`);
      }
    } catch (error) {
      logger.error('Bulk indexing error:', error);
      throw new Error(`Failed to bulk index documents: ${error}`);
    }
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(prefix: string, userId: string): Promise<string[]> {
    if (!this.enabled) return [];

    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                {
                  prefix: {
                    'title.keyword': prefix,
                  },
                },
              ],
              filter: [{ term: { userId } }],
            },
          },
          size: 10,
          _source: ['title'],
        },
      });

      return response.hits.hits.map((hit: any) => hit._source.title);
    } catch (error) {
      logger.error('Suggestions error:', error);
      return [];
    }
  }
}

// Export singleton instance
export const searchService = new SearchService();
