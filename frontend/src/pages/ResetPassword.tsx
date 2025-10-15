import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { changePassword } = useAuth();
  
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const getPasswordStrength = (): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: '', color: '' };

    let strength = 0;
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (/[A-Z]/.test(password)) strength += 20;
    if (/[a-z]/.test(password)) strength += 20;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*]/.test(password)) strength += 15;

    if (strength < 40) return { strength, label: 'Weak', color: '#ef4444' };
    if (strength < 70) return { strength, label: 'Fair', color: '#f59e0b' };
    if (strength < 90) return { strength, label: 'Good', color: '#10b981' };
    return { strength, label: 'Strong', color: '#10b981' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        token,
        password,
        confirmPassword
      });
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError('Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength();

  if (!token) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-content">
            <div className="error-state">
              <AlertCircle size={64} />
              <h2>Invalid Reset Link</h2>
              <p>This password reset link is invalid or has expired.</p>
              <Link to="/forgot-password" className="btn-primary">
                Request New Link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
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

        <div className="auth-content">
          {!success ? (
            <>
              <h2>Create New Password</h2>
              <p className="auth-subtitle">
                Enter a new password for your account
              </p>

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="password">New Password</label>
                  <div className="password-input">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
                      required
                      autoFocus
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
                  {password && (
                    <div className="password-strength">
                      <div className="strength-bar">
                        <div
                          className="strength-fill"
                          style={{
                            width: `${passwordStrength.strength}%`,
                            backgroundColor: passwordStrength.color
                          }}
                        />
                      </div>
                      <span style={{ color: passwordStrength.color }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>

                <div className="password-requirements">
                  <p>Password must contain:</p>
                  <ul>
                    <li className={password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                    <li className={/[A-Z]/.test(password) ? 'met' : ''}>One uppercase letter</li>
                    <li className={/[a-z]/.test(password) ? 'met' : ''}>One lowercase letter</li>
                    <li className={/[0-9]/.test(password) ? 'met' : ''}>One number</li>
                    <li className={/[!@#$%^&*]/.test(password) ? 'met' : ''}>One special character</li>
                  </ul>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="spinning" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="success-state">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Password Reset Successfully</h2>
              <p className="auth-subtitle">
                Your password has been reset. Redirecting to login...
              </p>
            </div>
          )}

          <div className="auth-footer">
            <Link to="/login" className="back-link">
              ← Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
