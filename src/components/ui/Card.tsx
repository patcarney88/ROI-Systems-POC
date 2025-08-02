/**
 * Card Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired card with Dark Teal theme and enterprise accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Card variants using CVA
const cardVariants = cva(
  // Base styles (Stavvy-inspired)
  [
    'rounded-xl bg-background-card',
    'border border-border-primary',
    'transition-all duration-300 ease-smooth',
    'overflow-hidden',
  ],
  {
    variants: {
      variant: {
        // Default card
        default: [
          'shadow-card',
          'hover:shadow-lg hover:border-border-secondary',
        ],
        
        // Elevated card
        elevated: [
          'shadow-lg',
          'hover:shadow-xl hover:-translate-y-1',
        ],
        
        // Interactive card (clickable)
        interactive: [
          'shadow-card cursor-pointer',
          'hover:shadow-lg hover:border-primary-200 hover:scale-[1.02]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-2',
          'active:scale-[0.98]',
        ],
        
        // Outline card
        outline: [
          'border-2 border-border-primary shadow-none',
          'hover:border-primary-300 hover:shadow-sm',
        ],
        
        // Ghost card (minimal)
        ghost: [
          'border-0 shadow-none bg-transparent',
          'hover:bg-background-secondary',
        ],
        
        // Success card
        success: [
          'border-success-200 bg-success-50 shadow-sm',
          'hover:shadow-md',
        ],
        
        // Warning card
        warning: [
          'border-warning-200 bg-warning-50 shadow-sm',
          'hover:shadow-md',
        ],
        
        // Error card
        error: [
          'border-error-200 bg-error-50 shadow-sm',
          'hover:shadow-md',
        ],
        
        // Primary themed card
        primary: [
          'border-primary-200 bg-primary-50 shadow-sm',
          'hover:shadow-md hover:border-primary-300',
        ],
      },
      
      size: {
        sm: 'p-4',
        default: 'p-6', // Stavvy's standard spacing
        lg: 'p-8',
        xl: 'p-10',
      },
      
      padding: {
        none: 'p-0',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, padding, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'div' : 'div'; // Could use Slot if needed
    
    return (
      <Comp
        className={cn(
          cardVariants({ 
            variant, 
            size: padding ? undefined : size, 
            padding 
          }),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex flex-col space-y-2 pb-4',
      'border-b border-border-primary',
      className
    )}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

// Card Title Component
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-xl font-medium leading-tight tracking-tight',
      'text-text-primary',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

// Card Description Component  
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      'text-sm text-text-secondary font-light leading-relaxed',
      className
    )}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

// Card Content Component
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('pt-4', className)}
    {...props}
  />
));
CardContent.displayName = 'CardContent';

// Card Footer Component
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-between pt-4',
      'border-t border-border-primary',
      className
    )}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';

// Export all components
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
};

// Usage Examples (for Storybook):
/*
// Basic card
<Card>
  <CardHeader>
    <CardTitle>Property Documents</CardTitle>
    <CardDescription>
      Manage and organize all property-related documents
    </CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here...</p>
  </CardContent>
  <CardFooter>
    <Button variant="secondary">View All</Button>
    <Button>Upload New</Button>
  </CardFooter>
</Card>

// Interactive card
<Card variant="interactive" onClick={() => navigate('/property/123')}>
  <CardHeader>
    <CardTitle>123 Main Street</CardTitle>
    <CardDescription>Single Family Home • $450,000</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center space-x-4">
      <span className="text-sm text-text-secondary">3 bed</span>
      <span className="text-sm text-text-secondary">2 bath</span>
      <span className="text-sm text-text-secondary">1,800 sq ft</span>
    </div>
  </CardContent>
</Card>

// Success card
<Card variant="success">
  <CardHeader>
    <CardTitle>Document Uploaded</CardTitle>
    <CardDescription>
      Contract.pdf has been successfully processed
    </CardDescription>
  </CardHeader>
</Card>

// Elevated card with custom padding
<Card variant="elevated" padding="lg">
  <CardContent padding="none">
    <h2 className="text-2xl font-medium text-text-primary mb-4">
      Analytics Dashboard
    </h2>
    <div className="grid grid-cols-3 gap-6">
      <!-- Analytics content -->
    </div>
  </CardContent>
</Card>
*/