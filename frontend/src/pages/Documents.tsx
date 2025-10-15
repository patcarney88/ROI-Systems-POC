import { useState } from 'react';
import { FileText, Search, Upload, Download, Eye, Calendar, User, TrendingUp, File } from 'lucide-react';

// Sample documents data
const sampleDocuments = [
  {
    id: 1,
    title: 'Purchase Agreement - 123 Main St',
    type: 'Purchase Agreement',
    client: 'Sarah Johnson',
    status: 'active',
    uploadDate: '2024-10-10',
    size: '2.4 MB',
    expiryDate: '2025-12-31'
  },
  {
    id: 2,
    title: 'Title Deed - 456 Oak Ave',
    type: 'Title Deed',
    client: 'Michael Chen',
    status: 'active',
    uploadDate: '2024-10-08',
    size: '1.8 MB',
    expiryDate: '2026-01-15'
  },
  {
    id: 3,
    title: 'Home Inspection Report',
    type: 'Inspection Report',
    client: 'Emily Rodriguez',
    status: 'expiring',
    uploadDate: '2024-09-15',
    size: '5.2 MB',
    expiryDate: '2024-11-15'
  },
  {
    id: 4,
    title: 'Mortgage Document - 789 Pine Rd',
    type: 'Mortgage Document',
    client: 'David Thompson',
    status: 'active',
    uploadDate: '2024-10-05',
    size: '3.1 MB',
    expiryDate: '2025-10-05'
  },
  {
    id: 5,
    title: 'Property Disclosure',
    type: 'Disclosure',
    client: 'Lisa Anderson',
    status: 'pending',
    uploadDate: '2024-10-12',
    size: '890 KB',
    expiryDate: '2025-04-12'
  },
  {
    id: 6,
    title: 'Appraisal Report - 321 Elm St',
    type: 'Appraisal',
    client: 'James Wilson',
    status: 'active',
    uploadDate: '2024-10-01',
    size: '4.5 MB',
    expiryDate: '2025-10-01'
  }
];

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredDocuments = sampleDocuments.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    const matchesType = filterType === 'all' || doc.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', text: '#065f46' };
      case 'pending': return { bg: '#dbeafe', text: '#1e40af' };
      case 'expiring': return { bg: '#fef3c7', text: '#92400e' };
      case 'expired': return { bg: '#fee2e2', text: '#991b1b' };
      default: return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <FileText size={32} style={{ marginRight: '12px' }} />
            Documents
          </h1>
          <p className="page-subtitle">Manage and analyze your real estate documents</p>
        </div>
        <button className="btn btn-primary">
          <Upload size={20} />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Documents</div>
            <div className="stat-value">{sampleDocuments.length}</div>
            <div className="stat-change positive">+4 this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{sampleDocuments.filter(d => d.status === 'active').length}</div>
            <div className="stat-change positive">All current</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Calendar size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Expiring Soon</div>
            <div className="stat-value">{sampleDocuments.filter(d => d.status === 'expiring').length}</div>
            <div className="stat-change negative">Needs attention</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <File size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Size</div>
            <div className="stat-value">17.8 MB</div>
            <div className="stat-change positive">Well organized</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring</option>
          <option value="expired">Expired</option>
        </select>

        <select className="filter-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Purchase Agreement">Purchase Agreement</option>
          <option value="Title Deed">Title Deed</option>
          <option value="Inspection Report">Inspection Report</option>
          <option value="Mortgage Document">Mortgage Document</option>
        </select>
      </div>

      {/* Documents Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredDocuments.map(doc => {
          const statusColors = getStatusColor(doc.status);
          return (
            <div key={doc.id} style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              {/* Document Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  marginRight: '1rem',
                  flexShrink: 0
                }}>
                  <FileText size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.5rem', lineHeight: '1.4' }}>
                    {doc.title}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '500',
                    background: statusColors.bg,
                    color: statusColors.text
                  }}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </div>
                </div>
              </div>

              {/* Document Type */}
              <div style={{
                padding: '0.5rem 0.75rem',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '1rem'
              }}>
                {doc.type}
              </div>

              {/* Document Info */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  <User size={16} style={{ marginRight: '0.5rem' }} />
                  {doc.client}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                  <Calendar size={16} style={{ marginRight: '0.5rem' }} />
                  Uploaded: {doc.uploadDate}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                  <File size={16} style={{ marginRight: '0.5rem' }} />
                  Size: {doc.size}
                </div>
              </div>

              {/* Expiry Date */}
              <div style={{
                padding: '0.75rem',
                background: doc.status === 'expiring' ? '#fef3c7' : '#f9fafb',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Expires</div>
                <div style={{ fontSize: '0.875rem', fontWeight: '600', color: doc.status === 'expiring' ? '#92400e' : '#111827' }}>
                  {doc.expiryDate}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button style={{
                  flex: 1,
                  padding: '0.5rem 1rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}>
                  <Eye size={16} />
                  View
                </button>
                <button style={{
                  padding: '0.5rem 1rem',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Download size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
