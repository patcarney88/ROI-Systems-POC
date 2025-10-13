export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'agent' | 'client';
  agencyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  type: 'Purchase Agreement' | 'Title Deed' | 'Inspection Report' | 'Mortgage Document' | 'Disclosure Form' | 'Listing Agreement' | 'Rental Agreement' | 'Escrow Document';
  status: 'pending' | 'active' | 'expiring' | 'expired';
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadDate: Date;
  expiryDate?: Date;
  metadata?: DocumentMetadata;
  aiAnalysis?: AIAnalysis;
}

export interface DocumentMetadata {
  client: string;
  propertyAddress?: string;
  parties?: string[];
  keyDates?: {
    signingDate?: Date;
    effectiveDate?: Date;
    expiryDate?: Date;
  };
  financialDetails?: {
    purchasePrice?: number;
    downPayment?: number;
    loanAmount?: number;
  };
}

export interface AIAnalysis {
  summary: string;
  keyTerms: string[];
  importantDates: Date[];
  parties: string[];
  riskFactors: string[];
  actionItems: string[];
  confidence: number;
}

export interface Client {
  id: string;
  userId: string; // agent who owns this client
  name: string;
  email: string;
  phone: string;
  propertyCount: number;
  lastContact: Date;
  engagementScore: number;
  status: 'active' | 'at-risk' | 'dormant';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  template: string;
  recipients: 'all' | 'active' | 'at-risk' | 'dormant' | 'recent';
  schedule: 'now' | 'scheduled';
  scheduleDate?: Date;
  message: string;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sentAt?: Date;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  userId: string;
  clientId?: string;
  documentId?: string;
  type: 'expiry' | 'anniversary' | 'market_update' | 'custom';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'sent' | 'dismissed';
  scheduledFor: Date;
  sentAt?: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}
