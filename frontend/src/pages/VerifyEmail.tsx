import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { Mail, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  
  const token = searchParams.get('token') || '';
  const userId = searchParams.get('userId') || '';
  const email = location.state?.email || '';
  
  const [isLoading, setIsLoading] = useState(!!token);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token && userId) {
      handleVerification();
    }
  }, [token, userId]);

  const handleVerification = async () => {
    try {
      await verifyEmail({ token, userId });
      setSuccess(true);
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError('Email verification failed. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    // Implement resend logic
    alert('Verification email resent!');
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-content">
            <div className="loading-state">
              <Loader size={64} className="spinning" />
              <h2>Verifying Email...</h2>
              <p>Please wait while we verify your email address</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-content">
            <div className="error-state">
              <AlertCircle size={64} />
              <h2>Verification Failed</h2>
              <p>{error}</p>
              <button className="btn-primary" onClick={handleResend}>
                Resend Verification Email
              </button>
              <Link to="/login" className="text-button">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-content">
            <div className="success-state">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h2>Email Verified!</h2>
              <p className="auth-subtitle">
                Your email has been successfully verified. Redirecting to dashboard...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Waiting for verification (just registered)
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
          <div className="info-state">
            <div className="info-icon">
              <Mail size={64} />
            </div>
            <h2>Verify Your Email</h2>
            <p className="auth-subtitle">
              We've sent a verification link to{' '}
              {email && <strong>{email}</strong>}
            </p>
            <p className="help-text">
              Click the link in the email to verify your account and get started.
            </p>

            <div className="verification-help">
              <p>Didn't receive the email?</p>
              <ul>
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email</li>
                <li>Wait a few minutes and check again</li>
              </ul>
              <button className="btn-secondary" onClick={handleResend}>
                Resend Verification Email
              </button>
            </div>
          </div>

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
