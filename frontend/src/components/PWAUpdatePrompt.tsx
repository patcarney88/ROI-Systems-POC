/**
 * PWA Update Prompt Component
 *
 * Detects when a new service worker is available and prompts the user to update.
 * Provides options to reload immediately or skip the current version.
 */

import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  SystemUpdateAlt as UpdateIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface PWAUpdatePromptProps {
  /**
   * Callback when update is applied
   */
  onUpdateApplied?: () => void;

  /**
   * Auto-check interval in milliseconds (default: 60000 - 1 minute)
   */
  checkInterval?: number;
}

/**
 * PWA Update Prompt Component
 *
 * Automatically detects new service worker updates and provides
 * a user-friendly prompt to reload the application.
 */
export const PWAUpdatePrompt: React.FC<PWAUpdatePromptProps> = ({
  onUpdateApplied,
  checkInterval = 60000 // Check every minute
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegistered(registration) {
      console.log('Service Worker registered:', registration);

      // Set up periodic update checks
      if (registration) {
        const intervalId = setInterval(() => {
          registration.update().catch(error => {
            console.error('Failed to check for updates:', error);
          });
        }, checkInterval);

        // Cleanup on unmount
        return () => clearInterval(intervalId);
      }
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
    onNeedRefresh() {
      console.log('New content available, prompting user to refresh');
      setShowPrompt(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    }
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  /**
   * Handle update and reload
   */
  const handleUpdate = async () => {
    setIsUpdating(true);

    try {
      // Update the service worker
      await updateServiceWorker(true);

      // Call the callback if provided
      onUpdateApplied?.();

      // Reload the page to activate the new service worker
      window.location.reload();
    } catch (error) {
      console.error('Failed to update service worker:', error);
      setIsUpdating(false);
    }
  };

  /**
   * Skip this version
   */
  const handleSkip = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  /**
   * Close the prompt temporarily (will show again on next check)
   */
  const handleClose = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        bottom: { xs: 16, sm: 24 }
      }}
    >
      <Alert
        severity="info"
        icon={<UpdateIcon />}
        sx={{
          width: '100%',
          maxWidth: 600,
          alignItems: 'center',
          boxShadow: 3
        }}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
            disabled={isUpdating}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            New Version Available
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            A new version of ROI Systems is available with improvements and bug fixes.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              size="small"
              variant="contained"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleUpdate}
              disabled={isUpdating}
              sx={{
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              {isUpdating ? 'Updating...' : 'Update Now'}
            </Button>

            <Button
              size="small"
              variant="outlined"
              onClick={handleSkip}
              disabled={isUpdating}
              sx={{
                textTransform: 'none'
              }}
            >
              Skip This Version
            </Button>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

/**
 * Hook to manually check for updates
 */
export function useServiceWorkerUpdate() {
  const [isChecking, setIsChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);

  const checkForUpdate = async () => {
    if ('serviceWorker' in navigator) {
      setIsChecking(true);

      try {
        const registration = await navigator.serviceWorker.getRegistration();

        if (registration) {
          await registration.update();

          // Check if there's a waiting service worker
          if (registration.waiting) {
            setHasUpdate(true);
          }
        }
      } catch (error) {
        console.error('Failed to check for updates:', error);
      } finally {
        setIsChecking(false);
      }
    }
  };

  return {
    checkForUpdate,
    isChecking,
    hasUpdate
  };
}

export default PWAUpdatePrompt;
