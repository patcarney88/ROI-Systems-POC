/**
 * Notification Utility Functions
 * Helper functions for push notifications
 */

import { NotificationType, Notification } from '../types/notification.types';

/**
 * VAPID Public Key for Web Push
 * This should match the key in your backend environment variables
 * Replace with your actual VAPID public key
 */
export const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE';

/**
 * Convert base64 string to Uint8Array for VAPID key
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if browser supports push notifications
 */
export function isPushNotificationSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Check if browser supports badge API
 */
export function isBadgeSupported(): boolean {
  return 'setAppBadge' in navigator && 'clearAppBadge' in navigator;
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: NotificationType): string {
  const iconMap: Record<NotificationType, string> = {
    [NotificationType.BUSINESS_ALERT]: '/icons/alert.png',
    [NotificationType.DOCUMENT_UPDATE]: '/icons/document.png',
    [NotificationType.DOCUMENT_EXPIRING]: '/icons/document-warning.png',
    [NotificationType.PROPERTY_VALUE]: '/icons/property.png',
    [NotificationType.PROPERTY_UPDATE]: '/icons/property-update.png',
    [NotificationType.MARKET_REPORT]: '/icons/market.png',
    [NotificationType.MAINTENANCE]: '/icons/maintenance.png',
    [NotificationType.CAMPAIGN]: '/icons/campaign.png',
    [NotificationType.CLIENT]: '/icons/client.png',
    [NotificationType.MARKETING]: '/icons/marketing.png',
    [NotificationType.SYSTEM]: '/icons/system.png'
  };

  return iconMap[type] || '/icons/icon-192x192.png';
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: NotificationType): string {
  const colorMap: Record<NotificationType, string> = {
    [NotificationType.BUSINESS_ALERT]: '#f44336',
    [NotificationType.DOCUMENT_UPDATE]: '#2196f3',
    [NotificationType.DOCUMENT_EXPIRING]: '#ff9800',
    [NotificationType.PROPERTY_VALUE]: '#4caf50',
    [NotificationType.PROPERTY_UPDATE]: '#4caf50',
    [NotificationType.MARKET_REPORT]: '#9c27b0',
    [NotificationType.MAINTENANCE]: '#ff9800',
    [NotificationType.CAMPAIGN]: '#00bcd4',
    [NotificationType.CLIENT]: '#673ab7',
    [NotificationType.MARKETING]: '#e91e63',
    [NotificationType.SYSTEM]: '#607d8b'
  };

  return colorMap[type] || '#2196f3';
}

/**
 * Get deep link URL for notification type
 */
export function getNotificationUrl(notification: Notification): string {
  const { type, entityId, id, url } = notification;

  // Direct URL provided
  if (url) {
    return url;
  }

  // Generate URL based on type
  switch (type) {
    case NotificationType.BUSINESS_ALERT:
      return `/alerts/${entityId || id}`;

    case NotificationType.DOCUMENT_UPDATE:
    case NotificationType.DOCUMENT_EXPIRING:
      return `/documents/${entityId || id}`;

    case NotificationType.PROPERTY_VALUE:
    case NotificationType.PROPERTY_UPDATE:
      return `/properties/${entityId || id}`;

    case NotificationType.MARKET_REPORT:
      return '/market-reports';

    case NotificationType.MAINTENANCE:
      return '/maintenance';

    case NotificationType.CAMPAIGN:
      return `/campaigns/${entityId || id}`;

    case NotificationType.CLIENT:
      return `/clients/${entityId || id}`;

    default:
      return '/alerts';
  }
}

/**
 * Format notification display text
 */
export function formatNotificationText(notification: Notification): {
  title: string;
  body: string;
} {
  return {
    title: notification.title || 'ROI Systems',
    body: notification.body || 'You have a new notification'
  };
}

/**
 * Check if notification is within quiet hours
 */
export function isWithinQuietHours(
  quietHoursStart?: string,
  quietHoursEnd?: string
): boolean {
  if (!quietHoursStart || !quietHoursEnd) {
    return false;
  }

  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    const [startHour, startMinute] = quietHoursStart.split(':').map(Number);
    const [endHour, endMinute] = quietHoursEnd.split(':').map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    return currentTime >= startTime && currentTime <= endTime;
  } catch (error) {
    console.error('Error checking quiet hours:', error);
    return false;
  }
}

/**
 * Request notification permission with error handling
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission has been denied. Please enable it in your browser settings.');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    throw new Error('Failed to request notification permission');
  }
}

/**
 * Show browser notification (for testing)
 */
export async function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Promise<void> {
  if (!isPushNotificationSupported()) {
    throw new Error('Notifications not supported');
  }

  if (Notification.permission !== 'granted') {
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }
  }

  new Notification(title, {
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    ...options
  });
}

/**
 * Get browser capability information
 */
export function getBrowserCapabilities(): {
  pushSupported: boolean;
  badgeSupported: boolean;
  notificationSupported: boolean;
  serviceWorkerSupported: boolean;
} {
  return {
    pushSupported: 'PushManager' in window,
    badgeSupported: isBadgeSupported(),
    notificationSupported: 'Notification' in window,
    serviceWorkerSupported: 'serviceWorker' in navigator
  };
}

/**
 * Format timestamp for notification display
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

/**
 * Get notification priority badge
 */
export function getPriorityBadge(priority: string): {
  color: string;
  label: string;
} {
  const badges: Record<string, { color: string; label: string }> = {
    low: { color: '#9e9e9e', label: 'Low' },
    normal: { color: '#2196f3', label: 'Normal' },
    high: { color: '#ff9800', label: 'High' },
    urgent: { color: '#f44336', label: 'Urgent' }
  };

  return badges[priority] || badges.normal;
}

/**
 * Sanitize notification data to prevent XSS
 */
export function sanitizeNotificationData(notification: Notification): Notification {
  const sanitizeString = (str: string): string => {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  };

  return {
    ...notification,
    title: sanitizeString(notification.title),
    body: sanitizeString(notification.body)
  };
}
