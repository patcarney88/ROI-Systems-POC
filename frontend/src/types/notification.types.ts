/**
 * Push Notification Types
 * Type definitions for the notification system
 */

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export enum NotificationChannel {
  WEB_PUSH = 'webPush',
  EMAIL = 'email',
  SMS = 'sms'
}

export enum NotificationType {
  BUSINESS_ALERT = 'business_alert',
  DOCUMENT_UPDATE = 'document_update',
  DOCUMENT_EXPIRING = 'document_expiring',
  PROPERTY_VALUE = 'property_value',
  PROPERTY_UPDATE = 'property_update',
  MARKET_REPORT = 'market_report',
  MAINTENANCE = 'maintenance',
  CAMPAIGN = 'campaign',
  CLIENT = 'client',
  MARKETING = 'marketing',
  SYSTEM = 'system'
}

export interface NotificationPreferences {
  enabled: boolean;
  doNotDisturbStart?: number; // Hour (0-23)
  doNotDisturbEnd?: number; // Hour (0-23)

  // Notification types
  businessAlerts: boolean;
  documentUpdates: boolean;
  propertyValues: boolean;
  marketReports: boolean;
  maintenance: boolean;
  marketing: boolean;
  system: boolean;

  // Channels
  webPush: boolean;
  email: boolean;
  sms: boolean;

  // Batching
  batchNotifications: boolean;
  batchInterval?: number; // Minutes

  // Quiet hours
  quietHoursEnabled: boolean;
  quietHoursStart?: string; // ISO time format
  quietHoursEnd?: string; // ISO time format
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  icon?: string;
  image?: string;
  badge?: string;

  // Deep linking
  url?: string;
  entityType?: string;
  entityId?: string;

  // Metadata
  priority: 'low' | 'normal' | 'high' | 'urgent';
  read: boolean;
  clicked: boolean;
  dismissed: boolean;

  // Channels
  channels: NotificationChannel[];
  sentChannels: NotificationChannel[];

  // Timestamps
  createdAt: string;
  scheduledFor?: string;
  sentAt?: string;
  readAt?: string;
  clickedAt?: string;
  dismissedAt?: string;
  expiresAt?: string;

  // Additional data
  data?: Record<string, any>;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationHistory {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  unreadCount: number;
}

export interface NotificationFilters {
  types?: NotificationType[];
  read?: boolean;
  dateFrom?: string;
  dateTo?: string;
  priority?: string[];
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
  recentActivity: {
    sent: number;
    read: number;
    clicked: number;
    dismissed: number;
  };
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSubscribed: boolean;
  canPrompt: boolean;
  blockedReason?: string;
}

export interface TestNotificationRequest {
  type: NotificationType;
  title?: string;
  body?: string;
  customData?: Record<string, any>;
}
