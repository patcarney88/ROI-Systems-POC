/**
 * Mock SMS Service
 *
 * Demo-ready SMS service that simulates Twilio/AWS SNS
 * without requiring actual API credentials.
 */

import { createLogger } from '../../utils/logger';
import { EventEmitter } from 'events';

export interface SMSParams {
  to: string; // Phone number
  message: string;
  trackingId?: string;
  metadata?: Record<string, any>;
  from?: string;
}

export interface ScheduledSMSParams {
  to: string;
  message: string;
  sendAt: Date;
}

export interface SMSDeliveryResult {
  messageId: string;
  status: 'sent' | 'delivered' | 'failed' | 'undelivered';
  timestamp: Date;
  to: string;
  trackingId?: string;
  segments: number; // Number of SMS segments (160 chars each)
}

export class MockSMSService extends EventEmitter {
  private logger: any;
  private sentMessages: SMSDeliveryResult[] = [];
  private scheduledMessages: Map<string, ScheduledSMSParams> = new Map();
  private deliveryDelay: number = 50; // Faster than email
  private failureRate: number = 0.01; // 1% failure rate

  constructor(config?: { deliveryDelay?: number; failureRate?: number }) {
    super();
    this.logger = createLogger('MockSMSService');
    if (config?.deliveryDelay !== undefined) {
      this.deliveryDelay = config.deliveryDelay;
    }
    if (config?.failureRate !== undefined) {
      this.failureRate = config.failureRate;
    }
  }

  /**
   * Send SMS immediately
   */
  async send(params: SMSParams): Promise<SMSDeliveryResult> {
    // Validate message length
    if (params.message.length > 1600) {
      throw new Error('SMS message too long (max 1600 characters)');
    }

    // Calculate segments (160 chars per segment)
    const segments = Math.ceil(params.message.length / 160);

    this.logger.info(`📱 Sending SMS to ${params.to} (${segments} segment${segments > 1 ? 's' : ''})`);

    // Simulate network delay
    await this.delay(this.deliveryDelay);

    // Simulate random failure for realism
    const shouldFail = Math.random() < this.failureRate;

    const messageId = this.generateMessageId();
    const result: SMSDeliveryResult = {
      messageId,
      status: shouldFail ? 'failed' : 'delivered',
      timestamp: new Date(),
      to: params.to,
      trackingId: params.trackingId,
      segments
    };

    this.sentMessages.push(result);

    // Log SMS content in development
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug('SMS Content:', {
        to: params.to,
        message: params.message.substring(0, 100) + (params.message.length > 100 ? '...' : ''),
        segments,
        metadata: params.metadata
      });
    }

    // Emit event for tracking
    this.emit('sms:sent', result);

    if (shouldFail) {
      this.logger.warn(`📱 SMS failed: ${params.to}`);
      this.emit('sms:failed', result);
    } else {
      this.logger.info(`✅ SMS delivered: ${params.to}`);
      this.emit('sms:delivered', result);

      // Simulate engagement (clicks on links in SMS)
      this.simulateEngagement(result, params.message);
    }

    return result;
  }

  /**
   * Schedule SMS for future delivery
   */
  async schedule(params: ScheduledSMSParams): Promise<string> {
    const scheduleId = this.generateMessageId();
    this.scheduledMessages.set(scheduleId, params);

    const delay = params.sendAt.getTime() - Date.now();

    this.logger.info(
      `📅 SMS scheduled for ${params.to} at ${params.sendAt.toISOString()} (in ${Math.round(delay / 1000)}s)`
    );

    // Schedule actual send
    setTimeout(async () => {
      const scheduled = this.scheduledMessages.get(scheduleId);
      if (scheduled) {
        await this.send({
          to: scheduled.to,
          message: scheduled.message,
          trackingId: scheduleId
        });
        this.scheduledMessages.delete(scheduleId);
      }
    }, delay > 0 ? delay : 0);

    return scheduleId;
  }

  /**
   * Simulate user engagement (link clicks)
   */
  private async simulateEngagement(result: SMSDeliveryResult, message: string): Promise<void> {
    // Check if message contains a link
    const hasLink = message.includes('http://') || message.includes('https://');

    if (hasLink) {
      // 30% click rate for SMS (typically higher than email)
      const clickRate = 0.30;
      const willClick = Math.random() < clickRate;

      if (willClick) {
        // Simulate click after 2-15 minutes
        const clickDelay = 2000 + Math.random() * 13000;
        setTimeout(() => {
          this.logger.info(`🖱️  SMS link clicked: ${result.to}`);
          this.emit('sms:clicked', {
            ...result,
            clickedAt: new Date(),
            device: 'mobile' // SMS is always mobile
          });
        }, clickDelay);
      }
    }
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // Simple validation for demo (E.164 format)
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phone);
  }

  /**
   * Format phone number to E.164
   */
  formatPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');

    // Add country code if missing (assume US)
    if (digits.length === 10) {
      return `+1${digits}`;
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }

    return `+${digits}`;
  }

  /**
   * Get sent messages (for demo/testing)
   */
  getSentMessages(): SMSDeliveryResult[] {
    return this.sentMessages;
  }

  /**
   * Get scheduled messages (for demo/testing)
   */
  getScheduledMessages(): ScheduledSMSParams[] {
    return Array.from(this.scheduledMessages.values());
  }

  /**
   * Clear all sent messages (for demo reset)
   */
  clearSentMessages(): void {
    this.sentMessages = [];
    this.logger.info('📱 Cleared all sent SMS messages');
  }

  /**
   * Generate realistic message ID
   */
  private generateMessageId(): string {
    return `sms_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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
    failed: number;
    totalSegments: number;
    deliveryRate: number;
  } {
    const totalSent = this.sentMessages.length;
    const delivered = this.sentMessages.filter(m => m.status === 'delivered').length;
    const failed = this.sentMessages.filter(m => m.status === 'failed').length;
    const totalSegments = this.sentMessages.reduce((sum, m) => sum + m.segments, 0);

    return {
      totalSent,
      delivered,
      failed,
      totalSegments,
      deliveryRate: totalSent > 0 ? delivered / totalSent : 0
    };
  }

  /**
   * Calculate cost estimate (for demo purposes)
   */
  calculateCost(segments: number): number {
    // Typical SMS pricing: $0.0075 per segment
    const pricePerSegment = 0.0075;
    return segments * pricePerSegment;
  }
}

// Singleton instance for demo
export const mockSMSService = new MockSMSService({
  deliveryDelay: 50,
  failureRate: 0.01
});
