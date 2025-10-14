import { useState, useEffect } from 'react';
import { 
  Home, FileText, Users, Mail, Bell, BarChart3, Settings, HelpCircle,
  Search, ChevronDown, Menu, X, TrendingUp, TrendingDown, AlertCircle,
  Phone, Send, Eye, Upload, Calendar, Activity, Target, Zap
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data
const transactionData = {
  newThisWeek: 12,
  completedThisMonth: 45,
  totalYTD: 523,
  revenueGenerated: 2847500,
  trend: 15.3
};

const alertsData = [
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
  },
  {
    id: 3,
    client: 'Emma Wilson',
    property: '789 Pine Road',
    type: 'New Inquiry',
    priority: 'high',
    confidence: 92,
    time: '5 hours ago'
  },
  {
    id: 4,
    client: 'David Martinez',
    property: '321 Elm Court',
    type: 'Document Viewed',
    priority: 'low',
    confidence: 65,
    time: '1 day ago'
  }
];

const documentsData = [
  { id: 1, name: 'Purchase Agreement - 123 Oak.pdf', status: 'processing', progress: 65 },
  { id: 2, name: 'Title Deed - 456 Maple.pdf', status: 'complete', progress: 100 },
  { id: 3, name: 'Inspection Report - 789 Pine.pdf', status: 'processing', progress: 30 },
  { id: 4, name: 'Closing Documents - 321 Elm.pdf', status: 'failed', progress: 0 }
];

const marketingData = {
  emailsSent: 1250,
  emailsOpened: 625,
  emailsClicked: 187,
  openRate: 50,
  clickRate: 15,
  nextCampaigns: [
    { name: 'Q1 Property Update', date: '2025-01-15', recipients: 450 },
    { name: 'Market Insights Newsletter', date: '2025-01-20', recipients: 780 }
  ]
};

const engagementChartData = [
  { month: 'Jul', active: 245 },
  { month: 'Aug', active: 289 },
  { month: 'Sep', active: 312 },
  { month: 'Oct', active: 356 },
  { month: 'Nov', active: 398 },
  { month: 'Dec', active: 445 }
];

const documentAccessData = [
  { name: 'Purchase Agreements', value: 340 },
  { name: 'Title Deeds', value: 280 },
  { name: 'Inspections', value: 190 },
  { name: 'Closing Docs', value: 150 }
];

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function TitleAgentDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState(7);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // Handle file upload logic here
    console.log('Files dropped:', e.dataTransfer.files);
  };

  return (
    <div className="title-agent-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <button 
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="header-logo">
            <Home size={28} />
            <span>ROI Systems</span>
          </div>

          <div className="header-search">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search transactions, clients, documents..." 
              aria-label="Search"
            />
          </div>

          <div className="header-actions">
            <button className="notification-btn" aria-label="Notifications">
              <Bell size={20} />
              {notifications > 0 && <span className="notification-badge">{notifications}</span>}
            </button>
            
            <div className="user-menu">
              <div className="user-avatar">AG</div>
              <span className="user-name">Agent Name</span>
              <ChevronDown size={16} />
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <nav className="sidebar-nav">
            <a href="#" className="nav-item active">
              <Home size={20} />
              <span>Dashboard</span>
            </a>
            <a href="#" className="nav-item">
              <FileText size={20} />
              <span>Transactions</span>
            </a>
            <a href="#" className="nav-item">
              <FileText size={20} />
              <span>Documents</span>
            </a>
            <a href="#" className="nav-item">
              <Users size={20} />
              <span>Clients</span>
            </a>
            <a href="#" className="nav-item">
              <Mail size={20} />
              <span>Marketing</span>
            </a>
            <a href="#" className="nav-item">
              <Bell size={20} />
              <span>Alerts</span>
            </a>
            <a href="#" className="nav-item">
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

          {/* Transaction Overview Widget */}
          <section className="widget-section">
            <h2 className="widget-title">Transaction Overview</h2>
            <div className="stats-grid">
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
            </div>
          </section>

          {/* Instant Business Alerts Widget */}
          <section className="widget-section">
            <div className="widget-header">
              <h2 className="widget-title">Instant Business Alerts</h2>
              <button className="btn-secondary-sm">View All</button>
            </div>
            <div className="alerts-list">
              {alertsData.map(alert => (
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
                    <button className="action-btn" title="Call">
                      <Phone size={16} />
                    </button>
                    <button className="action-btn" title="Email">
                      <Send size={16} />
                    </button>
                    <button className="action-btn" title="View Details">
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <div className="widget-row">
            {/* Document Processing Status */}
            <section className="widget-section widget-half">
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
                <button className="btn-primary-sm">Browse Files</button>
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

              <button className="btn-secondary-full">Bulk Upload</button>
            </section>

            {/* Forever Marketing Performance */}
            <section className="widget-section widget-half">
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

              <button className="btn-primary-full">Create New Campaign</button>
            </section>
          </div>

          {/* Client Engagement Metrics */}
          <section className="widget-section">
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
                  <PieChart>
                    <Pie
                      data={documentAccessData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {documentAccessData.map((entry, index) => (
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
