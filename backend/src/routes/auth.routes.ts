import { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { authLimiter, sensitiveOperationsLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 * @security Rate limited: 5 attempts per 15 minutes
 */
router.post(
  '/register',
  authLimiter, // SECURITY: Prevent registration spam
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
      .custom((email) => {
        // SECURITY: Block disposable email domains
        const disposableDomains = ['tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com'];
        const domain = email.split('@')[1];
        if (disposableDomains.includes(domain)) {
          throw new Error('Disposable email addresses are not allowed');
        }
        return true;
      }),
    body('password')
      .isLength({ min: 12 })
      .withMessage('Password must be at least 12 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain uppercase, lowercase, number, and special character (@$!%*?&)'),
    body('firstName')
      .trim()
      .notEmpty()
      .withMessage('First name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('First name contains invalid characters'),
    body('lastName')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters')
      .matches(/^[a-zA-Z\s-']+$/)
      .withMessage('Last name contains invalid characters'),
    body('role')
      .optional()
      .isIn(['admin', 'agent', 'client'])
      .withMessage('Invalid role'),
    validate
  ],
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 * @security Rate limited: 5 failed attempts per 15 minutes (brute force protection)
 */
router.post(
  '/login',
  authLimiter, // SECURITY: Prevent brute force attacks
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
  ],
  authController.login
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    validate
  ],
  authController.refresh
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', authenticate, authController.getProfile);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Update user profile
 * @access  Private
 * @security Rate limited: 3 updates per hour (sensitive operation)
 */
router.put(
  '/profile',
  authenticate,
  sensitiveOperationsLimiter, // SECURITY: Prevent abuse of profile updates
  [
    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('First name must be 2-50 characters'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty')
      .isLength({ min: 2, max: 50 })
      .withMessage('Last name must be 2-50 characters'),
    validate
  ],
  authController.updateProfile
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

export default router;
