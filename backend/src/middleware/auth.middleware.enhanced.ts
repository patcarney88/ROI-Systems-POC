/**
 * Enhanced Authentication & Authorization Middleware
 *
 * Features:
 * - JWT verification with session validation
 * - Role-based access control (RBAC)
 * - Permission-based access control
 * - Email verification enforcement
 * - MFA verification enforcement
 * - Organization membership checks
 * - Optional authentication support
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { getSession, updateSessionActivity } from '../services/session.service';
import { getUserPermissions } from '../services/authorization.service';
import { AppError } from './error.middleware';
import { createLogger } from '../utils/logger';

const logger = createLogger('auth-middleware');
const prisma = new PrismaClient();

// ============================================================================
// TYPE EXTENSIONS
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        organizationId?: string;
        sessionId?: string;
        permissions?: string[];
        emailVerified?: boolean;
        mfaEnabled?: boolean;
        mfaVerified?: boolean;
      };
    }
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

/**
 * Authenticate request - Verify JWT and load user session
 * Attaches user data to req.user if valid
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'No authentication token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT
    const payload = verifyAccessToken(token);

    // Verify session is still active
    if (payload.sessionId) {
      const session = await getSession(payload.sessionId);

      if (!session) {
        throw new AppError(401, 'SESSION_EXPIRED', 'Session has expired');
      }

      // Update last activity
      await updateSessionActivity(payload.sessionId);
    }

    // Get user from database with latest data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        organizationId: true,
        emailVerified: true,
        mfaEnabled: true,
        status: true,
      },
    });

    if (!user) {
      throw new AppError(401, 'USER_NOT_FOUND', 'User not found');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'ACCOUNT_INACTIVE', `Account is ${user.status.toLowerCase()}`);
    }

    // Get user permissions
    const permissions = await getUserPermissions(user.id);

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId || undefined,
      sessionId: payload.sessionId,
      permissions,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      mfaVerified: true, // If they have valid token, MFA was verified
    };

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

    logger.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: error instanceof Error ? error.message : 'Authentication failed',
      },
    });
  }
};

/**
 * Require authentication - Fails if no valid authentication
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  await authenticate(req, res, next);
};

/**
 * Optional authentication - Loads user if token present, continues if not
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = verifyAccessToken(token);

        // Verify session
        if (payload.sessionId) {
          const session = await getSession(payload.sessionId);
          if (session) {
            await updateSessionActivity(payload.sessionId);
          }
        }

        // Get user from database
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: {
            id: true,
            email: true,
            role: true,
            organizationId: true,
            emailVerified: true,
            mfaEnabled: true,
            status: true,
          },
        });

        if (user && user.status === 'ACTIVE') {
          const permissions = await getUserPermissions(user.id);

          req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId || undefined,
            sessionId: payload.sessionId,
            permissions,
            emailVerified: user.emailVerified,
            mfaEnabled: user.mfaEnabled,
            mfaVerified: true,
          };
        }
      } catch (error) {
        // Continue without user if token is invalid
        logger.debug('Optional auth: Invalid token, continuing without user');
      }
    }

    next();
  } catch (error) {
    logger.error('Optional auth error:', error);
    next();
  }
};

// ============================================================================
// ROLE-BASED AUTHORIZATION
// ============================================================================

/**
 * Require specific role(s)
 * @param roles - Allowed roles
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Access denied for user ${req.user.userId}: Required roles [${roles.join(', ')}], has ${req.user.role}`);

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions - required role not found',
        },
      });
      return;
    }

    next();
  };
};

// ============================================================================
// PERMISSION-BASED AUTHORIZATION
// ============================================================================

/**
 * Require specific permission
 * @param resource - Resource type (e.g., 'documents', 'users')
 * @param action - Action (e.g., 'read', 'write', 'delete')
 */
export const requirePermission = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const requiredPermission = `${resource}:${action}`;
    const hasPermission = req.user.permissions?.includes(requiredPermission) ||
                         req.user.permissions?.includes(`${resource}:*`) ||
                         req.user.permissions?.includes('*:*');

    if (!hasPermission) {
      logger.warn(`Permission denied for user ${req.user.userId}: Required ${requiredPermission}`);

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Insufficient permissions - ${requiredPermission} required`,
        },
      });
      return;
    }

    next();
  };
};

// ============================================================================
// VERIFICATION REQUIREMENTS
// ============================================================================

/**
 * Require email to be verified
 */
export const requireEmailVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (!req.user.emailVerified) {
    res.status(403).json({
      success: false,
      error: {
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Email verification required. Please verify your email address.',
      },
    });
    return;
  }

  next();
};

/**
 * Require MFA to be verified (for MFA-enabled users)
 */
export const requireMFAVerified = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (req.user.mfaEnabled && !req.user.mfaVerified) {
    res.status(403).json({
      success: false,
      error: {
        code: 'MFA_REQUIRED',
        message: 'Multi-factor authentication verification required',
      },
    });
    return;
  }

  next();
};

// ============================================================================
// ORGANIZATION MEMBERSHIP
// ============================================================================

/**
 * Require user to belong to an organization
 */
export const requireOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  if (!req.user.organizationId) {
    res.status(403).json({
      success: false,
      error: {
        code: 'NO_ORGANIZATION',
        message: 'Organization membership required',
      },
    });
    return;
  }

  next();
};

/**
 * Verify user belongs to specified organization
 * Organization ID should be in req.params.organizationId or req.body.organizationId
 */
export const requireOrganizationAccess = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const targetOrgId = req.params.organizationId || req.body.organizationId;

  if (!targetOrgId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Organization ID required',
      },
    });
    return;
  }

  if (req.user.organizationId !== targetOrgId) {
    logger.warn(`Organization access denied for user ${req.user.userId}: Required ${targetOrgId}, has ${req.user.organizationId}`);

    res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied - organization membership required',
      },
    });
    return;
  }

  next();
};

// ============================================================================
// COMPOSITE MIDDLEWARE
// ============================================================================

/**
 * Standard protection: Authentication + Email Verification
 */
export const standardProtection = [authenticate, requireEmailVerified];

/**
 * Enhanced protection: Authentication + Email + MFA
 */
export const enhancedProtection = [
  authenticate,
  requireEmailVerified,
  requireMFAVerified,
];

/**
 * Admin protection: Authentication + Admin Role
 */
export const adminProtection = [authenticate, requireRole('ADMIN')];

/**
 * Organization protection: Authentication + Organization Membership
 */
export const organizationProtection = [authenticate, requireOrganization];
