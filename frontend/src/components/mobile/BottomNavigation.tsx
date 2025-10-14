/**
 * BottomNavigation Component
 * Native-like bottom navigation for mobile devices with iOS safe-area support
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  BottomNavigation as MuiBottomNavigation,
  BottomNavigationAction,
  Badge,
  Paper,
  Box
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Notifications as AlertsIcon,
  Description as DocumentsIcon,
  Business as PropertiesIcon,
  MoreHoriz as MoreIcon
} from '@mui/icons-material';
import { useHapticFeedback } from '../../hooks/useGestures';

/**
 * Navigation item interface
 */
export interface NavItem {
  label: string;
  value: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

/**
 * BottomNavigation Props
 */
export interface BottomNavigationProps {
  alertCount?: number;
  onTabChange?: (value: string) => void;
}

/**
 * BottomNavigation Component
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  alertCount = 0,
  onTabChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { light } = useHapticFeedback();

  // Define navigation items
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      value: 'dashboard',
      icon: <DashboardIcon />,
      path: '/'
    },
    {
      label: 'Alerts',
      value: 'alerts',
      icon: <AlertsIcon />,
      path: '/alerts',
      badge: alertCount
    },
    {
      label: 'Documents',
      value: 'documents',
      icon: <DocumentsIcon />,
      path: '/documents'
    },
    {
      label: 'Properties',
      value: 'properties',
      icon: <PropertiesIcon />,
      path: '/properties'
    },
    {
      label: 'More',
      value: 'more',
      icon: <MoreIcon />,
      path: '/more'
    }
  ];

  // Determine active tab based on current path
  const getCurrentValue = (): string => {
    const item = navItems.find(item => item.path === location.pathname);
    return item?.value || 'dashboard';
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    // Haptic feedback on tap
    light();

    const navItem = navItems.find(item => item.value === newValue);
    if (navItem) {
      navigate(navItem.path);
      onTabChange?.(newValue);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: '1px solid',
        borderColor: 'divider',
        // iOS safe-area support
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
      }}
      elevation={3}
    >
      <MuiBottomNavigation
        value={getCurrentValue()}
        onChange={handleChange}
        showLabels
        sx={{
          height: 'auto',
          minHeight: 56,
          '& .MuiBottomNavigationAction-root': {
            minWidth: 60,
            maxWidth: 100,
            padding: '6px 12px 8px',
            transition: 'all 0.2s ease',
            '&.Mui-selected': {
              paddingTop: '6px',
              transform: 'scale(1.05)',
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600
              }
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.7rem',
              marginTop: '4px',
              '&.Mui-selected': {
                fontSize: '0.75rem'
              }
            }
          }
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction
            key={item.value}
            label={item.label}
            value={item.value}
            icon={
              item.badge && item.badge > 0 ? (
                <Badge
                  badgeContent={item.badge}
                  color="error"
                  max={99}
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.65rem',
                      height: '18px',
                      minWidth: '18px',
                      padding: '0 4px'
                    }
                  }}
                >
                  {item.icon}
                </Badge>
              ) : (
                item.icon
              )
            }
            sx={{
              '&.Mui-selected': {
                color: 'primary.main'
              }
            }}
          />
        ))}
      </MuiBottomNavigation>
    </Paper>
  );
};

/**
 * Bottom Navigation Spacer
 * Use this component to add spacing at the bottom of scrollable content
 * to prevent content from being hidden behind the bottom navigation
 */
export const BottomNavSpacer: React.FC = () => {
  return (
    <Box
      sx={{
        height: {
          xs: 'calc(56px + env(safe-area-inset-bottom))',
          sm: 0
        },
        flexShrink: 0
      }}
    />
  );
};

export default BottomNavigation;
