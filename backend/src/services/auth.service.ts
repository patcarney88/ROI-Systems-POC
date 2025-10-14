/**
 * Authentication Service
 *
 * Features:
 * - User registration with email verification
 * - Login with email/password
 * - Password reset workflow
 * - Account verification and lockout
 * - Session creation and management
 * - Integration with MFA and session services
 */

import { PrismaClient, UserStatus, MFAMethod } from '@prisma/client';
import { createLogger } from '../utils/logger';
import {
  hashPassword,
  verifyPassword,
  needsRehash,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashSensitiveData,
  isExpired,
} from '../utils/security';
import { isMFARequired } from '../utils/mfa';
import {
  createSession,
  type DeviceInfo,
  checkSuspiciousActivity,
} from './session.service';
import { sendEmail } from '../utils/email';

const logger = createLogger('auth-service');
const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 30;
const EMAIL_VERIFICATION_EXPIRY_HOURS = 24;
const PASSWORD_RESET_EXPIRY_HOURS = 1;

// ============================================================================
// TYPES
// ============================================================================

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  organizationId?: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
  deviceInfo: DeviceInfo;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    mfaMethod?: string;
  };
  tokens?: {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiry: Date;
    refreshTokenExpiry: Date;
  };
  requiresMFA?: boolean;
  mfaSessionToken?: string;
  suspicious?: boolean;
  suspiciousReasons?: string[];
}

// ============================================================================
// USER REGISTRATION
// ============================================================================

/**
 * Register new user with email verification
 * @param data - Registration data
 * @returns User and verification token
 */
export async function registerUser(data: RegisterData): Promise<{
  user: any;
  verificationToken: string;
}> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Generate email verification token
    const { token, hash, expiry } = generateEmailVerificationToken(
      EMAIL_VERIFICATION_EXPIRY_HOURS
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        organizationId: data.organizationId,
        role: (data.role as any) || 'AGENT',
        status: UserStatus.PENDING,
        emailVerificationToken: hash,
        emailVerificationExpiry: expiry,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATE',
        resource: 'user',
        resourceId: user.id,
        success: true,
        metadata: {
          email: user.email,
          role: user.role,
        },
      },
    });

    logger.info(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        status: user.status,
        emailVerified: user.emailVerified,
      },
      verificationToken: token,
    };
  } catch (error) {
    logger.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Send email verification email
 * @param email - User email
 * @param token - Verification token
 */
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  try {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    await sendEmail({
      to: email,
      subject: 'Verify your email address',
      html: `
        <h1>Welcome to ROI Systems!</h1>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}">Verify Email</a>
        <p>This link will expire in ${EMAIL_VERIFICATION_EXPIRY_HOURS} hours.</p>
        <p>If you didn't create this account, please ignore this email.</p>
      `,
    });

    logger.info(`Verification email sent to: ${email}`);
  } catch (error) {
    logger.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email');
  }
}

/**
 * Verify email address
 * @param token - Verification token
 * @returns User
 */
export async function verifyEmail(token: string): Promise<any> {
  try {
    const hashedToken = hashSensitiveData(token);

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: hashedToken,
      },
    });

    if (!user) {
      throw new Error('Invalid verification token');
    }

    // Check if token has expired
    if (
      !user.emailVerificationExpiry ||
      isExpired(user.emailVerificationExpiry)
    ) {
      throw new Error('Verification token has expired');
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiry: null,
        status: UserStatus.ACTIVE,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: updatedUser.id,
        action: 'EMAIL_VERIFY',
        resource: 'user',
        resourceId: updatedUser.id,
        success: true,
      },
    });

    logger.info(`Email verified for user: ${updatedUser.email}`);

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      emailVerified: updatedUser.emailVerified,
    };
  } catch (error) {
    logger.error('Error verifying email:', error);
    throw error;
  }
}

/**
 * Resend verification email
 * @param email - User email
 */
export async function resendVerificationEmail(email: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      logger.warn(`Verification resend attempted for non-existent email: ${email}`);
      return;
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new verification token
    const { token, hash, expiry } = generateEmailVerificationToken(
      EMAIL_VERIFICATION_EXPIRY_HOURS
    );

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: hash,
        emailVerificationExpiry: expiry,
      },
    });

    // Send email
    await sendVerificationEmail(user.email, token);

    logger.info(`Verification email resent to: ${user.email}`);
  } catch (error) {
    logger.error('Error resending verification email:', error);
    throw error;
  }
}

// ============================================================================
// USER LOGIN
// ============================================================================

/**
 * Login user with email and password
 * @param data - Login data
 * @returns Login result with tokens or MFA requirement
 */
export async function loginUser(data: LoginData): Promise<LoginResult> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        organization: true,
      },
    });

    if (!user || !user.passwordHash) {
      // Create failed login audit log (don't reveal if user exists)
      await prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          resource: 'user',
          ipAddress: data.deviceInfo.ipAddress,
          userAgent: data.deviceInfo.userAgent,
          success: false,
          errorMessage: 'Invalid credentials',
        },
      });

      throw new Error('Invalid email or password');
    }

    // Check if account is locked
    if (user.lockedUntil && !isExpired(user.lockedUntil)) {
      throw new Error(
        `Account is locked. Please try again after ${user.lockedUntil.toLocaleString()}`
      );
    }

    // Check if account is suspended
    if (user.status === UserStatus.SUSPENDED) {
      throw new Error('Account has been suspended. Please contact support.');
    }

    if (user.status === UserStatus.DELETED) {
      throw new Error('Account has been deleted.');
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      data.password,
      user.passwordHash
    );

    if (!isPasswordValid) {
      // Increment failed login attempts
      const failedAttempts = user.failedLoginAttempts + 1;
      const updateData: any = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account if max attempts exceeded
      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        const lockoutUntil = new Date(
          Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000
        );
        updateData.lockedUntil = lockoutUntil;

        logger.warn(
          `Account locked due to failed login attempts: ${user.email}`
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'LOGIN_FAILED',
          resource: 'user',
          resourceId: user.id,
          ipAddress: data.deviceInfo.ipAddress,
          userAgent: data.deviceInfo.userAgent,
          success: false,
          errorMessage: 'Invalid password',
        },
      });

      throw new Error('Invalid email or password');
    }

    // Check if password needs rehashing
    if (needsRehash(user.passwordHash)) {
      const newHash = await hashPassword(data.password);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      });
    }

    // Reset failed login attempts
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: data.deviceInfo.ipAddress,
      },
    });

    // Check for suspicious activity
    const suspiciousActivity = await checkSuspiciousActivity(
      user.id,
      data.deviceInfo
    );

    // Check if MFA is required
    const mfaRequired =
      user.mfaEnabled ||
      isMFARequired(user.role, user.organization?.type || 'INDIVIDUAL');

    if (mfaRequired) {
      // Generate MFA session token (stored in Redis via session service)
      const mfaSessionToken = await generateMFASessionToken(user.id);

      logger.info(`MFA required for user: ${user.email}`);

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          mfaEnabled: user.mfaEnabled,
          mfaMethod: user.mfaMethod || undefined,
        },
        requiresMFA: true,
        mfaSessionToken,
        suspicious: suspiciousActivity.suspicious,
        suspiciousReasons: suspiciousActivity.reasons,
      };
    }

    // Create session and generate tokens
    const { tokens, session } = await createSession(
      user.id,
      user.email,
      user.organizationId || undefined,
      user.role,
      data.deviceInfo,
      [] // Permissions will be loaded by authorization service
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        resource: 'user',
        resourceId: user.id,
        ipAddress: data.deviceInfo.ipAddress,
        userAgent: data.deviceInfo.userAgent,
        success: true,
        metadata: {
          sessionId: session.sessionId,
          suspicious: suspiciousActivity.suspicious,
          suspiciousReasons: suspiciousActivity.reasons,
        },
      },
    });

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
        mfaEnabled: user.mfaEnabled,
      },
      tokens,
      suspicious: suspiciousActivity.suspicious,
      suspiciousReasons: suspiciousActivity.reasons,
    };
  } catch (error) {
    logger.error('Error logging in user:', error);
    throw error;
  }
}

/**
 * Generate MFA session token for 2FA flow
 * @param userId - User ID
 * @returns MFA session token
 */
async function generateMFASessionToken(userId: string): Promise<string> {
  const { generateMFASessionToken } = await import('../utils/mfa');
  const token = generateMFASessionToken();

  // Store in Redis with 5-minute expiry
  const { redis } = await import('./session.service');
  await redis.setex(`mfa:${token}`, 300, userId);

  return token;
}

// ============================================================================
// PASSWORD RESET
// ============================================================================

/**
 * Request password reset
 * @param email - User email
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      logger.warn(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate password reset token
    const { token, hash, expiry } = generatePasswordResetToken(
      PASSWORD_RESET_EXPIRY_HOURS
    );

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hash,
        passwordResetExpiry: expiry,
      },
    });

    // Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: 'Reset your password',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in ${PASSWORD_RESET_EXPIRY_HOURS} hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        resource: 'user',
        resourceId: user.id,
        success: true,
      },
    });

    logger.info(`Password reset requested for: ${user.email}`);
  } catch (error) {
    logger.error('Error requesting password reset:', error);
    throw new Error('Failed to process password reset request');
  }
}

/**
 * Confirm password reset
 * @param token - Reset token
 * @param newPassword - New password
 */
export async function confirmPasswordReset(
  token: string,
  newPassword: string
): Promise<void> {
  try {
    const hashedToken = hashSensitiveData(token);

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
      },
    });

    if (!user) {
      throw new Error('Invalid password reset token');
    }

    // Check if token has expired
    if (!user.passwordResetExpiry || isExpired(user.passwordResetExpiry)) {
      throw new Error('Password reset token has expired');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGE',
        resource: 'user',
        resourceId: user.id,
        success: true,
      },
    });

    logger.info(`Password reset confirmed for user: ${user.email}`);
  } catch (error) {
    logger.error('Error confirming password reset:', error);
    throw error;
  }
}

/**
 * Change password (authenticated user)
 * @param userId - User ID
 * @param currentPassword - Current password
 * @param newPassword - New password
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update user
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGE',
        resource: 'user',
        resourceId: user.id,
        success: true,
      },
    });

    logger.info(`Password changed for user: ${user.email}`);
  } catch (error) {
    logger.error('Error changing password:', error);
    throw error;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get user by ID
 * @param userId - User ID
 * @returns User or null
 */
export async function getUserById(userId: string): Promise<any | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      mfaEnabled: user.mfaEnabled,
      mfaMethod: user.mfaMethod,
      organization: user.organization
        ? {
            id: user.organization.id,
            name: user.organization.name,
            type: user.organization.type,
          }
        : null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  } catch (error) {
    logger.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Update user profile
 * @param userId - User ID
 * @param data - Update data
 */
export async function updateUserProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }
): Promise<any> {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_UPDATE',
        resource: 'user',
        resourceId: user.id,
        success: true,
        metadata: data,
      },
    });

    logger.info(`User profile updated: ${user.email}`);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
    };
  } catch (error) {
    logger.error('Error updating user profile:', error);
    throw error;
  }
}

// Utility function for sending emails (placeholder)
async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  // This will be implemented by the email service
  // For now, just log
  logger.info(`Email would be sent to: ${options.to} with subject: ${options.subject}`);
}
