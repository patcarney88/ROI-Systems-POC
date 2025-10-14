/**
 * VirtualList Component
 *
 * High-performance virtualized list for rendering 1000+ items
 * with dynamic heights, scroll restoration, and windowing
 */

import React, { useState, useRef, useEffect, useCallback, ReactNode } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number | ((item: T, index: number) => number);
  renderItem: (item: T, index: number) => ReactNode;
  containerHeight: number;
  overscan?: number;
  scrollRestoration?: boolean;
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

interface VirtualListState {
  scrollTop: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
}

/**
 * VirtualList component for rendering large lists efficiently
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  containerHeight,
  overscan = 3,
  scrollRestoration = true,
  className = '',
  onScroll
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<VirtualListState>({
    scrollTop: 0,
    visibleStartIndex: 0,
    visibleEndIndex: 0
  });

  // Calculate item heights
  const itemHeights = useRef<number[]>([]);
  const itemPositions = useRef<number[]>([]);

  useEffect(() => {
    // Calculate all item heights and positions
    let position = 0;
    itemHeights.current = items.map((item, index) => {
      const height = typeof itemHeight === 'function'
        ? itemHeight(item, index)
        : itemHeight;

      itemPositions.current[index] = position;
      position += height;

      return height;
    });
  }, [items, itemHeight]);

  // Calculate total list height
  const totalHeight = itemHeights.current.reduce((sum, height) => sum + height, 0);

  // Calculate visible range
  const calculateVisibleRange = useCallback((scrollTop: number) => {
    const { current: positions } = itemPositions;

    // Binary search for start index
    let startIndex = 0;
    let endIndex = positions.length - 1;

    while (startIndex <= endIndex) {
      const mid = Math.floor((startIndex + endIndex) / 2);
      const position = positions[mid];

      if (position < scrollTop) {
        startIndex = mid + 1;
      } else {
        endIndex = mid - 1;
      }
    }

    const visibleStartIndex = Math.max(0, startIndex - overscan);

    // Calculate end index
    let currentHeight = 0;
    let visibleEndIndex = visibleStartIndex;

    while (currentHeight < containerHeight && visibleEndIndex < items.length) {
      currentHeight += itemHeights.current[visibleEndIndex];
      visibleEndIndex++;
    }

    visibleEndIndex = Math.min(items.length - 1, visibleEndIndex + overscan);

    return { visibleStartIndex, visibleEndIndex };
  }, [items.length, containerHeight, overscan]);

  // Handle scroll event
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const range = calculateVisibleRange(scrollTop);

    setState({
      scrollTop,
      ...range
    });

    onScroll?.(scrollTop);

    // Save scroll position for restoration
    if (scrollRestoration) {
      sessionStorage.setItem('virtualListScroll', scrollTop.toString());
    }
  }, [calculateVisibleRange, onScroll, scrollRestoration]);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRestoration && containerRef.current) {
      const savedScroll = sessionStorage.getItem('virtualListScroll');
      if (savedScroll) {
        const scrollTop = parseInt(savedScroll, 10);
        containerRef.current.scrollTop = scrollTop;
        const range = calculateVisibleRange(scrollTop);
        setState({ scrollTop, ...range });
      }
    }
  }, [scrollRestoration, calculateVisibleRange]);

  // Initial calculation
  useEffect(() => {
    const range = calculateVisibleRange(state.scrollTop);
    setState(prev => ({ ...prev, ...range }));
  }, [calculateVisibleRange, items.length]);

  // Render visible items
  const visibleItems = [];
  for (let i = state.visibleStartIndex; i <= state.visibleEndIndex; i++) {
    if (i < items.length) {
      const item = items[i];
      const top = itemPositions.current[i];

      visibleItems.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            top: `${top}px`,
            left: 0,
            right: 0,
            height: `${itemHeights.current[i]}px`
          }}
          data-index={i}
        >
          {renderItem(item, i)}
        </div>
      );
    }
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-list ${className}`}
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div
        style={{
          height: `${totalHeight}px`,
          position: 'relative'
        }}
      >
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * Hook for dynamic item height measurement
 */
export function useVirtualListMeasure() {
  const measurementCache = useRef<Map<number, number>>(new Map());

  const measureItem = useCallback((index: number, height: number) => {
    measurementCache.current.set(index, height);
  }, []);

  const getItemHeight = useCallback((index: number, defaultHeight: number) => {
    return measurementCache.current.get(index) || defaultHeight;
  }, []);

  return { measureItem, getItemHeight };
}

/**
 * VirtualGrid component for grid layouts
 */
interface VirtualGridProps<T> {
  items: T[];
  itemWidth: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => ReactNode;
  containerWidth: number;
  containerHeight: number;
  gap?: number;
  overscan?: number;
  className?: string;
}

export function VirtualGrid<T>({
  items,
  itemWidth,
  itemHeight,
  renderItem,
  containerWidth,
  containerHeight,
  gap = 0,
  overscan = 3,
  className = ''
}: VirtualGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate columns
  const columns = Math.floor((containerWidth + gap) / (itemWidth + gap));
  const rows = Math.ceil(items.length / columns);
  const totalHeight = rows * (itemHeight + gap);

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
  const endRow = Math.min(rows, Math.ceil((scrollTop + containerHeight) / (itemHeight + gap)) + overscan);

  const visibleItems = [];
  for (let row = startRow; row < endRow; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col;
      if (index < items.length) {
        const item = items[index];
        const left = col * (itemWidth + gap);
        const top = row * (itemHeight + gap);

        visibleItems.push(
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${left}px`,
              top: `${top}px`,
              width: `${itemWidth}px`,
              height: `${itemHeight}px`
            }}
          >
            {renderItem(item, index)}
          </div>
        );
      }
    }
  }

  return (
    <div
      className={`virtual-grid ${className}`}
      style={{
        height: `${containerHeight}px`,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
        {visibleItems}
      </div>
    </div>
  );
}

/**
 * Infinite scroll loader for VirtualList
 */
interface InfiniteLoaderProps<T> extends VirtualListProps<T> {
  hasMore: boolean;
  loadMore: () => Promise<void>;
  threshold?: number;
  loader?: ReactNode;
}

export function InfiniteVirtualList<T>({
  hasMore,
  loadMore,
  threshold = 200,
  loader,
  onScroll,
  ...virtualListProps
}: InfiniteLoaderProps<T>) {
  const [isLoading, setIsLoading] = useState(false);

  const handleScroll = useCallback(async (scrollTop: number) => {
    onScroll?.(scrollTop);

    const { containerHeight } = virtualListProps;
    const totalHeight = virtualListProps.items.length *
      (typeof virtualListProps.itemHeight === 'number' ? virtualListProps.itemHeight : 100);

    const scrollBottom = scrollTop + containerHeight;

    if (!isLoading && hasMore && scrollBottom >= totalHeight - threshold) {
      setIsLoading(true);
      try {
        await loadMore();
      } finally {
        setIsLoading(false);
      }
    }
  }, [hasMore, loadMore, threshold, isLoading, onScroll, virtualListProps]);

  return (
    <>
      <VirtualList {...virtualListProps} onScroll={handleScroll} />
      {isLoading && (loader || <div className="virtual-list-loader">Loading...</div>)}
    </>
  );
}

// CSS styles
const styles = `
.virtual-list {
  -webkit-overflow-scrolling: touch;
  will-change: transform;
}

.virtual-list-loader {
  padding: 1rem;
  text-align: center;
  color: #666;
}

.virtual-grid {
  -webkit-overflow-scrolling: touch;
  will-change: transform;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default VirtualList;
