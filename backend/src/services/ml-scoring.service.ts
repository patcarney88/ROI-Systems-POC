/**
 * ML Scoring Service
 * Node.js wrapper for Python ML model - generates alert scores from detected signals
 * Processes unprocessed signals and creates AlertScore records
 * Target: Alert generation within 5 minutes of signal detection
 */

import { PrismaClient } from '@prisma/client';
import { createLogger } from '../utils/logger';
import { spawn } from 'child_process';
import { signalProcessingService } from './signal-processing.service';
import path from 'path';
import { addDays } from 'date-fns';

const logger = createLogger('ml-scoring');
const db = new PrismaClient();

export interface MLModelConfig {
  modelType: 'sell' | 'buy' | 'refinance' | 'investment';
  modelPath: string;
  version: string;
}

export interface ScoringRequest {
  userId: string;
  signals: any[];
  userFeatures: any;
}

export interface ScoringResult {
  userId: string;
  alertType: string;
  confidence: number;
  calibratedScore: number;
  rawScore: number;
  topFeatures: Record<string, any>;
  signalIds: string[];
  modelVersion: string;
}

export class MLScoringService {
  private models: Map<string, MLModelConfig> = new Map();
  private pythonScriptPath: string;

  constructor() {
    this.pythonScriptPath = path.join(__dirname, '..', 'ml', 'alert_model.py');
    this.initializeModels();
  }

  /**
   * Initialize ML models for each alert type
   */
  private async initializeModels(): Promise<void> {
    try {
      // Load deployed model versions from database
      const deployedModels = await db.mLModelVersion.findMany({
        where: { status: 'DEPLOYED' }
      });

      for (const model of deployedModels) {
        const modelType = model.modelType.toLowerCase().replace('_prediction', '') as any;
        this.models.set(modelType, {
          modelType,
          modelPath: model.modelPath,
          version: model.version
        });

        logger.info(`Loaded ${modelType} model - Version: ${model.version}`);
      }

      if (this.models.size === 0) {
        logger.warn('No deployed models found - using default models');
        // Use default model paths for initial setup
        const defaultModels = ['sell', 'buy', 'refinance', 'investment'];
        for (const type of defaultModels) {
          this.models.set(type, {
            modelType: type as any,
            modelPath: path.join(__dirname, '..', 'ml', 'models', `${type}_model.pkl`),
            version: '1.0.0'
          });
        }
      }
    } catch (error) {
      logger.error('Failed to initialize models:', error);
      throw error;
    }
  }

  /**
   * Process unprocessed signals and generate alert scores
   */
  async processUnprocessedSignals(limit: number = 100): Promise<void> {
    try {
      logger.info('Starting ML scoring process for unprocessed signals');

      // Get unprocessed signals grouped by user
      const signals = await signalProcessingService.getUnprocessedSignals(limit);

      // Group signals by userId
      const signalsByUser = new Map<string, any[]>();
      for (const signal of signals) {
        const userSignals = signalsByUser.get(signal.userId) || [];
        userSignals.push(signal);
        signalsByUser.set(signal.userId, userSignals);
      }

      logger.info(`Processing signals for ${signalsByUser.size} users`);

      // Score each user
      for (const [userId, userSignals] of signalsByUser.entries()) {
        try {
          await this.scoreUser(userId, userSignals);
        } catch (error) {
          logger.error(`Failed to score user ${userId}:`, error);
        }
      }

      // Mark signals as processed
      const signalIds = signals.map(s => s.id);
      await signalProcessingService.markSignalsProcessed(signalIds);

      logger.info(`ML scoring complete - Processed ${signals.length} signals for ${signalsByUser.size} users`);
    } catch (error: any) {
      logger.error('Failed to process unprocessed signals:', error);
      throw error;
    }
  }

  /**
   * Score a single user across all alert types
   */
  async scoreUser(userId: string, signals: any[]): Promise<ScoringResult[]> {
    try {
      // Get user features
      const userFeatures = await this.getUserFeatures(userId);

      // Score for each model type
      const results: ScoringResult[] = [];

      for (const [modelType, modelConfig] of this.models.entries()) {
        const scoringRequest: ScoringRequest = {
          userId,
          signals: this.formatSignalsForML(signals),
          userFeatures
        };

        try {
          const result = await this.callPythonModel(scoringRequest, modelConfig);

          // Only create alert if confidence meets threshold (e.g., 0.5 = 50%)
          if (result.confidence >= 0.5) {
            await this.createAlertScore(userId, result, signals, modelConfig);
            results.push(result);

            logger.info(`Generated ${modelType} alert for user ${userId} - Confidence: ${result.confidence.toFixed(2)}`);
          }
        } catch (error) {
          logger.error(`Failed to score ${modelType} for user ${userId}:`, error);
        }
      }

      return results;
    } catch (error: any) {
      logger.error(`Failed to score user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get or create user features for ML model
   */
  private async getUserFeatures(userId: string): Promise<any> {
    try {
      let features = await db.userFeatures.findUnique({
        where: { userId }
      });

      // Create default features if not found
      if (!features) {
        features = await db.userFeatures.create({
          data: {
            userId,
            docAccessCount: 0,
            docDownloadCount: 0,
            docShareCount: 0,
            docAccessFrequency: 0,
            emailOpenRate: 0,
            emailClickRate: 0,
            refinanceEmailClicks: 0,
            marketReportViews: 0,
            valueCheckCount: 0,
            calculatorUseCount: 0,
            comparableViews: 0,
            sessionCount: 0,
            avgSessionDuration: 0,
            propertyCount: 0,
            visitFrequency: 0,
            addressChangeRecent: false,
            jobChangeIndicator: false,
            maritalStatusChange: false
          }
        });
      }

      // Convert to plain object for ML model
      return {
        docAccessCount: features.docAccessCount,
        docDownloadCount: features.docDownloadCount,
        docShareCount: features.docShareCount,
        docAccessFrequency: features.docAccessFrequency,
        lastDocAccessDays: features.lastDocAccessDays || 999,
        emailOpenRate: features.emailOpenRate,
        emailClickRate: features.emailClickRate,
        refinanceEmailClicks: features.refinanceEmailClicks,
        marketReportViews: features.marketReportViews,
        valueCheckCount: features.valueCheckCount,
        calculatorUseCount: features.calculatorUseCount,
        comparableViews: features.comparableViews,
        sessionCount: features.sessionCount,
        avgSessionDuration: features.avgSessionDuration,
        propertyCount: features.propertyCount,
        homeOwnershipYears: features.homeOwnershipYears || 0,
        estimatedEquity: features.estimatedEquity ? parseFloat(features.estimatedEquity.toString()) : 0,
        loanToValue: features.loanToValue || 0,
        daysSinceLastVisit: features.daysSinceLastVisit || 999,
        visitFrequency: features.visitFrequency,
        addressChangeRecent: features.addressChangeRecent,
        jobChangeIndicator: features.jobChangeIndicator,
        maritalStatusChange: features.maritalStatusChange
      };
    } catch (error) {
      logger.error(`Failed to get user features for ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Format signals for Python ML model
   */
  private formatSignalsForML(signals: any[]): any[] {
    return signals.map(s => ({
      signalType: s.signalType,
      signalCategory: s.signalCategory,
      strength: s.strength,
      confidence: s.confidence,
      signalData: s.signalData
    }));
  }

  /**
   * Call Python ML model via child process
   */
  private async callPythonModel(
    request: ScoringRequest,
    modelConfig: MLModelConfig
  ): Promise<ScoringResult> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [
        this.pythonScriptPath,
        'score_user',
        JSON.stringify({
          user_id: request.userId,
          signals: request.signals,
          user_features: request.userFeatures,
          model_type: modelConfig.modelType,
          model_path: modelConfig.modelPath
        })
      ]);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code !== 0) {
          logger.error(`Python process exited with code ${code}`, stderr);
          reject(new Error(`Python scoring failed: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            userId: request.userId,
            alertType: this.mapModelTypeToAlertType(modelConfig.modelType),
            confidence: result.confidence,
            calibratedScore: result.calibrated_score,
            rawScore: result.confidence, // Raw score before calibration
            topFeatures: result.top_features,
            signalIds: request.signals.map(s => s.id).filter(Boolean),
            modelVersion: modelConfig.version
          });
        } catch (error) {
          logger.error('Failed to parse Python output:', error);
          reject(error);
        }
      });

      python.on('error', (error) => {
        logger.error('Failed to spawn Python process:', error);
        reject(error);
      });
    });
  }

  /**
   * Map model type to AlertType enum
   */
  private mapModelTypeToAlertType(modelType: string): string {
    const mapping: Record<string, string> = {
      sell: 'LIKELY_TO_SELL',
      buy: 'LIKELY_TO_BUY',
      refinance: 'REFINANCE_OPPORTUNITY',
      investment: 'INVESTMENT_INTEREST'
    };

    return mapping[modelType] || 'LIKELY_TO_SELL';
  }

  /**
   * Calculate alert priority based on confidence and signal strength
   */
  private calculatePriority(confidence: number, signals: any[]): string {
    const avgSignalStrength = signals.reduce((sum, s) => sum + s.strength, 0) / signals.length;

    if (confidence >= 0.8 && avgSignalStrength >= 0.7) return 'CRITICAL';
    if (confidence >= 0.7 && avgSignalStrength >= 0.6) return 'HIGH';
    if (confidence >= 0.5) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Create AlertScore record in database
   */
  private async createAlertScore(
    userId: string,
    result: ScoringResult,
    signals: any[],
    modelConfig: MLModelConfig
  ): Promise<void> {
    try {
      const priority = this.calculatePriority(result.confidence, signals);
      const validUntil = addDays(new Date(), 30); // Scores valid for 30 days

      const alertScore = await db.alertScore.create({
        data: {
          userId,
          alertType: result.alertType as any,
          confidence: result.confidence,
          priority: priority as any,
          features: result.topFeatures,
          modelVersion: modelConfig.version,
          rawScore: result.rawScore,
          calibratedScore: result.calibratedScore,
          signalIds: result.signalIds,
          signalCount: signals.length,
          validUntil,
          status: 'PENDING'
        }
      });

      logger.info(`Created ${result.alertType} alert score for user ${userId} - Priority: ${priority}`);

      // Update model performance tracking
      await this.updateModelMetrics(modelConfig.version);

      // Send real-time notification
      await this.sendAlertNotification(alertScore.id, userId, result.alertType, result.confidence, priority);
    } catch (error) {
      logger.error('Failed to create alert score:', error);
      throw error;
    }
  }

  /**
   * Send alert notification via multiple channels
   */
  private async sendAlertNotification(
    alertId: string,
    userId: string,
    alertType: string,
    confidence: number,
    priority: string
  ): Promise<void> {
    try {
      // Import notification service dynamically to avoid circular dependencies
      const { alertNotificationService } = await import('./alert-notification.service');

      await alertNotificationService.notifyNewAlert({
        alertId,
        userId,
        alertType,
        confidence,
        priority,
        channels: {
          websocket: true,
          email: priority === 'CRITICAL' || priority === 'HIGH',
          inApp: true,
          sms: priority === 'CRITICAL',
          webhook: false
        }
      });
    } catch (error) {
      logger.error(`Failed to send alert notification for ${alertId}:`, error);
      // Don't throw - notification failure shouldn't prevent alert creation
    }
  }

  /**
   * Update model performance metrics
   */
  private async updateModelMetrics(modelVersion: string): Promise<void> {
    try {
      await db.mLModelVersion.update({
        where: { version: modelVersion },
        data: {
          alertsGenerated: { increment: 1 }
        }
      });
    } catch (error) {
      logger.error('Failed to update model metrics:', error);
    }
  }

  /**
   * Batch score multiple users
   */
  async batchScoreUsers(userIds: string[]): Promise<void> {
    logger.info(`Starting batch scoring for ${userIds.length} users`);

    for (const userId of userIds) {
      try {
        // Get user's recent signals
        const signals = await db.alertSignal.findMany({
          where: {
            userId,
            processed: false
          },
          orderBy: { detectedAt: 'desc' }
        });

        if (signals.length > 0) {
          await this.scoreUser(userId, signals);
        }
      } catch (error) {
        logger.error(`Failed to score user ${userId}:`, error);
      }
    }

    logger.info(`Batch scoring complete for ${userIds.length} users`);
  }

  /**
   * Get current model performance metrics
   */
  async getModelPerformance(modelVersion?: string): Promise<any> {
    try {
      const where = modelVersion ? { version: modelVersion } : { status: 'DEPLOYED' };

      const models = await db.mLModelVersion.findMany({
        where: where as any,
        select: {
          version: true,
          modelType: true,
          accuracy: true,
          precision: true,
          recall: true,
          f1Score: true,
          auc: true,
          alertsGenerated: true,
          truePositives: true,
          falsePositives: true,
          deployedAt: true
        }
      });

      return models.map(m => ({
        ...m,
        falsePositiveRate: m.alertsGenerated > 0
          ? (m.falsePositives / m.alertsGenerated * 100).toFixed(2) + '%'
          : '0%',
        truePositiveRate: m.alertsGenerated > 0
          ? (m.truePositives / m.alertsGenerated * 100).toFixed(2) + '%'
          : '0%'
      }));
    } catch (error) {
      logger.error('Failed to get model performance:', error);
      throw error;
    }
  }

  /**
   * Reload models (useful after deploying new model versions)
   */
  async reloadModels(): Promise<void> {
    logger.info('Reloading ML models...');
    this.models.clear();
    await this.initializeModels();
    logger.info('ML models reloaded successfully');
  }
}

// Export singleton instance
export const mlScoringService = new MLScoringService();
