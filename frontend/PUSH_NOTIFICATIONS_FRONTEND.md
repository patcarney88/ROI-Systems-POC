# Push Notifications Frontend Implementation

Comprehensive push notification system for the ROI Systems React frontend application.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Components](#components)
- [Service Worker](#service-worker)
- [Deep Linking](#deep-linking)
- [Testing](#testing)
- [Browser Compatibility](#browser-compatibility)
- [Troubleshooting](#troubleshooting)
- [API Integration](#api-integration)

## Overview

The push notification system provides real-time notifications to users about:

- Business alerts and client engagement opportunities
- Document updates and expiration reminders
- Property value changes
- Market reports
- Campaign results
- Maintenance reminders

### Features

- ✅ Web Push Notifications (VAPID protocol)
- ✅ Service Worker for background notifications
- ✅ Rich notifications with images and actions
- ✅ Badge count management
- ✅ Notification history and filtering
- ✅ Preference management
- ✅ Deep linking to relevant content
- ✅ Quiet hours support
- ✅ Batch notifications
- ✅ Browser compatibility detection
- ✅ Responsive mobile-first design
- ✅ TypeScript type safety

## Architecture

### File Structure

```
frontend/
├── public/
│   └── service-worker.js           # Service worker for push notifications
├── src/
│   ├── components/
│   │   └── notifications/
│   │       ├── BellIconWithBadge.tsx
│   │       ├── NotificationCenter.tsx
│   │       ├── NotificationPermissionPrompt.tsx
│   │       ├── NotificationPreferences.tsx
│   │       ├── NotificationToast.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   └── useNotifications.ts     # React hook for notification state
│   ├── services/
│   │   └── pushNotification.ts     # Push notification service
│   ├── types/
│   │   └── notification.types.ts   # TypeScript types
│   └── utils/
│       └── notificationUtils.ts    # Utility functions
```

### Component Hierarchy

```
App.tsx
├── BellIconWithBadge (Header)
├── NotificationCenter (Drawer)
├── NotificationToast (Snackbar)
└── NotificationPermissionPrompt (Modal)

Pages (Optional)
└── Settings
    └── NotificationPreferences (Settings Panel)
```

## Installation

The push notification system is already integrated. No additional installation required.

### Dependencies

All required dependencies are already in `package.json`:

```json
{
  "dependencies": {
    "@mui/material": "^7.3.4",
    "@mui/icons-material": "^7.3.4",
    "axios": "^1.12.2",
    "react": "^19.1.1",
    "react-router-dom": "^7.9.4"
  }
}
```

## Configuration

### 1. Environment Variables

Add to `.env`:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 2. VAPID Public Key

Update the VAPID public key in `/src/utils/notificationUtils.ts`:

```typescript
export const VAPID_PUBLIC_KEY = 'YOUR_ACTUAL_VAPID_PUBLIC_KEY_HERE';
```

To generate VAPID keys (run in backend):

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

### 3. Service Worker Registration

The service worker is automatically registered in `App.tsx`. No additional configuration needed.

### 4. Manifest Configuration

The PWA manifest at `/public/manifest.json` already includes notification icons:

```json
{
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    }
  ]
}
```

## Components

### BellIconWithBadge

Notification bell icon with unread count badge.

**Usage:**

```tsx
import { BellIconWithBadge } from './components/notifications';

<BellIconWithBadge
  unreadCount={5}
  onClick={() => setNotificationCenterOpen(true)}
  color="inherit"
/>
```

**Props:**

- `unreadCount: number` - Number of unread notifications
- `onClick: () => void` - Click handler
- `color?: 'inherit' | 'primary' | 'secondary' | 'default'` - Icon color

### NotificationCenter

Drawer panel showing notification history with search and filtering.

**Usage:**

```tsx
import { NotificationCenter } from './components/notifications';

<NotificationCenter
  open={open}
  onClose={() => setOpen(false)}
  notifications={notifications}
  unreadCount={unreadCount}
  loading={loading}
  onMarkAsRead={handleMarkAsRead}
  onMarkAllAsRead={handleMarkAllAsRead}
  onDelete={handleDelete}
  onLoadMore={handleLoadMore}
  onRefresh={handleRefresh}
  hasMore={true}
/>
```

**Features:**

- Search notifications by title/body
- Mark individual notifications as read
- Mark all notifications as read
- Delete notifications
- Infinite scroll pagination
- Click to navigate to relevant content

### NotificationPermissionPrompt

Modal or card prompting users to enable push notifications.

**Usage:**

```tsx
import { NotificationPermissionPrompt } from './components/notifications';

<NotificationPermissionPrompt
  open={showPrompt}
  onClose={() => setShowPrompt(false)}
  onEnable={async () => {
    await notifications.subscribe();
  }}
  variant="modal" // or "card"
/>
```

**Features:**

- Shows benefits of enabling notifications
- "Don't show again" option
- Two variants: modal (dialog) or card (inline)
- Loading state during subscription

### NotificationPreferences

Settings panel for managing notification preferences.

**Usage:**

```tsx
import { NotificationPreferences } from './components/notifications';

<NotificationPreferences
  preferences={preferences}
  onSave={handleSave}
  loading={loading}
/>
```

**Settings:**

- Master enable/disable toggle
- Notification types (business alerts, documents, properties, etc.)
- Delivery channels (push, email, SMS)
- Quiet hours with start/end time
- Batch notifications with interval

### NotificationToast

In-app toast notification for real-time alerts.

**Usage:**

```tsx
import { NotificationToast } from './components/notifications';

<NotificationToast
  notification={notification}
  open={showToast}
  onClose={() => setShowToast(false)}
  onClick={handleClick}
  autoHideDuration={5000}
/>
```

**Features:**

- Auto-dismiss after 5 seconds (configurable)
- Click to navigate
- Different severity levels based on priority
- Dismiss button

### useNotifications Hook

React hook for managing notification state and operations.

**Usage:**

```tsx
import { useNotifications } from './hooks/useNotifications';

const {
  // State
  permission,
  isSubscribed,
  canPrompt,
  preferences,
  history,
  unreadCount,
  loading,
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
} = useNotifications({
  autoInit: true,
  pageSize: 20
});
```

## Service Worker

### Location

`/public/service-worker.js`

### Features

- Push event handling
- Notification display with actions
- Click handling with deep linking
- Badge count management
- Background sync
- Message passing with main app

### Event Handlers

**Push Event:**
```javascript
self.addEventListener('push', (event) => {
  // Receives push from backend
  // Displays notification
  // Updates badge count
});
```

**Notification Click:**
```javascript
self.addEventListener('notificationclick', (event) => {
  // Opens/focuses app window
  // Navigates to relevant content
  // Marks notification as read
});
```

**Notification Close:**
```javascript
self.addEventListener('notificationclose', (event) => {
  // Updates badge count
  // Tracks dismissal analytics
});
```

### Message API

Send messages to service worker:

```typescript
// Update badge count
navigator.serviceWorker.controller?.postMessage({
  type: 'UPDATE_BADGE',
  payload: { count: 5 }
});

// Clear badge
navigator.serviceWorker.controller?.postMessage({
  type: 'CLEAR_BADGE'
});
```

## Deep Linking

### URL Mapping

Notifications automatically route to relevant content:

| Notification Type | URL Pattern |
|------------------|-------------|
| Business Alert | `/alerts/:id` |
| Document Update | `/documents/:id` |
| Document Expiring | `/documents/:id` |
| Property Value | `/properties/:id` |
| Market Report | `/market-reports` |
| Maintenance | `/maintenance` |
| Campaign | `/campaigns/:id` |
| Client | `/clients/:id` |

### Custom URLs

Provide custom URL in notification payload:

```typescript
{
  type: 'business_alert',
  url: '/custom/path',
  entityId: '123'
}
```

### Deep Link Implementation

```typescript
// Service Worker
function getTargetUrl(data) {
  if (data.url) {
    return data.url;
  }

  switch (data.type) {
    case 'business_alert':
      return `/alerts/${data.entityId}`;
    // ... more cases
  }
}
```

## Testing

### Test Notification

Send a test notification from preferences:

```tsx
<Button onClick={() => sendTestNotification()}>
  Send Test Notification
</Button>
```

### Manual Testing Checklist

1. **Permission Request:**
   - [ ] Modal appears after 3 seconds
   - [ ] "Don't show again" works
   - [ ] Permission granted successfully

2. **Subscription:**
   - [ ] Subscribe button works
   - [ ] Subscription sent to backend
   - [ ] Error handling for failures

3. **Notification Display:**
   - [ ] Push notification appears
   - [ ] Title and body correct
   - [ ] Icon and badge displayed
   - [ ] Actions available

4. **Click Handling:**
   - [ ] Click opens app
   - [ ] Navigates to correct page
   - [ ] Marks as read
   - [ ] Badge count decreases

5. **Notification Center:**
   - [ ] Opens from bell icon
   - [ ] Shows all notifications
   - [ ] Search works
   - [ ] Mark as read works
   - [ ] Delete works
   - [ ] Infinite scroll works

6. **Preferences:**
   - [ ] All toggles work
   - [ ] Quiet hours configurable
   - [ ] Batch settings work
   - [ ] Save persists changes

7. **Toast Notifications:**
   - [ ] Appears for new notifications
   - [ ] Auto-dismisses after 5 seconds
   - [ ] Click navigates correctly
   - [ ] Dismiss button works

### Test with Backend

1. Start backend server:
```bash
cd backend
npm start
```

2. Trigger test notification:
```bash
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "type": "business_alert",
    "title": "Test Alert",
    "body": "This is a test notification"
  }'
```

## Browser Compatibility

### Supported Browsers

| Browser | Push Notifications | Badge API | Service Worker |
|---------|-------------------|-----------|----------------|
| Chrome 42+ | ✅ | ✅ | ✅ |
| Firefox 44+ | ✅ | ❌ | ✅ |
| Safari 16+ | ✅ | ✅ | ✅ |
| Edge 17+ | ✅ | ✅ | ✅ |
| Opera 29+ | ✅ | ✅ | ✅ |

### Unsupported Browsers

For browsers without push support, the app shows:

1. Info banner explaining limitation
2. Alternative notification methods (email/SMS)
3. Link to supported browsers documentation

### Feature Detection

```typescript
import { isPushNotificationSupported, isBadgeSupported } from './utils/notificationUtils';

if (!isPushNotificationSupported()) {
  console.warn('Push notifications not supported');
  // Show fallback UI
}

if (!isBadgeSupported()) {
  console.warn('Badge API not supported');
  // Skip badge updates
}
```

## Troubleshooting

### Common Issues

#### 1. Permission Denied

**Problem:** User denied notification permission.

**Solution:**
- Show instructions to re-enable in browser settings
- Offer email/SMS alternatives
- Don't prompt again (respect user choice)

#### 2. Service Worker Not Registering

**Problem:** Service worker fails to register.

**Causes:**
- Not served over HTTPS (except localhost)
- Service worker path incorrect
- Browser doesn't support service workers

**Solution:**
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
    .then(reg => console.log('Registered:', reg))
    .catch(err => console.error('Registration failed:', err));
}
```

#### 3. Notifications Not Appearing

**Problem:** Push notification received but not displayed.

**Checklist:**
- [ ] Permission granted
- [ ] Subscription active
- [ ] Service worker active
- [ ] Browser not in Do Not Disturb
- [ ] Check browser console for errors

**Debug:**
```javascript
// In service worker
self.addEventListener('push', (event) => {
  console.log('Push received:', event.data?.json());

  event.waitUntil(
    self.registration.showNotification('Test', {
      body: 'Debug notification'
    })
  );
});
```

#### 4. Badge Not Updating

**Problem:** Badge count not shown on app icon.

**Causes:**
- Browser doesn't support Badge API (Firefox)
- Service worker not active
- Message passing failed

**Solution:**
```typescript
// Check support
if ('setAppBadge' in navigator) {
  navigator.setAppBadge(5);
} else {
  console.warn('Badge API not supported');
}
```

#### 5. Deep Links Not Working

**Problem:** Clicking notification doesn't navigate correctly.

**Checklist:**
- [ ] URL format correct
- [ ] Routes defined in React Router
- [ ] Service worker click handler working

**Debug:**
```javascript
// In service worker
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.data);
  console.log('Target URL:', getTargetUrl(event.notification.data));
});
```

### Debug Mode

Enable debug logging:

```typescript
// In pushNotification.ts
const DEBUG = true;

if (DEBUG) {
  console.log('[Notifications]', ...args);
}
```

### Browser DevTools

**Chrome DevTools:**
1. Application tab → Service Workers
2. Application tab → Notifications
3. Console for error messages

**Firefox DevTools:**
1. about:debugging#/runtime/this-firefox
2. Inspect service worker
3. Console for logs

## API Integration

### Backend Endpoints

The frontend expects these endpoints:

```typescript
// Subscribe
POST /api/v1/notifications/subscribe
Body: { endpoint, keys: { p256dh, auth } }

// Unsubscribe
DELETE /api/v1/notifications/subscribe

// Get preferences
GET /api/v1/notifications/preferences

// Update preferences
PUT /api/v1/notifications/preferences
Body: NotificationPreferences

// Get history
GET /api/v1/notifications/history?page=1&limit=20

// Mark as read
PATCH /api/v1/notifications/:id/read

// Mark all as read
POST /api/v1/notifications/mark-all-read

// Delete notification
DELETE /api/v1/notifications/:id

// Get statistics
GET /api/v1/notifications/stats

// Send test notification
POST /api/v1/notifications/test
Body: TestNotificationRequest
```

### WebSocket Integration

For real-time updates:

```typescript
// Listen for new notifications
socket.on('notification', (notification) => {
  // Update UI
  // Show toast
  // Increment badge
});

// Listen for badge updates
socket.on('badge_update', ({ count }) => {
  // Update badge count
});
```

## Best Practices

### 1. Respect User Preferences

- Don't prompt too frequently
- Honor "Don't show again" choice
- Respect quiet hours
- Allow granular control

### 2. Provide Value

- Only send important notifications
- Use clear, actionable messages
- Include relevant actions
- Deep link to specific content

### 3. Performance

- Lazy load notification components
- Paginate notification history
- Cache preferences locally
- Debounce API calls

### 4. Error Handling

- Graceful degradation
- Clear error messages
- Retry logic for transient failures
- Fallback to alternative channels

### 5. Accessibility

- Keyboard navigation
- Screen reader support
- High contrast mode
- Focus management

### 6. Security

- Validate all notification data
- Sanitize user input
- Use HTTPS only
- Verify push endpoint

## Deployment Checklist

- [ ] Generate VAPID keys
- [ ] Update VAPID_PUBLIC_KEY
- [ ] Configure backend environment variables
- [ ] Add notification icons to `/public/icons/`
- [ ] Test on HTTPS domain
- [ ] Verify service worker registration
- [ ] Test on multiple browsers
- [ ] Monitor error logs
- [ ] Set up analytics tracking
- [ ] Document for team

## Support

For issues or questions:

1. Check troubleshooting guide above
2. Review browser console for errors
3. Verify backend API is running
4. Check service worker status in DevTools
5. Contact development team

## License

Copyright © 2025 ROI Systems. All rights reserved.
