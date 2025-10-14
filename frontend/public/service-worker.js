/**
 * ROI Systems Push Notification Service Worker
 * Handles push events, notification display, and user interactions
 */

// Service Worker Version - increment to force updates
const SW_VERSION = '1.0.0';
const CACHE_NAME = `roi-systems-notifications-${SW_VERSION}`;

// Badge count storage
let badgeCount = 0;

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing version:', SW_VERSION);
  self.skipWaiting(); // Activate worker immediately
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating version:', SW_VERSION);
  event.waitUntil(
    // Clean up old caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/**
 * Push Event Handler
 * Receives push notifications from the server and displays them
 */
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');

  if (!event.data) {
    console.warn('[Service Worker] Push event has no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
    data = {
      title: 'ROI Systems Notification',
      body: event.data.text(),
      icon: '/icons/icon-192x192.png'
    };
  }

  const {
    title = 'ROI Systems',
    body = 'You have a new notification',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/icon-96x96.png',
    image,
    tag,
    data: notificationData = {},
    requireInteraction = false,
    actions = []
  } = data;

  // Increment badge count
  badgeCount++;
  updateBadge(badgeCount);

  const options = {
    body,
    icon,
    badge,
    image,
    tag: tag || `notification-${Date.now()}`,
    data: {
      ...notificationData,
      dateReceived: Date.now(),
      url: notificationData.url || '/'
    },
    requireInteraction,
    vibrate: [200, 100, 200], // Vibration pattern
    actions: actions.length > 0 ? actions : [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/icon-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/icon-close.png'
      }
    ],
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] Notification displayed successfully');
        // Notify all clients about badge update
        broadcastBadgeUpdate(badgeCount);
      })
      .catch((error) => {
        console.error('[Service Worker] Error showing notification:', error);
      })
  );
});

/**
 * Notification Click Handler
 * Handles user clicks on notifications
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked:', event.notification.tag);

  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  // Decrement badge count
  badgeCount = Math.max(0, badgeCount - 1);
  updateBadge(badgeCount);
  broadcastBadgeUpdate(badgeCount);

  // Handle notification actions
  if (action === 'dismiss') {
    console.log('[Service Worker] Notification dismissed');
    return;
  }

  // Determine target URL based on notification type
  const targetUrl = getTargetUrl(data);

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Focus existing window and navigate
            return client.focus().then((focusedClient) => {
              focusedClient.postMessage({
                type: 'NOTIFICATION_CLICK',
                url: targetUrl,
                data: data
              });
              return focusedClient;
            });
          }
        }

        // No window open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
      .catch((error) => {
        console.error('[Service Worker] Error handling notification click:', error);
      })
  );
});

/**
 * Notification Close Handler
 * Handles user dismissing notifications
 */
self.addEventListener('notificationclose', (event) => {
  console.log('[Service Worker] Notification closed:', event.notification.tag);

  const notification = event.notification;
  const data = notification.data || {};

  // Decrement badge count
  badgeCount = Math.max(0, badgeCount - 1);
  updateBadge(badgeCount);
  broadcastBadgeUpdate(badgeCount);

  // Track dismissal analytics if needed
  event.waitUntil(
    fetch('/api/v1/notifications/analytics/dismissed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        notificationId: data.id,
        tag: notification.tag,
        dismissedAt: Date.now()
      })
    }).catch((error) => {
      console.error('[Service Worker] Error tracking dismissal:', error);
    })
  );
});

/**
 * Message Handler
 * Receives messages from the main app
 */
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);

  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'UPDATE_BADGE':
      badgeCount = payload.count || 0;
      updateBadge(badgeCount);
      break;

    case 'CLEAR_BADGE':
      badgeCount = 0;
      updateBadge(0);
      break;

    case 'GET_BADGE':
      event.ports[0].postMessage({ badgeCount });
      break;

    default:
      console.warn('[Service Worker] Unknown message type:', type);
  }
});

/**
 * Update badge count on app icon
 * @param {number} count - Badge count to display
 */
function updateBadge(count) {
  if ('setAppBadge' in navigator) {
    if (count > 0) {
      navigator.setAppBadge(count).catch((error) => {
        console.error('[Service Worker] Error setting badge:', error);
      });
    } else {
      navigator.clearAppBadge().catch((error) => {
        console.error('[Service Worker] Error clearing badge:', error);
      });
    }
  }
}

/**
 * Broadcast badge update to all clients
 * @param {number} count - Current badge count
 */
function broadcastBadgeUpdate(count) {
  self.clients.matchAll({ includeUncontrolled: true, type: 'window' })
    .then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'BADGE_UPDATE',
          count
        });
      });
    })
    .catch((error) => {
      console.error('[Service Worker] Error broadcasting badge update:', error);
    });
}

/**
 * Get target URL based on notification data
 * @param {Object} data - Notification data
 * @returns {string} Target URL
 */
function getTargetUrl(data) {
  const baseUrl = self.registration.scope;

  // Direct URL provided
  if (data.url) {
    return data.url.startsWith('http') ? data.url : baseUrl + data.url.replace(/^\//, '');
  }

  // Deep linking based on notification type
  const { type, id, entityType, entityId } = data;

  switch (type) {
    case 'business_alert':
    case 'BUSINESS_ALERT':
      return `${baseUrl}alerts/${id || entityId || ''}`;

    case 'document_update':
    case 'DOCUMENT_UPDATE':
    case 'document_expiring':
    case 'DOCUMENT_EXPIRING':
      return `${baseUrl}documents/${id || entityId || ''}`;

    case 'property_value':
    case 'PROPERTY_VALUE':
    case 'property_update':
    case 'PROPERTY_UPDATE':
      return `${baseUrl}properties/${id || entityId || ''}`;

    case 'market_report':
    case 'MARKET_REPORT':
      return `${baseUrl}market-reports`;

    case 'maintenance':
    case 'MAINTENANCE':
      return `${baseUrl}maintenance`;

    case 'campaign':
    case 'CAMPAIGN':
      return `${baseUrl}campaigns/${id || entityId || ''}`;

    case 'client':
    case 'CLIENT':
      return `${baseUrl}clients/${id || entityId || ''}`;

    default:
      return `${baseUrl}alerts`;
  }
}

/**
 * Sync Event Handler
 * Background sync for notification state
 */
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      syncNotificationState()
        .catch((error) => {
          console.error('[Service Worker] Error syncing notifications:', error);
        })
    );
  }
});

/**
 * Sync notification state with backend
 */
async function syncNotificationState() {
  try {
    const response = await fetch('/api/v1/notifications/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      badgeCount = data.unreadCount || 0;
      updateBadge(badgeCount);
      broadcastBadgeUpdate(badgeCount);
    }
  } catch (error) {
    console.error('[Service Worker] Error syncing notification state:', error);
  }
}

console.log('[Service Worker] Loaded version:', SW_VERSION);
