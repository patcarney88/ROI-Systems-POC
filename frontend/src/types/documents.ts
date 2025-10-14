// Document Management System Types
// ROI Systems - Title Agent Document Management

export type DocumentType = 
  | 'Deed'
  | 'Mortgage/Deed of Trust'
  | 'Title Policy'
  | 'Closing Disclosure'
  | 'HUD-1 Settlement Statement'
  | 'Property Survey'
  | 'Home Inspection Report'
  | 'Insurance Policy'
  | 'Other';

export type DocumentStatus = 
  | 'uploading'
  | 'processing'
  | 'scanning'
  | 'ready'
  | 'failed'
  | 'archived';

export type UploadStatus = 
  | 'pending'
  | 'uploading'
  | 'processing'
  | 'complete'
  | 'error'
  | 'cancelled';

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  fileSize: number;
  uploadDate: string;
  lastModified: string;
  uploadedBy: string;
  transactionId?: string;
  transactionName?: string;
  clientId?: string;
  clientName?: string;
  propertyAddress?: string;
  tags: string[];
  url?: string;
  thumbnailUrl?: string;
  pageCount?: number;
  isScanned: boolean;
  scanResult?: 'clean' | 'threat' | 'pending';
  ocrProcessed: boolean;
  annotations?: Annotation[];
  sharedLinks?: SharedLink[];
  metadata?: DocumentMetadata;
}

export interface DocumentMetadata {
  mimeType: string;
  extension: string;
  checksum?: string;
  version: number;
  originalName: string;
  s3Key?: string;
  s3Bucket?: string;
}

export interface UploadFile {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  error?: string;
  documentType?: DocumentType;
  transactionId?: string;
  clientId?: string;
  tags?: string[];
  uploadedDocument?: Document;
}

export interface Transaction {
  id: string;
  name: string;
  propertyAddress: string;
  clientName: string;
  status: 'active' | 'pending' | 'closed';
  closingDate?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  properties: number;
}

export interface Annotation {
  id: string;
  type: 'highlight' | 'note' | 'drawing';
  page: number;
  position: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  content?: string;
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface SharedLink {
  id: string;
  url: string;
  expiresAt: string;
  password?: string;
  accessCount: number;
  maxAccess?: number;
  createdAt: string;
}

export interface DocumentFilter {
  searchQuery?: string;
  documentType?: DocumentType | 'all';
  status?: DocumentStatus | 'all';
  clientId?: string;
  transactionId?: string;
  propertyAddress?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface BulkAction {
  type: 'download' | 'categorize' | 'delete' | 'tag' | 'assign';
  documentIds: string[];
  payload?: {
    documentType?: DocumentType;
    tags?: string[];
    transactionId?: string;
    clientId?: string;
  };
}

export interface UploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  maxConcurrentUploads: number;
  chunkSize: number;
  enableVirusScan: boolean;
  enableOCR: boolean;
  enableAutoClassification: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    page?: number;
    pageSize?: number;
    total?: number;
  };
}

export interface WebhookPayload {
  event: 'document.uploaded' | 'document.processed' | 'document.scanned' | 'document.deleted';
  timestamp: string;
  data: Document;
  source: 'manual' | 'api' | 'softpro' | 'email' | 'webhook';
}

export interface SoftProIntegration {
  enabled: boolean;
  apiKey?: string;
  endpoint?: string;
  autoSync: boolean;
  lastSyncDate?: string;
}

export interface CSVImportMapping {
  fileName: string;
  documentType: string;
  transactionId?: string;
  clientName?: string;
  propertyAddress?: string;
  uploadDate?: string;
}

// Utility types
export type SortField = 'name' | 'type' | 'uploadDate' | 'status' | 'client' | 'transaction';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// Constants
export const DOCUMENT_TYPES: DocumentType[] = [
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

export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  'Deed': '📜',
  'Mortgage/Deed of Trust': '🏦',
  'Title Policy': '🛡️',
  'Closing Disclosure': '📋',
  'HUD-1 Settlement Statement': '📊',
  'Property Survey': '📐',
  'Home Inspection Report': '🔍',
  'Insurance Policy': '🏥',
  'Other': '📄'
};
