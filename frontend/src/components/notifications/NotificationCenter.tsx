import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Button,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Close as CloseIcon,
  Search as SearchIcon,
  DoneAll as DoneAllIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { Notification, NotificationType } from '../../types/notification.types';
import {
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
  getNotificationUrl
} from '../../utils/notificationUtils';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  open: boolean;
  onClose: () => void;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLoadMore: () => Promise<void>;
  onRefresh: () => Promise<void>;
  hasMore?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  open,
  onClose,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onLoadMore,
  onRefresh,
  hasMore = false
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const filteredNotifications = notifications.filter((n) =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    n.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await onMarkAsRead(notification.id);
      }

      const url = getNotificationUrl(notification);
      onClose();
      navigate(url);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleDelete = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();

    try {
      setDeletingIds((prev) => new Set(prev).add(id));
      await onDelete(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await onMarkAllAsRead();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 400, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider'
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography variant="caption" color="text.secondary">
                {unreadCount} unread
              </Typography>
            )}
          </Box>

          <IconButton onClick={onRefresh} size="small" sx={{ mr: 1 }}>
            <RefreshIcon />
          </IconButton>

          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
          />
        </Box>

        {/* Actions */}
        {unreadCount > 0 && (
          <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
            <Button
              size="small"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              fullWidth
            >
              Mark all as read
            </Button>
          </Box>
        )}

        {/* Notification List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading && notifications.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredNotifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                {searchQuery ? 'No notifications found' : 'No notifications yet'}
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      bgcolor: notification.read ? 'transparent' : 'action.hover',
                      '&:hover': {
                        bgcolor: notification.read ? 'action.hover' : 'action.selected'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: getNotificationColor(notification.type as NotificationType)
                        }}
                      >
                        {notification.icon ? (
                          <img
                            src={notification.icon}
                            alt=""
                            style={{ width: 24, height: 24 }}
                          />
                        ) : (
                          notification.title[0]
                        )}
                      </Avatar>
                    </ListItemAvatar>

                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: notification.read ? 400 : 600,
                              flex: 1
                            }}
                          >
                            {notification.title}
                          </Typography>
                          {notification.priority !== 'normal' && (
                            <Chip
                              label={notification.priority}
                              size="small"
                              color={
                                notification.priority === 'urgent' ? 'error' :
                                notification.priority === 'high' ? 'warning' : 'default'
                              }
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" component="div" sx={{ mt: 0.5 }}>
                            {notification.body}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                            {formatNotificationTime(notification.createdAt)}
                          </Typography>
                        </>
                      }
                    />

                    <IconButton
                      size="small"
                      onClick={(e) => handleDelete(notification.id, e)}
                      disabled={deletingIds.has(notification.id)}
                    >
                      {deletingIds.has(notification.id) ? (
                        <CircularProgress size={20} />
                      ) : (
                        <DeleteIcon fontSize="small" />
                      )}
                    </IconButton>
                  </ListItem>
                  {index < filteredNotifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}

          {/* Load More */}
          {hasMore && !loading && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button onClick={onLoadMore} disabled={loading}>
                Load More
              </Button>
            </Box>
          )}

          {/* Loading More */}
          {loading && notifications.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};

export default NotificationCenter;
