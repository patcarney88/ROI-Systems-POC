import React from 'react';

const Terms: React.FC = () => {
  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '2rem',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      lineHeight: '1.6',
      color: '#1f2937'
    }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1rem', color: '#111827' }}>
        Terms of Service
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          1. Acceptance of Terms
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Welcome to ROI Systems. By accessing or using our real estate document management and client retention
          platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree
          to these Terms, please do not use our Service.
        </p>
        <p>
          These Terms constitute a legally binding agreement between you (either an individual or entity) and
          ROI Systems ("Company," "we," "us," or "our").
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          2. Description of Service
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          ROI Systems provides a cloud-based platform for real estate professionals, including:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Automated document processing and management</li>
          <li>Client relationship management (CRM) tools</li>
          <li>Marketing automation and campaign management</li>
          <li>Analytics and reporting dashboards</li>
          <li>Collaboration tools for real estate transactions</li>
          <li>AI-powered insights and recommendations</li>
        </ul>
        <p>
          We reserve the right to modify, suspend, or discontinue any part of the Service at any time
          with or without notice.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          3. User Accounts
        </h2>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          3.1 Account Creation
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          To access certain features of the Service, you must create an account. You agree to:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Provide accurate, current, and complete information</li>
          <li>Maintain and promptly update your account information</li>
          <li>Maintain the security of your password and account</li>
          <li>Accept responsibility for all activities that occur under your account</li>
          <li>Notify us immediately of any unauthorized use</li>
        </ul>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          3.2 Account Eligibility
        </h3>
        <p>
          You must be at least 18 years old and have the legal capacity to enter into contracts to use our Service.
          By creating an account, you represent and warrant that you meet these requirements.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          4. Subscription and Payment
        </h2>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          4.1 Subscription Plans
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          We offer various subscription plans with different features and pricing. Details of each plan are
          available on our pricing page. You may upgrade, downgrade, or cancel your subscription at any time.
        </p>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          4.2 Billing
        </h3>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Subscriptions are billed in advance on a monthly or annual basis</li>
          <li>All fees are non-refundable except as required by law</li>
          <li>We reserve the right to change our pricing with 30 days' notice</li>
          <li>You authorize us to charge your payment method for all fees</li>
          <li>Failure to pay may result in suspension or termination of your account</li>
        </ul>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          4.3 Free Trials
        </h3>
        <p>
          We may offer free trial periods. At the end of the trial, your account will be automatically charged
          unless you cancel before the trial ends. You may cancel anytime during the trial without charge.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          5. Acceptable Use Policy
        </h2>
        <p style={{ marginBottom: '1rem' }}>You agree NOT to use the Service to:</p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Violate any laws, regulations, or third-party rights</li>
          <li>Upload or transmit viruses, malware, or malicious code</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Use automated scripts to collect information (scraping)</li>
          <li>Impersonate another person or entity</li>
          <li>Engage in any fraudulent, abusive, or illegal activity</li>
          <li>Upload content that infringes intellectual property rights</li>
          <li>Spam or send unsolicited communications</li>
          <li>Reverse engineer or attempt to extract source code</li>
        </ul>
        <p>
          Violation of this policy may result in immediate termination of your account.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          6. Intellectual Property
        </h2>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          6.1 Our IP Rights
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          The Service and its original content, features, and functionality are owned by ROI Systems and are
          protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </p>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          6.2 Your Content
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          You retain all rights to content you upload to the Service ("Your Content"). By uploading content, you grant us:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>A worldwide, non-exclusive, royalty-free license to use, store, and process Your Content</li>
          <li>Permission to use Your Content to provide and improve the Service</li>
          <li>The right to use anonymized and aggregated data for analytics</li>
        </ul>
        <p>
          You represent and warrant that you have all necessary rights to Your Content and that it does not
          violate any third-party rights or laws.
        </p>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          6.3 License to Use Service
        </h3>
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the
          Service for your internal business purposes, subject to these Terms.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          7. Data Privacy and Security
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Your privacy is important to us. Our collection and use of personal information is governed by our
          Privacy Policy. By using the Service, you consent to our data practices as described in the Privacy Policy.
        </p>
        <p>
          We implement industry-standard security measures but cannot guarantee absolute security. You are
          responsible for maintaining the confidentiality of your account credentials.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          8. Third-Party Services
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Our Service may contain links to third-party websites or integrate with third-party services. We are not
          responsible for the content, privacy policies, or practices of any third-party sites or services.
        </p>
        <p>
          Your use of third-party integrations is subject to their respective terms and conditions.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          9. Disclaimer of Warranties
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS
          OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Implied warranties of merchantability</li>
          <li>Fitness for a particular purpose</li>
          <li>Non-infringement</li>
          <li>Uninterrupted or error-free operation</li>
          <li>Accuracy or reliability of data</li>
        </ul>
        <p>
          We do not warrant that the Service will meet your requirements or that defects will be corrected.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          10. Limitation of Liability
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, ROI SYSTEMS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
          SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Loss of profits, data, use, or goodwill</li>
          <li>Service interruptions</li>
          <li>Cost of substitute services</li>
          <li>Any damages arising from your use of or inability to use the Service</li>
        </ul>
        <p>
          OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          11. Indemnification
        </h2>
        <p>
          You agree to indemnify, defend, and hold harmless ROI Systems, its officers, directors, employees,
          and agents from any claims, liabilities, damages, losses, and expenses (including reasonable attorney
          fees) arising out of or related to your use of the Service, violation of these Terms, or infringement
          of any third-party rights.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          12. Termination
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          We may terminate or suspend your account and access to the Service immediately, without prior notice,
          for any reason, including but not limited to:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Breach of these Terms</li>
          <li>Non-payment of fees</li>
          <li>Fraudulent or illegal activity</li>
          <li>Extended period of inactivity</li>
        </ul>
        <p>
          You may terminate your account at any time by contacting us or using the account cancellation feature.
          Upon termination, your right to use the Service will immediately cease, and we may delete your data
          after a reasonable grace period.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          13. Governing Law and Dispute Resolution
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          These Terms shall be governed by and construed in accordance with the laws of the United States,
          without regard to its conflict of law provisions.
        </p>
        <p style={{ marginBottom: '1rem' }}>
          Any disputes arising from these Terms or the Service shall be resolved through:
        </p>
        <ol style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Good faith negotiation between the parties</li>
          <li>Mediation if negotiation fails</li>
          <li>Binding arbitration if mediation fails</li>
        </ol>
        <p>
          You waive the right to participate in class action lawsuits or class-wide arbitration.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          14. Changes to Terms
        </h2>
        <p>
          We reserve the right to modify these Terms at any time. If we make material changes, we will notify
          you by email or through a prominent notice on the Service at least 30 days before the changes take effect.
          Your continued use of the Service after changes become effective constitutes acceptance of the new Terms.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          15. General Provisions
        </h2>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between you and ROI Systems</li>
          <li><strong>Waiver:</strong> Failure to enforce any right does not waive that right</li>
          <li><strong>Severability:</strong> If any provision is invalid, the remaining provisions remain in effect</li>
          <li><strong>Assignment:</strong> You may not assign these Terms without our consent</li>
          <li><strong>No Agency:</strong> No agency, partnership, or joint venture is created by these Terms</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          16. Contact Information
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          If you have any questions about these Terms, please contact us:
        </p>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: '0.5rem 0' }}><strong>ROI Systems</strong></p>
          <p style={{ margin: '0.5rem 0' }}>Email: legal@roi-systems.pro</p>
          <p style={{ margin: '0.5rem 0' }}>Email: support@roi-systems.pro</p>
          <p style={{ margin: '0.5rem 0' }}>Web: https://roi-systems.pro/contact</p>
        </div>
      </section>

      <div style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid #e5e7eb'
      }}>
        <p style={{
          padding: '1rem',
          backgroundColor: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '0.5rem',
          color: '#92400e',
          fontWeight: '500'
        }}>
          By using ROI Systems, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
        </p>
      </div>

      <div style={{
        marginTop: '2rem',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p>© {new Date().getFullYear()} ROI Systems. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Terms;
