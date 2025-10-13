export default function Analytics({ stats }: any) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Track your performance metrics and ROI</p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Documents Processed</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div className="stat-value">{stats?.totalDocuments || 0}</div>
          <div className="stat-change positive">+12% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Active Clients</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div className="stat-value">{stats?.activeClients || 0}</div>
          <div className="stat-change positive">+5% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Email Open Rate</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
          </div>
          <div className="stat-value">{stats?.emailOpenRate || 0}%</div>
          <div className="stat-change positive">+3% from last month</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-label">Time Saved</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-value">{stats?.timeSaved || 0}h</div>
          <div className="stat-change positive">+8% from last month</div>
        </div>
      </div>

      {/* ROI Metrics */}
      <div className="section">
        <h2 className="section-title">Return on Investment</h2>
        <div className="roi-grid">
          <div className="roi-card">
            <h3>Document Processing Efficiency</h3>
            <div className="roi-metric">
              <div className="roi-value">85%</div>
              <div className="roi-label">Faster than manual processing</div>
            </div>
            <div className="roi-bar">
              <div className="roi-bar-fill" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="roi-card">
            <h3>Client Engagement</h3>
            <div className="roi-metric">
              <div className="roi-value">72%</div>
              <div className="roi-label">Average engagement score</div>
            </div>
            <div className="roi-bar">
              <div className="roi-bar-fill" style={{ width: '72%' }}></div>
            </div>
          </div>

          <div className="roi-card">
            <h3>Campaign Effectiveness</h3>
            <div className="roi-metric">
              <div className="roi-value">68%</div>
              <div className="roi-label">Open rate across campaigns</div>
            </div>
            <div className="roi-bar">
              <div className="roi-bar-fill" style={{ width: '68%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="section">
        <h2 className="section-title">Recent Activity</h2>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Document Processed</div>
              <div className="timeline-description">Annual Report 2024 for Acme Corp</div>
              <div className="timeline-time">2 hours ago</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Campaign Launched</div>
              <div className="timeline-description">Q1 Property Update Email</div>
              <div className="timeline-time">5 hours ago</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">New Client Added</div>
              <div className="timeline-description">Global Properties LLC</div>
              <div className="timeline-time">1 day ago</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-content">
              <div className="timeline-title">Document Processed</div>
              <div className="timeline-description">Property Valuation Report</div>
              <div className="timeline-time">2 days ago</div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="section">
        <h2 className="section-title">Performance Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div className="insight-content">
              <h4>Strong Email Engagement</h4>
              <p>Your email campaigns are performing 15% above industry average</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            </div>
            <div className="insight-content">
              <h4>Client Follow-up Needed</h4>
              <p>5 clients haven't been contacted in over 30 days</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </div>
            <div className="insight-content">
              <h4>Peak Processing Time</h4>
              <p>Most documents are processed between 9-11 AM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
