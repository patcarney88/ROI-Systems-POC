/**
 * Forever Marketing Email Campaign System
 * Designed by: Marketing Specialist + Frontend Specialist
 * 
 * Campaign management, email templates, and analytics dashboard for title agencies
 */

import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import CampaignModal from '../../components/marketing/CampaignModal';
import CampaignAnalytics from '../../components/marketing/CampaignAnalytics';

interface Campaign {
  id: string;
  name: string;
  type: 'welcome' | 'follow_up' | 'newsletter' | 'anniversary' | 'referral';
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  recipients: number;
  sentCount?: number;
  openRate?: number;
  clickRate?: number;
  scheduledDate?: string;
  createdDate: string;
  template: string;
  subject: string;
}

interface Template {
  id: string;
  name: string;
  type: 'welcome' | 'follow_up' | 'newsletter' | 'anniversary' | 'referral';
  description: string;
  thumbnail: string;
  lastUsed?: string;
}

const MarketingDashboard: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'analytics'>('campaigns');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Mock data for POC - showing 40-60% open rates as specified in BRD
  const campaigns: Campaign[] = [
    {
      id: '1',
      name: 'New Homeowner Welcome Series',
      type: 'welcome',
      status: 'active',
      recipients: 24,
      sentCount: 24,
      openRate: 58.3,
      clickRate: 12.5,
      createdDate: '2024-01-10',
      template: 'Welcome Series Template',
      subject: 'Welcome to Your New Home!'
    },
    {
      id: '2',
      name: 'Q1 Home Maintenance Newsletter',
      type: 'newsletter',
      status: 'completed',
      recipients: 156,
      sentCount: 156,
      openRate: 42.3,
      clickRate: 8.7,
      createdDate: '2024-01-05',
      template: 'Seasonal Newsletter',
      subject: 'Spring Home Maintenance Checklist'
    },
    {
      id: '3',
      name: 'Anniversary Thank You Campaign',
      type: 'anniversary',
      status: 'scheduled',
      recipients: 67,
      scheduledDate: '2024-01-20',
      createdDate: '2024-01-08',
      template: 'Anniversary Appreciation',
      subject: 'Happy Anniversary in Your Home!'
    },
    {
      id: '4',
      name: 'Follow-up Check-in Series',
      type: 'follow_up',
      status: 'active',
      recipients: 89,
      sentCount: 67,
      openRate: 51.2,
      clickRate: 15.3,
      createdDate: '2024-01-03',
      template: 'Follow-up Template',
      subject: 'How are you settling in?'
    },
    {
      id: '5',
      name: 'Referral Rewards Program',
      type: 'referral',
      status: 'draft',
      recipients: 0,
      createdDate: '2024-01-12',
      template: 'Referral Incentive',
      subject: 'Refer a Friend & Earn Rewards'
    }
  ];

  const templates: Template[] = [
    {
      id: '1',
      name: 'Welcome Series Template',
      type: 'welcome',
      description: 'A warm welcome message for new homeowners with helpful resources',
      thumbnail: '/templates/welcome.jpg',
      lastUsed: '2024-01-10'
    },
    {
      id: '2',
      name: 'Seasonal Newsletter',
      type: 'newsletter',
      description: 'Quarterly newsletter with home maintenance tips and market updates',
      thumbnail: '/templates/newsletter.jpg',
      lastUsed: '2024-01-05'
    },
    {
      id: '3',
      name: 'Anniversary Appreciation',
      type: 'anniversary',
      description: 'Celebrate homeownership milestones with personalized messages',
      thumbnail: '/templates/anniversary.jpg',
      lastUsed: '2024-01-08'
    },
    {
      id: '4',
      name: 'Follow-up Template',
      type: 'follow_up',
      description: 'Check in with recent buyers and offer continued support',
      thumbnail: '/templates/followup.jpg',
      lastUsed: '2024-01-03'
    },
    {
      id: '5',
      name: 'Referral Incentive',
      type: 'referral',
      description: 'Encourage referrals with attractive rewards and incentives',
      thumbnail: '/templates/referral.jpg'
    }
  ];

  const filteredCampaigns = campaigns.filter(campaign => 
    filterStatus === 'all' ? true : campaign.status === filterStatus
  );

  const getStatusColor = (status: Campaign['status']) => {
    switch (status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'completed':
        return 'bg-primary-100 text-primary-700';
      case 'scheduled':
        return 'bg-warning-100 text-warning-700';
      case 'draft':
        return 'bg-secondary-100 text-secondary-700';
      case 'paused':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-secondary-100 text-secondary-700';
    }
  };

  const getTypeIcon = (type: Campaign['type'] | Template['type']) => {
    const iconClasses = "w-5 h-5";
    
    switch (type) {
      case 'welcome':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        );
      case 'newsletter':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15" />
          </svg>
        );
      case 'anniversary':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case 'follow_up':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'referral':
        return (
          <svg className={iconClasses} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Analytics data for the overview
  const analyticsData = {
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(c => c.status === 'active').length,
    totalRecipients: campaigns.reduce((sum, c) => sum + c.recipients, 0),
    avgOpenRate: 50.8, // Based on mock data showing 40-60% range
    avgClickRate: 11.6,
    totalEmailsSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)
  };

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowCampaignModal(true);
  };

  const handleEditCampaign = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setShowCampaignModal(true);
  };

  const handleSaveCampaign = (campaignData: any) => {
    // In a real app, this would make an API call
    console.log('Saving campaign:', campaignData);
    // You would update the campaigns list here
  };

  // Mock campaign analytics data for detailed analytics component
  const campaignAnalyticsData = campaigns.map(campaign => ({
    campaignId: campaign.id,
    campaignName: campaign.name,
    type: campaign.type,
    sentDate: campaign.createdDate,
    recipients: campaign.recipients,
    delivered: Math.floor(campaign.recipients * 0.97), // 97% delivery rate
    opened: Math.floor(campaign.recipients * (campaign.openRate || 0) / 100),
    clicked: Math.floor(campaign.recipients * (campaign.clickRate || 0) / 100),
    bounced: Math.floor(campaign.recipients * 0.03), // 3% bounce rate
    unsubscribed: Math.floor(campaign.recipients * 0.001), // 0.1% unsubscribe rate
    openRate: campaign.openRate || 0,
    clickRate: campaign.clickRate || 0,
    bounceRate: 3.0,
    unsubscribeRate: 0.1,
    conversionRate: Math.floor((campaign.clickRate || 0) * 0.15 * 100) / 100 // 15% of clicks convert
  })).filter(data => data.recipients > 0); // Only include sent campaigns

  return (
    <>
      <Head>
        <title>Forever Marketing - ROI Systems</title>
        <meta name="description" content="Email campaign management and analytics for title agencies" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Forever Marketing
                </h1>
                <p className="text-text-secondary">
                  Build lasting relationships with automated email campaigns
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <button onClick={handleCreateCampaign} className="btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Campaign
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary mb-1">Total Campaigns</p>
                  <p className="text-2xl font-bold text-text-primary">{analyticsData.totalCampaigns}</p>
                  <p className="text-xs text-text-secondary">{analyticsData.activeCampaigns} active</p>
                </div>
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary mb-1">Total Recipients</p>
                  <p className="text-2xl font-bold text-text-primary">{analyticsData.totalRecipients}</p>
                  <p className="text-xs text-text-secondary">Across all campaigns</p>
                </div>
                <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary mb-1">Avg Open Rate</p>
                  <p className="text-2xl font-bold text-text-primary">{analyticsData.avgOpenRate}%</p>
                  <div className="flex items-center mt-1">
                    <svg className="w-3 h-3 text-success-600 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                    </svg>
                    <span className="text-xs text-success-600">Above industry avg</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-text-tertiary mb-1">Avg Click Rate</p>
                  <p className="text-2xl font-bold text-text-primary">{analyticsData.avgClickRate}%</p>
                  <p className="text-xs text-text-secondary">Last 30 days</p>
                </div>
                <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border-primary mb-8">
            <nav className="flex space-x-8">
              {[
                { key: 'campaigns', label: 'Campaigns', count: campaigns.length },
                { key: 'templates', label: 'Templates', count: templates.length },
                { key: 'analytics', label: 'Analytics' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-secondary'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count && (
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-primary-100 text-primary-600'
                        : 'bg-secondary-100 text-secondary-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Campaigns Tab */}
          {activeTab === 'campaigns' && (
            <div>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                  <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="text-text-secondary hover:text-primary-600 p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                  <button className="text-primary-600 p-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Campaigns List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <div key={campaign.id} className="card hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          {getTypeIcon(campaign.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-text-primary">{campaign.name}</h3>
                          <p className="text-sm text-text-secondary capitalize">{campaign.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary mb-1">Subject</p>
                        <p className="text-sm text-text-secondary">{campaign.subject}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-text-tertiary">Recipients</p>
                          <p className="text-sm font-medium text-text-primary">{campaign.recipients}</p>
                        </div>
                        {campaign.status !== 'draft' && campaign.status !== 'scheduled' && (
                          <div>
                            <p className="text-xs text-text-tertiary">Sent</p>
                            <p className="text-sm font-medium text-text-primary">{campaign.sentCount || 0}</p>
                          </div>
                        )}
                      </div>

                      {campaign.openRate !== undefined && campaign.clickRate !== undefined && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-text-tertiary">Open Rate</p>
                            <p className="text-sm font-medium text-success-600">{campaign.openRate}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-text-tertiary">Click Rate</p>
                            <p className="text-sm font-medium text-info-600">{campaign.clickRate}%</p>
                          </div>
                        </div>
                      )}

                      {campaign.scheduledDate && (
                        <div>
                          <p className="text-xs text-text-tertiary">Scheduled for</p>
                          <p className="text-sm font-medium text-text-primary">{campaign.scheduledDate}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border-primary">
                      <p className="text-xs text-text-tertiary">Created {campaign.createdDate}</p>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditCampaign(campaign)}
                          className="text-text-secondary hover:text-primary-600 p-1"
                          title="Edit campaign"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          className="text-text-secondary hover:text-primary-600 p-1"
                          title="Duplicate campaign"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <button 
                          className="text-text-secondary hover:text-error-600 p-1"
                          title="Delete campaign"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <p className="text-text-secondary mb-4 sm:mb-0">
                  Choose from professional email templates designed for title agencies
                </p>
                <button 
                  onClick={handleCreateCampaign}
                  className="btn-primary"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Template
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="card hover:shadow-lg transition-shadow">
                    <div className="aspect-video bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg mb-4 flex items-center justify-center">
                      <div className="text-center">
                        {getTypeIcon(template.type)}
                        <p className="text-sm text-primary-600 mt-2 font-medium">{template.type.replace('_', ' ').toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-text-primary mb-1">{template.name}</h3>
                        <p className="text-sm text-text-secondary">{template.description}</p>
                      </div>
                      
                      {template.lastUsed && (
                        <p className="text-xs text-text-tertiary">Last used: {template.lastUsed}</p>
                      )}
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <button 
                          onClick={handleCreateCampaign}
                          className="flex-1 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                        >
                          Use Template
                        </button>
                        <button className="text-text-secondary hover:text-primary-600 p-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <CampaignAnalytics
              campaigns={campaignAnalyticsData}
              timeRange="Last 30 Days"
            />
          )}
        </div>

        {/* Campaign Creation/Edit Modal */}
        <CampaignModal
          isOpen={showCampaignModal}
          onClose={() => {
            setShowCampaignModal(false);
            setEditingCampaign(null);
          }}
          onSave={handleSaveCampaign}
          editingCampaign={editingCampaign ? {
            ...editingCampaign,
            recipients: [] // Convert from number to string array for editing
          } : null}
        />
      </Layout>
    </>
  );
};

export default MarketingDashboard;