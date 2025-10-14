/**
 * Link Tracking Service
 *
 * Handles link tracking for email campaigns:
 * - Generate trackable links
 * - Track link clicks
 * - A/B testing for links
 * - UTM parameter management
 * - Click attribution
 */

import crypto from 'crypto';
import { createLogger } from '../../utils/logger';
import { PrismaClient } from '@prisma/client';
import { userAgentParserService } from './user-agent-parser.service';
import { geographicService } from './geographic.service';

const logger = createLogger('link-tracking');
const db = new PrismaClient();

export interface UTMParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
}

export interface TrackingLinkOptions {
  emailId: string;
  campaignId: string;
  subscriberId: string;
  originalUrl: string;
  linkId?: string;
  linkCategory?: string;
  utmParams?: UTMParams;
}

export interface LinkPerformance {
  linkId: string;
  url: string;
  totalClicks: number;
  uniqueClicks: number;
  clickRate: number;
  topDevices: Array<{ device: string; count: number }>;
  topLocations: Array<{ location: string; count: number }>;
  clicksByHour: Array<{ hour: number; count: number }>;
  firstClickedAt?: Date;
  lastClickedAt?: Date;
}

export interface RedirectResponse {
  url: string;
  tracked: boolean;
}

class LinkTrackingService {
  private readonly baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
  }

  /**
   * Generate tracking link
   */
  async generateTrackingLink(options: TrackingLinkOptions): Promise<string> {
    try {
      const {
        emailId,
        campaignId,
        subscriberId,
        originalUrl,
        linkId,
        linkCategory,
        utmParams
      } = options;

      // Add UTM parameters to original URL
      let finalUrl = originalUrl;
      if (utmParams) {
        finalUrl = this.addUTMParameters(originalUrl, utmParams);
      }

      // Generate unique tracking ID
      const trackingId = this.generateTrackingId(emailId, subscriberId, originalUrl);

      // Store tracking data in database
      await db.$executeRaw`
        INSERT INTO email_link_tracking (
          tracking_id,
          campaign_id,
          subscriber_id,
          email_id,
          original_url,
          final_url,
          link_id,
          link_category,
          created_at
        ) VALUES (
          ${trackingId},
          ${campaignId},
          ${subscriberId},
          ${emailId},
          ${originalUrl},
          ${finalUrl},
          ${linkId || null},
          ${linkCategory || null},
          NOW()
        )
        ON CONFLICT (tracking_id) DO NOTHING
      `;

      // Generate tracking URL
      return `${this.baseUrl}/track/click/${trackingId}`;
    } catch (error) {
      logger.error('Failed to generate tracking link:', error);
      // Return original URL on error
      return options.originalUrl;
    }
  }

  /**
   * Process click and redirect
   */
  async processClick(
    trackingId: string,
    userAgent: string,
    ipAddress: string
  ): Promise<RedirectResponse> {
    try {
      // Get tracking data
      const tracking = await db.$queryRaw<Array<any>>`
        SELECT
          campaign_id,
          subscriber_id,
          email_id,
          final_url,
          link_id,
          link_category
        FROM email_link_tracking
        WHERE tracking_id = ${trackingId}
        LIMIT 1
      `;

      if (!tracking || tracking.length === 0) {
        logger.warn(`Tracking ID not found: ${trackingId}`);
        return { url: '/', tracked: false };
      }

      const data = tracking[0];

      // Parse user agent
      const parsedUA = userAgentParserService.parseUserAgent(userAgent);

      // Get location
      const location = await geographicService.getLocationFromIP(ipAddress);

      // Record click event in database
      await db.emailEvent.create({
        data: {
          campaignId: data.campaign_id,
          subscriberId: data.subscriber_id,
          messageId: data.email_id,
          recipientEmail: '', // Will be filled by campaign data
          eventType: 'CLICKED',
          ipAddress,
          userAgent,
          location: location ? `${location.city}, ${location.country}` : null,
          device: parsedUA.device.type,
          deviceBrand: parsedUA.device.vendor,
          deviceModel: parsedUA.device.model,
          os: parsedUA.os.name,
          browser: parsedUA.browser.name,
          emailClient: parsedUA.emailClient,
          linkUrl: data.final_url,
          linkIndex: data.link_id ? parseInt(data.link_id.split('-')[1] || '0') : null,
          linkCategory: data.link_category,
          eventTimestamp: new Date(),
          processingTimestamp: new Date()
        }
      });

      // Update campaign click count
      await db.emailCampaign.update({
        where: { id: data.campaign_id },
        data: {
          clickCount: { increment: 1 }
        }
      });

      // Update tracking record
      await db.$executeRaw`
        UPDATE email_link_tracking
        SET
          click_count = click_count + 1,
          last_clicked_at = NOW()
        WHERE tracking_id = ${trackingId}
      `;

      logger.info(`Click tracked: ${trackingId} -> ${data.final_url}`);

      return {
        url: data.final_url,
        tracked: true
      };
    } catch (error) {
      logger.error('Failed to process click:', error);
      return { url: '/', tracked: false };
    }
  }

  /**
   * Get link performance metrics
   */
  async getLinkPerformance(
    linkId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<LinkPerformance | null> {
    try {
      // Build date filter
      const dateFilter = dateRange
        ? `AND e.event_timestamp >= '${dateRange.from.toISOString()}' AND e.event_timestamp <= '${dateRange.to.toISOString()}'`
        : '';

      // Get click data
      const result = await db.$queryRaw<Array<any>>`
        SELECT
          lt.link_id,
          lt.original_url,
          COUNT(DISTINCT e.id) as total_clicks,
          COUNT(DISTINCT e.subscriber_id) as unique_clicks,
          MIN(e.event_timestamp) as first_clicked_at,
          MAX(e.event_timestamp) as last_clicked_at
        FROM email_link_tracking lt
        JOIN email_events e ON e.link_url = lt.final_url AND e.event_type = 'CLICKED'
        WHERE lt.link_id = ${linkId} ${dateFilter}
        GROUP BY lt.link_id, lt.original_url
      `;

      if (!result || result.length === 0) {
        return null;
      }

      const data = result[0];

      // Get device breakdown
      const deviceBreakdown = await db.$queryRaw<Array<{ device: string; count: number }>>`
        SELECT
          e.device,
          COUNT(*) as count
        FROM email_events e
        JOIN email_link_tracking lt ON e.link_url = lt.final_url
        WHERE lt.link_id = ${linkId} ${dateFilter}
        GROUP BY e.device
        ORDER BY count DESC
        LIMIT 5
      `;

      // Get location breakdown
      const locationBreakdown = await db.$queryRaw<Array<{ location: string; count: number }>>`
        SELECT
          e.location,
          COUNT(*) as count
        FROM email_events e
        JOIN email_link_tracking lt ON e.link_url = lt.final_url
        WHERE lt.link_id = ${linkId} ${dateFilter} AND e.location IS NOT NULL
        GROUP BY e.location
        ORDER BY count DESC
        LIMIT 10
      `;

      // Get hourly breakdown
      const hourlyBreakdown = await db.$queryRaw<Array<{ hour: number; count: number }>>`
        SELECT
          EXTRACT(HOUR FROM e.event_timestamp) as hour,
          COUNT(*) as count
        FROM email_events e
        JOIN email_link_tracking lt ON e.link_url = lt.final_url
        WHERE lt.link_id = ${linkId} ${dateFilter}
        GROUP BY hour
        ORDER BY hour
      `;

      // Calculate click rate (would need total emails sent)
      const clickRate = 0; // TODO: Calculate from campaign data

      return {
        linkId: data.link_id,
        url: data.original_url,
        totalClicks: parseInt(data.total_clicks),
        uniqueClicks: parseInt(data.unique_clicks),
        clickRate,
        topDevices: deviceBreakdown,
        topLocations: locationBreakdown,
        clicksByHour: hourlyBreakdown,
        firstClickedAt: data.first_clicked_at,
        lastClickedAt: data.last_clicked_at
      };
    } catch (error) {
      logger.error('Failed to get link performance:', error);
      return null;
    }
  }

  /**
   * Add UTM parameters to URL
   */
  addUTMParameters(url: string, params: UTMParams): string {
    try {
      const urlObj = new URL(url);

      if (params.source) urlObj.searchParams.set('utm_source', params.source);
      if (params.medium) urlObj.searchParams.set('utm_medium', params.medium);
      if (params.campaign) urlObj.searchParams.set('utm_campaign', params.campaign);
      if (params.term) urlObj.searchParams.set('utm_term', params.term);
      if (params.content) urlObj.searchParams.set('utm_content', params.content);

      return urlObj.toString();
    } catch (error) {
      logger.warn(`Invalid URL for UTM parameters: ${url}`);
      return url;
    }
  }

  /**
   * Process links in HTML for tracking
   */
  async processLinksInHTML(
    html: string,
    options: Omit<TrackingLinkOptions, 'originalUrl' | 'linkId'>
  ): Promise<string> {
    let linkIndex = 0;
    const linkPromises: Array<Promise<{ pattern: RegExp; replacement: string }>> = [];

    // Find all links
    const linkRegex = /<a\s+href="([^"]+)"([^>]*)>/gi;
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      linkIndex++;
      const originalUrl = match[1];

      // Skip tracking pixels and unsubscribe links
      if (originalUrl.includes('/track/open') || originalUrl.includes('/unsubscribe')) {
        continue;
      }

      const linkId = `link-${linkIndex}`;

      linkPromises.push(
        this.generateTrackingLink({
          ...options,
          originalUrl,
          linkId
        }).then(trackingUrl => ({
          pattern: new RegExp(`href="${this.escapeRegex(originalUrl)}"`, 'g'),
          replacement: `href="${trackingUrl}"`
        }))
      );
    }

    // Wait for all tracking links to be generated
    const replacements = await Promise.all(linkPromises);

    // Apply replacements
    let processedHtml = html;
    for (const { pattern, replacement } of replacements) {
      processedHtml = processedHtml.replace(pattern, replacement);
    }

    return processedHtml;
  }

  /**
   * Generate unique tracking ID
   */
  private generateTrackingId(emailId: string, subscriberId: string, url: string): string {
    const data = `${emailId}:${subscriberId}:${url}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get top performing links for campaign
   */
  async getTopLinks(
    campaignId: string,
    limit: number = 10
  ): Promise<Array<{ url: string; clicks: number; uniqueClicks: number }>> {
    try {
      const result = await db.$queryRaw<Array<any>>`
        SELECT
          lt.original_url as url,
          COUNT(e.id) as clicks,
          COUNT(DISTINCT e.subscriber_id) as unique_clicks
        FROM email_link_tracking lt
        JOIN email_events e ON e.link_url = lt.final_url AND e.event_type = 'CLICKED'
        WHERE lt.campaign_id = ${campaignId}
        GROUP BY lt.original_url
        ORDER BY clicks DESC
        LIMIT ${limit}
      `;

      return result.map(r => ({
        url: r.url,
        clicks: parseInt(r.clicks),
        uniqueClicks: parseInt(r.unique_clicks)
      }));
    } catch (error) {
      logger.error('Failed to get top links:', error);
      return [];
    }
  }
}

// Export singleton instance
export const linkTrackingService = new LinkTrackingService();
