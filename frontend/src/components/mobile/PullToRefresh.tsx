/**
 * PullToRefresh Component
 * Native-like pull-to-refresh gesture for mobile devices
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';
import { useHapticFeedback } from '../../hooks/useGestures';

/**
 * PullToRefresh Props
 */
export interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  pullDistance?: number;
  maxPullDistance?: number;
  refreshThreshold?: number;
  disabled?: boolean;
}

/**
 * Refresh states
 */
enum RefreshState {
  IDLE = 'idle',
  PULLING = 'pulling',
  READY = 'ready',
  REFRESHING = 'refreshing',
  COMPLETE = 'complete'
}

/**
 * PullToRefresh Component
 */
export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  pullDistance = 80,
  maxPullDistance = 150,
  refreshThreshold = 70,
  disabled = false
}) => {
  const [refreshState, setRefreshState] = useState<RefreshState>(RefreshState.IDLE);
  const [pullY, setPullY] = useState(0);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { light, success } = useHapticFeedback();

  // Check if container is at the top
  const isAtTop = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop === 0;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshState === RefreshState.REFRESHING) return;
    if (!isAtTop()) return;

    startYRef.current = e.touches[0].clientY;
    currentYRef.current = startYRef.current;
  }, [disabled, refreshState, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || refreshState === RefreshState.REFRESHING) return;
    if (startYRef.current === 0) return;
    if (!isAtTop()) {
      startYRef.current = 0;
      setPullY(0);
      setRefreshState(RefreshState.IDLE);
      return;
    }

    currentYRef.current = e.touches[0].clientY;
    const delta = currentYRef.current - startYRef.current;

    if (delta > 0) {
      // Prevent default scroll behavior
      e.preventDefault();

      // Apply resistance curve for smoother feel
      const resistance = 0.5;
      const adjustedDelta = Math.min(
        delta * resistance,
        maxPullDistance
      );

      setPullY(adjustedDelta);

      if (adjustedDelta >= refreshThreshold && refreshState !== RefreshState.READY) {
        setRefreshState(RefreshState.READY);
        light(); // Haptic feedback when ready
      } else if (adjustedDelta < refreshThreshold && refreshState === RefreshState.READY) {
        setRefreshState(RefreshState.PULLING);
      }
    }
  }, [disabled, refreshState, refreshThreshold, maxPullDistance, light, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || startYRef.current === 0) return;

    startYRef.current = 0;

    if (refreshState === RefreshState.READY) {
      setRefreshState(RefreshState.REFRESHING);
      setPullY(pullDistance);
      success(); // Haptic feedback on refresh trigger

      try {
        await onRefresh();
        setRefreshState(RefreshState.COMPLETE);
        light(); // Success feedback

        // Show complete state briefly
        setTimeout(() => {
          setPullY(0);
          setRefreshState(RefreshState.IDLE);
        }, 500);
      } catch (error) {
        console.error('Refresh failed:', error);
        setPullY(0);
        setRefreshState(RefreshState.IDLE);
      }
    } else {
      // Animate back to original position
      setPullY(0);
      setRefreshState(RefreshState.IDLE);
    }
  }, [disabled, refreshState, pullDistance, onRefresh, success, light]);

  // Get progress percentage
  const getProgress = (): number => {
    return Math.min((pullY / refreshThreshold) * 100, 100);
  };

  // Get rotation for spinner
  const getRotation = (): number => {
    return (pullY / refreshThreshold) * 360;
  };

  return (
    <Box
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: pullY,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingBottom: 2,
          transition: refreshState === RefreshState.IDLE ? 'height 0.3s ease' : 'none',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      >
        {refreshState === RefreshState.COMPLETE ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              color: 'success.main'
            }}
          >
            <CheckIcon />
            <Typography variant="body2" fontWeight={600}>
              Updated
            </Typography>
          </Box>
        ) : refreshState === RefreshState.REFRESHING ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1
            }}
          >
            <CircularProgress size={24} />
            <Typography variant="caption" color="text.secondary">
              Refreshing...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.5,
              opacity: Math.min(pullY / refreshThreshold, 1)
            }}
          >
            <Box
              sx={{
                transform: `rotate(${getRotation()}deg)`,
                transition: 'transform 0.1s ease'
              }}
            >
              <CircularProgress
                variant="determinate"
                value={getProgress()}
                size={24}
                sx={{
                  color: refreshState === RefreshState.READY ? 'primary.main' : 'text.secondary'
                }}
              />
            </Box>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              {refreshState === RefreshState.READY ? 'Release to refresh' : 'Pull to refresh'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box
        sx={{
          transform: `translateY(${pullY}px)`,
          transition: refreshState === RefreshState.IDLE ? 'transform 0.3s ease' : 'none'
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PullToRefresh;
