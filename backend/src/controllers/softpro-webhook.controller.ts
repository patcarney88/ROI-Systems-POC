/**
 * SoftPro Webhook Controller
 * Handles webhook endpoints and management operations
 *
 * Features:
 * - Public webhook receiver endpoint
 * - Webhook event history and filtering
 * - Manual retry functionality
 * - Statistics and metrics
 * - Configuration management
 */

import { Request, Response } from 'express';
import { softProWebhookService, WebhookEventType } from '../services/softpro-webhook.service';
import { softProQueueProcessor } from '../workers/softpro-queue-processor';
import { db } from '../config/database';
import { createLogger } from '../utils/logger';

const logger = createLogger('softpro-webhook-controller');

// ============================================================================
// SOFTPRO WEBHOOK CONTROLLER
// ============================================================================

export class SoftProWebhookController {
  /**
   * Receive webhook from SoftPro (Public endpoint - no auth)
   * POST /api/webhooks/softpro/:integrationId
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    const { integrationId } = req.params;
    const startTime = Date.now();

    try {
      logger.info(`📥 Received webhook for integration: ${integrationId}`);

      // Extract event data from request body
      const payload = req.body;
      const eventType = (payload.event?.type || payload.type) as WebhookEventType;

      if (!eventType) {
        res.status(400).json({
          success: false,
          error: 'Missing event type',
        });
        return;
      }

      // Respond immediately with 200 OK (don't block webhook)
      res.status(200).json({
        success: true,
        message: 'Webhook received',
        integrationId,
        eventType,
      });

      // Process webhook asynchronously
      await softProWebhookService.processWebhook(
        integrationId,
        eventType,
        payload,
        req.headers
      );

      const duration = Date.now() - startTime;
      logger.info(`✅ Webhook processed in ${duration}ms: ${eventType}`);
    } catch (error) {
      logger.error(`❌ Error handling webhook for ${integrationId}:`, error);

      // Still respond with 200 to avoid retries from SoftPro
      res.status(200).json({
        success: true,
        message: 'Webhook received (processing failed)',
      });
    }
  }

  /**
   * Get webhook event history
   * GET /api/v1/integrations/softpro/webhooks/events
   */
  async getWebhookEvents(req: Request, res: Response): Promise<void> {
    try {
      const {
        integrationId,
        eventType,
        status,
        startDate,
        endDate,
        page = '1',
        limit = '50',
      } = req.query;

      // Build filter
      const where: any = {};

      if (integrationId) {
        where.integrationId = integrationId as string;
      }

      if (eventType) {
        where.eventType = eventType as string;
      }

      if (status) {
        where.status = status as string;
      }

      if (startDate || endDate) {
        where.receivedAt = {};
        if (startDate) {
          where.receivedAt.gte = new Date(startDate as string);
        }
        if (endDate) {
          where.receivedAt.lte = new Date(endDate as string);
        }
      }

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Query database
      const [events, total] = await Promise.all([
        db.webhookEvent.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: { receivedAt: 'desc' },
          include: {
            integration: {
              select: {
                id: true,
                organizationId: true,
                active: true,
              },
            },
          },
        }),
        db.webhookEvent.count({ where }),
      ]);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            totalPages: Math.ceil(total / limitNum),
          },
        },
      });
    } catch (error) {
      logger.error('Error getting webhook events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook events',
      });
    }
  }

  /**
   * Retry failed webhook event
   * POST /api/v1/integrations/softpro/webhooks/retry/:eventId
   */
  async retryWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      await softProWebhookService.retryFailedEvent(eventId);

      res.json({
        success: true,
        data: {
          eventId,
          message: 'Event retry queued',
        },
      });
    } catch (error) {
      logger.error(`Error retrying webhook event ${req.params.eventId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Get webhook processing statistics
   * GET /api/v1/integrations/softpro/webhooks/stats
   */
  async getWebhookStats(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId, period = '24h' } = req.query;

      // Calculate time range
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      }

      // Build filter
      const where: any = {
        receivedAt: {
          gte: startDate,
        },
      };

      if (integrationId) {
        where.integrationId = integrationId as string;
      }

      // Get counts by status
      const [
        received,
        completed,
        failed,
        processing,
        totalEvents,
        avgProcessingTime,
      ] = await Promise.all([
        db.webhookEvent.count({
          where: { ...where, status: 'RECEIVED' },
        }),
        db.webhookEvent.count({
          where: { ...where, status: 'COMPLETED' },
        }),
        db.webhookEvent.count({
          where: { ...where, status: 'FAILED' },
        }),
        db.webhookEvent.count({
          where: { ...where, status: 'PROCESSING' },
        }),
        db.webhookEvent.count({ where }),
        db.webhookEvent.aggregate({
          where: {
            ...where,
            status: 'COMPLETED',
            processingTimeMs: { not: null },
          },
          _avg: {
            processingTimeMs: true,
          },
        }),
      ]);

      // Calculate rates
      const successRate = totalEvents > 0 ? (completed / totalEvents) * 100 : 0;
      const failureRate = totalEvents > 0 ? (failed / totalEvents) * 100 : 0;

      // Get queue stats
      const queueStats = await softProQueueProcessor.getQueueStats();

      res.json({
        success: true,
        data: {
          period,
          startDate,
          endDate: now,
          webhookStats: {
            totalEvents,
            received,
            completed,
            failed,
            processing,
            successRate: Math.round(successRate * 100) / 100,
            failureRate: Math.round(failureRate * 100) / 100,
            avgProcessingTimeMs: Math.round(avgProcessingTime._avg.processingTimeMs || 0),
          },
          queueStats,
        },
      });
    } catch (error) {
      logger.error('Error getting webhook stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get webhook statistics',
      });
    }
  }

  /**
   * Update webhook configuration
   * PUT /api/v1/integrations/softpro/webhooks/config
   */
  async updateWebhookConfig(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId, enabled, webhookSecret, retryConfig } = req.body;

      if (!integrationId) {
        res.status(400).json({
          success: false,
          error: 'Integration ID is required',
        });
        return;
      }

      // Update integration
      const integration = await db.softProIntegration.update({
        where: { id: integrationId },
        data: {
          webhookEnabled: enabled !== undefined ? enabled : undefined,
          webhookSecret: webhookSecret || undefined,
          ...(retryConfig && {
            webhookRetryConfig: retryConfig,
          }),
        },
      });

      res.json({
        success: true,
        data: {
          integration: {
            id: integration.id,
            webhookEnabled: integration.webhookEnabled,
            webhookSecret: integration.webhookSecret ? '***' : null,
          },
        },
      });
    } catch (error) {
      logger.error('Error updating webhook config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update webhook configuration',
      });
    }
  }

  /**
   * Get webhook event details
   * GET /api/v1/integrations/softpro/webhooks/events/:eventId
   */
  async getWebhookEventDetails(req: Request, res: Response): Promise<void> {
    try {
      const { eventId } = req.params;

      const event = await softProWebhookService.getEventStatus(eventId);

      res.json({
        success: true,
        data: event,
      });
    } catch (error) {
      logger.error(`Error getting webhook event ${req.params.eventId}:`, error);
      res.status(500).json({
        success: false,
        error: (error as Error).message,
      });
    }
  }

  /**
   * Batch retry failed events
   * POST /api/v1/integrations/softpro/webhooks/retry-batch
   */
  async batchRetryFailedEvents(req: Request, res: Response): Promise<void> {
    try {
      const { integrationId, eventIds } = req.body;

      if (!integrationId && !eventIds) {
        res.status(400).json({
          success: false,
          error: 'Either integrationId or eventIds is required',
        });
        return;
      }

      let events: any[];

      if (eventIds && Array.isArray(eventIds)) {
        // Retry specific events
        events = await db.webhookEvent.findMany({
          where: {
            id: { in: eventIds },
            status: 'FAILED',
          },
        });
      } else {
        // Retry all failed events for integration
        events = await db.webhookEvent.findMany({
          where: {
            integrationId,
            status: 'FAILED',
          },
          take: 100, // Limit to 100 events
        });
      }

      // Queue retry jobs
      for (const event of events) {
        await softProWebhookService.retryFailedEvent(event.id);
      }

      res.json({
        success: true,
        data: {
          retriedCount: events.length,
          message: `${events.length} events queued for retry`,
        },
      });
    } catch (error) {
      logger.error('Error batch retrying failed events:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to batch retry events',
      });
    }
  }

  /**
   * Health check endpoint
   * GET /api/webhooks/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const queueStats = await softProQueueProcessor.getQueueStats();

      res.json({
        success: true,
        data: {
          status: 'healthy',
          service: 'softpro-webhook',
          timestamp: new Date().toISOString(),
          queues: queueStats,
        },
      });
    } catch (error) {
      logger.error('Error in health check:', error);
      res.status(500).json({
        success: false,
        error: 'Health check failed',
      });
    }
  }
}

// Export singleton instance
export const softProWebhookController = new SoftProWebhookController();

// Export handler functions for routes
export const handleWebhook = (req: Request, res: Response) =>
  softProWebhookController.handleWebhook(req, res);

export const getWebhookEvents = (req: Request, res: Response) =>
  softProWebhookController.getWebhookEvents(req, res);

export const retryWebhookEvent = (req: Request, res: Response) =>
  softProWebhookController.retryWebhookEvent(req, res);

export const getWebhookStats = (req: Request, res: Response) =>
  softProWebhookController.getWebhookStats(req, res);

export const updateWebhookConfig = (req: Request, res: Response) =>
  softProWebhookController.updateWebhookConfig(req, res);

export const getWebhookEventDetails = (req: Request, res: Response) =>
  softProWebhookController.getWebhookEventDetails(req, res);

export const batchRetryFailedEvents = (req: Request, res: Response) =>
  softProWebhookController.batchRetryFailedEvents(req, res);

export const webhookHealthCheck = (req: Request, res: Response) =>
  softProWebhookController.healthCheck(req, res);
