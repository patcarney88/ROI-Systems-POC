/**
 * AlertCard Component
 * Displays individual alert with key information and quick actions
 */

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Box,
  Avatar,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  Phone as PhoneIcon,
  Email as EmailIcon,
  CheckCircle as CheckIcon,
  Cancel as DismissIcon,
  PersonAdd as AssignIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import type {
  Alert,
  AlertPriority,
  AlertType,
  AlertStatus
} from '../types/alert.types';

/**
 * Priority color mapping
 */
const priorityColors: Record<AlertPriority, string> = {
  [AlertPriority.CRITICAL]: '#f44336',
  [AlertPriority.HIGH]: '#ff9800',
  [AlertPriority.MEDIUM]: '#2196f3',
  [AlertPriority.LOW]: '#9e9e9e'
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
  [AlertType.LIKELY_TO_SELL]: 'Likely to Sell',
  [AlertType.LIKELY_TO_BUY]: 'Likely to Buy',
  [AlertType.REFINANCE_OPPORTUNITY]: 'Refinance Opportunity',
  [AlertType.INVESTMENT_OPPORTUNITY]: 'Investment Opportunity'
};

/**
 * Alert type icons (as emoji for simplicity)
 */
const alertTypeIcons: Record<AlertType, string> = {
  [AlertType.LIKELY_TO_SELL]: '🏠',
  [AlertType.LIKELY_TO_BUY]: '🔑',
  [AlertType.REFINANCE_OPPORTUNITY]: '💰',
  [AlertType.INVESTMENT_OPPORTUNITY]: '📈'
};

/**
 * Status badge colors
 */
const statusColors: Record<AlertStatus, string> = {
  [AlertStatus.NEW]: '#2196f3',
  [AlertStatus.ACKNOWLEDGED]: '#ff9800',
  [AlertStatus.IN_PROGRESS]: '#9c27b0',
  [AlertStatus.CONTACTED]: '#00bcd4',
  [AlertStatus.CONVERTED]: '#4caf50',
  [AlertStatus.DISMISSED]: '#757575'
};

/**
 * AlertCard Props
 */
interface AlertCardProps {
  alert: Alert;
  selected?: boolean;
  onAcknowledge?: (alertId: string) => void;
  onContact?: (alertId: string, method: 'phone' | 'email') => void;
  onDismiss?: (alertId: string) => void;
  onAssign?: (alertId: string) => void;
  onViewDetails?: (alertId: string) => void;
}

/**
 * AlertCard Component
 */
export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  selected = false,
  onSelect,
  onAcknowledge,
  onContact,
  onDismiss,
  onAssign,
  onViewDetails
}) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking buttons
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    if (onViewDetails) {
      onViewDetails(alert.id);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(alert.createdAt), {
    addSuffix: true
  });

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        borderLeft: `4px solid ${priorityColors[alert.priority]}`,
        backgroundColor: selected ? '#f5f5f5' : 'white',
        transition: 'all 0.2s ease',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)'
        }
      }}
      onClick={handleCardClick}
    >
      <CardContent>
        {/* Header: Type, Priority, Time */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <span style={{ fontSize: '24px' }}>
              {alertTypeIcons[alert.type]}
            </span>
            <Typography variant="h6" component="div">
              {alertTypeLabels[alert.type]}
            </Typography>
          </Box>
          <Box display="flex" gap={1} alignItems="center">
            <Chip
              label={alert.priority}
              size="small"
              sx={{
                backgroundColor: priorityColors[alert.priority],
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={alert.status}
              size="small"
              sx={{
                backgroundColor: statusColors[alert.status],
                color: 'white'
              }}
            />
          </Box>
        </Box>

        {/* User Information */}
        <Box display="flex" alignItems="center" mb={2} gap={2}>
          <Avatar
            sx={{
              bgcolor: priorityColors[alert.priority],
              width: 48,
              height: 48
            }}
          >
            {alert.user.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight="bold">
              {alert.user.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {alert.user.email}
              {alert.user.phone && ` • ${alert.user.phone}`}
            </Typography>
            {alert.property && (
              <Typography variant="body2" color="text.secondary">
                📍 {alert.property.address}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Confidence Score */}
        <Box mb={2}>
          <Box display="flex" justifyContent="space-between" mb={0.5}>
            <Typography variant="body2" color="text.secondary">
              Confidence Score
            </Typography>
            <Typography
              variant="body2"
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
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getConfidenceColor(alert.confidenceScore),
                borderRadius: 4
              }
            }}
          />
        </Box>

        {/* Top Contributing Factors */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Top Signals:
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={0.5}>
            {alert.topFactors.slice(0, 3).map((factor, index) => (
              <Chip
                key={index}
                label={factor}
                size="small"
                variant="outlined"
                sx={{ fontSize: '0.75rem' }}
              />
            ))}
          </Box>
        </Box>

        {/* Assignment Info */}
        {alert.assignment && (
          <Box mb={1}>
            <Typography variant="body2" color="text.secondary">
              Assigned to: <strong>{alert.assignment.agentName}</strong>
            </Typography>
          </Box>
        )}

        {/* Timestamp */}
        <Typography variant="caption" color="text.secondary">
          Created {timeAgo}
        </Typography>
      </CardContent>

      {/* Action Buttons */}
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box display="flex" gap={1}>
          {alert.status === AlertStatus.NEW && onAcknowledge && (
            <Tooltip title="Acknowledge">
              <Button
                size="small"
                variant="outlined"
                color="primary"
                startIcon={<CheckIcon />}
                onClick={(e) => {
                  e.stopPropagation();
                  onAcknowledge(alert.id);
                }}
              >
                Acknowledge
              </Button>
            </Tooltip>
          )}

          {onContact && (
            <>
              <Tooltip title="Call">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContact(alert.id, 'phone');
                  }}
                  disabled={!alert.user.phone}
                >
                  <PhoneIcon />
                </IconButton>
              </Tooltip>

              <Tooltip title="Email">
                <IconButton
                  size="small"
                  color="primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onContact(alert.id, 'email');
                  }}
                >
                  <EmailIcon />
                </IconButton>
              </Tooltip>
            </>
          )}

          {onAssign && !alert.assignment && (
            <Tooltip title="Assign">
              <IconButton
                size="small"
                color="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssign(alert.id);
                }}
              >
                <AssignIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <Box display="flex" gap={1}>
          {onViewDetails && (
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(alert.id);
                }}
              >
                <InfoIcon />
              </IconButton>
            </Tooltip>
          )}

          {onDismiss && alert.status !== AlertStatus.DISMISSED && (
            <Tooltip title="Dismiss">
              <IconButton
                size="small"
                color="error"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(alert.id);
                }}
              >
                <DismissIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  );
};

export default AlertCard;
