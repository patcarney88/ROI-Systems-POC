/**
 * useNotifications Hook
 * React hook for managing push notifications
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { pushNotificationService } from '../services/pushNotification';
import {
  NotificationPreferences,
  Notification,
  NotificationFilters,
  NotificationPermissionState,
  TestNotificationRequest
} from '../types/notification.types';

export interface UseNotificationsReturn {
  // Permission state
  permission: NotificationPermission;
  isSubscribed: boolean;
  canPrompt: boolean;
  blockedReason?: string;

  // Data
  preferences: NotificationPreferences | null;
  history: Notification[];
  unreadCount: number;

  // Loading states
  loading: boolean;
  permissionLoading: boolean;
  preferencesLoading: boolean;
  historyLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  requestPermission: () => Promise<void>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  sendTestNotification: (request?: TestNotificationRequest) => Promise<void>;
  loadMoreHistory: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  clearError: () => void;
}

interface UseNotificationsOptions {
  autoInit?: boolean;
  pageSize?: number;
  filters?: NotificationFilters;
}

/**
 * useNotifications Hook
 */
export function useNotifications(
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const {
    autoInit = true,
    pageSize = 20,
    filters
  } = options;

  // State
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [canPrompt, setCanPrompt] = useState(true);
  const [blockedReason, setBlockedReason] = useState<string | undefined>();

  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [history, setHistory] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);
  const [permissionLoading, setPermissionLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Refs
  const initialized = useRef(false);
  const serviceInitialized = useRef(false);

  /**
   * Initialize service and load data
   */
  const initialize = useCallback(async () => {
    if (initialized.current) return;
    initialized.current = true;

    try {
      setLoading(true);

      // Initialize service
      if (!serviceInitialized.current) {
        await pushNotificationService.initialize();
        serviceInitialized.current = true;

        // Setup message handlers
        pushNotificationService.onMessage('BADGE_UPDATE', (data) => {
          setUnreadCount(data.count || 0);
        });

        pushNotificationService.onMessage('NOTIFICATION_RECEIVED', () => {
          refreshHistory();
        });
      }

      // Check permission status
      const permStatus = await pushNotificationService.getPermissionStatus();
      setPermission(permStatus.permission);
      setIsSubscribed(permStatus.isSubscribed);
      setCanPrompt(permStatus.canPrompt);
      setBlockedReason(permStatus.blockedReason);

      // Load preferences if subscribed
      if (permStatus.isSubscribed) {
        try {
          const prefs = await pushNotificationService.getPreferences();
          setPreferences(prefs);
        } catch (err) {
          console.error('Error loading preferences:', err);
        }
      }

      // Load notification history
      await loadHistory(1);
    } catch (err) {
      console.error('Error initializing notifications:', err);
      setError('Failed to initialize notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Load notification history
   */
  const loadHistory = useCallback(async (page: number) => {
    try {
      setHistoryLoading(true);

      const result = await pushNotificationService.getHistory(filters, page, pageSize);

      if (page === 1) {
        setHistory(result.notifications);
      } else {
        setHistory((prev) => [...prev, ...result.notifications]);
      }

      setUnreadCount(result.unreadCount);
      setCurrentPage(page);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading history:', err);
      setError('Failed to load notification history');
    } finally {
      setHistoryLoading(false);
    }
  }, [filters, pageSize]);

  /**
   * Request notification permission
   */
  const requestPermission = useCallback(async () => {
    try {
      setPermissionLoading(true);
      setError(null);

      const perm = await pushNotificationService.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        setCanPrompt(false);
      } else if (perm === 'denied') {
        setBlockedReason('Notifications blocked. Enable in browser settings.');
      }
    } catch (err: any) {
      console.error('Error requesting permission:', err);
      setError(err.message || 'Failed to request notification permission');
      throw err;
    } finally {
      setPermissionLoading(false);
    }
  }, []);

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await pushNotificationService.subscribe();
      setIsSubscribed(true);

      // Load preferences
      const prefs = await pushNotificationService.getPreferences();
      setPreferences(prefs);
    } catch (err: any) {
      console.error('Error subscribing:', err);
      setError(err.message || 'Failed to subscribe to notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      setPreferences(null);
    } catch (err: any) {
      console.error('Error unsubscribing:', err);
      setError(err.message || 'Failed to unsubscribe from notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update notification preferences
   */
  const updatePreferences = useCallback(async (prefs: Partial<NotificationPreferences>) => {
    try {
      setPreferencesLoading(true);
      setError(null);

      const updated = await pushNotificationService.updatePreferences(prefs);
      setPreferences(updated);
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      setError(err.message || 'Failed to update preferences');
      throw err;
    } finally {
      setPreferencesLoading(false);
    }
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await pushNotificationService.markAsRead(notificationId);

      // Update local state
      setHistory((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking as read:', err);
      setError(err.message || 'Failed to mark notification as read');
      throw err;
    }
  }, []);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    try {
      await pushNotificationService.markAllAsRead();

      // Update local state
      setHistory((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          readAt: n.readAt || new Date().toISOString()
        }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      console.error('Error marking all as read:', err);
      setError(err.message || 'Failed to mark all notifications as read');
      throw err;
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await pushNotificationService.deleteNotification(notificationId);

      // Update local state
      setHistory((prev) => {
        const notification = prev.find((n) => n.id === notificationId);
        if (notification && !notification.read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((n) => n.id !== notificationId);
      });
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      setError(err.message || 'Failed to delete notification');
      throw err;
    }
  }, []);

  /**
   * Send test notification
   */
  const sendTestNotification = useCallback(async (request?: TestNotificationRequest) => {
    try {
      setError(null);
      await pushNotificationService.sendTestNotification(request);
    } catch (err: any) {
      console.error('Error sending test notification:', err);
      setError(err.message || 'Failed to send test notification');
      throw err;
    }
  }, []);

  /**
   * Load more history (pagination)
   */
  const loadMoreHistory = useCallback(async () => {
    if (!hasMore || historyLoading) return;
    await loadHistory(currentPage + 1);
  }, [hasMore, historyLoading, currentPage, loadHistory]);

  /**
   * Refresh history
   */
  const refreshHistory = useCallback(async () => {
    await loadHistory(1);
  }, [loadHistory]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (autoInit) {
      initialize();
    }
  }, [autoInit, initialize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      pushNotificationService.offMessage('BADGE_UPDATE');
      pushNotificationService.offMessage('NOTIFICATION_RECEIVED');
    };
  }, []);

  return {
    // Permission state
    permission,
    isSubscribed,
    canPrompt,
    blockedReason,

    // Data
    preferences,
    history,
    unreadCount,

    // Loading states
    loading,
    permissionLoading,
    preferencesLoading,
    historyLoading,

    // Error state
    error,

    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    updatePreferences,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendTestNotification,
    loadMoreHistory,
    refreshHistory,
    clearError
  };
}

export default useNotifications;
