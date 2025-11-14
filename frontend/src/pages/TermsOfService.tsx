/**
 * Terms of Service Page
 *
 * Legal terms for ROI Systems Real Estate Document Management Platform
 * Industry-specific terms for real estate professionals
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service | ROI Systems';
    window.scrollTo(0, 0);
  }, []);

  const lastUpdated = 'November 13, 2025';
  const effectiveDate = 'January 1, 2025';

  return (
    <div className="legal-page" style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div className="legal-header" style={{ marginBottom: '40px' }}>
        <Link to="/" style={{ color: '#2563eb', textDecoration: 'none', marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Home
        </Link>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Terms of Service</h1>
        <p style={{ color: '#666', fontSize: '0.95rem' }}>Last Updated: {lastUpdated}</p>
        <p style={{ color: '#666', fontSize: '0.95rem' }}>Effective Date: {effectiveDate}</p>
      </div>

      <div className="legal-content" style={{ lineHeight: '1.8', color: '#333' }}>
        {/* Agreement to Terms */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>1. Agreement to Terms</h2>
          <p>
            These Terms of Service ("Terms") constitute a legally binding agreement between you ("User," "you," or "your")
            and ROI Systems ("Company," "we," "our," or "us") regarding your use of the ROI Systems Real Estate Document
            Management Platform (the "Service").
          </p>
          <p style={{ marginTop: '15px' }}>
            <strong>BY ACCESSING OR USING THE SERVICE, YOU AGREE TO BE BOUND BY THESE TERMS.</strong> If you do not agree
            to these Terms, you may not access or use the Service.
          </p>
        </section>

        {/* Eligibility */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>2. Eligibility</h2>
          <p>To use the Service, you must:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Be at least 18 years of age</li>
            <li>Be a licensed real estate professional, title company representative, or authorized representative of a real estate agency</li>
            <li>Have the authority to bind yourself or your organization to these Terms</li>
            <li>Not be prohibited from using the Service under applicable law</li>
            <li>Maintain active professional licensing and credentials as required by your jurisdiction</li>
          </ul>
        </section>

        {/* Account Registration */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>3. Account Registration and Security</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>3.1 Account Creation</h3>
          <p>To access the Service, you must create an account by providing:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Accurate and complete registration information</li>
            <li>Valid professional credentials and licensing information</li>
            <li>A valid email address and phone number</li>
            <li>Verification of your real estate agency affiliation (if applicable)</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>3.2 Account Security</h3>
          <p>You are responsible for:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Immediately notifying us of any unauthorized access or security breach</li>
            <li>Implementing multi-factor authentication (MFA) when required</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>3.3 Account Termination</h3>
          <p>We reserve the right to suspend or terminate your account if:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>You violate these Terms</li>
            <li>Your professional license expires or is revoked</li>
            <li>We detect fraudulent or illegal activity</li>
            <li>Your account remains inactive for more than 12 months</li>
          </ul>
        </section>

        {/* Service Description */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>4. Service Description</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>4.1 Features</h3>
          <p>The Service provides real estate professionals with:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Secure document upload, storage, and management</li>
            <li>AI-powered document analysis and insights</li>
            <li>Client relationship management tools</li>
            <li>Marketing campaign automation</li>
            <li>Document expiration tracking and alerts</li>
            <li>Integration with third-party real estate systems</li>
            <li>Collaboration tools for team members</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>4.2 Service Modifications</h3>
          <p>
            We reserve the right to modify, suspend, or discontinue any feature of the Service at any time with or without
            notice. We are not liable for any modification, suspension, or discontinuation of the Service.
          </p>
        </section>

        {/* Real Estate Specific Terms */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>5. Real Estate Industry-Specific Terms</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>5.1 Professional Responsibilities</h3>
          <p>As a real estate professional using the Service, you acknowledge and agree that:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>You are solely responsible for compliance with all applicable real estate laws and regulations</li>
            <li>You must comply with federal, state, and local fair housing laws</li>
            <li>You are responsible for obtaining necessary client consents and disclosures</li>
            <li>You must maintain client confidentiality as required by law and professional ethics</li>
            <li>The Service does NOT provide legal, financial, or tax advice</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>5.2 Document Handling</h3>
          <p>Regarding real estate documents uploaded to the Service:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>You represent that you have the legal right to upload and share documents</li>
            <li>You have obtained all necessary consents from clients and parties</li>
            <li>Documents must not contain fraudulent or misleading information</li>
            <li>You comply with record retention requirements in your jurisdiction</li>
            <li>Sensitive information (SSNs, financial data) should be redacted when appropriate</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>5.3 MLS and Data Compliance</h3>
          <p>If you upload MLS data or listings:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>You must comply with your MLS rules and regulations</li>
            <li>Respect copyright and data usage restrictions</li>
            <li>Ensure data accuracy and timely updates</li>
            <li>Obtain proper licensing for data usage</li>
          </ul>
        </section>

        {/* User Content and Ownership */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>6. User Content and Intellectual Property</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>6.1 Your Content</h3>
          <p>
            You retain all ownership rights to content you upload ("User Content"). By uploading content, you grant us
            a limited, non-exclusive, royalty-free license to:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Store, process, and transmit your User Content</li>
            <li>Provide the Service to you and your authorized users</li>
            <li>Create backups and ensure data security</li>
            <li>Perform AI analysis on documents (only with your consent)</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>6.2 Prohibited Content</h3>
          <p>You may not upload content that:</p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Violates any law or regulation</li>
            <li>Infringes on third-party intellectual property rights</li>
            <li>Contains malware, viruses, or harmful code</li>
            <li>Contains discriminatory, harassing, or offensive material</li>
            <li>Violates fair housing laws or regulations</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>6.3 Our Intellectual Property</h3>
          <p>
            The Service, including all software, design, text, graphics, and trademarks, is owned by ROI Systems and
            protected by copyright, trademark, and other intellectual property laws. You may not:
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Copy, modify, or create derivative works of the Service</li>
            <li>Reverse engineer or decompile any part of the Service</li>
            <li>Remove or alter any copyright or proprietary notices</li>
            <li>Use our trademarks without written permission</li>
          </ul>
        </section>

        {/* Payment Terms */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>7. Payment Terms</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>7.1 Subscription Plans</h3>
          <p>
            The Service is offered on a subscription basis with various pricing tiers. By subscribing, you agree to pay
            all fees associated with your chosen plan.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>7.2 Billing</h3>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Subscriptions automatically renew unless cancelled</li>
            <li>Fees are billed in advance on a monthly or annual basis</li>
            <li>We accept credit cards and ACH payments</li>
            <li>You authorize us to charge your payment method on file</li>
            <li>Failed payments may result in service suspension</li>
          </ul>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>7.3 Refunds</h3>
          <p>
            Subscription fees are non-refundable except as required by law. We offer a 14-day money-back guarantee
            for new subscribers.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>7.4 Price Changes</h3>
          <p>
            We reserve the right to change subscription prices with 30 days' advance notice. Continued use after
            price changes constitutes acceptance of new pricing.
          </p>
        </section>

        {/* Acceptable Use Policy */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>8. Acceptable Use Policy</h2>
          <p>You agree NOT to:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Violate any laws, regulations, or third-party rights</li>
            <li>Upload fraudulent, misleading, or discriminatory content</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorized access to systems or accounts</li>
            <li>Use the Service for spam, phishing, or malicious activity</li>
            <li>Share your account credentials with unauthorized parties</li>
            <li>Scrape, mine, or harvest data from the Service without permission</li>
            <li>Use the Service to violate fair housing or anti-discrimination laws</li>
            <li>Resell or redistribute the Service without authorization</li>
          </ul>
        </section>

        {/* Privacy and Data Protection */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>9. Privacy and Data Protection</h2>
          <p>
            Your use of the Service is also governed by our <Link to="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</Link>,
            which explains how we collect, use, and protect your data. By using the Service, you consent to our data
            practices as described in the Privacy Policy.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>9.1 Data Security</h3>
          <p>We implement industry-standard security measures, but you acknowledge that:</p>
          <ul style={{ marginLeft: '20px' }}>
            <li>No system is 100% secure</li>
            <li>You are responsible for maintaining secure passwords</li>
            <li>You should not share sensitive client information unnecessarily</li>
          </ul>
        </section>

        {/* Disclaimers and Warranties */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>10. Disclaimers and Warranties</h2>

          <div style={{ background: '#fef3c7', padding: '20px', borderRadius: '8px', border: '2px solid #f59e0b', marginBottom: '20px' }}>
            <p style={{ fontWeight: '600', marginBottom: '10px' }}>IMPORTANT DISCLAIMERS:</p>
            <ul style={{ marginLeft: '20px' }}>
              <li>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
              <li>WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE</li>
              <li>WE ARE NOT RESPONSIBLE FOR THE ACCURACY OF AI-GENERATED DOCUMENT ANALYSIS</li>
              <li>THE SERVICE DOES NOT PROVIDE LEGAL, TAX, OR FINANCIAL ADVICE</li>
            </ul>
          </div>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>10.1 Professional Advice Disclaimer</h3>
          <p>
            <strong>The Service is a document management tool only.</strong> It does not replace professional legal,
            financial, or tax advice. You should consult qualified professionals for:
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Contract review and legal interpretation</li>
            <li>Tax implications of real estate transactions</li>
            <li>Compliance with local regulations</li>
            <li>Professional liability and risk management</li>
          </ul>
        </section>

        {/* Limitation of Liability */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>11. Limitation of Liability</h2>

          <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px', border: '2px solid #dc2626' }}>
            <p style={{ fontWeight: '600', marginBottom: '15px' }}>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>

            <p><strong>11.1 Exclusion of Damages</strong></p>
            <p>
              WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
              INCLUDING LOST PROFITS, LOST DATA, OR BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO YOUR USE
              OF THE SERVICE.
            </p>

            <p style={{ marginTop: '15px' }}><strong>11.2 Cap on Liability</strong></p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS SHALL NOT EXCEED
              THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>

            <p style={{ marginTop: '15px' }}><strong>11.3 Real Estate Transaction Limitation</strong></p>
            <p>
              WE ARE NOT LIABLE FOR ANY DAMAGES ARISING FROM YOUR REAL ESTATE TRANSACTIONS, FAILED DEALS,
              REGULATORY VIOLATIONS, OR CLIENT DISPUTES.
            </p>
          </div>
        </section>

        {/* Indemnification */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>12. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless ROI Systems and its officers, directors, employees, and
            agents from any claims, losses, damages, liabilities, and expenses (including attorney's fees) arising from:
          </p>
          <ul style={{ marginLeft: '20px' }}>
            <li>Your use of the Service</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any law or third-party rights</li>
            <li>Your User Content</li>
            <li>Your real estate transactions and client relationships</li>
            <li>Your professional conduct and licensing issues</li>
          </ul>
        </section>

        {/* Dispute Resolution */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>13. Dispute Resolution</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>13.1 Informal Resolution</h3>
          <p>
            Before filing a claim, you agree to contact us at <a href="mailto:legal@roi-systems.com" style={{ color: '#2563eb' }}>legal@roi-systems.com</a> to
            attempt to resolve the dispute informally.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>13.2 Arbitration Agreement</h3>
          <p>
            Any disputes not resolved informally shall be resolved through binding arbitration in accordance with the
            American Arbitration Association's Commercial Arbitration Rules. You agree to:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
            <li>Arbitrate disputes on an individual basis (no class actions)</li>
            <li>Arbitration in [Your State/Location]</li>
            <li>Waive your right to a jury trial</li>
          </ul>

          <p><strong>Opt-Out:</strong> You may opt-out of arbitration by sending written notice within 30 days of account creation.</p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>13.3 Governing Law</h3>
          <p>
            These Terms are governed by the laws of [Your State], without regard to conflict of law principles.
          </p>
        </section>

        {/* General Provisions */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>14. General Provisions</h2>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', color: '#374151' }}>14.1 Entire Agreement</h3>
          <p>
            These Terms, together with the Privacy Policy, constitute the entire agreement between you and ROI Systems
            regarding the Service.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>14.2 Modifications</h3>
          <p>
            We may modify these Terms at any time by posting the updated Terms on this page. Continued use after
            changes constitutes acceptance. Material changes will be notified via email.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>14.3 Severability</h3>
          <p>
            If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will
            continue in full force and effect.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>14.4 No Waiver</h3>
          <p>
            Our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or provision.
          </p>

          <h3 style={{ fontSize: '1.3rem', marginBottom: '10px', marginTop: '20px', color: '#374151' }}>14.5 Assignment</h3>
          <p>
            You may not assign these Terms without our prior written consent. We may assign these Terms at any time
            without notice.
          </p>
        </section>

        {/* Contact Information */}
        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1f2937' }}>15. Contact Information</h2>
          <p>For questions about these Terms, please contact:</p>

          <div style={{ background: '#f9fafb', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
            <p><strong>ROI Systems</strong></p>
            <p>Legal Department</p>
            <p>Email: <a href="mailto:legal@roi-systems.com" style={{ color: '#2563eb' }}>legal@roi-systems.com</a></p>
            <p>Support: <a href="mailto:support@roi-systems.com" style={{ color: '#2563eb' }}>support@roi-systems.com</a></p>
            <p style={{ marginTop: '15px' }}>
              <Link to="/contact" style={{ color: '#2563eb', textDecoration: 'none' }}>
                Contact Form →
              </Link>
            </p>
          </div>
        </section>

        {/* Acknowledgment */}
        <section style={{ marginBottom: '40px', background: '#dbeafe', padding: '30px', borderRadius: '8px', border: '2px solid #2563eb' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#1e40af' }}>
            Acknowledgment
          </h2>
          <p>
            BY CLICKING "I ACCEPT" OR BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ,
            UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS OF SERVICE.
          </p>
          <p style={{ marginTop: '15px' }}>
            IF YOU DO NOT AGREE TO THESE TERMS, YOU MUST NOT ACCESS OR USE THE SERVICE.
          </p>
        </section>
      </div>

      <div className="legal-footer" style={{ marginTop: '60px', paddingTop: '30px', borderTop: '2px solid #e5e7eb', textAlign: 'center' }}>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          © 2025 ROI Systems. All rights reserved.
        </p>
        <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/privacy" style={{ color: '#2563eb', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/contact" style={{ color: '#2563eb', textDecoration: 'none' }}>Contact Us</Link>
          <Link to="/" style={{ color: '#2563eb', textDecoration: 'none' }}>Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
