/**
 * Badge Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired badge with Dark Teal theme and enterprise accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Badge variants using CVA
const badgeVariants = cva(
  // Base styles (Stavvy-inspired)
  [
    'inline-flex items-center gap-1',
    'rounded-full font-medium',
    'transition-all duration-300 ease-smooth',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
  ],
  {
    variants: {
      variant: {
        // Default badge (Dark Teal)
        default: [
          'bg-primary-100 text-primary-800 border border-primary-200',
          'hover:bg-primary-200',
        ],
        
        // Secondary badge
        secondary: [
          'bg-secondary-100 text-secondary-800 border border-secondary-200',
          'hover:bg-secondary-200',
        ],
        
        // Success badge
        success: [
          'bg-success-100 text-success-800 border border-success-200',
          'hover:bg-success-200',
        ],
        
        // Warning badge
        warning: [
          'bg-warning-100 text-warning-800 border border-warning-200',
          'hover:bg-warning-200',
        ],
        
        // Error badge
        error: [
          'bg-error-100 text-error-800 border border-error-200',
          'hover:bg-error-200',
        ],
        
        // Info badge
        info: [
          'bg-info-100 text-info-800 border border-info-200',
          'hover:bg-info-200',
        ],
        
        // Outline badge
        outline: [
          'bg-transparent text-text-primary border border-border-primary',
          'hover:bg-background-secondary',
        ],
        
        // Solid badge (filled)
        solid: [
          'bg-primary-600 text-white border border-primary-600 shadow-sm',
          'hover:bg-primary-700',
        ],
        
        // Solid success
        'solid-success': [
          'bg-success-600 text-white border border-success-600 shadow-sm',
          'hover:bg-success-700',
        ],
        
        // Solid error
        'solid-error': [
          'bg-error-600 text-white border border-error-600 shadow-sm',
          'hover:bg-error-700',
        ],
        
        // Solid warning
        'solid-warning': [
          'bg-warning-600 text-white border border-warning-600 shadow-sm',
          'hover:bg-warning-700',
        ],
        
        // Accent peach (from Stavvy)
        accent: [
          'bg-accent-peach-100 text-accent-peach-800 border border-accent-peach-200',
          'hover:bg-accent-peach-200',
        ],
      },
      
      size: {
        xs: 'px-2 py-0.5 text-xs h-5',
        sm: 'px-2.5 py-0.5 text-xs h-6',
        default: 'px-3 py-1 text-sm h-7', // Stavvy's standard
        lg: 'px-4 py-1.5 text-sm h-8',
        xl: 'px-5 py-2 text-base h-10',
      },
      
      interactive: {
        true: 'cursor-pointer focus:ring-primary-200',
        false: 'cursor-default',
      },
      
      removable: {
        true: 'pr-1',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
      removable: false,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRemove?: () => void;
  removeLabel?: string;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      variant,
      size,
      interactive,
      removable,
      leftIcon,
      rightIcon,
      onRemove,
      removeLabel = 'Remove',
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const isInteractive = interactive || !!onClick;
    const isRemovable = removable || !!onRemove;
    
    return (
      <span
        className={cn(
          badgeVariants({ 
            variant, 
            size, 
            interactive: isInteractive, 
            removable: isRemovable 
          }),
          className
        )}
        ref={ref}
        onClick={onClick}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onKeyDown={
          isInteractive
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onClick?.(e as any);
                }
              }
            : undefined
        }
        {...props}
      >
        {/* Left Icon */}
        {leftIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        )}
        
        {/* Content */}
        <span className="truncate">
          {children}
        </span>
        
        {/* Right Icon */}
        {rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
        
        {/* Remove Button */}
        {isRemovable && onRemove && (
          <button
            type="button"
            className={cn(
              'flex-shrink-0 ml-1 rounded-full p-0.5',
              'hover:bg-black/10 focus:bg-black/10',
              'focus:outline-none focus:ring-1 focus:ring-inset focus:ring-current',
              'transition-colors duration-200'
            )}
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            aria-label={removeLabel}
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status Badge Component (common use case)
interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'active' | 'inactive' | 'pending' | 'approved' | 'rejected' | 'draft' | 'published';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, ...props }) => {
  const getStatusConfig = (status: StatusBadgeProps['status']) => {
    switch (status) {
      case 'active':
      case 'approved':
      case 'published':
        return { variant: 'success' as const, children: status };
      case 'pending':
      case 'draft':
        return { variant: 'warning' as const, children: status };
      case 'inactive':
      case 'rejected':
        return { variant: 'error' as const, children: status };
      default:
        return { variant: 'secondary' as const, children: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge
      variant={config.variant}
      {...props}
    >
      {config.children}
    </Badge>
  );
};

// Priority Badge Component
interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, ...props }) => {
  const getPriorityConfig = (priority: PriorityBadgeProps['priority']) => {
    switch (priority) {
      case 'low':
        return { variant: 'secondary' as const, children: 'Low' };
      case 'medium':
        return { variant: 'info' as const, children: 'Medium' };
      case 'high':
        return { variant: 'warning' as const, children: 'High' };
      case 'urgent':
        return { variant: 'error' as const, children: 'Urgent' };
      default:
        return { variant: 'secondary' as const, children: priority };
    }
  };

  const config = getPriorityConfig(priority);

  return (
    <Badge
      variant={config.variant}
      {...props}
    >
      {config.children}
    </Badge>
  );
};

// Export components
export { Badge, StatusBadge, PriorityBadge, badgeVariants };

// Usage Examples (for Storybook):
/*
// Basic badge
<Badge>New</Badge>

// Success badge
<Badge variant="success">Approved</Badge>

// Badge with icon
<Badge variant="default" leftIcon={<CheckIcon className="h-3 w-3" />}>
  Verified
</Badge>

// Interactive badge
<Badge 
  variant="secondary" 
  interactive 
  onClick={() => console.log('Badge clicked')}
>
  Click me
</Badge>

// Removable badge
<Badge
  variant="secondary"
  removable
  onRemove={() => console.log('Remove tag')}
>
  React
</Badge>

// Status badge
<StatusBadge status="approved" />
<StatusBadge status="pending" />
<StatusBadge status="rejected" />

// Priority badge
<PriorityBadge priority="high" />
<PriorityBadge priority="urgent" />

// Document type badges
<Badge variant="accent" size="sm">PDF</Badge>
<Badge variant="info" size="sm">Contract</Badge>
<Badge variant="success" size="sm">Signed</Badge>

// Large badge with icons
<Badge 
  variant="solid" 
  size="lg"
  leftIcon={<DocumentIcon className="h-4 w-4" />}
  rightIcon={<ArrowRightIcon className="h-4 w-4" />}
>
  View Document
</Badge>

// Badge group
<div className="flex flex-wrap gap-2">
  <Badge variant="secondary" size="sm">3 bed</Badge>
  <Badge variant="secondary" size="sm">2 bath</Badge>
  <Badge variant="secondary" size="sm">1,800 sq ft</Badge>
  <Badge variant="default" size="sm">New Listing</Badge>
</div>
*/