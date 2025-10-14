/**
 * Alert Routing Controller
 * API endpoints for intelligent alert routing and assignment
 */

import { Request, Response } from 'express';
import { alertRoutingService } from '../services/alert-routing.service';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('alert-routing-controller');
const db = new PrismaClient();

/**
 * Route alert to appropriate agent
 * POST /api/alerts/route
 */
export const routeAlert = async (req: Request, res: Response) => {
  try {
    const { alertId, userId, alertType, confidence, priority, territory, metadata } = req.body;

    if (!alertId || !userId || !alertType) {
      return res.status(400).json({
        success: false,
        error: 'alertId, userId, and alertType are required'
      });
    }

    const result = await alertRoutingService.routeAlert({
      alertId,
      userId,
      alertType,
      confidence: confidence || 0,
      priority: priority || 'MEDIUM',
      territory,
      metadata
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to route alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reassign alert to different agent
 * POST /api/alerts/:alertId/reassign
 */
export const reassignAlert = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;
    const { newAgentId, reason } = req.body;

    if (!newAgentId) {
      return res.status(400).json({
        success: false,
        error: 'newAgentId is required'
      });
    }

    const result = await alertRoutingService.reassignAlert(
      alertId,
      newAgentId,
      reason || 'Manual reassignment'
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Failed to reassign alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Bulk assign multiple alerts
 * POST /api/alerts/bulk-assign
 */
export const bulkAssignAlerts = async (req: Request, res: Response) => {
  try {
    const { alertIds } = req.body;

    if (!Array.isArray(alertIds) || alertIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'alertIds array is required and must not be empty'
      });
    }

    const results = await alertRoutingService.bulkAssignAlerts(alertIds);

    res.json({
      success: true,
      data: {
        totalAlerts: alertIds.length,
        successfulAssignments: results.length,
        failedAssignments: alertIds.length - results.length,
        results
      }
    });
  } catch (error: any) {
    logger.error('Failed to bulk assign alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get available agents with workload
 * GET /api/alerts/agents/available
 */
export const getAvailableAgents = async (req: Request, res: Response) => {
  try {
    const agents = await alertRoutingService.getAvailableAgents();

    res.json({
      success: true,
      data: {
        totalAgents: agents.length,
        availableAgents: agents.filter(a => a.availableCapacity > 0).length,
        agents
      }
    });
  } catch (error: any) {
    logger.error('Failed to get available agents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get agent workload
 * GET /api/alerts/agents/:agentId/workload
 */
export const getAgentWorkload = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const workload = await alertRoutingService.getAgentWorkload(agentId);

    if (!workload) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found or not available'
      });
    }

    // Get assigned alerts
    const alerts = await db.alertScore.findMany({
      where: {
        assignedAgentId: agentId,
        status: { in: ['PENDING', 'ACKNOWLEDGED'] }
      },
      select: {
        id: true,
        alertType: true,
        priority: true,
        confidence: true,
        assignedAt: true,
        status: true
      },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        workload,
        alerts
      }
    });
  } catch (error: any) {
    logger.error('Failed to get agent workload:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get routing rules
 * GET /api/alerts/routing/rules
 */
export const getRoutingRules = async (req: Request, res: Response) => {
  try {
    const rules = await alertRoutingService.getRoutingRules();

    res.json({
      success: true,
      data: {
        totalRules: rules.length,
        enabledRules: rules.filter(r => r.enabled).length,
        rules
      }
    });
  } catch (error: any) {
    logger.error('Failed to get routing rules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create routing rule
 * POST /api/alerts/routing/rules
 */
export const createRoutingRule = async (req: Request, res: Response) => {
  try {
    const { name, description, priority, enabled, conditions, actions } = req.body;

    if (!name || !conditions || !actions) {
      return res.status(400).json({
        success: false,
        error: 'name, conditions, and actions are required'
      });
    }

    const rule = await db.routingRule.create({
      data: {
        name,
        description,
        priority: priority || 0,
        enabled: enabled !== false,
        conditions,
        actions
      }
    });

    // Refresh cache
    await alertRoutingService.refreshRoutingRulesCache();

    res.status(201).json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    logger.error('Failed to create routing rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update routing rule
 * PATCH /api/alerts/routing/rules/:ruleId
 */
export const updateRoutingRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;
    const updates = req.body;

    const rule = await db.routingRule.update({
      where: { id: ruleId },
      data: updates
    });

    // Refresh cache
    await alertRoutingService.refreshRoutingRulesCache();

    res.json({
      success: true,
      data: rule
    });
  } catch (error: any) {
    logger.error('Failed to update routing rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete routing rule
 * DELETE /api/alerts/routing/rules/:ruleId
 */
export const deleteRoutingRule = async (req: Request, res: Response) => {
  try {
    const { ruleId } = req.params;

    await db.routingRule.delete({
      where: { id: ruleId }
    });

    // Refresh cache
    await alertRoutingService.refreshRoutingRulesCache();

    res.json({
      success: true,
      message: 'Routing rule deleted successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete routing rule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Handle stale alerts (escalate alerts not acknowledged)
 * POST /api/alerts/routing/handle-stale
 */
export const handleStaleAlerts = async (req: Request, res: Response) => {
  try {
    const { maxAgeDays = 3 } = req.body;

    await alertRoutingService.handleStaleAlerts(maxAgeDays);

    res.json({
      success: true,
      message: `Stale alerts older than ${maxAgeDays} days have been escalated`
    });
  } catch (error: any) {
    logger.error('Failed to handle stale alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get agent profile
 * GET /api/alerts/agents/:agentId/profile
 */
export const getAgentProfile = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;

    const profile = await db.agentProfile.findUnique({
      where: { userId: agentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Agent profile not found'
      });
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    logger.error('Failed to get agent profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Create or update agent profile
 * PUT /api/alerts/agents/:agentId/profile
 */
export const upsertAgentProfile = async (req: Request, res: Response) => {
  try {
    const { agentId } = req.params;
    const profileData = req.body;

    const profile = await db.agentProfile.upsert({
      where: { userId: agentId },
      create: {
        userId: agentId,
        ...profileData
      },
      update: profileData
    });

    res.json({
      success: true,
      data: profile
    });
  } catch (error: any) {
    logger.error('Failed to upsert agent profile:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get alert assignment history
 * GET /api/alerts/:alertId/assignments
 */
export const getAlertAssignments = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    const assignments = await db.alertAssignment.findMany({
      where: { alertScoreId: alertId },
      orderBy: { assignedAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        totalAssignments: assignments.length,
        currentAssignment: assignments[0] || null,
        history: assignments
      }
    });
  } catch (error: any) {
    logger.error('Failed to get alert assignments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get routing statistics
 * GET /api/alerts/routing/stats
 */
export const getRoutingStats = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const where: any = {};
    if (startDate || endDate) {
      where.assignedAt = {};
      if (startDate) where.assignedAt.gte = new Date(startDate as string);
      if (endDate) where.assignedAt.lte = new Date(endDate as string);
    }

    const [
      totalAssignments,
      byStrategy,
      byStatus,
      avgResponseTime
    ] = await Promise.all([
      db.alertScore.count({
        where: { assignedAgentId: { not: null }, ...where }
      }),
      db.alertScore.groupBy({
        by: ['assignmentStrategy'],
        where: { assignedAgentId: { not: null }, ...where },
        _count: { id: true }
      }),
      db.alertScore.groupBy({
        by: ['status'],
        where: { assignedAgentId: { not: null }, ...where },
        _count: { id: true }
      }),
      db.alertScore.aggregate({
        where: {
          assignedAgentId: { not: null },
          acknowledgedAt: { not: null },
          ...where
        },
        _avg: {
          // Calculate average time to acknowledgment in minutes
          // This would need a computed field or raw query in production
        }
      })
    ]);

    // Calculate reassignment rate
    const reassigned = await db.alertScore.count({
      where: {
        assignedAgentId: { not: null },
        reassignmentReason: { not: null },
        ...where
      }
    });

    const reassignmentRate = totalAssignments > 0
      ? (reassigned / totalAssignments * 100).toFixed(2)
      : '0';

    res.json({
      success: true,
      data: {
        totalAssignments,
        reassignmentRate: `${reassignmentRate}%`,
        byStrategy: byStrategy.reduce((acc: any, item: any) => {
          acc[item.assignmentStrategy || 'unknown'] = item._count.id;
          return acc;
        }, {}),
        byStatus: byStatus.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {})
      }
    });
  } catch (error: any) {
    logger.error('Failed to get routing stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
