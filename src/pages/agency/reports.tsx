/**
 * Agency Reports Page
 * Generate and view business reports
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';

interface Report {
  id: string;
  name: string;
  type: string;
  frequency: string;
  lastGenerated: string;
  status: 'ready' | 'generating' | 'scheduled';
  size?: string;
}

const ReportsPage: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('generated');
  const [selectedPeriod, setSelectedPeriod] = useState('last30');
  const [selectedReportType, setSelectedReportType] = useState('all');

  // Mock reports data
  const generatedReports: Report[] = [
    {
      id: '1',
      name: 'Monthly Transaction Summary - December 2023',
      type: 'transaction',
      frequency: 'monthly',
      lastGenerated: '2024-01-01',
      status: 'ready',
      size: '2.3 MB'
    },
    {
      id: '2',
      name: 'Q4 2023 Business Performance Report',
      type: 'performance',
      frequency: 'quarterly',
      lastGenerated: '2024-01-05',
      status: 'ready',
      size: '4.8 MB'
    },
    {
      id: '3',
      name: 'Agent Commission Report - December 2023',
      type: 'commission',
      frequency: 'monthly',
      lastGenerated: '2024-01-02',
      status: 'ready',
      size: '1.2 MB'
    },
    {
      id: '4',
      name: 'Marketing Campaign Analysis - Q4 2023',
      type: 'marketing',
      frequency: 'quarterly',
      lastGenerated: '2024-01-08',
      status: 'ready',
      size: '3.5 MB'
    },
    {
      id: '5',
      name: 'Annual Compliance Report 2023',
      type: 'compliance',
      frequency: 'annual',
      lastGenerated: '2024-01-10',
      status: 'ready',
      size: '8.2 MB'
    }
  ];

  const scheduledReports = [
    {
      id: '6',
      name: 'Monthly Transaction Summary',
      type: 'transaction',
      frequency: 'monthly',
      nextRun: '2024-02-01',
      recipients: ['team@titleagency.com', 'management@titleagency.com']
    },
    {
      id: '7',
      name: 'Weekly Activity Report',
      type: 'activity',
      frequency: 'weekly',
      nextRun: '2024-01-22',
      recipients: ['operations@titleagency.com']
    },
    {
      id: '8',
      name: 'Agent Commission Report',
      type: 'commission',
      frequency: 'monthly',
      nextRun: '2024-02-02',
      recipients: ['finance@titleagency.com', 'agents@titleagency.com']
    }
  ];

  const reportTemplates = [
    {
      id: 't1',
      name: 'Transaction Summary',
      description: 'Comprehensive overview of all transactions including status, values, and timelines',
      icon: 'folder',
      fields: ['Date Range', 'Transaction Status', 'Agent Filter', 'Property Type']
    },
    {
      id: 't2',
      name: 'Commission Analysis',
      description: 'Detailed breakdown of commissions by agent, transaction type, and time period',
      icon: 'dollar',
      fields: ['Date Range', 'Agent Selection', 'Commission Type', 'Include Projections']
    },
    {
      id: 't3',
      name: 'Marketing Performance',
      description: 'Email campaign metrics, engagement rates, and conversion analysis',
      icon: 'mail',
      fields: ['Campaign Selection', 'Date Range', 'Metric Type', 'Segmentation']
    },
    {
      id: 't4',
      name: 'Business Analytics',
      description: 'KPIs, revenue trends, pipeline analysis, and growth metrics',
      icon: 'chart',
      fields: ['Metric Selection', 'Date Range', 'Comparison Period', 'Forecast Options']
    },
    {
      id: 't5',
      name: 'Compliance Report',
      description: 'Regulatory compliance status, audit trails, and documentation completeness',
      icon: 'shield',
      fields: ['Compliance Type', 'Date Range', 'Include Audit Log', 'Document Status']
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
      case 'dollar':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'mail':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'shield':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getReportTypeColor = (type: string) => {
    switch (type) {
      case 'transaction':
        return 'bg-primary-100 text-primary-700';
      case 'performance':
        return 'bg-success-100 text-success-700';
      case 'commission':
        return 'bg-warning-100 text-warning-700';
      case 'marketing':
        return 'bg-info-100 text-info-700';
      case 'compliance':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Head>
        <title>Reports - ROI Systems</title>
        <meta name="description" content="Generate and manage agency reports" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Reports
                </h1>
                <p className="text-text-secondary">
                  Generate and manage business reports
                </p>
              </div>
              
              <Link href="/agency/analytics" className="mt-4 sm:mt-0 btn-primary">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Analytics
              </Link>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border-primary mb-6">
            <nav className="flex space-x-8">
              {['generated', 'scheduled', 'templates'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab} Reports
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'generated' && (
            <>
              {/* Filters */}
              <div className="card mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Time Period
                    </label>
                    <select
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="input"
                    >
                      <option value="last7">Last 7 Days</option>
                      <option value="last30">Last 30 Days</option>
                      <option value="last90">Last 90 Days</option>
                      <option value="thisYear">This Year</option>
                      <option value="all">All Reports</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Report Type
                    </label>
                    <select
                      value={selectedReportType}
                      onChange={(e) => setSelectedReportType(e.target.value)}
                      className="input"
                    >
                      <option value="all">All Types</option>
                      <option value="transaction">Transaction</option>
                      <option value="performance">Performance</option>
                      <option value="commission">Commission</option>
                      <option value="marketing">Marketing</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Search
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search reports..."
                        className="input pl-10"
                      />
                      <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {generatedReports
                  .filter(report => selectedReportType === 'all' || report.type === selectedReportType)
                  .map((report) => (
                  <div key={report.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-text-primary">{report.name}</h3>
                          <div className="flex items-center space-x-3 mt-1">
                            <span className={`text-xs px-2 py-1 rounded-full ${getReportTypeColor(report.type)}`}>
                              {report.type}
                            </span>
                            <span className="text-sm text-text-tertiary">
                              Generated {new Date(report.lastGenerated).toLocaleDateString()}
                            </span>
                            {report.size && (
                              <span className="text-sm text-text-tertiary">
                                {report.size}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <button className="text-primary-600 hover:text-primary-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="text-primary-600 hover:text-primary-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </button>
                        <button className="text-text-tertiary hover:text-error-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'scheduled' && (
            <div className="space-y-6">
              {/* Add Schedule Button */}
              <div className="flex justify-end">
                <button className="btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Schedule New Report
                </button>
              </div>

              {/* Scheduled Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {scheduledReports.map((report) => (
                  <div key={report.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-text-primary">{report.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${getReportTypeColor(report.type)}`}>
                          {report.type}
                        </span>
                      </div>
                      <button className="text-text-tertiary hover:text-text-primary">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Frequency</span>
                        <span className="text-text-primary capitalize">{report.frequency}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Next Run</span>
                        <span className="text-text-primary">{new Date(report.nextRun).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-text-secondary">Recipients</span>
                        <div className="mt-1 space-y-1">
                          {report.recipients.map((recipient, index) => (
                            <div key={index} className="text-text-primary text-xs bg-background-secondary rounded px-2 py-1">
                              {recipient}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center space-x-2">
                      <button className="btn-outline flex-1">
                        Edit Schedule
                      </button>
                      <button className="btn-outline flex-1">
                        Run Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {reportTemplates.map((template) => (
                <div key={template.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <div className="text-primary-600">
                        {getIcon(template.icon)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-text-primary mb-2">{template.name}</h3>
                      <p className="text-sm text-text-secondary mb-3">{template.description}</p>
                      
                      <div className="space-y-1 mb-4">
                        <p className="text-xs font-medium text-text-tertiary uppercase">Available Fields</p>
                        <div className="flex flex-wrap gap-1">
                          {template.fields.map((field, index) => (
                            <span key={index} className="text-xs bg-background-secondary text-text-primary px-2 py-1 rounded">
                              {field}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <button className="btn-primary w-full">
                        Generate Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default ReportsPage;