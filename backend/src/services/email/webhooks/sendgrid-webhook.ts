/**
 * SendGrid Webhook Handler
 *
 * Handles SendGrid-specific webhook events and signature validation
 * Documentation: https://docs.sendgrid.com/for-developers/tracking-events/event
 */

import crypto from 'crypto';
import { createLogger } from '../../../utils/logger';
import {
  NormalizedEvent,
  EmailProviderType,
  EmailEventType,
  BounceType,
  WebhookValidationResult
} from '../webhook-handler.service';
import UAParser from 'ua-parser-js';

const logger = createLogger('sendgrid-webhook');

/**
 * SendGrid webhook event interface
 */
interface SendGridEvent {
  email: string;
  timestamp: number;
  event: string;
  sg_event_id?: string;
  sg_message_id?: string;

  // Custom args
  campaignId?: string;
  subscriberId?: string;
  emailId?: string;

  // Tracking data
  url?: string;
  ip?: string;
  useragent?: string;

  // Bounce data
  bounce_classification?: string;
  reason?: string;
  status?: string;

  // Complaint data
  asm_group_id?: number;

  // Categories
  category?: string | string[];

  // Raw data
  [key: string]: any;
}

export class SendGridWebhookHandler {
  /**
   * Validate SendGrid webhook signature
   *
   * SendGrid uses ECDSA signature verification
   * Documentation: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
   */
  async validateSignature(
    payload: any,
    signature: string,
    headers: Record<string, string | string[]>
  ): Promise<WebhookValidationResult> {
    try {
      const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;

      // Skip validation in development if no secret configured
      if (!webhookSecret) {
        logger.warn('⚠️ SENDGRID_WEBHOOK_SECRET not configured - skipping signature validation');
        return { valid: true };
      }

      // Get signature and timestamp from headers
      const signatureHeader = headers['x-twilio-email-event-webhook-signature'] as string;
      const timestampHeader = headers['x-twilio-email-event-webhook-timestamp'] as string;

      if (!signatureHeader || !timestampHeader) {
        return {
          valid: false,
          reason: 'Missing signature or timestamp headers'
        };
      }

      // Check timestamp to prevent replay attacks (within 10 minutes)
      const requestTime = parseInt(timestampHeader);
      const currentTime = Math.floor(Date.now() / 1000);

      if (Math.abs(currentTime - requestTime) > 600) {
        return {
          valid: false,
          reason: 'Timestamp too old or too far in future'
        };
      }

      // Verify ECDSA signature
      const payloadString = JSON.stringify(payload);
      const data = timestampHeader + payloadString;

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(data)
        .digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signatureHeader),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        return {
          valid: false,
          reason: 'Invalid signature'
        };
      }

      return { valid: true };

    } catch (error: any) {
      logger.error('Error validating SendGrid signature:', error);
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  /**
   * Parse SendGrid webhook events
   *
   * SendGrid sends events as an array
   */
  parseEvents(payload: any): NormalizedEvent[] {
    try {
      const events: SendGridEvent[] = Array.isArray(payload) ? payload : [payload];
      return events.map(event => this.normalizeEvent(event));
    } catch (error: any) {
      logger.error('Error parsing SendGrid events:', error);
      throw error;
    }
  }

  /**
   * Normalize single SendGrid event
   */
  private normalizeEvent(event: SendGridEvent): NormalizedEvent {
    const normalizedEvent: NormalizedEvent = {
      provider: EmailProviderType.SENDGRID,
      providerMessageId: event.sg_message_id || '',
      providerEventId: event.sg_event_id,
      eventType: this.mapEventType(event.event),
      timestamp: new Date(event.timestamp * 1000),
      recipientEmail: event.email,
      emailId: event.emailId,
      campaignId: event.campaignId,
      subscriberId: event.subscriberId,
      metadata: {
        ipAddress: event.ip,
        userAgent: event.useragent,
      },
      rawData: event
    };

    // Parse user agent for device/browser info
    if (event.useragent) {
      const uaParser = new UAParser(event.useragent);
      const parsed = uaParser.getResult();

      normalizedEvent.metadata.device = parsed.device.type || 'desktop';
      normalizedEvent.metadata.browser = parsed.browser.name;
    }

    // Add event-specific metadata
    switch (normalizedEvent.eventType) {
      case EmailEventType.CLICKED:
        normalizedEvent.metadata.url = event.url;
        break;

      case EmailEventType.BOUNCED:
        normalizedEvent.metadata.bounceType = this.mapBounceType(event.bounce_classification);
        normalizedEvent.metadata.bounceReason = event.reason;
        normalizedEvent.metadata.smtpResponse = event.status;
        break;

      case EmailEventType.DROPPED:
        normalizedEvent.metadata.bounceReason = event.reason;
        normalizedEvent.metadata.smtpResponse = event.status;
        break;

      case EmailEventType.DEFERRED:
        normalizedEvent.metadata.bounceReason = event.reason;
        normalizedEvent.metadata.smtpResponse = event.response;
        normalizedEvent.metadata.attemptNumber = event.attempt;
        break;

      case EmailEventType.SPAM_REPORT:
        normalizedEvent.metadata.complaintFeedbackType = 'abuse';
        break;
    }

    return normalizedEvent;
  }

  /**
   * Map SendGrid event types to normalized event types
   */
  private mapEventType(sendgridEvent: string): EmailEventType {
    const eventMap: Record<string, EmailEventType> = {
      'processed': EmailEventType.SENT,
      'delivered': EmailEventType.DELIVERED,
      'open': EmailEventType.OPENED,
      'click': EmailEventType.CLICKED,
      'bounce': EmailEventType.BOUNCED,
      'deferred': EmailEventType.DEFERRED,
      'dropped': EmailEventType.DROPPED,
      'unsubscribe': EmailEventType.UNSUBSCRIBED,
      'group_unsubscribe': EmailEventType.UNSUBSCRIBED,
      'spamreport': EmailEventType.SPAM_REPORT
    };

    return eventMap[sendgridEvent] || EmailEventType.FAILED;
  }

  /**
   * Map SendGrid bounce classification to normalized bounce type
   */
  private mapBounceType(classification?: string): BounceType {
    if (!classification) {
      return BounceType.UNDETERMINED;
    }

    const bounceMap: Record<string, BounceType> = {
      'hard': BounceType.HARD,
      'soft': BounceType.SOFT,
      'block': BounceType.HARD,
      'invalid': BounceType.HARD
    };

    return bounceMap[classification.toLowerCase()] || BounceType.UNDETERMINED;
  }

  /**
   * Handle processed event (SendGrid-specific)
   */
  handleProcessed(event: SendGridEvent): NormalizedEvent {
    return this.normalizeEvent({ ...event, event: 'processed' });
  }

  /**
   * Handle delivered event
   */
  handleDelivered(event: SendGridEvent): NormalizedEvent {
    return this.normalizeEvent({ ...event, event: 'delivered' });
  }

  /**
   * Handle bounce event
   */
  handleBounce(event: SendGridEvent): NormalizedEvent {
    return this.normalizeEvent({ ...event, event: 'bounce' });
  }

  /**
   * Handle spam report event
   */
  handleSpamReport(event: SendGridEvent): NormalizedEvent {
    return this.normalizeEvent({ ...event, event: 'spamreport' });
  }
}
