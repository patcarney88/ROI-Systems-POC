import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('query-performance');

interface QueryMetrics {
  method: string;
  url: string;
  duration: number;
  statusCode: number;
  queryCount?: number;
  timestamp: Date;
}

// In-memory storage for metrics (use Redis or database in production)
const metricsBuffer: QueryMetrics[] = [];
const METRICS_BUFFER_SIZE = 1000;
const SLOW_QUERY_THRESHOLD = 1000; // 1 second

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  FAST: 100,      // < 100ms - Fast
  NORMAL: 500,    // < 500ms - Normal
  SLOW: 1000,     // < 1000ms - Slow
  CRITICAL: 3000, // < 3000ms - Critical
};

/**
 * Middleware to track API request performance
 * Logs slow requests and collects metrics
 */
export const queryPerformanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  let queryCount = 0;

  // Intercept Sequelize queries (if available)
  const originalQuery = (req as any).sequelize?.query;
  if (originalQuery) {
    (req as any).sequelize.query = (...args: any[]) => {
      queryCount++;
      return originalQuery.apply((req as any).sequelize, args);
    };
  }

  // Capture response finish event
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const metrics: QueryMetrics = {
      method: req.method,
      url: req.originalUrl || req.url,
      duration,
      statusCode: res.statusCode,
      queryCount: queryCount || undefined,
      timestamp: new Date(),
    };

    // Log based on performance
    if (duration > PERFORMANCE_THRESHOLDS.CRITICAL) {
      logger.error('Critical slow request', {
        ...metrics,
        threshold: 'CRITICAL',
        user: (req as any).user?.userId,
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
      logger.warn('Slow request', {
        ...metrics,
        threshold: 'SLOW',
        user: (req as any).user?.userId,
      });
    } else if (duration > PERFORMANCE_THRESHOLDS.NORMAL) {
      logger.info('Normal request', {
        ...metrics,
        threshold: 'NORMAL',
      });
    } else {
      logger.debug('Fast request', {
        ...metrics,
        threshold: 'FAST',
      });
    }

    // Store metrics in buffer
    metricsBuffer.push(metrics);
    if (metricsBuffer.length > METRICS_BUFFER_SIZE) {
      metricsBuffer.shift(); // Remove oldest metric
    }

    // Set response header for client-side monitoring
    res.setHeader('X-Response-Time', `${duration}ms`);
    if (queryCount > 0) {
      res.setHeader('X-Query-Count', queryCount.toString());
    }
  });

  next();
};

/**
 * Get performance metrics summary
 */
export function getPerformanceMetrics() {
  if (metricsBuffer.length === 0) {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      slowRequests: 0,
      fastRequests: 0,
    };
  }

  const sortedDurations = metricsBuffer
    .map(m => m.duration)
    .sort((a, b) => a - b);

  const totalRequests = metricsBuffer.length;
  const sum = sortedDurations.reduce((acc, d) => acc + d, 0);
  const averageResponseTime = sum / totalRequests;

  const p50Index = Math.floor(totalRequests * 0.5);
  const p95Index = Math.floor(totalRequests * 0.95);
  const p99Index = Math.floor(totalRequests * 0.99);

  const slowRequests = metricsBuffer.filter(m => m.duration > SLOW_QUERY_THRESHOLD).length;
  const fastRequests = metricsBuffer.filter(m => m.duration < PERFORMANCE_THRESHOLDS.FAST).length;

  return {
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime),
    p50: sortedDurations[p50Index] || 0,
    p95: sortedDurations[p95Index] || 0,
    p99: sortedDurations[p99Index] || 0,
    slowRequests,
    fastRequests,
    slowRequestPercentage: ((slowRequests / totalRequests) * 100).toFixed(2),
    fastRequestPercentage: ((fastRequests / totalRequests) * 100).toFixed(2),
  };
}

/**
 * Get slowest endpoints
 */
export function getSlowestEndpoints(limit: number = 10) {
  const endpointMetrics = new Map<string, { totalTime: number; count: number; maxTime: number }>();

  metricsBuffer.forEach(metric => {
    const key = `${metric.method} ${metric.url}`;
    const existing = endpointMetrics.get(key) || { totalTime: 0, count: 0, maxTime: 0 };

    endpointMetrics.set(key, {
      totalTime: existing.totalTime + metric.duration,
      count: existing.count + 1,
      maxTime: Math.max(existing.maxTime, metric.duration),
    });
  });

  const sortedEndpoints = Array.from(endpointMetrics.entries())
    .map(([endpoint, stats]) => ({
      endpoint,
      avgTime: Math.round(stats.totalTime / stats.count),
      maxTime: stats.maxTime,
      count: stats.count,
    }))
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, limit);

  return sortedEndpoints;
}

/**
 * Get recent slow queries
 */
export function getRecentSlowQueries(limit: number = 20) {
  return metricsBuffer
    .filter(m => m.duration > SLOW_QUERY_THRESHOLD)
    .slice(-limit)
    .reverse();
}

/**
 * Clear metrics buffer
 */
export function clearMetrics() {
  metricsBuffer.length = 0;
  logger.info('Performance metrics cleared');
}

/**
 * Middleware to expose performance metrics endpoint
 */
export const performanceMetricsHandler = (req: Request, res: Response) => {
  const metrics = getPerformanceMetrics();
  const slowestEndpoints = getSlowestEndpoints();
  const recentSlowQueries = getRecentSlowQueries();

  res.json({
    success: true,
    data: {
      overview: metrics,
      slowestEndpoints,
      recentSlowQueries,
    },
  });
};

export default queryPerformanceMiddleware;
