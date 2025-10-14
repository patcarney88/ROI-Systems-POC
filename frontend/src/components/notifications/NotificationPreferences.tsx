import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { NotificationPreferences as NotificationPrefs } from '../../types/notification.types';

interface NotificationPreferencesProps {
  preferences: NotificationPrefs | null;
  onSave: (preferences: Partial<NotificationPrefs>) => Promise<void>;
  loading?: boolean;
}

const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  preferences,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState<Partial<NotificationPrefs>>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preferences) {
      setFormData(preferences);
    }
  }, [preferences]);

  const handleToggle = (field: keyof NotificationPrefs) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleChange = (field: keyof NotificationPrefs, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await onSave(formData);
      setSuccess(true);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Preferences saved successfully
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Master Toggle */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.enabled || false}
                  onChange={() => handleToggle('enabled')}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle1">Enable Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Master switch for all notifications
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          {/* Notification Types */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Notification Types
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.businessAlerts || false}
                    onChange={() => handleToggle('businessAlerts')}
                    disabled={!formData.enabled}
                  />
                }
                label="Business Alerts"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.documentUpdates || false}
                    onChange={() => handleToggle('documentUpdates')}
                    disabled={!formData.enabled}
                  />
                }
                label="Document Updates"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.propertyValues || false}
                    onChange={() => handleToggle('propertyValues')}
                    disabled={!formData.enabled}
                  />
                }
                label="Property Values"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.marketReports || false}
                    onChange={() => handleToggle('marketReports')}
                    disabled={!formData.enabled}
                  />
                }
                label="Market Reports"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.maintenance || false}
                    onChange={() => handleToggle('maintenance')}
                    disabled={!formData.enabled}
                  />
                }
                label="Maintenance Reminders"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.marketing || false}
                    onChange={() => handleToggle('marketing')}
                    disabled={!formData.enabled}
                  />
                }
                label="Marketing & Promotions"
              />
            </FormGroup>
          </Box>

          <Divider />

          {/* Delivery Channels */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Delivery Channels
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.webPush || false}
                    onChange={() => handleToggle('webPush')}
                    disabled={!formData.enabled}
                  />
                }
                label="Push Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.email || false}
                    onChange={() => handleToggle('email')}
                    disabled={!formData.enabled}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sms || false}
                    onChange={() => handleToggle('sms')}
                    disabled={!formData.enabled}
                  />
                }
                label="SMS Notifications"
              />
            </FormGroup>
          </Box>

          <Divider />

          {/* Quiet Hours */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.quietHoursEnabled || false}
                  onChange={() => handleToggle('quietHoursEnabled')}
                  disabled={!formData.enabled}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Quiet Hours</Typography>
                  <Typography variant="caption" color="text.secondary">
                    No notifications during specified times
                  </Typography>
                </Box>
              }
            />

            {formData.quietHoursEnabled && (
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <TextField
                  label="Start Time"
                  type="time"
                  value={formData.quietHoursStart || '22:00'}
                  onChange={(e) => handleChange('quietHoursStart', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={!formData.enabled}
                />
                <TextField
                  label="End Time"
                  type="time"
                  value={formData.quietHoursEnd || '08:00'}
                  onChange={(e) => handleChange('quietHoursEnd', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  disabled={!formData.enabled}
                />
              </Box>
            )}
          </Box>

          <Divider />

          {/* Batch Notifications */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.batchNotifications || false}
                  onChange={() => handleToggle('batchNotifications')}
                  disabled={!formData.enabled}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Batch Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Group notifications together
                  </Typography>
                </Box>
              }
            />

            {formData.batchNotifications && (
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Batch Interval</InputLabel>
                <Select
                  value={formData.batchInterval || 60}
                  label="Batch Interval"
                  onChange={(e) => handleChange('batchInterval', e.target.value)}
                  disabled={!formData.enabled}
                >
                  <MenuItem value={15}>15 minutes</MenuItem>
                  <MenuItem value={30}>30 minutes</MenuItem>
                  <MenuItem value={60}>1 hour</MenuItem>
                  <MenuItem value={120}>2 hours</MenuItem>
                  <MenuItem value={240}>4 hours</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        </Stack>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !formData.enabled}
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferences;
