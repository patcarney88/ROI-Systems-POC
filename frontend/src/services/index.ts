/**
 * API Services - Main Export Index
 * Centralized exports for all API-related functionality
 *
 * Usage:
 *   import { api, useApi, parseApiError } from './services';
 */

// Main API service
export { api, default } from './api';

// Individual API services
export {
  authApi,
  documentApi,
  clientApi,
  campaignApi,
  templateApi,
  transactionApi,
  analyticsApi,
  searchApi,
  utilityApi,
} from './api';

// API Client
export { apiClient, TokenManager } from './api.client';
export type { ApiResponse, PaginatedResponse } from './api.client';

// React Hooks
export { useApi, usePaginatedApi, useMutation } from '../hooks/useApi';
export type { UseApiOptions, UseApiState } from '../hooks/useApi';

// Error Utilities
export {
  ErrorCodes,
  parseApiError,
  getErrorMessage,
  isNetworkError,
  isAuthError,
  isValidationError,
  isRetryableError,
  extractFieldErrors,
  getFieldError,
  createErrorToast,
  createSuccessToast,
  createWarningToast,
  createInfoToast,
  logError,
  reportError,
  formatFormError,
  getRetryDelay,
  getErrorCodeFromStatus,
} from '../utils/api-errors';

export type { ErrorCode, FieldError, ToastOptions } from '../utils/api-errors';

// Type Definitions
export type {
  // Base types
  ApiError,
  ResponseMetadata,
  PaginationInfo,
  PaginationParams,
  SortParams,
  SearchParams,

  // Auth types
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ProfileUpdateRequest,
  PasswordChangeRequest,
  SessionListResponse,
  SecurityEventsResponse,

  // Document types
  DocumentListParams,
  DocumentListResponse,
  DocumentUploadRequest,
  DocumentUploadResponse,
  DocumentUpdateRequest,
  DocumentBulkActionRequest,
  DocumentBulkActionResponse,
  DocumentStatsResponse,

  // Client types
  Client,
  ClientListParams,
  ClientListResponse,
  ClientCreateRequest,
  ClientUpdateRequest,
  ClientStatsResponse,

  // Campaign types
  CampaignListParams,
  CampaignListResponse,
  CampaignCreateRequest,
  CampaignUpdateRequest,
  CampaignSendRequest,
  CampaignSendResponse,
  CampaignStatsResponse,
  CampaignAnalyticsResponse,

  // Template types
  TemplateListParams,
  TemplateListResponse,
  TemplateCreateRequest,
  TemplateUpdateRequest,

  // Analytics types
  AnalyticsParams,
  DashboardMetricsResponse,
  AlertPerformanceParams,
  ClientLifecycleParams,
  RevenueAttributionParams,

  // Transaction types
  TransactionListParams,
  TransactionListResponse,
  TransactionCreateRequest,
  TransactionUpdateRequest,

  // Search types
  GlobalSearchParams,
  GlobalSearchResponse,

  // Export types
  ExportParams,
  ExportResponse,

  // Domain types
  User,
  AuthCredentials,
  AuthResponse,
  AuthTokens,
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
} from '../types/api';
