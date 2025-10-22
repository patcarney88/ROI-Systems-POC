/**
 * API Error Handling Utilities
 * Centralized error parsing and user-friendly error messages
 * ROI Systems Frontend
 */

import type { ApiError } from '../types/api';

// ============================================================================
// Error Code Constants
// ============================================================================

export const ErrorCodes = {
  // Network Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Authentication Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  INVALID_MFA_CODE: 'INVALID_MFA_CODE',

  // Authorization Errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation Errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  PASSWORD_MISMATCH: 'PASSWORD_MISMATCH',

  // Resource Errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // File Upload Errors
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  VIRUS_DETECTED: 'VIRUS_DETECTED',

  // Server Errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',

  // Business Logic Errors
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  INVALID_OPERATION: 'INVALID_OPERATION',

  // Unknown
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================================================
// Error Message Mappings
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  // Network Errors
  [ErrorCodes.NETWORK_ERROR]: 'Network error. Please check your internet connection.',
  [ErrorCodes.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
  [ErrorCodes.CONNECTION_ERROR]: 'Could not connect to the server. Please try again later.',

  // Authentication Errors
  [ErrorCodes.UNAUTHORIZED]: 'You are not authorized to perform this action.',
  [ErrorCodes.TOKEN_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please log in again.',
  [ErrorCodes.MFA_REQUIRED]: 'Multi-factor authentication is required.',
  [ErrorCodes.INVALID_MFA_CODE]: 'Invalid verification code. Please try again.',

  // Authorization Errors
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to access this resource.',
  [ErrorCodes.INSUFFICIENT_PERMISSIONS]: 'You do not have sufficient permissions to perform this action.',

  // Validation Errors
  [ErrorCodes.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input. Please check your data.',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  [ErrorCodes.INVALID_EMAIL]: 'Please enter a valid email address.',
  [ErrorCodes.WEAK_PASSWORD]: 'Password is too weak. Please choose a stronger password.',
  [ErrorCodes.PASSWORD_MISMATCH]: 'Passwords do not match.',

  // Resource Errors
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCodes.ALREADY_EXISTS]: 'This resource already exists.',
  [ErrorCodes.CONFLICT]: 'This operation conflicts with existing data.',
  [ErrorCodes.RESOURCE_LOCKED]: 'This resource is currently locked by another user.',

  // Rate Limiting
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please slow down and try again.',
  [ErrorCodes.TOO_MANY_REQUESTS]: 'Too many requests. Please wait a moment and try again.',

  // File Upload Errors
  [ErrorCodes.FILE_TOO_LARGE]: 'File is too large. Maximum size is 25MB.',
  [ErrorCodes.INVALID_FILE_TYPE]: 'Invalid file type. Please upload a supported file format.',
  [ErrorCodes.UPLOAD_FAILED]: 'File upload failed. Please try again.',
  [ErrorCodes.VIRUS_DETECTED]: 'Security threat detected. File cannot be uploaded.',

  // Server Errors
  [ErrorCodes.INTERNAL_SERVER_ERROR]: 'An internal server error occurred. Please try again later.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable. Please try again later.',
  [ErrorCodes.DATABASE_ERROR]: 'A database error occurred. Please try again.',

  // Business Logic Errors
  [ErrorCodes.INSUFFICIENT_CREDITS]: 'Insufficient credits. Please upgrade your plan.',
  [ErrorCodes.SUBSCRIPTION_REQUIRED]: 'This feature requires an active subscription.',
  [ErrorCodes.QUOTA_EXCEEDED]: 'You have exceeded your quota. Please upgrade your plan.',
  [ErrorCodes.INVALID_OPERATION]: 'This operation is not allowed in the current state.',

  // Unknown
  [ErrorCodes.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again.',
};

// ============================================================================
// Error Parsing Functions
// ============================================================================

/**
 * Parse API error and return user-friendly message
 */
export function parseApiError(error: ApiError | null | undefined): string {
  if (!error) {
    return ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR];
  }

  // Use custom message from API if available
  if (error.message) {
    return error.message;
  }

  // Map error code to user-friendly message
  const code = error.code as ErrorCode;
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Get error message by error code
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCodes.UNKNOWN_ERROR];
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: ApiError): boolean {
  const networkErrors = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT_ERROR,
    ErrorCodes.CONNECTION_ERROR,
  ];
  return networkErrors.includes(error.code as any);
}

/**
 * Check if error is authentication-related
 */
export function isAuthError(error: ApiError): boolean {
  const authErrors = [
    ErrorCodes.UNAUTHORIZED,
    ErrorCodes.TOKEN_EXPIRED,
    ErrorCodes.INVALID_CREDENTIALS,
    ErrorCodes.SESSION_EXPIRED,
  ];
  return authErrors.includes(error.code as any);
}

/**
 * Check if error is validation-related
 */
export function isValidationError(error: ApiError): boolean {
  const validationErrors = [
    ErrorCodes.VALIDATION_ERROR,
    ErrorCodes.INVALID_INPUT,
    ErrorCodes.MISSING_REQUIRED_FIELD,
    ErrorCodes.INVALID_EMAIL,
    ErrorCodes.WEAK_PASSWORD,
    ErrorCodes.PASSWORD_MISMATCH,
  ];
  return validationErrors.includes(error.code as any);
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: ApiError): boolean {
  const retryableErrors = [
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT_ERROR,
    ErrorCodes.SERVICE_UNAVAILABLE,
  ];
  return retryableErrors.includes(error.code as any);
}

// ============================================================================
// Field-specific Error Handling
// ============================================================================

export interface FieldError {
  field: string;
  message: string;
}

/**
 * Extract field errors from validation error
 */
export function extractFieldErrors(error: ApiError): FieldError[] {
  if (!error.details || !Array.isArray(error.details)) {
    return [];
  }

  return error.details.map((detail: any) => ({
    field: detail.field || detail.path || '',
    message: detail.message || 'Invalid value',
  }));
}

/**
 * Get error message for specific field
 */
export function getFieldError(error: ApiError, fieldName: string): string | null {
  const fieldErrors = extractFieldErrors(error);
  const fieldError = fieldErrors.find(e => e.field === fieldName);
  return fieldError ? fieldError.message : null;
}

// ============================================================================
// Toast Notification Helpers
// ============================================================================

export interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Create toast options from API error
 */
export function createErrorToast(error: ApiError, customMessage?: string): ToastOptions {
  const message = customMessage || parseApiError(error);

  return {
    type: 'error',
    message,
    duration: 5000,
  };
}

/**
 * Create success toast
 */
export function createSuccessToast(message: string): ToastOptions {
  return {
    type: 'success',
    message,
    duration: 3000,
  };
}

/**
 * Create warning toast
 */
export function createWarningToast(message: string): ToastOptions {
  return {
    type: 'warning',
    message,
    duration: 4000,
  };
}

/**
 * Create info toast
 */
export function createInfoToast(message: string): ToastOptions {
  return {
    type: 'info',
    message,
    duration: 3000,
  };
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log error for debugging (in development)
 */
export function logError(error: ApiError, context?: string): void {
  if (import.meta.env.DEV) {
    console.group(`[API Error] ${context || 'Unknown context'}`);
    console.error('Code:', error.code);
    console.error('Message:', error.message);
    if (error.details) {
      console.error('Details:', error.details);
    }
    console.groupEnd();
  }
}

/**
 * Send error to monitoring service (production)
 */
export function reportError(error: ApiError, context?: Record<string, any>): void {
  if (!import.meta.env.DEV) {
    // TODO: Integrate with error monitoring service (Sentry, etc.)
    console.error('API Error:', {
      ...error,
      context,
      timestamp: new Date().toISOString(),
    });
  }
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Format error for display in forms
 */
export function formatFormError(error: ApiError): {
  summary: string;
  fields: Record<string, string>;
} {
  const fieldErrors = extractFieldErrors(error);

  return {
    summary: parseApiError(error),
    fields: fieldErrors.reduce((acc, curr) => {
      acc[curr.field] = curr.message;
      return acc;
    }, {} as Record<string, string>),
  };
}

/**
 * Get retry delay for retryable errors (exponential backoff)
 */
export function getRetryDelay(attemptNumber: number, baseDelay: number = 1000): number {
  return Math.min(baseDelay * Math.pow(2, attemptNumber), 30000); // Max 30 seconds
}

// ============================================================================
// HTTP Status Code Helpers
// ============================================================================

/**
 * Get error code from HTTP status
 */
export function getErrorCodeFromStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
      return ErrorCodes.VALIDATION_ERROR;
    case 401:
      return ErrorCodes.UNAUTHORIZED;
    case 403:
      return ErrorCodes.FORBIDDEN;
    case 404:
      return ErrorCodes.NOT_FOUND;
    case 409:
      return ErrorCodes.CONFLICT;
    case 429:
      return ErrorCodes.RATE_LIMIT_EXCEEDED;
    case 500:
      return ErrorCodes.INTERNAL_SERVER_ERROR;
    case 503:
      return ErrorCodes.SERVICE_UNAVAILABLE;
    default:
      return ErrorCodes.UNKNOWN_ERROR;
  }
}

// ============================================================================
// Export everything
// ============================================================================

export default {
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
};
