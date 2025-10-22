import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { documentUploadSchema, type DocumentUploadFormData, validateFiles } from '../schemas/validation';
import { notify } from '../utils/notifications';
import { apiClient } from '../services/api.client';
import { documentApi } from '../services/api.services';
import './Modal.css';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (files: File[], metadata: DocumentMetadata) => void;
}

interface DocumentMetadata {
  client: string;
  type: string;
  description?: string;
}

const DOCUMENT_TYPES = [
  'Purchase Agreement',
  'Title Deed',
  'Inspection Report',
  'Mortgage Document',
  'Disclosure Form',
  'Listing Agreement',
  'Rental Agreement',
  'Escrow Document'
];

export default function DocumentUploadModal({ isOpen, onClose, onUpload }: DocumentUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset
  } = useForm<DocumentUploadFormData>({
    resolver: zodResolver(documentUploadSchema),
    mode: 'onChange',
    defaultValues: {
      client: '',
      type: DOCUMENT_TYPES[0],
      description: ''
    }
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset();
      setFiles([]);
      setFileErrors([]);
    }
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  };

  const addFiles = (newFiles: File[]) => {
    // Validate files
    const validation = validateFiles(newFiles);

    if (!validation.valid) {
      setFileErrors(validation.errors);
      notify.error(validation.errors[0]);
      return;
    }

    setFileErrors([]);
    setFiles(prev => [...prev, ...newFiles]);
    notify.success(`${newFiles.length} file(s) added`);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    notify.info('File removed');
  };

  const onSubmit = async (data: DocumentUploadFormData) => {
    // Validate files exist
    if (files.length === 0) {
      notify.error('Please select at least one file to upload');
      return;
    }

    // Validate files again before upload
    const validation = validateFiles(files);
    if (!validation.valid) {
      setFileErrors(validation.errors);
      notify.error(validation.errors[0]);
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload files one by one with progress tracking
      let uploadedCount = 0;
      const totalFiles = files.length;

      for (const file of files) {
        // Calculate progress for this file
        const fileProgress = (uploadedCount / totalFiles) * 100;
        setUploadProgress(Math.round(fileProgress));

        // Upload file with progress tracking
        const response = await apiClient.uploadFileWithProgress(
          '/documents',
          file,
          {
            client: data.client,
            title: file.name,
            type: data.type,
            metadata: {
              description: data.description || '',
              uploadedFrom: 'DocumentUploadModal'
            }
          },
          (progress) => {
            // Calculate total progress including this file's progress
            const totalProgress = fileProgress + (progress / totalFiles);
            setUploadProgress(Math.round(totalProgress));
          }
        );

        if (!response.success) {
          throw new Error(response.error?.message || 'Upload failed');
        }

        uploadedCount++;
      }

      // Call original callback if provided
      if (onUpload) {
        onUpload(files, data);
      }

      notify.success(`${files.length} document(s) uploaded successfully`);

      // Reset form
      setFiles([]);
      setFileErrors([]);
      setUploadProgress(0);
      reset();
      setUploading(false);
      onClose();
    } catch (error: any) {
      console.error('Upload failed:', error);
      notify.error(error.message || 'Failed to upload documents');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Upload Documents</h2>
          <button className="modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-body">
            {/* Drag and Drop Zone */}
            <div
              className={`upload-zone ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
              </div>
              <h3>Drag & Drop files here</h3>
              <p>or click to browse</p>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                Supported: PDF, DOC, DOCX, JPG, PNG (max 10MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {/* File Errors */}
            {fileErrors.length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px'
              }}>
                {fileErrors.map((error, index) => (
                  <p key={index} style={{
                    margin: '0.25rem 0',
                    fontSize: '0.875rem',
                    color: '#ef4444'
                  }}>
                    {error}
                  </p>
                ))}
              </div>
            )}

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="selected-files">
                <h4>Selected Files ({files.length})</h4>
                <div className="file-list">
                  {files.map((file, index) => (
                    <div key={index} className="file-item">
                      <div className="file-icon">📄</div>
                      <div className="file-info">
                        <div className="file-name">{file.name}</div>
                        <div className="file-size">{formatFileSize(file.size)}</div>
                      </div>
                      <button
                        type="button"
                        className="file-remove"
                        onClick={() => removeFile(index)}
                        aria-label="Remove file"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 6L6 18M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Form */}
            <div className="upload-form">
              <div className="form-group">
                <label htmlFor="client">Client Name *</label>
                <input
                  id="client"
                  type="text"
                  placeholder="Enter client name"
                  {...register('client')}
                  className={errors.client ? 'error' : ''}
                />
                {errors.client && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.client.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="type">Document Type *</label>
                <select
                  id="type"
                  {...register('type')}
                >
                  {DOCUMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea
                  id="description"
                  placeholder="Add notes or description"
                  {...register('description')}
                  rows={3}
                  className={errors.description ? 'error' : ''}
                />
                {errors.description && (
                  <span style={{ display: 'block', color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    {errors.description.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={uploading}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={files.length === 0 || !isValid || uploading}
              style={{ position: 'relative', overflow: 'hidden' }}
            >
              {uploading && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    height: '4px',
                    width: `${uploadProgress}%`,
                    background: 'rgba(255, 255, 255, 0.3)',
                    transition: 'width 0.3s ease'
                  }}
                />
              )}
              {uploading ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Uploading... {uploadProgress}%</span>
                </>
              ) : (
                <>
                  <span>Upload {files.length > 0 ? `${files.length} File${files.length > 1 ? 's' : ''}` : ''}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
