/**
 * AlertFilters Component
 * Advanced filtering controls for alert dashboard
 */

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  Slider,
  TextField,
  Button,
  Chip,
  Collapse,
  IconButton
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Save as SaveIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon
} from '@mui/icons-material';
import type {
  AlertFilters as AlertFiltersType,
  AlertType,
  AlertPriority,
  AlertStatus,
  Agent
} from '../types/alert.types';

/**
 * AlertFilters Component Props
 */
interface AlertFiltersProps {
  filters: AlertFiltersType;
  agents?: Agent[];
  onFiltersChange: (filters: AlertFiltersType) => void;
  onSavePreset?: (name: string, filters: AlertFiltersType) => void;
}

/**
 * AlertFilters Component
 */
export const AlertFilters: React.FC<AlertFiltersProps> = ({
  filters,
  agents = [],
  onFiltersChange,
  onSavePreset
}) => {
  const [expanded, setExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState<AlertFiltersType>(filters);
  const [presetName, setPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);

  // Sync local filters with prop changes
  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  /**
   * Handle alert type toggle
   */
  const handleTypeToggle = (type: AlertType) => {
    const currentTypes = localFilters.types || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    const updatedFilters = { ...localFilters, types: newTypes };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle priority toggle
   */
  const handlePriorityToggle = (priority: AlertPriority) => {
    const currentPriorities = localFilters.priorities || [];
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter((p) => p !== priority)
      : [...currentPriorities, priority];

    const updatedFilters = { ...localFilters, priorities: newPriorities };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle status toggle
   */
  const handleStatusToggle = (status: AlertStatus) => {
    const currentStatuses = localFilters.statuses || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter((s) => s !== status)
      : [...currentStatuses, status];

    const updatedFilters = { ...localFilters, statuses: newStatuses };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle confidence range change
   */
  const handleConfidenceChange = (_event: Event, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    const updatedFilters = {
      ...localFilters,
      confidenceMin: min,
      confidenceMax: max
    };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle date range change
   */
  const handleDateChange = (field: 'dateFrom' | 'dateTo', value: string) => {
    const updatedFilters = { ...localFilters, [field]: value };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle agent selection
   */
  const handleAgentChange = (event: SelectChangeEvent<string>) => {
    const updatedFilters = {
      ...localFilters,
      assignedAgentId: event.target.value || undefined
    };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Handle search query change
   */
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const updatedFilters = {
      ...localFilters,
      searchQuery: event.target.value || undefined
    };
    setLocalFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  /**
   * Clear all filters
   */
  const handleClearAll = () => {
    const emptyFilters: AlertFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  /**
   * Save filter preset
   */
  const handleSavePreset = () => {
    if (presetName.trim() && onSavePreset) {
      onSavePreset(presetName.trim(), localFilters);
      setPresetName('');
      setShowSavePreset(false);
    }
  };

  /**
   * Count active filters
   */
  const activeFilterCount = [
    localFilters.types?.length || 0,
    localFilters.priorities?.length || 0,
    localFilters.statuses?.length || 0,
    localFilters.dateFrom ? 1 : 0,
    localFilters.dateTo ? 1 : 0,
    localFilters.confidenceMin !== undefined || localFilters.confidenceMax !== undefined ? 1 : 0,
    localFilters.assignedAgentId ? 1 : 0,
    localFilters.searchQuery ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  return (
    <Paper elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
      {/* Filter Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        p={2}
        sx={{ backgroundColor: '#f5f5f5', cursor: 'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <FilterIcon />
          <Typography variant="h6">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        <IconButton size="small">
          {expanded ? <CollapseIcon /> : <ExpandIcon />}
        </IconButton>
      </Box>

      {/* Filter Content */}
      <Collapse in={expanded}>
        <Box p={3}>
          {/* Search */}
          <Box mb={3}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Search by name, email, or property..."
              value={localFilters.searchQuery || ''}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Box>

          {/* Alert Types */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Alert Type
            </Typography>
            <FormGroup row>
              {Object.values(AlertType).map((type) => (
                <FormControlLabel
                  key={type}
                  control={
                    <Checkbox
                      checked={localFilters.types?.includes(type) || false}
                      onChange={() => handleTypeToggle(type)}
                      size="small"
                    />
                  }
                  label={type.replace(/_/g, ' ')}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Priorities */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Priority
            </Typography>
            <FormGroup row>
              {Object.values(AlertPriority).map((priority) => (
                <FormControlLabel
                  key={priority}
                  control={
                    <Checkbox
                      checked={localFilters.priorities?.includes(priority) || false}
                      onChange={() => handlePriorityToggle(priority)}
                      size="small"
                    />
                  }
                  label={priority}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Status */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Status
            </Typography>
            <FormGroup row>
              {Object.values(AlertStatus).map((status) => (
                <FormControlLabel
                  key={status}
                  control={
                    <Checkbox
                      checked={localFilters.statuses?.includes(status) || false}
                      onChange={() => handleStatusToggle(status)}
                      size="small"
                    />
                  }
                  label={status.replace(/_/g, ' ')}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Confidence Score Range */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Confidence Score: {localFilters.confidenceMin || 0}% -{' '}
              {localFilters.confidenceMax || 100}%
            </Typography>
            <Slider
              value={[
                localFilters.confidenceMin || 0,
                localFilters.confidenceMax || 100
              ]}
              onChange={handleConfidenceChange}
              valueLabelDisplay="auto"
              min={0}
              max={100}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' }
              ]}
            />
          </Box>

          {/* Date Range */}
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Date Range
            </Typography>
            <Box display="flex" gap={2}>
              <TextField
                type="date"
                size="small"
                label="From"
                value={localFilters.dateFrom || ''}
                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                type="date"
                size="small"
                label="To"
                value={localFilters.dateTo || ''}
                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Box>
          </Box>

          {/* Assigned Agent */}
          {agents.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                Assigned Agent
              </Typography>
              <FormControl fullWidth size="small">
                <Select
                  value={localFilters.assignedAgentId || ''}
                  onChange={handleAgentChange}
                  displayEmpty
                >
                  <MenuItem value="">All Agents</MenuItem>
                  {agents.map((agent) => (
                    <MenuItem key={agent.id} value={agent.id}>
                      {agent.name} ({agent.activeAlerts} active)
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="space-between">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={handleClearAll}
              disabled={activeFilterCount === 0}
            >
              Clear All
            </Button>

            {onSavePreset && (
              <Box>
                {!showSavePreset ? (
                  <Button
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={() => setShowSavePreset(true)}
                    disabled={activeFilterCount === 0}
                  >
                    Save Preset
                  </Button>
                ) : (
                  <Box display="flex" gap={1}>
                    <TextField
                      size="small"
                      placeholder="Preset name..."
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSavePreset();
                        }
                      }}
                    />
                    <Button
                      variant="contained"
                      size="small"
                      onClick={handleSavePreset}
                      disabled={!presetName.trim()}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setShowSavePreset(false);
                        setPresetName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
};

export default AlertFilters;
