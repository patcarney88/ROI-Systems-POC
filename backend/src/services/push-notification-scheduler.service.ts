/**
 * Push Notification Scheduler Service
 * Handles scheduled queue processing for push notifications
 */

import cron from 'node-cron';
import { createLogger } from '../utils/logger';
import pushNotificationService from './push-notification.service';

const logger = createLogger('push-notification-scheduler');

export class PushNotificationScheduler {
  private queueProcessorTask: cron.ScheduledTask | null = null;

  /**
   * Start scheduled tasks
   */
  start(): void {
    logger.info('Starting push notification scheduler');

    // Process notification queue every 30 seconds
    this.queueProcessorTask = cron.schedule('*/30 * * * * *', async () => {
      try {
        await pushNotificationService.processQueue();
      } catch (error) {
        logger.error('Queue processing failed:', error);
      }
    });

    logger.info('Push notification scheduler started - processing queue every 30 seconds');
  }

  /**
   * Stop scheduled tasks
   */
  stop(): void {
    logger.info('Stopping push notification scheduler');

    if (this.queueProcessorTask) {
      this.queueProcessorTask.stop();
      this.queueProcessorTask = null;
    }

    logger.info('Push notification scheduler stopped');
  }
}

export default new PushNotificationScheduler();
