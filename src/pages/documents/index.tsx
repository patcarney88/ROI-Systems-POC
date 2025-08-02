/**
 * Documents Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Document management and listing
 */

import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const DocumentsPage: React.FC = () => {
  const router = useRouter();
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock documents data
  const documents = [
    {
      id: '1',
      name: 'Contract_Agreement_2024.pdf',
      type: 'PDF',
      size: '2.4 MB',
      uploadedAt: '2024-01-15',
      status: 'processed',
      tags: ['Contract', 'Legal', '2024'],
      thumbnail: '/api/placeholder/150/200'
    },
    {
      id: '2',
      name: 'Financial_Report_Q4.xlsx',
      type: 'Excel',
      size: '1.8 MB',
      uploadedAt: '2024-01-14',
      status: 'processing',
      tags: ['Finance', 'Q4', 'Report'],
      thumbnail: '/api/placeholder/150/200'
    },
    {
      id: '3',
      name: 'Marketing_Presentation.pptx',
      type: 'PowerPoint',
      size: '5.2 MB',
      uploadedAt: '2024-01-13',
      status: 'processed',
      tags: ['Marketing', 'Presentation'],
      thumbnail: '/api/placeholder/150/200'
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-success-100 text-success-800';
      case 'processing':
        return 'bg-warning-100 text-warning-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'excel':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'powerpoint':
        return (
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <>
      <Head>
        <title>Documents - ROI Systems</title>
        <meta name="description" content="Manage and view your documents" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                  Documents
                </h1>
                <p className="text-text-secondary">
                  Manage and organize your uploaded documents
                </p>
              </div>
              
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-background-secondary rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-text-secondary hover:text-primary-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-text-secondary hover:text-primary-600'
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>

                {/* Upload Button */}
                <button 
                  onClick={() => router.push('/upload')}
                  className="btn-primary flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Upload</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search documents..."
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select className="input">
                <option>All Types</option>
                <option>PDF</option>
                <option>Excel</option>
                <option>PowerPoint</option>
                <option>Word</option>
              </select>
              
              <select className="input">
                <option>All Status</option>
                <option>Processed</option>
                <option>Processing</option>
                <option>Failed</option>
              </select>
            </div>
          </div>

          {/* Document Grid/List */}
          {documents.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">No documents yet</h3>
              <p className="text-text-secondary mb-6">Upload your first document to get started</p>
              <button 
                onClick={() => router.push('/upload')}
                className="btn-primary"
              >
                Upload Document
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDocument(doc.id)}
                >
                  <div className="aspect-[3/4] bg-background-secondary rounded-lg mb-4 flex items-center justify-center">
                    {getFileIcon(doc.type)}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium text-text-primary truncate" title={doc.name}>
                      {doc.name}
                    </h3>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-tertiary">{doc.size}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {doc.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {doc.tags.length > 2 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          +{doc.tags.length - 2}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-text-tertiary">
                      Uploaded {doc.uploadedAt}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-border-primary overflow-hidden">
              <div className="grid grid-cols-12 gap-4 p-4 bg-background-secondary text-sm font-medium text-text-secondary border-b border-border-primary">
                <div className="col-span-5">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-1">Actions</div>
              </div>
              
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="grid grid-cols-12 gap-4 p-4 border-b border-border-primary hover:bg-background-secondary transition-colors"
                >
                  <div className="col-span-5 flex items-center space-x-3">
                    {getFileIcon(doc.type)}
                    <div>
                      <p className="font-medium text-text-primary">{doc.name}</p>
                      <p className="text-sm text-text-tertiary">Uploaded {doc.uploadedAt}</p>
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className="text-text-secondary">{doc.type}</span>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className="text-text-secondary">{doc.size}</span>
                  </div>
                  
                  <div className="col-span-2 flex items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.status)}`}>
                      {doc.status}
                    </span>
                  </div>
                  
                  <div className="col-span-1 flex items-center">
                    <button className="p-1 text-text-tertiary hover:text-primary-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Layout>
    </>
  );
};

export default DocumentsPage;