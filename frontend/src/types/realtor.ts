// Realtor Dashboard Types
// ROI Systems - Mobile-First Realtor Platform

export type AlertType = 
  | 'Ready to Buy'
  | 'Ready to Sell'
  | 'Ready to Refinance'
  | 'Market Opportunity'
  | 'Life Event'
  | 'High Engagement';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type AlertPriority = 'urgent' | 'high' | 'medium' | 'low';

export type ActivityType = 
  | 'document_view'
  | 'email_open'
  | 'website_visit'
  | 'value_check'
  | 'listing_view'
  | 'contact_form';

export interface BusinessAlert {
  id: string;
  clientId: string;
  clientName: string;
  clientPhoto?: string;
  clientEmail: string;
  clientPhone: string;
  alertType: AlertType;
  confidence: number; // 0-100
  confidenceLevel: ConfidenceLevel;
  priority: AlertPriority;
  propertyAddress?: string;
  propertyValue?: number;
  daysSinceLastContact: number;
  createdAt: string;
  expiresAt?: string;
  isRead: boolean;
  isContacted: boolean;
  contactedAt?: string;
  isSnoozed: boolean;
  snoozedUntil?: string;
  signals: BehavioralSignal[];
  suggestedTalkingPoints: string[];
  quickActions: QuickAction[];
}

export interface BehavioralSignal {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  weight: number; // contribution to confidence score
  metadata?: Record<string, any>;
}

export interface QuickAction {
  type: 'call' | 'text' | 'email' | 'note' | 'schedule';
  label: string;
  icon: string;
  enabled: boolean;
  template?: string;
}

export interface ClientActivity {
  id: string;
  clientId: string;
  clientName: string;
  type: ActivityType;
  description: string;
  timestamp: string;
  metadata?: {
    documentName?: string;
    emailSubject?: string;
    pageUrl?: string;
    propertyAddress?: string;
    duration?: number;
  };
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  photo?: string;
  status: 'lead' | 'active' | 'past_client' | 'inactive';
  source: string;
  assignedAgent: string;
  createdAt: string;
  lastContactDate?: string;
  nextFollowUpDate?: string;
  engagementScore: number; // 0-100
  lifetimeValue: number;
  properties: ClientProperty[];
  interactions: ClientInteraction[];
  preferences: ClientPreferences;
  tags: string[];
}

export interface ClientProperty {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: 'owned' | 'interested' | 'sold';
  purchaseDate?: string;
  purchasePrice?: number;
  currentValue?: number;
  equity?: number;
  status: 'active' | 'sold' | 'pending';
}

export interface ClientInteraction {
  id: string;
  type: 'call' | 'email' | 'text' | 'meeting' | 'note';
  subject?: string;
  notes?: string;
  outcome?: string;
  timestamp: string;
  duration?: number;
  createdBy: string;
}

export interface ClientPreferences {
  communicationMethod: 'email' | 'phone' | 'text' | 'any';
  bestTimeToContact: string;
  propertyTypes: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  locations: string[];
  timeline?: string;
}

export interface Lead {
  id: string;
  clientId: string;
  clientName: string;
  status: 'new' | 'contacted' | 'qualified' | 'nurturing' | 'hot' | 'cold' | 'converted';
  temperature: 'hot' | 'warm' | 'cold';
  source: string;
  assignedTo: string;
  createdAt: string;
  lastActivityDate?: string;
  nextFollowUpDate?: string;
  estimatedValue?: number;
  probability: number; // 0-100
  notes?: string[];
}

export interface FollowUp {
  id: string;
  clientId: string;
  clientName: string;
  type: 'call' | 'email' | 'meeting' | 'task';
  subject: string;
  description?: string;
  dueDate: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'overdue' | 'cancelled';
  completedAt?: string;
  createdBy: string;
}

export interface Commission {
  id: string;
  transactionId: string;
  propertyAddress: string;
  clientName: string;
  salePrice: number;
  commissionRate: number;
  grossCommission: number;
  splits: CommissionSplit[];
  netCommission: number;
  status: 'pending' | 'received' | 'disputed';
  closingDate: string;
  receivedDate?: string;
}

export interface CommissionSplit {
  recipient: string;
  percentage: number;
  amount: number;
  type: 'brokerage' | 'agent' | 'referral' | 'other';
}

export interface MarketInsight {
  id: string;
  type: 'price_change' | 'new_listing' | 'sold' | 'trend' | 'opportunity';
  title: string;
  description: string;
  location: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
  actionable: boolean;
  relatedClients?: string[];
}

export interface PerformanceMetrics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  alertsReceived: number;
  alertsActedOn: number;
  conversionRate: number;
  avgResponseTime: number; // minutes
  dealsClosed: number;
  dealsFromAlerts: number;
  revenueGenerated: number;
  revenueFromAlerts: number;
  brokerageRanking?: number;
  brokerageTotal?: number;
}

export interface ActivityHeatMap {
  date: string;
  hour: number;
  activityCount: number;
  engagementLevel: 'high' | 'medium' | 'low';
}

export interface PushNotificationConfig {
  enabled: boolean;
  alertTypes: AlertType[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string; // HH:mm
  };
  sound: boolean;
  vibration: boolean;
}

export interface PWAConfig {
  installed: boolean;
  updateAvailable: boolean;
  offlineMode: boolean;
  lastSync?: string;
  cacheSize?: number;
}

// Action Templates
export interface ActionTemplate {
  type: 'sms' | 'email' | 'note';
  name: string;
  content: string;
  variables: string[];
}

export const SMS_TEMPLATES: ActionTemplate[] = [
  {
    type: 'sms',
    name: 'Quick Check-in',
    content: 'Hi {{client_name}}, just checking in! How are things going with {{property_address}}? Let me know if you have any questions.',
    variables: ['client_name', 'property_address']
  },
  {
    type: 'sms',
    name: 'Market Update',
    content: 'Hi {{client_name}}! Great news - your home value has increased to {{current_value}}. Want to discuss your options?',
    variables: ['client_name', 'current_value']
  },
  {
    type: 'sms',
    name: 'Refinance Opportunity',
    content: 'Hi {{client_name}}, rates have dropped! You could save money by refinancing. Free to chat this week?',
    variables: ['client_name']
  }
];

export const EMAIL_TEMPLATES: ActionTemplate[] = [
  {
    type: 'email',
    name: 'Value Update',
    content: 'Hi {{client_name}},\n\nI wanted to share some exciting news about {{property_address}}. Based on recent market activity, your home value has increased to {{current_value}}!\n\nWould you like to discuss what this means for you?\n\nBest regards,\n{{agent_name}}',
    variables: ['client_name', 'property_address', 'current_value', 'agent_name']
  },
  {
    type: 'email',
    name: 'Anniversary Follow-up',
    content: 'Hi {{client_name}},\n\nHappy {{years_owned}}-year anniversary at {{property_address}}! Time flies!\n\nI hope you\'re enjoying your home. Let me know if you ever need anything.\n\nBest,\n{{agent_name}}',
    variables: ['client_name', 'years_owned', 'property_address', 'agent_name']
  }
];

// Constants
export const CONFIDENCE_THRESHOLDS = {
  high: 85,
  medium: 60,
  low: 0
};

export const ENGAGEMENT_SCORE_WEIGHTS = {
  document_view: 10,
  email_open: 5,
  website_visit: 8,
  value_check: 15,
  listing_view: 12,
  contact_form: 20
};

export const ALERT_EXPIRY_DAYS = 7;
export const SNOOZE_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '4 hours', hours: 4 },
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '1 week', hours: 168 }
];
