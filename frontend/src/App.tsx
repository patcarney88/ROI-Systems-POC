import { useEffect, useState } from 'react'
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
import GlobalSearch from './components/GlobalSearch'

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
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

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
                  console.log('Demo Journeys clicked, current state:', journeysMenuOpen);
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
                  width: '280px',
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
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '600' }}>Role Journeys</h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', opacity: 0.9 }}>
                      Navigate to different user experiences
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
                      <div>
                        <div style={{ fontWeight: '600' }}>Title Agent</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Document management</div>
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
                      <div>
                        <div style={{ fontWeight: '600' }}>Realtor - Communications</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Client messaging</div>
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
                      <div>
                        <div style={{ fontWeight: '600' }}>Realtor - Analytics</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Performance insights</div>
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
                      <div>
                        <div style={{ fontWeight: '600' }}>Marketing Center</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Campaign management</div>
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
                      <div>
                        <div style={{ fontWeight: '600' }}>Homeowner Portal</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Consumer experience</div>
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
                      // Handle logout
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
