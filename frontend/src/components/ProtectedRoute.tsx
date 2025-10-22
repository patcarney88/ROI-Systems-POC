import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requireEmailVerified?: boolean;
  redirectTo?: string;
}

/**
 * Protected Route Component
 *
 * Wraps routes that require authentication and optionally specific roles.
 * Handles automatic redirection to login if not authenticated.
 * Checks token expiration on route change.
 *
 * @param children - Child components to render if authorized
 * @param allowedRoles - Optional array of roles allowed to access this route
 * @param requireEmailVerified - Whether email verification is required
 * @param redirectTo - Custom redirect path (default: /login)
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requireEmailVerified = false,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Check token validity on route change
  useEffect(() => {
    const checkTokenValidity = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return false;

      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        const now = Date.now();

        if (now >= expiresAt) {
          // Token expired
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          return false;
        }

        return true;
      } catch (error) {
        console.error('Token validation error:', error);
        return false;
      }
    };

    if (isAuthenticated && !checkTokenValidity()) {
      // Force re-authentication if token is invalid
      window.location.href = redirectTo;
    }
  }, [location, isAuthenticated, redirectTo]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerified && !user.emailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      // User doesn't have required role
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md">
            <div className="text-6xl text-red-500 mb-4">⛔</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to access this page. This area is restricted to {allowedRoles.join(', ')} users only.
            </p>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // All checks passed, render children
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes
 * Can be used as an alternative to ProtectedRoute component
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    allowedRoles?: UserRole[];
    requireEmailVerified?: boolean;
    redirectTo?: string;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to check if current route is protected
 * Useful for conditional rendering in navigation
 */
export function useProtectedRoute() {
  const { isAuthenticated, user, hasRole } = useAuth();
  const location = useLocation();

  const checkAccess = (allowedRoles?: UserRole[]): boolean => {
    if (!isAuthenticated || !user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return hasRole(allowedRoles);
  };

  const isProtected = (path: string): boolean => {
    // Define protected routes here
    const protectedPaths = [
      '/dashboard',
      '/documents',
      '/clients',
      '/campaigns',
      '/analytics',
      '/profile',
      '/settings'
    ];

    return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
  };

  return {
    checkAccess,
    isProtected,
    currentPathProtected: isProtected(location.pathname)
  };
}