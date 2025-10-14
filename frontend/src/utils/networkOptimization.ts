/**
 * Network Optimization Utilities
 *
 * Request batching, deduplication, retry logic, timeout handling,
 * connection detection, and adaptive loading
 */

/**
 * Network connection information
 */
export interface ConnectionInfo {
  effectiveType: '4g' | '3g' | '2g' | 'slow-2g';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

/**
 * Get network connection info
 */
export function getConnectionInfo(): ConnectionInfo | null {
  if (!('connection' in navigator)) {
    return null;
  }

  const connection = (navigator as any).connection;

  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 50,
    saveData: connection.saveData || false
  };
}

/**
 * Check if connection is slow
 */
export function isSlowConnection(): boolean {
  const connection = getConnectionInfo();
  if (!connection) return false;

  return (
    connection.effectiveType === 'slow-2g' ||
    connection.effectiveType === '2g' ||
    connection.saveData
  );
}

/**
 * Request batcher for combining multiple requests
 */
export class RequestBatcher<T = any> {
  private queue: Array<{
    resolve: (value: T) => void;
    reject: (error: Error) => void;
    data: any;
  }> = [];
  private timer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchDelay: number;
  private endpoint: string;

  constructor(
    endpoint: string,
    options: { batchSize?: number; batchDelay?: number } = {}
  ) {
    this.endpoint = endpoint;
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 50;
  }

  /**
   * Add request to batch
   */
  async add(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject, data });

      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.batchDelay);
      }
    });
  }

  /**
   * Flush batch and send request
   */
  private async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.queue.length === 0) return;

    const batch = this.queue.splice(0);
    const batchData = batch.map(item => item.data);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batch: batchData })
      });

      if (!response.ok) {
        throw new Error(`Batch request failed: ${response.statusText}`);
      }

      const results = await response.json();

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error as Error);
      });
    }
  }
}

/**
 * Request deduplicator to prevent duplicate requests
 */
export class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  /**
   * Execute request with deduplication
   */
  async execute<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Return existing promise if request is already pending
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    // Create new request promise
    const promise = requestFn()
      .finally(() => {
        this.pending.delete(key);
      });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear pending requests
   */
  clear() {
    this.pending.clear();
  }

  /**
   * Check if request is pending
   */
  isPending(key: string): boolean {
    return this.pending.has(key);
  }
}

/**
 * Retry logic with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    factor?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    factor = 2,
    onRetry
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        onRetry?.(attempt + 1, lastError);

        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * factor, maxDelay);
      }
    }
  }

  throw lastError!;
}

/**
 * Request with timeout
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 30000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if ((error as Error).name === 'AbortError') {
      throw new Error(`Request timeout after ${timeout}ms`);
    }
    throw error;
  }
}

/**
 * Adaptive image quality based on connection
 */
export function getAdaptiveImageQuality(): number {
  const connection = getConnectionInfo();

  if (!connection) return 80;

  const qualityMap: Record<string, number> = {
    '4g': 90,
    '3g': 70,
    '2g': 50,
    'slow-2g': 40
  };

  return connection.saveData ? 50 : qualityMap[connection.effectiveType] || 80;
}

/**
 * Adaptive content loading strategy
 */
export interface ContentLoadStrategy {
  loadImages: boolean;
  loadVideos: boolean;
  loadFonts: boolean;
  prefetchRoutes: boolean;
  quality: 'high' | 'medium' | 'low';
}

export function getContentLoadStrategy(): ContentLoadStrategy {
  const connection = getConnectionInfo();

  if (!connection) {
    return {
      loadImages: true,
      loadVideos: true,
      loadFonts: true,
      prefetchRoutes: true,
      quality: 'high'
    };
  }

  if (connection.saveData) {
    return {
      loadImages: false,
      loadVideos: false,
      loadFonts: true,
      prefetchRoutes: false,
      quality: 'low'
    };
  }

  switch (connection.effectiveType) {
    case '4g':
      return {
        loadImages: true,
        loadVideos: true,
        loadFonts: true,
        prefetchRoutes: true,
        quality: 'high'
      };
    case '3g':
      return {
        loadImages: true,
        loadVideos: false,
        loadFonts: true,
        prefetchRoutes: false,
        quality: 'medium'
      };
    case '2g':
    case 'slow-2g':
      return {
        loadImages: false,
        loadVideos: false,
        loadFonts: true,
        prefetchRoutes: false,
        quality: 'low'
      };
    default:
      return {
        loadImages: true,
        loadVideos: true,
        loadFonts: true,
        prefetchRoutes: true,
        quality: 'high'
      };
  }
}

/**
 * Request queue manager
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private concurrency: number;
  private activeRequests = 0;

  constructor(concurrency: number = 6) {
    this.concurrency = concurrency;
  }

  /**
   * Add request to queue
   */
  async add<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.process();
    });
  }

  /**
   * Process queue
   */
  private async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0 && this.activeRequests < this.concurrency) {
      const request = this.queue.shift();
      if (request) {
        this.activeRequests++;
        request().finally(() => {
          this.activeRequests--;
          this.process();
        });
      }
    }

    this.processing = false;
  }

  /**
   * Get queue size
   */
  getSize(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  clear() {
    this.queue = [];
  }
}

/**
 * Network-aware cache
 */
export class NetworkCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  /**
   * Get cached data or fetch new data
   */
  async get<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttl = 300000, forceRefresh = false } = options;

    // Check cache
    if (!forceRefresh && this.cache.has(key)) {
      const cached = this.cache.get(key)!;
      const age = Date.now() - cached.timestamp;

      if (age < cached.ttl) {
        return cached.data;
      }
    }

    // Fetch new data
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
    return data;
  }

  /**
   * Clear cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Remove expired entries
   */
  cleanup() {
    const now = Date.now();
    this.cache.forEach((value, key) => {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    });
  }
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(resources: Array<{ url: string; type: string }>) {
  resources.forEach(({ url, type }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = type;
    link.href = url;

    if (type === 'font') {
      link.crossOrigin = 'anonymous';
    }

    document.head.appendChild(link);
  });
}

/**
 * Monitor connection changes
 */
export function onConnectionChange(callback: (info: ConnectionInfo) => void) {
  if (!('connection' in navigator)) {
    return;
  }

  const connection = (navigator as any).connection;

  const handleChange = () => {
    const info = getConnectionInfo();
    if (info) {
      callback(info);
    }
  };

  connection.addEventListener('change', handleChange);

  // Return cleanup function
  return () => {
    connection.removeEventListener('change', handleChange);
  };
}

export default {
  getConnectionInfo,
  isSlowConnection,
  RequestBatcher,
  RequestDeduplicator,
  retryWithBackoff,
  fetchWithTimeout,
  getAdaptiveImageQuality,
  getContentLoadStrategy,
  RequestQueue,
  NetworkCache,
  preloadCriticalResources,
  onConnectionChange
};
