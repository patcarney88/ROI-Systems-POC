/**
 * TypeScript Type Definitions
 * Designed by: Frontend Specialist + TypeScript Engineer
 * 
 * Global type definitions for the frontend application
 */

// User and Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  agency: string;
  avatar?: string;
  initials: string;
  createdAt: string;
  updatedAt: string;
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  AGENCY_ADMIN = 'agency_admin',
  TEAM_LEAD = 'team_lead',
  AGENT = 'agent',
  ASSISTANT = 'assistant',
  CLIENT = 'client',
  READONLY = 'readonly'
}

// Document Types
export interface Document {
  id: string;
  title: string;
  filename: string;
  type: DocumentType;
  size: number;
  mimeType: string;
  status: DocumentStatus;
  uploadedBy: string;
  uploadedAt: string;
  updatedAt: string;
  propertyId?: string;
  clientId?: string;
  tags: string[];
  metadata: DocumentMetadata;
}

export enum DocumentType {
  CONTRACT = 'contract',
  LISTING = 'listing',
  INSPECTION = 'inspection',
  DISCLOSURE = 'disclosure',
  FINANCIAL = 'financial',
  LEGAL = 'legal',
  PHOTO = 'photo',
  OTHER = 'other'
}

export enum DocumentStatus {
  PROCESSING = 'processing',
  READY = 'ready',
  SIGNED = 'signed',
  EXPIRED = 'expired',
  REJECTED = 'rejected'
}

export interface DocumentMetadata {
  extractedText?: string;
  aiSummary?: string;
  signatures?: DocumentSignature[];
  properties?: Record<string, any>;
}

export interface DocumentSignature {
  signerName: string;
  signerEmail: string;
  signedAt: string;
  ipAddress: string;
}

// Property Types
export interface Property {
  id: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  mlsNumber?: string;
  propertyType: PropertyType;
  status: PropertyStatus;
  price?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  description?: string;
  agentId: string;
  clientId?: string;
  createdAt: string;
  updatedAt: string;
  documents: Document[];
}

export enum PropertyType {
  SINGLE_FAMILY = 'single_family',
  CONDO = 'condo',
  TOWNHOUSE = 'townhouse',
  MULTI_FAMILY = 'multi_family',
  COMMERCIAL = 'commercial',
  LAND = 'land'
}

export enum PropertyStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SOLD = 'sold',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired'
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Search Types
export interface SearchParams {
  query?: string;
  filters?: SearchFilters;
  sort?: SortOptions;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchFilters {
  documentType?: DocumentType[];
  propertyType?: PropertyType[];
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  tags?: string[];
  agentId?: string;
  clientId?: string;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Dashboard Types
export interface DashboardStats {
  totalDocuments: number;
  activeProperties: number;
  pendingReviews: number;
  recentUploads: number;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'review' | 'sign' | 'share';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  status: 'completed' | 'pending' | 'failed';
}

// Form Types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState<T> {
  data: T;
  errors: FormErrors;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

// Agency Types
export interface Agency {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  subscription: SubscriptionTier;
  settings: AgencySettings;
  createdAt: string;
  updatedAt: string;
}

export enum SubscriptionTier {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

export interface AgencySettings {
  documentRetentionDays: number;
  allowClientAccess: boolean;
  requireMFA: boolean;
  customBranding: boolean;
  apiAccess: boolean;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface IconProps extends BaseComponentProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Event Handler Types
export type EventHandler<T = Element, E = Event> = (event: E & { target: T }) => void;
export type ChangeHandler<T = HTMLInputElement> = EventHandler<T, React.ChangeEvent<T>>;
export type ClickHandler<T = HTMLButtonElement> = EventHandler<T, React.MouseEvent<T>>;
export type FormSubmitHandler = EventHandler<HTMLFormElement, React.FormEvent<HTMLFormElement>>;

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  fonts: {
    sans: string[];
    mono: string[];
  };
  breakpoints: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
}

// Environment Types
export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  version: string;
  features: {
    aiEnabled: boolean;
    analyticsEnabled: boolean;
    debugMode: boolean;
  };
}