/**
 * Automated Marketing Campaign Engine
 *
 * Multi-channel campaign automation with AI-powered personalization
 * and send-time optimization to achieve 40-60% open rates.
 */

import { EventEmitter } from 'events';
import { createLogger } from '../../utils/logger';
import { EmailService } from '../email/email.service';
import { SMSService } from '../sms/sms.service';
import { PersonalizationEngine } from './personalization.engine';
import { SendTimeOptimizer } from './send-time-optimizer';
import { CampaignAnalytics } from './campaign.analytics';

export enum CampaignType {
  PROPERTY_UPDATES = 'property-updates',
  MARKET_INSIGHTS = 'market-insights',
  MILESTONE_CELEBRATIONS = 'milestone-celebrations',
  CUSTOM = 'custom'
}

export enum CampaignChannel {
  EMAIL = 'email',
  SMS = 'sms',
  BOTH = 'both'
}

export enum CampaignStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface CampaignRecipient {
  id: string;
  email?: string;
  phone?: string;
  firstName: string;
  lastName: string;
  timezone: string;
  metadata: Record<string, any>;
  preferences: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    preferredTime?: string; // "morning" | "afternoon" | "evening"
  };
}

export interface CampaignConfig {
  id: string;
  name: string;
  description: string;
  type: CampaignType;
  channel: CampaignChannel;

  // Scheduling
  scheduledFor?: Date;
  useSmartTiming: boolean; // Use AI to optimize send times

  // Template
  templateId: string;
  subject?: string; // For email

  // Personalization
  enablePersonalization: boolean;
  personalizationLevel: 'basic' | 'advanced' | 'ai-powered';

  // Targeting
  recipients: CampaignRecipient[];
  segmentCriteria?: Record<string, any>;

  // Performance
  targetOpenRate?: number; // Default 40-60%
  targetClickRate?: number; // Default 10-20%

  // Tracking
  trackOpens: boolean;
  trackClicks: boolean;
  trackConversions: boolean;

  // Rate Limiting
  maxSendsPerHour: number; // Prevent spam filters
  batchSize: number;
}

export interface CampaignMetrics {
  campaignId: string;
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  avgOpenTime: number; // Minutes after send
  bestPerformingSegment?: string;
  revenue?: number;
}

export class CampaignEngine extends EventEmitter {
  private logger: any;
  private emailService: EmailService;
  private smsService: SMSService;
  private personalizationEngine: PersonalizationEngine;
  private sendTimeOptimizer: SendTimeOptimizer;
  private analytics: CampaignAnalytics;

  private runningCampaigns: Map<string, CampaignConfig> = new Map();
  private campaignQueues: Map<string, CampaignRecipient[]> = new Map();
  private rateLimiters: Map<string, number> = new Map();

  constructor(
    emailService: EmailService,
    smsService: SMSService
  ) {
    super();
    this.logger = createLogger('CampaignEngine');
    this.emailService = emailService;
    this.smsService = smsService;
    this.personalizationEngine = new PersonalizationEngine();
    this.sendTimeOptimizer = new SendTimeOptimizer();
    this.analytics = new CampaignAnalytics();
  }

  /**
   * Create and schedule a new campaign
   */
  async createCampaign(config: CampaignConfig): Promise<string> {
    this.logger.info(`Creating campaign: ${config.name}`);

    // Validate configuration
    this.validateCampaignConfig(config);

    // Apply AI-powered optimizations
    if (config.useSmartTiming) {
      config = await this.optimizeCampaignTiming(config);
    }

    // Initialize analytics tracking
    await this.analytics.initializeCampaign(config.id);

    // Store campaign
    this.runningCampaigns.set(config.id, config);

    // Schedule or execute
    if (config.scheduledFor) {
      await this.scheduleCampaign(config);
    } else {
      await this.executeCampaign(config);
    }

    this.logger.info(`Campaign ${config.id} created successfully`);
    this.emit('campaign:created', { campaignId: config.id });

    return config.id;
  }

  /**
   * Execute campaign immediately
   */
  private async executeCampaign(config: CampaignConfig): Promise<void> {
    this.logger.info(`Executing campaign: ${config.id}`);

    try {
      // Update status
      config.status = CampaignStatus.RUNNING;
      this.emit('campaign:started', { campaignId: config.id });

      // Prepare recipient queue
      const queue = [...config.recipients];
      this.campaignQueues.set(config.id, queue);

      // Process in batches with rate limiting
      await this.processCampaignQueue(config);

      // Mark as completed
      config.status = CampaignStatus.COMPLETED;
      this.emit('campaign:completed', {
        campaignId: config.id,
        metrics: await this.analytics.getCampaignMetrics(config.id)
      });

    } catch (error) {
      this.logger.error(`Campaign ${config.id} failed:`, error);
      config.status = CampaignStatus.CANCELLED;
      this.emit('campaign:failed', { campaignId: config.id, error });
      throw error;
    }
  }

  /**
   * Process campaign queue with rate limiting
   */
  private async processCampaignQueue(config: CampaignConfig): Promise<void> {
    const queue = this.campaignQueues.get(config.id) || [];
    const batchSize = config.batchSize || 100;
    const maxPerHour = config.maxSendsPerHour || 1000;

    let sent = 0;
    const startTime = Date.now();

    while (queue.length > 0) {
      // Check rate limits
      if (sent >= maxPerHour) {
        const elapsed = Date.now() - startTime;
        if (elapsed < 3600000) { // Less than 1 hour
          const waitTime = 3600000 - elapsed;
          this.logger.info(`Rate limit reached, waiting ${waitTime}ms`);
          await this.delay(waitTime);
          sent = 0;
        }
      }

      // Process batch
      const batch = queue.splice(0, Math.min(batchSize, queue.length));
      await this.processBatch(config, batch);
      sent += batch.length;

      // Small delay between batches to prevent overwhelming servers
      await this.delay(100);
    }
  }

  /**
   * Process a batch of recipients
   */
  private async processBatch(
    config: CampaignConfig,
    recipients: CampaignRecipient[]
  ): Promise<void> {
    const promises = recipients.map(recipient =>
      this.sendToRecipient(config, recipient)
    );

    const results = await Promise.allSettled(promises);

    // Track results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        this.analytics.trackSent(config.id, recipients[index].id);
      } else {
        this.logger.error(`Failed to send to ${recipients[index].id}:`, result.reason);
        this.analytics.trackBounce(config.id, recipients[index].id);
      }
    });
  }

  /**
   * Send campaign to individual recipient
   */
  private async sendToRecipient(
    config: CampaignConfig,
    recipient: CampaignRecipient
  ): Promise<void> {
    // Apply personalization
    let content = await this.personalizationEngine.personalize(
      config.templateId,
      recipient,
      config.personalizationLevel
    );

    // Determine optimal send time for this recipient
    let sendTime = new Date();
    if (config.useSmartTiming) {
      sendTime = await this.sendTimeOptimizer.getOptimalTime(recipient);
    }

    // Schedule or send immediately
    const shouldSendNow = sendTime.getTime() <= Date.now();

    if (config.channel === CampaignChannel.EMAIL || config.channel === CampaignChannel.BOTH) {
      if (recipient.preferences.emailEnabled && recipient.email) {
        if (shouldSendNow) {
          await this.emailService.send({
            to: recipient.email,
            subject: content.subject,
            html: content.html,
            text: content.text,
            trackingId: `${config.id}-${recipient.id}`,
            metadata: {
              campaignId: config.id,
              recipientId: recipient.id,
              type: config.type
            }
          });
        } else {
          await this.emailService.schedule({
            to: recipient.email,
            subject: content.subject,
            html: content.html,
            sendAt: sendTime,
            campaignId: config.id
          });
        }
      }
    }

    if (config.channel === CampaignChannel.SMS || config.channel === CampaignChannel.BOTH) {
      if (recipient.preferences.smsEnabled && recipient.phone) {
        if (shouldSendNow) {
          await this.smsService.send({
            to: recipient.phone,
            message: content.sms,
            trackingId: `${config.id}-${recipient.id}`,
            metadata: {
              campaignId: config.id,
              recipientId: recipient.id
            }
          });
        } else {
          await this.smsService.schedule({
            to: recipient.phone,
            message: content.sms,
            sendAt: sendTime
          });
        }
      }
    }

    this.emit('campaign:sent', {
      campaignId: config.id,
      recipientId: recipient.id,
      channel: config.channel
    });
  }

  /**
   * Optimize campaign timing using AI
   */
  private async optimizeCampaignTiming(config: CampaignConfig): Promise<CampaignConfig> {
    this.logger.info(`Optimizing send times for campaign ${config.id}`);

    // Analyze historical data for optimal send times
    const optimalTimes = await this.sendTimeOptimizer.analyzeCampaignType(config.type);

    // Apply optimizations
    if (!config.scheduledFor && optimalTimes.recommendedTime) {
      config.scheduledFor = optimalTimes.recommendedTime;
    }

    // Adjust batch size based on expected engagement
    if (optimalTimes.recommendedBatchSize) {
      config.batchSize = optimalTimes.recommendedBatchSize;
    }

    return config;
  }

  /**
   * Schedule campaign for future execution
   */
  private async scheduleCampaign(config: CampaignConfig): Promise<void> {
    const delay = config.scheduledFor!.getTime() - Date.now();

    if (delay <= 0) {
      // Should execute now
      await this.executeCampaign(config);
      return;
    }

    this.logger.info(`Campaign ${config.id} scheduled for ${config.scheduledFor}`);
    config.status = CampaignStatus.SCHEDULED;

    // Schedule execution
    setTimeout(() => {
      this.executeCampaign(config);
    }, delay);
  }

  /**
   * Validate campaign configuration
   */
  private validateCampaignConfig(config: CampaignConfig): void {
    if (!config.id || !config.name) {
      throw new Error('Campaign ID and name are required');
    }

    if (!config.recipients || config.recipients.length === 0) {
      throw new Error('Campaign must have at least one recipient');
    }

    if (!config.templateId) {
      throw new Error('Campaign must specify a template');
    }

    // Validate channel-specific requirements
    if (config.channel === CampaignChannel.EMAIL) {
      const emailRecipients = config.recipients.filter(r => r.email);
      if (emailRecipients.length === 0) {
        throw new Error('Email campaign requires recipients with email addresses');
      }
    }

    if (config.channel === CampaignChannel.SMS) {
      const smsRecipients = config.recipients.filter(r => r.phone);
      if (smsRecipients.length === 0) {
        throw new Error('SMS campaign requires recipients with phone numbers');
      }
    }
  }

  /**
   * Pause running campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    const campaign = this.runningCampaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.RUNNING) {
      throw new Error(`Campaign ${campaignId} is not running`);
    }

    campaign.status = CampaignStatus.PAUSED;
    this.logger.info(`Campaign ${campaignId} paused`);
    this.emit('campaign:paused', { campaignId });
  }

  /**
   * Resume paused campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    const campaign = this.runningCampaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== CampaignStatus.PAUSED) {
      throw new Error(`Campaign ${campaignId} is not paused`);
    }

    campaign.status = CampaignStatus.RUNNING;
    this.logger.info(`Campaign ${campaignId} resumed`);
    this.emit('campaign:resumed', { campaignId });

    // Continue processing queue
    await this.processCampaignQueue(campaign);
  }

  /**
   * Get campaign metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics> {
    return await this.analytics.getCampaignMetrics(campaignId);
  }

  /**
   * Get all campaigns
   */
  getAllCampaigns(): CampaignConfig[] {
    return Array.from(this.runningCampaigns.values());
  }

  /**
   * Cancel campaign
   */
  async cancelCampaign(campaignId: string): Promise<void> {
    const campaign = this.runningCampaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    campaign.status = CampaignStatus.CANCELLED;
    this.campaignQueues.delete(campaignId);

    this.logger.info(`Campaign ${campaignId} cancelled`);
    this.emit('campaign:cancelled', { campaignId });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
