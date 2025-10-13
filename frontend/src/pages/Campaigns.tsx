import { useState } from 'react';
import CampaignModal from '../modals/CampaignModal';

export default function Campaigns({ campaigns, onCampaignLaunch }: any) {
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredCampaigns = campaigns.filter((campaign: any) => {
    return filterStatus === 'all' || campaign.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'info';
      case 'paused': return 'warning';
      case 'completed': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Manage your email marketing campaigns</p>
        </div>
        <button className="btn btn-primary" onClick={() => setCampaignModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <span>Create Campaign</span>
        </button>
      </div>

      <div className="filters-section">
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Campaigns</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {filteredCampaigns.length > 0 ? (
        <div className="campaigns-grid">
          {filteredCampaigns.map((campaign: any) => (
            <div key={campaign.id} className="campaign-card">
              <div className="campaign-header">
                <h3>{campaign.name}</h3>
                <span className={`badge badge-${getStatusColor(campaign.status)}`}>
                  {campaign.status}
                </span>
              </div>

              <p className="campaign-description">{campaign.description}</p>

              <div className="campaign-stats">
                <div className="stat">
                  <div className="stat-label">Target Audience</div>
                  <div className="stat-value">{campaign.targetAudience}</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Scheduled</div>
                  <div className="stat-value">{campaign.scheduledDate}</div>
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
                    <span>{campaign.metrics.opens} opens</span>
                  </div>
                  <div className="metric">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span>{campaign.metrics.clicks} clicks</span>
                  </div>
                </div>
              )}

              <div className="campaign-actions">
                <button className="btn btn-secondary">View Details</button>
                {campaign.status === 'scheduled' && (
                  <button className="btn btn-outline">Edit</button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>=ç</div>
          <h3>No campaigns found</h3>
          <p>Create your first email campaign to engage with clients</p>
          <button
            className="btn btn-primary"
            onClick={() => setCampaignModalOpen(true)}
            style={{ marginTop: '16px' }}
          >
            <span style={{ marginRight: '8px' }}>+</span>
            Create Campaign
          </button>
        </div>
      )}

      <CampaignModal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onLaunch={(campaignData: any) => {
          onCampaignLaunch(campaignData);
          setCampaignModalOpen(false);
        }}
      />
    </div>
  );
}
