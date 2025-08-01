/**
 * Authentication Routes
 * Designed by: Security Specialist + Backend Specialist + UX Designer
 * 
 * Comprehensive authentication endpoints with enterprise security
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { query, transaction } from '../database/connection';
import { getRedisClient } from '../cache/redis';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';
import { logger } from '../utils/logger';
import { sendEmail } from '../utils/email';
import { 
  LoginRequest, 
  LoginResponse, 
  RegisterRequest, 
  RegisterResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordUpdateRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
  JWTPayload,
  UserRole,
  SecurityEventType 
} from '../types/auth';

const router = express.Router();

/**
 * POST /api/v1/auth/login
 * User authentication with comprehensive security
 */
router.post('/login', 
  // Rate limiting: 5 attempts per 15 minutes per IP
  rateLimiter.login,
  
  // Input validation
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 1 })
      .withMessage('Password required'),
    body('device_fingerprint')
      .optional()
      .isString()
      .isLength({ max: 255 })
  ],
  
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input provided',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { email, password, remember_me, device_fingerprint }: LoginRequest = req.body;
      const clientIP = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent') || '';

      // Find user by email
      const userResult = await query(
        `SELECT id, email, password_hash, first_name, last_name, phone_number, 
         agency_id, role, is_active, is_verified, mfa_enabled, failed_login_attempts, 
         locked_until FROM users WHERE email = $1`,
        [email]
      );

      if (userResult.rows.length === 0) {
        // Log failed login attempt
        await logSecurityEvent(null, SecurityEventType.LOGIN_FAILED, {
          email,
          reason: 'user_not_found'
        }, clientIP, userAgent);

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      const user = userResult.rows[0];

      // Check if account is locked
      if (user.locked_until && new Date() < user.locked_until) {
        await logSecurityEvent(user.id, SecurityEventType.LOGIN_BLOCKED, {
          reason: 'account_locked',
          locked_until: user.locked_until
        }, clientIP, userAgent);

        return res.status(423).json({
          error: 'Account Locked',
          message: 'Account is temporarily locked due to too many failed attempts',
          code: 'ACCOUNT_LOCKED',
          locked_until: user.locked_until
        });
      }

      // Check if account is active
      if (!user.is_active) {
        await logSecurityEvent(user.id, SecurityEventType.LOGIN_FAILED, {
          reason: 'account_inactive'
        }, clientIP, userAgent);

        return res.status(401).json({
          error: 'Account Inactive',
          message: 'Account has been deactivated',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        // Increment failed login attempts
        const newFailedAttempts = user.failed_login_attempts + 1;
        let lockedUntil = null;

        // Lock account after 5 failed attempts for 15 minutes
        if (newFailedAttempts >= 5) {
          lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        }

        await query(
          'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
          [newFailedAttempts, lockedUntil, user.id]
        );

        await logSecurityEvent(user.id, SecurityEventType.LOGIN_FAILED, {
          reason: 'invalid_password',
          failed_attempts: newFailedAttempts,
          locked_until: lockedUntil
        }, clientIP, userAgent);

        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Reset failed login attempts on successful password verification
      if (user.failed_login_attempts > 0) {
        await query(
          'UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = $1',
          [user.id]
        );
      }

      // Check if MFA is required
      if (user.mfa_enabled) {
        // Generate temporary MFA token
        const mfaToken = jwt.sign(
          {
            sub: user.id,
            email: user.email,
            type: 'mfa',
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + (5 * 60), // 5 minutes
            jti: uuidv4()
          },
          process.env.JWT_SECRET!
        );

        return res.status(200).json({
          mfa_required: true,
          mfa_token,
          message: 'MFA verification required'
        });
      }

      // Generate access and refresh tokens
      const { access_token, refresh_token, expires_in } = await generateTokens(
        user, 
        remember_me,
        device_fingerprint,
        clientIP,
        userAgent
      );

      // Update last login
      await query(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );

      // Log successful login
      await logSecurityEvent(user.id, SecurityEventType.LOGIN_SUCCESS, {
        mfa_required: false
      }, clientIP, userAgent);

      const response: LoginResponse = {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone_number: user.phone_number,
          agency_id: user.agency_id,
          role: user.role,
          permissions: [], // Will be populated by middleware
          mfa_enabled: user.mfa_enabled,
          is_verified: user.is_verified,
          last_login: new Date(),
          created_at: user.created_at
        },
        access_token,
        refresh_token,
        expires_in
      };

      res.status(200).json(response);

    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/auth/register
 * User registration with email verification
 */
router.post('/register',
  // Rate limiting: 3 registrations per hour per IP
  rateLimiter.register,
  
  // Input validation
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('password')
      .isLength({ min: 12 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must be at least 12 characters with uppercase, lowercase, number, and special character'),
    body('first_name')
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage('First name required (max 50 characters)'),
    body('last_name')
      .isLength({ min: 1, max: 50 })
      .trim()
      .withMessage('Last name required (max 50 characters)'),
    body('phone_number')
      .optional()
      .isMobilePhone('any')
      .withMessage('Valid phone number required'),
    body('agency_id')
      .optional()
      .isUUID()
      .withMessage('Valid agency ID required'),
    body('invite_token')
      .optional()
      .isString()
  ],
  
  async (req: express.Request, res: express.Response) => {
    try {
      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid input provided',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { 
        email, 
        password, 
        first_name, 
        last_name, 
        phone_number, 
        agency_id,
        invite_token 
      }: RegisterRequest = req.body;

      // Check if user already exists
      const existingUser = await query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          error: 'Conflict',
          message: 'User with this email already exists',
          code: 'USER_EXISTS'
        });
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Generate email verification token
      const verification_token = uuidv4();
      const verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Determine user role
      let role = UserRole.AGENT; // Default role
      
      if (invite_token) {
        // TODO: Validate invite token and determine role
        // const invite = await validateInviteToken(invite_token);
        // role = invite.role;
      }

      // Create user in transaction
      const newUser = await transaction(async (client) => {
        const userResult = await client.query(
          `INSERT INTO users 
           (id, email, password_hash, first_name, last_name, phone_number, 
            agency_id, role, email_verification_token, email_verification_expires)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING id, email, first_name, last_name, phone_number, agency_id, 
                     role, is_verified, created_at`,
          [
            uuidv4(),
            email,
            password_hash,
            first_name,
            last_name,
            phone_number,
            agency_id,
            role,
            verification_token,
            verification_expires
          ]
        );

        return userResult.rows[0];
      });

      // Send verification email
      try {
        await sendEmail({
          to: email,
          subject: 'Verify your ROI Systems account',
          template: 'email-verification',
          data: {
            first_name,
            verification_token,
            verification_url: `${process.env.FRONTEND_URL}/verify-email?token=${verification_token}`
          }
        });
      } catch (emailError) {
        logger.error('Failed to send verification email:', emailError);
        // Don't fail registration if email fails
      }

      const response: RegisterResponse = {
        user: {
          id: newUser.id,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          phone_number: newUser.phone_number,
          agency_id: newUser.agency_id,
          role: newUser.role,
          permissions: [],
          mfa_enabled: false,
          is_verified: newUser.is_verified,
          created_at: newUser.created_at
        },
        message: 'Account created successfully. Please check your email to verify your account.',
        verification_required: true
      };

      logger.info('User registered successfully', {
        user_id: newUser.id,
        email: newUser.email
      });

      res.status(201).json(response);

    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh',
  // Rate limiting: 10 refreshes per minute per IP
  rateLimiter.refresh,
  
  [
    body('refresh_token')
      .isString()
      .withMessage('Refresh token required')
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

      const { refresh_token }: RefreshTokenRequest = req.body;

      // Verify refresh token
      const decoded = jwt.verify(
        refresh_token, 
        process.env.JWT_REFRESH_SECRET!
      ) as JWTPayload;

      if (decoded.type !== 'refresh') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid token type',
          code: 'INVALID_TOKEN_TYPE'
        });
      }

      // Check if refresh token exists in database
      const sessionResult = await query(
        'SELECT user_id FROM sessions WHERE id = $1 AND is_active = true AND expires_at > NOW()',
        [decoded.jti]
      );

      if (sessionResult.rows.length === 0) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        });
      }

      // Get user data
      const userResult = await query(
        'SELECT id, email, role, is_active, is_verified FROM users WHERE id = $1',
        [decoded.sub]
      );

      if (userResult.rows.length === 0 || !userResult.rows[0].is_active) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not found or inactive',
          code: 'USER_INACTIVE'
        });
      }

      const user = userResult.rows[0];

      // Generate new access token
      const access_token = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          permissions: [], // Will be populated by middleware
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (15 * 60), // 15 minutes
          jti: uuidv4(),
          type: 'access'
        },
        process.env.JWT_SECRET!
      );

      const response: RefreshTokenResponse = {
        access_token,
        expires_in: 15 * 60 // 15 minutes
      };

      res.status(200).json(response);

    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid refresh token',
          code: 'INVALID_TOKEN'
        });
      }

      logger.error('Token refresh error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Token refresh failed',
        code: 'REFRESH_ERROR'
      });
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate tokens
 */
router.post('/logout',
  authenticateToken,
  
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.auth!.user.id;
      const sessionId = req.auth!.session_id;

      // Invalidate session
      await query(
        'UPDATE sessions SET is_active = false WHERE id = $1',
        [sessionId]
      );

      // Add access token to blacklist
      const redis = getRedisClient();
      await redis.setex(`blacklist:${sessionId}`, 15 * 60, 'true'); // 15 minutes TTL

      // Log logout event
      await logSecurityEvent(userId, SecurityEventType.LOGOUT, {
        session_id: sessionId
      }, req.ip, req.get('User-Agent') || '');

      res.status(200).json({
        message: 'Logged out successfully'
      });

    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Logout failed',
        code: 'LOGOUT_ERROR'
      });
    }
  }
);

/**
 * Generate JWT tokens for user
 */
async function generateTokens(
  user: any,
  rememberMe: boolean = false,
  deviceFingerprint?: string,
  clientIP?: string,
  userAgent?: string
) {
  const sessionId = uuidv4();
  const now = Math.floor(Date.now() / 1000);
  
  // Access token (15 minutes)
  const access_token = jwt.sign(
    {
      sub: user.id,
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
      sub: user.id,
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
      user.id,
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
  userId: string | null,
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
    case SecurityEventType.LOGIN_FAILED:
      score = details.failed_attempts ? details.failed_attempts * 10 : 10;
      break;
    case SecurityEventType.LOGIN_BLOCKED:
      score = 50;
      break;
    case SecurityEventType.SUSPICIOUS_ACTIVITY:
      score = 70;
      break;
    case SecurityEventType.LOGIN_SUCCESS:
      score = 0;
      break;
    default:
      score = 5;
  }

  return Math.min(score, 100);
}

export { router as authRoutes };