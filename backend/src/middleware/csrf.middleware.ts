import { Request, Response, NextFunction } from 'express';
import { doubleCsrf } from 'csrf-csrf';
import { createLogger } from '../utils/logger';

const logger = createLogger('csrf-middleware');

/**
 * CSRF Protection Middleware
 *
 * Implements Double Submit Cookie pattern for CSRF protection.
 * This is more secure than traditional session-based CSRF tokens.
 *
 * OWASP Reference: A01:2021 - Broken Access Control
 *
 * How it works:
 * 1. Server generates a CSRF secret and stores it in an httpOnly cookie
 * 2. Server generates a CSRF token from the secret
 * 3. Client includes the token in request headers (X-CSRF-Token)
 * 4. Server validates token against the secret from the cookie
 */

// Configure CSRF protection
const {
  generateToken,
  validateRequest,
  doubleCsrfProtection
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production',
  cookieName: '__Host-psifi.x-csrf-token', // __Host- prefix for additional security
  cookieOptions: {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    path: '/'
  },
  size: 64, // Token size in bytes
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'], // Methods that don't need CSRF protection
  getTokenFromRequest: (req) => {
    // Get token from header or body
    return req.headers['x-csrf-token'] as string || req.body._csrf;
  }
});

/**
 * Middleware to generate and attach CSRF token to response
 */
export const csrfToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = generateToken(req, res);

    // Attach token to response locals for use in templates
    res.locals.csrfToken = token;

    // Also send in response header for SPA usage
    res.setHeader('X-CSRF-Token', token);

    next();
  } catch (error) {
    logger.error('CSRF token generation failed:', error);
    next();
  }
};

/**
 * CSRF validation middleware
 * Apply to all state-changing routes (POST, PUT, DELETE)
 */
export const csrfProtection = doubleCsrfProtection;

/**
 * Conditional CSRF protection
 * Excludes certain paths from CSRF protection (e.g., webhooks)
 */
export const conditionalCsrf = (excludePaths: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if current path should be excluded
    const shouldExclude = excludePaths.some(path =>
      req.path.startsWith(path)
    );

    if (shouldExclude) {
      logger.debug(`CSRF protection skipped for path: ${req.path}`);
      return next();
    }

    // Apply CSRF protection
    doubleCsrfProtection(req, res, next);
  };
};

/**
 * Error handler for CSRF validation failures
 */
export const csrfErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err.code === 'EBADCSRFTOKEN') {
    logger.warn('CSRF token validation failed', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      path: req.path,
      method: req.method
    });

    res.status(403).json({
      success: false,
      error: {
        code: 'CSRF_VALIDATION_FAILED',
        message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
      }
    });
  } else {
    next(err);
  }
};

/**
 * Endpoint to get a fresh CSRF token
 * GET /api/v1/auth/csrf-token
 */
export const getCsrfToken = (req: Request, res: Response) => {
  try {
    const token = generateToken(req, res);

    res.json({
      success: true,
      csrfToken: token
    });
  } catch (error) {
    logger.error('Failed to generate CSRF token:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_TOKEN_ERROR',
        message: 'Failed to generate CSRF token'
      }
    });
  }
};

/**
 * Middleware to ensure CSRF cookie is set for authenticated users
 */
export const ensureCsrfCookie = (req: Request, res: Response, next: NextFunction) => {
  // Generate token to ensure cookie is set
  try {
    generateToken(req, res);
  } catch (error) {
    logger.debug('CSRF cookie generation:', error);
  }
  next();
};