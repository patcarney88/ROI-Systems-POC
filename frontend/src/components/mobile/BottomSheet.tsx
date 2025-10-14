/**
 * BottomSheet Component
 * Native iOS-style bottom sheet with drag-to-dismiss and snap points
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Backdrop } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useHapticFeedback } from '../../hooks/useGestures';

/**
 * Snap point positions (percentage of viewport height)
 */
export enum SnapPoint {
  COLLAPSED = 0.3,
  HALF = 0.5,
  FULL = 0.9
}

/**
 * BottomSheet Props
 */
export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoints?: SnapPoint[];
  initialSnap?: SnapPoint;
  showHandle?: boolean;
  showCloseButton?: boolean;
  closeOnBackdropClick?: boolean;
  disableDrag?: boolean;
  keyboardAware?: boolean;
}

/**
 * BottomSheet Component
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  title,
  snapPoints = [SnapPoint.HALF, SnapPoint.FULL],
  initialSnap = SnapPoint.HALF,
  showHandle = true,
  showCloseButton = true,
  closeOnBackdropClick = true,
  disableDrag = false,
  keyboardAware = true
}) => {
  const [currentSnap, setCurrentSnap] = useState<SnapPoint>(initialSnap);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const startYRef = useRef(0);
  const sheetRef = useRef<HTMLDivElement>(null);
  const { light, medium } = useHapticFeedback();

  // Handle keyboard appearance
  useEffect(() => {
    if (!keyboardAware) return;

    const handleResize = () => {
      if (window.visualViewport) {
        const viewportHeight = window.innerHeight;
        const visualViewportHeight = window.visualViewport.height;
        const kbHeight = viewportHeight - visualViewportHeight;
        setKeyboardHeight(kbHeight);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
    };
  }, [keyboardAware]);

  // Reset to initial snap when opened
  useEffect(() => {
    if (open) {
      setCurrentSnap(initialSnap);
      setDragY(0);
    }
  }, [open, initialSnap]);

  const getSheetHeight = (): number => {
    return window.innerHeight * currentSnap;
  };

  const getTranslateY = (): number => {
    if (!open) return window.innerHeight;
    return Math.max(0, dragY);
  };

  const findNearestSnapPoint = (currentY: number): SnapPoint => {
    const viewportHeight = window.innerHeight;
    const currentPercent = 1 - (currentY / viewportHeight);

    let nearest = snapPoints[0];
    let minDiff = Math.abs(currentPercent - snapPoints[0]);

    snapPoints.forEach(snap => {
      const diff = Math.abs(currentPercent - snap);
      if (diff < minDiff) {
        minDiff = diff;
        nearest = snap;
      }
    });

    return nearest;
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disableDrag) return;

    const touch = e.touches[0];
    startYRef.current = touch.clientY;
    setIsDragging(true);
  }, [disableDrag]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disableDrag || !isDragging) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - startYRef.current;

    // Only allow dragging down
    if (deltaY > 0) {
      setDragY(deltaY);
    }
  }, [disableDrag, isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (disableDrag || !isDragging) return;

    setIsDragging(false);

    const threshold = 100;
    const velocity = dragY / 100; // Simple velocity calculation

    if (dragY > threshold || velocity > 2) {
      // Check if should close or snap to next point
      const currentIndex = snapPoints.indexOf(currentSnap);
      if (currentIndex === 0 || dragY > window.innerHeight * 0.3) {
        // Close sheet
        medium();
        onClose();
      } else {
        // Snap to previous point
        const prevSnap = snapPoints[currentIndex - 1];
        setCurrentSnap(prevSnap);
        light();
      }
    } else {
      // Snap to nearest point
      const nearest = findNearestSnapPoint(getSheetHeight() - dragY);
      if (nearest !== currentSnap) {
        setCurrentSnap(nearest);
        light();
      }
    }

    setDragY(0);
  }, [disableDrag, isDragging, dragY, currentSnap, snapPoints, onClose, medium, light]);

  const handleBackdropClick = () => {
    if (closeOnBackdropClick) {
      light();
      onClose();
    }
  };

  const handleCloseClick = () => {
    light();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <Backdrop
        open={open}
        onClick={handleBackdropClick}
        sx={{
          zIndex: 1200,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          transition: 'opacity 0.3s ease'
        }}
      />

      {/* Bottom Sheet */}
      <Paper
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1300,
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: getSheetHeight(),
          maxHeight: `calc(100vh - env(safe-area-inset-top) - 20px - ${keyboardHeight}px)`,
          transform: `translateY(${getTranslateY()}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom)',
          touchAction: 'none'
        }}
      >
        {/* Drag Handle */}
        {showHandle && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 1,
              paddingBottom: 1,
              cursor: disableDrag ? 'default' : 'grab',
              '&:active': {
                cursor: disableDrag ? 'default' : 'grabbing'
              }
            }}
          >
            <Box
              sx={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: 'divider'
              }}
            />
          </Box>
        )}

        {/* Header */}
        {(title || showCloseButton) && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 2,
              paddingTop: showHandle ? 1 : 2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            {title && (
              <Typography variant="h6" fontWeight={600}>
                {title}
              </Typography>
            )}
            {showCloseButton && (
              <IconButton
                onClick={handleCloseClick}
                size="small"
                sx={{
                  marginLeft: 'auto',
                  '&:active': {
                    transform: 'scale(0.9)'
                  }
                }}
              >
                <CloseIcon />
              </IconButton>
            )}
          </Box>
        )}

        {/* Content */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {children}
        </Box>
      </Paper>
    </>
  );
};

/**
 * BottomSheet with snap point controls
 */
export const BottomSheetWithSnaps: React.FC<BottomSheetProps & {
  onSnapChange?: (snap: SnapPoint) => void;
}> = (props) => {
  const handleSnapChange = (snap: SnapPoint) => {
    props.onSnapChange?.(snap);
  };

  return <BottomSheet {...props} />;
};

export default BottomSheet;
