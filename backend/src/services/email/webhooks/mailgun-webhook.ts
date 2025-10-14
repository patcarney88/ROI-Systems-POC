/**
 * Mailgun Webhook Handler
 *
 * Handles Mailgun-specific webhook events and signature validation
 * Documentation: https://documentation.mailgun.com/en/latest/api-events.html
 */

import crypto from 'crypto';
import { createLogger } from '../../../utils/logger';
import {
  NormalizedEvent,
  EmailProviderType,
  EmailEventType,
  BounceType,
  ComplaintType,
  WebhookValidationResult
} from '../webhook-handler.service';
import UAParser from 'ua-parser-js';

const logger = createLogger('mailgun-webhook');

/**
 * Mailgun webhook event interface
 */
interface MailgunEvent {
  signature: {
    timestamp: string;
    token: string;
    signature: string;
  };
  'event-data': {
    event: string;
    timestamp: number;
    id: string;
    'log-level'?: string;

    // Message data
    message: {
      headers: {
        'message-id': string;
        to?: string;
        from?: string;
        subject?: string;
      };
    };

    // Recipient data
    recipient: string;
    'recipient-domain'?: string;

    // Delivery data
    'delivery-status'?: {
      'attempt-no'?: number;
      message?: string;
      code?: number;
      description?: string;
      'session-seconds'?: number;
    };

    // Failure data
    severity?: string;
    reason?: string;

    // Geolocation
    geolocation?: {
      country?: string;
      region?: string;
      city?: string;
    };

    // Device data
    'client-info'?: {
      'client-name'?: string;
      'client-type'?: string;
      'client-os'?: string;
      'device-type'?: string;
      'user-agent'?: string;
    };

    // Click data
    url?: string;

    // Campaign data
    'user-variables'?: {
      emailId?: string;
      campaignId?: string;
      subscriberId?: string;
      [key: string]: any;
    };

    // IP
    ip?: string;

    // Tags
    tags?: string[];

    // Flags
    flags?: {
      'is-routed'?: boolean;
      'is-authenticated'?: boolean;
      'is-system-test'?: boolean;
      'is-test-mode'?: boolean;
    };
  };
}

export class MailgunWebhookHandler {
  /**
   * Validate Mailgun webhook signature
   *
   * Mailgun uses HMAC SHA256 for signature verification
   * Documentation: https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
   */
  async validateSignature(
    payload: any,
    signature: string,
    headers: Record<string, string | string[]>
  ): Promise<WebhookValidationResult> {
    try {
      const webhookSecret = process.env.MAILGUN_WEBHOOK_SECRET;

      // Skip validation in development if no secret configured
      if (!webhookSecret) {
        logger.warn('⚠️ MAILGUN_WEBHOOK_SECRET not configured - skipping signature validation');
        return { valid: true };
      }

      const event: MailgunEvent = payload;
      const { timestamp, token, signature: eventSignature } = event.signature;

      // Check timestamp to prevent replay attacks (within 15 minutes)
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);

      if (Math.abs(currentTime - requestTime) > 900) {
        return {
          valid: false,
          reason: 'Timestamp too old or too far in future'
        };
      }

      // Verify HMAC signature
      const data = timestamp + token;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(data)
        .digest('hex');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(eventSignature),
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
      logger.error('Error validating Mailgun signature:', error);
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  /**
   * Parse Mailgun webhook events
   *
   * Mailgun sends one event per webhook call
   */
  parseEvents(payload: any): NormalizedEvent[] {
    try {
      const event: MailgunEvent = payload;
      return [this.normalizeEvent(event)];
    } catch (error: any) {
      logger.error('Error parsing Mailgun events:', error);
      throw error;
    }
  }

  /**
   * Normalize Mailgun event to common format
   */
  private normalizeEvent(event: MailgunEvent): NormalizedEvent {
    const eventData = event['event-data'];
    const userVars = eventData['user-variables'] || {};

    const normalizedEvent: NormalizedEvent = {
      provider: EmailProviderType.MAILGUN,
      providerMessageId: eventData.message.headers['message-id'],
      providerEventId: eventData.id,
      eventType: this.mapEventType(eventData.event),
      timestamp: new Date(eventData.timestamp * 1000),
      recipientEmail: eventData.recipient,
      emailId: userVars.emailId,
      campaignId: userVars.campaignId,
      subscriberId: userVars.subscriberId,
      metadata: {
        ipAddress: eventData.ip,
      },
      rawData: event
    };

    // Add geolocation data
    if (eventData.geolocation) {
      normalizedEvent.metadata.location = {
        country: eventData.geolocation.country,
        region: eventData.geolocation.region,
        city: eventData.geolocation.city
      };
    }

    // Add client/device data
    if (eventData['client-info']) {
      const clientInfo = eventData['client-info'];
      normalizedEvent.metadata.userAgent = clientInfo['user-agent'];
      normalizedEvent.metadata.device = clientInfo['device-type'] || 'desktop';
      normalizedEvent.metadata.browser = clientInfo['client-name'];
    }

    // Add event-specific metadata
    switch (normalizedEvent.eventType) {
      case EmailEventType.CLICKED:
        normalizedEvent.metadata.url = eventData.url;
        break;

      case EmailEventType.BOUNCED:
      case EmailEventType.DROPPED:
        this.addFailureMetadata(normalizedEvent, eventData);
        break;

      case EmailEventType.DELIVERED:
        if (eventData['delivery-status']) {
          normalizedEvent.metadata.smtpResponse = eventData['delivery-status'].message;
          normalizedEvent.metadata.attemptNumber = eventData['delivery-status']['attempt-no'];
        }
        break;

      case EmailEventType.COMPLAINED:
        normalizedEvent.metadata.complaintType = ComplaintType.ABUSE;
        break;
    }

    return normalizedEvent;
  }

  /**
   * Add failure metadata (bounces and drops)
   */
  private addFailureMetadata(event: NormalizedEvent, eventData: any): void {
    event.metadata.bounceReason = eventData.reason;

    // Determine bounce type from severity and reason
    if (eventData.severity === 'permanent' || eventData.reason === 'bounce') {
      event.metadata.bounceType = BounceType.HARD;
    } else if (eventData.severity === 'temporary') {
      event.metadata.bounceType = BounceType.SOFT;
    } else {
      event.metadata.bounceType = BounceType.UNDETERMINED;
    }

    // Add delivery status details if available
    if (eventData['delivery-status']) {
      const deliveryStatus = eventData['delivery-status'];
      event.metadata.bounceCode = deliveryStatus.code?.toString();
      event.metadata.smtpResponse = deliveryStatus.message;
      event.metadata.attemptNumber = deliveryStatus['attempt-no'];
    }
  }

  /**
   * Map Mailgun event types to normalized event types
   */
  private mapEventType(mailgunEvent: string): EmailEventType {
    const eventMap: Record<string, EmailEventType> = {
      'accepted': EmailEventType.SENT,
      'delivered': EmailEventType.DELIVERED,
      'opened': EmailEventType.OPENED,
      'clicked': EmailEventType.CLICKED,
      'unsubscribed': EmailEventType.UNSUBSCRIBED,
      'complained': EmailEventType.COMPLAINED,
      'failed': EmailEventType.BOUNCED,
      'rejected': EmailEventType.DROPPED,
      'temporary_fail': EmailEventType.DEFERRED
    };

    return eventMap[mailgunEvent] || EmailEventType.FAILED;
  }

  /**
   * Handle delivered event
   */
  handleDelivered(event: MailgunEvent): NormalizedEvent {
    return this.normalizeEvent(event);
  }

  /**
   * Handle failed event (bounce)
   */
  handleFailed(event: MailgunEvent): NormalizedEvent {
    return this.normalizeEvent(event);
  }

  /**
   * Handle opened event
   */
  handleOpened(event: MailgunEvent): NormalizedEvent {
    return this.normalizeEvent(event);
  }

  /**
   * Handle clicked event
   */
  handleClicked(event: MailgunEvent): NormalizedEvent {
    return this.normalizeEvent(event);
  }
}
