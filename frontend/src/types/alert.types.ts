/**
 * Alert Type Definitions
 * Comprehensive TypeScript interfaces for the AI-powered Alert System
 */

/**
 * Alert priority levels with color coding
 */
export enum AlertPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

/**
 * Alert types based on user behavior patterns
 */
export enum AlertType {
  LIKELY_TO_SELL = 'LIKELY_TO_SELL',
  LIKELY_TO_BUY = 'LIKELY_TO_BUY',
  REFINANCE_OPPORTUNITY = 'REFINANCE_OPPORTUNITY',
  INVESTMENT_OPPORTUNITY = 'INVESTMENT_OPPORTUNITY'
}

/**
 * Alert status lifecycle
 */
export enum AlertStatus {
  NEW = 'NEW',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  IN_PROGRESS = 'IN_PROGRESS',
  CONTACTED = 'CONTACTED',
  CONVERTED = 'CONVERTED',
  DISMISSED = 'DISMISSED'
}

/**
 * Alert outcome classification for ML feedback
 */
export enum AlertOutcome {
  TRUE_POSITIVE = 'TRUE_POSITIVE',
  FALSE_POSITIVE = 'FALSE_POSITIVE',
  TRUE_NEGATIVE = 'TRUE_NEGATIVE',
  FALSE_NEGATIVE = 'FALSE_NEGATIVE',
  PENDING = 'PENDING'
}

/**
 * Individual signal contributing to alert
 */
export interface AlertSignal {
  id: string;
  name: string;
  description: string;
  strength: number; // 0-100
  weight: number; // 0-1
  category: 'behavioral' | 'demographic' | 'temporal' | 'engagement' | 'property';
  lastUpdated: string;
  metadata?: Record<string, any>;
}

/**
 * User information associated with alert
 */
export interface AlertUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  propertyCount?: number;
  totalValue?: number;
  lastContact?: string;
  engagementScore?: number;
}

/**
 * Property information if applicable
 */
export interface AlertProperty {
  id: string;
  address: string;
  propertyType: string;
  estimatedValue?: number;
  lastSaleDate?: string;
  lastSalePrice?: number;
  currentEquity?: number;
  mortgageBalance?: number;
}

/**
 * Agent assignment information
 */
export interface AlertAssignment {
  agentId: string;
  agentName: string;
  assignedAt: string;
  assignedBy?: string;
  reason?: string;
}

/**
 * Alert outcome details for ML feedback
 */
export interface AlertOutcomeDetails {
  outcome: AlertOutcome;
  recordedAt: string;
  recordedBy: string;
  converted: boolean;
  conversionValue?: number;
  conversionType?: string;
  contactMethods?: string[];
  responseTime?: number; // minutes
  notes?: string;
  feedback?: string;
}

/**
 * Main Alert interface
 */
export interface Alert {
  id: string;
  userId: string;
  user: AlertUser;
  type: AlertType;
  priority: AlertPriority;
  status: AlertStatus;
  confidenceScore: number; // 0-100
  signals: AlertSignal[];
  topFactors: string[]; // Top 3-5 contributing factors
  property?: AlertProperty;
  assignment?: AlertAssignment;
  outcome?: AlertOutcomeDetails;
  createdAt: string;
  updatedAt: string;
  acknowledgedAt?: string;
  contactedAt?: string;
  dismissedAt?: string;
  metadata?: Record<string, any>;
}

/**
 * Alert statistics for dashboard
 */
export interface AlertStatistics {
  totalAlerts: number;
  alertsByType: Record<AlertType, number>;
  alertsByPriority: Record<AlertPriority, number>;
  alertsByStatus: Record<AlertStatus, number>;
  conversionRate: number; // percentage
  averageConfidence: number;
  averageResponseTime: number; // minutes
  topPerformingAgents: Array<{
    agentId: string;
    agentName: string;
    alertsHandled: number;
    conversionRate: number;
    averageResponseTime: number;
  }>;
  alertVolumeOverTime: Array<{
    date: string;
    count: number;
    type?: AlertType;
  }>;
  conversionFunnel: {
    new: number;
    acknowledged: number;
    contacted: number;
    converted: number;
  };
}

/**
 * Alert filters for dashboard
 */
export interface AlertFilters {
  types?: AlertType[];
  priorities?: AlertPriority[];
  statuses?: AlertStatus[];
  dateFrom?: string;
  dateTo?: string;
  confidenceMin?: number;
  confidenceMax?: number;
  assignedAgentId?: string;
  searchQuery?: string;
}

/**
 * Sort options for alert list
 */
export enum AlertSortBy {
  CONFIDENCE_HIGH = 'CONFIDENCE_HIGH',
  CONFIDENCE_LOW = 'CONFIDENCE_LOW',
  DATE_NEW = 'DATE_NEW',
  DATE_OLD = 'DATE_OLD',
  PRIORITY = 'PRIORITY'
}

/**
 * Pagination parameters
 */
export interface AlertPagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

/**
 * Alert list response
 */
export interface AlertListResponse {
  alerts: Alert[];
  pagination: AlertPagination;
  filters: AlertFilters;
  sortBy: AlertSortBy;
}

/**
 * WebSocket event types
 */
export enum WebSocketEventType {
  NEW_ALERT = 'NEW_ALERT',
  ALERT_UPDATED = 'ALERT_UPDATED',
  ALERT_ASSIGNED = 'ALERT_ASSIGNED',
  ALERT_DELETED = 'ALERT_DELETED',
  CONNECTION_STATUS = 'CONNECTION_STATUS'
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage {
  type: WebSocketEventType;
  payload: Alert | Partial<Alert> | { status: string };
  timestamp: string;
}

/**
 * Agent information for assignment
 */
export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialties: string[];
  activeAlerts: number;
  conversionRate: number;
  averageResponseTime: number;
  available: boolean;
}

/**
 * Outcome recording form data
 */
export interface OutcomeFormData {
  outcome: AlertOutcome;
  converted: boolean;
  conversionValue?: number;
  conversionType?: string;
  contactMethods: string[];
  notes?: string;
  feedback?: string;
}

/**
 * Filter preset for saving/loading
 */
export interface FilterPreset {
  id: string;
  name: string;
  filters: AlertFilters;
  createdAt: string;
  isDefault?: boolean;
}
