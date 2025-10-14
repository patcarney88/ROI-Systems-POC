/**
 * Email Provider Interface
 * Abstract interface that all email providers must implement
 * Enables seamless switching between SendGrid, AWS SES, and Mailgun
 */

import {
  EmailData,
  SendResult,
  BulkSendResult,
  EmailProviderType,
  ProviderHealthStatus,
  RateLimitInfo,
  EmailEvent,
  TemplateData,
} from '../../types/email.types';

/**
 * IEmailProvider - Core interface for all email service providers
 */
export interface IEmailProvider {
  /**
   * Get provider identification
   */
  getProviderName(): EmailProviderType;
  getProviderId(): string;

  /**
   * Initialize provider with configuration
   */
  initialize(config: any): Promise<void>;

  /**
   * Send single email
   */
  sendSingle(email: EmailData): Promise<SendResult>;

  /**
   * Send bulk emails (optimized for high volume)
   */
  sendBulk(emails: EmailData[]): Promise<BulkSendResult>;

  /**
   * Send email using template
   */
  sendWithTemplate(
    templateId: string,
    templateData: Record<string, any>,
    recipient: { email: string; name?: string }
  ): Promise<SendResult>;

  /**
   * Template management
   */
  createTemplate(template: TemplateData): Promise<string>;
  updateTemplate(templateId: string, template: TemplateData): Promise<void>;
  deleteTemplate(templateId: string): Promise<void>;
  getTemplate(templateId: string): Promise<TemplateData | null>;

  /**
   * Health monitoring
   */
  checkHealth(): Promise<ProviderHealthStatus>;
  ping(): Promise<boolean>;

  /**
   * Rate limiting & quota management
   */
  getRateLimit(): Promise<RateLimitInfo>;
  checkQuota(): Promise<{
    remaining: number;
    limit: number;
    resetAt: Date;
  }>;

  /**
   * Webhook handling
   */
  validateWebhook(payload: any, signature: string, timestamp?: number): boolean;
  parseWebhook(payload: any): EmailEvent[];

  /**
   * Suppression list management
   */
  addToSuppression(email: string, reason: string): Promise<void>;
  removeFromSuppression(email: string): Promise<void>;
  checkSuppression(email: string): Promise<boolean>;
  getSuppresionList(type?: 'bounces' | 'blocks' | 'spam_reports'): Promise<string[]>;

  /**
   * Statistics & metrics
   */
  getStats(startDate: Date, endDate: Date): Promise<any>;

  /**
   * Configuration
   */
  updateConfig(config: any): Promise<void>;
  getConfig(): any;

  /**
   * Error handling
   */
  isRetryableError(error: Error): boolean;
  isPermanentError(error: Error): boolean;
  parseError(error: any): {
    code: string;
    message: string;
    retryable: boolean;
    permanent: boolean;
  };
}

/**
 * Base abstract class with common functionality
 */
export abstract class BaseEmailProvider implements IEmailProvider {
  protected config: any;
  protected providerId: string;

  constructor(providerId: string, config: any) {
    this.providerId = providerId;
    this.config = config;
  }

  abstract getProviderName(): EmailProviderType;

  getProviderId(): string {
    return this.providerId;
  }

  abstract initialize(config: any): Promise<void>;
  abstract sendSingle(email: EmailData): Promise<SendResult>;
  abstract sendBulk(emails: EmailData[]): Promise<BulkSendResult>;
  abstract sendWithTemplate(
    templateId: string,
    templateData: Record<string, any>,
    recipient: { email: string; name?: string }
  ): Promise<SendResult>;
  abstract createTemplate(template: TemplateData): Promise<string>;
  abstract updateTemplate(templateId: string, template: TemplateData): Promise<void>;
  abstract deleteTemplate(templateId: string): Promise<void>;
  abstract getTemplate(templateId: string): Promise<TemplateData | null>;
  abstract checkHealth(): Promise<ProviderHealthStatus>;
  abstract ping(): Promise<boolean>;
  abstract getRateLimit(): Promise<RateLimitInfo>;
  abstract checkQuota(): Promise<{ remaining: number; limit: number; resetAt: Date }>;
  abstract validateWebhook(payload: any, signature: string, timestamp?: number): boolean;
  abstract parseWebhook(payload: any): EmailEvent[];
  abstract addToSuppression(email: string, reason: string): Promise<void>;
  abstract removeFromSuppression(email: string): Promise<void>;
  abstract checkSuppression(email: string): Promise<boolean>;
  abstract getSuppresionList(type?: 'bounces' | 'blocks' | 'spam_reports'): Promise<string[]>;
  abstract getStats(startDate: Date, endDate: Date): Promise<any>;

  async updateConfig(config: any): Promise<void> {
    this.config = { ...this.config, ...config };
  }

  getConfig(): any {
    return this.config;
  }

  abstract isRetryableError(error: Error): boolean;
  abstract isPermanentError(error: Error): boolean;
  abstract parseError(error: any): {
    code: string;
    message: string;
    retryable: boolean;
    permanent: boolean;
  };

  /**
   * Common utility methods
   */

  protected validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  protected sanitizeEmailData(email: EmailData): EmailData {
    return {
      ...email,
      to: email.to.filter((recipient) => this.validateEmail(recipient.email)),
      cc: email.cc?.filter((recipient) => this.validateEmail(recipient.email)) || [],
      bcc: email.bcc?.filter((recipient) => this.validateEmail(recipient.email)) || [],
    };
  }

  protected calculateHealthScore(metrics: {
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
    failureRate: number;
    consecutiveFailures: number;
  }): number {
    // Health score calculation (0-100)
    let score = 100;

    // Penalize for low delivery rate
    score -= (100 - metrics.deliveryRate) * 0.5;

    // Penalize for high bounce rate
    score -= metrics.bounceRate * 2;

    // Penalize for complaints
    score -= metrics.complaintRate * 5;

    // Penalize for failures
    score -= metrics.failureRate * 3;

    // Penalize for consecutive failures
    score -= metrics.consecutiveFailures * 10;

    return Math.max(0, Math.min(100, score));
  }

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected htmlToText(html: string): string {
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
}

/**
 * Provider factory interface
 */
export interface IProviderFactory {
  createProvider(
    type: EmailProviderType,
    providerId: string,
    config: any
  ): Promise<IEmailProvider>;
}
