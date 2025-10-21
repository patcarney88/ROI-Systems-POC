/**
 * Complete API Service Layer
 * Centralized API interface for frontend-backend communication
 * ROI Systems Frontend
 *
 * Usage:
 *   import { api } from './services/api';
 *
 *   // Authentication
 *   const response = await api.auth.login({ email, password });
 *
 *   // Documents
 *   const docs = await api.documents.list({ type: 'Deed' });
 *
 *   // Clients
 *   const client = await api.clients.create({ name, email });
 */

import { apiClient } from './api.client';
import type {
  ApiResponse,
  PaginatedResponse,
  // Auth Types
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  PasswordResetRequest,
  PasswordReset,
  MFACredentials,
  SessionListResponse,
  SecurityEventsResponse,
  // Document Types
  DocumentListParams,
  DocumentListResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentUpdateRequest,
  DocumentBulkActionRequest,
  DocumentBulkActionResponse,
  DocumentStatsResponse,
  // Client Types
  Client,
  ClientListParams,
  ClientListResponse,
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientStatsResponse,
  // Campaign Types
  CampaignListParams,
  CampaignListResponse,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  CampaignSendRequest,
  CampaignSendResponse,
  CampaignStatsResponse,
  CampaignAnalyticsResponse,
  // Template Types
  TemplateListParams,
  TemplateListResponse,
  TemplateCreateRequest,
  TemplateUpdateRequest,
  // Analytics Types
  AnalyticsParams,
  DashboardMetricsResponse,
  AlertPerformanceParams,
  ClientLifecycleParams,
  RevenueAttributionParams,
  // Transaction Types
  TransactionListParams,
  TransactionListResponse,
  TransactionCreateRequest,
  TransactionUpdateRequest,
  // Search Types
  GlobalSearchParams,
  GlobalSearchResponse,
  // Export Types
  ExportParams,
  ExportResponse,
  // Domain Types
  User,
  Document,
  EmailTemplate,
  Campaign,
  Transaction,
  AlertPerformanceMetrics,
  ClientLifecycleAnalytics,
  RevenueAttribution,
  CompetitiveInsights,
  PredictiveAnalytics,
} from '../types/api';

// ============================================================================
// Authentication API
// ============================================================================

export const authApi = {
  /**
   * Login with email and password
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/login', credentials);
  },

  /**
   * Register new user account
   */
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    return apiClient.post('/auth/register', data);
  },

  /**
   * Logout current user
   */
  async logout(): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/logout');
  },

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(data: RefreshTokenRequest): Promise<ApiResponse<RefreshTokenResponse>> {
    return apiClient.post('/auth/refresh', data);
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<ApiResponse<{ user: User }>> {
    return apiClient.get('/auth/profile');
  },

  /**
   * Update user profile
   */
  async updateProfile(data: ProfileUpdateRequest): Promise<ApiResponse<{ user: User }>> {
    return apiClient.put('/auth/profile', data);
  },

  /**
   * Change password
   */
  async changePassword(data: PasswordChangeRequest): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/change-password', data);
  },

  /**
   * Request password reset email
   */
  async requestPasswordReset(data: PasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/forgot-password', data);
  },

  /**
   * Reset password with token
   */
  async resetPassword(data: PasswordReset): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/reset-password', data);
  },

  /**
   * Verify MFA code
   */
  async verifyMFA(data: MFACredentials): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post('/auth/verify-mfa', data);
  },

  /**
   * Enable MFA for user
   */
  async enableMFA(): Promise<ApiResponse<{ qrCode: string; secret: string; backupCodes: string[] }>> {
    return apiClient.post('/auth/mfa/enable');
  },

  /**
   * Disable MFA for user
   */
  async disableMFA(data: { password: string }): Promise<ApiResponse<void>> {
    return apiClient.post('/auth/mfa/disable', data);
  },

  /**
   * Get all active sessions
   */
  async getSessions(): Promise<ApiResponse<SessionListResponse>> {
    return apiClient.get('/auth/sessions');
  },

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/auth/sessions/${sessionId}`);
  },

  /**
   * Get security events
   */
  async getSecurityEvents(params?: { page?: number; limit?: number }): Promise<ApiResponse<SecurityEventsResponse>> {
    return apiClient.get('/auth/security-events', { params });
  },
};

// ============================================================================
// Document Management API
// ============================================================================

export const documentApi = {
  /**
   * Get list of documents with optional filters
   */
  async list(params?: DocumentListParams): Promise<ApiResponse<DocumentListResponse>> {
    return apiClient.get('/documents', { params });
  },

  /**
   * Get single document by ID
   */
  async get(id: string): Promise<ApiResponse<{ document: Document }>> {
    return apiClient.get(`/documents/${id}`);
  },

  /**
   * Upload new document
   */
  async upload(request: DocumentUploadRequest): Promise<ApiResponse<DocumentUploadResponse>> {
    const { file, ...metadata } = request;
    return apiClient.uploadFile('/documents', file, metadata);
  },

  /**
   * Upload multiple documents
   */
  async uploadMultiple(files: File[], metadata?: Partial<DocumentUploadRequest>): Promise<ApiResponse<{ documents: Document[] }>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
        }
      });
    }

    return apiClient.post('/documents/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * Update document metadata
   */
  async update(id: string, data: DocumentUpdateRequest): Promise<ApiResponse<{ document: Document }>> {
    return apiClient.put(`/documents/${id}`, data);
  },

  /**
   * Delete document
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/documents/${id}`);
  },

  /**
   * Perform bulk action on documents
   */
  async bulkAction(request: DocumentBulkActionRequest): Promise<ApiResponse<DocumentBulkActionResponse>> {
    return apiClient.post('/documents/bulk', request);
  },

  /**
   * Download document
   */
  async download(id: string): Promise<ApiResponse<{ downloadUrl: string }>> {
    return apiClient.get(`/documents/${id}/download`);
  },

  /**
   * Share document
   */
  async share(id: string, data: { emails: string[]; message?: string; expiresIn?: number }): Promise<ApiResponse<{ shareLink: string }>> {
    return apiClient.post(`/documents/${id}/share`, data);
  },

  /**
   * Get document statistics
   */
  async getStats(): Promise<ApiResponse<DocumentStatsResponse>> {
    return apiClient.get('/documents/stats');
  },

  /**
   * Search documents
   */
  async search(query: string, filters?: Partial<DocumentListParams>): Promise<ApiResponse<DocumentListResponse>> {
    return apiClient.get('/documents/search', { params: { query, ...filters } });
  },
};

// ============================================================================
// Client Management API
// ============================================================================

export const clientApi = {
  /**
   * Get list of clients with optional filters
   */
  async list(params?: ClientListParams): Promise<ApiResponse<ClientListResponse>> {
    return apiClient.get('/clients', { params });
  },

  /**
   * Get single client by ID
   */
  async get(id: string): Promise<ApiResponse<{ client: Client }>> {
    return apiClient.get(`/clients/${id}`);
  },

  /**
   * Create new client
   */
  async create(data: ClientCreateRequest): Promise<ApiResponse<{ client: Client }>> {
    return apiClient.post('/clients', data);
  },

  /**
   * Update client
   */
  async update(id: string, data: ClientUpdateRequest): Promise<ApiResponse<{ client: Client }>> {
    return apiClient.put(`/clients/${id}`, data);
  },

  /**
   * Delete client
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/clients/${id}`);
  },

  /**
   * Get client statistics
   */
  async getStats(): Promise<ApiResponse<ClientStatsResponse>> {
    return apiClient.get('/clients/stats');
  },

  /**
   * Get client documents
   */
  async getDocuments(id: string, params?: DocumentListParams): Promise<ApiResponse<DocumentListResponse>> {
    return apiClient.get(`/clients/${id}/documents`, { params });
  },

  /**
   * Get client campaigns
   */
  async getCampaigns(id: string): Promise<ApiResponse<{ campaigns: Campaign[] }>> {
    return apiClient.get(`/clients/${id}/campaigns`);
  },

  /**
   * Get client activity timeline
   */
  async getActivity(id: string): Promise<ApiResponse<{ activities: any[] }>> {
    return apiClient.get(`/clients/${id}/activity`);
  },

  /**
   * Search clients
   */
  async search(query: string, filters?: Partial<ClientListParams>): Promise<ApiResponse<ClientListResponse>> {
    return apiClient.get('/clients/search', { params: { query, ...filters } });
  },
};

// ============================================================================
// Campaign Management API
// ============================================================================

export const campaignApi = {
  /**
   * Get list of campaigns
   */
  async list(params?: CampaignListParams): Promise<ApiResponse<CampaignListResponse>> {
    return apiClient.get('/campaigns', { params });
  },

  /**
   * Get single campaign by ID
   */
  async get(id: string): Promise<ApiResponse<{ campaign: Campaign }>> {
    return apiClient.get(`/campaigns/${id}`);
  },

  /**
   * Create new campaign
   */
  async create(data: CampaignCreateRequest): Promise<ApiResponse<{ campaign: Campaign }>> {
    return apiClient.post('/campaigns', data);
  },

  /**
   * Update campaign
   */
  async update(id: string, data: CampaignUpdateRequest): Promise<ApiResponse<{ campaign: Campaign }>> {
    return apiClient.put(`/campaigns/${id}`, data);
  },

  /**
   * Delete campaign
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/campaigns/${id}`);
  },

  /**
   * Send campaign
   */
  async send(id: string, data?: CampaignSendRequest): Promise<ApiResponse<CampaignSendResponse>> {
    return apiClient.post(`/campaigns/${id}/send`, data);
  },

  /**
   * Pause campaign
   */
  async pause(id: string): Promise<ApiResponse<{ campaign: Campaign }>> {
    return apiClient.post(`/campaigns/${id}/pause`);
  },

  /**
   * Resume campaign
   */
  async resume(id: string): Promise<ApiResponse<{ campaign: Campaign }>> {
    return apiClient.post(`/campaigns/${id}/resume`);
  },

  /**
   * Get campaign statistics
   */
  async getStats(id: string): Promise<ApiResponse<CampaignStatsResponse>> {
    return apiClient.get(`/campaigns/${id}/stats`);
  },

  /**
   * Get all campaign analytics
   */
  async getAnalytics(params?: AnalyticsParams): Promise<ApiResponse<CampaignAnalyticsResponse>> {
    return apiClient.get('/campaigns/analytics', { params });
  },

  /**
   * Preview campaign
   */
  async preview(id: string): Promise<ApiResponse<{ html: string; text: string }>> {
    return apiClient.get(`/campaigns/${id}/preview`);
  },

  /**
   * Send test campaign
   */
  async sendTest(id: string, emails: string[]): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post(`/campaigns/${id}/test`, { emails });
  },

  /**
   * Clone campaign
   */
  async clone(id: string): Promise<ApiResponse<{ campaign: Campaign }>> {
    return apiClient.post(`/campaigns/${id}/clone`);
  },
};

// ============================================================================
// Email Template API
// ============================================================================

export const templateApi = {
  /**
   * Get list of templates
   */
  async list(params?: TemplateListParams): Promise<ApiResponse<TemplateListResponse>> {
    return apiClient.get('/templates', { params });
  },

  /**
   * Get single template by ID
   */
  async get(id: string): Promise<ApiResponse<{ template: EmailTemplate }>> {
    return apiClient.get(`/templates/${id}`);
  },

  /**
   * Create new template
   */
  async create(data: TemplateCreateRequest): Promise<ApiResponse<{ template: EmailTemplate }>> {
    return apiClient.post('/templates', data);
  },

  /**
   * Update template
   */
  async update(id: string, data: TemplateUpdateRequest): Promise<ApiResponse<{ template: EmailTemplate }>> {
    return apiClient.put(`/templates/${id}`, data);
  },

  /**
   * Delete template
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/templates/${id}`);
  },

  /**
   * Clone template
   */
  async clone(id: string): Promise<ApiResponse<{ template: EmailTemplate }>> {
    return apiClient.post(`/templates/${id}/clone`);
  },

  /**
   * Preview template
   */
  async preview(id: string, variables?: Record<string, any>): Promise<ApiResponse<{ html: string; text: string }>> {
    return apiClient.post(`/templates/${id}/preview`, { variables });
  },
};

// ============================================================================
// Transaction Management API
// ============================================================================

export const transactionApi = {
  /**
   * Get list of transactions
   */
  async list(params?: TransactionListParams): Promise<ApiResponse<TransactionListResponse>> {
    return apiClient.get('/transactions', { params });
  },

  /**
   * Get single transaction by ID
   */
  async get(id: string): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.get(`/transactions/${id}`);
  },

  /**
   * Create new transaction
   */
  async create(data: TransactionCreateRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.post('/transactions', data);
  },

  /**
   * Update transaction
   */
  async update(id: string, data: TransactionUpdateRequest): Promise<ApiResponse<{ transaction: Transaction }>> {
    return apiClient.put(`/transactions/${id}`, data);
  },

  /**
   * Delete transaction
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/transactions/${id}`);
  },

  /**
   * Get transaction documents
   */
  async getDocuments(id: string): Promise<ApiResponse<{ documents: Document[] }>> {
    return apiClient.get(`/transactions/${id}/documents`);
  },

  /**
   * Link document to transaction
   */
  async linkDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return apiClient.post(`/transactions/${id}/documents`, { documentId });
  },

  /**
   * Unlink document from transaction
   */
  async unlinkDocument(id: string, documentId: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/transactions/${id}/documents/${documentId}`);
  },
};

// ============================================================================
// Analytics API
// ============================================================================

export const analyticsApi = {
  /**
   * Get dashboard metrics overview
   */
  async getDashboard(params?: AnalyticsParams): Promise<ApiResponse<DashboardMetricsResponse>> {
    return apiClient.get('/analytics/dashboard', { params });
  },

  /**
   * Get alert performance metrics
   */
  async getAlertPerformance(params?: AlertPerformanceParams): Promise<ApiResponse<AlertPerformanceMetrics>> {
    return apiClient.get('/analytics/alert-performance', { params });
  },

  /**
   * Get client lifecycle analytics
   */
  async getClientLifecycle(params?: ClientLifecycleParams): Promise<ApiResponse<ClientLifecycleAnalytics>> {
    return apiClient.get('/analytics/client-lifecycle', { params });
  },

  /**
   * Get revenue attribution
   */
  async getRevenueAttribution(params?: RevenueAttributionParams): Promise<ApiResponse<RevenueAttribution>> {
    return apiClient.get('/analytics/revenue-attribution', { params });
  },

  /**
   * Get competitive insights
   */
  async getCompetitiveInsights(params?: AnalyticsParams): Promise<ApiResponse<CompetitiveInsights>> {
    return apiClient.get('/analytics/competitive-insights', { params });
  },

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(params?: AnalyticsParams): Promise<ApiResponse<PredictiveAnalytics>> {
    return apiClient.get('/analytics/predictive', { params });
  },

  /**
   * Export analytics data
   */
  async export(params: ExportParams): Promise<ApiResponse<ExportResponse>> {
    return apiClient.post('/analytics/export', params);
  },
};

// ============================================================================
// Search API
// ============================================================================

export const searchApi = {
  /**
   * Global search across all resources
   */
  async global(params: GlobalSearchParams): Promise<ApiResponse<GlobalSearchResponse>> {
    return apiClient.get('/search', { params });
  },

  /**
   * Get search suggestions
   */
  async suggestions(query: string, type?: string): Promise<ApiResponse<{ suggestions: string[] }>> {
    return apiClient.get('/search/suggestions', { params: { query, type } });
  },
};

// ============================================================================
// Utility API
// ============================================================================

export const utilityApi = {
  /**
   * Upload file to temporary storage
   */
  async uploadTemp(file: File): Promise<ApiResponse<{ url: string; key: string }>> {
    return apiClient.uploadFile('/upload/temp', file);
  },

  /**
   * Get presigned URL for S3 upload
   */
  async getPresignedUrl(fileName: string, fileType: string): Promise<ApiResponse<{ url: string; key: string }>> {
    return apiClient.post('/upload/presigned-url', { fileName, fileType });
  },

  /**
   * Health check
   */
  async health(): Promise<ApiResponse<{ status: string; version: string }>> {
    return apiClient.get('/health');
  },
};

// ============================================================================
// Combined API Export
// ============================================================================

export const api = {
  auth: authApi,
  documents: documentApi,
  clients: clientApi,
  campaigns: campaignApi,
  templates: templateApi,
  transactions: transactionApi,
  analytics: analyticsApi,
  search: searchApi,
  utility: utilityApi,
};

// ============================================================================
// Default Export
// ============================================================================

export default api;
