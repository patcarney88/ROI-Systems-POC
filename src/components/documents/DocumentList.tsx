/**
 * Document List Component
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Displays documents in a responsive grid/list view with filtering
 */

import React, { useState, useCallback } from 'react';
import { 
  DocumentTextIcon, 
  FolderIcon, 
  PhotoIcon,
  DocumentChartBarIcon,
  EnvelopeIcon,
  CalendarIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  PencilIcon,
  ShareIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  Bars3Icon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { DocumentActions } from './DocumentActions';

interface Document {
  id: string;
  title: string;
  filename: string;
  document_type: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  property_id?: string;
  property_address?: string;
  tags: string[];
  is_starred: boolean;
  thumbnail_url?: string;
  download_url: string;
  permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
  };
}

interface DocumentListProps {
  documents: Document[];
  loading?: boolean;
  onDocumentClick?: (document: Document) => void;
  onDocumentEdit?: (document: Document) => void;
  onDocumentDelete?: (document: Document) => void;
  onDocumentDownload?: (document: Document) => void;
  onDocumentShare?: (document: Document) => void;
  onDocumentStar?: (document: Document) => void;
  viewMode?: 'grid' | 'list';
  onViewModeChange?: (mode: 'grid' | 'list') => void;
}

const documentTypeIcons: Record<string, React.ComponentType<any>> = {
  'lease': DocumentTextIcon,
  'contract': DocumentTextIcon,
  'inspection': DocumentChartBarIcon,
  'photo': PhotoIcon,
  'correspondence': EnvelopeIcon,
  'financial': DocumentChartBarIcon,
  'other': FolderIcon
};

const documentTypeColors: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'error'> = {
  'lease': 'default',
  'contract': 'secondary',
  'inspection': 'warning',
  'photo': 'success',
  'correspondence': 'default',
  'financial': 'error',
  'other': 'secondary'
};

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading = false,
  onDocumentClick,
  onDocumentEdit,
  onDocumentDelete,
  onDocumentDownload,
  onDocumentShare,
  onDocumentStar,
  viewMode = 'grid',
  onViewModeChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: string) => {
    const Icon = documentTypeIcons[type] || FolderIcon;
    return Icon;
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = !selectedType || doc.document_type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const documentTypes = Array.from(new Set(documents.map(doc => doc.document_type)));

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filteredDocuments.map((document) => {
        const Icon = getDocumentIcon(document.document_type);
        
        return (
          <Card 
            key={document.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            onClick={() => onDocumentClick?.(document)}
          >
            <div className="p-4">
              {/* Thumbnail or Icon */}
              <div className="aspect-w-16 aspect-h-9 mb-4 bg-gray-100 rounded-lg overflow-hidden">
                {document.thumbnail_url ? (
                  <img 
                    src={document.thumbnail_url} 
                    alt={document.title}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-32">
                    <Icon className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Document Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium text-gray-900 truncate flex-1">
                    {document.title}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDocumentStar?.(document);
                    }}
                    className="ml-2"
                  >
                    <StarIconSolid 
                      className={`h-5 w-5 ${
                        document.is_starred ? 'text-yellow-400' : 'text-gray-300'
                      } hover:text-yellow-400 transition-colors`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatFileSize(document.size)}</span>
                  <Badge variant={documentTypeColors[document.document_type]} size="sm">
                    {document.document_type}
                  </Badge>
                </div>

                {document.property_address && (
                  <p className="text-xs text-gray-600 truncate">
                    {document.property_address}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {document.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                    >
                      {tag}
                    </span>
                  ))}
                  {document.tags.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{document.tags.length - 2} more
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                </p>

                {/* Actions (visible on hover) */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                  <DocumentActions
                    document={document}
                    onView={() => onDocumentClick?.(document)}
                    onEdit={() => onDocumentEdit?.(document)}
                    onDelete={() => onDocumentDelete?.(document)}
                    onDownload={() => onDocumentDownload?.(document)}
                    onShare={() => onDocumentShare?.(document)}
                  />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="bg-white shadow overflow-hidden sm:rounded-md">
      <ul className="divide-y divide-gray-200">
        {filteredDocuments.map((document) => {
          const Icon = getDocumentIcon(document.document_type);
          
          return (
            <li key={document.id}>
              <div 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => onDocumentClick?.(document)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      <Icon className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="ml-4 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="truncate">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {document.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDocumentStar?.(document);
                              }}
                              className="ml-2"
                            >
                              <StarIconSolid 
                                className={`h-4 w-4 ${
                                  document.is_starred ? 'text-yellow-400' : 'text-gray-300'
                                } hover:text-yellow-400 transition-colors`}
                              />
                            </button>
                          </div>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span>{document.filename}</span>
                            <span>•</span>
                            <span>{formatFileSize(document.size)}</span>
                            {document.property_address && (
                              <>
                                <span>•</span>
                                <span>{document.property_address}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-2">
                          <Badge variant={documentTypeColors[document.document_type]}>
                            {document.document_type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {document.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <DocumentActions
                          document={document}
                          onView={() => onDocumentClick?.(document)}
                          onEdit={() => onDocumentEdit?.(document)}
                          onDelete={() => onDocumentDelete?.(document)}
                          onDownload={() => onDocumentDownload?.(document)}
                          onShare={() => onDocumentShare?.(document)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
          </Button>
          <div className="flex items-center border rounded-lg">
            <button
              className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
              onClick={() => onViewModeChange?.('grid')}
            >
              <Squares2X2Icon className="h-4 w-4" />
            </button>
            <button
              className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
              onClick={() => onViewModeChange?.('list')}
            >
              <Bars3Icon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
          <Button
            variant={selectedType === null ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSelectedType(null)}
          >
            All Types
          </Button>
          {documentTypes.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedType(type)}
            >
              {type}
            </Button>
          ))}
        </div>
      )}

      {/* Document Count */}
      <div className="text-sm text-gray-600">
        Showing {filteredDocuments.length} of {documents.length} documents
      </div>

      {/* Document Grid/List */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Empty State */}
      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedType
              ? 'Try adjusting your filters'
              : 'Get started by uploading a document'}
          </p>
        </div>
      )}
    </div>
  );
};