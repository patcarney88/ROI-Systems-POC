/**
 * Document Viewer Component
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Preview documents with metadata and actions
 */

import React, { useState } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
  DocumentDuplicateIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface Document {
  id: string;
  title: string;
  filename: string;
  document_type: string;
  mime_type: string;
  size: number;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
  };
  property_id?: string;
  property_address?: string;
  tags: string[];
  is_starred: boolean;
  preview_url?: string;
  download_url: string;
  extracted_text?: string;
  ai_summary?: string;
  permissions: {
    can_view: boolean;
    can_edit: boolean;
    can_delete: boolean;
    can_share: boolean;
  };
}

interface DocumentViewerProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onStar?: () => void;
  onDuplicate?: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDownload,
  onShare,
  onStar,
  onDuplicate
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState<'preview' | 'details' | 'ai'>('preview');

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 25, 50));
  };

  const renderPreview = () => {
    if (!document.preview_url) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-50">
          <div className="text-center">
            <DocumentDuplicateIcon className="mx-auto h-24 w-24 text-gray-300" />
            <p className="mt-4 text-gray-500">Preview not available</p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={onDownload}
              leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
            >
              Download to View
            </Button>
          </div>
        </div>
      );
    }

    // For PDFs and images
    if (document.mime_type.startsWith('image/') || document.mime_type === 'application/pdf') {
      return (
        <div className="h-full overflow-auto bg-gray-100">
          <div className="flex justify-center p-4" style={{ minHeight: '100%' }}>
            <div style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}>
              {document.mime_type === 'application/pdf' ? (
                <iframe
                  src={document.preview_url}
                  className="w-full h-screen border-0"
                  title={document.title}
                />
              ) : (
                <img
                  src={document.preview_url}
                  alt={document.title}
                  className="max-w-full h-auto"
                />
              )}
            </div>
          </div>
        </div>
      );
    }

    // For text documents
    if (document.extracted_text) {
      return (
        <div className="h-full overflow-auto bg-white p-6">
          <pre className="whitespace-pre-wrap font-sans text-sm text-gray-800">
            {document.extracted_text}
          </pre>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-500">Preview not available for this file type</p>
      </div>
    );
  };

  const renderDetails = () => (
    <div className="p-6 space-y-6 overflow-auto">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">File Information</h3>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Filename</dt>
            <dd className="text-gray-900">{document.filename}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Type</dt>
            <dd>
              <Badge variant="secondary">{document.document_type}</Badge>
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Size</dt>
            <dd className="text-gray-900">{formatFileSize(document.size)}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">MIME Type</dt>
            <dd className="text-gray-900">{document.mime_type}</dd>
          </div>
        </dl>
      </div>

      {document.property_address && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Property</h3>
          <p className="text-sm text-gray-900">{document.property_address}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">Metadata</h3>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Uploaded by</dt>
            <dd className="text-gray-900">{document.created_by.name}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Uploaded</dt>
            <dd className="text-gray-900">
              {formatDistanceToNow(new Date(document.created_at), { addSuffix: true })}
            </dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-gray-500">Last modified</dt>
            <dd className="text-gray-900">
              {formatDistanceToNow(new Date(document.updated_at), { addSuffix: true })}
            </dd>
          </div>
        </dl>
      </div>

      {document.tags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {document.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAI = () => (
    <div className="p-6 space-y-6 overflow-auto">
      {document.ai_summary ? (
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-3">AI Summary</h3>
          <p className="text-sm text-gray-700 leading-relaxed">{document.ai_summary}</p>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">AI analysis not available for this document</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
      
      <div className={`
        absolute bg-white shadow-xl transition-all duration-300
        ${isFullscreen 
          ? 'inset-4' 
          : 'inset-x-4 inset-y-8 lg:inset-x-auto lg:right-8 lg:left-auto lg:w-[800px]'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center space-x-3">
            <h2 className="text-lg font-semibold text-gray-900 truncate">
              {document.title}
            </h2>
            <button onClick={onStar}>
              {document.is_starred ? (
                <StarIconSolid className="h-5 w-5 text-yellow-400" />
              ) : (
                <StarIcon className="h-5 w-5 text-gray-400 hover:text-yellow-400" />
              )}
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            {activeTab === 'preview' && document.preview_url && (
              <>
                <button
                  onClick={handleZoomOut}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  title="Zoom out"
                >
                  <MagnifyingGlassMinusIcon className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-500 w-12 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className="p-1.5 text-gray-400 hover:text-gray-600"
                  title="Zoom in"
                >
                  <MagnifyingGlassPlusIcon className="h-5 w-5" />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-2" />
              </>
            )}
            
            {/* Action Buttons */}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            )}
            {document.permissions.can_share && onShare && (
              <button
                onClick={onShare}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="Share"
              >
                <ShareIcon className="h-5 w-5" />
              </button>
            )}
            {document.permissions.can_edit && onEdit && (
              <button
                onClick={onEdit}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                className="p-1.5 text-gray-400 hover:text-gray-600"
                title="Duplicate"
              >
                <DocumentDuplicateIcon className="h-5 w-5" />
              </button>
            )}
            {document.permissions.can_delete && onDelete && (
              <button
                onClick={onDelete}
                className="p-1.5 text-gray-400 hover:text-red-600"
                title="Delete"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            )}
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="h-5 w-5" />
              ) : (
                <ArrowsPointingOutIcon className="h-5 w-5" />
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600"
              title="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {(['preview', 'details', 'ai'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm capitalize
                  ${activeTab === tab
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {tab === 'ai' ? 'AI Insights' : tab}
              </button>
            ))}
          </nav>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden" style={{ height: 'calc(100% - 120px)' }}>
          {activeTab === 'preview' && renderPreview()}
          {activeTab === 'details' && renderDetails()}
          {activeTab === 'ai' && renderAI()}
        </div>
      </div>
    </div>
  );
};