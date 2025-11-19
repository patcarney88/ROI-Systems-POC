import React from 'react';
import { Target, Users, Zap, Shield, TrendingUp, Award } from 'lucide-react';

const About: React.FC = () => {
  return (
    <div style={{
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      color: '#1f2937'
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
            About ROI Systems
          </h1>
          <p style={{ fontSize: '1.25rem', opacity: 0.95, lineHeight: '1.8' }}>
            Transforming the real estate industry through AI-powered document management
            and intelligent client retention solutions.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#111827' }}>
            Our Mission
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6b7280', maxWidth: '800px', margin: '0 auto', lineHeight: '1.8' }}>
            To empower real estate professionals with cutting-edge technology that automates tedious tasks,
            strengthens client relationships, and drives measurable business growth.
          </p>
        </div>

        {/* Value Props Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          <ValueCard
            icon={<Target size={32} />}
            title="Focused Innovation"
            description="We're laser-focused on solving the unique challenges faced by title agencies, realtors, and real estate professionals."
          />
          <ValueCard
            icon={<Zap size={32} />}
            title="AI-Powered Automation"
            description="Our machine learning algorithms process documents 10x faster than manual methods, reducing errors and saving time."
          />
          <ValueCard
            icon={<Shield size={32} />}
            title="Enterprise Security"
            description="Bank-level encryption, SOC 2 Type II compliance, and rigorous security audits protect your sensitive data."
          />
        </div>
      </section>

      {/* Story Section */}
      <section style={{ backgroundColor: '#f9fafb', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827', textAlign: 'center' }}>
            Our Story
          </h2>
          <div style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#374151' }}>
            <p style={{ marginBottom: '1.5rem' }}>
              ROI Systems was founded in 2023 by a team of real estate technology veterans who witnessed firsthand
              the inefficiencies plaguing the industry. Title agencies were drowning in paperwork, realtors were
              losing track of clients, and valuable relationships were slipping through the cracks.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              We knew there had to be a better way. By combining decades of industry expertise with the latest
              advances in artificial intelligence and cloud computing, we built ROI Systems from the ground up to
              address these pain points.
            </p>
            <p style={{ marginBottom: '1.5rem' }}>
              Today, ROI Systems serves over 500+ real estate professionals across the United States, processing
              millions of documents annually and helping our clients recapture tens of thousands of dollars in lost
              revenue through intelligent client retention.
            </p>
            <p>
              But we're just getting started. Our vision is to become the operating system for the modern real
              estate professional—the single platform that handles everything from document management to marketing
              automation to predictive analytics.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem',
          textAlign: 'center'
        }}>
          <StatCard value="500+" label="Active Users" />
          <StatCard value="2M+" label="Documents Processed" />
          <StatCard value="98.5%" label="Customer Satisfaction" />
          <StatCard value="10x" label="Faster Processing" />
        </div>
      </section>

      {/* Team Values */}
      <section style={{ backgroundColor: '#f9fafb', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '3rem', color: '#111827', textAlign: 'center' }}>
            Our Core Values
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem'
          }}>
            <ValueCard
              icon={<Users size={32} />}
              title="Customer First"
              description="Every feature we build, every decision we make, starts with understanding our customers' needs."
            />
            <ValueCard
              icon={<TrendingUp size={32} />}
              title="Continuous Improvement"
              description="We iterate relentlessly, shipping updates weekly based on user feedback and industry trends."
            />
            <ValueCard
              icon={<Award size={32} />}
              title="Excellence"
              description="We hold ourselves to the highest standards of quality, reliability, and customer support."
            />
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section style={{ maxWidth: '1200px', margin: '4rem auto', padding: '0 2rem' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '2rem', color: '#111827', textAlign: 'center' }}>
          Built on Cutting-Edge Technology
        </h2>
        <div style={{ fontSize: '1.125rem', lineHeight: '1.8', color: '#374151', maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            ROI Systems leverages the latest advancements in cloud computing, artificial intelligence, and data science:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1.5rem' }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Natural Language Processing (NLP)</strong> for intelligent document extraction
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Machine Learning</strong> for predictive client retention scoring
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Cloud-Native Architecture</strong> for 99.99% uptime and scalability
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>Real-Time Analytics</strong> powered by modern data pipelines
            </li>
            <li style={{ marginBottom: '0.5rem' }}>
              <strong>API-First Design</strong> for seamless integrations with existing tools
            </li>
          </ul>
          <p>
            Our infrastructure is built on industry-leading platforms including AWS, PostgreSQL, Redis, and Elasticsearch,
            ensuring enterprise-grade performance, security, and reliability.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
        marginTop: '4rem'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem' }}>
            Join 500+ Real Estate Professionals
          </h2>
          <p style={{ fontSize: '1.125rem', marginBottom: '2rem', opacity: 0.95 }}>
            Experience the power of AI-driven document management and client retention.
            Start your free trial today—no credit card required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="/dashboard/title-agent"
              style={{
                backgroundColor: 'white',
                color: '#667eea',
                padding: '0.875rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'inline-block',
                transition: 'transform 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              Try Demo Dashboard
            </a>
            <a
              href="/contact"
              style={{
                backgroundColor: 'transparent',
                color: 'white',
                padding: '0.875rem 2rem',
                borderRadius: '0.5rem',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '1rem',
                display: 'inline-block',
                border: '2px solid white',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#667eea';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'white';
              }}
            >
              Contact Sales
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div style={{
        maxWidth: '1200px',
        margin: '3rem auto 2rem',
        padding: '2rem',
        textAlign: 'center',
        color: '#6b7280',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p>© {new Date().getFullYear()} ROI Systems. All rights reserved.</p>
      </div>
    </div>
  );
};

// Helper Components
const ValueCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default'
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
    <div style={{ color: '#667eea', marginBottom: '1rem' }}>
      {icon}
    </div>
    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#111827' }}>
      {title}
    </h3>
    <p style={{ color: '#6b7280', lineHeight: '1.6' }}>
      {description}
    </p>
  </div>
);

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <div>
    <div style={{ fontSize: '3rem', fontWeight: '700', color: '#667eea', marginBottom: '0.5rem' }}>
      {value}
    </div>
    <div style={{ fontSize: '1.125rem', color: '#6b7280', fontWeight: '500' }}>
      {label}
    </div>
  </div>
);

export default About;
