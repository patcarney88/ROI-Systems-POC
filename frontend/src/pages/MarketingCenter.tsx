import { useState } from 'react';
import {
  Plus, Send, Calendar, Users, Target, TrendingUp, Eye, Mail,
  MessageSquare, Clock, CheckCircle, Play, Pause, Edit, Copy,
  Trash2, BarChart3, PieChart, Filter, Search, Download, Settings,
  Zap, Star, Award, AlertCircle, ChevronRight, Image, FileText,
  Sparkles, Brain
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { campaignApi } from '../services/api.services';

// Mock data
const campaigns = [
  {
    id: '1',
    name: 'Spring Market Update',
    type: 'email',
    status: 'active',
    audience: 'All Active Clients',
    audienceSize: 342,
    schedule: 'Weekly - Mondays 9:00 AM',
    sent: 1245,
    opens: 847,
    clicks: 312,
    conversions: 28,
    revenue: 196000,
    createdDate: '2024-03-15',
    lastSent: '2024-10-14'
  },
  {
    id: '2',
    name: 'New Listing Alert',
    type: 'sms',
    status: 'scheduled',
    audience: 'Ready to Buy',
    audienceSize: 89,
    schedule: 'When new listing matches criteria',
    sent: 267,
    opens: 245,
    clicks: 89,
    conversions: 12,
    revenue: 84000,
    createdDate: '2024-04-01',
    scheduledDate: '2024-10-20'
  },
  {
    id: '3',
    name: 'Market Analysis Report',
    type: 'email',
    status: 'draft',
    audience: 'Homeowners',
    audienceSize: 156,
    schedule: 'Monthly - 1st of month',
    sent: 0,
    opens: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
    createdDate: '2024-10-10'
  },
  {
    id: '4',
    name: 'Open House Invitation',
    type: 'email',
    status: 'completed',
    audience: 'Neighborhood Prospects',
    audienceSize: 234,
    schedule: 'One-time - Oct 5, 2024',
    sent: 234,
    opens: 189,
    clicks: 67,
    conversions: 8,
    revenue: 0,
    createdDate: '2024-09-28',
    lastSent: '2024-10-05'
  }
];

const templates = [
  {
    id: '1',
    name: 'Market Update Newsletter',
    category: 'Newsletter',
    type: 'email',
    thumbnail: null,
    description: 'Monthly market trends and insights',
    uses: 245,
    rating: 4.8
  },
  {
    id: '2',
    name: 'New Listing Announcement',
    category: 'Property Alert',
    type: 'email',
    thumbnail: null,
    description: 'Showcase new property listings',
    uses: 189,
    rating: 4.9
  },
  {
    id: '3',
    name: 'Just Listed SMS',
    category: 'Property Alert',
    type: 'sms',
    thumbnail: null,
    description: 'Quick SMS alert for new listings',
    uses: 312,
    rating: 4.7
  },
  {
    id: '4',
    name: 'Open House Invite',
    category: 'Event',
    type: 'email',
    thumbnail: null,
    description: 'Professional open house invitation',
    uses: 156,
    rating: 4.6
  },
  {
    id: '5',
    name: 'Holiday Greeting',
    category: 'Seasonal',
    type: 'email',
    thumbnail: null,
    description: 'Seasonal greetings and well wishes',
    uses: 423,
    rating: 4.9
  },
  {
    id: '6',
    name: 'Price Reduction Alert',
    category: 'Property Alert',
    type: 'sms',
    thumbnail: null,
    description: 'Notify about price reductions',
    uses: 178,
    rating: 4.8
  }
];

const audienceSegments = [
  { id: '1', name: 'All Active Clients', count: 342, criteria: 'Status: Active' },
  { id: '2', name: 'Ready to Buy', count: 89, criteria: 'Alert Type: Ready to Buy' },
  { id: '3', name: 'Ready to Sell', count: 67, criteria: 'Alert Type: Ready to Sell' },
  { id: '4', name: 'Homeowners', count: 156, criteria: 'Client Type: Homeowner' },
  { id: '5', name: 'High Engagement', count: 45, criteria: 'Engagement Score > 80' },
  { id: '6', name: 'Dormant Clients', count: 128, criteria: 'Last Contact > 90 days' }
];

const performanceData = [
  { month: 'Apr', sent: 1245, opens: 847, clicks: 312 },
  { month: 'May', sent: 1389, opens: 945, clicks: 378 },
  { month: 'Jun', sent: 1456, opens: 1012, clicks: 423 },
  { month: 'Jul', sent: 1523, opens: 1089, clicks: 467 },
  { month: 'Aug', sent: 1398, opens: 978, clicks: 398 },
  { month: 'Sep', sent: 1512, opens: 1045, clicks: 445 },
  { month: 'Oct', sent: 1289, opens: 912, clicks: 389 }
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MarketingCenter() {
  const [selectedTab, setSelectedTab] = useState<'campaigns' | 'templates' | 'analytics'>('campaigns');
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || campaign.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalSent = campaigns.reduce((sum, c) => sum + c.sent, 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + c.opens, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0);

  const openRate = totalSent > 0 ? ((totalOpens / totalSent) * 100).toFixed(1) : '0';
  const clickRate = totalSent > 0 ? ((totalClicks / totalSent) * 100).toFixed(1) : '0';
  const conversionRate = totalSent > 0 ? ((totalConversions / totalSent) * 100).toFixed(1) : '0';

  const handleCreateCampaign = () => {
    setShowNewCampaign(true);
  };

  const handleEditCampaign = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowNewCampaign(true);
  };

  const handleDuplicateCampaign = async (campaign: any) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // In production, this would call the API:
      // const response = await campaignApi.create({
      //   ...campaign,
      //   name: `${campaign.name} (Copy)`,
      //   status: 'draft'
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create duplicate in local state
      const newCampaign = {
        ...campaign,
        id: `${campaign.id}-copy-${Date.now()}`,
        name: `${campaign.name} (Copy)`,
        status: 'draft',
        sent: 0,
        opens: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        createdDate: new Date().toISOString().split('T')[0]
      };

      // In production, you would refresh the campaigns list from the API
      console.log('Campaign duplicated:', newCampaign);
      alert(`Campaign "${campaign.name}" duplicated successfully!`);

      // TODO: Add to campaigns list and refresh
      // setCampaigns(prev => [newCampaign, ...prev]);
    } catch (error) {
      console.error('Failed to duplicate campaign:', error);
      alert('Failed to duplicate campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCampaign = async (campaign: any) => {
    if (isLoading) return;

    // Confirmation dialog
    if (!window.confirm(`Are you sure you want to delete "${campaign.name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      // In production, this would call:
      // await campaignApi.delete(campaign.id);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Campaign deleted:', campaign.id);
      alert(`Campaign "${campaign.name}" deleted successfully!`);

      // TODO: Remove from campaigns list and refresh
      // setCampaigns(prev => prev.filter(c => c.id !== campaign.id));
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      alert('Failed to delete campaign. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      active: { label: 'Active', color: '#10b981', icon: <Play size={12} /> },
      scheduled: { label: 'Scheduled', color: '#f59e0b', icon: <Clock size={12} /> },
      draft: { label: 'Draft', color: '#64748b', icon: <Edit size={12} /> },
      completed: { label: 'Completed', color: '#2563eb', icon: <CheckCircle size={12} /> },
      paused: { label: 'Paused', color: '#ef4444', icon: <Pause size={12} /> }
    };
    return badges[status] || badges.draft;
  };

  return (
    <div className="marketing-center">
      {/* Header */}
      <div className="marketing-header">
        <div>
          <h1>Marketing Center</h1>
          <p>Create and manage automated marketing campaigns</p>
        </div>

        <button className="btn-primary" onClick={handleCreateCampaign}>
          <Plus size={18} />
          New Campaign
        </button>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' }}>
            <Send size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Sent</div>
            <div className="stat-value">{totalSent.toLocaleString()}</div>
            <div className="stat-meta">Across all campaigns</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <Eye size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Open Rate</div>
            <div className="stat-value">{openRate}%</div>
            <div className="stat-meta">{totalOpens.toLocaleString()} opens</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Click Rate</div>
            <div className="stat-value">{clickRate}%</div>
            <div className="stat-meta">{totalClicks.toLocaleString()} clicks</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Revenue Generated</div>
            <div className="stat-value">${(totalRevenue / 1000).toFixed(0)}K</div>
            <div className="stat-meta">{totalConversions} conversions</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="marketing-tabs">
        <button
          className={`tab ${selectedTab === 'campaigns' ? 'active' : ''}`}
          onClick={() => setSelectedTab('campaigns')}
        >
          <BarChart3 size={18} />
          Campaigns
        </button>
        <button
          className={`tab ${selectedTab === 'templates' ? 'active' : ''}`}
          onClick={() => setSelectedTab('templates')}
        >
          <FileText size={18} />
          Templates
        </button>
        <button
          className={`tab ${selectedTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setSelectedTab('analytics')}
        >
          <PieChart size={18} />
          Analytics
        </button>
      </div>

      {/* Campaigns Tab */}
      {selectedTab === 'campaigns' && (
        <div className="campaigns-section">
          <div className="campaigns-controls">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-buttons">
              {['all', 'active', 'scheduled', 'draft', 'completed'].map(status => (
                <button
                  key={status}
                  className={`filter-btn ${filterStatus === status ? 'active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="campaigns-grid">
            {filteredCampaigns.map(campaign => {
              const badge = getStatusBadge(campaign.status);
              return (
                <div key={campaign.id} className="campaign-card">
                  <div className="campaign-header">
                    <div>
                      <h3>{campaign.name}</h3>
                      <div className="campaign-meta">
                        <span className="campaign-type">
                          {campaign.type === 'email' ? <Mail size={14} /> : <MessageSquare size={14} />}
                          {campaign.type.toUpperCase()}
                        </span>
                        <span>•</span>
                        <span>{campaign.audience}</span>
                      </div>
                    </div>
                    <div className="status-badge" style={{ background: badge.color }}>
                      {badge.icon}
                      {badge.label}
                    </div>
                  </div>

                  <div className="campaign-stats">
                    <div className="stat">
                      <div className="stat-label">Audience</div>
                      <div className="stat-value">{campaign.audienceSize}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Sent</div>
                      <div className="stat-value">{campaign.sent}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Opens</div>
                      <div className="stat-value">{campaign.opens}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-label">Clicks</div>
                      <div className="stat-value">{campaign.clicks}</div>
                    </div>
                  </div>

                  <div className="campaign-schedule">
                    <Clock size={14} />
                    <span>{campaign.schedule}</span>
                  </div>

                  {campaign.revenue > 0 && (
                    <div className="campaign-revenue">
                      <TrendingUp size={14} />
                      <span>${(campaign.revenue / 1000).toFixed(0)}K revenue from {campaign.conversions} conversions</span>
                    </div>
                  )}

                  <div className="campaign-actions">
                    <button onClick={() => handleEditCampaign(campaign)} title="Edit">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDuplicateCampaign(campaign)} title="Duplicate">
                      <Copy size={16} />
                    </button>
                    <button onClick={() => handleDeleteCampaign(campaign)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {selectedTab === 'templates' && (
        <div className="templates-section">
          <div className="section-header">
            <div>
              <h2>Template Library</h2>
              <p>Pre-built templates for common campaigns</p>
            </div>
            <button className="btn-secondary">
              <Plus size={18} />
              Create Template
            </button>
          </div>

          <div className="templates-grid">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <div className="template-thumbnail">
                  {template.type === 'email' ? <Mail size={48} /> : <MessageSquare size={48} />}
                </div>
                <div className="template-info">
                  <div className="template-category">{template.category}</div>
                  <h3>{template.name}</h3>
                  <p>{template.description}</p>
                  <div className="template-meta">
                    <div className="template-rating">
                      <Star size={14} fill="#f59e0b" color="#f59e0b" />
                      <span>{template.rating}</span>
                    </div>
                    <span>•</span>
                    <span>{template.uses} uses</span>
                  </div>
                </div>
                <div className="template-actions">
                  <button className="btn-primary">
                    Use Template
                  </button>
                  <button className="btn-secondary">
                    <Eye size={16} />
                    Preview
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="ai-suggestion">
            <div className="ai-icon">
              <Brain size={24} />
            </div>
            <div>
              <h3>
                <Sparkles size={16} />
                AI Template Suggestions
              </h3>
              <p>Based on your client data, we recommend creating a "Price Reduction Alert" campaign for your Ready to Buy segment</p>
            </div>
            <button className="btn-primary">
              Create with AI
            </button>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {selectedTab === 'analytics' && (
        <div className="analytics-section">
          <div className="section-header">
            <div>
              <h2>Campaign Analytics</h2>
              <p>Track performance across all campaigns</p>
            </div>
            <button className="btn-secondary">
              <Download size={18} />
              Export Report
            </button>
          </div>

          <div className="analytics-grid">
            <div className="chart-card large">
              <h3>Campaign Performance Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sent" stroke="#2563eb" strokeWidth={2} name="Sent" />
                  <Line type="monotone" dataKey="opens" stroke="#10b981" strokeWidth={2} name="Opens" />
                  <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} name="Clicks" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Campaign Types</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={[
                      { name: 'Email', value: 65 },
                      { name: 'SMS', value: 35 }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[0, 1].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="audience-segments">
            <h3>Audience Segments</h3>
            <div className="segments-grid">
              {audienceSegments.map(segment => (
                <div key={segment.id} className="segment-card">
                  <div className="segment-header">
                    <Users size={20} />
                    <h4>{segment.name}</h4>
                  </div>
                  <div className="segment-count">{segment.count} contacts</div>
                  <div className="segment-criteria">{segment.criteria}</div>
                  <button className="segment-action">
                    Create Campaign
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="performance-insights">
            <h3>Performance Insights</h3>
            <div className="insights-list">
              <div className="insight-item success">
                <Award size={20} />
                <div>
                  <h4>Top Performing Campaign</h4>
                  <p>"Spring Market Update" has a 68% open rate, 25% above average</p>
                </div>
              </div>
              <div className="insight-item warning">
                <AlertCircle size={20} />
                <div>
                  <h4>Optimization Opportunity</h4>
                  <p>Sending campaigns on Tuesday mornings increases open rates by 15%</p>
                </div>
              </div>
              <div className="insight-item info">
                <Zap size={20} />
                <div>
                  <h4>Engagement Trend</h4>
                  <p>Click-through rates have increased 12% over the last 3 months</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
