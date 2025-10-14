/**
 * Webhook Routes
 * Routes for SendGrid webhook events and email tracking
 *
 * Endpoints:
 * - POST /api/webhooks/sendgrid - SendGrid event webhook
 * - GET /api/track/open - Email open tracking pixel
 * - GET /api/track/click - Link click tracking and redirect
 * - GET /api/webhooks/health - Webhook health check
 */

import { Router } from 'express';
import {
  handleSendGridWebhook,
  handleOpenTracking,
  handleClickTracking,
  webhookHealthCheck,
} from '../controllers/webhook.controller';
import { createRateLimiter } from '../middleware/rate-limit.middleware';

const router = Router();

// ============================================================================
// RATE LIMITERS
// ============================================================================

/**
 * Webhook rate limiter - 10,000 requests per minute
 * High limit for production webhook traffic
 */
const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10000, // 10,000 requests per minute
  prefix: 'webhook',
  message: 'Too many webhook requests. Please contact support.',
});

/**
 * Tracking rate limiter - 1,000 requests per minute per IP
 * Prevents abuse of tracking endpoints
 */
const trackingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // 1,000 requests per minute
  prefix: 'tracking',
  message: 'Too many tracking requests.',
});

// ============================================================================
// WEBHOOK ROUTES
// ============================================================================

/**
 * SendGrid Event Webhook
 * POST /api/webhooks/sendgrid
 *
 * Receives webhook events from SendGrid:
 * - delivered, open, click, bounce, dropped, deferred, unsubscribe, spam_report
 *
 * Security:
 * - Signature verification via SendGrid webhook signature
 * - Rate limited to 10,000 requests/minute
 *
 * Performance:
 * - Responds immediately with 200 OK
 * - Processes events asynchronously
 * - Handles batch events (up to 1000 per request)
 */
router.post('/sendgrid', webhookRateLimiter, handleSendGridWebhook);

/**
 * Email Open Tracking
 * GET /api/track/open
 *
 * Query params:
 * - mid: messageId (required)
 * - sid: subscriberId (required)
 * - cid: campaignId (required)
 *
 * Returns:
 * - 1x1 transparent GIF pixel
 *
 * Usage:
 * <img src="https://api.example.com/api/track/open?mid=123&sid=456&cid=789" width="1" height="1" />
 */
router.get('/track/open', trackingRateLimiter, handleOpenTracking);

/**
 * Link Click Tracking
 * GET /api/track/click
 *
 * Query params:
 * - url: targetUrl (required) - Original URL to redirect to
 * - mid: messageId (required)
 * - sid: subscriberId (required)
 * - cid: campaignId (required)
 * - lid: linkId (optional) - Link identifier for analytics
 *
 * Returns:
 * - 302 redirect to original URL
 *
 * Usage:
 * <a href="https://api.example.com/api/track/click?url=https://example.com&mid=123&sid=456&cid=789">
 */
router.get('/track/click', trackingRateLimiter, handleClickTracking);

/**
 * Webhook Health Check
 * GET /api/webhooks/health
 *
 * Returns:
 * - Service health status
 * - Timestamp
 */
router.get('/health', webhookHealthCheck);

// ============================================================================
// EXPORTS
// ============================================================================

export default router;
