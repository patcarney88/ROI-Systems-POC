import { Link } from 'react-router-dom';
import { FileText, Users, TrendingUp, Mail, Clock, Shield, Zap, BarChart3, MessageSquare, Home } from 'lucide-react';

export default function LandingPage() {
  return (
    <div style={{ background: 'white' }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '6rem 2rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: '800',
            marginBottom: '1.5rem',
            lineHeight: '1.2'
          }}>
            Transform Your Real Estate Business
          </h1>
          <p style={{
            fontSize: '1.5rem',
            marginBottom: '3rem',
            opacity: 0.95,
            maxWidth: '800px',
            margin: '0 auto 3rem'
          }}>
            AI-powered document management, client engagement, and marketing automation for modern real estate professionals
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard/title-agent" style={{
              padding: '1rem 2.5rem',
              background: 'white',
              color: '#667eea',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Get Started
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
            <button style={{
              padding: '1rem 2.5rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#667eea';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.color = 'white';
            }}
            >
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{
        padding: '4rem 2rem',
        background: '#f9fafb',
        borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          {[
            { value: '10,000+', label: 'Documents Processed', icon: FileText },
            { value: '500+', label: 'Active Agents', icon: Users },
            { value: '95%', label: 'Client Satisfaction', icon: TrendingUp },
            { value: '40hrs', label: 'Saved Per Month', icon: Clock }
          ].map((stat, index) => (
            <div key={index} style={{ textAlign: 'center' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1rem',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <stat.icon size={32} />
              </div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '0.5rem' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '1rem', color: '#6b7280' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '1rem' }}>
              Everything You Need to Succeed
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#6b7280', maxWidth: '700px', margin: '0 auto' }}>
              Powerful tools designed specifically for real estate professionals
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: FileText,
                title: 'AI Document Management',
                description: 'Automatically extract, analyze, and organize real estate documents with advanced AI technology.',
                color: '#3b82f6'
              },
              {
                icon: MessageSquare,
                title: 'Smart Communication Hub',
                description: 'Centralized inbox with AI-powered templates and automated responses for faster client communication.',
                color: '#10b981'
              },
              {
                icon: Mail,
                title: 'Marketing Automation',
                description: 'Create and launch personalized email campaigns that engage clients and drive conversions.',
                color: '#8b5cf6'
              },
              {
                icon: BarChart3,
                title: 'Advanced Analytics',
                description: 'Real-time insights into your business performance, client engagement, and revenue opportunities.',
                color: '#f59e0b'
              },
              {
                icon: Users,
                title: 'Client Relationship Management',
                description: 'Track every interaction, manage relationships, and never miss a follow-up opportunity.',
                color: '#ec4899'
              },
              {
                icon: Home,
                title: 'Homeowner Portal',
                description: 'Give your clients a beautiful portal to track their property value and stay connected.',
                color: '#06b6d4'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '2rem',
                borderRadius: '16px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  background: `${feature.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <feature.icon size={28} color={feature.color} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#111827', marginBottom: '1rem' }}>
              Why Choose ROI Systems?
            </h2>
            <p style={{ fontSize: '1.25rem', color: '#6b7280' }}>
              Built by real estate professionals, for real estate professionals
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: Zap,
                title: 'Save 40+ Hours Per Month',
                description: 'Automate repetitive tasks and focus on what matters most - closing deals.'
              },
              {
                icon: TrendingUp,
                title: 'Increase Revenue by 30%',
                description: 'Better client engagement and follow-up leads to more closed transactions.'
              },
              {
                icon: Shield,
                title: 'Enterprise-Grade Security',
                description: 'Bank-level encryption and compliance with all real estate regulations.'
              }
            ].map((benefit, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
              }}>
                <div style={{
                  width: '72px',
                  height: '72px',
                  margin: '0 auto 1.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <benefit.icon size={36} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#111827', marginBottom: '1rem' }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: '1rem', color: '#6b7280', lineHeight: '1.6' }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '6rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1.5rem' }}>
            Ready to Transform Your Business?
          </h2>
          <p style={{ fontSize: '1.25rem', marginBottom: '3rem', opacity: 0.95 }}>
            Join hundreds of successful real estate professionals using ROI Systems
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard/title-agent" style={{
              padding: '1rem 2.5rem',
              background: 'white',
              color: '#667eea',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
            }}>
              Start Free Trial
            </Link>
            <Link to="/dashboard/realtor/communications" style={{
              padding: '1rem 2.5rem',
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '3rem 2rem',
        background: '#111827',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            ROI Systems
          </div>
          <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
            Real Estate Document Management & Client Engagement Platform
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', fontSize: '0.875rem', color: '#9ca3af' }}>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Privacy Policy</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Terms of Service</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Contact Us</a>
            <a href="#" style={{ color: '#9ca3af', textDecoration: 'none' }}>Support</a>
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #374151', color: '#6b7280', fontSize: '0.875rem' }}>
            © 2025 ROI Systems. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
