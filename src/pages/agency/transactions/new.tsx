/**
 * New Transaction Page
 * Create a new real estate transaction
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../../components/layout/Layout';

const NewTransactionPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    transactionType: 'purchase',
    propertyAddress: '',
    propertyCity: '',
    propertyState: 'TX',
    propertyZip: '',
    closingDate: '',
    purchasePrice: '',
    loanAmount: '',
    buyerFirstName: '',
    buyerLastName: '',
    buyerEmail: '',
    buyerPhone: '',
    sellerFirstName: '',
    sellerLastName: '',
    sellerEmail: '',
    agentName: '',
    agentEmail: '',
    lenderName: '',
    lenderContact: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.propertyAddress) newErrors.propertyAddress = 'Property address is required';
    if (!formData.propertyCity) newErrors.propertyCity = 'City is required';
    if (!formData.propertyZip) newErrors.propertyZip = 'ZIP code is required';
    if (!formData.closingDate) newErrors.closingDate = 'Closing date is required';
    if (!formData.buyerFirstName) newErrors.buyerFirstName = 'Buyer first name is required';
    if (!formData.buyerLastName) newErrors.buyerLastName = 'Buyer last name is required';
    if (!formData.buyerEmail) newErrors.buyerEmail = 'Buyer email is required';
    
    if (formData.transactionType === 'purchase') {
      if (!formData.sellerFirstName) newErrors.sellerFirstName = 'Seller first name is required';
      if (!formData.sellerLastName) newErrors.sellerLastName = 'Seller last name is required';
      if (!formData.purchasePrice) newErrors.purchasePrice = 'Purchase price is required';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.buyerEmail && !emailRegex.test(formData.buyerEmail)) {
      newErrors.buyerEmail = 'Invalid email format';
    }
    if (formData.sellerEmail && !emailRegex.test(formData.sellerEmail)) {
      newErrors.sellerEmail = 'Invalid email format';
    }
    if (formData.agentEmail && !emailRegex.test(formData.agentEmail)) {
      newErrors.agentEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In POC, just redirect to transactions list
    router.push('/agency/transactions');
  };

  return (
    <>
      <Head>
        <title>New Transaction - ROI Systems</title>
        <meta name="description" content="Create a new real estate transaction" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/agency/transactions" className="text-primary-600 hover:text-primary-700 mb-4 inline-flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Transactions
              </Link>
              
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                New Transaction
              </h1>
              <p className="text-text-secondary">
                Enter the transaction details to get started
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Transaction Type */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Transaction Type</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-background-secondary transition-colors">
                    <input
                      type="radio"
                      name="transactionType"
                      value="purchase"
                      checked={formData.transactionType === 'purchase'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-text-primary">Purchase</p>
                      <p className="text-sm text-text-tertiary">Buyer purchasing from seller</p>
                    </div>
                  </label>
                  
                  <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-background-secondary transition-colors">
                    <input
                      type="radio"
                      name="transactionType"
                      value="refinance"
                      checked={formData.transactionType === 'refinance'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-text-primary">Refinance</p>
                      <p className="text-sm text-text-tertiary">Existing owner refinancing</p>
                    </div>
                  </label>
                  
                  <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-background-secondary transition-colors">
                    <input
                      type="radio"
                      name="transactionType"
                      value="sale"
                      checked={formData.transactionType === 'sale'}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <p className="font-medium text-text-primary">Sale Only</p>
                      <p className="text-sm text-text-tertiary">Seller only transaction</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Property Information */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Property Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Property Address <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="propertyAddress"
                      value={formData.propertyAddress}
                      onChange={handleChange}
                      className={`input ${errors.propertyAddress ? 'border-error-500' : ''}`}
                      placeholder="123 Main Street"
                    />
                    {errors.propertyAddress && (
                      <p className="mt-1 text-sm text-error-600">{errors.propertyAddress}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      City <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="propertyCity"
                      value={formData.propertyCity}
                      onChange={handleChange}
                      className={`input ${errors.propertyCity ? 'border-error-500' : ''}`}
                      placeholder="Dallas"
                    />
                    {errors.propertyCity && (
                      <p className="mt-1 text-sm text-error-600">{errors.propertyCity}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      State <span className="text-error-600">*</span>
                    </label>
                    <select
                      name="propertyState"
                      value={formData.propertyState}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="TX">Texas</option>
                      <option value="OK">Oklahoma</option>
                      <option value="LA">Louisiana</option>
                      <option value="NM">New Mexico</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      ZIP Code <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="propertyZip"
                      value={formData.propertyZip}
                      onChange={handleChange}
                      className={`input ${errors.propertyZip ? 'border-error-500' : ''}`}
                      placeholder="75201"
                    />
                    {errors.propertyZip && (
                      <p className="mt-1 text-sm text-error-600">{errors.propertyZip}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Closing Date <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="date"
                      name="closingDate"
                      value={formData.closingDate}
                      onChange={handleChange}
                      className={`input ${errors.closingDate ? 'border-error-500' : ''}`}
                    />
                    {errors.closingDate && (
                      <p className="mt-1 text-sm text-error-600">{errors.closingDate}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Financial Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formData.transactionType === 'purchase' && (
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Purchase Price <span className="text-error-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="purchasePrice"
                        value={formData.purchasePrice}
                        onChange={handleChange}
                        className={`input ${errors.purchasePrice ? 'border-error-500' : ''}`}
                        placeholder="$425,000"
                      />
                      {errors.purchasePrice && (
                        <p className="mt-1 text-sm text-error-600">{errors.purchasePrice}</p>
                      )}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Loan Amount
                    </label>
                    <input
                      type="text"
                      name="loanAmount"
                      value={formData.loanAmount}
                      onChange={handleChange}
                      className="input"
                      placeholder="$340,000"
                    />
                  </div>
                </div>
              </div>

              {/* Buyer Information */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">
                  {formData.transactionType === 'sale' ? 'Seller' : 'Buyer'} Information
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      First Name <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="buyerFirstName"
                      value={formData.buyerFirstName}
                      onChange={handleChange}
                      className={`input ${errors.buyerFirstName ? 'border-error-500' : ''}`}
                    />
                    {errors.buyerFirstName && (
                      <p className="mt-1 text-sm text-error-600">{errors.buyerFirstName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Last Name <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="text"
                      name="buyerLastName"
                      value={formData.buyerLastName}
                      onChange={handleChange}
                      className={`input ${errors.buyerLastName ? 'border-error-500' : ''}`}
                    />
                    {errors.buyerLastName && (
                      <p className="mt-1 text-sm text-error-600">{errors.buyerLastName}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Email <span className="text-error-600">*</span>
                    </label>
                    <input
                      type="email"
                      name="buyerEmail"
                      value={formData.buyerEmail}
                      onChange={handleChange}
                      className={`input ${errors.buyerEmail ? 'border-error-500' : ''}`}
                    />
                    {errors.buyerEmail && (
                      <p className="mt-1 text-sm text-error-600">{errors.buyerEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="buyerPhone"
                      value={formData.buyerPhone}
                      onChange={handleChange}
                      className="input"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Seller Information (only for purchase) */}
              {formData.transactionType === 'purchase' && (
                <div className="card">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Seller Information</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        First Name <span className="text-error-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="sellerFirstName"
                        value={formData.sellerFirstName}
                        onChange={handleChange}
                        className={`input ${errors.sellerFirstName ? 'border-error-500' : ''}`}
                      />
                      {errors.sellerFirstName && (
                        <p className="mt-1 text-sm text-error-600">{errors.sellerFirstName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Last Name <span className="text-error-600">*</span>
                      </label>
                      <input
                        type="text"
                        name="sellerLastName"
                        value={formData.sellerLastName}
                        onChange={handleChange}
                        className={`input ${errors.sellerLastName ? 'border-error-500' : ''}`}
                      />
                      {errors.sellerLastName && (
                        <p className="mt-1 text-sm text-error-600">{errors.sellerLastName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-text-primary mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="sellerEmail"
                        value={formData.sellerEmail}
                        onChange={handleChange}
                        className={`input ${errors.sellerEmail ? 'border-error-500' : ''}`}
                      />
                      {errors.sellerEmail && (
                        <p className="mt-1 text-sm text-error-600">{errors.sellerEmail}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Professional Information */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Professional Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Real Estate Agent
                    </label>
                    <input
                      type="text"
                      name="agentName"
                      value={formData.agentName}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Agent Email
                    </label>
                    <input
                      type="email"
                      name="agentEmail"
                      value={formData.agentEmail}
                      onChange={handleChange}
                      className={`input ${errors.agentEmail ? 'border-error-500' : ''}`}
                    />
                    {errors.agentEmail && (
                      <p className="mt-1 text-sm text-error-600">{errors.agentEmail}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Lender
                    </label>
                    <input
                      type="text"
                      name="lenderName"
                      value={formData.lenderName}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Lender Contact
                    </label>
                    <input
                      type="text"
                      name="lenderContact"
                      value={formData.lenderContact}
                      onChange={handleChange}
                      className="input"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="input"
                    placeholder="Any additional notes about this transaction..."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <Link href="/agency/transactions" className="btn-outline">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default NewTransactionPage;