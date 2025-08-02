/**
 * Agency Document Upload Page
 * Transaction-based document upload interface
 */

import React, { useState, useCallback, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Layout from '../../components/layout/Layout';

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  progress: number;
  category?: string;
}

const AgencyUploadPage: React.FC = () => {
  const router = useRouter();
  const { transaction: transactionId } = router.query;
  
  const [selectedTransaction, setSelectedTransaction] = useState(transactionId || '');
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('closing');

  // Mock transactions for dropdown
  const transactions = [
    { id: '1', address: '123 Main St, Dallas, TX 75201', status: 'closed' },
    { id: '2', address: '456 Oak Ave, Plano, TX 75023', status: 'in_progress' },
    { id: '3', address: '789 Elm Dr, Frisco, TX 75034', status: 'upcoming' }
  ];

  const documentCategories = [
    { value: 'contract', label: 'Contract/Agreement' },
    { value: 'title', label: 'Title Documents' },
    { value: 'closing', label: 'Closing Documents' },
    { value: 'legal', label: 'Legal Documents' },
    { value: 'financial', label: 'Financial Documents' },
    { value: 'inspection', label: 'Inspection Reports' },
    { value: 'insurance', label: 'Insurance Documents' },
    { value: 'other', label: 'Other' }
  ];

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadFile[] = newFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      category: uploadCategory
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const simulateUpload = async (fileId: string) => {
    // Update status to uploading
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'uploading' } : f
    ));

    // Simulate progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress } : f
      ));
    }

    // Mark as completed
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'completed' } : f
    ));
  };

  const handleUpload = async () => {
    if (!selectedTransaction) {
      alert('Please select a transaction first');
      return;
    }

    const pendingFiles = files.filter(f => f.status === 'pending');
    
    for (const file of pendingFiles) {
      await simulateUpload(file.id);
    }

    // After all uploads complete, show success message
    setTimeout(() => {
      alert('Documents uploaded successfully!');
      router.push(`/agency/transactions/${selectedTransaction}`);
    }, 1000);
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-warning-100 text-warning-700';
      case 'closed':
        return 'bg-success-100 text-success-700';
      case 'upcoming':
        return 'bg-info-100 text-info-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <>
      <Head>
        <title>Upload Documents - ROI Systems</title>
        <meta name="description" content="Upload documents to transactions" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-text-primary mb-2">
                Upload Documents
              </h1>
              <p className="text-text-secondary">
                Upload closing documents to a specific transaction
              </p>
            </div>

            {/* Transaction Selection */}
            <div className="card mb-6">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Select Transaction
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Transaction <span className="text-error-600">*</span>
                  </label>
                  <select
                    value={selectedTransaction}
                    onChange={(e) => setSelectedTransaction(e.target.value)}
                    className="input"
                  >
                    <option value="">Select a transaction...</option>
                    {transactions.map(tx => (
                      <option key={tx.id} value={tx.id}>
                        {tx.address}
                      </option>
                    ))}
                  </select>
                  {selectedTransaction && (
                    <p className="mt-2 text-sm text-text-tertiary">
                      Status: <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                        getStatusBadge(transactions.find(t => t.id === selectedTransaction)?.status || '')
                      }`}>
                        {transactions.find(t => t.id === selectedTransaction)?.status.replace('_', ' ')}
                      </span>
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Document Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="input"
                  >
                    {documentCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {!selectedTransaction && (
                <div className="mt-4 p-4 bg-warning-50 border border-warning-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <p className="text-warning-800 font-medium">Transaction Required</p>
                      <p className="text-warning-700 text-sm mt-1">
                        Please select a transaction before uploading documents.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Area */}
            <div className="card">
              <h2 className="text-xl font-semibold text-text-primary mb-4">
                Upload Files
              </h2>
              
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  isDragging 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-border-secondary bg-background-secondary hover:border-primary-400'
                }`}
              >
                <svg className="mx-auto h-12 w-12 text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                
                <p className="text-text-primary font-medium mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-text-tertiary mb-4">
                  PDF, DOC, DOCX, JPG, PNG up to 50MB each
                </p>
                
                <label className="btn-primary cursor-pointer">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    disabled={!selectedTransaction}
                  />
                  Select Files
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-text-primary mb-4">
                    Files ({files.length})
                  </h3>
                  
                  <div className="space-y-3">
                    {files.map(file => (
                      <div key={file.id} className="flex items-center p-3 bg-background-secondary rounded-lg">
                        <div className="flex-shrink-0 mr-3">
                          {getFileIcon(file.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-text-primary font-medium truncate">
                            {file.name}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-text-tertiary">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span className="capitalize">{uploadCategory}</span>
                          </div>
                          
                          {file.status === 'uploading' && (
                            <div className="mt-2">
                              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-primary-600 h-full transition-all duration-300"
                                  style={{ width: `${file.progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="ml-4">
                          {file.status === 'pending' && (
                            <button
                              onClick={() => removeFile(file.id)}
                              className="text-text-tertiary hover:text-error-600 transition-colors"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          
                          {file.status === 'uploading' && (
                            <span className="text-primary-600 text-sm">
                              {file.progress}%
                            </span>
                          )}
                          
                          {file.status === 'completed' && (
                            <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {files.length > 0 && (
                <div className="mt-6 flex justify-end space-x-4">
                  <button
                    onClick={() => setFiles([])}
                    className="btn-outline"
                  >
                    Clear All
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!selectedTransaction || files.some(f => f.status === 'uploading')}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {files.some(f => f.status === 'uploading') ? 'Uploading...' : 'Upload Documents'}
                  </button>
                </div>
              )}
            </div>

            {/* Help Section */}
            <div className="mt-6 card bg-info-50 border-info-200">
              <h3 className="text-lg font-medium text-info-900 mb-2">
                Document Organization Tips
              </h3>
              <ul className="space-y-1 text-sm text-info-800">
                <li>• Upload all closing documents as soon as they're available</li>
                <li>• Use appropriate categories to help homeowners find documents easily</li>
                <li>• Ensure all documents are clear and complete before uploading</li>
                <li>• Documents are automatically organized by transaction and date</li>
              </ul>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default AgencyUploadPage;