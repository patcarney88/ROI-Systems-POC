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

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Verify token and get user data
          const response = await fetch('/api/auth/session', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

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
      }

      return data;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server'
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
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call success
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('trustedDevice');
      setUser(null);
    }
  };

  const register = async (data: RegistrationData): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success && result.tokens) {
        localStorage.setItem('accessToken', result.tokens.accessToken);
        localStorage.setItem('refreshToken', result.tokens.refreshToken);
        setUser(result.user);
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Registration failed'
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
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      // Refresh failed, logout user
      await logout();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (data.tokens) {
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
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
