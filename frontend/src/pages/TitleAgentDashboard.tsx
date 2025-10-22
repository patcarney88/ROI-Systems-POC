import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Home, FileText, Users, Mail, Bell, BarChart3, Settings, HelpCircle,
  TrendingUp, AlertCircle, Phone, Send, Eye, Upload, Calendar, Activity, Target, Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { documentApi, clientApi, campaignApi } from '../services/api.services';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function TitleAgentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(7);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Data states with loading and error handling
  const [transactionData, setTransactionData] = useState({
    newThisWeek: 0,
    completedThisMonth: 0,
    totalYTD: 0,
    revenueGenerated: 0,
    trend: 0
  });
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [documentsData, setDocumentsData] = useState<any[]>([]);
  const [marketingData, setMarketingData] = useState({
    emailsSent: 0,
    emailsOpened: 0,
    emailsClicked: 0,
    openRate: 0,
    clickRate: 0,
    nextCampaigns: []
  });
  const [engagementChartData, setEngagementChartData] = useState<any[]>([]);
  const [documentAccessData, setDocumentAccessData] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch documents stats
      const [docsResponse, clientsResponse, campaignsResponse] = await Promise.allSettled([
        documentApi.getAll({ limit: 10 }),
        clientApi.getAll({ limit: 50 }),
        campaignApi.getAllStats()
      ]);

      // Process documents data
      if (docsResponse.status === 'fulfilled' && docsResponse.value.success) {
        const docs = docsResponse.value.data?.documents || [];

        // Calculate transaction data from documents
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const yearStart = new Date(now.getFullYear(), 0, 1);

        const newThisWeek = docs.filter(d => new Date(d.uploadDate) >= weekAgo).length;
        const completedThisMonth = docs.filter(d =>
          new Date(d.uploadDate) >= monthAgo && d.status === 'active'
        ).length;
        const totalYTD = docs.filter(d => new Date(d.uploadDate) >= yearStart).length;

        setTransactionData({
          newThisWeek,
          completedThisMonth,
          totalYTD,
          revenueGenerated: totalYTD * 5450, // Estimated revenue per transaction
          trend: 15.3 // Could calculate from historical data
        });

        // Set documents for processing display
        setDocumentsData(docs.slice(0, 4).map(doc => ({
          id: doc.id,
          name: doc.title,
          status: doc.status === 'active' ? 'complete' : doc.status === 'pending' ? 'processing' : 'failed',
          progress: doc.status === 'active' ? 100 : doc.status === 'pending' ? 65 : 0
        })));

        // Calculate document access data
        const docTypes: { [key: string]: number } = {};
        docs.forEach(doc => {
          docTypes[doc.type] = (docTypes[doc.type] || 0) + 1;
        });

        setDocumentAccessData(
          Object.entries(docTypes).map(([name, value]) => ({ name, value }))
        );
      }

      // Process clients data for alerts
      if (clientsResponse.status === 'fulfilled' && clientsResponse.value.success) {
        const clients = clientsResponse.value.data?.clients || [];

        // Generate alerts from client activity
        const alerts = clients.slice(0, 4).map((client, index) => ({
          id: client.id,
          client: client.name,
          property: `Property ${index + 1}`,
          type: index === 0 ? 'Document Expiring' :
                index === 1 ? 'Email Opened' :
                index === 2 ? 'New Inquiry' : 'Document Viewed',
          priority: client.engagementScore > 80 ? 'high' :
                   client.engagementScore > 50 ? 'medium' : 'low',
          confidence: client.engagementScore,
          time: client.lastContact
        }));

        setAlertsData(alerts);

        // Generate engagement chart data
        const chartData = [
          { month: 'Jul', active: Math.floor(clients.length * 0.55) },
          { month: 'Aug', active: Math.floor(clients.length * 0.65) },
          { month: 'Sep', active: Math.floor(clients.length * 0.70) },
          { month: 'Oct', active: Math.floor(clients.length * 0.80) },
          { month: 'Nov', active: Math.floor(clients.length * 0.90) },
          { month: 'Dec', active: clients.filter(c => c.status === 'active').length }
        ];
        setEngagementChartData(chartData);
      }

      // Process campaign stats
      if (campaignsResponse.status === 'fulfilled' && campaignsResponse.value.success) {
        const stats = campaignsResponse.value.data?.aggregateStats || {};
        const campaigns = campaignsResponse.value.data?.byStatus || {};

        setMarketingData({
          emailsSent: stats.sent || 0,
          emailsOpened: stats.opened || 0,
          emailsClicked: stats.clicked || 0,
          openRate: stats.sent > 0 ? (stats.opened / stats.sent * 100) : 0,
          clickRate: stats.opened > 0 ? (stats.clicked / stats.opened * 100) : 0,
          nextCampaigns: [] // Would need to fetch scheduled campaigns
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Using sample data.');

      // Set fallback data
      setTransactionData({
        newThisWeek: 12,
        completedThisMonth: 45,
        totalYTD: 523,
        revenueGenerated: 2847500,
        trend: 15.3
      });

      setAlertsData([
        {
          id: 1,
          client: 'Sarah Johnson',
          property: '123 Oak Street',
          type: 'Document Expiring',
          priority: 'high',
          confidence: 95,
          time: '2 hours ago'
        },
        {
          id: 2,
          client: 'Michael Chen',
          property: '456 Maple Avenue',
          type: 'Email Opened',
          priority: 'medium',
          confidence: 78,
          time: '4 hours ago'
        }
      ]);

      setEngagementChartData([
        { month: 'Jul', active: 245 },
        { month: 'Aug', active: 289 },
        { month: 'Sep', active: 312 },
        { month: 'Oct', active: 356 },
        { month: 'Nov', active: 398 },
        { month: 'Dec', active: 445 }
      ]);

      setDocumentAccessData([
        { name: 'Purchase Agreements', value: 340 },
        { name: 'Title Deeds', value: 280 },
        { name: 'Inspections', value: 190 },
        { name: 'Closing Docs', value: 150 }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    // Upload files
    await handleFileUpload(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      await handleFileUpload(files);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const validFiles = files.filter(f => f.size <= maxSize);

    if (validFiles.length !== files.length) {
      const oversizedCount = files.length - validFiles.length;
      console.error(`${oversizedCount} file(s) exceed maximum size of 10MB`);
    }

    if (validFiles.length > 0) {
      console.log('Uploading files:', validFiles);

      // Upload files one by one
      let successCount = 0;
      let failCount = 0;

      for (const file of validFiles) {
        try {
          const response = await documentApi.upload(file, {
            title: file.name,
            type: 'Title Deed', // Default type, could be made dynamic
            metadata: {
              uploadedFrom: 'TitleAgentDashboard',
              uploadMethod: 'drag-and-drop'
            }
          });

          if (response.success) {
            successCount++;
            console.log(`Successfully uploaded: ${file.name}`);
          } else {
            failCount++;
            console.error(`Failed to upload ${file.name}:`, response.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Error uploading ${file.name}:`, error);
        }
      }

      // Show results
      if (successCount > 0) {
        console.log(`Successfully uploaded ${successCount} file(s)`);
      }
      if (failCount > 0) {
        console.error(`Failed to upload ${failCount} file(s)`);
      }

      // Refresh document count
      fetchDashboardData();
    }
  };

  const handleViewAllAlerts = () => {
    // Scroll to alerts section
    const alertsSection = document.getElementById('alerts');
    if (alertsSection) {
      alertsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // In production, this could navigate to a dedicated alerts page:
    // navigate('/alerts');
  };

  const handleCall = (alert: typeof alertsData[number]) => {
    // Extract phone number (assuming format like "(555) 123-4567")
    // In production, this would integrate with Twilio or similar service

    // For now, use tel: protocol to open phone dialer
    const phoneNumber = '555-123-4567'; // Mock number
    window.location.href = `tel:${phoneNumber}`;

    console.log(`Call initiated to ${alert.client} at ${phoneNumber} regarding ${alert.property}`);

    // Log the interaction
    // In production: await activityApi.log({ type: 'call', clientName: alert.client, ... });
  };

  const handleEmail = (alert: typeof alertsData[number]) => {
    // Open default email client with pre-filled information
    const subject = encodeURIComponent(`Follow-up: ${alert.type} - ${alert.property}`);
    const body = encodeURIComponent(
      `Hi ${alert.client},\n\n` +
      `I noticed that ${alert.type.toLowerCase()} for ${alert.property}.\n\n` +
      `I wanted to reach out to discuss this with you.\n\n` +
      `Best regards`
    );

    const email = 'client@example.com'; // In production, get from alert data
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;

    console.log(`Email composer opened for ${alert.client}`);

    // In production: Log the interaction
    // await activityApi.log({ type: 'email', clientName: alert.client, ... });
  };

  const handleViewDetails = (alert: typeof alertsData[number]) => {
    // In production, this would open a modal or navigate to details page
    const details = `
Alert Details:

Client: ${alert.client}
Property: ${alert.property}
Type: ${alert.type}
Priority: ${alert.priority}
Confidence: ${alert.confidence}%
Time: ${alert.time}

Actions:
- Call client
- Send email
- Schedule meeting
- Add note
    `.trim();

    // For demo, show alert with details
    alert(details);

    console.log(`Viewing details for alert ${alert.id}:`, alert);

    // In production, you would:
    // setSelectedAlert(alert);
    // setShowDetailModal(true);
  };

  const handleBulkUpload = () => {
    // Trigger file input with multiple files enabled
    if (fileInputRef.current) {
      // Ensure multiple attribute is set
      fileInputRef.current.setAttribute('multiple', 'true');
      fileInputRef.current.click();
    }

    console.log('Bulk upload dialog opened');
  };

  const handleCreateCampaign = () => {
    console.log('Create New Campaign clicked');
    // Navigate to campaign creation page
  };

  return (
    <div className="title-agent-dashboard">
      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="sidebar-nav">
            <a href="#overview" className="nav-item active" onClick={() => setMobileMenuOpen(false)}>
              <Home size={20} />
              <span>Dashboard</span>
            </a>
            <a href="#overview" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
              <FileText size={20} />
              <span>Transactions</span>
            </a>
            <a href="#documents-processing" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
              <FileText size={20} />
              <span>Documents</span>
            </a>
            <a href="#engagement-metrics" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
              <Users size={20} />
              <span>Clients</span>
            </a>
            <a href="#marketing-performance" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
              <Mail size={20} />
              <span>Marketing</span>
            </a>
            <a href="#alerts" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
              <Bell size={20} />
              <span>Alerts</span>
            </a>
            <a href="#engagement-metrics" className="nav-item" onClick={() => setMobileMenuOpen(false)}>
              <BarChart3 size={20} />
              <span>Reports</span>
            </a>
            <a href="#" className="nav-item">
              <Settings size={20} />
              <span>Settings</span>
            </a>
            <a href="#" className="nav-item">
              <HelpCircle size={20} />
              <span>Support</span>
            </a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="dashboard-header-section">
            <h1>Title Agent Dashboard</h1>
            <p>Welcome back! Here's what's happening with your business today.</p>
          </div>

          {/* Show error message if data failed to load */}
          {error && (
            <div style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              color: '#991b1b'
            }}>
              {error}
            </div>
          )}

          {/* Transaction Overview Widget */}
          <section className="widget-section" id="overview">
            <h2 className="widget-title">Transaction Overview</h2>
            <div className="stats-grid">
              {loading ? (
                // Loading skeleton
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="stat-card" style={{ background: '#f3f4f6' }}>
                      <div className="stat-header">
                        <div style={{ width: '120px', height: '16px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                      </div>
                      <div style={{ width: '80px', height: '32px', background: '#e5e7eb', borderRadius: '4px', marginTop: '0.5rem' }}></div>
                      <div style={{ width: '150px', height: '14px', background: '#e5e7eb', borderRadius: '4px', marginTop: '0.5rem' }}></div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="stat-card gradient-blue">
                    <div className="stat-header">
                      <span className="stat-label">New This Week</span>
                      <Zap size={24} className="stat-icon" />
                    </div>
                    <div className="stat-value">{transactionData.newThisWeek}</div>
                    <div className="stat-trend positive">
                      <TrendingUp size={16} />
                      <span>+{transactionData.trend}% from last week</span>
                    </div>
                  </div>

                  <div className="stat-card gradient-green">
                    <div className="stat-header">
                      <span className="stat-label">Completed This Month</span>
                      <Target size={24} className="stat-icon" />
                    </div>
                    <div className="stat-value">{transactionData.completedThisMonth}</div>
                    <div className="stat-trend positive">
                      <TrendingUp size={16} />
                      <span>On track for monthly goal</span>
                    </div>
                  </div>

                  <div className="stat-card gradient-purple">
                    <div className="stat-header">
                      <span className="stat-label">Total YTD</span>
                      <Activity size={24} className="stat-icon" />
                    </div>
                    <div className="stat-value">{transactionData.totalYTD}</div>
                    <div className="stat-trend positive">
                      <TrendingUp size={16} />
                      <span>Best year yet!</span>
                    </div>
                  </div>

                  <div className="stat-card gradient-orange">
                    <div className="stat-header">
                      <span className="stat-label">Revenue Generated</span>
                      <BarChart3 size={24} className="stat-icon" />
                    </div>
                    <div className="stat-value">${(transactionData.revenueGenerated / 1000000).toFixed(2)}M</div>
                    <div className="stat-trend positive">
                      <TrendingUp size={16} />
                      <span>+12.5% vs last year</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Instant Business Alerts Widget */}
          <section className="widget-section" id="alerts">
            <div className="widget-header">
              <h2 className="widget-title">Instant Business Alerts</h2>
              <button className="btn-secondary-sm" onClick={handleViewAllAlerts}>View All</button>
            </div>
            <div className="alerts-list">
              {loading ? (
                // Loading skeleton for alerts
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="alert-item" style={{ opacity: 0.5 }}>
                      <div className="alert-indicator" style={{ background: '#e5e7eb' }}></div>
                      <div className="alert-content">
                        <div style={{ width: '200px', height: '20px', background: '#e5e7eb', borderRadius: '4px', marginBottom: '0.5rem' }}></div>
                        <div style={{ width: '150px', height: '16px', background: '#e5e7eb', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </>
              ) : alertsData.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                  No alerts at this time
                </div>
              ) : (
                alertsData.map(alert => (
                <div key={alert.id} className={`alert-item priority-${alert.priority}`}>
                  <div className="alert-indicator"></div>
                  <div className="alert-content">
                    <div className="alert-main">
                      <div className="alert-client">
                        <strong>{alert.client}</strong>
                        <span className="alert-property">{alert.property}</span>
                      </div>
                      <div className="alert-type">
                        <AlertCircle size={16} />
                        <span>{alert.type}</span>
                      </div>
                    </div>
                    <div className="alert-meta">
                      <span className="alert-confidence">Confidence: {alert.confidence}%</span>
                      <span className="alert-time">{alert.time}</span>
                    </div>
                  </div>
                  <div className="alert-actions">
                    <button className="action-btn" title="Call" onClick={() => handleCall(alert)}>
                      <Phone size={16} />
                    </button>
                    <button className="action-btn" title="Email" onClick={() => handleEmail(alert)}>
                      <Send size={16} />
                    </button>
                    <button className="action-btn" title="View Details" onClick={() => handleViewDetails(alert)}>
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))
              )}
            </div>
          </section>

          <div className="widget-row">
            {/* Document Processing Status */}
            <section className="widget-section widget-half" id="documents-processing">
              <h2 className="widget-title">Document Processing</h2>
              
              <div 
                className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload size={32} />
                <p>Drag & drop files here or</p>
                <button
                  className="btn-primary-sm"
                  onClick={handleBrowseClick}
                  aria-controls="document-upload"
                >
                  Browse Files
                </button>
                <input
                  id="document-upload"
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  aria-label="Upload documents (PDF, DOC, DOCX, JPG, JPEG, PNG)"
                />
              </div>

              <div className="documents-list">
                {documentsData.map(doc => (
                  <div key={doc.id} className="document-item">
                    <div className="document-info">
                      <FileText size={20} />
                      <div className="document-details">
                        <span className="document-name">{doc.name}</span>
                        <div className="document-progress">
                          <div className="progress-bar">
                            <div 
                              className={`progress-fill status-${doc.status}`}
                              style={{ width: `${doc.progress}%` }}
                            ></div>
                          </div>
                          <span className={`status-badge status-${doc.status}`}>
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-secondary-full" onClick={handleBulkUpload}>Bulk Upload</button>
            </section>

            {/* Forever Marketing Performance */}
            <section className="widget-section widget-half" id="marketing-performance">
              <h2 className="widget-title">Forever Marketing Performance</h2>
              
              <div className="marketing-metrics">
                <div className="metric-card">
                  <span className="metric-label">Emails Sent</span>
                  <span className="metric-value">{marketingData.emailsSent.toLocaleString()}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Opened</span>
                  <span className="metric-value">{marketingData.emailsOpened.toLocaleString()}</span>
                  <span className="metric-percentage">{marketingData.openRate}%</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">Clicked</span>
                  <span className="metric-value">{marketingData.emailsClicked.toLocaleString()}</span>
                  <span className="metric-percentage">{marketingData.clickRate}%</span>
                </div>
              </div>

              <div className="open-rate-indicator">
                <div className="rate-label">Open Rate Target: 40-60%</div>
                <div className="rate-bar">
                  <div className="rate-range"></div>
                  <div 
                    className="rate-current" 
                    style={{ left: `${marketingData.openRate}%` }}
                  >
                    {marketingData.openRate}%
                  </div>
                </div>
              </div>

              <div className="upcoming-campaigns">
                <h3>Next Scheduled Campaigns</h3>
                {marketingData.nextCampaigns.map((campaign, idx) => (
                  <div key={idx} className="campaign-item">
                    <Calendar size={16} />
                    <div className="campaign-details">
                      <span className="campaign-name">{campaign.name}</span>
                      <span className="campaign-meta">{campaign.date} • {campaign.recipients} recipients</span>
                    </div>
                  </div>
                ))}
              </div>

              <button className="btn-primary-full" onClick={handleCreateCampaign}>Create New Campaign</button>
            </section>
          </div>

          {/* Client Engagement Metrics */}
          <section className="widget-section" id="engagement-metrics">
            <h2 className="widget-title">Client Engagement Metrics</h2>
            
            <div className="charts-grid">
              <div className="chart-container">
                <h3>Active Homeowners</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={engagementChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="active" 
                      stroke="#2563eb" 
                      strokeWidth={3}
                      dot={{ fill: '#2563eb', r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-container">
                <h3>Document Access Frequency</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart margin={{ top: 0, right: 8, bottom: 0, left: 8 }}>
                    <Pie
                      data={documentAccessData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={70}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {documentAccessData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="engagement-stats">
              <div className="engagement-stat">
                <span className="stat-label">Communication Response Rate</span>
                <div className="stat-bar-container">
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: '78%' }}></div>
                  </div>
                  <span className="stat-percentage">78%</span>
                </div>
              </div>
              <div className="engagement-stat">
                <span className="stat-label">Monthly Active Users</span>
                <div className="stat-bar-container">
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{ width: '85%' }}></div>
                  </div>
                  <span className="stat-percentage">85%</span>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
