/**
 * AWS SES Webhook Handler
 *
 * Handles AWS SES SNS notification processing
 * Documentation: https://docs.aws.amazon.com/ses/latest/dg/event-publishing-retrieving-sns.html
 */

import crypto from 'crypto';
import https from 'https';
import { createLogger } from '../../../utils/logger';
import {
  NormalizedEvent,
  EmailProviderType,
  EmailEventType,
  BounceType,
  ComplaintType,
  WebhookValidationResult
} from '../webhook-handler.service';

const logger = createLogger('ses-webhook');

/**
 * AWS SNS Message format
 */
interface SNSMessage {
  Type: string;
  MessageId: string;
  TopicArn: string;
  Subject?: string;
  Message: string;
  Timestamp: string;
  SignatureVersion: string;
  Signature: string;
  SigningCertURL: string;
  UnsubscribeURL?: string;
  SubscribeURL?: string;
}

/**
 * SES Event types
 */
interface SESEvent {
  eventType: string;
  mail: {
    timestamp: string;
    messageId: string;
    source: string;
    sourceArn: string;
    sendingAccountId: string;
    destination: string[];
    headers?: Array<{ name: string; value: string }>;
    commonHeaders?: {
      from: string[];
      to: string[];
      subject: string;
    };
    tags?: {
      [key: string]: string[];
    };
  };
}

interface SESBounceEvent extends SESEvent {
  bounce: {
    bounceType: string;
    bounceSubType: string;
    bouncedRecipients: Array<{
      emailAddress: string;
      action?: string;
      status?: string;
      diagnosticCode?: string;
    }>;
    timestamp: string;
    feedbackId: string;
    remoteMtaIp?: string;
    reportingMTA?: string;
  };
}

interface SESComplaintEvent extends SESEvent {
  complaint: {
    complainedRecipients: Array<{
      emailAddress: string;
    }>;
    timestamp: string;
    feedbackId: string;
    userAgent?: string;
    complaintFeedbackType?: string;
    arrivalDate?: string;
  };
}

interface SESDeliveryEvent extends SESEvent {
  delivery: {
    timestamp: string;
    processingTimeMillis: number;
    recipients: string[];
    smtpResponse: string;
    remoteMtaIp: string;
    reportingMTA: string;
  };
}

interface SESSendEvent extends SESEvent {
  send: {
    // Send events don't have additional data
  };
}

export class SESWebhookHandler {
  /**
   * Validate AWS SNS signature
   *
   * AWS SNS uses RSA signature with SHA256
   * Documentation: https://docs.aws.amazon.com/sns/latest/dg/sns-verify-signature-of-message.html
   */
  async validateSignature(
    payload: any,
    signature: string,
    headers: Record<string, string | string[]>
  ): Promise<WebhookValidationResult> {
    try {
      const message: SNSMessage = payload;

      // For subscription confirmation, we need to confirm via HTTP
      if (message.Type === 'SubscriptionConfirmation') {
        await this.confirmSubscription(message);
        return { valid: true };
      }

      // Skip validation in development
      if (process.env.NODE_ENV === 'development') {
        logger.warn('⚠️ Skipping SNS signature validation in development');
        return { valid: true };
      }

      // Download and cache the signing certificate
      const certificate = await this.getSigningCertificate(message.SigningCertURL);

      // Build the string to sign based on message type
      const stringToSign = this.buildStringToSign(message);

      // Verify the signature
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(stringToSign, 'utf8');

      const isValid = verifier.verify(certificate, message.Signature, 'base64');

      if (!isValid) {
        return {
          valid: false,
          reason: 'Invalid SNS signature'
        };
      }

      return { valid: true };

    } catch (error: any) {
      logger.error('Error validating SES/SNS signature:', error);
      return {
        valid: false,
        reason: error.message
      };
    }
  }

  /**
   * Parse SES webhook events
   *
   * SES sends events via SNS, which wraps the actual event in a Message field
   */
  parseEvents(payload: any): NormalizedEvent[] {
    try {
      const snsMessage: SNSMessage = payload;

      // Handle subscription confirmation
      if (snsMessage.Type === 'SubscriptionConfirmation') {
        logger.info('📝 SNS subscription confirmed');
        return [];
      }

      // Handle unsubscribe confirmation
      if (snsMessage.Type === 'UnsubscribeConfirmation') {
        logger.info('📝 SNS unsubscribe confirmed');
        return [];
      }

      // Parse the actual SES event from the Message field
      const sesEvent: SESEvent = JSON.parse(snsMessage.Message);

      return [this.normalizeEvent(sesEvent, snsMessage)];

    } catch (error: any) {
      logger.error('Error parsing SES events:', error);
      throw error;
    }
  }

  /**
   * Normalize SES event to common format
   */
  private normalizeEvent(sesEvent: SESEvent, snsMessage: SNSMessage): NormalizedEvent {
    // Extract custom args from tags
    const tags = sesEvent.mail.tags || {};
    const emailId = tags.emailId?.[0];
    const campaignId = tags.campaignId?.[0];
    const subscriberId = tags.subscriberId?.[0];

    // Get recipient email (SES can have multiple, we'll process each separately)
    const recipientEmail = sesEvent.mail.destination[0];

    const normalizedEvent: NormalizedEvent = {
      provider: EmailProviderType.AWS_SES,
      providerMessageId: sesEvent.mail.messageId,
      providerEventId: snsMessage.MessageId,
      eventType: this.mapEventType(sesEvent.eventType),
      timestamp: new Date(snsMessage.Timestamp),
      recipientEmail,
      emailId,
      campaignId,
      subscriberId,
      metadata: {},
      rawData: { sesEvent, snsMessage }
    };

    // Add event-specific metadata
    switch (sesEvent.eventType) {
      case 'Bounce':
        this.addBounceMetadata(normalizedEvent, sesEvent as SESBounceEvent, recipientEmail);
        break;

      case 'Complaint':
        this.addComplaintMetadata(normalizedEvent, sesEvent as SESComplaintEvent, recipientEmail);
        break;

      case 'Delivery':
        this.addDeliveryMetadata(normalizedEvent, sesEvent as SESDeliveryEvent);
        break;

      case 'Send':
        // Send events don't have additional metadata
        break;
    }

    return normalizedEvent;
  }

  /**
   * Add bounce-specific metadata
   */
  private addBounceMetadata(
    event: NormalizedEvent,
    sesEvent: SESBounceEvent,
    recipientEmail: string
  ): void {
    const bounce = sesEvent.bounce;
    const recipient = bounce.bouncedRecipients.find(r => r.emailAddress === recipientEmail);

    event.metadata.bounceType = this.mapBounceType(bounce.bounceType, bounce.bounceSubType);
    event.metadata.bounceReason = recipient?.diagnosticCode || bounce.bounceSubType;
    event.metadata.bounceCode = recipient?.status;
    event.metadata.smtpResponse = recipient?.diagnosticCode;
    event.metadata.ipAddress = bounce.remoteMtaIp;
  }

  /**
   * Add complaint-specific metadata
   */
  private addComplaintMetadata(
    event: NormalizedEvent,
    sesEvent: SESComplaintEvent,
    recipientEmail: string
  ): void {
    const complaint = sesEvent.complaint;

    event.metadata.complaintType = this.mapComplaintType(complaint.complaintFeedbackType);
    event.metadata.complaintFeedbackType = complaint.complaintFeedbackType;
    event.metadata.userAgent = complaint.userAgent;
  }

  /**
   * Add delivery-specific metadata
   */
  private addDeliveryMetadata(
    event: NormalizedEvent,
    sesEvent: SESDeliveryEvent
  ): void {
    const delivery = sesEvent.delivery;

    event.metadata.smtpResponse = delivery.smtpResponse;
    event.metadata.ipAddress = delivery.remoteMtaIp;
  }

  /**
   * Map SES event types to normalized event types
   */
  private mapEventType(sesEventType: string): EmailEventType {
    const eventMap: Record<string, EmailEventType> = {
      'Send': EmailEventType.SENT,
      'Delivery': EmailEventType.DELIVERED,
      'Bounce': EmailEventType.BOUNCED,
      'Complaint': EmailEventType.COMPLAINED,
      'Reject': EmailEventType.DROPPED,
      'Open': EmailEventType.OPENED,
      'Click': EmailEventType.CLICKED
    };

    return eventMap[sesEventType] || EmailEventType.FAILED;
  }

  /**
   * Map SES bounce types to normalized bounce types
   */
  private mapBounceType(bounceType: string, bounceSubType: string): BounceType {
    // Permanent bounces
    if (bounceType === 'Permanent') {
      return BounceType.HARD;
    }

    // Transient bounces
    if (bounceType === 'Transient') {
      // Some transient bounces should be treated as hard bounces
      const hardSubTypes = ['MailboxFull', 'ContentRejected', 'AttachmentRejected'];
      if (hardSubTypes.includes(bounceSubType)) {
        return BounceType.HARD;
      }
      return BounceType.SOFT;
    }

    return BounceType.UNDETERMINED;
  }

  /**
   * Map SES complaint feedback types to normalized complaint types
   */
  private mapComplaintType(feedbackType?: string): ComplaintType {
    if (!feedbackType) {
      return ComplaintType.OTHER;
    }

    const complaintMap: Record<string, ComplaintType> = {
      'abuse': ComplaintType.ABUSE,
      'fraud': ComplaintType.FRAUD,
      'not-spam': ComplaintType.NOT_SPAM
    };

    return complaintMap[feedbackType.toLowerCase()] || ComplaintType.OTHER;
  }

  /**
   * Confirm SNS subscription
   */
  private async confirmSubscription(message: SNSMessage): Promise<void> {
    if (!message.SubscribeURL) {
      throw new Error('No SubscribeURL in confirmation message');
    }

    return new Promise((resolve, reject) => {
      https.get(message.SubscribeURL, (res) => {
        if (res.statusCode === 200) {
          logger.info('✅ SNS subscription confirmed');
          resolve();
        } else {
          reject(new Error(`Failed to confirm subscription: ${res.statusCode}`));
        }
      }).on('error', reject);
    });
  }

  /**
   * Get signing certificate from AWS
   */
  private async getSigningCertificate(certUrl: string): Promise<string> {
    // Validate certificate URL (must be from AWS)
    const url = new URL(certUrl);
    if (!url.hostname.endsWith('.amazonaws.com')) {
      throw new Error('Invalid certificate URL - must be from amazonaws.com');
    }

    return new Promise((resolve, reject) => {
      https.get(certUrl, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    });
  }

  /**
   * Build string to sign for SNS message verification
   */
  private buildStringToSign(message: SNSMessage): string {
    const fields = message.Type === 'Notification'
      ? ['Message', 'MessageId', 'Subject', 'Timestamp', 'TopicArn', 'Type']
      : ['Message', 'MessageId', 'SubscribeURL', 'Timestamp', 'Token', 'TopicArn', 'Type'];

    return fields
      .filter(field => message[field as keyof SNSMessage] !== undefined)
      .map(field => `${field}\n${message[field as keyof SNSMessage]}\n`)
      .join('');
  }

  /**
   * Handle bounce notification
   */
  handleBounce(notification: SESBounceEvent): NormalizedEvent {
    // Process each bounced recipient
    const recipient = notification.bounce.bouncedRecipients[0];
    return this.normalizeEvent(notification, {
      MessageId: notification.bounce.feedbackId,
      Timestamp: notification.bounce.timestamp
    } as any);
  }

  /**
   * Handle complaint notification
   */
  handleComplaint(notification: SESComplaintEvent): NormalizedEvent {
    return this.normalizeEvent(notification, {
      MessageId: notification.complaint.feedbackId,
      Timestamp: notification.complaint.timestamp
    } as any);
  }

  /**
   * Handle delivery notification
   */
  handleDelivery(notification: SESDeliveryEvent): NormalizedEvent {
    return this.normalizeEvent(notification, {
      MessageId: notification.mail.messageId,
      Timestamp: notification.delivery.timestamp
    } as any);
  }

  /**
   * Handle send notification
   */
  handleSend(notification: SESSendEvent): NormalizedEvent {
    return this.normalizeEvent(notification, {
      MessageId: notification.mail.messageId,
      Timestamp: notification.mail.timestamp
    } as any);
  }
}
