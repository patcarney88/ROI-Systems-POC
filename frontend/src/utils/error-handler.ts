import { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Global Error Handler
 * Centralized error handling for API calls and general errors
 */

interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
  error?: string;
}

interface ErrorDetails {
  message: string;
  statusCode?: number;
  field?: string;
}

/**
 * HTTP Status Code to User-Friendly Message Mapping
 */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: 'Please check your input and try again',
  401: 'Please log in to continue',
  403: "You don't have permission to do that",
  404: "We couldn't find what you're looking for",
  409: 'This item already exists',
  422: 'Please check your input and try again',
  429: 'Too many requests. Please try again later',
  500: 'Something went wrong. Please try again later',
  502: 'Service temporarily unavailable',
  503: 'Service temporarily unavailable',
  504: 'Request timeout. Please try again'
};

/**
 * Parse error response from backend
 */
export function parseApiError(error: unknown): ErrorDetails {
  // Handle Axios errors
  if (error instanceof AxiosError) {
    const statusCode = error.response?.status;
    const data = error.response?.data as ApiErrorResponse | undefined;

    // Network error
    if (!error.response) {
      return {
        message: 'Please check your internet connection and try again',
        statusCode: 0
      };
    }

    // Extract error message from response
    let message = data?.message || data?.error;

    // If no message from API, use status code mapping
    if (!message && statusCode) {
      message = HTTP_ERROR_MESSAGES[statusCode] || 'An unexpected error occurred';
    }

    // Handle validation errors (field-specific)
    if (data?.errors && typeof data.errors === 'object') {
      const firstError = Object.values(data.errors)[0];
      if (Array.isArray(firstError) && firstError.length > 0) {
        message = firstError[0];
      }
    }

    return {
      message: message || 'An unexpected error occurred',
      statusCode
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred'
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred'
  };
}

/**
 * Handle API error and show toast notification
 */
export function handleApiError(error: unknown, customMessage?: string): void {
  const errorDetails = parseApiError(error);
  const message = customMessage || errorDetails.message;

  console.error('API Error:', {
    message,
    statusCode: errorDetails.statusCode,
    originalError: error
  });

  // Show error toast
  toast.error(message, {
    duration: 5000,
    position: 'top-right'
  });
}

/**
 * Handle form validation errors
 */
export function handleValidationError(errors: Record<string, any>): void {
  const firstError = Object.values(errors)[0];
  if (firstError && firstError.message) {
    toast.error(firstError.message, {
      duration: 4000,
      position: 'top-right'
    });
  }
}

/**
 * Generic error logger (can be extended to send to error tracking service)
 */
export function logError(error: unknown, context?: Record<string, any>): void {
  const errorDetails = parseApiError(error);

  console.error('Error logged:', {
    ...errorDetails,
    context,
    timestamp: new Date().toISOString()
  });

  // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
  // Example:
  // Sentry.captureException(error, {
  //   extra: { ...errorDetails, ...context }
  // });
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return !error.response;
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 401;
  }
  return false;
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
}

/**
 * Get user-friendly error message for status code
 */
export function getErrorMessageForStatus(statusCode: number): string {
  return HTTP_ERROR_MESSAGES[statusCode] || 'An unexpected error occurred';
}

/**
 * Retry helper for failed requests
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx)
      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        if (status >= 400 && status < 500) {
          throw error;
        }
      }

      // Wait before retrying
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }

  throw lastError;
}

export default {
  parseApiError,
  handleApiError,
  handleValidationError,
  logError,
  isNetworkError,
  isAuthError,
  isPermissionError,
  getErrorMessageForStatus,
  retryRequest
};
