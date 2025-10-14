# Push Notifications Backend System

Comprehensive push notification system for the ROI Systems platform supporting Web Push Protocol and Firebase Cloud Messaging (FCM).

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Setup Instructions](#setup-instructions)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Service Architecture](#service-architecture)
8. [Integration Guide](#integration-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

The push notification system is built with a comprehensive, scalable architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│  (Web Browsers, iOS Apps, Android Apps)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Subscribe / Receive Notifications
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│  (Express Routes + Authentication Middleware)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Push Notification Controller                    │
│  (Request Validation, Authorization, Response Formatting)   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│            Push Notification Service Layer                   │
│  • Subscription Management                                   │
│  • Notification Queuing & Scheduling                        │
│  • User Preferences & Do Not Disturb                        │
│  • Delivery Logic & Retry Handling                          │
└───────────┬─────────────────────────────┬───────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────┐       ┌─────────────────────────┐
│   Web Push Protocol │       │ Firebase Cloud Messaging │
│   (VAPID)           │       │   (FCM)                  │
└─────────────────────┘       └─────────────────────────┘
            │                             │
            ▼                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  • Push Subscriptions                                        │
│  • Notification Queue                                        │
│  • Delivery Logs                                            │
│  • User Preferences                                          │
│  • Analytics                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Features

### Core Capabilities

- **Multi-Platform Support**: Web Push (Chrome, Firefox, Edge, Safari), iOS (via FCM), Android (via FCM)
- **Subscription Management**: Device registration, active subscription tracking, automatic expiry handling
- **Notification Queuing**: Asynchronous delivery with priority-based processing
- **Scheduled Notifications**: Future delivery scheduling with timezone support
- **User Preferences**: Granular channel preferences, Do Not Disturb periods, priority filtering
- **Rich Notifications**: Images, icons, action buttons, custom sounds, vibration patterns
- **Delivery Tracking**: Real-time delivery status, engagement metrics (clicks, dismissals)
- **Retry Logic**: Exponential backoff for failed deliveries
- **Template System**: Reusable notification templates with variable substitution
- **Analytics**: Aggregate metrics by user, type, channel, and time period
- **Rate Limiting**: Per-user throttling to prevent notification fatigue

### Advanced Features

- **Do Not Disturb**: Configurable quiet hours with automatic scheduling
- **Batching**: Optional notification batching to reduce interruptions
- **Priority Levels**: CRITICAL, HIGH, MEDIUM, LOW with different delivery strategies
- **Channel Filtering**: Business alerts, documents, properties, market reports, maintenance, marketing
- **Interaction Tracking**: Click-through tracking, dismiss tracking, conversion tracking
- **Error Handling**: Graceful degradation, automatic subscription cleanup
- **Multi-Device**: Support for multiple devices per user
- **Localization Ready**: Template system supports multiple languages

---

## Technology Stack

### Core Dependencies

- **web-push** (v3.6.7): Web Push Protocol implementation with VAPID support
- **firebase-admin** (v12.0.0): Firebase Cloud Messaging for mobile notifications
- **Prisma** (v6.17.1): Type-safe database ORM for PostgreSQL
- **Express** (v4.18.2): REST API framework
- **express-validator** (v7.0.1): Request validation middleware
- **TypeScript** (v5.3.3): Type safety and enhanced developer experience

### Supporting Libraries

- **winston**: Structured logging
- **ioredis**: Redis client for caching and queue management
- **node-cron**: Scheduled task execution
- **dotenv**: Environment variable management

---

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 14+ database
- Redis 6+ (optional, for queue management)
- Valid VAPID keys for Web Push
- Firebase project (optional, for mobile push)

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push Protocol:

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

This will output:
```json
{
  "publicKey": "BGt...",
  "privateKey": "5a2..."
}
```

### Step 3: Configure Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Web Push Configuration (VAPID)
VAPID_PUBLIC_KEY=your_public_key_from_step_2
VAPID_PRIVATE_KEY=your_private_key_from_step_2
VAPID_EMAIL=mailto:admin@roisystems.com

# Firebase Cloud Messaging (Optional for mobile)
FCM_SERVER_KEY=your_fcm_server_key
FCM_PROJECT_ID=your_fcm_project_id
FCM_PRIVATE_KEY=your_fcm_private_key
FCM_CLIENT_EMAIL=your_fcm_client_email

# Push Notification Settings
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=60000
```

### Step 4: Database Setup

Run Prisma migrations to create the push notification tables:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name add_push_notifications
```

### Step 5: Firebase Setup (Optional)

For mobile push notifications via FCM:

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Go to Project Settings → Service Accounts
3. Click "Generate New Private Key"
4. Download the JSON file
5. Extract credentials and add to `.env`:
   - `FCM_PROJECT_ID`: Project ID from JSON
   - `FCM_PRIVATE_KEY`: Private key from JSON
   - `FCM_CLIENT_EMAIL`: Client email from JSON

### Step 6: Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The push notification endpoints will be available at:
- `http://localhost:3000/api/v1/notifications`

---

## Database Schema

### PushSubscription

Stores user device subscriptions for push notifications.

```prisma
model PushSubscription {
  id           String   @id @default(uuid())
  userId       String
  endpoint     String   @unique
  p256dh       String   // Encryption key
  auth         String   // Auth secret
  deviceType   String   // "web", "ios", "android"
  browserType  String?
  userAgent    String?
  deviceName   String?
  active       Boolean  @default(true)
  lastUsedAt   DateTime @default(now())
  failureCount Int      @default(0)
  subscribedAt DateTime @default(now())
  expiresAt    DateTime?
}
```

### NotificationQueue

Queued notifications awaiting delivery.

```prisma
model NotificationQueue {
  id           String   @id @default(uuid())
  userId       String
  type         NotificationType
  priority     NotificationPriority
  title        String
  body         String
  icon         String?
  image        String?
  actions      Json?
  data         Json?
  channel      String
  status       QueueStatus @default(PENDING)
  attempts     Int         @default(0)
  maxAttempts  Int         @default(3)
  scheduledFor DateTime?
  sentAt       DateTime?
  deliveredAt  DateTime?
  createdAt    DateTime    @default(now())
}
```

### DeliveryLog

Tracks all notification delivery attempts.

```prisma
model DeliveryLog {
  id              String   @id @default(uuid())
  userId          String
  subscriptionId  String
  notificationId  String
  type            NotificationType
  status          DeliveryLogStatus
  statusCode      Int?
  delivered       Boolean  @default(false)
  clicked         Boolean  @default(false)
  dismissed       Boolean  @default(false)
  deliveryTime    Int?     // Milliseconds
  sentAt          DateTime @default(now())
  deliveredAt     DateTime?
  clickedAt       DateTime?
}
```

### UserNotificationPreferences

User-specific notification settings.

```prisma
model UserNotificationPreferences {
  id                String   @id @default(uuid())
  userId            String   @unique
  enabled           Boolean  @default(true)
  doNotDisturbStart Int?     // Hour (0-23)
  doNotDisturbEnd   Int?     // Hour (0-23)
  businessAlerts    Boolean  @default(true)
  documentUpdates   Boolean  @default(true)
  propertyValues    Boolean  @default(true)
  webPush           Boolean  @default(true)
  maxPerHour        Int?
  maxPerDay         Int?
}
```

---

## API Documentation

### Base URL

```
http://localhost:3000/api/v1/notifications
```

### Authentication

All endpoints except `/vapid-public-key` require authentication via JWT token:

```
Authorization: Bearer <your_jwt_token>
```

---

### Endpoints

#### 1. Get VAPID Public Key

**Public endpoint** - Returns the VAPID public key needed for client-side subscription.

```http
GET /api/v1/notifications/vapid-public-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "publicKey": "BGt7i..."
  }
}
```

---

#### 2. Subscribe to Push Notifications

Register a device for push notifications.

```http
POST /api/v1/notifications/subscribe
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BKB...",
      "auth": "t6w..."
    }
  },
  "deviceType": "web",
  "browserType": "chrome",
  "deviceName": "MacBook Pro"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "uuid",
    "message": "Successfully subscribed to push notifications"
  }
}
```

---

#### 3. Unsubscribe from Push Notifications

Remove a device subscription.

```http
DELETE /api/v1/notifications/unsubscribe
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Successfully unsubscribed from push notifications"
  }
}
```

---

#### 4. Send Notification (Admin)

Send a notification to a specific user. **Requires admin role**.

```http
POST /api/v1/notifications/send
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "targetUserId": "user-uuid",
  "title": "New Property Alert",
  "body": "A property matching your criteria is now available",
  "channel": "properties",
  "type": "PROPERTY_VALUE",
  "priority": "HIGH",
  "icon": "/icons/property.png",
  "image": "/images/property-123.jpg",
  "data": {
    "propertyId": "123",
    "url": "/properties/123"
  },
  "actions": [
    {
      "action": "view",
      "title": "View Property",
      "icon": "/icons/view.png"
    }
  ],
  "scheduledFor": "2025-10-15T10:00:00Z",
  "ttl": 86400
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notificationId": "uuid",
    "message": "Notification queued for delivery",
    "status": "QUEUED"
  }
}
```

---

#### 5. Get Notification History

Retrieve user's notification history.

```http
GET /api/v1/notifications/history?type=BUSINESS_ALERT&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `type` (optional): Filter by notification type
- `status` (optional): Filter by status (PENDING, SENT, DELIVERED, FAILED)
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `limit` (optional): Maximum results (1-100, default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "BUSINESS_ALERT",
        "title": "High Priority Alert",
        "body": "New opportunity detected",
        "status": "DELIVERED",
        "priority": "HIGH",
        "createdAt": "2025-10-14T12:00:00Z",
        "deliveredAt": "2025-10-14T12:00:05Z"
      }
    ],
    "count": 1
  }
}
```

---

#### 6. Update Notification Preferences

Update user's notification preferences.

```http
PUT /api/v1/notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "enabled": true,
  "doNotDisturbStart": 22,
  "doNotDisturbEnd": 8,
  "businessAlerts": true,
  "documentUpdates": true,
  "propertyValues": true,
  "marketReports": false,
  "webPush": true,
  "maxPerHour": 5,
  "maxPerDay": 20
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "id": "uuid",
      "userId": "user-uuid",
      "enabled": true,
      "doNotDisturbStart": 22,
      "doNotDisturbEnd": 8,
      "businessAlerts": true
    },
    "message": "Preferences updated successfully"
  }
}
```

---

#### 7. Get Notification Preferences

Retrieve user's current notification preferences.

```http
GET /api/v1/notifications/preferences
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "preferences": {
      "id": "uuid",
      "userId": "user-uuid",
      "enabled": true,
      "doNotDisturbStart": 22,
      "doNotDisturbEnd": 8,
      "businessAlerts": true,
      "documentUpdates": true,
      "webPush": true
    }
  }
}
```

---

#### 8. Get User Subscriptions

Retrieve all active subscriptions for the authenticated user.

```http
GET /api/v1/notifications/subscriptions
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "uuid",
        "deviceType": "web",
        "browserType": "chrome",
        "deviceName": "MacBook Pro",
        "active": true,
        "subscribedAt": "2025-10-01T10:00:00Z",
        "lastUsedAt": "2025-10-14T12:00:00Z"
      }
    ],
    "count": 1
  }
}
```

---

#### 9. Send Test Notification

Send a test notification to verify setup.

```http
POST /api/v1/notifications/test
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Test notification sent successfully"
  }
}
```

---

## Service Architecture

### PushNotificationService

Core service handling all push notification operations.

#### Key Methods

**`subscribe(userId, subscriptionData)`**
- Register a new device subscription
- Updates existing subscriptions if endpoint already exists
- Returns subscription object with ID

**`unsubscribe(userId, endpoint)`**
- Mark subscription as inactive
- Preserves data for analytics

**`sendNotification(options)`**
- Queue notification for delivery
- Checks user preferences and DND settings
- Handles scheduling for future delivery
- Returns queued notification object

**`sendImmediateNotification(userId, payload)`**
- Bypass queue for critical notifications
- Sends directly to all active user devices
- Used for time-sensitive alerts

**`processQueue()`**
- Process pending notifications from queue
- Called by scheduled job every 30 seconds
- Batch processes up to 100 notifications
- Implements retry logic with exponential backoff

**`getNotificationHistory(userId, filters)`**
- Retrieve user's notification history
- Supports filtering by type, status, date range
- Paginated results

**`updatePreferences(userId, preferences)`**
- Update user notification settings
- Creates default preferences if none exist

**`getPreferences(userId)`**
- Retrieve user preferences
- Auto-creates with defaults if missing

---

## Integration Guide

### Frontend Integration

#### 1. Request Permission

```javascript
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  console.log('Notification permission granted');
}
```

#### 2. Get VAPID Public Key

```javascript
const response = await fetch('http://localhost:3000/api/v1/notifications/vapid-public-key');
const { data } = await response.json();
const vapidPublicKey = data.publicKey;
```

#### 3. Register Service Worker

```javascript
const registration = await navigator.serviceWorker.register('/service-worker.js');
console.log('Service Worker registered');
```

#### 4. Subscribe to Push Notifications

```javascript
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
});

// Send subscription to backend
await fetch('http://localhost:3000/api/v1/notifications/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceType: 'web',
    browserType: getBrowserType(),
    deviceName: getDeviceName()
  })
});
```

#### 5. Handle Push Events (service-worker.js)

```javascript
self.addEventListener('push', event => {
  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    image: data.image,
    data: data.data,
    actions: data.actions,
    requireInteraction: data.requireInteraction,
    vibrate: data.vibrate
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    clients.openWindow(event.notification.data.url);
  }
});
```

### Backend Integration

#### Integrate with Existing Services

```typescript
import pushNotificationService from './services/push-notification.service';

// Send notification for a business alert
await pushNotificationService.sendNotification({
  userId: 'user-123',
  type: 'BUSINESS_ALERT',
  priority: 'HIGH',
  channel: 'business_alerts',
  payload: {
    title: 'New Lead Alert',
    body: 'High-value opportunity detected',
    icon: '/icons/alert.png',
    data: {
      alertId: 'alert-456',
      url: '/alerts/alert-456'
    },
    actions: [
      { action: 'view', title: 'View Alert' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }
});
```

---

## Testing

### Manual Testing

#### 1. Test Subscription

```bash
curl -X POST http://localhost:3000/api/v1/notifications/subscribe \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "endpoint": "https://fcm.googleapis.com/fcm/send/TEST",
      "keys": {
        "p256dh": "TEST_P256DH",
        "auth": "TEST_AUTH"
      }
    },
    "deviceType": "web"
  }'
```

#### 2. Test Send Notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Test Preferences

```bash
curl -X GET http://localhost:3000/api/v1/notifications/preferences \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Testing

```bash
npm test
```

---

## Troubleshooting

### Common Issues

#### 1. VAPID Keys Not Configured

**Error:** `VAPID keys not configured`

**Solution:** Generate VAPID keys and add to `.env`:
```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

#### 2. Subscription Failed (410 Gone)

**Error:** `Subscription expired or invalid`

**Solution:** This is normal when subscriptions expire. The system automatically marks them as inactive.

#### 3. Notifications Not Delivering

**Checklist:**
- [ ] User has active subscription
- [ ] Notification preferences allow the channel
- [ ] Not in Do Not Disturb period
- [ ] Queue processor is running
- [ ] VAPID keys are correct

#### 4. FCM Errors

**Error:** `FCM authentication failed`

**Solution:** Verify FCM credentials in `.env`:
- Check `FCM_PROJECT_ID`
- Verify `FCM_PRIVATE_KEY` format (replace `\n` with newlines)
- Confirm `FCM_CLIENT_EMAIL`

### Debugging

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

Check notification queue status:

```sql
SELECT status, COUNT(*)
FROM notification_queue
GROUP BY status;
```

Check subscription health:

```sql
SELECT active, device_type, COUNT(*)
FROM push_subscriptions
GROUP BY active, device_type;
```

---

## Performance Optimization

### Queue Processing

The notification queue is processed every 30 seconds by a scheduled job. Adjust batch size in `.env`:

```bash
NOTIFICATION_BATCH_SIZE=100  # Process 100 notifications per run
```

### Retry Strategy

Failed notifications are retried with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: 60 seconds delay
- Attempt 3: 240 seconds delay

Configure retry settings:

```bash
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=60000  # Base delay in milliseconds
```

### Caching

Consider using Redis for:
- User preferences caching
- Rate limiting
- Queue management

---

## Security Considerations

1. **VAPID Keys**: Store securely and never expose private key
2. **Authentication**: All endpoints (except public key) require authentication
3. **Authorization**: Admin-only endpoints enforce role checks
4. **Input Validation**: All requests validated with express-validator
5. **Rate Limiting**: Implement per-user rate limiting
6. **HTTPS Only**: Use HTTPS in production for secure communication
7. **Subscription Verification**: Validate subscription endpoints
8. **Data Privacy**: Encrypt sensitive notification data

---

## Production Checklist

- [ ] Generate and secure VAPID keys
- [ ] Configure Firebase project (if using mobile push)
- [ ] Set up database backups
- [ ] Configure monitoring and alerting
- [ ] Set up scheduled job for queue processing
- [ ] Implement rate limiting
- [ ] Enable HTTPS
- [ ] Configure CORS properly
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Review and adjust retry/batch settings
- [ ] Test notification delivery on all platforms
- [ ] Document notification types and channels
- [ ] Set up analytics dashboard

---

## Support

For issues or questions:
- GitHub Issues: [github.com/roi-systems/backend/issues]
- Email: dev@roisystems.com
- Documentation: [docs.roisystems.com]

---

## License

MIT License - ROI Systems © 2025
