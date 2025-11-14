import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './About.css';

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'About Us | ROI Systems';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <button onClick={() => navigate(-1)} className="back-button">
            ← Back
          </button>
          <h1>About ROI Systems</h1>
          <p className="hero-subtitle">
            Transforming real estate document management with AI-powered intelligence
          </p>
        </div>
      </section>

      {/* Our Heritage */}
      <section className="heritage-section">
        <div className="container">
          <div className="content-grid">
            <div className="text-content">
              <h2>Our Heritage: Building on Digital Docs Excellence</h2>
              <p className="lead">
                ROI Systems is built on the foundation of Digital Docs, a pioneering force in real estate
                document management that revolutionized how professionals handle property transactions.
              </p>
              <p>
                For over a decade, Digital Docs established itself as the industry standard for secure,
                efficient document processing in real estate. Our platform continues this legacy while
                taking it further with cutting-edge AI technology and modern cloud infrastructure.
              </p>
              <p>
                We've maintained the core values that made Digital Docs trusted by thousands of real estate
                professionals: security, reliability, and unwavering commitment to customer success. Now,
                we're enhancing these foundations with artificial intelligence that learns, adapts, and
                delivers unprecedented ROI for our clients.
              </p>
            </div>
            <div className="image-content">
              <div className="stats-card">
                <div className="stat">
                  <div className="stat-number">10+</div>
                  <div className="stat-label">Years of Excellence</div>
                </div>
                <div className="stat">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Documents Processed</div>
                </div>
                <div className="stat">
                  <div className="stat-number">1000+</div>
                  <div className="stat-label">Clients Served</div>
                </div>
                <div className="stat">
                  <div className="stat-number">99.9%</div>
                  <div className="stat-label">Uptime Guarantee</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mission-section">
        <div className="container">
          <div className="mission-grid">
            <div className="mission-card">
              <div className="card-icon">🎯</div>
              <h3>Our Mission</h3>
              <p>
                To empower real estate professionals with intelligent document management solutions
                that save time, reduce errors, and maximize return on investment through the power
                of artificial intelligence.
              </p>
            </div>
            <div className="mission-card">
              <div className="card-icon">🔮</div>
              <h3>Our Vision</h3>
              <p>
                To become the industry-leading platform where every real estate transaction is
                powered by AI-driven insights, enabling professionals to focus on relationships
                while we handle the complexity.
              </p>
            </div>
            <div className="mission-card">
              <div className="card-icon">💎</div>
              <h3>Our Values</h3>
              <p>
                Security first, innovation always, customer success obsessed. We believe in
                transparent operations, ethical AI, and building technology that truly serves
                the people who use it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="differentiation-section">
        <div className="container">
          <h2 className="section-title">What Makes Us Different</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3>AI-Powered Intelligence</h3>
              <p>
                Advanced machine learning models that understand real estate documents, extract
                key information, and provide actionable insights automatically.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Bank-Level Security</h3>
              <p>
                Enterprise-grade encryption, SOC 2 compliance, and multi-factor authentication
                protect your sensitive documents and client data at every level.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Lightning Fast</h3>
              <p>
                Cloud-native architecture delivers instant document processing, real-time
                collaboration, and seamless scaling as your business grows.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎓</div>
              <h3>Industry Expertise</h3>
              <p>
                Built by real estate professionals who understand your workflows, compliance
                requirements, and the unique challenges of property transactions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Data-Driven Insights</h3>
              <p>
                Comprehensive analytics and reporting help you understand trends, optimize
                processes, and make informed business decisions.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>White-Glove Support</h3>
              <p>
                Dedicated customer success team, comprehensive training, and 24/7 technical
                support ensure you're never stuck.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="timeline-section">
        <div className="container">
          <h2 className="section-title">Our Journey</h2>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-year">2010</div>
              <div className="timeline-content">
                <h3>Digital Docs Founded</h3>
                <p>
                  Launched with a vision to digitize real estate document management and
                  eliminate paper-based workflows.
                </p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-year">2015</div>
              <div className="timeline-content">
                <h3>Industry Recognition</h3>
                <p>
                  Awarded "Best Real Estate Technology Platform" and reached 500+ active clients
                  nationwide.
                </p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-year">2020</div>
              <div className="timeline-content">
                <h3>AI Integration Begins</h3>
                <p>
                  Pioneered machine learning for document classification and data extraction in
                  real estate sector.
                </p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-year">2023</div>
              <div className="timeline-content">
                <h3>ROI Systems Launch</h3>
                <p>
                  Complete platform transformation with advanced AI, modern architecture, and
                  enhanced security features.
                </p>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-year">2025</div>
              <div className="timeline-content">
                <h3>Next Generation Platform</h3>
                <p>
                  Introducing predictive analytics, automated compliance checking, and
                  AI-powered transaction insights.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="team-section">
        <div className="container">
          <h2 className="section-title">Leadership Team</h2>
          <p className="section-description">
            Led by industry veterans with decades of combined experience in real estate,
            technology, and artificial intelligence.
          </p>
          <div className="team-grid">
            <div className="team-member">
              <div className="member-avatar">👨‍💼</div>
              <h3>Michael Chen</h3>
              <p className="member-title">CEO & Co-Founder</p>
              <p className="member-bio">
                Former real estate broker turned technologist. 15+ years building platforms
                that solve real-world industry problems.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">👩‍💼</div>
              <h3>Sarah Johnson</h3>
              <p className="member-title">CTO & Co-Founder</p>
              <p className="member-bio">
                AI researcher and cloud architect. Led engineering teams at major tech
                companies before founding ROI Systems.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">👨‍💼</div>
              <h3>David Rodriguez</h3>
              <p className="member-title">VP of Product</p>
              <p className="member-bio">
                Product strategist with deep real estate expertise. Drives innovation in
                document intelligence and user experience.
              </p>
            </div>
            <div className="team-member">
              <div className="member-avatar">👩‍💼</div>
              <h3>Emily Watson</h3>
              <p className="member-title">VP of Customer Success</p>
              <p className="member-bio">
                Customer-obsessed leader ensuring every client achieves measurable ROI and
                operational excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Document Management?</h2>
            <p>
              Join hundreds of real estate professionals who trust ROI Systems to streamline
              their operations and boost productivity.
            </p>
            <div className="cta-buttons">
              <button onClick={() => navigate('/contact')} className="btn-primary">
                Schedule a Demo
              </button>
              <button onClick={() => navigate('/docs')} className="btn-secondary">
                View Documentation
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
