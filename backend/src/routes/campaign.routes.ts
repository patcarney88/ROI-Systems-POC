import { Router } from 'express';
import { body, query, param } from 'express-validator';
import * as campaignController from '../controllers/campaign.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/campaigns
 * @desc    Create a new campaign
 * @access  Private
 */
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('template').trim().notEmpty().withMessage('Template is required'),
    body('recipients').isIn(['all', 'active', 'at-risk', 'dormant', 'recent']).withMessage('Invalid recipients value'),
    body('schedule').isIn(['now', 'scheduled']).withMessage('Schedule must be "now" or "scheduled"'),
    body('scheduleDate').optional().isISO8601().withMessage('Invalid schedule date'),
    body('message').trim().notEmpty().withMessage('Message is required'),
    validate
  ],
  campaignController.createCampaign
);

/**
 * @route   GET /api/v1/campaigns
 * @desc    Get all campaigns for authenticated user
 * @access  Private
 */
router.get(
  '/',
  [
    query('status').optional().isIn(['draft', 'scheduled', 'sent', 'failed']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('sortBy').optional().isString(),
    query('sortOrder').optional().isIn(['asc', 'desc']),
    validate
  ],
  campaignController.getCampaigns
);

/**
 * @route   GET /api/v1/campaigns/stats
 * @desc    Get campaign statistics
 * @access  Private
 */
router.get('/stats', campaignController.getCampaignStats);

/**
 * @route   GET /api/v1/campaigns/:id
 * @desc    Get a single campaign
 * @access  Private
 */
router.get(
  '/:id',
  [
    param('id').isString().withMessage('Campaign ID is required'),
    validate
  ],
  campaignController.getCampaign
);

/**
 * @route   PUT /api/v1/campaigns/:id
 * @desc    Update a campaign
 * @access  Private
 */
router.put(
  '/:id',
  [
    param('id').isString().withMessage('Campaign ID is required'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty'),
    body('message').optional().trim().notEmpty().withMessage('Message cannot be empty'),
    body('scheduleDate').optional().isISO8601().withMessage('Invalid schedule date'),
    validate
  ],
  campaignController.updateCampaign
);

/**
 * @route   POST /api/v1/campaigns/:id/send
 * @desc    Send/trigger a campaign
 * @access  Private
 */
router.post(
  '/:id/send',
  [
    param('id').isString().withMessage('Campaign ID is required'),
    validate
  ],
  campaignController.sendCampaign
);

/**
 * @route   DELETE /api/v1/campaigns/:id
 * @desc    Delete a campaign
 * @access  Private
 */
router.delete(
  '/:id',
  [
    param('id').isString().withMessage('Campaign ID is required'),
    validate
  ],
  campaignController.deleteCampaign
);

export default router;
