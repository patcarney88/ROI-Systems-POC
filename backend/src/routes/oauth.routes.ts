/**
 * OAuth Routes
 *
 * Endpoints:
 * - GET /google - Initiate Google OAuth
 * - GET /google/callback - Google OAuth callback
 * - GET /microsoft - Initiate Microsoft OAuth
 * - GET /microsoft/callback - Microsoft OAuth callback
 * - GET /facebook - Initiate Facebook OAuth
 * - GET /facebook/callback - Facebook OAuth callback
 * - POST /link/:provider - Link OAuth provider to existing account
 * - DELETE /unlink/:provider - Unlink OAuth provider
 */

import { Router } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import * as oauthController from '../controllers/oauth.controller';
import {
  authenticate,
  requireEmailVerified,
  standardProtection,
} from '../middleware/auth.middleware.enhanced';
import {
  generateCSRFMiddleware,
  csrfProtection,
} from '../middleware/csrf.middleware';
import { logAuthEvent } from '../middleware/audit.middleware';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('oauth-routes');

// ============================================================================
// PASSPORT CONFIGURATION
// ============================================================================

/**
 * Initialize Passport strategies
 * Configures Google, Microsoft, and Facebook OAuth providers
 */
export function configurePassport(): void {
  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: `${process.env.API_URL}/api/v1/oauth/google/callback`,
          scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // OAuth controller handles the logic
            return done(null, { provider: 'GOOGLE', profile, accessToken, refreshToken });
          } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error as Error);
          }
        }
      )
    );

    logger.info('Google OAuth strategy configured');
  } else {
    logger.warn('Google OAuth not configured - missing credentials');
  }

  // Microsoft OAuth Strategy
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: process.env.MICROSOFT_CLIENT_ID,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
          callbackURL: `${process.env.API_URL}/api/v1/oauth/microsoft/callback`,
          scope: ['user.read'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            return done(null, { provider: 'MICROSOFT', profile, accessToken, refreshToken });
          } catch (error) {
            logger.error('Microsoft OAuth error:', error);
            return done(error as Error);
          }
        }
      )
    );

    logger.info('Microsoft OAuth strategy configured');
  } else {
    logger.warn('Microsoft OAuth not configured - missing credentials');
  }

  // Facebook OAuth Strategy
  if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_CLIENT_ID,
          clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          callbackURL: `${process.env.API_URL}/api/v1/oauth/facebook/callback`,
          profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            return done(null, { provider: 'FACEBOOK', profile, accessToken, refreshToken });
          } catch (error) {
            logger.error('Facebook OAuth error:', error);
            return done(error as Error);
          }
        }
      )
    );

    logger.info('Facebook OAuth strategy configured');
  } else {
    logger.warn('Facebook OAuth not configured - missing credentials');
  }

  // Passport serialization (not used in stateless JWT API)
  passport.serializeUser((user, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
}

// ============================================================================
// GOOGLE OAUTH
// ============================================================================

/**
 * GET /google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  generateCSRFMiddleware,
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })
);

/**
 * GET /google/callback
 * Google OAuth callback
 * Handles successful OAuth authentication
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  logAuthEvent('OAUTH_LOGIN'),
  oauthController.handleOAuthCallback
);

// ============================================================================
// MICROSOFT OAUTH
// ============================================================================

/**
 * GET /microsoft
 * Initiate Microsoft OAuth flow
 */
router.get(
  '/microsoft',
  generateCSRFMiddleware,
  passport.authenticate('microsoft', {
    session: false,
    prompt: 'select_account',
  })
);

/**
 * GET /microsoft/callback
 * Microsoft OAuth callback
 */
router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  logAuthEvent('OAUTH_LOGIN'),
  oauthController.handleOAuthCallback
);

// ============================================================================
// FACEBOOK OAUTH
// ============================================================================

/**
 * GET /facebook
 * Initiate Facebook OAuth flow
 */
router.get(
  '/facebook',
  generateCSRFMiddleware,
  passport.authenticate('facebook', {
    session: false,
    scope: ['email', 'public_profile'],
  })
);

/**
 * GET /facebook/callback
 * Facebook OAuth callback
 */
router.get(
  '/facebook/callback',
  passport.authenticate('facebook', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  logAuthEvent('OAUTH_LOGIN'),
  oauthController.handleOAuthCallback
);

// ============================================================================
// OAUTH ACCOUNT LINKING
// ============================================================================

/**
 * POST /link/:provider
 * Link OAuth provider to existing authenticated account
 * Requires authentication and email verification
 * Providers: google, microsoft, facebook
 */
router.post(
  '/link/:provider',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  oauthController.linkProvider
);

/**
 * DELETE /unlink/:provider
 * Unlink OAuth provider from account
 * Requires authentication and email verification
 * Note: Cannot unlink if it's the only authentication method
 */
router.delete(
  '/unlink/:provider',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  oauthController.unlinkProvider
);

/**
 * GET /providers
 * Get linked OAuth providers for current user
 * Requires authentication
 */
router.get(
  '/providers',
  authenticate,
  oauthController.getLinkedProviders
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check endpoint for OAuth routes
 * Shows which OAuth providers are configured
 */
router.get('/health', (_req, res) => {
  const providers = [];

  if (process.env.GOOGLE_CLIENT_ID) {
    providers.push('google');
  }
  if (process.env.MICROSOFT_CLIENT_ID) {
    providers.push('microsoft');
  }
  if (process.env.FACEBOOK_CLIENT_ID) {
    providers.push('facebook');
  }

  res.json({
    success: true,
    data: {
      service: 'oauth',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      configuredProviders: providers,
      totalProviders: providers.length,
    },
  });
});

export default router;
