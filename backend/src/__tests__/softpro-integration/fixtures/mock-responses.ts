/**
 * Mock SoftPro API Responses
 * Complete mock data for testing SoftPro 360 integration
 */

import {
  Transaction,
  Contact,
  Document,
  Party,
  Property,
  OrderType,
  TransactionStatus,
  ContactType,
  DocumentType,
  DocumentStatus,
  PartyType,
  PropertyType,
  EntityType,
} from '../../../types/softpro.types';

// ============================================================================
// MOCK TRANSACTIONS
// ============================================================================

export const mockTransaction: Transaction = {
  orderId: 'SP-12345',
  orderNumber: '2024-001234',
  orderType: OrderType.PURCHASE,
  status: TransactionStatus.IN_PROGRESS,

  propertyAddress: {
    streetAddress: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    county: 'San Francisco County',
    country: 'USA',
    apn: '1234-567-890',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  propertyType: PropertyType.SINGLE_FAMILY,

  purchasePrice: 850000,
  loanAmount: 680000,
  downPayment: 170000,
  closingCost: 25000,

  openedDate: new Date('2024-01-15T10:00:00Z'),
  estimatedClosingDate: new Date('2024-03-15T14:00:00Z'),

  buyer: [
    {
      partyId: 'P-001',
      partyType: PartyType.BUYER,
      contactId: 'C-001',
      ownershipPercentage: 100,
      isPrimary: true,
    },
  ],
  seller: [
    {
      partyId: 'P-002',
      partyType: PartyType.SELLER,
      contactId: 'C-002',
      ownershipPercentage: 100,
      isPrimary: true,
    },
  ],

  notes: 'Standard residential purchase transaction',
  customFields: {
    mlsNumber: 'MLS-789456',
    agentCommission: 5.0,
  },

  createdAt: new Date('2024-01-15T10:00:00Z'),
  updatedAt: new Date('2024-01-20T15:30:00Z'),
};

export const mockTransactionRefinance: Transaction = {
  ...mockTransaction,
  orderId: 'SP-12346',
  orderNumber: '2024-001235',
  orderType: OrderType.REFINANCE,
  status: TransactionStatus.PENDING_CLOSING,
  purchasePrice: 0,
  loanAmount: 600000,
  downPayment: 0,
  seller: undefined,
};

export const mockTransactionClosed: Transaction = {
  ...mockTransaction,
  orderId: 'SP-12347',
  orderNumber: '2024-001236',
  status: TransactionStatus.CLOSED,
  actualClosingDate: new Date('2024-03-15T14:00:00Z'),
};

// ============================================================================
// MOCK CONTACTS
// ============================================================================

export const mockContact: Contact = {
  contactId: 'C-001',
  contactType: ContactType.INDIVIDUAL,

  firstName: 'John',
  middleName: 'Michael',
  lastName: 'Doe',
  suffix: 'Jr.',

  email: 'john.doe@example.com',
  phone: '555-123-4567',
  mobilePhone: '555-987-6543',
  fax: '555-123-4568',

  address: {
    streetAddress: '456 Oak Ave',
    streetAddress2: 'Apt 2B',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94103',
    county: 'San Francisco County',
    country: 'USA',
  },

  company: 'Doe Enterprises',
  jobTitle: 'CEO',

  notes: 'Preferred communication via email',
  customFields: {
    referralSource: 'Agent Referral',
    vip: true,
  },

  createdAt: new Date('2024-01-10T09:00:00Z'),
  updatedAt: new Date('2024-01-20T10:00:00Z'),
};

export const mockContactAgent: Contact = {
  contactId: 'C-003',
  contactType: ContactType.REAL_ESTATE_AGENT,
  firstName: 'Sarah',
  lastName: 'Johnson',
  email: 'sarah.johnson@realty.com',
  phone: '555-111-2222',
  company: 'Premium Realty',
  jobTitle: 'Senior Real Estate Agent',
  createdAt: new Date('2024-01-05T08:00:00Z'),
  updatedAt: new Date('2024-01-05T08:00:00Z'),
};

export const mockContactLender: Contact = {
  contactId: 'C-004',
  contactType: ContactType.LENDER,
  firstName: 'Michael',
  lastName: 'Smith',
  email: 'msmith@bankcorp.com',
  phone: '555-333-4444',
  company: 'Bank Corp',
  jobTitle: 'Loan Officer',
  createdAt: new Date('2024-01-08T11:00:00Z'),
  updatedAt: new Date('2024-01-08T11:00:00Z'),
};

// ============================================================================
// MOCK DOCUMENTS
// ============================================================================

export const mockDocument: Document = {
  documentId: 'D-001',
  orderId: 'SP-12345',

  documentName: 'Purchase Agreement',
  documentType: DocumentType.PURCHASE_AGREEMENT,
  category: 'Contracts',

  fileName: 'purchase-agreement-2024-001234.pdf',
  fileSize: 1024000,
  mimeType: 'application/pdf',
  fileUrl: 'https://softpro-docs.example.com/docs/D-001/purchase-agreement.pdf',

  status: DocumentStatus.APPROVED,

  version: 1,
  versionNotes: 'Initial version',

  description: 'Signed purchase agreement between buyer and seller',
  tags: ['contract', 'signed', 'final'],
  customFields: {
    signedDate: '2024-01-20',
    witnessName: 'Jane Witness',
  },

  uploadedAt: new Date('2024-01-20T16:00:00Z'),
  lastModifiedAt: new Date('2024-01-20T16:00:00Z'),
};

export const mockDocumentTitle: Document = {
  documentId: 'D-002',
  orderId: 'SP-12345',
  documentName: 'Title Commitment',
  documentType: DocumentType.TITLE_COMMITMENT,
  category: 'Title',
  fileName: 'title-commitment.pdf',
  fileSize: 512000,
  mimeType: 'application/pdf',
  status: DocumentStatus.PENDING_REVIEW,
  version: 1,
  uploadedAt: new Date('2024-01-25T10:00:00Z'),
  lastModifiedAt: new Date('2024-01-25T10:00:00Z'),
};

export const mockDocumentInspection: Document = {
  documentId: 'D-003',
  orderId: 'SP-12345',
  documentName: 'Home Inspection Report',
  documentType: DocumentType.INSPECTION_REPORT,
  category: 'Inspections',
  fileName: 'home-inspection.pdf',
  fileSize: 2048000,
  mimeType: 'application/pdf',
  status: DocumentStatus.APPROVED,
  version: 1,
  uploadedAt: new Date('2024-02-01T14:00:00Z'),
  lastModifiedAt: new Date('2024-02-01T14:00:00Z'),
};

// ============================================================================
// MOCK PARTIES
// ============================================================================

export const mockPartyBuyer: Party = {
  partyId: 'P-001',
  partyType: PartyType.BUYER,
  contactId: 'C-001',
  ownershipPercentage: 100,
  isPrimary: true,
  notes: 'First-time home buyer',
  customFields: {
    financingApproved: true,
    preApprovalAmount: 900000,
  },
};

export const mockPartySeller: Party = {
  partyId: 'P-002',
  partyType: PartyType.SELLER,
  contactId: 'C-002',
  ownershipPercentage: 100,
  isPrimary: true,
  notes: 'Selling to relocate',
};

export const mockPartyLenderEntity: Party = {
  partyId: 'P-003',
  partyType: PartyType.LENDER,
  entityName: 'Bank Corp',
  entityType: EntityType.CORPORATION,
  isPrimary: true,
};

// ============================================================================
// MOCK PROPERTIES
// ============================================================================

export const mockProperty: Property = {
  propertyId: 'PROP-001',
  orderId: 'SP-12345',

  address: {
    streetAddress: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    county: 'San Francisco County',
    country: 'USA',
    apn: '1234-567-890',
    coordinates: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
  },
  propertyType: PropertyType.SINGLE_FAMILY,

  legalDescription:
    'Lot 5, Block 12, Mission District Subdivision, as recorded in Book 45, Page 67 of Official Records',
  parcelNumber: '1234-567-890',
  lotNumber: '5',
  block: '12',
  subdivision: 'Mission District Subdivision',

  yearBuilt: 1985,
  squareFootage: 2400,
  bedrooms: 4,
  bathrooms: 2.5,

  zoning: 'R-2',
  currentUse: 'Single Family Residence',

  customFields: {
    poolPresent: false,
    garageSpaces: 2,
    renovationYear: 2010,
  },
};

// ============================================================================
// MOCK API RESPONSES
// ============================================================================

export const mockTransactionListResponse = {
  data: [mockTransaction, mockTransactionRefinance, mockTransactionClosed],
  pagination: {
    total: 3,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
};

export const mockContactListResponse = {
  data: [mockContact, mockContactAgent, mockContactLender],
  pagination: {
    total: 3,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
};

export const mockDocumentListResponse = {
  data: [mockDocument, mockDocumentTitle, mockDocumentInspection],
  pagination: {
    total: 3,
    limit: 50,
    offset: 0,
    hasMore: false,
  },
};

// ============================================================================
// MOCK ERROR RESPONSES
// ============================================================================

export const mockErrorUnauthorized = {
  error: {
    code: 'UNAUTHORIZED',
    message: 'Invalid or expired access token',
    details: {
      tokenExpired: true,
    },
  },
  meta: {
    timestamp: new Date(),
    requestId: 'req_error_001',
  },
};

export const mockErrorRateLimit = {
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests. Please try again later.',
    details: {
      retryAfter: 60,
      limit: 100,
      remaining: 0,
    },
  },
  meta: {
    timestamp: new Date(),
    requestId: 'req_error_002',
  },
};

export const mockErrorValidation = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed',
    details: {
      errors: [
        {
          field: 'propertyAddress.zipCode',
          message: 'Invalid zip code format',
        },
        {
          field: 'purchasePrice',
          message: 'Purchase price must be greater than 0',
        },
      ],
    },
  },
  meta: {
    timestamp: new Date(),
    requestId: 'req_error_003',
  },
};

export const mockErrorNotFound = {
  error: {
    code: 'NOT_FOUND',
    message: 'Transaction not found',
    details: {
      orderId: 'SP-99999',
    },
  },
  meta: {
    timestamp: new Date(),
    requestId: 'req_error_004',
  },
};

// ============================================================================
// MOCK OAUTH RESPONSES
// ============================================================================

export const mockOAuthTokenResponse = {
  access_token: 'mock_access_token_1234567890abcdef',
  refresh_token: 'mock_refresh_token_abcdef1234567890',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read write',
};

export const mockOAuthRefreshResponse = {
  access_token: 'mock_new_access_token_0987654321fedcba',
  refresh_token: 'mock_new_refresh_token_fedcba0987654321',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read write',
};

export const mockOAuthErrorResponse = {
  error: 'invalid_grant',
  error_description: 'The provided authorization code is invalid or expired',
};

// ============================================================================
// EXPORT ALL MOCKS
// ============================================================================

export const mockResponses = {
  transaction: mockTransaction,
  transactionRefinance: mockTransactionRefinance,
  transactionClosed: mockTransactionClosed,
  contact: mockContact,
  contactAgent: mockContactAgent,
  contactLender: mockContactLender,
  document: mockDocument,
  documentTitle: mockDocumentTitle,
  documentInspection: mockDocumentInspection,
  party: mockPartyBuyer,
  property: mockProperty,
  transactionList: mockTransactionListResponse,
  contactList: mockContactListResponse,
  documentList: mockDocumentListResponse,
  oauthToken: mockOAuthTokenResponse,
  oauthRefresh: mockOAuthRefreshResponse,
  errors: {
    unauthorized: mockErrorUnauthorized,
    rateLimit: mockErrorRateLimit,
    validation: mockErrorValidation,
    notFound: mockErrorNotFound,
    oauth: mockOAuthErrorResponse,
  },
};
