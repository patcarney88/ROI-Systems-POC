import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  User,
  AuthCredentials,
  SSOCredentials,
  MFACredentials,
  AuthResponse,
  AuthTokens,
  RegistrationData,
  PasswordResetRequest,
  PasswordReset,
  EmailVerification,
  UserRole,
  PermissionResource,
  PermissionAction
} from '../types/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  loginWithSSO: (credentials: SSOCredentials) => Promise<AuthResponse>;
  verifyMFA: (credentials: MFACredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<AuthResponse>;
  resetPassword: (request: PasswordResetRequest) => Promise<void>;
  changePassword: (reset: PasswordReset) => Promise<void>;
  verifyEmail: (verification: EmailVerification) => Promise<void>;
  refreshToken: () => Promise<AuthTokens>;
  hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Auto refresh token before expiration
  useEffect(() => {
    const checkTokenExpiry = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        // Decode JWT to check expiration (base64 decode)
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000; // Convert to milliseconds
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Refresh if token expires in less than 5 minutes
        if (timeUntilExpiry < 5 * 60 * 1000 && timeUntilExpiry > 0) {
          refreshToken().catch(error => {
            console.error('Token refresh failed:', error);
            logout();
          });
        } else if (timeUntilExpiry <= 0) {
          // Token expired, logout
          logout();
        }
      } catch (error) {
        console.error('Token decode error:', error);
      }
    };

    // Check token expiry every minute
    const interval = setInterval(checkTokenExpiry, 60000);
    return () => clearInterval(interval);
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Get backend URL from env or use default
          const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

          // Verify token and get user profile
          const response = await fetch(`${API_URL}/api/v1/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setUser(data.user);
            }
          } else if (response.status === 401) {
            // Token invalid or expired, try to refresh
            const refreshTokenValue = localStorage.getItem('refreshToken');
            if (refreshTokenValue) {
              try {
                await refreshToken();
              } catch {
                // Refresh failed, clear storage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
              }
            } else {
              // No refresh token, clear storage
              localStorage.removeItem('accessToken');
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies for CSRF
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'LOGIN_ERROR',
            message: data.error?.message || 'Login failed'
          }
        };
      }

      if (data.success) {
        if (data.requiresMFA) {
          // Return response indicating MFA is required
          return data;
        }

        // Store tokens
        if (data.tokens) {
          localStorage.setItem('accessToken', data.tokens.accessToken);
          localStorage.setItem('refreshToken', data.tokens.refreshToken);

          if (credentials.rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
        }

        // Set user
        if (data.user) {
          setUser(data.user);
        }

        // Fetch user profile to ensure we have complete user data
        if (data.tokens?.accessToken) {
          try {
            const profileResponse = await fetch(`${API_URL}/api/v1/auth/profile`, {
              headers: {
                'Authorization': `Bearer ${data.tokens.accessToken}`
              }
            });

            if (profileResponse.ok) {
              const profileData = await profileResponse.json();
              if (profileData.success && profileData.user) {
                setUser(profileData.user);
              }
            }
          } catch (error) {
            console.error('Failed to fetch user profile:', error);
          }
        }
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server. Please check your connection and try again.'
        }
      };
    }
  };

  const loginWithSSO = async (credentials: SSOCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/sso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success && data.tokens) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        setUser(data.user);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'SSO_ERROR',
          message: 'SSO authentication failed'
        }
      };
    }
  };

  const verifyMFA = async (credentials: MFACredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success && data.tokens) {
        localStorage.setItem('accessToken', data.tokens.accessToken);
        localStorage.setItem('refreshToken', data.tokens.refreshToken);
        
        if (credentials.trustDevice) {
          localStorage.setItem('trustedDevice', 'true');
        }
        
        setUser(data.user);
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'MFA_ERROR',
          message: 'MFA verification failed'
        }
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      if (token) {
        await fetch(`${API_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth-related data from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('trustedDevice');
      localStorage.removeItem('selectedRole');

      // Clear user state
      setUser(null);

      // Redirect to landing page
      window.location.href = '/';
    }
  };

  const register = async (data: RegistrationData): Promise<AuthResponse> => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

      const response = await fetch(`${API_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: result.error?.code || 'REGISTRATION_ERROR',
            message: result.error?.message || 'Registration failed'
          }
        };
      }

      if (result.success && result.tokens) {
        localStorage.setItem('accessToken', result.tokens.accessToken);
        localStorage.setItem('refreshToken', result.tokens.refreshToken);
        setUser(result.user);
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server. Please check your connection and try again.'
        }
      };
    }
  };

  const resetPassword = async (request: PasswordResetRequest): Promise<void> => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error('Password reset request failed');
    }
  };

  const changePassword = async (reset: PasswordReset): Promise<void> => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reset)
    });

    if (!response.ok) {
      throw new Error('Password change failed');
    }
  };

  const verifyEmail = async (verification: EmailVerification): Promise<void> => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(verification)
    });

    if (!response.ok) {
      throw new Error('Email verification failed');
    }

    // Update user's emailVerified status
    if (user) {
      setUser({ ...user, emailVerified: true });
    }
  };

  const refreshToken = async (): Promise<AuthTokens> => {
    const refreshTokenValue = localStorage.getItem('refreshToken');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ refreshToken: refreshTokenValue })
    });

    if (!response.ok) {
      // Refresh failed, logout user
      await logout();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();

    if (data.success && data.tokens) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);

      // Update user data if provided
      if (data.user) {
        setUser(data.user);
      }

      return data.tokens;
    }

    throw new Error('Invalid refresh response');
  };

  const hasPermission = (resource: PermissionResource, action: PermissionAction): boolean => {
    if (!user) return false;

    return user.permissions.some(permission => 
      permission.resource === resource && 
      permission.actions.includes(action)
    );
  };

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }

    return user.role === role;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    loginWithSSO,
    verifyMFA,
    logout,
    register,
    resetPassword,
    changePassword,
    verifyEmail,
    refreshToken,
    hasPermission,
    hasRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
