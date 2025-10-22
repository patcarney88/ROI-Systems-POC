/**
 * API Service Tests
 * Basic tests to verify API setup and integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api } from '../api';
import { apiClient } from '../api.client';

// Mock apiClient
vi.mock('../api.client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    uploadFile: vi.fn(),
  },
  TokenManager: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication API', () => {
    it('should call login endpoint', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com' },
          tokens: { accessToken: 'token', refreshToken: 'refresh' },
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await api.auth.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call logout endpoint', async () => {
      const mockResponse = { success: true };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      await api.auth.logout();

      expect(apiClient.post).toHaveBeenCalledWith('/auth/logout');
    });

    it('should call profile endpoint', async () => {
      const mockResponse = {
        success: true,
        data: { user: { id: '1', email: 'test@example.com' } },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await api.auth.getProfile();

      expect(apiClient.get).toHaveBeenCalledWith('/auth/profile');
    });
  });

  describe('Document API', () => {
    it('should list documents', async () => {
      const mockResponse = {
        success: true,
        data: {
          documents: [{ id: '1', name: 'Test Doc' }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await api.documents.list({ type: 'Deed' });

      expect(apiClient.get).toHaveBeenCalledWith('/documents', {
        params: { type: 'Deed' },
      });
    });

    it('should upload document', async () => {
      const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
      const mockResponse = {
        success: true,
        data: { document: { id: '1', name: 'test.pdf' } },
      };
      vi.mocked(apiClient.uploadFile).mockResolvedValue(mockResponse);

      await api.documents.upload({ file: mockFile, type: 'Deed' });

      expect(apiClient.uploadFile).toHaveBeenCalledWith(
        '/documents',
        mockFile,
        { type: 'Deed' }
      );
    });

    it('should delete document', async () => {
      const mockResponse = { success: true };
      vi.mocked(apiClient.delete).mockResolvedValue(mockResponse);

      await api.documents.delete('doc-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/documents/doc-123');
    });
  });

  describe('Client API', () => {
    it('should list clients', async () => {
      const mockResponse = {
        success: true,
        data: {
          clients: [{ id: '1', name: 'Test Client' }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await api.clients.list({ status: 'active' });

      expect(apiClient.get).toHaveBeenCalledWith('/clients', {
        params: { status: 'active' },
      });
    });

    it('should create client', async () => {
      const mockResponse = {
        success: true,
        data: { client: { id: '1', name: 'New Client' } },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      await api.clients.create({
        name: 'New Client',
        email: 'client@example.com',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/clients', {
        name: 'New Client',
        email: 'client@example.com',
      });
    });

    it('should update client', async () => {
      const mockResponse = {
        success: true,
        data: { client: { id: '1', status: 'inactive' } },
      };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      await api.clients.update('client-123', { status: 'inactive' });

      expect(apiClient.put).toHaveBeenCalledWith('/clients/client-123', {
        status: 'inactive',
      });
    });
  });

  describe('Campaign API', () => {
    it('should list campaigns', async () => {
      const mockResponse = {
        success: true,
        data: {
          campaigns: [{ id: '1', name: 'Test Campaign' }],
          pagination: { page: 1, limit: 20, total: 1, pages: 1 },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await api.campaigns.list();

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns', { params: undefined });
    });

    it('should send campaign', async () => {
      const mockResponse = {
        success: true,
        data: { campaign: { id: '1' }, message: 'Sent', recipientCount: 10 },
      };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      await api.campaigns.send('campaign-123');

      expect(apiClient.post).toHaveBeenCalledWith('/campaigns/campaign-123/send', undefined);
    });
  });

  describe('Analytics API', () => {
    it('should get dashboard metrics', async () => {
      const mockResponse = {
        success: true,
        data: {
          documents: { total: 100 },
          clients: { total: 50 },
          campaigns: { total: 20 },
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await api.analytics.getDashboard({ period: 'month' });

      expect(apiClient.get).toHaveBeenCalledWith('/analytics/dashboard', {
        params: { period: 'month' },
      });
    });
  });

  describe('Search API', () => {
    it('should perform global search', async () => {
      const mockResponse = {
        success: true,
        data: {
          documents: [],
          clients: [],
          campaigns: [],
          transactions: [],
          total: 0,
        },
      };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      await api.search.global({ query: 'test' });

      expect(apiClient.get).toHaveBeenCalledWith('/search', {
        params: { query: 'test' },
      });
    });
  });
});
