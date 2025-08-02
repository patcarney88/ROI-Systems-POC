/**
 * Modal Component
 * Designed by: UX Designer + Frontend Specialist + Accessibility Specialist
 * 
 * Stavvy-inspired modal with Dark Teal theme and enterprise accessibility
 */

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Button } from './Button';

// Modal variants using CVA
const modalVariants = cva(
  // Base styles (Stavvy-inspired)
  [
    'relative bg-background-card rounded-2xl shadow-2xl',
    'border border-border-primary',
    'max-h-[90vh] overflow-y-auto',
    'transform transition-all duration-300 ease-smooth',
  ],
  {
    variants: {
      size: {
        xs: 'w-full max-w-xs',
        sm: 'w-full max-w-md',
        default: 'w-full max-w-lg', // Stavvy's standard modal
        lg: 'w-full max-w-2xl',
        xl: 'w-full max-w-4xl',
        '2xl': 'w-full max-w-6xl',
        full: 'w-[95vw] h-[95vh] max-w-none max-h-none',
      },
      
      variant: {
        default: 'bg-background-card',
        success: 'bg-success-50 border-success-200',
        warning: 'bg-warning-50 border-warning-200',
        error: 'bg-error-50 border-error-200',
        primary: 'bg-primary-50 border-primary-200',
      },
      
      centered: {
        true: 'm-auto',
        false: 'mt-16 mx-auto',
      },
    },
    
    defaultVariants: {
      size: 'default',
      variant: 'default',
      centered: true,
    },
  }
);

// Overlay styles
const overlayVariants = cva([
  'fixed inset-0 z-50',
  'bg-background-overlay backdrop-blur-sm',
  'flex items-center justify-center p-4',
  'transition-opacity duration-300 ease-smooth',
]);

export interface ModalProps
  extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  className?: string;
  overlayClassName?: string;
  preventScrollLock?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size,
  variant,
  centered,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  preventScrollLock = false,
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Handle body scroll lock
  useEffect(() => {
    if (!isOpen || preventScrollLock) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen, preventScrollLock]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div
      className={cn(overlayVariants(), overlayClassName)}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      aria-describedby={description ? 'modal-description' : undefined}
    >
      <div
        className={cn(
          modalVariants({ size, variant, centered }),
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex-1">
              {title && (
                <h2 
                  id="modal-title"
                  className="text-xl font-medium text-text-primary leading-tight"
                >
                  {title}
                </h2>
              )}
              {description && (
                <p 
                  id="modal-description"
                  className="mt-2 text-sm text-text-secondary font-light"
                >
                  {description}
                </p>
              )}
            </div>
            
            {showCloseButton && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="ml-4 text-text-tertiary hover:text-text-primary"
                aria-label="Close modal"
              >
                <svg
                  className="h-4 w-4"
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
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={cn(
          'px-6',
          (title || showCloseButton) ? 'pb-6' : 'py-6'
        )}>
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// Modal Header Component
const ModalHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(
    'px-6 pt-6 pb-4',
    'border-b border-border-primary',
    className
  )}>
    {children}
  </div>
);

// Modal Body Component
const ModalBody: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn('px-6 py-4', className)}>
    {children}
  </div>
);

// Modal Footer Component
const ModalFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <div className={cn(
    'px-6 pb-6 pt-4',
    'border-t border-border-primary',
    'flex items-center justify-end gap-3',
    className
  )}>
    {children}
  </div>
);

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'error' | 'warning';
  loading?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  loading = false,
}) => {
  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'primary';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      variant={variant}
      title={title}
    >
      <div className="space-y-6">
        <p className="text-text-secondary leading-relaxed">
          {message}
        </p>
        
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            variant={getConfirmButtonVariant()}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Export components
export {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ConfirmationModal,
  modalVariants,
};

/*
Usage Examples (for Storybook):

// Basic modal
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Upload Document"
  description="Select a file to upload to your property"
>
  <div className="space-y-4">
    <Input label="Document Name" />
    <Input type="file" label="Select File" />
    
    <div className="flex justify-end gap-3 mt-6">
      <Button variant="secondary" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button>Upload</Button>
    </div>
  </div>
</Modal>

// Large modal with custom content
<Modal
  isOpen={isPreviewOpen}
  onClose={() => setIsPreviewOpen(false)}
  size="xl"
  title="Document Preview"
>
  <ModalBody className="p-0">
    <div className="aspect-video bg-gray-100 rounded-lg">
      Document preview content
    </div>
  </ModalBody>
  
  <ModalFooter>
    <Button variant="secondary">Download</Button>
    <Button>Edit</Button>
  </ModalFooter>
</Modal>

// Confirmation modal
<ConfirmationModal
  isOpen={showDeleteConfirm}
  onClose={() => setShowDeleteConfirm(false)}
  onConfirm={handleDelete}
  title="Delete Document"
  message="Are you sure you want to delete this document? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  variant="error"
  loading={isDeleting}
/>

// Success modal
<Modal
  isOpen={showSuccess}
  onClose={() => setShowSuccess(false)}
  variant="success"
  size="sm"
  title="Success!"
>
  <div className="text-center space-y-4">
    <div className="mx-auto w-12 h-12 bg-success-100 rounded-full flex items-center justify-center">
      <CheckIcon className="h-6 w-6 text-success-600" />
    </div>
    <p>Your document has been uploaded successfully.</p>
    <Button fullWidth onClick={() => setShowSuccess(false)}>
      Continue
    </Button>
  </div>
</Modal>
*/