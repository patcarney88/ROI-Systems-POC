import toast from 'react-hot-toast';

/**
 * Toast Notification Utilities
 * Centralized notification system using react-hot-toast
 */

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right'
};

/**
 * Success notification
 * Use for successful operations (save, create, update, delete)
 */
export function showSuccess(message: string, options?: ToastOptions): void {
  toast.success(message, {
    ...defaultOptions,
    ...options,
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      fontWeight: '500'
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981'
    }
  });
}

/**
 * Error notification
 * Use for errors and failed operations
 */
export function showError(message: string, options?: ToastOptions): void {
  toast.error(message, {
    ...defaultOptions,
    duration: 5000, // Errors shown longer
    ...options,
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      fontWeight: '500'
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444'
    }
  });
}

/**
 * Warning notification
 * Use for warnings and important notices
 */
export function showWarning(message: string, options?: ToastOptions): void {
  toast(message, {
    ...defaultOptions,
    ...options,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      fontWeight: '500'
    }
  });
}

/**
 * Info notification
 * Use for general information
 */
export function showInfo(message: string, options?: ToastOptions): void {
  toast(message, {
    ...defaultOptions,
    ...options,
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
      fontWeight: '500'
    }
  });
}

/**
 * Loading notification with promise
 * Automatically shows loading, success, and error states
 */
export function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
  options?: ToastOptions
): Promise<T> {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error
    },
    {
      ...defaultOptions,
      ...options,
      style: {
        padding: '16px',
        borderRadius: '8px',
        fontWeight: '500'
      }
    }
  );
}

/**
 * Custom notification with icon
 */
export function showCustom(message: string, icon: string, options?: ToastOptions): void {
  toast(message, {
    ...defaultOptions,
    ...options,
    icon,
    style: {
      padding: '16px',
      borderRadius: '8px',
      fontWeight: '500'
    }
  });
}

/**
 * Dismiss a specific toast or all toasts
 */
export function dismissToast(toastId?: string): void {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts(): void {
  toast.dismiss();
}

// Convenience exports for common use cases
export const notify = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  promise: showPromiseToast,
  custom: showCustom,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts
};

export default notify;
