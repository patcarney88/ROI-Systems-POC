/**
 * OAuth Controller
 *
 * Endpoints:
 * - GET /oauth/google - Initiate Google OAuth
 * - GET /oauth/google/callback - Google OAuth callback
 * - GET /oauth/microsoft - Initiate Microsoft OAuth
 * - GET /oauth/microsoft/callback - Microsoft OAuth callback
 * - GET /oauth/facebook - Initiate Facebook OAuth
 * - GET /oauth/facebook/callback - Facebook OAuth callback
 * - POST /oauth/link - Link OAuth account to existing user
 * - DELETE /oauth/unlink/:provider - Unlink OAuth account
 * - GET /oauth/accounts - Get user's OAuth accounts
 */

import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { OAuthProvider } from '@prisma/client';
import { asyncHandler, AppError } from '../middleware/error.middleware';
import { createLogger } from '../utils/logger';
import {
  initializeOAuth,
  handleOAuthLogin,
  linkOAuthAccount,
  unlinkOAuthAccount,
  getUserOAuthAccounts,
  type OAuthProfile,
} from '../services/oauth.service';
import { parseUserAgent } from '../services/session.service';

const logger = createLogger('oauth-controller');

// Initialize OAuth strategies
initializeOAuth();

// ============================================================================
// OAUTH INITIATION
// ============================================================================

/**
 * Initiate Google OAuth
 * GET /oauth/google
 */
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

/**
 * Google OAuth callback
 * GET /oauth/google/callback
 */
export const googleCallback = [
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const profile = req.user as OAuthProfile;

      if (!profile) {
        throw new AppError(400, 'OAUTH_FAILED', 'Failed to get OAuth profile');
      }

      // Get device info
      const deviceInfo = {
        ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
        userAgent: req.headers['user-agent'] || 'unknown',
        ...parseUserAgent(req.headers['user-agent'] || ''),
      };

      // Handle OAuth login/signup
      const result = await handleOAuthLogin(profile, deviceInfo);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('access_token', result.tokens.accessToken);
      redirectUrl.searchParams.set('refresh_token', result.tokens.refreshToken);
      redirectUrl.searchParams.set('new_user', result.isNewUser.toString());

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('Google OAuth callback error:', error);

      const errorUrl = new URL(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      );
      errorUrl.searchParams.set('error', 'oauth_failed');
      errorUrl.searchParams.set('message', error.message);

      res.redirect(errorUrl.toString());
    }
  }),
];

// ============================================================================
// MICROSOFT OAUTH
// ============================================================================

/**
 * Initiate Microsoft OAuth
 * GET /oauth/microsoft
 */
export const microsoftAuth = passport.authenticate('microsoft', {
  scope: ['user.read'],
  session: false,
});

/**
 * Microsoft OAuth callback
 * GET /oauth/microsoft/callback
 */
export const microsoftCallback = [
  passport.authenticate('microsoft', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const profile = req.user as OAuthProfile;

      if (!profile) {
        throw new AppError(400, 'OAUTH_FAILED', 'Failed to get OAuth profile');
      }

      // Get device info
      const deviceInfo = {
        ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
        userAgent: req.headers['user-agent'] || 'unknown',
        ...parseUserAgent(req.headers['user-agent'] || ''),
      };

      // Handle OAuth login/signup
      const result = await handleOAuthLogin(profile, deviceInfo);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('access_token', result.tokens.accessToken);
      redirectUrl.searchParams.set('refresh_token', result.tokens.refreshToken);
      redirectUrl.searchParams.set('new_user', result.isNewUser.toString());

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('Microsoft OAuth callback error:', error);

      const errorUrl = new URL(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      );
      errorUrl.searchParams.set('error', 'oauth_failed');
      errorUrl.searchParams.set('message', error.message);

      res.redirect(errorUrl.toString());
    }
  }),
];

// ============================================================================
// FACEBOOK OAUTH
// ============================================================================

/**
 * Initiate Facebook OAuth
 * GET /oauth/facebook
 */
export const facebookAuth = passport.authenticate('facebook', {
  scope: ['email', 'public_profile'],
  session: false,
});

/**
 * Facebook OAuth callback
 * GET /oauth/facebook/callback
 */
export const facebookCallback = [
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: '/login?error=oauth_failed',
  }),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const profile = req.user as OAuthProfile;

      if (!profile) {
        throw new AppError(400, 'OAUTH_FAILED', 'Failed to get OAuth profile');
      }

      // Get device info
      const deviceInfo = {
        ipAddress: (req.ip || req.connection.remoteAddress || '').replace('::ffff:', ''),
        userAgent: req.headers['user-agent'] || 'unknown',
        ...parseUserAgent(req.headers['user-agent'] || ''),
      };

      // Handle OAuth login/signup
      const result = await handleOAuthLogin(profile, deviceInfo);

      // Redirect to frontend with tokens
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('access_token', result.tokens.accessToken);
      redirectUrl.searchParams.set('refresh_token', result.tokens.refreshToken);
      redirectUrl.searchParams.set('new_user', result.isNewUser.toString());

      res.redirect(redirectUrl.toString());
    } catch (error: any) {
      logger.error('Facebook OAuth callback error:', error);

      const errorUrl = new URL(
        `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`
      );
      errorUrl.searchParams.set('error', 'oauth_failed');
      errorUrl.searchParams.set('message', error.message);

      res.redirect(errorUrl.toString());
    }
  }),
];

// ============================================================================
// ACCOUNT LINKING
// ============================================================================

/**
 * Link OAuth account to current user
 * POST /oauth/link
 */
export const linkAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const { provider, code } = req.body;

  if (!provider || !code) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Provider and code are required');
  }

  try {
    // Validate provider
    if (!Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
      throw new AppError(400, 'INVALID_PROVIDER', 'Invalid OAuth provider');
    }

    // Exchange code for profile (implementation depends on provider)
    // This is a placeholder - actual implementation would exchange the code
    // for access token and fetch profile

    throw new AppError(501, 'NOT_IMPLEMENTED', 'OAuth linking not yet implemented');
  } catch (error: any) {
    logger.error('OAuth link error:', error);

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(500, 'LINK_FAILED', 'Failed to link OAuth account');
  }
});

/**
 * Unlink OAuth account
 * DELETE /oauth/unlink/:provider
 */
export const unlinkAccount = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  const { provider } = req.params;

  if (!provider) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Provider is required');
  }

  try {
    // Validate provider
    if (!Object.values(OAuthProvider).includes(provider as OAuthProvider)) {
      throw new AppError(400, 'INVALID_PROVIDER', 'Invalid OAuth provider');
    }

    await unlinkOAuthAccount(userId, provider as OAuthProvider);

    logger.info(`OAuth account unlinked: ${provider} for user ${userId}`);

    res.json({
      success: true,
      data: {
        message: `${provider} account unlinked successfully`,
      },
    });
  } catch (error: any) {
    logger.error('OAuth unlink error:', error);

    if (error.message.includes('not found')) {
      throw new AppError(404, 'ACCOUNT_NOT_FOUND', 'OAuth account not found');
    }

    if (error.message.includes('Cannot unlink')) {
      throw new AppError(400, 'CANNOT_UNLINK', error.message);
    }

    throw new AppError(500, 'UNLINK_FAILED', 'Failed to unlink OAuth account');
  }
});

/**
 * Get user's OAuth accounts
 * GET /oauth/accounts
 */
export const getAccounts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not authenticated');
  }

  try {
    const accounts = await getUserOAuthAccounts(userId);

    res.json({
      success: true,
      data: { accounts },
    });
  } catch (error) {
    logger.error('Get OAuth accounts error:', error);
    throw new AppError(500, 'FETCH_FAILED', 'Failed to fetch OAuth accounts');
  }
});
