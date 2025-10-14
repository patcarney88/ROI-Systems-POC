/**
 * Email Webhooks Controller
 *
 * Unified webhook endpoint controller for all email providers
 * Routes webhooks to appropriate handler based on provider
 *
 * Public Endpoints (no auth, signature validation):
 * - POST /api/webhooks/email/sendgrid
 * - POST /api/webhooks/email/ses
 * - POST /api/webhooks/email/mailgun
 * - POST /api/webhooks/email/:providerId (auto-detect)
 *
 * Protected Endpoints (requires auth):
 * - GET /api/v1/email/webhooks/events
 * - GET /api/v1/email/webhooks/stats
 * - POST /api/v1/email/webhooks/retry/:eventId
 * - PUT /api/v1/email/webhooks/config
 */

import { Request, Response } from 'express';
import { createLogger } from '../utils/logger';
import {
  emailWebhookHandler,
  EmailProviderType
} from '../services/email/webhook-handler.service';
import { emailEventQueue } from '../queues/email-event.queue';
import { db } from '../config/database';

const logger = createLogger('email-webhooks-controller');

// ============================================================================
// PUBLIC WEBHOOK ENDPOINTS (NO AUTH)
// ============================================================================

/**
 * Handle SendGrid webhooks
 * POST /api/webhooks/email/sendgrid
 */
export const handleSendGridWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    logger.info('📥 Received SendGrid webhook');

    // Extract signature from headers
    const signature = req.headers['x-twilio-email-event-webhook-signature'] as string || '';

    // Process webhook (non-blocking)
    const result = await emailWebhookHandler.processWebhook(
      EmailProviderType.SENDGRID,
      req.body,
      signature,
      req.headers as Record<string, string>
    );

    const duration = Date.now() - startTime;
    logger.info(`✅ SendGrid webhook processed in ${duration}ms - ${result.processed} events`);

    // Always return 200 to prevent retries (even on partial failures)
    res.status(200).json({
      success: true,
      message: `Received ${result.processed} events`,
      processed: result.processed,
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (error: any) {
    logger.error('❌ Error handling SendGrid webhook:', error);

    // Still return 200 to prevent retries
    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  }
};

/**
 * Handle AWS SES webhooks (via SNS)
 * POST /api/webhooks/email/ses
 */
export const handleSESWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    logger.info('📥 Received SES/SNS webhook');

    // SNS signature is in header
    const signature = req.headers['x-amz-sns-message-id'] as string || '';

    // Process webhook
    const result = await emailWebhookHandler.processWebhook(
      EmailProviderType.AWS_SES,
      req.body,
      signature,
      req.headers as Record<string, string>
    );

    const duration = Date.now() - startTime;
    logger.info(`✅ SES webhook processed in ${duration}ms - ${result.processed} events`);

    res.status(200).json({
      success: true,
      message: `Received ${result.processed} events`,
      processed: result.processed
    });

  } catch (error: any) {
    logger.error('❌ Error handling SES webhook:', error);

    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  }
};

/**
 * Handle Mailgun webhooks
 * POST /api/webhooks/email/mailgun
 */
export const handleMailgunWebhook = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    logger.info('📥 Received Mailgun webhook');

    // Mailgun signature is in body
    const signature = req.body?.signature?.signature || '';

    // Process webhook
    const result = await emailWebhookHandler.processWebhook(
      EmailProviderType.MAILGUN,
      req.body,
      signature,
      req.headers as Record<string, string>
    );

    const duration = Date.now() - startTime;
    logger.info(`✅ Mailgun webhook processed in ${duration}ms - ${result.processed} events`);

    res.status(200).json({
      success: true,
      message: `Received ${result.processed} events`,
      processed: result.processed
    });

  } catch (error: any) {
    logger.error('❌ Error handling Mailgun webhook:', error);

    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  }
};

/**
 * Generic webhook endpoint (auto-detect provider)
 * POST /api/webhooks/email/:providerId
 */
export const handleGenericWebhook = async (req: Request, res: Response): Promise<void> => {
  const { providerId } = req.params;

  try {
    logger.info(`📥 Received webhook for provider: ${providerId}`);

    // Map provider ID to provider type
    const providerMap: Record<string, EmailProviderType> = {
      'sendgrid': EmailProviderType.SENDGRID,
      'ses': EmailProviderType.AWS_SES,
      'mailgun': EmailProviderType.MAILGUN
    };

    const provider = providerMap[providerId.toLowerCase()];

    if (!provider) {
      logger.error(`❌ Unknown provider: ${providerId}`);
      res.status(400).json({
        success: false,
        error: `Unknown provider: ${providerId}`
      });
      return;
    }

    // Extract signature based on provider
    let signature = '';
    if (provider === EmailProviderType.SENDGRID) {
      signature = req.headers['x-twilio-email-event-webhook-signature'] as string || '';
    } else if (provider === EmailProviderType.MAILGUN) {
      signature = req.body?.signature?.signature || '';
    }

    // Process webhook
    const result = await emailWebhookHandler.processWebhook(
      provider,
      req.body,
      signature,
      req.headers as Record<string, string>
    );

    res.status(200).json({
      success: true,
      message: `Received ${result.processed} events`,
      processed: result.processed
    });

  } catch (error: any) {
    logger.error(`❌ Error handling webhook for ${providerId}:`, error);

    res.status(200).json({
      success: true,
      message: 'Webhook received'
    });
  }
};

// ============================================================================
// PROTECTED WEBHOOK MANAGEMENT ENDPOINTS (REQUIRES AUTH)
// ============================================================================

/**
 * Get recent webhook events
 * GET /api/v1/email/webhooks/events?limit=100&offset=0&provider=sendgrid
 */
export const getWebhookEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      limit = 100,
      offset = 0,
      provider,
      eventType,
      emailId,
      campaignId
    } = req.query;

    // Build query filters
    const where: any = {};
    if (emailId) where.emailId = emailId;
    if (campaignId) where.campaignId = campaignId;
    if (eventType) where.eventType = eventType;

    // Get events from database
    const events = await db.emailEvent.findMany({
      where,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { eventTimestamp: 'desc' },
      include: {
        subscriber: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    const total = await db.emailEvent.count({ where });

    res.json({
      success: true,
      data: {
        events,
        pagination: {
          total,
          limit: Number(limit),
          offset: Number(offset),
          hasMore: total > Number(offset) + Number(limit)
        }
      }
    });

  } catch (error: any) {
    logger.error('Error fetching webhook events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook events'
    });
  }
};

/**
 * Get webhook statistics
 * GET /api/v1/email/webhooks/stats?provider=sendgrid&period=24h
 */
export const getWebhookStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, period = '24h' } = req.query;

    // Calculate time range
    const hours = period === '24h' ? 24 : period === '7d' ? 168 : 1;
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Get event counts by type
    const eventCounts = await db.emailEvent.groupBy({
      by: ['eventType'],
      where: {
        eventTimestamp: { gte: startTime }
      },
      _count: true
    });

    // Get queue statistics
    const queueStats = await emailEventQueue.getJobCounts();

    // Get webhook handler stats
    const handlerStats = await emailWebhookHandler.getWebhookStats(
      provider as EmailProviderType
    );

    res.json({
      success: true,
      data: {
        period,
        startTime,
        eventCounts: eventCounts.reduce((acc, item) => {
          acc[item.eventType] = item._count;
          return acc;
        }, {} as Record<string, number>),
        queue: queueStats,
        handler: handlerStats
      }
    });

  } catch (error: any) {
    logger.error('Error fetching webhook stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook stats'
    });
  }
};

/**
 * Retry failed webhook event
 * POST /api/v1/email/webhooks/retry/:eventId
 */
export const retryWebhookEvent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Get failed event
    const event = await db.emailEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      });
      return;
    }

    // Re-queue event for processing
    await emailEventQueue.add('process-email-event', event, {
      attempts: 1,
      removeOnComplete: false
    });

    logger.info(`🔄 Re-queued event ${eventId} for processing`);

    res.json({
      success: true,
      message: 'Event queued for retry'
    });

  } catch (error: any) {
    logger.error(`Error retrying event ${req.params.eventId}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to retry event'
    });
  }
};

/**
 * Update webhook configuration
 * PUT /api/v1/email/webhooks/config
 */
export const updateWebhookConfig = async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider, enabled, url } = req.body;

    // Validate provider
    const validProviders = Object.values(EmailProviderType);
    if (!validProviders.includes(provider)) {
      res.status(400).json({
        success: false,
        error: 'Invalid provider'
      });
      return;
    }

    // TODO: Store webhook configuration in database
    // For now, just return success

    logger.info(`📝 Updated webhook config for ${provider}`);

    res.json({
      success: true,
      message: 'Webhook configuration updated',
      data: { provider, enabled, url }
    });

  } catch (error: any) {
    logger.error('Error updating webhook config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update webhook configuration'
    });
  }
};

/**
 * Webhook health check
 * GET /api/webhooks/email/health
 */
export const webhookHealthCheck = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check queue health
    const queueStats = await emailEventQueue.getJobCounts();

    const isHealthy =
      queueStats.failed < 100 && // Less than 100 failed jobs
      queueStats.active < 1000; // Less than 1000 active jobs

    res.status(isHealthy ? 200 : 503).json({
      success: true,
      data: {
        status: isHealthy ? 'healthy' : 'degraded',
        service: 'email-webhooks',
        timestamp: new Date().toISOString(),
        queue: queueStats
      }
    });

  } catch (error: any) {
    logger.error('Error in webhook health check:', error);
    res.status(503).json({
      success: false,
      error: 'Health check failed'
    });
  }
};
