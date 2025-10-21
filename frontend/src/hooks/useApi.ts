/**
 * Custom React Hook for API Calls
 * Provides automatic loading, error handling, and request deduplication
 * ROI Systems Frontend
 *
 * Usage:
 *   const { data, loading, error, execute, reset } = useApi(
 *     () => api.clients.list({ status: 'active' })
 *   );
 *
 *   // Or with manual execution
 *   const { data, loading, error, execute } = useApi(
 *     (id: string) => api.clients.get(id),
 *     { immediate: false }
 *   );
 *   await execute('client-123');
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ApiResponse, ApiError } from '../types/api';
import { parseApiError, logError, isRetryableError, getRetryDelay } from '../utils/api-errors';

// ============================================================================
// Hook Options
// ============================================================================

export interface UseApiOptions<T> {
  /**
   * Execute immediately on mount (default: true)
   */
  immediate?: boolean;

  /**
   * Callback on success
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback on error
   */
  onError?: (error: ApiError) => void;

  /**
   * Callback on complete (success or error)
   */
  onComplete?: () => void;

  /**
   * Enable automatic retry on failure (default: false)
   */
  retry?: boolean;

  /**
   * Maximum number of retries (default: 3)
   */
  maxRetries?: number;

  /**
   * Retry delay in milliseconds (default: 1000)
   */
  retryDelay?: number;

  /**
   * Deduplicate concurrent requests (default: true)
   */
  deduplicate?: boolean;

  /**
   * Cache key for request deduplication
   */
  cacheKey?: string;

  /**
   * Show toast notifications on error (default: false)
   */
  showErrorToast?: boolean;

  /**
   * Show toast notifications on success (default: false)
   */
  showSuccessToast?: boolean;

  /**
   * Success toast message
   */
  successMessage?: string;
}

// ============================================================================
// Hook State
// ============================================================================

export interface UseApiState<T> {
  /**
   * Response data
   */
  data: T | null;

  /**
   * Loading state
   */
  loading: boolean;

  /**
   * Error state
   */
  error: ApiError | null;

  /**
   * Execute the API call
   */
  execute: (...args: any[]) => Promise<T | null>;

  /**
   * Reset state to initial values
   */
  reset: () => void;

  /**
   * Refresh (re-execute with same params)
   */
  refresh: () => Promise<T | null>;
}

// ============================================================================
// Request Cache (for deduplication)
// ============================================================================

const requestCache = new Map<string, Promise<any>>();

function getCacheKey(key: string | undefined, args: any[]): string {
  if (key) return key;
  return JSON.stringify(args);
}

// ============================================================================
// useApi Hook
// ============================================================================

export function useApi<T = any, Args extends any[] = any[]>(
  apiFunction: (...args: Args) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiState<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    onComplete,
    retry = false,
    maxRetries = 3,
    retryDelay = 1000,
    deduplicate = true,
    cacheKey,
    showErrorToast = false,
    showSuccessToast = false,
    successMessage,
  } = options;

  // State
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);

  // Refs
  const mountedRef = useRef(true);
  const lastArgsRef = useRef<Args | null>(null);
  const attemptRef = useRef(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /**
   * Execute API call with retry logic
   */
  const executeWithRetry = useCallback(
    async (args: Args, attempt: number = 0): Promise<T | null> => {
      try {
        // Deduplication
        if (deduplicate) {
          const key = getCacheKey(cacheKey, args);
          const existingRequest = requestCache.get(key);

          if (existingRequest) {
            return existingRequest;
          }

          const request = apiFunction(...args);
          requestCache.set(key, request);

          try {
            const response = await request;
            requestCache.delete(key);

            if (!response.success) {
              throw response.error || new Error('API call failed');
            }

            return response.data || null;
          } catch (err) {
            requestCache.delete(key);
            throw err;
          }
        } else {
          const response = await apiFunction(...args);

          if (!response.success) {
            throw response.error || new Error('API call failed');
          }

          return response.data || null;
        }
      } catch (err: any) {
        const apiError: ApiError = err?.code
          ? err
          : {
              code: 'UNKNOWN_ERROR',
              message: err?.message || 'An error occurred',
            };

        // Retry logic
        if (retry && attempt < maxRetries && isRetryableError(apiError)) {
          const delay = getRetryDelay(attempt, retryDelay);

          await new Promise((resolve) => setTimeout(resolve, delay));

          return executeWithRetry(args, attempt + 1);
        }

        throw apiError;
      }
    },
    [apiFunction, deduplicate, cacheKey, retry, maxRetries, retryDelay]
  );

  /**
   * Main execute function
   */
  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      if (!mountedRef.current) return null;

      setLoading(true);
      setError(null);
      lastArgsRef.current = args;
      attemptRef.current = 0;

      try {
        const result = await executeWithRetry(args);

        if (!mountedRef.current) return null;

        setData(result);
        setError(null);

        // Success callback
        if (onSuccess && result) {
          onSuccess(result);
        }

        // Success toast
        if (showSuccessToast) {
          // TODO: Integrate with toast notification system
          console.log('Success:', successMessage || 'Operation completed successfully');
        }

        return result;
      } catch (err: any) {
        if (!mountedRef.current) return null;

        const apiError: ApiError = err;
        setError(apiError);
        setData(null);

        // Error logging
        logError(apiError, apiFunction.name);

        // Error callback
        if (onError) {
          onError(apiError);
        }

        // Error toast
        if (showErrorToast) {
          // TODO: Integrate with toast notification system
          console.error('Error:', parseApiError(apiError));
        }

        return null;
      } finally {
        if (mountedRef.current) {
          setLoading(false);

          // Complete callback
          if (onComplete) {
            onComplete();
          }
        }
      }
    },
    [executeWithRetry, onSuccess, onError, onComplete, showErrorToast, showSuccessToast, successMessage, apiFunction.name]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    lastArgsRef.current = null;
    attemptRef.current = 0;
  }, []);

  /**
   * Refresh with last args
   */
  const refresh = useCallback(async (): Promise<T | null> => {
    if (lastArgsRef.current) {
      return execute(...lastArgsRef.current);
    }
    return null;
  }, [execute]);

  // Execute immediately on mount if requested
  useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  return {
    data,
    loading,
    error,
    execute,
    reset,
    refresh,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for paginated API calls
 */
export function usePaginatedApi<T = any>(
  apiFunction: (params: any) => Promise<ApiResponse<{ items: T[]; pagination: any }>>,
  initialParams: any = {},
  options: UseApiOptions<{ items: T[]; pagination: any }> = {}
) {
  const [params, setParams] = useState(initialParams);

  const { data, loading, error, execute } = useApi(() => apiFunction(params), {
    ...options,
    immediate: options.immediate ?? true,
  });

  const nextPage = useCallback(() => {
    if (data?.pagination?.hasNext) {
      setParams((prev: any) => ({
        ...prev,
        page: (prev.page || 1) + 1,
      }));
    }
  }, [data?.pagination?.hasNext]);

  const prevPage = useCallback(() => {
    if (data?.pagination?.hasPrev) {
      setParams((prev: any) => ({
        ...prev,
        page: Math.max((prev.page || 1) - 1, 1),
      }));
    }
  }, [data?.pagination?.hasPrev]);

  const setPage = useCallback((page: number) => {
    setParams((prev: any) => ({ ...prev, page }));
  }, []);

  const setFilters = useCallback((filters: any) => {
    setParams((prev: any) => ({ ...prev, ...filters, page: 1 }));
  }, []);

  // Re-execute when params change
  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return {
    data: data?.items || [],
    pagination: data?.pagination,
    loading,
    error,
    params,
    setParams,
    setFilters,
    nextPage,
    prevPage,
    setPage,
    refresh: execute,
  };
}

/**
 * Hook for mutations (create, update, delete)
 */
export function useMutation<T = any, Args extends any[] = any[]>(
  apiFunction: (...args: Args) => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
) {
  return useApi<T, Args>(apiFunction, {
    ...options,
    immediate: false,
  });
}

// ============================================================================
// Export
// ============================================================================

export default useApi;
