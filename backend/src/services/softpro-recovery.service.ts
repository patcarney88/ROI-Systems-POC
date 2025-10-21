/**
 * SoftPro Recovery Service
 * Handles failure recovery, sync gap detection, and data consistency validation
 *
 * Features:
 * - Automatic failed job retry
 * - Manual recovery tools
 * - Data consistency checks
 * - Gap detection and repair
 * - Emergency full resync
 * - Rate limit management
 */

import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import { softProWebhookService } from './softpro-webhook.service';
import { softProQueueProcessor } from '../workers/softpro-queue-processor';

const logger = createLogger('softpro-recovery-service');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SyncGap {
  gapStart: Date;
  gapEnd: Date;
  gapDurationHours: number;
  affectedDataTypes: string[];
  estimatedMissingRecords: number;
}

export interface ConsistencyReport {
  integrationId: string;
  checkedAt: Date;
  issues: ConsistencyIssue[];
  score: number; // 0-100
  recommendations: string[];
}

export interface ConsistencyIssue {
  type: 'missing_data' | 'stale_data' | 'duplicate_data' | 'orphaned_data';
  severity: 'low' | 'medium' | 'high';
  description: string;
  affectedRecords: number;
  resolution: string;
}

export interface RateLimit {
  requestsPerMinute: number;
  currentCount: number;
  resetTime: Date;
  remainingQuota: number;
}

// ============================================================================
// SOFTPRO RECOVERY SERVICE
// ============================================================================

export class SoftProRecoveryService {
  private readonly SYNC_GAP_THRESHOLD = 2; // 2 hours
  private readonly MAX_RETRY_BATCH = 100;

  /**
   * Retry all failed jobs for an integration
   */
  async retryAllFailed(integrationId: string): Promise<number> {
    try {
      logger.info(`🔄 Retrying all failed jobs for integration: ${integrationId}`);

      // Get failed events
      const failedEvents = await db.webhookEvent.findMany({
        where: {
          integrationId,
          status: 'FAILED',
          retryCount: {
            lt: 5, // Only retry if under max attempts
          },
        },
        take: this.MAX_RETRY_BATCH,
        orderBy: {
          failedAt: 'asc', // Oldest first
        },
      });

      let retriedCount = 0;

      for (const event of failedEvents) {
        try {
          await softProWebhookService.retryFailedEvent(event.id);
          retriedCount++;
        } catch (error) {
          logger.error(`Error retrying event ${event.id}:`, error);
        }
      }

      logger.info(`✅ Retried ${retriedCount} failed jobs for ${integrationId}`);
      return retriedCount;
    } catch (error) {
      logger.error(`Error retrying failed jobs for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Detect sync gaps in data synchronization
   */
  async detectSyncGaps(integrationId: string): Promise<SyncGap[]> {
    try {
      logger.info(`🔍 Detecting sync gaps for integration: ${integrationId}`);

      const gaps: SyncGap[] = [];

      // Get integration
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      // Get successful webhook events, ordered by time
      const events = await db.webhookEvent.findMany({
        where: {
          integrationId,
          status: 'COMPLETED',
        },
        select: {
          receivedAt: true,
          eventType: true,
        },
        orderBy: {
          receivedAt: 'asc',
        },
      });

      // Detect gaps (periods with no activity > threshold)
      for (let i = 1; i < events.length; i++) {
        const prevEvent = events[i - 1];
        const currentEvent = events[i];

        const gapMs = currentEvent.receivedAt.getTime() - prevEvent.receivedAt.getTime();
        const gapHours = gapMs / (1000 * 60 * 60);

        if (gapHours > this.SYNC_GAP_THRESHOLD) {
          // Determine affected data types
          const affectedTypes = new Set<string>();
          const syncInterval = integration.syncFrequency || 15;
          const expectedEvents = Math.floor((gapHours * 60) / syncInterval);

          gaps.push({
            gapStart: prevEvent.receivedAt,
            gapEnd: currentEvent.receivedAt,
            gapDurationHours: gapHours,
            affectedDataTypes: ['transactions', 'contacts', 'documents'],
            estimatedMissingRecords: expectedEvents * 10, // Rough estimate
          });
        }
      }

      logger.info(`Found ${gaps.length} sync gaps for ${integrationId}`);
      return gaps;
    } catch (error) {
      logger.error(`Error detecting sync gaps for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Fill detected sync gaps
   */
  async fillSyncGaps(integrationId: string, gaps: SyncGap[]): Promise<void> {
    try {
      logger.info(`🔧 Filling ${gaps.length} sync gaps for integration: ${integrationId}`);

      for (const gap of gaps) {
        // Queue sync jobs for the gap period
        for (const dataType of gap.affectedDataTypes) {
          await softProQueueProcessor.addSyncJob({
            integrationId,
            syncType: dataType as any,
            lastSyncTime: gap.gapStart,
            batchSize: 500,
            options: {
              gapFill: true,
              endTime: gap.gapEnd,
            },
          });
        }
      }

      logger.info(`✅ Queued sync jobs to fill ${gaps.length} gaps`);
    } catch (error) {
      logger.error(`Error filling sync gaps for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Validate data consistency
   */
  async validateDataConsistency(integrationId: string): Promise<ConsistencyReport> {
    try {
      logger.info(`🔍 Validating data consistency for integration: ${integrationId}`);

      const issues: ConsistencyIssue[] = [];
      let score = 100;

      // Check 1: Orphaned documents (documents without transactions)
      const orphanedDocs = await db.document.count({
        where: {
          integrationId,
          transaction: null,
        },
      });

      if (orphanedDocs > 0) {
        issues.push({
          type: 'orphaned_data',
          severity: 'medium',
          description: `${orphanedDocs} documents without associated transactions`,
          affectedRecords: orphanedDocs,
          resolution: 'Re-sync transactions or clean up orphaned documents',
        });
        score -= Math.min(20, orphanedDocs / 10);
      }

      // Check 2: Stale data (not updated in 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const staleTransactions = await db.transaction.count({
        where: {
          integrationId,
          updatedAt: {
            lt: thirtyDaysAgo,
          },
          status: {
            notIn: ['CLOSED', 'CANCELLED'],
          },
        },
      });

      if (staleTransactions > 0) {
        issues.push({
          type: 'stale_data',
          severity: 'low',
          description: `${staleTransactions} active transactions not updated in 30+ days`,
          affectedRecords: staleTransactions,
          resolution: 'Re-sync transaction data or update status',
        });
        score -= Math.min(10, staleTransactions / 20);
      }

      // Check 3: Duplicate external IDs
      const duplicates = await db.transaction.groupBy({
        by: ['externalId'],
        where: {
          integrationId,
        },
        having: {
          externalId: {
            _count: {
              gt: 1,
            },
          },
        },
      });

      if (duplicates.length > 0) {
        issues.push({
          type: 'duplicate_data',
          severity: 'high',
          description: `${duplicates.length} duplicate external IDs detected`,
          affectedRecords: duplicates.length,
          resolution: 'Merge or delete duplicate records',
        });
        score -= Math.min(30, duplicates.length * 5);
      }

      // Generate recommendations
      const recommendations: string[] = [];

      if (orphanedDocs > 0) {
        recommendations.push('Run transaction sync to link orphaned documents');
      }

      if (staleTransactions > 10) {
        recommendations.push('Enable more frequent sync intervals');
      }

      if (duplicates.length > 0) {
        recommendations.push('Review and resolve duplicate records urgently');
      }

      if (issues.length === 0) {
        recommendations.push('Data consistency is excellent - no action needed');
      }

      const report: ConsistencyReport = {
        integrationId,
        checkedAt: new Date(),
        issues,
        score: Math.max(0, Math.min(100, score)),
        recommendations,
      };

      logger.info(`✅ Consistency check complete: score ${report.score}/100`);
      return report;
    } catch (error) {
      logger.error(`Error validating data consistency for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Perform emergency full resync
   */
  async performFullResync(integrationId: string): Promise<void> {
    try {
      logger.info(`⚠️ Performing FULL RESYNC for integration: ${integrationId}`);

      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      // Mark integration as resyncing
      await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          syncStatus: 'RESYNCING',
          lastSyncAt: null, // Reset to force full sync
        },
      });

      // Queue full sync jobs with high priority
      const syncTypes = ['transactions', 'contacts', 'documents'] as const;

      for (const syncType of syncTypes) {
        await softProQueueProcessor.addSyncJob({
          integrationId,
          syncType,
          batchSize: 1000, // Large batch for full sync
          options: {
            fullResync: true,
          },
        });
      }

      logger.info(`✅ Full resync queued for ${integrationId}`);
    } catch (error) {
      logger.error(`Error performing full resync for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Clean up old failed events
   */
  async cleanupOldFailedEvents(daysOld: number = 30): Promise<number> {
    try {
      logger.info(`🧹 Cleaning up failed events older than ${daysOld} days`);

      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const result = await db.webhookEvent.deleteMany({
        where: {
          status: 'FAILED',
          failedAt: {
            lt: cutoffDate,
          },
          retryCount: {
            gte: 5, // Only delete if max retries reached
          },
        },
      });

      logger.info(`✅ Cleaned up ${result.count} old failed events`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old failed events:', error);
      throw error;
    }
  }
}

// ============================================================================
// RATE LIMIT MANAGER
// ============================================================================

export class RateLimitManager {
  private limits: Map<string, RateLimit>;
  private readonly DEFAULT_RATE_LIMIT = 100; // requests per minute
  private readonly WINDOW_MS = 60 * 1000; // 1 minute

  constructor() {
    this.limits = new Map();
  }

  /**
   * Check if request is allowed
   */
  async canMakeRequest(integrationId: string): Promise<boolean> {
    try {
      const key = `ratelimit:${integrationId}`;

      // Get current count from Redis
      const count = await redis.get(key);
      const currentCount = count ? parseInt(count) : 0;

      // Get integration rate limit (default 100/min)
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
        select: { rateLimit: true },
      });

      const limit = integration?.rateLimit || this.DEFAULT_RATE_LIMIT;

      return currentCount < limit;
    } catch (error) {
      logger.error('Error checking rate limit:', error);
      return true; // Fail open
    }
  }

  /**
   * Record a request
   */
  async recordRequest(integrationId: string): Promise<void> {
    try {
      const key = `ratelimit:${integrationId}`;

      // Increment counter with expiry
      const multi = redis.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(this.WINDOW_MS / 1000));
      await multi.exec();
    } catch (error) {
      logger.error('Error recording request:', error);
    }
  }

  /**
   * Get remaining quota
   */
  async getRemainingQuota(integrationId: string): Promise<number> {
    try {
      const key = `ratelimit:${integrationId}`;
      const count = await redis.get(key);
      const currentCount = count ? parseInt(count) : 0;

      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
        select: { rateLimit: true },
      });

      const limit = integration?.rateLimit || this.DEFAULT_RATE_LIMIT;

      return Math.max(0, limit - currentCount);
    } catch (error) {
      logger.error('Error getting remaining quota:', error);
      return 0;
    }
  }

  /**
   * Wait until quota is available
   */
  async waitForQuota(integrationId: string): Promise<void> {
    try {
      let attempts = 0;
      const maxAttempts = 10;

      while (attempts < maxAttempts) {
        const canMake = await this.canMakeRequest(integrationId);

        if (canMake) {
          return;
        }

        // Wait 6 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 6000));
        attempts++;
      }

      throw new Error('Rate limit quota not available after max wait time');
    } catch (error) {
      logger.error('Error waiting for quota:', error);
      throw error;
    }
  }

  /**
   * Reset rate limit for an integration
   */
  async resetRateLimit(integrationId: string): Promise<void> {
    try {
      const key = `ratelimit:${integrationId}`;
      await redis.del(key);
      logger.info(`✅ Rate limit reset for ${integrationId}`);
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
    }
  }
}

// Export singleton instances
export const softProRecoveryService = new SoftProRecoveryService();
export const rateLimitManager = new RateLimitManager();
