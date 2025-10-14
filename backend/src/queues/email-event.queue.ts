/**
 * Email Event Queue
 *
 * Processes email events from webhooks asynchronously
 * Separate from the main email sending queue for better throughput
 */

import Queue from 'bull';
import { createLogger } from '../utils/logger';

const logger = createLogger('email-event-queue');

/**
 * Email Event Queue
 * Handles processing of webhook events from all providers
 */
export const emailEventQueue = new Queue('email-events', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 1000, // Keep last 1000 for monitoring
    removeOnFail: false, // Keep failed for debugging
    timeout: 30000, // 30 second timeout
  },
  settings: {
    maxStalledCount: 3,
    stalledInterval: 30000,
    lockDuration: 30000,
  },
});

/**
 * Event handlers
 */
emailEventQueue.on('completed', (job, result) => {
  logger.debug(`✅ Event processed: ${job.id} - ${job.data.eventType}`);
});

emailEventQueue.on('failed', (job, err) => {
  logger.error(`❌ Event failed: ${job?.id} - ${job?.data?.eventType}`, err);
});

emailEventQueue.on('stalled', (job) => {
  logger.warn(`⚠️ Event stalled: ${job.id}`);
});

emailEventQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

/**
 * Graceful shutdown
 */
export const closeEventQueue = async (): Promise<void> => {
  try {
    await emailEventQueue.close();
    logger.info('✅ Email event queue closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing event queue:', error);
  }
};

export default emailEventQueue;
