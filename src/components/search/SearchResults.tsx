/**
 * Search Results Component
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Display search results with highlighting and actions
 */

import React from 'react';
import {
  DocumentTextIcon,
  FolderIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  TagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface SearchResult {
  id: string;
  type: 'document' | 'property' | 'tenant' | 'lease' | 'task';
  title: string;
  description?: string;
  highlights?: {
    title?: string[];
    content?: string[];
    tags?: string[];
  };
  metadata: {
    created_at: string;
    updated_at: string;
    relevance_score: number;
    ai_confidence?: number;
    [key: string]: any;
  };
  url: string;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface SearchResultsProps {
  results: SearchResult[];
  totalResults: number;
  searchTime?: number;
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
  showAIInsights?: boolean;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  totalResults,
  searchTime,
  isLoading = false,
  onResultClick,
  showAIInsights = true
}) => {
  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'document':
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
      case 'property':
        return <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />;
      case 'tenant':
        return <FolderIcon className="h-5 w-5 text-gray-400" />;
      case 'lease':
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />;
      case 'task':
        return <CalendarIcon className="h-5 w-5 text-gray-400" />;
      default:
        return <FolderIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getResultTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'document':
        return 'blue';
      case 'property':
        return 'green';
      case 'tenant':
        return 'purple';
      case 'lease':
        return 'orange';
      case 'task':
        return 'red';
      default:
        return 'gray';
    }
  };

  const highlightText = (text: string, highlights?: string[]) => {
    if (!highlights || highlights.length === 0) return text;
    
    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = highlightedText.replace(
        regex,
        '<mark class="bg-yellow-200 text-gray-900">$1</mark>'
      );
    });
    
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-700">
          Found <span className="font-medium">{totalResults}</span> results
          {searchTime && (
            <span className="text-gray-500"> in {searchTime.toFixed(2)}s</span>
          )}
        </p>
        {showAIInsights && (
          <div className="flex items-center space-x-1 text-sm text-primary-600">
            <SparklesIcon className="h-4 w-4" />
            <span>AI-enhanced results</span>
          </div>
        )}
      </div>

      {/* Results List */}
      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onResultClick?.(result)}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getResultIcon(result.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {highlightText(result.title, result.highlights?.title)}
                    </h3>
                    <div className="mt-1 flex items-center space-x-2">
                      <Badge
                        variant={getResultTypeColor(result.type) as any}
                        size="sm"
                      >
                        {result.type}
                      </Badge>
                      {result.metadata.ai_confidence && (
                        <Badge variant="default" size="sm">
                          {Math.round(result.metadata.ai_confidence * 100)}% match
                        </Badge>
                      )}
                      <span className="text-sm text-gray-500">
                        Updated {formatDistanceToNow(new Date(result.metadata.updated_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Relevance Score */}
                  <div className="ml-4 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-2xl font-semibold text-primary-600">
                        {Math.round(result.metadata.relevance_score * 100)}
                      </div>
                      <div className="text-xs text-gray-500">relevance</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {result.description && (
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {highlightText(result.description, result.highlights?.content)}
                  </p>
                )}

                {/* Metadata */}
                <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                  {result.metadata.property_address && (
                    <div className="flex items-center space-x-1">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{result.metadata.property_address}</span>
                    </div>
                  )}
                  {result.metadata.tags && result.metadata.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <TagIcon className="h-4 w-4" />
                      <span>{result.metadata.tags.slice(0, 3).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {result.actions && result.actions.length > 0 && (
                  <div className="mt-4 flex items-center space-x-2">
                    {result.actions.map((action, index) => (
                      <Button
                        key={index}
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          action.action();
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};