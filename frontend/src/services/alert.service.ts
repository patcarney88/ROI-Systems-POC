/**
 * Alert API Service
 * Handles all HTTP requests to the Alert API backend
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  Alert,
  AlertFilters,
  AlertListResponse,
  AlertSortBy,
  AlertStatistics,
  AlertStatus,
  Agent,
  OutcomeFormData,
  AlertOutcomeDetails
} from '../types/alert.types';

/**
 * API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const API_VERSION = '/api/v1';

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: `${API_BASE_URL}${API_VERSION}`,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor for authentication
  client.interceptors.request.use(
    (config) => {
      // Add authentication token if available
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response) {
        // Server responded with error status
        console.error('API Error:', error.response.status, error.response.data);

        if (error.response.status === 401) {
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
      } else if (error.request) {
        // Request made but no response received
        console.error('Network Error:', error.message);
      } else {
        // Something else happened
        console.error('Request Error:', error.message);
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Alert Service Class
 */
class AlertService {
  /**
   * Get alerts for a specific user
   */
  async getUserAlerts(
    userId: string,
    filters?: AlertFilters,
    sortBy: AlertSortBy = AlertSortBy.DATE_NEW,
    page: number = 1,
    limit: number = 20
  ): Promise<AlertListResponse> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortBy
      });

      // Add filters to params
      if (filters) {
        if (filters.types && filters.types.length > 0) {
          params.append('types', filters.types.join(','));
        }
        if (filters.priorities && filters.priorities.length > 0) {
          params.append('priorities', filters.priorities.join(','));
        }
        if (filters.statuses && filters.statuses.length > 0) {
          params.append('statuses', filters.statuses.join(','));
        }
        if (filters.dateFrom) {
          params.append('dateFrom', filters.dateFrom);
        }
        if (filters.dateTo) {
          params.append('dateTo', filters.dateTo);
        }
        if (filters.confidenceMin !== undefined) {
          params.append('confidenceMin', filters.confidenceMin.toString());
        }
        if (filters.confidenceMax !== undefined) {
          params.append('confidenceMax', filters.confidenceMax.toString());
        }
        if (filters.assignedAgentId) {
          params.append('assignedAgentId', filters.assignedAgentId);
        }
        if (filters.searchQuery) {
          params.append('search', filters.searchQuery);
        }
      }

      const response = await apiClient.get<AlertListResponse>(
        `/alerts/user/${userId}?${params.toString()}`
      );

      return response.data;
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      throw error;
    }
  }

  /**
   * Get a single alert by ID
   */
  async getAlertById(alertId: string): Promise<Alert> {
    try {
      const response = await apiClient.get<Alert>(`/alerts/${alertId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alert:', error);
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: AlertStatus,
    notes?: string
  ): Promise<Alert> {
    try {
      const response = await apiClient.patch<Alert>(`/alerts/${alertId}/status`, {
        status,
        notes
      });
      return response.data;
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string): Promise<Alert> {
    return this.updateAlertStatus(alertId, AlertStatus.ACKNOWLEDGED);
  }

  /**
   * Mark alert as contacted
   */
  async markAsContacted(alertId: string, contactMethod?: string): Promise<Alert> {
    return this.updateAlertStatus(
      alertId,
      AlertStatus.CONTACTED,
      contactMethod ? `Contacted via ${contactMethod}` : undefined
    );
  }

  /**
   * Dismiss alert
   */
  async dismissAlert(alertId: string, reason?: string): Promise<Alert> {
    return this.updateAlertStatus(alertId, AlertStatus.DISMISSED, reason);
  }

  /**
   * Record alert outcome
   */
  async recordOutcome(
    alertId: string,
    outcomeData: OutcomeFormData
  ): Promise<Alert> {
    try {
      const response = await apiClient.post<Alert>(
        `/alerts/${alertId}/outcome`,
        outcomeData
      );
      return response.data;
    } catch (error) {
      console.error('Error recording alert outcome:', error);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getStatistics(
    filters?: AlertFilters,
    dateRange?: { from: string; to: string }
  ): Promise<AlertStatistics> {
    try {
      const params = new URLSearchParams();

      if (dateRange) {
        params.append('dateFrom', dateRange.from);
        params.append('dateTo', dateRange.to);
      }

      const response = await apiClient.get<AlertStatistics>(
        `/alerts/stats?${params.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching alert statistics:', error);
      throw error;
    }
  }

  /**
   * Get available agents for assignment
   */
  async getAvailableAgents(): Promise<Agent[]> {
    try {
      const response = await apiClient.get<Agent[]>('/alerts/routing/agents');
      return response.data;
    } catch (error) {
      console.error('Error fetching available agents:', error);
      throw error;
    }
  }

  /**
   * Assign alert to agent
   */
  async assignAlert(
    alertId: string,
    agentId: string,
    reason?: string
  ): Promise<Alert> {
    try {
      const response = await apiClient.post<Alert>('/alerts/routing/assign', {
        alertId,
        agentId,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning alert:', error);
      throw error;
    }
  }

  /**
   * Bulk update alert statuses
   */
  async bulkUpdateStatus(
    alertIds: string[],
    status: AlertStatus
  ): Promise<{ updated: number; alerts: Alert[] }> {
    try {
      const response = await apiClient.patch<{ updated: number; alerts: Alert[] }>(
        '/alerts/bulk/status',
        {
          alertIds,
          status
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk updating alerts:', error);
      throw error;
    }
  }

  /**
   * Bulk assign alerts
   */
  async bulkAssign(
    alertIds: string[],
    agentId: string
  ): Promise<{ assigned: number; alerts: Alert[] }> {
    try {
      const response = await apiClient.post<{ assigned: number; alerts: Alert[] }>(
        '/alerts/bulk/assign',
        {
          alertIds,
          agentId
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk assigning alerts:', error);
      throw error;
    }
  }

  /**
   * Bulk dismiss alerts
   */
  async bulkDismiss(
    alertIds: string[],
    reason?: string
  ): Promise<{ dismissed: number }> {
    try {
      const response = await apiClient.post<{ dismissed: number }>(
        '/alerts/bulk/dismiss',
        {
          alertIds,
          reason
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error bulk dismissing alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert activity timeline
   */
  async getAlertTimeline(alertId: string): Promise<any[]> {
    try {
      const response = await apiClient.get(`/alerts/${alertId}/timeline`);
      return response.data;
    } catch (error) {
      console.error('Error fetching alert timeline:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const alertService = new AlertService();

// Export class for testing
export default AlertService;
