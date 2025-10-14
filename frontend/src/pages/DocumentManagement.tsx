import { useState, useCallback, useRef } from 'react';
import {
  Upload, X, Check, AlertCircle, FileText, Filter, Download, Trash2,
  Tag, Link as LinkIcon, Eye, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Search, Calendar, User, Home, CheckSquare, Square, MoreVertical,
  Edit, Share2, Printer, RefreshCw
} from 'lucide-react';
import type {
  Document,
  UploadFile,
  DocumentFilter,
  DocumentType,
  UploadStatus,
  SortConfig,
  Transaction,
  Client,
  DOCUMENT_TYPES
} from '../types/documents';

// Mock data
const mockTransactions: Transaction[] = [
  { id: '1', name: 'TRX-2025-001', propertyAddress: '123 Oak Street', clientName: 'Sarah Johnson', status: 'active' },
  { id: '2', name: 'TRX-2025-002', propertyAddress: '456 Maple Avenue', clientName: 'Michael Chen', status: 'active' },
  { id: '3', name: 'TRX-2025-003', propertyAddress: '789 Pine Road', clientName: 'Emma Wilson', status: 'pending' }
];

const mockClients: Client[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah.j@email.com', properties: 3 },
  { id: '2', name: 'Michael Chen', email: 'michael.c@email.com', properties: 2 },
  { id: '3', name: 'Emma Wilson', email: 'emma.w@email.com', properties: 1 }
];

const mockDocuments: Document[] = [
  {
    id: '1',
    name: 'Purchase_Agreement_123_Oak.pdf',
    type: 'Deed',
    status: 'ready',
    fileSize: 2457600,
    uploadDate: '2025-01-10T10:30:00Z',
    lastModified: '2025-01-10T10:30:00Z',
    uploadedBy: 'Agent Name',
    transactionId: '1',
    transactionName: 'TRX-2025-001',
    clientName: 'Sarah Johnson',
    propertyAddress: '123 Oak Street',
    tags: ['urgent', 'reviewed'],
    isScanned: true,
    scanResult: 'clean',
    ocrProcessed: true,
    pageCount: 12
  },
  {
    id: '2',
    name: 'Title_Policy_456_Maple.pdf',
    type: 'Title Policy',
    status: 'ready',
    fileSize: 1843200,
    uploadDate: '2025-01-09T14:20:00Z',
    lastModified: '2025-01-09T14:20:00Z',
    uploadedBy: 'Agent Name',
    transactionId: '2',
    transactionName: 'TRX-2025-002',
    clientName: 'Michael Chen',
    propertyAddress: '456 Maple Avenue',
    tags: ['final'],
    isScanned: true,
    scanResult: 'clean',
    ocrProcessed: true,
    pageCount: 8
  }
];

const DOCUMENT_TYPES_LIST: DocumentType[] = [
  'Deed',
  'Mortgage/Deed of Trust',
  'Title Policy',
  'Closing Disclosure',
  'HUD-1 Settlement Statement',
  'Property Survey',
  'Home Inspection Report',
  'Insurance Policy',
  'Other'
];

export default function DocumentManagement() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<DocumentFilter>({ documentType: 'all', status: 'all' });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'uploadDate', order: 'desc' });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File upload handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const newUploads: UploadFile[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending' as UploadStatus,
      progress: 0
    }));

    setUploadQueue(prev => [...prev, ...newUploads]);

    // Simulate upload process
    newUploads.forEach(upload => {
      simulateUpload(upload);
    });
  };

  const simulateUpload = (upload: UploadFile) => {
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setUploadQueue(prev => prev.map(u => 
        u.id === upload.id ? { ...u, progress, status: 'uploading' as UploadStatus } : u
      ));

      if (progress >= 100) {
        clearInterval(interval);
        // Simulate processing
        setTimeout(() => {
          setUploadQueue(prev => prev.map(u => 
            u.id === upload.id ? { ...u, status: 'processing' as UploadStatus } : u
          ));

          // Complete upload
          setTimeout(() => {
            const newDoc: Document = {
              id: Math.random().toString(36).substr(2, 9),
              name: upload.file.name,
              type: upload.documentType || 'Other',
              status: 'ready',
              fileSize: upload.file.size,
              uploadDate: new Date().toISOString(),
              lastModified: new Date().toISOString(),
              uploadedBy: 'Agent Name',
              tags: upload.tags || [],
              isScanned: true,
              scanResult: 'clean',
              ocrProcessed: true,
              transactionId: upload.transactionId,
              clientId: upload.clientId
            };

            setDocuments(prev => [newDoc, ...prev]);
            setUploadQueue(prev => prev.filter(u => u.id !== upload.id));
          }, 1500);
        }, 1000);
      }
    }, 200);
  };

  const cancelUpload = (uploadId: string) => {
    setUploadQueue(prev => prev.filter(u => u.id !== uploadId));
  };

  // Selection handlers
  const toggleSelection = (docId: string) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedDocuments(new Set(filteredDocuments.map(d => d.id)));
  };

  const deselectAll = () => {
    setSelectedDocuments(new Set());
  };

  // Filter and sort
  const filteredDocuments = documents.filter(doc => {
    if (filter.searchQuery && !doc.name.toLowerCase().includes(filter.searchQuery.toLowerCase())) {
      return false;
    }
    if (filter.documentType && filter.documentType !== 'all' && doc.type !== filter.documentType) {
      return false;
    }
    if (filter.status && filter.status !== 'all' && doc.status !== filter.status) {
      return false;
    }
    if (filter.clientId && doc.clientId !== filter.clientId) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    const order = sortConfig.order === 'asc' ? 1 : -1;
    if (sortConfig.field === 'name') {
      return order * a.name.localeCompare(b.name);
    }
    if (sortConfig.field === 'uploadDate') {
      return order * (new Date(a.uploadDate).getTime() - new Date(b.uploadDate).getTime());
    }
    return 0;
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="document-management">
      {/* Header */}
      <div className="dm-header">
        <div>
          <h1>Document Management</h1>
          <p>Upload, organize, and manage transaction documents</p>
        </div>
        <div className="dm-header-actions">
          <button className="btn-secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={18} />
            Filters
          </button>
          <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            Upload Documents
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div 
        className={`upload-zone-large ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={48} />
        <h3>Drag & drop files here</h3>
        <p>or click to browse • PDF, DOC, DOCX, JPG, PNG • Max 25MB per file</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />
      </div>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <div className="upload-queue">
          <h3>Uploading {uploadQueue.length} file{uploadQueue.length > 1 ? 's' : ''}</h3>
          {uploadQueue.map(upload => (
            <div key={upload.id} className="upload-item">
              <FileText size={20} />
              <div className="upload-info">
                <div className="upload-name">{upload.file.name}</div>
                <div className="upload-progress-bar">
                  <div 
                    className="upload-progress-fill"
                    style={{ width: `${upload.progress}%` }}
                  ></div>
                </div>
                <div className="upload-status">
                  {upload.status === 'uploading' && `${upload.progress}%`}
                  {upload.status === 'processing' && 'Processing...'}
                  {upload.status === 'complete' && 'Complete'}
                </div>
              </div>
              <button 
                className="upload-cancel"
                onClick={() => cancelUpload(upload.id)}
                title="Cancel upload"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Search</label>
            <div className="search-input">
              <Search size={18} />
              <input
                type="text"
                placeholder="Search documents..."
                value={filter.searchQuery || ''}
                onChange={(e) => setFilter({ ...filter, searchQuery: e.target.value })}
              />
            </div>
          </div>

          <div className="filter-group">
            <label>Document Type</label>
            <select
              value={filter.documentType || 'all'}
              onChange={(e) => setFilter({ ...filter, documentType: e.target.value as any })}
            >
              <option value="all">All Types</option>
              {DOCUMENT_TYPES_LIST.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Client</label>
            <select
              value={filter.clientId || ''}
              onChange={(e) => setFilter({ ...filter, clientId: e.target.value })}
            >
              <option value="">All Clients</option>
              {mockClients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Date Range</label>
            <div className="date-range">
              <input
                type="date"
                value={filter.dateFrom || ''}
                onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              />
              <span>to</span>
              <input
                type="date"
                value={filter.dateTo || ''}
                onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              />
            </div>
          </div>

          <button 
            className="btn-secondary-sm"
            onClick={() => setFilter({ documentType: 'all', status: 'all' })}
          >
            Clear Filters
          </button>
        </div>
      )}

      {/* Bulk Actions Toolbar */}
      {selectedDocuments.size > 0 && (
        <div className="bulk-actions-toolbar">
          <div className="bulk-selection">
            <CheckSquare size={18} />
            <span>{selectedDocuments.size} selected</span>
            <button className="btn-link" onClick={deselectAll}>Clear</button>
          </div>
          <div className="bulk-actions">
            <button className="btn-secondary-sm">
              <Download size={16} />
              Download
            </button>
            <button className="btn-secondary-sm">
              <Tag size={16} />
              Add Tags
            </button>
            <button className="btn-secondary-sm">
              <Edit size={16} />
              Categorize
            </button>
            <button className="btn-danger-sm">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Documents Table */}
      <div className="documents-table-container">
        <table className="documents-table">
          <thead>
            <tr>
              <th className="checkbox-cell">
                {selectedDocuments.size === filteredDocuments.length ? (
                  <CheckSquare size={18} onClick={deselectAll} style={{ cursor: 'pointer' }} />
                ) : (
                  <Square size={18} onClick={selectAll} style={{ cursor: 'pointer' }} />
                )}
              </th>
              <th onClick={() => setSortConfig({ field: 'name', order: sortConfig.order === 'asc' ? 'desc' : 'asc' })}>
                Document Name
              </th>
              <th>Type</th>
              <th>Transaction/Client</th>
              <th onClick={() => setSortConfig({ field: 'uploadDate', order: sortConfig.order === 'asc' ? 'desc' : 'asc' })}>
                Upload Date
              </th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDocuments.map(doc => (
              <tr key={doc.id} className={selectedDocuments.has(doc.id) ? 'selected' : ''}>
                <td className="checkbox-cell">
                  {selectedDocuments.has(doc.id) ? (
                    <CheckSquare size={18} onClick={() => toggleSelection(doc.id)} style={{ cursor: 'pointer' }} />
                  ) : (
                    <Square size={18} onClick={() => toggleSelection(doc.id)} style={{ cursor: 'pointer' }} />
                  )}
                </td>
                <td>
                  <div className="doc-name-cell">
                    <FileText size={18} />
                    <div>
                      <div className="doc-name">{doc.name}</div>
                      <div className="doc-size">{formatFileSize(doc.fileSize)}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="doc-type-badge">{doc.type}</span>
                </td>
                <td>
                  <div className="doc-transaction">
                    {doc.transactionName && <div className="transaction-name">{doc.transactionName}</div>}
                    {doc.clientName && <div className="client-name">{doc.clientName}</div>}
                    {doc.propertyAddress && <div className="property-address">{doc.propertyAddress}</div>}
                  </div>
                </td>
                <td>{formatDate(doc.uploadDate)}</td>
                <td>
                  <span className={`status-badge status-${doc.status}`}>
                    {doc.isScanned && doc.scanResult === 'clean' && <Check size={14} />}
                    {doc.status}
                  </span>
                </td>
                <td>
                  <div className="doc-actions">
                    <button className="action-btn" title="View">
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title="Download">
                      <Download size={16} />
                    </button>
                    <button className="action-btn" title="Share">
                      <Share2 size={16} />
                    </button>
                    <button className="action-btn" title="More">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredDocuments.length === 0 && (
          <div className="empty-state">
            <FileText size={64} />
            <h3>No documents found</h3>
            <p>Upload documents or adjust your filters</p>
          </div>
        )}
      </div>

      {/* Integration Placeholders */}
      <div className="integration-section">
        <h3>Integrations</h3>
        <div className="integration-cards">
          <div className="integration-card">
            <div className="integration-icon">🔗</div>
            <h4>SoftPro Integration</h4>
            <p>Automatically sync documents from SoftPro 360</p>
            <button className="btn-secondary-sm">Configure</button>
          </div>
          <div className="integration-card">
            <div className="integration-icon">📥</div>
            <h4>CSV Import</h4>
            <p>Bulk import document metadata from CSV</p>
            <button className="btn-secondary-sm">Import</button>
          </div>
          <div className="integration-card">
            <div className="integration-icon">⚡</div>
            <h4>API Webhooks</h4>
            <p>Receive automated document uploads</p>
            <button className="btn-secondary-sm">Setup</button>
          </div>
        </div>
      </div>
    </div>
  );
}
