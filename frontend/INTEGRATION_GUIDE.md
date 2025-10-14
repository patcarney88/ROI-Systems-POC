# PWA Integration Guide

Quick start guide for integrating PWA components into your application.

## Step 1: Add Components to App Root

### Option A: In `src/App.tsx`

```tsx
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { setupAutoSync, manualSync } from './utils/syncManager';

function App() {
  // Set up automatic sync on mount
  React.useEffect(() => {
    const cleanup = setupAutoSync();
    return cleanup;
  }, []);

  // Handle manual sync retry
  const handleSyncRetry = async () => {
    try {
      await manualSync();
      console.log('Manual sync successful');
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  return (
    <BrowserRouter>
      {/* Your existing app content */}
      <YourRoutes />

      {/* PWA Components - Add at root level */}
      <PWAUpdatePrompt
        checkInterval={60000} // Check every minute
        onUpdateApplied={() => {
          console.log('App updated successfully!');
        }}
      />

      <OfflineIndicator
        onRetrySync={handleSyncRetry}
        showDetails={true}
      />
    </BrowserRouter>
  );
}

export default App;
```

### Option B: In `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt';
import { OfflineIndicator } from './components/OfflineIndicator';
import { setupAutoSync, manualSync } from './utils/syncManager';
import './index.css';

// Set up automatic sync
setupAutoSync();

const handleSyncRetry = async () => {
  try {
    await manualSync();
  } catch (error) {
    console.error('Sync failed:', error);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <PWAUpdatePrompt checkInterval={60000} />
    <OfflineIndicator onRetrySync={handleSyncRetry} showDetails={true} />
  </React.StrictMode>
);
```

## Step 2: Add Offline Caching to Document Operations

### In Document List/Fetch

```typescript
// src/pages/Documents.tsx or similar
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  cacheDocument,
  getAllCachedDocuments,
  CachedDocument
} from '../utils/indexedDB';

function DocumentsPage() {
  const [documents, setDocuments] = useState<CachedDocument[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadDocuments();

    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadDocuments() {
    try {
      if (isOnline) {
        // Fetch from API
        const response = await axios.get('/api/v1/documents');
        const docs = response.data;

        // Cache for offline access
        await Promise.all(
          docs.map((doc: any) =>
            cacheDocument({
              id: doc.id,
              title: doc.title,
              description: doc.description,
              clientId: doc.clientId,
              clientName: doc.clientName,
              category: doc.category,
              fileType: doc.fileType,
              fileSize: doc.fileSize,
              uploadDate: doc.uploadDate,
              updatedAt: Date.now(),
              url: doc.url,
              thumbnail: doc.thumbnail
            })
          )
        );

        setDocuments(docs);
      } else {
        // Load from cache when offline
        const cachedDocs = await getAllCachedDocuments();
        setDocuments(cachedDocs);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);

      // Fallback to cache on error
      const cachedDocs = await getAllCachedDocuments();
      setDocuments(cachedDocs);
    }
  }

  return (
    <div>
      {!isOnline && (
        <div className="offline-notice">
          You're offline. Showing cached documents.
        </div>
      )}

      {/* Render documents */}
      {documents.map(doc => (
        <DocumentCard key={doc.id} document={doc} />
      ))}
    </div>
  );
}
```

### In Document Upload

```typescript
// src/components/DocumentUpload.tsx or similar
import { useState } from 'react';
import axios from 'axios';
import { addToSyncQueue } from '../utils/indexedDB';

function DocumentUpload({ clientId }: { clientId: string }) {
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(file: File, metadata: any) {
    setIsUploading(true);

    try {
      if (navigator.onLine) {
        // Upload directly when online
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);
        Object.keys(metadata).forEach(key => {
          formData.append(key, metadata[key]);
        });

        await axios.post('/api/v1/documents', formData);

        alert('Document uploaded successfully!');
      } else {
        // Queue for sync when offline
        await addToSyncQueue({
          action: 'upload',
          resourceType: 'document',
          payload: {
            file,
            metadata: { ...metadata, clientId }
          },
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0
        });

        alert('You are offline. Upload queued for sync.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div>
      {/* Your upload UI */}
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleUpload(file, { /* metadata */ });
          }
        }}
        disabled={isUploading}
      />
    </div>
  );
}
```

## Step 3: Add Offline Caching to Alerts

```typescript
// src/pages/Alerts.tsx or similar
import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  cacheAlert,
  getAllCachedAlerts,
  markAlertAsRead,
  CachedAlert
} from '../utils/indexedDB';

function AlertsPage() {
  const [alerts, setAlerts] = useState<CachedAlert[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    loadAlerts();

    const handleOnline = () => {
      setIsOnline(true);
      loadAlerts(); // Refresh when coming online
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function loadAlerts() {
    try {
      if (isOnline) {
        // Fetch from API
        const response = await axios.get('/api/v1/alerts');
        const apiAlerts = response.data;

        // Cache for offline access
        await Promise.all(
          apiAlerts.map((alert: any) =>
            cacheAlert({
              id: alert.id,
              type: alert.type,
              title: alert.title,
              message: alert.message,
              clientId: alert.clientId,
              documentId: alert.documentId,
              date: new Date(alert.date).getTime(),
              read: alert.read,
              metadata: alert.metadata
            })
          )
        );

        setAlerts(apiAlerts);
      } else {
        // Load from cache when offline
        const cachedAlerts = await getAllCachedAlerts();
        setAlerts(cachedAlerts);
      }
    } catch (error) {
      console.error('Failed to load alerts:', error);

      // Fallback to cache
      const cachedAlerts = await getAllCachedAlerts();
      setAlerts(cachedAlerts);
    }
  }

  async function handleMarkAsRead(alertId: string) {
    try {
      if (isOnline) {
        // Update on server
        await axios.put(`/api/v1/alerts/${alertId}`, { read: true });
      } else {
        // Queue for sync
        await addToSyncQueue({
          action: 'update',
          resourceType: 'alert',
          resourceId: alertId,
          payload: { read: true },
          timestamp: Date.now(),
          status: 'pending',
          retryCount: 0
        });
      }

      // Update cache
      await markAlertAsRead(alertId);

      // Update UI
      setAlerts(prev =>
        prev.map(a => (a.id === alertId ? { ...a, read: true } : a))
      );
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  }

  return (
    <div>
      {/* Render alerts */}
      {alerts.map(alert => (
        <AlertCard
          key={alert.id}
          alert={alert}
          onMarkAsRead={() => handleMarkAsRead(alert.id)}
        />
      ))}
    </div>
  );
}
```

## Step 4: Add Authentication Integration

```typescript
// src/hooks/useAuth.ts or similar
import { useEffect } from 'react';
import { initDB, clearAllCache, closeDB } from '../utils/indexedDB';

export function useAuth() {
  // ... your existing auth logic

  async function handleLogin(credentials: any) {
    try {
      // Your login logic
      const response = await login(credentials);

      // Initialize offline storage after successful login
      await initDB();

      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async function handleLogout() {
    try {
      // Your logout logic
      await logout();

      // Clear all cached data
      await clearAllCache();

      // Close database connection
      closeDB();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  return {
    login: handleLogin,
    logout: handleLogout
    // ... other auth methods
  };
}
```

## Step 5: Add Network Status Hook (Optional)

```typescript
// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Usage in components:
function MyComponent() {
  const isOnline = useNetworkStatus();

  return (
    <div>
      {isOnline ? (
        <span>🟢 Online</span>
      ) : (
        <span>🔴 Offline</span>
      )}
    </div>
  );
}
```

## Step 6: Test Integration

### Development Testing

```bash
# Start dev server
npm run dev

# Open browser to http://localhost:5050
# Open DevTools > Application > Service Workers
# Note: SW is disabled in dev for faster HMR
```

### Production Testing

```bash
# Build production version
npm run build

# Preview production build
npm run preview

# Test offline functionality:
# 1. Open DevTools > Network
# 2. Set throttling to "Offline"
# 3. Verify app still works
# 4. Check cached documents and alerts
# 5. Queue some actions (upload, update)
# 6. Go back online
# 7. Verify sync queue processes
```

### Lighthouse Audit

```bash
# Run PWA audit
npm run perf

# Check scores:
# - Installable: Should pass
# - PWA Optimized: Should pass
# - Works Offline: Should pass
# - Fast and Reliable: Should be >90
```

## Common Patterns

### Show Offline Banner

```tsx
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { Alert } from '@mui/material';

function OfflineBanner() {
  const isOnline = useNetworkStatus();

  if (isOnline) return null;

  return (
    <Alert severity="warning" sx={{ mb: 2 }}>
      You're offline. Some features may be limited.
    </Alert>
  );
}
```

### Sync Status Indicator

```tsx
import { useSyncStatus } from '../components/OfflineIndicator';
import { Badge, IconButton } from '@mui/material';
import { Sync } from '@mui/icons-material';

function SyncButton() {
  const { pendingCount, isSyncing, updateCount } = useSyncStatus();

  return (
    <Badge badgeContent={pendingCount} color="warning">
      <IconButton onClick={updateCount}>
        <Sync className={isSyncing ? 'spinning' : ''} />
      </IconButton>
    </Badge>
  );
}
```

### Pre-cache Critical Documents

```typescript
// Pre-cache documents on first load
async function preCacheDocuments() {
  try {
    const response = await axios.get('/api/v1/documents?limit=20');
    const recentDocs = response.data;

    await Promise.all(
      recentDocs.map((doc: any) => cacheDocument(doc))
    );

    console.log(`Pre-cached ${recentDocs.length} documents`);
  } catch (error) {
    console.error('Pre-caching failed:', error);
  }
}

// Call after login or on dashboard load
useEffect(() => {
  if (isAuthenticated) {
    preCacheDocuments();
  }
}, [isAuthenticated]);
```

## Troubleshooting

### Service Worker Not Registering

```typescript
// Check registration in index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('SW registered:', reg))
    .catch(err => console.error('SW registration failed:', err));
}
```

### IndexedDB Errors

```typescript
// Check IndexedDB support
if (!('indexedDB' in window)) {
  console.error('IndexedDB not supported');
  // Fallback to localStorage or in-memory cache
}
```

### Cache Not Working

```typescript
// Inspect cache storage
caches.keys().then(keys => console.log('Cache keys:', keys));

// Check service worker status
navigator.serviceWorker.getRegistration()
  .then(reg => console.log('SW status:', reg?.active?.state));
```

## Next Steps

1. ✅ Integrate components into app
2. ✅ Add offline caching to data operations
3. ✅ Test offline functionality
4. ✅ Generate and add icons
5. ✅ Deploy with HTTPS
6. ✅ Monitor PWA metrics

**Congratulations! Your app is now a Progressive Web App! 🎉**
