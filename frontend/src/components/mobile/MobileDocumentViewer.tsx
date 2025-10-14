/**
 * MobileDocumentViewer Component
 * Full-screen document viewer with pinch-to-zoom, swipe navigation, and sharing
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  Box,
  IconButton,
  Typography,
  AppBar,
  Toolbar,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon
} from '@mui/icons-material';
import { usePinch, useSwipe, SwipeDirection, useDoubleTap, useHapticFeedback } from '../../hooks/useGestures';

/**
 * Document interface
 */
export interface Document {
  id: string;
  title: string;
  url: string;
  type: 'pdf' | 'image' | 'document';
  size?: string;
}

/**
 * MobileDocumentViewer Props
 */
export interface MobileDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  documents: Document[];
  initialIndex?: number;
  onDownload?: (document: Document) => void;
  onShare?: (document: Document) => void;
  onPrint?: (document: Document) => void;
}

/**
 * MobileDocumentViewer Component
 */
export const MobileDocumentViewer: React.FC<MobileDocumentViewerProps> = ({
  open,
  onClose,
  documents,
  initialIndex = 0,
  onDownload,
  onShare,
  onPrint
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { light, medium } = useHapticFeedback();

  const currentDocument = documents[currentIndex];
  const hasMultiple = documents.length > 1;

  // Pinch-to-zoom gesture
  const { onTouchStart: onPinchStart, onTouchMove: onPinchMove, onTouchEnd: onPinchEnd, pinchData, resetPinch } = usePinch();

  // Swipe gesture for navigation
  const { onTouchStart: onSwipeStart, onTouchMove: onSwipeMove, onTouchEnd: onSwipeEnd, swipeDirection } = useSwipe({
    minSwipeDistance: 100
  });

  // Double-tap to zoom
  const { onClick: onDoubleTapClick } = useDoubleTap(() => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
    }
  });

  // Reset state when document changes
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setLoading(true);
      resetPinch();
    }
  }, [open, initialIndex, resetPinch]);

  // Apply pinch zoom
  useEffect(() => {
    if (pinchData.scale !== 1) {
      const newScale = Math.max(1, Math.min(4, scale * pinchData.scale));
      setScale(newScale);
      medium();
    }
  }, [pinchData.scale]);

  // Handle swipe navigation
  useEffect(() => {
    if (!swipeDirection || !hasMultiple || scale > 1) return;

    if (swipeDirection === SwipeDirection.LEFT && currentIndex < documents.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setLoading(true);
      light();
    } else if (swipeDirection === SwipeDirection.RIGHT && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setLoading(true);
      light();
    }
  }, [swipeDirection, currentIndex, documents.length, hasMultiple, scale, light]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls) {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls]);

  const handleClose = () => {
    light();
    onClose();
  };

  const handleDownload = () => {
    light();
    onDownload?.(currentDocument);
  };

  const handleShare = async () => {
    light();
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentDocument.title,
          url: currentDocument.url
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      onShare?.(currentDocument);
    }
  };

  const handlePrint = () => {
    light();
    onPrint?.(currentDocument);
    window.print();
  };

  const handleZoomIn = () => {
    light();
    setScale(prev => Math.min(4, prev + 0.5));
  };

  const handleZoomOut = () => {
    light();
    setScale(prev => Math.max(1, prev - 0.5));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      light();
      setCurrentIndex(prev => prev - 1);
      setLoading(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleNext = () => {
    if (currentIndex < documents.length - 1) {
      light();
      setCurrentIndex(prev => prev + 1);
      setLoading(true);
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  const handleImageLoad = () => {
    setLoading(false);
  };

  if (!open || !currentDocument) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      PaperProps={{
        sx: {
          backgroundColor: '#000',
          margin: 0,
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }
      }}
    >
      {/* Top Controls */}
      <Fade in={showControls}>
        <AppBar
          position="fixed"
          sx={{
            top: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            paddingTop: 'env(safe-area-inset-top)'
          }}
        >
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
            <Box sx={{ flex: 1, px: 2 }}>
              <Typography variant="subtitle1" noWrap>
                {currentDocument.title}
              </Typography>
              {hasMultiple && (
                <Typography variant="caption" color="rgba(255,255,255,0.7)">
                  {currentIndex + 1} / {documents.length}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {onDownload && (
                <IconButton color="inherit" onClick={handleDownload}>
                  <DownloadIcon />
                </IconButton>
              )}
              {(navigator.share || onShare) && (
                <IconButton color="inherit" onClick={handleShare}>
                  <ShareIcon />
                </IconButton>
              )}
              {onPrint && (
                <IconButton color="inherit" onClick={handlePrint}>
                  <PrintIcon />
                </IconButton>
              )}
            </Box>
          </Toolbar>
        </AppBar>
      </Fade>

      {/* Document Container */}
      <Box
        ref={containerRef}
        onClick={toggleControls}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            onPinchStart(e);
          } else {
            onSwipeStart(e);
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2) {
            onPinchMove(e);
          } else {
            onSwipeMove(e);
          }
        }}
        onTouchEnd={(e) => {
          onPinchEnd(e);
          onSwipeEnd(e);
        }}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          touchAction: 'none'
        }}
      >
        {loading && (
          <CircularProgress
            size={48}
            sx={{
              color: 'white',
              position: 'absolute',
              zIndex: 1
            }}
          />
        )}

        {currentDocument.type === 'image' ? (
          <img
            ref={imageRef}
            src={currentDocument.url}
            alt={currentDocument.title}
            onLoad={handleImageLoad}
            onClick={onDoubleTapClick}
            style={{
              maxWidth: scale === 1 ? '100%' : 'none',
              maxHeight: scale === 1 ? '100vh' : 'none',
              transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
              transition: 'transform 0.2s ease',
              cursor: scale > 1 ? 'grab' : 'default'
            }}
          />
        ) : (
          <iframe
            src={currentDocument.url}
            title={currentDocument.title}
            onLoad={handleImageLoad}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        )}
      </Box>

      {/* Bottom Controls */}
      {currentDocument.type === 'image' && (
        <Fade in={showControls}>
          <Box
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              padding: 2,
              paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
              backgroundColor: 'rgba(0, 0, 0, 0.8)'
            }}
          >
            {hasMultiple && (
              <IconButton
                color="inherit"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                sx={{ color: 'white' }}
              >
                <PrevIcon />
              </IconButton>
            )}

            <IconButton
              color="inherit"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              sx={{ color: 'white' }}
            >
              <ZoomOutIcon />
            </IconButton>

            <Typography variant="body2" sx={{ color: 'white', minWidth: 50, textAlign: 'center' }}>
              {Math.round(scale * 100)}%
            </Typography>

            <IconButton
              color="inherit"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              sx={{ color: 'white' }}
            >
              <ZoomInIcon />
            </IconButton>

            {hasMultiple && (
              <IconButton
                color="inherit"
                onClick={handleNext}
                disabled={currentIndex === documents.length - 1}
                sx={{ color: 'white' }}
              >
                <NextIcon />
              </IconButton>
            )}
          </Box>
        </Fade>
      )}
    </Dialog>
  );
};

export default MobileDocumentViewer;
