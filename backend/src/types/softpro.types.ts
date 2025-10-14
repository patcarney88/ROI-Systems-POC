/**
 * SoftPro 360 TypeScript Type Definitions
 *
 * Comprehensive type definitions for SoftPro 360 API integration
 * Covers transactions, contacts, documents, parties, properties, and statuses
 */

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

/**
 * SoftPro Transaction (Order)
 */
export interface Transaction {
  orderId: string;
  orderNumber: string;
  orderType: OrderType;
  status: TransactionStatus;

  // Property Information
  propertyAddress: PropertyAddress;
  propertyType?: PropertyType;

  // Financial Details
  purchasePrice?: number;
  loanAmount?: number;
  downPayment?: number;
  closingCost?: number;

  // Dates
  openedDate: Date;
  estimatedClosingDate?: Date;
  actualClosingDate?: Date;

  // Parties
  buyer?: Party[];
  seller?: Party[];
  lender?: Party[];
  titleCompany?: Party;
  escrowOfficer?: Contact;

  // Metadata
  notes?: string;
  customFields?: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SoftPro Contact
 */
export interface Contact {
  contactId: string;
  contactType: ContactType;

  // Personal Information
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;

  // Contact Details
  email?: string;
  phone?: string;
  mobilePhone?: string;
  fax?: string;

  // Address
  address?: Address;

  // Business Information
  company?: string;
  jobTitle?: string;

  // Additional Details
  notes?: string;
  customFields?: Record<string, any>;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * SoftPro Document
 */
export interface Document {
  documentId: string;
  orderId: string;

  // Document Details
  documentName: string;
  documentType: DocumentType;
  category?: string;

  // File Information
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;

  // Status
  status: DocumentStatus;

  // Version Control
  version?: number;
  versionNotes?: string;

  // Metadata
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;

  // Timestamps
  uploadedAt: Date;
  lastModifiedAt: Date;
}

/**
 * SoftPro Party (Buyer, Seller, Lender, etc.)
 */
export interface Party {
  partyId: string;
  partyType: PartyType;

  // Contact Reference
  contactId?: string;
  contact?: Contact;

  // Role-Specific Details
  ownershipPercentage?: number;
  isPrimary?: boolean;

  // For Entity Parties
  entityName?: string;
  entityType?: EntityType;

  // Metadata
  notes?: string;
  customFields?: Record<string, any>;
}

/**
 * SoftPro Property
 */
export interface Property {
  propertyId: string;
  orderId: string;

  // Property Details
  address: PropertyAddress;
  propertyType: PropertyType;

  // Legal Description
  legalDescription?: string;
  parcelNumber?: string;
  lotNumber?: string;
  block?: string;
  subdivision?: string;

  // Property Characteristics
  yearBuilt?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;

  // Zoning and Use
  zoning?: string;
  currentUse?: string;

  // Metadata
  customFields?: Record<string, any>;
}

/**
 * SoftPro Status
 */
export interface Status {
  statusId: string;
  statusName: string;
  statusCode: string;
  category: StatusCategory;

  // Configuration
  isActive: boolean;
  sortOrder: number;

  // Workflow
  allowedNextStatuses?: string[];
  requiredFields?: string[];

  // Display
  color?: string;
  icon?: string;
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

/**
 * Address Structure
 */
export interface Address {
  streetAddress: string;
  streetAddress2?: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  country?: string;
}

/**
 * Property Address (extends Address with additional fields)
 */
export interface PropertyAddress extends Address {
  apn?: string; // Assessor's Parcel Number
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// ============================================================================
// FILTER TYPES
// ============================================================================

/**
 * Transaction Filters
 */
export interface TransactionFilters {
  status?: TransactionStatus[];
  orderType?: OrderType[];
  openedDateFrom?: Date;
  openedDateTo?: Date;
  closingDateFrom?: Date;
  closingDateTo?: Date;
  propertyState?: string[];
  propertyCity?: string[];
  escrowOfficerId?: string;
  search?: string; // Search by order number, property address, party name
  limit?: number;
  offset?: number;
  sortBy?: 'openedDate' | 'closingDate' | 'orderNumber' | 'propertyAddress';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Contact Filters
 */
export interface ContactFilters {
  contactType?: ContactType[];
  search?: string; // Search by name, email, phone
  company?: string;
  state?: string;
  city?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'lastName' | 'firstName' | 'company' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * Document Filters
 */
export interface DocumentFilters {
  orderId?: string;
  documentType?: DocumentType[];
  status?: DocumentStatus[];
  uploadedDateFrom?: Date;
  uploadedDateTo?: Date;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Transaction Creation Data
 */
export interface TransactionData {
  orderNumber?: string; // Auto-generated if not provided
  orderType: OrderType;
  propertyAddress: PropertyAddress;
  propertyType?: PropertyType;
  purchasePrice?: number;
  estimatedClosingDate?: Date;
  escrowOfficerId?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

/**
 * Contact Creation Data
 */
export interface ContactData {
  contactType: ContactType;
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  email?: string;
  phone?: string;
  mobilePhone?: string;
  address?: Address;
  company?: string;
  jobTitle?: string;
  notes?: string;
  customFields?: Record<string, any>;
}

/**
 * Document Metadata
 */
export interface DocumentMetadata {
  documentType: DocumentType;
  category?: string;
  description?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

/**
 * Party Data
 */
export interface PartyData {
  partyType: PartyType;
  contactId?: string;
  entityName?: string;
  entityType?: EntityType;
  ownershipPercentage?: number;
  isPrimary?: boolean;
  notes?: string;
  customFields?: Record<string, any>;
}

/**
 * Property Data
 */
export interface PropertyData {
  address: PropertyAddress;
  propertyType: PropertyType;
  legalDescription?: string;
  parcelNumber?: string;
  yearBuilt?: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  zoning?: string;
  customFields?: Record<string, any>;
}

// ============================================================================
// SYNC TYPES
// ============================================================================

/**
 * Sync Result
 */
export interface SyncResult {
  success: boolean;
  entityType: EntityType;
  operation: 'sync' | 'create' | 'update' | 'delete';
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  duration: number; // milliseconds
  errors?: SyncError[];
  startedAt: Date;
  completedAt: Date;
}

/**
 * Sync Error
 */
export interface SyncError {
  entityId: string;
  errorCode: string;
  errorMessage: string;
  details?: any;
}

/**
 * Conflict Strategy
 */
export enum ConflictStrategy {
  SOFTPRO_WINS = 'SOFTPRO_WINS',
  ROI_WINS = 'ROI_WINS',
  NEWEST_WINS = 'NEWEST_WINS',
  MANUAL_REVIEW = 'MANUAL_REVIEW',
  MERGE = 'MERGE',
}

// ============================================================================
// ENUMS
// ============================================================================

export enum OrderType {
  PURCHASE = 'PURCHASE',
  REFINANCE = 'REFINANCE',
  SALE = 'SALE',
  CONSTRUCTION = 'CONSTRUCTION',
  EQUITY_LINE = 'EQUITY_LINE',
  COMMERCIAL = 'COMMERCIAL',
  OTHER = 'OTHER',
}

export enum TransactionStatus {
  OPENED = 'OPENED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_CLOSING = 'PENDING_CLOSING',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
  ON_HOLD = 'ON_HOLD',
}

export enum ContactType {
  INDIVIDUAL = 'INDIVIDUAL',
  COMPANY = 'COMPANY',
  ATTORNEY = 'ATTORNEY',
  LENDER = 'LENDER',
  REAL_ESTATE_AGENT = 'REAL_ESTATE_AGENT',
  TITLE_COMPANY = 'TITLE_COMPANY',
  ESCROW_OFFICER = 'ESCROW_OFFICER',
  OTHER = 'OTHER',
}

export enum DocumentType {
  PURCHASE_AGREEMENT = 'PURCHASE_AGREEMENT',
  TITLE_COMMITMENT = 'TITLE_COMMITMENT',
  TITLE_POLICY = 'TITLE_POLICY',
  DEED = 'DEED',
  MORTGAGE = 'MORTGAGE',
  NOTE = 'NOTE',
  HUD_SETTLEMENT = 'HUD_SETTLEMENT',
  CLOSING_DISCLOSURE = 'CLOSING_DISCLOSURE',
  ESCROW_INSTRUCTIONS = 'ESCROW_INSTRUCTIONS',
  WIRE_INSTRUCTIONS = 'WIRE_INSTRUCTIONS',
  INSPECTION_REPORT = 'INSPECTION_REPORT',
  APPRAISAL = 'APPRAISAL',
  SURVEY = 'SURVEY',
  OTHER = 'OTHER',
}

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  SIGNED = 'SIGNED',
  RECORDED = 'RECORDED',
  ARCHIVED = 'ARCHIVED',
}

export enum PartyType {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  LENDER = 'LENDER',
  BORROWER = 'BORROWER',
  BUYER_AGENT = 'BUYER_AGENT',
  SELLER_AGENT = 'SELLER_AGENT',
  ATTORNEY = 'ATTORNEY',
  TITLE_COMPANY = 'TITLE_COMPANY',
  ESCROW_HOLDER = 'ESCROW_HOLDER',
  OTHER = 'OTHER',
}

export enum EntityType {
  CORPORATION = 'CORPORATION',
  LLC = 'LLC',
  PARTNERSHIP = 'PARTNERSHIP',
  TRUST = 'TRUST',
  ESTATE = 'ESTATE',
  INDIVIDUAL = 'INDIVIDUAL',
}

export enum PropertyType {
  SINGLE_FAMILY = 'SINGLE_FAMILY',
  CONDO = 'CONDO',
  TOWNHOUSE = 'TOWNHOUSE',
  MULTI_FAMILY = 'MULTI_FAMILY',
  COMMERCIAL = 'COMMERCIAL',
  LAND = 'LAND',
  MANUFACTURED = 'MANUFACTURED',
  OTHER = 'OTHER',
}

export enum StatusCategory {
  ORDER_STATUS = 'ORDER_STATUS',
  DOCUMENT_STATUS = 'DOCUMENT_STATUS',
  TASK_STATUS = 'TASK_STATUS',
  APPROVAL_STATUS = 'APPROVAL_STATUS',
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class SoftProAPIError extends Error {
  constructor(
    public statusCode: number,
    public errorCode: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SoftProAPIError';
  }
}

export class AuthenticationError extends SoftProAPIError {
  constructor(message: string, details?: any) {
    super(401, 'AUTHENTICATION_ERROR', message, details);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends SoftProAPIError {
  constructor(
    message: string,
    public retryAfter?: number,
    details?: any
  ) {
    super(429, 'RATE_LIMIT_ERROR', message, details);
    this.name = 'RateLimitError';
  }
}

export class ValidationError extends SoftProAPIError {
  constructor(message: string, public validationErrors?: any[], details?: any) {
    super(400, 'VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}

export class ConflictError extends SoftProAPIError {
  constructor(
    message: string,
    public localData?: any,
    public remoteData?: any,
    details?: any
  ) {
    super(409, 'CONFLICT_ERROR', message, details);
    this.name = 'ConflictError';
  }
}

export class NetworkError extends SoftProAPIError {
  constructor(message: string, details?: any) {
    super(503, 'NETWORK_ERROR', message, details);
    this.name = 'NetworkError';
  }
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Paginated Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

/**
 * API Response Wrapper
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: Date;
    requestId: string;
  };
}
