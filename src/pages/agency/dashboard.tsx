/**
 * Title Agency Dashboard
 * Core dashboard for title agencies to manage transactions and view metrics
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';

interface MetricCard {
  title: string;
  value: string | number;
  change?: number;
  subtitle?: string;
  icon: string;
  color: string;
}

const AgencyDashboard: React.FC = () => {
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Mock data for POC
  const metrics: MetricCard[] = [
    {
      title: 'Active Transactions',
      value: '47',
      subtitle: 'This month',
      change: 12,
      icon: 'folder',
      color: 'primary'
    },
    {
      title: 'Homeowner Activations',
      value: '73%',
      subtitle: 'Last 30 days',
      change: 5,
      icon: 'users',
      color: 'success'
    },
    {
      title: 'Email Open Rate',
      value: '52%',
      subtitle: 'Campaign average',
      change: -3,
      icon: 'mail',
      color: 'info'
    },
    {
      title: 'Business Alerts',
      value: '8',
      subtitle: 'This quarter',
      change: 33,
      icon: 'bell',
      color: 'warning'
    }
  ];

  const recentTransactions = [
    {
      id: '1',
      propertyAddress: '123 Main St, Dallas, TX 75201',
      buyerName: 'John & Jane Smith',
      closingDate: '2024-01-15',
      documentsUploaded: 12,
      homeownerActivated: true
    },
    {
      id: '2', 
      propertyAddress: '456 Oak Ave, Plano, TX 75023',
      buyerName: 'Michael Johnson',
      closingDate: '2024-01-14',
      documentsUploaded: 8,
      homeownerActivated: false
    },
    {
      id: '3',
      propertyAddress: '789 Elm Dr, Frisco, TX 75034',
      buyerName: 'Sarah Williams',
      closingDate: '2024-01-13',
      documentsUploaded: 10,
      homeownerActivated: true
    }
  ];

  const getIcon = (iconName: string) => {
    const iconClasses = "w-6 h-6";
    
    switch (iconName) {
      case 'folder':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        );
      case 'users':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'mail':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'bell':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-600';
      case 'success':
        return 'bg-success-100 text-success-600';
      case 'info':
        return 'bg-info-100 text-info-600';
      case 'warning':
        return 'bg-warning-100 text-warning-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <>
      <Head>
        <title>Agency Dashboard - ROI Systems</title>
        <meta name="description" content="Title agency dashboard for managing transactions and client engagement" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Agency Dashboard
                </h1>
                <p className="text-text-secondary">
                  Welcome back, First American Title Dallas
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <select 
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="input"
                >
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                
                <Link href="/agency/transactions/new" className="btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Transaction
                </Link>
              </div>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric, index) => (
              <div key={index} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-text-tertiary mb-1">{metric.title}</p>
                    <p className="text-2xl font-bold text-text-primary mb-1">{metric.value}</p>
                    {metric.subtitle && (
                      <p className="text-xs text-text-secondary">{metric.subtitle}</p>
                    )}
                    {metric.change !== undefined && (
                      <div className="flex items-center mt-2">
                        <svg 
                          className={`w-4 h-4 mr-1 ${
                            metric.change > 0 ? 'text-success-600' : 'text-error-600'
                          }`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          {metric.change > 0 ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                          )}
                        </svg>
                        <span className={`text-sm ${
                          metric.change > 0 ? 'text-success-600' : 'text-error-600'
                        }`}>
                          {Math.abs(metric.change)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(metric.color)}`}>
                    {getIcon(metric.icon)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">
                    Recent Transactions
                  </h2>
                  <Link href="/agency/transactions" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                    View All →
                  </Link>
                </div>
                
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="border border-border-primary rounded-lg p-4 hover:bg-background-secondary transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-text-primary mb-1">
                            {transaction.propertyAddress}
                          </h3>
                          <p className="text-sm text-text-secondary mb-2">
                            {transaction.buyerName}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-text-tertiary">
                            <span>Closed: {transaction.closingDate}</span>
                            <span>•</span>
                            <span>{transaction.documentsUploaded} documents</span>
                            <span>•</span>
                            <span className={transaction.homeownerActivated ? 'text-success-600' : 'text-warning-600'}>
                              {transaction.homeownerActivated ? 'Activated' : 'Pending Activation'}
                            </span>
                          </div>
                        </div>
                        <Link 
                          href={`/agency/transactions/${transaction.id}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Actions & Alerts */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-4">
                  Quick Actions
                </h2>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/agency/upload')}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Upload Documents</p>
                        <p className="text-sm text-text-tertiary">Add docs to transaction</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/agency/marketing')}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">Send Campaign</p>
                        <p className="text-sm text-text-tertiary">Email marketing</p>
                      </div>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => router.push('/agency/reports')}
                    className="w-full p-3 text-left border border-border-primary rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded flex items-center justify-center">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">View Reports</p>
                        <p className="text-sm text-text-tertiary">Analytics & metrics</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Recent Alerts */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">
                    Business Alerts
                  </h2>
                  <span className="bg-warning-100 text-warning-700 text-xs px-2 py-1 rounded-full">
                    3 New
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-text-primary">
                          High activity detected
                        </p>
                        <p className="text-xs text-text-secondary mt-1">
                          John Smith - 123 Main St
                        </p>
                        <p className="text-xs text-text-tertiary">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Link 
                    href="/agency/alerts"
                    className="block text-center text-sm text-primary-600 hover:text-primary-700 font-medium pt-2"
                  >
                    View All Alerts →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AgencyDashboard;