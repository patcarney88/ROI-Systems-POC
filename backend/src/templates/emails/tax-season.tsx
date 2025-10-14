/**
 * TAX_SEASON Email Template
 *
 * Purpose: Tax season reminders with property tax information
 * Target Open Rate: 50-60% (timely financial information)
 *
 * Merge Tags Used:
 * - {{subscriber.firstName}}
 * - {{client.propertyAddress}}
 * - {{client.purchasePrice}}
 * - {{property.currentValue}}
 * - {{agent.name}}
 * - {{agent.phone}}
 * - {{agent.email}}
 * - {{company.name}}
 * - {{company.logo}}
 * - {{year}}
 *
 * Usage:
 * import { render } from '@react-email/render';
 * import { TaxSeasonEmail } from './templates/emails/tax-season';
 *
 * const html = render(<TaxSeasonEmail {...data} />);
 */

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from '@react-email/components';
import * as React from 'react';

interface TaxSeasonEmailProps {
  subscriberFirstName?: string;
  propertyAddress?: string;
  purchasePrice?: string;
  currentValue?: string;
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  companyName?: string;
  companyLogo?: string;
  year?: string;
}

export const TaxSeasonEmail = ({
  subscriberFirstName = '{{subscriber.firstName}}',
  propertyAddress = '{{client.propertyAddress}}',
  purchasePrice = '{{client.purchasePrice}}',
  currentValue = '{{property.currentValue}}',
  agentName = '{{agent.name}}',
  agentPhone = '{{agent.phone}}',
  agentEmail = '{{agent.email}}',
  companyName = '{{company.name}}',
  companyLogo = '{{company.logo}}',
  year = '{{year}}',
}: TaxSeasonEmailProps) => {
  const previewText = `Important: ${year} Tax Season Information for Your Home`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img src={companyLogo} width="140" height="45" alt={companyName} style={logo} />
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Text style={heroIcon}>📋</Text>
            <Heading style={h1}>Tax Season Is Here</Heading>
            <Text style={heroSubtext}>Important Information for Homeowners</Text>
          </Section>

          {/* Introduction */}
          <Section style={introSection}>
            <Heading style={h2}>Hi {subscriberFirstName},</Heading>
            <Text style={paragraph}>
              As tax season approaches, I wanted to reach out with some important information about
              your property at <strong>{propertyAddress}</strong>. As a homeowner, you may be
              eligible for several valuable tax deductions.
            </Text>
          </Section>

          {/* Important Alert Box */}
          <Section style={alertBox}>
            <Row>
              <Column style={alertIcon}>⚠️</Column>
              <Column style={alertContent}>
                <Text style={alertText}>
                  <strong>Reminder:</strong> Tax filing deadline is typically April 15th. Don't
                  miss out on valuable homeowner deductions!
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Deductions Section */}
          <Section style={deductionsSection}>
            <Heading style={h2}>Potential Homeowner Tax Deductions</Heading>
            <Text style={paragraph}>
              As a homeowner, you may qualify for these common deductions:
            </Text>

            <Section style={deductionCard}>
              <Text style={deductionIcon}>🏠</Text>
              <Heading style={deductionTitle}>Mortgage Interest</Heading>
              <Text style={deductionDescription}>
                Interest paid on your mortgage (up to $750,000 of debt) is typically deductible.
                This is often the largest deduction for homeowners.
              </Text>
            </Section>

            <Section style={deductionCard}>
              <Text style={deductionIcon}>🏛️</Text>
              <Heading style={deductionTitle}>Property Taxes</Heading>
              <Text style={deductionDescription}>
                State and local property taxes may be deductible (up to $10,000 combined with state
                income taxes).
              </Text>
            </Section>

            <Section style={deductionCard}>
              <Text style={deductionIcon}>🔨</Text>
              <Heading style={deductionTitle}>Home Office Deduction</Heading>
              <Text style={deductionDescription}>
                If you use part of your home exclusively for business, you may qualify for home
                office deductions.
              </Text>
            </Section>

            <Section style={deductionCard}>
              <Text style={deductionIcon}>⚡</Text>
              <Heading style={deductionTitle}>Energy-Efficient Improvements</Heading>
              <Text style={deductionDescription}>
                Qualifying energy-efficient home improvements may be eligible for tax credits (solar
                panels, energy-efficient windows, etc.).
              </Text>
            </Section>

            <Section style={deductionCard}>
              <Text style={deductionIcon}>💰</Text>
              <Heading style={deductionTitle}>PMI Premiums</Heading>
              <Text style={deductionDescription}>
                If you pay private mortgage insurance (PMI), you may be able to deduct these
                premiums depending on your income level.
              </Text>
            </Section>

            <Section style={deductionCard}>
              <Text style={deductionIcon}>💵</Text>
              <Heading style={deductionTitle}>Points Paid at Closing</Heading>
              <Text style={deductionDescription}>
                Discount points or origination fees paid when you purchased or refinanced may be
                deductible.
              </Text>
            </Section>
          </Section>

          {/* Property Information */}
          <Section style={propertyInfoSection}>
            <Heading style={h2}>Your Property Information</Heading>
            <Section style={infoCard}>
              <Row style={infoRow}>
                <Column style={infoLabelColumn}>
                  <Text style={infoLabel}>Property Address:</Text>
                </Column>
                <Column style={infoValueColumn}>
                  <Text style={infoValue}>{propertyAddress}</Text>
                </Column>
              </Row>
              <Hr style={infoHr} />
              <Row style={infoRow}>
                <Column style={infoLabelColumn}>
                  <Text style={infoLabel}>Purchase Price:</Text>
                </Column>
                <Column style={infoValueColumn}>
                  <Text style={infoValue}>{purchasePrice}</Text>
                </Column>
              </Row>
              <Hr style={infoHr} />
              <Row style={infoRow}>
                <Column style={infoLabelColumn}>
                  <Text style={infoLabel}>Current Estimated Value:</Text>
                </Column>
                <Column style={infoValueColumn}>
                  <Text style={infoValue}>{currentValue}</Text>
                </Column>
              </Row>
            </Section>
            <Text style={disclaimerSmall}>
              Note: These values are for reference only. Consult your closing documents and tax
              records for official figures.
            </Text>
          </Section>

          {/* Documents Checklist */}
          <Section style={checklistSection}>
            <Heading style={h2}>Documents You May Need</Heading>
            <Text style={paragraph}>Gather these documents for your tax preparer:</Text>
            <ul style={checkList}>
              <li style={checkItem}>✓ Mortgage interest statement (Form 1098)</li>
              <li style={checkItem}>✓ Property tax statements</li>
              <li style={checkItem}>✓ Closing disclosure from your home purchase</li>
              <li style={checkItem}>✓ Home improvement receipts (for energy credits)</li>
              <li style={checkItem}>✓ Home office records (if applicable)</li>
              <li style={checkItem}>✓ PMI payment records (if applicable)</li>
            </ul>
          </Section>

          {/* Important Disclaimer */}
          <Section style={disclaimerSection}>
            <Heading style={disclaimerTitle}>⚖️ Important Disclaimer</Heading>
            <Text style={disclaimerText}>
              This information is provided for general educational purposes only and should not be
              considered tax advice. Tax laws are complex and change frequently. Please consult with
              a qualified tax professional or CPA for advice specific to your situation.
            </Text>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Heading style={h2}>Need Your Closing Documents?</Heading>
            <Text style={paragraph}>
              If you need copies of your closing documents or have questions about your property
              records, I'm here to help.
            </Text>
            <Section style={buttonGroup}>
              <Link href={`mailto:${agentEmail}?subject=Tax Season Documents Request`} style={button}>
                Request Documents
              </Link>
            </Section>
            <Text style={ctaSubtext}>
              Or call me at{' '}
              <Link href={`tel:${agentPhone}`} style={phoneLink}>
                {agentPhone}
              </Link>
            </Text>
          </Section>

          {/* Resources */}
          <Section style={resourcesSection}>
            <Heading style={h3}>Helpful Resources</Heading>
            <Text style={resourceLink}>
              • <Link href="https://www.irs.gov/forms-pubs/about-publication-530" style={linkStyle}>
                IRS Publication 530: Tax Information for Homeowners
              </Link>
            </Text>
            <Text style={resourceLink}>
              • <Link href="https://www.irs.gov/credits-deductions/individuals/home-energy-credits" style={linkStyle}>
                IRS Energy Credits Information
              </Link>
            </Text>
            <Text style={resourceLink}>
              • <Link href="https://www.irs.gov/businesses/small-businesses-self-employed/home-office-deduction" style={linkStyle}>
                IRS Home Office Deduction Guide
              </Link>
            </Text>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>{agentName}</strong>
              <br />
              {companyName}
              <br />
              <Link href={`tel:${agentPhone}`} style={footerLink}>
                {agentPhone}
              </Link>
              {' | '}
              <Link href={`mailto:${agentEmail}`} style={footerLink}>
                {agentEmail}
              </Link>
            </Text>
            <Hr style={footerHr} />
            <Text style={footerLinks}>
              <Link href="{{unsubscribeUrl}}" style={footerLink}>
                Unsubscribe
              </Link>
              {' | '}
              <Link href="{{preferencesUrl}}" style={footerLink}>
                Email Preferences
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © {year} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f4f4f4',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#ffffff',
  padding: '30px',
  textAlign: 'center' as const,
  borderBottom: '1px solid #e0e0e0',
};

const logo = {
  maxWidth: '140px',
  height: 'auto',
};

const heroSection = {
  backgroundColor: '#0066cc',
  padding: '50px 30px',
  textAlign: 'center' as const,
};

const heroIcon = {
  fontSize: '48px',
  margin: '0 0 20px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 10px',
};

const heroSubtext = {
  color: 'rgba(255, 255, 255, 0.9)',
  fontSize: '18px',
  margin: '0',
};

const introSection = {
  padding: '30px',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 15px',
};

const h3 = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 15px',
};

const paragraph = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const alertBox = {
  backgroundColor: '#fff3cd',
  border: '2px solid #ffc107',
  borderRadius: '8px',
  padding: '20px',
  margin: '0 30px 30px',
};

const alertIcon = {
  width: '50px',
  fontSize: '24px',
  textAlign: 'center' as const,
};

const alertContent = {
  paddingLeft: '10px',
};

const alertText = {
  color: '#856404',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const deductionsSection = {
  padding: '30px',
  backgroundColor: '#f8f9fa',
};

const deductionCard = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '15px',
};

const deductionIcon = {
  fontSize: '32px',
  margin: '0 0 10px',
};

const deductionTitle = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 10px',
};

const deductionDescription = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const propertyInfoSection = {
  padding: '30px',
};

const infoCard = {
  backgroundColor: '#f8f9fa',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '15px',
};

const infoRow = {
  marginBottom: '0',
};

const infoLabelColumn = {
  width: '45%',
  paddingRight: '10px',
};

const infoValueColumn = {
  width: '55%',
};

const infoLabel = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
};

const infoValue = {
  color: '#1a1a1a',
  fontSize: '14px',
  margin: '0',
};

const infoHr = {
  borderColor: '#e0e0e0',
  margin: '15px 0',
};

const disclaimerSmall = {
  color: '#999999',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '0',
};

const checklistSection = {
  padding: '30px',
  backgroundColor: '#f8f9fa',
};

const checkList = {
  margin: '20px 0',
  paddingLeft: '20px',
  listStyle: 'none',
};

const checkItem = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '1.8',
  marginBottom: '10px',
};

const disclaimerSection = {
  padding: '25px 30px',
  backgroundColor: '#ffe5e5',
  borderLeft: '4px solid #dc3545',
};

const disclaimerTitle = {
  color: '#721c24',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 10px',
};

const disclaimerText = {
  color: '#721c24',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};

const ctaSection = {
  padding: '40px 30px',
  textAlign: 'center' as const,
};

const buttonGroup = {
  margin: '25px 0',
};

const button = {
  backgroundColor: '#0066cc',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

const ctaSubtext = {
  color: '#666666',
  fontSize: '14px',
  margin: '15px 0 0',
};

const phoneLink = {
  color: '#0066cc',
  textDecoration: 'none',
  fontWeight: '600',
};

const resourcesSection = {
  padding: '30px',
  backgroundColor: '#f8f9fa',
};

const resourceLink = {
  color: '#4a4a4a',
  fontSize: '14px',
  lineHeight: '2',
  margin: '0 0 8px',
};

const linkStyle = {
  color: '#0066cc',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e0e0e0',
  margin: '0',
};

const footer = {
  padding: '30px',
  textAlign: 'center' as const,
  backgroundColor: '#f8f9fa',
};

const footerText = {
  color: '#666666',
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0 0 15px',
};

const footerHr = {
  borderColor: '#e0e0e0',
  margin: '15px 0',
};

const footerLinks = {
  color: '#666666',
  fontSize: '12px',
  margin: '0 0 10px',
};

const footerLink = {
  color: '#0066cc',
  textDecoration: 'underline',
};

const footerCopyright = {
  color: '#999999',
  fontSize: '11px',
  margin: '0',
};

export default TaxSeasonEmail;
