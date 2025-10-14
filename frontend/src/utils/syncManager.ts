/**
 * Sync Manager - Background Sync Coordinator
 *
 * Manages the sync queue processing when the application comes back online.
 * Handles document uploads, updates, deletions, and alert actions.
 */

import axios from 'axios';
import {
  getPendingSyncItems,
  updateSyncItemStatus,
  deleteSyncItem,
  SyncQueueItem
} from './indexedDB';

const API_BASE_URL = '/api/v1';
const MAX_RETRIES = 3;

/**
 * Process all pending sync queue items
 */
export async function processSyncQueue(): Promise<{
  processed: number;
  failed: number;
  errors: string[];
}> {
  const items = await getPendingSyncItems();
  let processed = 0;
  let failed = 0;
  const errors: string[] = [];

  console.log(`Processing ${items.length} pending sync items...`);

  for (const item of items) {
    try {
      await processSyncItem(item);
      await deleteSyncItem(item.id!);
      processed++;
      console.log(`✅ Synced: ${item.action} ${item.resourceType} ${item.resourceId || ''}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check if we should retry
      if (item.retryCount < MAX_RETRIES) {
        await updateSyncItemStatus(item.id!, 'pending', errorMessage);
        console.warn(`⚠️ Retry ${item.retryCount + 1}/${MAX_RETRIES}: ${item.action} ${item.resourceType}`);
      } else {
        await updateSyncItemStatus(item.id!, 'failed', errorMessage);
        failed++;
        errors.push(`${item.action} ${item.resourceType}: ${errorMessage}`);
        console.error(`❌ Failed permanently: ${item.action} ${item.resourceType}`);
      }
    }
  }

  console.log(`Sync complete: ${processed} processed, ${failed} failed`);

  return { processed, failed, errors };
}

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem): Promise<void> {
  switch (item.resourceType) {
    case 'document':
      await processDocumentSync(item);
      break;

    case 'alert':
      await processAlertSync(item);
      break;

    case 'client':
      await processClientSync(item);
      break;

    default:
      throw new Error(`Unknown resource type: ${item.resourceType}`);
  }
}

/**
 * Process document sync actions
 */
async function processDocumentSync(item: SyncQueueItem): Promise<void> {
  const { action, resourceId, payload } = item;

  switch (action) {
    case 'upload':
      // Upload new document
      const formData = new FormData();

      if (payload.file) {
        formData.append('file', payload.file);
      }

      if (payload.metadata) {
        Object.keys(payload.metadata).forEach(key => {
          formData.append(key, payload.metadata[key]);
        });
      }

      await axios.post(`${API_BASE_URL}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      break;

    case 'update':
      // Update existing document
      if (!resourceId) {
        throw new Error('Resource ID required for update');
      }

      await axios.put(`${API_BASE_URL}/documents/${resourceId}`, payload);
      break;

    case 'delete':
      // Delete document
      if (!resourceId) {
        throw new Error('Resource ID required for delete');
      }

      await axios.delete(`${API_BASE_URL}/documents/${resourceId}`);
      break;

    default:
      throw new Error(`Unknown document action: ${action}`);
  }
}

/**
 * Process alert sync actions
 */
async function processAlertSync(item: SyncQueueItem): Promise<void> {
  const { action, resourceId, payload } = item;

  switch (action) {
    case 'alert-action':
      // Process alert action (acknowledge, resolve, etc.)
      if (!resourceId) {
        throw new Error('Resource ID required for alert action');
      }

      await axios.post(`${API_BASE_URL}/alerts/${resourceId}/action`, payload);
      break;

    case 'update':
      // Update alert status
      if (!resourceId) {
        throw new Error('Resource ID required for update');
      }

      await axios.put(`${API_BASE_URL}/alerts/${resourceId}`, payload);
      break;

    default:
      throw new Error(`Unknown alert action: ${action}`);
  }
}

/**
 * Process client sync actions
 */
async function processClientSync(item: SyncQueueItem): Promise<void> {
  const { action, resourceId, payload } = item;

  switch (action) {
    case 'update':
      // Update client information
      if (!resourceId) {
        throw new Error('Resource ID required for update');
      }

      await axios.put(`${API_BASE_URL}/clients/${resourceId}`, payload);
      break;

    default:
      throw new Error(`Unknown client action: ${action}`);
  }
}

/**
 * Set up automatic sync when coming online
 */
export function setupAutoSync(): () => void {
  const handleOnline = async () => {
    console.log('Network online - starting auto-sync...');

    try {
      const result = await processSyncQueue();

      if (result.processed > 0) {
        console.log(`✅ Auto-sync completed: ${result.processed} items synced`);

        // Optionally show notification to user
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Sync Complete', {
            body: `${result.processed} pending changes have been synced.`,
            icon: '/icons/icon-192x192.png'
          });
        }
      }

      if (result.failed > 0) {
        console.warn(`⚠️ Auto-sync had failures: ${result.failed} items failed`);
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

/**
 * Check if sync is needed (has pending items)
 */
export async function needsSync(): Promise<boolean> {
  const items = await getPendingSyncItems();
  return items.length > 0;
}

/**
 * Get sync queue summary
 */
export async function getSyncSummary(): Promise<{
  pending: number;
  byType: Record<string, number>;
  byAction: Record<string, number>;
}> {
  const items = await getPendingSyncItems();

  const byType: Record<string, number> = {};
  const byAction: Record<string, number> = {};

  items.forEach(item => {
    byType[item.resourceType] = (byType[item.resourceType] || 0) + 1;
    byAction[item.action] = (byAction[item.action] || 0) + 1;
  });

  return {
    pending: items.length,
    byType,
    byAction
  };
}

/**
 * Manually trigger sync (for retry button)
 */
export async function manualSync(): Promise<void> {
  if (!navigator.onLine) {
    throw new Error('Cannot sync while offline');
  }

  const result = await processSyncQueue();

  if (result.failed > 0) {
    throw new Error(
      `Sync completed with ${result.failed} failures:\n${result.errors.join('\n')}`
    );
  }
}
