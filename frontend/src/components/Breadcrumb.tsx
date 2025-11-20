import { LucideIcon, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Breadcrumb.css';

/**
 * Breadcrumb Item Interface
 * @property label - Display text for the breadcrumb item
 * @property path - Route path (optional for last/current item)
 * @property icon - Optional Lucide icon component
 */
export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: LucideIcon;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  ariaLabel?: string;
}

/**
 * Breadcrumb Navigation Component
 *
 * Professional breadcrumb navigation with responsive design.
 * On mobile (<640px), shows only first and last items with ellipsis.
 *
 * @example
 * <Breadcrumb items={[
 *   { label: 'Home', path: '/', icon: Home },
 *   { label: 'Demo', path: '/dashboard' },
 *   { label: 'Title Agent Dashboard' }
 * ]} />
 *
 * Features:
 * - Responsive (hides intermediate items on mobile)
 * - Accessible (proper ARIA labels and semantic HTML)
 * - Clickable links with hover states
 * - Non-clickable current page indicator
 * - Icon support with lucide-react
 * - Matches ROI Systems design tokens
 */
export default function Breadcrumb({
  items,
  className = '',
  ariaLabel = 'breadcrumb'
}: BreadcrumbProps) {
  if (!items || items.length === 0) {
    return null;
  }

  const isLastItem = (index: number) => index === items.length - 1;
  const isFirstItem = (index: number) => index === 0;
  const isIntermediateItem = (index: number) => !isFirstItem(index) && !isLastItem(index);

  return (
    <nav aria-label={ariaLabel} className={`breadcrumb ${className}`}>
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const Icon = item.icon;
          const last = isLastItem(index);
          const first = isFirstItem(index);
          const intermediate = isIntermediateItem(index);

          return (
            <li
              key={`${item.label}-${index}`}
              className={`breadcrumb-item ${intermediate ? 'breadcrumb-item-intermediate' : ''}`}
            >
              {/* Render clickable link for non-last items with path */}
              {!last && item.path ? (
                <>
                  <Link to={item.path} className="breadcrumb-link">
                    {Icon && (
                      <Icon
                        size={16}
                        className="breadcrumb-icon"
                        aria-hidden="true"
                      />
                    )}
                    <span className="breadcrumb-label">{item.label}</span>
                  </Link>
                  <ChevronRight
                    size={16}
                    className="breadcrumb-separator"
                    aria-hidden="true"
                  />
                </>
              ) : last ? (
                // Render current page (non-clickable)
                <span className="breadcrumb-current" aria-current="page">
                  {Icon && (
                    <Icon
                      size={16}
                      className="breadcrumb-icon"
                      aria-hidden="true"
                    />
                  )}
                  <span className="breadcrumb-label">{item.label}</span>
                </span>
              ) : (
                // Render non-clickable intermediate item (edge case without path)
                <>
                  <span className="breadcrumb-text">
                    {Icon && (
                      <Icon
                        size={16}
                        className="breadcrumb-icon"
                        aria-hidden="true"
                      />
                    )}
                    <span className="breadcrumb-label">{item.label}</span>
                  </span>
                  <ChevronRight
                    size={16}
                    className="breadcrumb-separator"
                    aria-hidden="true"
                  />
                </>
              )}
            </li>
          );
        })}

        {/* Mobile ellipsis shown between first and last when intermediate items exist */}
        {items.length > 2 && (
          <li className="breadcrumb-ellipsis" aria-hidden="true">
            <span className="breadcrumb-ellipsis-text">...</span>
            <ChevronRight
              size={16}
              className="breadcrumb-separator"
              aria-hidden="true"
            />
          </li>
        )}
      </ol>
    </nav>
  );
}
