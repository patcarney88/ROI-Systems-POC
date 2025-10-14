import React from 'react';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon } from '@mui/icons-material';

interface BellIconWithBadgeProps {
  unreadCount: number;
  onClick: () => void;
  color?: 'inherit' | 'primary' | 'secondary' | 'default';
}

const BellIconWithBadge: React.FC<BellIconWithBadgeProps> = ({
  unreadCount,
  onClick,
  color = 'inherit'
}) => {
  return (
    <Tooltip title="Notifications">
      <IconButton onClick={onClick} color={color} aria-label="notifications">
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  );
};

export default BellIconWithBadge;
