/**
 * Email Service Types
 * Comprehensive type definitions for multi-provider email service
 */

// ============================================================================
// CORE EMAIL TYPES
// ============================================================================

export interface EmailAddress {
  email: string;
  name?: string;
}

export interface Attachment {
  filename: string;
  content?: string | Buffer; // Base64 string or Buffer
  contentType?: string;
  disposition?: 'attachment' | 'inline';
  contentId?: string; // For inline images
  size?: number;
}

export interface EmailData {
  // Sender
  from: EmailAddress;
  replyTo?: EmailAddress;

  // Recipients
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];

  // Content
  subject: string;
  html?: string;
  text?: string;
  templateId?: string;
  templateData?: Record<string, any>;

  // Attachments
  attachments?: Attachment[];

  // Headers & Metadata
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, any>;

  // Tracking
  trackOpens?: boolean;
  trackClicks?: boolean;
  trackConversion?: boolean;

  // Scheduling
  scheduledFor?: Date;

  // Organization
  organizationId: string;

  // Classification
  type?: 'TRANSACTIONAL' | 'MARKETING' | 'NOTIFICATION' | 'SYSTEM';
  category?: string;

  // Priority
  priority?: number; // 1-10, higher = more urgent
}

// ============================================================================
// PROVIDER TYPES
// ============================================================================

export type EmailProviderType = 'SENDGRID' | 'AWS_SES' | 'MAILGUN';

export type ProviderStatus = 'ACTIVE' | 'DEGRADED' | 'FAILED' | 'DISABLED' | 'MAINTENANCE';

export interface ProviderConfig {
  provider: EmailProviderType;
  apiKey: string;
  apiSecret?: string;
  region?: string; // For AWS SES
  domain?: string;
  webhookSecret?: string;
}

export interface ProviderHealthStatus {
  providerId: string;
  provider: EmailProviderType;
  status: ProviderStatus;
  healthScore: number; // 0-100
  responseTime?: number; // ms
  lastCheck: Date;
  consecutiveFailures: number;
  metrics: {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    deliveryRate: number;
    bounceRate: number;
    complaintRate: number;
  };
}

// ============================================================================
// SEND RESULT TYPES
// ============================================================================

export interface SendResult {
  success: boolean;
  messageId?: string;
  providerId?: string;
  providerName?: EmailProviderType;
  error?: Error;
  attemptedAt: Date;
  sentAt?: Date;
  responseTime?: number; // ms
}

export interface BulkSendResult {
  totalRequested: number;
  totalSuccess: number;
  totalFailed: number;
  results: SendResult[];
  errors: Array<{
    email: string;
    error: Error;
  }>;
}

// ============================================================================
// PROVIDER SELECTION TYPES
// ============================================================================

export interface SelectionCriteria {
  organizationId: string;
  emailCount?: number; // For bulk sends
  priority?: number;
  requireProvider?: EmailProviderType;
  excludeProviders?: EmailProviderType[];
  optimizeFor?: 'cost' | 'speed' | 'reliability';
}

export interface ProviderScore {
  providerId: string;
  provider: EmailProviderType;
  score: number; // Combined score based on health, quota, cost
  healthScore: number;
  quotaScore: number;
  costScore: number;
  available: boolean;
  reason?: string; // If not available
}

// ============================================================================
// RETRY & FAILOVER TYPES
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  retryableErrors: string[]; // Error codes that should trigger retry
}

export interface FailoverAttempt {
  providerId: string;
  provider: EmailProviderType;
  timestamp: Date;
  error?: string;
  errorCode?: string;
}

// ============================================================================
// SUPPRESSION TYPES
// ============================================================================

export type SuppressionReason =
  | 'HARD_BOUNCE'
  | 'SOFT_BOUNCE'
  | 'SPAM_COMPLAINT'
  | 'UNSUBSCRIBE'
  | 'MANUAL'
  | 'INVALID_EMAIL'
  | 'ROLE_ACCOUNT'
  | 'DISPOSABLE_EMAIL'
  | 'BLACKLIST'
  | 'LEGAL_REQUEST';

export interface SuppressionEntry {
  email: string;
  reason: SuppressionReason;
  reasonDetails?: string;
  source?: string;
  suppressedAt: Date;
  expiresAt?: Date;
  active: boolean;
}

export interface SuppressionCheckResult {
  isSuppressed: boolean;
  reason?: SuppressionReason;
  details?: string;
  suppressedAt?: Date;
}

// ============================================================================
// WEBHOOK & EVENT TYPES
// ============================================================================

export type EmailEventType =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'BOUNCED'
  | 'DEFERRED'
  | 'DROPPED'
  | 'SPAM_REPORT'
  | 'UNSUBSCRIBED'
  | 'PROCESSED'
  | 'FAILED'
  | 'REJECTED';

export type BounceType = 'HARD' | 'SOFT' | 'BLOCKED';

export interface EmailEvent {
  eventType: EmailEventType;
  timestamp: Date;
  messageId: string;
  recipientEmail: string;

  // User data
  userAgent?: string;
  ipAddress?: string;
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
  device?: string;
  os?: string;
  browser?: string;
  emailClient?: string;

  // Link data (for clicks)
  url?: string;
  linkId?: string;
  linkIndex?: number;

  // Bounce data
  bounceType?: BounceType;
  bounceReason?: string;
  bounceCode?: string;

  // Complaint data
  complaintType?: string;
  complaintFeedbackType?: string;

  // Provider data
  providerId: string;
  providerEventId?: string;
  rawData?: any;
}

export interface WebhookPayload {
  provider: EmailProviderType;
  events: EmailEvent[];
  signature?: string;
  timestamp: Date;
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

export interface RateLimitInfo {
  providerId: string;
  maxPerSecond?: number;
  maxPerMinute?: number;
  maxPerHour?: number;
  maxPerDay?: number;
  currentUsage: {
    perSecond: number;
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  quotaRemaining?: number;
  quotaResetAt?: Date;
}

export interface RateLimitExceededError extends Error {
  provider: EmailProviderType;
  limit: number;
  current: number;
  retryAfter?: number; // seconds
}

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

export interface TemplateData {
  name: string;
  subject: string;
  html: string;
  text?: string;
  variables?: string[];
  category?: string;
  metadata?: Record<string, any>;
}

export interface TemplateRenderResult {
  subject: string;
  html: string;
  text?: string;
}

// ============================================================================
// STATISTICS & METRICS TYPES
// ============================================================================

export interface EmailMetrics {
  // Volume
  totalSent: number;
  totalDelivered: number;
  totalFailed: number;
  totalBounced: number;
  totalComplaints: number;

  // Rates
  deliveryRate: number; // %
  bounceRate: number; // %
  complaintRate: number; // %
  failureRate: number; // %

  // Performance
  avgDeliveryTime?: number; // ms
  avgResponseTime?: number; // ms

  // Engagement (if tracking enabled)
  totalOpened?: number;
  totalClicked?: number;
  openRate?: number;
  clickRate?: number;
}

export interface ProviderMetrics extends EmailMetrics {
  providerId: string;
  provider: EmailProviderType;
  healthScore: number;
  status: ProviderStatus;

  // Cost
  totalCost: number;
  costPerEmail: number;

  // Quota
  dailyQuota?: number;
  dailySent: number;
  quotaRemaining?: number;
}

export interface OrganizationEmailStats {
  organizationId: string;
  period: {
    start: Date;
    end: Date;
  };
  overall: EmailMetrics;
  byProvider: Record<string, ProviderMetrics>;
  byType: Record<string, EmailMetrics>;
  byCategory: Record<string, EmailMetrics>;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface EmailError extends Error {
  code: string;
  provider?: EmailProviderType;
  providerId?: string;
  retryable: boolean;
  permanent: boolean;
  details?: any;
}

export interface ProviderError extends EmailError {
  provider: EmailProviderType;
  providerId: string;
  statusCode?: number;
  responseBody?: any;
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface EmailServiceConfig {
  // Provider settings
  providers: {
    sendgrid?: {
      apiKey: string;
      defaultFrom?: EmailAddress;
      webhookSecret?: string;
    };
    ses?: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      configurationSet?: string;
    };
    mailgun?: {
      apiKey: string;
      domain: string;
      region?: 'us' | 'eu';
    };
  };

  // Failover settings
  failover: {
    enabled: boolean;
    maxFailuresBeforeFailover: number;
    autoRecovery: boolean;
    recoveryInterval: number; // seconds
  };

  // Retry settings
  retry: RetryConfig;

  // Rate limiting
  rateLimiting: {
    enabled: boolean;
    defaultLimits: {
      perSecond?: number;
      perMinute?: number;
      perHour?: number;
      perDay?: number;
    };
  };

  // Health monitoring
  healthCheck: {
    enabled: boolean;
    interval: number; // seconds
    timeout: number; // ms
  };

  // Suppression
  suppression: {
    autoAddBounces: boolean;
    autoAddComplaints: boolean;
    softBounceExpiration: number; // days
    syncWithProviders: boolean;
  };

  // Tracking
  tracking: {
    opens: boolean;
    clicks: boolean;
    unsubscribe: boolean;
  };
}

// ============================================================================
// SEND OPTIONS
// ============================================================================

export interface SendOptions {
  // Provider selection
  preferredProvider?: EmailProviderType;
  excludeProviders?: EmailProviderType[];
  requireProvider?: EmailProviderType;

  // Retry & failover
  maxAttempts?: number;
  enableFailover?: boolean;

  // Priority
  priority?: number; // 1-10

  // Scheduling
  scheduledFor?: Date;

  // Tracking override
  trackOpens?: boolean;
  trackClicks?: boolean;

  // Testing
  testMode?: boolean;
  dryRun?: boolean;
}

export interface BulkSendOptions extends SendOptions {
  // Batch size
  batchSize?: number;

  // Load balancing
  distributeAcrossProviders?: boolean;

  // Cost optimization
  optimizeFor?: 'cost' | 'speed' | 'reliability';

  // Progress callback
  onProgress?: (sent: number, total: number) => void;
}
