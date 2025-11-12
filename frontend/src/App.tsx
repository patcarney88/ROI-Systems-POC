import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import './styles/TitleAgentDashboard.css'
import './styles/DocumentManagement.css'
import './styles/RealtorDashboard.css'
import './styles/Auth.css'
import './styles/CommunicationCenter.css'
import './styles/AnalyticsDashboard.css'
import './styles/HomeownerPortal.css'
import './styles/MarketingCenter.css'
import { AuthProvider } from './contexts/AuthContext'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Documents from './pages/Documents'
import Clients from './pages/Clients'
import Campaigns from './pages/Campaigns'
import Analytics from './pages/Analytics'
import TitleAgentDashboard from './pages/TitleAgentDashboard'
import DocumentManagement from './pages/DocumentManagement'
import RealtorDashboard from './pages/RealtorDashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import CommunicationCenter from './pages/CommunicationCenter'
import AnalyticsDashboard from './pages/AnalyticsDashboard'
import HomeownerPortal from './pages/HomeownerPortal'
import MarketingCenter from './pages/MarketingCenter'
import MyProfile from './pages/MyProfile'
import Settings from './pages/Settings'
import HelpSupport from './pages/HelpSupport'
import NotFound from './pages/NotFound'
import GlobalSearch from './components/GlobalSearch'
import { documentApi, clientApi, campaignApi } from './services/api.services'

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
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [journeysMenuOpen, setJourneysMenuOpen] = useState(false);

  // Data states with loading and error handling
  const [documents, setDocuments] = useState<Document[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [documentsError, setDocumentsError] = useState<string | null>(null);

  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<string[]>([]);

  // Data fetching functions
  const fetchDocuments = useCallback(async () => {
    try {
      setDocumentsLoading(true);
      setDocumentsError(null);
      const response = await documentApi.getAll({ limit: 100 });
      if (response.success && response.data?.documents) {
        // Map API response to local Document interface
        const mappedDocs = response.data.documents.map(doc => ({
          id: doc.id,
          title: doc.title,
          type: doc.type,
          status: doc.status as 'pending' | 'active' | 'expiring' | 'expired',
          client: doc.metadata?.clientName || 'Unknown Client',
          uploadDate: doc.uploadDate,
          expiryDate: doc.expiryDate,
          size: `${(doc.size / (1024 * 1024)).toFixed(1)} MB`
        }));
        setDocuments(mappedDocs);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch documents');
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      setDocumentsError('Failed to load documents. Please try again.');
      // Set some fallback data for demo purposes
      setDocuments([]);
    } finally {
      setDocumentsLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async () => {
    try {
      setClientsLoading(true);
      setClientsError(null);
      const response = await clientApi.getAll({ limit: 100 });
      if (response.success && response.data?.clients) {
        // Map API response to local Client interface
        const mappedClients = response.data.clients.map(client => ({
          id: client.id,
          name: client.name,
          email: client.email,
          phone: client.phone || '',
          properties: client.propertyCount || 0,
          lastContact: client.lastContact,
          engagementScore: client.engagementScore,
          status: client.status as 'active' | 'at-risk' | 'dormant',
          notes: client.notes
        }));
        setClients(mappedClients);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch clients');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setClientsError('Failed to load clients. Please try again.');
      // Set some fallback data for demo purposes
      setClients([]);
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const fetchCampaigns = useCallback(async () => {
    try {
      setCampaignsLoading(true);
      setCampaignsError(null);
      const response = await campaignApi.getAll({ limit: 100 });
      if (response.success && response.data?.campaigns) {
        // Map API response to local Campaign interface
        const mappedCampaigns = response.data.campaigns.map(campaign => ({
          id: campaign.id,
          name: campaign.name,
          description: campaign.subject,
          status: campaign.status as 'active' | 'scheduled' | 'paused' | 'completed',
          targetAudience: campaign.recipients.join(', '),
          scheduledDate: campaign.scheduleDate || campaign.sentAt || '',
          metrics: campaign.stats ? {
            sent: campaign.stats.sent,
            opens: campaign.stats.opened,
            clicks: campaign.stats.clicked
          } : undefined
        }));
        setCampaigns(mappedCampaigns);
      } else {
        throw new Error(response.error?.message || 'Failed to fetch campaigns');
      }
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      setCampaignsError('Failed to load campaigns. Please try again.');
      // Set some fallback data for demo purposes
      setCampaigns([]);
    } finally {
      setCampaignsLoading(false);
    }
  }, []);

  // Calculate stats based on actual data
  const stats: Stats = {
    totalDocuments: documents.length,
    activeClients: clients.filter(c => c.status === 'active').length,
    emailEngagement: campaigns.length > 0 ?
      campaigns.reduce((acc, c) => acc + (c.metrics ? (c.metrics.opens / c.metrics.sent * 100) : 0), 0) / campaigns.length : 0,
    emailOpenRate: campaigns.length > 0 ?
      campaigns.reduce((acc, c) => acc + (c.metrics ? (c.metrics.clicks / c.metrics.opens * 100) : 0), 0) / campaigns.length : 0,
    timeSaved: 2.4,
    retentionRate: 18.3
  };

  // Initial data fetch
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      // Fetch data in parallel
      await Promise.all([
        fetchDocuments(),
        fetchClients(),
        fetchCampaigns()
      ]);
      setLoading(false);
    };

    fetchAllData();
  }, [fetchDocuments, fetchClients, fetchCampaigns]);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (notificationsOpen) {
        setNotificationsOpen(false);
      }
    };
    
    if (notificationsOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [notificationsOpen]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (profileMenuOpen) {
        setProfileMenuOpen(false);
      }
    };
    
    if (profileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [profileMenuOpen]);

  // Close journeys menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (journeysMenuOpen) {
        setJourneysMenuOpen(false);
      }
    };
    
    if (journeysMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [journeysMenuOpen]);

  // Document upload handler with API integration
  const handleDocumentUpload = async (files: File[], metadata: any) => {
    try {
      const uploadPromises = files.map(file =>
        documentApi.upload(file, {
          title: `${metadata.type} - ${file.name}`,
          type: metadata.type,
          clientId: metadata.clientId,
          expiryDate: metadata.expiryDate,
          metadata: { clientName: metadata.client }
        })
      );

      const results = await Promise.allSettled(uploadPromises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;

      if (successCount > 0) {
        setNotifications(prev => [`Successfully uploaded ${successCount} document(s)`, ...prev]);
        // Refresh documents list
        await fetchDocuments();
      } else {
        throw new Error('All uploads failed');
      }
    } catch (err) {
      console.error('Error uploading documents:', err);
      setNotifications(prev => [`Failed to upload documents. Please try again.`, ...prev]);
      // Still add to local state for demo purposes
      const newDocs = files.map((file, index) => ({
        id: `temp-${Date.now()}-${index}`,
        title: `${metadata.type} - ${file.name}`,
        type: metadata.type,
        status: 'pending' as const,
        client: metadata.client,
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      }));
      setDocuments(prev => [...newDocs, ...prev]);
    }
  };

  // Client handlers with API integration
  const handleClientSave = async (clientData: any) => {
    try {
      const existingClient = clients.find(c => c.id === clientData.id);

      if (existingClient) {
        // Update existing client
        const response = await clientApi.update(clientData.id, {
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          propertyCount: clientData.properties,
          status: clientData.status,
          notes: clientData.notes
        });

        if (response.success) {
          setNotifications(prev => [`Updated client: ${clientData.name}`, ...prev]);
          // Refresh clients list
          await fetchClients();
        } else {
          throw new Error(response.error?.message || 'Failed to update client');
        }
      } else {
        // Create new client
        const response = await clientApi.create({
          name: clientData.name,
          email: clientData.email,
          phone: clientData.phone,
          propertyCount: clientData.properties || 0,
          status: clientData.status || 'active',
          notes: clientData.notes
        });

        if (response.success) {
          setNotifications(prev => [`Added new client: ${clientData.name}`, ...prev]);
          // Refresh clients list
          await fetchClients();
        } else {
          throw new Error(response.error?.message || 'Failed to create client');
        }
      }
    } catch (err) {
      console.error('Error saving client:', err);
      setNotifications(prev => [`Failed to save client. Please try again.`, ...prev]);
      // Still update local state for demo purposes
      if (clients.find(c => c.id === clientData.id)) {
        setClients(prev => prev.map(c =>
          c.id === clientData.id ? { ...c, ...clientData, lastContact: 'Just now' } : c
        ));
      } else {
        const newClient: Client = {
          id: `temp-${Date.now()}`,
          ...clientData,
          lastContact: 'Just now',
          engagementScore: 50
        };
        setClients(prev => [newClient, ...prev]);
      }
    }
  };

  const handleEditClient = (client: Client) => {
    // This will be handled by the Clients page component
    console.log('Edit client:', client);
  };

  // Campaign handler with API integration
  const handleCampaignLaunch = async (campaign: any) => {
    try {
      const response = await campaignApi.create({
        name: campaign.name,
        subject: campaign.description || campaign.name,
        template: campaign.template || 'default',
        recipients: campaign.recipients === 'all' ?
          clients.map(c => c.id) :
          clients.filter(c => c.status === campaign.recipients).map(c => c.id),
        schedule: campaign.schedule,
        scheduleDate: campaign.scheduledDate,
        message: campaign.message
      });

      if (response.success && response.data?.campaign) {
        const recipientCount = campaign.recipients === 'all' ? clients.length :
                             clients.filter(c => c.status === campaign.recipients).length;
        setNotifications(prev => [
          `Campaign "${campaign.name}" ${campaign.schedule === 'now' ? 'sent' : 'scheduled'} to ${recipientCount} clients`,
          ...prev
        ]);

        // If campaign should be sent immediately, send it
        if (campaign.schedule === 'now' && response.data.campaign.id) {
          await campaignApi.send(response.data.campaign.id);
        }

        // Refresh campaigns list
        await fetchCampaigns();
      } else {
        throw new Error(response.error?.message || 'Failed to create campaign');
      }
    } catch (err) {
      console.error('Error launching campaign:', err);
      setNotifications(prev => [`Failed to launch campaign. Please try again.`, ...prev]);
      // Still add to local state for demo purposes
      const newCampaign: Campaign = {
        id: `temp-${Date.now()}`,
        ...campaign,
        status: campaign.schedule === 'now' ? 'active' : 'scheduled'
      };
      setCampaigns(prev => [newCampaign, ...prev]);
    }
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

  // Hide navigation on landing page
  const isLandingPage = location.pathname === '/';

  return (
    <div className="app-wrapper">
      {/* Navigation Header */}
      {!isLandingPage && (
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
            {/* Demo Journeys Button */}
            <div style={{ position: 'relative', marginRight: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setJourneysMenuOpen(!journeysMenuOpen);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span>Demo Journeys</span>
              </button>
              
              {/* Journeys Dropdown */}
              {journeysMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '360px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 10001,
                  overflow: 'hidden'
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Demo Journeys</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                      Experience different personas in the real estate ecosystem
                    </p>
                  </div>
                  
                  <div style={{ padding: '0.5rem 0' }}>
                    <Link 
                      to="/dashboard/title-agent"
                      onClick={() => setJourneysMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>Title Agent</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          Smart document processing, transaction tracking & client engagement
                        </div>
                      </div>
                    </Link>
                    
                    <Link 
                      to="/dashboard/realtor/communications"
                      onClick={() => setJourneysMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>Realtor - Communications</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          Unified inbox, messaging, client conversations & quick replies
                        </div>
                      </div>
                    </Link>
                    
                    <Link 
                      to="/dashboard/realtor/analytics"
                      onClick={() => setJourneysMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>Realtor - Analytics</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          Business intelligence, predictive analytics & performance tracking
                        </div>
                      </div>
                    </Link>
                    
                    <Link 
                      to="/dashboard/marketing"
                      onClick={() => setJourneysMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>Marketing Center</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          Forever marketing campaigns, automation & audience segmentation
                        </div>
                      </div>
                    </Link>
                    
                    <Link 
                      to="/dashboard/homeowner"
                      onClick={() => setJourneysMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.75rem 1rem',
                        textDecoration: 'none',
                        color: '#374151',
                        fontSize: '0.875rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                          <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600' }}>Homeowner Portal</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem' }}>
                          Property insights, document vault, neighborhood data & support team
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            
            <GlobalSearch />
            <button 
              className="nav-action-btn" 
              onClick={(e) => {
                e.stopPropagation();
                setNotificationsOpen(!notificationsOpen);
              }}
              style={{ position: 'relative' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              
              {/* Notifications Dropdown */}
              {notificationsOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '320px',
                  maxHeight: '400px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 10001,
                  overflow: 'hidden'
                }} onClick={(e) => e.stopPropagation()}>
                  <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Notifications</h3>
                    {notifications.length > 0 && (
                      <button 
                        onClick={() => setNotifications([])}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{
                        padding: '2rem',
                        textAlign: 'center',
                        color: '#6b7280'
                      }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto 1rem' }}>
                          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <p style={{ margin: 0, fontSize: '0.875rem' }}>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification, index) => (
                        <div 
                          key={index}
                          style={{
                            padding: '1rem',
                            borderBottom: index < notifications.length - 1 ? '1px solid #f3f4f6' : 'none',
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem'
                          }}>
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: '#3b82f6',
                              marginTop: '0.5rem',
                              flexShrink: 0
                            }} />
                            <div style={{ flex: 1 }}>
                              <p style={{
                                margin: 0,
                                fontSize: '0.875rem',
                                color: '#111827',
                                lineHeight: '1.5'
                              }}>
                                {notification}
                              </p>
                              <p style={{
                                margin: '0.25rem 0 0 0',
                                fontSize: '0.75rem',
                                color: '#6b7280'
                              }}>
                                Just now
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </button>
            <button 
              className="nav-action-btn avatar"
              onClick={(e) => {
                e.stopPropagation();
                setProfileMenuOpen(!profileMenuOpen);
              }}
              style={{ position: 'relative' }}
            >
              <span>AG</span>
              
              {/* Profile Dropdown */}
              {profileMenuOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: '240px',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  border: '1px solid #e5e7eb',
                  zIndex: 10001,
                  overflow: 'hidden'
                }} onClick={(e) => e.stopPropagation()}>
                  {/* Profile Header */}
                  <div style={{
                    padding: '1rem',
                    borderBottom: '1px solid #e5e7eb',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: '600',
                      marginBottom: '0.5rem',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}>
                      AG
                    </div>
                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>Agent User</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>agent@roisystems.com</div>
                  </div>
                  
                  {/* Menu Items */}
                  <div style={{ padding: '0.5rem 0' }}>
                    <button style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/profile');
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      My Profile
                    </button>
                    
                    <button style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/settings');
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m-6-6h6m6 0h6"></path>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                      Settings
                    </button>
                    
                    <button style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#374151',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/help');
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4m0-4h.01"></path>
                      </svg>
                      Help & Support
                    </button>
                    
                    <div style={{ height: '1px', background: '#e5e7eb', margin: '0.5rem 0' }} />
                    
                    <button style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '0.875rem',
                      color: '#ef4444',
                      fontWeight: '500',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    onClick={() => {
                      setProfileMenuOpen(false);
                      // Clear any stored auth tokens
                      localStorage.removeItem('authToken');
                      localStorage.removeItem('refreshToken');
                      sessionStorage.clear();
                      // Navigate to landing page
                      navigate('/');
                      // Show notification
                      setNotifications(prev => ['Successfully signed out', ...prev]);
                    }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
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
      )}

      {/* Mobile Menu */}
      {!isLandingPage && (
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
      )}

      {/* Main Content with Routes */}
      <main>
        <Routes>
          <Route
            path="/"
            element={<LandingPage />}
          />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                documents={documents}
                documentsLoading={documentsLoading}
                documentsError={documentsError}
                clients={clients}
                clientsLoading={clientsLoading}
                clientsError={clientsError}
                campaigns={campaigns}
                campaignsLoading={campaignsLoading}
                campaignsError={campaignsError}
                stats={stats}
                onDocumentUpload={handleDocumentUpload}
                onClientSave={handleClientSave}
                onCampaignLaunch={handleCampaignLaunch}
                refreshData={() => {
                  fetchDocuments();
                  fetchClients();
                  fetchCampaigns();
                }}
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
          <Route
            path="/dashboard/realtor"
            element={
              <RealtorDashboard />
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/dashboard/realtor/communications" element={<CommunicationCenter />} />
          <Route path="/dashboard/realtor/analytics" element={<AnalyticsDashboard />} />
          <Route path="/dashboard/homeowner" element={<HomeownerPortal />} />
          <Route path="/dashboard/marketing" element={<MarketingCenter />} />
          <Route path="/profile" element={<MyProfile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<HelpSupport />} />
          {/* 404 Catch-all Route - Must be last */}
          <Route path="*" element={<NotFound />} />
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
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
