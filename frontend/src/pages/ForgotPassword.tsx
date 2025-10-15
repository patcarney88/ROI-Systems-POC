import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword({ email });
      setSuccess(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
              <h2>Reset Password</h2>
              <p className="auth-subtitle">
                Enter your email address and we'll send you a link to reset your password
              </p>

              {error && (
                <div className="error-message">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <div className="input-with-icon">
                    <Mail size={18} />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary btn-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader size={18} className="spinning" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="success-state">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Check Your Email</h2>
              <p className="auth-subtitle">
                We've sent a password reset link to <strong>{email}</strong>
              </p>
              <p className="help-text">
                Didn't receive the email? Check your spam folder or{' '}
                <button 
                  className="text-button"
                  onClick={() => setSuccess(false)}
                >
                  try again
                </button>
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
