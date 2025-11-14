/**
 * Privacy Policy Page
 *
 * GDPR and CCPA compliant privacy policy for ROI Systems
 * Real Estate Document Management Platform
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | ROI Systems';
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = 'November 13, 2025';

  return (
    <div className="legal-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="legal-header" style={{ marginBottom: '40px' }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Privacy Policy</h1>
        <p style={{ color: '#666', fontSize: '0.95rem' }}>Last Updated: {lastUpdated}</p>
      </div>

      <div className="legal-content" style={{ lineHeight: '1.8', color: '#333' }}>
        {/* Introduction */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>1. Introduction</h2>
          <p>
            ROI Systems ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect,
            use, disclose, and safeguard your information when you use our Real Estate Document Management Platform (the "Service").
          </p>
          <p style={{ marginTop: '15px' }}>
            This policy complies with the General Data Protection Regulation (GDPR), California Consumer Privacy Act (CCPA),
            and other applicable data protection laws.
          </p>
        </section>

        {/* Information We Collect */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>2. Information We Collect</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>2.1 Personal Information You Provide</h3>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Account Information:</strong> Name, email address, phone number, company name</li>
            <li><strong>Profile Information:</strong> Job title, professional credentials, agency affiliation</li>
            <li><strong>Document Information:</strong> Real estate documents you upload, client data, property information</li>
            <li><strong>Payment Information:</strong> Billing address, payment card details (processed securely through third-party processors)</li>
            <li><strong>Communications:</strong> Messages you send through our platform, support tickets, feedback</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>2.2 Information Automatically Collected</h3>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
            <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
            <li><strong>Location Data:</strong> General location based on IP address</li>
            <li><strong>Cookies and Tracking:</strong> Session cookies, analytics cookies, preference cookies</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>2.3 Information from Third Parties</h3>
          <ul style={{ marginLeft: '20px' }}>
            <li>OAuth providers (Google, Microsoft, Facebook) when you use social login</li>
            <li>Real estate data providers and integrations (e.g., SoftPro 360)</li>
            <li>Analytics and marketing partners</li>
          </ul>
        </section>

        {/* How We Use Your Information */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>3. How We Use Your Information</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>3.1 Legal Bases for Processing (GDPR)</h3>
          <p>We process your personal data under the following legal bases:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Contract Performance:</strong> To provide the Service you've subscribed to</li>
            <li><strong>Legitimate Interests:</strong> To improve our Service, prevent fraud, ensure security</li>
            <li><strong>Consent:</strong> For marketing communications and optional features</li>
            <li><strong>Legal Obligations:</strong> To comply with laws and regulations</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>3.2 Purposes of Use</h3>
          <ul style={{ marginLeft: '20px' }}>
            <li>Provide, maintain, and improve the Service</li>
            <li>Process and manage your documents securely</li>
            <li>Send you transaction emails and important updates</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Analyze usage patterns to enhance user experience</li>
            <li>Detect and prevent fraud, abuse, and security threats</li>
            <li>Send marketing communications (with your consent)</li>
            <li>Comply with legal obligations and enforce our Terms</li>
            <li>AI-powered document analysis and insights</li>
          </ul>
        </section>

        {/* Data Sharing and Disclosure */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>4. How We Share Your Information</h2>
          <p>We do not sell your personal information. We may share your data with:</p>

          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Service Providers:</strong> Cloud hosting (AWS), email services (SendGrid), analytics (Google Analytics)</li>
            <li><strong>AI Services:</strong> Anthropic Claude for document analysis (data processed securely)</li>
            <li><strong>Payment Processors:</strong> Stripe or similar (PCI-DSS compliant)</li>
            <li><strong>Business Partners:</strong> With your explicit consent for integrations</li>
            <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
            <li><strong>Business Transfers:</strong> In connection with merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> Any other sharing requires your explicit permission</li>
          </ul>
        </section>

        {/* Data Retention */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>5. Data Retention</h2>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>Active Accounts:</strong> Data retained while your account is active</li>
            <li><strong>Deleted Accounts:</strong> Personal data deleted within 30 days of account closure</li>
            <li><strong>Legal Requirements:</strong> Some data retained longer to comply with legal obligations (e.g., tax records for 7 years)</li>
            <li><strong>Anonymized Data:</strong> May be retained indefinitely for analytics</li>
          </ul>
        </section>

        {/* Your Rights (GDPR & CCPA) */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>6. Your Privacy Rights</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>6.1 GDPR Rights (EU/EEA Users)</h3>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
            <li><strong>Right to Restriction:</strong> Limit how we use your data</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
            <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your data protection authority</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>6.2 CCPA Rights (California Residents)</h3>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Right to Know:</strong> What personal information we collect, use, and share</li>
            <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
            <li><strong>Right to Opt-Out:</strong> Opt-out of sale of personal information (we don't sell data)</li>
            <li><strong>Right to Non-Discrimination:</strong> Equal service regardless of exercising your rights</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>6.3 How to Exercise Your Rights</h3>
          <p>To exercise any of these rights, please:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Email us at: <a href="mailto:privacy@roi-systems.com" style={{ color: '#2563eb' }}>privacy@roi-systems.com</a></li>
            <li>Use the "Privacy Settings" in your account dashboard</li>
            <li>Contact our Data Protection Officer at: <a href="mailto:dpo@roi-systems.com" style={{ color: '#2563eb' }}>dpo@roi-systems.com</a></li>
          </ul>
          <p style={{ marginTop: '15px' }}>We will respond to your request within 30 days (GDPR) or 45 days (CCPA).</p>
        </section>

        {/* Data Security */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>7. Data Security</h2>
          <p>We implement industry-standard security measures to protect your data:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Encryption:</strong> TLS 1.3 for data in transit, AES-256 for data at rest</li>
            <li><strong>Access Controls:</strong> Role-based access, multi-factor authentication</li>
            <li><strong>Infrastructure:</strong> AWS with SOC 2 Type II compliance</li>
            <li><strong>Monitoring:</strong> 24/7 security monitoring and threat detection</li>
            <li><strong>Backups:</strong> Regular encrypted backups with disaster recovery</li>
            <li><strong>Employee Training:</strong> Annual security and privacy training</li>
            <li><strong>Penetration Testing:</strong> Regular security audits and assessments</li>
          </ul>
          <p>
            <strong>Note:</strong> While we implement robust security measures, no system is 100% secure.
            We cannot guarantee absolute security of data transmitted over the internet.
          </p>
        </section>

        {/* Cookies and Tracking */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>8. Cookies and Tracking Technologies</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>8.1 Types of Cookies We Use</h3>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li><strong>Essential Cookies:</strong> Required for the Service to function (authentication, security)</li>
            <li><strong>Performance Cookies:</strong> Analyze how you use the Service (Google Analytics)</li>
            <li><strong>Functional Cookies:</strong> Remember your preferences and settings</li>
            <li><strong>Marketing Cookies:</strong> Track effectiveness of our marketing (with consent)</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>8.2 Cookie Management</h3>
          <p>You can control cookies through:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Browser settings (block all cookies or only third-party cookies)</li>
            <li>Our cookie consent banner (manage preferences)</li>
            <li>Privacy settings in your account dashboard</li>
          </ul>
          <p style={{ marginTop: '15px' }}>
            <strong>Note:</strong> Blocking essential cookies may prevent the Service from functioning properly.
          </p>
        </section>

        {/* International Data Transfers */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>9. International Data Transfers</h2>
          <p>
            Your data may be transferred to and processed in countries other than your own. We ensure adequate protection through:
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li><strong>Standard Contractual Clauses:</strong> EU-approved data transfer agreements</li>
            <li><strong>Adequacy Decisions:</strong> Transfers to countries deemed adequate by the EU Commission</li>
            <li><strong>Your Consent:</strong> Explicit consent for transfers where required</li>
          </ul>
        </section>

        {/* Children's Privacy */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>10. Children's Privacy</h2>
          <p>
            Our Service is not directed to individuals under 16 (or 13 in the U.S.). We do not knowingly collect personal
            information from children. If we discover we have collected data from a child, we will delete it immediately.
          </p>
          <p style={{ marginTop: '15px' }}>
            If you believe we have collected data from a child, please contact us at:
            <a href="mailto:privacy@roi-systems.com" style={{ color: '#2563eb' }}> privacy@roi-systems.com</a>
          </p>
        </section>

        {/* Third-Party Links */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>11. Third-Party Links and Services</h2>
          <p>
            Our Service may contain links to third-party websites and services. We are not responsible for the privacy practices
            of these third parties. Please review their privacy policies before providing any information.
          </p>
        </section>

        {/* Changes to Privacy Policy */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>12. Changes to This Privacy Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. We will notify you of material changes by:
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Posting the updated policy on this page with a new "Last Updated" date</li>
            <li>Sending you an email notification (for significant changes)</li>
            <li>Displaying a prominent notice on the Service</li>
          </ul>
          <p style={{ marginTop: '15px' }}>
            Continued use of the Service after changes constitutes acceptance of the updated Privacy Policy.
          </p>
        </section>

        {/* Contact Information */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>13. Contact Us</h2>
          <p>If you have questions about this Privacy Policy or our privacy practices, please contact us:</p>

          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <p><strong>ROI Systems</strong></p>
            <p>Privacy Team</p>
            <p>Email: <a href="mailto:privacy@roi-systems.com" style={{ color: '#2563eb' }}>privacy@roi-systems.com</a></p>
            <p>Data Protection Officer: <a href="mailto:dpo@roi-systems.com" style={{ color: '#2563eb' }}>dpo@roi-systems.com</a></p>
            <p style={{ marginTop: '15px' }}>
              <Link to="/contact" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Contact Form →
              </Link>
            </p>
          </div>
        </section>

        {/* CCPA Notice */}
        <section style={{ marginBottom: '40px', background: '#eff6ff', padding: '30px', borderRadius: '8px', border: '2px solid #2563eb' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1e40af' }}>
            California Consumer Privacy Act (CCPA) Notice
          </h2>
          <p><strong>Categories of Personal Information Collected (Last 12 Months):</strong></p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Identifiers (name, email, IP address)</li>
            <li>Commercial information (transaction history)</li>
            <li>Internet activity (usage data, cookies)</li>
            <li>Professional information (job title, company)</li>
            <li>Inferences (preferences, characteristics)</li>
          </ul>

          <p><strong>Business Purposes for Collection:</strong></p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Providing and improving the Service</li>
            <li>Customer support and communications</li>
            <li>Security and fraud prevention</li>
            <li>Legal compliance</li>
          </ul>

          <p><strong>Categories of Third Parties We Share With:</strong></p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Service providers (hosting, analytics, payment processing)</li>
            <li>AI service providers (Anthropic)</li>
            <li>Government entities (when legally required)</li>
          </ul>

          <p style={{ marginTop: '20px', fontWeight: '600' }}>
            We do NOT sell your personal information and have not sold personal information in the last 12 months.
          </p>
        </section>

        {/* GDPR Notice */}
        <section style={{ marginBottom: '40px', background: '#f0fdf4', padding: '30px', borderRadius: '8px', border: '2px solid #16a34a' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#15803d' }}>
            GDPR Rights for EU/EEA Users
          </h2>
          <p>
            If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland, you have specific rights under
            the General Data Protection Regulation (GDPR):
          </p>

          <div style={{ marginTop: '20px' }}>
            <p><strong>Data Controller:</strong> ROI Systems</p>
            <p><strong>Legal Representative (EU):</strong> [To be appointed]</p>
            <p><strong>Supervisory Authority:</strong> Your local data protection authority</p>
          </div>

          <p style={{ marginTop: '20px' }}>
            <strong>To exercise your GDPR rights or file a complaint:</strong>
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Contact our DPO: <a href="mailto:dpo@roi-systems.com" style={{ color: '#16a34a' }}>dpo@roi-systems.com</a></li>
            <li>Lodge a complaint with your local supervisory authority</li>
          </ul>
        </section>
      </div>

      <div className="legal-footer" style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          © 2025 ROI Systems. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/terms" style={{ color: '#2563eb', textDecoration: 'none' }}>Terms of Service</Link>
          <Link to="/contact" style={{ color: '#2563eb', textDecoration: 'none' }}>Contact Us</Link>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
