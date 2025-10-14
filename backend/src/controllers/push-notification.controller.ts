/**
 * Push Notification Controller
 * Handles API endpoints for push notification management
 */

import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import pushNotificationService from '../services/push-notification.service';

const logger = createLogger('push-notification-controller');

export class PushNotificationController {
  /**
   * Subscribe to push notifications
   * POST /api/v1/notifications/subscribe
   */
  async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { subscription, deviceType, browserType, deviceName } = req.body;

      if (!subscription || !subscription.endpoint || !subscription.keys) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_SUBSCRIPTION',
            message: 'Valid subscription object required',
          },
        });
        return;
      }

      const result = await pushNotificationService.subscribe(userId, {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        deviceType,
        browserType,
        userAgent: req.headers['user-agent'],
        deviceName,
      });

      logger.info(`User ${userId} subscribed to push notifications`);

      res.status(200).json({
        success: true,
        data: {
          subscriptionId: result.id,
          message: 'Successfully subscribed to push notifications',
        },
      });
    } catch (error: any) {
      logger.error('Failed to subscribe to push notifications:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SUBSCRIPTION_FAILED',
          message: error.message || 'Failed to subscribe to push notifications',
        },
      });
    }
  }

  /**
   * Unsubscribe from push notifications
   * DELETE /api/v1/notifications/unsubscribe
   */
  async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const { endpoint } = req.body;

      if (!endpoint) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Endpoint required',
          },
        });
        return;
      }

      await pushNotificationService.unsubscribe(userId, endpoint);

      logger.info(`User ${userId} unsubscribed from push notifications`);

      res.status(200).json({
        success: true,
        data: {
          message: 'Successfully unsubscribed from push notifications',
        },
      });
    } catch (error: any) {
      logger.error('Failed to unsubscribe from push notifications:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UNSUBSCRIBE_FAILED',
          message: error.message || 'Failed to unsubscribe from push notifications',
        },
      });
    }
  }

  /**
   * Send notification (admin/system use)
   * POST /api/v1/notifications/send
   */
  async sendNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role;

      // Check admin permissions
      if (!userId || (userRole !== 'ADMIN' && userRole !== 'COMPANY_ADMIN')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Admin access required',
          },
        });
        return;
      }

      const {
        targetUserId,
        type,
        priority,
        channel,
        title,
        body,
        icon,
        image,
        badge,
        sound,
        data,
        actions,
        requireInteraction,
        silent,
        vibrate,
        scheduledFor,
        ttl,
        tags,
      } = req.body;

      if (!targetUserId || !title || !body || !channel) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Required fields: targetUserId, title, body, channel',
          },
        });
        return;
      }

      const notification = await pushNotificationService.sendNotification({
        userId: targetUserId,
        type: type || 'SYSTEM',
        priority: priority || 'MEDIUM',
        channel,
        payload: {
          title,
          body,
          icon,
          image,
          badge,
          sound,
          data,
          actions,
          requireInteraction,
          silent,
          vibrate,
        },
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        ttl,
        tags,
      });

      logger.info(`Admin ${userId} sent notification to user ${targetUserId}`);

      res.status(200).json({
        success: true,
        data: {
          notificationId: notification.id,
          message: 'Notification queued for delivery',
          status: notification.status,
        },
      });
    } catch (error: any) {
      logger.error('Failed to send notification:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SEND_FAILED',
          message: error.message || 'Failed to send notification',
        },
      });
    }
  }

  /**
   * Get notification history
   * GET /api/v1/notifications/history
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const {
        type,
        status,
        startDate,
        endDate,
        limit = 50,
      } = req.query;

      const notifications = await pushNotificationService.getNotificationHistory(
        userId,
        {
          type: type as string,
          status: status as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          limit: parseInt(limit as string),
        }
      );

      res.status(200).json({
        success: true,
        data: {
          notifications,
          count: notifications.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get notification history:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'HISTORY_FAILED',
          message: error.message || 'Failed to get notification history',
        },
      });
    }
  }

  /**
   * Update notification preferences
   * PUT /api/v1/notifications/preferences
   */
  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const preferences = req.body;

      const updated = await pushNotificationService.updatePreferences(
        userId,
        preferences
      );

      logger.info(`User ${userId} updated notification preferences`);

      res.status(200).json({
        success: true,
        data: {
          preferences: updated,
          message: 'Preferences updated successfully',
        },
      });
    } catch (error: any) {
      logger.error('Failed to update preferences:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error.message || 'Failed to update preferences',
        },
      });
    }
  }

  /**
   * Get notification preferences
   * GET /api/v1/notifications/preferences
   */
  async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const preferences = await pushNotificationService.getPreferences(userId);

      res.status(200).json({
        success: true,
        data: {
          preferences,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get preferences:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_PREFERENCES_FAILED',
          message: error.message || 'Failed to get preferences',
        },
      });
    }
  }

  /**
   * Get user subscriptions
   * GET /api/v1/notifications/subscriptions
   */
  async getSubscriptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      const subscriptions = await pushNotificationService.getUserSubscriptions(userId);

      res.status(200).json({
        success: true,
        data: {
          subscriptions,
          count: subscriptions.length,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get subscriptions:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_SUBSCRIPTIONS_FAILED',
          message: error.message || 'Failed to get subscriptions',
        },
      });
    }
  }

  /**
   * Send test notification
   * POST /api/v1/notifications/test
   */
  async sendTestNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
        return;
      }

      await pushNotificationService.sendImmediateNotification(userId, {
        title: 'Test Notification',
        body: 'This is a test notification from ROI Systems',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
          type: 'test',
          timestamp: new Date().toISOString(),
        },
      });

      logger.info(`Test notification sent to user ${userId}`);

      res.status(200).json({
        success: true,
        data: {
          message: 'Test notification sent successfully',
        },
      });
    } catch (error: any) {
      logger.error('Failed to send test notification:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: error.message || 'Failed to send test notification',
        },
      });
    }
  }

  /**
   * Get VAPID public key
   * GET /api/v1/notifications/vapid-public-key
   */
  async getVAPIDPublicKey(req: Request, res: Response): Promise<void> {
    try {
      const publicKey = process.env.VAPID_PUBLIC_KEY;

      if (!publicKey) {
        res.status(500).json({
          success: false,
          error: {
            code: 'VAPID_NOT_CONFIGURED',
            message: 'VAPID keys not configured',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          publicKey,
        },
      });
    } catch (error: any) {
      logger.error('Failed to get VAPID public key:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_KEY_FAILED',
          message: error.message || 'Failed to get VAPID public key',
        },
      });
    }
  }
}

export default new PushNotificationController();
