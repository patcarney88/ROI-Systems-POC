/**
 * Alert Routing Routes
 * API routes for intelligent alert routing and assignment
 */

import { Router } from 'express';
import * as alertRoutingController from '../controllers/alert-routing.controller';

const router = Router();

// ============================================================
// ALERT ROUTING & ASSIGNMENT
// ============================================================

/**
 * Route alert to appropriate agent
 * POST /api/alerts/route
 * Body: { alertId, userId, alertType, confidence, priority, territory, metadata }
 */
router.post('/route', alertRoutingController.routeAlert);

/**
 * Reassign alert to different agent
 * POST /api/alerts/:alertId/reassign
 * Body: { newAgentId, reason }
 */
router.post('/:alertId/reassign', alertRoutingController.reassignAlert);

/**
 * Bulk assign multiple alerts
 * POST /api/alerts/bulk-assign
 * Body: { alertIds: string[] }
 */
router.post('/bulk-assign', alertRoutingController.bulkAssignAlerts);

/**
 * Get alert assignment history
 * GET /api/alerts/:alertId/assignments
 */
router.get('/:alertId/assignments', alertRoutingController.getAlertAssignments);

// ============================================================
// AGENT MANAGEMENT
// ============================================================

/**
 * Get available agents with workload
 * GET /api/alerts/agents/available
 */
router.get('/agents/available', alertRoutingController.getAvailableAgents);

/**
 * Get agent workload and assigned alerts
 * GET /api/alerts/agents/:agentId/workload
 */
router.get('/agents/:agentId/workload', alertRoutingController.getAgentWorkload);

/**
 * Get agent profile
 * GET /api/alerts/agents/:agentId/profile
 */
router.get('/agents/:agentId/profile', alertRoutingController.getAgentProfile);

/**
 * Create or update agent profile
 * PUT /api/alerts/agents/:agentId/profile
 * Body: AgentProfile fields
 */
router.put('/agents/:agentId/profile', alertRoutingController.upsertAgentProfile);

// ============================================================
// ROUTING RULES
// ============================================================

/**
 * Get all routing rules
 * GET /api/alerts/routing/rules
 */
router.get('/routing/rules', alertRoutingController.getRoutingRules);

/**
 * Create new routing rule
 * POST /api/alerts/routing/rules
 * Body: { name, description, priority, enabled, conditions, actions }
 */
router.post('/routing/rules', alertRoutingController.createRoutingRule);

/**
 * Update routing rule
 * PATCH /api/alerts/routing/rules/:ruleId
 * Body: Partial RoutingRule fields
 */
router.patch('/routing/rules/:ruleId', alertRoutingController.updateRoutingRule);

/**
 * Delete routing rule
 * DELETE /api/alerts/routing/rules/:ruleId
 */
router.delete('/routing/rules/:ruleId', alertRoutingController.deleteRoutingRule);

/**
 * Handle stale alerts (escalate unacknowledged alerts)
 * POST /api/alerts/routing/handle-stale
 * Body: { maxAgeDays?: number }
 */
router.post('/routing/handle-stale', alertRoutingController.handleStaleAlerts);

/**
 * Get routing statistics
 * GET /api/alerts/routing/stats
 * Query: { startDate?, endDate? }
 */
router.get('/routing/stats', alertRoutingController.getRoutingStats);

export default router;
