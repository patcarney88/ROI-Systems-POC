/**
 * Search Filters Component
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Advanced filtering options for search
 */

import React, { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  FolderIcon,
  BuildingOfficeIcon,
  UserIcon,
  TagIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface SearchFilters {
  types?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  properties?: string[];
  users?: string[];
  tags?: string[];
  relevanceThreshold?: number;
  onlyAIEnhanced?: boolean;
  sortBy?: 'relevance' | 'date' | 'type' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTypes?: string[];
  availableProperties?: Array<{ id: string; address: string }>;
  availableUsers?: Array<{ id: string; name: string }>;
  availableTags?: string[];
  onClose?: () => void;
}

const typeIcons: Record<string, React.ComponentType<any>> = {
  'document': FolderIcon,
  'property': BuildingOfficeIcon,
  'tenant': UserIcon,
  'lease': FolderIcon,
  'task': CalendarIcon
};

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  availableTypes = ['document', 'property', 'tenant', 'lease', 'task'],
  availableProperties = [],
  availableUsers = [],
  availableTags = [],
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleResetFilters = () => {
    const emptyFilters: SearchFilters = {
      sortBy: 'relevance',
      sortOrder: 'desc'
    };
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.types?.length) count += localFilters.types.length;
    if (localFilters.dateRange?.from || localFilters.dateRange?.to) count++;
    if (localFilters.properties?.length) count += localFilters.properties.length;
    if (localFilters.users?.length) count += localFilters.users.length;
    if (localFilters.tags?.length) count += localFilters.tags.length;
    if (localFilters.relevanceThreshold && localFilters.relevanceThreshold > 0) count++;
    if (localFilters.onlyAIEnhanced) count++;
    return count;
  };

  const datePresets = [
    { label: 'Today', value: () => ({ from: new Date().toISOString().split('T')[0], to: new Date().toISOString().split('T')[0] }) },
    { label: 'Last 7 days', value: () => {
      const to = new Date();
      const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }},
    { label: 'Last 30 days', value: () => {
      const to = new Date();
      const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }},
    { label: 'Last 90 days', value: () => {
      const to = new Date();
      const from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString().split('T')[0], to: to.toISOString().split('T')[0] };
    }}
  ];

  return (
    <div className="bg-white border rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Search Filters</h3>
            {getActiveFilterCount() > 0 && (
              <Badge variant="default" size="sm">
                {getActiveFilterCount()} active
              </Badge>
            )}
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Result Types */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FolderIcon className="h-4 w-4 mr-2" />
            Result Types
          </label>
          <div className="space-y-2 mt-2">
            {availableTypes.map(type => {
              const Icon = typeIcons[type] || FolderIcon;
              return (
                <label key={type} className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={localFilters.types?.includes(type) || false}
                    onChange={(e) => {
                      const types = localFilters.types || [];
                      if (e.target.checked) {
                        handleFilterChange('types', [...types, type]);
                      } else {
                        handleFilterChange('types', types.filter(t => t !== type));
                      }
                    }}
                  />
                  <Icon className="h-4 w-4 ml-2 mr-1 text-gray-400" />
                  <span className="text-sm text-gray-700 capitalize">{type}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Date Range
          </label>
          <div className="space-y-2 mt-2">
            {/* Date Presets */}
            <div className="flex flex-wrap gap-2">
              {datePresets.map(preset => (
                <button
                  key={preset.label}
                  onClick={() => handleFilterChange('dateRange', preset.value())}
                  className="text-xs px-2 py-1 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="From"
                value={localFilters.dateRange?.from || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...localFilters.dateRange,
                  from: e.target.value
                })}
                size="sm"
              />
              <Input
                type="date"
                placeholder="To"
                value={localFilters.dateRange?.to || ''}
                onChange={(e) => handleFilterChange('dateRange', {
                  ...localFilters.dateRange,
                  to: e.target.value
                })}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* Properties */}
        {availableProperties.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 mr-2" />
              Properties
            </label>
            <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
              {availableProperties.map(property => (
                <label key={property.id} className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    checked={localFilters.properties?.includes(property.id) || false}
                    onChange={(e) => {
                      const properties = localFilters.properties || [];
                      if (e.target.checked) {
                        handleFilterChange('properties', [...properties, property.id]);
                      } else {
                        handleFilterChange('properties', properties.filter(p => p !== property.id));
                      }
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-700 truncate">
                    {property.address}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Users */}
        {availableUsers.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              Created By
            </label>
            <select
              multiple
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={localFilters.users || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                handleFilterChange('users', selected);
              }}
              size={Math.min(availableUsers.length, 4)}
            >
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tags */}
        {availableTags.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <TagIcon className="h-4 w-4 mr-2" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {availableTags.map(tag => {
                const isSelected = localFilters.tags?.includes(tag) || false;
                return (
                  <button
                    key={tag}
                    onClick={() => {
                      const tags = localFilters.tags || [];
                      if (isSelected) {
                        handleFilterChange('tags', tags.filter(t => t !== tag));
                      } else {
                        handleFilterChange('tags', [...tags, tag]);
                      }
                    }}
                    className={`
                      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${isSelected
                        ? 'bg-primary-100 text-primary-800'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }
                    `}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Relevance Threshold */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2">
            Minimum Relevance Score
          </label>
          <div className="mt-2">
            <input
              type="range"
              min="0"
              max="100"
              value={localFilters.relevanceThreshold || 0}
              onChange={(e) => handleFilterChange('relevanceThreshold', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span className="font-medium text-primary-600">
                {localFilters.relevanceThreshold || 0}%
              </span>
              <span>100%</span>
            </div>
          </div>
        </div>

        {/* AI Enhancement */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={localFilters.onlyAIEnhanced || false}
              onChange={(e) => handleFilterChange('onlyAIEnhanced', e.target.checked)}
            />
            <span className="ml-2 text-sm text-gray-700 flex items-center">
              <SparklesIcon className="h-4 w-4 mr-1 text-primary-500" />
              Show only AI-enhanced results
            </span>
          </label>
        </div>

        {/* Sort Options */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2">
            Sort Results
          </label>
          <div className="mt-2 space-y-2">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={localFilters.sortBy || 'relevance'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value as any)}
            >
              <option value="relevance">Relevance</option>
              <option value="date">Date</option>
              <option value="type">Type</option>
              <option value="title">Title</option>
            </select>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortOrder"
                  value="desc"
                  checked={localFilters.sortOrder !== 'asc'}
                  onChange={() => handleFilterChange('sortOrder', 'desc')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Descending</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortOrder"
                  value="asc"
                  checked={localFilters.sortOrder === 'asc'}
                  onChange={() => handleFilterChange('sortOrder', 'asc')}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Ascending</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-t bg-gray-50 flex justify-between">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleResetFilters}
          disabled={getActiveFilterCount() === 0}
        >
          Reset All
        </Button>
        <div className="space-x-2">
          {onClose && (
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};