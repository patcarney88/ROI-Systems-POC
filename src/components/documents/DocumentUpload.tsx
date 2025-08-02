/**
 * Document Upload Component
 * Designed by: Frontend Specialist + UX Designer + Backend Specialist
 * 
 * Drag-and-drop document upload with progress tracking
 */

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  documentType?: string;
  propertyId?: string;
  tags?: string[];
}

interface DocumentUploadProps {
  onUpload?: (files: File[]) => void;
  onFileComplete?: (file: UploadFile) => void;
  onFileError?: (file: UploadFile, error: string) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  propertyId?: string;
  defaultDocumentType?: string;
  defaultTags?: string[];
}

const DEFAULT_ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain'
];

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  onUpload,
  onFileComplete,
  onFileError,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  acceptedFileTypes = DEFAULT_ACCEPTED_TYPES,
  propertyId,
  defaultDocumentType = 'other',
  defaultTags = []
}) => {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle accepted files
    const newFiles: UploadFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      status: 'pending' as const,
      documentType: defaultDocumentType,
      propertyId,
      tags: defaultTags
    }));

    setUploadFiles(prev => [...prev, ...newFiles]);
    
    // Start upload simulation (replace with actual upload logic)
    newFiles.forEach(uploadFile => {
      simulateUpload(uploadFile);
    });

    // Handle rejected files
    rejectedFiles.forEach(rejection => {
      const error = rejection.errors[0]?.message || 'File rejected';
      console.error('File rejected:', rejection.file.name, error);
    });

    onUpload?.(acceptedFiles);
  }, [onUpload, propertyId, defaultDocumentType, defaultTags]);

  const simulateUpload = async (uploadFile: UploadFile) => {
    // Update status to uploading
    setUploadFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
    ));

    // Simulate upload progress
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, progress } : f
      ));
    }

    // Update status to processing
    setUploadFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'processing' } : f
    ));

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Complete or error (90% success rate for demo)
    const success = Math.random() > 0.1;
    
    if (success) {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'complete' } : f
      ));
      onFileComplete?.({ ...uploadFile, status: 'complete' });
    } else {
      const error = 'Failed to process document';
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error', error } : f
      ));
      onFileError?.(uploadFile, error);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    maxFiles,
    maxSize,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>)
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (file: UploadFile) => {
    switch (file.status) {
      case 'pending':
        return 'Waiting...';
      case 'uploading':
        return `Uploading... ${file.progress}%`;
      case 'processing':
        return 'Processing with AI...';
      case 'complete':
        return 'Complete';
      case 'error':
        return file.error || 'Error';
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the files here...'
            : 'Drag and drop files here, or click to select'}
        </p>
        
        <p className="mt-1 text-xs text-gray-500">
          Up to {maxFiles} files, max {formatFileSize(maxSize)} each
        </p>
        
        <Button variant="secondary" size="sm" className="mt-4">
          Select Files
        </Button>
      </div>

      {/* Upload Queue */}
      {uploadFiles.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900">Upload Queue</h3>
          
          <div className="space-y-2">
            {uploadFiles.map(file => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <DocumentIcon className="h-8 w-8 text-gray-400 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{formatFileSize(file.file.size)}</span>
                      {file.documentType && (
                        <>
                          <span>•</span>
                          <Badge variant="secondary" size="sm">
                            {file.documentType}
                          </Badge>
                        </>
                      )}
                    </div>
                    
                    {/* Progress Bar */}
                    {(file.status === 'uploading' || file.status === 'processing') && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>{getStatusText(file)}</span>
                          {file.status === 'uploading' && (
                            <span>{file.progress}%</span>
                          )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Status Text */}
                    {(file.status === 'pending' || file.status === 'complete' || file.status === 'error') && (
                      <p className={`mt-1 text-xs ${
                        file.status === 'error' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {getStatusText(file)}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  {getStatusIcon(file.status)}
                  
                  {(file.status === 'pending' || file.status === 'error') && (
                    <button
                      onClick={() => removeFile(file.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};