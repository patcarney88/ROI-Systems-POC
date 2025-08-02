/**
 * Button Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired button with Dark Teal theme and enterprise accessibility
 */

import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button variants using CVA (Class Variance Authority)
const buttonVariants = cva(
  // Base styles (Stavvy-inspired)
  [
    'inline-flex items-center justify-center gap-2',
    'rounded-3xl font-light', // Stavvy's fully rounded + light weight
    'text-sm leading-none',
    'transition-all duration-300 ease-smooth', // Stavvy's 0.3s timing
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-95', // Slight press effect
    'select-none',
  ],
  {
    variants: {
      variant: {
        // Primary - Dark Teal (replaces Stavvy's purple)
        primary: [
          'bg-primary-600 text-white shadow-sm',
          'hover:bg-primary-700 hover:scale-105', // Stavvy's scale effect
          'focus-visible:ring-primary-200',
        ],
        
        // Secondary - Outline style
        secondary: [
          'border border-primary-600 text-primary-600 bg-transparent',
          'hover:bg-primary-50 hover:scale-105',
          'focus-visible:ring-primary-200',
        ],
        
        // Tertiary - Ghost style
        tertiary: [
          'text-primary-600 bg-transparent',
          'hover:bg-primary-50 hover:scale-105',
          'focus-visible:ring-primary-200',
        ],
        
        // Success
        success: [
          'bg-success-500 text-white shadow-sm',
          'hover:bg-success-600 hover:scale-105',
          'focus-visible:ring-success-200',
        ],
        
        // Warning
        warning: [
          'bg-warning-500 text-white shadow-sm',
          'hover:bg-warning-600 hover:scale-105',
          'focus-visible:ring-warning-200',
        ],
        
        // Error/Danger
        error: [
          'bg-error-500 text-white shadow-sm',
          'hover:bg-error-600 hover:scale-105',
          'focus-visible:ring-error-200',
        ],
        
        // Neutral/Ghost
        ghost: [
          'text-text-secondary bg-transparent',
          'hover:bg-background-secondary hover:text-text-primary hover:scale-105',
          'focus-visible:ring-secondary-200',
        ],
        
        // Link style
        link: [
          'text-primary-600 underline-offset-4',
          'hover:underline hover:text-primary-700',
          'focus-visible:ring-primary-200',
          'p-0 h-auto', // Remove padding for link style
        ],
      },
      
      size: {
        sm: 'h-8 px-3 text-xs', // Small
        default: 'h-10 px-4 py-2', // Default (Stavvy's 16px 24px)
        lg: 'h-12 px-6 py-3 text-base', // Large
        xl: 'h-14 px-8 py-4 text-lg', // Extra large
        icon: 'h-10 w-10 p-0', // Square icon button
        'icon-sm': 'h-8 w-8 p-0', // Small icon button
        'icon-lg': 'h-12 w-12 p-0', // Large icon button
      },
      
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      
      loading: {
        true: 'pointer-events-none',
        false: '',
      },
    },
    
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
      loading: false,
    },
  }
);

// Loading spinner component
const LoadingSpinner = ({ size = 'default' }: { size?: 'sm' | 'default' | 'lg' }) => {
  const spinnerSizes = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <svg
      className={cn('animate-spin text-current', spinnerSizes[size])}
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    
    // Determine spinner size based on button size
    const getSpinnerSize = () => {
      if (size === 'sm' || size === 'icon-sm') return 'sm';
      if (size === 'lg' || size === 'xl' || size === 'icon-lg') return 'lg';
      return 'default';
    };

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading, className })
        )}
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        {...props}
      >
        {/* Left Icon or Loading Spinner */}
        {loading ? (
          <LoadingSpinner size={getSpinnerSize()} />
        ) : leftIcon ? (
          <span className="flex-shrink-0" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        
        {/* Button Content */}
        <span className={cn(loading && 'opacity-70')}>
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* Right Icon (hidden during loading) */}
        {!loading && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// Export button variants for external use
export { Button, buttonVariants };

// Usage Examples (for Storybook):
/*
// Primary button (default)
<Button>Get Started</Button>

// Secondary button with icon
<Button variant="secondary" leftIcon={<PlusIcon />}>
  Add Document
</Button>

// Loading state
<Button loading loadingText="Uploading...">
  Upload Files
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <SearchIcon />
</Button>

// Full width button
<Button fullWidth>
  Sign In
</Button>

// Link style button
<Button variant="link" asChild>
  <a href="/help">Learn More</a>
</Button>

// Large success button
<Button variant="success" size="lg" rightIcon={<ArrowRightIcon />}>
  Complete Setup
</Button>
*/