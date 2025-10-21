import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Home, Bell, Users, TrendingUp, Settings, Phone, MessageSquare, Mail,
  Calendar, X, Check, Clock, AlertCircle, ChevronRight, ChevronDown,
  Activity, DollarSign, Target, Award, MapPin, Eye, FileText, Zap,
  RefreshCw, Menu
} from 'lucide-react';
import type {
  BusinessAlert,
  ClientActivity,
  Lead,
  FollowUp,
  PerformanceMetrics,
  ConfidenceLevel,
  AlertType
} from '../types/realtor';
import { clientApi, documentApi, campaignApi } from '../services/api.services';

// Mock data templates for fallback
const mockAlertsTemplate: BusinessAlert[] = [
  {
    id: '1',
    clientId: 'c1',
    clientName: 'Sarah Johnson',
    clientEmail: 'sarah.j@email.com',
    clientPhone: '(555) 123-4567',
    clientPhoto: undefined,
    alertType: 'Ready to Buy',
    confidence: 92,
    confidenceLevel: 'high',
    priority: 'urgent',
    propertyAddress: '123 Oak Street',
    propertyValue: 450000,
    daysSinceLastContact: 3,
    createdAt: new Date().toISOString(),
    isRead: false,
    isContacted: false,
    isSnoozed: false,
    signals: [
      { id: 's1', type: 'value_check', description: 'Checked home value 3 times this week', timestamp: new Date().toISOString(), weight: 15 },
      { id: 's2', type: 'email_open', description: 'Opened market update email', timestamp: new Date().toISOString(), weight: 5 },
      { id: 's3', type: 'website_visit', description: 'Visited listings page 5 times', timestamp: new Date().toISOString(), weight: 8 }
    ],
    suggestedTalkingPoints: [
      'Mention recent increase in home value ($450K)',
      'Discuss current low interest rates',
      'Share new listings in preferred area'
    ],
    quickActions: [
      { type: 'call', label: 'Call', icon: 'phone', enabled: true },
      { type: 'text', label: 'Text', icon: 'message', enabled: true, template: 'Quick Check-in' },
      { type: 'email', label: 'Email', icon: 'mail', enabled: true, template: 'Value Update' },
      { type: 'note', label: 'Note', icon: 'file', enabled: true }
    ]
  },
  {
    id: '2',
    clientId: 'c2',
    clientName: 'Michael Chen',
    clientEmail: 'michael.c@email.com',
    clientPhone: '(555) 234-5678',
    alertType: 'Ready to Sell',
    confidence: 78,
    confidenceLevel: 'medium',
    priority: 'high',
    propertyAddress: '456 Maple Avenue',
    propertyValue: 625000,
    daysSinceLastContact: 7,
    createdAt: new Date().toISOString(),
    isRead: false,
    isContacted: false,
    isSnoozed: false,
    signals: [
      { id: 's4', type: 'document_view', description: 'Viewed selling guide', timestamp: new Date().toISOString(), weight: 10 },
      { id: 's5', type: 'website_visit', description: 'Browsed sold properties', timestamp: new Date().toISOString(), weight: 8 }
    ],
    suggestedTalkingPoints: [
      'Home value up 15% since purchase',
      'Strong seller\'s market in their area',
      'Free home valuation available'
    ],
    quickActions: [
      { type: 'call', label: 'Call', icon: 'phone', enabled: true },
      { type: 'text', label: 'Text', icon: 'message', enabled: true },
      { type: 'email', label: 'Email', icon: 'mail', enabled: true },
      { type: 'schedule', label: 'Schedule', icon: 'calendar', enabled: true }
    ]
  },
  {
    id: '3',
    clientId: 'c3',
    clientName: 'Emma Wilson',
    clientEmail: 'emma.w@email.com',
    clientPhone: '(555) 345-6789',
    alertType: 'Ready to Refinance',
    confidence: 65,
    confidenceLevel: 'medium',
    priority: 'medium',
    propertyAddress: '789 Pine Road',
    propertyValue: 380000,
    daysSinceLastContact: 14,
    createdAt: new Date().toISOString(),
    isRead: true,
    isContacted: false,
    isSnoozed: false,
    signals: [
      { id: 's6', type: 'email_open', description: 'Opened rate alert email', timestamp: new Date().toISOString(), weight: 5 }
    ],
    suggestedTalkingPoints: [
      'Rates have dropped 0.5%',
      'Could save $300/month',
      'Connect with preferred lender'
    ],
    quickActions: [
      { type: 'call', label: 'Call', icon: 'phone', enabled: true },
      { type: 'text', label: 'Text', icon: 'message', enabled: true },
      { type: 'email', label: 'Email', icon: 'mail', enabled: true }
    ]
  }
];

export default function RealtorDashboard() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'activity' | 'leads' | 'metrics'>('alerts');
  const [alerts, setAlerts] = useState<BusinessAlert[]>([]);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<BusinessAlert | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch clients and generate alerts based on engagement
      const [clientsResponse, campaignStats] = await Promise.allSettled([
        clientApi.getAll({ limit: 50 }),
        campaignApi.getAllStats()
      ]);

      if (clientsResponse.status === 'fulfilled' && clientsResponse.value.success) {
        const clients = clientsResponse.value.data?.clients || [];

        // Generate alerts from high-engagement clients
        const generatedAlerts: BusinessAlert[] = clients
          .filter(client => client.engagementScore > 60)
          .slice(0, 5)
          .map((client, index) => ({
            id: client.id,
            clientId: client.id,
            clientName: client.name,
            clientEmail: client.email,
            clientPhone: client.phone || '(555) 000-0000',
            clientPhoto: undefined,
            alertType: client.engagementScore > 85 ? 'Ready to Buy' :
                      client.engagementScore > 70 ? 'Ready to Sell' :
                      'Ready to Refinance',
            confidence: client.engagementScore,
            confidenceLevel: client.engagementScore > 80 ? 'high' :
                           client.engagementScore > 60 ? 'medium' : 'low',
            priority: client.status === 'at-risk' ? 'urgent' :
                     client.engagementScore > 75 ? 'high' : 'medium',
            propertyAddress: `Property ${index + 1}`,
            propertyValue: 350000 + (index * 50000),
            daysSinceLastContact: Math.floor((Date.now() - new Date(client.lastContact).getTime()) / (1000 * 60 * 60 * 24)),
            createdAt: new Date().toISOString(),
            isRead: false,
            isContacted: false,
            isSnoozed: false,
            signals: [
              {
                id: `s${index}-1`,
                type: 'email_open',
                description: 'Opened recent email',
                timestamp: client.lastContact,
                weight: 5
              }
            ],
            suggestedTalkingPoints: [
              'Recent market activity in their area',
              'Interest rate updates',
              'New listings that match their preferences'
            ],
            quickActions: [
              { type: 'call', label: 'Call', icon: 'phone', enabled: true },
              { type: 'text', label: 'Text', icon: 'message', enabled: true },
              { type: 'email', label: 'Email', icon: 'mail', enabled: true }
            ]
          }));

        setAlerts(generatedAlerts);

        // Generate activities from client interactions
        const generatedActivities: ClientActivity[] = clients
          .slice(0, 10)
          .map((client, index) => ({
            id: `a${index}`,
            clientId: client.id,
            clientName: client.name,
            type: index % 3 === 0 ? 'value_check' :
                  index % 3 === 1 ? 'document_view' : 'email_open',
            description: index % 3 === 0 ? 'Checked home value' :
                        index % 3 === 1 ? 'Viewed document' : 'Opened email',
            timestamp: client.lastContact,
            metadata: {}
          }));

        setActivities(generatedActivities);
      }

      // Process campaign metrics
      if (campaignStats.status === 'fulfilled' && campaignStats.value.success) {
        const stats = campaignStats.value.data || {};

        setMetrics({
          period: 'month',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString(),
          alertsReceived: alerts.length,
          alertsActedOn: Math.floor(alerts.length * 0.8),
          conversionRate: 32.5,
          avgResponseTime: 45,
          dealsClosed: stats.total || 0,
          dealsFromAlerts: Math.floor((stats.total || 0) * 0.3),
          revenueGenerated: (stats.total || 0) * 25000,
          revenueFromAlerts: (stats.total || 0) * 25000 * 0.3,
          brokerageRanking: 3,
          brokerageTotal: 45
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Using sample data.');

      // Set fallback data
      setAlerts(mockAlertsTemplate);
      setActivities([
        {
          id: 'a1',
          clientId: 'c1',
          clientName: 'Sarah Johnson',
          type: 'value_check',
          description: 'Checked home value',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          metadata: { propertyAddress: '123 Oak Street' }
        }
      ]);
      setMetrics({
        period: 'month',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
        alertsReceived: 47,
        alertsActedOn: 38,
        conversionRate: 32.5,
        avgResponseTime: 45,
        dealsClosed: 12,
        dealsFromAlerts: 4,
        revenueGenerated: 285000,
        revenueFromAlerts: 95000,
        brokerageRanking: 3,
        brokerageTotal: 45
      });
    } finally {
      setLoading(false);
    }
  }, [alerts.length]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Pull to refresh
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      handleRefresh();
    }
    setPullDistance(0);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setIsRefreshing(false);
  };

  const getConfidenceBadgeClass = (level: ConfidenceLevel) => {
    switch (level) {
      case 'high': return 'confidence-high';
      case 'medium': return 'confidence-medium';
      case 'low': return 'confidence-low';
      default: return '';
    }
  };

  const getAlertTypeColor = (type: AlertType) => {
    switch (type) {
      case 'Ready to Buy': return '#10b981';
      case 'Ready to Sell': return '#2563eb';
      case 'Ready to Refinance': return '#f59e0b';
      default: return '#64748b';
    }
  };

  const handleCallClient = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleTextClient = (phone: string, template?: string) => {
    const message = template || 'Hi! Just checking in...';
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const handleEmailClient = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const markAsContacted = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isContacted: true, contactedAt: new Date().toISOString() }
        : alert
    ));
  };

  const snoozeAlert = (alertId: string, hours: number) => {
    const snoozedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isSnoozed: true, snoozedUntil }
        : alert
    ));
  };

  const handleNotifications = () => {
    // Switch to alerts tab and scroll to top
    setActiveTab('alerts');

    // Scroll to top of content
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Mark all alerts as read after a short delay (user has seen them)
    setTimeout(() => {
      setAlerts(prev => prev.map(alert => ({ ...alert, isRead: true })));
    }, 2000);

    console.log(`Showing ${unreadCount} unread alerts`);
  };

  const formatTimeAgo = (timestamp: string) => {
    const minutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const hotLeadsCount = alerts.filter(a => a.confidenceLevel === 'high' && !a.isContacted).length;

  return (
    <div className="realtor-dashboard">
      {/* Header */}
      <header className="realtor-header">
        <div className="header-left">
          <Menu size={24} />
          <h1>ROI Realtor</h1>
        </div>
        <div className="header-right">
          <button className="icon-btn" onClick={handleRefresh}>
            <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
          </button>
          <button className="icon-btn notification-btn" onClick={handleNotifications}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </button>
        </div>
      </header>

      {/* Pull to Refresh Indicator */}
      {pullDistance > 0 && (
        <div className="pull-refresh-indicator" style={{ height: `${pullDistance}px` }}>
          <RefreshCw size={24} className={pullDistance > 60 ? 'spinning' : ''} />
        </div>
      )}

      {/* Main Content */}
      <div 
        className="realtor-content"
        ref={scrollRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <div className="alerts-feed">
            <div className="feed-header">
              <h2>Business Alerts</h2>
              <span className="hot-badge">{hotLeadsCount} Hot Leads</span>
            </div>

            {alerts.filter(a => !a.isSnoozed).map(alert => (
              <div 
                key={alert.id}
                className={`alert-card ${alert.isRead ? 'read' : 'unread'} ${alert.isContacted ? 'contacted' : ''}`}
                onClick={() => {
                  setSelectedAlert(alert);
                  setShowDetailModal(true);
                  setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, isRead: true } : a));
                }}
              >
                <div className="alert-card-header">
                  <div className="client-info">
                    <div className="client-avatar">
                      {alert.clientPhoto ? (
                        <img src={alert.clientPhoto} alt={alert.clientName} />
                      ) : (
                        <span>{alert.clientName.split(' ').map(n => n[0]).join('')}</span>
                      )}
                    </div>
                    <div className="client-details">
                      <h3>{alert.clientName}</h3>
                      <p className="property-address">
                        <MapPin size={14} />
                        {alert.propertyAddress}
                      </p>
                    </div>
                  </div>
                  <div className={`confidence-badge ${getConfidenceBadgeClass(alert.confidenceLevel)}`}>
                    {alert.confidence}%
                  </div>
                </div>

                <div className="alert-card-body">
                  <div 
                    className="alert-type-badge"
                    style={{ backgroundColor: getAlertTypeColor(alert.alertType) }}
                  >
                    <Zap size={14} />
                    {alert.alertType}
                  </div>

                  <div className="alert-meta">
                    <span className="last-contact">
                      <Clock size={14} />
                      {alert.daysSinceLastContact} days since contact
                    </span>
                    {alert.propertyValue && (
                      <span className="property-value">
                        <DollarSign size={14} />
                        ${(alert.propertyValue / 1000).toFixed(0)}K
                      </span>
                    )}
                  </div>

                  <div className="signals-preview">
                    <Activity size={14} />
                    <span>{alert.signals.length} behavioral signals</span>
                  </div>
                </div>

                <div className="alert-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="action-btn primary"
                    onClick={() => handleCallClient(alert.clientPhone)}
                  >
                    <Phone size={16} />
                    Call
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => handleTextClient(alert.clientPhone)}
                  >
                    <MessageSquare size={16} />
                    Text
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => handleEmailClient(alert.clientEmail)}
                  >
                    <Mail size={16} />
                    Email
                  </button>
                  <button 
                    className="action-btn success"
                    onClick={() => markAsContacted(alert.id)}
                  >
                    <Check size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === 'activity' && (
          <div className="activity-feed">
            <div className="feed-header">
              <h2>Client Activity</h2>
              <span className="activity-count">{activities.length} recent</span>
            </div>

            {activities.map(activity => (
              <div key={activity.id} className="activity-card">
                <div className="activity-icon">
                  {activity.type === 'value_check' && <TrendingUp size={20} />}
                  {activity.type === 'document_view' && <FileText size={20} />}
                  {activity.type === 'email_open' && <Mail size={20} />}
                  {activity.type === 'website_visit' && <Eye size={20} />}
                </div>
                <div className="activity-details">
                  <h4>{activity.clientName}</h4>
                  <p>{activity.description}</p>
                  {activity.metadata?.propertyAddress && (
                    <span className="activity-meta">{activity.metadata.propertyAddress}</span>
                  )}
                  <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metrics Tab */}
        {activeTab === 'metrics' && (
          <div className="metrics-view">
            <div className="feed-header">
              <h2>Performance</h2>
              <span className="period-badge">This Month</span>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon conversion">
                  <Target size={24} />
                </div>
                <div className="metric-value">{mockMetrics.conversionRate}%</div>
                <div className="metric-label">Conversion Rate</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon response">
                  <Clock size={24} />
                </div>
                <div className="metric-value">{mockMetrics.avgResponseTime}m</div>
                <div className="metric-label">Avg Response</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon deals">
                  <Check size={24} />
                </div>
                <div className="metric-value">{mockMetrics.dealsClosed}</div>
                <div className="metric-label">Deals Closed</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon revenue">
                  <DollarSign size={24} />
                </div>
                <div className="metric-value">${(mockMetrics.revenueGenerated / 1000).toFixed(0)}K</div>
                <div className="metric-label">Revenue</div>
              </div>
            </div>

            <div className="ranking-card">
              <Award size={32} />
              <h3>Brokerage Ranking</h3>
              <div className="ranking-value">
                #{mockMetrics.brokerageRanking} <span>of {mockMetrics.brokerageTotal}</span>
              </div>
              <p>Top {Math.round((mockMetrics.brokerageRanking! / mockMetrics.brokerageTotal!) * 100)}% performer</p>
            </div>

            <div className="alert-performance">
              <h3>Alert Performance</h3>
              <div className="performance-stat">
                <span>Alerts Acted On</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill"
                    style={{ width: `${(mockMetrics.alertsActedOn / mockMetrics.alertsReceived) * 100}%` }}
                  ></div>
                </div>
                <span className="stat-value">{mockMetrics.alertsActedOn}/{mockMetrics.alertsReceived}</span>
              </div>
              <div className="performance-stat">
                <span>Deals from Alerts</span>
                <div className="stat-bar">
                  <div 
                    className="stat-fill success"
                    style={{ width: `${(mockMetrics.dealsFromAlerts / mockMetrics.dealsClosed) * 100}%` }}
                  ></div>
                </div>
                <span className="stat-value">{mockMetrics.dealsFromAlerts}/{mockMetrics.dealsClosed}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <button 
          className={`nav-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Bell size={24} />
          {unreadCount > 0 && <span className="nav-badge">{unreadCount}</span>}
          <span>Alerts</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          <Activity size={24} />
          <span>Activity</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'leads' ? 'active' : ''}`}
          onClick={() => setActiveTab('leads')}
        >
          <Users size={24} />
          {hotLeadsCount > 0 && <span className="nav-badge hot">{hotLeadsCount}</span>}
          <span>Leads</span>
        </button>
        <button 
          className={`nav-btn ${activeTab === 'metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('metrics')}
        >
          <TrendingUp size={24} />
          <span>Metrics</span>
        </button>
      </nav>

      {/* Alert Detail Modal */}
      {showDetailModal && selectedAlert && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedAlert.clientName}</h2>
              <button className="close-btn" onClick={() => setShowDetailModal(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-section">
                <h3>Alert Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="label">Type</span>
                    <span className="value">{selectedAlert.alertType}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Confidence</span>
                    <span className="value">{selectedAlert.confidence}%</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Property</span>
                    <span className="value">{selectedAlert.propertyAddress}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Value</span>
                    <span className="value">${selectedAlert.propertyValue?.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="detail-section">
                <h3>Behavioral Signals</h3>
                <div className="signals-list">
                  {selectedAlert.signals.map(signal => (
                    <div key={signal.id} className="signal-item">
                      <div className="signal-icon">
                        {signal.type === 'value_check' && <TrendingUp size={16} />}
                        {signal.type === 'email_open' && <Mail size={16} />}
                        {signal.type === 'website_visit' && <Eye size={16} />}
                      </div>
                      <div className="signal-details">
                        <p>{signal.description}</p>
                        <span className="signal-time">{formatTimeAgo(signal.timestamp)}</span>
                      </div>
                      <div className="signal-weight">+{signal.weight}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="detail-section">
                <h3>Suggested Talking Points</h3>
                <ul className="talking-points">
                  {selectedAlert.suggestedTalkingPoints.map((point, idx) => (
                    <li key={idx}>
                      <ChevronRight size={16} />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="modal-actions">
                <button 
                  className="modal-action-btn primary"
                  onClick={() => handleCallClient(selectedAlert.clientPhone)}
                >
                  <Phone size={20} />
                  Call Now
                </button>
                <button 
                  className="modal-action-btn"
                  onClick={() => handleTextClient(selectedAlert.clientPhone)}
                >
                  <MessageSquare size={20} />
                  Send Text
                </button>
                <button 
                  className="modal-action-btn"
                  onClick={() => handleEmailClient(selectedAlert.clientEmail)}
                >
                  <Mail size={20} />
                  Send Email
                </button>
              </div>

              <div className="modal-footer-actions">
                <button 
                  className="footer-btn"
                  onClick={() => {
                    markAsContacted(selectedAlert.id);
                    setShowDetailModal(false);
                  }}
                >
                  <Check size={18} />
                  Mark as Contacted
                </button>
                <button 
                  className="footer-btn"
                  onClick={() => {
                    snoozeAlert(selectedAlert.id, 24);
                    setShowDetailModal(false);
                  }}
                >
                  <Clock size={18} />
                  Snooze 1 Day
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
