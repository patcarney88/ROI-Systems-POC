/**
 * CLOSING_ANNIVERSARY Email Template
 *
 * Purpose: Celebrate client's home ownership anniversary
 * Target Open Rate: 50-60% (personal milestone)
 *
 * Merge Tags Used:
 * - {{subscriber.firstName}}
 * - {{client.propertyAddress}}
 * - {{client.closingDate}}
 * - {{client.yearsOwned}}
 * - {{property.currentValue}}
 * - {{property.valueChangePercent}}
 * - {{property.valueDirection}}
 * - {{agent.name}}
 * - {{agent.phone}}
 * - {{agent.photo}}
 * - {{company.name}}
 * - {{company.logo}}
 *
 * Usage:
 * import { render } from '@react-email/render';
 * import { ClosingAnniversaryEmail } from './templates/emails/closing-anniversary';
 *
 * const html = render(<ClosingAnniversaryEmail {...data} />);
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

interface ClosingAnniversaryEmailProps {
  subscriberFirstName?: string;
  propertyAddress?: string;
  closingDate?: string;
  yearsOwned?: string;
  currentValue?: string;
  valueChangePercent?: string;
  valueDirection?: string;
  agentName?: string;
  agentPhone?: string;
  agentPhoto?: string;
  companyName?: string;
  companyLogo?: string;
}

export const ClosingAnniversaryEmail = ({
  subscriberFirstName = '{{subscriber.firstName}}',
  propertyAddress = '{{client.propertyAddress}}',
  closingDate = '{{client.closingDate}}',
  yearsOwned = '{{client.yearsOwned}}',
  currentValue = '{{property.currentValue}}',
  valueChangePercent = '{{property.valueChangePercent}}',
  valueDirection = '{{property.valueDirection}}',
  agentName = '{{agent.name}}',
  agentPhone = '{{agent.phone}}',
  agentPhoto = '{{agent.photo}}',
  companyName = '{{company.name}}',
  companyLogo = '{{company.logo}}',
}: ClosingAnniversaryEmailProps) => {
  const previewText = `Happy ${yearsOwned} Year Home Anniversary, ${subscriberFirstName}!`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with Co-Branding */}
          <Section style={header}>
            <Row>
              <Column style={headerColumn}>
                <Img
                  src={companyLogo}
                  width="120"
                  height="40"
                  alt={companyName}
                  style={logo}
                />
              </Column>
              <Column style={headerColumnRight}>
                <Img
                  src={agentPhoto}
                  width="50"
                  height="50"
                  alt={agentName}
                  style={agentImage}
                />
              </Column>
            </Row>
          </Section>

          {/* Hero Section */}
          <Section style={heroSection}>
            <Heading style={h1}>
              🎉 Happy {yearsOwned} Year Home Anniversary!
            </Heading>
            <Text style={heroText}>
              Dear {subscriberFirstName},
            </Text>
            <Text style={heroText}>
              Can you believe it's been {yearsOwned} {yearsOwned === '1' ? 'year' : 'years'} since you closed on your home at{' '}
              <strong>{propertyAddress}</strong>? Time flies when you're building equity!
            </Text>
          </Section>

          {/* Property Value Section */}
          <Section style={valueSection}>
            <Heading style={h2}>Your Home's Growth Story</Heading>
            <Text style={paragraph}>
              Since your closing on <strong>{closingDate}</strong>, your home's value has{' '}
              <strong style={valueDirection === 'increased' ? valuePositive : valueNeutral}>
                {valueDirection} by {valueChangePercent}
              </strong>
            </Text>
            <Section style={valueBox}>
              <Text style={valueLabel}>Estimated Current Value</Text>
              <Heading style={valueAmount}>{currentValue}</Heading>
              <Text style={valueNote}>
                *Based on current market data. Contact us for a detailed valuation.
              </Text>
            </Section>
          </Section>

          {/* Celebration Section */}
          <Section style={celebrationSection}>
            <Heading style={h2}>Celebrating Your Investment</Heading>
            <Text style={paragraph}>
              Homeownership is one of the best investments you can make. Over the past {yearsOwned}{' '}
              {yearsOwned === '1' ? 'year' : 'years'}, you've been:
            </Text>
            <ul style={bulletList}>
              <li style={bulletItem}>Building equity with every mortgage payment</li>
              <li style={bulletItem}>Creating lasting memories in your space</li>
              <li style={bulletItem}>Establishing roots in your community</li>
              <li style={bulletItem}>Benefiting from potential tax deductions</li>
            </ul>
          </Section>

          {/* CTA Section */}
          <Section style={ctaSection}>
            <Heading style={h2}>Here to Help You Thrive</Heading>
            <Text style={paragraph}>
              Whether you're thinking about your next move, curious about refinancing options, or
              just want to chat about your home's value, I'm here to help.
            </Text>
            <Section style={buttonContainer}>
              <Link href={`tel:${agentPhone}`} style={button}>
                Call Me Today
              </Link>
            </Section>
            <Text style={ctaSubtext}>
              Or simply reply to this email - I'd love to hear from you!
            </Text>
          </Section>

          {/* Agent Contact Card */}
          <Section style={agentCard}>
            <Row>
              <Column style={agentCardImage}>
                <Img
                  src={agentPhoto}
                  width="80"
                  height="80"
                  alt={agentName}
                  style={agentCardPhoto}
                />
              </Column>
              <Column style={agentCardInfo}>
                <Text style={agentCardName}>{agentName}</Text>
                <Text style={agentCardDetails}>{companyName}</Text>
                <Text style={agentCardDetails}>
                  <Link href={`tel:${agentPhone}`} style={linkStyle}>
                    {agentPhone}
                  </Link>
                </Text>
              </Column>
            </Row>
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this email because you worked with us on your real estate closing.
            </Text>
            <Text style={footerLinks}>
              <Link href="{{unsubscribeUrl}}" style={footerLink}>
                Unsubscribe
              </Link>
              {' | '}
              <Link href="{{preferencesUrl}}" style={footerLink}>
                Manage Preferences
              </Link>
            </Text>
            <Text style={footerCopyright}>
              © {new Date().getFullYear()} {companyName}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#ffffff',
  padding: '20px 30px',
  borderBottom: '3px solid #0066cc',
};

const headerColumn = {
  width: '70%',
  verticalAlign: 'middle',
};

const headerColumnRight = {
  width: '30%',
  textAlign: 'right' as const,
  verticalAlign: 'middle',
};

const logo = {
  maxWidth: '120px',
  height: 'auto',
};

const agentImage = {
  borderRadius: '50%',
  border: '2px solid #0066cc',
};

const heroSection = {
  padding: '40px 30px',
  backgroundColor: '#0066cc',
  color: '#ffffff',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '32px',
  fontWeight: '700',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const heroText = {
  color: '#ffffff',
  fontSize: '18px',
  lineHeight: '1.6',
  margin: '0 0 15px',
};

const valueSection = {
  padding: '40px 30px',
  backgroundColor: '#f6f9fc',
};

const h2 = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.3',
  margin: '0 0 20px',
};

const paragraph = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.6',
  margin: '0 0 20px',
};

const valueBox = {
  backgroundColor: '#ffffff',
  border: '2px solid #0066cc',
  borderRadius: '8px',
  padding: '30px',
  textAlign: 'center' as const,
  marginTop: '20px',
};

const valueLabel = {
  color: '#666666',
  fontSize: '14px',
  fontWeight: '500',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 10px',
};

const valueAmount = {
  color: '#0066cc',
  fontSize: '36px',
  fontWeight: '700',
  margin: '0 0 10px',
};

const valueNote = {
  color: '#999999',
  fontSize: '12px',
  fontStyle: 'italic' as const,
  margin: '0',
};

const valuePositive = {
  color: '#28a745',
};

const valueNeutral = {
  color: '#0066cc',
};

const celebrationSection = {
  padding: '40px 30px',
};

const bulletList = {
  margin: '20px 0',
  paddingLeft: '20px',
};

const bulletItem = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '1.8',
  marginBottom: '10px',
};

const ctaSection = {
  padding: '40px 30px',
  backgroundColor: '#f6f9fc',
  textAlign: 'center' as const,
};

const buttonContainer = {
  margin: '30px 0',
};

const button = {
  backgroundColor: '#0066cc',
  borderRadius: '5px',
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '15px 40px',
};

const ctaSubtext = {
  color: '#666666',
  fontSize: '14px',
  margin: '20px 0 0',
};

const agentCard = {
  padding: '30px',
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  margin: '20px 30px',
};

const agentCardImage = {
  width: '100px',
  verticalAlign: 'middle',
};

const agentCardPhoto = {
  borderRadius: '50%',
  border: '3px solid #0066cc',
};

const agentCardInfo = {
  verticalAlign: 'middle',
  paddingLeft: '20px',
};

const agentCardName = {
  color: '#1a1a1a',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 5px',
};

const agentCardDetails = {
  color: '#666666',
  fontSize: '14px',
  margin: '0 0 3px',
};

const linkStyle = {
  color: '#0066cc',
  textDecoration: 'none',
};

const hr = {
  borderColor: '#e0e0e0',
  margin: '30px 0',
};

const footer = {
  padding: '30px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '1.6',
  margin: '0 0 10px',
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

export default ClosingAnniversaryEmail;
