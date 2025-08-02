/**
 * Search Page
 * Designed by: Frontend Specialist + UX Designer
 * 
 * Advanced document search with filters and AI-powered insights
 */

import React, { useState, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

interface SearchResult {
  id: string;
  title: string;
  type: 'document' | 'content' | 'metadata';
  documentName: string;
  documentType: string;
  excerpt: string;
  relevanceScore: number;
  lastModified: string;
  tags: string[];
  highlights: string[];
}

const SearchPage: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedFilters, setSelectedFilters] = useState({
    documentType: '',
    dateRange: '',
    tags: [] as string[],
    sortBy: 'relevance'
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Mock search results data
  const mockResults: SearchResult[] = [
    {
      id: '1',
      title: 'Contract Terms and Conditions',
      type: 'content',
      documentName: 'Service_Agreement_2024.pdf',
      documentType: 'PDF',
      excerpt: 'The contractor agrees to provide services as outlined in Schedule A, including but not limited to software development, testing, and deployment...',
      relevanceScore: 95,
      lastModified: '2024-01-15',
      tags: ['Contract', 'Legal', 'Services'],
      highlights: ['contractor', 'services', 'Schedule A']
    },
    {
      id: '2',
      title: 'Financial Performance Summary',
      type: 'document',
      documentName: 'Q4_Financial_Report.xlsx',
      documentType: 'Excel',
      excerpt: 'Revenue increased by 23% compared to previous quarter, with total sales reaching $2.4M. Key growth drivers include...',
      relevanceScore: 87,
      lastModified: '2024-01-14',
      tags: ['Finance', 'Q4', 'Revenue'],
      highlights: ['Revenue', '23%', '$2.4M']
    },
    {
      id: '3',
      title: 'Marketing Strategy Overview',
      type: 'metadata',
      documentName: 'Marketing_Plan_2024.pptx',
      documentType: 'PowerPoint',
      excerpt: 'Comprehensive marketing strategy focusing on digital transformation and customer engagement through AI-powered tools...',
      relevanceScore: 76,
      lastModified: '2024-01-13',
      tags: ['Marketing', 'Strategy', 'AI'],
      highlights: ['marketing strategy', 'digital transformation', 'AI-powered']
    }
  ];

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Filter mock results based on query
      const filtered = mockResults.filter(result => 
        result.title.toLowerCase().includes(query.toLowerCase()) ||
        result.excerpt.toLowerCase().includes(query.toLowerCase()) ||
        result.documentName.toLowerCase().includes(query.toLowerCase()) ||
        result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      );
      
      setSearchResults(filtered);
      setIsSearching(false);
    }, 800);
  }, []);

  const filteredResults = useMemo(() => {
    let results = [...searchResults];

    // Apply document type filter
    if (selectedFilters.documentType) {
      results = results.filter(result => 
        result.documentType.toLowerCase() === selectedFilters.documentType.toLowerCase()
      );
    }

    // Apply tag filter
    if (selectedFilters.tags.length > 0) {
      results = results.filter(result =>
        result.tags.some(tag => selectedFilters.tags.includes(tag))
      );
    }

    // Apply sorting
    switch (selectedFilters.sortBy) {
      case 'relevance':
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
      case 'date':
        results.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
        break;
      case 'name':
        results.sort((a, b) => a.documentName.localeCompare(b.documentName));
        break;
    }

    return results;
  }, [searchResults, selectedFilters]);

  const handleFilterChange = (filterType: string, value: string | string[]) => {
    setSelectedFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const getResultTypeIcon = (type: string) => {
    switch (type) {
      case 'document':
        return (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'content':
        return (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
      case 'metadata':
        return (
          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text;
    
    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  return (
    <>
      <Head>
        <title>Search Documents - ROI Systems</title>
        <meta name="description" content="Search through your documents with AI-powered insights" />
      </Head>

      <Layout>
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-text-primary mb-2">
              Search Documents
            </h1>
            <p className="text-text-secondary">
              Find information across all your documents using AI-powered search
            </p>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search documents, content, or metadata..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="w-full pl-12 pr-4 py-4 text-lg border border-border-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {isSearching && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <LoadingSpinner size="sm" />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="card sticky top-24">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-text-primary">Filters</h3>
                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {showAdvancedFilters ? 'Hide' : 'Show'} Advanced
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Document Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Document Type
                    </label>
                    <select 
                      value={selectedFilters.documentType}
                      onChange={(e) => handleFilterChange('documentType', e.target.value)}
                      className="w-full input"
                    >
                      <option value="">All Types</option>
                      <option value="pdf">PDF</option>
                      <option value="excel">Excel</option>
                      <option value="powerpoint">PowerPoint</option>
                      <option value="word">Word</option>
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Sort By
                    </label>
                    <select 
                      value={selectedFilters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      className="w-full input"
                    >
                      <option value="relevance">Relevance</option>
                      <option value="date">Date Modified</option>
                      <option value="name">Document Name</option>
                    </select>
                  </div>

                  {/* Advanced Filters */}
                  {showAdvancedFilters && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Date Range
                        </label>
                        <select 
                          value={selectedFilters.dateRange}
                          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                          className="w-full input"
                        >
                          <option value="">Any Time</option>
                          <option value="today">Today</option>
                          <option value="week">This Week</option>
                          <option value="month">This Month</option>
                          <option value="year">This Year</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          Tags
                        </label>
                        <div className="space-y-2">
                          {['Contract', 'Legal', 'Finance', 'Marketing', 'Strategy'].map(tag => (
                            <label key={tag} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={selectedFilters.tags.includes(tag)}
                                onChange={(e) => {
                                  const newTags = e.target.checked
                                    ? [...selectedFilters.tags, tag]
                                    : selectedFilters.tags.filter(t => t !== tag);
                                  handleFilterChange('tags', newTags);
                                }}
                                className="w-4 h-4 text-primary-600 rounded border-border-secondary focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-text-secondary">{tag}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="lg:col-span-3">
              {searchQuery && (
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <p className="text-text-secondary">
                      {isSearching ? 'Searching...' : `${filteredResults.length} results for "${searchQuery}"`}
                    </p>
                    {filteredResults.length > 0 && (
                      <button
                        onClick={() => router.push('/documents')}
                        className="btn-outline text-sm"
                      >
                        View All Documents
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Search Results List */}
              <div className="space-y-6">
                {!searchQuery ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">Start searching</h3>
                    <p className="text-text-secondary">
                      Enter a search term to find information across your documents
                    </p>
                  </div>
                ) : isSearching ? (
                  <div className="text-center py-12">
                    <LoadingSpinner size="lg" />
                    <p className="text-text-secondary mt-4">Searching documents...</p>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-text-primary mb-2">No results found</h3>
                    <p className="text-text-secondary">
                      Try adjusting your search terms or filters
                    </p>
                  </div>
                ) : (
                  filteredResults.map((result) => (
                    <div key={result.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 mt-1">
                          {getResultTypeIcon(result.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-text-primary hover:text-primary-600 transition-colors">
                              {result.title}
                            </h3>
                            <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded capitalize">
                              {result.type}
                            </span>
                          </div>
                          
                          <p className="text-sm text-text-secondary mb-2">
                            in <span className="font-medium">{result.documentName}</span> • {result.documentType}
                          </p>
                          
                          <p 
                            className="text-text-secondary text-sm mb-3 line-clamp-2"
                            dangerouslySetInnerHTML={{ 
                              __html: highlightText(result.excerpt, result.highlights) 
                            }}
                          />
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-1">
                                <span className="text-xs text-text-tertiary">Relevance:</span>
                                <span className="text-xs font-medium text-primary-600">{result.relevanceScore}%</span>
                              </div>
                              <span className="text-xs text-text-tertiary">
                                Modified {result.lastModified}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {result.tags.slice(0, 2).map((tag) => (
                                <span 
                                  key={tag}
                                  className="text-xs bg-background-secondary text-text-secondary px-2 py-1 rounded"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Search Tips */}
              {!searchQuery && (
                <div className="mt-12">
                  <div className="card bg-primary-50 border-primary-200">
                    <h4 className="font-medium text-primary-800 mb-3">Search Tips</h4>
                    <div className="space-y-2 text-sm text-primary-700">
                      <p>• Use quotes for exact phrases: "contract terms"</p>
                      <p>• Use AND, OR, NOT operators: finance AND Q4</p>
                      <p>• Search by file type: filetype:pdf</p>
                      <p>• Use wildcards: market* finds marketing, market, etc.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
};

export default SearchPage;