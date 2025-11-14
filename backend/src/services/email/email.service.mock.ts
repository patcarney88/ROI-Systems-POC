/**
 * Mock Email Service
 *
 * Demo-ready email service that simulates SendGrid/AWS SES
 * without requiring actual API credentials.
 */

import { createLogger } from '../../utils/logger';
import { EventEmitter } from 'events';

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  trackingId?: string;
  metadata?: Record<string, any>;
  from?: string;
  replyTo?: string;
}

export interface ScheduledEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
  sendAt: Date;
  campaignId: string;
}

export interface EmailDeliveryResult {
  messageId: string;
  status: 'sent' | 'delivered' | 'bounced' | 'failed';
  timestamp: Date;
  to: string;
  trackingId?: string;
}

export class MockEmailService extends EventEmitter {
  private logger: any;
  private sentEmails: EmailDeliveryResult[] = [];
  private scheduledEmails: Map<string, ScheduledEmailParams> = new Map();
  private deliveryDelay: number = 100; // Simulate network delay
  private bounceRate: number = 0.02; // 2% bounce rate for realism

  constructor(config?: { deliveryDelay?: number; bounceRate?: number }) {
    super();
    this.logger = createLogger('MockEmailService');
    if (config?.deliveryDelay !== undefined) {
      this.deliveryDelay = config.deliveryDelay;
    }
    if (config?.bounceRate !== undefined) {
      this.bounceRate = config.bounceRate;
    }
  }

  /**
   * Send email immediately
   */
  async send(params: EmailParams): Promise<EmailDeliveryResult> {
    this.logger.info(`📧 Sending email to ${params.to}: ${params.subject}`);

    // Simulate network delay
    await this.delay(this.deliveryDelay);

    // Simulate random bounce for realism
    const shouldBounce = Math.random() < this.bounceRate;

    const messageId = this.generateMessageId();
    const result: EmailDeliveryResult = {
      messageId,
      status: shouldBounce ? 'bounced' : 'delivered',
      timestamp: new Date(),
      to: params.to,
      trackingId: params.trackingId
    };

    this.sentEmails.push(result);

    // Log email content in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('Email Content:', {
        to: params.to,
        subject: params.subject,
        htmlLength: params.html.length,
        metadata: params.metadata
      });
    }

    // Emit event for tracking
    this.emit('email:sent', result);

    if (shouldBounce) {
      this.logger.warn(`📧 Email bounced: ${params.to}`);
      this.emit('email:bounced', result);
    } else {
      this.logger.info(`✅ Email delivered: ${params.to}`);
      this.emit('email:delivered', result);

      // Simulate opens and clicks after a delay
      this.simulateEngagement(result);
    }

    return result;
  }

  /**
   * Schedule email for future delivery
   */
  async schedule(params: ScheduledEmailParams): Promise<string> {
    const scheduleId = this.generateMessageId();
    this.scheduledEmails.set(scheduleId, params);

    const delay = params.sendAt.getTime() - Date.now();

    this.logger.info(
      `📅 Email scheduled for ${params.to} at ${params.sendAt.toISOString()} (in ${Math.round(delay / 1000)}s)`
    );

    // Schedule actual send
    setTimeout(async () => {
      const scheduled = this.scheduledEmails.get(scheduleId);
      if (scheduled) {
        await this.send({
          to: scheduled.to,
          subject: scheduled.subject,
          html: scheduled.html,
          text: scheduled.text,
          trackingId: scheduleId,
          metadata: { campaignId: scheduled.campaignId }
        });
        this.scheduledEmails.delete(scheduleId);
      }
    }, delay > 0 ? delay : 0);

    return scheduleId;
  }

  /**
   * Simulate user engagement (opens and clicks)
   */
  private async simulateEngagement(result: EmailDeliveryResult): Promise<void> {
    // 45% open rate (demo target: 40-60%)
    const openRate = 0.45;
    const willOpen = Math.random() < openRate;

    if (willOpen) {
      // Simulate open after 5-30 minutes
      const openDelay = 5000 + Math.random() * 25000;
      setTimeout(() => {
        this.logger.info(`👁️  Email opened: ${result.to}`);
        this.emit('email:opened', {
          ...result,
          openedAt: new Date(),
          device: Math.random() > 0.5 ? 'mobile' : 'desktop'
        });

        // 25% of opens result in clicks
        const clickRate = 0.25;
        const willClick = Math.random() < clickRate;

        if (willClick) {
          // Simulate click 1-5 minutes after open
          const clickDelay = 1000 + Math.random() * 4000;
          setTimeout(() => {
            this.logger.info(`🖱️  Link clicked: ${result.to}`);
            this.emit('email:clicked', {
              ...result,
              clickedAt: new Date(),
              linkUrl: 'https://roi-systems.com/dashboard'
            });
          }, clickDelay);
        }
      }, openDelay);
    }
  }

  /**
   * Get sent emails (for demo/testing)
   */
  getSentEmails(): EmailDeliveryResult[] {
    return this.sentEmails;
  }

  /**
   * Get scheduled emails (for demo/testing)
   */
  getScheduledEmails(): ScheduledEmailParams[] {
    return Array.from(this.scheduledEmails.values());
  }

  /**
   * Clear all sent emails (for demo reset)
   */
  clearSentEmails(): void {
    this.sentEmails = [];
    this.logger.info('📧 Cleared all sent emails');
  }

  /**
   * Generate realistic message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get delivery statistics
   */
  getStatistics(): {
    totalSent: number;
    delivered: number;
    bounced: number;
    deliveryRate: number;
  } {
    const totalSent = this.sentEmails.length;
    const delivered = this.sentEmails.filter(e => e.status === 'delivered').length;
    const bounced = this.sentEmails.filter(e => e.status === 'bounced').length;

    return {
      totalSent,
      delivered,
      bounced,
      deliveryRate: totalSent > 0 ? delivered / totalSent : 0
    };
  }
}

// Singleton instance for demo
export const mockEmailService = new MockEmailService({
  deliveryDelay: 100,
  bounceRate: 0.02
});
