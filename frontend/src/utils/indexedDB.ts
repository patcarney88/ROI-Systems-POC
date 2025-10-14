/**
 * IndexedDB Wrapper for PWA Offline Storage
 *
 * Provides offline caching for documents, alerts, and sync queue management.
 * Uses idb library for Promise-based IndexedDB operations.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database schema definition
interface ROISystemsDB extends DBSchema {
  documents: {
    key: string;
    value: CachedDocument;
    indexes: { 'by-updated': number; 'by-client': string };
  };
  alerts: {
    key: string;
    value: CachedAlert;
    indexes: { 'by-date': number; 'by-type': string };
  };
  syncQueue: {
    key: number;
    value: SyncQueueItem;
    indexes: { 'by-timestamp': number; 'by-status': string };
  };
  metadata: {
    key: string;
    value: MetadataItem;
  };
}

// Type definitions
export interface CachedDocument {
  id: string;
  title: string;
  description?: string;
  clientId: string;
  clientName?: string;
  category: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  updatedAt: number;
  url?: string;
  blob?: Blob;
  thumbnail?: string;
  metadata?: Record<string, any>;
}

export interface CachedAlert {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  message: string;
  clientId?: string;
  documentId?: string;
  date: number;
  read: boolean;
  metadata?: Record<string, any>;
}

export interface SyncQueueItem {
  id?: number;
  action: 'upload' | 'update' | 'delete' | 'alert-action';
  resourceType: 'document' | 'alert' | 'client';
  resourceId?: string;
  payload: any;
  timestamp: number;
  status: 'pending' | 'processing' | 'failed';
  retryCount: number;
  error?: string;
}

export interface MetadataItem {
  key: string;
  value: any;
  updatedAt: number;
}

// Database constants
const DB_NAME = 'roi-systems-db';
const DB_VERSION = 1;

// Cache size limits
const MAX_DOCUMENTS = 100;
const MAX_ALERTS = 200;
const MAX_SYNC_QUEUE = 500;

let dbInstance: IDBPDatabase<ROISystemsDB> | null = null;

/**
 * Initialize IndexedDB database with schema
 */
export async function initDB(): Promise<IDBPDatabase<ROISystemsDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await openDB<ROISystemsDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Documents store
        if (!db.objectStoreNames.contains('documents')) {
          const documentStore = db.createObjectStore('documents', { keyPath: 'id' });
          documentStore.createIndex('by-updated', 'updatedAt');
          documentStore.createIndex('by-client', 'clientId');
        }

        // Alerts store
        if (!db.objectStoreNames.contains('alerts')) {
          const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
          alertStore.createIndex('by-date', 'date');
          alertStore.createIndex('by-type', 'type');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true
          });
          syncStore.createIndex('by-timestamp', 'timestamp');
          syncStore.createIndex('by-status', 'status');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
      blocked() {
        console.warn('IndexedDB upgrade blocked. Please close other tabs.');
      },
      blocking() {
        console.warn('IndexedDB blocking upgrade. Closing connection.');
        dbInstance?.close();
        dbInstance = null;
      }
    });

    console.log('IndexedDB initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    throw error;
  }
}

/**
 * Get database instance (initialize if needed)
 */
async function getDB(): Promise<IDBPDatabase<ROISystemsDB>> {
  if (!dbInstance) {
    return await initDB();
  }
  return dbInstance;
}

// ============================================================================
// DOCUMENT OPERATIONS
// ============================================================================

/**
 * Cache a document with optional blob data
 */
export async function cacheDocument(document: CachedDocument): Promise<void> {
  const db = await getDB();

  try {
    // Check cache size limit
    const count = await db.count('documents');
    if (count >= MAX_DOCUMENTS) {
      // Remove oldest documents
      await pruneDocumentCache(10);
    }

    await db.put('documents', {
      ...document,
      updatedAt: Date.now()
    });
  } catch (error) {
    console.error('Failed to cache document:', error);
    throw error;
  }
}

/**
 * Get cached document by ID
 */
export async function getCachedDocument(id: string): Promise<CachedDocument | undefined> {
  const db = await getDB();
  return await db.get('documents', id);
}

/**
 * Get all cached documents
 */
export async function getAllCachedDocuments(): Promise<CachedDocument[]> {
  const db = await getDB();
  return await db.getAll('documents');
}

/**
 * Get documents by client ID
 */
export async function getDocumentsByClient(clientId: string): Promise<CachedDocument[]> {
  const db = await getDB();
  return await db.getAllFromIndex('documents', 'by-client', clientId);
}

/**
 * Delete cached document
 */
export async function deleteCachedDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('documents', id);
}

/**
 * Prune oldest cached documents
 */
async function pruneDocumentCache(count: number): Promise<void> {
  const db = await getDB();
  const documents = await db.getAllFromIndex('documents', 'by-updated');

  // Delete oldest entries
  const toDelete = documents.slice(0, count);
  const tx = db.transaction('documents', 'readwrite');

  await Promise.all([
    ...toDelete.map(doc => tx.store.delete(doc.id)),
    tx.done
  ]);
}

// ============================================================================
// ALERT OPERATIONS
// ============================================================================

/**
 * Cache an alert
 */
export async function cacheAlert(alert: CachedAlert): Promise<void> {
  const db = await getDB();

  try {
    // Check cache size limit
    const count = await db.count('alerts');
    if (count >= MAX_ALERTS) {
      await pruneAlertCache(20);
    }

    await db.put('alerts', alert);
  } catch (error) {
    console.error('Failed to cache alert:', error);
    throw error;
  }
}

/**
 * Get all cached alerts
 */
export async function getAllCachedAlerts(): Promise<CachedAlert[]> {
  const db = await getDB();
  const alerts = await db.getAllFromIndex('alerts', 'by-date');
  return alerts.reverse(); // Most recent first
}

/**
 * Get unread alerts count
 */
export async function getUnreadAlertsCount(): Promise<number> {
  const db = await getDB();
  const alerts = await db.getAll('alerts');
  return alerts.filter(alert => !alert.read).length;
}

/**
 * Mark alert as read
 */
export async function markAlertAsRead(id: string): Promise<void> {
  const db = await getDB();
  const alert = await db.get('alerts', id);

  if (alert) {
    alert.read = true;
    await db.put('alerts', alert);
  }
}

/**
 * Delete cached alert
 */
export async function deleteCachedAlert(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('alerts', id);
}

/**
 * Prune oldest alerts
 */
async function pruneAlertCache(count: number): Promise<void> {
  const db = await getDB();
  const alerts = await db.getAllFromIndex('alerts', 'by-date');

  // Delete oldest read alerts first
  const toDelete = alerts
    .filter(alert => alert.read)
    .slice(0, count);

  const tx = db.transaction('alerts', 'readwrite');

  await Promise.all([
    ...toDelete.map(alert => tx.store.delete(alert.id)),
    tx.done
  ]);
}

// ============================================================================
// SYNC QUEUE OPERATIONS
// ============================================================================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item: Omit<SyncQueueItem, 'id'>): Promise<number> {
  const db = await getDB();

  try {
    // Check queue size limit
    const count = await db.count('syncQueue');
    if (count >= MAX_SYNC_QUEUE) {
      await pruneSyncQueue(50);
    }

    const id = await db.add('syncQueue', {
      ...item,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    } as SyncQueueItem);

    return id as number;
  } catch (error) {
    console.error('Failed to add to sync queue:', error);
    throw error;
  }
}

/**
 * Get pending sync queue items
 */
export async function getPendingSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return await db.getAllFromIndex('syncQueue', 'by-status', 'pending');
}

/**
 * Get all sync queue items
 */
export async function getAllSyncItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  return await db.getAll('syncQueue');
}

/**
 * Update sync queue item status
 */
export async function updateSyncItemStatus(
  id: number,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> {
  const db = await getDB();
  const item = await db.get('syncQueue', id);

  if (item) {
    item.status = status;
    if (error) {
      item.error = error;
      item.retryCount += 1;
    }
    await db.put('syncQueue', item);
  }
}

/**
 * Delete sync queue item
 */
export async function deleteSyncItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('syncQueue', id);
}

/**
 * Clear completed sync items
 */
export async function clearCompletedSyncItems(): Promise<void> {
  const db = await getDB();
  const items = await db.getAll('syncQueue');
  const failed = items.filter(item => item.status === 'failed' && item.retryCount >= 3);

  const tx = db.transaction('syncQueue', 'readwrite');

  await Promise.all([
    ...failed.map(item => item.id ? tx.store.delete(item.id) : Promise.resolve()),
    tx.done
  ]);
}

/**
 * Prune old sync queue items
 */
async function pruneSyncQueue(count: number): Promise<void> {
  const db = await getDB();
  const items = await db.getAllFromIndex('syncQueue', 'by-timestamp');

  // Delete oldest failed items
  const toDelete = items
    .filter(item => item.status === 'failed')
    .slice(0, count);

  const tx = db.transaction('syncQueue', 'readwrite');

  await Promise.all([
    ...toDelete.map(item => item.id ? tx.store.delete(item.id) : Promise.resolve()),
    tx.done
  ]);
}

// ============================================================================
// METADATA OPERATIONS
// ============================================================================

/**
 * Set metadata value
 */
export async function setMetadata(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('metadata', {
    key,
    value,
    updatedAt: Date.now()
  });
}

/**
 * Get metadata value
 */
export async function getMetadata<T = any>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const item = await db.get('metadata', key);
  return item?.value as T | undefined;
}

/**
 * Delete metadata
 */
export async function deleteMetadata(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('metadata', key);
}

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

/**
 * Clear all cached data (for logout or reset)
 */
export async function clearAllCache(): Promise<void> {
  const db = await getDB();

  const tx = db.transaction(['documents', 'alerts', 'syncQueue', 'metadata'], 'readwrite');

  await Promise.all([
    tx.objectStore('documents').clear(),
    tx.objectStore('alerts').clear(),
    tx.objectStore('syncQueue').clear(),
    tx.objectStore('metadata').clear(),
    tx.done
  ]);

  console.log('All cache cleared');
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
  documents: number;
  alerts: number;
  syncQueue: number;
  metadata: number;
}> {
  const db = await getDB();

  const [documents, alerts, syncQueue, metadata] = await Promise.all([
    db.count('documents'),
    db.count('alerts'),
    db.count('syncQueue'),
    db.count('metadata')
  ]);

  return { documents, alerts, syncQueue, metadata };
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

// Initialize database on module load
initDB().catch(error => {
  console.error('Failed to initialize IndexedDB on load:', error);
});
