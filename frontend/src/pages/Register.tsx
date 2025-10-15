import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Loader, Check, ChevronRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import type { UserRole, RegistrationData } from '../types/auth';
import { ROLE_NAMES, ROLE_ICONS } from '../types/auth';

interface RegistrationStep {
  id: number;
  title: string;
  description: string;
}

const steps: RegistrationStep[] = [
  { id: 1, title: 'Role', description: 'Select your role' },
  { id: 2, title: 'Account', description: 'Create your account' },
  { id: 3, title: 'Profile', description: 'Complete your profile' },
  { id: 4, title: 'Organization', description: 'Join or create' }
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form data
  const [role, setRole] = useState<UserRole | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationChoice, setOrganizationChoice] = useState<'join' | 'create' | null>(null);
  const [organizationId, setOrganizationId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const roles: UserRole[] = ['title_agent', 'realtor', 'loan_officer', 'homeowner'];

  const validateStep = (): boolean => {
    setError('');

    switch (currentStep) {
      case 1:
        if (!role) {
          setError('Please select a role');
          return false;
        }
        break;
      
      case 2:
        if (!email || !email.includes('@')) {
          setError('Please enter a valid email');
          return false;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return false;
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        // Password strength check
        if (!/[A-Z]/.test(password)) {
          setError('Password must contain at least one uppercase letter');
          return false;
        }
        if (!/[a-z]/.test(password)) {
          setError('Password must contain at least one lowercase letter');
          return false;
        }
        if (!/[0-9]/.test(password)) {
          setError('Password must contain at least one number');
          return false;
        }
        if (!/[!@#$%^&*]/.test(password)) {
          setError('Password must contain at least one special character (!@#$%^&*)');
          return false;
        }
        break;
      
      case 3:
        if (!firstName || !lastName) {
          setError('Please enter your full name');
          return false;
        }
        break;
      
      case 4:
        if (role !== 'homeowner') {
          if (!organizationChoice) {
            setError('Please select an organization option');
            return false;
          }
          if (organizationChoice === 'join' && !organizationId) {
            setError('Please select an organization');
            return false;
          }
          if (organizationChoice === 'create' && !organizationName) {
            setError('Please enter an organization name');
            return false;
          }
        }
        if (!agreeToTerms || !agreeToPrivacy) {
          setError('Please agree to the Terms of Service and Privacy Policy');
          return false;
        }
        break;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep === 4) {
        handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!role) return;

    setIsLoading(true);
    setError('');

    const registrationData: RegistrationData = {
      email,
      password,
      confirmPassword,
      firstName,
      lastName,
      phone: phone || undefined,
      role,
      organizationId: organizationChoice === 'join' ? organizationId : undefined,
      organizationName: organizationChoice === 'create' ? organizationName : undefined,
      agreeToTerms,
      agreeToPrivacy,
      marketingConsent
    };

    try {
      const response = await register(registrationData);

      if (response.success) {
        // Redirect to email verification or dashboard
        navigate('/verify-email', { state: { email } });
      } else {
        setError(response.error?.message || 'Registration failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

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

  const passwordStrength = getPasswordStrength();

  return (
    <div className="auth-container">
      <div className="auth-card registration-card">
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

        {/* Progress Steps */}
        <div className="registration-steps">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={`step ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
            >
              <div className="step-number">
                {currentStep > step.id ? <Check size={16} /> : step.id}
              </div>
              <div className="step-info">
                <div className="step-title">{step.title}</div>
                <div className="step-description">{step.description}</div>
              </div>
              {index < steps.length - 1 && <ChevronRight className="step-arrow" size={16} />}
            </div>
          ))}
        </div>

        <div className="auth-content">
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Role Selection */}
          {currentStep === 1 && (
            <>
              <h2>Choose Your Role</h2>
              <p className="auth-subtitle">Select the role that best describes you</p>

              <div className="role-grid">
                {roles.map(r => (
                  <button
                    key={r}
                    className={`role-card ${role === r ? 'selected' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    <div className="role-icon">{ROLE_ICONS[r]}</div>
                    <h3>{ROLE_NAMES[r]}</h3>
                    {role === r && (
                      <div className="role-check">
                        <Check size={20} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: Account Creation */}
          {currentStep === 2 && (
            <>
              <h2>Create Your Account</h2>
              <p className="auth-subtitle">Enter your email and create a secure password</p>

              <div className="auth-form">
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a strong password"
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
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
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
              </div>
            </>
          )}

          {/* Step 3: Profile Information */}
          {currentStep === 3 && (
            <>
              <h2>Complete Your Profile</h2>
              <p className="auth-subtitle">Tell us a bit about yourself</p>

              <div className="auth-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      autoFocus
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number (Optional)</label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 4: Organization */}
          {currentStep === 4 && (
            <>
              <h2>Organization</h2>
              <p className="auth-subtitle">
                {role === 'homeowner' 
                  ? 'Review and accept our terms' 
                  : 'Join an existing organization or create a new one'}
              </p>

              <div className="auth-form">
                {role !== 'homeowner' && (
                  <>
                    <div className="organization-choice">
                      <button
                        className={`choice-card ${organizationChoice === 'join' ? 'selected' : ''}`}
                        onClick={() => setOrganizationChoice('join')}
                      >
                        <h3>Join Existing</h3>
                        <p>Join your company's organization</p>
                      </button>

                      <button
                        className={`choice-card ${organizationChoice === 'create' ? 'selected' : ''}`}
                        onClick={() => setOrganizationChoice('create')}
                      >
                        <h3>Create New</h3>
                        <p>Start a new organization</p>
                      </button>
                    </div>

                    {organizationChoice === 'join' && (
                      <div className="form-group">
                        <label htmlFor="organizationId">Select Organization</label>
                        <select
                          id="organizationId"
                          value={organizationId}
                          onChange={(e) => setOrganizationId(e.target.value)}
                        >
                          <option value="">Choose an organization...</option>
                          <option value="org1">ABC Title Company</option>
                          <option value="org2">XYZ Realty Group</option>
                          <option value="org3">Premier Lending</option>
                        </select>
                      </div>
                    )}

                    {organizationChoice === 'create' && (
                      <div className="form-group">
                        <label htmlFor="organizationName">Organization Name</label>
                        <input
                          id="organizationName"
                          type="text"
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          placeholder="Your Company Name"
                        />
                      </div>
                    )}
                  </>
                )}

                <div className="terms-section">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/terms" target="_blank">Terms of Service</a>
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreeToPrivacy}
                      onChange={(e) => setAgreeToPrivacy(e.target.checked)}
                    />
                    <span>
                      I agree to the{' '}
                      <a href="/privacy" target="_blank">Privacy Policy</a>
                    </span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={marketingConsent}
                      onChange={(e) => setMarketingConsent(e.target.checked)}
                    />
                    <span>
                      Send me product updates and marketing emails (optional)
                    </span>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Navigation Buttons */}
          <div className="form-actions">
            {currentStep > 1 && (
              <button
                className="btn-secondary"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </button>
            )}

            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="spinning" />
                  Creating account...
                </>
              ) : currentStep === 4 ? (
                'Create Account'
              ) : (
                'Continue'
              )}
            </button>
          </div>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
