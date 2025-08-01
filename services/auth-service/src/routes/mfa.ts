/**
 * Multi-Factor Authentication Routes
 * Designed by: Security Specialist + Backend Specialist
 * 
 * TOTP-based MFA with backup codes and security monitoring
 */

import express from 'express';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../database/connection';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { 
  MFASetupRequest,
  MFASetupResponse,
  MFAVerifyRequest,
  MFAVerifyResponse,
  SecurityEventType 
} from '../types/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

/**
 * POST /api/v1/mfa/setup
 * Initialize MFA setup for user
 */
router.post('/setup',
  authenticateToken,
  rateLimiter.mfa,
  
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.auth!.user.id;
      const userEmail = req.auth!.user.email;
      const userName = `${req.auth!.user.first_name} ${req.auth!.user.last_name}`;

      // Check if MFA is already enabled
      const userResult = await query(
        'SELECT mfa_enabled, mfa_secret FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];

      if (user.mfa_enabled) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'MFA is already enabled for this user',
          code: 'MFA_ALREADY_ENABLED'
        });
      }

      // Generate secret for TOTP
      const secret = speakeasy.generateSecret({
        name: `ROI Systems (${userEmail})`,
        issuer: 'ROI Systems Digital Docs',
        length: 32
      });

      // Generate QR code
      const qrCodeUrl = speakeasy.otpauthURL({
        secret: secret.ascii,
        label: userEmail,
        issuer: 'ROI Systems',
        encoding: 'ascii'
      });

      const qrCode = await QRCode.toDataURL(qrCodeUrl);

      // Generate backup codes (10 codes)
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(generateBackupCode());
      }

      // Store temporary MFA setup data (not yet enabled)
      await query(
        `INSERT INTO mfa_setup_temp (user_id, secret, backup_codes, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '15 minutes')
         ON CONFLICT (user_id) 
         DO UPDATE SET secret = $2, backup_codes = $3, created_at = NOW(), expires_at = NOW() + INTERVAL '15 minutes'`,
        [userId, secret.base32, JSON.stringify(backupCodes.map(code => bcrypt.hashSync(code, 10)))]
      );

      // Log MFA setup initiation
      await logSecurityEvent(userId, SecurityEventType.MFA_SETUP, {
        action: 'setup_initiated'
      }, req.ip, req.get('User-Agent') || '');

      const response: MFASetupResponse = {
        secret: secret.base32,
        qr_code: qrCode,
        backup_codes: backupCodes
      };

      logger.info('MFA setup initiated', { user_id: userId });

      res.status(200).json(response);

    } catch (error) {
      logger.error('MFA setup error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'MFA setup failed',
        code: 'MFA_SETUP_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/mfa/verify
 * Verify MFA token and complete setup or login
 */
router.post('/verify',
  // Allow both authenticated users (for setup) and MFA token holders (for login)
  rateLimiter.mfa,
  
  [
    body('token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid 6-digit token required'),
    body('type')
      .isIn(['setup', 'login'])
      .withMessage('Type must be setup or login'),
    body('mfa_token')
      .optional()
      .isString()
      .withMessage('Valid MFA token required for login type')
  ],

  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input provided',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { token, type, mfa_token }: MFAVerifyRequest = req.body;

      if (type === 'setup') {
        // MFA Setup Verification
        if (!req.auth || !req.auth.is_authenticated) {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authentication required for MFA setup',
            code: 'AUTH_REQUIRED'
          });
        }

        const userId = req.auth.user.id;

        // Get temporary MFA data
        const tempResult = await query(
          'SELECT secret, backup_codes FROM mfa_setup_temp WHERE user_id = $1 AND expires_at > NOW()',
          [userId]
        );

        if (tempResult.rows.length === 0) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'MFA setup session expired or not found',
            code: 'MFA_SETUP_EXPIRED'
          });
        }

        const tempData = tempResult.rows[0];

        // Verify TOTP token
        const verified = speakeasy.totp.verify({
          secret: tempData.secret,
          encoding: 'base32',
          token: token,
          window: 2 // Allow 2 time steps (60 seconds) of drift
        });

        if (!verified) {
          await logSecurityEvent(userId, SecurityEventType.MFA_FAILED, {
            action: 'setup_verification_failed',
            token_type: 'totp'
          }, req.ip, req.get('User-Agent') || '');

          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid MFA token',
            code: 'INVALID_MFA_TOKEN'
          });
        }

        // Enable MFA for user
        await transaction(async (client) => {
          // Update user with MFA enabled
          await client.query(
            'UPDATE users SET mfa_enabled = true, mfa_secret = $1 WHERE id = $2',
            [tempData.secret, userId]
          );

          // Store backup codes
          const backupCodes = JSON.parse(tempData.backup_codes);
          for (const hashedCode of backupCodes) {
            await client.query(
              'INSERT INTO mfa_backup_codes (id, user_id, code_hash, is_used) VALUES ($1, $2, $3, false)',
              [uuidv4(), userId, hashedCode]
            );
          }

          // Clean up temporary data
          await client.query(
            'DELETE FROM mfa_setup_temp WHERE user_id = $1',
            [userId]
          );
        });

        await logSecurityEvent(userId, SecurityEventType.MFA_SETUP, {
          action: 'setup_completed'
        }, req.ip, req.get('User-Agent') || '');

        logger.info('MFA setup completed', { user_id: userId });

        const response: MFAVerifyResponse = {
          verified: true
        };

        res.status(200).json(response);

      } else if (type === 'login') {
        // MFA Login Verification
        if (!mfa_token) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'MFA token required for login verification',
            code: 'MFA_TOKEN_REQUIRED'
          });
        }

        // Verify MFA JWT token
        const decoded = jwt.verify(mfa_token, process.env.JWT_SECRET!) as any;
        
        if (decoded.type !== 'mfa') {
          return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid MFA token',
            code: 'INVALID_MFA_TOKEN'
          });
        }

        const userId = decoded.sub;

        // Get user MFA data
        const userResult = await query(
          'SELECT mfa_secret, mfa_enabled FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].mfa_enabled) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'MFA not enabled for user',
            code: 'MFA_NOT_ENABLED'
          });
        }

        const user = userResult.rows[0];

        // Try TOTP verification first
        let verified = speakeasy.totp.verify({
          secret: user.mfa_secret,
          encoding: 'base32',
          token: token,
          window: 2
        });

        let usedBackupCode = false;

        // If TOTP fails, try backup codes
        if (!verified) {
          const backupResult = await query(
            'SELECT id, code_hash FROM mfa_backup_codes WHERE user_id = $1 AND is_used = false',
            [userId]
          );

          for (const backupCode of backupResult.rows) {
            if (bcrypt.compareSync(token, backupCode.code_hash)) {
              verified = true;
              usedBackupCode = true;

              // Mark backup code as used
              await query(
                'UPDATE mfa_backup_codes SET is_used = true, used_at = NOW() WHERE id = $1',
                [backupCode.id]
              );

              break;
            }
          }
        }

        if (!verified) {
          await logSecurityEvent(userId, SecurityEventType.MFA_FAILED, {
            action: 'login_verification_failed',
            token_type: 'totp_and_backup'
          }, req.ip, req.get('User-Agent') || '');

          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid MFA token',
            code: 'INVALID_MFA_TOKEN'
          });
        }

        // Generate access and refresh tokens
        const { access_token, refresh_token, expires_in } = await generateLoginTokens(
          userId,
          req.body.remember_me,
          req.body.device_fingerprint,
          req.ip,
          req.get('User-Agent')
        );

        // Update last login
        await query('UPDATE users SET last_login = NOW() WHERE id = $1', [userId]);

        await logSecurityEvent(userId, SecurityEventType.MFA_SUCCESS, {
          action: 'login_verification_success',
          used_backup_code: usedBackupCode
        }, req.ip, req.get('User-Agent') || '');

        const response: MFAVerifyResponse = {
          verified: true,
          access_token,
          refresh_token,
          expires_in
        };

        res.status(200).json(response);
      }

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid MFA token',
          code: 'INVALID_TOKEN'
        });
      }

      logger.error('MFA verification error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'MFA verification failed',
        code: 'MFA_VERIFY_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/mfa/disable
 * Disable MFA for user (requires password confirmation)
 */
router.post('/disable',
  authenticateToken,
  rateLimiter.mfa,
  
  [
    body('password')
      .isLength({ min: 1 })
      .withMessage('Current password required'),
    body('confirmation_token')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('Valid MFA token required for confirmation')
  ],

  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input provided',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const userId = req.auth!.user.id;
      const { password, confirmation_token } = req.body;

      // Get user data
      const userResult = await query(
        'SELECT password_hash, mfa_enabled, mfa_secret FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'User not found',
          code: 'USER_NOT_FOUND'
        });
      }

      const user = userResult.rows[0];

      if (!user.mfa_enabled) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'MFA is not enabled for this user',
          code: 'MFA_NOT_ENABLED'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid password',
          code: 'INVALID_PASSWORD'
        });
      }

      // Verify MFA token
      const verified = speakeasy.totp.verify({
        secret: user.mfa_secret,
        encoding: 'base32',
        token: confirmation_token,
        window: 2
      });

      if (!verified) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid MFA token',
          code: 'INVALID_MFA_TOKEN'
        });
      }

      // Disable MFA
      await transaction(async (client) => {
        await client.query(
          'UPDATE users SET mfa_enabled = false, mfa_secret = NULL WHERE id = $1',
          [userId]
        );

        // Delete backup codes
        await client.query(
          'DELETE FROM mfa_backup_codes WHERE user_id = $1',
          [userId]
        );
      });

      await logSecurityEvent(userId, SecurityEventType.MFA_SETUP, {
        action: 'mfa_disabled'
      }, req.ip, req.get('User-Agent') || '');

      logger.info('MFA disabled', { user_id: userId });

      res.status(200).json({
        message: 'MFA has been disabled successfully'
      });

    } catch (error) {
      logger.error('MFA disable error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to disable MFA',
        code: 'MFA_DISABLE_ERROR'
      });
    }
  }
);

/**
 * GET /api/v1/mfa/backup-codes/regenerate
 * Regenerate backup codes for user
 */
router.post('/backup-codes/regenerate',
  authenticateToken,
  rateLimiter.mfa,

  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.auth!.user.id;

      // Check if MFA is enabled
      const userResult = await query(
        'SELECT mfa_enabled FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].mfa_enabled) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'MFA is not enabled for this user',
          code: 'MFA_NOT_ENABLED'
        });
      }

      // Generate new backup codes
      const backupCodes = [];
      for (let i = 0; i < 10; i++) {
        backupCodes.push(generateBackupCode());
      }

      // Replace existing backup codes
      await transaction(async (client) => {
        // Delete old codes
        await client.query(
          'DELETE FROM mfa_backup_codes WHERE user_id = $1',
          [userId]
        );

        // Insert new codes
        for (const code of backupCodes) {
          await client.query(
            'INSERT INTO mfa_backup_codes (id, user_id, code_hash, is_used) VALUES ($1, $2, $3, false)',
            [uuidv4(), userId, bcrypt.hashSync(code, 10)]
          );
        }
      });

      logger.info('MFA backup codes regenerated', { user_id: userId });

      res.status(200).json({
        backup_codes: backupCodes,
        message: 'New backup codes generated. Store them securely.'
      });

    } catch (error) {
      logger.error('Backup codes regeneration error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to regenerate backup codes',
        code: 'BACKUP_CODES_ERROR'
      });
    }
  }
);

/**
 * Generate a secure backup code
 */
function generateBackupCode(): string {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate access and refresh tokens after successful MFA
 */
async function generateLoginTokens(
  userId: string,
  rememberMe: boolean = false,
  deviceFingerprint?: string,
  clientIP?: string,
  userAgent?: string
) {
  // Get user data
  const userResult = await query(
    'SELECT email, role, agency_id FROM users WHERE id = $1',
    [userId]
  );

  const user = userResult.rows[0];
  const sessionId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  
  // Access token (15 minutes)
  const access_token = jwt.sign(
    {
      sub: userId,
      email: user.email,
      role: user.role,
      agency_id: user.agency_id,
      iat: now,
      exp: now + (15 * 60),
      jti: sessionId,
      type: 'access'
    },
    process.env.JWT_SECRET!
  );

  // Refresh token (7 days or 30 days if remember me)
  const refreshExpiry = rememberMe ? (30 * 24 * 60 * 60) : (7 * 24 * 60 * 60);
  const refresh_token = jwt.sign(
    {
      sub: userId,
      iat: now,
      exp: now + refreshExpiry,
      jti: sessionId,
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET!
  );

  // Store session in database
  await query(
    `INSERT INTO sessions 
     (id, user_id, refresh_token_hash, device_fingerprint, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      sessionId,
      userId,
      await bcrypt.hash(refresh_token, 10),
      deviceFingerprint,
      clientIP,
      userAgent,
      new Date(Date.now() + refreshExpiry * 1000)
    ]
  );

  return {
    access_token,
    refresh_token,
    expires_in: 15 * 60 // 15 minutes
  };
}

/**
 * Log security events for monitoring and compliance
 */
async function logSecurityEvent(
  userId: string,
  eventType: SecurityEventType,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await query(
      `INSERT INTO security_events 
       (id, user_id, event_type, details, ip_address, user_agent, risk_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        uuidv4(),
        userId,
        eventType,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        calculateRiskScore(eventType, details)
      ]
    );
  } catch (error) {
    logger.error('Failed to log security event:', error);
  }
}

/**
 * Calculate risk score for security events
 */
function calculateRiskScore(eventType: SecurityEventType, details: Record<string, any>): number {
  let score = 0;

  switch (eventType) {
    case SecurityEventType.MFA_FAILED:
      score = 20;
      break;
    case SecurityEventType.MFA_SUCCESS:
      score = 0;
      break;
    case SecurityEventType.MFA_SETUP:
      score = details.action === 'mfa_disabled' ? 30 : 5;
      break;
    default:
      score = 5;
  }

  return Math.min(score, 100);
}

export { router as mfaRoutes };