/**
 * Input Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired input with Dark Teal theme and enterprise accessibility
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Input variants using CVA
const inputVariants = cva(
  // Base styles (Stavvy-inspired)
  [
    'flex w-full rounded-lg border transition-all duration-300 ease-smooth',
    'text-sm font-light placeholder:text-text-tertiary',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium',
  ],
  {
    variants: {
      variant: {
        // Default input
        default: [
          'border-border-primary bg-background-primary',
          'focus-visible:border-primary-600 focus-visible:ring-primary-200',
          'hover:border-border-secondary',
        ],
        
        // Filled input
        filled: [
          'border-transparent bg-background-secondary',
          'focus-visible:border-primary-600 focus-visible:ring-primary-200 focus-visible:bg-background-primary',
          'hover:bg-background-tertiary',
        ],
        
        // Underlined input
        underlined: [
          'border-0 border-b-2 border-border-primary bg-transparent rounded-none px-0',
          'focus-visible:border-primary-600 focus-visible:ring-0',
          'hover:border-border-secondary',
        ],
        
        // Success state
        success: [
          'border-success-500 bg-success-50',
          'focus-visible:border-success-600 focus-visible:ring-success-200',
        ],
        
        // Warning state
        warning: [
          'border-warning-500 bg-warning-50',
          'focus-visible:border-warning-600 focus-visible:ring-warning-200',
        ],
        
        // Error state
        error: [
          'border-error-500 bg-error-50',
          'focus-visible:border-error-600 focus-visible:ring-error-200',
        ],
        
        // Ghost input (minimal)
        ghost: [
          'border-transparent bg-transparent',
          'focus-visible:border-primary-600 focus-visible:ring-primary-200 focus-visible:bg-background-primary',
          'hover:bg-background-secondary',
        ],
      },
      
      size: {
        sm: 'h-8 px-3 py-1 text-xs',
        default: 'h-10 px-4 py-2', // Stavvy's standard height
        lg: 'h-12 px-4 py-3 text-base',
        xl: 'h-14 px-6 py-4 text-lg',
      },
    },
    
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      type = 'text',
      label,
      helperText,
      errorMessage,
      leftIcon,
      rightIcon,
      loading = false,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!errorMessage;
    const inputVariant = hasError ? 'error' : variant;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2',
              'text-text-primary',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
              {leftIcon}
            </div>
          )}

          {/* Input Field */}
          <input
            id={inputId}
            type={type}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              loading && 'pr-10',
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            aria-invalid={hasError}
            aria-describedby={
              hasError 
                ? `${inputId}-error` 
                : helperText 
                ? `${inputId}-helper` 
                : undefined
            }
            {...props}
          />

          {/* Right Icon or Loading Spinner */}
          {(rightIcon || loading) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-tertiary">
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4"
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
              ) : (
                rightIcon
              )}
            </div>
          )}
        </div>

        {/* Helper Text or Error Message */}
        {(helperText || errorMessage) && (
          <p
            id={hasError ? `${inputId}-error` : `${inputId}-helper`}
            className={cn(
              'mt-2 text-xs',
              hasError
                ? 'text-error-600'
                : 'text-text-secondary',
              disabled && 'opacity-50'
            )}
            role={hasError ? 'alert' : undefined}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    helperText?: string;
    errorMessage?: string;
    variant?: VariantProps<typeof inputVariants>['variant'];
  }
>(
  (
    {
      className,
      variant = 'default',
      label,
      helperText,
      errorMessage,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = !!errorMessage;
    const textareaVariant = hasError ? 'error' : variant;

    return (
      <div className="w-full">
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium mb-2',
              'text-text-primary',
              disabled && 'opacity-50'
            )}
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          className={cn(
            inputVariants({ variant: textareaVariant, size: 'default' }),
            'min-h-[80px] py-3 resize-vertical',
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError 
              ? `${textareaId}-error` 
              : helperText 
              ? `${textareaId}-helper` 
              : undefined
          }
          {...props}
        />

        {/* Helper Text or Error Message */}
        {(helperText || errorMessage) && (
          <p
            id={hasError ? `${textareaId}-error` : `${textareaId}-helper`}
            className={cn(
              'mt-2 text-xs',
              hasError
                ? 'text-error-600'
                : 'text-text-secondary',
              disabled && 'opacity-50'
            )}
            role={hasError ? 'alert' : undefined}
          >
            {errorMessage || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Export components
export { Input, Textarea, inputVariants };

// Usage Examples (for Storybook):
/*
// Basic input
<Input 
  label="Email Address"
  placeholder="Enter your email"
  type="email"
/>

// Input with icon and helper text
<Input
  label="Search Documents"
  placeholder="Type to search..."
  leftIcon={<SearchIcon className="h-4 w-4" />}
  helperText="Search by filename, content, or tags"
/>

// Error state
<Input
  label="Password"
  type="password"
  errorMessage="Password must be at least 8 characters"
  rightIcon={<EyeIcon className="h-4 w-4" />}
/>

// Loading state
<Input
  label="Property Address"
  placeholder="123 Main Street..."
  loading={true}
/>

// Filled variant
<Input
  variant="filled"
  placeholder="Search properties..."
  leftIcon={<SearchIcon className="h-4 w-4" />}
/>

// Textarea
<Textarea
  label="Property Description"
  placeholder="Describe the property..."
  helperText="Include key features and selling points"
  rows={4}
/>

// Large input
<Input
  size="lg"
  placeholder="Property Title"
  variant="filled"
/>
*/