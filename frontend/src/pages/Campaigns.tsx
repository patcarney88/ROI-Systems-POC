import { useState, useEffect } from 'react';
import CampaignModal from '../modals/CampaignModal';

interface CampaignMetrics {
  sent: number;
  delivered: number;
  bounced: number;
  opened: number;
  clicked: number;
  converted: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  avgOpenTime?: number;
  revenue?: number;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'running' | 'paused' | 'completed' | 'scheduled' | 'active';
  type: string;
  channel: 'email' | 'sms' | 'both';
  targetAudience?: string;
  scheduledDate?: string;
  metrics?: CampaignMetrics;
}

interface OverviewStats {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  avgOpenRate: number;
  avgClickRate: number;
}

export default function Campaigns({ campaigns: initialCampaigns, onCampaignLaunch }: any) {
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns || []);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch campaign list on mount
  useEffect(() => {
    fetchCampaigns();
    fetchOverviewStats();

    // Auto-refresh metrics every 10 seconds for demo
    const interval = setInterval(() => {
      if (selectedCampaign) {
        fetchCampaignMetrics(selectedCampaign.id);
      }
      fetchOverviewStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/v1/campaigns');
      const data = await response.json();
      if (data.success) {
        setCampaigns(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
    }
  };

  const fetchOverviewStats = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/v1/campaigns/stats/overview');
      const data = await response.json();
      if (data.success) {
        setOverviewStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch overview stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchCampaignMetrics = async (campaignId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`http://localhost:5050/api/v1/campaigns/${campaignId}/metrics`);
      const data = await response.json();
      if (data.success) {
        setSelectedCampaign(prev => prev ? { ...prev, metrics: data.data } : null);
        // Update in campaigns list
        setCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, metrics: data.data } : c
        ));
      }
    } catch (error) {
      console.error('Failed to fetch campaign metrics:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleQuickStart = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/v1/campaigns/demo/quick-start');
      const data = await response.json();
      if (data.success) {
        await fetchCampaigns();
        await fetchOverviewStats();
        // Auto-select the new campaign
        const newCampaign = campaigns.find(c => c.id === data.data.campaignId);
        if (newCampaign) {
          setSelectedCampaign(newCampaign);
        }
      }
    } catch (error) {
      console.error('Failed to start quick demo:', error);
    }
  };

  const handlePauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/v1/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to pause campaign:', error);
    }
  };

  const handleResumeCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/v1/campaigns/${campaignId}/resume`, {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Failed to resume campaign:', error);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign: Campaign) => {
    return filterStatus === 'all' || campaign.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'running': return 'success';
      case 'scheduled': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'secondary';
      default: return 'secondary';
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaign Automation</h1>
          <p className="page-subtitle">AI-powered email and SMS campaigns with 40-60% open rates</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleQuickStart}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>Quick Demo</span>
          </button>
          <button className="btn btn-primary" onClick={() => setCampaignModalOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <span>Create Campaign</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      {!statsLoading && overviewStats && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: '#e3f2fd' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1976d2" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
              </div>
              <div>
                <div className="stat-value">{overviewStats.totalCampaigns}</div>
                <div className="stat-label">Total Campaigns</div>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-change positive">+{overviewStats.activeCampaigns} active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: '#f3e5f5' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9c27b0" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div>
                <div className="stat-value">{overviewStats.totalSent}</div>
                <div className="stat-label">Messages Sent</div>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-change">{overviewStats.totalOpened} opened</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: '#e8f5e9' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#388e3c" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <div>
                <div className="stat-value">{formatPercentage(overviewStats.avgOpenRate)}</div>
                <div className="stat-label">Avg. Open Rate</div>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-change positive">Target: 40-60%</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon" style={{ backgroundColor: '#fff3e0' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f57c00" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
              </div>
              <div>
                <div className="stat-value">{formatPercentage(overviewStats.avgClickRate)}</div>
                <div className="stat-label">Avg. Click Rate</div>
              </div>
            </div>
            <div className="stat-footer">
              <span className="stat-change">{overviewStats.totalClicked} clicks</span>
            </div>
          </div>
        </div>
      )}

      <div className="filters-section">
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Campaigns</option>
          <option value="running">Running</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="campaigns-grid">
          {filteredCampaigns.map((campaign: Campaign) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge badge-${getStatusColor(campaign.status)}`}>
                    {campaign.status}
                  </span>
                  <span className="badge badge-secondary">
                    {campaign.channel}
                  </span>
                </div>
              </div>

              <p className="campaign-description">{campaign.description || `${campaign.type} campaign`}</p>

              <div className="campaign-stats">
                <div className="stat">
                  <div className="stat-label">Type</div>
                  <div className="stat-value">{campaign.type}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Channel</div>
                  <div className="stat-value">{campaign.channel}</div>
                </div>
              </div>

              {campaign.metrics && (
                <div className="campaign-metrics">
                  <div className="metric">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                      <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    <span>{campaign.metrics.sent} sent</span>
                  </div>
                  <div className="metric">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                    </svg>
                    <span>{campaign.metrics.opened} opens ({formatPercentage(campaign.metrics.openRate)})</span>
                  </div>
                  <div className="metric">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>{campaign.metrics.clicked} clicks ({formatPercentage(campaign.metrics.clickRate)})</span>
                  </div>
                </div>
              )}

              <div className="campaign-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setSelectedCampaign(campaign);
                    fetchCampaignMetrics(campaign.id);
                  }}
                >
                  View Metrics
                </button>
                {campaign.status === 'running' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => handlePauseCampaign(campaign.id)}
                  >
                    Pause
                  </button>
                )}
                {campaign.status === 'paused' && (
                  <button
                    className="btn btn-outline"
                    onClick={() => handleResumeCampaign(campaign.id)}
                  >
                    Resume
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📧</div>
          <h3>No campaigns found</h3>
          <p>Create your first AI-powered campaign or try the quick demo</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={handleQuickStart}
            >
              <span style={{ marginRight: '8px' }}>▶</span>
              Quick Demo
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setCampaignModalOpen(true)}
            >
              <span style={{ marginRight: '8px' }}>+</span>
              Create Campaign
            </button>
          </div>
        </div>
      )}

      {/* Campaign Details Modal */}
      {selectedCampaign && (
        <div className="modal-overlay" onClick={() => setSelectedCampaign(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header">
              <h2>{selectedCampaign.name}</h2>
              <button className="modal-close" onClick={() => setSelectedCampaign(null)}>×</button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading metrics...</p>
                </div>
              ) : selectedCampaign.metrics ? (
                <div>
                  <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                      <div className="stat-label">Sent</div>
                      <div className="stat-value">{selectedCampaign.metrics.sent}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Delivered</div>
                      <div className="stat-value">{selectedCampaign.metrics.delivered}</div>
                      <div className="stat-footer">
                        <span className="stat-change">{selectedCampaign.metrics.bounced} bounced</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Opened</div>
                      <div className="stat-value">{selectedCampaign.metrics.opened}</div>
                      <div className="stat-footer">
                        <span className="stat-change positive">{formatPercentage(selectedCampaign.metrics.openRate)} rate</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Clicked</div>
                      <div className="stat-value">{selectedCampaign.metrics.clicked}</div>
                      <div className="stat-footer">
                        <span className="stat-change positive">{formatPercentage(selectedCampaign.metrics.clickRate)} rate</span>
                      </div>
                    </div>
                  </div>

                  {selectedCampaign.metrics.avgOpenTime && (
                    <div className="info-card">
                      <h4>Performance Insights</h4>
                      <p>Average open time: <strong>{selectedCampaign.metrics.avgOpenTime.toFixed(1)} minutes</strong> after delivery</p>
                      {selectedCampaign.metrics.revenue && (
                        <p>Revenue attributed: <strong>${selectedCampaign.metrics.revenue.toFixed(2)}</strong></p>
                      )}
                      {selectedCampaign.metrics.converted > 0 && (
                        <p>Conversions: <strong>{selectedCampaign.metrics.converted}</strong> ({formatPercentage(selectedCampaign.metrics.conversionRate)})</p>
                      )}
                    </div>
                  )}

                  <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      💡 <strong>Demo Mode:</strong> Metrics update every 10 seconds with simulated engagement.
                      Real campaigns use live tracking with SendGrid/Twilio webhooks.
                    </p>
                  </div>
                </div>
              ) : (
                <p>No metrics available yet</p>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCampaign(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <CampaignModal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onLaunch={(campaignData: any) => {
          onCampaignLaunch(campaignData);
          setCampaignModalOpen(false);
          fetchCampaigns();
        }}
      />
    </div>
  );
}
