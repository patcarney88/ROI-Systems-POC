import { Link } from 'react-router-dom';
import { FileText, Users, TrendingUp, Clock, Shield, Zap, BarChart3, ArrowRight, Star, Sparkles } from 'lucide-react';
import Testimonials from '../components/Testimonials';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div style={{ background: '#0a0a0a', color: 'white', overflow: 'hidden' }}>
      {/* Premium Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(10, 10, 10, 0.8)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1.25rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Sparkles size={24} />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>ROI Systems</span>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <a href="#features" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Features</a>
            <a href="#benefits" style={{ color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontSize: '0.95rem', fontWeight: '500' }}>Benefits</a>
            <Link to="/dashboard/title-agent" style={{
              padding: '0.75rem 1.75rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: '600',
              textDecoration: 'none',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s'
            }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium Design */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8rem 2rem 6rem',
        background: 'radial-gradient(ellipse at top, rgba(102, 126, 234, 0.15) 0%, transparent 50%)',
        overflow: 'hidden'
      }}>
        {/* Animated Background Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '100px 100px',
          opacity: 0.5
        }} />
        
        {/* Gradient Orbs */}
        <div style={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 20s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '10%',
          left: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(118, 75, 162, 0.3) 0%, transparent 70%)',
          filter: 'blur(80px)',
          animation: 'float 15s ease-in-out infinite reverse'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.25rem',
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            borderRadius: '50px',
            marginBottom: '2rem',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            <Star size={16} fill="#667eea" color="#667eea" />
            <span>Trusted by 500+ Title Agencies Nationwide</span>
          </div>

          <h1 style={{
            fontSize: '5rem',
            fontWeight: '800',
            marginBottom: '2rem',
            lineHeight: '1.1',
            letterSpacing: '-0.03em',
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            The Modern Title Agent's<br />Complete Platform
          </h1>
          
          <p style={{
            fontSize: '1.375rem',
            marginBottom: '3rem',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '750px',
            margin: '0 auto 3rem',
            lineHeight: '1.6'
          }}>
            AI-powered document management, automated workflows, and seamless collaboration tools built specifically for title agencies and escrow professionals
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '4rem' }}>
            <Link to="/dashboard/title-agent" style={{
              padding: '1.25rem 3rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              transition: 'all 0.3s',
              border: 'none'
            }}>
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link to="/dashboard/realtor/communications" style={{
              padding: '1.25rem 3rem',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s',
              backdropFilter: 'blur(10px)'
            }}>
              View Live Demo
            </Link>
          </div>

          {/* Trust Indicators */}
          <div style={{
            display: 'flex',
            gap: '3rem',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            opacity: 0.6
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>10,000+</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Documents Processed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>95%</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Client Satisfaction</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.25rem' }}>40hrs</div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>Saved Per Month</div>
            </div>
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

      {/* Features Section - Premium Glassmorphism */}
      <section id="features" style={{ 
        padding: '8rem 2rem',
        position: 'relative',
        background: '#0a0a0a'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '50px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#667eea'
            }}>
              FEATURES
            </div>
            <h2 style={{ 
              fontSize: '3.5rem', 
              fontWeight: '800', 
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Everything You Need to Succeed
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Purpose-built tools for title agencies, escrow officers, and closing coordinators
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: FileText,
                title: 'Intelligent Document Processing',
                description: 'Automatically extract data from title documents, deeds, and closing files. AI-powered OCR eliminates manual data entry.',
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              {
                icon: Shield,
                title: 'Compliance & Security',
                description: 'Bank-level encryption, audit trails, and automated compliance checks. Meet all ALTA Best Practices requirements.',
                gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              },
              {
                icon: Users,
                title: 'Realtor & Lender Collaboration',
                description: 'Seamless communication with realtors, lenders, and buyers. Real-time status updates and document sharing.',
                gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
              },
              {
                icon: Zap,
                title: 'Automated Workflows',
                description: 'Streamline title searches, commitments, and closing processes. Reduce closing time by 40%.',
                gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              },
              {
                icon: BarChart3,
                title: 'Title Agency Analytics',
                description: 'Track order volume, revenue per file, and team productivity. Make data-driven decisions.',
                gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)'
              },
              {
                icon: Clock,
                title: 'Faster Closings',
                description: 'Digital signatures, automated reminders, and instant notifications keep deals moving forward.',
                gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                padding: '2.5rem',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.border = '1px solid rgba(102, 126, 234, 0.3)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              >
                {/* Gradient Glow Effect */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: feature.gradient,
                  opacity: 0.8
                }} />
                
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: feature.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
                }}>
                  <feature.icon size={32} color="white" />
                </div>
                <h3 style={{ 
                  fontSize: '1.5rem', 
                  fontWeight: '700', 
                  color: 'white', 
                  marginBottom: '1rem',
                  letterSpacing: '-0.01em'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  fontSize: '1rem', 
                  color: 'rgba(255,255,255,0.6)', 
                  lineHeight: '1.7'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section - Premium */}
      <section id="benefits" style={{
        padding: '8rem 2rem',
        background: '#0a0a0a',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '50px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#667eea'
            }}>
              BENEFITS
            </div>
            <h2 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Why Choose ROI Systems?
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
              Built by title professionals, for title professionals
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                icon: Zap,
                title: 'Save 40+ Hours Per Month',
                description: 'Automate repetitive tasks and focus on what matters most - closing deals.',
                stat: '40hrs'
              },
              {
                icon: TrendingUp,
                title: 'Increase Revenue by 30%',
                description: 'Better client engagement and follow-up leads to more closed transactions.',
                stat: '+30%'
              },
              {
                icon: Shield,
                title: 'Enterprise-Grade Security',
                description: 'Bank-level encryption and compliance with all real estate regulations.',
                stat: '100%'
              }
            ].map((benefit, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(20px)',
                padding: '3rem',
                borderRadius: '20px',
                textAlign: 'center',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                transition: 'all 0.4s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.border = '1px solid rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)';
              }}
              >
                <div style={{
                  fontSize: '3rem',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  marginBottom: '1rem'
                }}>
                  {benefit.stat}
                </div>
                <div style={{
                  width: '80px',
                  height: '80px',
                  margin: '0 auto 1.5rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)'
                }}>
                  <benefit.icon size={40} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white', marginBottom: '1rem' }}>
                  {benefit.title}
                </h3>
                <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)', lineHeight: '1.7' }}>
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section - Premium */}
      <section style={{
        padding: '8rem 2rem',
        background: '#0a0a0a',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
            <div style={{
              display: 'inline-block',
              padding: '0.5rem 1.25rem',
              background: 'rgba(102, 126, 234, 0.1)',
              border: '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '50px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#667eea'
            }}>
              TESTIMONIALS
            </div>
            <h2 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              What Our Clients Say
            </h2>
            <p style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.6)', maxWidth: '700px', margin: '0 auto', lineHeight: '1.6' }}>
              Join hundreds of satisfied title agencies and real estate professionals
            </p>
          </div>

          <Testimonials />
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section style={{
        padding: '8rem 2rem',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated Background */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
          backgroundSize: '40px 40px',
          opacity: 0.3
        }} />
        
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <h2 style={{ 
            fontSize: '3.5rem', 
            fontWeight: '800', 
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em',
            color: 'white'
          }}>
            Ready to Transform Your Business?
          </h2>
          <p style={{ fontSize: '1.375rem', marginBottom: '3rem', opacity: 0.95, lineHeight: '1.6' }}>
            Join hundreds of title agencies using ROI Systems to close faster, reduce errors, and scale operations
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard/title-agent" style={{
              padding: '1.25rem 3rem',
              background: 'white',
              color: '#667eea',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              transition: 'all 0.3s'
            }}>
              Start Free Trial
              <ArrowRight size={20} />
            </Link>
            <Link to="/dashboard/realtor/communications" style={{
              padding: '1.25rem 3rem',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '2px solid white',
              borderRadius: '12px',
              fontSize: '1.125rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s'
            }}>
              View Live Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Footer - Premium */}
      <footer style={{
        padding: '4rem 2rem',
        background: '#0a0a0a',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={24} />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: '700', letterSpacing: '-0.02em' }}>ROI Systems</span>
            </div>
            <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
              <a href="#features" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.3s' }}>Features</a>
              <a href="#benefits" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.3s' }}>Benefits</a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.3s' }}>Privacy</a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.3s' }}>Terms</a>
              <a href="#" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.3s' }}>Contact</a>
            </div>
          </div>
          <div style={{ 
            paddingTop: '2rem', 
            borderTop: '1px solid rgba(255, 255, 255, 0.1)', 
            textAlign: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: '0.875rem'
          }}>
            © 2025 ROI Systems. All rights reserved. Built for title agencies and escrow professionals.
          </div>
        </div>
      </footer>
    </div>
  );
}
