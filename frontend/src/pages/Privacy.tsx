import React from 'react';

const Privacy: React.FC = () => {
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
        Privacy Policy
      </h1>
      <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          1. Introduction
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Welcome to ROI Systems ("we," "our," or "us"). We are committed to protecting your personal information
          and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you use our real estate document management and client retention platform.
        </p>
        <p>
          Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy,
          please do not access the site or use our services.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          2. Information We Collect
        </h2>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          Personal Information
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          We collect personal information that you voluntarily provide to us when you register on the platform,
          express an interest in obtaining information about us or our products and services, or otherwise contact us.
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Name and contact data (email address, phone number, mailing address)</li>
          <li>Account credentials (username, password)</li>
          <li>Business information (company name, title, role)</li>
          <li>Payment information (processed securely through third-party providers)</li>
          <li>Communication preferences</li>
        </ul>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          Document and Client Data
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          When you use our platform, we collect and process:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Real estate documents you upload or create</li>
          <li>Client information you enter into the system</li>
          <li>Transaction data related to your real estate activities</li>
          <li>Communication logs and notes</li>
        </ul>

        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem', color: '#374151' }}>
          Automatically Collected Information
        </h3>
        <p style={{ marginBottom: '1rem' }}>
          We automatically collect certain information when you visit, use, or navigate the platform:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Log and usage data (IP address, browser type, device information)</li>
          <li>Performance metrics and analytics</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          3. How We Use Your Information
        </h2>
        <p style={{ marginBottom: '1rem' }}>We use the information we collect or receive to:</p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li>Provide, operate, and maintain our platform and services</li>
          <li>Process your transactions and manage your account</li>
          <li>Send you technical notices, updates, security alerts, and support messages</li>
          <li>Respond to your comments, questions, and customer service requests</li>
          <li>Improve our platform through AI/ML analysis and optimization</li>
          <li>Monitor and analyze usage patterns and trends</li>
          <li>Prevent fraudulent transactions and protect against malicious activity</li>
          <li>Comply with legal obligations and enforce our terms</li>
        </ul>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          4. Data Security
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          We implement industry-standard security measures to protect your personal information:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
          <li><strong>Access Controls:</strong> Role-based access control (RBAC) limits data access</li>
          <li><strong>Authentication:</strong> Multi-factor authentication (MFA) available for all accounts</li>
          <li><strong>Regular Audits:</strong> Security assessments and penetration testing</li>
          <li><strong>Compliance:</strong> SOC 2 Type II compliant infrastructure</li>
        </ul>
        <p>
          However, no method of transmission over the Internet or electronic storage is 100% secure.
          While we strive to use commercially acceptable means to protect your personal information,
          we cannot guarantee its absolute security.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          5. Data Sharing and Disclosure
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          We may share your information in the following situations:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (cloud hosting, analytics, payment processing)</li>
          <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
          <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
        </ul>
        <p>
          We do NOT sell your personal information to third parties.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          6. Your Privacy Rights
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          Depending on your location, you may have the following rights:
        </p>
        <ul style={{ marginLeft: '1.5rem', marginBottom: '1rem' }}>
          <li><strong>Access:</strong> Request a copy of your personal information</li>
          <li><strong>Correction:</strong> Request correction of inaccurate data</li>
          <li><strong>Deletion:</strong> Request deletion of your personal information</li>
          <li><strong>Portability:</strong> Request transfer of your data to another service</li>
          <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
          <li><strong>Restrict Processing:</strong> Request limitation on how we use your data</li>
        </ul>
        <p>
          To exercise these rights, please contact us at privacy@roi-systems.pro
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          7. Data Retention
        </h2>
        <p>
          We retain your personal information only for as long as necessary to fulfill the purposes outlined
          in this privacy policy, unless a longer retention period is required or permitted by law. When we
          no longer need your information, we will securely delete or anonymize it.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          8. Cookies and Tracking
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          We use cookies and similar tracking technologies to track activity on our platform and store certain
          information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
        </p>
        <p>
          For more information about our cookie practices, please see our Cookie Policy.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          9. Children's Privacy
        </h2>
        <p>
          Our platform is not intended for individuals under the age of 18. We do not knowingly collect
          personal information from children. If you become aware that a child has provided us with personal
          information, please contact us immediately.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          10. International Data Transfers
        </h2>
        <p>
          Your information may be transferred to and maintained on servers located outside of your state,
          province, country, or other governmental jurisdiction where data protection laws may differ.
          We ensure appropriate safeguards are in place for such transfers.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          11. Updates to This Policy
        </h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any changes by posting
          the new privacy policy on this page and updating the "Last updated" date. You are advised to review
          this privacy policy periodically for any changes.
        </p>
      </section>

      <section style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '600', marginBottom: '1rem', color: '#111827' }}>
          12. Contact Us
        </h2>
        <p style={{ marginBottom: '1rem' }}>
          If you have questions or concerns about this privacy policy, please contact us at:
        </p>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '1.5rem',
          borderRadius: '0.5rem',
          border: '1px solid #e5e7eb'
        }}>
          <p style={{ margin: '0.5rem 0' }}><strong>ROI Systems</strong></p>
          <p style={{ margin: '0.5rem 0' }}>Email: privacy@roi-systems.pro</p>
          <p style={{ margin: '0.5rem 0' }}>Email: support@roi-systems.pro</p>
          <p style={{ margin: '0.5rem 0' }}>Web: https://roi-systems.pro/contact</p>
        </div>
      </section>

      <div style={{
        marginTop: '3rem',
        paddingTop: '2rem',
        borderTop: '1px solid #e5e7eb',
        textAlign: 'center',
        color: '#6b7280'
      }}>
        <p>© {new Date().getFullYear()} ROI Systems. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Privacy;
