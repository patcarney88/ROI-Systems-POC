/**
 * Alert Scoring Processor
 * Background job processor for ML-powered alert generation
 * Runs every 5 minutes to process unprocessed signals
 * Target: Alert generation within 5 minutes of signal detection
 */

import Bull from 'bull';
import { createLogger } from '../utils/logger';
import { mlScoringService } from '../services/ml-scoring.service';
import Redis from 'ioredis';

const logger = createLogger('alert-scoring-processor');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

// Create Bull Queue for alert scoring
export const alertScoringQueue = new Bull('alert-scoring', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

/**
 * Process alert scoring jobs
 */
alertScoringQueue.process(async (job: Bull.Job) => {
  const startTime = Date.now();

  try {
    logger.info(`Processing alert scoring job ${job.id}`);

    const { type, data } = job.data;

    switch (type) {
      case 'process_unprocessed_signals':
        await mlScoringService.processUnprocessedSignals(data?.limit || 100);
        break;

      case 'score_user':
        const { userId, signals } = data;
        await mlScoringService.scoreUser(userId, signals);
        break;

      case 'batch_score_users':
        const { userIds } = data;
        await mlScoringService.batchScoreUsers(userIds);
        break;

      case 'reload_models':
        await mlScoringService.reloadModels();
        break;

      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    const duration = Date.now() - startTime;
    logger.info(`Alert scoring job ${job.id} completed in ${duration}ms`);

    return { success: true, duration };
  } catch (error: any) {
    logger.error(`Alert scoring job ${job.id} failed:`, error);
    throw error;
  }
});

/**
 * Schedule recurring alert scoring job (every 5 minutes)
 */
export async function scheduleAlertScoring(): Promise<void> {
  try {
    // Check if job already scheduled
    const existingJobs = await alertScoringQueue.getRepeatableJobs();
    const jobExists = existingJobs.some(j => j.name === 'process-unprocessed-signals');

    if (jobExists) {
      logger.info('Alert scoring job already scheduled');
      return;
    }

    // Schedule recurring job every 5 minutes
    await alertScoringQueue.add(
      'process-unprocessed-signals',
      {
        type: 'process_unprocessed_signals',
        data: { limit: 1000 }
      },
      {
        repeat: {
          every: 5 * 60 * 1000, // 5 minutes
          limit: undefined // Run indefinitely
        }
      }
    );

    logger.info('Alert scoring job scheduled - running every 5 minutes');
  } catch (error) {
    logger.error('Failed to schedule alert scoring job:', error);
    throw error;
  }
}

/**
 * Queue user scoring job
 */
export async function queueUserScoring(userId: string, signals: any[]): Promise<void> {
  try {
    await alertScoringQueue.add(
      'score-user',
      {
        type: 'score_user',
        data: { userId, signals }
      },
      {
        priority: 5,
        attempts: 2
      }
    );

    logger.info(`Queued scoring job for user ${userId} with ${signals.length} signals`);
  } catch (error) {
    logger.error(`Failed to queue scoring for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Queue batch user scoring
 */
export async function queueBatchScoring(userIds: string[]): Promise<void> {
  try {
    await alertScoringQueue.add(
      'batch-score-users',
      {
        type: 'batch_score_users',
        data: { userIds }
      },
      {
        priority: 3,
        attempts: 2
      }
    );

    logger.info(`Queued batch scoring for ${userIds.length} users`);
  } catch (error) {
    logger.error('Failed to queue batch scoring:', error);
    throw error;
  }
}

/**
 * Queue model reload
 */
export async function queueModelReload(): Promise<void> {
  try {
    await alertScoringQueue.add(
      'reload-models',
      {
        type: 'reload_models',
        data: {}
      },
      {
        priority: 10, // High priority
        attempts: 1
      }
    );

    logger.info('Queued model reload job');
  } catch (error) {
    logger.error('Failed to queue model reload:', error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<any> {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      alertScoringQueue.getWaitingCount(),
      alertScoringQueue.getActiveCount(),
      alertScoringQueue.getCompletedCount(),
      alertScoringQueue.getFailedCount(),
      alertScoringQueue.getDelayedCount()
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed
    };
  } catch (error) {
    logger.error('Failed to get queue stats:', error);
    throw error;
  }
}

/**
 * Graceful shutdown
 */
export async function shutdownAlertScoringQueue(): Promise<void> {
  logger.info('Shutting down alert scoring queue...');
  await alertScoringQueue.close();
  await redis.quit();
  logger.info('Alert scoring queue shut down complete');
}

// Queue event handlers
alertScoringQueue.on('completed', (job) => {
  logger.debug(`Job ${job.id} completed`);
});

alertScoringQueue.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed:`, err);
});

alertScoringQueue.on('stalled', (job) => {
  logger.warn(`Job ${job.id} stalled`);
});

// Graceful shutdown handlers
process.on('SIGTERM', async () => {
  await shutdownAlertScoringQueue();
});

process.on('SIGINT', async () => {
  await shutdownAlertScoringQueue();
});

// Start scheduled job on module load
scheduleAlertScoring().catch(err => {
  logger.error('Failed to start alert scoring scheduler:', err);
});

logger.info('Alert scoring processor initialized');
