/**
 * MobileHeader Component
 * iOS-style mobile header with back button, search, and collapsing on scroll
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Box,
  Fade,
  useScrollTrigger
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  MoreVert as MoreIcon
} from '@mui/icons-material';
import { useHapticFeedback } from '../../hooks/useGestures';

/**
 * MobileHeader Props
 */
export interface MobileHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  actions?: React.ReactNode;
  onActionClick?: () => void;
  collapseOnScroll?: boolean;
  elevation?: number;
}

/**
 * Hook to detect scroll for collapsing header
 */
function useScrollCollapse(trigger: boolean = true) {
  const scrollTrigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
    target: trigger ? window : undefined
  });

  return scrollTrigger;
}

/**
 * MobileHeader Component
 */
export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  showSearch = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearchChange,
  actions,
  onActionClick,
  collapseOnScroll = false,
  elevation = 1
}) => {
  const navigate = useNavigate();
  const { light } = useHapticFeedback();
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [localSearchValue, setLocalSearchValue] = useState(searchValue);
  const isCollapsed = useScrollCollapse(collapseOnScroll);

  useEffect(() => {
    setLocalSearchValue(searchValue);
  }, [searchValue]);

  const handleBackClick = () => {
    light();
    if (onBackClick) {
      onBackClick();
    } else {
      navigate(-1);
    }
  };

  const handleSearchToggle = () => {
    light();
    setSearchExpanded(!searchExpanded);
    if (searchExpanded) {
      setLocalSearchValue('');
      onSearchChange?.('');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchValue(value);
    onSearchChange?.(value);
  };

  const handleActionClick = () => {
    light();
    onActionClick?.();
  };

  return (
    <AppBar
      position="sticky"
      elevation={isCollapsed ? 0 : elevation}
      sx={{
        transition: 'all 0.3s ease',
        backgroundColor: 'background.paper',
        color: 'text.primary',
        borderBottom: '1px solid',
        borderColor: 'divider',
        // iOS safe-area support
        paddingTop: 'env(safe-area-inset-top)',
        transform: isCollapsed ? 'translateY(-8px)' : 'translateY(0)',
        opacity: isCollapsed ? 0.95 : 1
      }}
    >
      <Toolbar
        sx={{
          minHeight: {
            xs: 56,
            sm: 64
          },
          px: { xs: 1, sm: 2 },
          justifyContent: 'space-between'
        }}
      >
        {/* Left Section: Back Button */}
        {showBackButton && !searchExpanded && (
          <IconButton
            edge="start"
            onClick={handleBackClick}
            sx={{
              mr: 1,
              color: 'primary.main',
              '&:active': {
                transform: 'scale(0.95)'
              }
            }}
          >
            <BackIcon />
          </IconButton>
        )}

        {/* Center Section: Title or Search */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: searchExpanded ? 'flex-start' : 'center',
            transition: 'all 0.3s ease'
          }}
        >
          {searchExpanded ? (
            <Fade in={searchExpanded}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'action.hover',
                  borderRadius: 2,
                  px: 2,
                  py: 0.5,
                  flex: 1,
                  mx: 1
                }}
              >
                <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                <InputBase
                  placeholder={searchPlaceholder}
                  value={localSearchValue}
                  onChange={handleSearchChange}
                  autoFocus
                  fullWidth
                  sx={{
                    fontSize: '1rem',
                    '& input': {
                      padding: '6px 0'
                    }
                  }}
                />
              </Box>
            </Fade>
          ) : (
            <Fade in={!searchExpanded}>
              <Typography
                variant="h6"
                component="h1"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                  textAlign: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100%'
                }}
              >
                {title}
              </Typography>
            </Fade>
          )}
        </Box>

        {/* Right Section: Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {showSearch && (
            <IconButton
              onClick={handleSearchToggle}
              sx={{
                color: searchExpanded ? 'primary.main' : 'text.secondary',
                '&:active': {
                  transform: 'scale(0.95)'
                }
              }}
            >
              {searchExpanded ? <CloseIcon /> : <SearchIcon />}
            </IconButton>
          )}

          {actions || (
            onActionClick && (
              <IconButton
                onClick={handleActionClick}
                sx={{
                  color: 'text.secondary',
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                <MoreIcon />
              </IconButton>
            )
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

/**
 * Sticky Header Spacer
 * Use this component to prevent content from being hidden behind the header
 */
export const HeaderSpacer: React.FC = () => {
  return (
    <Box
      sx={{
        height: {
          xs: 'calc(56px + env(safe-area-inset-top))',
          sm: 'calc(64px + env(safe-area-inset-top))'
        },
        flexShrink: 0
      }}
    />
  );
};

export default MobileHeader;
