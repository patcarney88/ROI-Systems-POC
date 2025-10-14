/**
 * MobileModal Component
 * Full-screen mobile modal with slide-up animation and iOS-style close button
 */

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Typography,
  Box,
  Slide,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Close as CloseIcon } from '@mui/icons-material';
import { useHapticFeedback } from '../../hooks/useGestures';

/**
 * Slide transition for modal
 */
const SlideTransition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * MobileModal Props
 */
export interface MobileModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  fullScreen?: boolean;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  preventClose?: boolean;
  keyboardAware?: boolean;
}

/**
 * MobileModal Component
 */
export const MobileModal: React.FC<MobileModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  fullScreen = false,
  showCloseButton = true,
  closeOnBackdrop = true,
  preventClose = false,
  keyboardAware = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { light } = useHapticFeedback();

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open, isMobile]);

  const handleClose = (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (preventClose) return;
    if (reason === 'backdropClick' && !closeOnBackdrop) return;

    light();
    onClose();
  };

  const handleCloseClick = () => {
    if (preventClose) return;
    light();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      fullScreen={isMobile || fullScreen}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          margin: isMobile ? 0 : 2,
          borderRadius: isMobile ? 0 : 2,
          maxHeight: isMobile ? '100vh' : 'calc(100vh - 32px)',
          // iOS safe-area support
          paddingTop: isMobile ? 'env(safe-area-inset-top)' : 0,
          paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : 0
        }
      }}
      sx={{
        zIndex: 1400,
        '& .MuiBackdrop-root': {
          backgroundColor: 'rgba(0, 0, 0, 0.6)'
        }
      }}
    >
      {/* Header */}
      {(title || showCloseButton) && (
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            minHeight: 64
          }}
        >
          {title && (
            <Typography variant="h6" component="h2" fontWeight={600}>
              {title}
            </Typography>
          )}
          {showCloseButton && !preventClose && (
            <IconButton
              onClick={handleCloseClick}
              sx={{
                marginLeft: 'auto',
                color: 'text.secondary',
                '&:active': {
                  transform: 'scale(0.9)'
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          )}
        </DialogTitle>
      )}

      {/* Content */}
      <DialogContent
        sx={{
          padding: 2,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1
        }}
      >
        {children}
      </DialogContent>

      {/* Actions */}
      {actions && (
        <DialogActions
          sx={{
            padding: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            gap: 1,
            '& > :not(:first-of-type)': {
              marginLeft: 0
            }
          }}
        >
          {actions}
        </DialogActions>
      )}
    </Dialog>
  );
};

/**
 * MobileModal with confirmation dialog
 */
export const MobileConfirmModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'error' | 'warning';
}> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary'
}) => {
  const { medium } = useHapticFeedback();

  const handleConfirm = () => {
    medium();
    onConfirm();
    onClose();
  };

  return (
    <MobileModal
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Box
            component="button"
            onClick={onClose}
            sx={{
              flex: 1,
              padding: '12px 24px',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              backgroundColor: 'background.paper',
              color: 'text.primary',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              '&:active': {
                transform: 'scale(0.98)'
              }
            }}
          >
            {cancelText}
          </Box>
          <Box
            component="button"
            onClick={handleConfirm}
            sx={{
              flex: 1,
              padding: '12px 24px',
              border: 'none',
              borderRadius: 2,
              backgroundColor:
                confirmColor === 'error'
                  ? 'error.main'
                  : confirmColor === 'warning'
                  ? 'warning.main'
                  : 'primary.main',
              color: 'white',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              '&:active': {
                transform: 'scale(0.98)',
                opacity: 0.9
              }
            }}
          >
            {confirmText}
          </Box>
        </>
      }
    >
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </MobileModal>
  );
};

/**
 * MobileModal with loading state
 */
export const MobileLoadingModal: React.FC<{
  open: boolean;
  message?: string;
}> = ({ open, message = 'Loading...' }) => {
  return (
    <MobileModal
      open={open}
      onClose={() => {}}
      preventClose={true}
      showCloseButton={false}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 4,
          gap: 2
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            border: '3px solid',
            borderColor: 'primary.main',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            '@keyframes spin': {
              '0%': { transform: 'rotate(0deg)' },
              '100%': { transform: 'rotate(360deg)' }
            }
          }}
        />
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </MobileModal>
  );
};

export default MobileModal;
