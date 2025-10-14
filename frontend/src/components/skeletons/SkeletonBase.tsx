/**
 * Base Skeleton Component
 *
 * Provides reusable skeleton loading components with shimmer effect
 */

import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animated?: boolean;
}

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = '',
  animated = true
}: SkeletonProps) {
  return (
    <div
      className={`skeleton ${animated ? 'skeleton-animated' : ''} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
      }}
    />
  );
}

/**
 * Skeleton text line
 */
export function SkeletonText({
  lines = 1,
  lastLineWidth = '70%',
  lineHeight = '16px',
  gap = '8px'
}: {
  lines?: number;
  lastLineWidth?: string;
  lineHeight?: string;
  gap?: string;
}) {
  return (
    <div className="skeleton-text" style={{ display: 'flex', flexDirection: 'column', gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={lineHeight}
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton circle (for avatars)
 */
export function SkeletonCircle({
  size = 40,
  className = ''
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius="50%"
      className={className}
    />
  );
}

/**
 * Skeleton rectangle (for images)
 */
export function SkeletonRectangle({
  width = '100%',
  height = '200px',
  borderRadius = '8px',
  className = ''
}: {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}) {
  return (
    <Skeleton
      width={width}
      height={height}
      borderRadius={borderRadius}
      className={className}
    />
  );
}

// Skeleton styles with shimmer animation
const styles = `
.skeleton {
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  display: inline-block;
}

.skeleton-animated {
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  width: 100%;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .skeleton {
    background: linear-gradient(
      90deg,
      #2a2a2a 0%,
      #3a3a3a 50%,
      #2a2a2a 100%
    );
    background-size: 200% 100%;
  }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Skeleton;
