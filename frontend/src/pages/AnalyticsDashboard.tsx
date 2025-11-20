import { useState } from 'react';
import {
  TrendingUp, TrendingDown, DollarSign, Users, Target, Award,
  Calendar, Filter, Download, RefreshCw, ChevronRight, AlertCircle,
  CheckCircle, XCircle, Clock, Zap, Brain, BarChart3, PieChart,
  LineChart, Activity, Home
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart as RechartsLineChart, Line,
  PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import DemoHeader from '../components/DemoHeader';
import Breadcrumb from '../components/Breadcrumb';

// Using inline types for now - can be moved to analytics.ts later
type AlertPerformanceMetrics = any;
type ClientLifecycleMetrics = any;
type RevenueMetrics = any;
type CompetitiveMetrics = any;
type PredictiveInsights = any;

// Mock data
const alertPerformanceData: AlertPerformanceMetrics = {
  period: 'month',
  startDate: '2025-09-01',
  endDate: '2025-09-30',
  totalAlerts: 247,
  truePositives: 189,
  falsePositives: 34,
  missedOpportunities: 24,
  accuracy: 84.7,
  precision: 84.8,
  recall: 88.7,
  averageResponseTime: 2.4,
  conversionRate: 31.2,
  alertsByType: [
    { type: 'Ready to Buy', count: 78, conversions: 28, conversionRate: 35.9 },
    { type: 'Ready to Sell', count: 65, conversions: 22, conversionRate: 33.8 },
    { type: 'Ready to Refinance', count: 42, conversions: 11, conversionRate: 26.2 },
    { type: 'Market Opportunity', count: 31, conversions: 7, conversionRate: 22.6 },
    { type: 'Life Event', count: 18, conversions: 6, conversionRate: 33.3 },
    { type: 'High Engagement', count: 13, conversions: 5, conversionRate: 38.5 }
  ],
  alertsBySource: [
    { source: 'behavioral', count: 142, accuracy: 87.3 },
    { source: 'market_trigger', count: 58, accuracy: 82.8 },
    { source: 'anniversary', count: 31, accuracy: 90.3 },
    { source: 'referral', count: 16, accuracy: 93.8 }
  ],
  performanceTrend: [
    { date: '2025-09-01', alerts: 8, conversions: 2, accuracy: 82 },
    { date: '2025-09-05', alerts: 12, conversions: 4, accuracy: 84 },
    { date: '2025-09-10', alerts: 15, conversions: 5, accuracy: 85 },
    { date: '2025-09-15', alerts: 18, conversions: 6, accuracy: 86 },
    { date: '2025-09-20', alerts: 14, conversions: 5, accuracy: 85 },
    { date: '2025-09-25', alerts: 16, conversions: 6, accuracy: 87 },
    { date: '2025-09-30', alerts: 11, conversions: 4, accuracy: 88 }
  ]
};

const clientLifecycleData: ClientLifecycleMetrics = {
  period: 'month',
  startDate: '2025-09-01',
  endDate: '2025-09-30',
  totalClients: 342,
  newClients: 28,
  activeClients: 156,
  dormantClients: 158,
  lostClients: 12,
  averageLifecycleTime: 247,
  stageDistribution: [
    { stage: 'Lead', count: 89, percentage: 26.0, avgTime: 14 },
    { stage: 'Qualified', count: 67, percentage: 19.6, avgTime: 21 },
    { stage: 'Engaged', count: 54, percentage: 15.8, avgTime: 35 },
    { stage: 'Negotiating', count: 38, percentage: 11.1, avgTime: 28 },
    { stage: 'Under Contract', count: 24, percentage: 7.0, avgTime: 45 },
    { stage: 'Closed', count: 70, percentage: 20.5, avgTime: 0 }
  ],
  conversionFunnel: [
    { stage: 'Lead', count: 342, percentage: 100 },
    { stage: 'Qualified', count: 253, percentage: 74.0 },
    { stage: 'Engaged', count: 186, percentage: 54.4 },
    { stage: 'Negotiating', count: 124, percentage: 36.3 },
    { stage: 'Under Contract', count: 94, percentage: 27.5 },
    { stage: 'Closed', count: 70, percentage: 20.5 }
  ],
  dropOffPoints: [
    { stage: 'Lead → Qualified', dropOff: 89, percentage: 26.0, reason: 'Not responsive' },
    { stage: 'Qualified → Engaged', dropOff: 67, percentage: 19.6, reason: 'Lost interest' },
    { stage: 'Engaged → Negotiating', dropOff: 62, percentage: 18.1, reason: 'Price concerns' }
  ]
};

const revenueData: RevenueMetrics = {
  period: 'month',
  startDate: '2025-09-01',
  endDate: '2025-09-30',
  totalRevenue: 487500,
  alertSourcedRevenue: 152250,
  alertSourcedPercentage: 31.2,
  averageDealSize: 6964,
  totalDeals: 70,
  alertSourcedDeals: 22,
  projectedRevenue: 625000,
  pipelineValue: 1847000,
  revenueByAlertType: [
    { type: 'Ready to Buy', revenue: 195300, deals: 28, avgDealSize: 6975 },
    { type: 'Ready to Sell', revenue: 154000, deals: 22, avgDealSize: 7000 },
    { type: 'Ready to Refinance', revenue: 76450, deals: 11, avgDealSize: 6950 }
  ],
  revenueGrowth: {
    mom: 12.4,
    qoq: 18.7,
    yoy: 24.3
  },
  revenueTrend: [
    { month: 'Mar', revenue: 385000, alertSourced: 98000 },
    { month: 'Apr', revenue: 412000, alertSourced: 115000 },
    { month: 'May', revenue: 445000, alertSourced: 128000 },
    { month: 'Jun', revenue: 468000, alertSourced: 138000 },
    { month: 'Jul', revenue: 434000, alertSourced: 125000 },
    { month: 'Aug', revenue: 456000, alertSourced: 142000 },
    { month: 'Sep', revenue: 487500, alertSourced: 152250 }
  ]
};

const competitiveData: CompetitiveMetrics = {
  period: 'month',
  marketRanking: 3,
  totalAgents: 247,
  marketShare: 8.4,
  averageResponseTime: 2.4,
  marketAverageResponseTime: 4.8,
  conversionRate: 31.2,
  marketAverageConversionRate: 18.5,
  clientSatisfaction: 4.7,
  marketAverageClientSatisfaction: 4.1,
  leaderboard: [
    { rank: 1, agentName: 'Sarah Mitchell', deals: 12, revenue: 84000, responseTime: 1.8 },
    { rank: 2, agentName: 'John Davis', deals: 10, revenue: 72000, responseTime: 2.1 },
    { rank: 3, agentName: 'You', deals: 9, revenue: 63000, responseTime: 2.4, isCurrentUser: true },
    { rank: 4, agentName: 'Emily Chen', deals: 8, revenue: 58000, responseTime: 2.7 },
    { rank: 5, agentName: 'Michael Brown', deals: 7, revenue: 52000, responseTime: 3.2 }
  ],
  teamPerformance: {
    totalDeals: 156,
    totalRevenue: 1092000,
    averageDealsPerAgent: 6.3,
    topPerformers: 12
  }
};

const predictiveData: PredictiveInsights = {
  period: 'month',
  generatedAt: new Date().toISOString(),
  nextBestActions: [
    {
      clientId: 'c1',
      clientName: 'Sarah Johnson',
      action: 'Schedule property showing',
      reason: 'High engagement on recent listings',
      confidence: 87,
      expectedOutcome: 'Likely to make offer within 2 weeks',
      priority: 'high'
    },
    {
      clientId: 'c2',
      clientName: 'Michael Chen',
      action: 'Send market analysis',
      reason: 'Property value increased 8% in area',
      confidence: 82,
      expectedOutcome: 'May list property in next 30 days',
      priority: 'high'
    },
    {
      clientId: 'c3',
      clientName: 'Emma Wilson',
      action: 'Follow up on refinance',
      reason: 'Interest rates dropped 0.5%',
      confidence: 76,
      expectedOutcome: 'Refinance application likely',
      priority: 'medium'
    }
  ],
  optimalContactTimes: [
    { clientId: 'c1', clientName: 'Sarah Johnson', day: 'Tuesday', time: '6:00 PM', confidence: 89 },
    { clientId: 'c2', clientName: 'Michael Chen', day: 'Thursday', time: '12:00 PM', confidence: 84 },
    { clientId: 'c3', clientName: 'Emma Wilson', day: 'Wednesday', time: '7:30 PM', confidence: 81 }
  ],
  dealProbability: [
    { clientId: 'c1', clientName: 'Sarah Johnson', probability: 78, timeframe: '2 weeks', value: 425000 },
    { clientId: 'c2', clientName: 'Michael Chen', probability: 65, timeframe: '1 month', value: 580000 },
    { clientId: 'c3', clientName: 'Emma Wilson', probability: 54, timeframe: '6 weeks', value: 320000 }
  ],
  marketOpportunities: [
    {
      type: 'Price Drop',
      description: '3 properties in target area reduced by 10%+',
      affectedClients: 8,
      potentialRevenue: 168000,
      confidence: 82
    },
    {
      type: 'New Listings',
      description: '5 new listings match client criteria',
      affectedClients: 12,
      potentialRevenue: 252000,
      confidence: 75
    }
  ]
};

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

// Breadcrumb configuration
const breadcrumbItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Realtor Dashboard', path: '/dashboard/realtor' },
  { label: 'Analytics' }
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleExport = () => {
    try {
      // Convert analytics data to CSV format
      const csvData = generateCSV();

      // Create blob and download
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `analytics-report-${timestamp}.csv`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      console.log('Analytics data exported successfully');
    } catch (error) {
      console.error('Failed to export analytics:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const generateCSV = (): string => {
    const sections: string[] = [];

    // Header
    sections.push('ROI Systems - Analytics Report');
    sections.push(`Generated: ${new Date().toLocaleString()}`);
    sections.push(`Time Period: ${timeRange}`);
    sections.push('');

    // Key Metrics
    sections.push('KEY METRICS');
    sections.push('Metric,Value,Change');
    sections.push(`Alert Accuracy,${alertPerformanceData.accuracy}%,+2.3%`);
    sections.push(`Conversion Rate,${alertPerformanceData.conversionRate}%,+4.1%`);
    sections.push(`Alert-Sourced Revenue,$${(revenueData.alertSourcedRevenue / 1000).toFixed(0)}K,+12.4%`);
    sections.push(`Avg Response Time,${alertPerformanceData.averageResponseTime}h,-0.6h`);
    sections.push('');

    // Alert Performance by Type
    sections.push('ALERT PERFORMANCE BY TYPE');
    sections.push('Type,Count,Conversions,Conversion Rate');
    alertPerformanceData.alertsByType.forEach(alert => {
      sections.push(`${alert.type},${alert.count},${alert.conversions},${alert.conversionRate}%`);
    });
    sections.push('');

    // Revenue Data
    sections.push('REVENUE METRICS');
    sections.push('Metric,Value');
    sections.push(`Total Revenue,$${revenueData.totalRevenue.toLocaleString()}`);
    sections.push(`Alert-Sourced Revenue,$${revenueData.alertSourcedRevenue.toLocaleString()}`);
    sections.push(`Alert-Sourced Percentage,${revenueData.alertSourcedPercentage}%`);
    sections.push(`Average Deal Size,$${revenueData.averageDealSize.toLocaleString()}`);
    sections.push(`Total Deals,${revenueData.totalDeals}`);
    sections.push(`Alert-Sourced Deals,${revenueData.alertSourcedDeals}`);
    sections.push('');

    // Revenue Trend
    sections.push('REVENUE TREND');
    sections.push('Month,Total Revenue,Alert-Sourced Revenue');
    revenueData.revenueTrend.forEach(data => {
      sections.push(`${data.month},$${data.revenue.toLocaleString()},$${data.alertSourced.toLocaleString()}`);
    });
    sections.push('');

    // Client Lifecycle
    sections.push('CLIENT LIFECYCLE');
    sections.push('Stage,Count,Percentage,Avg Time (days)');
    clientLifecycleData.stageDistribution.forEach(stage => {
      sections.push(`${stage.stage},${stage.count},${stage.percentage}%,${stage.avgTime}`);
    });
    sections.push('');

    // Competitive Metrics
    sections.push('COMPETITIVE INSIGHTS');
    sections.push('Metric,Your Value,Market Average,Difference');
    sections.push(`Response Time,${competitiveData.averageResponseTime}h,${competitiveData.marketAverageResponseTime}h,${((competitiveData.marketAverageResponseTime - competitiveData.averageResponseTime) / competitiveData.marketAverageResponseTime * 100).toFixed(0)}% faster`);
    sections.push(`Conversion Rate,${competitiveData.conversionRate}%,${competitiveData.marketAverageConversionRate}%,+${(competitiveData.conversionRate - competitiveData.marketAverageConversionRate).toFixed(1)}%`);
    sections.push(`Client Satisfaction,${competitiveData.clientSatisfaction}/5.0,${competitiveData.marketAverageClientSatisfaction}/5.0,+${(competitiveData.clientSatisfaction - competitiveData.marketAverageClientSatisfaction).toFixed(1)}`);
    sections.push('');

    // Leaderboard
    sections.push('TEAM LEADERBOARD');
    sections.push('Rank,Agent,Deals,Revenue,Response Time');
    competitiveData.leaderboard.forEach(agent => {
      sections.push(`${agent.rank},${agent.agentName},${agent.deals},$${agent.revenue.toLocaleString()},${agent.responseTime}h`);
    });
    sections.push('');

    // Predictive Analytics
    sections.push('PREDICTIVE ANALYTICS - NEXT BEST ACTIONS');
    sections.push('Client,Action,Confidence,Expected Outcome');
    predictiveData.nextBestActions.forEach(action => {
      sections.push(`${action.clientName},"${action.action}",${action.confidence}%,"${action.expectedOutcome}"`);
    });

    return sections.join('\n');
  };

  return (
    <div className="analytics-dashboard">
      <DemoHeader dashboardName="Analytics Dashboard" isDemoMode={true} />
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="analytics-header">
        <div>
          <h1>Business Intelligence</h1>
          <p>Comprehensive analytics and predictive insights</p>
        </div>

        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="time-range-select"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>

          <button className="btn-secondary" onClick={handleRefresh}>
            <RefreshCw size={18} className={isRefreshing ? 'spinning' : ''} />
            Refresh
          </button>

          <button className="btn-primary" onClick={handleExport}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}>
            <Target size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Alert Accuracy</div>
            <div className="metric-value">{alertPerformanceData.accuracy}%</div>
            <div className="metric-change positive">
              <TrendingUp size={14} />
              <span>+2.3% vs last month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <Zap size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Conversion Rate</div>
            <div className="metric-value">{alertPerformanceData.conversionRate}%</div>
            <div className="metric-change positive">
              <TrendingUp size={14} />
              <span>+4.1% vs last month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <DollarSign size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Alert-Sourced Revenue</div>
            <div className="metric-value">${(revenueData.alertSourcedRevenue / 1000).toFixed(0)}K</div>
            <div className="metric-change positive">
              <TrendingUp size={14} />
              <span>+12.4% vs last month</span>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <Clock size={24} />
          </div>
          <div className="metric-content">
            <div className="metric-label">Avg Response Time</div>
            <div className="metric-value">{alertPerformanceData.averageResponseTime}h</div>
            <div className="metric-change positive">
              <TrendingDown size={14} />
              <span>-0.6h vs last month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Performance */}
      <div className="analytics-section">
        <div className="section-header">
          <div>
            <h2>Alert Performance Tracking</h2>
            <p>Monitor alert accuracy, response times, and conversion metrics</p>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card large">
            <h3>Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={alertPerformanceData.performanceTrend}>
                <defs>
                  <linearGradient id="colorAlerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="alerts" stroke="#2563eb" fillOpacity={1} fill="url(#colorAlerts)" name="Alerts" />
                <Area type="monotone" dataKey="conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorConversions)" name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>Alerts by Type</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={alertPerformanceData.alertsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.type}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {alertPerformanceData.alertsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="stats-grid">
          {alertPerformanceData.alertsByType.map((alert, index) => (
            <div key={index} className="stat-item">
              <div className="stat-header">
                <span className="stat-dot" style={{ background: COLORS[index % COLORS.length] }}></span>
                <span className="stat-label">{alert.type}</span>
              </div>
              <div className="stat-value">{alert.count} alerts</div>
              <div className="stat-meta">{alert.conversionRate}% conversion</div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Lifecycle */}
      <div className="analytics-section">
        <div className="section-header">
          <div>
            <h2>Client Lifecycle Analytics</h2>
            <p>Track client journey from lead to closed deal</p>
          </div>
        </div>

        <div className="charts-grid">
          <div className="chart-card large">
            <h3>Conversion Funnel</h3>
            <div className="funnel-chart">
              {clientLifecycleData.conversionFunnel.map((stage, index) => (
                <div key={index} className="funnel-stage">
                  <div
                    className="funnel-bar"
                    style={{
                      width: `${stage.percentage}%`,
                      background: `linear-gradient(135deg, ${COLORS[index % COLORS.length]} 0%, ${COLORS[(index + 1) % COLORS.length]} 100%)`
                    }}
                  >
                    <span className="funnel-label">{stage.stage}</span>
                    <span className="funnel-count">{stage.count} ({stage.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>Stage Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={clientLifecycleData.stageDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="stage" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Attribution */}
      <div className="analytics-section">
        <div className="section-header">
          <div>
            <h2>Revenue Attribution</h2>
            <p>Track revenue generated from business alerts</p>
          </div>
        </div>

        <div className="revenue-summary">
          <div className="revenue-card">
            <div className="revenue-label">Total Revenue</div>
            <div className="revenue-value">${(revenueData.totalRevenue / 1000).toFixed(0)}K</div>
            <div className="revenue-growth positive">+{revenueData.revenueGrowth.mom}% MoM</div>
          </div>
          <div className="revenue-card highlight">
            <div className="revenue-label">Alert-Sourced Revenue</div>
            <div className="revenue-value">${(revenueData.alertSourcedRevenue / 1000).toFixed(0)}K</div>
            <div className="revenue-growth positive">{revenueData.alertSourcedPercentage}% of total</div>
          </div>
          <div className="revenue-card">
            <div className="revenue-label">Pipeline Value</div>
            <div className="revenue-value">${(revenueData.pipelineValue / 1000).toFixed(0)}K</div>
            <div className="revenue-growth">Projected</div>
          </div>
        </div>

        <div className="chart-card">
          <h3>Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsLineChart data={revenueData.revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} name="Total Revenue" />
              <Line type="monotone" dataKey="alertSourced" stroke="#10b981" strokeWidth={2} name="Alert-Sourced" />
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Competitive Insights */}
      <div className="analytics-section">
        <div className="section-header">
          <div>
            <h2>Competitive Insights</h2>
            <p>Compare your performance against market benchmarks</p>
          </div>
        </div>

        <div className="competitive-grid">
          <div className="competitive-card">
            <div className="competitive-metric">
              <div className="metric-label">Market Ranking</div>
              <div className="metric-value large">#{competitiveData.marketRanking}</div>
              <div className="metric-meta">out of {competitiveData.totalAgents} agents</div>
            </div>
          </div>

          <div className="competitive-card">
            <div className="competitive-metric">
              <div className="metric-label">Response Time</div>
              <div className="metric-value">{competitiveData.averageResponseTime}h</div>
              <div className="metric-comparison positive">
                {((competitiveData.marketAverageResponseTime - competitiveData.averageResponseTime) / competitiveData.marketAverageResponseTime * 100).toFixed(0)}% faster than market avg
              </div>
            </div>
          </div>

          <div className="competitive-card">
            <div className="competitive-metric">
              <div className="metric-label">Conversion Rate</div>
              <div className="metric-value">{competitiveData.conversionRate}%</div>
              <div className="metric-comparison positive">
                {(competitiveData.conversionRate - competitiveData.marketAverageConversionRate).toFixed(1)}% above market avg
              </div>
            </div>
          </div>

          <div className="competitive-card">
            <div className="competitive-metric">
              <div className="metric-label">Client Satisfaction</div>
              <div className="metric-value">{competitiveData.clientSatisfaction}/5.0</div>
              <div className="metric-comparison positive">
                {(competitiveData.clientSatisfaction - competitiveData.marketAverageClientSatisfaction).toFixed(1)} above market avg
              </div>
            </div>
          </div>
        </div>

        <div className="leaderboard">
          <h3>Team Leaderboard</h3>
          <div className="leaderboard-list">
            {competitiveData.leaderboard.map((agent) => (
              <div key={agent.rank} className={`leaderboard-item ${agent.isCurrentUser ? 'current-user' : ''}`}>
                <div className="rank">
                  {agent.rank <= 3 ? (
                    <Award size={20} style={{ color: agent.rank === 1 ? '#f59e0b' : agent.rank === 2 ? '#94a3b8' : '#cd7f32' }} />
                  ) : (
                    <span>#{agent.rank}</span>
                  )}
                </div>
                <div className="agent-info">
                  <div className="agent-name">{agent.agentName}</div>
                  <div className="agent-stats">
                    {agent.deals} deals • ${(agent.revenue / 1000).toFixed(0)}K • {agent.responseTime}h response
                  </div>
                </div>
                {agent.isCurrentUser && <span className="you-badge">You</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="analytics-section">
        <div className="section-header">
          <div>
            <h2>
              <Brain size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} />
              Predictive Analytics
            </h2>
            <p>AI-powered insights and recommendations</p>
          </div>
        </div>

        <div className="predictive-grid">
          <div className="predictive-card">
            <h3>Next Best Actions</h3>
            <div className="actions-list">
              {predictiveData.nextBestActions.map((action, index) => (
                <div key={index} className={`action-item priority-${action.priority}`}>
                  <div className="action-header">
                    <div>
                      <div className="action-client">{action.clientName}</div>
                      <div className="action-title">{action.action}</div>
                    </div>
                    <div className="action-confidence">{action.confidence}%</div>
                  </div>
                  <div className="action-reason">{action.reason}</div>
                  <div className="action-outcome">{action.expectedOutcome}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="predictive-card">
            <h3>Deal Probability</h3>
            <div className="probability-list">
              {predictiveData.dealProbability.map((deal, index) => (
                <div key={index} className="probability-item">
                  <div className="probability-header">
                    <span className="client-name">{deal.clientName}</span>
                    <span className="probability-value">{deal.probability}%</span>
                  </div>
                  <div className="probability-bar">
                    <div
                      className="probability-fill"
                      style={{
                        width: `${deal.probability}%`,
                        background: deal.probability > 70 ? '#10b981' : deal.probability > 50 ? '#f59e0b' : '#64748b'
                      }}
                    />
                  </div>
                  <div className="probability-meta">
                    ${(deal.value / 1000).toFixed(0)}K • {deal.timeframe}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="predictive-card">
            <h3>Market Opportunities</h3>
            <div className="opportunities-list">
              {predictiveData.marketOpportunities.map((opp, index) => (
                <div key={index} className="opportunity-item">
                  <div className="opportunity-type">{opp.type}</div>
                  <div className="opportunity-description">{opp.description}</div>
                  <div className="opportunity-stats">
                    <span>{opp.affectedClients} clients</span>
                    <span>${(opp.potentialRevenue / 1000).toFixed(0)}K potential</span>
                    <span>{opp.confidence}% confidence</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
