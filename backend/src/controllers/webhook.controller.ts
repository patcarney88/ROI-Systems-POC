/**
 * Webhook Controller
 * Handles SendGrid webhook events and tracking endpoints
 *
 * Features:
 * - SendGrid webhook signature verification
 * - Async event processing (non-blocking)
 * - Tracking pixel endpoint
 * - Click tracking endpoint
 * - Batch event handling (up to 1000 events)
 */

import { Request, Response } from 'express';
import * as crypto from 'crypto';
import { webhookService, WebhookEvent } from '../services/webhook.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('webhook-controller');

// ============================================================================
// WEBHOOK CONTROLLER
// ============================================================================

export class WebhookController {
  /**
   * Handle SendGrid webhook events
   * POST /api/webhooks/sendgrid
   *
   * SendGrid sends events in batches (up to 1000 events per request)
   * We must respond with 200 OK immediately to avoid retries
   */
  async handleSendGridWebhook(req: Request, res: Response): Promise<void> {
    try {
      // Verify SendGrid signature
      const isValid = this.verifySendGridSignature(req);
      if (!isValid) {
        logger.warn('Invalid SendGrid webhook signature');
        res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
        });
        return;
      }

      // SendGrid sends events as array
      const events: WebhookEvent[] = Array.isArray(req.body) ? req.body : [req.body];

      logger.info(`📥 Received ${events.length} webhook events from SendGrid`);

      // Respond immediately (don't block webhook)
      res.status(200).json({
        success: true,
        message: `Received ${events.length} events`,
      });

      // Process events asynchronously (non-blocking)
      this.processEventsAsync(events);
    } catch (error) {
      logger.error('❌ Error handling SendGrid webhook:', error);

      // Still respond with 200 to avoid retries
      res.status(200).json({
        success: true,
        message: 'Events received',
      });
    }
  }

  /**
   * Handle email open tracking
   * GET /api/track/open?mid=:messageId&sid=:subscriberId&cid=:campaignId
   *
   * Returns 1x1 transparent pixel
   */
  async handleOpenTracking(req: Request, res: Response): Promise<void> {
    try {
      const { mid: messageId, sid: subscriberId, cid: campaignId } = req.query;

      if (!subscriberId || !campaignId || !messageId) {
        logger.warn('Missing tracking parameters in open tracking request');
        this.sendTrackingPixel(res);
        return;
      }

      // Record open asynchronously
      webhookService
        .recordOpen(
          subscriberId as string,
          campaignId as string,
          messageId as string
        )
        .catch((error) => {
          logger.error('Error recording open:', error);
        });

      // Return tracking pixel immediately
      this.sendTrackingPixel(res);
    } catch (error) {
      logger.error('Error in open tracking:', error);
      this.sendTrackingPixel(res);
    }
  }

  /**
   * Handle link click tracking
   * GET /api/track/click?url=:url&mid=:messageId&sid=:subscriberId&cid=:campaignId
   *
   * Redirects to original URL after recording click
   */
  async handleClickTracking(req: Request, res: Response): Promise<void> {
    try {
      const {
        url: targetUrl,
        mid: messageId,
        sid: subscriberId,
        cid: campaignId,
      } = req.query;

      if (!targetUrl) {
        logger.warn('Missing URL in click tracking request');
        res.status(400).json({
          success: false,
          error: 'Missing target URL',
        });
        return;
      }

      // Record click asynchronously (don't block redirect)
      if (subscriberId && campaignId && messageId) {
        webhookService
          .recordClick(
            subscriberId as string,
            campaignId as string,
            messageId as string,
            targetUrl as string
          )
          .catch((error) => {
            logger.error('Error recording click:', error);
          });
      }

      // Redirect to original URL immediately
      res.redirect(302, targetUrl as string);
    } catch (error) {
      logger.error('Error in click tracking:', error);

      // Try to redirect anyway
      const targetUrl = req.query.url as string;
      if (targetUrl) {
        res.redirect(302, targetUrl);
      } else {
        res.status(400).json({
          success: false,
          error: 'Invalid tracking request',
        });
      }
    }
  }

  /**
   * Health check for webhook endpoint
   * GET /api/webhooks/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        service: 'webhook',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Verify SendGrid webhook signature
   * Documentation: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
   */
  private verifySendGridSignature(req: Request): boolean {
    try {
      // Check if signature verification is enabled
      const webhookSecret = process.env.SENDGRID_WEBHOOK_SECRET;
      if (!webhookSecret) {
        logger.warn('SENDGRID_WEBHOOK_SECRET not configured - skipping signature verification');
        return true; // Allow in development
      }

      // Get signature from header
      const signature = req.headers['x-twilio-email-event-webhook-signature'] as string;
      const timestamp = req.headers['x-twilio-email-event-webhook-timestamp'] as string;

      if (!signature || !timestamp) {
        logger.warn('Missing signature or timestamp in webhook headers');
        return false;
      }

      // Check timestamp to prevent replay attacks (within 10 minutes)
      const requestTime = parseInt(timestamp);
      const currentTime = Math.floor(Date.now() / 1000);
      if (Math.abs(currentTime - requestTime) > 600) {
        logger.warn('Webhook timestamp too old or too far in future');
        return false;
      }

      // Verify signature
      const payload = JSON.stringify(req.body);
      const data = timestamp + payload;

      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(data)
        .digest('base64');

      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );

      if (!isValid) {
        logger.warn('Invalid webhook signature');
      }

      return isValid;
    } catch (error) {
      logger.error('Error verifying SendGrid signature:', error);
      return false;
    }
  }

  /**
   * Process webhook events asynchronously
   * Processes events in batches to avoid overwhelming the database
   */
  private async processEventsAsync(events: WebhookEvent[]): Promise<void> {
    const startTime = Date.now();
    logger.info(`🔄 Processing ${events.length} events asynchronously...`);

    try {
      // Process in batches of 100 for better performance
      const batchSize = 100;
      const batches = [];

      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        batches.push(batch);
      }

      // Process batches sequentially to avoid overwhelming database
      let successCount = 0;
      let errorCount = 0;

      for (const batch of batches) {
        const results = await Promise.allSettled(
          batch.map((event) => webhookService.processEvent(event))
        );

        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            successCount++;
          } else {
            errorCount++;
            logger.error('Event processing failed:', result.reason);
          }
        });
      }

      const duration = Date.now() - startTime;
      logger.info(
        `✅ Processed ${events.length} events in ${duration}ms (${successCount} success, ${errorCount} errors)`
      );

      // Log performance metrics
      if (duration > 2000) {
        logger.warn(`⚠️ Slow event processing: ${duration}ms for ${events.length} events`);
      }
    } catch (error) {
      logger.error('❌ Error in async event processing:', error);
    }
  }

  /**
   * Send 1x1 transparent tracking pixel
   */
  private sendTrackingPixel(res: Response): void {
    // 1x1 transparent GIF
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      'Pragma': 'no-cache',
      'Expires': '0',
    });

    res.end(pixel);
  }

  /**
   * Validate webhook event structure
   */
  private validateEvent(event: any): event is WebhookEvent {
    return (
      event &&
      typeof event.event === 'string' &&
      typeof event.email === 'string' &&
      typeof event.timestamp === 'number'
    );
  }
}

// Export singleton instance
export const webhookController = new WebhookController();

// Export individual handler functions for routes
export const handleSendGridWebhook = (req: Request, res: Response) =>
  webhookController.handleSendGridWebhook(req, res);

export const handleOpenTracking = (req: Request, res: Response) =>
  webhookController.handleOpenTracking(req, res);

export const handleClickTracking = (req: Request, res: Response) =>
  webhookController.handleClickTracking(req, res);

export const webhookHealthCheck = (req: Request, res: Response) =>
  webhookController.healthCheck(req, res);
