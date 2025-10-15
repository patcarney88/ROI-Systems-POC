import { useState } from 'react';
import { Users, Search, Mail, Phone, Calendar, TrendingUp, Plus } from 'lucide-react';

// Sample client data
const sampleClients = [
  {
    id: 1,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '(555) 123-4567',
    status: 'active',
    properties: 2,
    lastContact: '2 days ago',
    engagementScore: 95,
    avatar: 'SJ'
  },
  {
    id: 2,
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '(555) 234-5678',
    status: 'active',
    properties: 1,
    lastContact: '1 week ago',
    engagementScore: 78,
    avatar: 'MC'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.r@email.com',
    phone: '(555) 345-6789',
    status: 'at-risk',
    properties: 3,
    lastContact: '3 weeks ago',
    engagementScore: 45,
    avatar: 'ER'
  },
  {
    id: 4,
    name: 'David Thompson',
    email: 'david.t@email.com',
    phone: '(555) 456-7890',
    status: 'active',
    properties: 1,
    lastContact: '5 days ago',
    engagementScore: 88,
    avatar: 'DT'
  },
  {
    id: 5,
    name: 'Lisa Anderson',
    email: 'lisa.anderson@email.com',
    phone: '(555) 567-8901',
    status: 'dormant',
    properties: 2,
    lastContact: '2 months ago',
    engagementScore: 22,
    avatar: 'LA'
  },
  {
    id: 6,
    name: 'James Wilson',
    email: 'james.w@email.com',
    phone: '(555) 678-9012',
    status: 'active',
    properties: 4,
    lastContact: '1 day ago',
    engagementScore: 92,
    avatar: 'JW'
  }
];

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredClients = sampleClients.filter((client) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'at-risk': return 'At Risk';
      case 'dormant': return 'Dormant';
      default: return status;
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <Users size={32} style={{ marginRight: '12px' }} />
            Clients
          </h1>
          <p className="page-subtitle">Manage your client relationships and track engagement</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={20} />
          <span>Add Client</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Clients</div>
            <div className="stat-value">{sampleClients.length}</div>
            <div className="stat-change positive">+12% this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Clients</div>
            <div className="stat-value">{sampleClients.filter(c => c.status === 'active').length}</div>
            <div className="stat-change positive">+8% this month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">At Risk</div>
            <div className="stat-value">{sampleClients.filter(c => c.status === 'at-risk').length}</div>
            <div className="stat-change negative">Needs attention</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}>
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Avg Engagement</div>
            <div className="stat-value">72%</div>
            <div className="stat-change positive">+5% this month</div>
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
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Clients</option>
          <option value="active">Active</option>
          <option value="at-risk">At Risk</option>
          <option value="dormant">Dormant</option>
        </select>
      </div>

      {/* Clients Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredClients.map((client) => (
          <div key={client.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Client Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '1.125rem',
                marginRight: '1rem'
              }}>
                {client.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
                  {client.name}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  background: client.status === 'active' ? '#d1fae5' : client.status === 'at-risk' ? '#fef3c7' : '#fee2e2',
                  color: client.status === 'active' ? '#065f46' : client.status === 'at-risk' ? '#92400e' : '#991b1b'
                }}>
                  {getStatusLabel(client.status)}
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>
                <Mail size={16} style={{ marginRight: '0.5rem' }} />
                {client.email}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '0.875rem' }}>
                <Phone size={16} style={{ marginRight: '0.5rem' }} />
                {client.phone}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Properties</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>{client.properties}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>Engagement</div>
                <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#111827' }}>{client.engagementScore}%</div>
              </div>
            </div>

            {/* Last Contact */}
            <div style={{ display: 'flex', alignItems: 'center', color: '#6b7280', fontSize: '0.875rem', marginBottom: '1rem' }}>
              <Calendar size={16} style={{ marginRight: '0.5rem' }} />
              Last contact: {client.lastContact}
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
                <Mail size={16} />
                Contact
              </button>
              <button style={{
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer'
              }}>
                View
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
