/**
 * Authentication Middleware
 * Designed by: Security Specialist + Backend Specialist
 * 
 * JWT verification, permission checking, and security controls
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection';
import { getRedisClient } from '../cache/redis';
import { logger } from '../utils/logger';
import { JWTPayload, Permission, UserRole, AuthContext } from '../types/auth';

// Extend Express Request to include auth context
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * JWT Token Verification Middleware
 * Validates access tokens and sets auth context
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
      return;
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as JWTPayload;

    // Check if token type is valid
    if (decoded.type !== 'access') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
        code: 'INVALID_TOKEN_TYPE'
      });
      return;
    }

    // Check if token is blacklisted (revoked)
    const redis = getRedisClient();
    const isBlacklisted = await redis.get(`blacklist:${decoded.jti}`);
    
    if (isBlacklisted) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token has been revoked',
        code: 'TOKEN_REVOKED'
      });
      return;
    }

    // Fetch current user data to ensure they're still active
    const userResult = await query(
      'SELECT id, email, first_name, last_name, phone_number, agency_id, role, is_active, is_verified FROM users WHERE id = $1',
      [decoded.sub]
    );

    if (userResult.rows.length === 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    const user = userResult.rows[0];

    if (!user.is_active) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User account is deactivated',
        code: 'ACCOUNT_DEACTIVATED'
      });
      return;
    }

    if (!user.is_verified) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    // Get user permissions
    const permissions = await getUserPermissions(user.id, user.role);

    // Set auth context
    req.auth = {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
        agency_id: user.agency_id,
        role: user.role,
        permissions,
        mfa_enabled: false, // Will be set by user service
        is_verified: user.is_verified,
        created_at: user.created_at
      },
      session_id: decoded.jti,
      permissions,
      is_authenticated: true
    };

    // Log successful authentication
    logger.debug('User authenticated successfully', {
      user_id: user.id,
      email: user.email,
      session_id: decoded.jti
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    logger.error('Authentication middleware error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Optional Authentication Middleware
 * Sets auth context if token is provided, but doesn't require it
 */
export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Token provided, validate it
    await authenticateToken(req, res, next);
  } else {
    // No token provided, continue without auth
    next();
  }
}

/**
 * Permission-based Authorization Middleware Factory
 * Checks if user has required permissions
 */
export function requirePermissions(...requiredPermissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !req.auth.is_authenticated) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const userPermissions = req.auth.permissions;
    const hasAllPermissions = requiredPermissions.every(
      permission => userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      logger.warn('Permission denied', {
        user_id: req.auth.user.id,
        required_permissions: requiredPermissions,
        user_permissions: userPermissions
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        required_permissions: requiredPermissions
      });
      return;
    }

    next();
  };
}

/**
 * Role-based Authorization Middleware Factory
 * Checks if user has required role or higher
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth || !req.auth.is_authenticated) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
      return;
    }

    const userRole = req.auth.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      logger.warn('Role access denied', {
        user_id: req.auth.user.id,
        user_role: userRole,
        allowed_roles: allowedRoles
      });

      res.status(403).json({
        error: 'Forbidden',
        message: 'Role not authorized',
        code: 'ROLE_NOT_AUTHORIZED',
        required_roles: allowedRoles
      });
      return;
    }

    next();
  };
}

/**
 * Agency-based Authorization Middleware
 * Ensures user can only access resources from their agency
 */
export function requireSameAgency(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.auth || !req.auth.is_authenticated) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
    return;
  }

  const userAgencyId = req.auth.user.agency_id;
  const requestedAgencyId = req.params.agency_id || req.body.agency_id;

  // Super admins can access any agency
  if (req.auth.user.role === UserRole.SUPER_ADMIN) {
    next();
    return;
  }

  if (!userAgencyId || userAgencyId !== requestedAgencyId) {
    logger.warn('Agency access denied', {
      user_id: req.auth.user.id,
      user_agency_id: userAgencyId,
      requested_agency_id: requestedAgencyId
    });

    res.status(403).json({
      error: 'Forbidden',
      message: 'Cannot access resources from different agency',
      code: 'AGENCY_ACCESS_DENIED'
    });
    return;
  }

  next();
}

/**
 * Get user permissions based on role and custom permissions
 */
async function getUserPermissions(userId: string, role: UserRole): Promise<Permission[]> {
  // Base permissions by role
  const rolePermissions: Record<UserRole, Permission[]> = {
    [UserRole.SUPER_ADMIN]: Object.values(Permission),
    [UserRole.AGENCY_OWNER]: [
      Permission.AGENCY_ADMIN,
      Permission.USER_MANAGE,
      Permission.DOCUMENT_ADMIN,
      Permission.CAMPAIGN_ADMIN,
      Permission.ANALYTICS_ADMIN,
      Permission.BILLING_MANAGE,
      Permission.SETTINGS_ADMIN
    ],
    [UserRole.AGENCY_ADMIN]: [
      Permission.USER_MANAGE,
      Permission.DOCUMENT_ADMIN,
      Permission.CAMPAIGN_MANAGE,
      Permission.ANALYTICS_VIEW,
      Permission.ANALYTICS_EXPORT
    ],
    [UserRole.AGENT]: [
      Permission.DOCUMENT_CREATE,
      Permission.DOCUMENT_VIEW,
      Permission.DOCUMENT_SHARE,
      Permission.CAMPAIGN_CREATE,
      Permission.CAMPAIGN_VIEW,
      Permission.ANALYTICS_VIEW
    ],
    [UserRole.ASSISTANT]: [
      Permission.DOCUMENT_VIEW,
      Permission.CAMPAIGN_VIEW,
      Permission.ANALYTICS_VIEW
    ],
    [UserRole.VIEWER]: [
      Permission.DOCUMENT_VIEW,
      Permission.ANALYTICS_VIEW
    ]
  };

  let permissions = rolePermissions[role] || [];

  // TODO: Fetch custom permissions from database if needed
  // const customPermissions = await query(
  //   'SELECT permission FROM user_permissions WHERE user_id = $1',
  //   [userId]
  // );

  return permissions;
}