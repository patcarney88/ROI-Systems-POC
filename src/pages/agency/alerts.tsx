/**
 * Business Alerts Page
 * Monitor and manage business opportunities
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';

interface Alert {
  id: string;
  type: 'refinance' | 'moving' | 'anniversary' | 'market' | 'engagement';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  homeowner: {
    name: string;
    property: string;
    email: string;
    phone: string;
  };
  metadata?: {
    currentRate?: string;
    potentialSavings?: string;
    listingPrice?: string;
    marketValue?: string;
    lastActivity?: string;
    engagementScore?: number;
  };
  createdAt: string;
  status: 'new' | 'viewed' | 'contacted' | 'converted' | 'dismissed';
}

const BusinessAlertsPage: React.FC = () => {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('active');
  const [showAlertDetails, setShowAlertDetails] = useState<string | null>(null);

  // Mock alerts data - 10% annual alert rate as per BRD
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'refinance',
      priority: 'high',
      title: 'Strong Refinance Opportunity',
      description: 'Interest rates dropped 1.5% since closing. Homeowner could save $450/month.',
      homeowner: {
        name: 'John Smith',
        property: '123 Main St, Dallas, TX 75201',
        email: 'john.smith@email.com',
        phone: '(555) 123-4567'
      },
      metadata: {
        currentRate: '6.5%',
        potentialSavings: '$450/month',
        marketValue: '$425,000'
      },
      createdAt: '2024-01-15T10:30:00Z',
      status: 'new'
    },
    {
      id: '2',
      type: 'moving',
      priority: 'high',
      title: 'Potential Move Detected',
      description: 'Homeowner viewed 15+ listings in Austin area over past 2 weeks.',
      homeowner: {
        name: 'Sarah Williams',
        property: '456 Oak Ave, Plano, TX 75023',
        email: 'sarah.w@email.com',
        phone: '(555) 234-5678'
      },
      metadata: {
        lastActivity: '2 days ago',
        engagementScore: 85
      },
      createdAt: '2024-01-14T14:45:00Z',
      status: 'viewed'
    },
    {
      id: '3',
      type: 'anniversary',
      priority: 'medium',
      title: '5-Year Home Anniversary',
      description: 'Perfect time to discuss home equity options and future plans.',
      homeowner: {
        name: 'Michael Johnson',
        property: '789 Elm Dr, Frisco, TX 75034',
        email: 'mjohnson@email.com',
        phone: '(555) 345-6789'
      },
      metadata: {
        marketValue: '$380,000',
        currentRate: '5.25%'
      },
      createdAt: '2024-01-13T09:15:00Z',
      status: 'contacted'
    },
    {
      id: '4',
      type: 'market',
      priority: 'medium',
      title: 'Significant Property Value Increase',
      description: 'Property value increased 22% since purchase. Good time to discuss options.',
      homeowner: {
        name: 'Emily Davis',
        property: '321 Pine St, McKinney, TX 75070',
        email: 'edavis@email.com',
        phone: '(555) 456-7890'
      },
      metadata: {
        marketValue: '$520,000',
        listingPrice: '$425,000'
      },
      createdAt: '2024-01-12T11:00:00Z',
      status: 'new'
    },
    {
      id: '5',
      type: 'engagement',
      priority: 'low',
      title: 'High Email Engagement',
      description: 'Opened last 8 marketing emails and clicked multiple links.',
      homeowner: {
        name: 'Robert Brown',
        property: '654 Cedar Ln, Allen, TX 75013',
        email: 'rbrown@email.com',
        phone: '(555) 567-8901'
      },
      metadata: {
        engagementScore: 92,
        lastActivity: '1 week ago'
      },
      createdAt: '2024-01-10T16:20:00Z',
      status: 'viewed'
    }
  ];

  // Filter alerts
  const filteredAlerts = alerts.filter(alert => {
    if (selectedFilter !== 'all' && alert.type !== selectedFilter) return false;
    if (selectedPriority !== 'all' && alert.priority !== selectedPriority) return false;
    if (selectedStatus === 'active' && ['converted', 'dismissed'].includes(alert.status)) return false;
    if (selectedStatus === 'completed' && !['converted', 'dismissed'].includes(alert.status)) return false;
    return true;
  });

  // Alert statistics
  const alertStats = {
    total: alerts.length,
    new: alerts.filter(a => a.status === 'new').length,
    highPriority: alerts.filter(a => a.priority === 'high').length,
    conversionRate: 12.5, // Mock conversion rate
    avgResponseTime: '2.3 days'
  };

  const getAlertIcon = (type: string) => {
    const iconClasses = "w-6 h-6";
    
    switch (type) {
      case 'refinance':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'moving':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'anniversary':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case 'market':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'engagement':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error-100 text-error-700 border-error-200';
      case 'medium':
        return 'bg-warning-100 text-warning-700 border-warning-200';
      case 'low':
        return 'bg-info-100 text-info-700 border-info-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-primary-100 text-primary-700';
      case 'viewed':
        return 'bg-info-100 text-info-700';
      case 'contacted':
        return 'bg-warning-100 text-warning-700';
      case 'converted':
        return 'bg-success-100 text-success-700';
      case 'dismissed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <Head>
        <title>Business Alerts - ROI Systems</title>
        <meta name="description" content="Monitor business opportunities and homeowner activity" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Business Alerts
                </h1>
                <p className="text-text-secondary">
                  Real-time opportunities from homeowner activity
                </p>
              </div>
              
              <button className="mt-4 sm:mt-0 btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Alert Settings
              </button>
            </div>
          </div>

          {/* Alert Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="card">
              <p className="text-sm text-text-tertiary mb-1">Total Alerts</p>
              <p className="text-2xl font-bold text-text-primary">{alertStats.total}</p>
              <p className="text-xs text-text-secondary mt-1">This month</p>
            </div>
            <div className="card">
              <p className="text-sm text-text-tertiary mb-1">New Alerts</p>
              <p className="text-2xl font-bold text-primary-600">{alertStats.new}</p>
              <p className="text-xs text-text-secondary mt-1">Requires action</p>
            </div>
            <div className="card">
              <p className="text-sm text-text-tertiary mb-1">High Priority</p>
              <p className="text-2xl font-bold text-error-600">{alertStats.highPriority}</p>
              <p className="text-xs text-text-secondary mt-1">Immediate attention</p>
            </div>
            <div className="card">
              <p className="text-sm text-text-tertiary mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-success-600">{alertStats.conversionRate}%</p>
              <p className="text-xs text-text-secondary mt-1">Last 90 days</p>
            </div>
            <div className="card">
              <p className="text-sm text-text-tertiary mb-1">Avg Response</p>
              <p className="text-2xl font-bold text-text-primary">{alertStats.avgResponseTime}</p>
              <p className="text-xs text-text-secondary mt-1">Time to contact</p>
            </div>
          </div>

          {/* Filters */}
          <div className="card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Alert Type
                </label>
                <select
                  value={selectedFilter}
                  onChange={(e) => setSelectedFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Types</option>
                  <option value="refinance">Refinance Opportunities</option>
                  <option value="moving">Moving Indicators</option>
                  <option value="anniversary">Anniversaries</option>
                  <option value="market">Market Changes</option>
                  <option value="engagement">High Engagement</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Priority
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="input"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="input"
                >
                  <option value="active">Active Alerts</option>
                  <option value="completed">Completed</option>
                  <option value="all">All Alerts</option>
                </select>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className={`card border-l-4 ${
                  alert.priority === 'high' ? 'border-l-error-600' :
                  alert.priority === 'medium' ? 'border-l-warning-600' :
                  'border-l-info-600'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      alert.type === 'refinance' ? 'bg-success-100 text-success-600' :
                      alert.type === 'moving' ? 'bg-error-100 text-error-600' :
                      alert.type === 'anniversary' ? 'bg-primary-100 text-primary-600' :
                      alert.type === 'market' ? 'bg-warning-100 text-warning-600' :
                      'bg-info-100 text-info-600'
                    }`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-text-primary">{alert.title}</h3>
                          <p className="text-sm text-text-secondary mt-1">{alert.description}</p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(alert.status)}`}>
                            {alert.status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(alert.priority)}`}>
                            {alert.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-text-tertiary mb-3">
                        <span>{alert.homeowner.name}</span>
                        <span>•</span>
                        <span>{alert.homeowner.property}</span>
                        <span>•</span>
                        <span>{formatDate(alert.createdAt)}</span>
                      </div>
                      
                      {alert.metadata && (
                        <div className="flex flex-wrap gap-3 mb-3">
                          {alert.metadata.currentRate && (
                            <div className="text-sm">
                              <span className="text-text-tertiary">Current Rate:</span>
                              <span className="ml-1 font-medium text-text-primary">{alert.metadata.currentRate}</span>
                            </div>
                          )}
                          {alert.metadata.potentialSavings && (
                            <div className="text-sm">
                              <span className="text-text-tertiary">Potential Savings:</span>
                              <span className="ml-1 font-medium text-success-600">{alert.metadata.potentialSavings}</span>
                            </div>
                          )}
                          {alert.metadata.marketValue && (
                            <div className="text-sm">
                              <span className="text-text-tertiary">Market Value:</span>
                              <span className="ml-1 font-medium text-text-primary">{alert.metadata.marketValue}</span>
                            </div>
                          )}
                          {alert.metadata.engagementScore && (
                            <div className="text-sm">
                              <span className="text-text-tertiary">Engagement Score:</span>
                              <span className="ml-1 font-medium text-text-primary">{alert.metadata.engagementScore}%</span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={() => setShowAlertDetails(alert.id)}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          View Details
                        </button>
                        <span className="text-text-tertiary">•</span>
                        <a 
                          href={`mailto:${alert.homeowner.email}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Send Email
                        </a>
                        <span className="text-text-tertiary">•</span>
                        <a 
                          href={`tel:${alert.homeowner.phone}`}
                          className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                        >
                          Call
                        </a>
                        <span className="text-text-tertiary">•</span>
                        <button className="text-text-secondary hover:text-text-primary text-sm">
                          Log Activity
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAlerts.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="mt-4 text-text-secondary">No alerts match your filters</p>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default BusinessAlertsPage;