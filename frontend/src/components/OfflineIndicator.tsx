/**
 * Offline Indicator Component
 *
 * Displays network status, offline mode indicator, and sync queue status.
 * Provides visual feedback when the application is offline and data is being synced.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Snackbar,
  Alert,
  Box,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  CloudOff as OfflineIcon,
  CloudQueue as SyncIcon,
  CloudDone as OnlineIcon,
  ExpandMore as ExpandIcon,
  Refresh as RetryIcon
} from '@mui/icons-material';
import { getPendingSyncItems, getAllSyncItems } from '../utils/indexedDB';

interface OfflineIndicatorProps {
  /**
   * Callback when user requests manual sync
   */
  onRetrySync?: () => void;

  /**
   * Show detailed sync status
   */
  showDetails?: boolean;
}

/**
 * Offline Indicator Component
 *
 * Monitors network status and displays appropriate indicators.
 * Shows sync queue status and allows manual retry.
 */
export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onRetrySync,
  showDetails = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [showOnlineAlert, setShowOnlineAlert] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalQueueCount, setTotalQueueCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  /**
   * Update sync queue counts
   */
  const updateSyncCounts = useCallback(async () => {
    try {
      const [pending, all] = await Promise.all([
        getPendingSyncItems(),
        getAllSyncItems()
      ]);

      setPendingCount(pending.length);
      setTotalQueueCount(all.length);
    } catch (error) {
      console.error('Failed to get sync counts:', error);
    }
  }, []);

  /**
   * Handle online event
   */
  const handleOnline = useCallback(() => {
    console.log('Network: Online');
    setIsOnline(true);
    setShowOfflineAlert(false);
    setShowOnlineAlert(true);

    // Auto-hide online alert after 3 seconds
    setTimeout(() => setShowOnlineAlert(false), 3000);

    // Update sync counts
    updateSyncCounts();
  }, [updateSyncCounts]);

  /**
   * Handle offline event
   */
  const handleOffline = useCallback(() => {
    console.log('Network: Offline');
    setIsOnline(false);
    setShowOnlineAlert(false);
    setShowOfflineAlert(true);

    // Update sync counts
    updateSyncCounts();
  }, [updateSyncCounts]);

  /**
   * Handle manual sync retry
   */
  const handleRetrySync = async () => {
    if (!isOnline) {
      return;
    }

    setIsSyncing(true);

    try {
      await onRetrySync?.();
      await updateSyncCounts();
    } catch (error) {
      console.error('Sync retry failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Set up network status listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync count update
    updateSyncCounts();

    // Periodic sync count updates (every 30 seconds)
    const intervalId = setInterval(updateSyncCounts, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [handleOnline, handleOffline, updateSyncCounts]);

  // Show offline alert when going offline
  useEffect(() => {
    if (!isOnline) {
      setShowOfflineAlert(true);
    }
  }, [isOnline]);

  return (
    <>
      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 8, sm: 16 } }}
      >
        <Alert
          severity="warning"
          icon={<OfflineIcon />}
          onClose={() => setShowOfflineAlert(false)}
          sx={{
            width: '100%',
            maxWidth: 500,
            boxShadow: 3
          }}
        >
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              You're Offline
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              You can continue working. Changes will sync when you're back online.
            </Typography>

            {showDetails && pendingCount > 0 && (
              <Collapse in={expanded}>
                <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="caption" color="text.secondary">
                    {pendingCount} action{pendingCount !== 1 ? 's' : ''} pending sync
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(pendingCount / Math.max(totalQueueCount, 1)) * 100}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </Collapse>
            )}

            {showDetails && pendingCount > 0 && (
              <Box sx={{ mt: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{
                    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                >
                  <ExpandIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Alert>
      </Snackbar>

      {/* Online Alert */}
      <Snackbar
        open={showOnlineAlert}
        autoHideDuration={3000}
        onClose={() => setShowOnlineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ top: { xs: 8, sm: 16 } }}
      >
        <Alert
          severity="success"
          icon={<OnlineIcon />}
          sx={{
            width: '100%',
            maxWidth: 500,
            boxShadow: 3
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            You're Back Online
          </Typography>
          {pendingCount > 0 && (
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              Syncing {pendingCount} pending change{pendingCount !== 1 ? 's' : ''}...
            </Typography>
          )}
        </Alert>
      </Snackbar>

      {/* Persistent Sync Status Chip (when offline with pending items) */}
      {!isOnline && pendingCount > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300
          }}
        >
          <Chip
            icon={<SyncIcon />}
            label={`${pendingCount} pending`}
            color="warning"
            size="medium"
            sx={{
              boxShadow: 3,
              fontWeight: 600
            }}
          />
        </Box>
      )}

      {/* Sync Status with Retry (when online with pending items) */}
      {isOnline && pendingCount > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1300
          }}
        >
          <Chip
            icon={isSyncing ? <SyncIcon /> : <SyncIcon />}
            label={
              isSyncing
                ? 'Syncing...'
                : `${pendingCount} to sync`
            }
            color={isSyncing ? 'primary' : 'info'}
            size="medium"
            onClick={handleRetrySync}
            deleteIcon={<RetryIcon />}
            onDelete={handleRetrySync}
            disabled={isSyncing}
            sx={{
              boxShadow: 3,
              fontWeight: 600,
              cursor: 'pointer',
              '& .MuiChip-icon': {
                animation: isSyncing ? 'spin 2s linear infinite' : 'none'
              },
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        </Box>
      )}
    </>
  );
};

/**
 * Hook to access network status
 */
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

/**
 * Hook to access sync queue status
 */
export function useSyncStatus() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updateCount = useCallback(async () => {
    try {
      const pending = await getPendingSyncItems();
      setPendingCount(pending.length);
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  }, []);

  useEffect(() => {
    updateCount();

    // Update every 30 seconds
    const intervalId = setInterval(updateCount, 30000);

    return () => clearInterval(intervalId);
  }, [updateCount]);

  return {
    pendingCount,
    isSyncing,
    setIsSyncing,
    updateCount
  };
}

export default OfflineIndicator;
