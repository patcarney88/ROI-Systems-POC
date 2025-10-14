import { useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import { DashboardSkeleton, AlertSkeleton, DocumentSkeleton } from './components/skeletons'
import { getPerformanceMonitor } from './utils/performance'
import { useNotifications } from './hooks/useNotifications'
import {
  BellIconWithBadge,
  NotificationCenter,
  NotificationToast,
  NotificationPermissionPrompt
} from './components/notifications'
import { Notification } from './types/notification.types'

// Lazy load page components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Documents = lazy(() => import('./pages/Documents'))
const Clients = lazy(() => import('./pages/Clients'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const Analytics = lazy(() => import('./pages/Analytics'))
const AlertDashboard = lazy(() => import('./pages/AlertDashboard'))

interface Document {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'active' | 'expiring' | 'expired';
  client: string;
  uploadDate: string;
  expiryDate?: string;
  size: string;
}

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  properties: number;
  lastContact: string;
  engagementScore: number;
  status: 'active' | 'at-risk' | 'dormant';
  notes?: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'scheduled' | 'paused' | 'completed';
  targetAudience: string;
  scheduledDate: string;
  metrics?: {
    sent: number;
    opens: number;
    clicks: number;
  };
}

interface Stats {
  totalDocuments: number;
  activeClients: number;
  emailEngagement: number;
  emailOpenRate: number;
  timeSaved: number;
  retentionRate: number;
}

function AppContent() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Notification state
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [toastNotification, setToastNotification] = useState<Notification | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Use notifications hook
  const notifications_hook = useNotifications({
    autoInit: true,
    pageSize: 20
  });

  // Data states
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Purchase Agreement - 123 Oak Street',
      type: 'Purchase Agreement',
      status: 'active',
      client: 'Sarah Johnson',
      uploadDate: '2025-10-05',
      expiryDate: '2026-10-05',
      size: '2.4 MB'
    },
    {
      id: '2',
      title: 'Title Deed - 456 Maple Avenue',
      type: 'Title Deed',
      status: 'expiring',
      client: 'Michael Chen',
      uploadDate: '2024-11-20',
      expiryDate: '2025-11-20',
      size: '1.8 MB'
    },
    {
      id: '3',
      title: 'Inspection Report - 789 Pine Road',
      type: 'Inspection',
      status: 'pending',
      client: 'Emma Wilson',
      uploadDate: '2025-10-01',
      size: '4.2 MB'
    }
  ]);

  const [clients, setClients] = useState<Client[]>([
    {
      id: '1',
      name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '(555) 123-4567',
      properties: 3,
      lastContact: '2 days ago',
      engagementScore: 92,
      status: 'active'
    },
    {
      id: '2',
      name: 'Michael Chen',
      email: 'mchen@email.com',
      phone: '(555) 234-5678',
      properties: 5,
      lastContact: '1 week ago',
      engagementScore: 78,
      status: 'active'
    },
    {
      id: '3',
      name: 'Emma Wilson',
      email: 'emma.w@email.com',
      phone: '(555) 345-6789',
      properties: 2,
      lastContact: '3 weeks ago',
      engagementScore: 45,
      status: 'at-risk'
    }
  ]);

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Q1 Property Update',
      description: 'Quarterly property market update for all clients',
      status: 'active',
      targetAudience: 'All Clients',
      scheduledDate: '2025-10-15',
      metrics: {
        sent: 45,
        opens: 32,
        clicks: 18
      }
    },
    {
      id: '2',
      name: 'New Listing Alert',
      description: 'Alert active clients about new property listings',
      status: 'scheduled',
      targetAudience: 'Active Clients',
      scheduledDate: '2025-10-20'
    }
  ]);

  const [notifications, setNotifications] = useState<string[]>([
    'Title Deed expiring in 30 days',
    'New client engagement detected',
    'Campaign sent to 45 clients'
  ]);

  const stats: Stats = {
    totalDocuments: documents.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    emailEngagement: 52.4,
    emailOpenRate: 68.0,
    timeSaved: 2.4,
    retentionRate: 18.3
  };

  useEffect(() => {
    setTimeout(() => setLoading(false), 800);

    // Initialize performance monitoring
    const perfMonitor = getPerformanceMonitor();
    perfMonitor.mark('app-init');

    // Log performance summary after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        perfMonitor.logSummary();
      }, 3000);
    });

    return () => {
      perfMonitor.disconnect();
    };
  }, []);

  // Show permission prompt after login (only if not dismissed)
  useEffect(() => {
    const shouldShowPrompt =
      !loading &&
      notifications_hook.canPrompt &&
      !notifications_hook.isSubscribed &&
      !localStorage.getItem('notification_prompt_dismissed');

    if (shouldShowPrompt) {
      // Show prompt after 3 seconds
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [loading, notifications_hook.canPrompt, notifications_hook.isSubscribed]);

  // Handle new notifications (show toast when app is open)
  useEffect(() => {
    if (notifications_hook.history.length > 0) {
      const latestNotification = notifications_hook.history[0];

      // Only show toast for unread notifications
      if (!latestNotification.read) {
        setToastNotification(latestNotification);
        setShowToast(true);
      }
    }
  }, [notifications_hook.history.length]);

  // Document upload handler
  const handleDocumentUpload = (files: File[], metadata: any) => {
    const newDocs = files.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      title: `${metadata.type} - ${file.name}`,
      type: metadata.type,
      status: 'pending' as const,
      client: metadata.client,
      uploadDate: new Date().toISOString().split('T')[0],
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    }));

    setDocuments(prev => [...newDocs, ...prev]);
    setNotifications(prev => [`Uploaded ${files.length} document(s)`, ...prev]);
  };

  // Client handlers
  const handleClientSave = (clientData: any) => {
    const existingClient = clients.find(c => c.id === clientData.id);

    if (existingClient) {
      // Update existing
      setClients(prev => prev.map(c =>
        c.id === clientData.id ? { ...c, ...clientData, lastContact: 'Just now' } : c
      ));
      setNotifications(prev => [`Updated client: ${clientData.name}`, ...prev]);
    } else {
      // Add new
      const newClient: Client = {
        id: `${Date.now()}`,
        ...clientData,
        lastContact: 'Just now',
        engagementScore: 50
      };
      setClients(prev => [newClient, ...prev]);
      setNotifications(prev => [`Added new client: ${clientData.name}`, ...prev]);
    }
  };

  const handleEditClient = (client: Client) => {
    // This will be handled by the Clients page component
    console.log('Edit client:', client);
  };

  // Campaign handler
  const handleCampaignLaunch = (campaign: any) => {
    const newCampaign: Campaign = {
      id: `${Date.now()}`,
      ...campaign,
      status: campaign.schedule === 'now' ? 'active' : 'scheduled'
    };

    setCampaigns(prev => [newCampaign, ...prev]);

    const recipientCount = campaign.recipients === 'all' ? clients.length :
                           clients.filter(c => c.status === campaign.recipients).length;
    setNotifications(prev => [
      `Campaign "${campaign.name}" ${campaign.schedule === 'now' ? 'sent' : 'scheduled'} to ${recipientCount} clients`,
      ...prev
    ]);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2 className="loading-title">ROI Systems</h2>
          <p className="loading-subtitle">Real Estate Document Management</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      <header className="main-nav">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="logo-text">ROI Systems</span>
          </Link>

          <nav className="nav-menu">
            <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>
              Dashboard
            </Link>
            <Link to="/alerts" className={location.pathname === '/alerts' ? 'nav-link active' : 'nav-link'}>
              Alerts
            </Link>
            <Link to="/documents" className={location.pathname === '/documents' ? 'nav-link active' : 'nav-link'}>
              Documents
            </Link>
            <Link to="/clients" className={location.pathname === '/clients' ? 'nav-link active' : 'nav-link'}>
              Clients
            </Link>
            <Link to="/campaigns" className={location.pathname === '/campaigns' ? 'nav-link active' : 'nav-link'}>
              Campaigns
            </Link>
            <Link to="/analytics" className={location.pathname === '/analytics' ? 'nav-link active' : 'nav-link'}>
              Analytics
            </Link>
          </nav>

          <div className="nav-actions">
            <button className="nav-action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>

            {/* Notification Bell */}
            <BellIconWithBadge
              unreadCount={notifications_hook.unreadCount}
              onClick={() => setNotificationCenterOpen(true)}
            />

            <button className="nav-action-btn avatar">
              <span>AG</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with Routes */}
      <main>
        <Suspense fallback={<DashboardSkeleton />}>
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  documents={documents}
                  clients={clients}
                  stats={stats}
                  onDocumentUpload={handleDocumentUpload}
                  onClientSave={handleClientSave}
                  onCampaignLaunch={handleCampaignLaunch}
                />
              }
            />
            <Route
              path="/alerts"
              element={
                <Suspense fallback={<AlertSkeleton />}>
                  <AlertDashboard />
                </Suspense>
              }
            />
            <Route
              path="/documents"
              element={
                <Suspense fallback={<DocumentSkeleton />}>
                  <Documents
                    documents={documents}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onDocumentUpload={handleDocumentUpload}
                  />
                </Suspense>
              }
            />
            <Route
              path="/clients"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Clients
                    clients={clients}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onClientSave={handleClientSave}
                    onEditClient={handleEditClient}
                  />
                </Suspense>
              }
            />
            <Route
              path="/campaigns"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Campaigns
                    campaigns={campaigns}
                    onCampaignLaunch={handleCampaignLaunch}
                  />
                </Suspense>
              }
            />
            <Route
              path="/analytics"
              element={
                <Suspense fallback={<DashboardSkeleton />}>
                  <Analytics stats={stats} />
                </Suspense>
              }
            />
          </Routes>
        </Suspense>
      </main>

      {/* Notification Components */}
      <NotificationCenter
        open={notificationCenterOpen}
        onClose={() => setNotificationCenterOpen(false)}
        notifications={notifications_hook.history}
        unreadCount={notifications_hook.unreadCount}
        loading={notifications_hook.historyLoading}
        onMarkAsRead={notifications_hook.markAsRead}
        onMarkAllAsRead={notifications_hook.markAllAsRead}
        onDelete={notifications_hook.deleteNotification}
        onLoadMore={notifications_hook.loadMoreHistory}
        onRefresh={notifications_hook.refreshHistory}
        hasMore={true}
      />

      <NotificationPermissionPrompt
        open={showPermissionPrompt}
        onClose={() => setShowPermissionPrompt(false)}
        onEnable={async () => {
          await notifications_hook.subscribe();
        }}
        variant="modal"
      />

      <NotificationToast
        notification={toastNotification}
        open={showToast}
        onClose={() => setShowToast(false)}
        onClick={(notification) => {
          notifications_hook.markAsRead(notification.id);
        }}
        autoHideDuration={5000}
      />

      {/* Footer */}
      <footer className="main-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 22V12H15V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span>ROI Systems</span>
            </div>
            <p className="footer-tagline">Real Estate Document Management & Client Retention Platform</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h4>Platform</h4>
              <Link to="/">Dashboard</Link>
              <Link to="/alerts">Alerts</Link>
              <Link to="/documents">Documents</Link>
              <Link to="/clients">Clients</Link>
              <Link to="/analytics">Analytics</Link>
            </div>
            <div className="footer-column">
              <h4>Resources</h4>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Support</a>
              <a href="#">Status</a>
            </div>
            <div className="footer-column">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Blog</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 ROI Systems. All rights reserved.</p>
          <div className="footer-legal">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App
