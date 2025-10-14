/**
 * AlertDashboard Page
 * Main dashboard for AI-powered business alerts
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Chip,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Snackbar,
  Alert as MuiAlert,
  CircularProgress,
  Tabs,
  Tab,
  Paper,
  Badge
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Refresh as RefreshIcon,
  GetApp as ExportIcon,
  CloudDone as CloudIcon,
  CloudOff as CloudOffIcon
} from '@mui/icons-material';
import { alertService } from '../services/alert.service';
import { useAlertWebSocket, ConnectionStatus } from '../hooks/useAlertWebSocket';
import AlertCard from '../components/AlertCard';
import AlertFilters from '../components/AlertFilters';
import AlertStats from '../components/AlertStats';
import AlertDetailModal from '../components/AlertDetailModal';
import type {
  Alert,
  AlertFilters as AlertFiltersType,
  AlertSortBy,
  AlertStatistics,
  AlertStatus,
  Agent,
  OutcomeFormData
} from '../types/alert.types';

/**
 * Mock user ID - Replace with actual authentication
 */
const MOCK_USER_ID = 'user-123';

/**
 * AlertDashboard Component
 */
export const AlertDashboard: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState(0);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [filters, setFilters] = useState<AlertFiltersType>({});
  const [sortBy, setSortBy] = useState<AlertSortBy>(AlertSortBy.DATE_NEW);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedAlerts, setSelectedAlerts] = useState<Set<string>>(new Set());
  const [detailModalAlert, setDetailModalAlert] = useState<Alert | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  /**
   * WebSocket connection
   */
  const {
    connectionStatus,
    isConnected,
    lastMessage
  } = useAlertWebSocket({
    userId: MOCK_USER_ID,
    enabled: true,
    onNewAlert: (alert) => {
      // Add new alert to top of list
      setAlerts((prev) => [alert, ...prev]);
      showSnackbar(
        `New ${alert.priority} priority alert: ${alert.user.name}`,
        'info'
      );
    },
    onAlertUpdated: (updatedData) => {
      // Update alert in list
      setAlerts((prev) =>
        prev.map((a) => (a.id === updatedData.id ? { ...a, ...updatedData } : a))
      );
    },
    showNotifications: true
  });

  /**
   * Load alerts
   */
  const loadAlerts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await alertService.getUserAlerts(
          MOCK_USER_ID,
          filters,
          sortBy,
          pageNum,
          20
        );

        if (append) {
          setAlerts((prev) => [...prev, ...response.alerts]);
        } else {
          setAlerts(response.alerts);
        }

        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } catch (error) {
        console.error('Error loading alerts:', error);
        showSnackbar('Failed to load alerts', 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [filters, sortBy]
  );

  /**
   * Load statistics
   */
  const loadStatistics = useCallback(async () => {
    try {
      const stats = await alertService.getStatistics(filters);
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
      showSnackbar('Failed to load statistics', 'error');
    }
  }, [filters]);

  /**
   * Load agents
   */
  const loadAgents = useCallback(async () => {
    try {
      const agentList = await alertService.getAvailableAgents();
      setAgents(agentList);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    loadAlerts(1, false);
    loadStatistics();
    loadAgents();
  }, [loadAlerts, loadStatistics, loadAgents]);

  /**
   * Show snackbar notification
   */
  const showSnackbar = (
    message: string,
    severity: 'success' | 'error' | 'info' | 'warning' = 'info'
  ) => {
    setSnackbar({ open: true, message, severity });
  };

  /**
   * Handle tab change
   */
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  /**
   * Handle sort change
   */
  const handleSortChange = (event: SelectChangeEvent<AlertSortBy>) => {
    setSortBy(event.target.value as AlertSortBy);
    loadAlerts(1, false);
  };

  /**
   * Handle filter change
   */
  const handleFiltersChange = (newFilters: AlertFiltersType) => {
    setFilters(newFilters);
    setPage(1);
  };

  /**
   * Handle load more
   */
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadAlerts(page + 1, true);
    }
  };

  /**
   * Handle alert selection
   */
  const handleAlertSelect = (alertId: string) => {
    const newSelected = new Set(selectedAlerts);
    if (newSelected.has(alertId)) {
      newSelected.delete(alertId);
    } else {
      newSelected.add(alertId);
    }
    setSelectedAlerts(newSelected);
  };

  /**
   * Handle select all
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedAlerts(new Set(alerts.map((a) => a.id)));
    } else {
      setSelectedAlerts(new Set());
    }
  };

  /**
   * Handle acknowledge alert
   */
  const handleAcknowledge = async (alertId: string) => {
    try {
      await alertService.acknowledgeAlert(alertId);
      loadAlerts(1, false);
      showSnackbar('Alert acknowledged', 'success');
    } catch (error) {
      showSnackbar('Failed to acknowledge alert', 'error');
    }
  };

  /**
   * Handle contact
   */
  const handleContact = async (alertId: string, method: 'phone' | 'email') => {
    try {
      await alertService.markAsContacted(alertId, method);
      loadAlerts(1, false);
      showSnackbar(`Contact initiated via ${method}`, 'success');

      // Open appropriate contact method
      const alert = alerts.find((a) => a.id === alertId);
      if (alert) {
        if (method === 'phone' && alert.user.phone) {
          window.location.href = `tel:${alert.user.phone}`;
        } else if (method === 'email') {
          window.location.href = `mailto:${alert.user.email}`;
        }
      }
    } catch (error) {
      showSnackbar('Failed to mark as contacted', 'error');
    }
  };

  /**
   * Handle dismiss alert
   */
  const handleDismiss = async (alertId: string) => {
    if (confirm('Are you sure you want to dismiss this alert?')) {
      try {
        await alertService.dismissAlert(alertId);
        loadAlerts(1, false);
        showSnackbar('Alert dismissed', 'success');
      } catch (error) {
        showSnackbar('Failed to dismiss alert', 'error');
      }
    }
  };

  /**
   * Handle assign alert
   */
  const handleAssign = (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setDetailModalAlert(alert);
    }
  };

  /**
   * Handle view details
   */
  const handleViewDetails = (alertId: string) => {
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setDetailModalAlert(alert);
    }
  };

  /**
   * Handle record outcome
   */
  const handleRecordOutcome = async (alertId: string, outcome: OutcomeFormData) => {
    try {
      await alertService.recordOutcome(alertId, outcome);
      loadAlerts(1, false);
      loadStatistics();
      setDetailModalAlert(null);
      showSnackbar('Outcome recorded successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to record outcome', 'error');
    }
  };

  /**
   * Handle reassign
   */
  const handleReassign = async (alertId: string, agentId: string) => {
    try {
      await alertService.assignAlert(alertId, agentId);
      loadAlerts(1, false);
      showSnackbar('Alert reassigned successfully', 'success');
    } catch (error) {
      showSnackbar('Failed to reassign alert', 'error');
    }
  };

  /**
   * Handle bulk actions
   */
  const handleBulkAcknowledge = async () => {
    try {
      await alertService.bulkUpdateStatus(
        Array.from(selectedAlerts),
        AlertStatus.ACKNOWLEDGED
      );
      loadAlerts(1, false);
      setSelectedAlerts(new Set());
      showSnackbar(`${selectedAlerts.size} alerts acknowledged`, 'success');
    } catch (error) {
      showSnackbar('Failed to acknowledge alerts', 'error');
    }
  };

  const handleBulkDismiss = async () => {
    if (confirm(`Dismiss ${selectedAlerts.size} alerts?`)) {
      try {
        await alertService.bulkDismiss(Array.from(selectedAlerts));
        loadAlerts(1, false);
        setSelectedAlerts(new Set());
        showSnackbar(`${selectedAlerts.size} alerts dismissed`, 'success');
      } catch (error) {
        showSnackbar('Failed to dismiss alerts', 'error');
      }
    }
  };

  /**
   * Handle export
   */
  const handleExport = () => {
    showSnackbar('Export functionality coming soon', 'info');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Alert Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-powered business opportunity alerts
          </Typography>
        </Box>
        <Box display="flex" gap={2} alignItems="center">
          {/* Connection Status */}
          <Chip
            icon={isConnected ? <CloudIcon /> : <CloudOffIcon />}
            label={
              connectionStatus === ConnectionStatus.CONNECTED
                ? 'Live'
                : connectionStatus === ConnectionStatus.CONNECTING
                ? 'Connecting...'
                : connectionStatus === ConnectionStatus.RECONNECTING
                ? 'Reconnecting...'
                : 'Offline'
            }
            color={isConnected ? 'success' : 'default'}
            size="small"
          />

          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadAlerts(1, false);
              loadStatistics();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab
            label={
              <Badge badgeContent={alerts.length} color="primary" max={999}>
                <span style={{ marginRight: '8px' }}>Alerts</span>
              </Badge>
            }
          />
          <Tab label="Statistics" />
        </Tabs>
      </Paper>

      {/* Alerts Tab */}
      {activeTab === 0 && (
        <>
          {/* Filters */}
          <AlertFilters
            filters={filters}
            agents={agents}
            onFiltersChange={handleFiltersChange}
          />

          {/* Controls */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box display="flex" gap={2} alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedAlerts.size === alerts.length && alerts.length > 0}
                    indeterminate={
                      selectedAlerts.size > 0 && selectedAlerts.size < alerts.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                }
                label={`${selectedAlerts.size} selected`}
              />

              {selectedAlerts.size > 0 && (
                <>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleBulkAcknowledge}
                  >
                    Acknowledge
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    onClick={handleBulkDismiss}
                  >
                    Dismiss
                  </Button>
                </>
              )}
            </Box>

            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select value={sortBy} onChange={handleSortChange}>
                <MenuItem value={AlertSortBy.DATE_NEW}>Newest First</MenuItem>
                <MenuItem value={AlertSortBy.DATE_OLD}>Oldest First</MenuItem>
                <MenuItem value={AlertSortBy.CONFIDENCE_HIGH}>
                  Highest Confidence
                </MenuItem>
                <MenuItem value={AlertSortBy.CONFIDENCE_LOW}>
                  Lowest Confidence
                </MenuItem>
                <MenuItem value={AlertSortBy.PRIORITY}>Priority</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Alert List */}
          {loading ? (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          ) : alerts.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">
                No alerts found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or check back later
              </Typography>
            </Paper>
          ) : (
            <>
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  selected={selectedAlerts.has(alert.id)}
                  onSelect={handleAlertSelect}
                  onAcknowledge={handleAcknowledge}
                  onContact={handleContact}
                  onDismiss={handleDismiss}
                  onAssign={handleAssign}
                  onViewDetails={handleViewDetails}
                />
              ))}

              {/* Load More */}
              {hasMore && (
                <Box display="flex" justifyContent="center" mt={3}>
                  <Button
                    variant="outlined"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </Button>
                </Box>
              )}
            </>
          )}
        </>
      )}

      {/* Statistics Tab */}
      {activeTab === 1 && (
        <>
          {statistics ? (
            <AlertStats statistics={statistics} loading={loading} />
          ) : (
            <Box display="flex" justifyContent="center" py={8}>
              <CircularProgress />
            </Box>
          )}
        </>
      )}

      {/* Detail Modal */}
      <AlertDetailModal
        alert={detailModalAlert}
        open={!!detailModalAlert}
        agents={agents}
        onClose={() => setDetailModalAlert(null)}
        onCall={(alertId) => handleContact(alertId, 'phone')}
        onEmail={(alertId) => handleContact(alertId, 'email')}
        onRecordOutcome={handleRecordOutcome}
        onReassign={handleReassign}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <MuiAlert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default AlertDashboard;
