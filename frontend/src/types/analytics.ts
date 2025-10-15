// Business Intelligence Analytics Types
// ROI Systems - Realtor Analytics Dashboard

export type AlertOutcome = 'true_positive' | 'false_positive' | 'missed_opportunity' | 'pending';

export type AlertSource = 'behavioral' | 'market_trigger' | 'anniversary' | 'referral' | 'manual';

export type DealSource = 'instant_alert' | 'referral' | 'marketing_campaign' | 'cold_outreach' | 'repeat_client' | 'other';

export type ClientStage = 'lead' | 'contacted' | 'qualified' | 'showing' | 'offer' | 'under_contract' | 'closed' | 'lost';

export interface AlertPerformanceMetrics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  totalAlerts: number;
  truePositives: number;
  falsePositives: number;
  missedOpportunities: number;
  pending: number;
  accuracy: number; // percentage
  precision: number; // percentage
  recall: number; // percentage
  avgResponseTime: number; // minutes
  conversionRate: number; // percentage
  revenueGenerated: number;
  alertsBySource: AlertSourceBreakdown[];
  alertsByConfidence: AlertConfidenceBreakdown[];
  conversionFunnel: ConversionFunnelData[];
}

export interface AlertSourceBreakdown {
  source: AlertSource;
  count: number;
  truePositives: number;
  falsePositives: number;
  accuracy: number;
  conversionRate: number;
  revenue: number;
}

export interface AlertConfidenceBreakdown {
  confidenceLevel: 'high' | 'medium' | 'low';
  confidenceRange: string;
  count: number;
  truePositives: number;
  accuracy: number;
  conversionRate: number;
}

export interface ConversionFunnelData {
  stage: string;
  count: number;
  percentage: number;
  dropOffRate?: number;
  avgTimeInStage?: number; // days
}

export interface ResponseTimeAnalysis {
  avgResponseTime: number; // minutes
  medianResponseTime: number;
  responseTimeByHour: HourlyResponseData[];
  responseTimeByDay: DailyResponseData[];
  responseTimeByConfidence: ConfidenceResponseData[];
}

export interface HourlyResponseData {
  hour: number;
  avgResponseTime: number;
  alertCount: number;
  conversionRate: number;
}

export interface DailyResponseData {
  dayOfWeek: string;
  avgResponseTime: number;
  alertCount: number;
  conversionRate: number;
}

export interface ConfidenceResponseData {
  confidenceLevel: 'high' | 'medium' | 'low';
  avgResponseTime: number;
  conversionRate: number;
}

export interface ClientLifecycleAnalytics {
  period: 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  totalClients: number;
  activeClients: number;
  closedDeals: number;
  lostClients: number;
  journeyMap: ClientJourneyStage[];
  avgTimeToClose: number; // days
  dropOffAnalysis: DropOffPoint[];
  reEngagementMetrics: ReEngagementData;
  clientRetentionRate: number; // percentage
}

export interface ClientJourneyStage {
  stage: ClientStage;
  count: number;
  percentage: number;
  avgTimeInStage: number; // days
  conversionRate: number; // to next stage
  dropOffRate: number;
  revenueImpact: number;
}

export interface DropOffPoint {
  fromStage: ClientStage;
  toStage: ClientStage | 'lost';
  count: number;
  percentage: number;
  commonReasons: DropOffReason[];
  recoveryRate: number;
}

export interface DropOffReason {
  reason: string;
  count: number;
  percentage: number;
}

export interface ReEngagementData {
  totalAttempts: number;
  successful: number;
  successRate: number;
  avgTimeToReEngage: number; // days
  reEngagementByMethod: ReEngagementMethod[];
  revenueFromReEngagement: number;
}

export interface ReEngagementMethod {
  method: 'email' | 'sms' | 'call' | 'in_person';
  attempts: number;
  successful: number;
  successRate: number;
  avgResponseTime: number;
}

export interface RevenueAttribution {
  period: 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  totalRevenue: number;
  totalDeals: number;
  avgDealSize: number;
  dealsBySource: DealSourceAttribution[];
  commissionProjections: CommissionProjection[];
  pipelineValue: PipelineData;
  yoyComparison: YoYComparison;
  topPerformingStrategies: PerformanceStrategy[];
}

export interface DealSourceAttribution {
  source: DealSource;
  dealCount: number;
  revenue: number;
  percentage: number;
  avgDealSize: number;
  avgTimeToClose: number; // days
  roi?: number; // if applicable
}

export interface CommissionProjection {
  month: string;
  projected: number;
  actual?: number;
  confidence: number; // percentage
  basedOn: {
    closedDeals: number;
    pipelineDeals: number;
    historicalAverage: number;
  };
}

export interface PipelineData {
  totalValue: number;
  dealCount: number;
  weightedValue: number; // adjusted by probability
  byStage: PipelineStageData[];
  expectedCloseDate: PipelineTimeline[];
}

export interface PipelineStageData {
  stage: ClientStage;
  dealCount: number;
  totalValue: number;
  avgProbability: number;
  weightedValue: number;
  avgDaysInStage: number;
}

export interface PipelineTimeline {
  month: string;
  expectedDeals: number;
  expectedRevenue: number;
  confidence: number;
}

export interface YoYComparison {
  currentYear: YearData;
  previousYear: YearData;
  growth: {
    revenue: number; // percentage
    deals: number; // percentage
    avgDealSize: number; // percentage
  };
  monthlyComparison: MonthlyComparison[];
}

export interface YearData {
  year: number;
  revenue: number;
  deals: number;
  avgDealSize: number;
  topMonth: string;
  topMonthRevenue: number;
}

export interface MonthlyComparison {
  month: string;
  currentYear: number;
  previousYear: number;
  growth: number; // percentage
}

export interface PerformanceStrategy {
  strategy: string;
  dealCount: number;
  revenue: number;
  roi: number;
  successRate: number;
  avgTimeToClose: number;
}

export interface CompetitiveInsights {
  period: 'month' | 'quarter' | 'year';
  agentRanking: AgentRanking;
  marketShare: MarketShareData;
  teamComparison: TeamComparisonData;
  leaderboard: LeaderboardEntry[];
  achievements: Achievement[];
  growthTrajectory: GrowthTrajectoryData;
}

export interface AgentRanking {
  currentRank: number;
  totalAgents: number;
  percentile: number;
  previousRank?: number;
  rankChange: number;
  rankingCriteria: RankingCriteria[];
}

export interface RankingCriteria {
  metric: string;
  value: number;
  rank: number;
  percentile: number;
}

export interface MarketShareData {
  territory: string;
  totalMarketDeals: number;
  agentDeals: number;
  marketShare: number; // percentage
  marketShareChange: number; // percentage change
  topCompetitors: CompetitorData[];
  marketTrend: 'growing' | 'stable' | 'declining';
}

export interface CompetitorData {
  name: string;
  deals: number;
  marketShare: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TeamComparisonData {
  teamName: string;
  teamSize: number;
  agentMetrics: AgentMetrics;
  teamAverage: AgentMetrics;
  topPerformer: AgentMetrics;
  comparisonMetrics: ComparisonMetric[];
}

export interface AgentMetrics {
  deals: number;
  revenue: number;
  avgDealSize: number;
  conversionRate: number;
  avgResponseTime: number;
  clientSatisfaction?: number;
}

export interface ComparisonMetric {
  metric: string;
  agentValue: number;
  teamAverage: number;
  topPerformer: number;
  percentile: number;
  status: 'above' | 'at' | 'below';
}

export interface LeaderboardEntry {
  rank: number;
  agentName: string;
  agentId: string;
  score: number;
  deals: number;
  revenue: number;
  badge?: string;
  trend: 'up' | 'down' | 'stable';
  rankChange: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
}

export interface GrowthTrajectoryData {
  currentGrowthRate: number; // percentage
  projectedGrowthRate: number;
  milestones: Milestone[];
  recommendations: string[];
}

export interface Milestone {
  title: string;
  target: number;
  current: number;
  progress: number; // percentage
  estimatedCompletion: string;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface PredictiveAnalytics {
  nextBestActions: NextBestAction[];
  optimalContactTiming: ContactTimingRecommendation[];
  dealProbabilityScores: DealProbabilityScore[];
  marketOpportunities: MarketOpportunity[];
  churnRiskAlerts: ChurnRiskAlert[];
  revenueForecasts: RevenueForecast[];
}

export interface NextBestAction {
  id: string;
  clientId: string;
  clientName: string;
  action: 'call' | 'email' | 'text' | 'meeting' | 'send_listing' | 'market_update';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  reason: string;
  expectedOutcome: string;
  confidence: number; // percentage
  estimatedImpact: {
    conversionIncrease: number; // percentage
    revenueImpact: number;
  };
  suggestedTiming: string;
  expiresAt: string;
}

export interface ContactTimingRecommendation {
  clientId: string;
  clientName: string;
  optimalDay: string;
  optimalHour: number;
  optimalChannel: 'call' | 'email' | 'text';
  confidence: number;
  basedOn: {
    historicalResponseRate: number;
    clientPreference: string;
    behavioralPatterns: string[];
  };
}

export interface DealProbabilityScore {
  clientId: string;
  clientName: string;
  currentStage: ClientStage;
  probability: number; // percentage
  estimatedValue: number;
  estimatedCloseDate: string;
  riskFactors: RiskFactor[];
  opportunityFactors: OpportunityFactor[];
  recommendedActions: string[];
}

export interface RiskFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
}

export interface OpportunityFactor {
  factor: string;
  impact: 'high' | 'medium' | 'low';
  description: string;
  action: string;
}

export interface MarketOpportunity {
  id: string;
  type: 'price_drop' | 'new_listing' | 'market_shift' | 'competitor_exit' | 'seasonal';
  title: string;
  description: string;
  location: string;
  potentialValue: number;
  confidence: number;
  urgency: 'immediate' | 'high' | 'medium' | 'low';
  affectedClients: string[];
  recommendedAction: string;
  expiresAt: string;
}

export interface ChurnRiskAlert {
  clientId: string;
  clientName: string;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number; // 0-100
  indicators: ChurnIndicator[];
  lastContact: string;
  daysSinceContact: number;
  recommendedActions: string[];
  estimatedLostRevenue: number;
}

export interface ChurnIndicator {
  indicator: string;
  weight: number;
  description: string;
}

export interface RevenueForecast {
  month: string;
  forecastedRevenue: number;
  confidence: number; // percentage
  confidenceInterval: {
    low: number;
    high: number;
  };
  basedOn: {
    pipeline: number;
    historicalTrends: number;
    seasonality: number;
    marketConditions: number;
  };
  assumptions: string[];
}

// Dashboard Configuration
export interface DashboardConfig {
  widgets: DashboardWidget[];
  layout: 'grid' | 'list';
  refreshInterval: number; // seconds
  dateRange: {
    start: string;
    end: string;
    preset: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';
  };
}

export interface DashboardWidget {
  id: string;
  type: 'alert_performance' | 'lifecycle' | 'revenue' | 'competitive' | 'predictive';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  visible: boolean;
  config?: Record<string, any>;
}

// Chart Data Types
export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface PieChartData {
  labels: string[];
  data: number[];
  colors: string[];
}

export interface FunnelChartData {
  stage: string;
  value: number;
  percentage: number;
  color: string;
}

// Constants
export const ALERT_ACCURACY_THRESHOLD = 75; // percentage
export const RESPONSE_TIME_TARGET = 30; // minutes
export const CONVERSION_RATE_TARGET = 25; // percentage
export const MARKET_SHARE_TARGET = 10; // percentage

export const CHART_COLORS = {
  primary: '#2563eb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  gray: '#64748b'
};

export const STAGE_COLORS: Record<ClientStage, string> = {
  lead: '#94a3b8',
  contacted: '#3b82f6',
  qualified: '#8b5cf6',
  showing: '#f59e0b',
  offer: '#10b981',
  under_contract: '#059669',
  closed: '#10b981',
  lost: '#ef4444'
};
