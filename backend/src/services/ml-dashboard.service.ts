/**
 * ML Dashboard Service
 * Backend API for ML monitoring dashboard
 * Provides metrics, visualizations, and health status
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface DashboardMetrics {
  totalPredictions: number;
  avgConfidence: number;
  avgLatency: number;
  modelHealth: ModelHealthScores;
  modelPerformance: PerformanceMetrics[];
  topFeatures: FeatureImportance[];
  driftStatus: DriftStatus;
  recentPredictions: PredictionRecord[];
  activeAlerts: Alert[];
  timeRange: string;
}

export interface ModelHealthScores {
  [modelName: string]: {
    overall_health: number;
    performance_status: string;
    drift_status: string;
    latency_status: string;
    last_checked: string;
  };
}

export interface PerformanceMetrics {
  model_name: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc: number;
  prediction_count: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  model: string;
}

export interface DriftStatus {
  data_drift_detected: boolean;
  prediction_drift_detected: boolean;
  drifted_features: string[];
  drift_score: number;
}

export interface PredictionRecord {
  id: string;
  model_name: string;
  predicted_value: number;
  confidence: number;
  timestamp: string;
  user_id: string;
}

export interface Alert {
  id: string;
  model_name: string;
  severity: 'low' | 'medium' | 'high';
  check: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

export class MLDashboardService {
  private pythonPath: string;
  private mlPath: string;

  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || 'python3';
    this.mlPath = path.join(__dirname, '../ml');
  }

  /**
   * Get comprehensive dashboard metrics
   */
  async getDashboardMetrics(
    timeRange: '24h' | '7d' | '30d' = '7d'
  ): Promise<DashboardMetrics> {
    try {
      const [
        totalPredictions,
        avgConfidence,
        avgLatency,
        modelHealth,
        modelPerformance,
        topFeatures,
        driftStatus,
        recentPredictions,
        activeAlerts
      ] = await Promise.all([
        this.getTotalPredictions(timeRange),
        this.getAverageConfidence(timeRange),
        this.getAverageLatency(timeRange),
        this.getModelHealthScores(),
        this.getModelPerformance(timeRange),
        this.getTopFeatures(),
        this.getDriftStatus(),
        this.getRecentPredictions(10),
        this.getActiveAlerts()
      ]);

      return {
        totalPredictions,
        avgConfidence,
        avgLatency,
        modelHealth,
        modelPerformance,
        topFeatures,
        driftStatus,
        recentPredictions,
        activeAlerts,
        timeRange
      };
    } catch (error) {
      console.error('Failed to get dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get model health scores for all models
   */
  async getModelHealthScores(): Promise<ModelHealthScores> {
    const models = ['move_probability', 'transaction_type', 'contact_timing', 'property_value'];
    const healthScores: ModelHealthScores = {};

    for (const modelName of models) {
      try {
        const health = await this.checkModelHealth(modelName);
        healthScores[modelName] = {
          overall_health: health.overall_health,
          performance_status: health.checks.performance?.status || 'unknown',
          drift_status: health.checks.data_drift?.status || 'unknown',
          latency_status: health.checks.latency?.status || 'unknown',
          last_checked: health.timestamp
        };
      } catch (error) {
        console.error(`Failed to get health for ${modelName}:`, error);
        healthScores[modelName] = {
          overall_health: 0,
          performance_status: 'error',
          drift_status: 'error',
          latency_status: 'error',
          last_checked: new Date().toISOString()
        };
      }
    }

    return healthScores;
  }

  /**
   * Check health for specific model
   */
  async checkModelHealth(modelName: string): Promise<any> {
    // Call Python monitoring script
    const script = path.join(this.mlPath, 'monitoring/model_monitor.py');
    const command = `${this.pythonPath} ${script} check_health ${modelName}`;

    try {
      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      console.error(`Health check failed for ${modelName}:`, error);
      throw error;
    }
  }

  /**
   * Get model performance metrics
   */
  async getModelPerformance(timeRange: string): Promise<PerformanceMetrics[]> {
    // TODO: Query from database
    // This is a mock implementation
    return [
      {
        model_name: 'move_probability',
        accuracy: 0.78,
        precision: 0.75,
        recall: 0.72,
        f1_score: 0.74,
        auc: 0.82,
        prediction_count: 1250
      },
      {
        model_name: 'transaction_type',
        accuracy: 0.71,
        precision: 0.69,
        recall: 0.68,
        f1_score: 0.68,
        auc: 0.76,
        prediction_count: 980
      },
      {
        model_name: 'contact_timing',
        accuracy: 0.68,
        precision: 0.65,
        recall: 0.70,
        f1_score: 0.67,
        auc: 0.74,
        prediction_count: 850
      },
      {
        model_name: 'property_value',
        accuracy: 0.85,
        precision: 0.83,
        recall: 0.82,
        f1_score: 0.82,
        auc: 0.89,
        prediction_count: 1100
      }
    ];
  }

  /**
   * Get top important features across models
   */
  async getTopFeatures(): Promise<FeatureImportance[]> {
    // TODO: Query from model metadata
    return [
      { feature: 'doc_access_count_30d', importance: 0.15, model: 'move_probability' },
      { feature: 'email_engagement_score', importance: 0.12, model: 'move_probability' },
      { feature: 'property_search_frequency', importance: 0.11, model: 'move_probability' },
      { feature: 'value_check_count', importance: 0.09, model: 'move_probability' },
      { feature: 'years_owned', importance: 0.08, model: 'move_probability' }
    ];
  }

  /**
   * Get drift detection status
   */
  async getDriftStatus(): Promise<DriftStatus> {
    // TODO: Query from monitoring system
    return {
      data_drift_detected: false,
      prediction_drift_detected: false,
      drifted_features: [],
      drift_score: 0.18
    };
  }

  /**
   * Get recent predictions
   */
  async getRecentPredictions(limit: number = 10): Promise<PredictionRecord[]> {
    // TODO: Query from database
    return [];
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(): Promise<Alert[]> {
    // TODO: Query from alerts system
    return [];
  }

  /**
   * Get total predictions in time range
   */
  async getTotalPredictions(timeRange: string): Promise<number> {
    // TODO: Query from database
    return 4180;
  }

  /**
   * Get average confidence
   */
  async getAverageConfidence(timeRange: string): Promise<number> {
    // TODO: Query from database
    return 0.76;
  }

  /**
   * Get average latency
   */
  async getAverageLatency(timeRange: string): Promise<number> {
    // TODO: Query from database
    return 48.5;
  }

  /**
   * Generate SHAP explanation for prediction
   */
  async explainPrediction(
    modelName: string,
    features: number[],
    userLevel: 'non_technical' | 'technical' | 'detailed' = 'non_technical'
  ): Promise<any> {
    const script = path.join(this.mlPath, 'explainability/explain_api.py');
    const command = `${this.pythonPath} ${script} explain ${modelName} ${userLevel}`;

    try {
      const { stdout } = await execAsync(command, {
        input: JSON.stringify({ features })
      });
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Explanation generation failed:', error);
      throw error;
    }
  }

  /**
   * Trigger model retraining
   */
  async triggerRetraining(
    modelName: string,
    reason: string = 'manual'
  ): Promise<{ job_id: string }> {
    const script = path.join(this.mlPath, 'retraining/auto_retrain.py');
    const command = `${this.pythonPath} ${script} trigger ${modelName} ${reason}`;

    try {
      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Retraining trigger failed:', error);
      throw error;
    }
  }

  /**
   * Get retraining history
   */
  async getRetrainingHistory(limit: number = 10): Promise<any[]> {
    const script = path.join(this.mlPath, 'retraining/auto_retrain.py');
    const command = `${this.pythonPath} ${script} history ${limit}`;

    try {
      const { stdout } = await execAsync(command);
      return JSON.parse(stdout);
    } catch (error) {
      console.error('Failed to get retraining history:', error);
      throw error;
    }
  }
}

export default MLDashboardService;
