import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('cache-invalidation');

/**
 * Cache Invalidation Middleware
 * PERFORMANCE: Smart cache invalidation on data mutations
 * Automatically clears relevant caches when data is modified
 */

export type InvalidationPattern = string | string[] | ((req: Request) => string | string[]);

/**
 * Create cache invalidation middleware
 * @param patterns Cache key patterns to invalidate
 * @returns Express middleware
 */
export const invalidateCache = (patterns: InvalidationPattern) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after successful response
    res.json = function (body: any): Response {
      // Only invalidate on successful mutations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Don't await - invalidate asynchronously
        invalidateCachePatterns(patterns, req).catch(error => {
          logger.error('Cache invalidation failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
            method: req.method
          });
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate cache patterns
 */
async function invalidateCachePatterns(
  patterns: InvalidationPattern,
  req: Request
): Promise<void> {
  try {
    let patternsArray: string[];

    if (typeof patterns === 'function') {
      const result = patterns(req);
      patternsArray = Array.isArray(result) ? result : [result];
    } else {
      patternsArray = Array.isArray(patterns) ? patterns : [patterns];
    }

    // Replace placeholders in patterns
    patternsArray = patternsArray.map(pattern => {
      return pattern
        .replace('{id}', req.params.id || '')
        .replace('{userId}', req.user?.userId || '')
        .replace('{clientId}', req.params.clientId || req.body.clientId || '');
    });

    // Invalidate all patterns
    await Promise.all(
      patternsArray.map(pattern => cacheService.clearPattern(pattern))
    );

    logger.info('Cache invalidated', {
      patterns: patternsArray,
      method: req.method,
      path: req.path
    });
  } catch (error) {
    logger.error('Cache invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      patterns,
      path: req.path
    });
  }
}

/**
 * Pre-defined invalidation patterns for common operations
 */

// Document invalidation patterns
export const invalidateDocuments = invalidateCache([
  'documents:list:*',
  'documents:user:{userId}',
  'documents:stats:{userId}'
]);

export const invalidateDocument = invalidateCache([
  'document:{id}',
  'documents:list:*',
  'documents:user:{userId}',
  'documents:stats:{userId}'
]);

// Client invalidation patterns
export const invalidateClients = invalidateCache([
  'clients:list:*',
  'clients:stats:{userId}'
]);

export const invalidateClient = invalidateCache([
  'client:{id}',
  'client:engagement:{id}',
  'clients:list:*',
  'clients:stats:{userId}'
]);

// Campaign invalidation patterns
export const invalidateCampaigns = invalidateCache([
  'campaigns:active',
  'campaigns:list:*'
]);

export const invalidateCampaign = invalidateCache([
  'campaign:{id}',
  'campaign:metrics:{id}',
  'campaigns:active',
  'campaigns:list:*'
]);

// User invalidation patterns
export const invalidateUser = invalidateCache([
  'user:session:{userId}',
  'user:profile:{userId}'
]);

/**
 * Conditional cache invalidation
 * Only invalidates if specific condition is met
 */
export const invalidateCacheIf = (
  condition: (req: Request, res: Response) => boolean,
  patterns: InvalidationPattern
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      if (res.statusCode >= 200 && res.statusCode < 300 && condition(req, res)) {
        invalidateCachePatterns(patterns, req).catch(error => {
          logger.error('Conditional cache invalidation failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Invalidate multiple cache patterns at once
 */
export const invalidateMultiple = (...patterns: InvalidationPattern[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any): Response {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.all(
          patterns.map(pattern => invalidateCachePatterns(pattern, req))
        ).catch(error => {
          logger.error('Multiple cache invalidation failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Manual cache invalidation helper
 * Use in controllers when you need fine-grained control
 */
export const manualInvalidate = async (
  patterns: string | string[],
  replacements?: Record<string, string>
): Promise<void> => {
  try {
    let patternsArray = Array.isArray(patterns) ? patterns : [patterns];

    // Apply replacements
    if (replacements) {
      patternsArray = patternsArray.map(pattern => {
        let result = pattern;
        Object.entries(replacements).forEach(([key, value]) => {
          result = result.replace(`{${key}}`, value);
        });
        return result;
      });
    }

    await Promise.all(
      patternsArray.map(pattern => cacheService.clearPattern(pattern))
    );

    logger.info('Manual cache invalidation', { patterns: patternsArray });
  } catch (error) {
    logger.error('Manual cache invalidation error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      patterns
    });
  }
};

export default invalidateCache;
