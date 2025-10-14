# Push Notifications - Quick Start Guide

Fast setup guide for the ROI Systems push notification system.

## 🚀 Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Generate VAPID Keys

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Copy the output keys.

### 3. Configure Environment

Add to your `.env` file:

```bash
# Replace with your actual keys from step 2
VAPID_PUBLIC_KEY=BGt7i...
VAPID_PRIVATE_KEY=5a2x...
VAPID_EMAIL=mailto:admin@roisystems.com

# Optional: Firebase for mobile push
FCM_SERVER_KEY=your_key
FCM_PROJECT_ID=your_project_id
```

### 4. Setup Database

```bash
npx prisma generate
npx prisma migrate dev --name add_push_notifications
```

### 5. Start Server

```bash
npm run dev
```

✅ Push notifications are now active!

---

## 📱 Test It Out

### Get VAPID Public Key

```bash
curl http://localhost:3000/api/v1/notifications/vapid-public-key
```

### Send Test Notification

```bash
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🎯 Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/notifications/vapid-public-key` | GET | Get VAPID public key (public) |
| `/api/v1/notifications/subscribe` | POST | Subscribe to push notifications |
| `/api/v1/notifications/unsubscribe` | DELETE | Unsubscribe from notifications |
| `/api/v1/notifications/send` | POST | Send notification (admin) |
| `/api/v1/notifications/test` | POST | Send test notification |
| `/api/v1/notifications/preferences` | GET/PUT | Manage preferences |
| `/api/v1/notifications/history` | GET | View notification history |

---

## 📊 Features

- ✅ **Web Push Protocol** (Chrome, Firefox, Edge, Safari)
- ✅ **Firebase Cloud Messaging** (iOS, Android)
- ✅ **Notification Queue** with retry logic
- ✅ **User Preferences** & Do Not Disturb
- ✅ **Rich Notifications** (images, actions, sounds)
- ✅ **Delivery Tracking** & Analytics
- ✅ **Multiple Devices** per user
- ✅ **Template System** for reusable notifications

---

## 🔧 Configuration Options

### Queue Settings

```bash
NOTIFICATION_BATCH_SIZE=100          # Process 100 per cycle
NOTIFICATION_RETRY_ATTEMPTS=3        # Retry failed 3 times
NOTIFICATION_RETRY_DELAY=60000       # 60s base delay
```

### Priority Levels

- **CRITICAL**: Immediate delivery, bypasses DND
- **HIGH**: Fast delivery, sent within 1 minute
- **MEDIUM**: Normal delivery, batched
- **LOW**: Lowest priority, can be delayed

### Notification Types

- `BUSINESS_ALERT` - High-value business alerts
- `DOCUMENT_UPDATE` - Document status changes
- `PROPERTY_VALUE` - Property value updates
- `MARKET_REPORT` - Market intelligence
- `MAINTENANCE` - System maintenance
- `MARKETING` - Marketing campaigns
- `SYSTEM` - System notifications

---

## 🎨 Frontend Integration

### 1. Request Permission

```javascript
const permission = await Notification.requestPermission();
```

### 2. Get VAPID Public Key

```javascript
const res = await fetch('/api/v1/notifications/vapid-public-key');
const { data } = await res.json();
const vapidKey = data.publicKey;
```

### 3. Subscribe

```javascript
const registration = await navigator.serviceWorker.register('/sw.js');
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidKey)
});

// Send to backend
await fetch('/api/v1/notifications/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    subscription: subscription.toJSON(),
    deviceType: 'web',
    browserType: 'chrome'
  })
});
```

### 4. Handle Push Events (service-worker.js)

```javascript
self.addEventListener('push', event => {
  const data = event.data.json();

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      actions: data.actions
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  clients.openWindow(event.notification.data.url);
});
```

---

## 🔍 Monitoring

### Check Queue Status

```sql
SELECT status, COUNT(*)
FROM notification_queue
GROUP BY status;
```

### Check Subscription Health

```sql
SELECT active, device_type, COUNT(*)
FROM push_subscriptions
GROUP BY active, device_type;
```

### View Recent Deliveries

```sql
SELECT type, status, COUNT(*)
FROM delivery_logs
WHERE sent_at > NOW() - INTERVAL '1 hour'
GROUP BY type, status;
```

---

## 🐛 Troubleshooting

### Issue: "VAPID keys not configured"

**Solution**: Generate keys and add to `.env`

```bash
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

### Issue: Notifications not delivering

**Checklist**:
- ✅ User has active subscription
- ✅ Preferences allow the channel
- ✅ Not in Do Not Disturb period
- ✅ Queue processor running (starts automatically)
- ✅ VAPID keys are correct

### Issue: "Subscription expired"

**Solution**: This is normal. System automatically handles expired subscriptions. Users need to re-subscribe.

---

## 📚 Full Documentation

See [PUSH_NOTIFICATIONS_BACKEND.md](./PUSH_NOTIFICATIONS_BACKEND.md) for:
- Complete API reference
- Architecture details
- Advanced configuration
- Security considerations
- Production deployment guide

---

## 🎓 Example Use Cases

### Send Business Alert

```typescript
await pushNotificationService.sendNotification({
  userId: 'user-123',
  type: 'BUSINESS_ALERT',
  priority: 'HIGH',
  channel: 'business_alerts',
  payload: {
    title: 'New Lead Alert',
    body: 'High-value opportunity detected',
    icon: '/icons/alert.png',
    data: { alertId: 'alert-456', url: '/alerts/alert-456' },
    actions: [
      { action: 'view', title: 'View Alert' }
    ]
  }
});
```

### Schedule Future Notification

```typescript
await pushNotificationService.scheduleNotification(
  'user-123',
  {
    title: 'Reminder',
    body: 'Meeting in 15 minutes'
  },
  new Date('2025-10-15T10:45:00Z')
);
```

### Update User Preferences

```typescript
await pushNotificationService.updatePreferences('user-123', {
  doNotDisturbStart: 22,  // 10 PM
  doNotDisturbEnd: 8,     // 8 AM
  businessAlerts: true,
  marketing: false,
  maxPerHour: 5
});
```

---

## 🚦 Status Check

Test if push notifications are working:

```bash
# 1. Check server health
curl http://localhost:3000/health

# 2. Get VAPID key (should return public key)
curl http://localhost:3000/api/v1/notifications/vapid-public-key

# 3. Send test notification (requires auth)
curl -X POST http://localhost:3000/api/v1/notifications/test \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📞 Support

- 📖 Full Docs: [PUSH_NOTIFICATIONS_BACKEND.md](./PUSH_NOTIFICATIONS_BACKEND.md)
- 🐛 Issues: [GitHub Issues](https://github.com/roi-systems/backend/issues)
- 📧 Email: dev@roisystems.com

---

**Setup Time**: ~5 minutes
**Difficulty**: Easy
**Status**: Production-ready ✅
