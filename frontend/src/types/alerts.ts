// Instant Business Alert System Types
// ROI Systems - ML-Powered Alert Engine

export type BehaviorType = 
  | 'document_access'
  | 'email_engagement'
  | 'platform_usage'
  | 'value_check'
  | 'listing_view'
  | 'search_activity'
  | 'contact_form'
  | 'calculator_use'
  | 'external_signal';

export type AlertType = 
  | 'ready_to_buy'
  | 'ready_to_sell'
  | 'refinance_opportunity'
  | 'life_event'
  | 're_engagement_needed'
  | 'high_engagement'
  | 'market_opportunity';

export type AlertPriority = 'urgent' | 'high' | 'medium' | 'low';

export type AlertStatus = 'pending' | 'delivered' | 'acknowledged' | 'acted_on' | 'expired' | 'dismissed';

export type ConfidenceLevel = 'very_high' | 'high' | 'medium' | 'low';

export type SignalSource = 'internal' | 'external' | 'integrated' | 'manual';

export interface BehaviorSignal {
  id: string;
  clientId: string;
  type: BehaviorType;
  source: SignalSource;
  timestamp: string;
  weight: number; // 0-100
  decay: number; // decay rate per day
  metadata: BehaviorMetadata;
  processed: boolean;
  contributesToAlert?: string; // alert ID
}

export interface BehaviorMetadata {
  // Document Access
  documentId?: string;
  documentType?: string;
  viewDuration?: number; // seconds
  pageViews?: number;
  
  // Email Engagement
  emailId?: string;
  emailSubject?: string;
  opened?: boolean;
  clicked?: boolean;
  clickedLinks?: string[];
  
  // Platform Usage
  pageUrl?: string;
  sessionDuration?: number;
  pagesVisited?: number;
  features?: string[];
  
  // Value Check
  propertyId?: string;
  propertyAddress?: string;
  valueEstimate?: number;
  previousValue?: number;
  checkCount?: number;
  
  // Listing View
  listingId?: string;
  listingPrice?: number;
  listingAddress?: string;
  viewCount?: number;
  savedListing?: boolean;
  
  // Search Activity
  searchQuery?: string;
  searchFilters?: SearchFilters;
  resultsViewed?: number;
  
  // External Signals
  externalSource?: string;
  externalData?: any;
}

export interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  bedrooms?: number;
  bathrooms?: number;
  location?: string;
  propertyType?: string;
}

export interface Alert {
  id: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  type: AlertType;
  priority: AlertPriority;
  confidence: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  score: number; // composite score
  status: AlertStatus;
  assignedTo?: string; // agent ID
  createdAt: string;
  expiresAt: string;
  deliveredAt?: string;
  acknowledgedAt?: string;
  actedOnAt?: string;
  signals: BehaviorSignal[];
  insights: AlertInsight[];
  recommendations: AlertRecommendation[];
  metadata: AlertMetadata;
}

export interface AlertInsight {
  type: 'behavior' | 'timing' | 'comparison' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  supportingData?: any;
}

export interface AlertRecommendation {
  action: 'call' | 'email' | 'text' | 'meeting' | 'send_listing' | 'send_info';
  priority: number; // 1-5
  reason: string;
  template?: string;
  timing?: string;
  expectedOutcome?: string;
}

export interface AlertMetadata {
  propertyId?: string;
  propertyAddress?: string;
  propertyValue?: number;
  estimatedIntent?: string;
  timeframe?: string; // e.g., "1-3 months"
  budget?: {
    min: number;
    max: number;
  };
  preferences?: ClientPreferences;
  competingAgents?: number;
  marketConditions?: string;
}

export interface ClientPreferences {
  propertyTypes?: string[];
  locations?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  bedrooms?: number;
  bathrooms?: number;
  features?: string[];
}

export interface AlertDistribution {
  alertId: string;
  routingRules: RoutingRule[];
  assignedAgent?: AgentAssignment;
  queuePosition?: number;
  deliveryMethod: 'push' | 'email' | 'sms' | 'in_app';
  deliveryStatus: 'queued' | 'sending' | 'delivered' | 'failed';
  deliveryAttempts: number;
  lastAttempt?: string;
  confirmed: boolean;
}

export interface RoutingRule {
  type: 'territory' | 'specialty' | 'relationship' | 'availability' | 'performance' | 'round_robin';
  priority: number;
  condition?: RoutingCondition;
  agentPool?: string[]; // agent IDs
}

export interface RoutingCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in_range';
  value: any;
}

export interface AgentAssignment {
  agentId: string;
  agentName: string;
  assignedAt: string;
  reason: string;
  score: number; // match score
  autoAssigned: boolean;
}

export interface SignalProcessor {
  processSignal: (signal: BehaviorSignal) => ProcessedSignal;
  calculateWeight: (signal: BehaviorSignal) => number;
  applyDecay: (signal: BehaviorSignal, daysSince: number) => number;
  aggregateSignals: (signals: BehaviorSignal[]) => SignalAggregate;
}

export interface ProcessedSignal {
  signal: BehaviorSignal;
  adjustedWeight: number;
  decayedWeight: number;
  normalizedScore: number;
  contributionToAlert: number;
  timestamp: string;
}

export interface SignalAggregate {
  clientId: string;
  totalSignals: number;
  totalWeight: number;
  averageWeight: number;
  signalsByType: Record<BehaviorType, number>;
  timeRange: {
    start: string;
    end: string;
  };
  trendDirection: 'increasing' | 'stable' | 'decreasing';
  velocity: number; // signals per day
}

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type: 'classification' | 'regression' | 'clustering';
  alertType: AlertType;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  trainedOn: string;
  lastUpdated: string;
  features: ModelFeature[];
  hyperparameters: Record<string, any>;
}

export interface ModelFeature {
  name: string;
  type: 'numeric' | 'categorical' | 'boolean' | 'text';
  importance: number; // 0-1
  description: string;
}

export interface MLPrediction {
  alertType: AlertType;
  confidence: number;
  probability: number;
  features: FeatureValue[];
  modelVersion: string;
  timestamp: string;
}

export interface FeatureValue {
  feature: string;
  value: any;
  normalized: number;
  contribution: number;
}

export interface TrainingData {
  id: string;
  clientId: string;
  signals: BehaviorSignal[];
  outcome: AlertOutcome;
  features: Record<string, any>;
  label: AlertType | 'no_alert';
  timestamp: string;
}

export interface AlertOutcome {
  alertId: string;
  wasAccurate: boolean;
  actualOutcome: 'true_positive' | 'false_positive' | 'false_negative' | 'true_negative';
  timeToConversion?: number; // days
  conversionValue?: number;
  agentFeedback?: AgentFeedback;
  timestamp: string;
}

export interface AgentFeedback {
  agentId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  accuracy: 'accurate' | 'somewhat_accurate' | 'inaccurate';
  timing: 'too_early' | 'perfect' | 'too_late';
  actionTaken: string;
  comments?: string;
  timestamp: string;
}

export interface FeedbackLoop {
  collectFeedback: (alertId: string, feedback: AgentFeedback) => void;
  updateModel: (outcomes: AlertOutcome[]) => void;
  calculateAccuracy: (predictions: MLPrediction[], outcomes: AlertOutcome[]) => ModelMetrics;
  retrain: (data: TrainingData[]) => MLModel;
}

export interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: ConfusionMatrix;
  rocAuc?: number;
  prCurve?: number;
}

export interface ConfusionMatrix {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ABTestVariant[];
  allocation: Record<string, number>; // variant ID -> percentage
  startDate: string;
  endDate?: string;
  metrics: ABTestMetrics;
  winner?: string; // variant ID
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  config: AlertConfig;
  participants: number;
  conversions: number;
  conversionRate: number;
}

export interface AlertConfig {
  confidenceThreshold: number;
  signalWeights: Record<BehaviorType, number>;
  decayRates: Record<BehaviorType, number>;
  timeWindow: number; // days
  minimumSignals: number;
  alertTypes: AlertType[];
}

export interface ABTestMetrics {
  totalParticipants: number;
  totalConversions: number;
  overallConversionRate: number;
  statisticalSignificance: number;
  confidenceLevel: number;
  variantMetrics: Record<string, VariantMetrics>;
}

export interface VariantMetrics {
  participants: number;
  conversions: number;
  conversionRate: number;
  averageTimeToConversion: number;
  revenueGenerated: number;
  costPerConversion: number;
}

export interface RealTimeProcessor {
  processIncoming: (signal: BehaviorSignal) => void;
  checkThresholds: (clientId: string) => boolean;
  generateAlert: (clientId: string, signals: BehaviorSignal[]) => Alert;
  distributeAlert: (alert: Alert) => AlertDistribution;
  notifyAgent: (distribution: AlertDistribution) => void;
}

export interface WebSocketMessage {
  type: 'alert' | 'signal' | 'update' | 'feedback';
  payload: Alert | BehaviorSignal | AlertUpdate | AgentFeedback;
  timestamp: string;
  priority: AlertPriority;
}

export interface AlertUpdate {
  alertId: string;
  field: string;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: string;
}

export interface RedisCache {
  signals: Record<string, BehaviorSignal[]>; // clientId -> signals
  aggregates: Record<string, SignalAggregate>; // clientId -> aggregate
  activeAlerts: Record<string, Alert>; // alertId -> alert
  agentQueues: Record<string, string[]>; // agentId -> alertIds
}

export interface AlertEngine {
  trackBehavior: (signal: BehaviorSignal) => void;
  processSignals: (clientId: string) => SignalAggregate;
  evaluateForAlert: (aggregate: SignalAggregate) => MLPrediction | null;
  createAlert: (prediction: MLPrediction, signals: BehaviorSignal[]) => Alert;
  routeAlert: (alert: Alert) => AlertDistribution;
  deliverAlert: (distribution: AlertDistribution) => void;
  updateAlertStatus: (alertId: string, status: AlertStatus) => void;
  collectFeedback: (alertId: string, feedback: AgentFeedback) => void;
  retrainModel: (alertType: AlertType) => void;
}

// Signal Weights (default configuration)
export const DEFAULT_SIGNAL_WEIGHTS: Record<BehaviorType, number> = {
  document_access: 10,
  email_engagement: 5,
  platform_usage: 3,
  value_check: 15,
  listing_view: 12,
  search_activity: 8,
  contact_form: 20,
  calculator_use: 10,
  external_signal: 7
};

// Decay Rates (per day)
export const DEFAULT_DECAY_RATES: Record<BehaviorType, number> = {
  document_access: 0.1,
  email_engagement: 0.15,
  platform_usage: 0.2,
  value_check: 0.05,
  listing_view: 0.08,
  search_activity: 0.12,
  contact_form: 0.03,
  calculator_use: 0.1,
  external_signal: 0.1
};

// Confidence Thresholds
export const CONFIDENCE_THRESHOLDS = {
  very_high: 90,
  high: 75,
  medium: 60,
  low: 40
};

// Alert Type Thresholds
export const ALERT_THRESHOLDS: Record<AlertType, number> = {
  ready_to_buy: 85,
  ready_to_sell: 80,
  refinance_opportunity: 75,
  life_event: 70,
  re_engagement_needed: 60,
  high_engagement: 65,
  market_opportunity: 70
};

// Time Windows (days)
export const TIME_WINDOWS = {
  short: 7,
  medium: 30,
  long: 90,
  extended: 180
};

// Alert Expiry (hours)
export const ALERT_EXPIRY = {
  urgent: 24,
  high: 72,
  medium: 168, // 1 week
  low: 336 // 2 weeks
};
