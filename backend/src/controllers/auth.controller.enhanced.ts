/**
 * Enhanced Authentication Controller
 *
 * Endpoints:
 * - POST /register - User registration
 * - POST /login - Email/password login
 * - POST /logout - Single device logout
 * - POST /logout/all - All devices logout
 * - POST /refresh - Token refresh
 * - POST /verify-email - Email verification
 * - POST /resend-verification - Resend verification email
 * - POST /password/reset - Request password reset
 * - POST /password/reset/confirm - Confirm password reset
 * - POST /password/change - Change password (authenticated)
 * - GET /me - Get current user profile
 * - PUT /me - Update user profile
 */

import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import {
  registerUser,
  sendVerificationEmail,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  requestPasswordReset,
  confirmPasswordReset,
  changePassword,
  getUserById,
  updateUserProfile,
} from '../services/auth.service';
import {
  revokeSession,
  revokeAllUserSessions,
  rotateRefreshToken,
  parseUserAgent,
} from '../services/session.service';
import { getUserPermissions } from '../services/authorization.service';

const logger = createLogger('auth-controller');

// ============================================================================
// VALIDATION RULES
// ============================================================================

export const registerValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('phone').optional().isMobilePhone('any'),
];

export const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
];

// ============================================================================
// REGISTRATION & VERIFICATION
// ============================================================================

/**
 * Register new user
 * POST /register
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      errors: errors.array(),
    });
  }

  const { email, password, firstName, lastName, phone, organizationId } = req.body;

  try {
    // Register user
    const { user, verificationToken } = await registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      organizationId,
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    logger.info(`User registered successfully: ${email}`);

    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'Registration successful. Please check your email to verify your account.',
      },
    });
  } catch (error: any) {
    logger.error('Registration error:', error);

    if (error.message.includes('already exists')) {
      throw new AppError(409, 'USER_EXISTS', error.message);
    }

    throw new AppError(500, 'REGISTRATION_FAILED', 'Failed to register user');
  }
});

/**
 * Verify email address
 * POST /verify-email
 */
export const verifyEmailAddress = asyncHandler(
  async (req: Request, res: Response) => {
    const { token } = req.body;

    if (!token) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Verification token is required');
    }

    try {
      const user = await verifyEmail(token);

      res.json({
        success: true,
        data: {
          user,
          message: 'Email verified successfully. You can now log in.',
        },
      });
    } catch (error: any) {
      logger.error('Email verification error:', error);

      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        throw new AppError(400, 'INVALID_TOKEN', error.message);
      }

      throw new AppError(500, 'VERIFICATION_FAILED', 'Failed to verify email');
    }
  }
);

/**
 * Resend verification email
 * POST /resend-verification
 */
export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Email is required');
    }

    try {
      await resendVerificationEmail(email);

      res.json({
        success: true,
        data: {
          message: 'Verification email sent. Please check your inbox.',
        },
      });
    } catch (error: any) {
      logger.error('Resend verification error:', error);

      if (error.message.includes('already verified')) {
        throw new AppError(400, 'ALREADY_VERIFIED', error.message);
      }

      // Don't reveal if user exists
      res.json({
        success: true,
        data: {
          message: 'If the email exists, a verification email has been sent.',
        },
      });
    }
  }
);

// ============================================================================
// LOGIN & LOGOUT
// ============================================================================

/**
 * Login user with email/password
 * POST /login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
      errors: errors.array(),
    });
  }

  const { email, password } = req.body;

  // Get device info
  const deviceInfo = {
    ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
    userAgent: req.headers['user-agent'] || 'unknown',
    ...parseUserAgent(req.headers['user-agent'] || ''),
  };

  try {
    const result = await loginUser({ email, password, deviceInfo });

    // If MFA is required
    if (result.requiresMFA) {
      return res.json({
        success: true,
        data: {
          user: result.user,
          requiresMFA: true,
          mfaSessionToken: result.mfaSessionToken,
          mfaMethod: result.user.mfaMethod,
          suspicious: result.suspicious,
          suspiciousReasons: result.suspiciousReasons,
        },
      });
    }

    // Get user permissions
    const permissions = await getUserPermissions(result.user.id);

    logger.info(`User logged in successfully: ${email}`);

    res.json({
      success: true,
      data: {
        user: {
          ...result.user,
          permissions,
        },
        tokens: result.tokens,
        suspicious: result.suspicious,
        suspiciousReasons: result.suspiciousReasons,
      },
    });
  } catch (error: any) {
    logger.error('Login error:', error);

    if (
      error.message.includes('Invalid') ||
      error.message.includes('locked') ||
      error.message.includes('suspended')
    ) {
      throw new AppError(401, 'AUTHENTICATION_FAILED', error.message);
    }

    throw new AppError(500, 'LOGIN_FAILED', 'Login failed');
  }
});

/**
 * Logout current session
 * POST /logout
 */
export const logout = asyncHandler(async (req: Request, res: Response) => {
  const sessionId = req.user?.sessionId;

  if (!sessionId) {
    throw new AppError(401, 'UNAUTHORIZED', 'No active session');
  }

  try {
    await revokeSession(sessionId);

    logger.info(`User logged out: ${req.user?.email}`);

    res.json({
      success: true,
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    logger.error('Logout error:', error);
    throw new AppError(500, 'LOGOUT_FAILED', 'Failed to logout');
  }
});

/**
 * Logout from all devices
 * POST /logout/all
 */
export const logoutAll = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const currentSessionId = req.user?.sessionId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  try {
    const revokedCount = await revokeAllUserSessions(userId, currentSessionId);

    logger.info(`User logged out from all devices: ${req.user?.email}`);

    res.json({
      success: true,
      data: {
        message: `Logged out from ${revokedCount} device(s)`,
        revokedSessions: revokedCount,
      },
    });
  } catch (error) {
    logger.error('Logout all error:', error);
    throw new AppError(500, 'LOGOUT_FAILED', 'Failed to logout from all devices');
  }
});

/**
 * Refresh access token
 * POST /refresh
 */
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Refresh token is required');
  }

  // Get device info
  const deviceInfo = {
    ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
    userAgent: req.headers['user-agent'] || 'unknown',
  };

  try {
    const tokens = await rotateRefreshToken(refreshToken, deviceInfo);

    res.json({
      success: true,
      data: { tokens },
    });
  } catch (error: any) {
    logger.error('Token refresh error:', error);

    if (error.message.includes('reuse detected')) {
      throw new AppError(401, 'TOKEN_REUSE_DETECTED', error.message);
    }

    if (
      error.message.includes('not found') ||
      error.message.includes('expired') ||
      error.message.includes('revoked')
    ) {
      throw new AppError(401, 'INVALID_TOKEN', error.message);
    }

    throw new AppError(500, 'REFRESH_FAILED', 'Failed to refresh token');
  }
});

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Request password reset
 * POST /password/reset
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Email is required');
  }

  try {
    await requestPasswordReset(email);

    // Don't reveal if user exists
    res.json({
      success: true,
      data: {
        message: 'If the email exists, a password reset link has been sent.',
      },
    });
  } catch (error) {
    logger.error('Password reset request error:', error);

    // Don't reveal errors
    res.json({
      success: true,
      data: {
        message: 'If the email exists, a password reset link has been sent.',
      },
    });
  }
});

/**
 * Confirm password reset
 * POST /password/reset/confirm
 */
export const resetPasswordConfirm = asyncHandler(
  async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Token and new password are required');
    }

    // Validate password strength
    if (newPassword.length < 8) {
      throw new AppError(
        400,
        'WEAK_PASSWORD',
        'Password must be at least 8 characters'
      );
    }

    try {
      await confirmPasswordReset(token, newPassword);

      res.json({
        success: true,
        data: {
          message: 'Password reset successful. You can now log in with your new password.',
        },
      });
    } catch (error: any) {
      logger.error('Password reset confirm error:', error);

      if (error.message.includes('Invalid') || error.message.includes('expired')) {
        throw new AppError(400, 'INVALID_TOKEN', error.message);
      }

      throw new AppError(500, 'RESET_FAILED', 'Failed to reset password');
    }
  }
);

/**
 * Change password (authenticated)
 * POST /password/change
 */
export const changeUserPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
    }

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
        errors: errors.array(),
      });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      await changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        data: {
          message: 'Password changed successfully',
        },
      });
    } catch (error: any) {
      logger.error('Password change error:', error);

      if (error.message.includes('incorrect')) {
        throw new AppError(401, 'INCORRECT_PASSWORD', error.message);
      }

      throw new AppError(500, 'CHANGE_FAILED', 'Failed to change password');
    }
  }
);

// ============================================================================
// USER PROFILE
// ============================================================================

/**
 * Get current user profile
 * GET /me
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }

    // Get permissions
    const permissions = await getUserPermissions(userId);

    res.json({
      success: true,
      data: {
        user: {
          ...user,
          permissions,
        },
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    throw new AppError(500, 'PROFILE_FETCH_FAILED', 'Failed to fetch profile');
  }
});

/**
 * Update user profile
 * PUT /me
 */
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const { firstName, lastName, phone } = req.body;

  try {
    const user = await updateUserProfile(userId, { firstName, lastName, phone });

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    throw new AppError(500, 'PROFILE_UPDATE_FAILED', 'Failed to update profile');
  }
});
