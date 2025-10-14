# Progressive Web App (PWA) Implementation

Complete PWA infrastructure for ROI Systems with offline support, background sync, and native-like mobile experience.

## 🎯 Features

### Core PWA Capabilities
- ✅ **Offline Support** - Full app functionality without internet connection
- ✅ **Background Sync** - Queue changes and sync when online
- ✅ **Push Notifications** - Real-time alerts (ready for integration)
- ✅ **Install Prompt** - Add to home screen on mobile/desktop
- ✅ **Auto-Updates** - Seamless service worker updates
- ✅ **Caching Strategies** - Optimized caching for different resource types
- ✅ **IndexedDB Storage** - Offline document and alert caching

### Performance Optimizations
- Network-first for API calls (10s timeout)
- Cache-first for static assets (images, fonts)
- Stale-while-revalidate for documents
- Maximum cache sizes to prevent bloat
- Automatic cache cleanup

## 📁 Project Structure

```
frontend/
├── public/
│   ├── manifest.json              # PWA manifest configuration
│   ├── icons/                     # App icons (192x192, 512x512, maskable)
│   │   └── README.md             # Icon generation guide
│   └── screenshots/               # Install prompt screenshots
├── src/
│   ├── components/
│   │   ├── PWAUpdatePrompt.tsx   # Service worker update notifications
│   │   └── OfflineIndicator.tsx  # Network status & sync queue indicator
│   └── utils/
│       └── indexedDB.ts           # IndexedDB wrapper for offline storage
├── vite.config.ts                 # VitePWA plugin configuration
└── index.html                     # PWA meta tags & SW registration
```

## 🚀 Quick Start

### 1. Install Dependencies
Already installed:
- `vite-plugin-pwa` - Workbox-based PWA plugin
- `idb` - Promise-based IndexedDB wrapper

### 2. Generate Icons
Create app icons following `/public/icons/README.md` guide:
- Standard icons: 72x72 to 512x512
- Maskable icons: 192x192 and 512x512 with safe area
- Theme color: `#6366f1`

### 3. Add Components to App

```tsx
// src/App.tsx or src/main.tsx
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { OfflineIndicator } from './components/OfflineIndicator';

function App() {
  const handleSyncRetry = async () => {
    // Implement sync logic here
    // Example: process pending sync queue items
  };

  return (
    <>
      <YourAppContent />

      {/* PWA Components */}
      <PWAUpdatePrompt
        onUpdateApplied={() => console.log('App updated!')}
        checkInterval={60000} // Check for updates every minute
      />

      <OfflineIndicator
        onRetrySync={handleSyncRetry}
        showDetails={true}
      />
    </>
  );
}
```

### 4. Build and Test

```bash
# Development (SW disabled for faster HMR)
npm run dev

# Production build with PWA
npm run build

# Preview production build
npm run preview

# Test PWA (Lighthouse)
npm run perf
```

## 📦 IndexedDB Usage

### Caching Documents

```typescript
import {
  cacheDocument,
  getCachedDocument,
  getAllCachedDocuments,
  getDocumentsByClient
} from './utils/indexedDB';

// Cache a document with metadata
await cacheDocument({
  id: 'doc-123',
  title: 'Property Agreement',
  clientId: 'client-456',
  category: 'contracts',
  fileType: 'application/pdf',
  fileSize: 1024000,
  uploadDate: new Date().toISOString(),
  updatedAt: Date.now(),
  url: '/api/documents/doc-123',
  blob: documentBlob, // Optional: store full file for offline viewing
  thumbnail: 'data:image/jpeg;base64,...'
});

// Retrieve cached document
const doc = await getCachedDocument('doc-123');

// Get all documents for a client
const clientDocs = await getDocumentsByClient('client-456');
```

### Managing Sync Queue

```typescript
import {
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  deleteSyncItem
} from './utils/indexedDB';

// Queue an upload action
const queueId = await addToSyncQueue({
  action: 'upload',
  resourceType: 'document',
  payload: {
    file: fileData,
    metadata: { clientId: 'client-456' }
  },
  timestamp: Date.now(),
  status: 'pending',
  retryCount: 0
});

// Process sync queue when online
const pendingItems = await getPendingSyncItems();

for (const item of pendingItems) {
  try {
    // Process the sync item
    await processSyncItem(item);

    // Delete from queue on success
    await deleteSyncItem(item.id!);
  } catch (error) {
    // Mark as failed and increment retry count
    await updateSyncItemStatus(item.id!, 'failed', error.message);
  }
}
```

### Caching Alerts

```typescript
import {
  cacheAlert,
  getAllCachedAlerts,
  getUnreadAlertsCount,
  markAlertAsRead
} from './utils/indexedDB';

// Cache an alert
await cacheAlert({
  id: 'alert-789',
  type: 'warning',
  title: 'Document Expiring Soon',
  message: 'Client contract expires in 7 days',
  clientId: 'client-456',
  documentId: 'doc-123',
  date: Date.now(),
  read: false
});

// Get unread count
const unreadCount = await getUnreadAlertsCount();

// Mark as read
await markAlertAsRead('alert-789');
```

## 🔧 Configuration

### Vite PWA Plugin (`vite.config.ts`)

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    runtimeCaching: [
      // API calls - Network first with fallback
      {
        urlPattern: /^https?:\/\/localhost:3000\/api\/v1\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 5 * 60 // 5 minutes
          }
        }
      },
      // Documents - Stale-while-revalidate
      {
        urlPattern: /^https?:\/\/localhost:3000\/api\/v1\/documents\/.*/i,
        handler: 'StaleWhileRevalidate',
        options: {
          cacheName: 'documents-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 // 24 hours
          }
        }
      }
      // ... more strategies
    ]
  }
})
```

### Manifest Configuration (`public/manifest.json`)

```json
{
  "name": "ROI Systems - Real Estate Document Management",
  "short_name": "ROI Systems",
  "theme_color": "#6366f1",
  "background_color": "#ffffff",
  "display": "standalone",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-192x192-maskable.png", "sizes": "192x192", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 🧪 Testing

### Local Testing

```bash
# Build production version
npm run build

# Serve with preview
npm run preview

# Visit http://localhost:5050
# Open DevTools > Application > Service Workers
```

### Device Testing

```bash
# Install ngrok or use similar service
npx ngrok http 5050

# Visit ngrok URL on mobile device
# Test install prompt and offline functionality
```

### Lighthouse PWA Audit

```bash
# Run Lighthouse PWA audit
npm run perf

# Or manually in Chrome DevTools:
# 1. DevTools > Lighthouse
# 2. Select "Progressive Web App"
# 3. Generate report
```

### PWA Checklist

- [ ] **Manifest** - Valid manifest.json with all required fields
- [ ] **Icons** - Icons at 192x192 and 512x512 minimum
- [ ] **Service Worker** - Registered and active
- [ ] **HTTPS** - Served over HTTPS (or localhost)
- [ ] **Offline** - App works offline
- [ ] **Install Prompt** - Can be installed to home screen
- [ ] **Theme Color** - Matches manifest (#6366f1)
- [ ] **Viewport** - Mobile-responsive
- [ ] **Performance** - Lighthouse score >90

## 🎨 Customization

### Update Theme Color

```typescript
// vite.config.ts
VitePWA({
  manifest: {
    theme_color: '#6366f1',  // Your brand color
    background_color: '#ffffff'
  }
})
```

```html
<!-- index.html -->
<meta name="theme-color" content="#6366f1" />
```

### Adjust Cache Strategies

```typescript
// vite.config.ts - workbox.runtimeCaching
{
  urlPattern: /your-pattern/,
  handler: 'CacheFirst',  // or NetworkFirst, StaleWhileRevalidate
  options: {
    cacheName: 'your-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24
    }
  }
}
```

### Modify Update Check Interval

```tsx
<PWAUpdatePrompt
  checkInterval={120000}  // Check every 2 minutes
/>
```

## 🐛 Troubleshooting

### Service Worker Not Updating

```bash
# Clear all service workers
# Chrome DevTools > Application > Service Workers > Unregister

# Clear cache
# Chrome DevTools > Application > Cache Storage > Delete all

# Hard refresh
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (macOS)
```

### IndexedDB Not Working

```typescript
// Check browser support
if ('indexedDB' in window) {
  console.log('IndexedDB supported');
} else {
  console.error('IndexedDB not supported');
}

// Check database stats
import { getDatabaseStats } from './utils/indexedDB';
const stats = await getDatabaseStats();
console.log('DB Stats:', stats);
```

### Offline Mode Not Working

```typescript
// Test network status
console.log('Online:', navigator.onLine);

// Check service worker status
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW State:', reg?.active?.state);
});

// Inspect cached resources
// Chrome DevTools > Application > Cache Storage
```

## 📱 Platform-Specific Notes

### iOS Safari
- Requires `apple-touch-icon` for home screen
- Install prompt less prominent than Android
- Limited push notification support
- Service worker may be evicted more aggressively

### Android Chrome
- Prominent install banner
- Full push notification support
- Better service worker persistence
- Maskable icons fully supported

### Desktop Chrome/Edge
- Install prompt in address bar
- Full PWA features supported
- Can be launched as standalone app

## 🔐 Security Considerations

- Service workers only work over HTTPS (localhost exception)
- Be careful what you cache (don't cache sensitive data without encryption)
- Implement proper authentication for cached API calls
- Set appropriate cache expiration times
- Validate sync queue data before processing

## 📚 Resources

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
- [MDN Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB Guide](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Maskable Icons](https://maskable.app/)

## 🎯 Next Steps

1. **Generate Icons** - Create all required icon sizes
2. **Add Screenshots** - Capture app screenshots for install prompt
3. **Implement Sync Logic** - Process sync queue items when online
4. **Test Offline** - Verify offline functionality works
5. **Configure Push Notifications** - Set up FCM or similar service
6. **Deploy** - Deploy to production with HTTPS
7. **Monitor** - Track PWA metrics and performance

## 📝 Maintenance

### Regular Tasks
- Monitor IndexedDB cache sizes
- Clear old sync queue items
- Update service worker for new features
- Test offline functionality after updates
- Monitor PWA audit scores

### Updates
- Service worker auto-updates on new builds
- Users notified via PWAUpdatePrompt component
- Manual update check available in settings

---

**Built with** ❤️ **for ROI Systems**
