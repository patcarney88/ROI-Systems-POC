/**
 * API Type Definitions
 * Comprehensive TypeScript types for all API requests and responses
 * ROI Systems Frontend
 */

import type {
  User,
  AuthCredentials,
  AuthResponse,
  AuthTokens,
  RegistrationData,
  PasswordResetRequest,
  PasswordReset,
  MFACredentials,
  Session,
  SecurityEvent,
} from './auth';

import type {
  Document,
  DocumentFilter,
  UploadFile,
  Transaction,
  Client as DocumentClient,
  BulkAction,
} from './documents';

import type {
  EmailTemplate,
  Campaign,
  CampaignRecipient,
  CampaignMetrics,
  DripCampaign,
  MarketingAnalytics,
} from './marketing';

import type {
  AlertPerformanceMetrics,
  ClientLifecycleAnalytics,
  RevenueAttribution,
  CompetitiveInsights,
  PredictiveAnalytics,
} from './analytics';

// ============================================================================
// Base API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  field?: string;
  statusCode?: number;
}

export interface ResponseMetadata {
  requestId?: string;
  timestamp?: string;
  version?: string;
  [key: string]: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query?: string;
  search?: string;
}

// ============================================================================
// Auth API Types
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
  requiresMFA?: boolean;
}

export interface RegisterRequest extends RegistrationData {}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  tokens: AuthTokens;
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  preferences?: Partial<User['preferences']>;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface SessionListResponse {
  sessions: Session[];
  currentSessionId: string;
}

export interface SecurityEventsResponse {
  events: SecurityEvent[];
  pagination: PaginationInfo;
}

// ============================================================================
// Document API Types
// ============================================================================

export interface DocumentListParams extends PaginationParams, SortParams {
  type?: string;
  status?: string;
  clientId?: string;
  transactionId?: string;
  search?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentListResponse {
  documents: Document[];
  pagination: PaginationInfo;
}

export interface DocumentUploadRequest {
  file: File;
  name?: string;
  type?: string;
  clientId?: string;
  transactionId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentUploadResponse {
  document: Document;
  message: string;
}

export interface DocumentUpdateRequest {
  name?: string;
  type?: string;
  status?: string;
  clientId?: string;
  transactionId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentBulkActionRequest {
  documentIds: string[];
  action: 'download' | 'delete' | 'categorize' | 'tag' | 'assign';
  payload?: {
    type?: string;
    tags?: string[];
    clientId?: string;
    transactionId?: string;
  };
}

export interface DocumentBulkActionResponse {
  processed: number;
  succeeded: number;
  failed: number;
  errors?: Array<{ documentId: string; error: string }>;
}

export interface DocumentStatsResponse {
  total: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  recentUploads: Document[];
  storageUsed: number;
  storageLimit: number;
}

// ============================================================================
// Client API Types
// ============================================================================

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  propertyCount: number;
  lastContact?: string;
  nextFollowUp?: string;
  engagementScore: number;
  status: 'active' | 'inactive' | 'prospect' | 'lead' | 'closed';
  source?: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ClientListParams extends PaginationParams, SortParams {
  status?: string;
  search?: string;
  tags?: string[];
  source?: string;
  engagementMin?: number;
  engagementMax?: number;
}

export interface ClientListResponse {
  clients: Client[];
  pagination: PaginationInfo;
}

export interface ClientCreateRequest {
  name: string;
  email: string;
  phone?: string;
  address?: Client['address'];
  status?: Client['status'];
  source?: string;
  tags?: string[];
  notes?: string;
  customFields?: Record<string, any>;
}

export interface ClientUpdateRequest extends Partial<ClientCreateRequest> {
  lastContact?: string;
  nextFollowUp?: string;
  engagementScore?: number;
}

export interface ClientStatsResponse {
  total: number;
  byStatus: Record<string, number>;
  avgEngagementScore: number;
  topClients: Client[];
  recentActivity: Array<{
    clientId: string;
    clientName: string;
    activity: string;
    timestamp: string;
  }>;
}

// ============================================================================
// Campaign API Types
// ============================================================================

export interface CampaignListParams extends PaginationParams, SortParams {
  status?: string;
  search?: string;
  templateId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  pagination: PaginationInfo;
}

export interface CampaignCreateRequest {
  name: string;
  description?: string;
  templateId: string;
  subject: string;
  preheader?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  recipients: Array<{
    email: string;
    name: string;
    clientId?: string;
    variables?: Record<string, any>;
  }>;
  scheduledDate?: string;
  tags?: string[];
}

export interface CampaignUpdateRequest extends Partial<CampaignCreateRequest> {
  status?: Campaign['status'];
}

export interface CampaignSendRequest {
  sendNow?: boolean;
  testEmails?: string[];
}

export interface CampaignSendResponse {
  campaign: Campaign;
  message: string;
  recipientCount: number;
  estimatedDelivery?: string;
}

export interface CampaignStatsResponse {
  campaign: Campaign;
  metrics: CampaignMetrics;
  recipientDetails: CampaignRecipient[];
  topLinks?: Array<{
    url: string;
    clicks: number;
  }>;
  timeline?: Array<{
    timestamp: string;
    event: string;
    count: number;
  }>;
}

export interface CampaignAnalyticsResponse {
  total: number;
  byStatus: Record<string, number>;
  aggregateMetrics: CampaignMetrics;
  topPerformers: Campaign[];
  recentCampaigns: Campaign[];
}

// ============================================================================
// Template API Types
// ============================================================================

export interface TemplateListParams extends PaginationParams, SortParams {
  category?: string;
  search?: string;
  isDefault?: boolean;
}

export interface TemplateListResponse {
  templates: EmailTemplate[];
  pagination: PaginationInfo;
}

export interface TemplateCreateRequest {
  name: string;
  category: EmailTemplate['category'];
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent: string;
  thumbnail?: string;
  tags?: string[];
  variables?: EmailTemplate['variables'];
}

export interface TemplateUpdateRequest extends Partial<TemplateCreateRequest> {}

// ============================================================================
// Analytics API Types
// ============================================================================

export interface AnalyticsParams {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  groupBy?: string;
}

export interface DashboardMetricsResponse {
  documents: {
    total: number;
    recentUploads: number;
    byStatus: Record<string, number>;
    storageUsed: number;
  };
  clients: {
    total: number;
    active: number;
    byStatus: Record<string, number>;
    avgEngagement: number;
  };
  campaigns: {
    total: number;
    active: number;
    sent: number;
    avgOpenRate: number;
    avgClickRate: number;
  };
  revenue?: {
    total: number;
    projected: number;
    growth: number;
  };
}

export interface AlertPerformanceParams extends AnalyticsParams {
  source?: string;
  confidenceLevel?: string;
}

export interface ClientLifecycleParams extends AnalyticsParams {
  stage?: string;
}

export interface RevenueAttributionParams extends AnalyticsParams {
  source?: string;
}

// ============================================================================
// Transaction API Types
// ============================================================================

export interface TransactionListParams extends PaginationParams, SortParams {
  status?: string;
  search?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: PaginationInfo;
}

export interface TransactionCreateRequest {
  name: string;
  propertyAddress: string;
  clientName: string;
  clientId?: string;
  status: Transaction['status'];
  closingDate?: string;
  amount?: number;
  notes?: string;
}

export interface TransactionUpdateRequest extends Partial<TransactionCreateRequest> {}

// ============================================================================
// Search API Types
// ============================================================================

export interface GlobalSearchParams {
  query: string;
  types?: Array<'documents' | 'clients' | 'campaigns' | 'transactions'>;
  limit?: number;
}

export interface GlobalSearchResponse {
  documents: Document[];
  clients: Client[];
  campaigns: Campaign[];
  transactions: Transaction[];
  total: number;
}

// ============================================================================
// File Upload Types
// ============================================================================

export interface FileUploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface MultiFileUploadRequest {
  files: File[];
  type?: string;
  clientId?: string;
  transactionId?: string;
  tags?: string[];
  onProgress?: (fileId: string, progress: FileUploadProgress) => void;
}

export interface MultiFileUploadResponse {
  documents: Document[];
  succeeded: number;
  failed: number;
  errors?: Array<{ fileName: string; error: string }>;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookListParams extends PaginationParams {
  event?: string;
  status?: string;
}

export interface WebhookCreateRequest {
  url: string;
  events: string[];
  secret?: string;
  enabled?: boolean;
}

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  lastTriggered?: string;
  failureCount: number;
  createdAt: string;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportParams {
  format: 'csv' | 'xlsx' | 'json' | 'pdf';
  filters?: Record<string, any>;
  fields?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface ExportResponse {
  downloadUrl: string;
  expiresAt: string;
  fileName: string;
  fileSize: number;
}

// ============================================================================
// Batch Operations
// ============================================================================

export interface BatchRequest<T = any> {
  operations: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    path: string;
    body?: T;
  }>;
}

export interface BatchResponse<T = any> {
  results: Array<{
    status: number;
    data?: T;
    error?: ApiError;
  }>;
}

// ============================================================================
// Re-export domain types
// ============================================================================

export type {
  User,
  AuthCredentials,
  AuthResponse,
  AuthTokens,
  PasswordResetRequest,
  PasswordReset,
  MFACredentials,
  Document,
  DocumentFilter,
  Transaction,
  EmailTemplate,
  Campaign,
  CampaignMetrics,
  AlertPerformanceMetrics,
  ClientLifecycleAnalytics,
  RevenueAttribution,
  CompetitiveInsights,
  PredictiveAnalytics,
};
