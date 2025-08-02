/**
 * Analytics Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Analytics dashboard with document processing metrics and insights
 */

import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import Layout from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: string;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  color: string;
}

const AnalyticsPage: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('documents');

  // Mock analytics data
  const metrics: MetricCard[] = [
    {
      title: 'Documents Processed',
      value: 247,
      change: 12.5,
      changeType: 'increase',
      icon: 'documents',
      color: 'primary'
    },
    {
      title: 'Storage Used',
      value: '18.4 GB',
      change: 8.2,
      changeType: 'increase',
      icon: 'storage',
      color: 'info'
    },
    {
      title: 'Processing Time',
      value: '2.3s',
      change: -15.8,
      changeType: 'decrease',
      icon: 'time',
      color: 'success'
    },
    {
      title: 'Search Queries',
      value: 1834,
      change: 23.4,
      changeType: 'increase',
      icon: 'search',
      color: 'warning'
    }
  ];

  const documentTypeData: ChartData[] = [
    { label: 'PDF', value: 45, color: '#dc2626' },
    { label: 'Word', value: 28, color: '#2563eb' },
    { label: 'Excel', value: 18, color: '#16a34a' },
    { label: 'PowerPoint', value: 9, color: '#ea580c' }
  ];

  const processingTrendData = [
    { month: 'Jan', documents: 45, avgTime: 3.2 },
    { month: 'Feb', documents: 67, avgTime: 2.8 },
    { month: 'Mar', documents: 89, avgTime: 2.5 },
    { month: 'Apr', documents: 123, avgTime: 2.3 },
    { month: 'May', documents: 156, avgTime: 2.1 },
    { month: 'Jun', documents: 187, avgTime: 2.0 }
  ];

  const topSearchTerms = [
    { term: 'contract', count: 234, trend: 'up' },
    { term: 'financial report', count: 187, trend: 'up' },
    { term: 'marketing', count: 156, trend: 'down' },
    { term: 'invoice', count: 143, trend: 'up' },
    { term: 'policy', count: 98, trend: 'neutral' }
  ];

  const getIcon = (iconName: string) => {
    const iconClasses = "w-6 h-6";
    
    switch (iconName) {
      case 'documents':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'storage':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        );
      case 'time':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'search':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
      case 'info':
        return 'bg-info-100 text-info-600';
      case 'success':
        return 'bg-success-100 text-success-600';
      case 'warning':
        return 'bg-warning-100 text-warning-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Analytics - ROI Systems</title>
        <meta name="description" content="Document processing analytics and insights" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-text-secondary">
                  Monitor document processing performance and user engagement
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <select 
                  value={selectedTimeRange}
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="input"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                
                <button className="btn-outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Export Report
                </button>
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
                    <p className="text-2xl font-bold text-text-primary mb-2">{metric.value}</p>
                    <div className="flex items-center">
                      <svg 
                        className={`w-4 h-4 mr-1 ${
                          metric.changeType === 'increase' ? 'text-success-600' : 
                          metric.changeType === 'decrease' ? 'text-error-600' : 
                          'text-text-tertiary'
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        {metric.changeType === 'increase' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                        ) : metric.changeType === 'decrease' ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                        )}
                      </svg>
                      <span className={`text-sm ${
                        metric.changeType === 'increase' ? 'text-success-600' : 
                        metric.changeType === 'decrease' ? 'text-error-600' : 
                        'text-text-tertiary'
                      }`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(metric.color)}`}>
                    {getIcon(metric.icon)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Document Types Chart */}
            <div className="lg:col-span-1">
              <div className="card">
                <h3 className="text-lg font-medium text-text-primary mb-6">
                  Document Types
                </h3>
                
                <div className="space-y-4">
                  {documentTypeData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-text-secondary">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-background-secondary rounded-full h-2">
                          <div 
                            className="h-2 rounded-full"
                            style={{ 
                              width: `${item.value}%`, 
                              backgroundColor: item.color 
                            }}
                          />
                        </div>
                        <span className="text-text-primary font-medium w-8 text-right">
                          {item.value}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-border-primary">
                  <p className="text-sm text-text-tertiary">
                    Total documents processed: <span className="font-medium text-text-primary">247</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Processing Trend */}
            <div className="lg:col-span-2">
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-text-primary">
                    Processing Trends
                  </h3>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setSelectedMetric('documents')}
                      className={`text-sm px-3 py-1 rounded ${
                        selectedMetric === 'documents' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'text-text-secondary hover:text-primary-600'
                      }`}
                    >
                      Documents
                    </button>
                    <button
                      onClick={() => setSelectedMetric('time')}
                      className={`text-sm px-3 py-1 rounded ${
                        selectedMetric === 'time' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'text-text-secondary hover:text-primary-600'
                      }`}
                    >
                      Avg Time
                    </button>
                  </div>
                </div>
                
                {/* Simple Bar Chart */}
                <div className="space-y-4">
                  {processingTrendData.map((data, index) => {
                    const value = selectedMetric === 'documents' ? data.documents : data.avgTime;
                    const maxValue = selectedMetric === 'documents' 
                      ? Math.max(...processingTrendData.map(d => d.documents))
                      : Math.max(...processingTrendData.map(d => d.avgTime));
                    const percentage = (value / maxValue) * 100;
                    
                    return (
                      <div key={index} className="flex items-center space-x-4">
                        <div className="w-12 text-sm text-text-secondary font-medium">
                          {data.month}
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-background-secondary rounded-full h-6 relative">
                            <div 
                              className="bg-primary-600 h-6 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              <span className="text-white text-xs font-medium">
                                {selectedMetric === 'documents' ? value : `${value}s`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            {/* Top Search Terms */}
            <div className="card">
              <h3 className="text-lg font-medium text-text-primary mb-6">
                Top Search Terms
              </h3>
              
              <div className="space-y-4">
                {topSearchTerms.map((term, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-text-primary font-medium">{term.term}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-text-secondary">{term.count}</span>
                      {getTrendIcon(term.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Performance */}
            <div className="card">
              <h3 className="text-lg font-medium text-text-primary mb-6">
                System Performance
              </h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary">CPU Usage</span>
                    <span className="text-text-primary font-medium">34%</span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-2">
                    <div className="bg-success-500 h-2 rounded-full" style={{ width: '34%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary">Memory Usage</span>
                    <span className="text-text-primary font-medium">67%</span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-2">
                    <div className="bg-warning-500 h-2 rounded-full" style={{ width: '67%' }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-text-secondary">Storage Usage</span>
                    <span className="text-text-primary font-medium">23%</span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-2">
                    <div className="bg-info-500 h-2 rounded-full" style={{ width: '23%' }} />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border-primary">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                    <span className="text-sm text-success-600 font-medium">All systems operational</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AnalyticsPage;