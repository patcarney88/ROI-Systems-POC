/**
 * LazyLoad Component
 *
 * Provides component-level code splitting with Suspense boundaries,
 * dynamic imports, loading skeletons, and error boundaries
 */

import { Suspense, ComponentType, lazy, ReactNode } from 'react';

interface LazyLoadProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary for lazy-loaded components
 */
class LazyErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('LazyLoad Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="lazy-error-fallback">
            <div className="error-content">
              <h3>Failed to load component</h3>
              <p>{this.state.error?.message}</p>
              <button onClick={() => this.setState({ hasError: false })}>
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

/**
 * Default loading fallback
 */
const DefaultLoadingFallback = () => (
  <div className="lazy-loading-fallback">
    <div className="spinner" />
  </div>
);

/**
 * LazyLoad wrapper component
 */
export function LazyLoad({
  children,
  fallback = <DefaultLoadingFallback />,
  errorFallback
}: LazyLoadProps) {
  return (
    <LazyErrorBoundary fallback={errorFallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </LazyErrorBoundary>
  );
}

/**
 * Higher-order component for lazy loading
 * @param importFn - Dynamic import function
 * @param options - Loading and error configurations
 */
export function lazyLoadComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    fallback?: ReactNode;
    errorFallback?: ReactNode;
    preload?: boolean;
  } = {}
): ComponentType<React.ComponentProps<T>> {
  const LazyComponent = lazy(importFn);

  const WrappedComponent = (props: React.ComponentProps<T>) => (
    <LazyLoad fallback={options.fallback} errorFallback={options.errorFallback}>
      <LazyComponent {...props} />
    </LazyLoad>
  );

  // Preload on hover/mount if specified
  if (options.preload) {
    importFn();
  }

  return WrappedComponent;
}

/**
 * Route-based lazy loading with preloading capability
 */
export function lazyLoadRoute<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preloadDelay?: number;
    skeleton?: ReactNode;
  } = {}
): {
  Component: ComponentType<React.ComponentProps<T>>;
  preload: () => void;
} {
  const LazyComponent = lazy(importFn);
  let preloadPromise: Promise<any> | null = null;

  const preload = () => {
    if (!preloadPromise) {
      preloadPromise = importFn();
    }
    return preloadPromise;
  };

  // Auto-preload after delay
  if (options.preloadDelay) {
    setTimeout(preload, options.preloadDelay);
  }

  const Component = (props: React.ComponentProps<T>) => (
    <Suspense fallback={options.skeleton || <DefaultLoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  );

  return { Component, preload };
}

/**
 * Prefetch component on hover/focus
 */
export function usePrefetch<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) {
  let prefetchPromise: Promise<any> | null = null;

  const prefetch = () => {
    if (!prefetchPromise) {
      prefetchPromise = importFn();
    }
  };

  return {
    onMouseEnter: prefetch,
    onFocus: prefetch
  };
}

/**
 * Lazy load multiple components in parallel
 */
export function lazyLoadBatch<T extends Record<string, () => Promise<{ default: ComponentType<any> }>>>(
  imports: T
): {
  [K in keyof T]: ComponentType<any>;
} {
  const components = {} as any;

  Object.keys(imports).forEach(key => {
    components[key] = lazy(imports[key]);
  });

  return components;
}

/**
 * Progressive enhancement loader
 * Loads enhanced version after initial render
 */
export function useProgressiveEnhancement<T extends ComponentType<any>>(
  basicComponent: ComponentType<any>,
  enhancedImport: () => Promise<{ default: T }>,
  delay: number = 1000
) {
  const [Enhanced, setEnhanced] = React.useState<T | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      enhancedImport().then(module => {
        setEnhanced(() => module.default);
      });
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  return Enhanced || basicComponent;
}

// CSS for fallback components
const styles = `
.lazy-loading-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.lazy-loading-fallback .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: lazy-spin 1s linear infinite;
}

@keyframes lazy-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.lazy-error-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
}

.lazy-error-fallback .error-content {
  text-align: center;
  max-width: 400px;
}

.lazy-error-fallback h3 {
  color: #e74c3c;
  margin-bottom: 0.5rem;
}

.lazy-error-fallback p {
  color: #666;
  margin-bottom: 1rem;
}

.lazy-error-fallback button {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.lazy-error-fallback button:hover {
  background: #2980b9;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default LazyLoad;
