/**
 * Push Notification Routes
 * API endpoints for push notification management
 */

import { Router } from 'express';
import pushNotificationController from '../controllers/push-notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const router = Router();

/**
 * Validation middleware
 */
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array(),
      },
    });
  }
  next();
};

/**
 * GET /api/v1/notifications/vapid-public-key
 * Get VAPID public key for push subscription
 * Public endpoint - no authentication required
 */
router.get(
  '/vapid-public-key',
  pushNotificationController.getVAPIDPublicKey.bind(pushNotificationController)
);

/**
 * POST /api/v1/notifications/subscribe
 * Subscribe to push notifications
 * Requires authentication
 */
router.post(
  '/subscribe',
  authenticate,
  [
    body('subscription').isObject().withMessage('Valid subscription object required'),
    body('subscription.endpoint').isURL().withMessage('Valid endpoint URL required'),
    body('subscription.keys').isObject().withMessage('Subscription keys required'),
    body('subscription.keys.p256dh').isString().withMessage('p256dh key required'),
    body('subscription.keys.auth').isString().withMessage('auth key required'),
    body('deviceType').optional().isString().withMessage('Device type must be string'),
    body('browserType').optional().isString().withMessage('Browser type must be string'),
    body('deviceName').optional().isString().withMessage('Device name must be string'),
  ],
  validate,
  pushNotificationController.subscribe.bind(pushNotificationController)
);

/**
 * DELETE /api/v1/notifications/unsubscribe
 * Unsubscribe from push notifications
 * Requires authentication
 */
router.delete(
  '/unsubscribe',
  authenticate,
  [
    body('endpoint').isURL().withMessage('Valid endpoint URL required'),
  ],
  validate,
  pushNotificationController.unsubscribe.bind(pushNotificationController)
);

/**
 * POST /api/v1/notifications/send
 * Send notification (admin/system use)
 * Requires authentication and admin role
 */
router.post(
  '/send',
  authenticate,
  [
    body('targetUserId').isUUID().withMessage('Valid user ID required'),
    body('title').isString().trim().isLength({ min: 1, max: 100 })
      .withMessage('Title required (1-100 characters)'),
    body('body').isString().trim().isLength({ min: 1, max: 500 })
      .withMessage('Body required (1-500 characters)'),
    body('channel').isString().withMessage('Channel required'),
    body('type').optional().isString().withMessage('Type must be string'),
    body('priority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
      .withMessage('Invalid priority level'),
    body('icon').optional().isURL().withMessage('Icon must be valid URL'),
    body('image').optional().isURL().withMessage('Image must be valid URL'),
    body('badge').optional().isURL().withMessage('Badge must be valid URL'),
    body('sound').optional().isString().withMessage('Sound must be string'),
    body('data').optional().isObject().withMessage('Data must be object'),
    body('actions').optional().isArray().withMessage('Actions must be array'),
    body('requireInteraction').optional().isBoolean()
      .withMessage('requireInteraction must be boolean'),
    body('silent').optional().isBoolean().withMessage('silent must be boolean'),
    body('vibrate').optional().isArray().withMessage('vibrate must be array'),
    body('scheduledFor').optional().isISO8601().withMessage('Invalid date format'),
    body('ttl').optional().isInt({ min: 0 }).withMessage('TTL must be positive integer'),
    body('tags').optional().isArray().withMessage('Tags must be array'),
  ],
  validate,
  pushNotificationController.sendNotification.bind(pushNotificationController)
);

/**
 * GET /api/v1/notifications/history
 * Get notification history
 * Requires authentication
 */
router.get(
  '/history',
  authenticate,
  [
    query('type').optional().isString().withMessage('Type must be string'),
    query('status').optional().isString().withMessage('Status must be string'),
    query('startDate').optional().isISO8601().withMessage('Invalid start date format'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date format'),
    query('limit').optional().isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
  ],
  validate,
  pushNotificationController.getHistory.bind(pushNotificationController)
);

/**
 * PUT /api/v1/notifications/preferences
 * Update notification preferences
 * Requires authentication
 */
router.put(
  '/preferences',
  authenticate,
  [
    body('enabled').optional().isBoolean().withMessage('enabled must be boolean'),
    body('doNotDisturbStart').optional().isInt({ min: 0, max: 23 })
      .withMessage('doNotDisturbStart must be between 0 and 23'),
    body('doNotDisturbEnd').optional().isInt({ min: 0, max: 23 })
      .withMessage('doNotDisturbEnd must be between 0 and 23'),
    body('timezone').optional().isString().withMessage('timezone must be string'),
    body('businessAlerts').optional().isBoolean().withMessage('businessAlerts must be boolean'),
    body('documentUpdates').optional().isBoolean().withMessage('documentUpdates must be boolean'),
    body('propertyValues').optional().isBoolean().withMessage('propertyValues must be boolean'),
    body('marketReports').optional().isBoolean().withMessage('marketReports must be boolean'),
    body('maintenance').optional().isBoolean().withMessage('maintenance must be boolean'),
    body('marketing').optional().isBoolean().withMessage('marketing must be boolean'),
    body('systemAlerts').optional().isBoolean().withMessage('systemAlerts must be boolean'),
    body('minPriority').optional().isIn(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
      .withMessage('Invalid minPriority'),
    body('criticalOnly').optional().isBoolean().withMessage('criticalOnly must be boolean'),
    body('webPush').optional().isBoolean().withMessage('webPush must be boolean'),
    body('email').optional().isBoolean().withMessage('email must be boolean'),
    body('sms').optional().isBoolean().withMessage('sms must be boolean'),
    body('inApp').optional().isBoolean().withMessage('inApp must be boolean'),
    body('batchNotifications').optional().isBoolean()
      .withMessage('batchNotifications must be boolean'),
    body('batchInterval').optional().isInt({ min: 1 })
      .withMessage('batchInterval must be positive integer'),
    body('maxPerHour').optional().isInt({ min: 1 })
      .withMessage('maxPerHour must be positive integer'),
    body('maxPerDay').optional().isInt({ min: 1 })
      .withMessage('maxPerDay must be positive integer'),
    body('soundEnabled').optional().isBoolean().withMessage('soundEnabled must be boolean'),
    body('vibrationEnabled').optional().isBoolean()
      .withMessage('vibrationEnabled must be boolean'),
  ],
  validate,
  pushNotificationController.updatePreferences.bind(pushNotificationController)
);

/**
 * GET /api/v1/notifications/preferences
 * Get notification preferences
 * Requires authentication
 */
router.get(
  '/preferences',
  authenticate,
  pushNotificationController.getPreferences.bind(pushNotificationController)
);

/**
 * GET /api/v1/notifications/subscriptions
 * Get user subscriptions
 * Requires authentication
 */
router.get(
  '/subscriptions',
  authenticate,
  pushNotificationController.getSubscriptions.bind(pushNotificationController)
);

/**
 * POST /api/v1/notifications/test
 * Send test notification
 * Requires authentication
 */
router.post(
  '/test',
  authenticate,
  pushNotificationController.sendTestNotification.bind(pushNotificationController)
);

export default router;
