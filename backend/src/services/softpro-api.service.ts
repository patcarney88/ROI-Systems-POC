/**
 * SoftPro API Service
 *
 * RESTful API wrapper for all SoftPro 360 endpoints
 * Features:
 * - Automatic authentication header injection
 * - Rate limit handling with retry logic
 * - Request/response logging
 * - Error transformation
 * - Support for sandbox and production environments
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { getValidAccessToken } from './softpro-oauth.service';
import { RetryManager, ErrorType } from '../utils/retry-manager';
import {
  Transaction,
  TransactionData,
  TransactionFilters,
  Contact,
  ContactData,
  ContactFilters,
  Document,
  DocumentMetadata,
  DocumentFilters,
  Party,
  PartyData,
  Property,
  PropertyData,
  Status,
  PaginatedResponse,
  SoftProAPIError,
  RateLimitError,
  AuthenticationError,
  ValidationError,
  NetworkError,
} from '../types/softpro.types';

const logger = createLogger('softpro-api');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOFTPRO_SANDBOX_BASE_URL =
  process.env.SOFTPRO_SANDBOX_BASE_URL ||
  'https://api-sandbox.softprocorp.com/api/v1';

const SOFTPRO_PRODUCTION_BASE_URL =
  process.env.SOFTPRO_PRODUCTION_BASE_URL || 'https://api.softprocorp.com/api/v1';

const RATE_LIMIT_PER_MIN = parseInt(process.env.SOFTPRO_RATE_LIMIT_PER_MIN || '100', 10);
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// ============================================================================
// SOFTPRO API CLIENT
// ============================================================================

export class SoftProAPIService {
  private axiosInstance: AxiosInstance;
  private retryManager: RetryManager;
  private integrationId: string;
  private environment: 'SANDBOX' | 'PRODUCTION';

  constructor(integrationId: string, environment: 'SANDBOX' | 'PRODUCTION' = 'SANDBOX') {
    this.integrationId = integrationId;
    this.environment = environment;

    const baseURL =
      environment === 'PRODUCTION' ? SOFTPRO_PRODUCTION_BASE_URL : SOFTPRO_SANDBOX_BASE_URL;

    this.axiosInstance = axios.create({
      baseURL,
      timeout: REQUEST_TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Setup interceptors
    this.setupRequestInterceptor();
    this.setupResponseInterceptor();

    // Initialize retry manager
    this.retryManager = new RetryManager({
      maxAttempts: 3,
      initialDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      retryableErrors: [
        ErrorType.NETWORK,
        ErrorType.RATE_LIMIT,
        ErrorType.SERVER_ERROR,
        ErrorType.TIMEOUT,
      ],
    });

    logger.info('SoftPro API client initialized', {
      integrationId,
      environment,
      baseURL,
    });
  }

  // ==========================================================================
  // TRANSACTION ENDPOINTS
  // ==========================================================================

  /**
   * Get transactions with optional filters
   * @param filters - Transaction filters
   * @returns Paginated list of transactions
   */
  async getTransactions(
    filters?: TransactionFilters
  ): Promise<PaginatedResponse<Transaction>> {
    return this.retryManager.executeWithRetry(async () => {
      const params = this.buildTransactionFilterParams(filters);

      const response = await this.axiosInstance.get<PaginatedResponse<Transaction>>(
        '/transactions',
        { params }
      );

      await this.logSync('TRANSACTION', 'READ', 'COMPLETED', {
        filters,
        count: response.data.data.length,
      });

      return response.data;
    }, 'getTransactions');
  }

  /**
   * Get single transaction by ID
   * @param orderId - Order ID
   * @returns Transaction
   */
  async getTransaction(orderId: string): Promise<Transaction> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<Transaction>(
        `/transactions/${orderId}`
      );

      await this.logSync('TRANSACTION', 'READ', 'COMPLETED', {
        orderId,
      });

      return response.data;
    }, 'getTransaction');
  }

  /**
   * Create new transaction
   * @param data - Transaction data
   * @returns Created transaction
   */
  async createTransaction(data: TransactionData): Promise<Transaction> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.post<Transaction>('/transactions', data);

      await this.logSync('TRANSACTION', 'CREATE', 'COMPLETED', {
        orderId: response.data.orderId,
      });

      return response.data;
    }, 'createTransaction');
  }

  /**
   * Update existing transaction
   * @param orderId - Order ID
   * @param data - Partial transaction data
   * @returns Updated transaction
   */
  async updateTransaction(
    orderId: string,
    data: Partial<TransactionData>
  ): Promise<Transaction> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.patch<Transaction>(
        `/transactions/${orderId}`,
        data
      );

      await this.logSync('TRANSACTION', 'UPDATE', 'COMPLETED', {
        orderId,
        updatedFields: Object.keys(data),
      });

      return response.data;
    }, 'updateTransaction');
  }

  /**
   * Delete transaction
   * @param orderId - Order ID
   */
  async deleteTransaction(orderId: string): Promise<void> {
    return this.retryManager.executeWithRetry(async () => {
      await this.axiosInstance.delete(`/transactions/${orderId}`);

      await this.logSync('TRANSACTION', 'DELETE', 'COMPLETED', {
        orderId,
      });
    }, 'deleteTransaction');
  }

  // ==========================================================================
  // DOCUMENT ENDPOINTS
  // ==========================================================================

  /**
   * Get documents for a transaction
   * @param orderId - Order ID
   * @param filters - Document filters
   * @returns List of documents
   */
  async getDocuments(
    orderId: string,
    filters?: DocumentFilters
  ): Promise<Document[]> {
    return this.retryManager.executeWithRetry(async () => {
      const params = this.buildDocumentFilterParams(filters);

      const response = await this.axiosInstance.get<Document[]>(
        `/transactions/${orderId}/documents`,
        { params }
      );

      await this.logSync('DOCUMENT', 'READ', 'COMPLETED', {
        orderId,
        count: response.data.length,
      });

      return response.data;
    }, 'getDocuments');
  }

  /**
   * Get single document
   * @param orderId - Order ID
   * @param documentId - Document ID
   * @returns Document
   */
  async getDocument(orderId: string, documentId: string): Promise<Document> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<Document>(
        `/transactions/${orderId}/documents/${documentId}`
      );

      await this.logSync('DOCUMENT', 'READ', 'COMPLETED', {
        orderId,
        documentId,
      });

      return response.data;
    }, 'getDocument');
  }

  /**
   * Upload document
   * @param orderId - Order ID
   * @param file - File buffer
   * @param metadata - Document metadata
   * @returns Uploaded document
   */
  async uploadDocument(
    orderId: string,
    file: Buffer,
    metadata: DocumentMetadata
  ): Promise<Document> {
    return this.retryManager.executeWithRetry(async () => {
      const formData = new FormData();
      formData.append('file', new Blob([file]), metadata.documentType);
      formData.append('metadata', JSON.stringify(metadata));

      const response = await this.axiosInstance.post<Document>(
        `/transactions/${orderId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      await this.logSync('DOCUMENT', 'CREATE', 'COMPLETED', {
        orderId,
        documentId: response.data.documentId,
        documentType: metadata.documentType,
      });

      return response.data;
    }, 'uploadDocument');
  }

  /**
   * Download document
   * @param orderId - Order ID
   * @param documentId - Document ID
   * @returns File buffer
   */
  async downloadDocument(orderId: string, documentId: string): Promise<Buffer> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get(
        `/transactions/${orderId}/documents/${documentId}/download`,
        {
          responseType: 'arraybuffer',
        }
      );

      await this.logSync('DOCUMENT', 'READ', 'COMPLETED', {
        orderId,
        documentId,
        operation: 'download',
      });

      return Buffer.from(response.data);
    }, 'downloadDocument');
  }

  /**
   * Delete document
   * @param orderId - Order ID
   * @param documentId - Document ID
   */
  async deleteDocument(orderId: string, documentId: string): Promise<void> {
    return this.retryManager.executeWithRetry(async () => {
      await this.axiosInstance.delete(
        `/transactions/${orderId}/documents/${documentId}`
      );

      await this.logSync('DOCUMENT', 'DELETE', 'COMPLETED', {
        orderId,
        documentId,
      });
    }, 'deleteDocument');
  }

  // ==========================================================================
  // CONTACT ENDPOINTS
  // ==========================================================================

  /**
   * Get contacts with optional filters
   * @param filters - Contact filters
   * @returns Paginated list of contacts
   */
  async getContacts(filters?: ContactFilters): Promise<PaginatedResponse<Contact>> {
    return this.retryManager.executeWithRetry(async () => {
      const params = this.buildContactFilterParams(filters);

      const response = await this.axiosInstance.get<PaginatedResponse<Contact>>(
        '/contacts',
        { params }
      );

      await this.logSync('CONTACT', 'READ', 'COMPLETED', {
        filters,
        count: response.data.data.length,
      });

      return response.data;
    }, 'getContacts');
  }

  /**
   * Get single contact by ID
   * @param contactId - Contact ID
   * @returns Contact
   */
  async getContact(contactId: string): Promise<Contact> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<Contact>(`/contacts/${contactId}`);

      await this.logSync('CONTACT', 'READ', 'COMPLETED', {
        contactId,
      });

      return response.data;
    }, 'getContact');
  }

  /**
   * Create new contact
   * @param data - Contact data
   * @returns Created contact
   */
  async createContact(data: ContactData): Promise<Contact> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.post<Contact>('/contacts', data);

      await this.logSync('CONTACT', 'CREATE', 'COMPLETED', {
        contactId: response.data.contactId,
      });

      return response.data;
    }, 'createContact');
  }

  /**
   * Update existing contact
   * @param contactId - Contact ID
   * @param data - Partial contact data
   * @returns Updated contact
   */
  async updateContact(
    contactId: string,
    data: Partial<ContactData>
  ): Promise<Contact> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.patch<Contact>(
        `/contacts/${contactId}`,
        data
      );

      await this.logSync('CONTACT', 'UPDATE', 'COMPLETED', {
        contactId,
        updatedFields: Object.keys(data),
      });

      return response.data;
    }, 'updateContact');
  }

  // ==========================================================================
  // PARTY ENDPOINTS
  // ==========================================================================

  /**
   * Get parties for a transaction
   * @param orderId - Order ID
   * @returns List of parties
   */
  async getParties(orderId: string): Promise<Party[]> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<Party[]>(
        `/transactions/${orderId}/parties`
      );

      await this.logSync('PARTY', 'READ', 'COMPLETED', {
        orderId,
        count: response.data.length,
      });

      return response.data;
    }, 'getParties');
  }

  /**
   * Add party to transaction
   * @param orderId - Order ID
   * @param partyData - Party data
   * @returns Created party
   */
  async addParty(orderId: string, partyData: PartyData): Promise<Party> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.post<Party>(
        `/transactions/${orderId}/parties`,
        partyData
      );

      await this.logSync('PARTY', 'CREATE', 'COMPLETED', {
        orderId,
        partyId: response.data.partyId,
        partyType: partyData.partyType,
      });

      return response.data;
    }, 'addParty');
  }

  /**
   * Update party in transaction
   * @param orderId - Order ID
   * @param partyId - Party ID
   * @param data - Partial party data
   * @returns Updated party
   */
  async updateParty(
    orderId: string,
    partyId: string,
    data: Partial<PartyData>
  ): Promise<Party> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.patch<Party>(
        `/transactions/${orderId}/parties/${partyId}`,
        data
      );

      await this.logSync('PARTY', 'UPDATE', 'COMPLETED', {
        orderId,
        partyId,
        updatedFields: Object.keys(data),
      });

      return response.data;
    }, 'updateParty');
  }

  // ==========================================================================
  // PROPERTY ENDPOINTS
  // ==========================================================================

  /**
   * Get property for a transaction
   * @param orderId - Order ID
   * @returns Property
   */
  async getProperty(orderId: string): Promise<Property> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<Property>(
        `/transactions/${orderId}/property`
      );

      await this.logSync('PROPERTY', 'READ', 'COMPLETED', {
        orderId,
      });

      return response.data;
    }, 'getProperty');
  }

  /**
   * Update property for a transaction
   * @param orderId - Order ID
   * @param data - Partial property data
   * @returns Updated property
   */
  async updateProperty(
    orderId: string,
    data: Partial<PropertyData>
  ): Promise<Property> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.patch<Property>(
        `/transactions/${orderId}/property`,
        data
      );

      await this.logSync('PROPERTY', 'UPDATE', 'COMPLETED', {
        orderId,
        updatedFields: Object.keys(data),
      });

      return response.data;
    }, 'updateProperty');
  }

  // ==========================================================================
  // STATUS ENDPOINTS
  // ==========================================================================

  /**
   * Get available statuses
   * @returns List of statuses
   */
  async getStatuses(): Promise<Status[]> {
    return this.retryManager.executeWithRetry(async () => {
      const response = await this.axiosInstance.get<Status[]>('/statuses');

      return response.data;
    }, 'getStatuses');
  }

  /**
   * Update order status
   * @param orderId - Order ID
   * @param statusId - Status ID
   */
  async updateOrderStatus(orderId: string, statusId: string): Promise<void> {
    return this.retryManager.executeWithRetry(async () => {
      await this.axiosInstance.patch(`/transactions/${orderId}/status`, {
        statusId,
      });

      await this.logSync('TRANSACTION', 'UPDATE', 'COMPLETED', {
        orderId,
        operation: 'status_change',
        statusId,
      });
    }, 'updateOrderStatus');
  }

  // ==========================================================================
  // INTERCEPTORS
  // ==========================================================================

  /**
   * Setup request interceptor
   */
  private setupRequestInterceptor(): void {
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // Get valid access token (auto-refresh if needed)
          const accessToken = await getValidAccessToken(this.integrationId);

          // Add authorization header
          config.headers.Authorization = `Bearer ${accessToken}`;

          // Log request
          logger.debug('SoftPro API request', {
            method: config.method?.toUpperCase(),
            url: config.url,
            hasData: !!config.data,
          });

          return config;
        } catch (error: any) {
          logger.error('Request interceptor error', {
            error: error.message,
          });
          return Promise.reject(error);
        }
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Setup response interceptor
   */
  private setupResponseInterceptor(): void {
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log successful response
        logger.debug('SoftPro API response', {
          status: response.status,
          url: response.config.url,
        });

        return response;
      },
      async (error) => {
        // Transform error
        const transformedError = this.transformError(error);

        // Log error
        logger.error('SoftPro API error', {
          statusCode: transformedError.statusCode,
          errorCode: transformedError.errorCode,
          message: transformedError.message,
          url: error.config?.url,
        });

        return Promise.reject(transformedError);
      }
    );
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Transform axios error to SoftPro API error
   * @param error - Axios error
   * @returns Transformed error
   */
  private transformError(error: any): SoftProAPIError {
    if (error.response) {
      const { status, data } = error.response;

      // Rate limit error
      if (status === 429) {
        const retryAfter = parseInt(error.response.headers['retry-after'] || '60', 10);
        return new RateLimitError(
          data.message || 'Rate limit exceeded',
          retryAfter,
          data
        );
      }

      // Authentication error
      if (status === 401) {
        return new AuthenticationError(
          data.message || 'Authentication failed',
          data
        );
      }

      // Validation error
      if (status === 400) {
        return new ValidationError(
          data.message || 'Validation failed',
          data.errors,
          data
        );
      }

      // Generic API error
      return new SoftProAPIError(
        status,
        data.code || 'API_ERROR',
        data.message || 'API request failed',
        data
      );
    }

    // Network error
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return new NetworkError(error.message, { code: error.code });
    }

    // Generic error
    return new SoftProAPIError(
      500,
      'UNKNOWN_ERROR',
      error.message || 'Unknown error occurred',
      error
    );
  }

  /**
   * Log sync operation
   * @param entityType - Entity type
   * @param operation - Operation type
   * @param status - Sync status
   * @param metadata - Additional metadata
   */
  private async logSync(
    entityType: string,
    operation: string,
    status: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.syncLog.create({
        data: {
          integrationId: this.integrationId,
          syncType: 'MANUAL',
          entityType: entityType as any,
          operation: operation as any,
          direction: 'SOFTPRO_TO_ROI',
          status: status as any,
          recordsProcessed: 1,
          requestPayload: metadata,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });
    } catch (error: any) {
      logger.warn('Failed to log sync operation', {
        error: error.message,
      });
    }
  }

  /**
   * Build transaction filter params
   */
  private buildTransactionFilterParams(
    filters?: TransactionFilters
  ): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.status) params.status = filters.status.join(',');
    if (filters.orderType) params.orderType = filters.orderType.join(',');
    if (filters.openedDateFrom) params.openedDateFrom = filters.openedDateFrom.toISOString();
    if (filters.openedDateTo) params.openedDateTo = filters.openedDateTo.toISOString();
    if (filters.closingDateFrom) params.closingDateFrom = filters.closingDateFrom.toISOString();
    if (filters.closingDateTo) params.closingDateTo = filters.closingDateTo.toISOString();
    if (filters.propertyState) params.propertyState = filters.propertyState.join(',');
    if (filters.propertyCity) params.propertyCity = filters.propertyCity.join(',');
    if (filters.escrowOfficerId) params.escrowOfficerId = filters.escrowOfficerId;
    if (filters.search) params.search = filters.search;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return params;
  }

  /**
   * Build contact filter params
   */
  private buildContactFilterParams(filters?: ContactFilters): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.contactType) params.contactType = filters.contactType.join(',');
    if (filters.search) params.search = filters.search;
    if (filters.company) params.company = filters.company;
    if (filters.state) params.state = filters.state;
    if (filters.city) params.city = filters.city;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.sortOrder) params.sortOrder = filters.sortOrder;

    return params;
  }

  /**
   * Build document filter params
   */
  private buildDocumentFilterParams(
    filters?: DocumentFilters
  ): Record<string, any> {
    if (!filters) return {};

    const params: Record<string, any> = {};

    if (filters.documentType) params.documentType = filters.documentType.join(',');
    if (filters.status) params.status = filters.status.join(',');
    if (filters.uploadedDateFrom) params.uploadedDateFrom = filters.uploadedDateFrom.toISOString();
    if (filters.uploadedDateTo) params.uploadedDateTo = filters.uploadedDateTo.toISOString();
    if (filters.search) params.search = filters.search;
    if (filters.limit) params.limit = filters.limit;
    if (filters.offset) params.offset = filters.offset;

    return params;
  }
}

/**
 * Factory function to create SoftPro API client
 * @param integrationId - Integration ID
 * @returns SoftPro API client instance
 */
export async function createSoftProClient(
  integrationId: string
): Promise<SoftProAPIService> {
  const integration = await prisma.softProIntegration.findUnique({
    where: { id: integrationId },
  });

  if (!integration) {
    throw new Error('Integration not found');
  }

  return new SoftProAPIService(integrationId, integration.environment);
}
