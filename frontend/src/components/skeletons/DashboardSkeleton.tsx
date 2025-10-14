/**
 * Dashboard Skeleton Component
 */

import React from 'react';
import { Skeleton, SkeletonText, SkeletonCircle, SkeletonRectangle } from './SkeletonBase';

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {/* Stats cards */}
      <div className="stats-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="stat-card-skeleton">
            <SkeletonText lines={1} lineHeight="14px" />
            <Skeleton height="32px" width="80px" />
            <Skeleton height="12px" width="120px" />
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="content-grid">
        {/* Recent documents section */}
        <div className="section-skeleton">
          <div className="section-header">
            <Skeleton height="24px" width="180px" />
            <Skeleton height="36px" width="120px" borderRadius="18px" />
          </div>
          <div className="documents-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="document-item-skeleton">
                <SkeletonRectangle width="40px" height="40px" borderRadius="8px" />
                <div className="document-content">
                  <Skeleton height="16px" width="70%" />
                  <SkeletonText lines={2} lineHeight="12px" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent clients section */}
        <div className="section-skeleton">
          <div className="section-header">
            <Skeleton height="24px" width="160px" />
            <Skeleton height="36px" width="100px" borderRadius="18px" />
          </div>
          <div className="clients-list">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="client-item-skeleton">
                <SkeletonCircle size={48} />
                <div className="client-content">
                  <Skeleton height="16px" width="60%" />
                  <Skeleton height="12px" width="40%" />
                  <Skeleton height="20px" width="50px" borderRadius="10px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = `
.dashboard-skeleton {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card-skeleton {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.section-skeleton {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.document-item-skeleton {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #fafafa;
}

.document-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.clients-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.client-item-skeleton {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  background: #fafafa;
  align-items: center;
}

.client-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default DashboardSkeleton;
