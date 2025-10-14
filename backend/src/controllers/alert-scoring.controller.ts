/**
 * Alert Scoring Controller
 * API endpoints for ML-powered alert generation and management
 */

import { Request, Response } from 'express';
import { mlScoringService } from '../services/ml-scoring.service';
import { signalProcessingService } from '../services/signal-processing.service';
import { queueUserScoring, queueBatchScoring, queueModelReload, getQueueStats } from '../processors/alert-scoring.processor';
import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('alert-scoring-controller');
const db = new PrismaClient();

/**
 * Process unprocessed signals and generate alerts
 * POST /api/alerts/process-signals
 */
export const processUnprocessedSignals = async (req: Request, res: Response) => {
  try {
    const { limit = 100 } = req.body;

    await mlScoringService.processUnprocessedSignals(limit);

    res.json({
      success: true,
      message: `Processed up to ${limit} signals`
    });
  } catch (error: any) {
    logger.error('Failed to process signals:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Score a specific user
 * POST /api/alerts/score-user
 */
export const scoreUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    // Get user's unprocessed signals
    const signals = await db.alertSignal.findMany({
      where: {
        userId,
        processed: false
      },
      orderBy: { detectedAt: 'desc' }
    });

    if (signals.length === 0) {
      return res.json({
        success: true,
        message: 'No unprocessed signals found for user',
        alertsGenerated: 0
      });
    }

    // Score user
    const results = await mlScoringService.scoreUser(userId, signals);

    res.json({
      success: true,
      alertsGenerated: results.length,
      alerts: results
    });
  } catch (error: any) {
    logger.error('Failed to score user:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get alerts for a user
 * GET /api/alerts/user/:userId
 */
export const getUserAlerts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status, alertType, limit = 50, offset = 0 } = req.query;

    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    if (alertType) {
      where.alertType = alertType;
    }

    const [alerts, total] = await Promise.all([
      db.alertScore.findMany({
        where,
        include: {
          alertDelivery: true,
          alertOutcome: true
        },
        orderBy: { scoredAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string)
      }),
      db.alertScore.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string),
          hasMore: total > parseInt(offset as string) + alerts.length
        }
      }
    });
  } catch (error: any) {
    logger.error('Failed to get user alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get alert by ID
 * GET /api/alerts/:id
 */
export const getAlert = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const alert = await db.alertScore.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        },
        alertSignals: true,
        alertDelivery: true,
        alertOutcome: true,
        mlModel: {
          select: {
            version: true,
            modelType: true,
            accuracy: true,
            precision: true,
            recall: true
          }
        }
      }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    res.json({
      success: true,
      data: alert
    });
  } catch (error: any) {
    logger.error('Failed to get alert:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update alert status
 * PATCH /api/alerts/:id/status
 */
export const updateAlertStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'status is required'
      });
    }

    const alert = await db.alertScore.update({
      where: { id },
      data: {
        status: status as any,
        acknowledgedAt: status === 'ACKNOWLEDGED' ? new Date() : undefined,
        convertedAt: status === 'CONVERTED' ? new Date() : undefined
      }
    });

    res.json({
      success: true,
      data: alert
    });
  } catch (error: any) {
    logger.error('Failed to update alert status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get model performance metrics
 * GET /api/alerts/models/performance
 */
export const getModelPerformance = async (req: Request, res: Response) => {
  try {
    const { version } = req.query;

    const performance = await mlScoringService.getModelPerformance(version as string);

    res.json({
      success: true,
      data: performance
    });
  } catch (error: any) {
    logger.error('Failed to get model performance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reload ML models
 * POST /api/alerts/models/reload
 */
export const reloadModels = async (req: Request, res: Response) => {
  try {
    await queueModelReload();

    res.json({
      success: true,
      message: 'Model reload queued'
    });
  } catch (error: any) {
    logger.error('Failed to reload models:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get alert statistics
 * GET /api/alerts/stats
 */
export const getAlertStats = async (req: Request, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.query;

    const where: any = {};

    if (organizationId) {
      where.user = {
        organizationId: organizationId as string
      };
    }

    if (startDate || endDate) {
      where.scoredAt = {};
      if (startDate) where.scoredAt.gte = new Date(startDate as string);
      if (endDate) where.scoredAt.lte = new Date(endDate as string);
    }

    const [
      totalAlerts,
      alertsByType,
      alertsByStatus,
      alertsByPriority,
      queueStats
    ] = await Promise.all([
      db.alertScore.count({ where }),
      db.alertScore.groupBy({
        by: ['alertType'],
        where,
        _count: { id: true }
      }),
      db.alertScore.groupBy({
        by: ['status'],
        where,
        _count: { id: true }
      }),
      db.alertScore.groupBy({
        by: ['priority'],
        where,
        _count: { id: true }
      }),
      getQueueStats()
    ]);

    // Calculate conversion rate
    const converted = await db.alertScore.count({
      where: { ...where, status: 'CONVERTED' }
    });

    const conversionRate = totalAlerts > 0 ? (converted / totalAlerts * 100).toFixed(2) : '0';

    res.json({
      success: true,
      data: {
        totalAlerts,
        conversionRate: `${conversionRate}%`,
        byType: alertsByType.reduce((acc: any, item: any) => {
          acc[item.alertType] = item._count.id;
          return acc;
        }, {}),
        byStatus: alertsByStatus.reduce((acc: any, item: any) => {
          acc[item.status] = item._count.id;
          return acc;
        }, {}),
        byPriority: alertsByPriority.reduce((acc: any, item: any) => {
          acc[item.priority] = item._count.id;
          return acc;
        }, {}),
        queueStats
      }
    });
  } catch (error: any) {
    logger.error('Failed to get alert stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Record alert outcome (for model training)
 * POST /api/alerts/:id/outcome
 */
export const recordAlertOutcome = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      outcome,
      converted,
      conversionValue,
      conversionType,
      userFeedback,
      agentNotes
    } = req.body;

    if (!outcome) {
      return res.status(400).json({
        success: false,
        error: 'outcome is required'
      });
    }

    // Check if alert exists
    const alert = await db.alertScore.findUnique({
      where: { id },
      select: { userId: true, scoredAt: true }
    });

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    // Calculate time to conversion
    const timeToConversion = converted && alert.scoredAt
      ? Math.floor((new Date().getTime() - alert.scoredAt.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Create outcome record
    const outcomeRecord = await db.alertOutcome.create({
      data: {
        alertScoreId: id,
        userId: alert.userId,
        outcome: outcome as any,
        outcomeDate: new Date(),
        converted: converted || false,
        conversionValue: conversionValue || null,
        conversionType: conversionType || null,
        timeToConversion,
        userFeedback,
        agentNotes
      }
    });

    // Update alert status
    if (converted) {
      await db.alertScore.update({
        where: { id },
        data: {
          status: 'CONVERTED',
          convertedAt: new Date()
        }
      });
    }

    // Update model metrics
    if (outcome === 'TRUE_POSITIVE') {
      const modelVersion = (await db.alertScore.findUnique({
        where: { id },
        select: { modelVersion: true }
      }))?.modelVersion;

      if (modelVersion) {
        await db.mLModelVersion.update({
          where: { version: modelVersion },
          data: { truePositives: { increment: 1 } }
        });
      }
    } else if (outcome === 'FALSE_POSITIVE') {
      const modelVersion = (await db.alertScore.findUnique({
        where: { id },
        select: { modelVersion: true }
      }))?.modelVersion;

      if (modelVersion) {
        await db.mLModelVersion.update({
          where: { version: modelVersion },
          data: { falsePositives: { increment: 1 } }
        });
      }
    }

    res.json({
      success: true,
      data: outcomeRecord
    });
  } catch (error: any) {
    logger.error('Failed to record alert outcome:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
