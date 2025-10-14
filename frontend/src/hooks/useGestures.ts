/**
 * Mobile Gesture Hooks
 * Collection of hooks for handling mobile touch gestures
 */

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Swipe direction enum
 */
export enum SwipeDirection {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  UP = 'UP',
  DOWN = 'DOWN'
}

/**
 * Swipe configuration options
 */
export interface SwipeConfig {
  minSwipeDistance?: number;
  maxSwipeTime?: number;
  preventDefaultTouchMove?: boolean;
}

/**
 * useSwipe - Detects swipe gestures on mobile devices
 * @param config - Configuration options for swipe detection
 * @returns Object with onTouchStart, onTouchMove, onTouchEnd handlers and swipeDirection
 */
export const useSwipe = (config: SwipeConfig = {}) => {
  const {
    minSwipeDistance = 50,
    maxSwipeTime = 300,
    preventDefaultTouchMove = false
  } = config;

  const [swipeDirection, setSwipeDirection] = useState<SwipeDirection | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    setSwipeDirection(null);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (preventDefaultTouchMove) {
      e.preventDefault();
    }
  }, [preventDefaultTouchMove]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;

    // Check if swipe was fast enough
    if (deltaTime > maxSwipeTime) {
      touchStartRef.current = null;
      return;
    }

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine direction based on larger delta
    if (absX > absY && absX > minSwipeDistance) {
      setSwipeDirection(deltaX > 0 ? SwipeDirection.RIGHT : SwipeDirection.LEFT);
    } else if (absY > absX && absY > minSwipeDistance) {
      setSwipeDirection(deltaY > 0 ? SwipeDirection.DOWN : SwipeDirection.UP);
    }

    touchStartRef.current = null;
  }, [minSwipeDistance, maxSwipeTime]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    swipeDirection
  };
};

/**
 * Pinch gesture data
 */
export interface PinchData {
  scale: number;
  center: { x: number; y: number };
}

/**
 * usePinch - Detects pinch-to-zoom gestures
 * @returns Object with touch handlers and pinch data
 */
export const usePinch = () => {
  const [pinchData, setPinchData] = useState<PinchData>({ scale: 1, center: { x: 0, y: 0 } });
  const initialDistanceRef = useRef<number>(0);
  const initialCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getDistance = (touches: React.TouchList): number => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touches: React.TouchList): { x: number; y: number } => {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  };

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialDistanceRef.current = getDistance(e.touches);
      initialCenterRef.current = getCenter(e.touches);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current > 0) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches);
      const currentCenter = getCenter(e.touches);
      const scale = currentDistance / initialDistanceRef.current;

      setPinchData({
        scale,
        center: currentCenter
      });
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    initialDistanceRef.current = 0;
  }, []);

  const resetPinch = useCallback(() => {
    setPinchData({ scale: 1, center: { x: 0, y: 0 } });
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    pinchData,
    resetPinch
  };
};

/**
 * useLongPress - Detects long press gestures
 * @param callback - Function to call on long press
 * @param duration - Duration in ms to trigger long press (default: 500ms)
 * @returns Object with touch handlers
 */
export const useLongPress = (
  callback: () => void,
  duration: number = 500
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    isLongPressRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      callback();
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, duration);
  }, [callback, duration]);

  const onTouchEnd = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const onTouchMove = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    isLongPress: isLongPressRef.current
  };
};

/**
 * useDoubleTap - Detects double tap gestures
 * @param callback - Function to call on double tap
 * @param delay - Maximum delay between taps in ms (default: 300ms)
 * @returns Object with onClick handler
 */
export const useDoubleTap = (
  callback: () => void,
  delay: number = 300
) => {
  const lastTapRef = useRef<number>(0);

  const onClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      e.preventDefault();
      callback();
      // Trigger haptic feedback if available
      if ('vibrate' in navigator) {
        navigator.vibrate([30, 50, 30]);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
    }
  }, [callback, delay]);

  return { onClick };
};

/**
 * useHapticFeedback - Helper hook for haptic feedback
 * @returns Object with haptic feedback functions
 */
export const useHapticFeedback = () => {
  const light = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, []);

  const medium = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(30);
    }
  }, []);

  const heavy = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, []);

  const success = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 30, 10]);
    }
  }, []);

  const error = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 50, 30, 50, 30]);
    }
  }, []);

  const isSupported = 'vibrate' in navigator;

  return {
    light,
    medium,
    heavy,
    success,
    error,
    isSupported
  };
};

/**
 * useTouchScroll - Detects touch scroll gestures with momentum
 * @returns Object with scroll state and handlers
 */
export const useTouchScroll = () => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const lastScrollYRef = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const onScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const currentScrollY = (e.target as HTMLElement).scrollTop;
    const direction = currentScrollY > lastScrollYRef.current ? 'down' : 'up';

    setIsScrolling(true);
    setScrollDirection(direction);
    lastScrollYRef.current = currentScrollY;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  return {
    onScroll,
    isScrolling,
    scrollDirection
  };
};

export default {
  useSwipe,
  usePinch,
  useLongPress,
  useDoubleTap,
  useHapticFeedback,
  useTouchScroll
};
