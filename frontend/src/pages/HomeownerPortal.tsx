import { useState } from 'react';
import {
  Home, TrendingUp, DollarSign, FileText, MapPin, Users, Bell,
  Download, Share2, Eye, Search, Filter, Calendar, Phone, Mail,
  MessageSquare, Star, AlertCircle, CheckCircle, Clock, ChevronRight,
  Upload, X, ExternalLink, Wrench, Shield, Receipt, Leaf
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// Mock data
const propertyData = {
  address: '123 Oak Street',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
  propertyType: 'Single Family Home',
  bedrooms: 4,
  bathrooms: 3,
  sqft: 2450,
  lotSize: 5200,
  yearBuilt: 2015,
  purchaseDate: '2020-06-15',
  purchasePrice: 875000,
  currentValue: 1125000,
  valueChange: 250000,
  valueChangePercent: 28.6,
  equity: 625000,
  equityPercent: 55.6,
  mortgage: 500000,
  photos: ['/property-1.jpg', '/property-2.jpg', '/property-3.jpg']
};

const valueHistory = [
  { date: '2020-06', value: 875000 },
  { date: '2020-12', value: 895000 },
  { date: '2021-06', value: 925000 },
  { date: '2021-12', value: 975000 },
  { date: '2022-06', value: 1025000 },
  { date: '2022-12', value: 1075000 },
  { date: '2023-06', value: 1095000 },
  { date: '2023-12', value: 1105000 },
  { date: '2024-06', value: 1115000 },
  { date: '2024-09', value: 1125000 }
];

const documents = [
  {
    id: '1',
    name: 'Purchase Agreement',
    category: 'Closing Documents',
    date: '2020-06-15',
    size: '2.4 MB',
    type: 'PDF',
    shared: true
  },
  {
    id: '2',
    name: 'Title Insurance Policy',
    category: 'Closing Documents',
    date: '2020-06-15',
    size: '1.8 MB',
    type: 'PDF',
    shared: true
  },
  {
    id: '3',
    name: 'Property Tax Statement 2024',
    category: 'Tax Documents',
    date: '2024-01-15',
    size: '456 KB',
    type: 'PDF',
    shared: false
  },
  {
    id: '4',
    name: 'Homeowners Insurance Policy',
    category: 'Insurance',
    date: '2024-06-01',
    size: '1.2 MB',
    type: 'PDF',
    shared: true
  },
  {
    id: '5',
    name: 'Home Inspection Report',
    category: 'Inspection Reports',
    date: '2020-05-20',
    size: '3.1 MB',
    type: 'PDF',
    shared: false
  },
  {
    id: '6',
    name: 'HOA Bylaws',
    category: 'HOA Documents',
    date: '2020-06-15',
    size: '890 KB',
    type: 'PDF',
    shared: false
  }
];

const recentSales = [
  { address: '125 Oak Street', price: 1150000, beds: 4, baths: 3, sqft: 2500, date: '2024-09-15', distance: 0.1 },
  { address: '118 Maple Avenue', price: 1095000, beds: 3, baths: 2.5, sqft: 2300, date: '2024-08-22', distance: 0.2 },
  { address: '201 Pine Street', price: 1175000, beds: 4, baths: 3.5, sqft: 2600, date: '2024-07-10', distance: 0.3 }
];

const professionalTeam = [
  {
    id: '1',
    name: 'Sarah Mitchell',
    role: 'Real Estate Agent',
    company: 'Premier Realty',
    phone: '(555) 123-4567',
    email: 'sarah@premierrealty.com',
    photo: null,
    rating: 4.9
  },
  {
    id: '2',
    name: 'John Davis',
    role: 'Title Agent',
    company: 'Secure Title Co.',
    phone: '(555) 234-5678',
    email: 'john@securetitle.com',
    photo: null,
    rating: 4.8
  },
  {
    id: '3',
    name: 'Emily Chen',
    role: 'Loan Officer',
    company: 'First National Bank',
    phone: '(555) 345-6789',
    email: 'emily@firstnational.com',
    photo: null,
    rating: 4.9
  }
];

const notifications = [
  {
    id: '1',
    type: 'value_update',
    title: 'Property Value Increased',
    message: 'Your home value increased by $10,000 this month',
    date: '2024-10-01',
    priority: 'high',
    read: false
  },
  {
    id: '2',
    type: 'document',
    title: 'New Document Shared',
    message: 'Sarah Mitchell shared "Market Analysis Report"',
    date: '2024-09-28',
    priority: 'medium',
    read: false
  },
  {
    id: '3',
    type: 'maintenance',
    title: 'HVAC Maintenance Due',
    message: 'Annual HVAC service recommended',
    date: '2024-09-25',
    priority: 'medium',
    read: true
  },
  {
    id: '4',
    type: 'tax',
    title: 'Property Tax Due Soon',
    message: 'Property tax payment due November 1st',
    date: '2024-09-20',
    priority: 'high',
    read: true
  }
];

export default function HomeownerPortal() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1M' | '6M' | '1Y' | 'ALL'>('1Y');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  const categories = ['all', 'Closing Documents', 'Tax Documents', 'Insurance', 'Inspection Reports', 'HOA Documents', 'Warranties'];

  const filteredDocuments = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const handleDocumentView = (doc: any) => {
    setSelectedDocument(doc);
    setShowDocumentViewer(true);
  };

  const handleDocumentDownload = (doc: any) => {
    alert(`Downloading ${doc.name}...`);
  };

  const handleDocumentShare = (doc: any) => {
    alert(`Sharing ${doc.name}...`);
  };

  return (
    <div className="homeowner-portal">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="property-hero">
          <div className="property-image">
            <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800" alt="Property" />
            <button className="update-value-btn">
              <TrendingUp size={18} />
              Update Value
            </button>
          </div>

          <div className="property-overview">
            <div className="property-header">
              <div>
                <h1>{propertyData.address}</h1>
                <p className="property-location">
                  <MapPin size={16} />
                  {propertyData.city}, {propertyData.state} {propertyData.zip}
                </p>
              </div>
              <button className="share-btn">
                <Share2 size={18} />
                Share
              </button>
            </div>

            <div className="property-stats">
              <div className="stat">
                <span className="stat-label">Bedrooms</span>
                <span className="stat-value">{propertyData.bedrooms}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Bathrooms</span>
                <span className="stat-value">{propertyData.bathrooms}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Sq Ft</span>
                <span className="stat-value">{propertyData.sqft.toLocaleString()}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Year Built</span>
                <span className="stat-value">{propertyData.yearBuilt}</span>
              </div>
            </div>

            <div className="value-cards">
              <div className="value-card primary">
                <div className="value-label">Current Value</div>
                <div className="value-amount">${(propertyData.currentValue / 1000).toFixed(0)}K</div>
                <div className="value-change positive">
                  <TrendingUp size={16} />
                  <span>+${(propertyData.valueChange / 1000).toFixed(0)}K ({propertyData.valueChangePercent}%)</span>
                </div>
              </div>

              <div className="value-card">
                <div className="value-label">Home Equity</div>
                <div className="value-amount">${(propertyData.equity / 1000).toFixed(0)}K</div>
                <div className="value-meta">{propertyData.equityPercent}% of value</div>
              </div>

              <div className="value-card">
                <div className="value-label">Mortgage Balance</div>
                <div className="value-amount">${(propertyData.mortgage / 1000).toFixed(0)}K</div>
                <div className="value-meta">Remaining balance</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Value Tracker */}
      <div className="section">
        <div className="section-header">
          <div>
            <h2>Value & Equity Tracker</h2>
            <p>Track your home's value over time</p>
          </div>
          <div className="time-range-selector">
            {(['1M', '6M', '1Y', 'ALL'] as const).map(range => (
              <button
                key={range}
                className={`range-btn ${selectedTimeRange === range ? 'active' : ''}`}
                onClick={() => setSelectedTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={valueHistory}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#10b981" fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="milestones">
          <div className="milestone">
            <CheckCircle size={20} />
            <div>
              <div className="milestone-title">Reached $1M Value</div>
              <div className="milestone-date">June 2022</div>
            </div>
          </div>
          <div className="milestone">
            <CheckCircle size={20} />
            <div>
              <div className="milestone-title">50% Equity Milestone</div>
              <div className="milestone-date">March 2023</div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Vault */}
      <div className="section">
        <div className="section-header">
          <div>
            <h2>Document Vault</h2>
            <p>Secure storage for all your property documents</p>
          </div>
          <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
            <Upload size={18} />
            Upload Document
          </button>
        </div>

        <div className="document-controls">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-filter">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'all' ? 'All Documents' : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="documents-grid">
          {filteredDocuments.map(doc => (
            <div key={doc.id} className="document-card">
              <div className="document-icon">
                <FileText size={32} />
              </div>
              <div className="document-info">
                <h3>{doc.name}</h3>
                <div className="document-meta">
                  <span>{doc.category}</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
                {doc.shared && (
                  <div className="shared-badge">
                    <Users size={12} />
                    Shared
                  </div>
                )}
              </div>
              <div className="document-actions">
                <button onClick={() => handleDocumentView(doc)} title="View">
                  <Eye size={18} />
                </button>
                <button onClick={() => handleDocumentDownload(doc)} title="Download">
                  <Download size={18} />
                </button>
                <button onClick={() => handleDocumentShare(doc)} title="Share">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="vault-guarantee">
          <Shield size={20} />
          <span>10-Year Document Storage Guarantee • Bank-Level Encryption</span>
        </div>
      </div>

      {/* Neighborhood Insights */}
      <div className="section">
        <div className="section-header">
          <h2>Neighborhood Insights</h2>
          <p>Recent sales and market trends in your area</p>
        </div>

        <div className="neighborhood-grid">
          <div className="map-container">
            <div className="map-placeholder">
              <MapPin size={48} />
              <p>Interactive Map</p>
              <span>Recent sales within 0.5 miles</span>
            </div>
          </div>

          <div className="recent-sales">
            <h3>Recent Sales</h3>
            {recentSales.map((sale, index) => (
              <div key={index} className="sale-card">
                <div className="sale-info">
                  <h4>{sale.address}</h4>
                  <div className="sale-details">
                    {sale.beds} bed • {sale.baths} bath • {sale.sqft.toLocaleString()} sqft
                  </div>
                  <div className="sale-meta">
                    <span>{sale.date}</span>
                    <span>•</span>
                    <span>{sale.distance} mi away</span>
                  </div>
                </div>
                <div className="sale-price">${(sale.price / 1000).toFixed(0)}K</div>
              </div>
            ))}
          </div>
        </div>

        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="insight-label">Market Trend</div>
              <div className="insight-value">+4.2%</div>
              <div className="insight-meta">Last 6 months</div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Home size={24} />
            </div>
            <div>
              <div className="insight-label">Avg Days on Market</div>
              <div className="insight-value">18 days</div>
              <div className="insight-meta">In your area</div>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon">
              <Star size={24} />
            </div>
            <div>
              <div className="insight-label">School Rating</div>
              <div className="insight-value">9/10</div>
              <div className="insight-meta">GreatSchools.org</div>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Team */}
      <div className="section">
        <div className="section-header">
          <h2>Your Professional Team</h2>
          <p>Connect with your real estate professionals</p>
        </div>

        <div className="team-grid">
          {professionalTeam.map(member => (
            <div key={member.id} className="team-card">
              <div className="team-avatar">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="team-info">
                <h3>{member.name}</h3>
                <div className="team-role">{member.role}</div>
                <div className="team-company">{member.company}</div>
                <div className="team-rating">
                  <Star size={14} fill="#f59e0b" color="#f59e0b" />
                  <span>{member.rating}</span>
                </div>
              </div>
              <div className="team-actions">
                <button className="action-btn">
                  <Phone size={18} />
                  Call
                </button>
                <button className="action-btn">
                  <Mail size={18} />
                  Email
                </button>
                <button className="action-btn">
                  <MessageSquare size={18} />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Smart Notifications */}
      <div className="section">
        <div className="section-header">
          <div>
            <h2>Smart Notifications</h2>
            <p>Important updates and reminders</p>
          </div>
          {unreadNotifications > 0 && (
            <span className="notification-badge">{unreadNotifications} new</span>
          )}
        </div>

        <div className="notifications-list">
          {notifications.map(notification => (
            <div key={notification.id} className={`notification-card ${notification.read ? 'read' : 'unread'} priority-${notification.priority}`}>
              <div className="notification-icon">
                {notification.type === 'value_update' && <TrendingUp size={20} />}
                {notification.type === 'document' && <FileText size={20} />}
                {notification.type === 'maintenance' && <Wrench size={20} />}
                {notification.type === 'tax' && <Receipt size={20} />}
              </div>
              <div className="notification-content">
                <h4>{notification.title}</h4>
                <p>{notification.message}</p>
                <span className="notification-date">{notification.date}</span>
              </div>
              {!notification.read && <div className="unread-dot" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
