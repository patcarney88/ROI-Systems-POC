/**
 * Rate Limiting Middleware
 *
 * Features:
 * - Redis-based sliding window rate limiting
 * - Multiple rate limit strategies (global, auth, MFA, account creation)
 * - IP-based and user-based rate limiting
 * - Custom rate limit responses
 * - Automatic cleanup of expired keys
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../services/session.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('rate-limit');

// ============================================================================
// RATE LIMIT CONFIGURATIONS
// ============================================================================

/**
 * Global rate limiter - 100 requests per 15 minutes per IP
 * Applied to all API endpoints
 */
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue with ioredis
    client: redis,
    prefix: 'rl:global:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`Global rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health check and status endpoints
    return req.path === '/health' || req.path === '/status';
  },
});

/**
 * Auth endpoints rate limiter - 5 attempts per 15 minutes per IP
 * Applied to login, password reset, etc.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue
    client: redis,
    prefix: 'rl:auth:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_AUTH_ATTEMPTS',
        message: 'Too many authentication attempts. Please try again in 15 minutes.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  keyGenerator: (req: Request) => {
    // Use email + IP for more granular limiting
    const email = req.body.email || 'unknown';
    return `${req.ip}:${email}`;
  },
});

/**
 * MFA verification rate limiter - 5 attempts per 15 minutes
 * Applied to TOTP, SMS, and backup code verification
 */
export const mfaRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue
    client: redis,
    prefix: 'rl:mfa:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`MFA rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_MFA_ATTEMPTS',
        message: 'Too many MFA verification attempts. Please try again in 15 minutes.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  keyGenerator: (req: Request) => {
    // Use session token or user ID for MFA attempts
    const identifier = req.body.mfaSessionToken || req.user?.userId || req.ip;
    return `${identifier}`;
  },
});

/**
 * Account creation rate limiter - 3 accounts per hour per IP
 * Prevents mass account creation
 */
export const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue
    client: redis,
    prefix: 'rl:register:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`Account creation rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_REGISTRATIONS',
        message: 'Too many account creation attempts. Please try again later.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * Password reset rate limiter - 3 requests per hour per IP
 * Prevents password reset abuse
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue
    client: redis,
    prefix: 'rl:password:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_RESET_REQUESTS',
        message: 'Too many password reset requests. Please try again later.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  keyGenerator: (req: Request) => {
    const email = req.body.email || 'unknown';
    return `${req.ip}:${email}`;
  },
});

/**
 * Email verification rate limiter - 5 requests per hour per email
 * Prevents email verification abuse
 */
export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue
    client: redis,
    prefix: 'rl:verify:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`Email verification rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'TOO_MANY_VERIFICATION_REQUESTS',
        message: 'Too many verification requests. Please try again later.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  keyGenerator: (req: Request) => {
    const email = req.body.email || 'unknown';
    return `${email}`;
  },
});

/**
 * API endpoint rate limiter - 30 requests per minute per user
 * Applied to resource-intensive endpoints
 */
export const apiEndpointLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - RedisStore types issue
    client: redis,
    prefix: 'rl:api:',
  }),
  handler: (req: Request, res: Response) => {
    logger.warn(`API rate limit exceeded for user: ${req.user?.userId || req.ip}`);
    res.status(429).json({
      success: false,
      error: {
        code: 'API_RATE_LIMIT_EXCEEDED',
        message: 'Too many API requests. Please slow down.',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    return req.user?.userId || req.ip || 'unknown';
  },
});

// ============================================================================
// CUSTOM RATE LIMITING
// ============================================================================

/**
 * Create custom rate limiter
 * @param options - Rate limit options
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  prefix: string;
  message: string;
  skipSuccessfulRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    store: new RedisStore({
      // @ts-expect-error - RedisStore types issue
      client: redis,
      prefix: `rl:${options.prefix}:`,
    }),
    handler: (req: Request, res: Response) => {
      logger.warn(`Rate limit exceeded for ${options.prefix}: ${req.ip}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message,
          retryAfter: res.getHeader('Retry-After'),
        },
      });
    },
    keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
  });
}

// ============================================================================
// SLIDING WINDOW RATE LIMITER
// ============================================================================

/**
 * Sliding window rate limiter implementation using Redis
 * More accurate than fixed window, prevents burst attacks
 */
export class SlidingWindowRateLimiter {
  private prefix: string;
  private windowMs: number;
  private maxRequests: number;

  constructor(prefix: string, windowMs: number, maxRequests: number) {
    this.prefix = prefix;
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  /**
   * Check if request is allowed
   * @param identifier - Unique identifier (IP, user ID, etc.)
   * @returns Whether request is allowed
   */
  async isAllowed(identifier: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const key = `${this.prefix}:${identifier}`;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    try {
      // Remove old entries
      await redis.zremrangebyscore(key, '-inf', windowStart.toString());

      // Count requests in current window
      const count = await redis.zcount(key, windowStart.toString(), '+inf');

      if (count < this.maxRequests) {
        // Add current request
        await redis.zadd(key, now.toString(), `${now}:${Math.random()}`);
        await redis.pexpire(key, this.windowMs);

        return {
          allowed: true,
          remaining: this.maxRequests - count - 1,
          resetAt: new Date(now + this.windowMs),
        };
      }

      // Get oldest request timestamp to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldest.length > 1 ? parseInt(oldest[1]) + this.windowMs : now + this.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(resetTime),
      };
    } catch (error) {
      logger.error('Sliding window rate limit error:', error);
      // Fail open in case of errors
      return {
        allowed: true,
        remaining: this.maxRequests,
        resetAt: new Date(now + this.windowMs),
      };
    }
  }

  /**
   * Middleware for sliding window rate limiting
   */
  middleware(keyGenerator: (req: Request) => string, errorMessage: string = 'Rate limit exceeded') {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      const identifier = keyGenerator(req);
      const result = await this.isAllowed(identifier);

      // Add rate limit headers
      res.setHeader('X-RateLimit-Limit', this.maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
      res.setHeader('X-RateLimit-Reset', Math.floor(result.resetAt.getTime() / 1000).toString());

      if (!result.allowed) {
        logger.warn(`Sliding window rate limit exceeded: ${identifier}`);
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: errorMessage,
            retryAfter: result.resetAt.toISOString(),
          },
        });
        return;
      }

      next();
    };
  }
}

// ============================================================================
// CLEANUP UTILITY
// ============================================================================

/**
 * Clean up expired rate limit keys
 * Should be run periodically (e.g., via cron job)
 */
export async function cleanupRateLimits(): Promise<void> {
  try {
    const prefixes = ['rl:global:', 'rl:auth:', 'rl:mfa:', 'rl:register:', 'rl:password:', 'rl:verify:', 'rl:api:'];

    for (const prefix of prefixes) {
      const keys = await redis.keys(`${prefix}*`);

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -1) {
          // Key has no expiry, delete it
          await redis.del(key);
        }
      }
    }

    logger.info('Rate limit cleanup completed');
  } catch (error) {
    logger.error('Rate limit cleanup error:', error);
  }
}

// Export instances for common use cases
export const loginRateLimiter = new SlidingWindowRateLimiter(
  'sliding:login',
  15 * 60 * 1000, // 15 minutes
  5 // 5 attempts
);

export const mfaSlidingLimiter = new SlidingWindowRateLimiter(
  'sliding:mfa',
  15 * 60 * 1000, // 15 minutes
  5 // 5 attempts
);
