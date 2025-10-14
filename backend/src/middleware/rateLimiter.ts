import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { Request, Response } from 'express';
import { redisClient } from '../config/redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('rate-limiter');

/**
 * Redis Store Configuration for Rate Limiting
 * PERFORMANCE: Shared rate limits across multiple servers
 * PRODUCTION-READY: Persistent rate limit counts
 */
const createRedisStore = (prefix: string) => {
  return new RedisStore({
    // @ts-expect-error - RedisStore expects redis client, ioredis is compatible
    sendCommand: (...args: string[]) => redisClient.call(...args),
    prefix: `rl:${prefix}:`
  });
};

/**
 * Global API Rate Limiter with Redis
 * SECURITY: Protects against DoS attacks and API abuse
 * OWASP Reference: A05:2021 - Security Misconfiguration
 *
 * Limits: 100 requests per 15 minutes per IP
 * Now uses Redis for distributed rate limiting
 */
export const globalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  store: createRedisStore('global'),
  handler: (req: Request, res: Response) => {
    logger.warn('Global rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter: res.getHeader('Retry-After')
      }
    });
  }
});

/**
 * Authentication Rate Limiter with Redis
 * SECURITY: Prevents brute force attacks on authentication endpoints
 * OWASP Reference: A07:2021 - Identification and Authentication Failures
 *
 * Limits: 5 failed attempts per 15 minutes per IP
 * Successful requests are not counted against the limit
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful login attempts
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('auth'),
  keyGenerator: (req: Request) => {
    // Rate limit by IP address
    return req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Authentication rate limit exceeded - Possible brute force attack', {
      ip: req.ip,
      path: req.path,
      email: req.body.email,
      userAgent: req.get('user-agent'),
      timestamp: new Date().toISOString()
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
        retryAfter: res.getHeader('Retry-After')
      }
    });
  }
});

/**
 * File Upload Rate Limiter with Redis
 * SECURITY: Prevents resource exhaustion from excessive file uploads
 * OWASP Reference: A04:2021 - Insecure Design
 *
 * Limits: 20 uploads per hour per authenticated user (or IP if not authenticated)
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: 'Upload limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('upload'),
  keyGenerator: (req: Request) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return req.user?.userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      userAgent: req.get('user-agent')
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: 'Too many file uploads. Please try again in an hour.',
        retryAfter: res.getHeader('Retry-After')
      }
    });
  }
});

/**
 * API Sensitive Operations Rate Limiter with Redis
 * SECURITY: Protects critical operations (password reset, email change, etc.)
 *
 * Limits: 3 requests per hour per user
 */
export const sensitiveOperationsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many sensitive operations. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('sensitive'),
  keyGenerator: (req: Request) => {
    // Must be authenticated for sensitive operations
    return req.user?.userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Sensitive operations rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      path: req.path,
      userAgent: req.get('user-agent')
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'SENSITIVE_OPERATION_LIMIT_EXCEEDED',
        message: 'Too many sensitive operations. Please try again in an hour.',
        retryAfter: res.getHeader('Retry-After')
      }
    });
  }
});

/**
 * AI/ML Operations Rate Limiter with Redis
 * SECURITY: Prevents abuse of expensive AI operations
 *
 * Limits: 10 AI operations per minute per user
 */
export const aiOperationsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 AI operations per minute
  message: 'AI operations limit exceeded. Please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  store: createRedisStore('ai'),
  keyGenerator: (req: Request) => {
    return req.user?.userId || req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('AI operations rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.userId,
      userAgent: req.get('user-agent')
    });

    res.status(429).json({
      success: false,
      error: {
        code: 'AI_RATE_LIMIT_EXCEEDED',
        message: 'Too many AI operations. Please wait a moment before trying again.',
        retryAfter: res.getHeader('Retry-After')
      }
    });
  }
});
