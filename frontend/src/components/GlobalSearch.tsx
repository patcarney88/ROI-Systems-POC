import { useState, useEffect, useRef } from 'react';
import { Search, FileText, Users, Mail, TrendingUp, X, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  type: 'document' | 'client' | 'campaign' | 'transaction';
  subtitle?: string;
  date?: string;
  url: string;
}

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Mock data - in real app, this would come from API
  const allData: SearchResult[] = [
    // Documents
    { id: '1', title: 'Title Insurance Policy - Smith Property', type: 'document', subtitle: 'PDF • 2.4 MB', date: '2 days ago', url: '/documents/1' },
    { id: '2', title: 'Closing Disclosure - Johnson Home', type: 'document', subtitle: 'PDF • 1.8 MB', date: '1 week ago', url: '/documents/2' },
    { id: '3', title: 'Property Deed - 123 Main St', type: 'document', subtitle: 'PDF • 890 KB', date: '3 days ago', url: '/documents/3' },
    { id: '4', title: 'Escrow Agreement - Davis Transaction', type: 'document', subtitle: 'PDF • 1.2 MB', date: '5 days ago', url: '/documents/4' },
    
    // Clients
    { id: '5', title: 'Sarah Johnson', type: 'client', subtitle: 'sarah.j@email.com • Active', date: 'Last contact: Today', url: '/clients/5' },
    { id: '6', title: 'Michael Smith', type: 'client', subtitle: 'michael.s@email.com • Active', date: 'Last contact: Yesterday', url: '/clients/6' },
    { id: '7', title: 'Emily Davis', type: 'client', subtitle: 'emily.d@email.com • Pending', date: 'Last contact: 3 days ago', url: '/clients/7' },
    
    // Campaigns
    { id: '8', title: 'Q1 2024 Newsletter', type: 'campaign', subtitle: 'Email • 1,250 recipients', date: 'Sent 1 week ago', url: '/campaigns/8' },
    { id: '9', title: 'New Listing Alert - Downtown', type: 'campaign', subtitle: 'SMS • 450 recipients', date: 'Sent 3 days ago', url: '/campaigns/9' },
    
    // Transactions
    { id: '10', title: '123 Oak Street Purchase', type: 'transaction', subtitle: '$450,000 • In Progress', date: 'Closing: Jan 30', url: '/transactions/10' },
    { id: '11', title: '456 Elm Avenue Sale', type: 'transaction', subtitle: '$625,000 • Pending', date: 'Closing: Feb 5', url: '/transactions/11' },
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle search
  useEffect(() => {
    if (query.trim() === '') {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const filtered = allData.filter(item => 
      item.title.toLowerCase().includes(searchQuery) ||
      item.subtitle?.toLowerCase().includes(searchQuery)
    );
    
    setResults(filtered);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K or Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      // Escape to close
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    // Save to recent searches
    const updated = [result.title, ...recentSearches.filter(s => s !== result.title)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
    
    // Navigate
    navigate(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText size={18} />;
      case 'client': return <Users size={18} />;
      case 'campaign': return <Mail size={18} />;
      case 'transaction': return <TrendingUp size={18} />;
      default: return <FileText size={18} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'document': return '#3b82f6';
      case 'client': return '#10b981';
      case 'campaign': return '#8b5cf6';
      case 'transaction': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <div ref={searchRef} style={{ position: 'relative' }}>
      {/* Search Button */}
      <button 
        className="nav-action-btn"
        onClick={() => {
          setIsOpen(!isOpen);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        title="Search (⌘K)"
      >
        <Search size={20} />
      </button>

      {/* Search Modal */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 9999,
          }} />

          {/* Search Panel */}
          <div style={{
            position: 'fixed',
            top: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '600px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            zIndex: 10000,
            overflow: 'hidden',
          }}>
            {/* Search Input */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '1.25rem 1.5rem',
              borderBottom: '1px solid #e5e7eb',
              gap: '1rem'
            }}>
              <Search size={24} color="#6b7280" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search documents, clients, campaigns..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1.125rem',
                  color: '#1f2937'
                }}
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <X size={20} color="#6b7280" />
                </button>
              )}
              <kbd style={{
                padding: '0.25rem 0.5rem',
                background: '#f3f4f6',
                borderRadius: '4px',
                fontSize: '0.75rem',
                color: '#6b7280',
                fontFamily: 'monospace'
              }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {query === '' && recentSearches.length > 0 && (
                <div style={{ padding: '1rem 1rem 0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem'
                  }}>
                    <Clock size={14} />
                    Recent Searches
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        fontSize: '0.875rem',
                        color: '#6b7280',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}

              {query !== '' && results.length === 0 && (
                <div style={{
                  padding: '3rem 2rem',
                  textAlign: 'center',
                  color: '#6b7280'
                }}>
                  <Search size={48} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
                  <p style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                    No results found
                  </p>
                  <p style={{ fontSize: '0.875rem' }}>
                    Try searching for documents, clients, or campaigns
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div style={{ padding: '0.5rem 0' }}>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                    >
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: `${getTypeColor(result.type)}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: getTypeColor(result.type),
                        flexShrink: 0
                      }}>
                        {getIcon(result.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div style={{
                            fontSize: '0.75rem',
                            color: '#6b7280',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {result.date && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#9ca3af',
                          flexShrink: 0
                        }}>
                          {result.date}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '0.75rem 1.5rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <span>
                  <kbd style={{
                    padding: '0.125rem 0.375rem',
                    background: '#f3f4f6',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    marginRight: '0.25rem'
                  }}>↑↓</kbd>
                  Navigate
                </span>
                <span>
                  <kbd style={{
                    padding: '0.125rem 0.375rem',
                    background: '#f3f4f6',
                    borderRadius: '3px',
                    fontFamily: 'monospace',
                    marginRight: '0.25rem'
                  }}>↵</kbd>
                  Select
                </span>
              </div>
              <span>Press <kbd style={{
                padding: '0.125rem 0.375rem',
                background: '#f3f4f6',
                borderRadius: '3px',
                fontFamily: 'monospace'
              }}>⌘K</kbd> to search anytime</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
