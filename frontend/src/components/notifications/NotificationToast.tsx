import React, { useEffect } from 'react';
import { Snackbar, Alert, AlertTitle, IconButton, Box } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { Notification } from '../../types/notification.types';
import { getNotificationIcon } from '../../utils/notificationUtils';

interface NotificationToastProps {
  notification: Notification | null;
  open: boolean;
  onClose: () => void;
  onClick?: (notification: Notification) => void;
  autoHideDuration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  open,
  onClose,
  onClick,
  autoHideDuration = 5000
}) => {
  useEffect(() => {
    if (open && autoHideDuration > 0) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!notification) return null;

  const handleClick = () => {
    if (onClick) {
      onClick(notification);
    }
    onClose();
  };

  const severity =
    notification.priority === 'urgent' ? 'error' :
    notification.priority === 'high' ? 'warning' :
    notification.priority === 'normal' ? 'info' : 'success';

  return (
    <Snackbar
      open={open}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={severity}
        onClick={handleClick}
        sx={{
          cursor: onClick ? 'pointer' : 'default',
          minWidth: 300,
          maxWidth: 400,
          '&:hover': onClick ? {
            boxShadow: 3
          } : {}
        }}
        action={
          <IconButton size="small" onClick={onClose} color="inherit">
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>{notification.title}</AlertTitle>
        <Box sx={{ mt: 0.5 }}>{notification.body}</Box>
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast;
