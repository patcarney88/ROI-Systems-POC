/**
 * Campaign Analytics Service
 *
 * Real-time campaign performance tracking and analytics.
 * Monitors open rates, click rates, conversions, and revenue attribution.
 */

import { createLogger } from '../../utils/logger';
import { CampaignMetrics } from './campaign.engine';

export interface AnalyticsEvent {
  campaignId: string;
  recipientId: string;
  eventType: 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'converted' | 'unsubscribed';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SegmentPerformance {
  segment: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  opens: number;
  clicks: number;
  conversions: number;
}

export class CampaignAnalytics {
  private logger: any;
  private events: Map<string, AnalyticsEvent[]> = new Map();
  private campaignMetrics: Map<string, CampaignMetrics> = new Map();
  private segmentData: Map<string, Map<string, SegmentPerformance>> = new Map();

  constructor() {
    this.logger = createLogger('CampaignAnalytics');
  }

  /**
   * Initialize campaign tracking
   */
  async initializeCampaign(campaignId: string): Promise<void> {
    this.logger.info(`Initializing analytics for campaign ${campaignId}`);

    const metrics: CampaignMetrics = {
      campaignId,
      sent: 0,
      delivered: 0,
      bounced: 0,
      opened: 0,
      clicked: 0,
      converted: 0,
      unsubscribed: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      avgOpenTime: 0,
      revenue: 0
    };

    this.campaignMetrics.set(campaignId, metrics);
    this.events.set(campaignId, []);
  }

  /**
   * Track email sent event
   */
  async trackSent(campaignId: string, recipientId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'sent',
      timestamp: new Date(),
      metadata
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      metrics.sent++;
      this.updateRates(campaignId);
    }
  }

  /**
   * Track email delivered event
   */
  async trackDelivered(campaignId: string, recipientId: string): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'delivered',
      timestamp: new Date()
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      metrics.delivered++;
      this.updateRates(campaignId);
    }
  }

  /**
   * Track email bounce event
   */
  async trackBounce(campaignId: string, recipientId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'bounced',
      timestamp: new Date(),
      metadata
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      metrics.bounced++;
      this.updateRates(campaignId);
    }
  }

  /**
   * Track email open event
   */
  async trackOpen(campaignId: string, recipientId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'opened',
      timestamp: new Date(),
      metadata
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      // Only count unique opens
      const events = this.events.get(campaignId) || [];
      const existingOpens = events.filter(
        e => e.eventType === 'opened' && e.recipientId === recipientId
      );

      if (existingOpens.length === 1) {
        // First open for this recipient
        metrics.opened++;
        this.updateRates(campaignId);
        this.updateAvgOpenTime(campaignId);
      }
    }
  }

  /**
   * Track link click event
   */
  async trackClick(campaignId: string, recipientId: string, metadata?: Record<string, any>): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'clicked',
      timestamp: new Date(),
      metadata
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      // Only count unique clicks
      const events = this.events.get(campaignId) || [];
      const existingClicks = events.filter(
        e => e.eventType === 'clicked' && e.recipientId === recipientId
      );

      if (existingClicks.length === 1) {
        // First click for this recipient
        metrics.clicked++;
        this.updateRates(campaignId);
      }
    }
  }

  /**
   * Track conversion event
   */
  async trackConversion(
    campaignId: string,
    recipientId: string,
    revenue?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'converted',
      timestamp: new Date(),
      metadata: { ...metadata, revenue }
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      metrics.converted++;
      if (revenue) {
        metrics.revenue = (metrics.revenue || 0) + revenue;
      }
      this.updateRates(campaignId);
    }
  }

  /**
   * Track unsubscribe event
   */
  async trackUnsubscribe(campaignId: string, recipientId: string): Promise<void> {
    await this.trackEvent({
      campaignId,
      recipientId,
      eventType: 'unsubscribed',
      timestamp: new Date()
    });

    const metrics = this.campaignMetrics.get(campaignId);
    if (metrics) {
      metrics.unsubscribed++;
    }
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    const metrics = this.campaignMetrics.get(campaignId);
    if (!metrics) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Calculate best performing segment
    const segmentPerf = await this.getSegmentPerformance(campaignId);
    if (segmentPerf.length > 0) {
      const best = segmentPerf.reduce((prev, curr) =>
        curr.openRate > prev.openRate ? curr : prev
      );
      metrics.bestPerformingSegment = best.segment;
    }

    return metrics;
  }

  /**
   * Get segment performance
   */
  async getSegmentPerformance(campaignId: string): Promise<SegmentPerformance[]> {
    const segments = this.segmentData.get(campaignId);
    if (!segments) {
      return [];
    }

    return Array.from(segments.values());
  }

  /**
   * Get time series data
   */
  async getTimeSeriesData(
    campaignId: string,
    interval: 'hour' | 'day' = 'hour'
  ): Promise<TimeSeriesData[]> {
    const events = this.events.get(campaignId) || [];

    // Group events by time interval
    const grouped = new Map<number, TimeSeriesData>();

    events.forEach(event => {
      let bucket: number;
      if (interval === 'hour') {
        bucket = Math.floor(event.timestamp.getTime() / (1000 * 60 * 60));
      } else {
        bucket = Math.floor(event.timestamp.getTime() / (1000 * 60 * 60 * 24));
      }

      if (!grouped.has(bucket)) {
        grouped.set(bucket, {
          timestamp: new Date(bucket * (interval === 'hour' ? 1000 * 60 * 60 : 1000 * 60 * 60 * 24)),
          opens: 0,
          clicks: 0,
          conversions: 0
        });
      }

      const data = grouped.get(bucket)!;
      if (event.eventType === 'opened') data.opens++;
      if (event.eventType === 'clicked') data.clicks++;
      if (event.eventType === 'converted') data.conversions++;
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Get campaign comparison
   */
  async compareCampaigns(campaignIds: string[]): Promise<{
    campaigns: Array<{
      id: string;
      openRate: number;
      clickRate: number;
      conversionRate: number;
      revenue: number;
    }>;
    average: {
      openRate: number;
      clickRate: number;
      conversionRate: number;
    };
  }> {
    const campaigns = await Promise.all(
      campaignIds.map(async id => {
        const metrics = await this.getCampaignMetrics(id);
        return {
          id,
          openRate: metrics.openRate,
          clickRate: metrics.clickRate,
          conversionRate: metrics.conversionRate,
          revenue: metrics.revenue || 0
        };
      })
    );

    const average = {
      openRate: campaigns.reduce((sum, c) => sum + c.openRate, 0) / campaigns.length,
      clickRate: campaigns.reduce((sum, c) => sum + c.clickRate, 0) / campaigns.length,
      conversionRate: campaigns.reduce((sum, c) => sum + c.conversionRate, 0) / campaigns.length
    };

    return { campaigns, average };
  }

  /**
   * Track analytics event
   */
  private async trackEvent(event: AnalyticsEvent): Promise<void> {
    const events = this.events.get(event.campaignId) || [];
    events.push(event);
    this.events.set(event.campaignId, events);

    this.logger.debug(
      `Tracked ${event.eventType} for campaign ${event.campaignId}, recipient ${event.recipientId}`
    );

    // Store event in database (mock)
    // await db.analytics.create({ data: event });
  }

  /**
   * Update campaign rates
   */
  private updateRates(campaignId: string): void {
    const metrics = this.campaignMetrics.get(campaignId);
    if (!metrics) return;

    const delivered = metrics.delivered || metrics.sent; // Use sent as fallback

    if (delivered > 0) {
      metrics.openRate = metrics.opened / delivered;
      metrics.clickRate = metrics.clicked / delivered;
      metrics.conversionRate = metrics.converted / delivered;
    }
  }

  /**
   * Update average open time
   */
  private updateAvgOpenTime(campaignId: string): void {
    const events = this.events.get(campaignId) || [];

    // Calculate time between sent and opened
    const openDelays: number[] = [];

    events.forEach(openEvent => {
      if (openEvent.eventType === 'opened') {
        const sentEvent = events.find(
          e => e.eventType === 'sent' && e.recipientId === openEvent.recipientId
        );

        if (sentEvent) {
          const delay = (openEvent.timestamp.getTime() - sentEvent.timestamp.getTime()) / (1000 * 60);
          openDelays.push(delay);
        }
      }
    });

    if (openDelays.length > 0) {
      const metrics = this.campaignMetrics.get(campaignId);
      if (metrics) {
        metrics.avgOpenTime = openDelays.reduce((sum, delay) => sum + delay, 0) / openDelays.length;
      }
    }
  }

  /**
   * Export campaign report
   */
  async exportReport(campaignId: string): Promise<{
    metrics: CampaignMetrics;
    segmentPerformance: SegmentPerformance[];
    timeSeries: TimeSeriesData[];
    topPerformers: Array<{ recipientId: string; opens: number; clicks: number; converted: boolean }>;
  }> {
    const metrics = await this.getCampaignMetrics(campaignId);
    const segmentPerformance = await this.getSegmentPerformance(campaignId);
    const timeSeries = await this.getTimeSeriesData(campaignId);

    // Get top performers
    const events = this.events.get(campaignId) || [];
    const recipientStats = new Map<string, { opens: number; clicks: number; converted: boolean }>();

    events.forEach(event => {
      if (!recipientStats.has(event.recipientId)) {
        recipientStats.set(event.recipientId, { opens: 0, clicks: 0, converted: false });
      }

      const stats = recipientStats.get(event.recipientId)!;
      if (event.eventType === 'opened') stats.opens++;
      if (event.eventType === 'clicked') stats.clicks++;
      if (event.eventType === 'converted') stats.converted = true;
    });

    const topPerformers = Array.from(recipientStats.entries())
      .map(([recipientId, stats]) => ({ recipientId, ...stats }))
      .sort((a, b) => (b.opens + b.clicks * 2) - (a.opens + a.clicks * 2))
      .slice(0, 10);

    return {
      metrics,
      segmentPerformance,
      timeSeries,
      topPerformers
    };
  }
}
