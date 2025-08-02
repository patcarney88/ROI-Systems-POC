/**
 * Agency Login Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Professional authentication page for title agencies
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const AgencyLoginPage: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // Simulate API call for agency login
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to agency dashboard on success
      router.push('/agency/dashboard');
    } catch (error) {
      setErrors({ general: 'Login failed. Please check your credentials and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Agency Portal Login - ROI Systems</title>
        <meta name="description" content="Sign in to your ROI Systems Agency Portal" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-background-primary flex">
        {/* Left side - Login Form */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Logo and Title */}
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mb-6">
                <span className="text-white font-bold text-xl">ROI</span>
              </div>
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Agency Portal
              </h1>
              <p className="text-text-secondary">
                Sign in to access your title agency dashboard
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error Message */}
              {errors.general && (
                <div className="p-3 bg-error-50 border border-error-200 rounded-lg">
                  <p className="text-sm text-error-600">{errors.general}</p>
                </div>
              )}

              {/* Email Field */}
              <Input
                id="email"
                name="email"
                type="email"
                label="Email Address"
                placeholder="agency@titlecompany.com"
                value={formData.email}
                onChange={handleInputChange}
                errorMessage={errors.email}
                autoComplete="email"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
              />

              {/* Password Field */}
              <Input
                id="password"
                name="password"
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                errorMessage={errors.password}
                autoComplete="current-password"
                leftIcon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
              />

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary-600 rounded border-border-secondary focus:ring-primary-500 focus:ring-2 focus:ring-offset-2"
                  />
                  <label htmlFor="rememberMe" className="ml-2 text-sm text-text-secondary">
                    Keep me signed in
                  </label>
                </div>

                <Link 
                  href="/agency/forgot-password" 
                  className="text-sm text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={isLoading}
                loadingText="Signing in..."
                fullWidth
                size="lg"
                className="mt-6"
              >
                Sign In to Agency Portal
              </Button>
            </form>

            {/* Registration Link */}
            <div className="text-center">
              <p className="text-text-secondary">
                New title agency?{' '}
                <Link 
                  href="/agency/register" 
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Request Agency Access
                </Link>
              </p>
            </div>

            {/* Demo Credentials */}
            <div className="mt-8 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <h4 className="font-medium text-primary-800 mb-2">Demo Agency Login</h4>
              <div className="text-sm text-primary-700 space-y-1">
                <p><strong>Email:</strong> demo@titleagency.com</p>
                <p><strong>Password:</strong> agency123</p>
              </div>
            </div>

            {/* Back to Main Site */}
            <div className="text-center pt-4 border-t border-border-primary">
              <Link 
                href="/login" 
                className="text-sm text-text-tertiary hover:text-primary-600 transition-colors"
              >
                ← Back to Main Login
              </Link>
            </div>
          </div>
        </div>

        {/* Right side - Agency Branding */}
        <div className="hidden lg:block lg:flex-1 bg-gradient-to-br from-primary-600 to-primary-800 relative">
          <div className="absolute inset-0">
            <div className="h-full flex items-center justify-center p-12">
              <div className="text-center text-white max-w-lg">
                <div className="w-24 h-24 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586l-2 2V5H5v14h14v-3.586l2-2V19a1 1 0 01-1 1H4a1 1 0 01-1-1V4z" />
                    <path d="M17.707 7.707a1 1 0 00-1.414-1.414L10 12.586 7.707 10.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold mb-4">
                  Title Agency Solutions
                </h2>
                <p className="text-xl text-primary-100 mb-8">
                  Streamline your title operations with AI-powered document processing and transaction management.
                </p>
                
                {/* Agency Features */}
                <div className="space-y-4 text-left max-w-sm mx-auto">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Automated Title Search & Examination</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Transaction Management Dashboard</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Compliance & Reporting Tools</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Secure Document Vault</span>
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

export default AgencyLoginPage;