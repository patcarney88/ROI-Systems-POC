/**
 * Template Rendering Service - Type Definitions
 *
 * Comprehensive type definitions for template rendering,
 * campaign management, and email personalization.
 */

import type { ReactElement } from 'react';
import type { MergeTagData } from './personalization.service';

/**
 * Template rendering options
 */
export interface TemplateRenderOptions {
  /** Unique template identifier */
  templateId: string;
  /** Campaign type (alternative to templateId) */
  campaignType: string;
  /** Subscriber UUID */
  subscriberId: string;
  /** Additional custom merge tag data */
  customData?: Record<string, any>;
  /** Preview mode (skips caching) */
  preview?: boolean;
}

/**
 * Rendered template output
 */
export interface RenderedTemplate {
  /** Rendered HTML content */
  html: string;
  /** Plain text version */
  text: string;
  /** Personalized subject line */
  subject: string;
  /** Email preview text (appears in inbox) */
  previewText?: string;
}

/**
 * Template metadata for registration
 */
export interface TemplateMetadata {
  /** Unique template identifier */
  id: string;
  /** Human-readable template name */
  name: string;
  /** Campaign type this template is for */
  campaignType: string;
  /** Subject line template (supports merge tags) */
  subject: string;
  /** Preview text template (supports merge tags) */
  previewText?: string;
  /** React Email component */
  component: (props: any) => ReactElement;
}

/**
 * Template rendering statistics
 */
export interface TemplateStatistics {
  /** Number of registered templates */
  registeredTemplates: number;
  /** Number of cached renders */
  cacheSize: number;
  /** Cache storage type */
  cacheType: 'redis' | 'memory';
}

/**
 * Batch rendering result
 */
export type BatchRenderResult = Map<string, RenderedTemplate>;

/**
 * Campaign types supported by the system
 */
export enum CampaignType {
  WELCOME = 'WELCOME',
  CLOSING_ANNIVERSARY = 'CLOSING_ANNIVERSARY',
  HOME_VALUE_UPDATE = 'HOME_VALUE_UPDATE',
  MARKET_REPORT = 'MARKET_REPORT',
  TAX_SEASON = 'TAX_SEASON',
  MAINTENANCE_TIPS = 'MAINTENANCE_TIPS',
  NEIGHBORHOOD_UPDATE = 'NEIGHBORHOOD_UPDATE',
  SEASONAL_GREETING = 'SEASONAL_GREETING',
  CUSTOM = 'CUSTOM',
}

/**
 * Template render error types
 */
export enum RenderErrorType {
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  SUBSCRIBER_NOT_FOUND = 'SUBSCRIBER_NOT_FOUND',
  RENDER_FAILED = 'RENDER_FAILED',
  MERGE_TAG_ERROR = 'MERGE_TAG_ERROR',
  CACHE_ERROR = 'CACHE_ERROR',
}

/**
 * Template render error
 */
export class TemplateRenderError extends Error {
  constructor(
    public type: RenderErrorType,
    public message: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TemplateRenderError';
  }
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Cache TTL in seconds */
  ttl: number;
  /** Cache key prefix */
  prefix: string;
  /** Max in-memory cache size */
  maxSize: number;
  /** Enable Redis cache */
  useRedis: boolean;
}

/**
 * Rendering performance metrics
 */
export interface RenderMetrics {
  /** Template ID */
  templateId: string;
  /** Subscriber ID */
  subscriberId: string;
  /** Render time in milliseconds */
  renderTime: number;
  /** Whether result came from cache */
  cacheHit: boolean;
  /** Timestamp */
  timestamp: Date;
  /** HTML size in bytes */
  htmlSize: number;
  /** Text size in bytes */
  textSize: number;
}

/**
 * Batch rendering options
 */
export interface BatchRenderOptions {
  /** List of subscriber IDs */
  subscriberIds: string[];
  /** Template to render */
  templateId: string;
  /** Concurrency level (default: 10) */
  concurrency?: number;
  /** Track performance metrics */
  trackMetrics?: boolean;
  /** Skip cache for all renders */
  skipCache?: boolean;
}

/**
 * Batch rendering statistics
 */
export interface BatchRenderStats {
  /** Total subscribers processed */
  total: number;
  /** Successfully rendered */
  successful: number;
  /** Failed renders */
  failed: number;
  /** Total time in milliseconds */
  totalTime: number;
  /** Average time per email */
  averageTime: number;
  /** Cache hit count */
  cacheHits: number;
  /** Cache hit rate (%) */
  cacheHitRate: number;
}

/**
 * Template preview options
 */
export interface PreviewOptions {
  /** Template to preview */
  templateId: string;
  /** Custom preview data */
  previewData?: Partial<MergeTagData>;
  /** Device type for responsive preview */
  device?: 'desktop' | 'mobile' | 'tablet';
  /** Include debug information */
  debug?: boolean;
}

/**
 * Template validation result
 */
export interface TemplateValidation {
  /** Whether template is valid */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Available merge tags */
  availableTags: string[];
  /** Used merge tags */
  usedTags: string[];
  /** Missing/invalid merge tags */
  invalidTags: string[];
}

/**
 * HTML to text conversion options
 */
export interface HtmlToTextOptions {
  /** Word wrap width */
  wordwrap?: number;
  /** Include links in text */
  includeLinks?: boolean;
  /** Skip images */
  skipImages?: boolean;
  /** Custom selectors */
  selectors?: Array<{ selector: string; format?: string }>;
}

/**
 * Template component props interface
 */
export interface TemplateComponentProps extends MergeTagData {
  /** Preview mode flag */
  preview: boolean;
  /** Device type for responsive rendering */
  device?: 'desktop' | 'mobile' | 'tablet';
  /** Campaign ID (if applicable) */
  campaignId?: string;
  /** Additional custom props */
  [key: string]: any;
}

/**
 * Email content structure
 */
export interface EmailContent {
  /** HTML version */
  html: string;
  /** Plain text version */
  text: string;
  /** Subject line */
  subject: string;
  /** Preview text */
  previewText?: string;
  /** From address */
  from?: string;
  /** Reply-to address */
  replyTo?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Attachments */
  attachments?: EmailAttachment[];
}

/**
 * Email attachment
 */
export interface EmailAttachment {
  /** Filename */
  filename: string;
  /** Content type */
  contentType: string;
  /** Content (base64 encoded) */
  content: string;
  /** Content ID (for inline images) */
  contentId?: string;
}

/**
 * SendGrid integration options
 */
export interface SendGridOptions {
  /** To address(es) */
  to: string | string[];
  /** From address */
  from: string;
  /** Subject line */
  subject: string;
  /** HTML content */
  html: string;
  /** Plain text content */
  text: string;
  /** Reply-to address */
  replyTo?: string;
  /** CC addresses */
  cc?: string[];
  /** BCC addresses */
  bcc?: string[];
  /** Tracking settings */
  trackingSettings?: {
    clickTracking?: { enable: boolean };
    openTracking?: { enable: boolean };
  };
  /** Custom args */
  customArgs?: Record<string, string>;
}

/**
 * Campaign email data
 */
export interface CampaignEmail {
  /** Campaign ID */
  campaignId: string;
  /** Subscriber ID */
  subscriberId: string;
  /** Recipient email */
  to: string;
  /** Rendered content */
  content: RenderedTemplate;
  /** Send status */
  status: 'pending' | 'queued' | 'sent' | 'failed' | 'bounced';
  /** Scheduled send time */
  scheduledAt?: Date;
  /** Actual send time */
  sentAt?: Date;
  /** Error message (if failed) */
  error?: string;
}

/**
 * Template registry entry
 */
export interface TemplateRegistryEntry extends TemplateMetadata {
  /** Registration timestamp */
  registeredAt: Date;
  /** Last used timestamp */
  lastUsedAt?: Date;
  /** Usage count */
  usageCount: number;
  /** Average render time */
  avgRenderTime?: number;
}

/**
 * Service health status
 */
export interface ServiceHealth {
  /** Overall health status */
  healthy: boolean;
  /** Redis connection status */
  redis: {
    connected: boolean;
    latency?: number;
  };
  /** Cache statistics */
  cache: {
    size: number;
    hitRate: number;
    type: 'redis' | 'memory';
  };
  /** Template registry status */
  templates: {
    registered: number;
    active: number;
  };
  /** Last health check */
  checkedAt: Date;
}

/**
 * Export utility type for template components
 */
export type TemplateComponent = (props: TemplateComponentProps) => ReactElement;

/**
 * Template rendering service interface
 */
export interface ITemplateRenderingService {
  /** Register a template */
  registerTemplate(metadata: TemplateMetadata): void;

  /** Get available templates */
  getAvailableTemplates(): string[];

  /** Render a template */
  renderTemplate(options: TemplateRenderOptions): Promise<RenderedTemplate>;

  /** Batch render templates */
  renderBatch(subscribers: string[], templateId: string): Promise<BatchRenderResult>;

  /** Preview a template */
  previewTemplate(templateId: string, previewData?: MergeTagData): Promise<RenderedTemplate>;

  /** Update template cache */
  updateTemplateCache(templateId: string): Promise<void>;

  /** Get statistics */
  getStatistics(): Promise<TemplateStatistics>;
}
