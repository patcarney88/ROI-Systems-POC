/**
 * Audit Logging Middleware
 *
 * Features:
 * - Comprehensive audit trail for security events
 * - Authentication and authorization logging
 * - Sensitive operation tracking
 * - Request metadata capture
 * - Async logging (non-blocking)
 * - Integration with Prisma AuditLog model
 */

import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('audit-middleware');
const prisma = new PrismaClient();

// ============================================================================
// TYPES
// ============================================================================

export interface AuditLogData {
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  metadata?: Record<string, any>;
  errorMessage?: string;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'REGISTER'
  | 'PASSWORD_CHANGE'
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFY'
  | 'MFA_ENABLE'
  | 'MFA_DISABLE'
  | 'MFA_VERIFY'
  | 'PERMISSION_CHECK'
  | 'ROLE_CHANGE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'USER_DELETE'
  | 'SESSION_CREATE'
  | 'SESSION_REVOKE'
  | 'TOKEN_REFRESH'
  | 'OAUTH_LOGIN'
  | 'SUSPICIOUS_ACTIVITY';

// ============================================================================
// CORE AUDIT LOGGING
// ============================================================================

/**
 * Create audit log entry
 * @param data - Audit log data
 */
export async function createAuditLog(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        success: data.success,
        metadata: data.metadata || {},
        errorMessage: data.errorMessage,
      },
    });

    logger.info('Audit log created', {
      action: data.action,
      userId: data.userId,
      success: data.success,
    });
  } catch (error) {
    // Don't throw errors for audit logging failures
    logger.error('Failed to create audit log:', error);
  }
}

/**
 * Async wrapper for audit logging
 * Ensures audit logging doesn't block request processing
 */
async function logAuditAsync(data: AuditLogData): Promise<void> {
  setImmediate(async () => {
    try {
      await createAuditLog(data);
    } catch (error) {
      logger.error('Async audit log error:', error);
    }
  });
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * General audit logging middleware
 * Logs all requests with user context
 */
export const auditLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Capture original end function
  const originalEnd = res.end;

  // Override end to log after response
  res.end = function (chunk?: any, encoding?: any, callback?: any): Response {
    res.end = originalEnd;
    const result = res.end(chunk, encoding, callback);

    // Log audit after response is sent
    const duration = Date.now() - startTime;

    logAuditAsync({
      userId: req.user?.userId,
      action: `${req.method}_${req.path.split('/')[3] || 'UNKNOWN'}`,
      resource: 'api',
      resourceId: req.params.id,
      ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
      userAgent: req.headers['user-agent'] || 'unknown',
      success: res.statusCode < 400,
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      },
    });

    return result;
  };

  next();
};

/**
 * Authentication event logger
 * Logs login, logout, registration events
 */
export const logAuthEvent = (action: AuditAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const startTime = Date.now();

    // Capture original json function
    const originalJson = res.json.bind(res);

    res.json = function (data: any): Response {
      const duration = Date.now() - startTime;
      const success = data && data.success !== false && res.statusCode < 400;

      // Log authentication event
      logAuditAsync({
        userId: req.user?.userId || data?.data?.user?.id,
        action,
        resource: 'auth',
        resourceId: req.user?.userId,
        ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
        userAgent: req.headers['user-agent'] || 'unknown',
        success,
        metadata: {
          email: req.body?.email || req.user?.email,
          duration,
          statusCode: res.statusCode,
        },
        errorMessage: success ? undefined : data?.error?.message,
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Permission check logger
 * Logs all permission verification attempts
 */
export const logPermissionCheck = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const requiredPermission = `${resource}:${action}`;
    const hasPermission = req.user?.permissions?.includes(requiredPermission) ||
                         req.user?.permissions?.includes(`${resource}:*`) ||
                         req.user?.permissions?.includes('*:*');

    // Log permission check
    logAuditAsync({
      userId: req.user?.userId,
      action: 'PERMISSION_CHECK',
      resource,
      resourceId: req.params.id,
      ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
      userAgent: req.headers['user-agent'] || 'unknown',
      success: hasPermission || false,
      metadata: {
        requiredPermission,
        userPermissions: req.user?.permissions || [],
        path: req.path,
        method: req.method,
      },
    });

    next();
  };
};

/**
 * Sensitive operation logger
 * Logs operations that modify sensitive data
 */
export const logSensitiveOperation = (operation: string, resourceType: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Capture original json function
    const originalJson = res.json.bind(res);

    res.json = function (data: any): Response {
      const success = data && data.success !== false && res.statusCode < 400;

      // Log sensitive operation
      logAuditAsync({
        userId: req.user?.userId,
        action: operation,
        resource: resourceType,
        resourceId: req.params.id || data?.data?.id,
        ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
        userAgent: req.headers['user-agent'] || 'unknown',
        success,
        metadata: {
          operation,
          path: req.path,
          method: req.method,
          changes: sanitizeData(req.body),
        },
        errorMessage: success ? undefined : data?.error?.message,
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * MFA event logger
 * Logs MFA setup, verification, and disable events
 */
export const logMFAEvent = (action: AuditAction) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const originalJson = res.json.bind(res);

    res.json = function (data: any): Response {
      const success = data && data.success !== false && res.statusCode < 400;

      logAuditAsync({
        userId: req.user?.userId,
        action,
        resource: 'mfa',
        resourceId: req.user?.userId,
        ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
        userAgent: req.headers['user-agent'] || 'unknown',
        success,
        metadata: {
          method: req.body?.method || 'TOTP',
          statusCode: res.statusCode,
        },
        errorMessage: success ? undefined : data?.error?.message,
      });

      return originalJson(data);
    };

    next();
  };
};

/**
 * Suspicious activity logger
 * Logs detected suspicious activities
 */
export async function logSuspiciousActivity(
  req: Request,
  userId: string | undefined,
  reasons: string[]
): Promise<void> {
  await createAuditLog({
    userId,
    action: 'SUSPICIOUS_ACTIVITY',
    resource: 'security',
    ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
    userAgent: req.headers['user-agent'] || 'unknown',
    success: false,
    metadata: {
      reasons,
      path: req.path,
      method: req.method,
    },
  });
}

/**
 * Failed login attempt logger
 * Tracks failed authentication attempts for security monitoring
 */
export async function logFailedLogin(
  req: Request,
  email: string,
  reason: string
): Promise<void> {
  await createAuditLog({
    userId: undefined,
    action: 'LOGIN',
    resource: 'auth',
    ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
    userAgent: req.headers['user-agent'] || 'unknown',
    success: false,
    metadata: {
      email,
      reason,
    },
    errorMessage: reason,
  });
}

// ============================================================================
// QUERY AND ANALYSIS
// ============================================================================

/**
 * Get audit logs for user
 * @param userId - User ID
 * @param limit - Maximum number of logs
 * @returns Audit log entries
 */
export async function getUserAuditLogs(userId: string, limit: number = 50) {
  try {
    return await prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    logger.error('Error fetching user audit logs:', error);
    return [];
  }
}

/**
 * Get failed login attempts for IP
 * @param ipAddress - IP address
 * @param windowMinutes - Time window in minutes
 * @returns Count of failed attempts
 */
export async function getFailedLoginAttempts(
  ipAddress: string,
  windowMinutes: number = 15
): Promise<number> {
  try {
    const since = new Date(Date.now() - windowMinutes * 60 * 1000);

    const count = await prisma.auditLog.count({
      where: {
        action: 'LOGIN',
        ipAddress,
        success: false,
        createdAt: { gte: since },
      },
    });

    return count;
  } catch (error) {
    logger.error('Error getting failed login attempts:', error);
    return 0;
  }
}

/**
 * Get suspicious activities
 * @param limit - Maximum number of entries
 * @returns Suspicious activity logs
 */
export async function getSuspiciousActivities(limit: number = 100) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        action: 'SUSPICIOUS_ACTIVITY',
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching suspicious activities:', error);
    return [];
  }
}

/**
 * Get recent security events
 * @param hours - Time window in hours
 * @returns Security event logs
 */
export async function getSecurityEvents(hours: number = 24) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    return await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        action: {
          in: [
            'LOGIN',
            'LOGOUT',
            'PASSWORD_CHANGE',
            'MFA_ENABLE',
            'MFA_DISABLE',
            'SUSPICIOUS_ACTIVITY',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching security events:', error);
    return [];
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Sanitize data for audit logging
 * Removes sensitive fields like passwords
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'newPassword',
    'currentPassword',
    'token',
    'secret',
    'refreshToken',
    'accessToken',
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Clean up old audit logs
 * Should be run periodically (e.g., via cron job)
 * @param daysToKeep - Number of days to retain logs
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    logger.info(`Cleaned up ${result.count} old audit logs`);
    return result.count;
  } catch (error) {
    logger.error('Error cleaning up audit logs:', error);
    return 0;
  }
}

// Export for use in other modules
export { AuditAction };
