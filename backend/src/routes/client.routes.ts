import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as clientController from '../controllers/client.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/clients
 * @desc    Create a new client
 * @access  Private
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Client name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('propertyCount').optional().isInt({ min: 0 }).withMessage('Property count must be a non-negative integer'),
    body('status').optional().isIn(['active', 'at-risk', 'dormant']).withMessage('Invalid status'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    validate
  ],
  clientController.createClient
);

/**
 * @route   GET /api/v1/clients
 * @desc    Get all clients for authenticated user
 * @access  Private
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['active', 'at-risk', 'dormant']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate
  ],
  clientController.getClients
);

/**
 * @route   GET /api/v1/clients/stats
 * @desc    Get client statistics
 * @access  Private
 */
router.get('/stats', clientController.getClientStats);

/**
 * @route   GET /api/v1/clients/:id
 * @desc    Get a single client
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isString().withMessage('Client ID is required'),
    validate
  ],
  clientController.getClient
);

/**
 * @route   PUT /api/v1/clients/:id
 * @desc    Update a client
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isString().withMessage('Client ID is required'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').optional().trim().notEmpty().withMessage('Phone cannot be empty'),
    body('propertyCount').optional().isInt({ min: 0 }).withMessage('Property count must be non-negative'),
    body('status').optional().isIn(['active', 'at-risk', 'dormant']),
    body('engagementScore').optional().isInt({ min: 0, max: 100 }).withMessage('Engagement score must be 0-100'),
    body('notes').optional().isString(),
    validate
  ],
  clientController.updateClient
);

/**
 * @route   DELETE /api/v1/clients/:id
 * @desc    Delete a client
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isString().withMessage('Client ID is required'),
    validate
  ],
  clientController.deleteClient
);

export default router;
