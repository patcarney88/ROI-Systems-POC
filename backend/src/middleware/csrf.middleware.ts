/**
 * CSRF Protection Middleware
 *
 * Features:
 * - Double submit cookie pattern
 * - CSRF token generation and validation
 * - Cookie-based token storage
 * - Automatic token rotation
 * - Exempt GET requests (safe methods)
 */

import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { createLogger } from '../utils/logger';
import { AppError } from './error.middleware';

const logger = createLogger('csrf-middleware');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CSRF_TOKEN_LENGTH = 32;
const CSRF_TOKEN_COOKIE = 'csrf-token';
const CSRF_TOKEN_HEADER = 'x-csrf-token';
const CSRF_TOKEN_BODY = 'csrfToken';

// Safe HTTP methods that don't need CSRF protection
const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

// ============================================================================
// TOKEN GENERATION
// ============================================================================

/**
 * Generate secure CSRF token
 * @returns Random token string
 */
function generateCSRFToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

/**
 * Hash CSRF token for comparison
 * @param token - Token to hash
 * @returns Hashed token
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * CSRF token middleware - Double submit cookie pattern
 * Generates and validates CSRF tokens
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Skip CSRF for safe methods
    if (SAFE_METHODS.includes(req.method)) {
      return next();
    }

    // Get token from cookie
    const cookieToken = req.cookies?.[CSRF_TOKEN_COOKIE];

    // Get token from header or body
    const requestToken = req.headers[CSRF_TOKEN_HEADER] || req.body?.[CSRF_TOKEN_BODY];

    // If no cookie token exists, this is likely first request
    if (!cookieToken) {
      throw new AppError(
        403,
        'CSRF_TOKEN_MISSING',
        'CSRF token not found. Please refresh the page.'
      );
    }

    // Validate request token
    if (!requestToken) {
      throw new AppError(
        403,
        'CSRF_TOKEN_REQUIRED',
        'CSRF token required for this request'
      );
    }

    // Compare tokens using timing-safe comparison
    const cookieHash = hashToken(cookieToken);
    const requestHash = hashToken(requestToken as string);

    if (!crypto.timingSafeEqual(Buffer.from(cookieHash), Buffer.from(requestHash))) {
      logger.warn('CSRF token mismatch', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      throw new AppError(
        403,
        'CSRF_TOKEN_INVALID',
        'Invalid CSRF token. Please refresh the page and try again.'
      );
    }

    // Token is valid, continue
    next();
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
        },
      });
      return;
    }

    logger.error('CSRF protection error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_ERROR',
        message: 'CSRF protection error',
      },
    });
  }
};

/**
 * Generate and set CSRF token
 * Adds token to response cookie and locals for templates
 */
export const generateCSRFMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    // Check if token already exists
    let token = req.cookies?.[CSRF_TOKEN_COOKIE];

    // Generate new token if none exists
    if (!token) {
      token = generateCSRFToken();

      // Set secure cookie
      res.cookie(CSRF_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });
    }

    // Make token available to response (for including in forms)
    res.locals.csrfToken = token;

    next();
  } catch (error) {
    logger.error('CSRF token generation error:', error);
    next(error);
  }
};

/**
 * Get CSRF token endpoint
 * Returns current CSRF token for AJAX requests
 */
export const getCSRFToken = (req: Request, res: Response): void => {
  try {
    const token = req.cookies?.[CSRF_TOKEN_COOKIE] || generateCSRFToken();

    // Set cookie if new token
    if (!req.cookies?.[CSRF_TOKEN_COOKIE]) {
      res.cookie(CSRF_TOKEN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000,
      });
    }

    res.json({
      success: true,
      data: {
        csrfToken: token,
      },
    });
  } catch (error) {
    logger.error('Get CSRF token error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_ERROR',
        message: 'Failed to get CSRF token',
      },
    });
  }
};

// ============================================================================
// CONDITIONAL CSRF PROTECTION
// ============================================================================

/**
 * CSRF protection with exemptions
 * @param exemptPaths - Array of paths to exempt from CSRF
 */
export const csrfWithExemptions = (exemptPaths: string[] = []) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Check if path is exempt
    const isExempt = exemptPaths.some((path) => {
      if (path.includes('*')) {
        const regex = new RegExp(path.replace('*', '.*'));
        return regex.test(req.path);
      }
      return req.path === path;
    });

    if (isExempt) {
      return next();
    }

    // Apply CSRF protection
    csrfProtection(req, res, next);
  };
};

/**
 * CSRF protection for API endpoints
 * Only applies to authenticated requests
 */
export const csrfForAPI = (req: Request, res: Response, next: NextFunction): void => {
  // Only apply CSRF to authenticated requests
  if (!req.user) {
    return next();
  }

  csrfProtection(req, res, next);
};

// ============================================================================
// TOKEN ROTATION
// ============================================================================

/**
 * Rotate CSRF token
 * Generates new token and invalidates old one
 */
export const rotateCSRFToken = (req: Request, res: Response): void => {
  try {
    // Generate new token
    const newToken = generateCSRFToken();

    // Set new cookie
    res.cookie(CSRF_TOKEN_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        csrfToken: newToken,
        message: 'CSRF token rotated successfully',
      },
    });
  } catch (error) {
    logger.error('CSRF token rotation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CSRF_ROTATION_ERROR',
        message: 'Failed to rotate CSRF token',
      },
    });
  }
};

/**
 * Clear CSRF token
 * Removes CSRF cookie
 */
export const clearCSRFToken = (_req: Request, res: Response): void => {
  res.clearCookie(CSRF_TOKEN_COOKIE);
  res.json({
    success: true,
    data: {
      message: 'CSRF token cleared',
    },
  });
};

// ============================================================================
// CONFIGURATION HELPERS
// ============================================================================

/**
 * Get CSRF configuration
 */
export const getCSRFConfig = () => ({
  tokenLength: CSRF_TOKEN_LENGTH,
  cookieName: CSRF_TOKEN_COOKIE,
  headerName: CSRF_TOKEN_HEADER,
  bodyField: CSRF_TOKEN_BODY,
  safeMethods: SAFE_METHODS,
});

/**
 * Verify CSRF token programmatically
 * @param cookieToken - Token from cookie
 * @param requestToken - Token from request
 * @returns Whether tokens match
 */
export const verifyCSRFToken = (cookieToken: string, requestToken: string): boolean => {
  try {
    if (!cookieToken || !requestToken) {
      return false;
    }

    const cookieHash = hashToken(cookieToken);
    const requestHash = hashToken(requestToken);

    return crypto.timingSafeEqual(Buffer.from(cookieHash), Buffer.from(requestHash));
  } catch (error) {
    logger.error('CSRF token verification error:', error);
    return false;
  }
};

// ============================================================================
// INTEGRATION WITH FORMS
// ============================================================================

/**
 * Middleware to inject CSRF token into form responses
 * Adds token to response data for frontend forms
 */
export const injectCSRFToken = (req: Request, res: Response, next: NextFunction): void => {
  const originalJson = res.json.bind(res);

  res.json = function (data: any) {
    // Add CSRF token to successful responses
    if (data && typeof data === 'object' && data.success !== false) {
      const token = req.cookies?.[CSRF_TOKEN_COOKIE];
      if (token) {
        data.csrfToken = token;
      }
    }
    return originalJson(data);
  };

  next();
};

// Export constants for use in other modules
export const CSRF_HEADER_NAME = CSRF_TOKEN_HEADER;
export const CSRF_COOKIE_NAME = CSRF_TOKEN_COOKIE;
export const CSRF_BODY_FIELD = CSRF_TOKEN_BODY;
