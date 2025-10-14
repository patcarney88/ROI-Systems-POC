/**
 * MobileAlertCard Component
 * Touch-optimized alert card with swipe actions for mobile devices
 */

import React from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import {
  CheckCircle as AcknowledgeIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type {
  Alert,
  AlertPriority,
  AlertType,
  AlertStatus
} from '../../types/alert.types';
import { SwipeableCard, SwipeAction } from './SwipeableCard';

/**
 * Priority color mapping
 */
const priorityColors: Record<AlertPriority, string> = {
  CRITICAL: '#f44336',
  HIGH: '#ff9800',
  MEDIUM: '#2196f3',
  LOW: '#9e9e9e'
};

/**
 * Confidence score color mapping
 */
const getConfidenceColor = (score: number): string => {
  if (score >= 80) return '#4caf50'; // Green
  if (score >= 60) return '#ffeb3b'; // Yellow
  if (score >= 40) return '#ff9800'; // Orange
  return '#f44336'; // Red
};

/**
 * Alert type display names
 */
const alertTypeLabels: Record<AlertType, string> = {
  LIKELY_TO_SELL: 'Likely to Sell',
  LIKELY_TO_BUY: 'Likely to Buy',
  REFINANCE_OPPORTUNITY: 'Refinance',
  INVESTMENT_OPPORTUNITY: 'Investment'
};

/**
 * Alert type icons
 */
const alertTypeIcons: Record<AlertType, string> = {
  LIKELY_TO_SELL: '🏠',
  LIKELY_TO_BUY: '🔑',
  REFINANCE_OPPORTUNITY: '💰',
  INVESTMENT_OPPORTUNITY: '📈'
};

/**
 * Status badge colors
 */
const statusColors: Record<AlertStatus, string> = {
  NEW: '#2196f3',
  ACKNOWLEDGED: '#ff9800',
  IN_PROGRESS: '#9c27b0',
  CONTACTED: '#00bcd4',
  CONVERTED: '#4caf50',
  DISMISSED: '#757575'
};

/**
 * MobileAlertCard Props
 */
export interface MobileAlertCardProps {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onContact?: (alertId: string, method: 'phone' | 'email') => void;
  onDismiss?: (alertId: string) => void;
  onTap?: (alertId: string) => void;
  showSwipeActions?: boolean;
}

/**
 * MobileAlertCard Component
 */
export const MobileAlertCard: React.FC<MobileAlertCardProps> = ({
  alert,
  onAcknowledge,
  onContact,
  onDismiss,
  onTap,
  showSwipeActions = true
}) => {
  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true
  });

  // Define swipe actions
  const leftActions: SwipeAction[] = [];
  const rightActions: SwipeAction[] = [];

  // Left action: Acknowledge (for NEW alerts)
  if (alert.status === 'NEW' && onAcknowledge) {
    leftActions.push({
      icon: <AcknowledgeIcon />,
      label: 'Acknowledge',
      color: '#fff',
      backgroundColor: '#4caf50',
      onClick: () => onAcknowledge(alert.id)
    });
  }

  // Left action: Call
  if (alert.user.phone && onContact) {
    leftActions.push({
      icon: <PhoneIcon />,
      label: 'Call',
      color: '#fff',
      backgroundColor: '#2196f3',
      onClick: () => onContact(alert.id, 'phone')
    });
  }

  // Right action: Email
  if (onContact) {
    rightActions.push({
      icon: <EmailIcon />,
      label: 'Email',
      color: '#fff',
      backgroundColor: '#ff9800',
      onClick: () => onContact(alert.id, 'email')
    });
  }

  // Right action: Dismiss
  if (alert.status !== 'DISMISSED' && onDismiss) {
    rightActions.push({
      icon: <DeleteIcon />,
      label: 'Dismiss',
      color: '#fff',
      backgroundColor: '#f44336',
      onClick: () => onDismiss(alert.id)
    });
  }

  const handleTap = () => {
    onTap?.(alert.id);
  };

  const cardContent = (
    <Card
      onClick={handleTap}
      sx={{
        mb: 1.5,
        borderLeft: `4px solid ${priorityColors[alert.priority]}`,
        cursor: 'pointer',
        '&:active': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <CardContent sx={{ padding: '12px !important' }}>
        {/* Header: Type, Priority, Time */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box display="flex" alignItems="center" gap={0.5}>
            <span style={{ fontSize: '20px' }}>
              {alertTypeIcons[alert.type]}
            </span>
            <Typography variant="subtitle2" fontWeight={600}>
              {alertTypeLabels[alert.type]}
            </Typography>
          </Box>
          <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap" justifyContent="flex-end">
            <Chip
              label={alert.priority}
              size="small"
              sx={{
                backgroundColor: priorityColors[alert.priority],
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.65rem',
                height: 20
              }}
            />
            <Chip
              label={alert.status}
              size="small"
              sx={{
                backgroundColor: statusColors[alert.status],
                color: 'white',
                fontSize: '0.65rem',
                height: 20
              }}
            />
          </Box>
        </Box>

        {/* User Information */}
        <Box display="flex" alignItems="center" mb={1.5} gap={1.5}>
          <Avatar
            sx={{
              bgcolor: priorityColors[alert.priority],
              width: 40,
              height: 40,
              fontSize: '1rem'
            }}
          >
            {alert.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1} minWidth={0}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {alert.user.name}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {alert.user.email}
            </Typography>
            {alert.property && (
              <Typography variant="caption" color="text.secondary" noWrap>
                📍 {alert.property.address}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Confidence Score */}
        <Box mb={1.5}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Confidence
            </Typography>
            <Typography
              variant="caption"
              fontWeight="bold"
              sx={{ color: getConfidenceColor(alert.confidenceScore) }}
            >
              {alert.confidenceScore}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={alert.confidenceScore}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getConfidenceColor(alert.confidenceScore),
                borderRadius: 3
              }
            }}
          />
        </Box>

        {/* Top Contributing Factors */}
        {alert.topFactors && alert.topFactors.length > 0 && (
          <Box mb={1}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              Top Signals:
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
              {alert.topFactors.slice(0, 3).map((factor, index) => (
                <Chip
                  key={index}
                  label={factor}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontSize: '0.65rem',
                    height: 20,
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* Assignment Info */}
        {alert.assignment && (
          <Box mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Assigned to: <strong>{alert.assignment.agentName}</strong>
            </Typography>
          </Box>
        )}

        {/* Timestamp */}
        <Typography variant="caption" color="text.secondary">
          {timeAgo}
        </Typography>
      </CardContent>
    </Card>
  );

  if (!showSwipeActions || (leftActions.length === 0 && rightActions.length === 0)) {
    return cardContent;
  }

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      swipeThreshold={60}
      maxSwipeDistance={200}
    >
      {cardContent}
    </SwipeableCard>
  );
};

/**
 * Compact version for lists
 */
export const MobileAlertCardCompact: React.FC<MobileAlertCardProps> = ({
  alert,
  onTap
}) => {
  const handleTap = () => {
    onTap?.(alert.id);
  };

  return (
    <Card
      onClick={handleTap}
      sx={{
        mb: 1,
        borderLeft: `3px solid ${priorityColors[alert.priority]}`,
        cursor: 'pointer',
        '&:active': {
          backgroundColor: 'action.hover'
        }
      }}
    >
      <CardContent sx={{ padding: '10px !important' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={1} flex={1} minWidth={0}>
            <span style={{ fontSize: '18px' }}>
              {alertTypeIcons[alert.type]}
            </span>
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600} noWrap>
                {alert.user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {alertTypeLabels[alert.type]}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" flexDirection="column" alignItems="flex-end" gap={0.5}>
            <Chip
              label={`${alert.confidenceScore}%`}
              size="small"
              sx={{
                backgroundColor: getConfidenceColor(alert.confidenceScore),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.65rem',
                height: 18
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(alert.createdAt))}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default MobileAlertCard;
