/**
 * AlertDetailModal Component
 * Detailed view of alert with full information and actions
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Divider,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Grid2 as Grid,
  Paper
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  Home as HomeIcon,
  AssignmentInd as AssignIcon,
  CheckCircle as CheckIcon
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import type {
  Alert,
  AlertPriority,
  AlertStatus,
  AlertOutcome,
  Agent,
  OutcomeFormData
} from '../types/alert.types';

/**
 * Tab Panel Component
 */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

/**
 * AlertDetailModal Props
 */
interface AlertDetailModalProps {
  alert: Alert | null;
  open: boolean;
  agents?: Agent[];
  onClose: () => void;
  onCall?: (alertId: string) => void;
  onEmail?: (alertId: string) => void;
  onAddNote?: (alertId: string, note: string) => void;
  onRecordOutcome?: (alertId: string, outcome: OutcomeFormData) => void;
  onReassign?: (alertId: string, agentId: string) => void;
}

/**
 * Priority and type colors
 */
const priorityColors: Record<AlertPriority, string> = {
  [AlertPriority.CRITICAL]: '#f44336',
  [AlertPriority.HIGH]: '#ff9800',
  [AlertPriority.MEDIUM]: '#2196f3',
  [AlertPriority.LOW]: '#9e9e9e'
};

const getConfidenceColor = (score: number): string => {
  if (score >= 80) return '#4caf50';
  if (score >= 60) return '#ffeb3b';
  if (score >= 40) return '#ff9800';
  return '#f44336';
};

/**
 * AlertDetailModal Component
 */
export const AlertDetailModal: React.FC<AlertDetailModalProps> = ({
  alert,
  open,
  agents = [],
  onClose,
  onCall,
  onEmail,
  onAddNote,
  onRecordOutcome,
  onReassign
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [note, setNote] = useState('');
  const [outcomeForm, setOutcomeForm] = useState<OutcomeFormData>({
    outcome: AlertOutcome.PENDING,
    converted: false,
    contactMethods: [],
    notes: ''
  });
  const [selectedAgent, setSelectedAgent] = useState('');

  if (!alert) return null;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleAddNote = () => {
    if (note.trim() && onAddNote) {
      onAddNote(alert.id, note.trim());
      setNote('');
    }
  };

  const handleRecordOutcome = () => {
    if (onRecordOutcome) {
      onRecordOutcome(alert.id, outcomeForm);
      // Reset form
      setOutcomeForm({
        outcome: AlertOutcome.PENDING,
        converted: false,
        contactMethods: [],
        notes: ''
      });
    }
  };

  const handleReassign = () => {
    if (selectedAgent && onReassign) {
      onReassign(alert.id, selectedAgent);
      setSelectedAgent('');
    }
  };

  const handleContactMethodToggle = (method: string) => {
    const methods = outcomeForm.contactMethods.includes(method)
      ? outcomeForm.contactMethods.filter((m) => m !== method)
      : [...outcomeForm.contactMethods, method];

    setOutcomeForm({ ...outcomeForm, contactMethods: methods });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* Dialog Title */}
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h5" fontWeight="bold">
              Alert Details
            </Typography>
            <Chip
              label={alert.priority}
              size="small"
              sx={{
                backgroundColor: priorityColors[alert.priority],
                color: 'white',
                fontWeight: 'bold'
              }}
            />
            <Chip
              label={alert.status}
              size="small"
              color={alert.status === AlertStatus.CONVERTED ? 'success' : 'default'}
            />
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {/* Dialog Content */}
      <DialogContent dividers>
        {/* Header Info */}
        <Box mb={3}>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Avatar
              sx={{
                bgcolor: priorityColors[alert.priority],
                width: 64,
                height: 64
              }}
            >
              {alert.user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box flex={1}>
              <Typography variant="h6" fontWeight="bold">
                {alert.user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {alert.type.replace(/_/g, ' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Created {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>

          {/* Confidence Score */}
          <Box>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" fontWeight="bold">
                Confidence Score
              </Typography>
              <Typography
                variant="body2"
                fontWeight="bold"
                sx={{ color: getConfidenceColor(alert.confidenceScore) }}
              >
                {alert.confidenceScore}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={alert.confidenceScore}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: '#e0e0e0',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: getConfidenceColor(alert.confidenceScore),
                  borderRadius: 5
                }
              }}
            />
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label="Overview" />
            <Tab label="Signals" />
            <Tab label="Contact" />
            <Tab label="Actions" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            {/* User Information */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper elevation={1} sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={2}>
                  <PersonIcon color="primary" />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Contact Information
                  </Typography>
                </Box>
                <Typography variant="body2" gutterBottom>
                  <strong>Email:</strong> {alert.user.email}
                </Typography>
                {alert.user.phone && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Phone:</strong> {alert.user.phone}
                  </Typography>
                )}
                {alert.user.address && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Address:</strong> {alert.user.address}
                  </Typography>
                )}
                {alert.user.engagementScore !== undefined && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Engagement Score:</strong> {alert.user.engagementScore}
                  </Typography>
                )}
                {alert.user.lastContact && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Last Contact:</strong> {alert.user.lastContact}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Property Information */}
            {alert.property && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <HomeIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Property Details
                    </Typography>
                  </Box>
                  <Typography variant="body2" gutterBottom>
                    <strong>Address:</strong> {alert.property.address}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Type:</strong> {alert.property.propertyType}
                  </Typography>
                  {alert.property.estimatedValue && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Est. Value:</strong> ${alert.property.estimatedValue.toLocaleString()}
                    </Typography>
                  )}
                  {alert.property.currentEquity && (
                    <Typography variant="body2" gutterBottom>
                      <strong>Equity:</strong> ${alert.property.currentEquity.toLocaleString()}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            )}

            {/* Assignment */}
            {alert.assignment && (
              <Grid size={{ xs: 12 }}>
                <Paper elevation={1} sx={{ p: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <AssignIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight="bold">
                      Assignment
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    Assigned to <strong>{alert.assignment.agentName}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(alert.assignment.assignedAt), 'PPp')}
                  </Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </TabPanel>

        {/* Signals Tab */}
        <TabPanel value={activeTab} index={1}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Contributing Signals ({alert.signals.length})
          </Typography>
          <List>
            {alert.signals
              .sort((a, b) => b.strength - a.strength)
              .map((signal) => (
                <ListItem
                  key={signal.id}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight="bold">
                          {signal.name}
                        </Typography>
                        <Chip
                          label={`${signal.strength}% strength`}
                          size="small"
                          color={signal.strength >= 70 ? 'success' : 'default'}
                        />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {signal.description}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={signal.strength}
                          sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                      </>
                    }
                  />
                </ListItem>
              ))}
          </List>
        </TabPanel>

        {/* Contact Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box display="flex" gap={2} mb={3}>
            <Button
              variant="contained"
              startIcon={<PhoneIcon />}
              fullWidth
              onClick={() => onCall && onCall(alert.id)}
              disabled={!alert.user.phone}
            >
              Call {alert.user.phone || 'N/A'}
            </Button>
            <Button
              variant="contained"
              startIcon={<EmailIcon />}
              fullWidth
              onClick={() => onEmail && onEmail(alert.id)}
            >
              Email {alert.user.email}
            </Button>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Add Note
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Add notes about this contact..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            variant="outlined"
            onClick={handleAddNote}
            disabled={!note.trim()}
            sx={{ mt: 2 }}
          >
            Add Note
          </Button>
        </TabPanel>

        {/* Actions Tab */}
        <TabPanel value={activeTab} index={3}>
          {/* Record Outcome */}
          <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Record Outcome
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Outcome</InputLabel>
              <Select
                value={outcomeForm.outcome}
                onChange={(e: SelectChangeEvent) =>
                  setOutcomeForm({
                    ...outcomeForm,
                    outcome: e.target.value as AlertOutcome
                  })
                }
              >
                {Object.values(AlertOutcome).map((outcome) => (
                  <MenuItem key={outcome} value={outcome}>
                    {outcome.replace(/_/g, ' ')}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  checked={outcomeForm.converted}
                  onChange={(e) =>
                    setOutcomeForm({ ...outcomeForm, converted: e.target.checked })
                  }
                />
              }
              label="Converted"
            />

            {outcomeForm.converted && (
              <>
                <TextField
                  fullWidth
                  type="number"
                  label="Conversion Value ($)"
                  value={outcomeForm.conversionValue || ''}
                  onChange={(e) =>
                    setOutcomeForm({
                      ...outcomeForm,
                      conversionValue: parseFloat(e.target.value)
                    })
                  }
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Conversion Type"
                  placeholder="e.g., Sale, Listing, Referral"
                  value={outcomeForm.conversionType || ''}
                  onChange={(e) =>
                    setOutcomeForm({ ...outcomeForm, conversionType: e.target.value })
                  }
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <Typography variant="body2" gutterBottom>
              Contact Methods:
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              {['Phone', 'Email', 'SMS', 'In-Person'].map((method) => (
                <Chip
                  key={method}
                  label={method}
                  onClick={() => handleContactMethodToggle(method)}
                  color={
                    outcomeForm.contactMethods.includes(method) ? 'primary' : 'default'
                  }
                  variant={
                    outcomeForm.contactMethods.includes(method) ? 'filled' : 'outlined'
                  }
                />
              ))}
            </Box>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={outcomeForm.notes || ''}
              onChange={(e) =>
                setOutcomeForm({ ...outcomeForm, notes: e.target.value })
              }
              sx={{ mb: 2 }}
            />

            <Button
              variant="contained"
              color="success"
              startIcon={<CheckIcon />}
              onClick={handleRecordOutcome}
              fullWidth
            >
              Record Outcome
            </Button>
          </Paper>

          {/* Reassign */}
          {agents.length > 0 && (
            <Paper elevation={1} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Reassign Alert
              </Typography>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Agent</InputLabel>
                <Select
                  value={selectedAgent}
                  onChange={(e: SelectChangeEvent) => setSelectedAgent(e.target.value)}
                >
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.activeAlerts} active alerts)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                startIcon={<AssignIcon />}
                onClick={handleReassign}
                disabled={!selectedAgent}
                fullWidth
              >
                Reassign to Agent
              </Button>
            </Paper>
          )}
        </TabPanel>
      </DialogContent>

      {/* Dialog Actions */}
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AlertDetailModal;
