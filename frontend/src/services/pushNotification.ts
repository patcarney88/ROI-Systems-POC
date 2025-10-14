/**
 * Push Notification Service
 * Manages push notification subscriptions, preferences, and history
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PushSubscription,
  NotificationPreferences,
  Notification,
  NotificationHistory,
  NotificationFilters,
  NotificationStats,
  NotificationPermissionState,
  TestNotificationRequest
} from '../types/notification.types';
import {
  VAPID_PUBLIC_KEY,
  urlBase64ToUint8Array,
  isPushNotificationSupported,
  requestNotificationPermission as requestPermission
} from '../utils/notificationUtils';

/**
 * API Configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';
const SERVICE_WORKER_PATH = '/service-worker.js';

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_VERSION}`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor for authentication
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Push Notification Service Class
 */
export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();

  /**
   * Initialize the service worker
   */
  async initialize(): Promise<void> {
    if (!isPushNotificationSupported()) {
      console.warn('Push notifications are not supported in this browser');
      return;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
        scope: '/'
      });

      console.log('Service Worker registered successfully');

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;

      // Setup message listener
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      // Check for existing subscription
      const existingSub = await this.registration.pushManager.getSubscription();
      if (existingSub) {
        this.subscription = this.serializeSubscription(existingSub);
      }
    } catch (error) {
      console.error('Error initializing push notification service:', error);
      throw error;
    }
  }

  /**
   * Get current notification permission status
   */
  async getPermissionStatus(): Promise<NotificationPermissionState> {
    if (!isPushNotificationSupported()) {
      return {
        permission: 'denied',
        isSubscribed: false,
        canPrompt: false,
        blockedReason: 'Push notifications not supported in this browser'
      };
    }

    const permission = Notification.permission;
    const isSubscribed = this.subscription !== null;
    const canPrompt = permission === 'default';

    return {
      permission,
      isSubscribed,
      canPrompt,
      blockedReason: permission === 'denied'
        ? 'Notifications blocked. Enable in browser settings.'
        : undefined
    };
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await requestPermission();

      if (permission === 'granted') {
        console.log('Notification permission granted');
      } else if (permission === 'denied') {
        console.warn('Notification permission denied');
      }

      return permission;
    } catch (error) {
      console.error('Error requesting permission:', error);
      throw error;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<void> {
    if (!isPushNotificationSupported()) {
      throw new Error('Push notifications not supported');
    }

    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      throw new Error('Service Worker not registered');
    }

    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission not granted');
      }

      // Create subscription
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Serialize subscription
      this.subscription = this.serializeSubscription(subscription);

      // Send subscription to backend
      await this.saveSubscription(this.subscription);

      console.log('Successfully subscribed to push notifications');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await this.deleteSubscription();
        this.subscription = null;
        console.log('Successfully unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (this.subscription) {
      return this.subscription;
    }

    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        this.subscription = this.serializeSubscription(subscription);
      }
      return this.subscription;
    } catch (error) {
      console.error('Error getting subscription:', error);
      return null;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.get<NotificationPreferences>('/notifications/preferences');
      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const response = await apiClient.put<NotificationPreferences>(
        '/notifications/preferences',
        preferences
      );
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification history
   */
  async getHistory(
    filters?: NotificationFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<NotificationHistory> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (filters) {
        if (filters.types && filters.types.length > 0) {
          params.append('types', filters.types.join(','));
        }
        if (filters.read !== undefined) {
          params.append('read', filters.read.toString());
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }
        if (filters.priority && filters.priority.length > 0) {
          params.append('priority', filters.priority.join(','));
        }
      }

      const response = await apiClient.get<NotificationHistory>(
        `/notifications/history?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post('/notifications/mark-all-read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.get<NotificationStats>('/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(request?: TestNotificationRequest): Promise<void> {
    try {
      await apiClient.post('/notifications/test', request || {
        type: 'system',
        title: 'Test Notification',
        body: 'This is a test notification from ROI Systems'
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  }

  /**
   * Update badge count
   */
  async updateBadge(count: number): Promise<void> {
    if (!this.registration) {
      return;
    }

    try {
      this.registration.active?.postMessage({
        type: 'UPDATE_BADGE',
        payload: { count }
      });
    } catch (error) {
      console.error('Error updating badge:', error);
    }
  }

  /**
   * Clear badge
   */
  async clearBadge(): Promise<void> {
    await this.updateBadge(0);
  }

  /**
   * Register message handler
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Unregister message handler
   */
  offMessage(type: string): void {
    this.messageHandlers.delete(type);
  }

  // Private methods

  private serializeSubscription(subscription: globalThis.PushSubscription): PushSubscription {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!key || !auth) {
      throw new Error('Invalid subscription keys');
    }

    return {
      endpoint: subscription.endpoint,
      expirationTime: subscription.expirationTime,
      keys: {
        p256dh: btoa(String.fromCharCode(...new Uint8Array(key))),
        auth: btoa(String.fromCharCode(...new Uint8Array(auth)))
      }
    };
  }

  private async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      await apiClient.post('/notifications/subscribe', subscription);
    } catch (error) {
      console.error('Error saving subscription:', error);
      throw error;
    }
  }

  private async deleteSubscription(): Promise<void> {
    try {
      await apiClient.delete('/notifications/subscribe');
    } catch (error) {
      console.error('Error deleting subscription:', error);
      throw error;
    }
  }

  private handleMessage(event: MessageEvent): void {
    const { type, ...data } = event.data;
    const handler = this.messageHandlers.get(type);

    if (handler) {
      handler(data);
    }
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();

// Export class for testing
export default PushNotificationService;
