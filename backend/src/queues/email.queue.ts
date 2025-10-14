/**
 * Email Queue using Bull
 * Handles high-volume email processing with retry logic
 * Target: 10,000+ emails per hour
 */

import Queue, { Job, JobOptions } from 'bull';
import { redis, redisSubscriber } from '../config/redis';
import { createLogger } from '../utils/logger';

const logger = createLogger('email-queue');

// Job data interfaces
export interface EmailJobData {
  queueItemId: string;
  campaignId: string;
  subscriberId: string;
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;

  // Personalization
  mergeData?: Record<string, any>;

  // Tracking
  unsubscribeUrl?: string;
  trackingPixelUrl?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
  };

  // Metadata
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface BulkEmailJobData {
  campaignId: string;
  subscriberIds: string[];
  priority?: number;
}

// Default job options
const defaultJobOptions: JobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // Start with 2 second delay
  },
  removeOnComplete: 100, // Keep last 100 completed jobs for monitoring
  removeOnFail: false, // Keep failed jobs for debugging
  timeout: 30000, // 30 second timeout per email
};

/**
 * Email Queue instance
 * Processes individual email sending jobs
 */
export const emailQueue = new Queue<EmailJobData>('email-sending', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions,
  settings: {
    maxStalledCount: 3, // Retry stalled jobs 3 times
    stalledInterval: 30000, // Check for stalled jobs every 30 seconds
    lockDuration: 30000, // Lock jobs for 30 seconds
  },
});

/**
 * Campaign Queue
 * Handles campaign-level operations (creating bulk jobs)
 */
export const campaignQueue = new Queue<BulkEmailJobData>('campaign-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    ...defaultJobOptions,
    attempts: 1, // Campaigns don't retry at this level
    timeout: 300000, // 5 minutes for campaign processing
  },
});

/**
 * Add email to queue
 */
export const queueEmail = async (
  data: EmailJobData,
  options?: JobOptions
): Promise<Job<EmailJobData>> => {
  try {
    const job = await emailQueue.add(data, {
      ...defaultJobOptions,
      ...options,
      jobId: data.queueItemId, // Use queue item ID as job ID for tracking
    });

    logger.info(`📧 Email queued: ${job.id} - ${data.to}`);
    return job;
  } catch (error) {
    logger.error('Failed to queue email:', error);
    throw error;
  }
};

/**
 * Add bulk emails to queue
 * Optimized for high-volume campaign sending
 */
export const queueBulkEmails = async (
  emails: EmailJobData[],
  priority: number = 5
): Promise<Job<EmailJobData>[]> => {
  try {
    const jobs = emails.map((email) => ({
      data: email,
      opts: {
        ...defaultJobOptions,
        priority,
        jobId: email.queueItemId,
      },
    }));

    const addedJobs = await emailQueue.addBulk(jobs);
    logger.info(`📧 Bulk queued: ${addedJobs.length} emails (priority: ${priority})`);

    return addedJobs;
  } catch (error) {
    logger.error('Failed to queue bulk emails:', error);
    throw error;
  }
};

/**
 * Process campaign (create individual email jobs)
 */
export const queueCampaign = async (
  data: BulkEmailJobData,
  options?: JobOptions
): Promise<Job<BulkEmailJobData>> => {
  try {
    const job = await campaignQueue.add(data, {
      ...options,
      priority: data.priority || 5,
    });

    logger.info(`📨 Campaign queued: ${job.id} - ${data.subscriberIds.length} recipients`);
    return job;
  } catch (error) {
    logger.error('Failed to queue campaign:', error);
    throw error;
  }
};

/**
 * Get job by ID
 */
export const getEmailJob = async (jobId: string): Promise<Job<EmailJobData> | null> => {
  try {
    return await emailQueue.getJob(jobId);
  } catch (error) {
    logger.error(`Failed to get job ${jobId}:`, error);
    return null;
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  try {
    const [
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
    ] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
      emailQueue.getPausedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + delayed,
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    throw error;
  }
};

/**
 * Pause queue
 */
export const pauseQueue = async (): Promise<void> => {
  await emailQueue.pause();
  logger.info('⏸️  Email queue paused');
};

/**
 * Resume queue
 */
export const resumeQueue = async (): Promise<void> => {
  await emailQueue.resume();
  logger.info('▶️  Email queue resumed');
};

/**
 * Clean old jobs
 * Remove completed jobs older than specified time
 */
export const cleanQueue = async (olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> => {
  try {
    await emailQueue.clean(olderThanMs, 'completed');
    await emailQueue.clean(olderThanMs * 7, 'failed'); // Keep failed jobs longer
    logger.info(`🧹 Queue cleaned (older than ${olderThanMs}ms)`);
  } catch (error) {
    logger.error('Failed to clean queue:', error);
  }
};

/**
 * Remove specific job
 */
export const removeJob = async (jobId: string): Promise<void> => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`🗑️  Job removed: ${jobId}`);
    }
  } catch (error) {
    logger.error(`Failed to remove job ${jobId}:`, error);
  }
};

/**
 * Retry failed job
 */
export const retryJob = async (jobId: string): Promise<void> => {
  try {
    const job = await emailQueue.getJob(jobId);
    if (job) {
      await job.retry();
      logger.info(`🔄 Job retried: ${jobId}`);
    }
  } catch (error) {
    logger.error(`Failed to retry job ${jobId}:`, error);
  }
};

/**
 * Get failed jobs
 */
export const getFailedJobs = async (start = 0, end = 100): Promise<Job<EmailJobData>[]> => {
  try {
    return await emailQueue.getFailed(start, end);
  } catch (error) {
    logger.error('Failed to get failed jobs:', error);
    return [];
  }
};

/**
 * Retry all failed jobs
 */
export const retryAllFailedJobs = async (): Promise<void> => {
  try {
    const failedJobs = await emailQueue.getFailed();

    for (const job of failedJobs) {
      await job.retry();
    }

    logger.info(`🔄 Retried ${failedJobs.length} failed jobs`);
  } catch (error) {
    logger.error('Failed to retry all jobs:', error);
  }
};

/**
 * Event handlers
 */
emailQueue.on('completed', (job, result) => {
  logger.info(`✅ Email sent: ${job.id} - ${job.data.to}`);
});

emailQueue.on('failed', (job, err) => {
  logger.error(`❌ Email failed: ${job?.id} - ${job?.data.to}`, err);
});

emailQueue.on('stalled', (job) => {
  logger.warn(`⚠️  Email stalled: ${job.id}`);
});

emailQueue.on('progress', (job, progress) => {
  logger.debug(`📊 Email progress: ${job.id} - ${progress}%`);
});

emailQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

/**
 * Graceful shutdown
 */
export const closeQueues = async (): Promise<void> => {
  try {
    await emailQueue.close();
    await campaignQueue.close();
    logger.info('✅ Queues closed gracefully');
  } catch (error) {
    logger.error('❌ Error closing queues:', error);
  }
};

// Export queue instances for processor registration
export default {
  emailQueue,
  campaignQueue,
};
