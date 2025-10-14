/**
 * Signal Processing Service
 * Analyzes user events and generates intent signals for ML alert system
 * Processes 1M+ events daily with real-time signal detection
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { subDays, differenceInDays } from 'date-fns';

const logger = createLogger('signal-processing');
const db = new PrismaClient();

export interface DetectedSignal {
  userId: string;
  signalType: string;
  signalCategory: string;
  strength: number; // 0-1
  confidence: number; // 0-1
  signalData: Record<string, any>;
  contributingEvents: string[];
}

export class SignalProcessingService {
  /**
   * Process events for a user and detect signals
   */
  async processUserSignals(userId: string): Promise<DetectedSignal[]> {
    try {
      const signals: DetectedSignal[] = [];

      // Get recent events (last 30 days)
      const events = await this.getRecentUserEvents(userId, 30);

      if (events.length === 0) return signals;

      // Detect document activity signals
      signals.push(...await this.detectDocumentSignals(userId, events));

      // Detect email engagement signals
      signals.push(...await this.detectEmailSignals(userId, events));

      // Detect platform behavior signals
      signals.push(...await this.detectPlatformSignals(userId, events));

      // Save detected signals to database
      for (const signal of signals) {
        await this.saveSignal(signal);
      }

      logger.info(`Processed ${events.length} events, detected ${signals.length} signals for user ${userId}`);

      return signals;
    } catch (error: any) {
      logger.error(`Failed to process signals for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Detect document activity signals
   */
  private async detectDocumentSignals(userId: string, events: any[]): Promise<DetectedSignal[]> {
    const signals: DetectedSignal[] = [];

    const docEvents = events.filter(e =>
      ['DOCUMENT_ACCESS', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SHARE'].includes(e.eventType)
    );

    if (docEvents.length === 0) return signals;

    // Signal 1: Document Access Spike
    const last7Days = docEvents.filter(e =>
      differenceInDays(new Date(), e.timestamp) <= 7
    );

    const previous7Days = docEvents.filter(e => {
      const days = differenceInDays(new Date(), e.timestamp);
      return days > 7 && days <= 14;
    });

    if (last7Days.length > previous7Days.length * 2 && last7Days.length >= 5) {
      signals.push({
        userId,
        signalType: 'DOCUMENT_ACCESS_SPIKE',
        signalCategory: 'DOCUMENT_ACTIVITY',
        strength: Math.min(last7Days.length / 20, 1.0), // Normalize to 0-1
        confidence: 0.7,
        signalData: {
          last7DaysCount: last7Days.length,
          previous7DaysCount: previous7Days.length,
          increasePercent: ((last7Days.length - previous7Days.length) / (previous7Days.length || 1)) * 100
        },
        contributingEvents: last7Days.map(e => e.id)
      });
    }

    // Signal 2: Document Download Pattern
    const downloads = docEvents.filter(e => e.eventType === 'DOCUMENT_DOWNLOAD');
    if (downloads.length >= 3) {
      signals.push({
        userId,
        signalType: 'DOCUMENT_DOWNLOAD_PATTERN',
        signalCategory: 'DOCUMENT_ACTIVITY',
        strength: Math.min(downloads.length / 10, 1.0),
        confidence: 0.75,
        signalData: {
          downloadCount: downloads.length,
          documentsDownloaded: downloads.map(e => e.properties?.documentId).filter(Boolean)
        },
        contributingEvents: downloads.map(e => e.id)
      });
    }

    // Signal 3: Document Sharing Activity
    const shares = docEvents.filter(e => e.eventType === 'DOCUMENT_SHARE');
    if (shares.length >= 2) {
      signals.push({
        userId,
        signalType: 'DOCUMENT_SHARING_ACTIVITY',
        signalCategory: 'DOCUMENT_ACTIVITY',
        strength: Math.min(shares.length / 5, 1.0),
        confidence: 0.8,
        signalData: {
          shareCount: shares.length,
          recentShares: shares.slice(0, 3).map(e => e.timestamp)
        },
        contributingEvents: shares.map(e => e.id)
      });
    }

    // Signal 4: Dormant Reactivation
    const lastEvent = docEvents[0];
    const previousEvents = await db.userEvent.findMany({
      where: {
        userId,
        timestamp: {
          lt: subDays(new Date(), 90),
          gte: subDays(new Date(), 180)
        },
        eventType: { in: ['DOCUMENT_ACCESS', 'DOCUMENT_DOWNLOAD', 'DOCUMENT_SHARE'] }
      }
    });

    if (previousEvents.length > 0 && docEvents.length >= 3) {
      const daysSinceLastPrevious = differenceInDays(new Date(), previousEvents[0].timestamp);
      if (daysSinceLastPrevious > 90) {
        signals.push({
          userId,
          signalType: 'DORMANT_REACTIVATION',
          signalCategory: 'DOCUMENT_ACTIVITY',
          strength: 0.8,
          confidence: 0.85,
          signalData: {
            daysDormant: daysSinceLastPrevious,
            recentActivityCount: docEvents.length
          },
          contributingEvents: docEvents.map(e => e.id)
        });
      }
    }

    return signals;
  }

  /**
   * Detect email engagement signals
   */
  private async detectEmailSignals(userId: string, events: any[]): Promise<DetectedSignal[]> {
    const signals: DetectedSignal[] = [];

    const emailEvents = events.filter(e =>
      ['EMAIL_OPEN', 'EMAIL_CLICK'].includes(e.eventType)
    );

    if (emailEvents.length === 0) return signals;

    // Signal 1: High Email Engagement
    const opens = emailEvents.filter(e => e.eventType === 'EMAIL_OPEN');
    const clicks = emailEvents.filter(e => e.eventType === 'EMAIL_CLICK');

    const openRate = opens.length / (opens.length + 1); // Avoid division by zero
    const clickRate = clicks.length / (opens.length + 1);

    if (openRate > 0.5 || clickRate > 0.3) {
      signals.push({
        userId,
        signalType: 'HIGH_EMAIL_ENGAGEMENT',
        signalCategory: 'EMAIL_ENGAGEMENT',
        strength: Math.max(openRate, clickRate),
        confidence: 0.65,
        signalData: {
          openRate,
          clickRate,
          opens: opens.length,
          clicks: clicks.length
        },
        contributingEvents: emailEvents.map(e => e.id)
      });
    }

    // Signal 2: Refinance Interest
    const refinanceClicks = clicks.filter(e =>
      e.properties?.campaignId?.includes('refinance') ||
      e.properties?.url?.includes('refinance')
    );

    if (refinanceClicks.length >= 2) {
      signals.push({
        userId,
        signalType: 'REFINANCE_INTEREST',
        signalCategory: 'EMAIL_ENGAGEMENT',
        strength: Math.min(refinanceClicks.length / 5, 1.0),
        confidence: 0.8,
        signalData: {
          refinanceClickCount: refinanceClicks.length,
          campaigns: refinanceClicks.map(e => e.properties?.campaignId).filter(Boolean)
        },
        contributingEvents: refinanceClicks.map(e => e.id)
      });
    }

    // Signal 3: Market Report Views
    const marketReportEvents = emailEvents.filter(e =>
      e.properties?.campaignId?.includes('market') ||
      e.properties?.url?.includes('market')
    );

    if (marketReportEvents.length >= 3) {
      signals.push({
        userId,
        signalType: 'MARKET_REPORT_VIEWS',
        signalCategory: 'EMAIL_ENGAGEMENT',
        strength: Math.min(marketReportEvents.length / 6, 1.0),
        confidence: 0.7,
        signalData: {
          marketReportCount: marketReportEvents.length,
          recentViews: marketReportEvents.slice(0, 3).map(e => e.timestamp)
        },
        contributingEvents: marketReportEvents.map(e => e.id)
      });
    }

    return signals;
  }

  /**
   * Detect platform behavior signals
   */
  private async detectPlatformSignals(userId: string, events: any[]): Promise<DetectedSignal[]> {
    const signals: DetectedSignal[] = [];

    // Signal 1: Frequent Value Checks
    const valueCheckEvents = events.filter(e =>
      e.eventName?.includes('value') || e.eventName?.includes('valuation')
    );

    if (valueCheckEvents.length >= 5) {
      signals.push({
        userId,
        signalType: 'FREQUENT_VALUE_CHECKS',
        signalCategory: 'PLATFORM_BEHAVIOR',
        strength: Math.min(valueCheckEvents.length / 10, 1.0),
        confidence: 0.75,
        signalData: {
          checkCount: valueCheckEvents.length,
          frequency: valueCheckEvents.length / 30 // Per day
        },
        contributingEvents: valueCheckEvents.map(e => e.id)
      });
    }

    // Signal 2: Calculator Usage
    const calculatorEvents = events.filter(e =>
      e.eventType === 'CALCULATOR_USE'
    );

    if (calculatorEvents.length >= 3) {
      signals.push({
        userId,
        signalType: 'CALCULATOR_USAGE',
        signalCategory: 'PLATFORM_BEHAVIOR',
        strength: Math.min(calculatorEvents.length / 8, 1.0),
        confidence: 0.8,
        signalData: {
          usageCount: calculatorEvents.length,
          calculatorTypes: calculatorEvents.map(e => e.properties?.calculatorType).filter(Boolean)
        },
        contributingEvents: calculatorEvents.map(e => e.id)
      });
    }

    // Signal 3: Comparable Research
    const comparableEvents = events.filter(e =>
      e.eventName?.includes('comparable') || e.eventName?.includes('comparison')
    );

    if (comparableEvents.length >= 4) {
      signals.push({
        userId,
        signalType: 'COMPARABLE_RESEARCH',
        signalCategory: 'PLATFORM_BEHAVIOR',
        strength: Math.min(comparableEvents.length / 10, 1.0),
        confidence: 0.7,
        signalData: {
          researchCount: comparableEvents.length,
          propertiesViewed: comparableEvents.map(e => e.properties?.propertyId).filter(Boolean).length
        },
        contributingEvents: comparableEvents.map(e => e.id)
      });
    }

    // Signal 4: Profile Updates
    const profileEvents = events.filter(e =>
      e.eventName?.includes('profile') || e.eventName?.includes('account_update')
    );

    if (profileEvents.length >= 2) {
      signals.push({
        userId,
        signalType: 'PROFILE_UPDATES',
        signalCategory: 'PLATFORM_BEHAVIOR',
        strength: Math.min(profileEvents.length / 4, 1.0),
        confidence: 0.65,
        signalData: {
          updateCount: profileEvents.length,
          recentUpdates: profileEvents.slice(0, 2).map(e => e.timestamp)
        },
        contributingEvents: profileEvents.map(e => e.id)
      });
    }

    return signals;
  }

  /**
   * Get recent user events
   */
  private async getRecentUserEvents(userId: string, days: number): Promise<any[]> {
    const startDate = subDays(new Date(), days);

    return await db.userEvent.findMany({
      where: {
        userId,
        timestamp: { gte: startDate }
      },
      orderBy: { timestamp: 'desc' }
    });
  }

  /**
   * Save detected signal to database
   */
  private async saveSignal(signal: DetectedSignal): Promise<void> {
    try {
      await db.alertSignal.create({
        data: {
          userId: signal.userId,
          signalType: signal.signalType as any,
          signalCategory: signal.signalCategory as any,
          strength: signal.strength,
          confidence: signal.confidence,
          signalData: signal.signalData,
          contributingEvents: signal.contributingEvents,
          windowStart: subDays(new Date(), 30),
          windowEnd: new Date(),
          processed: false
        }
      });

      logger.debug(`Saved signal: ${signal.signalType} for user ${signal.userId}`);
    } catch (error) {
      logger.error('Failed to save signal:', error);
      throw error;
    }
  }

  /**
   * Get unprocessed signals for ML scoring
   */
  async getUnprocessedSignals(limit: number = 1000): Promise<any[]> {
    return await db.alertSignal.findMany({
      where: { processed: false },
      include: { user: true },
      orderBy: { detectedAt: 'asc' },
      take: limit
    });
  }

  /**
   * Mark signals as processed
   */
  async markSignalsProcessed(signalIds: string[]): Promise<void> {
    await db.alertSignal.updateMany({
      where: { id: { in: signalIds } },
      data: { processed: true, processedAt: new Date() }
    });

    logger.info(`Marked ${signalIds.length} signals as processed`);
  }

  /**
   * Batch process signals for multiple users
   */
  async batchProcessSignals(userIds: string[]): Promise<void> {
    logger.info(`Starting batch signal processing for ${userIds.length} users`);

    for (const userId of userIds) {
      try {
        await this.processUserSignals(userId);
      } catch (error) {
        logger.error(`Failed to process signals for user ${userId}:`, error);
      }
    }

    logger.info(`Completed batch signal processing`);
  }
}

// Export singleton instance
export const signalProcessingService = new SignalProcessingService();
