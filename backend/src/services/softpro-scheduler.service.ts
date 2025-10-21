/**
 * SoftPro Scheduler Service
 * Manages scheduled sync jobs and automated data synchronization
 *
 * Features:
 * - Cron-based scheduled syncs
 * - Per-integration sync frequency
 * - Staggered execution to avoid rate limits
 * - Automatic catch-up for missed syncs
 * - Dynamic schedule updates
 * - Health monitoring
 */

import * as cron from 'node-cron';
import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import { softProQueueProcessor } from '../workers/softpro-queue-processor';

const logger = createLogger('softpro-scheduler-service');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ScheduleConfig {
  integrationId: string;
  frequency: number; // in minutes
  syncTypes: ('transactions' | 'contacts' | 'documents')[];
  enabled: boolean;
}

export interface SchedulerStatus {
  integrationId: string;
  isActive: boolean;
  nextSyncTime: Date | null;
  lastSyncTime: Date | null;
  cronExpression: string;
}

// ============================================================================
// SOFTPRO SCHEDULER SERVICE
// ============================================================================

export class SoftProSchedulerService {
  private scheduledTasks: Map<string, cron.ScheduledTask>;
  private readonly MIN_SYNC_INTERVAL = 5; // 5 minutes minimum

  constructor() {
    this.scheduledTasks = new Map();
    this.initializeSchedulers();
  }

  /**
   * Initialize schedulers for all active integrations
   */
  private async initializeSchedulers(): Promise<void> {
    try {
      logger.info('🚀 Initializing schedulers for active integrations...');

      const integrations = await db.softProIntegration.findMany({
        where: {
          active: true,
          syncEnabled: true,
        },
      });

      for (const integration of integrations) {
        await this.startScheduler(
          integration.id,
          integration.syncFrequency || 15,
          integration.syncTypes as any
        );
      }

      logger.info(`✅ Initialized ${integrations.length} schedulers`);
    } catch (error) {
      logger.error('❌ Error initializing schedulers:', error);
    }
  }

  /**
   * Start scheduler for an integration
   */
  async startScheduler(
    integrationId: string,
    frequency: number = 15,
    syncTypes: ('transactions' | 'contacts' | 'documents')[] = [
      'transactions',
      'contacts',
      'documents',
    ]
  ): Promise<void> {
    try {
      // Validate frequency
      if (frequency < this.MIN_SYNC_INTERVAL) {
        logger.warn(
          `Frequency ${frequency}m too low, using minimum ${this.MIN_SYNC_INTERVAL}m`
        );
        frequency = this.MIN_SYNC_INTERVAL;
      }

      // Stop existing scheduler if any
      this.stopScheduler(integrationId);

      // Convert frequency to cron expression
      const cronExpression = this.frequencyToCron(frequency);

      logger.info(`⏰ Starting scheduler for ${integrationId}: ${cronExpression}`);

      // Create scheduled task
      const task = cron.schedule(cronExpression, async () => {
        await this.executeScheduledSync(integrationId, syncTypes);
      });

      this.scheduledTasks.set(integrationId, task);

      // Store schedule info in Redis
      await this.storeScheduleInfo(integrationId, {
        frequency,
        cronExpression,
        syncTypes,
        startedAt: new Date(),
      });

      logger.info(`✅ Scheduler started for ${integrationId}`);
    } catch (error) {
      logger.error(`❌ Error starting scheduler for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Stop scheduler for an integration
   */
  stopScheduler(integrationId: string): void {
    try {
      const task = this.scheduledTasks.get(integrationId);

      if (task) {
        task.stop();
        this.scheduledTasks.delete(integrationId);
        logger.info(`⏹️ Scheduler stopped for ${integrationId}`);
      }
    } catch (error) {
      logger.error(`❌ Error stopping scheduler for ${integrationId}:`, error);
    }
  }

  /**
   * Update schedule for an integration
   */
  async updateSchedule(integrationId: string, newFrequency: number): Promise<void> {
    try {
      logger.info(`🔄 Updating schedule for ${integrationId} to ${newFrequency}m`);

      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      // Update database
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: { syncFrequency: newFrequency },
      });

      // Restart scheduler with new frequency
      await this.startScheduler(
        integrationId,
        newFrequency,
        integration.syncTypes as any
      );

      logger.info(`✅ Schedule updated for ${integrationId}`);
    } catch (error) {
      logger.error(`❌ Error updating schedule for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Execute scheduled sync
   */
  async executeScheduledSync(
    integrationId: string,
    syncTypes: ('transactions' | 'contacts' | 'documents')[]
  ): Promise<void> {
    const startTime = Date.now();

    try {
      logger.info(`📅 Executing scheduled sync for ${integrationId}`);

      // Check if integration is still active
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration || !integration.active) {
        logger.warn(`Integration ${integrationId} is not active, skipping sync`);
        this.stopScheduler(integrationId);
        return;
      }

      // Check for sync lock (prevent concurrent syncs)
      const lockKey = `sync:lock:${integrationId}`;
      const hasLock = await this.acquireSyncLock(lockKey);

      if (!hasLock) {
        logger.warn(`Sync already in progress for ${integrationId}, skipping`);
        return;
      }

      try {
        // Get last sync time
        const lastSyncTime = integration.lastSyncAt;

        // Queue sync jobs for each type with staggered delays
        let delay = 0;
        const delayIncrement = 10000; // 10 seconds between each sync type

        for (const syncType of syncTypes) {
          await softProQueueProcessor.addSyncJob({
            integrationId,
            syncType,
            lastSyncTime: lastSyncTime || undefined,
            batchSize: 100,
          });

          delay += delayIncrement;
        }

        // Update last scheduled sync time
        await db.softProIntegration.update({
          where: { id: integrationId },
          data: {
            lastScheduledSyncAt: new Date(),
          },
        });

        const duration = Date.now() - startTime;
        logger.info(`✅ Scheduled sync queued for ${integrationId} (${duration}ms)`);
      } finally {
        // Release lock
        await this.releaseSyncLock(lockKey);
      }
    } catch (error) {
      logger.error(`❌ Error executing scheduled sync for ${integrationId}:`, error);

      // Update integration with error
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          lastSyncError: (error as Error).message,
        },
      });
    }
  }

  /**
   * Get next sync time for an integration
   */
  getNextSyncTime(integrationId: string): Date | null {
    try {
      const task = this.scheduledTasks.get(integrationId);

      if (!task) {
        return null;
      }

      // Get schedule info from Redis
      const scheduleInfo = this.getScheduleInfo(integrationId);

      if (!scheduleInfo) {
        return null;
      }

      // Calculate next run time based on frequency
      const lastSync = scheduleInfo.lastSyncTime || new Date();
      const frequencyMs = scheduleInfo.frequency * 60 * 1000;
      const nextSync = new Date(lastSync.getTime() + frequencyMs);

      return nextSync;
    } catch (error) {
      logger.error(`Error getting next sync time for ${integrationId}:`, error);
      return null;
    }
  }

  /**
   * Get scheduler status for an integration
   */
  async getSchedulerStatus(integrationId: string): Promise<SchedulerStatus | null> {
    try {
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        return null;
      }

      const task = this.scheduledTasks.get(integrationId);
      const cronExpression = this.frequencyToCron(integration.syncFrequency || 15);

      return {
        integrationId,
        isActive: task !== undefined && integration.active && integration.syncEnabled,
        nextSyncTime: this.getNextSyncTime(integrationId),
        lastSyncTime: integration.lastSyncAt,
        cronExpression,
      };
    } catch (error) {
      logger.error(`Error getting scheduler status for ${integrationId}:`, error);
      return null;
    }
  }

  /**
   * Get all active schedulers
   */
  async getAllSchedulerStatuses(): Promise<SchedulerStatus[]> {
    try {
      const integrationIds = Array.from(this.scheduledTasks.keys());
      const statuses = await Promise.all(
        integrationIds.map((id) => this.getSchedulerStatus(id))
      );

      return statuses.filter((s) => s !== null) as SchedulerStatus[];
    } catch (error) {
      logger.error('Error getting all scheduler statuses:', error);
      return [];
    }
  }

  /**
   * Perform catch-up sync for missed syncs
   */
  async performCatchupSync(integrationId: string): Promise<void> {
    try {
      logger.info(`🔄 Performing catch-up sync for ${integrationId}`);

      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      // Calculate how many syncs were missed
      const lastSyncTime = integration.lastSyncAt || integration.createdAt;
      const now = new Date();
      const timeSinceLastSync = now.getTime() - lastSyncTime.getTime();
      const syncInterval = (integration.syncFrequency || 15) * 60 * 1000;
      const missedSyncs = Math.floor(timeSinceLastSync / syncInterval);

      if (missedSyncs > 0) {
        logger.info(`⚠️ ${missedSyncs} missed syncs detected for ${integrationId}`);

        // Queue catch-up sync with higher batch size
        const syncTypes = integration.syncTypes as any;

        for (const syncType of syncTypes) {
          await softProQueueProcessor.addSyncJob({
            integrationId,
            syncType,
            lastSyncTime: lastSyncTime,
            batchSize: 500, // Larger batch for catch-up
            options: {
              catchup: true,
              missedSyncs,
            },
          });
        }

        logger.info(`✅ Catch-up sync queued for ${integrationId}`);
      } else {
        logger.info(`✨ No missed syncs for ${integrationId}`);
      }
    } catch (error) {
      logger.error(`❌ Error performing catch-up sync for ${integrationId}:`, error);
      throw error;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Convert frequency (in minutes) to cron expression
   */
  private frequencyToCron(frequencyMinutes: number): string {
    if (frequencyMinutes < 60) {
      // Every X minutes
      return `*/${frequencyMinutes} * * * *`;
    } else if (frequencyMinutes === 60) {
      // Every hour
      return '0 * * * *';
    } else if (frequencyMinutes % 60 === 0) {
      // Every X hours
      const hours = frequencyMinutes / 60;
      return `0 */${hours} * * *`;
    } else {
      // Default to every 15 minutes
      return '*/15 * * * *';
    }
  }

  /**
   * Acquire sync lock using Redis
   */
  private async acquireSyncLock(lockKey: string): Promise<boolean> {
    try {
      const lockTTL = 600; // 10 minutes
      const result = await redis.set(lockKey, '1', 'EX', lockTTL, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('Error acquiring sync lock:', error);
      return false;
    }
  }

  /**
   * Release sync lock
   */
  private async releaseSyncLock(lockKey: string): Promise<void> {
    try {
      await redis.del(lockKey);
    } catch (error) {
      logger.error('Error releasing sync lock:', error);
    }
  }

  /**
   * Store schedule info in Redis
   */
  private async storeScheduleInfo(integrationId: string, info: any): Promise<void> {
    try {
      const key = `schedule:info:${integrationId}`;
      await redis.setex(key, 86400, JSON.stringify(info)); // 24 hour TTL
    } catch (error) {
      logger.error('Error storing schedule info:', error);
    }
  }

  /**
   * Get schedule info from Redis
   */
  private getScheduleInfo(integrationId: string): any {
    try {
      const key = `schedule:info:${integrationId}`;
      const data = redis.get(key);
      return data ? JSON.parse(data as string) : null;
    } catch (error) {
      logger.error('Error getting schedule info:', error);
      return null;
    }
  }

  /**
   * Shutdown all schedulers gracefully
   */
  async shutdown(): Promise<void> {
    try {
      logger.info('📭 Shutting down all schedulers...');

      for (const [integrationId, task] of this.scheduledTasks.entries()) {
        task.stop();
        logger.info(`⏹️ Stopped scheduler: ${integrationId}`);
      }

      this.scheduledTasks.clear();
      logger.info('✅ All schedulers shut down');
    } catch (error) {
      logger.error('❌ Error shutting down schedulers:', error);
    }
  }
}

// Export singleton instance
export const softProSchedulerService = new SoftProSchedulerService();

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  logger.info('📭 SIGTERM received, shutting down scheduler...');
  await softProSchedulerService.shutdown();
});
