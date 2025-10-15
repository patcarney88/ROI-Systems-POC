import { useState } from 'react';
import { HelpCircle, Search, Book, MessageCircle, Mail, Phone, FileText, Video, ExternalLink } from 'lucide-react';

export default function HelpSupport() {
  const [searchQuery, setSearchQuery] = useState('');

  const faqCategories = [
    {
      title: 'Getting Started',
      icon: Book,
      questions: [
        { q: 'How do I upload documents?', a: 'Navigate to the Documents page and click the "Upload Document" button. Select your files and fill in the required metadata.' },
        { q: 'How do I add a new client?', a: 'Go to the Clients page and click "Add Client". Fill in their information and click Save.' },
        { q: 'How do I create a campaign?', a: 'Visit the Campaigns page, click "Create Campaign", choose your template, select recipients, and schedule or send immediately.' },
      ]
    },
    {
      title: 'Document Management',
      icon: FileText,
      questions: [
        { q: 'What file types are supported?', a: 'We support PDF, DOC, DOCX, JPG, PNG, and most common document formats up to 50MB per file.' },
        { q: 'How long are documents stored?', a: 'Documents are stored securely for 10 years with bank-level encryption and daily backups.' },
        { q: 'Can I share documents with clients?', a: 'Yes! Click the share button on any document to generate a secure link or send directly to clients.' },
      ]
    },
    {
      title: 'Security & Privacy',
      icon: FileText,
      questions: [
        { q: 'Is my data secure?', a: 'Yes, we use bank-level 256-bit encryption, SOC 2 compliance, and regular security audits.' },
        { q: 'Who can access my documents?', a: 'Only you and users you explicitly share with can access your documents. We never share your data.' },
        { q: 'Can I enable two-factor authentication?', a: 'Yes, enable 2FA in Settings > Security for an extra layer of protection.' },
      ]
    },
  ];

  const resources = [
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: Video,
      link: '#',
      color: '#667eea'
    },
    {
      title: 'Documentation',
      description: 'Comprehensive user guides',
      icon: Book,
      link: '#',
      color: '#10b981'
    },
    {
      title: 'API Reference',
      description: 'For developers and integrations',
      icon: FileText,
      link: '#',
      color: '#f59e0b'
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <HelpCircle size={32} style={{ marginRight: '12px' }} />
            Help & Support
          </h1>
          <p className="page-subtitle">Find answers and get help when you need it</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '2rem', marginTop: '2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            How can we help you?
          </h2>
          <div className="search-box" style={{ marginBottom: 0 }}>
            <Search className="search-icon" size={20} />
            <input
              type="text"
              className="search-input"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Contact Options */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <MessageCircle size={32} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Live Chat
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            Chat with our support team
          </p>
          <button className="btn btn-primary">
            Start Chat
          </button>
        </div>

        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Mail size={32} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Email Support
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            support@roisystems.com
          </p>
          <button className="btn btn-secondary">
            Send Email
          </button>
        </div>

        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 1rem',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Phone size={32} color="white" />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Phone Support
          </h3>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            1-800-ROI-HELP
          </p>
          <button className="btn btn-secondary">
            Call Us
          </button>
        </div>
      </div>

      {/* Resources */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          Resources
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.link}
              style={{
                textDecoration: 'none',
                color: 'inherit'
              }}
            >
              <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'all 0.3s' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${resource.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <resource.icon size={24} color={resource.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {resource.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {resource.description}
                  </p>
                </div>
                <ExternalLink size={20} color="#6b7280" />
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <category.icon size={20} color="white" />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                  {category.title}
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {category.questions.map((item, qIndex) => (
                  <div key={qIndex}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.5rem', color: '#374151' }}>
                      {item.q}
                    </h4>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', lineHeight: '1.6' }}>
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Still Need Help */}
      <div className="card" style={{ padding: '3rem', marginTop: '3rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '1rem' }}>
          Still need help?
        </h2>
        <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.9 }}>
          Our support team is here to help you succeed
        </p>
        <button style={{
          padding: '1rem 2rem',
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          Contact Support Team
        </button>
      </div>
    </div>
  );
}
