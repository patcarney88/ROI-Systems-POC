// Forever Marketing System Types
// ROI Systems - Title Agent Marketing Platform

export type TemplateCategory = 
  | 'Closing Anniversary'
  | 'Home Value Update'
  | 'Neighborhood Activity'
  | 'Holiday Greeting'
  | 'Refinance Opportunity'
  | 'Maintenance Reminder'
  | 'Custom';

export type CampaignStatus = 
  | 'draft'
  | 'scheduled'
  | 'sending'
  | 'sent'
  | 'paused'
  | 'cancelled';

export type TriggerType = 
  | 'anniversary'
  | 'value_milestone'
  | 'market_change'
  | 'life_event'
  | 'manual'
  | 'drip_sequence';

export interface EmailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  preheader?: string;
  htmlContent: string;
  textContent: string;
  thumbnail?: string;
  isDefault: boolean;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  usageCount: number;
  avgOpenRate?: number;
  avgClickRate?: number;
  tags: string[];
  variables: TemplateVariable[];
  coBranding: CoBrandingConfig;
}

export interface TemplateVariable {
  name: string;
  key: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'boolean';
  defaultValue?: string;
  required: boolean;
  description?: string;
}

export interface CoBrandingConfig {
  enabled: boolean;
  titleCompanyLogo?: string;
  agentLogo?: string;
  titleCompanyName?: string;
  agentName?: string;
  layout: 'side-by-side' | 'stacked' | 'title-primary' | 'agent-primary';
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  templateId: string;
  template?: EmailTemplate;
  status: CampaignStatus;
  subject: string;
  preheader?: string;
  fromName: string;
  fromEmail: string;
  replyTo?: string;
  recipients: CampaignRecipient[];
  recipientCount: number;
  scheduledDate?: string;
  sentDate?: string;
  createdBy: string;
  createdAt: string;
  lastModified: string;
  metrics?: CampaignMetrics;
  trigger?: CampaignTrigger;
  abTest?: ABTest;
  tags: string[];
}

export interface CampaignRecipient {
  id: string;
  email: string;
  name: string;
  clientId?: string;
  propertyAddress?: string;
  closingDate?: string;
  variables: Record<string, any>;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
}

export interface CampaignMetrics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  complained: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  engagementScore: number;
  revenue?: number;
}

export interface CampaignTrigger {
  type: TriggerType;
  conditions: TriggerCondition[];
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  enabled: boolean;
}

export interface TriggerCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between';
  value: any;
}

export interface ABTest {
  enabled: boolean;
  variants: ABTestVariant[];
  winnerCriteria: 'open_rate' | 'click_rate' | 'engagement';
  testDuration: number; // hours
  testPercentage: number; // 0-100
  winner?: string; // variant id
}

export interface ABTestVariant {
  id: string;
  name: string;
  subject: string;
  percentage: number;
  sent: number;
  metrics?: CampaignMetrics;
}

export interface DripCampaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  trigger: CampaignTrigger;
  steps: DripStep[];
  enrolledCount: number;
  completedCount: number;
  createdAt: string;
  lastModified: string;
}

export interface DripStep {
  id: string;
  order: number;
  name: string;
  templateId: string;
  delay: number; // days from previous step
  delayUnit: 'hours' | 'days' | 'weeks';
  conditions?: TriggerCondition[];
  sent: number;
  metrics?: CampaignMetrics;
}

export interface MarketingAnalytics {
  period: 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  totalCampaigns: number;
  totalSent: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgEngagementScore: number;
  topPerformingCampaigns: Campaign[];
  topPerformingSubjects: SubjectLinePerformance[];
  optimalSendTimes: SendTimeAnalysis[];
  audienceGrowth: AudienceGrowthData[];
  revenueAttribution?: number;
}

export interface SubjectLinePerformance {
  subject: string;
  campaignId: string;
  campaignName: string;
  sent: number;
  openRate: number;
  clickRate: number;
  engagementScore: number;
}

export interface SendTimeAnalysis {
  dayOfWeek: string;
  hour: number;
  sent: number;
  avgOpenRate: number;
  avgClickRate: number;
  recommended: boolean;
}

export interface AudienceGrowthData {
  date: string;
  totalSubscribers: number;
  newSubscribers: number;
  unsubscribed: number;
  netGrowth: number;
}

export interface CoMarketingAgreement {
  id: string;
  titleCompanyId: string;
  titleCompanyName: string;
  agentId: string;
  agentName: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  approvalWorkflow: ApprovalStep[];
  costSharing: CostSharingConfig;
  brandingGuidelines: BrandingGuidelines;
  performanceAttribution: PerformanceAttribution;
  startDate: string;
  endDate?: string;
  createdAt: string;
}

export interface ApprovalStep {
  id: string;
  role: 'agent' | 'title_company' | 'compliance';
  approver: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: string;
  comments?: string;
}

export interface CostSharingConfig {
  model: 'split' | 'title_pays' | 'agent_pays' | 'custom';
  titleCompanyPercentage: number;
  agentPercentage: number;
  monthlyBudget?: number;
  perCampaignCost?: number;
}

export interface BrandingGuidelines {
  primaryColor: string;
  secondaryColor: string;
  logoUsage: string;
  fontFamily: string;
  disclaimerText?: string;
  requiredDisclosures: string[];
}

export interface PerformanceAttribution {
  titleCompanyLeads: number;
  agentLeads: number;
  sharedLeads: number;
  titleCompanyRevenue: number;
  agentRevenue: number;
  sharedRevenue: number;
}

export interface EmailPreview {
  device: 'desktop' | 'mobile' | 'tablet';
  client: 'gmail' | 'outlook' | 'apple_mail' | 'yahoo' | 'generic';
  darkMode: boolean;
}

export interface SendGridConfig {
  apiKey?: string;
  fromEmail: string;
  fromName: string;
  replyTo?: string;
  trackOpens: boolean;
  trackClicks: boolean;
  unsubscribeGroup?: number;
  ipPool?: string;
}

export interface SESConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  configurationSet?: string;
  fromEmail: string;
  fromName: string;
}

// Constants
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  'Closing Anniversary',
  'Home Value Update',
  'Neighborhood Activity',
  'Holiday Greeting',
  'Refinance Opportunity',
  'Maintenance Reminder',
  'Custom'
];

export const PERSONALIZATION_FIELDS: TemplateVariable[] = [
  { name: 'Client Name', key: 'client_name', type: 'text', required: true, description: 'Full name of the client' },
  { name: 'Property Address', key: 'property_address', type: 'text', required: false, description: 'Full property address' },
  { name: 'Closing Date', key: 'closing_date', type: 'date', required: false, description: 'Date of closing' },
  { name: 'Current Value', key: 'current_value', type: 'currency', required: false, description: 'Current estimated home value' },
  { name: 'Equity Amount', key: 'equity_amount', type: 'currency', required: false, description: 'Estimated equity' },
  { name: 'Agent Name', key: 'agent_name', type: 'text', required: true, description: 'Real estate agent name' },
  { name: 'Title Company', key: 'title_company', type: 'text', required: true, description: 'Title company name' },
  { name: 'Years Owned', key: 'years_owned', type: 'number', required: false, description: 'Years since closing' }
];

export const TARGET_OPEN_RATE = { min: 40, max: 60 };
export const TARGET_CLICK_RATE = { min: 10, max: 20 };
