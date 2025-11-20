import { useState } from 'react';
import DocumentUploadModal from '../modals/DocumentUploadModal';
import ClientModal from '../modals/ClientModal';
import CampaignModal from '../modals/CampaignModal';
import AnimatedCounter from '../components/AnimatedCounter';
import InsightBadge from '../components/InsightBadge';
import ContextualCTA from '../components/ContextualCTA';

interface DashboardProps {
  documents: any[];
  documentsLoading?: boolean;
  documentsError?: string | null;
  clients: any[];
  clientsLoading?: boolean;
  clientsError?: string | null;
  campaigns?: any[];
  campaignsLoading?: boolean;
  campaignsError?: string | null;
  stats: any;
  onDocumentUpload: (files: File[], metadata: any) => void;
  onClientSave: (client: any) => void;
  onCampaignLaunch: (campaign: any) => void;
  refreshData?: () => void;
}

export default function Dashboard({
  documents,
  documentsLoading = false,
  documentsError = null,
  clients,
  clientsLoading = false,
  clientsError = null,
  campaigns = [],
  campaignsLoading = false,
  campaignsError = null,
  stats,
  onDocumentUpload,
  onClientSave,
  onCampaignLaunch,
  refreshData
}: DashboardProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [campaignModalOpen, setCampaignModalOpen] = useState(false);

  const recentDocuments = documents.slice(0, 5);
  const recentClients = clients.slice(0, 5);

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Total Documents</span>
              <div className="stat-icon success-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                </svg>
              </div>
            </div>
            <div className="stat-value">
              <AnimatedCounter end={stats.totalDocuments} separator />
            </div>
            <div className="stat-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span>12% from last month</span>
            </div>
            <InsightBadge
              type="success"
              icon="trending-up"
              message="AI processing 3x faster than manual • Zero data entry errors"
            />
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Active Clients</span>
              <div className="stat-icon primary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
            </div>
            <div className="stat-value">
              <AnimatedCounter end={stats.activeClients} separator />
            </div>
            <div className="stat-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span>8% from last month</span>
            </div>
            <InsightBadge
              type="info"
              icon="lightbulb"
              message="Avg engagement: 78% • 23 high-priority contacts this week"
            />
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Email Engagement</span>
              <div className="stat-icon warning-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
            </div>
            <div className="stat-value">
              <AnimatedCounter end={stats.emailEngagement} suffix="%" />
            </div>
            <div className="stat-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span>15% from last month</span>
            </div>
            <InsightBadge
              type="success"
              icon="trending-up"
              message="2x industry avg (32%) • Best performing quarter"
            />
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-label">Time Saved</span>
              <div className="stat-icon info-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>
            <div className="stat-value">
              <AnimatedCounter end={stats.timeSaved} suffix="h" />
            </div>
            <div className="stat-change positive">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span>Per transaction</span>
            </div>
            <InsightBadge
              type="success"
              icon="trending-up"
              message="Saving 12h/week on average • $18K annual value"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="features-grid">
          <div className="feature-card" onClick={() => setUploadModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="feature-icon primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 className="feature-title">Upload Document</h3>
            <p className="feature-description">
              Upload and analyze real estate documents with AI-powered intelligence
            </p>
          </div>

          <div className="feature-card" onClick={() => setClientModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="feature-icon success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="8.5" cy="7" r="4"></circle>
                <line x1="20" y1="8" x2="20" y2="14"></line>
                <line x1="23" y1="11" x2="17" y2="11"></line>
              </svg>
            </div>
            <h3 className="feature-title">Add Client</h3>
            <p className="feature-description">
              Add new clients and track their engagement and property portfolio
            </p>
          </div>

          <div className="feature-card" onClick={() => setCampaignModalOpen(true)} style={{ cursor: 'pointer' }}>
            <div className="feature-icon warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
            </div>
            <h3 className="feature-title">Create Campaign</h3>
            <p className="feature-description">
              Launch personalized email campaigns to engage with your clients
            </p>
          </div>
        </div>
      </section>

      {/* Recent Activity */}
      <div className="dashboard-grid">
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Documents</h2>
            <a href="/documents" className="btn btn-secondary">View All</a>
          </div>
          {documentsError && (
            <div style={{ padding: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {documentsError}
            </div>
          )}
          <div className="document-list">
            {documentsLoading ? (
              // Loading skeleton for documents
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="document-item" style={{ opacity: 0.5 }}>
                    <div className="document-icon" style={{ background: '#e5e7eb' }}></div>
                    <div className="document-info">
                      <div style={{ width: '200px', height: '20px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                      <div style={{ width: '150px', height: '16px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </>
            ) : recentDocuments.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No documents yet. Upload your first document to get started.
              </div>
            ) : (
              recentDocuments.map(doc => (
              <div key={doc.id} className="document-item">
                <div className="document-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                </div>
                <div className="document-info">
                  <div className="document-title">{doc.title}</div>
                  <div className="document-meta">
                    <span>{doc.client}</span>
                    <span>•</span>
                    <span>{doc.uploadDate}</span>
                    <span>•</span>
                    <span>{doc.size}</span>
                  </div>
                </div>
                <span className={`badge badge-${doc.status === 'pending' ? 'info' : doc.status === 'active' ? 'success' : 'warning'}`}>
                  {doc.status}
                </span>
              </div>
            ))
            )}
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Clients</h2>
            <a href="/clients" className="btn btn-secondary">View All</a>
          </div>
          {clientsError && (
            <div style={{ padding: '1rem', color: '#ef4444', fontSize: '0.875rem' }}>
              {clientsError}
            </div>
          )}
          <div className="client-list">
            {clientsLoading ? (
              // Loading skeleton for clients
              <>
                {[1, 2, 3].map(i => (
                  <div key={i} className="client-item" style={{ opacity: 0.5 }}>
                    <div className="client-avatar" style={{ background: '#e5e7eb' }}></div>
                    <div className="client-info">
                      <div style={{ width: '150px', height: '20px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                      <div style={{ width: '200px', height: '16px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                ))}
              </>
            ) : recentClients.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No clients yet. Add your first client to get started.
              </div>
            ) : (
              recentClients.map(client => (
              <div key={client.id} className="client-item">
                <div className="client-avatar">
                  {client.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div className="client-info">
                  <div className="client-name">{client.name}</div>
                  <div className="client-meta">
                    {client.properties} properties • {client.lastContact}
                  </div>
                </div>
                <span className={`badge badge-${client.status === 'active' ? 'success' : client.status === 'at-risk' ? 'warning' : 'danger'}`}>
                  {client.status}
                </span>
              </div>
            ))
            )}
          </div>
        </section>
      </div>

      {/* Modals */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUpload={onDocumentUpload}
      />

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => setClientModalOpen(false)}
        onSave={onClientSave}
      />

      <CampaignModal
        isOpen={campaignModalOpen}
        onClose={() => setCampaignModalOpen(false)}
        onLaunch={onCampaignLaunch}
      />

      {/* Contextual CTA - appears after 10 seconds for demo */}
      <ContextualCTA
        dashboardName="Dashboard"
        delayMs={10000}
      />
    </div>
  );
}
