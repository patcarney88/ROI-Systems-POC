/**
 * SoftPro Webhook Routes
 * Defines all webhook-related endpoints
 *
 * Public Routes:
 * - POST /api/webhooks/softpro/:integrationId - Webhook receiver
 *
 * Protected Routes (JWT auth):
 * - GET /api/v1/integrations/softpro/webhooks/events - List webhook events
 * - GET /api/v1/integrations/softpro/webhooks/events/:eventId - Get event details
 * - POST /api/v1/integrations/softpro/webhooks/retry/:eventId - Retry failed event
 * - POST /api/v1/integrations/softpro/webhooks/retry-batch - Batch retry events
 * - GET /api/v1/integrations/softpro/webhooks/stats - Get statistics
 * - PUT /api/v1/integrations/softpro/webhooks/config - Update configuration
 * - GET /api/webhooks/health - Health check
 */

import { Router } from 'express';
import {
  handleWebhook,
  getWebhookEvents,
  retryWebhookEvent,
  getWebhookStats,
  updateWebhookConfig,
  getWebhookEventDetails,
  batchRetryFailedEvents,
  webhookHealthCheck,
} from '../controllers/softpro-webhook.controller';
import { authMiddleware } from '../middleware/auth.middleware.enhanced';
import { rateLimitMiddleware } from '../middleware/rate-limit.middleware';

const router = Router();

// ============================================================================
// PUBLIC ROUTES (No Authentication)
// ============================================================================

/**
 * Webhook receiver endpoint
 * Called by SoftPro when events occur
 */
router.post(
  '/softpro/:integrationId',
  rateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // 1000 requests per minute (generous for webhook bursts)
  }),
  handleWebhook
);

/**
 * Health check endpoint
 */
router.get('/health', webhookHealthCheck);

// ============================================================================
// PROTECTED ROUTES (JWT Authentication Required)
// ============================================================================

/**
 * Get webhook event history
 * Query params: integrationId, eventType, status, startDate, endDate, page, limit
 */
router.get(
  '/softpro/events',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 100,
  }),
  getWebhookEvents
);

/**
 * Get webhook event details
 */
router.get(
  '/softpro/events/:eventId',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 100,
  }),
  getWebhookEventDetails
);

/**
 * Retry failed webhook event
 */
router.post(
  '/softpro/retry/:eventId',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 50,
  }),
  retryWebhookEvent
);

/**
 * Batch retry failed events
 * Body: { integrationId?, eventIds? }
 */
router.post(
  '/softpro/retry-batch',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 20, // More restrictive for batch operations
  }),
  batchRetryFailedEvents
);

/**
 * Get webhook processing statistics
 * Query params: integrationId, period (1h, 24h, 7d, 30d)
 */
router.get(
  '/softpro/stats',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 100,
  }),
  getWebhookStats
);

/**
 * Update webhook configuration
 * Body: { integrationId, enabled?, webhookSecret?, retryConfig? }
 */
router.put(
  '/softpro/config',
  authMiddleware,
  rateLimitMiddleware({
    windowMs: 60 * 1000,
    max: 50,
  }),
  updateWebhookConfig
);

export default router;
