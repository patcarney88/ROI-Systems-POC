/**
 * Agency Registration Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Professional registration page for title agencies
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface RegisterFormData {
  // Agency Information
  agencyName: string;
  agencyLicense: string;
  businessType: string;
  
  // Contact Information
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Account Information
  password: string;
  confirmPassword: string;
  
  // Agreements
  agreeToTerms: boolean;
  agreeToMarketing: boolean;
}

interface FormErrors {
  [key: string]: string | undefined;
}

const AgencyRegisterPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterFormData>({
    // Agency Information
    agencyName: '',
    agencyLicense: '',
    businessType: '',
    
    // Contact Information
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    
    // Address Information
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Account Information
    password: '',
    confirmPassword: '',
    
    // Agreements
    agreeToTerms: false,
    agreeToMarketing: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: FormErrors = {};

    if (step === 1) {
      // Agency Information
      if (!formData.agencyName.trim()) {
        newErrors.agencyName = 'Agency name is required';
      }
      if (!formData.agencyLicense.trim()) {
        newErrors.agencyLicense = 'Agency license number is required';
      }
      if (!formData.businessType) {
        newErrors.businessType = 'Business type is required';
      }
    } else if (step === 2) {
      // Contact Information
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      if (!formData.title.trim()) {
        newErrors.title = 'Job title is required';
      }
      if (!formData.email) {
        newErrors.email = 'Email address is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
      }
      
      // Address Information
      if (!formData.address.trim()) {
        newErrors.address = 'Street address is required';
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required';
      }
      if (!formData.state.trim()) {
        newErrors.state = 'State is required';
      }
      if (!formData.zipCode.trim()) {
        newErrors.zipCode = 'ZIP code is required';
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode)) {
        newErrors.zipCode = 'Please enter a valid ZIP code';
      }
    } else if (step === 3) {
      // Account Information
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Password must contain uppercase, lowercase, and number';
      }
      
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the terms and conditions';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) return;

    setIsLoading(true);
    
    try {
      // Simulate API call for agency registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Redirect to success page or login
      router.push('/agency/login?registered=true');
    } catch (error) {
      setErrors({ general: 'Registration failed. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step < currentStep
                ? 'bg-primary-600 text-white'
                : step === currentStep
                ? 'bg-primary-600 text-white'
                : 'bg-background-secondary text-text-tertiary border-2 border-border-primary'
            }`}
          >
            {step < currentStep ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              step
            )}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-0.5 mx-2 ${
                step < currentStep ? 'bg-primary-600' : 'bg-border-primary'
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Agency Information</h3>
        <div className="space-y-4">
          <Input
            label="Agency Name"
            name="agencyName"
            value={formData.agencyName}
            onChange={handleInputChange}
            placeholder="ABC Title & Escrow Company"
            errorMessage={errors.agencyName}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />

          <Input
            label="Agency License Number"
            name="agencyLicense"
            value={formData.agencyLicense}
            onChange={handleInputChange}
            placeholder="Enter your state license number"
            errorMessage={errors.agencyLicense}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Business Type
            </label>
            <select
              name="businessType"
              value={formData.businessType}
              onChange={handleInputChange}
              className="w-full h-10 px-4 py-2 border border-border-primary rounded-lg focus:ring-2 focus:ring-primary-200 focus:border-primary-600 transition-colors"
            >
              <option value="">Select business type</option>
              <option value="title-company">Title Insurance Company</option>
              <option value="escrow-company">Escrow Company</option>
              <option value="title-escrow">Title & Escrow Company</option>
              <option value="law-firm">Law Firm with Title Services</option>
              <option value="other">Other</option>
            </select>
            {errors.businessType && (
              <p className="mt-2 text-xs text-error-600">{errors.businessType}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Contact Information</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Input
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleInputChange}
            placeholder="John"
            errorMessage={errors.firstName}
          />
          <Input
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleInputChange}
            placeholder="Doe"
            errorMessage={errors.lastName}
          />
        </div>

        <div className="space-y-4">
          <Input
            label="Job Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Title Officer, President, etc."
            errorMessage={errors.title}
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="john@titlecompany.com"
            errorMessage={errors.email}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="(555) 123-4567"
            errorMessage={errors.phone}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Business Address</h3>
        <div className="space-y-4">
          <Input
            label="Street Address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="123 Main Street, Suite 100"
            errorMessage={errors.address}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Anytown"
              errorMessage={errors.city}
            />
            <Input
              label="State"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="CA"
              errorMessage={errors.state}
            />
          </div>

          <Input
            label="ZIP Code"
            name="zipCode"
            value={formData.zipCode}
            onChange={handleInputChange}
            placeholder="12345"
            errorMessage={errors.zipCode}
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-text-primary mb-4">Account Setup</h3>
        <div className="space-y-4">
          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Create a strong password"
            errorMessage={errors.password}
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm your password"
            errorMessage={errors.confirmPassword}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-start">
            <input
              id="agreeToTerms"
              name="agreeToTerms"
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={handleInputChange}
              className="w-4 h-4 text-primary-600 rounded border-border-secondary focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 mt-0.5"
            />
            <label htmlFor="agreeToTerms" className="ml-2 text-sm text-text-secondary">
              I agree to the{' '}
              <Link href="/terms" className="text-primary-600 hover:text-primary-700 underline" target="_blank">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary-600 hover:text-primary-700 underline" target="_blank">
                Privacy Policy
              </Link>
            </label>
          </div>
          {errors.agreeToTerms && (
            <p className="mt-1 text-sm text-error-600">{errors.agreeToTerms}</p>
          )}
        </div>

        <div className="flex items-start">
          <input
            id="agreeToMarketing"
            name="agreeToMarketing"
            type="checkbox"
            checked={formData.agreeToMarketing}
            onChange={handleInputChange}
            className="w-4 h-4 text-primary-600 rounded border-border-secondary focus:ring-primary-500 focus:ring-2 focus:ring-offset-2 mt-0.5"
          />
          <label htmlFor="agreeToMarketing" className="ml-2 text-sm text-text-secondary">
            I would like to receive product updates and marketing communications
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Agency Registration - ROI Systems</title>
        <meta name="description" content="Register your title agency with ROI Systems" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-background-primary flex">
        {/* Left side - Registration Form */}
        <div className="flex-1 flex items-start justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-lg w-full">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">ROI</span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Agency Registration
              </h1>
              <p className="text-text-secondary">
                Join the ROI Systems platform to streamline your title operations
              </p>
            </div>

            {/* Step Indicator */}
            {renderStepIndicator()}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* General Error Message */}
              {errors.general && (
                <div className="mb-6 p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-600">{errors.general}</p>
                </div>
              )}

              {/* Step Content */}
              <div className="mb-8">
                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between space-x-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handlePrevious}
                    className="flex-1"
                  >
                    Previous
                  </Button>
                )}

                {currentStep < 3 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    className={currentStep === 1 ? 'w-full' : 'flex-1'}
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    loading={isLoading}
                    loadingText="Creating account..."
                    className="flex-1"
                  >
                    Create Agency Account
                  </Button>
                )}
              </div>
            </form>

            {/* Login Link */}
            <div className="text-center mt-6">
              <p className="text-text-secondary">
                Already have an agency account?{' '}
                <Link 
                  href="/agency/login" 
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Back to Main Site */}
            <div className="text-center pt-4 border-t border-border-primary mt-8">
              <Link 
                href="/register" 
                className="text-sm text-text-tertiary hover:text-primary-600 transition-colors"
              >
                ← Back to Personal Registration
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Professional Branding */}
        <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-primary-500 to-primary-700 relative">
          <div className="h-full flex items-center justify-center p-12">
            <div className="text-center text-white max-w-lg">
              <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Professional Title Services
              </h2>
              <p className="text-xl text-primary-100 mb-8">
                Join hundreds of title agencies already using ROI Systems to modernize their operations.
              </p>
              
              {/* Statistics */}
              <div className="grid grid-cols-2 gap-6 text-center mb-8">
                <div>
                  <div className="text-3xl font-bold text-white mb-2">150+</div>
                  <div className="text-primary-100 text-sm">Partner Agencies</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">95%</div>
                  <div className="text-primary-100 text-sm">Client Satisfaction</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">$2.1B</div>
                  <div className="text-primary-100 text-sm">Transactions Processed</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white mb-2">24/7</div>
                  <div className="text-primary-100 text-sm">Support Available</div>
                </div>
              </div>

              {/* Features */}
              <div className="text-left">
                <h3 className="font-semibold text-white mb-4">What you'll get:</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Complete transaction management</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Automated compliance reporting</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Integration with existing systems</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Dedicated account manager</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgencyRegisterPage;