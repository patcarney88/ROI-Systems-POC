/**
 * NotificationPermissionPrompt Component
 * Attractive modal/card prompting users to enable push notifications
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Checkbox,
  FormControlLabel,
  IconButton,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  TrendingUp,
  Assignment,
  HomeWork,
  Email
} from '@mui/icons-material';

interface NotificationPermissionPromptProps {
  open: boolean;
  onClose: () => void;
  onEnable: () => Promise<void>;
  variant?: 'modal' | 'card';
}

const NotificationPermissionPrompt: React.FC<NotificationPermissionPromptProps> = ({
  open,
  onClose,
  onEnable,
  variant = 'modal'
}) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEnable = async () => {
    try {
      setLoading(true);

      if (dontShowAgain) {
        localStorage.setItem('notification_prompt_dismissed', 'true');
      }

      await onEnable();
      onClose();
    } catch (error) {
      console.error('Error enabling notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem('notification_prompt_dismissed', 'true');
    }
    onClose();
  };

  const benefits = [
    {
      icon: <TrendingUp color="primary" />,
      title: 'Business Alerts',
      description: 'Get notified about important client engagement opportunities'
    },
    {
      icon: <Assignment color="primary" />,
      title: 'Document Updates',
      description: 'Never miss expiring documents or important updates'
    },
    {
      icon: <HomeWork color="primary" />,
      title: 'Property Values',
      description: 'Stay informed about property value changes and market trends'
    },
    {
      icon: <Email color="primary" />,
      title: 'Campaign Results',
      description: 'Get instant updates on email campaign performance'
    }
  ];

  if (variant === 'card') {
    return (
      <Card
        sx={{
          maxWidth: 500,
          mx: 'auto',
          my: 2,
          display: open ? 'block' : 'none'
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <NotificationsIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" component="h3" gutterBottom>
                Stay Connected with Push Notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enable notifications to receive real-time updates
              </Typography>
            </Box>
            <IconButton onClick={handleDismiss} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <List dense>
            {benefits.slice(0, 2).map((benefit, index) => (
              <ListItem key={index}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {benefit.icon}
                </ListItemIcon>
                <ListItemText
                  primary={benefit.title}
                  secondary={benefit.description}
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>

        <CardActions sx={{ px: 2, pb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                size="small"
              />
            }
            label={
              <Typography variant="caption" color="text.secondary">
                Don't show again
              </Typography>
            }
          />
          <Box sx={{ flex: 1 }} />
          <Button onClick={handleDismiss} size="small">
            Maybe Later
          </Button>
          <Button
            variant="contained"
            onClick={handleEnable}
            disabled={loading}
            size="small"
          >
            Enable Notifications
          </Button>
        </CardActions>
      </Card>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          p: 1
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pb: 1 }}>
        <NotificationsIcon color="primary" sx={{ fontSize: 32, mr: 1.5 }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" component="span" fontWeight={600}>
            Enable Push Notifications
          </Typography>
        </Box>
        <IconButton onClick={handleDismiss} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body1" color="text.secondary" paragraph>
          Stay on top of your real estate business with instant notifications about:
        </Typography>

        <List>
          {benefits.map((benefit, index) => (
            <ListItem key={index} sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 48 }}>
                {benefit.icon}
              </ListItemIcon>
              <ListItemText
                primary={benefit.title}
                secondary={benefit.description}
                primaryTypographyProps={{ fontWeight: 500, mb: 0.5 }}
              />
            </ListItem>
          ))}
        </List>

        <Box
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 1
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            You can manage notification preferences anytime in settings
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Checkbox
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
          }
          label="Don't show this prompt again"
          sx={{ mt: 2 }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDismiss} size="large">
          Maybe Later
        </Button>
        <Button
          variant="contained"
          onClick={handleEnable}
          disabled={loading}
          size="large"
          startIcon={<NotificationsIcon />}
        >
          {loading ? 'Enabling...' : 'Enable Notifications'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationPermissionPrompt;
