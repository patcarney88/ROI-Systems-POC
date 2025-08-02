/**
 * Advanced Search Bar Component
 * Designed by: Frontend Specialist + UX Designer + AI/ML Engineer
 * 
 * Intelligent search with AI-powered suggestions and real-time results
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  ClockIcon,
  DocumentTextIcon,
  TagIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import debounce from 'lodash/debounce';

interface SearchSuggestion {
  text: string;
  type: 'popular' | 'recent' | 'ai' | 'filter' | 'document';
  metadata?: {
    count?: number;
    lastUsed?: string;
    confidence?: number;
    filterType?: string;
  };
}

interface SearchBarProps {
  onSearch: (query: string, options?: SearchOptions) => void;
  onSuggestionClick?: (suggestion: SearchSuggestion) => void;
  placeholder?: string;
  showAdvancedOptions?: boolean;
  enableAISuggestions?: boolean;
  recentSearches?: string[];
  popularSearches?: string[];
}

interface SearchOptions {
  aiEnhanced?: boolean;
  semanticSearch?: boolean;
  filters?: any;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSuggestionClick,
  placeholder = 'Search documents, properties, or ask a question...',
  showAdvancedOptions = true,
  enableAISuggestions = true,
  recentSearches = [],
  popularSearches = []
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Mock AI suggestions (replace with actual API call)
  const getAISuggestions = async (searchQuery: string): Promise<SearchSuggestion[]> => {
    if (!searchQuery.trim()) return [];
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Mock AI-powered suggestions
    const aiSuggestions: SearchSuggestion[] = [
      {
        text: `${searchQuery} in last 30 days`,
        type: 'ai',
        metadata: { confidence: 0.95, filterType: 'date' }
      },
      {
        text: `lease documents containing "${searchQuery}"`,
        type: 'ai',
        metadata: { confidence: 0.88, filterType: 'document_type' }
      },
      {
        text: `${searchQuery} property inspection reports`,
        type: 'ai',
        metadata: { confidence: 0.82, filterType: 'combined' }
      }
    ];
    
    return aiSuggestions;
  };

  // Debounced suggestion fetcher
  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      const allSuggestions: SearchSuggestion[] = [];

      // Add recent searches that match
      const matchingRecent = recentSearches
        .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 3)
        .map(s => ({
          text: s,
          type: 'recent' as const,
          metadata: { lastUsed: 'Recently' }
        }));
      allSuggestions.push(...matchingRecent);

      // Add popular searches that match
      const matchingPopular = popularSearches
        .filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 2)
        .map(s => ({
          text: s,
          type: 'popular' as const,
          metadata: { count: Math.floor(Math.random() * 100) + 20 }
        }));
      allSuggestions.push(...matchingPopular);

      // Get AI suggestions if enabled
      if (enableAISuggestions && aiEnabled) {
        try {
          const aiSuggestions = await getAISuggestions(searchQuery);
          allSuggestions.push(...aiSuggestions);
        } catch (error) {
          console.error('Failed to get AI suggestions:', error);
        }
      }

      setSuggestions(allSuggestions);
      setShowSuggestions(allSuggestions.length > 0);
      setIsLoading(false);
    }, 300),
    [recentSearches, popularSearches, enableAISuggestions, aiEnabled]
  );

  useEffect(() => {
    fetchSuggestions(query);
  }, [query, fetchSuggestions]);

  const handleSearch = (searchQuery: string = query) => {
    const options: SearchOptions = {
      aiEnhanced: aiEnabled,
      semanticSearch: aiEnabled
    };
    
    onSearch(searchQuery, options);
    setShowSuggestions(false);
    setQuery('');
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    handleSearch(suggestion.text);
    onSuggestionClick?.(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > -1 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0) {
        handleSuggestionClick(suggestions[selectedSuggestionIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case 'popular':
        return <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />;
      case 'ai':
        return <SparklesIcon className="h-4 w-4 text-primary-500" />;
      case 'document':
        return <DocumentTextIcon className="h-4 w-4 text-gray-400" />;
      default:
        return <TagIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder={placeholder}
              className="pl-10 pr-10"
              size="lg"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            )}
            
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
            >
              <div className="py-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    onMouseEnter={() => setSelectedSuggestionIndex(index)}
                    className={`
                      w-full px-4 py-2 flex items-center justify-between text-left
                      hover:bg-gray-50 transition-colors
                      ${selectedSuggestionIndex === index ? 'bg-gray-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-sm text-gray-700">
                        {suggestion.text}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {suggestion.type === 'popular' && suggestion.metadata?.count && (
                        <Badge variant="secondary" size="sm">
                          {suggestion.metadata.count} results
                        </Badge>
                      )}
                      {suggestion.type === 'ai' && suggestion.metadata?.confidence && (
                        <Badge variant="default" size="sm">
                          AI {Math.round(suggestion.metadata.confidence * 100)}%
                        </Badge>
                      )}
                      {suggestion.type === 'recent' && (
                        <span className="text-xs text-gray-500">
                          {suggestion.metadata?.lastUsed}
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              {enableAISuggestions && (
                <div className="border-t px-4 py-2 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4 text-primary-500" />
                      <span className="text-xs text-gray-600">
                        AI-powered suggestions
                      </span>
                    </div>
                    <button
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      {aiEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={() => handleSearch()}
          disabled={!query.trim()}
        >
          Search
        </Button>

        {/* Advanced Options */}
        {showAdvancedOptions && (
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<AdjustmentsHorizontalIcon className="h-5 w-5" />}
          >
            Filters
          </Button>
        )}
      </div>

      {/* AI Enhancement Toggle */}
      {enableAISuggestions && (
        <div className="mt-2 flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={aiEnabled}
              onChange={(e) => setAiEnabled(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <SparklesIcon className="h-4 w-4 text-primary-500" />
              AI-Enhanced Search
            </span>
          </label>
          
          {aiEnabled && (
            <span className="text-xs text-gray-500">
              Get smarter results with Claude AI
            </span>
          )}
        </div>
      )}
    </div>
  );
};