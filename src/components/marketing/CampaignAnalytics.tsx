/**
 * Campaign Analytics Component
 * Designed by: Marketing Specialist + Data Analyst
 * 
 * Detailed analytics and performance metrics for email campaigns
 */

import React, { useState } from 'react';

interface AnalyticsData {
  campaignId: string;
  campaignName: string;
  type: string;
  sentDate: string;
  recipients: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  conversionRate?: number;
}

interface CampaignAnalyticsProps {
  campaigns: AnalyticsData[];
  timeRange: string;
}

const CampaignAnalytics: React.FC<CampaignAnalyticsProps> = ({
  campaigns,
  timeRange
}) => {
  const [selectedMetric, setSelectedMetric] = useState<'openRate' | 'clickRate' | 'bounceRate'>('openRate');
  const [sortBy, setSortBy] = useState<'performance' | 'date' | 'recipients'>('performance');

  // Calculate aggregate metrics
  const totalRecipients = campaigns.reduce((sum, c) => sum + c.recipients, 0);
  const totalDelivered = campaigns.reduce((sum, c) => sum + c.delivered, 0);
  const totalOpened = campaigns.reduce((sum, c) => sum + c.opened, 0);
  const totalClicked = campaigns.reduce((sum, c) => sum + c.clicked, 0);
  const totalBounced = campaigns.reduce((sum, c) => sum + c.bounced, 0);

  const overallOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
  const overallClickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
  const overallBounceRate = totalRecipients > 0 ? (totalBounced / totalRecipients) * 100 : 0;

  // Industry benchmarks for comparison
  const industryBenchmarks = {
    openRate: 21.33, // Real estate industry average
    clickRate: 2.54,
    bounceRate: 9.69
  };

  const getBenchmarkComparison = (value: number, benchmark: number) => {
    const difference = value - benchmark;
    const isAbove = difference > 0;
    const percentage = Math.abs(difference);
    
    return {
      isAbove,
      percentage: percentage.toFixed(1),
      text: isAbove ? 'above industry avg' : 'below industry avg',
      color: isAbove ? 'text-success-600' : 'text-error-600'
    };
  };

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    switch (sortBy) {
      case 'performance':
        return b[selectedMetric] - a[selectedMetric];
      case 'date':
        return new Date(b.sentDate).getTime() - new Date(a.sentDate).getTime();
      case 'recipients':
        return b.recipients - a.recipients;
      default:
        return 0;
    }
  });

  const getMetricColor = (value: number, benchmark: number) => {
    return value >= benchmark ? 'text-success-600' : 'text-warning-600';
  };

  return (
    <div className="space-y-8">
      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Open Rate</h3>
            <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-text-primary">{overallOpenRate.toFixed(1)}%</p>
            <div className="flex items-center space-x-2">
              <span className={getBenchmarkComparison(overallOpenRate, industryBenchmarks.openRate).color}>
                {getBenchmarkComparison(overallOpenRate, industryBenchmarks.openRate).percentage}%
              </span>
              <span className="text-xs text-text-tertiary">
                {getBenchmarkComparison(overallOpenRate, industryBenchmarks.openRate).text}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{totalOpened.toLocaleString()} of {totalDelivered.toLocaleString()} delivered</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Click Rate</h3>
            <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-text-primary">{overallClickRate.toFixed(1)}%</p>
            <div className="flex items-center space-x-2">
              <span className={getBenchmarkComparison(overallClickRate, industryBenchmarks.clickRate).color}>
                {getBenchmarkComparison(overallClickRate, industryBenchmarks.clickRate).percentage}%
              </span>
              <span className="text-xs text-text-tertiary">
                {getBenchmarkComparison(overallClickRate, industryBenchmarks.clickRate).text}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{totalClicked.toLocaleString()} total clicks</p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-text-primary">Bounce Rate</h3>
            <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-bold text-text-primary">{overallBounceRate.toFixed(1)}%</p>
            <div className="flex items-center space-x-2">
              <span className={getBenchmarkComparison(overallBounceRate, industryBenchmarks.bounceRate).color}>
                {getBenchmarkComparison(overallBounceRate, industryBenchmarks.bounceRate).percentage}%
              </span>
              <span className="text-xs text-text-tertiary">
                {getBenchmarkComparison(overallBounceRate, industryBenchmarks.bounceRate).text}
              </span>
            </div>
            <p className="text-sm text-text-secondary">{totalBounced.toLocaleString()} bounced emails</p>
          </div>
        </div>
      </div>

      {/* Performance Chart Placeholder */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text-primary">Performance Trends</h3>
          <div className="flex items-center space-x-4">
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="input text-sm"
            >
              <option value="openRate">Open Rate</option>
              <option value="clickRate">Click Rate</option>
              <option value="bounceRate">Bounce Rate</option>
            </select>
          </div>
        </div>
        
        {/* Mock chart area */}
        <div className="h-64 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <svg className="w-16 h-16 text-primary-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-primary-600 font-medium">Interactive Performance Chart</p>
            <p className="text-sm text-text-secondary">
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1).replace('Rate', ' Rate')} Over Time
            </p>
          </div>
        </div>
      </div>

      {/* Detailed Campaign Performance */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-text-primary">Campaign Performance</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input text-sm"
          >
            <option value="performance">Sort by Performance</option>
            <option value="date">Sort by Date</option>
            <option value="recipients">Sort by Recipients</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-primary">
                <th className="text-left py-3 text-sm font-medium text-text-secondary">Campaign</th>
                <th className="text-right py-3 text-sm font-medium text-text-secondary">Recipients</th>
                <th className="text-right py-3 text-sm font-medium text-text-secondary">Delivered</th>
                <th className="text-right py-3 text-sm font-medium text-text-secondary">Open Rate</th>
                <th className="text-right py-3 text-sm font-medium text-text-secondary">Click Rate</th>
                <th className="text-right py-3 text-sm font-medium text-text-secondary">Bounce Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map((campaign) => (
                <tr key={campaign.campaignId} className="border-b border-border-primary">
                  <td className="py-4">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{campaign.campaignName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-text-tertiary capitalize">{campaign.type.replace('_', ' ')}</span>
                        <span className="text-xs text-text-tertiary">•</span>
                        <span className="text-xs text-text-tertiary">{campaign.sentDate}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 text-right text-sm text-text-primary">
                    {campaign.recipients.toLocaleString()}
                  </td>
                  <td className="py-4 text-right text-sm text-text-primary">
                    {campaign.delivered.toLocaleString()}
                  </td>
                  <td className="py-4 text-right">
                    <span className={`text-sm font-medium ${getMetricColor(campaign.openRate, industryBenchmarks.openRate)}`}>
                      {campaign.openRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`text-sm font-medium ${getMetricColor(campaign.clickRate, industryBenchmarks.clickRate)}`}>
                      {campaign.clickRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className={`text-sm font-medium ${campaign.bounceRate <= industryBenchmarks.bounceRate ? 'text-success-600' : 'text-warning-600'}`}>
                      {campaign.bounceRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Key Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-success-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-text-primary">Strong Open Rates</p>
                <p className="text-xs text-text-secondary">Your open rates are {getBenchmarkComparison(overallOpenRate, industryBenchmarks.openRate).percentage}% above industry average</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-info-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-text-primary">Click Engagement</p>
                <p className="text-xs text-text-secondary">Welcome series campaigns show highest click-through rates</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-2 h-2 bg-warning-600 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-text-primary">Bounce Rate Health</p>
                <p className="text-xs text-text-secondary">Maintain current list hygiene practices</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-text-primary mb-4">Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-bold text-xs">1</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Optimize Send Times</p>
                <p className="text-xs text-text-secondary">Test sending campaigns on Tuesday-Thursday, 10-11 AM for better engagement</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-bold text-xs">2</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">A/B Test Subject Lines</p>
                <p className="text-xs text-text-secondary">Try personalized subject lines to improve open rates further</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-primary-100 rounded flex items-center justify-center flex-shrink-0">
                <span className="text-primary-600 font-bold text-xs">3</span>
              </div>
              <div>
                <p className="text-sm font-medium text-text-primary">Segment Audiences</p>
                <p className="text-xs text-text-secondary">Create targeted campaigns for different homeowner segments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalytics;