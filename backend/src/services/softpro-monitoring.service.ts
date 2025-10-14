/**
 * SoftPro Monitoring Service
 * Comprehensive integration health and performance monitoring
 *
 * Features:
 * - Connection health tracking
 * - Webhook processing metrics
 * - Sync job statistics
 * - Queue depth monitoring
 * - Error rate calculation
 * - Performance trending
 */

import { db } from '../config/database';
import { redis } from '../config/redis';
import { createLogger } from '../utils/logger';
import { softProQueueProcessor } from '../workers/softpro-queue-processor';

const logger = createLogger('softpro-monitoring-service');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export enum IntegrationStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
  DISCONNECTED = 'DISCONNECTED',
}

export interface IntegrationMetrics {
  // Connection Health
  connectionStatus: IntegrationStatus;
  lastSuccessfulSync: Date | null;
  uptime: number; // percentage
  uptimeHours: number;

  // Webhook Stats (24h)
  webhooksReceived24h: number;
  webhooksProcessed24h: number;
  webhookFailureRate: number;
  avgWebhookProcessingTime: number;

  // Sync Stats (24h)
  syncJobsCompleted24h: number;
  syncJobsFailed24h: number;
  avgSyncDuration: number;
  recordsSynced24h: number;

  // Queue Stats
  queueDepth: number;
  oldestPendingJob: Date | null;

  // Errors
  errorRate: number;
  topErrors: ErrorSummary[];
}

export interface ErrorSummary {
  error: string;
  count: number;
  lastOccurred: Date;
  affectedEvents: number;
}

export interface HealthStatus {
  status: IntegrationStatus;
  checks: HealthCheck[];
  score: number; // 0-100
  recommendations: string[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  value?: any;
}

// ============================================================================
// SOFTPRO MONITORING SERVICE
// ============================================================================

export class SoftProMonitoringService {
  private readonly UPTIME_THRESHOLD = 95; // 95% uptime considered healthy
  private readonly ERROR_RATE_THRESHOLD = 5; // 5% error rate warning
  private readonly PROCESSING_TIME_THRESHOLD = 5000; // 5 seconds warning

  /**
   * Get comprehensive integration metrics
   */
  async getIntegrationMetrics(integrationId: string): Promise<IntegrationMetrics> {
    try {
      logger.info(`📊 Getting metrics for integration: ${integrationId}`);

      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      // Calculate 24h time window
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get webhook stats
      const webhookStats = await this.getWebhookStats(integrationId, oneDayAgo, now);

      // Get sync stats
      const syncStats = await this.getSyncStats(integrationId, oneDayAgo, now);

      // Get queue stats
      const queueStats = await this.getQueueStats(integrationId);

      // Get error stats
      const errorStats = await this.getErrorStats(integrationId, oneDayAgo, now);

      // Calculate uptime
      const uptime = await this.calculateUptime(integrationId, oneDayAgo, now);

      // Determine connection status
      const connectionStatus = this.determineConnectionStatus(integration, webhookStats, syncStats);

      return {
        connectionStatus,
        lastSuccessfulSync: integration.lastSyncAt,
        uptime: uptime.percentage,
        uptimeHours: uptime.hours,

        webhooksReceived24h: webhookStats.received,
        webhooksProcessed24h: webhookStats.processed,
        webhookFailureRate: webhookStats.failureRate,
        avgWebhookProcessingTime: webhookStats.avgProcessingTime,

        syncJobsCompleted24h: syncStats.completed,
        syncJobsFailed24h: syncStats.failed,
        avgSyncDuration: syncStats.avgDuration,
        recordsSynced24h: syncStats.recordsSynced,

        queueDepth: queueStats.depth,
        oldestPendingJob: queueStats.oldestJob,

        errorRate: errorStats.rate,
        topErrors: errorStats.topErrors,
      };
    } catch (error) {
      logger.error(`Error getting integration metrics for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Get integration health status
   */
  async getHealthStatus(integrationId: string): Promise<HealthStatus> {
    try {
      const integration = await db.softProIntegration.findUnique({
        where: { id: integrationId },
      });

      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      const checks: HealthCheck[] = [];
      const recommendations: string[] = [];
      let score = 100;

      // Check 1: Integration is active
      if (!integration.active) {
        checks.push({
          name: 'Integration Active',
          status: 'fail',
          message: 'Integration is not active',
        });
        score -= 50;
        recommendations.push('Activate integration to resume operations');
      } else {
        checks.push({
          name: 'Integration Active',
          status: 'pass',
          message: 'Integration is active',
        });
      }

      // Check 2: Recent successful sync
      const timeSinceSync = integration.lastSyncAt
        ? Date.now() - integration.lastSyncAt.getTime()
        : Infinity;
      const hoursSinceSync = timeSinceSync / (1000 * 60 * 60);

      if (hoursSinceSync > 24) {
        checks.push({
          name: 'Recent Sync',
          status: 'fail',
          message: `No successful sync in ${Math.round(hoursSinceSync)} hours`,
          value: hoursSinceSync,
        });
        score -= 30;
        recommendations.push('Investigate sync failures and network connectivity');
      } else if (hoursSinceSync > 2) {
        checks.push({
          name: 'Recent Sync',
          status: 'warn',
          message: `Last sync ${Math.round(hoursSinceSync)} hours ago`,
          value: hoursSinceSync,
        });
        score -= 10;
      } else {
        checks.push({
          name: 'Recent Sync',
          status: 'pass',
          message: 'Recent sync completed successfully',
          value: hoursSinceSync,
        });
      }

      // Check 3: Error rate
      const metrics = await this.getIntegrationMetrics(integrationId);

      if (metrics.errorRate > this.ERROR_RATE_THRESHOLD * 2) {
        checks.push({
          name: 'Error Rate',
          status: 'fail',
          message: `High error rate: ${metrics.errorRate.toFixed(2)}%`,
          value: metrics.errorRate,
        });
        score -= 20;
        recommendations.push('Review error logs and address top errors');
      } else if (metrics.errorRate > this.ERROR_RATE_THRESHOLD) {
        checks.push({
          name: 'Error Rate',
          status: 'warn',
          message: `Elevated error rate: ${metrics.errorRate.toFixed(2)}%`,
          value: metrics.errorRate,
        });
        score -= 10;
      } else {
        checks.push({
          name: 'Error Rate',
          status: 'pass',
          message: `Error rate acceptable: ${metrics.errorRate.toFixed(2)}%`,
          value: metrics.errorRate,
        });
      }

      // Check 4: Queue health
      if (metrics.queueDepth > 1000) {
        checks.push({
          name: 'Queue Health',
          status: 'warn',
          message: `High queue depth: ${metrics.queueDepth} jobs`,
          value: metrics.queueDepth,
        });
        score -= 10;
        recommendations.push('Monitor queue processing and consider scaling');
      } else {
        checks.push({
          name: 'Queue Health',
          status: 'pass',
          message: `Queue depth normal: ${metrics.queueDepth} jobs`,
          value: metrics.queueDepth,
        });
      }

      // Check 5: Performance
      if (metrics.avgWebhookProcessingTime > this.PROCESSING_TIME_THRESHOLD) {
        checks.push({
          name: 'Processing Performance',
          status: 'warn',
          message: `Slow processing: ${metrics.avgWebhookProcessingTime}ms avg`,
          value: metrics.avgWebhookProcessingTime,
        });
        score -= 5;
        recommendations.push('Investigate performance bottlenecks');
      } else {
        checks.push({
          name: 'Processing Performance',
          status: 'pass',
          message: `Processing time acceptable: ${metrics.avgWebhookProcessingTime}ms`,
          value: metrics.avgWebhookProcessingTime,
        });
      }

      // Determine overall status
      let status: IntegrationStatus;
      if (score >= 80) {
        status = IntegrationStatus.HEALTHY;
      } else if (score >= 60) {
        status = IntegrationStatus.DEGRADED;
      } else if (score >= 40) {
        status = IntegrationStatus.UNHEALTHY;
      } else {
        status = IntegrationStatus.DISCONNECTED;
      }

      return {
        status,
        checks,
        score: Math.max(0, Math.min(100, score)),
        recommendations,
      };
    } catch (error) {
      logger.error(`Error getting health status for ${integrationId}:`, error);
      throw error;
    }
  }

  /**
   * Get error summary for a time period
   */
  async getErrorSummary(integrationId: string, period: string): Promise<ErrorSummary[]> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      const errors = await db.webhookEvent.groupBy({
        by: ['error'],
        where: {
          integrationId,
          status: 'FAILED',
          failedAt: {
            gte: startDate,
          },
          error: {
            not: null,
          },
        },
        _count: {
          id: true,
        },
        _max: {
          failedAt: true,
        },
      });

      return errors
        .map((e) => ({
          error: e.error || 'Unknown error',
          count: e._count.id,
          lastOccurred: e._max.failedAt || now,
          affectedEvents: e._count.id,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 errors
    } catch (error) {
      logger.error('Error getting error summary:', error);
      return [];
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<any> {
    try {
      return await softProQueueProcessor.getQueueStats();
    } catch (error) {
      logger.error('Error getting queue metrics:', error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get webhook statistics
   */
  private async getWebhookStats(
    integrationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const [received, processed, failed, avgProcessingTime] = await Promise.all([
      db.webhookEvent.count({
        where: {
          integrationId,
          receivedAt: { gte: startDate, lte: endDate },
        },
      }),
      db.webhookEvent.count({
        where: {
          integrationId,
          status: 'COMPLETED',
          receivedAt: { gte: startDate, lte: endDate },
        },
      }),
      db.webhookEvent.count({
        where: {
          integrationId,
          status: 'FAILED',
          receivedAt: { gte: startDate, lte: endDate },
        },
      }),
      db.webhookEvent.aggregate({
        where: {
          integrationId,
          status: 'COMPLETED',
          receivedAt: { gte: startDate, lte: endDate },
          processingTimeMs: { not: null },
        },
        _avg: {
          processingTimeMs: true,
        },
      }),
    ]);

    const failureRate = received > 0 ? (failed / received) * 100 : 0;

    return {
      received,
      processed,
      failed,
      failureRate,
      avgProcessingTime: Math.round(avgProcessingTime._avg.processingTimeMs || 0),
    };
  }

  /**
   * Get sync statistics
   */
  private async getSyncStats(
    integrationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    // This would query sync job records if you have them
    // For now, return mock data structure
    return {
      completed: 0,
      failed: 0,
      avgDuration: 0,
      recordsSynced: 0,
    };
  }

  /**
   * Get queue statistics
   */
  private async getQueueStats(integrationId: string): Promise<any> {
    // Get queue depth for this integration
    const pending = await db.webhookEvent.count({
      where: {
        integrationId,
        status: { in: ['RECEIVED', 'QUEUED', 'RETRYING'] },
      },
    });

    const oldest = await db.webhookEvent.findFirst({
      where: {
        integrationId,
        status: { in: ['RECEIVED', 'QUEUED', 'RETRYING'] },
      },
      orderBy: {
        receivedAt: 'asc',
      },
    });

    return {
      depth: pending,
      oldestJob: oldest?.receivedAt || null,
    };
  }

  /**
   * Get error statistics
   */
  private async getErrorStats(
    integrationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const [total, failed, topErrors] = await Promise.all([
      db.webhookEvent.count({
        where: {
          integrationId,
          receivedAt: { gte: startDate, lte: endDate },
        },
      }),
      db.webhookEvent.count({
        where: {
          integrationId,
          status: 'FAILED',
          receivedAt: { gte: startDate, lte: endDate },
        },
      }),
      this.getErrorSummary(integrationId, '24h'),
    ]);

    const rate = total > 0 ? (failed / total) * 100 : 0;

    return {
      rate,
      topErrors: topErrors.slice(0, 5), // Top 5 errors
    };
  }

  /**
   * Calculate uptime percentage
   */
  private async calculateUptime(
    integrationId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const totalHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Count hours with at least one successful event
    const successfulEvents = await db.webhookEvent.findMany({
      where: {
        integrationId,
        status: 'COMPLETED',
        receivedAt: { gte: startDate, lte: endDate },
      },
      select: {
        receivedAt: true,
      },
    });

    // Count unique hours with successful events
    const successfulHours = new Set(
      successfulEvents.map((e) => {
        const date = new Date(e.receivedAt);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
      })
    ).size;

    const percentage = totalHours > 0 ? (successfulHours / totalHours) * 100 : 0;

    return {
      percentage: Math.min(100, percentage),
      hours: successfulHours,
    };
  }

  /**
   * Determine connection status
   */
  private determineConnectionStatus(
    integration: any,
    webhookStats: any,
    syncStats: any
  ): IntegrationStatus {
    if (!integration.active) {
      return IntegrationStatus.DISCONNECTED;
    }

    const timeSinceSync = integration.lastSyncAt
      ? Date.now() - integration.lastSyncAt.getTime()
      : Infinity;
    const hoursSinceSync = timeSinceSync / (1000 * 60 * 60);

    // No activity in 24 hours
    if (hoursSinceSync > 24 && webhookStats.received === 0) {
      return IntegrationStatus.DISCONNECTED;
    }

    // High error rate
    if (webhookStats.failureRate > 50) {
      return IntegrationStatus.UNHEALTHY;
    }

    // Moderate error rate or old sync
    if (webhookStats.failureRate > 20 || hoursSinceSync > 12) {
      return IntegrationStatus.DEGRADED;
    }

    return IntegrationStatus.HEALTHY;
  }
}

// Export singleton instance
export const softProMonitoringService = new SoftProMonitoringService();
