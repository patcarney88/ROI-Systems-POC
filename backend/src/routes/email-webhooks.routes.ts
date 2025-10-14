/**
 * Email Webhooks Routes
 *
 * Public webhook receivers (no auth):
 * - POST /api/webhooks/email/sendgrid
 * - POST /api/webhooks/email/ses
 * - POST /api/webhooks/email/mailgun
 * - POST /api/webhooks/email/:providerId
 * - GET /api/webhooks/email/health
 *
 * Protected webhook management (requires auth):
 * - GET /api/v1/email/webhooks/events
 * - GET /api/v1/email/webhooks/stats
 * - POST /api/v1/email/webhooks/retry/:eventId
 * - PUT /api/v1/email/webhooks/config
 */

import { Router } from 'express';
import {
  handleSendGridWebhook,
  handleSESWebhook,
  handleMailgunWebhook,
  handleGenericWebhook,
  getWebhookEvents,
  getWebhookStats,
  retryWebhookEvent,
  updateWebhookConfig,
  webhookHealthCheck
} from '../controllers/email-webhooks.controller';

const router = Router();

// ============================================================================
// PUBLIC WEBHOOK ENDPOINTS (NO AUTH)
// ============================================================================

/**
 * SendGrid webhook receiver
 * POST /api/webhooks/email/sendgrid
 */
router.post('/sendgrid', handleSendGridWebhook);

/**
 * AWS SES webhook receiver (via SNS)
 * POST /api/webhooks/email/ses
 */
router.post('/ses', handleSESWebhook);

/**
 * Mailgun webhook receiver
 * POST /api/webhooks/email/mailgun
 */
router.post('/mailgun', handleMailgunWebhook);

/**
 * Generic webhook receiver (auto-detect provider)
 * POST /api/webhooks/email/:providerId
 */
router.post('/:providerId', handleGenericWebhook);

/**
 * Webhook health check
 * GET /api/webhooks/email/health
 */
router.get('/health', webhookHealthCheck);

// ============================================================================
// PROTECTED WEBHOOK MANAGEMENT ENDPOINTS
// Note: These require authentication middleware to be applied at app level
// ============================================================================

/**
 * Get recent webhook events
 * GET /api/v1/email/webhooks/events
 */
router.get('/events', getWebhookEvents);

/**
 * Get webhook statistics
 * GET /api/v1/email/webhooks/stats
 */
router.get('/stats', getWebhookStats);

/**
 * Retry failed webhook event
 * POST /api/v1/email/webhooks/retry/:eventId
 */
router.post('/retry/:eventId', retryWebhookEvent);

/**
 * Update webhook configuration
 * PUT /api/v1/email/webhooks/config
 */
router.put('/config', updateWebhookConfig);

export default router;
