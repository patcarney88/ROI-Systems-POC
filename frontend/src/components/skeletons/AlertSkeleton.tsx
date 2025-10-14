/**
 * Alert Skeleton Component
 */

import React from 'react';
import { Skeleton, SkeletonText, SkeletonCircle } from './SkeletonBase';

export function AlertSkeleton() {
  return (
    <div className="alert-skeleton">
      {/* Alert filters */}
      <div className="alert-filters-skeleton">
        <Skeleton height="40px" width="200px" borderRadius="20px" />
        <Skeleton height="40px" width="150px" borderRadius="20px" />
        <Skeleton height="40px" width="150px" borderRadius="20px" />
      </div>

      {/* Alert stats */}
      <div className="alert-stats-skeleton">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="alert-stat-card">
            <Skeleton height="16px" width="100px" />
            <Skeleton height="36px" width="60px" />
            <Skeleton height="12px" width="80px" />
          </div>
        ))}
      </div>

      {/* Alert list */}
      <div className="alert-list-skeleton">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="alert-card-skeleton">
            <div className="alert-header-skeleton">
              <SkeletonCircle size={48} />
              <div className="alert-title-skeleton">
                <Skeleton height="18px" width="60%" />
                <Skeleton height="14px" width="40%" />
              </div>
              <Skeleton height="24px" width="80px" borderRadius="12px" />
            </div>
            <div className="alert-content-skeleton">
              <SkeletonText lines={2} />
            </div>
            <div className="alert-footer-skeleton">
              <Skeleton height="32px" width="100px" borderRadius="16px" />
              <Skeleton height="32px" width="100px" borderRadius="16px" />
              <Skeleton height="32px" width="80px" borderRadius="16px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = `
.alert-skeleton {
  padding: 2rem;
}

.alert-filters-skeleton {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.alert-stats-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.alert-stat-card {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-list-skeleton {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.alert-card-skeleton {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.alert-header-skeleton {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.alert-title-skeleton {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.alert-content-skeleton {
  margin-bottom: 1rem;
  padding: 1rem 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.alert-footer-skeleton {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default AlertSkeleton;
