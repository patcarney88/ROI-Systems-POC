import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import './styles/TitleAgentDashboard.css'
import './styles/DocumentManagement.css'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Clients from './pages/Clients'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import TitleAgentDashboard from './pages/TitleAgentDashboard'
import DocumentManagement from './pages/DocumentManagement'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  }, []);

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
            <button className="nav-action-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
            </button>
            <button className="nav-action-btn avatar">
              <span>AG</span>
            </button>
            <button 
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'open' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle mobile menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-links">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/documents" 
            className={location.pathname === '/documents' ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            Documents
          </Link>
          <Link 
            to="/clients" 
            className={location.pathname === '/clients' ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            Clients
          </Link>
          <Link 
            to="/campaigns" 
            className={location.pathname === '/campaigns' ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            Campaigns
          </Link>
          <Link 
            to="/analytics" 
            className={location.pathname === '/analytics' ? 'mobile-nav-link active' : 'mobile-nav-link'}
            onClick={() => setMobileMenuOpen(false)}
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Main Content with Routes */}
      <main>
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
            path="/documents"
            element={
              <Documents
                documents={documents}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onDocumentUpload={handleDocumentUpload}
              />
            }
          />
          <Route
            path="/clients"
            element={
              <Clients
                clients={clients}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onClientSave={handleClientSave}
                onEditClient={handleEditClient}
              />
            }
          />
          <Route
            path="/campaigns"
            element={
              <Campaigns
                campaigns={campaigns}
                onCampaignLaunch={handleCampaignLaunch}
              />
            }
          />
          <Route
            path="/analytics"
            element={
              <Analytics stats={stats} />
            }
          />
          <Route
            path="/dashboard/title-agent"
            element={
              <TitleAgentDashboard />
            }
          />
          <Route
            path="/dashboard/title-agent/documents"
            element={
              <DocumentManagement />
            }
          />
        </Routes>
      </main>

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
