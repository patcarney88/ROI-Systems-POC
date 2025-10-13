import { useState } from 'react';
import ClientModal from '../modals/ClientModal';

export default function Clients({ clients, searchQuery, onSearchChange, onClientSave }: any) {
  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>();
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredClients = clients.filter((client: any) => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (client: any) => {
    setSelectedClient(client);
    setClientModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(undefined);
    setClientModalOpen(true);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">Manage your client relationships</p>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          <span>Add Client</span>
        </button>
      </div>

      <div className="filters-section">
        <div className="search-box">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input
            type="text"
            className="search-input"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Clients</option>
          <option value="active">Active</option>
          <option value="at-risk">At Risk</option>
          <option value="dormant">Dormant</option>
        </select>
      </div>

      <div className="clients-table">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Contact</th>
              <th>Properties</th>
              <th>Status</th>
              <th>Engagement</th>
              <th>Last Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client: any) => (
              <tr key={client.id}>
                <td>
                  <div className="client-cell">
                    <div className="client-avatar">{client.name.split(' ').map((n: string) => n[0]).join('')}</div>
                    <span className="client-name">{client.name}</span>
                  </div>
                </td>
                <td>
                  <div className="contact-info">
                    <div>{client.email}</div>
                    <div className="text-muted">{client.phone}</div>
                  </div>
                </td>
                <td>{client.properties}</td>
                <td>
                  <span className={`badge badge-${client.status === 'active' ? 'success' : client.status === 'at-risk' ? 'warning' : 'danger'}`}>
                    {client.status}
                  </span>
                </td>
                <td>
                  <div className="engagement-bar">
                    <div className="engagement-fill" style={{ width: `${client.engagementScore}%` }}></div>
                    <span className="engagement-text">{client.engagementScore}%</span>
                  </div>
                </td>
                <td>{client.lastContact}</td>
                <td>
                  <button className="btn-icon" onClick={() => handleEdit(client)}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClientModal
        isOpen={clientModalOpen}
        onClose={() => { setClientModalOpen(false); setSelectedClient(undefined); }}
        onSave={(clientData: any) => {
          onClientSave(clientData);
          setClientModalOpen(false);
          setSelectedClient(undefined);
        }}
        client={selectedClient}
      />
    </div>
  );
}
