/**
 * Enterprise Analytics Dashboard
 * Comprehensive analytics for title agency operations
 */

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';

interface MetricCard {
  id: string;
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  subtitle?: string;
  icon: string;
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    fill?: boolean;
  }[];
}

const AnalyticsDashboard: React.FC = () => {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);

  // Mock real-time metrics
  const realtimeMetrics: MetricCard[] = [
    {
      id: 'api-uptime',
      title: 'API Uptime',
      value: '99.98%',
      subtitle: 'Last 30 days',
      trend: 'stable',
      icon: 'server',
      color: 'success'
    },
    {
      id: 'sync-success',
      title: 'Sync Success Rate',
      value: '98.5%',
      change: 2.3,
      trend: 'up',
      subtitle: 'This week',
      icon: 'sync',
      color: 'primary'
    },
    {
      id: 'avg-response',
      title: 'Avg Response Time',
      value: '142ms',
      change: -15,
      trend: 'down',
      subtitle: 'P95 latency',
      icon: 'clock',
      color: 'info'
    },
    {
      id: 'error-rate',
      title: 'Error Rate',
      value: '0.12%',
      change: -0.05,
      trend: 'down',
      subtitle: 'Last 24 hours',
      icon: 'alert',
      color: 'warning'
    }
  ];

  // Business intelligence metrics
  const businessMetrics = {
    transactions: {
      total: 847,
      completed: 612,
      inProgress: 183,
      upcoming: 52,
      avgCloseTime: 28.5,
      avgValue: 385000
    },
    people: {
      totalContacts: 3241,
      activeHomeowners: 2156,
      newLeadsThisMonth: 89,
      conversionRate: 12.3
    },
    revenue: {
      totalCommissions: 2145000,
      avgCommissionPerTransaction: 3500,
      projectedMonthly: 285000,
      yearOverYearGrowth: 23.5
    }
  };

  // Mock chart data for transaction trends
  const transactionTrendData: ChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Completed Transactions',
        data: [65, 72, 78, 85, 89, 94, 102],
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        fill: true
      },
      {
        label: 'New Listings',
        data: [95, 105, 98, 112, 118, 125, 132],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true
      }
    ]
  };

  // Performance monitoring data
  const performanceData = {
    systemHealth: {
      cpu: 42,
      memory: 68,
      storage: 35,
      network: 'Normal'
    },
    dataQuality: {
      completeness: 94.5,
      accuracy: 99.2,
      consistency: 97.8,
      timeliness: 96.3
    },
    syncOperations: {
      lastSync: '2 minutes ago',
      recordsProcessed: 1247,
      failedRecords: 3,
      nextScheduled: 'in 28 minutes'
    }
  };

  const getIcon = (iconName: string) => {
    const iconClasses = "w-6 h-6";
    
    switch (iconName) {
      case 'server':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      case 'sync':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'alert':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'chart':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
      case 'error':
        return 'bg-error-100 text-error-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <>
      <Head>
        <title>Analytics Dashboard - ROI Systems</title>
        <meta name="description" content="Enterprise analytics and monitoring dashboard" />
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
                  Real-time monitoring and business intelligence
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <select 
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="input"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="90d">Last 90 Days</option>
                </select>
                
                <button 
                  onClick={() => setIsLoading(!isLoading)}
                  className="btn-outline"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-border-primary mb-6">
            <nav className="flex space-x-8">
              {['overview', 'integration', 'business', 'performance', 'alerts'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <>
              {/* Real-time Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {realtimeMetrics.map((metric) => (
                  <div key={metric.id} className="card">
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
                                metric.trend === 'up' ? 'text-success-600' : 
                                metric.trend === 'down' ? 'text-error-600' : 
                                'text-text-tertiary'
                              }`} 
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              {metric.trend === 'up' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                              ) : metric.trend === 'down' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                              ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                              )}
                            </svg>
                            <span className={`text-sm ${
                              metric.trend === 'up' ? 'text-success-600' : 
                              metric.trend === 'down' ? 'text-error-600' : 
                              'text-text-tertiary'
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

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Transaction Trends Chart */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Transaction Trends</h2>
                  <div className="h-64 bg-background-secondary rounded-lg flex items-center justify-center">
                    <p className="text-text-tertiary">Transaction trend chart visualization</p>
                  </div>
                </div>

                {/* Revenue Analytics */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-text-primary mb-6">Revenue Analytics</h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between pb-4 border-b border-border-primary">
                      <div>
                        <p className="text-sm text-text-tertiary">Total Commissions</p>
                        <p className="text-2xl font-bold text-text-primary">
                          {formatCurrency(businessMetrics.revenue.totalCommissions)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-text-tertiary">YoY Growth</p>
                        <p className="text-lg font-medium text-success-600">
                          +{businessMetrics.revenue.yearOverYearGrowth}%
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-text-tertiary">Avg per Transaction</p>
                        <p className="text-lg font-medium text-text-primary">
                          {formatCurrency(businessMetrics.revenue.avgCommissionPerTransaction)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-text-tertiary">Projected Monthly</p>
                        <p className="text-lg font-medium text-text-primary">
                          {formatCurrency(businessMetrics.revenue.projectedMonthly)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Intelligence Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Transactions Summary */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Transactions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Total</span>
                      <span className="font-medium text-text-primary">{businessMetrics.transactions.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Completed</span>
                      <span className="font-medium text-success-600">{businessMetrics.transactions.completed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">In Progress</span>
                      <span className="font-medium text-warning-600">{businessMetrics.transactions.inProgress}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Avg Close Time</span>
                      <span className="font-medium text-text-primary">{businessMetrics.transactions.avgCloseTime} days</span>
                    </div>
                  </div>
                </div>

                {/* People Analytics */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">People & Leads</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Total Contacts</span>
                      <span className="font-medium text-text-primary">{formatNumber(businessMetrics.people.totalContacts)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Active Homeowners</span>
                      <span className="font-medium text-success-600">{formatNumber(businessMetrics.people.activeHomeowners)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">New Leads</span>
                      <span className="font-medium text-info-600">{businessMetrics.people.newLeadsThisMonth}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Conversion Rate</span>
                      <span className="font-medium text-text-primary">{businessMetrics.people.conversionRate}%</span>
                    </div>
                  </div>
                </div>

                {/* System Health */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">System Health</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">CPU Usage</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-success-600 h-2 rounded-full" 
                            style={{ width: `${performanceData.systemHealth.cpu}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-primary">{performanceData.systemHealth.cpu}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Memory</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-warning-600 h-2 rounded-full" 
                            style={{ width: `${performanceData.systemHealth.memory}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-primary">{performanceData.systemHealth.memory}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Storage</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-success-600 h-2 rounded-full" 
                            style={{ width: `${performanceData.systemHealth.storage}%` }}
                          />
                        </div>
                        <span className="text-sm text-text-primary">{performanceData.systemHealth.storage}%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">Network</span>
                      <span className="text-sm font-medium text-success-600">{performanceData.systemHealth.network}</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'integration' && (
            <div className="space-y-6">
              {/* API Performance */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">API Performance</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Response Times */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">Response Time Distribution</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-secondary">P50 (Median)</span>
                          <span className="text-sm font-medium text-text-primary">85ms</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-success-600 h-2 rounded-full" style={{ width: '85%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-secondary">P95</span>
                          <span className="text-sm font-medium text-text-primary">142ms</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-warning-600 h-2 rounded-full" style={{ width: '95%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text-secondary">P99</span>
                          <span className="text-sm font-medium text-text-primary">284ms</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-error-600 h-2 rounded-full" style={{ width: '99%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* API Endpoints */}
                  <div>
                    <h3 className="text-lg font-medium text-text-primary mb-4">Top API Endpoints</h3>
                    <div className="space-y-2">
                      {[
                        { endpoint: '/api/transactions', calls: 15420, avgTime: '98ms' },
                        { endpoint: '/api/people', calls: 12350, avgTime: '76ms' },
                        { endpoint: '/api/sync', calls: 8940, avgTime: '156ms' },
                        { endpoint: '/api/documents', calls: 6780, avgTime: '124ms' }
                      ].map((api, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                          <div>
                            <p className="font-medium text-text-primary">{api.endpoint}</p>
                            <p className="text-sm text-text-tertiary">{formatNumber(api.calls)} calls</p>
                          </div>
                          <span className="text-sm font-medium text-text-primary">{api.avgTime}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sync Operations */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Sync Operations</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-text-primary">{formatNumber(performanceData.syncOperations.recordsProcessed)}</p>
                    <p className="text-sm text-text-tertiary">Records Processed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-error-600">{performanceData.syncOperations.failedRecords}</p>
                    <p className="text-sm text-text-tertiary">Failed Records</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-text-primary">{performanceData.syncOperations.lastSync}</p>
                    <p className="text-sm text-text-tertiary">Last Sync</p>
                  </div>
                </div>

                {/* Sync History */}
                <div className="border-t border-border-primary pt-4">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Recent Sync Operations</h3>
                  <div className="space-y-2">
                    {[
                      { time: '2 minutes ago', type: 'Full Sync', records: 1247, status: 'success', duration: '45s' },
                      { time: '32 minutes ago', type: 'Incremental', records: 89, status: 'success', duration: '8s' },
                      { time: '1 hour ago', type: 'Incremental', records: 156, status: 'partial', duration: '12s' },
                      { time: '2 hours ago', type: 'Full Sync', records: 1198, status: 'success', duration: '42s' }
                    ].map((sync, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            sync.status === 'success' ? 'bg-success-600' : 
                            sync.status === 'partial' ? 'bg-warning-600' : 
                            'bg-error-600'
                          }`} />
                          <div>
                            <p className="font-medium text-text-primary">{sync.type}</p>
                            <p className="text-sm text-text-tertiary">{sync.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-text-primary">{formatNumber(sync.records)} records</p>
                          <p className="text-xs text-text-tertiary">{sync.duration}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'business' && (
            <div className="space-y-6">
              {/* Transaction Pipeline */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Transaction Pipeline</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {[
                    { stage: 'New Leads', count: 45, value: 17325000, color: 'info' },
                    { stage: 'In Contract', count: 32, value: 12320000, color: 'warning' },
                    { stage: 'Pending Close', count: 18, value: 6930000, color: 'primary' },
                    { stage: 'Closed', count: 89, value: 34265000, color: 'success' }
                  ].map((stage, index) => (
                    <div key={index} className={`p-4 rounded-lg border-2 border-${stage.color}-200 bg-${stage.color}-50`}>
                      <h3 className={`text-lg font-semibold text-${stage.color}-800 mb-2`}>{stage.stage}</h3>
                      <p className="text-2xl font-bold text-text-primary">{stage.count}</p>
                      <p className="text-sm text-text-secondary mt-1">{formatCurrency(stage.value)}</p>
                    </div>
                  ))}
                </div>

                {/* Conversion Funnel */}
                <div className="border-t border-border-primary pt-6">
                  <h3 className="text-lg font-medium text-text-primary mb-4">Conversion Funnel</h3>
                  <div className="space-y-3">
                    {[
                      { stage: 'Website Visitors', value: 2450, percentage: 100 },
                      { stage: 'Lead Inquiries', value: 380, percentage: 15.5 },
                      { stage: 'Qualified Leads', value: 125, percentage: 5.1 },
                      { stage: 'Active Transactions', value: 45, percentage: 1.8 },
                      { stage: 'Closed Deals', value: 32, percentage: 1.3 }
                    ].map((funnel, index) => (
                      <div key={index}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-text-primary">{funnel.stage}</span>
                          <span className="text-sm text-text-secondary">{formatNumber(funnel.value)} ({funnel.percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className="bg-primary-600 h-3 rounded-full transition-all duration-300" 
                            style={{ width: `${funnel.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Market Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Property Types */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Transaction by Property Type</h3>
                  <div className="space-y-3">
                    {[
                      { type: 'Single Family', count: 156, percentage: 52 },
                      { type: 'Condo/Townhome', count: 78, percentage: 26 },
                      { type: 'Multi-Family', count: 36, percentage: 12 },
                      { type: 'Commercial', count: 24, percentage: 8 },
                      { type: 'Land', count: 6, percentage: 2 }
                    ].map((property, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className="text-sm font-medium text-text-primary w-32">{property.type}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary-600 h-2 rounded-full" 
                                style={{ width: `${property.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-text-secondary">{property.count} ({property.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Agents */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Top Performing Agents</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'Sarah Williams', transactions: 28, volume: 10780000 },
                      { name: 'Michael Johnson', transactions: 24, volume: 9240000 },
                      { name: 'Emily Davis', transactions: 22, volume: 8470000 },
                      { name: 'James Brown', transactions: 19, volume: 7315000 },
                      { name: 'Lisa Martinez', transactions: 17, volume: 6545000 }
                    ].map((agent, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                        <div>
                          <p className="font-medium text-text-primary">{agent.name}</p>
                          <p className="text-sm text-text-tertiary">{agent.transactions} transactions</p>
                        </div>
                        <p className="text-sm font-medium text-text-primary">{formatCurrency(agent.volume)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6">
              {/* Data Quality Metrics */}
              <div className="card">
                <h2 className="text-xl font-semibold text-text-primary mb-6">Data Quality Metrics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {Object.entries(performanceData.dataQuality).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle
                            className="text-gray-200"
                            strokeWidth="8"
                            stroke="currentColor"
                            fill="transparent"
                            r="36"
                            cx="48"
                            cy="48"
                          />
                          <circle
                            className="text-primary-600"
                            strokeWidth="8"
                            strokeDasharray={`${value * 2.26} 226`}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="36"
                            cx="48"
                            cy="48"
                          />
                        </svg>
                        <span className="absolute text-xl font-bold text-text-primary">{value}%</span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-text-primary capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* System Resources */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">System Resources</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">CPU Usage</span>
                        <span className="text-sm text-text-secondary">{performanceData.systemHealth.cpu}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            performanceData.systemHealth.cpu < 70 ? 'bg-success-600' : 
                            performanceData.systemHealth.cpu < 85 ? 'bg-warning-600' : 
                            'bg-error-600'
                          }`}
                          style={{ width: `${performanceData.systemHealth.cpu}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">Memory Usage</span>
                        <span className="text-sm text-text-secondary">{performanceData.systemHealth.memory}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            performanceData.systemHealth.memory < 70 ? 'bg-success-600' : 
                            performanceData.systemHealth.memory < 85 ? 'bg-warning-600' : 
                            'bg-error-600'
                          }`}
                          style={{ width: `${performanceData.systemHealth.memory}%` }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-text-primary">Storage Usage</span>
                        <span className="text-sm text-text-secondary">{performanceData.systemHealth.storage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={`h-3 rounded-full ${
                            performanceData.systemHealth.storage < 70 ? 'bg-success-600' : 
                            performanceData.systemHealth.storage < 85 ? 'bg-warning-600' : 
                            'bg-error-600'
                          }`}
                          style={{ width: `${performanceData.systemHealth.storage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cost Optimization */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Cost Optimization</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-success-50 border border-success-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-success-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-success-800 font-medium">API Call Optimization</p>
                          <p className="text-success-700 text-sm mt-1">
                            Batch processing can reduce API calls by 35%
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-info-50 border border-info-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-info-800 font-medium">Storage Optimization</p>
                          <p className="text-info-700 text-sm mt-1">
                            Archive old transactions to save 40% storage costs
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 bg-warning-50 border border-warning-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-warning-800 font-medium">Sync Frequency</p>
                          <p className="text-warning-700 text-sm mt-1">
                            Reduce sync frequency during off-hours
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-6">
              {/* Active Alerts */}
              <div className="card">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-text-primary">Active Alerts</h2>
                  <button className="btn-outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Configure Alerts
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Critical Alert */}
                  <div className="border-l-4 border-error-600 bg-error-50 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-error-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3 flex-1">
                        <h3 className="text-error-800 font-medium">API Response Time Degradation</h3>
                        <p className="text-error-700 text-sm mt-1">
                          P95 response time increased to 284ms (threshold: 200ms)
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-error-600">5 minutes ago</span>
                          <button className="text-error-700 hover:text-error-800 font-medium">Investigate</button>
                          <button className="text-error-700 hover:text-error-800 font-medium">Acknowledge</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Warning Alert */}
                  <div className="border-l-4 border-warning-600 bg-warning-50 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="ml-3 flex-1">
                        <h3 className="text-warning-800 font-medium">High Memory Usage</h3>
                        <p className="text-warning-700 text-sm mt-1">
                          Memory usage at 78% and trending upward
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-warning-600">23 minutes ago</span>
                          <button className="text-warning-700 hover:text-warning-800 font-medium">View Details</button>
                          <button className="text-warning-700 hover:text-warning-800 font-medium">Dismiss</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Info Alert */}
                  <div className="border-l-4 border-info-600 bg-info-50 p-4 rounded-r-lg">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-info-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="ml-3 flex-1">
                        <h3 className="text-info-800 font-medium">Scheduled Maintenance</h3>
                        <p className="text-info-700 text-sm mt-1">
                          System maintenance scheduled for tonight at 2:00 AM EST
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm">
                          <span className="text-info-600">1 hour ago</span>
                          <button className="text-info-700 hover:text-info-800 font-medium">View Schedule</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Alert Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alert Rules */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Alert Rules</h3>
                  <div className="space-y-3">
                    {[
                      { name: 'API Response Time', threshold: '>200ms', status: 'active', severity: 'critical' },
                      { name: 'Error Rate', threshold: '>1%', status: 'active', severity: 'warning' },
                      { name: 'Memory Usage', threshold: '>80%', status: 'active', severity: 'warning' },
                      { name: 'Sync Failures', threshold: '>5', status: 'active', severity: 'critical' },
                      { name: 'Storage Space', threshold: '<10GB', status: 'inactive', severity: 'info' }
                    ].map((rule, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-2 h-2 rounded-full ${
                            rule.status === 'active' ? 'bg-success-600' : 'bg-gray-400'
                          }`} />
                          <div>
                            <p className="font-medium text-text-primary">{rule.name}</p>
                            <p className="text-sm text-text-tertiary">Threshold: {rule.threshold}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          rule.severity === 'critical' ? 'bg-error-100 text-error-700' :
                          rule.severity === 'warning' ? 'bg-warning-100 text-warning-700' :
                          'bg-info-100 text-info-700'
                        }`}>
                          {rule.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notification Channels */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">Notification Channels</h3>
                  <div className="space-y-3">
                    {[
                      { channel: 'Email', recipients: 'team@titleagency.com', status: 'active' },
                      { channel: 'Slack', recipients: '#alerts-channel', status: 'active' },
                      { channel: 'SMS', recipients: '3 team members', status: 'active' },
                      { channel: 'Webhook', recipients: 'monitoring.api/webhook', status: 'inactive' }
                    ].map((channel, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-background-secondary rounded-lg">
                        <div>
                          <p className="font-medium text-text-primary">{channel.channel}</p>
                          <p className="text-sm text-text-tertiary">{channel.recipients}</p>
                        </div>
                        <button className={`text-sm font-medium ${
                          channel.status === 'active' ? 'text-success-600' : 'text-text-tertiary'
                        }`}>
                          {channel.status === 'active' ? 'Active' : 'Inactive'}
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button className="mt-4 btn-outline w-full">
                    Add Notification Channel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default AnalyticsDashboard;