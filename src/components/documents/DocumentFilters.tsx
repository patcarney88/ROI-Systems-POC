/**
 * Document Filters Component
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Advanced filtering options for documents
 */

import React, { useState } from 'react';
import {
  FunnelIcon,
  XMarkIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
  UserIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

interface FilterOptions {
  documentTypes?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  properties?: string[];
  tags?: string[];
  uploadedBy?: string[];
  sizeRange?: {
    min?: number;
    max?: number;
  };
  starred?: boolean;
}

interface DocumentFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableDocumentTypes?: string[];
  availableProperties?: Array<{ id: string; address: string }>;
  availableTags?: string[];
  availableUsers?: Array<{ id: string; name: string }>;
  isOpen?: boolean;
  onClose?: () => void;
}

const documentTypeIcons: Record<string, React.ComponentType<any>> = {
  'lease': FolderIcon,
  'contract': FolderIcon,
  'inspection': FolderIcon,
  'photo': FolderIcon,
  'correspondence': FolderIcon,
  'financial': FolderIcon,
  'other': FolderIcon
};

export const DocumentFilters: React.FC<DocumentFiltersProps> = ({
  filters,
  onFiltersChange,
  availableDocumentTypes = [],
  availableProperties = [],
  availableTags = [],
  availableUsers = [],
  isOpen = true,
  onClose
}) => {
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
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
    const emptyFilters: FilterOptions = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.documentTypes?.length) count += localFilters.documentTypes.length;
    if (localFilters.dateRange?.from || localFilters.dateRange?.to) count++;
    if (localFilters.properties?.length) count += localFilters.properties.length;
    if (localFilters.tags?.length) count += localFilters.tags.length;
    if (localFilters.uploadedBy?.length) count += localFilters.uploadedBy.length;
    if (localFilters.sizeRange?.min || localFilters.sizeRange?.max) count++;
    if (localFilters.starred !== undefined) count++;
    return count;
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="bg-white border rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900">Filters</h3>
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
        {/* Document Types */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <FolderIcon className="h-4 w-4 mr-2" />
            Document Types
          </label>
          <div className="space-y-2 mt-2">
            {availableDocumentTypes.map(type => (
              <label key={type} className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={localFilters.documentTypes?.includes(type) || false}
                  onChange={(e) => {
                    const types = localFilters.documentTypes || [];
                    if (e.target.checked) {
                      handleFilterChange('documentTypes', [...types, type]);
                    } else {
                      handleFilterChange('documentTypes', types.filter(t => t !== type));
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Date Range
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
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

        {/* Uploaded By */}
        {availableUsers.length > 0 && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <UserIcon className="h-4 w-4 mr-2" />
              Uploaded By
            </label>
            <select
              multiple
              className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={localFilters.uploadedBy || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                handleFilterChange('uploadedBy', selected);
              }}
            >
              {availableUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* File Size */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2">
            File Size (MB)
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Input
              type="number"
              placeholder="Min size"
              value={localFilters.sizeRange?.min || ''}
              onChange={(e) => handleFilterChange('sizeRange', {
                ...localFilters.sizeRange,
                min: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              size="sm"
              min={0}
              step={0.1}
            />
            <Input
              type="number"
              placeholder="Max size"
              value={localFilters.sizeRange?.max || ''}
              onChange={(e) => handleFilterChange('sizeRange', {
                ...localFilters.sizeRange,
                max: e.target.value ? parseFloat(e.target.value) : undefined
              })}
              size="sm"
              min={0}
              step={0.1}
            />
          </div>
        </div>

        {/* Starred */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={localFilters.starred || false}
              onChange={(e) => handleFilterChange('starred', e.target.checked || undefined)}
            />
            <span className="ml-2 text-sm text-gray-700">Show only starred documents</span>
          </label>
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