/**
 * SendGrid Email Service
 * Handles email delivery, tracking, and webhook events
 */

import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { createLogger } from '../utils/logger';
import crypto from 'crypto';

const logger = createLogger('sendgrid');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface SendEmailOptions {
  to: string;
  from: {
    email: string;
    name: string;
  };
  replyTo?: string;
  subject: string;
  html: string;
  text?: string;

  // Tracking
  trackingSettings?: {
    clickTracking?: { enable: boolean };
    openTracking?: { enable: boolean };
    subscriptionTracking?: { enable: boolean };
  };

  // Custom arguments (for webhook identification)
  customArgs?: Record<string, string>;

  // Categories for filtering in SendGrid
  categories?: string[];

  // Unsubscribe
  asm?: {
    groupId: number;
    groupsToDisplay?: number[];
  };
}

export interface SendEmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export class SendGridService {
  private readonly defaultFrom = {
    email: process.env.SENDGRID_FROM_EMAIL || 'noreply@roisystems.com',
    name: process.env.SENDGRID_FROM_NAME || 'ROI Systems',
  };

  /**
   * Send single email
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const msg: MailDataRequired = {
        to: options.to,
        from: options.from || this.defaultFrom,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html),
        trackingSettings: {
          clickTracking: {
            enable: options.trackingSettings?.clickTracking?.enable ?? true,
            enableText: true,
          },
          openTracking: {
            enable: options.trackingSettings?.openTracking?.enable ?? true,
            substitutionTag: '%open-track%',
          },
          subscriptionTracking: {
            enable: options.trackingSettings?.subscriptionTracking?.enable ?? false,
          },
        },
        customArgs: options.customArgs,
        categories: options.categories,
        asm: options.asm,
      };

      const [response] = await sgMail.send(msg);

      logger.info(`✅ Email sent to ${options.to} - Message ID: ${response.headers['x-message-id']}`);

      return {
        messageId: response.headers['x-message-id'] as string,
        accepted: [options.to],
        rejected: [],
      };
    } catch (error: any) {
      logger.error(`❌ Failed to send email to ${options.to}:`, error);

      // Parse SendGrid error response
      if (error.response) {
        const { statusCode, body } = error.response;
        logger.error(`SendGrid error (${statusCode}):`, body);
      }

      throw new Error(`Email send failed: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   * Uses SendGrid's personalization feature for batch sending
   */
  async sendBulkEmails(
    emails: Array<{
      to: string;
      subject: string;
      html: string;
      text?: string;
      customArgs?: Record<string, string>;
    }>,
    from?: { email: string; name: string }
  ): Promise<SendEmailResult[]> {
    try {
      const messages = emails.map((email) => ({
        to: email.to,
        from: from || this.defaultFrom,
        subject: email.subject,
        html: email.html,
        text: email.text || this.htmlToText(email.html),
        customArgs: email.customArgs,
        trackingSettings: {
          clickTracking: { enable: true },
          openTracking: { enable: true },
        },
      }));

      const response = await sgMail.send(messages as any);

      logger.info(`✅ Bulk sent ${emails.length} emails`);

      return response.map((r: any) => ({
        messageId: r[0].headers['x-message-id'] as string,
        accepted: [emails[0].to], // Simplified
        rejected: [],
      }));
    } catch (error: any) {
      logger.error('❌ Bulk email send failed:', error);
      throw new Error(`Bulk email send failed: ${error.message}`);
    }
  }

  /**
   * Generate tracking pixel URL
   */
  generateTrackingPixel(messageId: string, subscriberId: string): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    return `${baseUrl}/api/track/open?mid=${messageId}&sid=${subscriberId}`;
  }

  /**
   * Generate click tracking URL
   */
  generateClickTrackingUrl(
    originalUrl: string,
    messageId: string,
    subscriberId: string,
    linkId?: string
  ): string {
    const baseUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const params = new URLSearchParams({
      url: originalUrl,
      mid: messageId,
      sid: subscriberId,
      ...(linkId && { lid: linkId }),
    });

    return `${baseUrl}/api/track/click?${params.toString()}`;
  }

  /**
   * Generate unsubscribe URL
   */
  generateUnsubscribeUrl(subscriberId: string, campaignId: string): string {
    const token = this.generateUnsubscribeToken(subscriberId, campaignId);
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5051';
    return `${baseUrl}/unsubscribe?token=${token}`;
  }

  /**
   * Generate secure unsubscribe token
   */
  private generateUnsubscribeToken(subscriberId: string, campaignId: string): string {
    const secret = process.env.UNSUBSCRIBE_SECRET || 'change-this-secret';
    const data = `${subscriberId}:${campaignId}:${Date.now()}`;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);

    return Buffer.from(`${data}:${hmac.digest('hex')}`).toString('base64url');
  }

  /**
   * Verify unsubscribe token
   */
  verifyUnsubscribeToken(token: string): { subscriberId: string; campaignId: string } | null {
    try {
      const decoded = Buffer.from(token, 'base64url').toString('utf-8');
      const [subscriberId, campaignId, timestamp, signature] = decoded.split(':');

      // Regenerate signature
      const secret = process.env.UNSUBSCRIBE_SECRET || 'change-this-secret';
      const data = `${subscriberId}:${campaignId}:${timestamp}`;
      const hmac = crypto.createHmac('sha256', secret);
      hmac.update(data);
      const expectedSignature = hmac.digest('hex');

      // Verify signature
      if (signature !== expectedSignature) {
        logger.warn('Invalid unsubscribe token signature');
        return null;
      }

      // Check token age (30 days max)
      const tokenAge = Date.now() - parseInt(timestamp);
      if (tokenAge > 30 * 24 * 60 * 60 * 1000) {
        logger.warn('Expired unsubscribe token');
        return null;
      }

      return { subscriberId, campaignId };
    } catch (error) {
      logger.error('Failed to verify unsubscribe token:', error);
      return null;
    }
  }

  /**
   * Add UTM parameters to URLs
   */
  addUTMParameters(
    url: string,
    params: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
    }
  ): string {
    try {
      const urlObj = new URL(url);

      if (params.source) urlObj.searchParams.set('utm_source', params.source);
      if (params.medium) urlObj.searchParams.set('utm_medium', params.medium);
      if (params.campaign) urlObj.searchParams.set('utm_campaign', params.campaign);
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
  processLinksForTracking(
    html: string,
    messageId: string,
    subscriberId: string,
    utmParams?: {
      source?: string;
      medium?: string;
      campaign?: string;
      content?: string;
    }
  ): string {
    let linkId = 0;

    // Replace all <a href="..."> tags
    return html.replace(/<a\s+href="([^"]+)"/gi, (match, url) => {
      linkId++;

      // Add UTM parameters
      let trackedUrl = url;
      if (utmParams) {
        trackedUrl = this.addUTMParameters(url, utmParams);
      }

      // Add click tracking
      trackedUrl = this.generateClickTrackingUrl(
        trackedUrl,
        messageId,
        subscriberId,
        `link-${linkId}`
      );

      return `<a href="${trackedUrl}"`;
    });
  }

  /**
   * Add tracking pixel to HTML
   */
  addTrackingPixel(html: string, messageId: string, subscriberId: string): string {
    const pixelUrl = this.generateTrackingPixel(messageId, subscriberId);
    const pixelTag = `<img src="${pixelUrl}" width="1" height="1" alt="" style="display:none;" />`;

    // Insert before closing </body> tag, or at the end if no body tag
    if (html.includes('</body>')) {
      return html.replace('</body>', `${pixelTag}</body>`);
    }

    return `${html}${pixelTag}`;
  }

  /**
   * Convert HTML to plain text (basic implementation)
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Validate email address
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get SendGrid API status
   */
  async getAPIStatus(): Promise<boolean> {
    try {
      // Simple test to check if API key is valid
      // SendGrid doesn't have a dedicated ping endpoint, so we'll try to get suppression list
      await sgMail.request({
        method: 'GET',
        url: '/v3/suppression/bounces',
        qs: { limit: 1 },
      } as any);

      return true;
    } catch (error) {
      logger.error('SendGrid API status check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const sendGridService = new SendGridService();
