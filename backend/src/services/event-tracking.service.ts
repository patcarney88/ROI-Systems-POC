/**
 * Event Tracking Service
 * Captures and processes user behavior events for ML-powered alert generation
 * Target: 1M+ events per day with <100ms processing time
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import Redis from 'ioredis';

const logger = createLogger('event-tracking');
const db = new PrismaClient();
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
});

export interface TrackEventData {
  eventType: string;
  eventCategory: string;
  eventName: string;
  userId: string;
  sessionId: string;
  organizationId: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  platform?: string;
  pageUrl?: string;
  referrer?: string;
}

export class EventTrackingService {
  private eventBuffer: TrackEventData[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly FLUSH_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Start periodic flush
    setInterval(() => this.flushEventBuffer(), this.FLUSH_INTERVAL);
  }

  /**
   * Track a user event
   */
  async trackEvent(data: TrackEventData): Promise<void> {
    try {
      // Validate event data
      this.validateEvent(data);

      // Add to buffer for batch processing
      this.eventBuffer.push(data);

      // Immediate flush if buffer is full
      if (this.eventBuffer.length >= this.BUFFER_SIZE) {
        await this.flushEventBuffer();
      }

      // Update real-time counters in Redis
      await this.updateRealTimeCounters(data);

      logger.debug(`Event tracked: ${data.eventType} for user ${data.userId}`);
    } catch (error: any) {
      logger.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Validate event data
   */
  private validateEvent(data: TrackEventData): void {
    if (!data.eventType) throw new Error('eventType is required');
    if (!data.eventCategory) throw new Error('eventCategory is required');
    if (!data.eventName) throw new Error('eventName is required');
    if (!data.userId) throw new Error('userId is required');
    if (!data.sessionId) throw new Error('sessionId is required');
    if (!data.organizationId) throw new Error('organizationId is required');
  }

  /**
   * Flush event buffer to database
   */
  private async flushEventBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      await db.userEvent.createMany({
        data: events.map(e => ({
          eventType: e.eventType as any,
          eventCategory: e.eventCategory as any,
          eventName: e.eventName,
          userId: e.userId,
          sessionId: e.sessionId,
          organizationId: e.organizationId,
          properties: e.properties || {},
          metadata: e.metadata || {},
          ipAddress: e.ipAddress,
          userAgent: e.userAgent,
          deviceType: e.deviceType,
          platform: e.platform,
          pageUrl: e.pageUrl,
          referrer: e.referrer,
          timestamp: new Date()
        }))
      });

      logger.info(`Flushed ${events.length} events to database`);
    } catch (error) {
      logger.error('Failed to flush events:', error);
      // Re-add failed events to buffer
      this.eventBuffer.unshift(...events);
    }
  }

  /**
   * Update real-time counters in Redis
   */
  private async updateRealTimeCounters(data: TrackEventData): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `user:${data.userId}:events:${today}`;

    await redis.hincrby(key, data.eventType, 1);
    await redis.hincrby(key, 'total', 1);
    await redis.expire(key, 86400 * 30); // 30 days TTL
  }

  /**
   * Track document access event
   */
  async trackDocumentAccess(
    userId: string,
    documentId: string,
    sessionId: string,
    organizationId: string,
    action: 'view' | 'download' | 'share'
  ): Promise<void> {
    await this.trackEvent({
      eventType: action === 'view' ? 'DOCUMENT_ACCESS' : action === 'download' ? 'DOCUMENT_DOWNLOAD' : 'DOCUMENT_SHARE',
      eventCategory: 'DOCUMENT_ACTIVITY',
      eventName: `document_${action}`,
      userId,
      sessionId,
      organizationId,
      properties: {
        documentId,
        action
      }
    });
  }

  /**
   * Track email engagement event
   */
  async trackEmailEngagement(
    userId: string,
    campaignId: string,
    action: 'open' | 'click',
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventType: action === 'open' ? 'EMAIL_OPEN' : 'EMAIL_CLICK',
      eventCategory: 'EMAIL_ENGAGEMENT',
      eventName: `email_${action}`,
      userId,
      sessionId: `email-${campaignId}`,
      organizationId: metadata?.organizationId || 'system',
      properties: {
        campaignId,
        action
      },
      metadata
    });
  }

  /**
   * Track platform behavior event
   */
  async trackPlatformBehavior(
    userId: string,
    action: string,
    sessionId: string,
    organizationId: string,
    properties?: Record<string, any>
  ): Promise<void> {
    let eventType: string = 'PAGE_VIEW';

    if (action.includes('calculator')) {
      eventType = 'CALCULATOR_USE';
    } else if (action.includes('property')) {
      eventType = 'PROPERTY_VIEW';
    } else if (action.includes('search')) {
      eventType = 'SEARCH';
    }

    await this.trackEvent({
      eventType: eventType as any,
      eventCategory: 'PLATFORM_BEHAVIOR',
      eventName: action,
      userId,
      sessionId,
      organizationId,
      properties
    });
  }

  /**
   * Get event summary for user
   */
  async getUserEventSummary(userId: string, days: number = 30): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const events = await db.userEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'desc' }
    });

    const summary = {
      totalEvents: events.length,
      byType: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      sessions: new Set(events.map(e => e.sessionId)).size,
      firstEvent: events[events.length - 1]?.timestamp,
      lastEvent: events[0]?.timestamp
    };

    events.forEach(event => {
      summary.byType[event.eventType] = (summary.byType[event.eventType] || 0) + 1;
      summary.byCategory[event.eventCategory] = (summary.byCategory[event.eventCategory] || 0) + 1;
    });

    return summary;
  }

  /**
   * Get recent events for user
   */
  async getRecentEvents(userId: string, limit: number = 50): Promise<any[]> {
    const events = await db.userEvent.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit
    });

    return events;
  }

  /**
   * Detect anomalous activity patterns
   */
  async detectAnomalousActivity(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0];
    const key = `user:${userId}:events:${today}`;

    const todayCount = await redis.hget(key, 'total');
    const todayEvents = parseInt(todayCount || '0');

    // Get average daily events for last 30 days
    const avgEvents = await this.getAverageDailyEvents(userId);

    // Flag if today's activity is 3x normal
    return todayEvents > avgEvents * 3;
  }

  /**
   * Get average daily events for user
   */
  private async getAverageDailyEvents(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.userEvent.groupBy({
      by: ['userId'],
      where: {
        userId,
        timestamp: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      }
    });

    return result[0]?._count.id ? result[0]._count.id / 30 : 0;
  }

  /**
   * Graceful shutdown - flush remaining events
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down event tracking service...');
    await this.flushEventBuffer();
    await redis.quit();
    logger.info('Event tracking service shut down complete');
  }
}

// Export singleton instance
export const eventTrackingService = new EventTrackingService();

// Graceful shutdown
process.on('SIGTERM', async () => {
  await eventTrackingService.shutdown();
});

process.on('SIGINT', async () => {
  await eventTrackingService.shutdown();
});
