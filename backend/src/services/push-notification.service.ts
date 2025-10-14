/**
 * Push Notification Service
 * Comprehensive push notification system supporting Web Push Protocol and FCM
 * Handles subscription management, notification queuing, delivery, and analytics
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import webpush, { PushSubscription as WebPushSubscription } from 'web-push';
import * as admin from 'firebase-admin';

const logger = createLogger('push-notification');
const db = new PrismaClient();

// Initialize Web Push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@roisystems.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// Initialize Firebase Admin SDK for FCM
let fcmInitialized = false;
if (process.env.FCM_SERVER_KEY && process.env.FCM_PROJECT_ID) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FCM_PROJECT_ID,
        privateKey: process.env.FCM_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FCM_CLIENT_EMAIL,
      }),
    });
    fcmInitialized = true;
    logger.info('Firebase Cloud Messaging initialized');
  } catch (error) {
    logger.warn('FCM initialization skipped - credentials not configured');
  }
}

export interface SubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  deviceType?: string;
  browserType?: string;
  userAgent?: string;
  deviceName?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;
  sound?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface SendNotificationOptions {
  userId: string;
  type: string;
  priority?: string;
  channel: string;
  payload: NotificationPayload;
  scheduledFor?: Date;
  ttl?: number;
  tags?: string[];
  templateId?: string;
}

export interface UserPreferences {
  enabled?: boolean;
  doNotDisturbStart?: number;
  doNotDisturbEnd?: number;
  timezone?: string;
  businessAlerts?: boolean;
  documentUpdates?: boolean;
  propertyValues?: boolean;
  marketReports?: boolean;
  maintenance?: boolean;
  marketing?: boolean;
  systemAlerts?: boolean;
  minPriority?: string;
  webPush?: boolean;
  batchNotifications?: boolean;
  batchInterval?: number;
  maxPerHour?: number;
  maxPerDay?: number;
}

export class PushNotificationService {
  /**
   * Subscribe user to push notifications
   */
  async subscribe(
    userId: string,
    subscription: SubscriptionData
  ): Promise<any> {
    try {
      logger.info(`Subscribing user ${userId} to push notifications`);

      // Check if subscription already exists
      const existing = await db.pushSubscription.findFirst({
        where: {
          userId,
          endpoint: subscription.endpoint,
        },
      });

      if (existing) {
        // Update existing subscription
        const updated = await db.pushSubscription.update({
          where: { id: existing.id },
          data: {
            p256dh: subscription.keys.p256dh,
            auth: subscription.keys.auth,
            deviceType: subscription.deviceType || existing.deviceType,
            browserType: subscription.browserType || existing.browserType,
            userAgent: subscription.userAgent || existing.userAgent,
            deviceName: subscription.deviceName || existing.deviceName,
            active: true,
            lastUsedAt: new Date(),
            failureCount: 0,
          },
        });

        logger.info(`Updated push subscription for user ${userId}`);
        return updated;
      }

      // Create new subscription
      const newSubscription = await db.pushSubscription.create({
        data: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          deviceType: subscription.deviceType || 'web',
          browserType: subscription.browserType,
          userAgent: subscription.userAgent,
          deviceName: subscription.deviceName,
          active: true,
          lastUsedAt: new Date(),
        },
      });

      logger.info(`Created new push subscription for user ${userId}`);
      return newSubscription;
    } catch (error: any) {
      logger.error(`Failed to subscribe user ${userId}:`, error);
      throw new Error(`Subscription failed: ${error.message}`);
    }
  }

  /**
   * Unsubscribe user from push notifications
   */
  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    try {
      logger.info(`Unsubscribing user ${userId} from endpoint ${endpoint}`);

      const subscription = await db.pushSubscription.findFirst({
        where: { userId, endpoint },
      });

      if (!subscription) {
        logger.warn(`Subscription not found for user ${userId} and endpoint`);
        return;
      }

      await db.pushSubscription.update({
        where: { id: subscription.id },
        data: {
          active: false,
          unsubscribedAt: new Date(),
        },
      });

      logger.info(`Unsubscribed user ${userId} from push notifications`);
    } catch (error: any) {
      logger.error(`Failed to unsubscribe user ${userId}:`, error);
      throw new Error(`Unsubscribe failed: ${error.message}`);
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(options: SendNotificationOptions): Promise<any> {
    try {
      const {
        userId,
        type,
        priority = 'MEDIUM',
        channel,
        payload,
        scheduledFor,
        ttl = 86400,
        tags = [],
        templateId,
      } = options;

      logger.info(`Queuing notification for user ${userId}: ${payload.title}`);

      // Check user preferences
      const canSend = await this.checkUserPreferences(userId, channel, priority);
      if (!canSend) {
        logger.info(`Notification blocked by user preferences for user ${userId}`);
        return null;
      }

      // Check Do Not Disturb
      const isDND = await this.isDoNotDisturb(userId);
      if (isDND && priority !== 'CRITICAL') {
        logger.info(`Notification deferred due to Do Not Disturb for user ${userId}`);
        // Schedule for after DND period
        const dndEndTime = await this.getDNDEndTime(userId);
        scheduledFor = dndEndTime || scheduledFor;
      }

      // Create notification in queue
      const notification = await db.notificationQueue.create({
        data: {
          userId,
          type: type as any,
          priority: priority as any,
          channel,
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          image: payload.image,
          badge: payload.badge,
          sound: payload.sound,
          actions: payload.actions || [],
          data: payload.data || {},
          requireInteraction: payload.requireInteraction || false,
          silent: payload.silent || false,
          vibrate: payload.vibrate || [],
          tags,
          scheduledFor: scheduledFor || new Date(),
          expiresAt: new Date(Date.now() + ttl * 1000),
          ttl,
          templateId,
          status: scheduledFor ? 'PENDING' : 'QUEUED',
        },
      });

      logger.info(`Notification queued with ID ${notification.id}`);

      // If immediate delivery, process now
      if (!scheduledFor || scheduledFor <= new Date()) {
        await this.processNotification(notification.id);
      }

      return notification;
    } catch (error: any) {
      logger.error(`Failed to send notification:`, error);
      throw new Error(`Send notification failed: ${error.message}`);
    }
  }

  /**
   * Send immediate notification (bypasses queue for critical alerts)
   */
  async sendImmediateNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      logger.info(`Sending immediate notification to user ${userId}`);

      const subscriptions = await db.pushSubscription.findMany({
        where: {
          userId,
          active: true,
        },
      });

      if (subscriptions.length === 0) {
        logger.warn(`No active subscriptions for user ${userId}`);
        return;
      }

      // Send to all active subscriptions
      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          this.deliverToSubscription(sub, payload)
        )
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      logger.info(`Immediate notification sent to ${successCount}/${subscriptions.length} devices`);
    } catch (error: any) {
      logger.error(`Failed to send immediate notification:`, error);
      throw error;
    }
  }

  /**
   * Schedule notification for future delivery
   */
  async scheduleNotification(
    userId: string,
    payload: NotificationPayload,
    scheduledFor: Date
  ): Promise<any> {
    return this.sendNotification({
      userId,
      type: 'SYSTEM',
      priority: 'MEDIUM',
      channel: 'system',
      payload,
      scheduledFor,
    });
  }

  /**
   * Process notification queue (called by scheduler)
   */
  async processQueue(): Promise<void> {
    try {
      const now = new Date();

      // Get pending notifications that are ready to send
      const notifications = await db.notificationQueue.findMany({
        where: {
          status: { in: ['PENDING', 'QUEUED'] },
          scheduledFor: { lte: now },
          expiresAt: { gte: now },
          attempts: { lt: db.notificationQueue.fields.maxAttempts },
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' },
        ],
        take: parseInt(process.env.NOTIFICATION_BATCH_SIZE || '100'),
      });

      logger.info(`Processing ${notifications.length} notifications from queue`);

      for (const notification of notifications) {
        await this.processNotification(notification.id);
      }
    } catch (error: any) {
      logger.error('Failed to process notification queue:', error);
    }
  }

  /**
   * Process single notification
   */
  private async processNotification(notificationId: string): Promise<void> {
    try {
      const notification = await db.notificationQueue.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        logger.error(`Notification ${notificationId} not found`);
        return;
      }

      // Check if expired
      if (notification.expiresAt && notification.expiresAt < new Date()) {
        await db.notificationQueue.update({
          where: { id: notificationId },
          data: { status: 'EXPIRED' },
        });
        logger.info(`Notification ${notificationId} expired`);
        return;
      }

      // Update status to sending
      await db.notificationQueue.update({
        where: { id: notificationId },
        data: {
          status: 'SENDING',
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
        },
      });

      // Get user subscriptions
      const subscriptions = await db.pushSubscription.findMany({
        where: {
          userId: notification.userId,
          active: true,
        },
      });

      if (subscriptions.length === 0) {
        logger.warn(`No active subscriptions for user ${notification.userId}`);
        await db.notificationQueue.update({
          where: { id: notificationId },
          data: {
            status: 'FAILED',
            lastError: 'No active subscriptions',
          },
        });
        return;
      }

      // Prepare payload
      const payload: NotificationPayload = {
        title: notification.title,
        body: notification.body,
        icon: notification.icon || undefined,
        image: notification.image || undefined,
        badge: notification.badge || undefined,
        sound: notification.sound || undefined,
        data: (notification.data as any) || {},
        actions: (notification.actions as any) || [],
        requireInteraction: notification.requireInteraction,
        silent: notification.silent,
        vibrate: notification.vibrate || [],
      };

      // Send to all subscriptions
      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          this.deliverToSubscription(sub, payload, notificationId)
        )
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failureCount = results.filter((r) => r.status === 'rejected').length;

      // Update notification status
      const allFailed = successCount === 0;
      const allSucceeded = failureCount === 0;

      let status: string;
      if (allSucceeded) {
        status = 'DELIVERED';
      } else if (allFailed && notification.attempts >= notification.maxAttempts) {
        status = 'FAILED';
      } else if (allFailed) {
        // Retry later
        status = 'QUEUED';
        const retryDelay = Math.min(
          Math.pow(2, notification.attempts) * 60000,
          3600000
        ); // Exponential backoff, max 1 hour
        await db.notificationQueue.update({
          where: { id: notificationId },
          data: {
            status: status as any,
            nextRetryAt: new Date(Date.now() + retryDelay),
          },
        });
        return;
      } else {
        status = 'SENT'; // Partial success
      }

      await db.notificationQueue.update({
        where: { id: notificationId },
        data: {
          status: status as any,
          sentAt: new Date(),
          deliveredAt: allSucceeded ? new Date() : null,
        },
      });

      logger.info(`Notification ${notificationId} processed: ${successCount}/${subscriptions.length} devices`);
    } catch (error: any) {
      logger.error(`Failed to process notification ${notificationId}:`, error);

      // Update with error and schedule retry
      await db.notificationQueue.update({
        where: { id: notificationId },
        data: {
          status: 'FAILED',
          lastError: error.message,
          errorCode: error.code || 'UNKNOWN',
        },
      });
    }
  }

  /**
   * Deliver notification to specific subscription
   */
  private async deliverToSubscription(
    subscription: any,
    payload: NotificationPayload,
    notificationId?: string
  ): Promise<void> {
    const startTime = Date.now();

    try {
      // Build Web Push subscription object
      const pushSubscription: WebPushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      };

      // Send notification
      const response = await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload),
        {
          TTL: 86400, // 24 hours
          urgency: this.getUrgencyFromPriority(payload.data?.priority || 'MEDIUM'),
        }
      );

      const deliveryTime = Date.now() - startTime;

      // Update subscription last used
      await db.pushSubscription.update({
        where: { id: subscription.id },
        data: {
          lastUsedAt: new Date(),
          failureCount: 0,
        },
      });

      // Log successful delivery
      if (notificationId) {
        await db.deliveryLog.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            notificationId,
            type: payload.data?.type || 'SYSTEM',
            priority: payload.data?.priority || 'MEDIUM',
            attemptNumber: 1,
            status: 'SUCCESS',
            statusCode: response.statusCode,
            delivered: true,
            deliveryTime,
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        });
      }

      logger.debug(`Notification delivered to ${subscription.endpoint} in ${deliveryTime}ms`);
    } catch (error: any) {
      const deliveryTime = Date.now() - startTime;

      // Handle subscription errors
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription expired or invalid
        logger.warn(`Subscription expired for ${subscription.id}, marking inactive`);
        await db.pushSubscription.update({
          where: { id: subscription.id },
          data: {
            active: false,
            lastFailureAt: new Date(),
          },
        });
      } else {
        // Increment failure count
        await db.pushSubscription.update({
          where: { id: subscription.id },
          data: {
            failureCount: { increment: 1 },
            lastFailureAt: new Date(),
          },
        });
      }

      // Log failed delivery
      if (notificationId) {
        await db.deliveryLog.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            notificationId,
            type: payload.data?.type || 'SYSTEM',
            priority: payload.data?.priority || 'MEDIUM',
            attemptNumber: 1,
            status: 'FAILED',
            statusCode: error.statusCode,
            errorType: this.getErrorType(error),
            errorMessage: error.message,
            deliveryTime,
            sentAt: new Date(),
          },
        });
      }

      throw error;
    }
  }

  /**
   * Get notification history for user
   */
  async getNotificationHistory(
    userId: string,
    filters?: {
      type?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    }
  ): Promise<any[]> {
    try {
      const where: any = { userId };

      if (filters?.type) where.type = filters.type;
      if (filters?.status) where.status = filters.status;
      if (filters?.startDate || filters?.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      const notifications = await db.notificationQueue.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: filters?.limit || 50,
      });

      return notifications;
    } catch (error: any) {
      logger.error(`Failed to get notification history for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: UserPreferences
  ): Promise<any> {
    try {
      logger.info(`Updating notification preferences for user ${userId}`);

      const existing = await db.userNotificationPreferences.findUnique({
        where: { userId },
      });

      if (existing) {
        return await db.userNotificationPreferences.update({
          where: { userId },
          data: preferences as any,
        });
      }

      return await db.userNotificationPreferences.create({
        data: {
          userId,
          ...preferences,
        } as any,
      });
    } catch (error: any) {
      logger.error(`Failed to update preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user notification preferences
   */
  async getPreferences(userId: string): Promise<any> {
    try {
      let preferences = await db.userNotificationPreferences.findUnique({
        where: { userId },
      });

      if (!preferences) {
        // Create default preferences
        preferences = await db.userNotificationPreferences.create({
          data: { userId },
        });
      }

      return preferences;
    } catch (error: any) {
      logger.error(`Failed to get preferences for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      return await db.pushSubscription.findMany({
        where: { userId, active: true },
        orderBy: { lastUsedAt: 'desc' },
      });
    } catch (error: any) {
      logger.error(`Failed to get subscriptions for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if notification can be sent based on user preferences
   */
  private async checkUserPreferences(
    userId: string,
    channel: string,
    priority: string
  ): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);

      if (!prefs.enabled || !prefs.webPush) {
        return false;
      }

      // Check channel preferences
      const channelMap: Record<string, keyof typeof prefs> = {
        business_alerts: 'businessAlerts',
        documents: 'documentUpdates',
        properties: 'propertyValues',
        market_reports: 'marketReports',
        maintenance: 'maintenance',
        marketing: 'marketing',
        system: 'systemAlerts',
      };

      const channelPref = channelMap[channel];
      if (channelPref && !prefs[channelPref]) {
        return false;
      }

      // Check priority filtering
      if (prefs.criticalOnly && priority !== 'CRITICAL') {
        return false;
      }

      const priorityLevels = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };
      const userMinLevel = priorityLevels[prefs.minPriority as keyof typeof priorityLevels] || 1;
      const notificationLevel = priorityLevels[priority as keyof typeof priorityLevels] || 2;

      if (notificationLevel < userMinLevel) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Failed to check user preferences:', error);
      return true; // Default to allowing notifications
    }
  }

  /**
   * Check if user is in Do Not Disturb period
   */
  private async isDoNotDisturb(userId: string): Promise<boolean> {
    try {
      const prefs = await this.getPreferences(userId);

      if (!prefs.doNotDisturbStart || !prefs.doNotDisturbEnd) {
        return false;
      }

      const now = new Date();
      const currentHour = now.getHours();

      const start = prefs.doNotDisturbStart;
      const end = prefs.doNotDisturbEnd;

      // Handle overnight DND (e.g., 22:00 to 08:00)
      if (start > end) {
        return currentHour >= start || currentHour < end;
      }

      // Handle same-day DND (e.g., 12:00 to 14:00)
      return currentHour >= start && currentHour < end;
    } catch (error) {
      logger.error('Failed to check Do Not Disturb:', error);
      return false;
    }
  }

  /**
   * Get DND end time for scheduling
   */
  private async getDNDEndTime(userId: string): Promise<Date | null> {
    try {
      const prefs = await this.getPreferences(userId);

      if (!prefs.doNotDisturbEnd) {
        return null;
      }

      const now = new Date();
      const endTime = new Date(now);
      endTime.setHours(prefs.doNotDisturbEnd, 0, 0, 0);

      // If end time is in the past today, schedule for tomorrow
      if (endTime < now) {
        endTime.setDate(endTime.getDate() + 1);
      }

      return endTime;
    } catch (error) {
      logger.error('Failed to get DND end time:', error);
      return null;
    }
  }

  /**
   * Get urgency level for Web Push
   */
  private getUrgencyFromPriority(priority: string): 'very-low' | 'low' | 'normal' | 'high' {
    const urgencyMap: Record<string, 'very-low' | 'low' | 'normal' | 'high'> = {
      LOW: 'low',
      MEDIUM: 'normal',
      HIGH: 'high',
      CRITICAL: 'high',
    };
    return urgencyMap[priority] || 'normal';
  }

  /**
   * Get error type from error object
   */
  private getErrorType(error: any): string {
    if (error.statusCode === 410) return 'expired';
    if (error.statusCode === 404) return 'invalid_subscription';
    if (error.statusCode >= 400 && error.statusCode < 500) return 'client_error';
    if (error.statusCode >= 500) return 'server_error';
    return 'network';
  }

  /**
   * Generate VAPID keys (for initial setup)
   */
  static generateVAPIDKeys(): any {
    return webpush.generateVAPIDKeys();
  }

  /**
   * Get VAPID public key
   */
  static getVAPIDPublicKey(): string | undefined {
    return process.env.VAPID_PUBLIC_KEY;
  }
}

export default new PushNotificationService();
