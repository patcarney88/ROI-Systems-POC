import { sanitizeFormData, sanitizeErrorMessage } from '../utils/sanitize';

/**
 * API Service
 * Centralized API communication with built-in security features
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_VERSION = 'v1';

class ApiService {
  private csrfToken: string | null = null;
  private csrfTokenExpiry: number = 0;

  /**
   * Get base API URL
   */
  private getBaseUrl(): string {
    return `${API_URL}/api/${API_VERSION}`;
  }

  /**
   * Get authentication headers
   */
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    };

    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    return headers;
  }

  /**
   * Fetch and cache CSRF token
   */
  private async ensureCsrfToken(): Promise<void> {
    // Check if token is still valid (cache for 10 minutes)
    if (this.csrfToken && this.csrfTokenExpiry > Date.now()) {
      return;
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/auth/csrf-token`, {
        method: 'GET',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        this.csrfToken = data.csrfToken;
        this.csrfTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    const data = await response.json();

    if (!response.ok) {
      throw {
        status: response.status,
        code: data.error?.code || 'API_ERROR',
        message: data.error?.message || 'Request failed',
        details: data.error?.details
      };
    }

    return data;
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.getBaseUrl()}${endpoint}`);

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, params[key].toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make authenticated POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    // Ensure CSRF token for state-changing operations
    await this.ensureCsrfToken();

    // Sanitize input data
    const sanitizedData = data ? sanitizeFormData(data) : undefined;

    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: sanitizedData ? JSON.stringify(sanitizedData) : undefined
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make authenticated PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    // Ensure CSRF token for state-changing operations
    await this.ensureCsrfToken();

    // Sanitize input data
    const sanitizedData = data ? sanitizeFormData(data) : undefined;

    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      credentials: 'include',
      body: sanitizedData ? JSON.stringify(sanitizedData) : undefined
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    // Ensure CSRF token for state-changing operations
    await this.ensureCsrfToken();

    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      credentials: 'include'
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Upload file with authentication
   */
  async upload<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    // Ensure CSRF token for state-changing operations
    await this.ensureCsrfToken();

    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: HeadersInit = {};
    const token = localStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    const response = await fetch(`${this.getBaseUrl()}${endpoint}`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Clear cached CSRF token
   */
  clearCsrfToken(): void {
    this.csrfToken = null;
    this.csrfTokenExpiry = 0;
  }
}

// Create singleton instance
const apiService = new ApiService();

/**
 * Auth API endpoints
 */
export const authApi = {
  login: (credentials: any) => apiService.post('/auth/login', credentials),
  register: (data: any) => apiService.post('/auth/register', data),
  logout: () => apiService.post('/auth/logout'),
  refresh: (refreshToken: string) => apiService.post('/auth/refresh', { refreshToken }),
  getProfile: () => apiService.get('/auth/profile'),
  updateProfile: (data: any) => apiService.put('/auth/profile', data),
  forgotPassword: (email: string) => apiService.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiService.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) => apiService.post('/auth/verify-email', { token }),
  getCsrfToken: () => apiService.get('/auth/csrf-token')
};

/**
 * Documents API endpoints
 */
export const documentsApi = {
  getAll: (params?: any) => apiService.get('/documents', params),
  getById: (id: string) => apiService.get(`/documents/${id}`),
  create: (data: any) => apiService.post('/documents', data),
  update: (id: string, data: any) => apiService.put(`/documents/${id}`, data),
  delete: (id: string) => apiService.delete(`/documents/${id}`),
  upload: (file: File, metadata: any) => apiService.upload('/documents/upload', file, metadata),
  download: (id: string) => apiService.get(`/documents/${id}/download`)
};

/**
 * Clients API endpoints
 */
export const clientsApi = {
  getAll: (params?: any) => apiService.get('/clients', params),
  getById: (id: string) => apiService.get(`/clients/${id}`),
  create: (data: any) => apiService.post('/clients', data),
  update: (id: string, data: any) => apiService.put(`/clients/${id}`, data),
  delete: (id: string) => apiService.delete(`/clients/${id}`),
  getEngagement: (id: string) => apiService.get(`/clients/${id}/engagement`)
};

/**
 * Campaigns API endpoints
 */
export const campaignsApi = {
  getAll: (params?: any) => apiService.get('/campaigns', params),
  getById: (id: string) => apiService.get(`/campaigns/${id}`),
  create: (data: any) => apiService.post('/campaigns', data),
  update: (id: string, data: any) => apiService.put(`/campaigns/${id}`, data),
  delete: (id: string) => apiService.delete(`/campaigns/${id}`),
  launch: (id: string) => apiService.post(`/campaigns/${id}/launch`),
  pause: (id: string) => apiService.post(`/campaigns/${id}/pause`),
  getMetrics: (id: string) => apiService.get(`/campaigns/${id}/metrics`)
};

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
  getDashboard: () => apiService.get('/analytics/dashboard'),
  getMetrics: (params?: any) => apiService.get('/analytics/metrics', params),
  getReports: (type: string, params?: any) => apiService.get(`/analytics/reports/${type}`, params),
  exportReport: (type: string, format: string) =>
    apiService.get(`/analytics/export/${type}?format=${format}`)
};

/**
 * Error handler for API calls
 */
export const handleApiError = (error: any): string => {
  if (error.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
    return 'Session expired. Please login again.';
  }

  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }

  if (error.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return sanitizeErrorMessage(error.message || 'An unexpected error occurred');
};

export default apiService;