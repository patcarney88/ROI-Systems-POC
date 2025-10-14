/**
 * Property Skeleton Component
 */

import React from 'react';
import { Skeleton, SkeletonRectangle, SkeletonText } from './SkeletonBase';

export function PropertySkeleton() {
  return (
    <div className="property-skeleton">
      {/* Property header */}
      <div className="property-header-skeleton">
        <div className="property-title-skeleton">
          <Skeleton height="32px" width="60%" />
          <Skeleton height="18px" width="40%" />
        </div>
        <Skeleton height="44px" width="160px" borderRadius="22px" />
      </div>

      {/* Property stats */}
      <div className="property-stats-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="property-stat-card">
            <Skeleton height="14px" width="100px" />
            <Skeleton height="28px" width="140px" />
            <Skeleton height="12px" width="80px" />
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="property-charts-skeleton">
        <div className="chart-card-skeleton">
          <Skeleton height="24px" width="200px" />
          <SkeletonRectangle height="300px" borderRadius="8px" />
        </div>
        <div className="chart-card-skeleton">
          <Skeleton height="24px" width="180px" />
          <SkeletonRectangle height="300px" borderRadius="8px" />
        </div>
      </div>

      {/* Timeline section */}
      <div className="timeline-skeleton">
        <Skeleton height="24px" width="180px" />
        <div className="timeline-items-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="timeline-item-skeleton">
              <div className="timeline-dot-skeleton" />
              <div className="timeline-content-skeleton">
                <Skeleton height="16px" width="70%" />
                <SkeletonText lines={2} lineHeight="14px" />
                <Skeleton height="12px" width="100px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = `
.property-skeleton {
  padding: 2rem;
}

.property-header-skeleton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.property-title-skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.property-stats-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.property-stat-card {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.property-charts-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-card-skeleton {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.timeline-skeleton {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.timeline-items-skeleton {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.timeline-item-skeleton {
  display: flex;
  gap: 1.5rem;
  position: relative;
}

.timeline-dot-skeleton {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    #f0f0f0 0%,
    #e0e0e0 50%,
    #f0f0f0 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-content-skeleton {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default PropertySkeleton;
