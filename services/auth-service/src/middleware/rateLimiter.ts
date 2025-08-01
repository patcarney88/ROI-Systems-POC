/**
 * Rate Limiting Middleware
 * Designed by: Security Specialist + Performance Engineer
 * 
 * Advanced rate limiting with Redis backend and security monitoring
 */

import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../cache/redis';
import { logger } from '../utils/logger';

// Rate limiter instances
let rateLimiters: Record<string, RateLimiterRedis | RateLimiterMemory> = {};

/**
 * Initialize rate limiters with Redis backend
 */
export function initializeRateLimiters(): void {
  const redisClient = getRedisClient();
  
  // General API rate limiter - 100 requests per 15 minutes per IP
  rateLimiters.api = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_api',
    points: 100, // Number of requests
    duration: 15 * 60, // Per 15 minutes
    blockDuration: 15 * 60, // Block for 15 minutes
    execEvenly: true // Spread requests evenly across duration
  });

  // Authentication endpoints - stricter limits
  rateLimiters.login = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_login',
    points: 5, // 5 attempts
    duration: 15 * 60, // Per 15 minutes
    blockDuration: 15 * 60, // Block for 15 minutes
  });

  // Registration - prevent spam accounts
  rateLimiters.register = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_register',
    points: 3, // 3 registrations
    duration: 60 * 60, // Per hour
    blockDuration: 60 * 60, // Block for 1 hour
  });

  // Password reset - prevent abuse
  rateLimiters.passwordReset = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_password_reset',
    points: 3, // 3 attempts
    duration: 60 * 60, // Per hour
    blockDuration: 60 * 60, // Block for 1 hour
  });

  // Token refresh - prevent token farming
  rateLimiters.refresh = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_refresh',
    points: 10, // 10 refreshes
    duration: 60, // Per minute
    blockDuration: 5 * 60, // Block for 5 minutes
  });

  // MFA operations - prevent brute force
  rateLimiters.mfa = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_mfa',
    points: 10, // 10 attempts
    duration: 15 * 60, // Per 15 minutes
    blockDuration: 30 * 60, // Block for 30 minutes
  });

  // Email verification - prevent spam
  rateLimiters.emailVerification = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_email_verify',
    points: 5, // 5 attempts
    duration: 60 * 60, // Per hour
    blockDuration: 60 * 60, // Block for 1 hour
  });

  // Aggressive rate limiter for suspected attackers
  rateLimiters.aggressive = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rl_aggressive',
    points: 1, // 1 attempt
    duration: 60 * 60, // Per hour
    blockDuration: 24 * 60 * 60, // Block for 24 hours
  });

  logger.info('Rate limiters initialized with Redis backend');
}

/**
 * Create rate limiting middleware
 */
function createRateLimitMiddleware(
  limiterName: string,
  options: {
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (req: Request, res: Response) => void;
  } = {}
) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limiter = rateLimiters[limiterName];
      if (!limiter) {
        logger.warn(`Rate limiter '${limiterName}' not found, skipping rate limit check`);
        return next();
      }

      // Generate key for rate limiting
      const key = options.keyGenerator 
        ? options.keyGenerator(req)
        : getClientKey(req);

      // Apply rate limit
      const result = await limiter.consume(key);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': limiter.points.toString(),
        'X-RateLimit-Remaining': result.remainingHits?.toString() || '0',
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });

      next();

    } catch (rateLimitError) {
      // Rate limit exceeded
      if (rateLimitError instanceof Error && rateLimitError.name === 'RateLimiterError') {
        const error = rateLimitError as any;
        
        // Log rate limit violation
        logger.warn('Rate limit exceeded', {
          limiter: limiterName,
          key: getClientKey(req),
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          remainingHits: error.remainingHits,
          msBeforeNext: error.msBeforeNext
        });

        // Check for aggressive rate limiting triggers
        await checkAggressiveRateLimit(req);

        // Call custom handler if provided
        if (options.onLimitReached) {
          options.onLimitReached(req, res);
          return;
        }

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': rateLimiters[limiterName].points.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(Date.now() + error.msBeforeNext).toISOString(),
          'Retry-After': Math.round(error.msBeforeNext / 1000).toString()
        });

        res.status(429).json({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: Math.round(error.msBeforeNext / 1000)
        });
        return;
      }

      // Other errors
      logger.error('Rate limiter error:', rateLimitError);
      next(); // Continue on error to avoid blocking legitimate requests
    }
  };
}

/**
 * Generate client key for rate limiting
 */
function getClientKey(req: Request): string {
  // Use IP address as primary identifier
  let key = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Add user ID if authenticated for more granular control
  if (req.auth?.user?.id) {
    key += `:user:${req.auth.user.id}`;
  }
  
  return key;
}

/**
 * Check for aggressive rate limiting patterns
 */
async function checkAggressiveRateLimit(req: Request): Promise<void> {
  try {
    const key = getClientKey(req);
    const aggressiveLimiter = rateLimiters.aggressive;
    
    if (!aggressiveLimiter) return;

    // Check if this IP should be aggressively rate limited
    // This could be triggered by multiple rate limit violations
    const violations = await getRecentViolations(key);
    
    if (violations >= 3) {
      // Apply aggressive rate limiting
      await aggressiveLimiter.consume(key);
      
      logger.warn('Aggressive rate limiting applied', {
        key,
        violations,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
  } catch (error) {
    logger.error('Error checking aggressive rate limit:', error);
  }
}

/**
 * Get recent rate limit violations for a key
 */
async function getRecentViolations(key: string): Promise<number> {
  try {
    const redisClient = getRedisClient();
    const violationKey = `violations:${key}`;
    
    // Get current violation count
    const count = await redisClient.get(violationKey);
    
    // Increment and set expiry (1 hour)
    await redisClient.multi()
      .incr(violationKey)
      .expire(violationKey, 60 * 60)
      .exec();
    
    return parseInt(count || '0');
  } catch (error) {
    logger.error('Error tracking rate limit violations:', error);
    return 0;
  }
}

/**
 * Clear rate limit for a specific key (admin function)
 */
export async function clearRateLimit(limiterName: string, key: string): Promise<void> {
  try {
    const limiter = rateLimiters[limiterName];
    if (limiter && 'delete' in limiter) {
      await (limiter as any).delete(key);
      logger.info('Rate limit cleared', { limiter: limiterName, key });
    }
  } catch (error) {
    logger.error('Error clearing rate limit:', error);
  }
}

/**
 * Get rate limit status for a key
 */
export async function getRateLimitStatus(
  limiterName: string, 
  key: string
): Promise<{
  totalHits: number;
  totalHitsMax: number;
  remainingHits: number;
  msBeforeNext: number;
} | null> {
  try {
    const limiter = rateLimiters[limiterName];
    if (limiter && 'get' in limiter) {
      return await (limiter as any).get(key);
    }
    return null;
  } catch (error) {
    logger.error('Error getting rate limit status:', error);
    return null;
  }
}

// Export rate limiter middleware instances
export const rateLimiter = {
  api: createRateLimitMiddleware('api'),
  login: createRateLimitMiddleware('login', {
    onLimitReached: (req, res) => {
      logger.warn('Login rate limit exceeded - potential brute force attack', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        email: req.body?.email
      });
    }
  }),
  register: createRateLimitMiddleware('register'),
  passwordReset: createRateLimitMiddleware('passwordReset'),
  refresh: createRateLimitMiddleware('refresh'),
  mfa: createRateLimitMiddleware('mfa', {
    onLimitReached: (req, res) => {
      logger.warn('MFA rate limit exceeded - potential brute force attack', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.auth?.user?.id
      });
    }
  }),
  emailVerification: createRateLimitMiddleware('emailVerification'),
  aggressive: createRateLimitMiddleware('aggressive')
};

// Initialize rate limiters on module load
if (process.env.NODE_ENV !== 'test') {
  // Delay initialization to ensure Redis connection is established
  setTimeout(() => {
    try {
      initializeRateLimiters();
    } catch (error) {
      logger.error('Failed to initialize rate limiters:', error);
    }
  }, 1000);
}