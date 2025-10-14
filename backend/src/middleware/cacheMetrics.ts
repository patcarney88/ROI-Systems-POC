import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('cache-metrics');

/**
 * Cache Metrics Middleware
 * MONITORING: Tracks cache performance metrics
 * - Cache hit/miss rates
 * - Response time improvements
 * - Memory usage
 * - Most frequently cached keys
 */

interface RequestMetrics {
  path: string;
  method: string;
  userId?: string;
  cached: boolean;
  duration: number;
  timestamp: Date;
}

// Store recent metrics in memory (limited to last 1000 requests)
const metricsBuffer: RequestMetrics[] = [];
const MAX_METRICS_BUFFER = 1000;

// Key frequency tracking
const keyAccessFrequency: Map<string, number> = new Map();

/**
 * Cache metrics tracking middleware
 */
export const trackCacheMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  let wasCached = false;

  // Track if response came from cache
  const originalJson = res.json.bind(res);
  res.json = function (body: any): Response {
    const duration = Date.now() - startTime;

    // Check if response has cache indicator
    if (body && typeof body === 'object' && body._cached) {
      wasCached = true;
      delete body._cached; // Remove cache indicator from response
    }

    // Record metrics
    const metric: RequestMetrics = {
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
      cached: wasCached,
      duration,
      timestamp: new Date()
    };

    // Add to buffer (FIFO)
    metricsBuffer.push(metric);
    if (metricsBuffer.length > MAX_METRICS_BUFFER) {
      metricsBuffer.shift();
    }

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        path: req.path,
        method: req.method,
        duration: `${duration}ms`,
        cached: wasCached
      });
    }

    return originalJson(body);
  };

  next();
};

/**
 * Track cache key access frequency
 */
export const trackKeyAccess = (key: string): void => {
  const count = keyAccessFrequency.get(key) || 0;
  keyAccessFrequency.set(key, count + 1);
};

/**
 * Get cache performance metrics
 */
export const getCacheMetrics = async () => {
  try {
    const stats = await cacheService.getStats();

    // Calculate average response times
    const cachedRequests = metricsBuffer.filter(m => m.cached);
    const uncachedRequests = metricsBuffer.filter(m => !m.cached);

    const avgCachedTime = cachedRequests.length > 0
      ? cachedRequests.reduce((sum, m) => sum + m.duration, 0) / cachedRequests.length
      : 0;

    const avgUncachedTime = uncachedRequests.length > 0
      ? uncachedRequests.reduce((sum, m) => sum + m.duration, 0) / uncachedRequests.length
      : 0;

    const improvement = avgUncachedTime > 0
      ? ((avgUncachedTime - avgCachedTime) / avgUncachedTime) * 100
      : 0;

    // Get most frequently accessed keys
    const sortedKeys = Array.from(keyAccessFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([key, count]) => ({ key, count }));

    // Request breakdown by endpoint
    const endpointStats = metricsBuffer.reduce((acc, metric) => {
      const endpoint = `${metric.method} ${metric.path}`;
      if (!acc[endpoint]) {
        acc[endpoint] = {
          total: 0,
          cached: 0,
          avgDuration: 0,
          totalDuration: 0
        };
      }
      acc[endpoint].total++;
      if (metric.cached) acc[endpoint].cached++;
      acc[endpoint].totalDuration += metric.duration;
      acc[endpoint].avgDuration = acc[endpoint].totalDuration / acc[endpoint].total;
      return acc;
    }, {} as Record<string, any>);

    return {
      cacheStats: stats,
      performance: {
        averageCachedResponseTime: Math.round(avgCachedTime * 100) / 100,
        averageUncachedResponseTime: Math.round(avgUncachedTime * 100) / 100,
        performanceImprovement: Math.round(improvement * 100) / 100,
        cachedRequests: cachedRequests.length,
        uncachedRequests: uncachedRequests.length,
        totalRequests: metricsBuffer.length
      },
      topKeys: sortedKeys,
      endpoints: endpointStats,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error('Failed to get cache metrics', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
};

/**
 * Reset metrics buffer
 */
export const resetMetrics = (): void => {
  metricsBuffer.length = 0;
  keyAccessFrequency.clear();
  logger.info('Cache metrics reset');
};

/**
 * Get metrics summary for logging
 */
export const getMetricsSummary = async () => {
  const metrics = await getCacheMetrics();
  if (!metrics) return null;

  return {
    hitRate: `${metrics.cacheStats.hitRate}%`,
    avgCachedTime: `${metrics.performance.averageCachedResponseTime}ms`,
    avgUncachedTime: `${metrics.performance.averageUncachedResponseTime}ms`,
    improvement: `${metrics.performance.performanceImprovement}%`,
    memoryUsed: metrics.cacheStats.memoryUsed,
    totalKeys: metrics.cacheStats.keys
  };
};

/**
 * Log metrics periodically (call from a cron job or interval)
 */
export const logMetricsSummary = async (): Promise<void> => {
  try {
    const summary = await getMetricsSummary();
    if (summary) {
      logger.info('Cache metrics summary', summary);
    }
  } catch (error) {
    logger.error('Failed to log metrics summary', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Express route handler to expose metrics
 */
export const metricsEndpoint = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if user is authenticated and is admin
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required'
        }
      });
      return;
    }

    const metrics = await getCacheMetrics();
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Metrics endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve metrics'
      }
    });
  }
};

/**
 * Health check endpoint with cache stats
 */
export const healthEndpoint = async (_req: Request, res: Response): Promise<void> => {
  try {
    const stats = await cacheService.getStats();
    const isHealthy = stats.hitRate > 0 || stats.keys === 0; // Healthy if hit rate > 0 or no keys yet

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      data: {
        cache: {
          healthy: isHealthy,
          hitRate: `${stats.hitRate}%`,
          keys: stats.keys,
          memoryUsed: stats.memoryUsed
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Health endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Cache health check failed'
      }
    });
  }
};

export default trackCacheMetrics;
