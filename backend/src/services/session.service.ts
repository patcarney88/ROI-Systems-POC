/**
 * Session Management Service
 *
 * Features:
 * - Redis-based session storage
 * - Refresh token rotation
 * - Session tracking and management
 * - Device fingerprinting
 * - Suspicious activity detection
 */

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import {
  generateTokenPair,
  verifyToken,
  isExpired,
  type TokenPair,
  type DecodedToken,
} from '../utils/security';

const logger = createLogger('session-service');
const prisma = new PrismaClient();

// ============================================================================
// REDIS CLIENT
// ============================================================================

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('error', (error) => {
  logger.error('Redis connection error:', error);
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

// ============================================================================
// TYPES
// ============================================================================

export interface SessionData {
  sessionId: string;
  userId: string;
  email: string;
  organizationId?: string;
  role: string;
  ipAddress: string;
  userAgent: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  createdAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}

export interface RefreshTokenData {
  tokenId: string;
  userId: string;
  family: string;
  previousTokenId?: string;
  ipAddress: string;
  userAgent: string;
  revoked: boolean;
  expiresAt: Date;
  createdAt: Date;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Create new session with token pair
 * @param userId - User ID
 * @param email - User email
 * @param organizationId - Organization ID (optional)
 * @param role - User role
 * @param deviceInfo - Device information
 * @param permissions - User permissions
 * @returns Token pair and session data
 */
export async function createSession(
  userId: string,
  email: string,
  organizationId: string | undefined,
  role: string,
  deviceInfo: DeviceInfo,
  permissions?: string[]
): Promise<{ tokens: TokenPair; session: SessionData }> {
  try {
    const sessionId = uuidv4();
    const tokenFamily = uuidv4();

    // Generate token pair
    const tokens = generateTokenPair({
      userId,
      email,
      organizationId,
      role,
      permissions,
      sessionId,
    });

    // Create session data
    const session: SessionData = {
      sessionId,
      userId,
      email,
      organizationId,
      role,
      ...deviceInfo,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: tokens.refreshTokenExpiry,
    };

    // Store session in Redis
    const sessionKey = `session:${sessionId}`;
    await redis.setex(
      sessionKey,
      getSecondsUntil(tokens.refreshTokenExpiry),
      JSON.stringify(session)
    );

    // Store refresh token metadata in database
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId,
        family: tokenFamily,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt: tokens.refreshTokenExpiry,
      },
    });

    // Store active session in database
    await prisma.session.create({
      data: {
        token: sessionId,
        userId,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        location: deviceInfo.location,
        expiresAt: tokens.refreshTokenExpiry,
      },
    });

    // Track user session index
    await redis.sadd(`user:${userId}:sessions`, sessionId);

    logger.info(`Session created for user: ${userId}`);

    return { tokens, session };
  } catch (error) {
    logger.error('Error creating session:', error);
    throw new Error('Failed to create session');
  }
}

/**
 * Get session by ID
 * @param sessionId - Session ID
 * @returns Session data or null
 */
export async function getSession(
  sessionId: string
): Promise<SessionData | null> {
  try {
    const sessionKey = `session:${sessionId}`;
    const data = await redis.get(sessionKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    logger.error('Error getting session:', error);
    return null;
  }
}

/**
 * Update session last activity
 * @param sessionId - Session ID
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return;
    }

    session.lastActivityAt = new Date();

    const sessionKey = `session:${sessionId}`;
    const ttl = await redis.ttl(sessionKey);

    if (ttl > 0) {
      await redis.setex(sessionKey, ttl, JSON.stringify(session));
    }
  } catch (error) {
    logger.error('Error updating session activity:', error);
  }
}

/**
 * Revoke session
 * @param sessionId - Session ID
 */
export async function revokeSession(sessionId: string): Promise<void> {
  try {
    const session = await getSession(sessionId);
    if (!session) {
      return;
    }

    // Remove from Redis
    await redis.del(`session:${sessionId}`);

    // Remove from user's session set
    await redis.srem(`user:${session.userId}:sessions`, sessionId);

    // Mark as revoked in database
    await prisma.session.updateMany({
      where: { token: sessionId },
      data: { expiresAt: new Date() }, // Force expiry
    });

    logger.info(`Session revoked: ${sessionId}`);
  } catch (error) {
    logger.error('Error revoking session:', error);
    throw new Error('Failed to revoke session');
  }
}

/**
 * Get all active sessions for user
 * @param userId - User ID
 * @returns Array of sessions
 */
export async function getUserSessions(userId: string): Promise<SessionData[]> {
  try {
    const sessionIds = await redis.smembers(`user:${userId}:sessions`);
    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const session = await getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions;
  } catch (error) {
    logger.error('Error getting user sessions:', error);
    return [];
  }
}

/**
 * Revoke all sessions for user (logout from all devices)
 * @param userId - User ID
 * @param exceptSessionId - Session ID to keep active (optional)
 */
export async function revokeAllUserSessions(
  userId: string,
  exceptSessionId?: string
): Promise<number> {
  try {
    const sessionIds = await redis.smembers(`user:${userId}:sessions`);
    let revokedCount = 0;

    for (const sessionId of sessionIds) {
      if (sessionId !== exceptSessionId) {
        await revokeSession(sessionId);
        revokedCount++;
      }
    }

    logger.info(`Revoked ${revokedCount} sessions for user: ${userId}`);
    return revokedCount;
  } catch (error) {
    logger.error('Error revoking all user sessions:', error);
    throw new Error('Failed to revoke user sessions');
  }
}

// ============================================================================
// REFRESH TOKEN ROTATION
// ============================================================================

/**
 * Rotate refresh token
 * @param refreshToken - Current refresh token
 * @param deviceInfo - Device information
 * @returns New token pair
 */
export async function rotateRefreshToken(
  refreshToken: string,
  deviceInfo: DeviceInfo
): Promise<TokenPair> {
  try {
    // Verify refresh token
    const decoded = verifyToken(refreshToken, 'refresh');

    // Get token from database
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new Error('Refresh token not found');
    }

    // Check if token is revoked
    if (tokenRecord.revoked) {
      // Token reuse detected - revoke entire token family
      await revokeTokenFamily(tokenRecord.family, 'Token reuse detected');
      throw new Error('Token reuse detected - all tokens revoked');
    }

    // Check if token has expired
    if (isExpired(tokenRecord.expiresAt)) {
      throw new Error('Refresh token has expired');
    }

    // Revoke current token
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: 'Rotated',
      },
    });

    // Generate new token pair
    const tokens = generateTokenPair({
      userId: decoded.userId,
      email: decoded.email,
      organizationId: decoded.organizationId,
      role: decoded.role,
      permissions: decoded.permissions,
      sessionId: decoded.sessionId,
    });

    // Store new refresh token
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: tokenRecord.userId,
        family: tokenRecord.family,
        previousTokenId: tokenRecord.id,
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt: tokens.refreshTokenExpiry,
      },
    });

    // Update session expiry
    if (decoded.sessionId) {
      const session = await getSession(decoded.sessionId);
      if (session) {
        session.expiresAt = tokens.refreshTokenExpiry;
        await redis.setex(
          `session:${decoded.sessionId}`,
          getSecondsUntil(tokens.refreshTokenExpiry),
          JSON.stringify(session)
        );
      }
    }

    logger.info(`Refresh token rotated for user: ${decoded.userId}`);

    return tokens;
  } catch (error) {
    logger.error('Error rotating refresh token:', error);
    throw error;
  }
}

/**
 * Revoke token family (all related tokens)
 * @param family - Token family ID
 * @param reason - Revocation reason
 */
export async function revokeTokenFamily(
  family: string,
  reason: string
): Promise<void> {
  try {
    await prisma.refreshToken.updateMany({
      where: {
        family,
        revoked: false,
      },
      data: {
        revoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    logger.warn(`Token family revoked: ${family} - Reason: ${reason}`);
  } catch (error) {
    logger.error('Error revoking token family:', error);
    throw new Error('Failed to revoke token family');
  }
}

// ============================================================================
// SUSPICIOUS ACTIVITY DETECTION
// ============================================================================

/**
 * Check for suspicious login activity
 * @param userId - User ID
 * @param deviceInfo - Current device info
 * @returns Suspicious status
 */
export async function checkSuspiciousActivity(
  userId: string,
  deviceInfo: DeviceInfo
): Promise<{ suspicious: boolean; reasons: string[] }> {
  const reasons: string[] = [];

  try {
    // Get recent sessions
    const recentSessions = await prisma.session.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentSessions.length === 0) {
      return { suspicious: false, reasons };
    }

    // Check for location change
    const lastSession = recentSessions[0];
    if (
      lastSession.location &&
      deviceInfo.location &&
      lastSession.location !== deviceInfo.location
    ) {
      reasons.push('Location change detected');
    }

    // Check for unusual device
    const knownDevices = new Set(
      recentSessions.map((s) => s.device).filter(Boolean)
    );
    if (deviceInfo.device && !knownDevices.has(deviceInfo.device)) {
      reasons.push('Unknown device');
    }

    // Check for rapid login attempts
    const loginsLast10Min = recentSessions.filter(
      (s) =>
        s.createdAt.getTime() > Date.now() - 10 * 60 * 1000
    ).length;

    if (loginsLast10Min > 3) {
      reasons.push('Rapid login attempts');
    }

    return {
      suspicious: reasons.length > 0,
      reasons,
    };
  } catch (error) {
    logger.error('Error checking suspicious activity:', error);
    return { suspicious: false, reasons: [] };
  }
}

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

/**
 * Clean up expired sessions and tokens
 */
export async function cleanupExpired(): Promise<void> {
  try {
    const now = new Date();

    // Clean up expired refresh tokens
    const expiredTokens = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    });

    // Clean up expired sessions
    const expiredSessions = await prisma.session.deleteMany({
      where: {
        expiresAt: { lte: now },
      },
    });

    logger.info(
      `Cleaned up ${expiredTokens.count} tokens and ${expiredSessions.count} sessions`
    );
  } catch (error) {
    logger.error('Error cleaning up expired data:', error);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate seconds until date
 * @param date - Target date
 * @returns Seconds until date
 */
function getSecondsUntil(date: Date): number {
  return Math.max(0, Math.floor((date.getTime() - Date.now()) / 1000));
}

/**
 * Parse user agent for device info
 * @param userAgent - User agent string
 * @returns Parsed device info
 */
export function parseUserAgent(userAgent: string): {
  device?: string;
  browser?: string;
  os?: string;
} {
  // Basic user agent parsing (use a library like ua-parser-js for production)
  const result: { device?: string; browser?: string; os?: string } = {};

  // Detect device
  if (/Mobile|Android|iPhone|iPad/i.test(userAgent)) {
    result.device = 'Mobile';
  } else if (/Tablet/i.test(userAgent)) {
    result.device = 'Tablet';
  } else {
    result.device = 'Desktop';
  }

  // Detect browser
  if (/Chrome/i.test(userAgent)) {
    result.browser = 'Chrome';
  } else if (/Firefox/i.test(userAgent)) {
    result.browser = 'Firefox';
  } else if (/Safari/i.test(userAgent)) {
    result.browser = 'Safari';
  } else if (/Edge/i.test(userAgent)) {
    result.browser = 'Edge';
  }

  // Detect OS
  if (/Windows/i.test(userAgent)) {
    result.os = 'Windows';
  } else if (/Mac/i.test(userAgent)) {
    result.os = 'macOS';
  } else if (/Linux/i.test(userAgent)) {
    result.os = 'Linux';
  } else if (/Android/i.test(userAgent)) {
    result.os = 'Android';
  } else if (/iOS|iPhone|iPad/i.test(userAgent)) {
    result.os = 'iOS';
  }

  return result;
}

// Export Redis client for other services
export { redis };
