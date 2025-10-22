import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../hooks/useAuth';
import type { UserRole, AuthProvider } from '../types/auth';
import { ROLE_NAMES, ROLE_DESCRIPTIONS, ROLE_ICONS } from '../types/auth';
import { loginSchema, type LoginFormData } from '../schemas/validation';
import { handleApiError } from '../utils/error-handler';
import { notify } from '../utils/notifications';

export default function Login() {
  const navigate = useNavigate();
  const { login, loginWithSSO } = useAuth();

  const [step, setStep] = useState<'role' | 'credentials' | 'mfa'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roles: UserRole[] = ['title_agent', 'realtor', 'loan_officer', 'homeowner'];

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const email = watch('email');
  const password = watch('password');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('credentials');
    // Remember role selection
    localStorage.setItem('selectedRole', role);
  };

  const onSubmit = async (data: LoginFormData) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe
      });

      if (response.success) {
        if (response.requiresMFA) {
          setStep('mfa');
        } else {
          notify.success('Login successful!');
          // Redirect based on role
          redirectToRoleDashboard(response.user?.role || selectedRole);
        }
      } else {
        const errorMessage = response.error?.message || 'Login failed';
        setError(errorMessage);
        notify.error(errorMessage);
      }
    } catch (err) {
      handleApiError(err, 'Login failed. Please try again.');
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // MFA verification would be implemented here
      // For now, just redirect
      redirectToRoleDashboard(selectedRole);
    } catch (err) {
      setError('MFA verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOLogin = async (provider: AuthProvider) => {
    setIsLoading(true);
    try {
      // SSO login would redirect to provider
      // This is a placeholder
      window.location.href = `/api/auth/sso/${provider}`;
    } catch (err) {
      setError(`${provider} login failed`);
      setIsLoading(false);
    }
  };

  const redirectToRoleDashboard = (role: UserRole | null) => {
    switch (role) {
      case 'title_agent':
        navigate('/dashboard/title-agent');
        break;
      case 'realtor':
      case 'loan_officer':
        navigate('/dashboard/realtor');
        break;
      case 'homeowner':
        navigate('/dashboard/homeowner');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>ROI Systems</h1>
        </div>

        {/* Role Selection */}
        {step === 'role' && (
          <div className="auth-content">
            <h2>Welcome Back</h2>
            <p className="auth-subtitle">Select your role to continue</p>

            <div className="role-grid">
              {roles.map(role => (
                <button
                  key={role}
                  className="role-card"
                  onClick={() => handleRoleSelect(role)}
                >
                  <div className="role-icon">{ROLE_ICONS[role]}</div>
                  <h3>{ROLE_NAMES[role]}</h3>
                  <p>{ROLE_DESCRIPTIONS[role]}</p>
                </button>
              ))}
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register">Sign up</Link>
              </p>
            </div>
          </div>
        )}

        {/* Login Form */}
        {step === 'credentials' && (
          <div className="auth-content">
            <button 
              className="back-button"
              onClick={() => setStep('role')}
            >
              ← Back to roles
            </button>

            <h2>Sign In</h2>
            <p className="auth-subtitle">
              {selectedRole && ROLE_NAMES[selectedRole]}
            </p>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="you@example.com"
                  autoFocus
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="field-error" style={{
                    display: 'block',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    {errors.email.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="password-input">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    placeholder="Enter your password"
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className="field-error" style={{
                    display: 'block',
                    color: '#ef4444',
                    fontSize: '0.875rem',
                    marginTop: '0.25rem'
                  }}>
                    {errors.password.message}
                  </span>
                )}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                  />
                  <span>Remember me</span>
                </label>

                <Link to="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-primary btn-full"
                disabled={isLoading || !isValid || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="spinning" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="divider">
              <span>or continue with</span>
            </div>

            <div className="sso-buttons">
              <button
                className="sso-button"
                onClick={() => handleSSOLogin('google')}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>

              <button
                className="sso-button"
                onClick={() => handleSSOLogin('microsoft')}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#f25022" d="M1 1h10v10H1z"/>
                  <path fill="#00a4ef" d="M13 1h10v10H13z"/>
                  <path fill="#7fba00" d="M1 13h10v10H1z"/>
                  <path fill="#ffb900" d="M13 13h10v10H13z"/>
                </svg>
                Microsoft
              </button>
            </div>

            <div className="auth-footer">
              <p>
                Don't have an account?{' '}
                <Link to="/register">Sign up</Link>
              </p>
            </div>
          </div>
        )}

        {/* MFA Verification */}
        {step === 'mfa' && (
          <div className="auth-content">
            <h2>Two-Factor Authentication</h2>
            <p className="auth-subtitle">
              Enter the 6-digit code from your authenticator app
            </p>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleMFAVerify} className="auth-form">
              <div className="form-group">
                <label htmlFor="mfaCode">Verification Code</label>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="mfa-input"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="btn-primary btn-full"
                disabled={isLoading || mfaCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader size={18} className="spinning" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </form>

            <div className="auth-footer">
              <button 
                className="text-button"
                onClick={() => setStep('credentials')}
              >
                ← Back to login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
