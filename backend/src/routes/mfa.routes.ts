/**
 * MFA (Multi-Factor Authentication) Routes
 *
 * Endpoints:
 * - POST /setup/totp - Setup TOTP authenticator
 * - POST /verify/totp - Verify TOTP code
 * - POST /setup/sms - Setup SMS authentication
 * - POST /verify/sms - Verify SMS code
 * - GET /backup-codes - Get backup codes info
 * - POST /backup-codes/regenerate - Regenerate backup codes
 * - POST /verify/backup-code - Use backup code for login
 * - DELETE /disable - Disable MFA
 */

import { Router } from 'express';
import * as mfaController from '../controllers/mfa.controller';
import {
  authenticate,
  requireEmailVerified,
  standardProtection,
} from '../middleware/auth.middleware.enhanced';
import {
  mfaRateLimiter,
} from '../middleware/rate-limit.middleware';
import {
  generateCSRFMiddleware,
  csrfProtection,
} from '../middleware/csrf.middleware';
import { logMFAEvent } from '../middleware/audit.middleware';

const router = Router();

// ============================================================================
// TOTP SETUP & VERIFICATION
// ============================================================================

/**
 * POST /setup/totp
 * Setup TOTP (Time-based One-Time Password) authenticator
 * Requires authentication and email verification
 * Returns QR code and manual entry key
 */
router.post(
  '/setup/totp',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  mfaController.setupTOTPValidation,
  logMFAEvent('MFA_ENABLE'),
  mfaController.setupTOTP
);

/**
 * POST /verify/totp
 * Verify TOTP code
 * Can be used for:
 * 1. Completing TOTP setup (requires authentication)
 * 2. MFA login verification (requires mfaSessionToken)
 * Rate limited: 5 attempts per 15 minutes
 */
router.post(
  '/verify/totp',
  generateCSRFMiddleware,
  csrfProtection,
  mfaRateLimiter,
  mfaController.verifyTOTPValidation,
  logMFAEvent('MFA_VERIFY'),
  mfaController.verifyTOTP
);

// ============================================================================
// SMS SETUP & VERIFICATION
// ============================================================================

/**
 * POST /setup/sms
 * Setup SMS-based MFA
 * Requires authentication and email verification
 * Sends verification code to phone number
 */
router.post(
  '/setup/sms',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  mfaController.setupSMSValidation,
  logMFAEvent('MFA_ENABLE'),
  mfaController.setupSMS
);

/**
 * POST /verify/sms
 * Verify SMS code
 * Can be used for:
 * 1. Completing SMS MFA setup (requires authentication)
 * 2. MFA login verification (requires mfaSessionToken)
 * Rate limited: 5 attempts per 15 minutes
 */
router.post(
  '/verify/sms',
  generateCSRFMiddleware,
  csrfProtection,
  mfaRateLimiter,
  mfaController.verifyCodeValidation,
  logMFAEvent('MFA_VERIFY'),
  mfaController.verifySMS
);

// ============================================================================
// BACKUP CODES
// ============================================================================

/**
 * GET /backup-codes
 * Get backup codes information
 * Shows number of remaining backup codes
 * Requires authentication and email verification
 * Note: Actual codes only shown during setup or regeneration
 */
router.get(
  '/backup-codes',
  ...standardProtection,
  mfaController.getBackupCodes
);

/**
 * POST /backup-codes/regenerate
 * Regenerate backup codes
 * Invalidates all existing backup codes
 * Returns new set of backup codes (one-time view)
 * Requires authentication and email verification
 */
router.post(
  '/backup-codes/regenerate',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  logMFAEvent('MFA_ENABLE'),
  mfaController.regenerateBackupCodes
);

/**
 * POST /verify/backup-code
 * Use backup code for MFA login
 * Requires mfaSessionToken from login flow
 * Rate limited: 5 attempts per 15 minutes
 * Note: Each backup code can only be used once
 */
router.post(
  '/verify/backup-code',
  generateCSRFMiddleware,
  csrfProtection,
  mfaRateLimiter,
  logMFAEvent('MFA_VERIFY'),
  mfaController.verifyBackupCode
);

// ============================================================================
// DISABLE MFA
// ============================================================================

/**
 * DELETE /disable
 * Disable MFA for account
 * Requires password confirmation
 * Removes all MFA methods and backup codes
 * Requires authentication and email verification
 */
router.delete(
  '/disable',
  ...standardProtection,
  generateCSRFMiddleware,
  csrfProtection,
  logMFAEvent('MFA_DISABLE'),
  mfaController.disableMFA
);

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check endpoint for MFA routes
 */
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'mfa',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      supportedMethods: ['TOTP', 'SMS', 'BACKUP_CODES'],
    },
  });
});

export default router;
