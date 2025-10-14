/**
 * Document Skeleton Component
 */

import React from 'react';
import { Skeleton, SkeletonRectangle } from './SkeletonBase';

export function DocumentSkeleton() {
  return (
    <div className="document-skeleton">
      {/* Header with search and upload */}
      <div className="document-header-skeleton">
        <Skeleton height="48px" width="300px" borderRadius="24px" />
        <Skeleton height="48px" width="140px" borderRadius="24px" />
      </div>

      {/* Document grid */}
      <div className="document-grid-skeleton">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="document-card-skeleton">
            <SkeletonRectangle height="180px" borderRadius="12px" />
            <div className="document-info-skeleton">
              <Skeleton height="18px" width="80%" />
              <Skeleton height="14px" width="60%" />
              <div className="document-meta-skeleton">
                <Skeleton height="12px" width="100px" />
                <Skeleton height="24px" width="70px" borderRadius="12px" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = `
.document-skeleton {
  padding: 2rem;
}

.document-header-skeleton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.document-grid-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.document-card-skeleton {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.document-info-skeleton {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.document-meta-skeleton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default DocumentSkeleton;
