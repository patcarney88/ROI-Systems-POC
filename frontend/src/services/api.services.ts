/**
 * API Services
 * Resource-specific API methods
 * Team Echo: Frontend Integration
 */

import { apiClient, ApiResponse, PaginatedResponse } from './api.client';

// Type Definitions
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
}

export interface Document {
  id: string;
  userId: string;
  clientId?: string;
  title: string;
  type: string;
  status: string;
  fileUrl: string;
  size: number;
  uploadDate: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  propertyCount: number;
  lastContact: string;
  engagementScore: number;
  status: string;
  notes?: string;
}

export interface Campaign {
  id: string;
  userId: string;
  name: string;
  subject: string;
  template: string;
  recipients: string[];
  schedule: string;
  scheduleDate?: string;
  message?: string;
  status: string;
  sentAt?: string;
  stats: {
    sent: number;
    opened: number;
    clicked: number;
    bounced: number;
  };
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/auth/login', { email, password });
  },

  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<ApiResponse<{ token: string; user: User }>> => {
    return apiClient.post('/auth/register', data);
  },

  logout: async (): Promise<ApiResponse> => {
    return apiClient.post('/auth/logout');
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ token: string }>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },

  getProfile: async (): Promise<ApiResponse<{ user: User }>> => {
    return apiClient.get('/auth/profile');
  },
};

// Document API
export const documentApi = {
  upload: async (file: File, data?: {
    clientId?: string;
    title?: string;
    type?: string;
    expiryDate?: string;
    metadata?: Record<string, any>;
  }): Promise<ApiResponse<{ document: Document }>> => {
    return apiClient.uploadFile('/documents', file, data);
  },

  getAll: async (params?: {
    status?: string;
    type?: string;
    clientId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<{ documents: Document[]; pagination: any }>> => {
    return apiClient.get('/documents', { params });
  },

  getById: async (id: string): Promise<ApiResponse<{ document: Document }>> => {
    return apiClient.get(`/documents/${id}`);
  },

  update: async (id: string, data: Partial<Document>): Promise<ApiResponse<{ document: Document }>> => {
    return apiClient.put(`/documents/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/documents/${id}`);
  },

  getStats: async (): Promise<ApiResponse<{ stats: any }>> => {
    return apiClient.get('/documents/stats');
  },
};

// Client API
export const clientApi = {
  create: async (data: {
    name: string;
    email: string;
    phone?: string;
    propertyCount?: number;
    status?: string;
    notes?: string;
  }): Promise<ApiResponse<{ client: Client }>> => {
    return apiClient.post('/clients', data);
  },

  getAll: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ clients: Client[]; pagination: any }>> => {
    return apiClient.get('/clients', { params });
  },

  getById: async (id: string): Promise<ApiResponse<{ client: Client }>> => {
    return apiClient.get(`/clients/${id}`);
  },

  update: async (id: string, data: Partial<Client>): Promise<ApiResponse<{ client: Client }>> => {
    return apiClient.put(`/clients/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/clients/${id}`);
  },

  getStats: async (): Promise<ApiResponse<{ stats: any }>> => {
    return apiClient.get('/clients/stats');
  },
};

// Campaign API
export const campaignApi = {
  create: async (data: {
    name: string;
    subject: string;
    template: string;
    recipients: string[];
    schedule: string;
    scheduleDate?: string;
    message?: string;
  }): Promise<ApiResponse<{ campaign: Campaign }>> => {
    return apiClient.post('/campaigns', data);
  },

  getAll: async (params?: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ApiResponse<{ campaigns: Campaign[]; pagination: any }>> => {
    return apiClient.get('/campaigns', { params });
  },

  getById: async (id: string): Promise<ApiResponse<{ campaign: Campaign }>> => {
    return apiClient.get(`/campaigns/${id}`);
  },

  update: async (id: string, data: Partial<Campaign>): Promise<ApiResponse<{ campaign: Campaign }>> => {
    return apiClient.put(`/campaigns/${id}`, data);
  },

  delete: async (id: string): Promise<ApiResponse> => {
    return apiClient.delete(`/campaigns/${id}`);
  },

  send: async (id: string): Promise<ApiResponse<{ campaign: Campaign; message: string }>> => {
    return apiClient.post(`/campaigns/${id}/send`);
  },

  getStats: async (id: string): Promise<ApiResponse<{ stats: any }>> => {
    return apiClient.get(`/campaigns/${id}/stats`);
  },

  getAllStats: async (): Promise<ApiResponse<{ total: number; byStatus: any; aggregateStats: any }>> => {
    return apiClient.get('/campaigns/stats');
  },
};

// Export all APIs
export default {
  auth: authApi,
  documents: documentApi,
  clients: clientApi,
  campaigns: campaignApi,
};
