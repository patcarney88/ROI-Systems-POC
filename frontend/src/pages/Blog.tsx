import React, { useState } from 'react';
import { Calendar, Clock, User, ArrowRight, Search, Tag } from 'lucide-react';

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image: string;
}

const Blog: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sample blog posts (in Phase 3, these would come from a CMS or markdown files)
  const blogPosts: BlogPost[] = [
    {
      id: 1,
      title: '5 Ways AI is Transforming the Title Industry',
      excerpt: 'Discover how artificial intelligence is revolutionizing document processing, risk assessment, and customer service in title agencies.',
      author: 'Sarah Johnson',
      date: '2025-01-15',
      readTime: '8 min read',
      category: 'AI & Technology',
      tags: ['AI', 'Automation', 'Innovation'],
      image: '/blog/ai-title-industry.jpg'
    },
    {
      id: 2,
      title: 'A Complete Guide to ALTA Best Practices Compliance',
      excerpt: 'Learn how ROI Systems helps title agencies meet and exceed ALTA Best Practices requirements for data security and operational excellence.',
      author: 'Michael Chen',
      date: '2025-01-12',
      readTime: '12 min read',
      category: 'Compliance',
      tags: ['ALTA', 'Compliance', 'Best Practices'],
      image: '/blog/alta-compliance.jpg'
    },
    {
      id: 3,
      title: 'Maximizing Client Retention: Data-Driven Strategies',
      excerpt: 'Explore proven tactics and analytics insights that help real estate professionals retain more clients and boost referral rates.',
      author: 'Jennifer Martinez',
      date: '2025-01-08',
      readTime: '10 min read',
      category: 'Marketing',
      tags: ['Client Retention', 'Marketing', 'Analytics'],
      image: '/blog/client-retention.jpg'
    },
    {
      id: 4,
      title: 'From Paper to Digital: The Modern Title Agency Transformation',
      excerpt: 'A step-by-step guide to transitioning from paper-based processes to a fully digital document management system.',
      author: 'David Williams',
      date: '2025-01-05',
      readTime: '15 min read',
      category: 'Digital Transformation',
      tags: ['Document Management', 'Digital Transformation', 'Productivity'],
      image: '/blog/digital-transformation.jpg'
    },
    {
      id: 5,
      title: 'Security Best Practices for Real Estate Data',
      excerpt: 'Protect sensitive client information with these essential cybersecurity measures every title agency should implement.',
      author: 'Emily Rodriguez',
      date: '2025-01-02',
      readTime: '7 min read',
      category: 'Security',
      tags: ['Security', 'Data Protection', 'Compliance'],
      image: '/blog/security-practices.jpg'
    },
    {
      id: 6,
      title: 'The ROI of Automation: Real Numbers from Real Title Agencies',
      excerpt: 'See actual case studies and ROI calculations from title agencies that automated their document workflows.',
      author: 'Robert Taylor',
      date: '2024-12-28',
      readTime: '11 min read',
      category: 'Case Studies',
      tags: ['ROI', 'Case Studies', 'Automation'],
      image: '/blog/roi-automation.jpg'
    }
  ];

  const categories = ['all', ...Array.from(new Set(blogPosts.map(post => post.category)))];

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      backgroundColor: '#f9fafb',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', marginBottom: '1rem' }}>
            ROI Systems Blog
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.95, marginBottom: '2rem' }}>
            Insights, best practices, and industry trends for modern real estate professionals
          </p>

          {/* Search Bar */}
          <div style={{
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6b7280'
              }}
            />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem 1rem 1rem 3rem',
                borderRadius: '0.75rem',
                border: 'none',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <div style={{
        maxWidth: '1200px',
        margin: '2rem auto',
        padding: '0 2rem'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          justifyContent: 'center'
        }}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '0.5rem 1.5rem',
                borderRadius: '2rem',
                border: selectedCategory === category ? '2px solid #667eea' : '1px solid #d1d5db',
                backgroundColor: selectedCategory === category ? '#667eea' : 'white',
                color: selectedCategory === category ? 'white' : '#374151',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category) {
                  e.currentTarget.style.borderColor = '#667eea';
                  e.currentTarget.style.color = '#667eea';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category) {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.color = '#374151';
                }
              }}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div style={{
        maxWidth: '1200px',
        margin: '3rem auto 4rem',
        padding: '0 2rem'
      }}>
        {filteredPosts.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'white',
            borderRadius: '1rem',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              No articles found matching your search.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {filteredPosts.map(post => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>

      {/* Newsletter CTA */}
      <section style={{
        backgroundColor: '#667eea',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
            Never Miss an Update
          </h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.95 }}>
            Subscribe to our newsletter for the latest insights, product updates, and industry trends.
          </p>
          <div style={{
            display: 'flex',
            gap: '1rem',
            maxWidth: '500px',
            margin: '0 auto',
            flexWrap: 'wrap'
          }}>
            <input
              type="email"
              placeholder="Enter your email"
              style={{
                flex: '1',
                minWidth: '250px',
                padding: '1rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            <button style={{
              padding: '1rem 2rem',
              backgroundColor: 'white',
              color: '#667eea',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p>© {new Date().getFullYear()} ROI Systems. All rights reserved.</p>
      </div>
    </div>
  );
};

// Blog Card Component
const BlogCard: React.FC<{ post: BlogPost }> = ({ post }) => {
  return (
    <article style={{
      backgroundColor: 'white',
      borderRadius: '1rem',
      overflow: 'hidden',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
    }}
    >
      {/* Image Placeholder */}
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '3rem',
        fontWeight: '700'
      }}>
        {post.title.charAt(0)}
      </div>

      <div style={{ padding: '1.5rem', flex: '1', display: 'flex', flexDirection: 'column' }}>
        {/* Category Badge */}
        <div style={{ marginBottom: '1rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            backgroundColor: '#eff6ff',
            color: '#3b82f6',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            {post.category}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '0.75rem',
          lineHeight: '1.4'
        }}>
          {post.title}
        </h3>

        {/* Excerpt */}
        <p style={{
          color: '#6b7280',
          lineHeight: '1.6',
          marginBottom: '1rem',
          flex: '1'
        }}>
          {post.excerpt}
        </p>

        {/* Meta Info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.875rem',
          color: '#9ca3af',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <User size={14} />
            <span>{post.author}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Calendar size={14} />
            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={14} />
            <span>{post.readTime}</span>
          </div>
        </div>

        {/* Tags */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}>
          {post.tags.map(tag => (
            <span key={tag} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              backgroundColor: '#f3f4f6',
              color: '#6b7280',
              borderRadius: '0.375rem',
              fontSize: '0.75rem'
            }}>
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>

        {/* Read More Link */}
        <a
          href={`/blog/${post.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#667eea',
            textDecoration: 'none',
            fontWeight: '600',
            fontSize: '0.875rem'
          }}
        >
          Read More <ArrowRight size={16} />
        </a>
      </div>
    </article>
  );
};

export default Blog;
