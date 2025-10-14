/**
 * SwipeableCard Component
 * Card with swipe-to-reveal actions for mobile interfaces
 */

import React, { useState, useRef, useCallback } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { useSwipe, SwipeDirection, useHapticFeedback } from '../../hooks/useGestures';

/**
 * Swipe action configuration
 */
export interface SwipeAction {
  icon: React.ReactElement;
  label: string;
  color: string;
  backgroundColor: string;
  onClick: () => void;
}

/**
 * SwipeableCard Props
 */
export interface SwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  swipeThreshold?: number;
  maxSwipeDistance?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  disabled?: boolean;
}

/**
 * SwipeableCard Component
 */
export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  swipeThreshold = 60,
  maxSwipeDistance = 200,
  onSwipeStart,
  onSwipeEnd,
  disabled = false
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const { light, medium } = useHapticFeedback();

  const hasLeftActions = leftActions.length > 0;
  const hasRightActions = rightActions.length > 0;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;

    startXRef.current = e.touches[0].clientX;
    currentXRef.current = startXRef.current;
    setIsDragging(true);
    onSwipeStart?.();
  }, [disabled, onSwipeStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return;

    currentXRef.current = e.touches[0].clientX;
    const deltaX = currentXRef.current - startXRef.current;

    // Prevent swiping in directions without actions
    if (deltaX > 0 && !hasLeftActions) return;
    if (deltaX < 0 && !hasRightActions) return;

    // Apply resistance curve
    const resistance = 0.7;
    const adjustedDelta = Math.max(
      -maxSwipeDistance,
      Math.min(maxSwipeDistance, deltaX * resistance)
    );

    setTranslateX(adjustedDelta);

    // Haptic feedback at threshold
    if (Math.abs(adjustedDelta) >= swipeThreshold && Math.abs(translateX) < swipeThreshold) {
      light();
    }
  }, [disabled, isDragging, hasLeftActions, hasRightActions, maxSwipeDistance, swipeThreshold, translateX, light]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || !isDragging) return;

    setIsDragging(false);
    startXRef.current = 0;

    const absTranslate = Math.abs(translateX);

    if (absTranslate >= swipeThreshold) {
      // Snap to revealed position
      const snapDistance = Math.min(
        (translateX > 0 ? leftActions.length : rightActions.length) * 70,
        maxSwipeDistance * 0.6
      );
      setTranslateX(translateX > 0 ? snapDistance : -snapDistance);
      medium(); // Haptic feedback on snap
    } else {
      // Snap back to center
      setTranslateX(0);
    }

    onSwipeEnd?.();
  }, [disabled, isDragging, translateX, swipeThreshold, leftActions.length, rightActions.length, maxSwipeDistance, medium, onSwipeEnd]);

  const handleActionClick = useCallback((action: SwipeAction) => {
    medium();
    action.onClick();
    // Reset position after action
    setTimeout(() => setTranslateX(0), 200);
  }, [medium]);

  const resetPosition = useCallback(() => {
    setTranslateX(0);
  }, []);

  // Calculate action visibility and scale
  const getActionOpacity = (index: number, isLeft: boolean): number => {
    const absTranslate = Math.abs(translateX);
    const threshold = swipeThreshold + (index * 20);
    return Math.min(absTranslate / threshold, 1);
  };

  const getActionScale = (index: number): number => {
    const absTranslate = Math.abs(translateX);
    const threshold = swipeThreshold + (index * 20);
    return Math.min(0.7 + (absTranslate / threshold) * 0.3, 1);
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: 'pan-y',
        WebkitUserSelect: 'none',
        userSelect: 'none'
      }}
    >
      {/* Left Actions */}
      {hasLeftActions && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 1,
            gap: 1,
            pointerEvents: translateX > 0 ? 'auto' : 'none'
          }}
        >
          {leftActions.map((action, index) => (
            <Box
              key={index}
              sx={{
                opacity: getActionOpacity(index, true),
                transform: `scale(${getActionScale(index)})`,
                transition: 'all 0.2s ease'
              }}
            >
              <IconButton
                onClick={() => handleActionClick(action)}
                sx={{
                  backgroundColor: action.backgroundColor,
                  color: action.color,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: action.backgroundColor
                  },
                  '&:active': {
                    transform: 'scale(0.9)'
                  }
                }}
              >
                {action.icon}
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Right Actions */}
      {hasRightActions && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            paddingRight: 1,
            gap: 1,
            pointerEvents: translateX < 0 ? 'auto' : 'none'
          }}
        >
          {rightActions.map((action, index) => (
            <Box
              key={index}
              sx={{
                opacity: getActionOpacity(index, false),
                transform: `scale(${getActionScale(index)})`,
                transition: 'all 0.2s ease'
              }}
            >
              <IconButton
                onClick={() => handleActionClick(action)}
                sx={{
                  backgroundColor: action.backgroundColor,
                  color: action.color,
                  width: 48,
                  height: 48,
                  '&:hover': {
                    backgroundColor: action.backgroundColor
                  },
                  '&:active': {
                    transform: 'scale(0.9)'
                  }
                }}
              >
                {action.icon}
              </IconButton>
            </Box>
          ))}
        </Box>
      )}

      {/* Card Content */}
      <Box
        ref={cardRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        sx={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundColor: 'background.paper',
          cursor: disabled ? 'default' : 'grab',
          '&:active': {
            cursor: disabled ? 'default' : 'grabbing'
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

/**
 * SwipeableCard with common action presets
 */
export const SwipeableCardWithActions: React.FC<{
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
  disabled?: boolean;
}> = ({
  children,
  onDelete,
  onArchive,
  onEdit,
  onComplete,
  disabled = false
}) => {
  const leftActions: SwipeAction[] = [];
  const rightActions: SwipeAction[] = [];

  if (onComplete) {
    leftActions.push({
      icon: <span>✓</span>,
      label: 'Complete',
      color: '#fff',
      backgroundColor: '#4caf50',
      onClick: onComplete
    });
  }

  if (onEdit) {
    leftActions.push({
      icon: <span>✏️</span>,
      label: 'Edit',
      color: '#fff',
      backgroundColor: '#2196f3',
      onClick: onEdit
    });
  }

  if (onArchive) {
    rightActions.push({
      icon: <span>📁</span>,
      label: 'Archive',
      color: '#fff',
      backgroundColor: '#ff9800',
      onClick: onArchive
    });
  }

  if (onDelete) {
    rightActions.push({
      icon: <span>🗑️</span>,
      label: 'Delete',
      color: '#fff',
      backgroundColor: '#f44336',
      onClick: onDelete
    });
  }

  return (
    <SwipeableCard
      leftActions={leftActions}
      rightActions={rightActions}
      disabled={disabled}
    >
      {children}
    </SwipeableCard>
  );
};

export default SwipeableCard;
